"""
NWIS eRTMAC — Model 2: Dynamic Formation-Interval Matcher (DFIM)
=================================================================
Formation-Anchored Exact Dynamic Time Warping (DTW).

Real-time aligns active bit telemetry curves (MSE, d-exponent, GR)
to offset well logs using DTW constrained by formation top anchors
and a Sakoe-Chiba band of ±50 m.

Training is unsupervised — no labels required.
Evaluation metric: mean DTW alignment score across validation wells.
Target: alignment score > 0.90 on formation-level subsequences.
"""

import numpy as np
import pandas as pd
import joblib
import json
from pathlib import Path
from typing import Optional
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error
import warnings
warnings.filterwarnings("ignore")

# Try to import dtaidistance; graceful fallback to scipy
try:
    from dtaidistance import dtw as dtw_lib
    from dtaidistance import dtw_ndim
    _DTAI_AVAILABLE = True
except ImportError:
    from scipy.spatial.distance import euclidean
    _DTAI_AVAILABLE = False
    print("[Model2] dtaidistance not available — falling back to scipy DTW")

MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# Sakoe-Chiba band in depth samples (0.25 m/sample → ±50 m = ±200 samples)
SAKOE_CHIBA_SAMPLES = 200
FEATURES = ["mse_mpa", "dxc", "gamma_ray_api"]


# ─────────────────────────────────────────────────────────────────────────────
# DTW utilities
# ─────────────────────────────────────────────────────────────────────────────

def _scipy_dtw_distance(s1: np.ndarray, s2: np.ndarray, window: int) -> float:
    """Pure-Python DTW with Sakoe-Chiba window (fallback)."""
    n, m = len(s1), len(s2)
    dtw_matrix = np.full((n + 1, m + 1), np.inf)
    dtw_matrix[0, 0] = 0.0

    for i in range(1, n + 1):
        j_lo = max(1, i - window)
        j_hi = min(m, i + window)
        for j in range(j_lo, j_hi + 1):
            cost = np.linalg.norm(s1[i - 1] - s2[j - 1])
            dtw_matrix[i, j] = cost + min(
                dtw_matrix[i - 1, j],
                dtw_matrix[i, j - 1],
                dtw_matrix[i - 1, j - 1],
            )
    return dtw_matrix[n, m]


def compute_dtw_distance(s1: np.ndarray, s2: np.ndarray, window: int = SAKOE_CHIBA_SAMPLES) -> float:
    """
    Compute constrained DTW distance between two multivariate sequences.
    Uses dtaidistance (C-optimized) if available, else scipy fallback.
    """
    if _DTAI_AVAILABLE:
        try:
            # dtw_ndim for multivariate
            dist = dtw_ndim.distance(s1.astype(np.double), s2.astype(np.double), window=window)
            return float(dist)
        except Exception:
            pass
    return _scipy_dtw_distance(s1, s2, window)


def dtw_similarity_score(dist: float, max_dist: float) -> float:
    """Convert DTW distance to 0–1 similarity (1 = perfect match)."""
    return max(0.0, 1.0 - dist / (max_dist + 1e-9))


# ─────────────────────────────────────────────────────────────────────────────
# DFIM Engine
# ─────────────────────────────────────────────────────────────────────────────

class DFIMEngine:
    """
    Dynamic Formation-Interval Matcher.

    Stores a library of offset well log subsequences (per formation).
    At inference time, aligns an incoming active-well subsequence to
    the best-matching offset subsequence within the same formation.
    """

    def __init__(self, features: list = None):
        self.features = features or FEATURES
        self.scaler = StandardScaler()
        self.formation_library: dict[str, list[dict]] = {}  # fmt_name → [{wellbore_id, sequence}]
        self._is_fitted = False

    # ── Build the offset library ───────────────────────────────────────────

    def fit(self, telemetry_df: pd.DataFrame, formation_tops_df: pd.DataFrame):
        """
        Build formation-level log library from offset wells.

        Parameters
        ----------
        telemetry_df    : must have columns [wellbore_id, depth_md, mse_mpa, dxc, gamma_ray_api]
        formation_tops_df : must have [wellbore_id, formation_name, top_md, base_md]
        """
        print("[Model2] Building DFIM library …")

        # Fit scaler on all available data
        feat_data = telemetry_df[self.features].replace([np.inf, -np.inf], np.nan).dropna()
        self.scaler.fit(feat_data)

        self.formation_library = {}

        indexed_df = telemetry_df.set_index("wellbore_id")

        for _, row in formation_tops_df.iterrows():
            wid   = row["wellbore_id"]
            fname = row["formation_name"]
            lo    = row["top_md"]
            hi    = row["base_md"]

            try:
                well_data = indexed_df.loc[wid]
                # In case only one row was returned (Series), convert to DataFrame
                if isinstance(well_data, pd.Series):
                    well_data = well_data.to_frame().T
            except KeyError:
                continue

            mask = (well_data["depth_md"] >= lo) & (well_data["depth_md"] <= hi)
            sub = well_data.loc[mask, self.features].copy()
            sub = sub.replace([np.inf, -np.inf], np.nan).fillna(method="ffill").fillna(method="bfill")

            if len(sub) < 20:
                continue  # too short to be useful

            seq_scaled = self.scaler.transform(sub.values)[::10]

            if fname not in self.formation_library:
                self.formation_library[fname] = []

            self.formation_library[fname].append({
                "wellbore_id": wid,
                "sequence":    seq_scaled,
                "top_md":      lo,
                "base_md":     hi,
                "n_samples":   len(sub),
            })

        n_entries = sum(len(v) for v in self.formation_library.values())
        print(f"[Model2] Library built: {len(self.formation_library)} formations, {n_entries} subsequences")
        self._is_fitted = True

    # ── Inference ──────────────────────────────────────────────────────────

    def align(
        self,
        active_sequence: pd.DataFrame,
        formation_name: str,
        top_k: int = 3,
    ) -> list[dict]:
        """
        Align an incoming active-well subsequence against the offset library
        for the specified formation.

        Returns list of top_k best matches with DTW score.
        """
        if not self._is_fitted:
            raise RuntimeError("DFIMEngine must be fitted before calling align().")

        if formation_name not in self.formation_library:
            return [{"error": f"Formation '{formation_name}' not in library"}]

        seq = active_sequence[self.features].replace([np.inf, -np.inf], np.nan).fillna(0)
        seq_scaled = self.scaler.transform(seq.values)[::10]

        results = []
        candidates = self.formation_library[formation_name]

        # Estimate max distance for normalisation
        max_dist = max(len(seq_scaled), 1) * np.sqrt(len(self.features)) * 6.0

        for candidate in candidates:
            dist = compute_dtw_distance(seq_scaled, candidate["sequence"])
            sim  = dtw_similarity_score(dist, max_dist)
            results.append({
                "wellbore_id":    candidate["wellbore_id"],
                "dtw_distance":   round(dist, 4),
                "alignment_score": round(sim, 4),
                "top_md":         candidate["top_md"],
                "base_md":        candidate["base_md"],
            })

        results.sort(key=lambda x: x["dtw_distance"])
        return results[:top_k]

    # ── Evaluation ─────────────────────────────────────────────────────────

    def evaluate(self, val_telemetry: pd.DataFrame, val_formations: pd.DataFrame) -> dict:
        """
        Evaluate alignment quality on held-out validation wells.
        Returns mean alignment score (target > 0.90).
        """
        scores = []
        indexed_val = val_telemetry.set_index("wellbore_id")

        for _, row in val_formations.iterrows():
            wid   = row["wellbore_id"]
            fname = row["formation_name"]
            lo, hi = row["top_md"], row["base_md"]

            try:
                well_data = indexed_val.loc[wid]
                if isinstance(well_data, pd.Series):
                    well_data = well_data.to_frame().T
            except KeyError:
                continue

            mask = (well_data["depth_md"] >= lo) & (well_data["depth_md"] <= hi)
            sub = well_data.loc[mask].copy()
            if len(sub) < 20:
                continue

            results = self.align(sub, fname)
            if results and "alignment_score" in results[0]:
                # Best alignment score (excluding self)
                same_well_results = [r for r in results if r["wellbore_id"] != wid]
                if same_well_results:
                    scores.append(same_well_results[0]["alignment_score"])

        mean_score = float(np.mean(scores)) if scores else 0.0
        metrics = {
            "mean_alignment_score": round(mean_score, 4),
            "n_evaluated":          len(scores),
            "target_met":           mean_score >= 0.90,
        }
        print(f"[Model2] Validation: mean alignment score = {mean_score:.4f} "
              f"({'✓ TARGET MET' if mean_score >= 0.90 else '✗ below target'})")
        return metrics

    # ── Persistence ───────────────────────────────────────────────────────

    def save(self, path: Path = None):
        path = path or (MODEL_DIR / "model2_dfim.pkl")
        joblib.dump(self, path)
        print(f"[Model2] DFIM engine saved → {path}")

    @classmethod
    def load(cls, path: Path = None) -> "DFIMEngine":
        path = path or (MODEL_DIR / "model2_dfim.pkl")
        return joblib.load(path)


# ─────────────────────────────────────────────────────────────────────────────
# Training entry point
# ─────────────────────────────────────────────────────────────────────────────

def train_model2(telemetry_df: pd.DataFrame, formations_df: pd.DataFrame,
                 meta_df: pd.DataFrame) -> tuple[DFIMEngine, dict]:
    """
    Train (build library) and evaluate Model 2 using well-grouped splits.
    Returns (engine, metrics).
    """
    from sklearn.model_selection import GroupShuffleSplit

    # 80/20 split by wellbore_id (never by depth-index)
    all_wids = meta_df["wellbore_id"].unique()
    rng_split = np.random.default_rng(42)
    shuffled  = rng_split.permutation(all_wids)
    n_train   = int(len(shuffled) * 0.80)
    train_wids = set(shuffled[:n_train])
    val_wids   = set(shuffled[n_train:])

    train_tel  = telemetry_df[telemetry_df["wellbore_id"].isin(train_wids)]
    val_tel    = telemetry_df[telemetry_df["wellbore_id"].isin(val_wids)]
    train_fmts = formations_df[formations_df["wellbore_id"].isin(train_wids)]
    val_fmts   = formations_df[formations_df["wellbore_id"].isin(val_wids)]

    print(f"[Model2] Train wells: {len(train_wids)}, Val wells: {len(val_wids)}")

    engine = DFIMEngine()
    engine.fit(train_tel, train_fmts)
    metrics = engine.evaluate(val_tel, val_fmts)
    engine.save()

    # Save metrics
    with open(MODEL_DIR / "model2_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    return engine, metrics


if __name__ == "__main__":
    from pathlib import Path
    DATA_DIR = Path(__file__).parent.parent / "data" / "synthetic"
    telem = pd.read_parquet(DATA_DIR / "telemetry.parquet")
    fmts  = pd.read_parquet(DATA_DIR / "formation_tops.parquet")
    meta  = pd.read_parquet(DATA_DIR / "well_metadata.parquet")
    train_model2(telem, fmts, meta)
