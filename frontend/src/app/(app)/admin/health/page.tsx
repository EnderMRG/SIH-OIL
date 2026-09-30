/**
 * Page 13: System Data & Model Health Dashboard (/admin/health)
 */
"use client";

import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

const MODEL_METRICS = [
  { name: "Model 1 — Analogue Selector",  metric: "100% Availability",   sub: "(Deterministic)",          color: "#10b981", status: "nominal" as const },
  { name: "Model 2 — DFIM Alignment",     metric: "Avg Warp: 88.4%",     sub: "DTW Quality Score",         color: "#10b981", status: "nominal" as const },
  { name: "Model 3 — Hazard Lookahead",   metric: "AUC-ROC 0.91",        sub: "GroupKFold Validation",    color: "#10b981", status: "nominal" as const },
  { name: "Model 4 — Anomaly Detector",   metric: "1.2 FA / 24h",        sub: "False Alarm Rate",         color: "#f59e0b", status: "warning" as const },
];

const CHANNEL_HEALTH = [
  { name: "Bit Depth Channel",    quality: 100, latencyS: 0.0, warning: null },
  { name: "Standpipe Pressure",   quality: 100, latencyS: 0.2, warning: null },
  { name: "Mud Flow Out %",       quality:  92, latencyS: 0.4, warning: "1 Sensor Noise Warning (Recalibrate)" },
  { name: "Hookload",             quality: 100, latencyS: 0.1, warning: null },
  { name: "Block Position",       quality: 100, latencyS: 0.1, warning: null },
  { name: "ROP",                  quality: 100, latencyS: 0.3, warning: null },
  { name: "MW In / Out",          quality: 100, latencyS: 0.5, warning: null },
  { name: "ECD",                  quality: 100, latencyS: 0.5, warning: null },
];

const SYSTEM_STATUS = [
  { label: "WITSML Feed",       value: "ONLINE (1.0 Hz)",       color: "#10b981" },
  { label: "OCR Backlog",       value: "0 Pending",             color: "#10b981" },
  { label: "Active Model Ver.", value: "v2.4 (2026-09-15)",     color: "#f8fafc" },
  { label: "PSI Drift",         value: "0.04 (Stable)",         color: "#10b981" },
  { label: "DB Connections",    value: "4 / 20 active",         color: "#f8fafc" },
  { label: "Redis Stream",      value: "ONLINE (0ms lag)",      color: "#10b981" },
];

export default function HealthPage() {
  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      <div>
        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
          SYSTEM HEALTH & MODEL MONITOR
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", margin: "4px 0 0" }}>
          Real-time infrastructure health, model performance metrics, and sensor data quality.
        </p>
      </div>

      {/* System status bar */}
      <Panel state="ready" style={{ padding: "12px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
          {SYSTEM_STATUS.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                {s.label}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 600, color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Model performance */}
        <Panel state="ready" style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Model Performance Metrics
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {MODEL_METRICS.map((m) => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#f8fafc", marginBottom: "2px" }}>
                    {m.name}
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b" }}>
                    {m.sub}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: m.color, fontVariantNumeric: "tabular-nums" }}>
                    {m.metric}
                  </div>
                  <StatusBadge level={m.status} size="sm" compact />
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Sensor channel health */}
        <Panel state="ready" style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Sensor Channel Integrity & Drift
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Channel", "Quality", "Latency", "Status"].map((h) => (
                  <th key={h} style={{ padding: "4px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.57rem", color: "#64748b", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #2a3654" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHANNEL_HEALTH.map((c) => (
                <tr key={c.name} style={{ borderBottom: "1px solid #2a3654" }}>
                  <td style={{ padding: "7px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#f8fafc" }}>
                    {c.name}
                  </td>
                  <td style={{ padding: "7px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: c.quality === 100 ? "#10b981" : "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                    {c.quality}%
                  </td>
                  <td style={{ padding: "7px 8px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                    {c.latencyS.toFixed(1)}s
                  </td>
                  <td style={{ padding: "7px 8px" }}>
                    {c.warning ? (
                      <StatusBadge level="warning" label={c.warning} size="sm" />
                    ) : (
                      <StatusBadge level="nominal" label="OK" size="sm" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

      {/* Drift metrics */}
      <Panel state="ready" style={{ padding: "14px 16px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Model Drift Indicator (PSI — Population Stability Index)
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ flex: 1, height: "12px", background: "#1c253b", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
            <div style={{ width: "4%", height: "100%", background: "#10b981", borderRadius: "4px" }} />
            <div style={{ position: "absolute", left: "10%", top: 0, bottom: 0, width: "1px", background: "#f59e0b" }} />
            <div style={{ position: "absolute", left: "25%", top: 0, bottom: 0, width: "1px", background: "#ef4444" }} />
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#10b981", fontVariantNumeric: "tabular-nums" }}>
            PSI = 0.04 (Stable)
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b" }}>
            | 0.10 = Warning | 0.25 = Retrain
          </div>
        </div>
      </Panel>
    </div>
  );
}
