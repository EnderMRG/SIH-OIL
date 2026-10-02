"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepthShort } from "@/lib/units";

interface HazardItem {
  title: string;
  depth: string;
  severity: "error" | "warning";
}

interface WellData {
  id: string;
  name: string;
  dates: string;
  tdMeters: number;
  surfaceDistKm: number;
  surfaceBearing: string;
  proximityMeters: number;
  similarity: number;
  statusBadge: string;
  cx: number;
  cy: number;
  hazards: HazardItem[];
  source: string;
  stratigraphyMatch: number;
  geomechanicsMatch: number;
  porePressureMatch: number;
}

const WELLS_DATA: Record<string, WellData> = {
  "OIL-NH-04": {
    id: "OIL-NH-04",
    name: "OIL-NH-04",
    dates: "Spud: 14 Oct 2021 · Completed Dev",
    tdMeters: 3120,
    surfaceDistKm: 1.82,
    surfaceBearing: "046° NE",
    proximityMeters: 420,
    similarity: 88.2,
    statusBadge: "ANALOGUE BASELINE",
    cx: 510,
    cy: 290,
    stratigraphyMatch: 92,
    geomechanicsMatch: 95,
    porePressureMatch: 84,
    hazards: [
      { title: "Severe Mud Loss (45 m³)", depth: "2,912 m TVDSS · Fracture Zone", severity: "error" },
      { title: "Differential Sticking Risk", depth: "2,450 m TVDSS · Permeable Sand", severity: "warning" },
    ],
    source: "DDR_OIL_NH04_Phase2.pdf · p.42",
  },
  "OIL-NH-07": {
    id: "OIL-NH-07",
    name: "OIL-NH-07",
    dates: "Spud: 02 Feb 2019 · Producing Gas",
    tdMeters: 3480,
    surfaceDistKm: 3.4,
    surfaceBearing: "182° S",
    proximityMeters: 890,
    similarity: 74.6,
    statusBadge: "GAS PRODUCER",
    cx: 460,
    cy: 410,
    stratigraphyMatch: 78,
    geomechanicsMatch: 82,
    porePressureMatch: 69,
    hazards: [
      { title: "Overpressure Gas Kick (0.72 psi/ft)", depth: "3,150 m TVDSS · Tipam Sand", severity: "warning" },
    ],
    source: "COMP_REPORT_OIL_NH07_FINAL.pdf · p.18",
  },
  "OIL-NH-09": {
    id: "OIL-NH-09",
    name: "OIL-NH-09",
    dates: "Spud: 19 Jun 2022 · Suspended",
    tdMeters: 2890,
    surfaceDistKm: 9.2,
    surfaceBearing: "268° W",
    proximityMeters: 1420,
    similarity: 63.1,
    statusBadge: "FAULT ADJACENT",
    cx: 290,
    cy: 350,
    stratigraphyMatch: 65,
    geomechanicsMatch: 59,
    porePressureMatch: 71,
    hazards: [
      { title: "High Drilling Torque & Bit Bounce", depth: "2,200 m TVDSS · Chert stringer", severity: "error" },
      { title: "Minor H2S Influx Detected (4 ppm)", depth: "2,780 m TVDSS · Coal bed", severity: "warning" },
    ],
    source: "WELL_LOG_NH09_LOGS_SEC4.las · header",
  },
  "OIL-NH-15": {
    id: "OIL-NH-15",
    name: "OIL-NH-15",
    dates: "Spud: 11 Nov 2016 · Abandoned",
    tdMeters: 3650,
    surfaceDistKm: 24.1,
    surfaceBearing: "318° NW",
    proximityMeters: 4100,
    similarity: 42.0,
    statusBadge: "DISTAL OFFSET",
    cx: 160,
    cy: 140,
    stratigraphyMatch: 45,
    geomechanicsMatch: 38,
    porePressureMatch: 44,
    hazards: [
      { title: "Complete Lost Circulation Zone", depth: "3,410 m TVDSS · Fault breach", severity: "error" },
    ],
    source: "LEGACY_DDR_NH15_ARCHIVE.pdf · p.102",
  },
};

export default function MapPage() {
  const { unitSystem } = useGlobalContext();
  const [radiusKm, setRadiusKm] = useState<number>(18.5);
  const [selectedWellId, setSelectedWellId] = useState<string>("OIL-NH-04");
  const [mode3D, setMode3D] = useState<boolean>(false);
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    faults: true,
    lease: false,
    inlines: false,
  });

  const selectedWell = WELLS_DATA[selectedWellId] || WELLS_DATA["OIL-NH-04"];

  // Radius conversion in SVG px (center is 460, 340; 18.5 km = ~245 px radius -> ~13.24 px/km)
  const svgRadius = Math.min(Math.max(radiusKm * 13.24, 30), 450);

  const formatDepth = (m: number) => {
    return fmtDepthShort(m, unitSystem);
  };

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      {/* Sub-Header Status & Screening Telemetry Bar */}
      <div className="w-full bg-[#f5f4ef] px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#dbdad6]">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              MAP VIEW // 02
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#fecf50]"></span>
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              EPSG:4326 / 3857 · SUB-SURFACE PROXIMITY SCREENING
            </span>
          </div>
          <h2 className="font-serif text-[28px] font-semibold text-[#0d0d0d] tracking-tight">
            Geospatial / 3D Exploration
          </h2>
        </div>

        {/* Actions and Indicators */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e9e8e4] text-[11px] font-mono text-[#0d0d0d]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#765b00]"></span>
            <span className="font-semibold tracking-wider">SEARCH BUFFER:</span>
            <span className="font-bold">{radiusKm.toFixed(1)} km</span>
          </div>

          <button
            onClick={() => setMode3D(!mode3D)}
            className={`px-4 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${mode3D
                ? "bg-[#765b00] text-white"
                : "bg-[#0d0d0d] text-white hover:opacity-90"
              }`}
          >
            <span className="material-symbols-outlined text-[14px]">view_in_ar</span>
            <span>{mode3D ? "3D MODE ACTIVE" : "2D VECTOR DRAFT"}</span>
          </button>

          <button
            onClick={() => {
              const geojson = JSON.stringify(WELLS_DATA, null, 2);
              const blob = new Blob([geojson], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "subsurface_offsets_nh12.geojson";
              a.click();
            }}
            className="px-3.5 py-1.5 rounded-full bg-[#e9e8e4] text-[#0d0d0d] text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#dbdad6] transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">file_download</span>
            EXPORT SHAPEFILE
          </button>
        </div>
      </div>

      {/* Interactive Controls & Offset Wells Tray */}
      <div className="w-full bg-[#faf9f5] px-6 py-2.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border-b border-[#dbdad6]">
        {/* Continuous Radius Range Slider */}
        <div className="flex items-center gap-4 min-w-[320px] lg:w-1/3">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[12px] font-mono font-extrabold uppercase text-[#0d0d0d]">
              PROXIMITY BUFFER:
            </span>
            <span className="bg-[#fecf50]/20 text-[#765b00] px-2 py-0.5 rounded text-[12px] font-extrabold border border-[#fecf50]/40">
              {radiusKm.toFixed(1)} KM
            </span>
          </div>
          <div className="flex-1 relative flex flex-col justify-center">
            <input
              type="range"
              min="3"
              max="50"
              step="0.5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-[#dbdad6] rounded-lg appearance-none cursor-pointer outline-none focus:outline-none
                         [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4
                         [&::-webkit-slider-thumb]:bg-[#0d0d0d]
                         [&::-webkit-slider-thumb]:rounded-full
                         [&::-moz-range-thumb]:w-4
                         [&::-moz-range-thumb]:h-4
                         [&::-moz-range-thumb]:bg-[#0d0d0d]
                         [&::-moz-range-thumb]:border-0
                         [&::-moz-range-thumb]:rounded-full"
            />
            <div className="flex justify-between text-[11px] font-mono text-[#444748] font-bold mt-2">
              <span>3 km</span>
              <span>10 km</span>
              <span>25 km</span>
              <span>35 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>

        {/* Active Well Quick Chip */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none flex-1 lg:justify-end">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono tracking-tight whitespace-nowrap transition-all shadow-sm bg-[#0d0d0d] text-white"
          >
            <span className="w-2 h-2 rounded-full bg-[#fecf50]" />
            <span className="font-bold">{selectedWell.name}</span>
            <span className="opacity-80">
              {selectedWell.surfaceDistKm} km · {selectedWell.surfaceDistKm <= radiusKm ? `${selectedWell.hazards.length} EVENTS` : "(OUT)"}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Workspace 2-Column: Map Viewport + Inspection Rail */}
      <div className="w-full p-4 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 items-start">
        {/* Interactive Geospatial Vector Canvas */}
        <div className="relative w-full h-[640px] bg-[#f2f0e8] rounded-xl overflow-hidden border border-[#dbdad6] shadow-sm select-none">
          {/* Coordinate Reticle Top-Left Stamp */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
            <div className="flex items-center gap-2 bg-[#faf9f5]/90 backdrop-blur px-2.5 py-1 rounded border border-[#dbdad6] text-[11px] font-mono font-bold text-[#0d0d0d] tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50] animate-pulse"></span>
              GRID DATUM: 27°18&apos;42.1&quot;N / 95°22&apos;18.4&quot;E
            </div>
            <div className="bg-[#faf9f5]/80 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-[#444748] shadow-sm">
              HORIZON: BARAIL SANDSTONE (OLIGOCENE) · DEPTH: -2,840m TVD
            </div>
          </div>

          {/* Map Layer Switchers Top-Right */}
          <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-1.5">
            <div className="flex items-center bg-[#faf9f5]/95 backdrop-blur p-1 rounded-full border border-[#dbdad6] shadow-sm text-[10px] font-mono text-[#444748]">
              <button
                onClick={() => toggleLayer("faults")}
                className={`px-2.5 py-1 rounded-full transition-colors ${activeLayers.faults
                    ? "bg-[#0d0d0d] text-white"
                    : "hover:bg-[#e9e8e4]"
                  }`}
              >
                Faults (FP-ALPHA)
              </button>
              <button
                onClick={() => toggleLayer("lease")}
                className={`px-2.5 py-1 rounded-full transition-colors ${activeLayers.lease
                    ? "bg-[#0d0d0d] text-white"
                    : "hover:bg-[#e9e8e4]"
                  }`}
              >
                Lease OML-12
              </button>
              <button
                onClick={() => toggleLayer("inlines")}
                className={`px-2.5 py-1 rounded-full transition-colors ${activeLayers.inlines
                    ? "bg-[#0d0d0d] text-white"
                    : "hover:bg-[#e9e8e4]"
                  }`}
              >
                Inlines 3D
              </button>
            </div>
          </div>

          {/* Live Vector Geospatial SVG Canvas */}
          <div className="absolute inset-0 z-10 w-full h-full cursor-crosshair">
            <svg
              className={`w-full h-full transition-transform duration-500 ${mode3D ? "scale-95 [transform:rotateX(24deg)_rotateZ(-8deg)]" : ""
                }`}
              viewBox="0 0 900 640"
            >
              <defs>
                <pattern id="survey-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path
                    d="M 60 0 L 0 0 0 60"
                    fill="none"
                    stroke="#e0ded6"
                    strokeWidth="0.75"
                    strokeDasharray="2,3"
                  />
                  <circle cx="60" cy="60" r="1.5" fill="#cfcdc5" />
                </pattern>
              </defs>

              {/* Structural Background Mesh */}
              <rect width="100%" height="100%" fill="url(#survey-grid)" />

              {/* Geological Depth Contour Lines */}
              <g fill="none" opacity="0.8" stroke="#d5d2c7" strokeWidth="1.2">
                <path d="M-50,220 C180,180 320,310 540,240 C720,180 820,290 980,260" />
                <path d="M-50,300 C150,240 380,390 600,320 C760,260 880,360 980,340" />
                <path d="M-50,380 C120,320 400,470 650,390 C800,340 890,440 980,410" />
                <path d="M-50,470 C160,420 370,540 680,470 C830,420 920,520 980,490" />
                <path d="M-50,560 C220,510 390,620 720,550 C860,500 940,590 980,570" />
              </g>

              {/* Regional Fault Plane */}
              {activeLayers.faults && (
                <g opacity="0.85">
                  <path d="M 120,40 Q 280,280 430,620" fill="none" stroke="#ba1a1a" strokeWidth="2" strokeDasharray="6,4" />
                  <text
                    x="140"
                    y="80"
                    fill="#ba1a1a"
                    stroke="none"
                    fontSize="12.5"
                    className="font-mono text-[12.5px] uppercase tracking-widest font-extrabold"
                  >
                    THRUST FAULT FP-ALPHA [THROW: 120M]
                  </text>
                </g>
              )}

              {/* Lease Boundary */}
              {activeLayers.lease && (
                <rect
                  x="200"
                  y="120"
                  width="500"
                  height="420"
                  fill="none"
                  stroke="#765b00"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.6"
                />
              )}

              {/* Inlines 3D seismic lines */}
              {activeLayers.inlines && (
                <g stroke="#858383" strokeWidth="0.5" opacity="0.4">
                  {[160, 260, 360, 460, 560].map((y) => (
                    <line key={y} x1="50" y1={y} x2="850" y2={y} strokeDasharray="2,2" />
                  ))}
                </g>
              )}

              {/* Concentric Search Buffers anchored on Primary Well NH-12 (460, 340) */}
              <circle
                cx="460"
                cy="340"
                r="66"
                fill="none"
                stroke="#747878"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                opacity="0.35"
              />
              <text x="410" y="290" textAnchor="end" fill="#444748" fontSize="11" className="font-mono text-[11px] font-bold">
                R = 5 KM
              </text>

              <circle
                cx="460"
                cy="340"
                r="132"
                fill="none"
                stroke="#747878"
                strokeWidth="1.5"
                strokeDasharray="5,5"
                opacity="0.35"
              />
              <text x="364" y="244" textAnchor="end" fill="#444748" fontSize="11" className="font-mono text-[11px] font-bold">
                R = 10 KM
              </text>

              {/* Dynamic Interactive Proximity Buffer */}
              <circle
                cx="460"
                cy="340"
                r={svgRadius}
                fill="#fecf50"
                fillOpacity="0.05"
                stroke="#765b00"
                strokeWidth="1.75"
                strokeDasharray="6,4"
                className="transition-all duration-300"
              />

              {/* Subsurface Trajectory Path for Primary Target Well OIL-NH-12 */}
              <g>
                <path
                  d="M 460,340 L 510,270 L 540,220"
                  fill="none"
                  stroke="#dbdad6"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M 460,340 Q 490,320 510,270 T 540,220"
                  fill="none"
                  stroke="#0d0d0d"
                  strokeWidth="2.5"
                  strokeDasharray="4,2"
                />
                <circle cx="490" cy="300" r="2.5" fill="#0d0d0d" />
                <text x="498" y="304" fill="#0d0d0d" fontSize="10.5" className="font-mono text-[10.5px] font-bold">
                  1,200m MD (KOP)
                </text>
                <circle cx="510" cy="270" r="2.5" fill="#0d0d0d" />
                <text x="518" y="274" fill="#0d0d0d" fontSize="10.5" className="font-mono text-[10.5px] font-bold">
                  2,150m MD (Inc 32°)
                </text>
              </g>

              {/* Primary Well Target Pin: RIG SE-802 / OIL-NH-12 */}
              <g>
                <circle
                  cx="460"
                  cy="340"
                  r="22"
                  fill="#765b00"
                  fillOpacity="0.12"
                  className="animate-ping"
                  style={{ animationDuration: "3s" }}
                />
                <circle cx="460" cy="340" r="10" fill="#fecf50" stroke="#0d0d0d" strokeWidth="2" />
                <circle cx="460" cy="340" r="3" fill="#0d0d0d" />
                <g transform="translate(460, 360)">
                  <rect x="-80" y="0" width="160" height="26" rx="6" fill="#0d0d0d" />
                  <text
                    x="0"
                    y="17"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="12.5"
                    className="font-mono text-[12.5px] font-extrabold uppercase tracking-widest"
                  >
                    RIG SE-802 · NH-12
                  </text>
                </g>
              </g>

              {/* Offset Wells Interactive Pins */}
              {Object.values(WELLS_DATA).map((w) => {
                const isSelected = w.id === selectedWellId;
                const inBuffer = w.surfaceDistKm <= radiusKm;

                return (
                  <g
                    key={w.id}
                    className="cursor-pointer transition-opacity group"
                    opacity={inBuffer ? 1 : 0.45}
                    onClick={() => setSelectedWellId(w.id)}
                  >
                    {isSelected && (
                      <circle
                        cx={w.cx}
                        cy={w.cy}
                        r="18"
                        fill="none"
                        stroke="#0d0d0d"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                        className="animate-spin"
                        style={{ animationDuration: "12s" }}
                      />
                    )}
                    <circle
                      cx={w.cx}
                      cy={w.cy}
                      r={isSelected ? 6 : 5}
                      fill={
                        w.id === "OIL-NH-04"
                          ? "#0d0d0d"
                          : w.id === "OIL-NH-07"
                            ? "#fecf50"
                            : w.id === "OIL-NH-09"
                              ? "#ba1a1a"
                              : "#dbdad6"
                      }
                      stroke="#0d0d0d"
                      strokeWidth={isSelected ? 2 : 1.5}
                    />
                    {isSelected && <circle cx={w.cx} cy={w.cy} r="2" fill="#ffffff" />}

                    {/* Invisible Hit Area for better hover precision */}
                    <circle cx={w.cx} cy={w.cy} r="20" fill="transparent" />

                    {/* Annotation Pin */}
                    <g 
                      transform={`translate(${w.cx + 14}, ${w.cy - 24})`}
                      className="pointer-events-none transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <rect
                        x="0"
                        y="0"
                        width="196"
                        height="44"
                        rx="6"
                        fill="#ffffff"
                        stroke={isSelected ? "#0d0d0d" : "#747878"}
                        strokeWidth={isSelected ? 2 : 1.5}
                        filter="drop-shadow(0 6px 12px rgba(0,0,0,0.15))"
                      />
                      <text
                        x="12"
                        y="18"
                        fill="#0d0d0d"
                        fontSize="12.5"
                        className="font-mono text-[12.5px] font-extrabold tracking-tight"
                      >
                        {w.name} · TD {formatDepth(w.tdMeters)}
                      </text>
                      <text
                        x="12"
                        y="33"
                        fill="#765b00"
                        fontSize="10"
                        className="font-mono text-[10px] font-bold tracking-wide"
                      >
                        {w.similarity}% ANALOGUE MATCH
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Bottom Floating Map Scale & Perspective HUD */}
          <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 bg-[#faf9f5]/90 backdrop-blur px-3 py-1.5 rounded border border-[#dbdad6] shadow-sm text-[10px] font-mono text-[#0d0d0d]">
              <div className="flex flex-col">
                <span className="text-[9px] text-[#444748] leading-none mb-1">MAP SCALE</span>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-16 h-1 bg-[#0d0d0d]"></span>
                  <span className="font-bold">2.0 KM</span>
                </div>
              </div>
              <span className="h-4 w-px bg-[#dbdad6]"></span>
              <span className="text-[10px] text-[#444748] font-medium">
                INCLINATION: 18.4° · AZIMUTH: 042°
              </span>
            </div>

            <div className="flex items-center gap-1 bg-[#faf9f5]/90 backdrop-blur p-1 rounded-lg border border-[#dbdad6] shadow-sm text-[#0d0d0d]">
              <button
                onClick={() => setRadiusKm((r) => Math.min(50, r + 5))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#e9e8e4] transition-colors"
                title="Expand Buffer"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
              <button
                onClick={() => setRadiusKm((r) => Math.max(3, r - 5))}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#e9e8e4] transition-colors"
                title="Contract Buffer"
              >
                <span className="material-symbols-outlined text-[16px]">remove</span>
              </button>
              <button
                onClick={() => setRadiusKm(18.5)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#e9e8e4] transition-colors"
                title="Reset Default Buffer"
              >
                <span className="material-symbols-outlined text-[16px]">filter_center_focus</span>
              </button>
              <span className="h-4 w-px bg-[#dbdad6] mx-0.5"></span>
              <button
                onClick={() => setMode3D(!mode3D)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#e9e8e4] transition-colors"
                title="Toggle Perspective"
              >
                <span className="material-symbols-outlined text-[16px]">explore</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Selected Well Inspection Drawer */}
        <div className="w-full bg-white rounded-xl p-5 border border-[#dbdad6] shadow-sm flex flex-col gap-4">
          {/* Drawer Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-[#fecf50] text-[#735800] text-[11px] font-mono font-bold tracking-wider uppercase">
                  {selectedWell.statusBadge}
                </span>
                <span className="text-[11px] font-mono text-[#444748]">
                  ID: {selectedWell.id}
                </span>
              </div>
              <h3 className="font-serif text-[25px] font-semibold text-[#0d0d0d]">
                {selectedWell.name}
              </h3>
              <p className="text-[12px] font-mono text-[#444748] mt-0.5">
                {selectedWell.dates}
              </p>
            </div>
          </div>

          {/* Key Spatial & Geological Metrics */}
          <div className="grid grid-cols-2 gap-2 bg-[#f5f4ef] p-3 rounded-lg border border-[#dbdad6]">
            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-[#444748] uppercase">Total Depth</span>
              <span className="text-[17px] font-mono font-semibold text-[#0d0d0d]">
                {formatDepth(selectedWell.tdMeters)}
              </span>
              <span className="text-[10px] font-mono text-[#444748]">TVDSS Subsea</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-mono text-[#444748] uppercase">Surface Offset</span>
              <span className="text-[17px] font-mono font-semibold text-[#0d0d0d]">
                {selectedWell.surfaceDistKm} km
              </span>
              <span className="text-[10px] font-mono text-[#444748]">
                Bearing: {selectedWell.surfaceBearing}
              </span>
            </div>
            <div className="flex flex-col mt-2">
              <span className="text-[11px] font-mono text-[#444748] uppercase">Target Proximity</span>
              <span className="text-[17px] font-mono font-semibold text-[#0d0d0d]">
                {formatDepth(selectedWell.proximityMeters)}
              </span>
              <span className="text-[10px] font-mono text-[#444748]">Delta at Sand Bar</span>
            </div>
            <div className="flex flex-col mt-2">
              <span className="text-[11px] font-mono text-[#444748] uppercase">Formation Match</span>
              <span className={`text-[17px] font-mono font-semibold ${
                selectedWell.similarity >= 80 ? 'text-[#2e5c1e]' : 
                selectedWell.similarity >= 60 ? 'text-[#765b00]' : 'text-[#ba1a1a]'
              }`}>
                {selectedWell.similarity}%
              </span>
              <span className="text-[10px] font-mono text-[#444748]">Multi-Factor Analogue</span>
            </div>
          </div>

          {/* Multi-Factor Similarity Decomposition */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center text-[12px] font-mono">
              <span className="uppercase font-semibold text-[#0d0d0d]">
                Analogue Confidence Matrix
              </span>
              <span className={`font-bold ${
                selectedWell.similarity >= 80 ? 'text-[#2e5c1e]' : 
                selectedWell.similarity >= 60 ? 'text-[#765b00]' : 'text-[#ba1a1a]'
              }`}>
                {selectedWell.similarity >= 80 ? "HIGH CORRELATION" : selectedWell.similarity >= 60 ? "MODERATE OVERLAP" : "LOW CORRELATION"}
              </span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#444748] mb-1">
                  <span>Stratigraphic Lithology Match</span>
                  <span className={`font-semibold ${
                    selectedWell.stratigraphyMatch >= 80 ? 'text-[#2e5c1e]' : 
                    selectedWell.stratigraphyMatch >= 60 ? 'text-[#765b00]' : 'text-[#ba1a1a]'
                  }`}>{selectedWell.stratigraphyMatch}%</span>
                </div>
                <div className="w-full bg-[#e9e8e4] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0d0d0d] h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedWell.stratigraphyMatch}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#444748] mb-1">
                  <span>Geomechanical Stress Alignment</span>
                  <span className={`font-semibold ${
                    selectedWell.geomechanicsMatch >= 80 ? 'text-[#2e5c1e]' : 
                    selectedWell.geomechanicsMatch >= 60 ? 'text-[#765b00]' : 'text-[#ba1a1a]'
                  }`}>{selectedWell.geomechanicsMatch}%</span>
                </div>
                <div className="w-full bg-[#e9e8e4] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0d0d0d] h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedWell.geomechanicsMatch}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono text-[#444748] mb-1">
                  <span>Trajectory &amp; Pore Pressure Profile</span>
                  <span className={`font-semibold ${
                    selectedWell.porePressureMatch >= 80 ? 'text-[#2e5c1e]' : 
                    selectedWell.porePressureMatch >= 60 ? 'text-[#765b00]' : 'text-[#ba1a1a]'
                  }`}>{selectedWell.porePressureMatch}%</span>
                </div>
                <div className="w-full bg-[#e9e8e4] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#fecf50] h-full rounded-full transition-all duration-500"
                    style={{ width: `${selectedWell.porePressureMatch}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Historical In-Flight Drilling Incidents */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] font-mono text-[#0d0d0d] font-semibold uppercase tracking-wider">
              Historical Incident Records
            </span>
            <div className="flex flex-col gap-2">
              {selectedWell.hazards.map((h, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2.5 rounded border ${h.severity === "error"
                      ? "bg-[#ffdad6]/40 border-[#ffdad6] text-[#93000a]"
                      : "bg-[#ffdf95]/40 border-[#ffdf95] text-[#594400]"
                    }`}
                >
                  <span className="material-symbols-outlined text-[17px] shrink-0 mt-0.5">
                    {h.severity === "error" ? "warning" : "speed"}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[13px] font-semibold leading-tight">{h.title}</span>
                    <span className="text-[11px] font-mono opacity-80 mt-0.5">{h.depth}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Provenance Archival Stamp */}
          <div className="flex items-center justify-between p-2 rounded bg-[#f5f4ef] border border-[#dbdad6] text-[11px] font-mono text-[#444748]">
            <span className="flex items-center gap-1.5 truncate">
              <span className="material-symbols-outlined text-[15px]">article</span>
              <span className="truncate">{selectedWell.source}</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#0d0d0d] shrink-0 ml-1">
              VERIFIED E-ARCHIVE
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <Link
              href="/correlation"
              className="w-full py-2.5 px-4 rounded-full bg-[#0d0d0d] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
            >
              <span>Add to Correlation Curtain</span>
              <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
            </Link>

            <Link
              href={`/well/${selectedWell.id}`}
              className="w-full py-2 px-4 rounded-full bg-[#e9e8e4] text-[#0d0d0d] text-[13px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#dbdad6] transition-colors"
            >
              <span className="material-symbols-outlined text-[17px]">visibility</span>
              <span>View Full Well File 360°</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Subsurface Cross-Section Preview Footer Teaser */}
      <div className="w-full px-4 pb-6 mt-2">
        <div className="w-full bg-[#f5f4ef] rounded-xl p-4 border border-[#dbdad6] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#e9e8e4] flex items-center justify-center text-[#0d0d0d] shrink-0">
              <span className="material-symbols-outlined text-[20px]">layers</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#0d0d0d]">
                Inter-well Lithology Curtain Active
              </span>
              <span className="text-[11px] font-mono text-[#444748]">
                Selected 1 primary target (NH-12) &amp; 3 calibrated offsets along SW-NE section traverse
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#444748] uppercase">
              Traverse Length: 11.02 km
            </span>
            <Link
              href="/correlation"
              className="px-3.5 py-1.5 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider hover:opacity-90 transition-opacity"
            >
              Launch Section Curtain (03)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
