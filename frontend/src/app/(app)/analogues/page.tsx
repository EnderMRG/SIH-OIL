/**
 * Page 9: Pre-Drilling Offset Analogue Selector (/analogues)
 * Model 1 — 5-Factor Weighted Similarity Engine
 */
"use client";

import { useState, useMemo } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepth } from "@/lib/units";
import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

interface Factor {
  key: string;
  label: string;
  description: string;
  weight: number;
  color: string;
}

interface OffsetWell {
  rank: number;
  name: string;
  field: string;
  distKm: number;
  tvdDeltaM: number;
  score: number;
  breakdown: { geo: number; strat: number; depth: number; profile: number; size: number };
  whyText: string;
  incidents: number;
  year: number;
}

const INITIAL_FACTORS: Factor[] = [
  { key: "geo",     label: "Geo Distance",   description: "3D subsurface separation",              weight: 25, color: "#3b82f6" },
  { key: "strat",   label: "Stratigraphy",   description: "Formation top sequence match",           weight: 35, color: "#10b981" },
  { key: "depth",   label: "Depth Delta",    description: "Absolute planned total depth diff",      weight: 15, color: "#f59e0b" },
  { key: "profile", label: "Profile Match",  description: "Well trajectory type match",             weight: 15, color: "#a78bfa" },
  { key: "size",    label: "Hole Size",      description: "Bit/hole diameter ratio match",          weight: 10, color: "#fb923c" },
];

const MOCK_WELLS: OffsetWell[] = [
  {
    rank: 1, name: "NH-04", field: "Digboi",   distKm: 3.2,  tvdDeltaM: 45,  score: 87.4,
    breakdown: { geo: 82, strat: 95, depth: 88, profile: 80, size: 100 },
    whyText: 'Shares exact Barail sandstone formation top sequence and identical 12¼" hole section diameter. Drilled in 2021 with 3 loss events.',
    incidents: 3, year: 2021,
  },
  {
    rank: 2, name: "NH-07", field: "Digboi",   distKm: 4.1,  tvdDeltaM: 120, score: 82.1,
    breakdown: { geo: 74, strat: 90, depth: 81, profile: 85, size: 95 },
    whyText: "Similar stratigraphic profile with Tipam/Barail transitions. 2 torque spike incidents logged in 8.5\" section.",
    incidents: 2, year: 2022,
  },
  {
    rank: 3, name: "NH-02", field: "Tinsukia", distKm: 8.5,  tvdDeltaM: 10,  score: 79.5,
    breakdown: { geo: 52, strat: 98, depth: 96, profile: 75, size: 90 },
    whyText: "Exceptional depth match (only 10m delta). Stratigraphic sequence nearly identical. Higher geo distance reduces total score.",
    incidents: 1, year: 2019,
  },
  {
    rank: 4, name: "NH-09", field: "Digboi",   distKm: 5.6,  tvdDeltaM: 210, score: 71.3,
    breakdown: { geo: 68, strat: 78, depth: 58, profile: 80, size: 85 },
    whyText: "Good geographical proximity. Larger depth delta reduces Barail correlation confidence.",
    incidents: 4, year: 2020,
  },
];

function ScoreBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          flex: 1,
          height: "6px",
          background: "#1c253b",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.62rem",
          color: "#94a3b8",
          minWidth: "32px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

export default function AnaloguesPage() {
  const ctx = useGlobalContext();
  const u = ctx.unitSystem;
  const [factors, setFactors] = useState<Factor[]>(INITIAL_FACTORS);
  const [selectedWell, setSelectedWell] = useState<string>("NH-04");
  const [selectedForBaseline, setSelectedForBaseline] = useState<string | null>(null);

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);

  const updateWeight = (key: string, val: number) => {
    setFactors((prev) =>
      prev.map((f) => (f.key === key ? { ...f, weight: val } : f))
    );
  };

  const selectedWellData = useMemo(
    () => MOCK_WELLS.find((w) => w.name === selectedWell),
    [selectedWell]
  );

  const FACTOR_COLORS: Record<string, string> = Object.fromEntries(
    INITIAL_FACTORS.map((f) => [f.key, f.color])
  );

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      {/* Page title */}
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
          MODEL 1 — PRE-DRILLING OFFSET ANALOGUE SELECTOR
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.65rem",
            color: "#64748b",
            margin: "4px 0 0",
          }}
        >
          Target Well: {ctx.activeWellName} · Target Section: 12¼&quot; (2,150m to 3,200m TVDSS)
        </p>
      </div>

      {/* Weight Sliders */}
      <Panel state="ready" style={{ padding: "14px 16px" }}>
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
          5-Factor Weight Sliders{" "}
          <span style={{ color: totalWeight !== 100 ? "#ef4444" : "#10b981" }}>
            (Total: {totalWeight}%)
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
          {factors.map((f) => (
            <div key={f.key}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.62rem",
                    color: f.color,
                    fontWeight: 600,
                  }}
                >
                  {f.label}
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.65rem",
                    color: "#f8fafc",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {f.weight}%
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={f.weight}
                onChange={(e) => updateWeight(f.key, Number(e.target.value))}
                style={{ width: "100%", accentColor: f.color }}
              />
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.55rem",
                  color: "#64748b",
                  margin: "4px 0 0",
                }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Ranked Table */}
      <Panel state="ready">
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.65rem",
            color: "#94a3b8",
            padding: "10px 14px",
            borderBottom: "1px solid #2a3654",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          Ranked Top-{MOCK_WELLS.length} Offset Analogues
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #2a3654" }}>
              {["Rank", "Well Name", "Field", "Dist (km)", "TVD Δ", "Score", "Geo", "Strat", "Depth", "Profile", "Size", ""].map(
                (h) => (
                  <th
                    key={h}
                    style={{
                      padding: "7px 12px",
                      textAlign: "left",
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.58rem",
                      color: "#64748b",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {MOCK_WELLS.map((w) => {
              const isSelected = w.name === selectedWell;
              return (
                <tr
                  key={w.name}
                  onClick={() => setSelectedWell(w.name)}
                  style={{
                    borderBottom: "1px solid #2a3654",
                    background: isSelected ? "#1c253b" : "transparent",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                >
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#64748b" }}>
                      #{w.rank}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: isSelected ? "#10b981" : "#f8fafc",
                      }}
                    >
                      {w.name}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#94a3b8" }}>
                      {w.field}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                      {w.distKm} km
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                      {fmtDepth(w.tvdDeltaM, u)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: w.score >= 85 ? "#10b981" : w.score >= 75 ? "#f59e0b" : "#94a3b8",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {w.score}%
                    </span>
                  </td>
                  {(["geo", "strat", "depth", "profile", "size"] as const).map((k) => (
                    <td key={k} style={{ ...tdStyle, minWidth: "90px" }}>
                      <ScoreBar pct={w.breakdown[k]} color={FACTOR_COLORS[k]} />
                    </td>
                  ))}
                  <td style={tdStyle}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForBaseline(w.name);
                      }}
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.6rem",
                        color: "#3b82f6",
                        background: "rgba(59,130,246,0.1)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        borderRadius: "3px",
                        padding: "3px 7px",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {selectedForBaseline === w.name ? "✓ Selected" : "Select Baseline"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>

      {/* "Why This Well" panel */}
      {selectedWellData && (
        <Panel state="ready" style={{ padding: "14px 16px" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.65rem",
              color: "#64748b",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Why This Well — {selectedWellData.name} ({selectedWellData.field}, {selectedWellData.year})
          </div>
          <p
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontSize: "0.82rem",
              color: "#f8fafc",
              margin: "0 0 12px",
              lineHeight: 1.6,
            }}
          >
            {selectedWellData.whyText}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <StatusBadge
              level={selectedWellData.incidents >= 3 ? "warning" : "nominal"}
              label={`${selectedWellData.incidents} Historical Incidents`}
            />
            <button
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.65rem",
                color: "#10b981",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: "3px",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Select for Offset Roadmap Baseline
            </button>
            <button
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.65rem",
                color: "#94a3b8",
                background: "#1c253b",
                border: "1px solid #2a3654",
                borderRadius: "3px",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Export Analogue Selection PDF
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "8px 12px",
  verticalAlign: "middle",
};
