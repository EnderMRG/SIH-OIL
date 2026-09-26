"""
Wells & Geospatial Map API — GET /api/wells
"""
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.db.models import Well, WelborePath, EventLedger

router = APIRouter()


def _haversine_km(lat1, lon1, lat2, lon2) -> float:
    """Approximate surface distance between two lat/lon points in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/")
async def list_wells(
    lat: Optional[float] = Query(None, description="Centre latitude"),
    lon: Optional[float] = Query(None, description="Centre longitude"),
    radius_km: float = Query(25.0, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Return all wells, optionally filtered by surface radius in km."""
    result = await db.execute(select(Well))
    wells = result.scalars().all()

    out = []
    for w in wells:
        dist = None
        if lat is not None and lon is not None:
            dist = _haversine_km(lat, lon, w.latitude, w.longitude)
            if dist > radius_km:
                continue
        out.append({
            "well_id": w.well_id,
            "well_name": w.well_name,
            "field_name": w.field_name,
            "latitude": w.latitude,
            "longitude": w.longitude,
            "distance_km": round(dist, 2) if dist is not None else None,
        })

    return {"wells": out, "count": len(out)}


@router.get("/{well_id}")
async def get_well_detail(well_id: str, db: AsyncSession = Depends(get_db)):
    """Return well + all wellbore trajectory + event count."""
    result = await db.execute(select(Well).where(Well.well_id == well_id))
    well = result.scalar_one_or_none()
    if not well:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Well not found")

    wb_result = await db.execute(select(WelborePath).where(WelborePath.well_id == well_id))
    wellbores = wb_result.scalars().all()

    out = {
        "well_id": well.well_id,
        "well_name": well.well_name,
        "field_name": well.field_name,
        "latitude": well.latitude,
        "longitude": well.longitude,
        "wellbores": [],
    }

    for wb in wellbores:
        ev_result = await db.execute(
            select(EventLedger).where(EventLedger.wellbore_id == wb.wellbore_id)
        )
        events = ev_result.scalars().all()

        out["wellbores"].append({
            "wellbore_id": wb.wellbore_id,
            "wellbore_name": wb.wellbore_name,
            "total_depth_tvdss": wb.total_depth_tvdss,
            "well_type": wb.well_type,
            "hole_diameter_in": wb.hole_diameter_in,
            "trajectory": wb.trajectory_json,
            "event_count": len(events),
            "events": [
                {
                    "event_id": e.event_id,
                    "event_type": e.event_type,
                    "start_depth_tvdss": e.start_depth_tvdss,
                    "end_depth_tvdss": e.end_depth_tvdss,
                    "severity": e.severity,
                    "remediation_applied": e.remediation_applied,
                    "mitigation_outcome": e.mitigation_outcome,
                    "npt_hours_saved": e.npt_hours_saved,
                    "source_document_name": e.source_document_name,
                    "source_page_number": e.source_page_number,
                }
                for e in events
            ],
        })

    return out


@router.get("/formations/catalog")
async def get_formations(db: AsyncSession = Depends(get_db)):
    """Return all OIL geological formations."""
    from backend.db.models import FormationCatalog
    result = await db.execute(select(FormationCatalog).order_by(FormationCatalog.top_depth_tvdss))
    formations = result.scalars().all()
    return {
        "formations": [
            {
                "formation_id": f.formation_id,
                "formation_name": f.formation_name,
                "top_depth_tvdss": f.top_depth_tvdss,
                "base_depth_tvdss": f.base_depth_tvdss,
                "typical_pore_pressure_sg": f.typical_pore_pressure_sg,
                "fracture_gradient_sg": f.fracture_gradient_sg,
                "lithology_type": f.lithology_type,
                "known_drilling_hazards": f.known_drilling_hazards,
            }
            for f in formations
        ]
    }
