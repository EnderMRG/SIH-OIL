"""
Lookahead Advisory API — Mock ML inference for 6 SIH hazard classes.
Returns risk probability scores and historical incident citations.
"""
import random
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()

HAZARD_CLASSES = [
    "Lost_Circulation",
    "Stuck_Pipe",
    "Overpressure_Zone",
    "Gas_Kick",
    "Torque_Spike",
    "Cementing_Issue",
]

MOCK_REMEDIATIONS = {
    "Lost_Circulation": ("40 ppb CaCO3 LCM pill spotted across loss zone", "Successful"),
    "Stuck_Pipe": ("50 bbl weighted spotting fluid + 30 min soak, overpull applied", "Successful"),
    "Overpressure_Zone": ("Mud weight increased 0.05 SG; gas trend monitored for 2 hrs", "Partial"),
    "Gas_Kick": ("Pumped 20 bbl 16-ppg weighted plug, Well shut-in 45 min", "Successful"),
    "Torque_Spike": ("Reduced RPM to 80, torque limit alarm set at 18 kN·m, circulated clean", "Successful"),
    "Cementing_Issue": ("Squeeze cement job performed, TOC confirmed by temperature log", "Partial"),
}

MOCK_CITATIONS = {
    "Lost_Circulation": ("NH-04 Completion Report", 42),
    "Stuck_Pipe": ("NH-07 DDR – Shift Report 2022-03-14", 88),
    "Overpressure_Zone": ("NH-09 Completion Report", 31),
    "Gas_Kick": ("NH-04 DDR – Shift Report 2022-05-02", 61),
    "Torque_Spike": ("NH-07 Completion Report", 55),
    "Cementing_Issue": ("NH-09 DDR – Shift Report 2022-07-19", 73),
}

ISA_PRIORITY = {
    "high": "Critical",
    "medium": "Warning",
    "low": "Advisory",
}


def _priority(prob: float) -> str:
    if prob >= 0.65:
        return "Critical"
    elif prob >= 0.40:
        return "Warning"
    return "Advisory"


@router.get("/lookahead")
async def get_lookahead_advisory(
    wellbore_id: Optional[str] = Query(None),
    current_tvdss: float = Query(2850.0, description="Current bit TVDSS depth in meters"),
    lookahead_m: float = Query(100.0, description="Lookahead window in meters"),
):
    """
    Model 3 (Mock): Returns risk probabilities for 6 hazard classes
    in the upcoming depth window [current_tvdss, current_tvdss + lookahead_m].
    """
    results = []
    for hazard in HAZARD_CLASSES:
        # Mock probability — in production this is XGBoost + Beta-prior
        prob = round(random.uniform(0.05, 0.88), 2)
        remediation, outcome = MOCK_REMEDIATIONS[hazard]
        doc_name, page_no = MOCK_CITATIONS[hazard]
        npt_saved = round(random.uniform(2.0, 36.0), 1)

        results.append({
            "hazard_class": hazard,
            "risk_probability": prob,
            "priority": _priority(prob),
            "depth_window_start_tvdss": current_tvdss,
            "depth_window_end_tvdss": current_tvdss + lookahead_m,
            "formation": _get_formation(current_tvdss),
            "historical_remediation": remediation,
            "mitigation_outcome": outcome,
            "npt_hours_saved": npt_saved,
            "source_citation": {
                "document": doc_name,
                "page": page_no,
            },
            # SHAP-style explanation (mock)
            "shap_drivers": [
                {"feature": "incident_density_per_m", "contribution": round(prob * 0.4, 3)},
                {"feature": "tvdss_delta_to_nearest_event", "contribution": round(prob * 0.25, 3)},
                {"feature": "mud_weight_vs_pp_margin_sg", "contribution": round(prob * 0.2, 3)},
            ],
        })

    # Sort by risk descending
    results.sort(key=lambda x: x["risk_probability"], reverse=True)
    return {"advisory": results, "source": "mock_tier_a_beta_prior"}


def _get_formation(tvdss: float) -> str:
    if tvdss < 600:
        return "Girujan Clay"
    elif tvdss < 1600:
        return "Tipam Sandstone"
    elif tvdss < 2600:
        return "Barail Group"
    return "Kopili Shale"


@router.get("/alarms")
async def get_active_alarms(wellbore_id: Optional[str] = Query(None)):
    """ISA-18.2 active alarm list (mock)."""
    alarms = [
        {
            "alarm_id": "ALM-001",
            "alarm_type": "Lost_Circulation",
            "priority": "Critical",
            "status": "Active",
            "triggered_at": "2026-09-20T17:45:00Z",
            "depth_tvdss": 2910.5,
            "message": "78% probability of partial mud loss in Barail Group. Historical event: NH-04 CR p.42.",
        },
        {
            "alarm_id": "ALM-002",
            "alarm_type": "Overpressure_Zone",
            "priority": "Warning",
            "status": "Acknowledged",
            "triggered_at": "2026-09-20T16:30:00Z",
            "depth_tvdss": 2880.0,
            "message": "d-exponent trending down — potential overpressure transition in next 30m.",
        },
    ]
    return {"alarms": alarms}
