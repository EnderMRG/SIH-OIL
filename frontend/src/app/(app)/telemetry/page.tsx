"use client";

import React, { useState, useEffect } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepthShort } from "@/lib/units";

interface TelemetryPoint {
  time: number;
  rop: number;
  wob: number;
  torque: number;
  rpm: number;
  spp: number;
  flow: number;
  pvt: number;
  gas: number;
}

export default function TelemetryPage() {
  const { unitSystem } = useGlobalContext();
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [bufferWindow, setBufferWindow] = useState<"60s" | "120s" | "5m">("120s");
  const [showGhost, setShowGhost] = useState<boolean>(true);
  const [scrubIndex, setScrubIndex] = useState<number>(102);

  const [live, setLive] = useState({
    rop: 18.4,
    wob: 14.2,
    torque: 18.6,
    rpm: 124,
    spp: 3120,
    flow: 1.4,
    pvt: 88.5,
    gas: 0.85,
    depth: 2850.2,
  });

  const [history, setHistory] = useState<TelemetryPoint[]>(() => {
    const init = [];
    const now = Date.now();
    for (let i = 120; i >= 0; i--) {
      init.push({
        time: now - i * 1000,
        rop: 18.4,
        wob: 14.2,
        torque: 18.6,
        rpm: 124,
        spp: 3120,
        flow: 1.4,
        pvt: 88.5,
        gas: 0.85,
        depth: +(2850.2 - i * 0.002).toFixed(2),
      });
    }
    return init;
  });

  // 1 Hz Live Stream simulation
  useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      const now = Date.now();
      setLive((prev) => {
        const next = {
          rop: +(18.0 + Math.sin(now / 4000) * 1.5 + (Math.random() - 0.5) * 0.4).toFixed(1),
          wob: +(14.0 + (Math.random() - 0.5) * 0.6).toFixed(1),
          torque: +(18.4 + Math.sin(now / 2500) * 0.8 + (Math.random() - 0.5) * 0.3).toFixed(1),
          rpm: Math.round(123 + (Math.random() - 0.5) * 4),
          spp: Math.round(3115 + (Math.random() - 0.5) * 18),
          flow: +(1.2 + (Math.random() - 0.5) * 0.4).toFixed(1),
          pvt: +(88.5 + (Math.random() - 0.5) * 0.04).toFixed(2),
          gas: +(0.82 + Math.abs(Math.sin(now / 8000)) * 0.08).toFixed(2),
          depth: +(prev.depth + 0.002).toFixed(2),
        };
        
        setHistory(h => [...h.slice(1), { time: now, ...next }]);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isStreaming]);

  const renderPath = (key: keyof Omit<TelemetryPoint, "time" | "depth">, min: number, max: number) => {
    return history.map((pt, i) => {
      const x = (i / 120) * 280;
      const clamped = Math.max(min, Math.min(max, pt[key]));
      const y = 80 - ((clamped - min) / (max - min)) * 80;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };

  const scrubDepth = (live.depth - (120 - scrubIndex) * 0.002).toFixed(1);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      <div className="p-6 max-w-[1720px] mx-auto w-full space-y-4">
        {/* Top Operational Header Bar */}
        <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 pb-4 bg-[#f5f4ef] p-5 rounded-xl border border-[#dbdad6] shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                SYSTEM SMR-4 // LIVE FEED
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#fecf50] animate-ping"></span>
              <span className="text-[10px] font-mono text-[#765b00] tracking-widest uppercase font-semibold">
                STREAM LOCK VERIFIED
              </span>
            </div>
            <h1 className="font-serif text-[32px] font-bold text-[#0d0d0d] tracking-tight leading-none">
              Telemetry Cockpit
            </h1>
            <p className="text-[13px] text-[#444748]">
              High-Frequency 1 Hz WITSML Streaming Feed · 2-Minute Rolling Buffer (Rig SE-802 · North Assam Shelf)
            </p>
          </div>

          {/* Global Controls & Status Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Buffer Switcher */}
            <div className="flex items-center bg-[#e9e8e4] p-0.5 rounded-full text-[11px] font-mono border border-[#dbdad6]">
              {(["60s", "120s", "5m"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBufferWindow(b)}
                  className={`px-3 py-1 rounded-full transition-colors ${
                    bufferWindow === b
                      ? "bg-[#0d0d0d] text-white font-semibold shadow-sm"
                      : "text-[#444748] hover:text-[#0d0d0d]"
                  }`}
                  type="button"
                >
                  {b}
                </button>
              ))}
            </div>

            {/* Pause / Stream Toggle */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#efeeea] hover:bg-[#e3e2de] text-[11px] font-mono text-[#0d0d0d] border border-[#dbdad6] transition-colors"
            >
              <span className="material-symbols-outlined text-[15px]">
                {isStreaming ? "pause_circle" : "play_circle"}
              </span>
              <span>{isStreaming ? "Pause Stream" : "Resume Stream"}</span>
            </button>

            {/* Export */}
            <button
              onClick={() => {
                let csv = "timestamp,depth,rop,wob,torque,rpm,spp,flow,pvt,gas\n";
                history.forEach(pt => {
                  csv += `${pt.time},${pt.depth},${pt.rop},${pt.wob},${pt.torque},${pt.rpm},${pt.spp},${pt.flow},${pt.pvt},${pt.gas}\n`;
                });
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "live_telemetry_feed.csv";
                a.click();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0d0d0d] text-white hover:opacity-90 text-[11px] font-mono font-semibold transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">download</span>
              <span>Export CSV / WITSML</span>
            </button>
          </div>
        </header>

        {/* Operational Strip Status Pills */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-[#dbdad6] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#fecf50]"></span>
              <span className="text-[10px] font-mono text-[#444748] uppercase">Rig State</span>
            </div>
            <span className="text-[11px] font-mono text-[#0d0d0d] font-bold tracking-wider">ROTARY DRILLING</span>
          </div>

          <div
            onClick={() => setShowGhost(!showGhost)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-[#dbdad6] shadow-sm cursor-pointer hover:bg-[#faf9f5]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#765b00]">stacked_line_chart</span>
              <span className="text-[10px] font-mono text-[#444748] uppercase">Ghost Curve</span>
            </div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${showGhost ? "bg-[#ffdf95] text-[#594400]" : "bg-[#e9e8e4] text-[#444748]"}`}>
              OIL-NH-04 {showGhost ? "(ON)" : "(OFF)"}
            </span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-[#dbdad6] shadow-sm">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#0d0d0d]">sensors</span>
              <span className="text-[10px] font-mono text-[#444748] uppercase">Stream Latency</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]"></span> 0.8s LIVE
            </span>
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-white border border-[#dbdad6] shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <span className="material-symbols-outlined text-[15px] text-[#444748]">lock</span>
              <span className="text-[10px] font-mono text-[#444748] uppercase truncate">WITSML Server</span>
            </div>
            <span className="text-[10px] font-mono text-[#0d0d0d] truncate font-semibold">witsml.oilindia.in · 1.0Hz</span>
          </div>
        </div>

        {/* Main Strip Chart Grid (2 Rows x 4 Columns = 8 Synchronized Channels) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Channel 01: ROP */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-01 · ROP</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Rate of Pen.</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.rop}
                  </span>
                  <span className="text-[11px] font-mono text-[#444748]">
                    {unitSystem === "IMPERIAL" ? "ft/hr" : "m/hr"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  <span className="material-symbols-outlined text-[12px]">arrow_drop_up</span>+4.2%
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 0 - 25</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-2 border-b border-[#dbdad6]/50 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>25 m/h</span>
                <span>PEAK 21.2</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,55 Q 30,50 60,54 T 120,48 T 180,42 T 240,40 T 280,38"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("rop", 0, 25)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(0, Math.min(25, live.rop)) / 25) * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">NOW (1.0 Hz)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Bit: PDC 8-1/2&quot; M13</span>
              <span className="text-[#765b00] font-semibold">Corridor: Optimum</span>
            </div>
          </article>

          {/* Channel 02: WOB */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-02 · WOB</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Weight on Bit</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.wob}
                  </span>
                  <span className="text-[11px] font-mono text-[#444748]">
                    {unitSystem === "IMPERIAL" ? "klb" : "tonnes"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  Steady
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 0 - 35 t</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-8 bottom-6 bg-[#e3e2de]/50 rounded"></div>
              <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>35 t Max</span>
                <span>Nominal: 12-16 t</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,42 Q 40,40 80,44 T 160,38 T 240,43 T 280,41"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("wob", 0, 35)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(0, Math.min(35, live.wob)) / 35) * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">NOW (1.0 Hz)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Axial Force: Dynamic</span>
              <span className="text-[#0d0d0d] font-semibold">Buckling Risk: Nil</span>
            </div>
          </article>

          {/* Channel 03: Torque */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-03 · TORQUE</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Surface Rotary</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.torque}
                  </span>
                  <span className="text-[11px] font-mono text-[#444748]">kN·m</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  <span className="material-symbols-outlined text-[12px]">arrow_drop_down</span>-1.8%
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 0 - 30</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>30 kN·m</span>
                <span>Variance ±0.4</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,36 Q 50,33 100,35 T 200,37 T 280,35"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("torque", 0, 30)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(0, Math.min(30, live.torque)) / 30) * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">NOW (1.0 Hz)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Stick-Slip: 8.2% Low</span>
              <span className="text-[#0d0d0d] font-semibold">Torsional Damped</span>
            </div>
          </article>

          {/* Channel 04: Rotary RPM */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-04 · RPM</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Top Drive Speed</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.rpm}
                  </span>
                  <span className="text-[11px] font-mono text-[#444748]">rpm</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  Nominal
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 0 - 200</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>200 rpm</span>
                <span>Steady Harmonic</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,33 L 70,33 L 140,32 L 210,34 L 280,33"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("rpm", 0, 200)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(0, Math.min(200, live.rpm)) / 200) * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">NOW (1.0 Hz)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Motor Setpoint: 125</span>
              <span className="text-[#765b00] font-semibold">Phase Lock: True</span>
            </div>
          </article>

          {/* Channel 05: SPP */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-05 · SPP</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Standpipe Press.</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.spp.toLocaleString()}
                  </span>
                  <span className="text-[11px] font-mono text-[#444748]">
                    {unitSystem === "IMPERIAL" ? "psi" : "bar"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  <span className="material-symbols-outlined text-[12px]">arrow_drop_up</span>+45 psi
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 0 - 4500</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>4500 psi Max</span>
                <span>Triplex Pump #1 &amp; #2</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,28 Q 60,30 120,29 T 240,28 T 280,27"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("spp", 0, 4500)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(0, Math.min(4500, live.spp)) / 4500) * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">NOW (1.0 Hz)</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>ECD: 1.34 SG</span>
              <span className="text-[#0d0d0d] font-semibold">Circulation: Normal</span>
            </div>
          </article>

          {/* Channel 06: Flow Delta */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-06 · FLOW Δ</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Paddle vs Pump</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    +{live.flow}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  Normal
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale -20% to +20%</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-1/2 border-b border-[#dbdad6]"></div>
              <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>+20% (Kick Alert)</span>
                <span>-20% (Loss Alert)</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                <path d="M 0,40 L 280,40" stroke="#dbdad6" strokeWidth="1" strokeDasharray="2 2" />
                <path
                  d={renderPath("flow", -20, 20)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(-20, Math.min(20, live.flow)) - (-20)) / 40 * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">ZERO BIAS 0.0%</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Kick Margin: &gt; 15%</span>
              <span className="text-[#765b00] font-semibold">Influx Guard: OK</span>
            </div>
          </article>

          {/* Channel 07: Pit Volume Total */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-07 · PVT</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Pit Volume Total</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.pvt}
                  </span>
                  <span className="text-[11px] font-mono text-[#444748]">
                    {unitSystem === "IMPERIAL" ? "bbl" : "m³"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  Steady
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 70 - 100 m³</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-2 flex justify-between text-[9px] font-mono text-[#444748]/70">
                <span>100 m³ Cap</span>
                <span>Active Tanks: 1, 2, 4</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,32 L 60,32 L 120,32 L 180,31 L 240,31 L 280,31"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("pvt", 70, 100)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(70, Math.min(100, live.pvt)) - 70) / 30 * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">NET DIFF ±0.02</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Suction Pit: 32.4 m³</span>
              <span className="text-[#0d0d0d] font-semibold">Reserve: Nominal</span>
            </div>
          </article>

          {/* Channel 08: Total Gas Detector */}
          <article className="bg-white p-4 rounded-xl flex flex-col justify-between border border-[#dbdad6] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#444748] uppercase font-semibold">CH-08 · GAS</span>
                  <span className="text-[10px] font-mono text-[#444748]/70">Total Gas Det.</span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[28px] font-mono text-[#0d0d0d] font-bold tracking-tight">
                    {live.gas}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono font-semibold text-[#0d0d0d]">
                  Normal &lt; 1.2%
                </span>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Scale 0 - 5.0 %</div>
              </div>
            </div>

            <div className="my-3 h-28 w-full bg-[#f5f4ef] rounded-lg p-2 flex flex-col justify-between relative border border-[#dbdad6]">
              <div className="absolute inset-x-2 top-[45%] border-b border-[#765b00] border-dashed flex justify-end">
                <span className="text-[9px] font-mono text-[#765b00] -mt-3.5 font-semibold">ALERT 1.2%</span>
              </div>
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 280 80">
                {showGhost && (
                  <path
                    d="M 0,55 Q 60,60 120,58 T 240,54 T 280,50"
                    fill="none"
                    stroke="#858383"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                  />
                )}
                <path
                  d={renderPath("gas", 0, 5)}
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.2"
                />
                <circle cx="280" cy={80 - (Math.max(0, Math.min(5, live.gas)) / 5) * 80} r="3.5" fill="#fecf50" stroke="#0d0d0d" strokeWidth="1" />
              </svg>
              <div className="flex items-center justify-between text-[9px] font-mono text-[#444748]/70 pt-1">
                <span>T - 120s</span>
                <span>T - 60s</span>
                <span className="text-[#0d0d0d] font-semibold">C1-C5 RATIO: 94/6</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748]">
              <span>Chromatograph: C1 92%</span>
              <span className="text-[#765b00] font-semibold">H2S: 0.00 ppm</span>
            </div>
          </article>
        </section>

        {/* Bottom Diagnostic & Synchronized Scrub Timeline Bar */}
        <footer className="bg-white p-5 rounded-xl space-y-4 border border-[#dbdad6] shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#f5f4ef] p-3 rounded-lg border border-[#dbdad6]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[18px] text-[#0d0d0d]">timeline</span>
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] font-mono text-[#444748] uppercase">SYNCHRONIZED SCRUB</span>
                <span className="text-[11px] font-mono text-[#0d0d0d] font-bold px-2 py-0.5 rounded bg-[#e9e8e4]">
                  T - {120 - scrubIndex}s
                </span>
              </div>
              <div className="h-3 w-px bg-[#dbdad6] hidden sm:block"></div>
              <p className="text-[11px] font-mono text-[#0d0d0d] font-medium hidden lg:block">
                Depth: <span className="font-bold">{fmtDepthShort(+scrubDepth, unitSystem)}</span> · ROP:{" "}
                <span className="font-bold">{history[scrubIndex]?.rop?.toFixed(1) || live.rop}</span> · WOB:{" "}
                <span className="font-bold">{history[scrubIndex]?.wob?.toFixed(1) || live.wob}t</span> · Torque:{" "}
                <span className="font-bold">{history[scrubIndex]?.torque?.toFixed(1) || live.torque} kN·m</span> · SPP:{" "}
                <span className="font-bold">{history[scrubIndex]?.spp || live.spp} psi</span>
              </p>
            </div>

            {/* Scrub range slider */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#444748]">-120s</span>
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={scrubIndex}
                  onChange={(e) => setScrubIndex(parseInt(e.target.value))}
                  className="w-32 sm:w-48 lg:w-64 slider-round"
                  title="Drag to rewind feed and inspect historical values"
                />
                <span className="text-[10px] font-mono text-[#0d0d0d] font-bold">0s</span>
              </div>
              <span className="text-[9px] font-mono text-[#444748]">
                Drag slider to inspect historical telemetry values.
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
