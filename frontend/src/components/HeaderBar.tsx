"use client";

import { Bell, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

const FORMATIONS = ["Girujan Clay", "Tipam Sandstone", "Barail Group", "Kopili Shale"];

export function HeaderBar() {
  const [connected, setConnected] = useState(true);
  const [tick, setTick] = useState(0);
  const [tvdss, setTvdss] = useState(2850.2);

  // Simulate live depth advancement for header
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setTvdss((d) => parseFloat((d + 0.0024).toFixed(2))); // ~8.5 m/hr
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formation = tvdss < 600 ? FORMATIONS[0] : tvdss < 1600 ? FORMATIONS[1] : tvdss < 2600 ? FORMATIONS[2] : FORMATIONS[3];

  return (
    <header className="header-bar" role="banner">
      {/* Left — Rig identity */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="pulse-dot" />
          <span className="mono-label">Rig</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, color: "var(--color-base-50)" }}>OIL-DGB-07</span>
        </div>
        <div className="divider" style={{ width: 1, height: 20, borderLeft: "1px solid var(--color-base-700)", borderTop: "none" }} />
        <div className="flex items-center gap-2">
          <span className="mono-label">Well</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 600, color: "var(--color-live)" }}>NH-12</span>
        </div>
        <div className="divider" style={{ width: 1, height: 20, borderLeft: "1px solid var(--color-base-700)", borderTop: "none" }} />
        <div className="flex items-center gap-1.5">
          <span className="mono-label">TVDSS</span>
          <span className="mono-data" style={{ color: "var(--color-ok)" }}>{tvdss.toFixed(1)} m</span>
        </div>
        <div className="divider" style={{ width: 1, height: 20, borderLeft: "1px solid var(--color-base-700)", borderTop: "none" }} />
        <div className="flex items-center gap-1.5">
          <span className="mono-label">Formation</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-warning)" }}>{formation}</span>
        </div>
      </div>

      {/* Right — Status indicators */}
      <div className="flex items-center gap-3">
        <span className={`badge ${connected ? "badge-live" : "badge-critical"}`}>
          {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
          {connected ? `1 Hz · ${tick}s` : "STALE"}
        </span>

        <span className="badge badge-critical">
          <Bell size={9} />
          1 Critical
        </span>

        <div className="badge badge-ok">
          Rig-State: DRILLING ROTARY
        </div>
      </div>
    </header>
  );
}
