"""
NWIS eRTMAC — FastAPI Model Serving Microservice
=================================================
Exposes all 4 NWIS models via REST endpoints for
real-time WITSML telemetry integration.

Endpoints:
  POST /v1/offset-rank          → Model 1: Rank offset candidates
  POST /v1/dfim-align           → Model 2: DTW formation alignment
  POST /v1/hazard-predict       → Model 3: Lookahead hazard probabilities
  POST /v1/anomaly-detect       → Model 4: Real-time anomaly detection
  GET  /v1/rig-state            → Rig-state classification
  GET  /healthz                 → Health check

All inference is synchronous (< 10ms target for Models 1, 3, 4).
Model 2 DTW is async-capable for longer sequences.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator

# ── project paths ──────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).parent
MODEL_DIR    = PROJECT_ROOT / "models"

# ── lazy model loader ──────────────────────────────────────────────────────
_MODELS: dict = {}

def _load_models():
    global _MODELS
    if _MODELS:
        return

    print("[API] Loading models …")

    # Model 1
    try:
        from models.model1_offset_selector import OffsetAnalogueSelector
        weights_path = MODEL_DIR / "model1_weights.json"
        if weights_path.exists():
            with open(weights_path) as f:
                w = json.load(f)["weights"]
            _MODELS["model1"] = OffsetAnalogueSelector(weights=w)
        else:
            _MODELS["model1"] = OffsetAnalogueSelector()
        print("  ✓ Model 1")
    except Exception as e:
        print(f"  ✗ Model 1: {e}")

    # Model 2
    try:
        from models.model2_dfim import DFIMEngine
        _MODELS["model2"] = DFIMEngine.load()
        print("  ✓ Model 2")
    except Exception as e:
        print(f"  ✗ Model 2: {e}")

    # Model 3 — load per-class models
    try:
        _MODELS["model3"] = {}
        thresholds_path = MODEL_DIR / "model3_thresholds.json"
        thresholds = {}
        if thresholds_path.exists():
            with open(thresholds_path) as f:
                thresholds = json.load(f)

        HAZARD_CLASSES = [
            "Lost_Circulation", "Stuck_Pipe", "Overpressure_Zone",
            "Gas_Kick", "Torque_Spike", "Cementing_Issue",
        ]
        for hc in HAZARD_CLASSES:
            p = MODEL_DIR / f"model3_{hc}.pkl"
            if p.exists():
                _MODELS["model3"][hc] = {
                    "model": joblib.load(p),
                    "threshold": thresholds.get(hc, 0.5),
                }
        _MODELS["model3_tier_a"] = joblib.load(MODEL_DIR / "model3_tier_a.pkl") \
            if (MODEL_DIR / "model3_tier_a.pkl").exists() else None
        print(f"  ✓ Model 3 ({len(_MODELS['model3'])} classes)")
    except Exception as e:
        print(f"  ✗ Model 3: {e}")

    # Model 4
    try:
        from models.model4_anomaly_detector import TelemetryAnomalyDetector
        _MODELS["model4"] = TelemetryAnomalyDetector.load()
        print("  ✓ Model 4")
    except Exception as e:
        print(f"  ✗ Model 4: {e}")

    print("[API] Models loaded.")


# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(
    title="NWIS eRTMAC Analytics API",
    description="Real-Time ML Analytics for the Nearby Wells Intelligence System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    _load_models()


# ─────────────────────────────────────────────────────────────────────────────
# Pydantic schemas
# ─────────────────────────────────────────────────────────────────────────────

class OffsetCandidate(BaseModel):
    wellbore_id: str
    well_name: str = "Unknown"
    d_g: float = Field(..., ge=0, description="3D geographic distance (m)")
    active_formation_seq: list[str] = []
    offset_formation_seq: list[str] = []
    delta_z: float = Field(0, ge=0)
    trajectory: str = "Directional"
    active_bit_in: float = 12.25
    offset_bit_in: float = 12.25
    data_type: str = "LAS_Standard"


class OffsetRankRequest(BaseModel):
    candidates: list[OffsetCandidate]


class DFIMAlignRequest(BaseModel):
    wellbore_id: str
    formation_name: str
    depth_md: list[float]
    mse_mpa: list[float]
    dxc: list[float]
    gamma_ray_api: list[float]
    top_k: int = 3


class HazardPredictRequest(BaseModel):
    wellbore_id: str
    depth_md: float
    rop_mhr: float = 0.0
    wob_tonnes: float = 0.0
    torque_knm: float = 0.0
    rpm: float = 0.0
    spp_psi: float = 0.0
    mud_weight_sg: float = 1.10
    flow_in_lpm: float = 2500.0
    flow_out_pct: float = 98.0
    gamma_ray_api: float = 50.0
    total_gas_pct: float = 0.0
    c1_ppm: float = 0.0
    mse_mpa: float = 0.0
    dxc: float = 1.0
    pore_pressure_margin_sg: float = 0.10
    casing_shoe_clearance_m: float = 500.0
    shoe_lot_fit_margin_sg: float = 0.30
    bit_to_casing_clearance_ratio: float = 1.27
    lith_sand: int = 0
    lith_shale: int = 1
    lith_lime: int = 0
    lith_salt: int = 0
    depth_tvdss: float = 0.0


class AnomalyDetectRequest(BaseModel):
    wellbore_id: str
    depth_md: float
    rop_mhr: float = 0.0
    rpm: float = 100.0
    flow_in_lpm: float = 2500.0
    flow_out_pct: float = 98.0
    pit_volume_m3: float = 80.0
    torque_knm: float = 10.0
    spp_psi: float = 2000.0
    # Pre-computed residuals (optional — computed server-side if not provided)
    delta_flow: Optional[float] = None
    delta_pit: Optional[float] = None
    delta_torque: Optional[float] = None
    delta_spp: Optional[float] = None
    rig_state: Optional[str] = None


class RigStateRequest(BaseModel):
    bit_depth_md: float
    hole_depth_md: float
    hookload_tonnes: float = 100.0
    block_height_delta: float = 0.0
    rpm: float = 0.0
    flow_in_lpm: float = 0.0
    rop_mhr: float = 0.0


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/healthz")
def health_check():
    loaded = list(_MODELS.keys())
    return {"status": "ok", "models_loaded": loaded, "timestamp": pd.Timestamp.now().isoformat()}


@app.get("/v1/rig-state")
def rig_state(req: RigStateRequest):
    from models.model4_anomaly_detector import classify_rig_state
    state = classify_rig_state(
        bit_depth=req.bit_depth_md,
        hole_depth=req.hole_depth_md,
        hookload=req.hookload_tonnes,
        block_height_delta=req.block_height_delta,
        rpm=req.rpm,
        flow_in=req.flow_in_lpm,
        rop=req.rop_mhr,
    )
    return {"rig_state": state, "is_drilling": state in {"DRILLING_ROTARY", "DRILLING_SLIDE"}}


@app.post("/v1/offset-rank")
def offset_rank(req: OffsetRankRequest):
    t0 = time.perf_counter()
    model = _MODELS.get("model1")
    if model is None:
        raise HTTPException(503, "Model 1 not loaded")

    candidates = [c.dict() for c in req.candidates]
    ranking_df = model.rank_offset_wells(candidates)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return {
        "ranking": ranking_df.reset_index().to_dict(orient="records"),
        "inference_ms": round(elapsed_ms, 2),
    }


@app.post("/v1/dfim-align")
def dfim_align(req: DFIMAlignRequest):
    t0 = time.perf_counter()
    model = _MODELS.get("model2")
    if model is None:
        raise HTTPException(503, "Model 2 not loaded")

    seq_df = pd.DataFrame({
        "depth_md":      req.depth_md,
        "mse_mpa":       req.mse_mpa,
        "dxc":           req.dxc,
        "gamma_ray_api": req.gamma_ray_api,
    })

    results = model.align(seq_df, req.formation_name, top_k=req.top_k)
    elapsed_ms = (time.perf_counter() - t0) * 1000

    return {
        "formation_name": req.formation_name,
        "top_matches":    results,
        "inference_ms":   round(elapsed_ms, 2),
    }


@app.post("/v1/hazard-predict")
def hazard_predict(req: HazardPredictRequest):
    t0 = time.perf_counter()
    model3 = _MODELS.get("model3", {})
    tier_a = _MODELS.get("model3_tier_a")

    if not model3 and tier_a is None:
        raise HTTPException(503, "Model 3 not loaded")

    FEATURE_COLS = [
        "rop_mhr", "wob_tonnes", "torque_knm", "rpm", "spp_psi",
        "mud_weight_sg", "flow_in_lpm", "flow_out_pct", "gamma_ray_api",
        "total_gas_pct", "c1_ppm", "mse_mpa", "dxc",
        "rop_mhr_roll5_mean", "torque_knm_roll5_mean", "mse_mpa_roll5_mean",
        "gamma_ray_api_roll5_mean", "spp_psi_roll5_mean",
        "rop_mhr_roll5_std", "torque_knm_roll5_std",
        "pore_pressure_margin_sg", "casing_shoe_clearance_m",
        "shoe_lot_fit_margin_sg", "bit_to_casing_clearance_ratio",
        "lith_sand", "lith_shale", "lith_lime", "lith_salt",
        "hist_density_Lost_Circulation", "hist_density_Stuck_Pipe",
        "hist_density_Overpressure_Zone", "hist_density_Gas_Kick",
        "hist_density_Torque_Spike", "hist_density_Cementing_Issue",
        "depth_md", "depth_tvdss",
    ]

    req_dict = req.dict()
    # Fill rolling/density features with neutrals for single-point inference
    feature_vec = {}
    for col in FEATURE_COLS:
        if col in req_dict:
            feature_vec[col] = req_dict[col]
        elif col.endswith("_roll5_mean"):
            base = col.replace("_roll5_mean", "")
            feature_vec[col] = req_dict.get(base, 0.0)
        elif col.endswith("_roll5_std"):
            feature_vec[col] = 0.0
        else:
            feature_vec[col] = 0.0

    X = np.array([[feature_vec.get(c, 0.0) for c in FEATURE_COLS]], dtype=np.float32)

    predictions = {}
    for hc, entry in model3.items():
        try:
            prob_ml  = float(entry["model"].predict_proba(X)[0, 1])
            thr      = entry["threshold"]
            prob_emp = float(tier_a.predict_proba(req.depth_md, req.wellbore_id, hc)) \
                       if tier_a else prob_ml

            # Blend: 70% ML + 30% empirical
            prob_final = 0.70 * prob_ml + 0.30 * prob_emp
            predictions[hc] = {
                "probability":  round(prob_final, 4),
                "alert":        prob_final >= thr,
                "threshold":    round(thr, 4),
                "prob_ml":      round(prob_ml, 4),
                "prob_empirical": round(prob_emp, 4),
            }
        except Exception as e:
            predictions[hc] = {"error": str(e)}

    elapsed_ms = (time.perf_counter() - t0) * 1000
    return {
        "wellbore_id": req.wellbore_id,
        "depth_md":    req.depth_md,
        "predictions": predictions,
        "inference_ms": round(elapsed_ms, 2),
    }


@app.post("/v1/anomaly-detect")
def anomaly_detect(req: AnomalyDetectRequest):
    t0 = time.perf_counter()
    model = _MODELS.get("model4")
    if model is None:
        raise HTTPException(503, "Model 4 not loaded")

    from models.model4_anomaly_detector import classify_rig_state, DRILLING_STATES

    rig_state = req.rig_state or classify_rig_state(
        bit_depth=req.depth_md, hole_depth=req.depth_md,
        hookload=100.0, block_height_delta=0.5 if req.rop_mhr > 2 else 0.0,
        rpm=req.rpm, flow_in=req.flow_in_lpm, rop=req.rop_mhr,
    )

    is_drilling = rig_state in DRILLING_STATES

    if not is_drilling:
        return {
            "wellbore_id": req.wellbore_id,
            "depth_md":    req.depth_md,
            "rig_state":   rig_state,
            "gated":       True,
            "anomaly":     False,
            "anomaly_score": None,
            "inference_ms": round((time.perf_counter() - t0) * 1000, 2),
        }

    # Compute residuals if not provided
    delta_flow   = req.delta_flow   if req.delta_flow   is not None else (req.flow_out_pct - 100.0)
    delta_pit    = req.delta_pit    if req.delta_pit    is not None else 0.0
    delta_torque = req.delta_torque if req.delta_torque is not None else 0.0
    delta_spp    = req.delta_spp    if req.delta_spp    is not None else 0.0

    X_raw = np.array([[delta_flow, delta_pit, delta_torque, delta_spp]])
    X_scaled = model.scaler.transform(X_raw)
    score = float(-model.iforest.score_samples(X_scaled)[0])
    anomaly = score >= model.threshold_score

    elapsed_ms = (time.perf_counter() - t0) * 1000
    return {
        "wellbore_id":   req.wellbore_id,
        "depth_md":      req.depth_md,
        "rig_state":     rig_state,
        "gated":         False,
        "anomaly":       bool(anomaly),
        "anomaly_score": round(score, 4),
        "threshold":     round(model.threshold_score, 4),
        "residuals": {
            "delta_flow":   round(delta_flow, 3),
            "delta_pit":    round(delta_pit, 3),
            "delta_torque": round(delta_torque, 3),
            "delta_spp":    round(delta_spp, 3),
        },
        "inference_ms": round(elapsed_ms, 2),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Dev server
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("serve:app", host="0.0.0.0", port=8001, reload=True)
