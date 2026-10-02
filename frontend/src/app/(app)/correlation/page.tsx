"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepthShort } from "@/lib/units";

const generateLogCurve = (
  baseX: number,
  sharedSeed: number,
  uniqueSeed: number,
  curveStartDepth: number,
  curveEndDepth: number,
  viewStartDepth: number,
  viewEndDepth: number,
  points: number = 250,
  stretch: number = 1,
  shift: number = 0
) => {
  let path = "";
  if (curveStartDepth > viewEndDepth || curveEndDepth < viewStartDepth) return path;

  const actualStart = Math.max(curveStartDepth, viewStartDepth);
  const actualEnd = Math.min(curveEndDepth, viewEndDepth);
  
  if (actualEnd <= actualStart) return path;

  for (let i = 0; i <= points; i++) {
    const depth = actualStart + (i / points) * (actualEnd - actualStart);
    const y = ((depth - viewStartDepth) / (viewEndDepth - viewStartDepth)) * 620;
    
    const trend = Math.sin((depth + shift) * sharedSeed * 0.012) * 28 
                + Math.cos((depth + shift) * sharedSeed * 0.035) * 18
                + Math.sin((depth + shift) * sharedSeed * 0.004) * 22;
    
    const noise = Math.sin(depth * uniqueSeed * 0.4) * 5 
                + Math.cos(depth * uniqueSeed * 0.17) * 3 
                + Math.sin(depth * uniqueSeed * 0.9) * 2.5;
                
    const cx = Math.max(10, Math.min(290, baseX + (trend * stretch) + noise));
    if (i === 0) path += `M ${cx.toFixed(1)},${y.toFixed(1)}`;
    else path += ` L ${cx.toFixed(1)},${y.toFixed(1)}`;
  }
  return path;
};

const depthToY = (depth: number, viewStart: number, viewEnd: number) => {
  return ((depth - viewStart) / (viewEnd - viewStart)) * 620;
};

const getCurveX = (depth: number, baseX: number, sharedSeed: number, uniqueSeed: number, stretch: number = 1, shift: number = 0) => {
  const trend = Math.sin((depth + shift) * sharedSeed * 0.012) * 28 
              + Math.cos((depth + shift) * sharedSeed * 0.035) * 18
              + Math.sin((depth + shift) * sharedSeed * 0.004) * 22;
  const noise = Math.sin(depth * uniqueSeed * 0.4) * 5 
              + Math.cos(depth * uniqueSeed * 0.17) * 3 
              + Math.sin(depth * uniqueSeed * 0.9) * 2.5;
  return Math.max(10, Math.min(290, baseX + (trend * stretch) + noise));
};

export default function CorrelationPage() {
  const { unitSystem, setCursorDepth } = useGlobalContext();
  const [alignMode, setAlignMode] = useState<"dfim" | "rigid">("dfim");
  const [depthStart, setDepthStart] = useState<number>(2600);
  const [depthEnd, setDepthEnd] = useState<number>(3200);
  const [transmitted, setTransmitted] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCurveSettings, setShowCurveSettings] = useState<boolean>(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [showGR, setShowGR] = useState<boolean>(true);
  const [showRES, setShowRES] = useState<boolean>(true);
  const [showMSE, setShowMSE] = useState<boolean>(true);

  const bitDepth = 2850.2;

  const handleTransmit = () => {
    setTransmitted(true);
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      {/* Interactive & Correlation Curtain Container */}
      <div className="w-full px-6 py-6 flex flex-col gap-5">
        {/* Editorial Architectural Top Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#dbdad6]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono text-[#444748] uppercase tracking-widest">
                STRATIGRAPHIC TIE-IN · MODULE SEC-08
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#efeeea] text-[10px] font-mono text-[#0d0d0d] font-semibold border border-[#dbdad6]">
                <span className="w-2 h-2 rounded-full bg-[#fecf50]"></span>
                LATENCY: 0.8s
              </span>
            </div>
            <div className="flex items-baseline gap-4">
              <h1 className="font-serif text-[36px] font-bold tracking-tight text-[#0d0d0d] leading-none">
                Correlation Curtain
              </h1>
              <span className="font-mono text-[11px] text-[#444748] uppercase tracking-widest hidden md:inline">
                SYNCHRONIZED GEOLOGICAL PROJECTION // BASIN OIL-NH-V
              </span>
            </div>
          </div>

          {/* Alignment Toggle & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-[#e9e8e4] p-1 rounded-full text-[11px] font-mono border border-[#dbdad6]">
              <button
                onClick={() => setAlignMode("dfim")}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  alignMode === "dfim"
                    ? "bg-[#0d0d0d] text-white font-semibold shadow-sm"
                    : "text-[#444748] hover:text-[#0d0d0d]"
                }`}
              >
                DFIM DTW MORPH {alignMode === "dfim" ? "(Active)" : ""}
              </button>
              <button
                onClick={() => setAlignMode("rigid")}
                className={`px-3 py-1.5 rounded-full transition-all ${
                  alignMode === "rigid"
                    ? "bg-[#0d0d0d] text-white font-semibold shadow-sm"
                    : "text-[#444748] hover:text-[#0d0d0d]"
                }`}
              >
                RIGID STRATIGRAPHIC
              </button>
            </div>

            <button
              onClick={() => setShowCurveSettings(!showCurveSettings)}
              className="px-4 py-2 rounded-full bg-[#efeeea] hover:bg-[#e3e2de] text-[11px] font-mono text-[#0d0d0d] border border-[#dbdad6] transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              CURVE SETTINGS
            </button>
          </div>
        </header>

        {showCurveSettings && (
          <div className="bg-[#f5f4ef] border border-[#dbdad6] p-4 rounded-xl flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-4">
              <span>ACTIVE CURVES:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showGR} onChange={(e) => setShowGR(e.target.checked)} className="accent-[#0d0d0d]" /> Gamma Ray (API)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showRES} onChange={(e) => setShowRES(e.target.checked)} className="accent-[#0d0d0d]" /> Deep Resistivity (Ωm)
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={showMSE} onChange={(e) => setShowMSE(e.target.checked)} className="accent-[#0d0d0d]" /> Mechanical Specific Energy (MPa)
              </label>
            </div>
            <button
              onClick={() => setShowCurveSettings(false)}
              className="text-[#444748] hover:text-[#0d0d0d] uppercase"
            >
              CLOSE ✕
            </button>
          </div>
        )}

        {/* TVDSS Control Strip & Lithology Legend Bar */}
        <div className="bg-[#f5f4ef] rounded-xl p-4 border border-[#dbdad6] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          {/* Depth Scrub & Range Slider Controls */}
          <div className="flex flex-1 flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="material-symbols-outlined text-[#765b00] text-[18px]">height</span>
              <span className="text-[11px] font-mono text-[#0d0d0d] uppercase tracking-wider font-semibold">
                TVDSS WINDOW:
              </span>
              <span className="px-2 py-0.5 rounded bg-[#faf9f5] border border-[#dbdad6] text-[11px] font-mono text-[#0d0d0d] font-bold">
                {fmtDepthShort(depthStart, unitSystem)} — {fmtDepthShort(depthEnd, unitSystem)}
              </span>
            </div>

            {/* Slider Bar Visualizer */}
            <div className="flex-1 flex flex-col gap-1">
              <style dangerouslySetInnerHTML={{__html: `
                .dual-range {
                  -webkit-appearance: none;
                  appearance: none;
                }
                .dual-range::-webkit-slider-thumb {
                  pointer-events: auto;
                  -webkit-appearance: none;
                  appearance: none;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: #ffffff;
                  border: 2.5px solid #0d0d0d;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                  cursor: grab;
                  transition: transform 0.1s;
                  margin-top: -1px;
                }
                .dual-range::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                }
                .dual-range::-webkit-slider-thumb:active {
                  cursor: grabbing;
                  transform: scale(0.9);
                }
                .dual-range::-moz-range-thumb {
                  pointer-events: auto;
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  background: #ffffff;
                  border: 2.5px solid #0d0d0d;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
                  cursor: grab;
                  transition: transform 0.1s;
                }
                .dual-range::-moz-range-thumb:hover {
                  transform: scale(1.2);
                }
                .dual-range::-moz-range-thumb:active {
                  cursor: grabbing;
                  transform: scale(0.9);
                }
              `}} />
              <div className="relative w-full h-3 bg-[#e3e2de] rounded-full flex items-center group">
                {/* Active window track */}
                <div 
                  className="absolute h-full bg-[#fecf50] rounded-full pointer-events-none shadow-sm" 
                  style={{ left: `${((depthStart - 2000) / 2000) * 100}%`, right: `${100 - ((depthEnd - 2000) / 2000) * 100}%` }}
                ></div>
                
                <input
                  type="range"
                  min="2000"
                  max="4000"
                  step="10"
                  value={depthStart}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v < depthEnd - 100) {
                      setDepthStart(v);
                      setCursorDepth(v, v);
                    }
                  }}
                  className="absolute w-full h-full appearance-none bg-transparent pointer-events-none z-20 dual-range focus:outline-none"
                />
                <input
                  type="range"
                  min="2000"
                  max="4000"
                  step="10"
                  value={depthEnd}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (v > depthStart + 100) {
                      setDepthEnd(v);
                      setCursorDepth(v, v);
                    }
                  }}
                  className="absolute w-full h-full appearance-none bg-transparent pointer-events-none z-30 dual-range focus:outline-none"
                />

                {/* Live bit depth cursor */}
                <div
                  className="absolute top-0 bottom-0 w-1.5 bg-[#0d0d0d] z-10 shadow-sm pointer-events-none"
                  style={{ left: `${((bitDepth - 2000) / 2000) * 100}%` }}
                  title={`Bit Depth: ${fmtDepthShort(bitDepth, unitSystem)} TVDSS`}
                ></div>
                {/* Stratigraphic Marker Flags */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#747878]/40 pointer-events-none" style={{ left: `${((2750 - 2000) / 2000) * 100}%` }}></div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#747878]/40 pointer-events-none" style={{ left: `${((2890 - 2000) / 2000) * 100}%` }}></div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-[#747878]/40 pointer-events-none" style={{ left: `${((3100 - 2000) / 2000) * 100}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#444748]">
                <span>{fmtDepthShort(depthStart, unitSystem)}</span>
                <span className="text-[#0d0d0d] font-semibold flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#fecf50]"></span>
                  {fmtDepthShort(bitDepth, unitSystem)} (Bit Depth)
                </span>
                <span>{fmtDepthShort(depthEnd, unitSystem)} (Span: {depthEnd - depthStart}m)</span>
              </div>
            </div>
          </div>

          {/* Subsurface Legend */}
          <div className="flex flex-wrap items-center gap-2 xl:pl-4 border-t xl:border-t-0 pt-2 xl:pt-0 border-[#dbdad6]">
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider font-semibold">
              LITHOLOGY:
            </span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#D9CCA3]/25 text-[10px] font-mono text-[#0d0d0d]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D9CCA3] shadow-sm"></span> Girujan
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#EADBB6]/30 text-[10px] font-mono text-[#0d0d0d]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EADBB6] shadow-sm"></span> Tipam Sand
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#C6B79B]/30 text-[10px] font-mono text-[#0d0d0d]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C6B79B] shadow-sm"></span> Barail Pay
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#A8B3B5]/30 text-[10px] font-mono text-[#0d0d0d]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#A8B3B5] shadow-sm"></span> Kopili
            </div>
            <div className="h-4 w-px bg-[#dbdad6] mx-1"></div>
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider font-semibold">
              INCIDENTS:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffdad6] text-[#93000a] text-[10px] font-mono font-semibold">
              △ Loss Zone
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#ffdf95] text-[#594400] text-[10px] font-mono font-semibold">
              ⚡ Gas Kick
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e3e2de] text-[#0d0d0d] text-[10px] font-mono">
              ⚙ Stuck Pipe
            </span>
          </div>
        </div>

        {/* MAIN SYNCHRONIZED LOG CURTAIN (3 PARALLEL WELL TRACKS) */}
        <div className="w-full bg-white rounded-2xl shadow-sm border border-[#dbdad6] overflow-hidden flex flex-col">
          {/* Track Header Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#dbdad6] bg-[#f5f4ef]">
            {/* Track 1 Header: Target Active */}
            <div className="p-4 flex flex-col justify-between bg-[#faf9f5] relative">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#0d0d0d] text-white text-[10px] font-mono font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50] animate-ping"></span>
                  TARGET ACTIVE
                </span>
                <span className="text-[10px] font-mono text-[#765b00] font-bold">LIVE TELEMETRY</span>
              </div>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-[26px] font-bold tracking-tight text-[#0d0d0d]">
                  OIL-NH-12
                </h2>
                <span className="text-[12px] font-mono text-[#444748] font-semibold">
                  TVDSS: {fmtDepthShort(bitDepth, unitSystem)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#444748] bg-[#e9e8e4]/80 px-2.5 py-1.5 rounded border border-[#dbdad6]">
                <span>AVG ROP: <strong className="text-[#0d0d0d]">18.4 m/hr</strong></span>
                <span>CUR ECD: <strong className="text-[#0d0d0d]">1.28 SG</strong></span>
                <span>INCIDENT: <strong className="text-[#106e40]">NONE</strong></span>
              </div>
            </div>

            {/* Track 2 Header: Primary Offset */}
            <div className="p-4 flex flex-col justify-between bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono text-[#0d0d0d] font-semibold">
                  PRIMARY OFFSET · 1.8km NE
                </span>
                <span className="text-[10px] font-mono text-[#0d0d0d] font-bold">88.2% SIMILARITY</span>
              </div>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-[26px] font-bold tracking-tight text-[#0d0d0d]">
                  OIL-NH-04
                </h2>
                <span className="text-[12px] font-mono text-[#444748] font-semibold">
                  TD: {fmtDepthShort(3120, unitSystem)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#444748] bg-[#efeeea]/80 px-2.5 py-1.5 rounded border border-[#dbdad6]">
                <span>AVG ROP: <strong className="text-[#0d0d0d]">14.2 m/hr</strong></span>
                <span>MAX ECD: <strong className="text-[#0d0d0d]">1.35 SG</strong></span>
                <span>INCIDENT: <strong className="text-[#ba1a1a]">LOSS @ 2912m</strong></span>
              </div>
            </div>

            {/* Track 3 Header: Secondary Offset */}
            <div className="p-4 flex flex-col justify-between bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono text-[#0d0d0d] font-semibold">
                  SECONDARY OFFSET · 3.4km S
                </span>
                <span className="text-[10px] font-mono text-[#444748] font-bold">76.5% SIMILARITY</span>
              </div>
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-[26px] font-bold tracking-tight text-[#0d0d0d]">
                  OIL-NH-07
                </h2>
                <span className="text-[12px] font-mono text-[#444748] font-semibold">
                  TD: {fmtDepthShort(3450, unitSystem)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#444748] bg-[#efeeea]/80 px-2.5 py-1.5 rounded border border-[#dbdad6]">
                <span>AVG ROP: <strong className="text-[#0d0d0d]">12.8 m/hr</strong></span>
                <span>MAX ECD: <strong className="text-[#0d0d0d]">1.41 SG</strong></span>
                <span>INCIDENT: <strong className="text-[#765b00]">KICK @ 2985m</strong></span>
              </div>
            </div>
          </div>

          {/* Curves Sub-Header (GR, Res, MSE scales) */}
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#dbdad6] bg-[#efeeea] py-1.5 text-[10px] font-mono">
            {/* Track 1 scale */}
            <div className="flex justify-between px-4 text-[#444748]">
              <span className="text-[#765b00] font-semibold">GR 0 — 150 API</span>
              <span className="font-bold text-[#0d0d0d]">TVDSS (m)</span>
              <span className="text-[#0d0d0d] font-semibold">MSE 0 — 200 MPa</span>
            </div>
            {/* Track 2 scale */}
            <div className="flex justify-between px-4 text-[#444748]">
              <span className="text-[#765b00] font-semibold">GR 0 — 150 API</span>
              <span className="font-bold text-[#0d0d0d]">STRATIGRAPHY</span>
              <span className="text-[#0d0d0d] font-semibold">RES 0.2 — 2000 Ωm</span>
            </div>
            {/* Track 3 scale */}
            <div className="flex justify-between px-4 text-[#444748]">
              <span className="text-[#765b00] font-semibold">GR 0 — 150 API</span>
              <span className="font-bold text-[#0d0d0d]">DFIM WARP</span>
              <span className="text-[#0d0d0d] font-semibold">RES 0.2 — 2000 Ωm</span>
            </div>
          </div>

          {/* Synchronized 3-Well Curtain Stage */}
          <div className="relative w-full h-[620px] overflow-hidden select-none">
            {/* Removed Heavy Background Layers to prioritize data visibility */}

            {/* Dynamic Tie-In Morphing Wirelines (DFIM Stratigraphic Lines across wells) */}
            <svg
              className="absolute inset-0 w-full h-full z-30 pointer-events-none"
              preserveAspectRatio="none"
              viewBox="0 0 1200 620"
            >
              <defs>
                <linearGradient id="tieGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#765b00" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#0d0d0d" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#765b00" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="lookaheadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fecf50" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fecf50" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Removed Arbitrary Global Lines to reduce clutter */}

              {/* Correlation Stratigraphic Tie Lines */}
              {/* Correlation Stratigraphic Tie Lines */}
              <g 
                className="pointer-events-auto cursor-pointer"
                onMouseMove={(e) => setTooltip({ text: "Top Girujan Tie - DFIM Match Confidence: 94%", x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Invisible thick path for easier hovering */}
                <path
                  d={alignMode === "dfim" ? `M 0,${depthToY(2750, depthStart, depthEnd)} C 400,${depthToY(2753, depthStart, depthEnd)} 800,${depthToY(2767, depthStart, depthEnd)} 1200,${depthToY(2780, depthStart, depthEnd)}` : `M 0,${depthToY(2750, depthStart, depthEnd)} L 1200,${depthToY(2750, depthStart, depthEnd)}`}
                  fill="none" stroke="transparent" strokeWidth="20" vectorEffect="non-scaling-stroke"
                />
                {/* Visible path */}
                <path
                  d={alignMode === "dfim" ? `M 0,${depthToY(2750, depthStart, depthEnd)} C 400,${depthToY(2753, depthStart, depthEnd)} 800,${depthToY(2767, depthStart, depthEnd)} 1200,${depthToY(2780, depthStart, depthEnd)}` : `M 0,${depthToY(2750, depthStart, depthEnd)} L 1200,${depthToY(2750, depthStart, depthEnd)}`}
                  fill="none" opacity="0.6" stroke="#747878" strokeWidth="2.5" strokeDasharray="3,3"
                  className="transition-all duration-700 hover:stroke-[#0d0d0d]" vectorEffect="non-scaling-stroke"
                />
              </g>

              <g 
                className="pointer-events-auto cursor-pointer"
                onMouseMove={(e) => setTooltip({ text: "Top Tipam Sandstone - DFIM Match Confidence: 91%", x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                <path
                  d={alignMode === "dfim" ? `M 0,${depthToY(2895, depthStart, depthEnd)} C 400,${depthToY(2902, depthStart, depthEnd)} 800,${depthToY(2916, depthStart, depthEnd)} 1200,${depthToY(2928, depthStart, depthEnd)}` : `M 0,${depthToY(2895, depthStart, depthEnd)} L 1200,${depthToY(2895, depthStart, depthEnd)}`}
                  fill="none" stroke="transparent" strokeWidth="20" vectorEffect="non-scaling-stroke"
                />
                <path
                  d={alignMode === "dfim" ? `M 0,${depthToY(2895, depthStart, depthEnd)} C 400,${depthToY(2902, depthStart, depthEnd)} 800,${depthToY(2916, depthStart, depthEnd)} 1200,${depthToY(2928, depthStart, depthEnd)}` : `M 0,${depthToY(2895, depthStart, depthEnd)} L 1200,${depthToY(2895, depthStart, depthEnd)}`}
                  fill="none" opacity="0.85" stroke="#0d0d0d" strokeWidth="3"
                  className="transition-all duration-700 hover:stroke-[#765b00]" vectorEffect="non-scaling-stroke"
                />
              </g>

              {/* Incident Cross-Tie: NH-04 Loss Zone to NH-12 Lookahead projection */}
              <g 
                className="pointer-events-auto cursor-pointer"
                onMouseMove={(e) => setTooltip({ text: "Critical Loss Zone Tie-In: -45m³ Loss", x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                <path d={`M 400,${depthToY(2928, depthStart, depthEnd)} C 550,${depthToY(2928, depthStart, depthEnd)} 650,${depthToY(2918, depthStart, depthEnd)} 800,${depthToY(2918, depthStart, depthEnd)}`} fill="none" stroke="transparent" strokeWidth="20" vectorEffect="non-scaling-stroke" />
                <path d={`M 400,${depthToY(2928, depthStart, depthEnd)} C 550,${depthToY(2928, depthStart, depthEnd)} 650,${depthToY(2918, depthStart, depthEnd)} 800,${depthToY(2918, depthStart, depthEnd)}`} fill="none" opacity="0.9" stroke="#ba1a1a" strokeWidth="2.5" strokeDasharray="4,2"
                  className="hover:stroke-[#93000a] transition-colors" vectorEffect="non-scaling-stroke"
                />
              </g>

              <g 
                className="pointer-events-auto cursor-pointer"
                onMouseMove={(e) => setTooltip({ text: "Top Kopili Marine Shale - DFIM Match Confidence: 88%", x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                <path
                  d={alignMode === "dfim" ? `M 0,${depthToY(3103, depthStart, depthEnd)} C 400,${depthToY(3111, depthStart, depthEnd)} 800,${depthToY(3128, depthStart, depthEnd)} 1200,${depthToY(3138, depthStart, depthEnd)}` : `M 0,${depthToY(3103, depthStart, depthEnd)} L 1200,${depthToY(3103, depthStart, depthEnd)}`}
                  fill="none" stroke="transparent" strokeWidth="20" vectorEffect="non-scaling-stroke"
                />
                <path
                  d={alignMode === "dfim" ? `M 0,${depthToY(3103, depthStart, depthEnd)} C 400,${depthToY(3111, depthStart, depthEnd)} 800,${depthToY(3128, depthStart, depthEnd)} 1200,${depthToY(3138, depthStart, depthEnd)}` : `M 0,${depthToY(3103, depthStart, depthEnd)} L 1200,${depthToY(3103, depthStart, depthEnd)}`}
                  fill="none" opacity="0.6" stroke="#747878" strokeWidth="2.5" strokeDasharray="3,3"
                  className="transition-all duration-700 hover:stroke-[#0d0d0d]" vectorEffect="non-scaling-stroke"
                />
              </g>

              {/* Lookahead shading on Well 1 (Active) */}
              <rect x="0" y={depthToY(2850.2, depthStart, depthEnd)} width="400" height={Math.max(0, depthToY(3200, depthStart, depthEnd) - depthToY(2850.2, depthStart, depthEnd))} fill="url(#lookaheadGradient)" />
              <line x1="0" y1={depthToY(3050, depthStart, depthEnd)} x2="400" y2={depthToY(3050, depthStart, depthEnd)} stroke="#765b00" strokeWidth="1" strokeDasharray="4,4" vectorEffect="non-scaling-stroke" />

            </svg>

            {/* 3 Columns Well Content Grid */}
            <div className="relative z-20 grid grid-cols-1 md:grid-cols-3 h-full divide-y md:divide-y-0 md:divide-x divide-[#dbdad6]">
              {/* ================= WELL TRACK 1 (OIL-NH-12 ACTIVE TARGET) ================= */}
              <div className="relative h-full flex flex-col justify-between overflow-hidden">
                {/* Live Active Log Curves (SVG) */}
                <svg className="absolute inset-y-0 left-[10%] w-[80%] h-full" preserveAspectRatio="none" viewBox="0 0 300 620">
                  {/* Fine Dashed Grid */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`h1-${i}`} x1="0" y1={i * 31} x2="300" y2={i * 31} stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`v1-${i}`} x1={i * 60} y1="0" x2={i * 60} y2="620" stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  ))}

                  {/* Drilled GR Curve (Left, Dotted) */}
                  {showGR && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Active Well (OIL-NH-12) - Live Gamma Ray (GR)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(100, 1.5, 1.1, 2000, 2850.2, depthStart, depthEnd, 100, 1, 0)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(100, 1.5, 1.1, 2000, 2850.2, depthStart, depthEnd, 100, 1, 0)} fill="none" stroke="#747878" strokeWidth="1.2" strokeDasharray="2,2" className="group-hover:stroke-black group-hover:stroke-[2px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}
                  
                  {/* Drilled MSE Curve (Right, Solid Blue) */}
                  {showMSE && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Active Well (OIL-NH-12) - Live Mechanical Specific Energy (MSE)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(200, 2.8, 1.2, 2000, 2850.2, depthStart, depthEnd, 100, 1, 0)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(200, 2.8, 1.2, 2000, 2850.2, depthStart, depthEnd, 100, 1, 0)} fill="none" stroke="#005c8a" strokeWidth="1.5" className="group-hover:stroke-[#003d5c] group-hover:stroke-[2.5px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}
                  
                  {/* Projected Lookahead GR (Dotted Mustard) */}
                  {showGR && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Projected Lookahead - Gamma Ray (GR)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(100, 1.5, 1.1, 2850.2, 3050, depthStart, depthEnd, 80, 1, 0)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(100, 1.5, 1.1, 2850.2, 3050, depthStart, depthEnd, 80, 1, 0)} fill="none" stroke="#765b00" strokeWidth="1.2" strokeDasharray="2,2" opacity="0.85" className="group-hover:opacity-100 group-hover:stroke-[2px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}
                  
                  {/* Projected Lookahead MSE (Dotted Blue) */}
                  {showMSE && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Projected Lookahead - Mechanical Specific Energy (MSE)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(200, 2.8, 1.2, 2850.2, 3050, depthStart, depthEnd, 80, 1, 0)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(200, 2.8, 1.2, 2850.2, 3050, depthStart, depthEnd, 80, 1, 0)} fill="none" stroke="#005c8a" strokeWidth="1.5" strokeDasharray="2,2" opacity="0.75" className="group-hover:opacity-100 group-hover:stroke-[2px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}
                </svg>

                {/* Active Bit Depth Horizontal Highlight Marker (y = 260px) */}
                <div className="absolute left-0 right-0 z-30 flex items-center" style={{ top: `${depthToY(2850.2, depthStart, depthEnd)}px` }}>
                  <div className="h-0.5 w-full bg-[#0d0d0d] relative">
                    <div className="absolute -top-3.5 left-2 px-2.5 py-0.5 rounded-full bg-[#0d0d0d] text-white text-[10px] font-mono font-bold tracking-wider flex items-center gap-1.5 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50] animate-pulse"></span>
                      BIT: {fmtDepthShort(bitDepth, unitSystem)} TVDSS
                    </div>
                  </div>
                </div>



                {/* Depth Ruler (Left spine inside well 1) */}
                <div className="relative z-10 h-full flex flex-col justify-between py-2 pl-2 text-[10px] font-mono text-[#444748] pointer-events-none">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const d = depthStart + (i / 7) * (depthEnd - depthStart);
                    return <span key={i}>{fmtDepthShort(d, unitSystem)}</span>;
                  })}
                </div>

                {/* Bottom Well Summary Pill */}
                <div className="relative z-20 p-2 bg-[#e9e8e4]/90 m-2 rounded text-[10px] font-mono flex justify-between items-center border border-[#dbdad6]">
                  <span className="text-[#444748]">ACTIVE DRILLING</span>
                  <span className="font-bold text-[#0d0d0d]">LWD (TELEMETRY)</span>
                  <span className="text-[#765b00] font-semibold">BIT: {fmtDepthShort(bitDepth, unitSystem)}</span>
                </div>
              </div>

              {/* ================= WELL TRACK 2 (OIL-NH-04 PRIMARY ANALOGUE) ================= */}
              <div className="relative h-full flex flex-col justify-between overflow-hidden">
                {/* Curve SVG */}
                <svg className="absolute inset-y-0 left-[10%] w-[80%] h-full" preserveAspectRatio="none" viewBox="0 0 300 620">
                  {/* Fine Dashed Grid */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`h2-${i}`} x1="0" y1={i * 31} x2="300" y2={i * 31} stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`v2-${i}`} x1={i * 60} y1="0" x2={i * 60} y2="620" stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  ))}

                  {/* Track 2 Offset GR Curve */}
                  {showGR && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Offset (OIL-NH-04) - Archive Gamma Ray (GR)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(110, 1.5, 2.1, 2000, 3120, depthStart, depthEnd, 250, 0.9, -15)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(110, 1.5, 2.1, 2000, 3120, depthStart, depthEnd, 250, 0.9, -15)} fill="none" stroke="#747878" strokeWidth="1.2" strokeDasharray="2,2" className="group-hover:stroke-black group-hover:stroke-[2px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}
                  
                  {/* Track 2 Offset RES Curve */}
                  {showRES && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Offset (OIL-NH-04) - Archive Deep Resistivity (RES)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(190, 2.8, 2.2, 2000, 3120, depthStart, depthEnd, 250, 0.9, -15)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(190, 2.8, 2.2, 2000, 3120, depthStart, depthEnd, 250, 0.9, -15)} fill="none" stroke="#106e40" strokeWidth="1.5" className="group-hover:stroke-[#0a4a2a] group-hover:stroke-[2.5px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}

                  {/* Incident Marker (Loss @ 2,912m) */}
                  <g 
                    className="pointer-events-auto cursor-pointer group"
                    onMouseMove={(e) => setTooltip({ text: "SEVERE MUD LOSS: 45m³ volume lost at 2,912m TVDSS during tripped connection.", x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <circle cx={getCurveX(2912, 190, 2.8, 2.2, 0.9, -15)} cy={depthToY(2912, depthStart, depthEnd)} r="20" fill="transparent" />
                    <circle cx={getCurveX(2912, 190, 2.8, 2.2, 0.9, -15)} cy={depthToY(2912, depthStart, depthEnd)} r="4.5" fill="#ba1a1a" />
                    <circle cx={getCurveX(2912, 190, 2.8, 2.2, 0.9, -15)} cy={depthToY(2912, depthStart, depthEnd)} r="2" fill="#fff" />
                  </g>
                </svg>

                {/* Stratigraphic Depth Markers */}
                <div className="absolute inset-0 pointer-events-none text-[10px] font-mono text-[#444748]">
                  <div className="absolute w-full flex justify-end pr-2" style={{ top: `${depthToY(2750, depthStart, depthEnd)}px` }}><span className="px-1 bg-white/80 rounded border border-[#dbdad6]">Girujan: {fmtDepthShort(2750, unitSystem)}</span></div>
                  <div className="absolute w-full flex justify-end pr-2" style={{ top: `${depthToY(2895, depthStart, depthEnd)}px` }}><span className="px-1 bg-white/80 rounded border border-[#dbdad6]">Tipam: {fmtDepthShort(2895, unitSystem)}</span></div>
                  <div className="absolute w-full flex justify-end pr-2" style={{ top: `${depthToY(2916, depthStart, depthEnd)}px` }}><span className="px-1 bg-white/80 rounded border border-[#0d0d0d] font-bold text-[#0d0d0d]">Barail Pay: {fmtDepthShort(2916, unitSystem)}</span></div>
                  <div className="absolute w-full flex justify-end pr-2" style={{ top: `${depthToY(3103, depthStart, depthEnd)}px` }}><span className="px-1 bg-white/80 rounded border border-[#dbdad6]">Kopili: {fmtDepthShort(3103, unitSystem)}</span></div>
                </div>



                {/* Top Correlation Tie Indicator */}
                <div className="relative z-10 p-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 border border-[#dbdad6] text-[10px] font-mono text-[#0d0d0d]">
                    <span className="material-symbols-outlined text-[14px]">insights</span>
                    R² = 0.912 FIT
                  </span>
                </div>

                {/* Bottom Archive Info */}
                <div className="relative z-20 p-2 bg-[#e9e8e4]/90 m-2 rounded text-[10px] font-mono flex justify-between items-center border border-[#dbdad6]">
                  <span className="text-[#444748]">ARCHIVED (2021)</span>
                  <span className="font-bold text-[#0d0d0d]">WIRELINE (SLB)</span>
                  <span className="text-[#444748] font-semibold">TD: {fmtDepthShort(3120, unitSystem)}</span>
                </div>
              </div>

              {/* ================= WELL TRACK 3 (OIL-NH-07 SECONDARY OFFSET) ================= */}
              <div className="relative h-full flex flex-col justify-between overflow-hidden">
                {/* Curve SVG */}
                <svg className="absolute inset-y-0 left-[10%] w-[80%] h-full" preserveAspectRatio="none" viewBox="0 0 300 620">
                  {/* Fine Dashed Grid */}
                  {Array.from({ length: 20 }).map((_, i) => (
                    <line key={`h3-${i}`} x1="0" y1={i * 31} x2="300" y2={i * 31} stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  ))}
                  {Array.from({ length: 6 }).map((_, i) => (
                    <line key={`v3-${i}`} x1={i * 60} y1="0" x2={i * 60} y2="620" stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
                  ))}

                  {/* Track 3 Offset GR Curve */}
                  {showGR && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Offset (OIL-NH-07) - Archive Gamma Ray (GR)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(105, 1.5, 3.1, 2000, 3450, depthStart, depthEnd, 250, 1.1, 20)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(105, 1.5, 3.1, 2000, 3450, depthStart, depthEnd, 250, 1.1, 20)} fill="none" stroke="#747878" strokeWidth="1.2" strokeDasharray="2,2" className="group-hover:stroke-black group-hover:stroke-[2px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}
                  
                  {/* Track 3 Offset RES Curve */}
                  {showRES && (
                    <g 
                      className="pointer-events-auto cursor-pointer group"
                      onMouseMove={(e) => setTooltip({ text: "Offset (OIL-NH-07) - Archive Deep Resistivity (RES)", x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <path d={generateLogCurve(195, 2.8, 3.2, 2000, 3450, depthStart, depthEnd, 250, 1.1, 20)} fill="none" stroke="transparent" strokeWidth="15" vectorEffect="non-scaling-stroke" />
                      <path d={generateLogCurve(195, 2.8, 3.2, 2000, 3450, depthStart, depthEnd, 250, 1.1, 20)} fill="none" stroke="#916a00" strokeWidth="1.5" className="group-hover:stroke-[#594400] group-hover:stroke-[2.5px] transition-all" vectorEffect="non-scaling-stroke" />
                    </g>
                  )}

                  {/* Incident Marker (Kick @ 2,985m) */}
                  <g 
                    className="pointer-events-auto cursor-pointer group"
                    onMouseMove={(e) => setTooltip({ text: "GAS KICK: 12bbl influx at 2,985m TVDSS. Required 1.34 SG Kill Mud weight.", x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTooltip(null)}
                  >
                    <circle cx={getCurveX(2985, 195, 2.8, 3.2, 1.1, 20)} cy={depthToY(2985, depthStart, depthEnd)} r="20" fill="transparent" />
                    <circle cx={getCurveX(2985, 195, 2.8, 3.2, 1.1, 20)} cy={depthToY(2985, depthStart, depthEnd)} r="4.5" fill="#ba1a1a" />
                    <circle cx={getCurveX(2985, 195, 2.8, 3.2, 1.1, 20)} cy={depthToY(2985, depthStart, depthEnd)} r="2" fill="#fff" />
                  </g>
                </svg>



                {/* Top Correlation Indicator */}
                <div className="relative z-10 p-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/90 border border-[#dbdad6] text-[10px] font-mono text-[#0d0d0d]">
                    <span className="material-symbols-outlined text-[14px]">compare_arrows</span>
                    DFIM WARP FACTOR: 1.042
                  </span>
                </div>

                {/* Bottom Archive Info */}
                <div className="relative z-20 p-2 bg-[#e9e8e4]/90 m-2 rounded text-[10px] font-mono flex justify-between items-center border border-[#dbdad6]">
                  <span className="text-[#444748]">ARCHIVED (2019)</span>
                  <span className="font-bold text-[#0d0d0d]">WIRELINE (HAL)</span>
                  <span className="text-[#444748] font-semibold">TD: {fmtDepthShort(3450, unitSystem)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ADVISORY & TACTICAL TIE-IN STRIP */}
        <div className="bg-[#e9e8e4] rounded-2xl p-6 border border-[#dbdad6] flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-6">
          {/* Natural Language Geosteering Summary */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#ba1a1a] text-white text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                Tactical Advisory
              </span>
              <span className="text-[11px] font-mono text-[#444748] font-semibold">
                IMMINENT DEPLETED FRACTURE ZONE (LOOKAHEAD: 61.8 m)
              </span>
            </div>
            <p className="text-[14px] text-[#0d0d0d] leading-relaxed max-w-4xl">
              <strong>NH-04 severe loss horizon</strong> correlates to <strong>2,918 m — 2,925 m TVDSS</strong> on active <strong className="text-[#765b00]">OIL-NH-12</strong>. Expected thief capacity: <span className="font-mono font-bold text-[#ba1a1a]">~45 m³</span>. 
              Prescribed drilling operations: Pre-mix 20 m³ coarse LCM pill on pit 4; strictly limit ECD to &lt; 1.32 SG before penetrating the Top Barail facies.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-[10px] font-mono text-[#444748]">
              <span className="flex items-center gap-1.5 font-semibold text-[#0d0d0d]">
                <span className="w-2 h-2 rounded-full bg-[#fecf50]"></span>
                Predictive Confidence: 92.4% (DFIM-AI v4.2)
              </span>
              <span>·</span>
              <span>Cross-Fault Offset: 14.2 m Downthrown</span>
              <span>·</span>
              <span>Formation Transmissibility: 420 mD·m</span>
            </div>

            {/* Injected Transmitted Card */}
            {transmitted && (
              <div className="mt-4 p-4 rounded-xl bg-[#0d0d0d] text-white flex items-center justify-between shadow-md animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#fecf50] text-[24px]">cell_tower</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold text-[#fecf50] uppercase tracking-widest">WITSML Secure Link</span>
                    <span className="text-[13px] font-semibold">Critical Rig Advisory Transmitted to OIL-NH-12 Driller Terminal</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-[#dbdad6]">
                  <span className="bg-white/10 px-2 py-1 rounded">STATUS: DELIVERED ✓</span>
                  <button onClick={() => setTransmitted(false)} className="hover:text-white uppercase tracking-wider font-bold">Dismiss ✕</button>
                </div>
              </div>
            )}
          </div>

          {/* Tactical Action Cluster */}
          <div className="flex flex-wrap xl:flex-col sm:flex-row items-center justify-end gap-2 shrink-0">
            <button
              onClick={handleTransmit}
              className={`w-full sm:w-auto px-5 py-3 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm ${
                transmitted
                  ? "bg-[#765b00] text-white"
                  : "bg-[#0d0d0d] text-white hover:opacity-90"
              }`}
            >
              <span>{transmitted ? "Advisory Transmitted ✓" : "Transmit Rig Advisory"}</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  let content = "~VERSION INFORMATION\r\nVERS.  2.0 : CWLS LOG ASCII STANDARD - VERSION 2.0\r\nWRAP.  NO  : ONE LINE PER DEPTH STEP\r\n";
                  content += "~WELL INFORMATION BLOCK\r\n#MNEM.UNIT   DATA         DESCRIPTION\r\n#----.----   ----         -----------\r\nSTRT .m      2600.0000  : START DEPTH\r\nSTOP .m      2850.0000  : STOP DEPTH\r\nSTEP .m      1.0000     : STEP\r\nNULL .       -999.25    : NULL VALUE\r\nCOMP .       OIL        : COMPANY\r\nWELL .       OIL-NH-12  : WELL\r\nFLD  .       NH         : FIELD\r\nLOC  .       BLOCK V    : LOCATION\r\nPROV .       ASSAM      : PROVINCE\r\nSRVC .       TELEMETRY  : SERVICE COMPANY\r\nDATE .       2026-10-02 : LOG DATE\r\n";
                  content += "~CURVE INFORMATION BLOCK\r\n#MNEM.UNIT   API CODE      CURVE DESCRIPTION\r\n#----.----   --------      -----------------\r\nDEPT .m                    : 1  DEPTH\r\nGR   .API                  : 2  GAMMA RAY\r\nMSE  .MPa                  : 3  MECHANICAL SPECIFIC ENERGY\r\n";
                  content += "~ASCII LOG DATA\r\n";
                  
                  // generate realistic data matching the visual LWD curves
                  for (let d = 2600; d <= 2850; d++) {
                    const grX = getCurveX(d, 100, 1.5, 1.1, 1, 0); 
                    const grValue = (grX - 10) / 280 * 150;
                    const mseX = getCurveX(d, 200, 2.8, 1.2, 1, 0);
                    const mseValue = (mseX - 10) / 280 * 200;
                    
                    content += `  ${d.toFixed(4).padStart(9, ' ')}    ${grValue.toFixed(4).padStart(8, ' ')}    ${mseValue.toFixed(4).padStart(8, ' ')}\r\n`;
                  }
                  
                  const blob = new Blob([content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "OIL-NH-12_LWD_TELEMETRY.las";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex-1 px-4 py-2.5 rounded-full bg-[#faf9f5] hover:bg-white text-[#0d0d0d] border border-[#dbdad6] text-[11px] font-mono font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Export .LAS
              </button>
              <Link
                href="/pore-pressure"
                className="flex-1 px-4 py-2.5 rounded-full bg-[#faf9f5] hover:bg-white text-[#0d0d0d] border border-[#dbdad6] text-[11px] font-mono font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>Pore Press. Model</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Custom Tooltip Banner */}
      {tooltip && (
        <div 
          className="fixed z-[100] px-3 py-1.5 bg-[#0d0d0d] text-white text-[10px] font-mono font-bold tracking-wide rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{ left: tooltip.x, top: tooltip.y - 12 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
