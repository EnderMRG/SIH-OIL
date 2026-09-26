"""
NWIS Live Telemetry WebSocket API
Streams the telemetry emulator output to connected frontend clients.
"""
import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.data.telemetry_emulator.emulator import TelemetryEmulator

router = APIRouter()

# Shared emulator instance
_emulator = TelemetryEmulator(wellbore_id="active-wb-001", start_tvdss=2800.0)
_clients: list[WebSocket] = []


@router.websocket("/ws/telemetry")
async def telemetry_ws(websocket: WebSocket):
    await websocket.accept()
    _clients.append(websocket)
    try:
        while True:
            frame = _emulator.next_frame()
            payload = json.dumps(frame)
            # Broadcast to all connected clients
            dead = []
            for client in _clients:
                try:
                    await client.send_text(payload)
                except Exception:
                    dead.append(client)
            for d in dead:
                _clients.remove(d)
            await asyncio.sleep(1.0)   # 1 Hz
    except WebSocketDisconnect:
        if websocket in _clients:
            _clients.remove(websocket)


@router.get("/api/telemetry/latest")
async def get_latest_frame():
    """REST fallback — returns the most recent telemetry frame."""
    return _emulator.current_frame()
