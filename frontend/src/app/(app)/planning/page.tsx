/**
 * Page 11: Plan vs. Actual Days-vs-Depth Cockpit (/planning)
 * Tracks AFE schedule adherence and NPT financial impact.
 */
"use client";

import { useGlobalContext } from "@/store/globalContext";
import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

interface NptCategory {
  cause: string;
  hours: number;
  pct: number;
  color: string;
}

const NPT_DATA: NptCategory[] = [
  { cause: "Stuck Pipe / Reaming", hours: 6.5, pct: 45, color: "#ef4444" },
  { cause: "Lost Circulation",     hours: 4.2, pct: 30, color: "#f59e0b" },
  { cause: "Equipment / Telemetry",hours: 3.5, pct: 25, color: "#3b82f6" },
];

const TOTAL_NPT = 14.2;
const DAYS_ELAPSED = 28;
const SPUD_DATE = "2026-09-01";
const FIELD_AVG_NPT = 22.5;
const COST_USD = 142000;

// Simplified days-vs-depth plot data (plan vs actual)
const PLAN_POINTS = [
  [0, 0], [5, 500], [10, 1100], [15, 1750], [20, 2200],
  [25, 2700], [30, 3050], [35, 3300], [40, 3400],
] as [number, number][];

const ACTUAL_POINTS = [
  [0, 0], [5, 480], [10, 1050], [15, 1680], [20, 2050],
  [25, 2520], [28, 2850],
] as [number, number][];

function DepthVsDaysSVG() {
  const W = 500, H = 280;
  const PAD = { top: 20, right: 20, bottom: 40, left: 60 };
  const maxDays = 45, maxDepth = 3500;

  const toX = (d: number) => PAD.left + (d / maxDays) * (W - PAD.left - PAD.right);
  const toY = (m: number) => PAD.top + (m / maxDepth) * (H - PAD.top - PAD.bottom);

  const planPath = PLAN_POINTS.map(([d, m], i) =>
    `${i === 0 ? "M" : "L"}${toX(d).toFixed(1)},${toY(m).toFixed(1)}`
  ).join(" ");

  const actualPath = ACTUAL_POINTS.map(([d, m], i) =>
    `${i === 0 ? "M" : "L"}${toX(d).toFixed(1)},${toY(m).toFixed(1)}`
  ).join(" ");

  const yTicks = [0, 500, 1000, 1500, 2000, 2500, 3000, 3500];
  const xTicks = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
      {/* Grid */}
      {yTicks.map((m) => (
        <line key={m} x1={PAD.left} x2={W - PAD.right} y1={toY(m)} y2={toY(m)} stroke="#2a3654" strokeWidth={0.5} />
      ))}
      {xTicks.map((d) => (
        <line key={d} x1={toX(d)} x2={toX(d)} y1={PAD.top} y2={H - PAD.bottom} stroke="#2a3654" strokeWidth={0.5} />
      ))}

      {/* Y axis labels */}
      {yTicks.map((m) => (
        <text key={m} x={PAD.left - 6} y={toY(m) + 4} textAnchor="end" fill="#64748b" fontSize={8}>
          {m === 0 ? "0" : `${m / 1000}k`}
        </text>
      ))}

      {/* X axis labels */}
      {xTicks.map((d) => (
        <text key={d} x={toX(d)} y={H - PAD.bottom + 14} textAnchor="middle" fill="#64748b" fontSize={8}>
          {d}
        </text>
      ))}

      {/* Axis titles */}
      <text x={PAD.left - 45} y={H / 2} fill="#64748b" fontSize={8} transform={`rotate(-90, ${PAD.left - 45}, ${H / 2})`} textAnchor="middle">
        Depth (m TVDSS)
      </text>
      <text x={(W - PAD.left - PAD.right) / 2 + PAD.left} y={H - 4} fill="#64748b" fontSize={8} textAnchor="middle">
        Days from Spud
      </text>

      {/* Plan path */}
      <path d={planPath} fill="none" stroke="#64748b" strokeWidth={1.5} strokeDasharray="6 3" />
      <text x={toX(35) + 4} y={toY(3300) - 4} fill="#64748b" fontSize={7}>AFE Plan</text>

      {/* Actual path */}
      <path d={actualPath} fill="none" stroke="#10b981" strokeWidth={2} />
      <text x={toX(28) + 4} y={toY(2850) - 4} fill="#10b981" fontSize={7}>NH-12 Actual</text>

      {/* Current position dot */}
      <circle
        cx={toX(DAYS_ELAPSED)}
        cy={toY(2850)}
        r={4}
        fill="#10b981"
        stroke="#0b0f19"
        strokeWidth={2}
      />

      {/* Today line */}
      <line
        x1={toX(DAYS_ELAPSED)}
        x2={toX(DAYS_ELAPSED)}
        y1={PAD.top}
        y2={H - PAD.bottom}
        stroke="#10b981"
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.5}
      />
      <text x={toX(DAYS_ELAPSED) + 2} y={PAD.top + 10} fill="#10b981" fontSize={7}>Today</text>
    </svg>
  );
}

export default function PlanningPage() {
  const ctx = useGlobalContext();

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "#f8fafc",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          DRILLING PROGRESS & AFE COST COCKPIT
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.65rem",
            color: "#64748b",
            margin: "4px 0 0",
          }}
        >
          Active Well: {ctx.activeWellName} · Spud Date: {SPUD_DATE} · Days Elapsed: {DAYS_ELAPSED} Days
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* Days vs Depth Chart */}
        <Panel state="ready" style={{ padding: "14px" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              color: "#94a3b8",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Days-vs-Depth Curve (Plan vs Actual)
          </div>
          <DepthVsDaysSVG />
          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 20, height: 2, background: "#64748b", borderTop: "2px dashed #64748b" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b" }}>AFE Plan</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: 20, height: 2, background: "#10b981" }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#10b981" }}>Actual Progress</span>
            </div>
          </div>
        </Panel>

        {/* NPT Breakdown */}
        <Panel state="ready" style={{ padding: "14px" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              color: "#94a3b8",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Section NPT Breakdown & AFE Cost Tracking
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            {[
              { label: "Total NPT", value: `${TOTAL_NPT} hrs`, sub: "5.1% of total rig time", color: "#f59e0b" },
              { label: "vs. Field Avg", value: `${FIELD_AVG_NPT} hrs avg`, sub: `NH-12 is ${FIELD_AVG_NPT - TOTAL_NPT} hrs below avg`, color: "#10b981" },
              { label: "Est. Cost", value: `$${(COST_USD / 1000).toFixed(0)}K USD`, sub: "NPT cost incurred", color: "#ef4444" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#0b0f19",
                  border: "1px solid #2a3654",
                  borderRadius: "4px",
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>
                  {s.value}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b", marginTop: "3px" }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* NPT cause breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {NPT_DATA.map((n) => (
              <div key={n.cause}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#f8fafc" }}>
                    {n.cause}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: n.color, fontVariantNumeric: "tabular-nums" }}>
                    {n.hours} hrs ({n.pct}%)
                  </span>
                </div>
                <div style={{ height: "8px", background: "#1c253b", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${n.pct}%`,
                      height: "100%",
                      background: n.color,
                      borderRadius: "2px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Status */}
          <div style={{ marginTop: "16px" }}>
            <StatusBadge level="nominal" label={`NH-12 is ${FIELD_AVG_NPT - TOTAL_NPT} hrs below field average NPT`} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
