"""
NWIS Database Init & Seeder — Creates all tables and seeds demo data.
Run once: python -m backend.db.init_db
"""
import asyncio
import json
from datetime import datetime, timedelta
import random

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from backend.db.models import (
    Base, Well, WelborePath, FormationCatalog,
    WelboreCasing, EventLedger, AlarmHistory
)

DATABASE_URL = "sqlite+aiosqlite:///./nwis.db"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables created")


async def seed_data():
    async with AsyncSessionLocal() as session:
        # ---- Formations ----
        formations = [
            FormationCatalog(formation_name="Girujan Clay", top_depth_tvdss=0, base_depth_tvdss=600,
                             typical_pore_pressure_sg=1.05, fracture_gradient_sg=1.55,
                             lithology_type="Clay", known_drilling_hazards=["Stuck_Pipe"]),
            FormationCatalog(formation_name="Tipam Sandstone", top_depth_tvdss=600, base_depth_tvdss=1600,
                             typical_pore_pressure_sg=1.07, fracture_gradient_sg=1.62,
                             lithology_type="Sandstone", known_drilling_hazards=["Lost_Circulation"]),
            FormationCatalog(formation_name="Barail Group", top_depth_tvdss=1600, base_depth_tvdss=2600,
                             typical_pore_pressure_sg=1.12, fracture_gradient_sg=1.68,
                             lithology_type="Shale/Sandstone", known_drilling_hazards=["Gas_Kick", "Overpressure_Zone"]),
            FormationCatalog(formation_name="Kopili Shale", top_depth_tvdss=2600, base_depth_tvdss=3500,
                             typical_pore_pressure_sg=1.18, fracture_gradient_sg=1.72,
                             lithology_type="Shale", known_drilling_hazards=["Overpressure_Zone", "Stuck_Pipe", "Gas_Kick"]),
        ]
        session.add_all(formations)
        await session.flush()

        # ---- Active Well (the rig being drilled) ----
        active_well = Well(
            well_name="NH-12 (Active)", field_name="Naharkatiya",
            latitude=27.1234, longitude=95.3456
        )
        session.add(active_well)
        await session.flush()

        def _make_trajectory(start_lat, start_lon, total_depth, deviation_factor=0.0):
            pts = []
            for i in range(0, int(total_depth) + 1, 10):
                pts.append({
                    "md": float(i), "tvdss": float(i) * 0.98,
                    "northing": start_lat * 111000 + i * deviation_factor * 0.1,
                    "easting": start_lon * 111000 + i * deviation_factor * 0.05
                })
            return pts

        active_wb = WelborePath(
            well_id=active_well.well_id, wellbore_name="NH-12-WB01",
            kb_elevation_m=92.5, survey_datum="KB",
            trajectory_json=_make_trajectory(27.1234, 95.3456, 3200),
            total_depth_tvdss=3200, well_type="Directional", hole_diameter_in=8.5
        )
        session.add(active_wb)
        await session.flush()

        # Casing for active well
        casings = [
            WelboreCasing(wellbore_id=active_wb.wellbore_id, casing_type="Surface",
                          shoe_depth_tvdss=380, outer_diameter_in=13.375, lot_fit_emw_sg=1.48),
            WelboreCasing(wellbore_id=active_wb.wellbore_id, casing_type="Intermediate",
                          shoe_depth_tvdss=1800, outer_diameter_in=9.625, lot_fit_emw_sg=1.58),
        ]
        session.add_all(casings)

        # ---- Offset Wells (3 historical wells) ----
        offset_data = [
            {"name": "NH-04", "lat": 27.1180, "lon": 95.3410, "td": 3100, "dev": 0.8},
            {"name": "NH-07", "lat": 27.1290, "lon": 95.3510, "td": 2950, "dev": 1.2},
            {"name": "NH-09", "lat": 27.1150, "lon": 95.3560, "td": 3300, "dev": 0.5},
        ]

        event_types = ["Lost_Circulation", "Stuck_Pipe", "Overpressure_Zone", "Gas_Kick", "Torque_Spike"]
        severities = ["Minor", "Moderate", "Severe"]
        outcomes = ["Successful", "Partial", "Failed"]
        remediations = [
            "Spotted 40 ppb CaCO3 pill at loss zone",
            "Worked pipe and applied overpull; pumped 50 bbl weighted spotting fluid",
            "Increased mud weight by 0.05 SG, monitored gas trends for 2 hrs",
            "Pumped 20 bbl 16-ppg weighted plug to kill influx",
            "Reduced RPM to 80, applied torque limit alarm at 18 kN·m",
        ]

        for od in offset_data:
            w = Well(well_name=od["name"], field_name="Naharkatiya",
                     latitude=od["lat"], longitude=od["lon"])
            session.add(w)
            await session.flush()

            wb = WelborePath(
                well_id=w.well_id, wellbore_name=f"{od['name']}-WB01",
                kb_elevation_m=90.0, trajectory_json=_make_trajectory(od["lat"], od["lon"], od["td"], od["dev"]),
                total_depth_tvdss=od["td"], well_type="Directional", hole_diameter_in=8.5
            )
            session.add(wb)
            await session.flush()

            # Seed 3-5 historical events per offset well
            for _ in range(random.randint(3, 5)):
                d = random.uniform(800, od["td"] - 100)
                session.add(EventLedger(
                    wellbore_id=wb.wellbore_id,
                    event_type=random.choice(event_types),
                    start_depth_tvdss=round(d, 1),
                    end_depth_tvdss=round(d + random.uniform(10, 80), 1),
                    severity=random.choice(severities),
                    remediation_applied=random.choice(remediations),
                    mitigation_outcome=random.choice(outcomes),
                    npt_hours_saved=round(random.uniform(0, 24), 1),
                    source_document_name=f"DDR_{od['name']}_2022.pdf",
                    source_page_number=random.randint(1, 120),
                    validation_status="Approved",
                ))

        await session.commit()
        print("[OK] Demo data seeded")


if __name__ == "__main__":
    asyncio.run(init_db())
    asyncio.run(seed_data())
