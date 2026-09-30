"""
Audit Log API (/api/audit)
Immutable append-only event log for all user actions per A-10.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.core.database import get_db
from backend.db.models import AuditLog

router = APIRouter()


class AuditEntryCreate(BaseModel):
    user_id: str
    user_role: str
    action: str          # e.g. ACKNOWLEDGE_ALERT, VALIDATE_DDR_OCR
    target_id: str       # e.g. ALT-8841, EVT-0912
    reason: Optional[str] = None


@router.post("/", status_code=201)
async def log_action(
    entry: AuditEntryCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Append an immutable audit log entry.
    Called server-side after every consequential user action.
    """
    record = AuditLog(
        user_id=entry.user_id,
        user_role=entry.user_role,
        action=entry.action,
        target_id=entry.target_id,
        reason=entry.reason,
        timestamp=datetime.utcnow(),
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return {"log_id": record.log_id, "timestamp": record.timestamp.isoformat()}


@router.get("/")
async def get_audit_log(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    days: int = Query(7, ge=1, le=90, description="Look-back window in days"),
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve audit log entries with optional filters.
    Returns most recent entries first.
    """
    stmt = select(AuditLog).order_by(desc(AuditLog.timestamp)).limit(limit)
    result = await db.execute(stmt)
    entries = result.scalars().all()

    # Python-side filters (for SQLite compat — PostGIS production uses SQL WHERE)
    cutoff = datetime.utcnow().replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)

    filtered = [
        e for e in entries
        if e.timestamp >= cutoff
        and (user_id is None or e.user_id == user_id)
        and (action is None or e.action == action)
    ]

    return {
        "total": len(filtered),
        "entries": [
            {
                "log_id": e.log_id,
                "timestamp": e.timestamp.isoformat() + "+05:30",
                "user_id": e.user_id,
                "user_role": e.user_role,
                "action": e.action,
                "target_id": e.target_id,
                "reason": e.reason,
            }
            for e in filtered
        ],
    }
