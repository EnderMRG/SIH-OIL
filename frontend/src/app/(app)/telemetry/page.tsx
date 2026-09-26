"use client";

import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Wifi, WifiOff, Layers } from "lucide-react";

const CHANNEL_CONFIG = [
  { key: "rop_mhr",      label: "ROP",         unit: "m/hr", color: "var(--color-ok)",       min: 0,    max: 25 },
  { key: "wob_tonnes",   label: "WOB",         unit: "t",    color: "var(--color-live)",     min: 0,    max: 35 },
  { key: "torque_knm",   label: "Torque",      unit: "kN·m", color: "var(--color-warning)",  min: 0,    max: 30 },
  { key: "rpm",          label: "RPM",         unit: "rpm",  color: "var(--color-advisory)", min: 0,    max: 200 },
  { key: "spp_psi",      label: "SPP",         unit: "psi",  color: "#c4b5fd",              min: 0,    max: 4500 },
  { key: "flow_out_pct", label: "Flow Delta",  unit: "%",    color: "var(--color-live)",     min: 50,   max: 105 },
  { key: "pit_volume_m3",label: "Pit Volume",  unit: "m³",   color: "#67e8f9",              min: 75,   max: 100 },
  { key: "total_gas_pct",label: "Total Gas",   unit: "%",    color: "var(--color-critical)", min: 0,    max: 5 },
];

const RIG_STATE_COLORS: Record<string, string> = {
  DRILLING_ROTARY: "var(--color-ok)",
  DRILLING_SLIDE: "#86efac",
  CONNECTION: "var(--color-warning)",
  TRIPPING_IN: "var(--color-advisory)",
  TRIPPING_OUT: "#a78bfa",
  CIRCULATING: "var(--color-live)",
  PUMPS_OFF: "var(--color-base-400)",
};

const WINDOW = 120; // 2-minute rolling window

type Frame = {
  timestamp: string;
  rig_state: string;
  bit_depth_tvdss: number;
  rop_mhr: number;
  wob_tonnes: number;
  torque_knm: number;
  rpm: number;
  spp_psi: number;
  flow_out_pct: number;
  pit_volume_m3: number;
  total_gas_pct: number;
  [key: string]: unknown;
};

function generateMockFrame(idx: number): Frame {
  const states = ["DRILLING_ROTARY","DRILLING_ROTARY","DRILLING_ROTARY","CONNECTION","CIRCULATING","DRILLING_ROTARY"];
  const rig_state = states[Math.floor(idx / 20) % states.length];
  const drilling = rig_state === "DRILLING_ROTARY" || rig_state === "DRILLING_SLIDE";
  return {
    timestamp: new Date().toISOString(),
    rig_state,
    bit_depth_tvdss: 2850 + idx * 0.0024,
    rop_mhr:      drilling ? 8.5 + Math.sin(idx / 30) * 3 + (Math.random() - 0.5) * 0.5 : 0,
    wob_tonnes:   drilling ? 18 + (Math.random() - 0.5) * 2 : 0,
    torque_knm:   drilling ? 12 + Math.sin(idx / 20) * 2 + (Math.random() - 0.5) * 0.8 : 0,
    rpm:          rig_state === "DRILLING_ROTARY" ? 120 + (Math.random() - 0.5) * 6 : 0,
    spp_psi:      drilling ? 2800 + Math.sin(idx / 25) * 80 + (Math.random() - 0.5) * 20 : 0,
    flow_out_pct: drilling ? 98.5 + (Math.random() - 0.5) * 1 : 0,
    pit_volume_m3: 85 + (Math.random() - 0.5) * 0.2,
    total_gas_pct: drilling ? 0.8 + Math.abs(Math.sin(idx / 60)) * 0.4 + (Math.random() - 0.5) * 0.1 : 0,
  };
}

function ChartPanel({ ch, data }: { ch: typeof CHANNEL_CONFIG[0]; data: Frame[] }) {
  const chartData = data.map((f, i) => ({ t: i, v: parseFloat((f[ch.key] as number ?? 0).toFixed(2)) }));
  const current = chartData[chartData.length - 1]?.v ?? 0;

  return (
    <div className="chart-container" style={{ marginBottom: 8 }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="mono-label">{ch.label}</span>
          <span className="mono-data" style={{ marginLeft: 8, color: ch.color, fontSize: "1.1rem", fontWeight: 700 }}>
            {current.toFixed(ch.key === "bit_depth_tvdss" ? 2 : 1)}
          </span>
          <span className="mono-label" style={{ marginLeft: 4 }}>{ch.unit}</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={70}>
        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="var(--color-base-700)" vertical={false} />
          <Line type="monotone" dataKey="v" dot={false} strokeWidth={1.5} stroke={ch.color} animationDuration={0} />
          <Tooltip
            contentStyle={{ background: "var(--color-base-900)", border: "1px solid var(--color-base-700)", borderRadius: 4, fontSize: 11 }}
            labelFormatter={(l: any) => `t-${WINDOW - (l as number)}s`}
            formatter={(v: any) => [`${v} ${ch.unit}`, ch.label]}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TelemetryPage() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [connected, setConnected] = useState(false);
  const [tick, setTick] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const mockIdx = useRef(0);

  useEffect(() => {
    // Try real WS first; fall back to mock if not available
    try {
      const ws = new WebSocket("ws://localhost:8000/ws/telemetry");
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => { setConnected(false); startMock(); };
      ws.onerror = () => { ws.close(); };

      ws.onmessage = (event) => {
        const frame: Frame = JSON.parse(event.data);
        setFrames((prev) => [...prev.slice(-(WINDOW - 1)), frame]);
        setTick((t) => t + 1);
      };
    } catch {
      startMock();
    }

    return () => wsRef.current?.close();
  }, []);

  function startMock() {
    const interval = setInterval(() => {
      const frame = generateMockFrame(mockIdx.current++);
      setFrames((prev) => [...prev.slice(-(WINDOW - 1)), frame]);
      setTick((t) => t + 1);
      setConnected(true);
    }, 1000);
    return () => clearInterval(interval);
  }

  const latestFrame = frames[frames.length - 1];
  const rigState = latestFrame?.rig_state ?? "—";
  const rigStateColor = RIG_STATE_COLORS[rigState] ?? "var(--color-base-400)";

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Live Telemetry Cockpit</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            eRTMAC WITSML 1 Hz stream · 2-minute rolling window
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-muted">
            <Layers size={9} />
            Ghost Curve: NH-04
          </span>
          <span className={`badge ${connected ? "badge-live" : "badge-critical"}`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? `${tick}s` : "STALE"}
          </span>
          <div className="badge" style={{ background: `${rigStateColor}22`, color: rigStateColor, border: `1px solid ${rigStateColor}44` }}>
            {rigState.replace(/_/g, " ")}
          </div>
        </div>
      </div>

      {/* Channel charts */}
      {frames.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "3rem" }}>
          <div className="pulse-dot" style={{ margin: "0 auto 1rem" }} />
          <p className="text-secondary">Connecting to eRTMAC WITSML stream…</p>
        </div>
      ) : (
        <div className="grid gap-0" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {CHANNEL_CONFIG.map((ch) => (
            <ChartPanel key={ch.key} ch={ch} data={frames} />
          ))}
        </div>
      )}
    </div>
  );
}
