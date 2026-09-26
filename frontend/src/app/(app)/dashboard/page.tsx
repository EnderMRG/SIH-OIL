"use client";

import { useState, useEffect, useRef } from "react";
import {
  TrendingDown, AlertTriangle, Activity, Gauge,
  Droplets, Zap, ArrowRight, Clock
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, Tooltip } from "recharts";

// --- Metric Card ---
function MetricCard({
  label, value, unit, color = "var(--color-base-50)", icon: Icon, trend
}: {
  label: string; value: string | number; unit: string;
  color?: string; icon: React.ElementType; trend?: number[];
}) {
  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-1">
        <span className="mono-label">{label}</span>
        <Icon size={13} style={{ color: "var(--color-base-600)" }} />
      </div>
      <div className="flex items-end gap-1.5">
        <span className="mono-data" style={{ fontSize: "1.5rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
        <span className="mono-label" style={{ marginBottom: 3 }}>{unit}</span>
      </div>
      {trend && (
        <div style={{ height: 32, marginTop: 6 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.map((v, i) => ({ i, v }))}>
              <Line type="monotone" dataKey="v" dot={false} strokeWidth={1.5}
                stroke={color} animationDuration={300} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// --- Hazard Risk Card ---
const HAZARD_COLORS: Record<string, string> = {
  Critical: "var(--color-critical)",
  Warning: "var(--color-warning)",
  Advisory: "var(--color-advisory)",
};

function HazardCard({ hazard }: { hazard: {
  hazard_class: string; risk_probability: number; priority: string;
  depth_window_end_tvdss: number; formation: string;
  historical_remediation: string; source_citation: { document: string; page: number };
}}) {
  const pct = Math.round(hazard.risk_probability * 100);
  const color = HAZARD_COLORS[hazard.priority] ?? "var(--color-base-400)";
  const badgeCls = hazard.priority === "Critical" ? "badge-critical" : hazard.priority === "Warning" ? "badge-warning" : "badge-advisory";

  return (
    <div className="panel-sm" style={{ borderLeft: `3px solid ${color}` }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="section-heading" style={{ fontSize: "0.8rem", color }}>
            {hazard.hazard_class.replace(/_/g, " ")}
          </div>
          <div className="mono-label" style={{ marginTop: 2 }}>at {hazard.depth_window_end_tvdss.toFixed(0)} m TVDSS · {hazard.formation}</div>
        </div>
        <span className={`badge ${badgeCls}`}>{pct}%</span>
      </div>
      <div className="risk-bar-track mb-2">
        <div
          className={pct >= 65 ? "risk-bar-fill-critical" : pct >= 40 ? "risk-bar-fill-warning" : "risk-bar-fill-ok"}
          style={{ width: `${pct}%`, height: "100%", transition: "width 400ms ease" }}
        />
      </div>
      <p style={{ fontSize: "0.72rem", color: "var(--color-base-400)", lineHeight: 1.4, marginBottom: 4 }}>
        {hazard.historical_remediation}
      </p>
      <p className="mono-label" style={{ fontSize: "0.6rem" }}>
        {hazard.source_citation.document} · p.{hazard.source_citation.page}
      </p>
    </div>
  );
}

// --- Mini Sparkline Strip ---
function SparkStrip({ label, data, color, unit }: { label: string; data: number[]; color: string; unit: string }) {
  return (
    <div className="panel-sm flex items-center gap-3">
      <div style={{ minWidth: 80 }}>
        <div className="mono-label">{label}</div>
        <div className="mono-data" style={{ color, fontSize: "1rem", fontWeight: 700 }}>
          {data[data.length - 1]?.toFixed(1)} <span className="mono-label">{unit}</span>
        </div>
      </div>
      <div style={{ flex: 1, height: 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.map((v, i) => ({ i, v }))}>
            <Line type="monotone" dataKey="v" dot={false} strokeWidth={1.5}
              stroke={color} animationDuration={0} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Main Dashboard Page ---
export default function DashboardPage() {
  const [tvdss, setTvdss] = useState(2850.2);
  const [rop, setRop] = useState(8.4);
  const [wob, setWob] = useState(18.2);
  const [torque, setTorque] = useState(12.1);
  const [flow, setFlow] = useState(2210);
  const [gas, setGas] = useState(0.82);
  const [advisory, setAdvisory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Rolling history for sparklines (60 points = ~1 min)
  const ropHist = useRef<number[]>(Array(60).fill(8.4));
  const wobHist = useRef<number[]>(Array(60).fill(18.0));
  const torqueHist = useRef<number[]>(Array(60).fill(12.0));
  const gasHist = useRef<number[]>(Array(60).fill(0.8));

  const [sparkData, setSparkData] = useState({
    rop: [...ropHist.current],
    wob: [...wobHist.current],
    torque: [...torqueHist.current],
    gas: [...gasHist.current],
  });

  // Simulate 1 Hz live telemetry updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTvdss((d) => parseFloat((d + 0.0024).toFixed(2)));
      const newRop = parseFloat((8.5 + Math.sin(Date.now() / 30000) * 3 + (Math.random() - 0.5) * 0.5).toFixed(2));
      const newWob = parseFloat((18.0 + (Math.random() - 0.5) * 1.5).toFixed(2));
      const newTorque = parseFloat((12.0 + Math.sin(Date.now() / 20000) * 2 + (Math.random() - 0.5) * 0.8).toFixed(2));
      const newGas = parseFloat((0.8 + Math.abs(Math.sin(Date.now() / 60000)) * 0.4 + (Math.random() - 0.5) * 0.1).toFixed(2));

      setRop(newRop); setWob(newWob); setTorque(newTorque); setGas(newGas);

      ropHist.current = [...ropHist.current.slice(1), newRop];
      wobHist.current = [...wobHist.current.slice(1), newWob];
      torqueHist.current = [...torqueHist.current.slice(1), newTorque];
      gasHist.current = [...gasHist.current.slice(1), newGas];

      setSparkData({ rop: [...ropHist.current], wob: [...wobHist.current], torque: [...torqueHist.current], gas: [...gasHist.current] });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch advisory data
  useEffect(() => {
    fetch(`http://localhost:8000/api/advisory/lookahead?current_tvdss=${tvdss}`)
      .then((r) => r.json())
      .then((data) => { setAdvisory(data.advisory?.slice(0, 4) ?? []); setLoading(false); })
      .catch(() => {
        // Mock fallback
        setAdvisory([
          { hazard_class: "Lost_Circulation", risk_probability: 0.78, priority: "Critical",
            depth_window_end_tvdss: 2910, formation: "Barail Group",
            historical_remediation: "40 ppb CaCO3 LCM pill spotted across loss zone",
            source_citation: { document: "NH-04 Completion Report", page: 42 } },
          { hazard_class: "Overpressure_Zone", risk_probability: 0.52, priority: "Warning",
            depth_window_end_tvdss: 2950, formation: "Barail Group",
            historical_remediation: "Mud weight increased 0.05 SG, monitored for 2 hrs",
            source_citation: { document: "NH-09 Completion Report", page: 31 } },
          { hazard_class: "Gas_Kick", risk_probability: 0.35, priority: "Warning",
            depth_window_end_tvdss: 2900, formation: "Barail Group",
            historical_remediation: "Pumped 20 bbl 16-ppg weighted plug",
            source_citation: { document: "NH-04 DDR", page: 61 } },
          { hazard_class: "Stuck_Pipe", risk_probability: 0.19, priority: "Advisory",
            depth_window_end_tvdss: 2875, formation: "Barail Group",
            historical_remediation: "50 bbl spotting fluid + overpull applied",
            source_citation: { document: "NH-07 DDR", page: 88 } },
        ]);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Command Center</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            NH-12 · Naharkatiya Field · Target TVDSS 3,200 m
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} style={{ color: "var(--color-base-600)" }} />
          <span className="mono-label">Last sync: now</span>
        </div>
      </div>

      {/* Metric cards row */}
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
        <MetricCard label="TVDSS Depth" value={tvdss.toFixed(1)} unit="m" color="var(--color-live)" icon={Activity} />
        <MetricCard label="ROP" value={rop} unit="m/hr" color="var(--color-ok)" icon={TrendingDown} trend={sparkData.rop} />
        <MetricCard label="WOB" value={wob} unit="t" color="var(--color-base-200)" icon={Gauge} trend={sparkData.wob} />
        <MetricCard label="Torque" value={torque} unit="kN·m" color="var(--color-warning)" icon={Zap} trend={sparkData.torque} />
        <MetricCard label="Flow In" value={flow} unit="lpm" color="var(--color-live)" icon={Droplets} />
        <MetricCard label="Total Gas" value={gas} unit="%" color={gas > 1.2 ? "var(--color-critical)" : "var(--color-ok)"} icon={AlertTriangle} trend={sparkData.gas} />
      </div>

      {/* Main grid: advisory + sparklines */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 360px" }}>

        {/* Left — Lookahead hazard radar */}
        <div className="panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading">Next 100 m Hazard Radar</h2>
            <a href="/advisory" className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
              Full Advisory <ArrowRight size={12} />
            </a>
          </div>
          {loading ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[1,2,3,4].map((i) => (
                <div key={i} className="panel-sm" style={{ height: 100, background: "var(--color-base-800)", animation: "pulse 1.5s ease-in-out infinite" }} />
              ))}
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {advisory.map((h) => <HazardCard key={h.hazard_class} hazard={h} />)}
            </div>
          )}
        </div>

        {/* Right — 1-minute telemetry sparklines */}
        <div className="panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading">Live Strip — 60 sec</h2>
            <a href="/telemetry" className="btn btn-ghost" style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem" }}>
              Full Cockpit <ArrowRight size={12} />
            </a>
          </div>
          <div className="flex flex-col gap-2">
            <SparkStrip label="ROP"    data={sparkData.rop}    color="var(--color-ok)"      unit="m/hr" />
            <SparkStrip label="WOB"    data={sparkData.wob}    color="var(--color-live)"    unit="t" />
            <SparkStrip label="Torque" data={sparkData.torque} color="var(--color-warning)"  unit="kN·m" />
            <SparkStrip label="Gas"    data={sparkData.gas}    color="var(--color-advisory)" unit="%" />
          </div>
        </div>
      </div>
    </div>
  );
}
