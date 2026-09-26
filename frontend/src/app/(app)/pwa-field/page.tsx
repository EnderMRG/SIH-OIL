"use client";

import { useState, useEffect } from "react";
import { WifiOff, AlertTriangle, CheckCircle, Clock } from "lucide-react";

const HAZARDS = [
  { class: "Lost Circulation", prob: 78, color: "var(--color-critical)", depth: 2910, formation: "Barail Group" },
  { class: "Overpressure", prob: 52, color: "var(--color-warning)", depth: 2950, formation: "Barail Group" },
  { class: "Gas Kick", prob: 35, color: "var(--color-warning)", depth: 2900, formation: "Barail Group" },
];

export default function PwaFieldPage() {
  const [tvdss, setTvdss] = useState(2850.2);
  const [rigState, setRigState] = useState("DRILLING_ROTARY");
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setTvdss((d) => parseFloat((d + 0.0024).toFixed(2)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const topHazard = HAZARDS[0];
  const barColor = topHazard.prob >= 65 ? "var(--color-critical)" : topHazard.prob >= 40 ? "var(--color-warning)" : "var(--color-ok)";

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100dvh", background: "var(--color-base-950)", padding: "0 0 2rem" }}>
      {/* Offline/online banner */}
      <div style={{
        background: isOnline ? "var(--color-live-dim)" : "var(--color-critical-dim)",
        borderBottom: `1px solid ${isOnline ? "var(--color-live)" : "var(--color-critical)"}`,
        padding: "0.5rem 1rem",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div className="flex items-center gap-2">
          {isOnline ? <div className="pulse-dot" /> : <WifiOff size={12} style={{ color: "var(--color-critical)" }} />}
          <span className="mono-label" style={{ color: isOnline ? "var(--color-live)" : "var(--color-critical)" }}>
            {isOnline ? "CONNECTED" : "OFFLINE — Cached Data"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock size={10} style={{ color: "var(--color-base-600)" }} />
          <span className="mono-label" style={{ fontSize: "0.6rem" }}>Synced {lastSync}</span>
        </div>
      </div>

      {/* Active depth header */}
      <div className="panel" style={{ margin: "1rem", borderLeft: "3px solid var(--color-live)" }}>
        <div className="mono-label mb-1">Active Depth (TVDSS)</div>
        <div className="mono-data" style={{ fontSize: "2.5rem", fontWeight: 700, color: "var(--color-live)", lineHeight: 1 }}>
          {tvdss.toFixed(1)} <span className="mono-label" style={{ fontSize: "1rem" }}>m</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="badge badge-ok" style={{ fontSize: "0.65rem" }}>{rigState.replace(/_/g, " ")}</span>
          <span className="mono-label">Formation: Barail Group</span>
        </div>
      </div>

      {/* Hazard barometer */}
      <div style={{ margin: "0 1rem 1rem" }}>
        <div className="mono-label mb-2">Next 100 m Hazard Barometer</div>
        <div className="flex flex-col gap-2">
          {HAZARDS.map((h) => {
            const acked = acknowledged.has(h.class);
            return (
              <div key={h.class} className="panel-sm" style={{
                borderLeft: `3px solid ${acked ? "var(--color-base-600)" : h.color}`,
                opacity: acked ? 0.5 : 1, transition: "opacity 200ms"
              }}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="section-heading" style={{ fontSize: "0.85rem", color: acked ? "var(--color-base-600)" : h.color }}>
                      {h.class}
                    </div>
                    <div className="mono-label">{h.depth} m TVDSS · {h.formation}</div>
                  </div>
                  <div className="mono-data" style={{ fontSize: "1.4rem", fontWeight: 700, color: acked ? "var(--color-base-600)" : h.color }}>
                    {h.prob}%
                  </div>
                </div>
                <div className="risk-bar-track mb-3">
                  <div style={{
                    width: `${h.prob}%`, height: "100%",
                    background: acked ? "var(--color-base-600)" : h.color,
                    transition: "width 400ms ease"
                  }} />
                </div>
                {!acked ? (
                  <button
                    className="btn btn-ghost"
                    style={{ width: "100%", justifyContent: "center", fontSize: "0.8rem", minHeight: 44 }}
                    onClick={() => setAcknowledged((prev) => new Set([...prev, h.class]))}>
                    <AlertTriangle size={14} /> Acknowledge Hazard
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2" style={{ height: 44 }}>
                    <CheckCircle size={14} style={{ color: "var(--color-ok)" }} />
                    <span className="mono-label" style={{ color: "var(--color-ok)" }}>Acknowledged</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline offset summary */}
      <div className="panel" style={{ margin: "0 1rem" }}>
        <div className="mono-label mb-2">Offline Offset Summary (NH-04, Barail Group)</div>
        <div className="divider pt-2 flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-secondary" style={{ fontSize: "0.75rem" }}>Intermediate Casing Shoe</span>
            <span className="mono-data" style={{ color: "var(--color-live)" }}>1,800 m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary" style={{ fontSize: "0.75rem" }}>Mud Loss Pill (Barail)</span>
            <span className="mono-data" style={{ color: "var(--color-ok)" }}>40 ppb CaCO3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary" style={{ fontSize: "0.75rem" }}>LOT EMW at shoe</span>
            <span className="mono-data" style={{ color: "var(--color-live)" }}>1.58 SG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
