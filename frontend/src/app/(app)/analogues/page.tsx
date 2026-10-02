"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useGlobalContext } from "@/store/globalContext";

interface OffsetWell {
  id: string;
  name: string;
  uwi: string;
  field: string;
  block: string;
  distKm: number;
  bearing: string;
  tvdDeltaM: number;
  stratMatch: number;
  breakdown: {
    lithology: number;
    proximity: number;
    tvdDelta: number;
    trajectory: number;
    casing: number;
  };
  rationale: string;
  incidents: {
    depth: string;
    type: string;
    tag: string;
    tagColor: "error" | "warning";
    desc: string;
  }[];
  prognosisAction: string;
}

const WELLS: OffsetWell[] = [
  {
    id: "OIL-NH-04",
    name: "OIL-NH-04",
    uwi: "49-204-9812-00",
    field: "Nahorkatiya Ext",
    block: "Central Flank Block IV",
    distKm: 1.82,
    bearing: "NE",
    tvdDeltaM: 270,
    stratMatch: 92.4,
    breakdown: {
      lithology: 92.4,
      proximity: 88.0,
      tvdDelta: 85.0,
      trajectory: 80.0,
      casing: 95.0,
    },
    rationale:
      "Well OIL-NH-04 resides on the identical south-east plunging anticlinal flank of the Nahorkatiya structure, matching the prospective seismic sequence of target OIL-NH-12. Both profiles encounter the critical 12-1/4\" intermediate hole section across the regional Tipam Sandstone to Barail Carbonaceous Shale transition. Pore pressure ramps sharply at 2,840 m TVD from 1.14 SG to 1.34 SG.",
    incidents: [
      {
        depth: "Depth: 2,912 m TVD",
        type: "Total Mud Loss Incident (45 m³)",
        tag: "CRITICAL LOSS",
        tagColor: "error",
        desc: "Encountered high permeability micro-fractured sandstone lens in lower Tipam. Required 35 ppb LCM pill.",
      },
      {
        depth: "Depth: 3,145 m TVD",
        type: "Differential Pipe Sticking",
        tag: "14h NPT",
        tagColor: "warning",
        desc: "Stuck pipe occurred during 45 min static survey with overbalance > 380 psi. Freed with diesel/surfactant soak.",
      },
    ],
    prognosisAction:
      "Pre-mix 60 m³ high-solids LCM before drilling beyond 2,820m on OIL-NH-12 to mitigate offset loss replicate.",
  },
  {
    id: "OIL-NH-07",
    name: "OIL-NH-07",
    uwi: "49-204-9821-00",
    field: "Moran South",
    block: "South Graben Step",
    distKm: 3.4,
    bearing: "S",
    tvdDeltaM: -65,
    stratMatch: 84.1,
    breakdown: {
      lithology: 84.1,
      proximity: 75.0,
      tvdDelta: 92.0,
      trajectory: 72.0,
      casing: 90.0,
    },
    rationale:
      "Drilled through identical Barail pay sands with overpressured gas kick recorded at 2,985 m. Good structural match on South Graben step down-fault block.",
    incidents: [
      {
        depth: "Depth: 2,985 m TVD",
        type: "Overpressured Gas Kick (0.72 psi/ft)",
        tag: "GAS KICK",
        tagColor: "warning",
        desc: "2.4% gas peak upon entering top Barail Basal Sand. Required 1.34 SG kill mud weighted with barite.",
      },
    ],
    prognosisAction:
      "Stage mud weight upward from 1.28 to 1.32 SG before drilling break at Barail Sandstone top.",
  },
  {
    id: "OIL-NH-09",
    name: "OIL-NH-09",
    uwi: "49-204-9844-00",
    field: "Dikom North",
    block: "Upper Shelf Syncline",
    distKm: 9.2,
    bearing: "W",
    tvdDeltaM: 410,
    stratMatch: 79.0,
    breakdown: {
      lithology: 79.0,
      proximity: 62.0,
      tvdDelta: 70.0,
      trajectory: 78.0,
      casing: 85.0,
    },
    rationale:
      "Upper shelf syncline location with minor H2S influx traces and severe bit bounce in chert stringer intervals.",
    incidents: [
      {
        depth: "Depth: 2,200 m TVD",
        type: "Torsional Resonance & Bit Bounce",
        tag: "TORQUE SPIKE",
        tagColor: "error",
        desc: "Chert stringer caused 22 kN·m torque spikes and 4 chipped PDC cutters.",
      },
    ],
    prognosisAction:
      "Engage SoftTorque system and reduce WOB to 10 tonnes when crossing 2,200m chert stringer.",
  },
  {
    id: "OIL-NH-15",
    name: "OIL-NH-15",
    uwi: "49-204-9889-00",
    field: "Shalmari Basin",
    block: "Distal Sub-thrust Unit",
    distKm: 24.1,
    bearing: "NW",
    tvdDeltaM: -180,
    stratMatch: 65.2,
    breakdown: {
      lithology: 65.2,
      proximity: 40.0,
      tvdDelta: 78.0,
      trajectory: 65.0,
      casing: 80.0,
    },
    rationale:
      "Distal offset across regional thrust fault plane FP-ALPHA. Provides historical deep pore pressure baseline despite fault discontinuity.",
    incidents: [
      {
        depth: "Depth: 3,410 m TVD",
        type: "Complete Lost Circulation Zone",
        tag: "SEPARATION",
        tagColor: "error",
        desc: "Complete loss of returns into fault plane breccia. Cement plug abandonment required.",
      },
    ],
    prognosisAction:
      "Maintain minimum 150m standoff from fault boundary plane FP-ALPHA.",
  },
];

export default function AnaloguesPage() {
  const { unitSystem } = useGlobalContext();
  const [weights, setWeights] = useState({
    lithology: 35,
    proximity: 25,
    tvdDelta: 15,
    trajectory: 15,
    casing: 10,
  });
  const [selectedWellId, setSelectedWellId] = useState<string>("OIL-NH-04");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const totalWeight =
    weights.lithology +
    weights.proximity +
    weights.tvdDelta +
    weights.trajectory +
    weights.casing;

  // Calculate composite scores for all wells based on weights
  const scoredWells = useMemo(() => {
    return WELLS.map((w) => {
      const composite =
        (w.breakdown.lithology * weights.lithology +
          w.breakdown.proximity * weights.proximity +
          w.breakdown.tvdDelta * weights.tvdDelta +
          w.breakdown.trajectory * weights.trajectory +
          w.breakdown.casing * weights.casing) /
        (totalWeight || 1);
      return {
        ...w,
        compositeScore: +composite.toFixed(1),
      };
    }).sort((a, b) => b.compositeScore - a.compositeScore);
  }, [weights, totalWeight]);

  const selectedWell = scoredWells.find((w) => w.id === selectedWellId) || scoredWells[0];

  const resetWeights = () => {
    setWeights({
      lithology: 35,
      proximity: 25,
      tvdDelta: 15,
      trajectory: 15,
      casing: 10,
    });
    showToast("Weights reset to default configuration.");
  };

  const handleCommit = () => {
    showToast(`Baseline ${selectedWell.name} committed to Global Horizon Store ✓`);
  };

  // Radar points for selected well
  // 5 vertices: top (lithology), top-right (proximity), bottom-right (tvdDelta), bottom-left (trajectory), top-left (casing)
  const center = 140;
  const maxR = 110;
  const radarPoints = [
    { label: "LITHOLOGY", val: selectedWell.breakdown.lithology, angle: -Math.PI / 2 },
    { label: "PROXIMITY", val: selectedWell.breakdown.proximity, angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { label: "TVD DELTA", val: selectedWell.breakdown.tvdDelta, angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { label: "TRAJECTORY", val: selectedWell.breakdown.trajectory, angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { label: "CASING", val: selectedWell.breakdown.casing, angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ];

  const polygonPointsStr = radarPoints
    .map((p) => {
      const r = (p.val / 100) * maxR;
      const x = center + r * Math.cos(p.angle);
      const y = center + r * Math.sin(p.angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      {toastMsg && (
        <div className="fixed top-20 right-8 z-50 bg-[#0d0d0d] text-white px-4 py-2.5 rounded-full text-[12px] font-mono shadow-lg flex items-center gap-2 border border-[#dbdad6]">
          <span className="w-2 h-2 rounded-full bg-[#fecf50]"></span>
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">
        {/* Title Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#dbdad6]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-[#fecf50] text-[#735800] text-[10px] font-mono uppercase tracking-wider font-semibold">
                eRTMAC-NWIS Engine v4.2
              </span>
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-widest">
                • Subsurface Predictive Prognosis
              </span>
            </div>
            <h1 className="font-serif text-[34px] font-bold text-[#0d0d0d] tracking-tight leading-none">
              Pre-Drilling Analogue Selector
            </h1>
            <p className="text-[14px] text-[#444748] max-w-3xl">
              Model 1 Multi-Factor Offset Well Similarity &amp; Baseline Ranking Engine for target appraisal well{" "}
              <span className="font-semibold text-[#0d0d0d] underline decoration-[#765b00] decoration-2 underline-offset-4">
                OIL-NH-12
              </span>.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e9e8e4] text-[#0d0d0d] text-[11px] font-mono uppercase tracking-wider border border-[#dbdad6]">
              <span className="w-2 h-2 rounded-full bg-[#765b00]"></span>
              <span>Target Depth: 3,420m TVD</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e9e8e4] text-[#0d0d0d] text-[11px] font-mono uppercase tracking-wider border border-[#dbdad6]">
              <span className="material-symbols-outlined text-[14px]">tune</span>
              <span>5 Active Vectors</span>
            </div>
          </div>
        </div>

        {/* 5-Factor Weighted Sliders Control Stage */}
        <div className="rounded-xl bg-white border border-[#dbdad6] p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#dbdad6]">
            <div>
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider block">
                Configuration Matrix
              </span>
              <h2 className="font-serif text-[22px] font-bold text-[#0d0d0d] tracking-tight">
                Vector Weight Allocation
              </h2>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider border ${
                  totalWeight === 100
                    ? "bg-[#e9e8e4] text-[#0d0d0d] border-[#dbdad6]"
                    : "bg-[#ffdad6] text-[#93000a] border-[#ffdad6]"
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-[#765b00]">
                  {totalWeight === 100 ? "verified" : "warning"}
                </span>
                <span>{totalWeight}% {totalWeight === 100 ? "VALIDATED WEIGHT" : "WEIGHT (MUST EQUAL 100%)"}</span>
              </div>

              <button
                onClick={() => showToast("Similarity matrix recalculated across all offset catalog records.")}
                className="px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">cycle</span>
                Recalculate Matrix
              </button>

              <button
                onClick={resetWeights}
                className="px-4 py-2 rounded-full bg-[#f5f4ef] hover:bg-[#e9e8e4] text-[#0d0d0d] border border-[#dbdad6] text-[11px] font-mono uppercase tracking-wider transition-colors"
              >
                Reset Weights
              </button>
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 pt-1">
            {/* Slider 1 */}
            <div className="p-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-mono uppercase text-[#444748] tracking-wider leading-snug">
                  Stratigraphic Lithology Match
                </label>
                <span className="font-mono text-[16px] font-bold text-[#0d0d0d]">
                  {weights.lithology}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.lithology}
                onChange={(e) => setWeights({ ...weights, lithology: parseInt(e.target.value) })}
                className="w-full accent-[#0d0d0d] h-1.5 bg-[#dbdad6] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                <span>Barail/Tipam</span>
                <span>Priority: High</span>
              </div>
            </div>

            {/* Slider 2 */}
            <div className="p-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-mono uppercase text-[#444748] tracking-wider leading-snug">
                  Geographic Proximity
                </label>
                <span className="font-mono text-[16px] font-bold text-[#0d0d0d]">
                  {weights.proximity}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.proximity}
                onChange={(e) => setWeights({ ...weights, proximity: parseInt(e.target.value) })}
                className="w-full accent-[#0d0d0d] h-1.5 bg-[#dbdad6] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                <span>Radius ≤ 25 km</span>
                <span>Euclidean Spatial</span>
              </div>
            </div>

            {/* Slider 3 */}
            <div className="p-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-mono uppercase text-[#444748] tracking-wider leading-snug">
                  Target Depth TVD Delta
                </label>
                <span className="font-mono text-[16px] font-bold text-[#0d0d0d]">
                  {weights.tvdDelta}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.tvdDelta}
                onChange={(e) => setWeights({ ...weights, tvdDelta: parseInt(e.target.value) })}
                className="w-full accent-[#0d0d0d] h-1.5 bg-[#dbdad6] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                <span>Δ TVD &lt; 500m</span>
                <span>Vertical Offset</span>
              </div>
            </div>

            {/* Slider 4 */}
            <div className="p-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-mono uppercase text-[#444748] tracking-wider leading-snug">
                  Trajectory &amp; Dip Profile
                </label>
                <span className="font-mono text-[16px] font-bold text-[#0d0d0d]">
                  {weights.trajectory}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.trajectory}
                onChange={(e) => setWeights({ ...weights, trajectory: parseInt(e.target.value) })}
                className="w-full accent-[#0d0d0d] h-1.5 bg-[#dbdad6] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                <span>Build/Hold 28°</span>
                <span>Azimuthal</span>
              </div>
            </div>

            {/* Slider 5 */}
            <div className="p-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] flex flex-col justify-between space-y-2">
              <div className="flex justify-between items-start">
                <label className="text-[10px] font-mono uppercase text-[#444748] tracking-wider leading-snug">
                  Hole Size &amp; Casing
                </label>
                <span className="font-mono text-[16px] font-bold text-[#0d0d0d]">
                  {weights.casing}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.casing}
                onChange={(e) => setWeights({ ...weights, casing: parseInt(e.target.value) })}
                className="w-full accent-[#0d0d0d] h-1.5 bg-[#dbdad6] rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-mono text-[#444748]">
                <span>12-1/4&quot; Section</span>
                <span>Mud Window 1.28</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ranked Offset Analogues Table Section */}
        <div className="rounded-xl bg-white border border-[#dbdad6] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#dbdad6]">
            <div>
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider block">
                Correlation Matrix
              </span>
              <h2 className="font-serif text-[22px] font-bold text-[#0d0d0d] tracking-tight">
                Ranked Geological &amp; Geo-Mechanical Offset Analogues
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase">Cataloged: 4 Wells</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50]"></span>
              <span className="text-[10px] font-mono text-[#0d0d0d] uppercase font-medium">
                WGS84 / UTM 46N
              </span>
            </div>
          </div>

          {/* High-Density Editorial Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f4ef] text-[#444748] text-[10px] font-mono uppercase tracking-wider border-b border-[#dbdad6]">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Well Identification</th>
                  <th className="py-3 px-4">Field / Structural Block</th>
                  <th className="py-3 px-4">Surface Dist</th>
                  <th className="py-3 px-4">Subsurface Delta</th>
                  <th className="py-3 px-4">Stratigraphy</th>
                  <th className="py-3 px-4 min-w-[200px]">Composite Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbdad6] text-[12px] font-mono">
                {scoredWells.map((w, index) => {
                  const isSelected = w.id === selectedWellId;

                  return (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWellId(w.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-[#f5f4ef] font-semibold" : "hover:bg-[#faf9f5]"
                      }`}
                    >
                      <td className="py-4 px-4 font-serif text-[18px] text-[#0d0d0d]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                              index === 0
                                ? "bg-[#fecf50] text-[#735800]"
                                : "bg-[#e9e8e4] text-[#444748]"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-serif text-[16px] text-[#0d0d0d] tracking-tight font-bold">
                            {w.name}
                          </span>
                          <span className="text-[10px] text-[#444748]">UWI: {w.uwi}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#0d0d0d]">{w.field}</span>
                          <span className="text-[10px] text-[#444748]">{w.block}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-medium text-[#0d0d0d]">
                        {w.distKm} km <span className="text-[10px] text-[#444748] font-normal">{w.bearing}</span>
                      </td>
                      <td className="py-4 px-4 font-medium text-[#0d0d0d]">
                        {w.tvdDeltaM > 0 ? `+${w.tvdDeltaM}` : w.tvdDeltaM} m{" "}
                        <span className="text-[10px] text-[#444748] font-normal">TVD</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-1.5 bg-[#dbdad6] rounded-full overflow-hidden">
                            <div className="h-full bg-[#0d0d0d]" style={{ width: `${w.stratMatch}%` }}></div>
                          </div>
                          <span className="font-semibold text-[#0d0d0d]">{w.stratMatch}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-[#dbdad6] h-2.5 rounded-full overflow-hidden p-0.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                index === 0 ? "bg-[#fecf50]" : "bg-[#0d0d0d]"
                              }`}
                              style={{ width: `${w.compositeScore}%` }}
                            ></div>
                          </div>
                          <span className="font-bold text-[#0d0d0d]">{w.compositeScore}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#765b00] text-white text-[10px] uppercase tracking-wider font-semibold shadow-sm">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              Baseline Selected
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedWellId(w.id);
                              }}
                              className="px-3 py-1 rounded-full bg-[#0d0d0d] text-white hover:opacity-90 text-[10px] uppercase tracking-wider transition-opacity shadow-sm"
                            >
                              Select Baseline
                            </button>
                          )}
                          <Link
                            href={`/well/${w.id}`}
                            className="px-3 py-1 rounded-full bg-[#e9e8e4] hover:bg-[#dbdad6] text-[#0d0d0d] text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1 border border-[#dbdad6]"
                          >
                            <span>360° Dossier</span>
                            <span className="text-[12px]">→</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Deep Dive Panel: Why This Well? */}
        <div className="rounded-xl bg-white border border-[#dbdad6] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#dbdad6]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#765b00] text-white font-semibold">
                  Subsurface Evidence
                </span>
                <span className="text-[10px] font-mono text-[#444748] uppercase">
                  Focus Anchor: {selectedWell.name}
                </span>
              </div>
              <h2 className="font-serif text-[24px] font-bold text-[#0d0d0d] tracking-tight mt-1">
                Why This Well? Explainability &amp; Event Forensics
              </h2>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase">Model Confidence: 99.1%</span>
              <span className="w-2 h-2 rounded-full bg-[#fecf50]"></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Analogue Rationale & Risk Profile */}
            <div className="lg:col-span-7 space-y-4">
              <div className="space-y-2">
                <h3 className="font-serif text-[18px] font-bold text-[#0d0d0d]">
                  Analogue Rationale &amp; Structural Parity
                </h3>
                <p className="text-[13px] text-[#444748] leading-relaxed">
                  {selectedWell.rationale}
                </p>
              </div>

              {/* Forensic Incidents Module */}
              <div className="p-4 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-[#0d0d0d] tracking-wider font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#ba1a1a] text-[16px]">warning</span>
                    Forensic Incident Register ({selectedWell.name} Historicals)
                  </span>
                  <span className="text-[10px] font-mono text-[#ba1a1a] uppercase font-semibold">
                    {selectedWell.incidents.length} Events Flagged
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedWell.incidents.map((inc, i) => (
                    <div key={i} className="p-3 rounded bg-white border border-[#dbdad6] space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-[#444748] uppercase">{inc.depth}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                            inc.tagColor === "error"
                              ? "bg-[#ffdad6] text-[#93000a]"
                              : "bg-[#ffdf95] text-[#594400]"
                          }`}
                        >
                          {inc.tag}
                        </span>
                      </div>
                      <div className="text-[12px] font-semibold text-[#0d0d0d]">{inc.type}</div>
                      <div className="text-[10px] font-mono text-[#444748]">{inc.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Note */}
              <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#e9e8e4] border border-[#dbdad6] text-[#0d0d0d]">
                <span className="text-[10px] font-mono uppercase font-bold text-[#765b00]">
                  * PROGNOSIS ACTION:
                </span>
                <span className="text-[11px] font-mono text-[#444748]">
                  {selectedWell.prognosisAction}
                </span>
              </div>
            </div>

            {/* Right: Multi-Axis Radar Chart & Commit Actions */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-[#f5f4ef] border border-[#dbdad6] p-5 rounded-xl">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider font-semibold">
                    Similarity Multi-Axis Radar
                  </span>
                  <span className="text-[11px] font-mono text-[#0d0d0d] font-bold">
                    {selectedWell.name} ({selectedWell.compositeScore}%)
                  </span>
                </div>

                {/* SVG Radar Chart */}
                <div className="w-full flex items-center justify-center py-2">
                  <svg className="w-64 h-64 text-[#0d0d0d]" viewBox="0 0 280 280">
                    {/* Concentric Polygons */}
                    {[20, 50, 80, 110].map((inset, idx) => {
                      const pts = [0, 1, 2, 3, 4]
                        .map((i) => {
                          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
                          const r = maxR - (inset / 140) * maxR;
                          const x = center + r * Math.cos(angle);
                          const y = center + r * Math.sin(angle);
                          return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join(" ");
                      return (
                        <polygon
                          key={idx}
                          fill="none"
                          points={pts}
                          stroke="currentColor"
                          strokeOpacity={0.15}
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Axis Lines */}
                    {radarPoints.map((p, i) => {
                      const x2 = center + maxR * Math.cos(p.angle);
                      const y2 = center + maxR * Math.sin(p.angle);
                      return (
                        <line
                          key={i}
                          x1={center}
                          y1={center}
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          strokeOpacity={0.15}
                          strokeWidth="1"
                        />
                      );
                    })}

                    {/* Data Polygon */}
                    <polygon
                      points={polygonPointsStr}
                      fill="#fecf50"
                      fillOpacity={0.35}
                      stroke="#765b00"
                      strokeWidth="2"
                    />

                    {/* Nodes */}
                    {radarPoints.map((p, i) => {
                      const r = (p.val / 100) * maxR;
                      const x = center + r * Math.cos(p.angle);
                      const y = center + r * Math.sin(p.angle);
                      return <circle key={i} cx={x} cy={y} r="3.5" fill="#765b00" />;
                    })}

                    {/* Axis Labels */}
                    <text x="140" y="14" textAnchor="middle" fill="#0d0d0d" fontSize="8" fontWeight="600" fontFamily="Space Grotesk">
                      LITHOLOGY ({selectedWell.breakdown.lithology}%)
                    </text>
                    <text x="260" y="105" textAnchor="start" fill="#444748" fontSize="8" fontFamily="Space Grotesk">
                      PROXIMITY ({selectedWell.breakdown.proximity}%)
                    </text>
                    <text x="215" y="255" textAnchor="middle" fill="#444748" fontSize="8" fontFamily="Space Grotesk">
                      TVD DELTA ({selectedWell.breakdown.tvdDelta}%)
                    </text>
                    <text x="65" y="255" textAnchor="middle" fill="#444748" fontSize="8" fontFamily="Space Grotesk">
                      TRAJECTORY ({selectedWell.breakdown.trajectory}%)
                    </text>
                    <text x="20" y="105" textAnchor="end" fill="#444748" fontSize="8" fontFamily="Space Grotesk">
                      CASING ({selectedWell.breakdown.casing}%)
                    </text>
                  </svg>
                </div>

                <div className="flex justify-between items-center px-3 py-1.5 rounded bg-white border border-[#dbdad6] text-[10px] font-mono text-[#444748]">
                  <span>Selected Baseline Parity</span>
                  <span className="font-semibold text-[#0d0d0d]">Class A Subsurface Analogue</span>
                </div>
              </div>

              {/* Action Stack */}
              <div className="space-y-2 pt-2 border-t border-[#dbdad6]">
                <button
                  onClick={handleCommit}
                  className="w-full py-3 px-4 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#fecf50]">database</span>
                  <span>Commit Baseline to Global Horizon Store</span>
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(selectedWell, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${selectedWell.name}_analogue_dossier.json`;
                    a.click();
                  }}
                  className="w-full py-2.5 px-4 rounded-full bg-white text-[#0d0d0d] border border-[#dbdad6] text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 hover:bg-[#efeeea] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                  <span>Export Analogue Selection Pack ↗</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
