"""
NWIS FastAPI Application Factory
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api import wells, advisory, telemetry_ws, correlation, pore_pressure, documents

app = FastAPI(
    title="NWIS — Nearby Wells Intelligence System",
    description="eRTMAC Real-Time Monitoring & Analytics Platform for Oil India Limited",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST Routes
app.include_router(wells.router, prefix="/api/wells", tags=["Wells & Map"])
app.include_router(advisory.router, prefix="/api/advisory", tags=["Lookahead Advisory"])
app.include_router(correlation.router, prefix="/api/correlation", tags=["Correlation Curtain"])
app.include_router(pore_pressure.router, prefix="/api/pore-pressure", tags=["Pore Pressure"])
app.include_router(documents.router, prefix="/api/documents", tags=["Document Intelligence"])

# WebSocket
app.include_router(telemetry_ws.router, tags=["Live Telemetry"])


@app.get("/api/health", tags=["System"])
async def health():
    return {"status": "ok", "system": "NWIS", "version": "1.0.0"}
