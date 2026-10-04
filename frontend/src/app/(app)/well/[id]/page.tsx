"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Nwis3DMap from "@/components/Nwis3DMap";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepthShort } from "@/lib/units";

interface CasingRecord {
  string: string;
  hole: string;
  shoeM: number;
  lotFit: string;
  mw: string;
}

interface StratTop {
  name: string;
  sub: string;
  depthM: number;
  color: string;
}

interface IncidentItem {
  type: string;
  depthM: number;
  severity: "critical" | "warning";
  desc: string;
  remediation: string;
  doc: string;
}

export default function WellPage() {
  const params = useParams();
  const rawId = typeof params?.id === "string" ? params.id : "OIL-NH-04";
  const wellId = rawId.toUpperCase().includes("OIL-") ? rawId.toUpperCase() : `OIL-${rawId.toUpperCase()}`;
  const unitSystem = useGlobalContext((state) => state.unitSystem);

  const [activeTab, setActiveTab] = useState<string>("3d");
  const [viewMode3D, setViewMode3D] = useState<"schematic" | "webgl">("schematic");
  const [promoted, setPromoted] = useState<boolean>(false);

  const casingData: CasingRecord[] = [
    { string: "Conductor 20\"", hole: "26\"", shoeM: 200.0, lotFit: "1.35 SG FIT", mw: "1.10 SG" },
    { string: "Surface 13-3/8\"", hole: "17-1/2\"", shoeM: 650.0, lotFit: "1.55 SG LOT", mw: "1.18 SG" },
    { string: "Intermediate 9-5/8\"", hole: "12-1/4\"", shoeM: 2150.0, lotFit: "1.48 SG FIT", mw: "1.28 SG" },
    { string: "Prod. Liner 7\"", hole: "8-1/2\"", shoeM: 3020.0, lotFit: "1.62 SG LOT", mw: "1.34 SG" },
  ];

  const stratTops: StratTop[] = [
    { name: "Alluvium & Dhekiajuli", sub: "Unconsolidated gravels · 0 - 650m", depthM: 0.0, color: "#dbdad6" },
    { name: "Girujan Claystone", sub: "Mottled clay / Siltstones · 450m thk", depthM: 2150.0, color: "#858383" },
    { name: "Tipam Sandstone", sub: "Medium sand w/ coal streaks · 90m thk", depthM: 2750.0, color: "#747878" },
    { name: "Barail Arenaceous (Main Pay)", sub: "Fine quartzose sandstone · 260m thk", depthM: 2840.0, color: "#fecf50" },
    { name: "Kopili Shale Formation", sub: "Dark calcareous marine shale", depthM: 3100.0, color: "#1c1b1b" },
  ];

  const incidents: IncidentItem[] = [
    {
      type: "Critical Mud Loss Event",
      depthM: 2912.0,
      severity: "critical",
      desc: "Dynamic losses escalated to 18 m³/hr while drilling through fractured Barail sandstone. Total 45 m³ mud lost to formation.",
      remediation: "Remediation: 35 ppb CaCO3 + Nut Plug pill",
      doc: "DDR_P2.pdf p.42",
    },
    {
      type: "Differential Sticking",
      depthM: 2450.0,
      severity: "warning",
      desc: "Drillstring stuck during static directional survey (45 min stationary). Overbalance of 380 psi across permeable Girujan sand stringer.",
      remediation: "Remediation: Surfactant soak (14h NPT)",
      doc: "DDR_P1.pdf p.28",
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      {/* Top Archival HUD Banner */}
      <header className="p-6 bg-[#faf9f5] border-b border-[#dbdad6]">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#0d0d0d] text-white font-mono text-[10px] tracking-wider uppercase font-semibold">
                ARCHIVE DOSSIER
              </span>
              <span className="text-[10px] font-mono text-[#444748]">UWI: 49-204-9812-00</span>
              <span className="text-[#dbdad6]">/</span>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold">ROUTE: /well/{wellId}</span>
            </div>
            <h1 className="font-serif text-[34px] font-bold text-[#0d0d0d] tracking-tight leading-none">
              Well File 360° — {wellId}
            </h1>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
              <span className="px-2.5 py-1 rounded bg-[#e9e8e4] border border-[#dbdad6] text-[#0d0d0d]">
                FIELD: NAHORKATIYA EXT (BLOCK IV)
              </span>
              <span className="px-2.5 py-1 rounded bg-[#fecf50]/30 border border-[#fecf50] text-[#735800] font-semibold">
                STATUS: COMPLETED PRODUCER
              </span>
              <span className="px-2.5 py-1 rounded bg-[#efeeea] border border-[#dbdad6] text-[#444748]">
                SPUD: 14 OCT 2021
              </span>
              <span className="px-2.5 py-1 rounded bg-[#efeeea] border border-[#dbdad6] text-[#444748]">
                TD: {fmtDepthShort(3120.0, unitSystem)} TVDSS
              </span>
              <span className="px-2.5 py-1 rounded bg-[#efeeea] border border-[#dbdad6] text-[#444748]">
                MAX INC: 32.4°
              </span>
              <span className="px-2.5 py-1 rounded bg-[#e9e8e4] text-[#0d0d0d] font-bold">
                TARGET: BARAIL SAND MAIN
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 xl:pt-0">
            <button
              onClick={() => {
                const blob = new Blob([JSON.stringify({ wellId, casingData, stratTops, incidents }, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${wellId}_dossier.json`;
                a.click();
              }}
              className="px-3.5 py-2 rounded-full bg-[#efeeea] border border-[#dbdad6] text-[11px] font-mono text-[#0d0d0d] hover:bg-[#e3e2de] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">picture_as_pdf</span>
              EXPORT DOSSIER PDF ↗
            </button>
            <button
              onClick={() => setPromoted(!promoted)}
              className={`px-3.5 py-2 rounded-full border border-[#dbdad6] text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                promoted ? "bg-[#765b00] text-white" : "bg-[#efeeea] text-[#0d0d0d] hover:bg-[#e3e2de]"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">verified</span>
              {promoted ? "BASELINE PROMOTED ✓" : "PROMOTE TO BASELINE"}
            </button>
            <button
              onClick={() => {
                setActiveTab("3d");
                setViewMode3D("webgl");
              }}
              className="px-4 py-2 rounded-full bg-[#0d0d0d] text-white font-mono text-[11px] tracking-wider uppercase hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[15px]">view_in_ar</span>
              OPEN IN 3D EXPLORER
            </button>
          </div>
        </div>
      </header>

      {/* Sub-Tab Navigation Bar */}
      <nav className="bg-[#f5f4ef] border-b border-[#dbdad6] px-6 flex items-center justify-between overflow-x-auto select-none">
        <div className="flex items-center space-x-1 py-1.5">
          {[
            { id: "3d", label: "01 · 3D Visualization & Trajectory" },
            { id: "profile", label: "02 · Profile & Casing Strings" },
            { id: "strat", label: "03 · Formation Tops & Lithology" },
            { id: "incidents", label: "04 · Incident Records (2)" },
            { id: "docs", label: "05 · Extracted Documents & DDRs (14)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider transition-colors ${
                activeTab === tab.id
                  ? "bg-[#0d0d0d] text-white font-semibold"
                  : "text-[#444748] hover:text-[#0d0d0d] hover:bg-[#e9e8e4]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="hidden lg:flex items-center gap-3 font-mono text-[10px] text-[#444748]">
          <span>GRID: UTM WGS84 ZONE 46N</span>
          <span>•</span>
          <span>DATUM: MSL</span>
        </div>
      </nav>

      {/* Main Content Grid */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D / Trajectory Viewport */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <section className="bg-white border border-[#dbdad6] rounded-xl overflow-hidden flex flex-col shadow-sm">
            {/* Canvas Bar HUD */}
            <div className="p-4 border-b border-[#dbdad6] bg-[#f5f4ef] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#fecf50] ring-2 ring-[#765b00]/30"></span>
                <span className="text-[12px] text-[#0d0d0d] font-semibold uppercase font-mono">
                  Traverse Plane: SW-NE Projection (Azimuth 042°)
                </span>
                <span className="text-[10px] font-mono text-[#444748] bg-[#e9e8e4] px-1.5 py-0.5 rounded border border-[#dbdad6]">
                  VE 1.5x
                </span>
              </div>

              {/* Viewport Mode Switcher */}
              <div className="flex items-center gap-1 bg-[#e9e8e4] p-0.5 rounded-lg border border-[#dbdad6]">
                <button
                  onClick={() => setViewMode3D("schematic")}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                    viewMode3D === "schematic"
                      ? "bg-white text-[#0d0d0d] shadow-sm font-bold"
                      : "text-[#444748] hover:text-[#0d0d0d]"
                  }`}
                >
                  Architectural Schematic
                </button>
                <button
                  onClick={() => setViewMode3D("webgl")}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1 ${
                    viewMode3D === "webgl"
                      ? "bg-[#0d0d0d] text-white shadow-sm font-bold"
                      : "text-[#444748] hover:text-[#0d0d0d]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">view_in_ar</span>
                  Interactive WebGL 3D
                </button>
              </div>
            </div>

            {/* Viewport Content */}
            {viewMode3D === "webgl" ? (
              <div className="relative w-full h-[600px] bg-[#0d0d0d]">
                <Nwis3DMap
                  lookaheadWindow={200}
                  formations={stratTops.map((f, i) => ({
                    depth_avg: f.depthM,
                    color: i % 2 === 0 ? "#765b00" : "#fecf50",
                  }))}
                  offsetHazards={incidents.map((e) => ({
                    tvd: e.depthM,
                    severity: e.severity,
                  }))}
                />
              </div>
            ) : (
              <div className="relative bg-[#f5f4ef]/60 p-4 select-none min-h-[580px] overflow-hidden">
                <svg
                  className="w-full h-full min-h-[580px]"
                  fill="none"
                  viewBox="0 0 760 580"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="archGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dbdad6" strokeWidth="0.5" strokeDasharray="2 2" />
                    </pattern>
                    <linearGradient id="girujanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#765b00" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#765b00" stopOpacity="0.04" />
                    </linearGradient>
                    <linearGradient id="tipamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#444748" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#444748" stopOpacity="0.03" />
                    </linearGradient>
                    <linearGradient id="barailGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fecf50" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#fecf50" stopOpacity="0.08" />
                    </linearGradient>
                  </defs>

                  <rect width="100%" height="100%" fill="url(#archGrid)" />

                  {/* Depth Scale Axis (Left) */}
                  <g className="text-[9px] font-mono fill-[#444748]">
                    <line x1="60" y1="20" x2="60" y2="540" stroke="#747878" strokeWidth="1" />
                    <text x="50" y="35" textAnchor="end">0 m</text>
                    <line x1="56" y1="32" x2="64" y2="32" stroke="#747878" />
                    <text x="50" y="110" textAnchor="end">500 m</text>
                    <line x1="56" y1="107" x2="64" y2="107" stroke="#747878" />
                    <text x="50" y="185" textAnchor="end">1,000 m</text>
                    <line x1="56" y1="182" x2="64" y2="182" stroke="#747878" />
                    <text x="50" y="260" textAnchor="end">1,500 m</text>
                    <line x1="56" y1="257" x2="64" y2="257" stroke="#747878" />
                    <text x="50" y="335" textAnchor="end">2,000 m</text>
                    <line x1="56" y1="332" x2="64" y2="332" stroke="#747878" />
                    <text x="50" y="410" textAnchor="end">2,500 m</text>
                    <line x1="56" y1="407" x2="64" y2="407" stroke="#747878" />
                    <text x="50" y="485" textAnchor="end">3,000 m</text>
                    <line x1="56" y1="482" x2="64" y2="482" stroke="#747878" />
                    <text x="50" y="535" textAnchor="end" className="font-bold fill-[#ba1a1a]">3,120 m TD</text>
                    <line x1="56" y1="532" x2="64" y2="532" stroke="#ba1a1a" strokeWidth="1.5" />
                  </g>

                  {/* Stratigraphic Horizon Planes */}
                  <polygon points="60,400 740,365 740,430 60,465" fill="url(#girujanGrad)" />
                  <line x1="60" y1="400" x2="740" y2="365" stroke="#765b00" strokeWidth="1" strokeDasharray="4 2" />
                  <text x="680" y="360" className="text-[9px] font-mono fill-[#765b00] font-semibold">GIRUJAN CLAY · 2,600 m</text>

                  <polygon points="60,440 740,405 740,470 60,505" fill="url(#tipamGrad)" />
                  <line x1="60" y1="440" x2="740" y2="405" stroke="#444748" strokeWidth="1" strokeDasharray="3 3" />
                  <text x="680" y="400" className="text-[9px] font-mono fill-[#444748]">TIPAM SST FM · 2,750 m</text>

                  <polygon points="60,475 740,435 740,515 60,555" fill="url(#barailGrad)" />
                  <line x1="60" y1="475" x2="740" y2="435" stroke="#765b00" strokeWidth="1.5" />
                  <text x="660" y="430" className="text-[10px] font-mono fill-[#765b00] font-bold">★ BARAIL MAIN PAY · 2,840 m</text>

                  {/* Planned Trajectory Track */}
                  <path
                    d="M 220,32 C 220,120 220,240 280,350 C 320,420 370,480 430,535"
                    fill="none"
                    stroke="#dbdad6"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text x="440" y="545" className="text-[9px] font-mono fill-[#747878]">PLANNED TRAJECTORY</text>

                  {/* Actual Trajectory */}
                  <path d="M 220,32 L 220,62" fill="none" stroke="#0d0d0d" strokeWidth="8" strokeLinecap="round" />
                  <path d="M 220,62 L 220,130" fill="none" stroke="#0d0d0d" strokeWidth="6" strokeLinecap="round" />
                  <path d="M 220,130 L 220,210 C 220,270 245,320 285,355 L 340,410" fill="none" stroke="#0d0d0d" strokeWidth="4.5" />
                  <path d="M 340,410 L 415,485 L 452,532" fill="none" stroke="#765b00" strokeWidth="3" />

                  {/* Shoes */}
                  <g transform="translate(220, 130)">
                    <polygon points="-8,-4 0,0 -8,4" fill="#0d0d0d" />
                    <polygon points="8,-4 0,0 8,4" fill="#0d0d0d" />
                    <line x1="12" y1="0" x2="65" y2="0" stroke="#747878" strokeWidth="0.8" />
                    <text x="70" y="3" className="text-[9px] font-mono fill-[#0d0d0d]">13-3/8&quot; SHOE @ 650 m TVDSS</text>
                  </g>
                  <g transform="translate(340, 410)">
                    <polygon points="-7,-4 0,0 -7,4" fill="#0d0d0d" />
                    <polygon points="7,-4 0,0 7,4" fill="#0d0d0d" />
                    <line x1="12" y1="0" x2="65" y2="0" stroke="#747878" strokeWidth="0.8" />
                    <text x="70" y="3" className="text-[9px] font-mono fill-[#0d0d0d]">9-5/8&quot; SHOE @ 2,150 m (FIT 1.48 SG)</text>
                  </g>
                  <g transform="translate(436, 508)">
                    <polygon points="-6,-3 0,0 -6,3" fill="#765b00" />
                    <polygon points="6,-3 0,0 6,3" fill="#765b00" />
                    <line x1="10" y1="0" x2="45" y2="0" stroke="#765b00" strokeWidth="0.8" />
                    <text x="50" y="3" className="text-[9px] font-mono fill-[#765b00] font-semibold">7&quot; LINER @ 3,020 m (LOT 1.62 SG)</text>
                  </g>

                  {/* TD Mark */}
                  <circle cx="452" cy="532" r="3.5" fill="#ba1a1a" />
                  <text x="462" y="535" className="text-[10px] font-mono fill-[#ba1a1a] font-bold">TD: 3,120.0 m (COMPLETED)</text>

                  {/* Incident Markers */}
                  <g transform="translate(305, 375)">
                    <circle cx="0" cy="0" r="10" fill="#fecf50" fillOpacity="0.35" />
                    <circle cx="0" cy="0" r="4" fill="#765b00" />
                    <line x1="0" y1="0" x2="-80" y2="-45" stroke="#765b00" strokeWidth="1" />
                    <g transform="translate(-230, -75)">
                      <rect width="145" height="56" rx="4" fill="#ffffff" stroke="#765b00" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))" />
                      <text x="6" y="14" fill="#765b00" fontSize="8.5" className="font-mono font-bold">2,450 m · INCIDENT #2</text>
                      <text x="6" y="28" fill="#0d0d0d" fontSize="8" className="font-mono">Differential Sticking (14h NPT).</text>
                      <text x="6" y="40" fill="#444748" fontSize="8" className="font-mono">Freed with surfactant soak.</text>
                    </g>
                  </g>

                  <g transform="translate(395, 465)">
                    <circle cx="0" cy="0" r="12" fill="#ffdad6" fillOpacity="0.6" />
                    <circle cx="0" cy="0" r="4.5" fill="#ba1a1a" />
                    <line x1="0" y1="0" x2="-80" y2="-40" stroke="#ba1a1a" strokeWidth="1" />
                    <g transform="translate(-240, -70)">
                      <rect width="155" height="60" rx="4" fill="#ffffff" stroke="#ba1a1a" strokeWidth="1" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.08))" />
                      <text x="6" y="14" fill="#ba1a1a" fontSize="8.5" className="font-mono font-bold">2,912 m · SEVERE LOSS</text>
                      <text x="6" y="28" fill="#0d0d0d" fontSize="8" className="font-mono">Severe Mud Loss: 45 m³ total.</text>
                      <text x="6" y="40" fill="#444748" fontSize="8" className="font-mono">Cured w/ 35 ppb CaCO3 pill.</text>
                      <text x="6" y="52" fill="#765b00" fontSize="7.5" className="font-mono">DDR Phase 2 · p.42</text>
                    </g>
                  </g>
                </svg>

                {/* HUD Overlay */}
                <div className="absolute bottom-4 left-4 p-3 bg-white/90 backdrop-blur border border-[#dbdad6] rounded-lg text-[10px] font-mono space-y-1 shadow-sm">
                  <div className="flex items-center justify-between gap-4 text-[#0d0d0d]">
                    <span className="text-[#444748]">BUR (Build Up Rate):</span>
                    <span className="font-semibold">2.4° / 30m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[#0d0d0d]">
                    <span className="text-[#444748]">Total Dogleg Severity:</span>
                    <span className="font-semibold">3.1° Max</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[#0d0d0d]">
                    <span className="text-[#444748]">Closure Distance:</span>
                    <span className="font-semibold">684.2 m @ 044° Az</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Sub-panel: Formation Intersection Timeline */}
          <section className="bg-white border border-[#dbdad6] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[12px] font-bold text-[#0d0d0d] uppercase font-mono">
                Litho-Stratigraphic Interval Correlation
              </h2>
              <span className="text-[10px] font-mono text-[#444748]">LOGGED VIA MWD/LWD &amp; CUTTINGS</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="p-2.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                <div className="text-[10px] font-mono text-[#444748]">2,600 – 2,750 m</div>
                <div className="font-serif text-[15px] text-[#0d0d0d] font-bold mt-0.5">Girujan Clay</div>
                <div className="text-[9px] font-mono text-[#765b00] mt-1">Overpressured Shale</div>
              </div>
              <div className="p-2.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                <div className="text-[10px] font-mono text-[#444748]">2,750 – 2,840 m</div>
                <div className="font-serif text-[15px] text-[#0d0d0d] font-bold mt-0.5">Tipam Sandstone</div>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Water Sand &amp; Sloughing</div>
              </div>
              <div className="p-2.5 rounded bg-[#fecf50]/20 border border-[#fecf50]">
                <div className="text-[10px] font-mono text-[#735800] font-bold">2,840 – 3,100 m</div>
                <div className="font-serif text-[15px] text-[#0d0d0d] font-bold mt-0.5">Barail Main Arenaceous</div>
                <div className="text-[9px] font-mono text-[#735800] font-semibold mt-1">Pay Zone (Oil &amp; Gas)</div>
              </div>
              <div className="p-2.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                <div className="text-[10px] font-mono text-[#444748]">3,100 – 3,120 m TD</div>
                <div className="font-serif text-[15px] text-[#0d0d0d] font-bold mt-0.5">Kopili Shale</div>
                <div className="text-[9px] font-mono text-[#444748] mt-1">Basement Seal</div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Specs, Casing Schematics & Historical Incident Logs */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Casing Program */}
          <section className="bg-white border border-[#dbdad6] rounded-xl p-4 flex flex-col shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#dbdad6] mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0d0d0d]">architecture</span>
                <h2 className="text-[12px] font-bold text-[#0d0d0d] uppercase font-mono">
                  Casing &amp; Shoe Integrity
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold">4 STRINGS</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="text-[#444748] border-b border-[#dbdad6] uppercase">
                    <th className="py-1.5 font-medium">String / Hole</th>
                    <th className="py-1.5 font-medium">Shoe TVD</th>
                    <th className="py-1.5 font-medium">LOT / FIT</th>
                    <th className="py-1.5 font-medium text-right">MW</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dbdad6] text-[#0d0d0d]">
                  {casingData.map((c, i) => (
                    <tr key={i} className={c.string.includes("Prod") ? "bg-[#fecf50]/15" : ""}>
                      <td className="py-2">
                        <div className="font-semibold text-[#0d0d0d]">{c.string}</div>
                        <div className="text-[9px] text-[#444748]">Hole: {c.hole}</div>
                      </td>
                      <td className="py-2">{c.shoeM.toFixed(1)} m</td>
                      <td className="py-2">
                        <span className="px-1 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6]">
                          {c.lotFit}
                        </span>
                      </td>
                      <td className="py-2 text-right">{c.mw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Card 2: Logged Stratigraphic Tops */}
          <section className="bg-white border border-[#dbdad6] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#dbdad6] mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#0d0d0d]">layers</span>
                <h2 className="text-[12px] font-bold text-[#0d0d0d] uppercase font-mono">
                  Logged Stratigraphic Tops
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#444748]">OFFSET CONFIRMED</span>
            </div>
            <div className="space-y-1.5 font-mono text-[10px]">
              {stratTops.map((top, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border flex items-center justify-between ${
                    top.name.includes("Main Pay")
                      ? "bg-[#fecf50]/20 border-[#fecf50]"
                      : "bg-[#f5f4ef] border-[#dbdad6]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-6 rounded-sm" style={{ backgroundColor: top.color }}></span>
                    <div>
                      <div className="font-bold text-[#0d0d0d]">{top.name}</div>
                      <div className="text-[9px] text-[#444748]">{top.sub}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#0d0d0d]">{top.depthM.toFixed(1)} m</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card 3: Historical Incident Log */}
          <section className="bg-white border border-[#dbdad6] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-[#dbdad6] mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">report_problem</span>
                <h2 className="text-[12px] font-bold text-[#0d0d0d] uppercase font-mono">
                  Historical Incident Log (DDR)
                </h2>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-mono text-[10px] font-bold">
                2 CRITICAL
              </span>
            </div>
            <div className="space-y-2">
              {incidents.map((inc, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border ${
                    inc.severity === "critical"
                      ? "bg-[#ffdad6]/30 border-l-4 border-l-[#ba1a1a] border-[#ffdad6]"
                      : "bg-[#ffdf95]/30 border-l-4 border-l-[#765b00] border-[#ffdf95]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={`font-bold uppercase ${inc.severity === "critical" ? "text-[#ba1a1a]" : "text-[#765b00]"}`}>
                      {inc.type}
                    </span>
                    <span className="text-[#444748]">{inc.depthM} m TVDSS</span>
                  </div>
                  <p className="text-[11px] text-[#0d0d0d] mt-1 leading-normal">{inc.desc}</p>
                  <div className="mt-2 pt-1 border-t border-[#dbdad6] flex items-center justify-between text-[10px] font-mono text-[#444748]">
                    <span>{inc.remediation}</span>
                    <span className="text-[#0d0d0d] font-bold">{inc.doc} ↗</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* File Vault Links */}
          <div className="p-3 rounded-lg bg-[#e9e8e4] border border-[#dbdad6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#444748]">inventory_2</span>
              <div>
                <div className="text-[11px] font-mono font-bold text-[#0d0d0d]">Master Composite Log DLIS / LAS</div>
                <div className="text-[9px] font-mono text-[#444748]">148 MB · Calibrated Depth Track</div>
              </div>
            </div>
            <button
              onClick={() => {
                const blob = new Blob(["# MASTER LOG DLIS/LAS\n~Well Information\n"], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${wellId}_master_log.las`;
                a.click();
              }}
              className="px-3 py-1 rounded-full bg-white border border-[#dbdad6] text-[10px] font-mono font-semibold text-[#0d0d0d] hover:bg-[#efeeea] transition-colors"
            >
              FETCH
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
