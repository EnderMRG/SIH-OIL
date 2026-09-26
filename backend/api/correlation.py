"""
Subsurface Correlation Curtain API
Returns mock formation alignment and depth-synchronized log tracks.
"""
from fastapi import APIRouter, Query
from typing import List, Optional
import math, random

router = APIRouter()


def _mock_gamma_ray(tvdss: float) -> float:
    """Simulate GR log variation with depth."""
    base = 40 if tvdss < 600 else (65 if tvdss < 1600 else (85 if tvdss < 2600 else 110))
    return round(base + 15 * math.sin(tvdss / 80) + random.uniform(-5, 5), 1)


def _mock_mse(tvdss: float, rop: float = 8.0) -> float:
    """Approximate MSE value."""
    wob = 15 + 5 * math.sin(tvdss / 120)
    torque = 8 + 3 * math.cos(tvdss / 90)
    rpm = 120
    bit_area = math.pi * (0.108 ** 2)  # 8.5 inch bit in m²
    rop_mps = rop / 3600
    mse = (wob / bit_area) + (120 * math.pi * rpm * torque) / (bit_area * rop)
    return round(min(mse / 1000, 350), 1)  # in MPa


@router.get("/tracks")
async def get_correlation_tracks(
    active_wellbore_id: Optional[str] = Query(None),
    offset_wellbore_ids: Optional[str] = Query(None, description="Comma-separated wellbore IDs"),
    depth_from: float = Query(1500.0),
    depth_to: float = Query(3200.0),
    step_m: float = Query(10.0),
):
    """
    Returns depth-synchronized log tracks for the active well and up to 3 offset wells.
    Model 2 (DFIM) alignment is mocked here; in production this runs DTW via dtaidistance.
    """
    depths = []
    d = depth_from
    while d <= depth_to:
        depths.append(d)
        d += step_m

    def _track(depth_offset: float = 0.0, noise: float = 1.0):
        return [
            {
                "tvdss": round(d, 1),
                "gamma_ray_api": _mock_gamma_ray(d + depth_offset) * noise,
                "mse_mpa": _mock_mse(d + depth_offset),
            }
            for d in depths
        ]

    formation_tops = [
        {"formation_name": "Girujan Clay", "top_tvdss": 0, "base_tvdss": 600, "color": "#6B7280"},
        {"formation_name": "Tipam Sandstone", "top_tvdss": 600, "base_tvdss": 1600, "color": "#F59E0B"},
        {"formation_name": "Barail Group", "top_tvdss": 1600, "base_tvdss": 2600, "color": "#10B981"},
        {"formation_name": "Kopili Shale", "top_tvdss": 2600, "base_tvdss": 3500, "color": "#EF4444"},
    ]

    incident_flags = [
        {"tvdss": 2310.5, "event_type": "Lost_Circulation", "severity": "Severe", "wellbore": "Offset-1"},
        {"tvdss": 2540.0, "event_type": "Gas_Kick", "severity": "Moderate", "wellbore": "Offset-2"},
        {"tvdss": 1820.0, "event_type": "Stuck_Pipe", "severity": "Severe", "wellbore": "Offset-1"},
    ]

    return {
        "depth_range": {"from": depth_from, "to": depth_to, "step": step_m},
        "active_track": _track(0, 1.0),
        "offset_tracks": [
            {"label": "Offset-1 (NH-04)", "track": _track(15, 0.95)},
            {"label": "Offset-2 (NH-07)", "track": _track(-10, 1.05)},
        ],
        "formation_tops": formation_tops,
        "incident_flags": incident_flags,
        "dfim_status": "mock",  # In production: "dtw_aligned"
    }
