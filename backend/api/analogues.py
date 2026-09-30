"""
Model 1 — Pre-Drilling Offset Analogue Selector API (/api/analogues)
5-Factor weighted similarity scoring against historical wellbore data.
"""
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.db.models import Well, WelborePath

router = APIRouter()


# ── Model 1 scoring weights (configurable via request) ──────────────────────

DEFAULT_WEIGHTS = {
    "geo":     0.25,  # Geographic/3D subsurface distance
    "strat":   0.35,  # Geological stratigraphy match
    "depth":   0.15,  # TVDSS target depth delta
    "profile": 0.15,  # Well profile match
    "size":    0.10,  # Hole diameter match
}

D_MAX = 25_000.0   # Normalisation constant — max distance in meters
Z_MAX = 5_000.0    # Normalisation constant — max depth delta in meters

PROFILE_SCORE = {
    "Vertical":     1.0,
    "Directional":  0.8,
    "Horizontal":   0.5,
}


def _haversine_m(lat1, lon1, lat2, lon2) -> float:
    """Surface distance between two lat/lon points in meters."""
    R = 6_371_000
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _compute_similarity(
    target_wb: dict,
    candidate_wb: dict,
    weights: dict,
) -> dict:
    """
    Model 1 similarity formula (Section 4 of spec):
    Score = w_geo * (1 - d/D_max) + w_strat * S_geo + w_depth * (1 - Δz/Z_max)
            + w_profile * T_well + w_size * C_drill
    """
    # Geographic distance component (surface approx via haversine)
    dist_m = _haversine_m(
        target_wb["lat"], target_wb["lon"],
        candidate_wb["lat"], candidate_wb["lon"],
    )
    geo_score = max(0.0, 1.0 - dist_m / D_MAX)

    # Stratigraphic match — naive overlap of known_drilling_hazards as proxy
    # (production: compare formation top sequences)
    target_hazards = set(target_wb.get("hazards", []))
    cand_hazards = set(candidate_wb.get("hazards", []))
    if target_hazards or cand_hazards:
        strat_score = len(target_hazards & cand_hazards) / max(len(target_hazards | cand_hazards), 1)
    else:
        strat_score = 0.5  # No hazard data — neutral

    # Depth delta component
    depth_delta_m = abs(target_wb["tvdss"] - candidate_wb["tvdss"])
    depth_score = max(0.0, 1.0 - depth_delta_m / Z_MAX)

    # Well profile match
    target_profile = target_wb.get("well_type", "Vertical")
    cand_profile = candidate_wb.get("well_type", "Vertical")
    if target_profile == cand_profile:
        profile_score = 1.0
    else:
        # Partial credit if both are non-vertical
        profile_score = 0.6 if target_profile != "Vertical" and cand_profile != "Vertical" else 0.3

    # Hole diameter match
    target_dia = target_wb.get("hole_diameter_in", 12.25)
    cand_dia = candidate_wb.get("hole_diameter_in", 12.25)
    size_score = 1.0 - abs(target_dia - cand_dia) / max(target_dia, 1.0)
    size_score = max(0.0, size_score)

    total = (
        weights["geo"]     * geo_score
        + weights["strat"]   * strat_score
        + weights["depth"]   * depth_score
        + weights["profile"] * profile_score
        + weights["size"]    * size_score
    )

    return {
        "similarity_score":   round(total * 100, 1),
        "breakdown": {
            "geo":     round(geo_score * 100, 1),
            "strat":   round(strat_score * 100, 1),
            "depth":   round(depth_score * 100, 1),
            "profile": round(profile_score * 100, 1),
            "size":    round(size_score * 100, 1),
        },
        "distance_km": round(dist_m / 1000, 2),
        "depth_delta_m": round(depth_delta_m, 1),
    }


@router.get("/")
async def get_analogues(
    target_wellbore_id: Optional[str] = Query(None, description="Target wellbore ID"),
    w_geo: float     = Query(0.25, ge=0, le=1, description="Geographic distance weight"),
    w_strat: float   = Query(0.35, ge=0, le=1, description="Stratigraphy weight"),
    w_depth: float   = Query(0.15, ge=0, le=1, description="Depth delta weight"),
    w_profile: float = Query(0.15, ge=0, le=1, description="Profile match weight"),
    w_size: float    = Query(0.10, ge=0, le=1, description="Hole size weight"),
    top_n: int       = Query(10, ge=1, le=50, description="Number of top analogues to return"),
    db: AsyncSession = Depends(get_db),
):
    """
    Model 1: Ranks top-N historical offset wells by weighted similarity score.
    Weights must approximately sum to 1.0 (normalised internally if not).
    """
    weights = {"geo": w_geo, "strat": w_strat, "depth": w_depth, "profile": w_profile, "size": w_size}
    total_w = sum(weights.values())
    if total_w > 0:
        weights = {k: v / total_w for k, v in weights.items()}

    # Load all wells and wellbores
    result = await db.execute(select(Well))
    all_wells = result.scalars().all()

    wb_result = await db.execute(select(WelborePath))
    all_wbs = wb_result.scalars().all()
    wb_map = {wb.wellbore_id: wb for wb in all_wbs}
    well_map = {w.well_id: w for w in all_wells}

    # Identify target wellbore
    target_wb_orm = None
    if target_wellbore_id:
        target_wb_orm = wb_map.get(target_wellbore_id)
    if not target_wb_orm:
        # Default to the first active / deepest well
        target_wb_orm = max(all_wbs, key=lambda w: w.total_depth_tvdss, default=None)

    if not target_wb_orm:
        return {"analogues": [], "message": "No wells in database"}

    target_well_orm = well_map.get(target_wb_orm.well_id)
    target_wb_dict = {
        "wellbore_id": target_wb_orm.wellbore_id,
        "lat": target_well_orm.latitude,
        "lon": target_well_orm.longitude,
        "tvdss": target_wb_orm.total_depth_tvdss,
        "well_type": target_wb_orm.well_type,
        "hole_diameter_in": target_wb_orm.hole_diameter_in,
        "hazards": [],  # TODO: join formation hazards
    }

    results = []
    for wb in all_wbs:
        if wb.wellbore_id == target_wb_orm.wellbore_id:
            continue  # Skip self
        w = well_map.get(wb.well_id)
        if not w:
            continue

        cand_dict = {
            "wellbore_id": wb.wellbore_id,
            "lat": w.latitude,
            "lon": w.longitude,
            "tvdss": wb.total_depth_tvdss,
            "well_type": wb.well_type,
            "hole_diameter_in": wb.hole_diameter_in,
            "hazards": [],
        }

        scores = _compute_similarity(target_wb_dict, cand_dict, weights)
        results.append({
            "well_name": w.well_name,
            "field_name": w.field_name,
            "wellbore_id": wb.wellbore_id,
            "wellbore_name": wb.wellbore_name,
            "total_depth_tvdss": wb.total_depth_tvdss,
            **scores,
        })

    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    ranked = [{"rank": i + 1, **r} for i, r in enumerate(results[:top_n])]

    return {
        "target_wellbore_id": target_wb_orm.wellbore_id,
        "target_well_name": target_well_orm.well_name if target_well_orm else "Unknown",
        "weights_used": weights,
        "analogues": ranked,
        "model": "Model_1_5Factor_Deterministic",
    }
