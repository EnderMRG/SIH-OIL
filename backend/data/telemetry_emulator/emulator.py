"""
eRTMAC WITSML 1 Hz Telemetry Emulator
Simulates real drilling rig sensor data with a deterministic Rig-State Machine.

Rig-State Logic (per Architecture.md):
  DRILLING_ROTARY  : bit on bottom, ROP > 0, Flow > 500, RPM > 20
  DRILLING_SLIDE   : bit on bottom, ROP > 0, Flow > 500, RPM ≤ 5
  CONNECTION       : bit off bottom, Flow ≤ 100, block moving up
  TRIPPING_IN      : bit moving in, pumps off/low
  TRIPPING_OUT     : bit moving out, pumps off/low
  CIRCULATING      : bit off bottom, Flow > 0, ROP = 0
  PUMPS_OFF        : everything essentially zero

This emulator cycles through a realistic drilling sequence.
"""

import math
import random
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any


class RigState(str, Enum):
    DRILLING_ROTARY = "DRILLING_ROTARY"
    DRILLING_SLIDE = "DRILLING_SLIDE"
    CONNECTION = "CONNECTION"
    TRIPPING_IN = "TRIPPING_IN"
    TRIPPING_OUT = "TRIPPING_OUT"
    CIRCULATING = "CIRCULATING"
    PUMPS_OFF = "PUMPS_OFF"


# Duration of each rig state in seconds (1-second ticks)
STATE_DURATIONS = {
    RigState.DRILLING_ROTARY: 45,
    RigState.DRILLING_SLIDE: 20,
    RigState.CONNECTION: 15,
    RigState.CIRCULATING: 10,
    RigState.PUMPS_OFF: 5,
}

# Rig-state cycle sequence (realistic drilling sequence)
RIG_STATE_CYCLE = [
    RigState.DRILLING_ROTARY,
    RigState.DRILLING_SLIDE,
    RigState.DRILLING_ROTARY,
    RigState.CONNECTION,
    RigState.CIRCULATING,
    RigState.PUMPS_OFF,
    RigState.DRILLING_ROTARY,
    RigState.DRILLING_SLIDE,
    RigState.DRILLING_ROTARY,
    RigState.DRILLING_ROTARY,
    RigState.CONNECTION,
]


class TelemetryEmulator:
    def __init__(self, wellbore_id: str, start_tvdss: float = 2800.0):
        self.wellbore_id = wellbore_id
        self.tvdss = start_tvdss
        self.md = start_tvdss / 0.98   # approximate MD from TVDSS

        self._tick = 0
        self._state_idx = 0
        self._state_tick = 0
        self._current_state = RIG_STATE_CYCLE[0]
        self._last_frame: Dict[str, Any] = {}

        # Baseline sensor values
        self._base_rop = 8.5          # m/hr
        self._base_wob = 18.0         # tonnes
        self._base_torque = 12.0      # kN·m
        self._base_rpm = 120.0
        self._base_spp = 2800.0       # psi
        self._base_flow_in = 2200.0   # lpm
        self._base_pit = 85.0         # m³

    # ------------------------------------------------------------------
    # State Machine Transition
    # ------------------------------------------------------------------
    def _advance_state(self):
        duration = STATE_DURATIONS.get(self._current_state, 30)
        if self._state_tick >= duration:
            self._state_idx = (self._state_idx + 1) % len(RIG_STATE_CYCLE)
            self._current_state = RIG_STATE_CYCLE[self._state_idx]
            self._state_tick = 0
        else:
            self._state_tick += 1

    # ------------------------------------------------------------------
    # Sensor Generation per Rig State
    # ------------------------------------------------------------------
    def _generate_frame(self) -> Dict[str, Any]:
        state = self._current_state
        t = self._tick
        noise = lambda scale: random.gauss(0, scale)

        if state == RigState.DRILLING_ROTARY:
            rop = max(0.5, self._base_rop + 3 * math.sin(t / 30) + noise(0.5))
            self.tvdss += rop / 3600   # advance depth
            self.md += rop / (3600 * 0.98)
            return {
                "rig_state": state,
                "rop_mhr": round(rop, 2),
                "wob_tonnes": round(self._base_wob + noise(1.2), 2),
                "torque_knm": round(self._base_torque + 2 * math.sin(t / 20) + noise(0.8), 2),
                "rpm": round(self._base_rpm + noise(3), 1),
                "spp_psi": round(self._base_spp + 80 * math.sin(t / 25) + noise(20), 0),
                "flow_in_lpm": round(self._base_flow_in + noise(30), 0),
                "flow_out_pct": round(98.5 + noise(0.5), 1),
                "pit_volume_m3": round(self._base_pit + noise(0.1), 2),
                "total_gas_pct": round(0.8 + 0.4 * math.sin(t / 60) + abs(noise(0.1)), 2),
            }

        elif state == RigState.DRILLING_SLIDE:
            rop = max(0.3, (self._base_rop * 0.7) + noise(0.4))
            self.tvdss += rop / 3600
            self.md += rop / (3600 * 0.98)
            return {
                "rig_state": state,
                "rop_mhr": round(rop, 2),
                "wob_tonnes": round(self._base_wob * 0.85 + noise(0.8), 2),
                "torque_knm": round(self._base_torque * 0.6 + noise(0.5), 2),
                "rpm": round(noise(2), 1),    # near-zero RPM in slide
                "spp_psi": round(self._base_spp * 0.95 + noise(15), 0),
                "flow_in_lpm": round(self._base_flow_in + noise(20), 0),
                "flow_out_pct": round(97.8 + noise(0.4), 1),
                "pit_volume_m3": round(self._base_pit + noise(0.05), 2),
                "total_gas_pct": round(0.6 + abs(noise(0.1)), 2),
            }

        elif state == RigState.CONNECTION:
            # During connection: pumps winding down, bit off bottom
            progress = self._state_tick / STATE_DURATIONS[RigState.CONNECTION]
            flow = max(0, self._base_flow_in * (1 - progress))
            return {
                "rig_state": state,
                "rop_mhr": 0.0,
                "wob_tonnes": round(noise(0.5), 2),
                "torque_knm": round(noise(0.3), 2),
                "rpm": 0.0,
                "spp_psi": round(self._base_spp * (1 - progress) + noise(10), 0),
                "flow_in_lpm": round(max(0, flow), 0),
                "flow_out_pct": round(max(0, 80 - progress * 80) + noise(1), 1),
                "pit_volume_m3": round(self._base_pit + noise(0.05), 2),
                "total_gas_pct": round(abs(noise(0.05)), 2),  # Connection gas spike potential
            }

        elif state == RigState.CIRCULATING:
            return {
                "rig_state": state,
                "rop_mhr": 0.0,
                "wob_tonnes": 0.0,
                "torque_knm": round(noise(0.2), 2),
                "rpm": 0.0,
                "spp_psi": round(self._base_spp * 0.85 + noise(15), 0),
                "flow_in_lpm": round(self._base_flow_in * 0.9 + noise(25), 0),
                "flow_out_pct": round(96.0 + noise(0.5), 1),
                "pit_volume_m3": round(self._base_pit + noise(0.08), 2),
                "total_gas_pct": round(0.2 + abs(noise(0.05)), 2),
            }

        else:  # PUMPS_OFF / default
            return {
                "rig_state": state,
                "rop_mhr": 0.0,
                "wob_tonnes": 0.0,
                "torque_knm": 0.0,
                "rpm": 0.0,
                "spp_psi": 0.0,
                "flow_in_lpm": 0.0,
                "flow_out_pct": 0.0,
                "pit_volume_m3": round(self._base_pit + noise(0.02), 2),
                "total_gas_pct": 0.0,
            }

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def next_frame(self) -> Dict[str, Any]:
        self._advance_state()
        sensor_data = self._generate_frame()

        frame = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "wellbore_id": self.wellbore_id,
            "bit_depth_md": round(self.md, 2),
            "bit_depth_tvdss": round(self.tvdss, 2),
            **sensor_data,
        }
        self._last_frame = frame
        self._tick += 1
        return frame

    def current_frame(self) -> Dict[str, Any]:
        return self._last_frame or self.next_frame()
