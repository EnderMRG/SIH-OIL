"""
Pore Pressure & Deterministic What-If Console API
Returns Eaton pore pressure curves and physics-based ECD calculations.
"""
import math
from fastapi import APIRouter, Query

router = APIRouter()


def _eaton_pore_pressure(tvdss: float, normal_gradient_sg: float = 1.074, dc_exp_ratio: float = 1.0) -> float:
    """Eaton (1975) pore pressure estimation — simplified for mock data."""
    return round(normal_gradient_sg * (dc_exp_ratio ** 1.2), 3)


def _ecd(mud_weight_sg: float, annular_pressure_loss_psi: float, tvdss: float) -> float:
    """ECD = MW + (annular loss / (0.052 * TVD_ft))"""
    tvd_ft = tvdss * 3.28084
    if tvd_ft == 0:
        return mud_weight_sg
    return round(mud_weight_sg + (annular_pressure_loss_psi / (0.052 * tvd_ft)), 3)


def _fracture_gradient(tvdss: float) -> float:
    """Simple depth-dependent fracture gradient (mock)."""
    if tvdss < 600:
        return 1.55
    elif tvdss < 1600:
        return 1.62
    elif tvdss < 2600:
        return 1.68
    return 1.72


@router.get("/curves")
async def get_pressure_curves(
    wellbore_id: str = Query(None),
    depth_from: float = Query(0.0),
    depth_to: float = Query(3200.0),
    step_m: float = Query(50.0),
):
    """Return depth-indexed pore pressure, fracture gradient, and planned mud weight curves."""
    depths = []
    d = depth_from
    while d <= depth_to:
        pp = _eaton_pore_pressure(d)
        fg = _fracture_gradient(d)
        # Planned mud weight stays between PP + 0.05 and FG - 0.08
        planned_mw = round(min(pp + 0.07 + d / 50000, fg - 0.08), 3)
        depths.append({
            "tvdss": round(d, 1),
            "pore_pressure_sg": pp,
            "fracture_gradient_sg": fg,
            "planned_mud_weight_sg": planned_mw,
            "ecd_sg": _ecd(planned_mw, 120, d) if d > 0 else planned_mw,
        })
        d += step_m

    return {"curves": depths}


@router.get("/whats-if")
async def compute_what_if(
    test_mud_weight_sg: float = Query(1.15, ge=1.0, le=2.0),
    rop_mhr: float = Query(8.0),
    flow_rate_lpm: float = Query(2200.0),
    current_tvdss: float = Query(2850.0),
    casing_shoe_tvdss: float = Query(1800.0),
    lot_emw_sg: float = Query(1.58),
):
    """
    Physics-based What-If Sandbox (deterministic — no ML).
    Computes ECD, kick tolerance, and shoe clearance margin.
    """
    tvd_ft = current_tvdss * 3.28084
    shoe_tvd_ft = casing_shoe_tvdss * 3.28084

    # Annular pressure loss (simplified Burkhardt correlation — mock)
    annular_loss_psi = round((flow_rate_lpm / 1000) * 12.5 * (current_tvdss / 1000), 1)

    ecd = _ecd(test_mud_weight_sg, annular_loss_psi, current_tvdss)
    fg = _fracture_gradient(current_tvdss)
    pp = _eaton_pore_pressure(current_tvdss)
    shoe_fg = _fracture_gradient(casing_shoe_tvdss)

    # Kick tolerance (simplified)
    kick_tolerance_m3 = round(max(0, (lot_emw_sg - ecd) * casing_shoe_tvdss * 0.015), 2)

    # Shoe clearance
    shoe_clearance_sg = round(shoe_fg - ecd, 3)
    shoe_ok = shoe_clearance_sg > 0.05

    # ECD margin to fracture
    ecd_to_frac_margin = round(fg - ecd, 3)

    risk_flags = []
    if ecd >= fg:
        risk_flags.append({"flag": "ECD_EXCEEDS_FRACTURE_GRADIENT", "severity": "Critical"})
    elif ecd_to_frac_margin < 0.05:
        risk_flags.append({"flag": "ECD_NEAR_FRACTURE_GRADIENT", "severity": "Warning"})
    if test_mud_weight_sg < pp:
        risk_flags.append({"flag": "UNDERBALANCED_DRILLING", "severity": "Critical"})
    if not shoe_ok:
        risk_flags.append({"flag": "CASING_SHOE_INTEGRITY_BREACH", "severity": "Critical"})

    return {
        "inputs": {
            "test_mud_weight_sg": test_mud_weight_sg,
            "rop_mhr": rop_mhr,
            "flow_rate_lpm": flow_rate_lpm,
            "current_tvdss": current_tvdss,
        },
        "computed": {
            "ecd_sg": ecd,
            "annular_pressure_loss_psi": annular_loss_psi,
            "ecd_to_fracture_margin_sg": ecd_to_frac_margin,
            "pore_pressure_sg": pp,
            "fracture_gradient_sg": fg,
            "casing_shoe_clearance_sg": shoe_clearance_sg,
            "kick_tolerance_m3": kick_tolerance_m3,
        },
        "risk_flags": risk_flags,
        "verdict": "SAFE" if not risk_flags else ("WARNING" if all(f["severity"] == "Warning" for f in risk_flags) else "CRITICAL"),
    }
