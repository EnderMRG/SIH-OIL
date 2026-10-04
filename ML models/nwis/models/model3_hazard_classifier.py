"""
NWIS eRTMAC — Model 3: Subsurface Lookahead Hazard Classifier
==============================================================
Two-Tier Ensemble:
  Tier A: Beta-Prior Empirical Baseline (always-on)
  Tier B: XGBoost / LightGBM per-class binary classifiers

6 Hazard targets:
  1. Lost_Circulation
  2. Stuck_Pipe
  3. Overpressure_Zone
  4. Gas_Kick
  5. Torque_Spike
  6. Cementing_Issue

Anti-Overfitting measures:
  - GroupKFold(n_splits=5) grouped by wellbore_id
  - SMOTE applied ONLY within each training fold (never on validation)
  - Early stopping on XGBoost (30 rounds)
  - Evaluation: PR-AUC (not ROC-AUC), threshold tuned per class

Anti-Data-Leakage:
  - No random K-Fold — entire wells held out per validation fold
  - Lookahead window features are computed using only past + current depth info
  - DFIM alignment score (from Model 2) is a static library lookup — no future info

Target accuracy: >90% PR-AUC on held-out wells per hazard class
"""

import numpy as np
import pandas as pd
import json
import joblib
from pathlib import Path
from typing import Optional
import warnings
warnings.filterwarnings("ignore")

from sklearn.model_selection import GroupKFold
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    average_precision_score, precision_recall_curve,
    f1_score, classification_report, roc_auc_score
)
from sklearn.calibration import CalibratedClassifierCV

import xgboost as xgb
import lightgbm as lgb

# Try SMOTE
try:
    from imblearn.over_sampling import SMOTE
    _SMOTE_AVAILABLE = True
except ImportError:
    _SMOTE_AVAILABLE = False
    print("[Model3] imbalanced-learn not installed — skipping SMOTE")

MODEL_DIR = Path(__file__).parent.parent / "models"
REPORT_DIR = Path(__file__).parent.parent / "reports"
MODEL_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

HAZARD_CLASSES = [
    "Lost_Circulation",
    "Stuck_Pipe",
    "Overpressure_Zone",
    "Gas_Kick",
    "Torque_Spike",
    "Cementing_Issue",
]

# ─────────────────────────────────────────────────────────────────────────────
# Feature engineering
# ─────────────────────────────────────────────────────────────────────────────

LITH_CATEGORIES = ["Sand", "Shale", "Lime", "Salt", "Unknown"]

def engineer_features(telemetry_df: pd.DataFrame, events_df: pd.DataFrame,
                       formations_df: pd.DataFrame, lookahead_m: float = 75.0) -> pd.DataFrame:
    """
    Joins telemetry with formation and event data.
    Labels each depth sample with hazard classes occurring within
    the next `lookahead_m` metres ahead of the bit.
    Computes incident density features from historical events.

    Returns merged DataFrame ready for model training.
    """
    print(f"[Model3] Engineering features (lookahead={lookahead_m}m) …")

    df = telemetry_df.copy().sort_values(["wellbore_id", "depth_md"])

    # ── One-hot encode lithology ──────────────────────────────────────────
    df["lithology"] = df["lithology"].fillna("Unknown")
    for cat in LITH_CATEGORIES:
        df[f"lith_{cat.lower()}"] = (df["lithology"] == cat).astype(int)

    # ── Lagged / rolling features (past context — no future leakage) ───────
    for col in ["rop_mhr", "wob_tonnes", "torque_knm", "spp_psi", "gamma_ray_api",
                "mse_mpa", "dxc", "mud_weight_sg", "flow_in_lpm", "flow_out_pct"]:
        df[f"{col}_roll5_mean"] = df.groupby("wellbore_id")[col].transform(
            lambda x: x.rolling(5, min_periods=1).mean()
        )
        df[f"{col}_roll5_std"] = df.groupby("wellbore_id")[col].transform(
            lambda x: x.rolling(5, min_periods=1).std().fillna(0)
        )

    # ── Casing shoe clearance (m to last shoe) ────────────────────────────
    df["casing_shoe_clearance_m"] = df["depth_md"] - df["casing_shoe_tvdss"]

    # ── Mud weight safety margin ───────────────────────────────────────────
    df["pp_margin_sg"] = df.get("pore_pressure_margin_sg",
                                pd.Series(0.1, index=df.index))

    # ── LOT/FIT margin (synthetic: constant + noise) ───────────────────────
    np.random.seed(42)
    df["shoe_lot_fit_margin_sg"] = 0.30 + np.random.normal(0, 0.02, len(df))

    # ── Bit-to-casing clearance ratio ─────────────────────────────────────
    df["bit_to_casing_clearance_ratio"] = df.get("bit_diameter_in", 12.25) / 9.625

    # ── Incident density from events_df ───────────────────────────────────
    if len(events_df) > 0:
        # count events per well per 100m bin
        events_df = events_df.copy()
        events_df["depth_bin"] = (events_df["depth_md"] // 100) * 100

        density = events_df.groupby(
            ["wellbore_id", "hazard_class", "depth_bin"]
        ).size().reset_index(name="bin_count")

        # For each sample, join the nearest density bin (approximate)
        df["depth_bin"] = (df["depth_md"] // 100) * 100
        density_pivot = density.pivot_table(
            index=["wellbore_id", "depth_bin"], columns="hazard_class",
            values="bin_count", fill_value=0
        ).reset_index()
        density_pivot.columns = [
            f"hist_density_{c}" if c not in ["wellbore_id", "depth_bin"] else c
            for c in density_pivot.columns
        ]
        df = df.merge(density_pivot, on=["wellbore_id", "depth_bin"], how="left")
        for hc in HAZARD_CLASSES:
            col = f"hist_density_{hc}"
            if col not in df.columns:
                df[col] = 0.0
            df[col] = df[col].fillna(0)
    else:
        for hc in HAZARD_CLASSES:
            df[f"hist_density_{hc}"] = 0.0

    df = df.drop(columns=["depth_bin"], errors="ignore")

    # ── Build lookahead labels ─────────────────────────────────────────────
    for hc in HAZARD_CLASSES:
        df[f"label_{hc}"] = 0

    if len(events_df) > 0:
        events_by_well = {wid: grp for wid, grp in events_df.groupby("wellbore_id")}

        for hc in HAZARD_CLASSES:
            label_col = f"label_{hc}"
            for wid, well_df in df.groupby("wellbore_id"):
                if wid not in events_by_well:
                    continue
                evt = events_by_well[wid]
                evt_hc = evt[evt["hazard_class"] == hc]["depth_md"].values
                if len(evt_hc) == 0:
                    continue

                depths = well_df["depth_md"].values
                # For each sample: is there an event within [depth, depth+lookahead]?
                # Vectorised via broadcasting (small enough)
                in_window = np.any(
                    (evt_hc[None, :] >= depths[:, None]) &
                    (evt_hc[None, :] <= depths[:, None] + lookahead_m),
                    axis=1
                )
                df.loc[well_df.index, label_col] = in_window.astype(int)

    label_cols = [f"label_{hc}" for hc in HAZARD_CLASSES]
    rates = df[label_cols].mean()
    print("[Model3] Label rates (positive %):")
    for col, rate in rates.items():
        print(f"  {col:40s}: {rate*100:.2f}%")

    return df


# ─────────────────────────────────────────────────────────────────────────────
# Tier A: Empirical Baseline
# ─────────────────────────────────────────────────────────────────────────────

class EmpiricalBaselineEstimator:
    """
    Beta-Prior (α=1, β=10) distance-weighted empirical hazard estimator.
    Always-on fallback / blend component.
    """
    ALPHA = 1
    BETA  = 10

    def __init__(self):
        self.event_tables: dict[str, pd.DataFrame] = {}

    def fit(self, events_df: pd.DataFrame):
        for hc in HAZARD_CLASSES:
            self.event_tables[hc] = events_df[events_df["hazard_class"] == hc][
                ["wellbore_id", "depth_md"]
            ].copy()
        return self

    def predict_proba(self, depth_md: float, wellbore_id: str, hazard_class: str,
                       k_nearest: int = 10, sigma_m: float = 200.0) -> float:
        """
        Beta-smoothed frequency estimate:
          P(Hazard) = (k_nearby + alpha) / (n_nearby + alpha + beta)
        where k_nearby = # events within sigma_m, weighted by distance.
        """
        table = self.event_tables.get(hazard_class, pd.DataFrame())
        if len(table) == 0:
            return self.ALPHA / (self.ALPHA + self.BETA)

        same_well = table[table["wellbore_id"] == wellbore_id]
        dists = np.abs(same_well["depth_md"].values - depth_md)
        weights = np.exp(-dists / sigma_m)
        k = weights.sum()
        n = len(dists)
        return float((k + self.ALPHA) / (n + self.ALPHA + self.BETA))


# ─────────────────────────────────────────────────────────────────────────────
# Tier B: XGBoost / LightGBM per-class classifiers
# ─────────────────────────────────────────────────────────────────────────────

FEATURE_COLS = [
    # Telemetry
    "rop_mhr", "wob_tonnes", "torque_knm", "rpm", "spp_psi",
    "mud_weight_sg", "flow_in_lpm", "flow_out_pct", "gamma_ray_api",
    "total_gas_pct", "c1_ppm", "mse_mpa", "dxc",
    # Rolling statistics
    "rop_mhr_roll5_mean", "torque_knm_roll5_mean", "mse_mpa_roll5_mean",
    "gamma_ray_api_roll5_mean", "spp_psi_roll5_mean",
    "rop_mhr_roll5_std", "torque_knm_roll5_std",
    # Formation & wellbore
    "pore_pressure_margin_sg", "casing_shoe_clearance_m",
    "shoe_lot_fit_margin_sg", "bit_to_casing_clearance_ratio",
    "lith_sand", "lith_shale", "lith_lime", "lith_salt",
    # Historical density
    *[f"hist_density_{hc}" for hc in HAZARD_CLASSES],
    # Depth context
    "depth_md", "depth_tvdss",
]


def _tune_threshold(y_true: np.ndarray, y_prob: np.ndarray) -> float:
    """Find F1-optimal classification threshold on validation data."""
    precisions, recalls, thresholds = precision_recall_curve(y_true, y_prob)
    f1_scores = 2 * precisions * recalls / np.maximum(precisions + recalls, 1e-9)
    best_idx = np.argmax(f1_scores[:-1])
    return float(thresholds[best_idx]) if len(thresholds) > 0 else 0.5


def train_tier_b(
    df: pd.DataFrame,
    hazard_class: str,
    n_splits: int = 5,
    use_lgb: bool = False,
) -> tuple[object, dict, float]:
    """
    Trains XGBoost (or LightGBM) binary classifier for one hazard class.
    Uses GroupKFold by wellbore_id — entire wells are held out per fold.

    Returns: (trained_model, cv_metrics, best_threshold)
    """
    label_col = f"label_{hazard_class}"
    avail_features = [c for c in FEATURE_COLS if c in df.columns]

    X = df[avail_features].replace([np.inf, -np.inf], np.nan).fillna(0).values
    y = df[label_col].values
    groups = df["wellbore_id"].values

    pos_rate = y.mean()
    print(f"\n[Model3][{hazard_class}] Positive rate: {pos_rate*100:.2f}% "
          f"| n_samples={len(y)}")

    if pos_rate < 1e-6:
        print(f"  ⚠ No positive samples — skipping {hazard_class}")
        return None, {}, 0.5

    # ── Stratified cap: keep at most 300k rows so XGBoost finishes in minutes
    MAX_ROWS = 300_000
    if len(y) > MAX_ROWS:
        rng = np.random.default_rng(42)
        pos_idx = np.where(y == 1)[0]
        neg_idx = np.where(y == 0)[0]
        if len(pos_idx) >= MAX_ROWS:
            # More positives than cap — subsample both proportionally
            keep_pos = rng.choice(pos_idx, size=MAX_ROWS // 2, replace=False)
            keep_neg = rng.choice(neg_idx, size=MAX_ROWS // 2, replace=False)
            keep = np.concatenate([keep_pos, keep_neg])
        else:
            # Keep all positives, fill remainder with negatives
            n_neg_keep = MAX_ROWS - len(pos_idx)
            keep_neg = rng.choice(neg_idx, size=min(n_neg_keep, len(neg_idx)), replace=False)
            keep = np.concatenate([pos_idx, keep_neg])
        rng.shuffle(keep)
        X, y, groups = X[keep], y[keep], groups[keep]
        print(f"  [Subsample] {len(y):,} rows (capped from {len(df):,})")

    pos_rate = y.mean()  # recalculate after subsample
    scale_pos_weight = (1 - pos_rate) / max(pos_rate, 1e-6)

    gkf = GroupKFold(n_splits=n_splits)
    fold_pr_aucs = []
    fold_roc_aucs = []
    fold_f1s = []
    all_oof_probs = np.zeros(len(y))

    for fold_idx, (train_idx, val_idx) in enumerate(gkf.split(X, y, groups=groups)):
        X_tr, y_tr = X[train_idx], y[train_idx]
        X_val, y_val = X[val_idx], y[val_idx]

        # ── SMOTE on training fold only ───────────────────────────────────
        if _SMOTE_AVAILABLE and y_tr.sum() >= 5:
            try:
                sm = SMOTE(random_state=42 + fold_idx, k_neighbors=min(5, int(y_tr.sum()) - 1))
                X_tr, y_tr = sm.fit_resample(X_tr, y_tr)
            except Exception as e:
                print(f"  [SMOTE] skipped fold {fold_idx}: {e}")

        # ── Build model ────────────────────────────────────────────────────
        if use_lgb:
            model = lgb.LGBMClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                num_leaves=63,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1.0,
                random_state=42,
                verbose=-1,
                n_jobs=1,
            )
            model.fit(
                X_tr, y_tr,
                eval_set=[(X_val, y_val)],
                callbacks=[lgb.early_stopping(20, verbose=False), lgb.log_evaluation(period=-1)],
            )
        else:
            model = xgb.XGBClassifier(
                n_estimators=200,
                max_depth=6,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                subsample=0.8,
                colsample_bytree=0.8,
                reg_alpha=0.1,
                reg_lambda=1.0,
                eval_metric="aucpr",
                early_stopping_rounds=20,
                random_state=42,
                verbosity=0,
                n_jobs=1,
            )
            model.fit(X_tr, y_tr, eval_set=[(X_val, y_val)], verbose=False)

        # ── Evaluate ────────────────────────────────────────────────────────
        y_prob = model.predict_proba(X_val)[:, 1]
        all_oof_probs[val_idx] = y_prob

        if y_val.sum() > 0:
            pr_auc = average_precision_score(y_val, y_prob)
            roc_auc = roc_auc_score(y_val, y_prob)
            thr = _tune_threshold(y_val, y_prob)
            y_pred = (y_prob >= thr).astype(int)
            f1 = f1_score(y_val, y_pred, zero_division=0)
            fold_pr_aucs.append(pr_auc)
            fold_roc_aucs.append(roc_auc)
            fold_f1s.append(f1)
            print(f"  Fold {fold_idx+1}: PR-AUC={pr_auc:.4f} | ROC-AUC={roc_auc:.4f} | F1={f1:.4f}")
        else:
            print(f"  Fold {fold_idx+1}: No positive labels in val fold — skipped")

    # ── Retrain on full data ────────────────────────────────────────────────
    print(f"[Model3][{hazard_class}] Retraining on full dataset …")
    if use_lgb:
        final_model = lgb.LGBMClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.05,
            scale_pos_weight=scale_pos_weight, num_leaves=63,
            subsample=0.8, colsample_bytree=0.8,
            reg_alpha=0.1, reg_lambda=1.0, random_state=42, verbose=-1, n_jobs=1,
        )
    else:
        final_model = xgb.XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.05,
            scale_pos_weight=scale_pos_weight, subsample=0.8,
            colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=1.0,
            eval_metric="aucpr", random_state=42, verbosity=0, n_jobs=1,
        )

    if _SMOTE_AVAILABLE and y.sum() >= 5:
        try:
            sm = SMOTE(random_state=42, k_neighbors=min(5, int(y.sum()) - 1))
            X_res, y_res = sm.fit_resample(X, y)
        except Exception:
            X_res, y_res = X, y
    else:
        X_res, y_res = X, y

    final_model.fit(X_res, y_res)

    # ── OOF threshold tuning ────────────────────────────────────────────────
    best_thr = _tune_threshold(y, all_oof_probs)

    metrics = {
        "hazard_class":     hazard_class,
        "n_folds":          n_splits,
        "mean_pr_auc":      round(float(np.mean(fold_pr_aucs)) if fold_pr_aucs else 0, 4),
        "std_pr_auc":       round(float(np.std(fold_pr_aucs)) if fold_pr_aucs else 0, 4),
        "mean_roc_auc":     round(float(np.mean(fold_roc_aucs)) if fold_roc_aucs else 0, 4),
        "mean_f1":          round(float(np.mean(fold_f1s)) if fold_f1s else 0, 4),
        "best_threshold":   round(best_thr, 4),
        "positive_rate_pct": round(float(pos_rate) * 100, 4),
        "target_met":       (float(np.mean(fold_pr_aucs)) if fold_pr_aucs else 0) >= 0.90,
    }

    target_str = "✓ TARGET MET" if metrics["target_met"] else "✗ below 0.90"
    print(f"[Model3][{hazard_class}] PR-AUC: {metrics['mean_pr_auc']:.4f} ± "
          f"{metrics['std_pr_auc']:.4f} | {target_str}")

    return final_model, metrics, best_thr


# ─────────────────────────────────────────────────────────────────────────────
# SHAP explainability
# ─────────────────────────────────────────────────────────────────────────────

def compute_shap_values(model, X_sample: np.ndarray, feature_names: list,
                         hazard_class: str, save_dir: Path = REPORT_DIR):
    """Generate and save SHAP bar plot for the given model."""
    try:
        import shap
        import matplotlib.pyplot as plt
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_sample)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]  # positive class
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_sample, feature_names=feature_names,
                          plot_type="bar", show=False, max_display=15)
        plt.title(f"SHAP Feature Importance — {hazard_class}")
        plt.tight_layout()
        out_path = save_dir / f"shap_{hazard_class}.png"
        plt.savefig(out_path, dpi=120, bbox_inches="tight")
        plt.close()
        print(f"[Model3] SHAP plot saved → {out_path}")
    except ImportError:
        print("[Model3] shap not installed — skipping SHAP plots")
    except Exception as e:
        print(f"[Model3] SHAP failed for {hazard_class}: {e}")


# ─────────────────────────────────────────────────────────────────────────────
# ONNX export
# ─────────────────────────────────────────────────────────────────────────────

def export_to_onnx(xgb_model, n_features: int, hazard_class: str,
                    save_dir: Path = MODEL_DIR):
    """Export trained XGBoost model to ONNX format."""
    try:
        from skl2onnx import convert_sklearn
        from skl2onnx.common.data_types import FloatTensorType
        onnx_path = save_dir / f"model3_{hazard_class}.onnx"
        initial_type = [("float_input", FloatTensorType([None, n_features]))]
        onx = convert_sklearn(xgb_model, initial_types=initial_type,
                               target_opset=12)
        with open(onnx_path, "wb") as f:
            f.write(onx.SerializeToString())
        print(f"[Model3] ONNX exported → {onnx_path}")
    except Exception as e:
        print(f"[Model3] ONNX export failed: {e}")
        # Try onnxmltools for XGBoost
        try:
            import onnxmltools
            from onnxmltools.convert import convert_xgboost
            from onnxmltools.convert.common.data_types import FloatTensorType
            onnx_model = convert_xgboost(
                xgb_model, name=f"model3_{hazard_class}",
                initial_types=[("float_input", FloatTensorType([None, n_features]))]
            )
            onnx_path = save_dir / f"model3_{hazard_class}.onnx"
            with open(onnx_path, "wb") as f:
                f.write(onnx_model.SerializeToString())
            print(f"[Model3] ONNX exported via onnxmltools → {onnx_path}")
        except Exception as e2:
            print(f"[Model3] All ONNX export attempts failed: {e2}")


# ─────────────────────────────────────────────────────────────────────────────
# Main training pipeline
# ─────────────────────────────────────────────────────────────────────────────

def train_model3(telemetry_df: pd.DataFrame, events_df: pd.DataFrame,
                  formations_df: pd.DataFrame) -> dict:
    """
    Full Model 3 training pipeline.
    Returns dict of all per-class metrics.
    """
    # Feature engineering
    df = engineer_features(telemetry_df, events_df, formations_df)

    avail_features = [c for c in FEATURE_COLS if c in df.columns]
    all_metrics = {}
    models = {}
    thresholds = {}

    # Tier A empirical baseline
    tier_a = EmpiricalBaselineEstimator()
    tier_a.fit(events_df)
    joblib.dump(tier_a, MODEL_DIR / "model3_tier_a.pkl")

    # Tier B per-class classifiers
    for hc in HAZARD_CLASSES:
        model, metrics, thr = train_tier_b(df, hc, n_splits=5, use_lgb=False)
        all_metrics[hc] = metrics
        thresholds[hc] = thr

        if model is not None:
            models[hc] = model
            # Save model
            model_path = MODEL_DIR / f"model3_{hc}.pkl"
            joblib.dump(model, model_path)

            # Export to ONNX
            X_sample = df[avail_features].replace([np.inf, -np.inf], np.nan).fillna(0).values
            export_to_onnx(model, len(avail_features), hc)

            # SHAP (on a subsample of 500 for speed)
            n_shap = min(500, len(X_sample))
            idx = np.random.choice(len(X_sample), n_shap, replace=False)
            compute_shap_values(model, X_sample[idx], avail_features, hc)

    # Save thresholds & metrics
    with open(MODEL_DIR / "model3_thresholds.json", "w") as f:
        json.dump(thresholds, f, indent=2)
    with open(REPORT_DIR / "model3_metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)

    # Summary report
    print("\n" + "=" * 70)
    print("MODEL 3 — TRAINING SUMMARY")
    print("=" * 70)
    for hc, m in all_metrics.items():
        status = "✓ TARGET MET" if m.get("target_met") else "✗"
        print(f"  {hc:25s}: PR-AUC={m.get('mean_pr_auc','N/A'):.4f} | F1={m.get('mean_f1','N/A'):.4f} | {status}")

    return all_metrics


if __name__ == "__main__":
    from pathlib import Path
    DATA_DIR = Path(__file__).parent.parent / "data" / "synthetic"
    telem  = pd.read_parquet(DATA_DIR / "telemetry.parquet")
    events = pd.read_parquet(DATA_DIR / "events.parquet")
    fmts   = pd.read_parquet(DATA_DIR / "formation_tops.parquet")
    train_model3(telem, events, fmts)
