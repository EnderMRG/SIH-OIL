"""
NWIS eRTMAC — Model 1: Pre-Drilling Offset Analogue Selector
=============================================================
6-Factor Weighted Scoring Engine.

Features:
  1. Geographic 3D Distance (d_g)
  2. Stratigraphic Sequence Match (S_geo) — Jaccard index
  3. Target TVDSS Difference (Δz)
  4. Well Profile Trajectory Type (T_well)
  5. Hole Section Clearance (C_drill)
  6. Data Resolution Quality (Q_data)

Scoring formula:
  Score = w1*(1 - d_g/d_max) + w2*S_geo + w3*(1 - Δz/z_max) + w4*T_well + w5*C_drill + w6*Q_data

NOTE: This is a deterministic scoring service (no ML training required).
      A calibration routine is provided to tune weights against historical
      engineering selection decisions using linear regression.
"""

import numpy as np
import pandas as pd
import json
import joblib
from pathlib import Path
from sklearn.linear_model import Ridge
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import cross_val_score
import warnings
warnings.filterwarnings("ignore")

MODEL_DIR = Path(__file__).parent.parent / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

# ─── Default weights (from spec) ─────────────────────────────────────────────
DEFAULT_WEIGHTS = {
    "w1_geo_distance":    0.25,
    "w2_strat_match":     0.35,
    "w3_tvdss_diff":      0.15,
    "w4_trajectory":      0.10,
    "w5_hole_clearance":  0.08,
    "w6_data_quality":    0.07,
}

TRAJECTORY_SCORES = {"Vertical": 1.0, "Directional": 0.8, "Horizontal": 0.6}
DATA_QUALITY_SCORES = {"LAS_HiRes": 1.0, "LAS_Standard": 0.85, "Mud_Log": 0.6, "DDR_Paper": 0.4}


# ─────────────────────────────────────────────────────────────────────────────
# Core scoring function
# ─────────────────────────────────────────────────────────────────────────────

class OffsetAnalogueSelector:
    """
    Ranks candidate offset wells for a planned hole section using the
    6-Factor scoring formula from the eRTMAC specification.

    Parameters
    ----------
    weights : dict, optional
        Override default weights {w1..w6}.
    """

    def __init__(self, weights: dict = None):
        self.weights = weights or DEFAULT_WEIGHTS.copy()
        self._validate_weights()

    def _validate_weights(self):
        total = sum(self.weights.values())
        if not np.isclose(total, 1.0, atol=0.01):
            raise ValueError(f"Weights must sum to 1.0, got {total:.4f}")

    # ── Feature extractors ──────────────────────────────────────────────────

    @staticmethod
    def geo_distance_score(d_g: float, d_max: float) -> float:
        """Normalised inverse geographic 3D distance."""
        return max(0.0, 1.0 - d_g / d_max)

    @staticmethod
    def stratigraphic_jaccard(active_seq: list, offset_seq: list) -> float:
        """Jaccard index of formation name sets."""
        a, b = set(active_seq), set(offset_seq)
        if not a and not b:
            return 0.0
        return len(a & b) / len(a | b)

    @staticmethod
    def tvdss_diff_score(delta_z: float, z_max: float) -> float:
        """Normalised inverse TVDSS difference."""
        return max(0.0, 1.0 - delta_z / z_max)

    @staticmethod
    def trajectory_score(well_type: str) -> float:
        return TRAJECTORY_SCORES.get(well_type, 0.5)

    @staticmethod
    def hole_clearance_score(active_bit_in: float, offset_bit_in: float) -> float:
        """Ratio of bit sizes — 1.0 when identical."""
        if offset_bit_in == 0:
            return 0.0
        ratio = min(active_bit_in, offset_bit_in) / max(active_bit_in, offset_bit_in)
        return float(ratio)

    @staticmethod
    def data_quality_score(data_type: str) -> float:
        return DATA_QUALITY_SCORES.get(data_type, 0.5)

    # ── Composite score ────────────────────────────────────────────────────

    def score_offset_well(
        self,
        d_g: float,
        d_max: float,
        active_formation_seq: list,
        offset_formation_seq: list,
        delta_z: float,
        z_max: float,
        offset_trajectory: str,
        active_bit_in: float,
        offset_bit_in: float,
        offset_data_type: str,
    ) -> dict:
        w = self.weights
        f1 = self.geo_distance_score(d_g, d_max)
        f2 = self.stratigraphic_jaccard(active_formation_seq, offset_formation_seq)
        f3 = self.tvdss_diff_score(delta_z, z_max)
        f4 = self.trajectory_score(offset_trajectory)
        f5 = self.hole_clearance_score(active_bit_in, offset_bit_in)
        f6 = self.data_quality_score(offset_data_type)

        score = (
            w["w1_geo_distance"]   * f1
            + w["w2_strat_match"]  * f2
            + w["w3_tvdss_diff"]   * f3
            + w["w4_trajectory"]   * f4
            + w["w5_hole_clearance"] * f5
            + w["w6_data_quality"] * f6
        )

        return {
            "composite_score":       round(float(score), 4),
            "f1_geo_distance":       round(f1, 4),
            "f2_strat_match":        round(f2, 4),
            "f3_tvdss_diff":         round(f3, 4),
            "f4_trajectory":         round(f4, 4),
            "f5_hole_clearance":     round(f5, 4),
            "f6_data_quality":       round(f6, 4),
        }

    def rank_offset_wells(self, candidates: list[dict]) -> pd.DataFrame:
        """
        candidates: list of dicts, each containing keys needed by score_offset_well()
        Returns DataFrame sorted descending by composite_score.
        IMPORTANT: incident counts are NOT part of scoring (spec §1).
        """
        d_max = max(c.get("d_g", 1) for c in candidates) or 1.0
        z_max = max(c.get("delta_z", 1) for c in candidates) or 1.0

        rows = []
        for c in candidates:
            s = self.score_offset_well(
                d_g=c.get("d_g", 0),
                d_max=d_max,
                active_formation_seq=c.get("active_formation_seq", []),
                offset_formation_seq=c.get("offset_formation_seq", []),
                delta_z=c.get("delta_z", 0),
                z_max=z_max,
                offset_trajectory=c.get("trajectory", "Vertical"),
                active_bit_in=c.get("active_bit_in", 12.25),
                offset_bit_in=c.get("offset_bit_in", 12.25),
                offset_data_type=c.get("data_type", "LAS_Standard"),
            )
            s["wellbore_id"] = c.get("wellbore_id", "UNKNOWN")
            s["well_name"]   = c.get("well_name", "?")
            rows.append(s)

        df = pd.DataFrame(rows).sort_values("composite_score", ascending=False).reset_index(drop=True)
        df.index += 1
        df.index.name = "rank"
        return df

    # ── Weight calibration (Ridge regression on past engineer decisions) ─────

    def calibrate_weights(self, X_features: np.ndarray, y_engineer_rank: np.ndarray) -> dict:
        """
        Tune weights to best replicate historical engineer selection decisions.

        Parameters
        ----------
        X_features : shape (n, 6) — already computed f1..f6 per candidate
        y_engineer_rank : shape (n,) — normalised rank assigned by engineer (0–1, 1=best)

        Returns calibrated weight dict.
        """
        scaler = MinMaxScaler()
        X_s = scaler.fit_transform(X_features)

        # Force non-negative weights that sum to 1 (projected Ridge)
        ridge = Ridge(alpha=1.0, positive=True, fit_intercept=False)
        ridge.fit(X_s, y_engineer_rank)

        raw_w = ridge.coef_
        normalised_w = raw_w / raw_w.sum()

        keys = list(DEFAULT_WEIGHTS.keys())
        calibrated = {k: float(round(v, 4)) for k, v in zip(keys, normalised_w)}

        # Cross-validation score
        cv_r2 = cross_val_score(Ridge(alpha=1.0, positive=True, fit_intercept=False),
                                X_s, y_engineer_rank, cv=5, scoring="r2")
        print(f"[Model1] Weight calibration R²: {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")

        # Save
        out = {"weights": calibrated, "cv_r2_mean": float(cv_r2.mean())}
        with open(MODEL_DIR / "model1_weights.json", "w") as f:
            json.dump(out, f, indent=2)
        print(f"[Model1] Calibrated weights saved → {MODEL_DIR / 'model1_weights.json'}")
        return calibrated

    def save(self, path: Path = None):
        path = path or (MODEL_DIR / "model1_selector.pkl")
        joblib.dump(self, path)
        print(f"[Model1] Selector saved → {path}")

    @classmethod
    def load(cls, path: Path = None) -> "OffsetAnalogueSelector":
        path = path or (MODEL_DIR / "model1_selector.pkl")
        return joblib.load(path)


# ─────────────────────────────────────────────────────────────────────────────
# Demo & test harness
# ─────────────────────────────────────────────────────────────────────────────

def demo_ranking():
    selector = OffsetAnalogueSelector()

    candidates = [
        {"wellbore_id": "W-001", "well_name": "Forge-16A",
         "d_g": 120, "active_formation_seq": ["Shale_A", "Sand_B", "Lime_C"],
         "offset_formation_seq": ["Shale_A", "Sand_B", "Lime_C"],
         "delta_z": 50, "trajectory": "Directional",
         "active_bit_in": 12.25, "offset_bit_in": 12.25, "data_type": "LAS_HiRes"},

        {"wellbore_id": "W-002", "well_name": "Forge-78B",
         "d_g": 300, "active_formation_seq": ["Shale_A", "Sand_B", "Lime_C"],
         "offset_formation_seq": ["Shale_A", "Sand_X", "Evap_Y"],
         "delta_z": 200, "trajectory": "Vertical",
         "active_bit_in": 12.25, "offset_bit_in": 8.50, "data_type": "Mud_Log"},

        {"wellbore_id": "W-003", "well_name": "Nearby-03",
         "d_g": 80, "active_formation_seq": ["Shale_A", "Sand_B", "Lime_C"],
         "offset_formation_seq": ["Shale_A", "Sand_B", "Overpressure_D"],
         "delta_z": 30, "trajectory": "Directional",
         "active_bit_in": 12.25, "offset_bit_in": 12.25, "data_type": "LAS_Standard"},
    ]

    ranking = selector.rank_offset_wells(candidates)
    print("\n[Model1] Offset Well Ranking:")
    print(ranking.to_string())
    selector.save()
    return selector, ranking


if __name__ == "__main__":
    demo_ranking()
