"""
NWIS Database Models — SQLAlchemy ORM (SQLite via aiosqlite)
Spatial fields are stored as JSON/float since PostGIS is unavailable locally.
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, DateTime, Text, Boolean,
    JSON, ForeignKey, Enum
)
from sqlalchemy.orm import relationship, DeclarativeBase


class Base(DeclarativeBase):
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# 1. Well (Surface Pin)
# ---------------------------------------------------------------------------
class Well(Base):
    __tablename__ = "well"

    well_id = Column(String, primary_key=True, default=_uuid)
    well_name = Column(String(100), nullable=False)
    operator = Column(String(100), default="Oil India Limited")
    field_name = Column(String(100), nullable=False)
    country = Column(String(50), default="India")
    latitude = Column(Float, nullable=False)   # EPSG:4326 surface pin
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    wellbores = relationship("WelborePath", back_populates="well", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# 2. Wellbore 3D Trajectory
# ---------------------------------------------------------------------------
class WelborePath(Base):
    __tablename__ = "wellbore_path"

    wellbore_id = Column(String, primary_key=True, default=_uuid)
    well_id = Column(String, ForeignKey("well.well_id", ondelete="CASCADE"), nullable=False)
    wellbore_name = Column(String(100), nullable=False)
    kb_elevation_m = Column(Float, nullable=False)
    survey_datum = Column(String(10), default="KB")
    # Trajectory stored as JSON list of {md, tvdss, northing, easting} dicts
    trajectory_json = Column(JSON, nullable=False, default=list)
    total_depth_tvdss = Column(Float, nullable=False)
    well_type = Column(String(30), default="Vertical")    # Vertical, Directional, Horizontal
    hole_diameter_in = Column(Float, default=12.25)       # inches

    well = relationship("Well", back_populates="wellbores")
    casings = relationship("WelboreCasing", back_populates="wellbore", cascade="all, delete-orphan")
    events = relationship("EventLedger", back_populates="wellbore", cascade="all, delete-orphan")
    telemetry = relationship("Telemetry1Hz", back_populates="wellbore", cascade="all, delete-orphan")


# ---------------------------------------------------------------------------
# 3. Formation Catalog (OIL Geological Formations)
# ---------------------------------------------------------------------------
class FormationCatalog(Base):
    __tablename__ = "formation_catalog"

    formation_id = Column(String, primary_key=True, default=_uuid)
    formation_name = Column(String(100), nullable=False, unique=True)
    top_depth_tvdss = Column(Float, nullable=False)
    base_depth_tvdss = Column(Float, nullable=False)
    typical_pore_pressure_sg = Column(Float, nullable=False, default=1.07)
    fracture_gradient_sg = Column(Float, nullable=False, default=1.65)
    lithology_type = Column(String(100), nullable=False, default="Sandstone")
    known_drilling_hazards = Column(JSON, default=list)   # e.g. ["Lost_Circulation", "Stuck_Pipe"]


# ---------------------------------------------------------------------------
# 4. Wellbore Casing Records
# ---------------------------------------------------------------------------
class WelboreCasing(Base):
    __tablename__ = "wellbore_casing"

    casing_id = Column(String, primary_key=True, default=_uuid)
    wellbore_id = Column(String, ForeignKey("wellbore_path.wellbore_id", ondelete="CASCADE"), nullable=False)
    casing_type = Column(String(50), nullable=False)    # Surface, Intermediate, Production
    shoe_depth_tvdss = Column(Float, nullable=False)
    outer_diameter_in = Column(Float, nullable=False)
    lot_fit_emw_sg = Column(Float, nullable=False)       # Leak-Off Test EMW in SG

    wellbore = relationship("WelborePath", back_populates="casings")


# ---------------------------------------------------------------------------
# 5. Master Historical Event & Mitigation Ledger
# ---------------------------------------------------------------------------
class EventLedger(Base):
    __tablename__ = "event_ledger"

    event_id = Column(String, primary_key=True, default=_uuid)
    wellbore_id = Column(String, ForeignKey("wellbore_path.wellbore_id", ondelete="CASCADE"), nullable=False)
    event_type = Column(
        String(50), nullable=False
    )  # Lost_Circulation, Stuck_Pipe, Overpressure_Zone, Gas_Kick, Torque_Spike, Cementing_Issue
    start_depth_tvdss = Column(Float, nullable=False)
    end_depth_tvdss = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False, default="Moderate")  # Minor, Moderate, Severe, Critical
    remediation_applied = Column(Text, nullable=False)
    mitigation_outcome = Column(String(20), nullable=False, default="Successful")  # Successful, Partial, Failed
    npt_hours_saved = Column(Float, default=0.0)
    source_document_name = Column(String(255), nullable=False, default="DDR-Unknown")
    source_page_number = Column(Integer, nullable=False, default=1)
    bounding_box = Column(JSON, nullable=True)
    validation_status = Column(String(20), nullable=False, default="Approved")  # Pending_Queue, Approved, Rejected

    wellbore = relationship("WelborePath", back_populates="events")


# ---------------------------------------------------------------------------
# 6. Live Telemetry (1 Hz) — Time-series table
# ---------------------------------------------------------------------------
class Telemetry1Hz(Base):
    __tablename__ = "telemetry_1hz"

    id = Column(Integer, primary_key=True, autoincrement=True)
    time = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    wellbore_id = Column(String, ForeignKey("wellbore_path.wellbore_id"), nullable=False)
    bit_depth_md = Column(Float, nullable=False)
    bit_depth_tvdss = Column(Float, nullable=False)
    rop_mhr = Column(Float, nullable=True)
    wob_tonnes = Column(Float, nullable=True)
    torque_knm = Column(Float, nullable=True)
    rpm = Column(Float, nullable=True)
    spp_psi = Column(Float, nullable=True)
    flow_in_lpm = Column(Float, nullable=True)
    flow_out_pct = Column(Float, nullable=True)
    pit_volume_m3 = Column(Float, nullable=True)
    total_gas_pct = Column(Float, nullable=True)
    rig_state = Column(String(30), nullable=False, default="DRILLING_ROTARY")

    wellbore = relationship("WelborePath", back_populates="telemetry")


# ---------------------------------------------------------------------------
# 7. Alarm History (ISA-18.2 compliant)
# ---------------------------------------------------------------------------
class AlarmHistory(Base):
    __tablename__ = "alarm_history"

    alarm_id = Column(String, primary_key=True, default=_uuid)
    wellbore_id = Column(String, nullable=False)
    alarm_type = Column(String(50), nullable=False)        # Lost_Circulation, Gas_Kick, etc.
    priority = Column(String(20), nullable=False)           # Critical, Warning, Advisory
    # ISA-18.2 alarm states
    alarm_state = Column(
        String(30), nullable=False, default="UNACKNOWLEDGED"
    )  # UNACKNOWLEDGED, ACKNOWLEDGED, SHELVED, CLEARED, SUPPRESSED
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    acknowledged_at = Column(DateTime, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledgement_reason = Column(Text, nullable=True)
    shelved_until = Column(DateTime, nullable=True)
    depth_tvdss = Column(Float, nullable=True)
    trigger_depth_tvdss = Column(Float, nullable=True)
    message = Column(Text, nullable=False)
    hazard_class = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=True)           # Critical, Warning, Advisory
    probability = Column(Float, nullable=True)              # Model 3 output 0-1
    confidence_interval_m = Column(Float, nullable=True)   # ± meters

    @property
    def status(self):
        """Backward-compat alias for alarm_state."""
        return self.alarm_state


# ---------------------------------------------------------------------------
# 8. Immutable Audit Log (A-10)
# ---------------------------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_log"

    log_id = Column(String, primary_key=True, default=_uuid)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    user_id = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)      # RTOC_ENGINEER, GEOLOGIST, etc.
    action = Column(String(80), nullable=False)          # ACKNOWLEDGE_ALERT, VALIDATE_DDR_OCR, …
    target_id = Column(String(100), nullable=False)      # Alert ID, Event ID, Sim ID, etc.
    reason = Column(Text, nullable=True)                 # Free-text reason / notes
