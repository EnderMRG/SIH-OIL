"""
NWIS eRTMAC — Model 4: Real-Time Telemetry Anomaly Detector
============================================================
Architecture: Isolation Forest Residual Detector
State-Gated: Only active during DRILLING_ROTARY or DRILLING_SLIDE

Residual input features:
  1. ΔFlow   = Flow Out % (trended) − Flow In %
  2. ΔPit    = d/dt(Pit Volume Total) m³/min
  3. ΔTorque = Active Torque − Offset Baseline Torque Roadmap
  4. ΔSPP    = Active SPP − Expected Hydraulics SPP

Training:
  - Isolation Forest is unsupervised (no labels required)
  - Trained on NORMAL (drilling) segments only
  - Anomaly threshold tuned on a labelled holdout to maximize F1

Anti-Overfitting:
  - Contamination parameter set conservatively (0.01–0.02)
  - Trained only on GroupKFold ROTARY+SLIDE filtered samples
  - Threshold calibration done on a separate held-out well set

Target: Recall ≥ 0.90 on kick/loss events while keeping false alarm
        rate ≤ 5% of normal drilling samples.
"""

import numpy as np
import pandas as pd
import json
import joblib
from pathlib import Path
from typing import Optional
import warnings
warnings.filterwarnings("ignore")

from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import f1_score, recall_score, precision_score, classification_report
from sklearn.model_selection import GroupKFold

MODEL_DIR = Path(__file__).parent.parent / "models"
REPORT_DIR = Path(__file__).parent.parent / "reports"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# Rig-State Classifier (Pre-ML Gating Engine)
# ─────────────────────────────────────────────────────────────────────────────

DRILLING_STATES = {"DRILLING_ROTARY", "DRILLING_SLIDE"}


def classify_rig_state(
    bit_depth: float,
    hole_depth: float,
    hookload: float,
    block_height_delta: float,
    rpm: float,
    flow_in: float,
    rop: float = 0.0,
) -> str:
    """
    Deterministic rig-state classifier (rule-based state machine).
    Matches the specification exactly.
    """
    on_bottom    = (hole_depth - bit_depth) <= 0.2
    pumps_running = flow_in > 200
    rotating      = rpm > 10

    if on_bottom and pumps_running and rotating:
        return "DRILLING_ROTARY"
    elif on_bottom and pumps_running and not rotating:
        return "DRILLING_SLIDE"
    elif not on_bottom and pumps_running and not rotating and rop == 0:
        return "CIRCULATING"
    elif not on_bottom and not pumps_running and abs(block_height_delta) > 0.1:
        return "TRIPPING"
    elif not on_bottom and flow_in <= 50 and rop == 0:
        return "CONNECTION"
    elif flow_in <= 10:
        return "PUMPS_OFF"
    else:
        return "IDLE_OTHER"


def assign_rig_states(telemetry_df: pd.DataFrame) -> pd.DataFrame:
    """Vectorised rig-state assignment across a telemetry DataFrame."""
    df = telemetry_df.copy()

    # Simulate hole_depth (bit_depth progresses monotonically per well)
    df["hole_depth_md"] = df.groupby("wellbore_id")["depth_md"].transform("cummax")

    # Block height delta (proxy: ROP > 0 ↔ travelling down, else 0)
    df["block_height_delta"] = np.where(df.get("rop_mhr", 0) > 2, 0.5, 0.0)

    states = []
    for _, row in df.iterrows():
        states.append(classify_rig_state(
            bit_depth=row["depth_md"],
            hole_depth=row["hole_depth_md"],
            hookload=row.get("hookload_tonnes", 100.0),
            block_height_delta=row["block_height_delta"],
            rpm=row.get("rpm", 0),
            flow_in=row.get("flow_in_lpm", 0),
            rop=row.get("rop_mhr", 0),
        ))
    df["rig_state"] = states
    return df


# ─────────────────────────────────────────────────────────────────────────────
# Residual feature engineering
# ─────────────────────────────────────────────────────────────────────────────

def engineer_residuals(telemetry_df: pd.DataFrame, events_df: Optional[pd.DataFrame] = None) -> pd.DataFrame:
    """
    Compute the 4 residual features for Model 4.
    Also builds a DRILLING-ONLY mask and event labels.
    """
    df = telemetry_df.copy().sort_values(["wellbore_id", "depth_md"])

    # ── ΔFlow — expected 100%, deviations indicate gains/losses ────────────
    # Trending flow out via rolling mean of past 20 samples
    df["flow_out_trended"] = df.groupby("wellbore_id")["flow_out_pct"].transform(
        lambda x: x.rolling(20, min_periods=1).mean()
    )
    # Flow_in normalised to percentage (2500 LPM ≈ 100%)
    max_flow_in = df["flow_in_lpm"].quantile(0.95) or 2500.0
    df["flow_in_pct"] = df["flow_in_lpm"] / max_flow_in * 100.0
    df["delta_flow"] = df["flow_out_trended"] - df["flow_in_pct"]

    # ── ΔPit — rate of change of pit volume (m³/sample) ────────────────────
    df["delta_pit"] = df.groupby("wellbore_id")["pit_volume_m3"].diff().fillna(0)

    # ── ΔTorque — deviation from per-well rolling baseline ─────────────────
    df["torque_baseline"] = df.groupby("wellbore_id")["torque_knm"].transform(
        lambda x: x.rolling(50, min_periods=1).median()
    )
    df["delta_torque"] = df["torque_knm"] - df["torque_baseline"]

    # ── ΔSPP — deviation from expected hydraulics (rolling baseline) ────────
    df["spp_baseline"] = df.groupby("wellbore_id")["spp_psi"].transform(
        lambda x: x.rolling(50, min_periods=1).median()
    )
    df["delta_spp"] = df["spp_psi"] - df["spp_baseline"]

    # ── Rig state ───────────────────────────────────────────────────────────
    df = assign_rig_states(df)
    df["is_drilling"] = df["rig_state"].isin(DRILLING_STATES).astype(int)

    # ── Event labels for threshold calibration ──────────────────────────────
    df["is_anomaly"] = 0
    if events_df is not None and len(events_df) > 0:
        # Anomaly = kick or loss event within ±50m
        kick_loss = events_df[
            events_df["hazard_class"].isin(["Gas_Kick", "Lost_Circulation", "Stuck_Pipe"])
        ]
        event_by_well = {wid: grp for wid, grp in kick_loss.groupby("wellbore_id")}

        for wid, well_df in df.groupby("wellbore_id"):
            if wid not in event_by_well:
                continue
            evt_depths = event_by_well[wid]["depth_md"].values
            depths = well_df["depth_md"].values
            in_window = np.any(
                np.abs(evt_depths[None, :] - depths[:, None]) <= 50, axis=1
            )
            df.loc[well_df.index, "is_anomaly"] = in_window.astype(int)

    anomaly_rate = df["is_anomaly"].mean()
    drilling_rate = df["is_drilling"].mean()
    print(f"[Model4] Drilling state rate: {drilling_rate*100:.1f}% | "
          f"Anomaly rate: {anomaly_rate*100:.2f}%")

    return df


RESIDUAL_FEATURES = ["delta_flow", "delta_pit", "delta_torque", "delta_spp"]


# ─────────────────────────────────────────────────────────────────────────────
# Model 4: Isolation Forest Anomaly Detector
# ─────────────────────────────────────────────────────────────────────────────

class TelemetryAnomalyDetector:
    """
    State-gated real-time anomaly detector.
    - Trains only on NORMAL drilling samples (no anomaly labels needed).
    - Calibrates threshold on a labelled holdout set.
    - At inference, only fires when rig_state ∈ {DRILLING_ROTARY, DRILLING_SLIDE}.
    """

    def __init__(self, contamination: float = 0.015, n_estimators: int = 300):
        self.contamination = contamination
        self.n_estimators  = n_estimators
        self.scaler        = StandardScaler()
        self.iforest       = IsolationForest(
            n_estimators=n_estimators,
            contamination=contamination,
            random_state=42,
            n_jobs=1,
        )
        self.threshold_score: float = 0.0   # calibrated anomaly score threshold
        self._is_fitted = False

    def _get_features(self, df: pd.DataFrame) -> np.ndarray:
        X = df[RESIDUAL_FEATURES].replace([np.inf, -np.inf], np.nan).fillna(0).values
        return X

    def fit(self, df: pd.DataFrame):
        """
        Train Isolation Forest on NORMAL (drilling) samples only.
        df must have columns: delta_flow, delta_pit, delta_torque, delta_spp,
                               is_drilling, is_anomaly
        """
        normal_mask = (df["is_drilling"] == 1) & (df["is_anomaly"] == 0)
        X_normal = self._get_features(df[normal_mask])
        print(f"[Model4] Training IF on {len(X_normal):,} normal drilling samples …")

        X_scaled = self.scaler.fit_transform(X_normal)
        self.iforest.fit(X_scaled)
        self._is_fitted = True

    def calibrate_threshold(self, holdout_df: pd.DataFrame) -> dict:
        """
        Calibrate anomaly score threshold on a labelled holdout set.
        Maximise F1 on anomaly labels.
        Returns calibration metrics dict.
        """
        drill_mask = holdout_df["is_drilling"] == 1
        X = self._get_features(holdout_df[drill_mask])
        y = holdout_df.loc[drill_mask, "is_anomaly"].values

        if y.sum() == 0:
            print("[Model4] No anomalies in holdout — using default threshold")
            self.threshold_score = -0.1
            return {}

        X_scaled = self.scaler.transform(X)
        scores = -self.iforest.score_samples(X_scaled)   # higher = more anomalous

        # Sweep thresholds to find best F1
        thresholds = np.percentile(scores, np.linspace(50, 99, 50))
        best_f1, best_thr = 0.0, float(np.median(scores))
        for thr in thresholds:
            y_pred = (scores >= thr).astype(int)
            f1 = f1_score(y, y_pred, zero_division=0)
            if f1 > best_f1:
                best_f1, best_thr = f1, float(thr)

        self.threshold_score = best_thr
        y_pred_best = (scores >= best_thr).astype(int)
        recall    = recall_score(y, y_pred_best, zero_division=0)
        precision = precision_score(y, y_pred_best, zero_division=0)
        fpr       = (y_pred_best[y == 0].sum() / max((y == 0).sum(), 1))

        metrics = {
            "calibrated_threshold": round(best_thr, 6),
            "f1":                   round(float(best_f1), 4),
            "recall":               round(float(recall), 4),
            "precision":            round(float(precision), 4),
            "false_alarm_rate":     round(float(fpr), 4),
            "target_met":           recall >= 0.90,
        }
        status = "✓ TARGET MET" if metrics["target_met"] else "✗"
        print(f"[Model4] Threshold calibration: F1={best_f1:.4f} | "
              f"Recall={recall:.4f} | FPR={fpr:.4f} | {status}")
        return metrics

    def predict(self, df: pd.DataFrame) -> pd.Series:
        """
        Returns anomaly predictions (0/1) for each row.
        Non-drilling rows are always 0 (gated by rig state).
        """
        result = pd.Series(0, index=df.index)
        drill_mask = df["is_drilling"] == 1
        if drill_mask.sum() == 0:
            return result

        X = self._get_features(df[drill_mask])
        X_scaled = self.scaler.transform(X)
        scores = -self.iforest.score_samples(X_scaled)
        result.loc[df.index[drill_mask]] = (scores >= self.threshold_score).astype(int)
        return result

    def save(self, path: Path = None):
        path = path or (MODEL_DIR / "model4_anomaly_detector.pkl")
        joblib.dump(self, path)
        print(f"[Model4] Detector saved → {path}")

    @classmethod
    def load(cls, path: Path = None) -> "TelemetryAnomalyDetector":
        path = path or (MODEL_DIR / "model4_anomaly_detector.pkl")
        return joblib.load(path)


# ─────────────────────────────────────────────────────────────────────────────
# Cross-validated training (GroupKFold by wellbore_id)
# ─────────────────────────────────────────────────────────────────────────────

def train_model4(telemetry_df: pd.DataFrame, events_df: Optional[pd.DataFrame],
                  meta_df: pd.DataFrame, n_splits: int = 5) -> dict:
    """
    GroupKFold training + threshold calibration for Model 4.
    Returns aggregated metrics across folds.
    """
    # Engineer residuals & rig state
    df = engineer_residuals(telemetry_df, events_df)

    all_wids = meta_df["wellbore_id"].unique()
    rng_split = np.random.default_rng(42)
    shuffled  = rng_split.permutation(all_wids)
    n_train   = int(len(shuffled) * 0.80)
    train_wids = set(shuffled[:n_train])
    val_wids   = set(shuffled[n_train:])

    train_df = df[df["wellbore_id"].isin(train_wids)].copy()
    val_df   = df[df["wellbore_id"].isin(val_wids)].copy()

    print(f"[Model4] Train wells={len(train_wids)}, Val wells={len(val_wids)}")

    # GroupKFold cross-validation metrics
    groups = train_df["wellbore_id"].values
    gkf = GroupKFold(n_splits=n_splits)
    fold_metrics = []

    for fold_idx, (tr_idx, val_idx) in enumerate(gkf.split(train_df, groups=groups)):
        tr = train_df.iloc[tr_idx]
        va = train_df.iloc[val_idx]

        detector = TelemetryAnomalyDetector(contamination=0.015, n_estimators=200)
        detector.fit(tr)
        m = detector.calibrate_threshold(va)
        if m:
            fold_metrics.append(m)
            print(f"  Fold {fold_idx+1}: F1={m['f1']:.4f} | Recall={m['recall']:.4f} | "
                  f"FAR={m['false_alarm_rate']:.4f}")

    # Final model trained on all training wells
    print("[Model4] Training final model on all training wells …")
    final_detector = TelemetryAnomalyDetector(contamination=0.015, n_estimators=300)
    final_detector.fit(train_df)
    holdout_metrics = final_detector.calibrate_threshold(val_df)
    final_detector.save()

    # Aggregate metrics
    metrics = {
        "cv_fold_metrics": fold_metrics,
        "holdout_metrics": holdout_metrics,
        "mean_cv_f1":      round(float(np.mean([m["f1"] for m in fold_metrics])), 4) if fold_metrics else 0,
        "mean_cv_recall":  round(float(np.mean([m["recall"] for m in fold_metrics])), 4) if fold_metrics else 0,
        "target_met":      holdout_metrics.get("target_met", False),
    }

    with open(REPORT_DIR / "model4_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n[Model4] TRAINING SUMMARY")
    print(f"  CV mean F1:     {metrics['mean_cv_f1']:.4f}")
    print(f"  CV mean Recall: {metrics['mean_cv_recall']:.4f}")
    status = "✓ TARGET MET" if metrics["target_met"] else "✗"
    print(f"  Holdout Recall: {holdout_metrics.get('recall', 0):.4f} | {status}")

    return metrics


if __name__ == "__main__":
    from pathlib import Path
    DATA_DIR = Path(__file__).parent.parent / "data" / "synthetic"
    telem  = pd.read_parquet(DATA_DIR / "telemetry.parquet")
    events = pd.read_parquet(DATA_DIR / "events.parquet")
    meta   = pd.read_parquet(DATA_DIR / "well_metadata.parquet")
    train_model4(telem, events, meta)
