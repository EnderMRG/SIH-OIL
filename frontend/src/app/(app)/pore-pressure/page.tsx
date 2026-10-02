"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepthShort } from "@/lib/units";

export default function PorePressurePage() {
  const { unitSystem, setSandboxParameters } = useGlobalContext();
  const [mw, setMw] = useState<number>(1.30);
  const [flow, setFlow] = useState<number>(2450);
  const [rop, setRop] = useState<number>(18.0);
  const [rpm, setRpm] = useState<string>("120");
  const [pill, setPill] = useState<string>("ca40");
  const [committed, setCommitted] = useState<boolean>(false);

  // Dynamic calculations based on sandbox parameters
  const rpmValue = parseInt(rpm) || 120;
  const rpmFactor = (rpmValue - 120) * 0.0001;
  let pillFactor = 0;
  if (pill === "ca40") pillFactor = 0.01;
  else if (pill === "graphite") pillFactor = 0.008;
  else if (pill === "combo") pillFactor = 0.015;

  const annularLoss = (flow / 2450 - 1) * 0.035 + (rop / 18 - 1) * 0.015 + rpmFactor + pillFactor;
  const simulatedEcd = +(mw + annularLoss + 0.04).toFixed(2);
  const ppAtBit = 1.27; // Barail top
  const fgAtBit = 1.38; // Formation fracture limit at 2850m
  const kickMargin = +(simulatedEcd - ppAtBit).toFixed(2);
  const lossMargin = +(fgAtBit - simulatedEcd).toFixed(2);

  const isSafe = simulatedEcd >= ppAtBit && simulatedEcd <= fgAtBit;
  const isLoss = simulatedEcd > fgAtBit;
  const isKick = simulatedEcd < ppAtBit;

  const chartData = React.useMemo(() => {
    const data = [];
    for (let depth = 0; depth <= 3400; depth += 20) {
      let pp = 1.0;
      if (depth > 2000) pp = 1.0 + Math.pow((depth - 2000) / 1400, 2) * 0.35;
      let fg = 1.5;
      if (depth > 1000) fg = 1.5 + ((depth - 1000) / 2400) * 0.2;
      
      if (depth >= 2840 && depth <= 3150) {
        fg = 1.38 + ((depth - 2910) / 100) * 0.05;
        if (fg < 1.38) fg = 1.38;
      }

      data.push({
        depth,
        pp: Number(pp.toFixed(2)),
        fg: Number(fg.toFixed(2)),
        plannedMw: 1.28,
        activeEcd: depth <= 2850 ? simulatedEcd : null,
      });
    }
    return data;
  }, [simulatedEcd]);

  const handleCommit = () => {
    setSandboxParameters(simulatedEcd, pill);
    setCommitted(true);
    setTimeout(() => setCommitted(false), 3500);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      <div className="px-6 py-6 flex flex-col gap-6">
        {/* Top Editorial Header & Operational Telemetry Metadata */}
        <header className="flex flex-col gap-3 pb-3 border-b border-[#dbdad6]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#444748]">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#e9e8e4] text-[#0d0d0d] font-semibold border border-[#dbdad6]">
                SYS // MOD-PP05
              </span>
              <span>·</span>
              <span>EATON GEOPRESSURE MODEL v3.2</span>
              <span>·</span>
              <span className="text-[#765b00] font-semibold flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#fecf50]"></span>
                ACTIVE CONSOLE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#444748]">
              <span className="px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6] text-[#0d0d0d]">
                SURFACE SEC: 12-1/4&quot;
              </span>
              <span className="px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6] text-[#0d0d0d]">
                REF TVD: KELLY BUSHING +14.2m
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="font-serif text-[34px] font-bold text-[#0d0d0d] tracking-tight leading-none mb-1">
                Pore Pressure &amp; Frac Window
              </h1>
              <p className="text-[14px] text-[#444748]">
                Deterministic Hydraulic Sandbox &amp; Dynamic Downhole Gradient Prognosis
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-[#e9e8e4] border border-[#dbdad6] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0d0d0d]"></span>
                <span className="text-[10px] font-mono uppercase text-[#444748]">Current Bit TVDSS:</span>
                <span className="text-[11px] font-mono font-bold text-[#0d0d0d]">
                  {fmtDepthShort(2850.2, unitSystem)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#e9e8e4] border border-[#dbdad6] flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-[#444748]">Formation:</span>
                <span className="text-[11px] font-mono font-bold text-[#0d0d0d]">Tipam Arenaceous</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#e9e8e4] border border-[#dbdad6] flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-[#444748]">MW Plan:</span>
                <span className="text-[11px] font-mono font-bold text-[#0d0d0d]">1.28 SG</span>
              </div>
              <div className="px-3 py-1.5 rounded-full bg-[#fecf50]/30 border border-[#fecf50] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#765b00]"></span>
                <span className="text-[10px] font-mono uppercase text-[#735800]">Simulated ECD:</span>
                <span className="text-[11px] font-mono font-bold text-[#735800]">{simulatedEcd} SG</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Layout (2 Columns: Plot Area | Anchored Sandbox 400px) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Vertical Pressure Window Depth Chart */}
          <section className="xl:col-span-8 flex flex-col gap-4">
            <div className="relative w-full rounded-2xl bg-white border border-[#dbdad6] p-4 shadow-sm overflow-hidden">
              <div className="absolute right-4 bottom-4 text-[70px] text-[#e3e2de] select-none pointer-events-none opacity-40 font-serif z-0">
                OIL-NH12
              </div>
              <div className="w-full h-[680px] z-10 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9e8e4" />
                    <XAxis 
                      type="number" 
                      domain={['auto', 'auto']} 
                      tick={{ fontSize: 10, fill: '#444748', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#dbdad6' }}
                      label={{ value: 'Equivalent Mud Weight (SG)', position: 'bottom', fontSize: 10, fill: '#444748' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="depth" 
                      reversed={true} 
                      domain={[0, 3400]} 
                      ticks={[0, 500, 1000, 1500, 2000, 2500, 3000, 3400]}
                      tick={{ fontSize: 10, fill: '#444748', fontFamily: 'monospace' }}
                      axisLine={{ stroke: '#dbdad6' }}
                      label={{ value: 'TVDSS (m)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#444748' }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#faf9f5', border: '1px solid #dbdad6', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', paddingTop: '20px' }} />
                    
                    {/* Depth Horizons / Casing Shoes */}
                    <ReferenceLine y={380} stroke="#dbdad6" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: '13⅜" CSG SHOE @ 380m', fill: '#444748', fontSize: 10 }} />
                    <ReferenceLine y={2150} stroke="#dbdad6" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: '9⅝" CSG SHOE @ 2,150m', fill: '#444748', fontSize: 10 }} />
                    <ReferenceLine y={3020} stroke="#fecf50" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'PROP 7" LINER @ 3,020m', fill: '#765b00', fontSize: 10 }} />
                    <ReferenceLine y={2850} stroke="#0d0d0d" strokeWidth={2} label={{ position: 'insideBottomLeft', value: 'CURRENT DEPTH: 2,850m', fill: '#0d0d0d', fontSize: 10, fontWeight: 'bold' }} />
                    
                    <Line type="monotone" dataKey="pp" name="Pore Pressure (PP)" stroke="#ba1a1a" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="fg" name="Fracture Gradient (FG)" stroke="#765b00" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line type="step" dataKey="plannedMw" name="Planned MW (1.28)" stroke="#0d0d0d" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                    <Line type="monotone" dataKey="activeEcd" name="Active ECD" stroke="#fecf50" strokeDasharray="5 5" strokeWidth={3} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom Geological Notes */}
              <div className="mt-4 pt-3 border-t border-[#dbdad6] grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] font-mono text-[#444748]">
                <div className="flex flex-col">
                  <span className="text-[#0d0d0d] font-semibold uppercase">Pore Pressure Regime</span>
                  <span>Sub-hydrostatic transition to Barail Overpressure ramp below 2,840 m.</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#0d0d0d] font-semibold uppercase">Shoe Integrity Margin</span>
                  <span>Intermediate 9⅝″ Shoe LOT established at 1.48 SG FIT with +0.14 SG safety cushion.</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[#0d0d0d] font-semibold uppercase">Caliper / Geometry</span>
                  <span>12¼″ Hole Section with 7.4% average wash-out in upper arenaceous layers.</span>
                </div>
              </div>
            </div>

            {/* Archival Offset Correlation Snippet */}
            <div className="p-3.5 rounded-xl bg-[#efeeea] border border-[#dbdad6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#e3e2de] flex items-center justify-center text-[#0d0d0d] text-[11px] font-mono font-bold">
                  REF
                </div>
                <div>
                  <p className="text-[12px] text-[#0d0d0d] font-semibold">
                    Calibrated with Offset Well NH-04 Post-Drill Data
                  </p>
                  <p className="text-[10px] font-mono text-[#444748]">
                    Sonic Delta-t and Corrected d-Exponent (dc) match Eaton exponent n = 1.20 within ±0.02 SG.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold uppercase tracking-wider">
                EATON CONFIDENCE: 96.8%
              </span>
            </div>
          </section>

          {/* RIGHT COLUMN: Deterministic 'What-If' Hydraulic Sandbox */}
          <aside className="xl:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl bg-white border border-[#dbdad6] p-5 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#dbdad6] pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#444748]">
                    PHYSICS SANDBOX
                  </span>
                  <h2 className="font-serif text-[24px] font-bold text-[#0d0d0d] leading-tight">
                    Hydraulic Simulation
                  </h2>
                </div>
                <span className="w-3 h-3 rounded-full bg-[#fecf50] animate-pulse" title="Online Kernel"></span>
              </div>

              {/* Parameter Sliders */}
              <div className="space-y-4">
                {/* Mud Weight */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[#0d0d0d]">Test Mud Weight (SG)</label>
                    <span className="text-[12px] font-mono font-bold text-[#0d0d0d] px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6]">
                      {mw.toFixed(2)} SG
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.05"
                    max="1.70"
                    step="0.01"
                    value={mw}
                    onChange={(e) => setMw(parseFloat(e.target.value))}
                    className="w-full slider-round"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                    <span>1.05 (Water base)</span>
                    <span>Base: 1.28</span>
                    <span>1.70 SG</span>
                  </div>
                </div>

                {/* Flow Rate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[#0d0d0d]">Circulating Flow Rate (L/min)</label>
                    <span className="text-[12px] font-mono font-bold text-[#0d0d0d] px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6]">
                      {flow} L/min
                    </span>
                  </div>
                  <input
                    type="range"
                    min="800"
                    max="3500"
                    step="50"
                    value={flow}
                    onChange={(e) => setFlow(parseInt(e.target.value))}
                    className="w-full slider-round"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                    <span>800 L/min</span>
                    <span>Nominal: 2,400</span>
                    <span>3,500 L/min</span>
                  </div>
                </div>

                {/* ROP */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-medium text-[#0d0d0d]">Planned ROP (m/hr)</label>
                    <span className="text-[12px] font-mono font-bold text-[#0d0d0d] px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6]">
                      {rop.toFixed(1)} m/hr
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="35"
                    step="0.5"
                    value={rop}
                    onChange={(e) => setRop(parseFloat(e.target.value))}
                    className="w-full slider-round"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                    <span>1.0 m/hr</span>
                    <span>Trip: 12.0</span>
                    <span>35.0 m/hr</span>
                  </div>
                </div>

                {/* RPM & Pill Selector */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-[#444748]">Drillpipe RPM</label>
                    <select
                      value={rpm}
                      onChange={(e) => setRpm(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-[#efeeea] border border-[#dbdad6] text-[12px] font-mono text-[#0d0d0d]"
                    >
                      <option value="90">90 rpm</option>
                      <option value="120">120 rpm</option>
                      <option value="140">140 rpm</option>
                      <option value="160">160 rpm</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono uppercase text-[#444748]">Annular LCM Pill</label>
                    <select
                      value={pill}
                      onChange={(e) => setPill(e.target.value)}
                      className="w-full px-2 py-1.5 rounded bg-[#efeeea] border border-[#dbdad6] text-[12px] font-mono text-[#0d0d0d]"
                    >
                      <option value="none">None Active</option>
                      <option value="ca40">40 ppb CaCO3</option>
                      <option value="graphite">25 ppb Graphite</option>
                      <option value="combo">Combo Crosslink</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Output Panel & Calculated Verdict */}
              <div className="p-4 rounded-xl bg-[#f5f4ef] border border-[#dbdad6] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#444748]">
                    CALCULATED VERDICT
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase ${
                      isSafe
                        ? "bg-[#0d0d0d] text-white"
                        : "bg-[#ba1a1a] text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px] text-[#fecf50]">
                      {isSafe ? "check_circle" : "warning"}
                    </span>
                    {isSafe
                      ? "SAFE DRILLING WINDOW"
                      : isLoss
                      ? "FRACTURE / LOSS RISK"
                      : "UNDERBALANCED KICK RISK"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#dbdad6] text-[11px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-[#444748]">Modeled Annular ECD:</span>
                    <span className="font-bold text-[#0d0d0d]">
                      {simulatedEcd} SG{" "}
                      <span className="text-[10px] font-normal text-[#765b00]">
                        ({lossMargin > 0 ? `+${lossMargin} SG Frac Margin` : `${lossMargin} SG EXCEEDED`})
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#444748]">Kick Margin (over PP):</span>
                    <span className="text-[#0d0d0d]">+{kickMargin} SG Influx Barrier</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#444748]">Kick Tolerance:</span>
                    <span className="text-[#0d0d0d] font-semibold">4.8 m³ gas influx</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#444748]">Cuttings Transport:</span>
                    <span className="text-[#0d0d0d]">94.2% Optimal</span>
                  </div>
                </div>
              </div>

              {/* Operational Hazard Advisory */}
              <div className="p-3.5 rounded-xl bg-[#efeeea] border border-[#dbdad6] flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#ba1a1a] font-bold">*</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#0d0d0d] font-bold">
                    OPERATIONAL HAZARD ADVISORY
                  </span>
                </div>
                <p className="text-[11px] text-[#444748] leading-relaxed">
                  At 2,910m TVDSS, expect depleted sand with PP drop to 1.15 SG equivalent. Keep simulated ECD below 1.35 SG to avoid catastrophic losses as experienced on offset NH-04 (45 m³ mud loss).
                </p>
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-[#765b00]">
                  <span>DDR NH-04 · p.42 &amp; Eaton Model v3.2</span>
                  <span className="text-[#444748]">REV 04</span>
                </div>
              </div>

              {/* Commit Action */}
              <button
                type="button"
                onClick={handleCommit}
                className="w-full py-2.5 rounded-full border border-[#dbdad6] hover:bg-[#efeeea] text-[12px] font-mono text-[#0d0d0d] font-semibold tracking-wide transition-colors flex items-center justify-center gap-2"
              >
                <span>{committed ? "Parameters Committed to DDR Draft ✓" : "Commit Parameters to Morning Report"}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>

            {/* Mud Properties Snapshot */}
            <div className="p-4 rounded-2xl bg-[#f5f4ef] border border-[#dbdad6] flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#444748] font-semibold">
                Active Mud Properties (Active Pit 2)
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="p-2 rounded bg-white border border-[#dbdad6] flex flex-col">
                  <span className="text-[#444748]">PV (Plastic Visc):</span>
                  <span className="font-bold text-[#0d0d0d] text-[13px]">22 cP</span>
                </div>
                <div className="p-2 rounded bg-white border border-[#dbdad6] flex flex-col">
                  <span className="text-[#444748]">YP (Yield Point):</span>
                  <span className="font-bold text-[#0d0d0d] text-[13px]">18 lb/100ft²</span>
                </div>
                <div className="p-2 rounded bg-white border border-[#dbdad6] flex flex-col">
                  <span className="text-[#444748]">Gel 10s / 10m:</span>
                  <span className="font-bold text-[#0d0d0d] text-[13px]">6 / 14 lb/100ft²</span>
                </div>
                <div className="p-2 rounded bg-white border border-[#dbdad6] flex flex-col">
                  <span className="text-[#444748]">API Fluid Loss:</span>
                  <span className="font-bold text-[#0d0d0d] text-[13px]">4.2 mL/30min</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
