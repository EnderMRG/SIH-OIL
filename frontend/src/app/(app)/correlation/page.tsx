"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";

const FORMATION_COLORS: Record<string, string> = {
  "Girujan Clay": "#6b7280",
  "Tipam Sandstone": "#d97706",
  "Barail Group": "#059669",
  "Kopili Shale": "#dc2626",
};

const INCIDENT_COLORS: Record<string, string> = {
  Lost_Circulation: "var(--color-warning)",
  Gas_Kick: "var(--color-critical)",
  Stuck_Pipe: "var(--color-advisory)",
};

const MOCK_DATA = {
  formation_tops: [
    { formation_name: "Girujan Clay", top_tvdss: 0, base_tvdss: 600 },
    { formation_name: "Tipam Sandstone", top_tvdss: 600, base_tvdss: 1600 },
    { formation_name: "Barail Group", top_tvdss: 1600, base_tvdss: 2600 },
    { formation_name: "Kopili Shale", top_tvdss: 2600, base_tvdss: 3500 },
  ],
  incident_flags: [
    { tvdss: 2310.5, event_type: "Lost_Circulation", severity: "Severe", wellbore: "Offset-1 (NH-04)" },
    { tvdss: 2540.0, event_type: "Gas_Kick", severity: "Moderate", wellbore: "Offset-2 (NH-07)" },
    { tvdss: 1820.0, event_type: "Stuck_Pipe", severity: "Severe", wellbore: "Offset-1 (NH-04)" },
  ],
};

function generateLogData(depthFrom: number, depthTo: number, offset: number = 0, noise: number = 1) {
  const data = [];
  for (let d = depthFrom; d <= depthTo; d += 10) {
    const base = d < 600 ? 40 : d < 1600 ? 65 : d < 2600 ? 85 : 110;
    const gr = (base + 15 * Math.sin(d / 80) + (Math.random() - 0.5) * 10 * noise + offset * 0.1) * noise;
    const mse = Math.min(50 + 20 * Math.sin(d / 120) + (Math.random() - 0.5) * 15 * noise, 350);
    data.push({ tvdss: d, gr: parseFloat(gr.toFixed(1)), mse: parseFloat(mse.toFixed(1)) });
  }
  return data;
}

export default function CorrelationPage() {
  const [depthFrom, setDepthFrom] = useState(1500);
  const [depthTo, setDepthTo] = useState(3200);
  const [dfimOn, setDfimOn] = useState(false);
  const [activeData, setActiveData] = useState(() => generateLogData(1500, 3200, 0, 1.0));
  const [offset1Data, setOffset1Data] = useState(() => generateLogData(1500, 3200, 15, 0.95));
  const [offset2Data, setOffset2Data] = useState(() => generateLogData(1500, 3200, -10, 1.05));

  const visibleFormations = MOCK_DATA.formation_tops.filter(
    (f) => f.top_tvdss <= depthTo && f.base_tvdss >= depthFrom
  );

  function ChartColumn({ title, data, color }: { title: string; data: any[]; color: string }) {
    return (
      <div style={{ flex: 1 }}>
        <div className="mono-label mb-2" style={{ fontSize: "0.65rem", textAlign: "center" }}>{title}</div>
        <ResponsiveContainer width="100%" height={500}>
          <LineChart data={data} layout="vertical" margin={{ left: 30, right: 10, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--color-base-700)" />
            <XAxis type="number" domain={[0, 180]} style={{ fontFamily: "var(--font-mono)", fontSize: 9 }} />
            <YAxis type="number" dataKey="tvdss" domain={[depthFrom, depthTo]} reversed
              style={{ fontFamily: "var(--font-mono)", fontSize: 9 }} />
            <Tooltip
              contentStyle={{ background: "var(--color-base-900)", border: "1px solid var(--color-base-700)", fontSize: 10 }}
              formatter={(v: any, n: any) => [Number(v).toFixed(1), n === "gr" ? "GR (API)" : "MSE (MPa)"]}
              labelFormatter={(l: any) => `${l} m TVDSS`}
            />
            <Line dataKey="gr"  dot={false} strokeWidth={1.5} stroke={color} animationDuration={0} />
            <Line dataKey="mse" dot={false} strokeWidth={1} stroke="#64748b" animationDuration={0} strokeDasharray="3 2" />
            {/* Formation top reference lines */}
            {visibleFormations.map((f) => (
              <ReferenceLine key={f.formation_name} y={f.top_tvdss}
                stroke={FORMATION_COLORS[f.formation_name]} strokeDasharray="4 2" strokeWidth={1.5}
                label={{ value: f.formation_name.split(" ")[0], position: "right", style: { fontSize: 8, fill: FORMATION_COLORS[f.formation_name], fontFamily: "var(--font-mono)" } }} />
            ))}
            {/* Incident flags */}
            {MOCK_DATA.incident_flags.filter((f) => f.tvdss >= depthFrom && f.tvdss <= depthTo && f.wellbore.includes("NH-04")).map((f) => (
              <ReferenceLine key={f.tvdss} y={f.tvdss}
                stroke={INCIDENT_COLORS[f.event_type]} strokeWidth={2}
                label={{ value: "●", position: "left", style: { fontSize: 8, fill: INCIDENT_COLORS[f.event_type], fontFamily: "var(--font-mono)" } }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Subsurface Correlation Curtain</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            TVDSS-synchronized log tracks · Gamma Ray & MSE · Formation top alignment
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={dfimOn} onChange={(e) => setDfimOn(e.target.checked)}
              style={{ accentColor: "var(--color-live)" }} />
            <span className="mono-label">DFIM Alignment (Model 2)</span>
            <span className="badge badge-muted" style={{ fontSize: "0.58rem" }}>Mock</span>
          </label>
        </div>
      </div>

      {/* Controls */}
      <div className="panel mb-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <div className="flex justify-between mb-1">
              <span className="mono-label">Depth From</span>
              <span className="mono-data" style={{ color: "var(--color-live)" }}>{depthFrom} m TVDSS</span>
            </div>
            <input type="range" min="0" max="3000" step="50" value={depthFrom}
              onChange={(e) => setDepthFrom(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-live)" }} />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="mono-label">Depth To</span>
              <span className="mono-data" style={{ color: "var(--color-live)" }}>{depthTo} m TVDSS</span>
            </div>
            <input type="range" min="500" max="3500" step="50" value={depthTo}
              onChange={(e) => setDepthTo(parseInt(e.target.value))}
              style={{ width: "100%", accentColor: "var(--color-live)" }} />
          </div>
        </div>
      </div>

      {/* Formation legend */}
      <div className="flex items-center gap-4 mb-3">
        {Object.entries(FORMATION_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div style={{ width: 12, height: 3, background: color, borderRadius: 1 }} />
            <span className="mono-label" style={{ fontSize: "0.6rem" }}>{name}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          {Object.entries(INCIDENT_COLORS).map(([type, color]) => (
            <span key={type} className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}44`, fontSize: "0.58rem" }}>
              ● {type.replace(/_/g, " ")}
            </span>
          ))}
        </div>
      </div>

      {/* Correlation tracks */}
      <div className="panel">
        <div className="flex gap-4" style={{ minHeight: 520 }}>
          <ChartColumn title="Active Well — NH-12 (Live GR / MSE)" data={activeData} color="var(--color-live)" />
          <div style={{ width: 1, background: "var(--color-base-700)" }} />
          <ChartColumn title="Offset-1 — NH-04" data={offset1Data} color="var(--color-ok)" />
          <div style={{ width: 1, background: "var(--color-base-700)" }} />
          <ChartColumn title="Offset-2 — NH-07" data={offset2Data} color="var(--color-warning)" />
        </div>
      </div>
    </div>
  );
}
