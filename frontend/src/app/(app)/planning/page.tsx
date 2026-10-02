/**
 * Page 11: Plan vs. Actual Days-vs-Depth Cockpit (/planning)
 * Redesigned to exact "Architectural Subsurface Editorial" standards
 * Source reference: Code/plan_vs._actual_days_vs_depth_cockpit/code.html
 */
"use client";

import { useState } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepth, fmtDepthShort } from "@/lib/units";

interface TimelineRow {
  interval: string;
  section: string;
  startDepth: number;
  endDepth: number;
  planDays: number;
  actualDays: number | null;
  variance: number | null;
  nptHours: number | null;
  status: "Completed" | "In Progress" | "Planned";
}

const TIMELINE_DATA: TimelineRow[] = [
  {
    interval: "Spud & Surface Hole Casing",
    section: '26" Hole',
    startDepth: 0,
    endDepth: 200,
    planDays: 2.5,
    actualDays: 2.1,
    variance: -0.4,
    nptHours: 0.0,
    status: "Completed",
  },
  {
    interval: 'Drill 17-1/2" Conductor & Run 13-3/8"',
    section: '17-1/2" Hole',
    startDepth: 200,
    endDepth: 650,
    planDays: 4.0,
    actualDays: 3.8,
    variance: -0.2,
    nptHours: 1.2,
    status: "Completed",
  },
  {
    interval: 'Drill 12-1/4" Upper Barail Sand',
    section: '12-1/4" Hole',
    startDepth: 650,
    endDepth: 2200,
    planDays: 8.5,
    actualDays: 7.9,
    variance: -0.6,
    nptHours: 4.5,
    status: "Completed",
  },
  {
    interval: 'Drill 12-1/4" Lower Section (Tipam Sand)',
    section: '12-1/4" Hole',
    startDepth: 2200,
    endDepth: 2850.2,
    planDays: 4.2,
    actualDays: 2.7,
    variance: -1.5,
    nptHours: 8.5,
    status: "In Progress",
  },
  {
    interval: 'Run & Cement 9-5/8" Casing String',
    section: "Casing Run",
    startDepth: 2850,
    endDepth: 2850,
    planDays: 2.0,
    actualDays: null,
    variance: null,
    nptHours: null,
    status: "Planned",
  },
  {
    interval: 'Drill 8-1/2" Reservoir Section to TD',
    section: '8-1/2" Hole',
    startDepth: 2850,
    endDepth: 3500,
    planDays: 10.8,
    actualDays: null,
    variance: null,
    nptHours: null,
    status: "Planned",
  },
];

export default function PlanningPage() {
  const { unitSystem, activeWellName } = useGlobalContext();
  const [filterCurve, setFilterCurve] = useState<"ALL" | "CASING" | "NPT" | "ROP">("ALL");
  const [sectionFilter, setSectionFilter] = useState<string>("ALL");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleExportCsv = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Interval,Section,StartDepth,EndDepth,PlanDays,ActualDays,Variance,NPTHours,Status\n" +
      TIMELINE_DATA.map(
        (r) =>
          `"${r.interval}","${r.section}",${r.startDepth},${r.endDepth},${r.planDays},${r.actualDays ?? ""},${r.variance ?? ""},${r.nptHours ?? ""},"${r.status}"`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Plan_vs_Actual_${activeWellName}_DDR.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Trajectory & schedule data exported to CSV");
  };

  const filteredTimeline =
    sectionFilter === "ALL"
      ? TIMELINE_DATA
      : TIMELINE_DATA.filter((r) => r.section.toLowerCase().includes(sectionFilter.toLowerCase()));

  const handleGenerateReport = () => {
    let csv = "Interval/Operation,Section,Start Depth,End Depth,Plan Days,Actual Days,Variance,NPT (Hrs),Status\n";
    filteredTimeline.forEach((row) => {
      csv += `"${row.operation}",${row.section},${row.startDepth},${row.endDepth},${row.planDays},${row.actualDays},${row.variance},${row.nptHrs},${row.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const element = document.createElement("a");
    element.href = url;
    element.download = `OIL_NH12_Schedule_Variance_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    showToast(`Schedule variance CSV generated for ${filteredTimeline.length} operations`);
  };

  return (
    <div className="flex flex-col w-full bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1c1b1b] text-white shadow-2xl border border-[#30312e] flex items-center gap-3 animate-fade-in font-mono text-xs">
          <span className="material-symbols-outlined text-[#fecf50] text-[18px]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Interactive Top Telemetry Strip */}
      <div className="px-6 py-2.5 bg-[#e9e8e4] border-b border-[#dbdad6] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#0d0d0d] text-white font-bold text-[10px]">
            *
          </span>
          <span className="uppercase tracking-widest font-semibold text-[#1b1c1a]">
            AFE REAL-TIME TELEMETRY TRACKER // {activeWellName}
          </span>
          <span className="text-[#444748] hidden md:inline">
            · SUB-SURFACE FORMATION: TIPAM UPPER SANDSTONE
          </span>
        </div>
        <div className="flex items-center gap-4 text-[#444748]">
          <span>SYNC RATE: 10 SEC</span>
          <span className="text-[#1b1c1a] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50] animate-pulse"></span>
            STREAM ACTIVE
          </span>
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1 rounded bg-[#efeeea] text-[#1b1c1a] hover:bg-[#0d0d0d] hover:text-white transition-colors uppercase tracking-wider font-semibold border border-[#dbdad6]"
          >
            EXPORT CSV / LAS
          </button>
        </div>
      </div>

      <div className="p-6 lg:p-8 max-w-[1720px] mx-auto w-full space-y-6">
        {/* Header Block: Editorial Title & Archival Meta Stamp */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-4 border-b border-[#dbdad6]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6] text-[10px] font-mono text-[#444748] uppercase tracking-widest">
                SEC 11 · ANALYSIS & PROGNOSIS
              </span>
              <span className="text-[10px] font-mono text-[#444748]">DRILLING COCKPIT v4.2</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif text-[#0d0d0d] tracking-tight font-bold">
              Plan vs. Actual Days-vs-Depth
            </h1>
            <p className="text-sm font-sans text-[#444748] max-w-3xl">
              AFE Drilling Schedule Adherence, Non-Productive Time (NPT) & Cost Benchmark Analytics
              for Well {activeWellName} (Assam Shelf Basin).
            </p>
          </div>

          {/* Archival Box Stamp */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded bg-[#f5f4ef] border border-[#dbdad6] flex flex-col items-center justify-center min-w-[70px]">
              <span className="text-[10px] font-mono text-[#444748] uppercase">CYCLE</span>
              <span className="text-base font-serif font-bold text-[#0d0d0d] leading-none mt-0.5">{new Date().getFullYear()}</span>
              <span className="text-[9px] font-mono text-[#444748] tracking-widest">Q{Math.floor((new Date().getMonth() + 3) / 3)}/RTMAC</span>
            </div>
            <div className="p-2.5 rounded bg-[#f5f4ef] border border-[#dbdad6] flex flex-col justify-center">
              <span className="text-[10px] font-mono text-[#444748] uppercase">OFFSET CORRELATION</span>
              <span className="text-xs font-mono text-[#0d0d0d] font-semibold">NH-04 (DISCOVERY)</span>
              <span className="text-[10px] font-mono text-[#765b00] font-medium">HISTORICAL DELAY +18.5D</span>
            </div>
          </div>
        </div>

        {/* Top Metric Strip: 3 High-Density Editorial Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Metric 1 */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between hover:border-[#0d0d0d]/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#444748] uppercase tracking-wider">Ahead / Behind Plan</span>
              <span className="px-2 py-0.5 rounded-full bg-[#fecf50]/30 border border-[#fecf50] text-[#765b00] text-[10px] font-mono font-bold uppercase tracking-wider">
                Optimized
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl lg:text-3xl font-serif text-[#0d0d0d] tracking-tight leading-none">
                +1.4 Days
              </div>
              <div className="text-[11px] font-mono text-[#765b00] mt-1 font-semibold">
                ▲ AHEAD OF SCHEDULE (DAY 16.5)
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] flex items-center justify-between text-[11px] font-mono text-[#444748]">
              <span>Target Window: Day 32 TD</span>
              <span className="font-semibold text-[#1b1c1a]">P10: Day 30.6</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between hover:border-[#0d0d0d]/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#444748] uppercase tracking-wider">Current Depth vs Plan</span>
              <span className="text-[10px] font-mono text-[#444748]">TVDSS REF</span>
            </div>
            <div className="my-2">
              <div className="text-2xl lg:text-3xl font-serif text-[#0d0d0d] tracking-tight leading-none">
                {fmtDepth(2850.2, unitSystem)}
              </div>
              <div className="text-[11px] font-mono text-[#444748] mt-1">
                AFE Plan: <span className="text-[#1b1c1a] font-medium">{fmtDepthShort(2780, unitSystem)}</span> (
                <span className="text-[#0d0d0d] font-semibold">+70.2 m lead</span>)
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] flex items-center justify-between text-[11px] font-mono text-[#444748]">
              <span>Section Target TD</span>
              <span className="font-semibold text-[#1b1c1a]">{fmtDepthShort(3500, unitSystem)} TVD</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between hover:border-[#0d0d0d]/40 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#444748] uppercase tracking-wider">Total Recorded NPT</span>
              <span className="px-1.5 py-0.5 rounded bg-[#efeeea] text-[10px] font-mono text-[#1b1c1a] font-semibold">
                -36.8% vs AVG
              </span>
            </div>
            <div className="my-2">
              <div className="text-2xl lg:text-3xl font-serif text-[#0d0d0d] tracking-tight leading-none">
                14.2 Hours
              </div>
              <div className="text-[11px] font-mono text-[#444748] mt-1">
                Field Baseline Avg: <span className="text-[#1b1c1a] font-medium">22.5 Hours</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] flex items-center justify-between text-[11px] font-mono text-[#444748]">
              <span>Recorded Events: 4</span>
              <span className="text-[#ba1a1a] font-medium">Latest: 2,150 m</span>
            </div>
          </div>

        </div>

        {/* Main Asymmetric 2-Column Cockpit Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Days-vs-Depth Main Interactive Chart (8 Cols) */}
          <div className="xl:col-span-8 space-y-4">
            <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] shadow-sm flex flex-col">
              {/* Chart Header & Interactive Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dbdad6]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0d0d0d]"></span>
                    <h2 className="text-base font-bold font-mono text-[#0d0d0d] uppercase tracking-tight">
                      Days-vs-Depth Trajectory Model
                    </h2>
                  </div>
                  <p className="text-[11px] font-mono text-[#444748] mt-0.5">
                    Inverted Z-Axis (0 - 3,500m TVDSS) against Operating Duration (0 - 35 Days).
                  </p>
                </div>
                {/* Trajectory Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["ALL", "CASING", "NPT", "ROP"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setFilterCurve(mode)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase transition ${
                        filterCurve === mode
                          ? "bg-[#0d0d0d] text-white"
                          : "bg-[#efeeea] text-[#1b1c1a] hover:bg-[#e3e2de]"
                      }`}
                    >
                      {mode === "ALL"
                        ? "All Curves"
                        : mode === "CASING"
                        ? "Casing Points"
                        : mode === "NPT"
                        ? "NPT Flags"
                        : "ROP Trend"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Legend Strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 py-2 px-3 my-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] text-[10px] font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 bg-[#0d0d0d] inline-block"></span>
                  <span className="font-semibold text-[#0d0d0d] uppercase">Actual Trajectory ({activeWellName})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-t border-dashed border-[#747878] inline-block"></span>
                  <span className="text-[#444748] uppercase">AFE Planned (Baseline)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-0.5 border-t border-dotted border-[#765b00] inline-block"></span>
                  <span className="text-[#765b00] uppercase">Offset NH-04 (Lost Circ. Event)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a] inline-block"></span>
                  <span className="text-[#ba1a1a] uppercase">NPT Stop Point</span>
                </div>
              </div>

              {/* SVG Days-vs-Depth Graph Engine */}
              <div className="relative w-full overflow-hidden bg-[#faf9f5] rounded-xl border border-[#dbdad6] p-2 select-none">
                <svg className="w-full h-auto" preserveAspectRatio="xMidYMid meet" viewBox="0 0 900 520">
                  <defs>
                    <linearGradient id="grid-grad" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#FAF9F5" />
                      <stop offset="100%" stopColor="#EFEFEA" />
                    </linearGradient>
                    <pattern id="hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                      <line x1="0" y1="0" x2="0" y2="8" stroke="#E3E2DE" strokeWidth="1.5" />
                    </pattern>
                  </defs>

                  {/* Plot Background */}
                  <rect x="70" y="30" width="790" height="440" fill="url(#grid-grad)" />

                  {/* Formation Zones */}
                  <rect x="70" y="30" width="790" height="100" fill="#FAF9F5" opacity="0.4" />
                  <text x="850" y="80" textAnchor="end" fill="#747878" fontSize="9" letterSpacing="1" fontFamily="monospace">
                    SURF / ALLUVIUM (0 - 800m)
                  </text>
                  <rect x="70" y="130" width="790" height="126" fill="#F5F4EF" opacity="0.8" />
                  <text x="850" y="195" textAnchor="end" fill="#747878" fontSize="9" letterSpacing="1" fontFamily="monospace">
                    BARAIL ARENACEOUS FM (800 - 1800m)
                  </text>
                  <rect x="70" y="256" width="790" height="126" fill="#ECEBE5" opacity="0.7" />
                  <text x="850" y="320" textAnchor="end" fill="#747878" fontSize="9" letterSpacing="1" fontFamily="monospace">
                    TIPAM SANDSTONE (TARGET SEC 1800 - 2800m)
                  </text>
                  <rect x="70" y="382" width="790" height="88" fill="url(#hatch)" opacity="0.5" />
                  <text x="850" y="425" textAnchor="end" fill="#747878" fontSize="9" letterSpacing="1" fontFamily="monospace">
                    GIRUJAN CLAYSTONE BASE (2800 - 3500m)
                  </text>

                  {/* Grid Lines Horizontal */}
                  <g stroke="#DCDAD6" strokeDasharray="2,2" strokeWidth="1">
                    <line x1="70" y1="30" x2="860" y2="30" />
                    <line x1="70" y1="93" x2="860" y2="93" />
                    <line x1="70" y1="156" x2="860" y2="156" />
                    <line x1="70" y1="219" x2="860" y2="219" />
                    <line x1="70" y1="281" x2="860" y2="281" />
                    <line x1="70" y1="344" x2="860" y2="344" />
                    <line x1="70" y1="407" x2="860" y2="407" />
                    <line x1="70" y1="470" x2="860" y2="470" />
                  </g>

                  {/* Grid Lines Vertical */}
                  <g stroke="#DCDAD6" strokeDasharray="2,2" strokeWidth="1">
                    <line x1="70" y1="30" x2="70" y2="470" />
                    <line x1="183" y1="30" x2="183" y2="470" />
                    <line x1="296" y1="30" x2="296" y2="470" />
                    <line x1="408" y1="30" x2="408" y2="470" />
                    <line x1="521" y1="30" x2="521" y2="470" />
                    <line x1="634" y1="30" x2="634" y2="470" />
                    <line x1="747" y1="30" x2="747" y2="470" />
                    <line x1="860" y1="30" x2="860" y2="470" />
                  </g>

                  {/* Y-Axis Labels */}
                  <g fill="#444748" fontSize="9" textAnchor="end" fontFamily="monospace">
                    <text x="62" y="33">0 m</text>
                    <text x="62" y="96">500 m</text>
                    <text x="62" y="159">1,000 m</text>
                    <text x="62" y="222">1,500 m</text>
                    <text x="62" y="284">2,000 m</text>
                    <text x="62" y="347">2,500 m</text>
                    <text x="62" y="410">3,000 m</text>
                    <text x="62" y="473">3,500 m</text>
                  </g>
                  <text
                    x="18"
                    y="250"
                    transform="rotate(-90 18 250)"
                    textAnchor="middle"
                    fill="#1B1C1A"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    DEPTH (TVD IN METERS)
                  </text>

                  {/* X-Axis Labels */}
                  <g fill="#444748" fontSize="9" textAnchor="middle" fontFamily="monospace">
                    <text x="70" y="490">DAY 0</text>
                    <text x="183" y="490">DAY 5</text>
                    <text x="296" y="490">DAY 10</text>
                    <text x="408" y="490">DAY 15</text>
                    <text x="521" y="490">DAY 20</text>
                    <text x="634" y="490">DAY 25</text>
                    <text x="747" y="490">DAY 30</text>
                    <text x="860" y="490">DAY 35</text>
                  </g>
                  <text x="465" y="510" textAnchor="middle" fill="#1B1C1A" fontSize="10" fontWeight="600" fontFamily="monospace">
                    OPERATING DURATION (SPUD TO RIG RELEASE DAYS)
                  </text>

                  {/* Casing Points (Visible if ALL or CASING) */}
                  {(filterCurve === "ALL" || filterCurve === "CASING") && (
                    <>
                      <line x1="70" y1="112" x2="860" y2="112" stroke="#C4C7C7" strokeWidth="1" />
                      <rect x="74" y="102" width="115" height="15" rx="3" fill="#FAF9F5" stroke="#C4C7C7" strokeWidth="0.5" />
                      <text x="78" y="113" fill="#1B1C1A" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        13-3/8" CASING @ 650m
                      </text>

                      <line x1="70" y1="306" x2="860" y2="306" stroke="#C4C7C7" strokeWidth="1" />
                      <rect x="74" y="296" width="120" height="15" rx="3" fill="#FAF9F5" stroke="#C4C7C7" strokeWidth="0.5" />
                      <text x="78" y="307" fill="#1B1C1A" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        9-5/8" INTERM @ 2,200m
                      </text>

                      <line x1="70" y1="420" x2="860" y2="420" stroke="#C4C7C7" strokeWidth="1" />
                      <rect x="74" y="410" width="120" height="15" rx="3" fill="#FAF9F5" stroke="#C4C7C7" strokeWidth="0.5" />
                      <text x="78" y="421" fill="#1B1C1A" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        7" PROD LINER @ 3,100m
                      </text>
                    </>
                  )}

                  {/* Offset NH-04 Curve */}
                  <path
                    d="M 70 30 Q 160 110, 205 130 T 320 230 L 386 280 L 480 396 L 535 396 Q 620 425, 715 455 L 815 470"
                    fill="none"
                    stroke="#765B00"
                    strokeWidth="1.8"
                    strokeDasharray="4,4"
                    opacity="0.85"
                  />
                  <rect x="540" y="380" width="150" height="28" rx="3" fill="#FEF9E7" stroke="#765B00" strokeWidth="0.8" />
                  <text x="546" y="392" fill="#765B00" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    NH-04: 45m³ MUD LOSS
                  </text>
                  <text x="546" y="403" fill="#594400" fontSize="7.5" fontFamily="monospace">
                    +3.5 Days Delay @ 2,912m
                  </text>

                  {/* AFE Planned Curve */}
                  <path
                    d="M 70 30 L 160 112 L 190 112 L 386 306 L 431 306 L 656 420 L 690 420 L 792 470"
                    fill="none"
                    stroke="#747878"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                  />
                  <circle cx="160" cy="112" r="3.5" fill="#747878" />
                  <circle cx="386" cy="306" r="3.5" fill="#747878" />
                  <circle cx="656" cy="420" r="3.5" fill="#747878" />
                  <circle cx="792" cy="470" r="4.5" fill="#1B1C1A" />
                  <text x="796" y="464" fill="#1B1C1A" fontSize="8.5" fontWeight="bold" fontFamily="monospace">
                    TD TARGET (DAY 32)
                  </text>

                  {/* Actual Trajectory Curve */}
                  <path
                    d="M 70 30 L 138 112 L 160 112 L 273 219 L 300 240 L 315 240 L 370 306 L 395 306 L 442 388"
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.8"
                  />

                  {/* Lookahead Cone */}
                  <path d="M 442 388 L 740 470" stroke="#000000" strokeWidth="1.2" strokeDasharray="2,4" opacity="0.5" />
                  <path d="M 442 388 L 705 470" stroke="#765B00" strokeWidth="1" strokeDasharray="1,3" opacity="0.3" />

                  {/* NPT Callouts (Visible if ALL or NPT) */}
                  {(filterCurve === "ALL" || filterCurve === "NPT") && (
                    <>
                      {/* Stuck pipe reaming */}
                      <circle cx="295" cy="235" r="4" fill="#BA1A1A" />
                      <line x1="295" y1="235" x2="265" y2="185" stroke="#BA1A1A" strokeWidth="0.8" />
                      <rect x="180" y="162" width="168" height="24" rx="3" fill="#FFFFFF" stroke="#BA1A1A" strokeWidth="0.8" />
                      <text x="186" y="174" fill="#BA1A1A" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        STUCK PIPE REAMING (4.5h)
                      </text>
                      <text x="186" y="182" fill="#444748" fontSize="7.5" fontFamily="monospace">
                        Tight hole wiper trip @ 2,150m
                      </text>

                      {/* Pump seal overhaul */}
                      <circle cx="390" cy="306" r="4" fill="#BA1A1A" />
                      <line x1="390" y1="306" x2="420" y2="250" stroke="#BA1A1A" strokeWidth="0.8" />
                      <rect x="420" y="238" width="168" height="24" rx="3" fill="#FFFFFF" stroke="#BA1A1A" strokeWidth="0.8" />
                      <text x="426" y="250" fill="#BA1A1A" fontSize="8" fontWeight="bold" fontFamily="monospace">
                        PUMP SEAL OVERHAUL (3.2h)
                      </text>
                      <text x="426" y="258" fill="#444748" fontSize="7.5" fontFamily="monospace">
                        Mud pump #2 liner wash-out
                      </text>
                    </>
                  )}

                  {/* Active Bit Marker @ Day 16.5 & 2,850.2m */}
                  <g transform="translate(442, 388)">
                    <circle cx="0" cy="0" r="10" fill="#000000" opacity="0.15" className="animate-ping" />
                    <polygon points="0,-7 7,0 0,7 -7,0" fill="#000000" />
                    <circle cx="0" cy="0" r="2" fill="#FECF50" />
                  </g>

                  {/* Current Bit Callout Label */}
                  <rect x="456" y="375" width="170" height="34" rx="4" fill="#1B1C1A" />
                  <text x="464" y="388" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    BIT STATUS: 2,850.2 m TVD
                  </text>
                  <text x="464" y="399" fill="#FECF50" fontSize="8" fontFamily="monospace">
                    Day 16.5 · Lead +1.4 Days
                  </text>
                  <polygon points="456,388 450,388 456,394" fill="#1B1C1A" />
                </svg>
              </div>

              {/* Bottom Operational Ticker within Chart Container */}
              <div className="mt-4 pt-3 border-t border-[#dbdad6] grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#444748] block uppercase text-[10px]">CURRENT ROP (INST)</span>
                  <span className="text-[#0d0d0d] font-bold">18.4 m/hr</span>
                </div>
                <div>
                  <span className="text-[#444748] block uppercase text-[10px]">WOB / TORQUE</span>
                  <span className="text-[#0d0d0d] font-bold">14.2 klbs / 11.8 kft-lb</span>
                </div>
                <div>
                  <span className="text-[#444748] block uppercase text-[10px]">DRILLING FLUID DENSITY</span>
                  <span className="text-[#0d0d0d] font-bold">1.28 SG (10.7 ppg)</span>
                </div>
                <div>
                  <span className="text-[#444748] block uppercase text-[10px]">TARGET TD FORMATION</span>
                  <span className="text-[#765b00] font-bold">Tipam Sand Main (Oil)</span>
                </div>
              </div>
            </div>

            {/* Hole Section Progression Tracker */}
            <div className="p-4 rounded-2xl bg-white border border-[#dbdad6] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#0d0d0d]">view_timeline</span>
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0d0d0d]">
                    Hole Section Progression
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#444748]">Active: 12-1/4" Intermediate</span>
              </div>
              <div className="space-y-2.5">
                {/* 26" Surface */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-28 text-[#444748]">26" Surf (0-200m)</span>
                  <div className="flex-1 h-3 rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#0d0d0d] rounded-full w-full"></div>
                  </div>
                  <span className="w-20 text-right font-semibold text-[#0d0d0d]">100% · OK</span>
                </div>
                {/* 17-1/2" Conductor */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-28 text-[#444748]">17-1/2" (200-650m)</span>
                  <div className="flex-1 h-3 rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#0d0d0d] rounded-full w-full"></div>
                  </div>
                  <span className="w-20 text-right font-semibold text-[#0d0d0d]">100% · OK</span>
                </div>
                {/* 12-1/4" Active */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-28 font-bold text-[#0d0d0d]">12-1/4" (650-2850m)</span>
                  <div className="flex-1 h-3 rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#0d0d0d] rounded-full w-[81.4%] transition-all"></div>
                  </div>
                  <span className="w-20 text-right font-bold text-[#765b00]">81.4% Active</span>
                </div>
                {/* 8-1/2" Target */}
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-28 text-[#444748]">8-1/2" Res (to TD)</span>
                  <div className="flex-1 h-3 rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#e3e2de] rounded-full w-0"></div>
                  </div>
                  <span className="w-20 text-right text-[#444748]">Pending</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Section NPT & Cost Attribution (4 Cols) */}
          <div className="xl:col-span-4 space-y-4">
            {/* Benchmark Status Pill Card */}
            <div className="p-4 rounded-2xl bg-[#e9e8e4] border border-[#dbdad6]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#fecf50] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px] text-[#735800]">verified</span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-[#735800] uppercase tracking-wider block font-bold">
                    Field Benchmark Performance
                  </span>
                  <p className="text-sm font-semibold text-[#0d0d0d] leading-snug">
                    OIL-NH-12 is 8.3 hrs below Assam Basin average NPT in the 12-1/4" section.
                  </p>
                  <p className="text-[11px] font-mono text-[#444748]">
                    Comparison against 14 offset wells drilled in Moran-Nahorkatiya field complex between 2021-2024.
                  </p>
                </div>
              </div>
            </div>

            {/* NPT Cause Breakdown Bar List Card */}
            <div className="p-5 rounded-2xl bg-white border border-[#dbdad6] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-2 border-b border-[#dbdad6]">
                <div>
                  <h3 className="text-sm font-bold font-mono text-[#0d0d0d] uppercase">
                    Section NPT Attribution
                  </h3>
                  <p className="text-[10px] font-mono text-[#444748]">
                    Cumulative NPT: 14.2 Hours (3.5% of total rig time)
                  </p>
                </div>
                <span className="material-symbols-outlined text-[#444748] text-[20px]">pie_chart</span>
              </div>

              {/* Breakdown List */}
              <div className="space-y-3.5">
                {/* Cause 1 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-[#0d0d0d] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0d0d0d]"></span>
                      Equipment / Pump Repair
                    </span>
                    <span className="font-bold text-[#0d0d0d]">
                      5.2 hrs <span className="text-[#444748] font-normal">(36.6%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#0d0d0d] rounded-full w-[36.6%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#444748]">
                    <span>Mud Pump #2 Fluid End Swapping</span>
                    <span>$21,840 Cost Impact</span>
                  </div>
                </div>

                {/* Cause 2 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-[#0d0d0d] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#0d0d0d]/70"></span>
                      Stuck Pipe / Reaming
                    </span>
                    <span className="font-bold text-[#0d0d0d]">
                      4.5 hrs <span className="text-[#444748] font-normal">(31.7%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#0d0d0d]/70 rounded-full w-[31.7%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#444748]">
                    <span>Undergauge hole back-reaming @ 2,150m</span>
                    <span>$18,900 Cost Impact</span>
                  </div>
                </div>

                {/* Cause 3 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-[#0d0d0d] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#765b00]"></span>
                      Mud Conditioning & Losses
                    </span>
                    <span className="font-bold text-[#0d0d0d]">
                      2.5 hrs <span className="text-[#444748] font-normal">(17.6%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#765b00] rounded-full w-[17.6%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#444748]">
                    <span>Viscosity sweep & LCM dosing</span>
                    <span>$10,500 Cost Impact</span>
                  </div>
                </div>

                {/* Cause 4 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-medium text-[#0d0d0d] flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#747878]"></span>
                      Weather / Deluge
                    </span>
                    <span className="font-bold text-[#0d0d0d]">
                      2.0 hrs <span className="text-[#444748] font-normal">(14.1%)</span>
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#efeeea] overflow-hidden">
                    <div className="h-full bg-[#747878] rounded-full w-[14.1%]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#444748]">
                    <span>Heavy monsoonal deluge pause</span>
                    <span>$8,400 Cost Impact</span>
                  </div>
                </div>
              </div>

              {/* Total Cumulative Tabular Callout */}
              <div className="pt-2 border-t border-[#dbdad6] flex items-center justify-between text-xs font-mono">
                <span className="text-[#444748] uppercase">TOTAL RECORDED NPT IMPACT:</span>
                <span className="font-bold text-[#ba1a1a] text-sm">₹59,640 INR</span>
              </div>
            </div>

            {/* Mitigation Savings Estimator (AI Lookahead Advisory) */}
            <div className="p-4 rounded-2xl bg-[#efeeea] border border-[#dbdad6] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#765b00]">psychology</span>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#0d0d0d] font-semibold">
                    Proactive Mitigation
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#e9e8e4] border border-[#dbdad6] text-[9px] font-mono font-bold text-[#765b00] uppercase">
                  AI ADVISORY
                </span>
              </div>
              <p className="text-xs font-sans text-[#1b1c1a] leading-relaxed">
                <span className="font-bold text-[#0d0d0d]">AI Lookahead Advisory</span> saved an estimated{" "}
                <span className="font-bold text-[#0d0d0d] underline decoration-[#fecf50] decoration-2 underline-offset-2">
                  16.5 hours of NPT
                </span>{" "}
                by recommending pre-mixing an engineered LCM pill prior to Tipam Sandstone entry.
              </p>
              <div className="p-2.5 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] space-y-1 text-[11px] font-mono">
                <div className="flex justify-between text-[#444748]">
                  <span>Historical NH-04 Mud Loss:</span>
                  <span className="text-[#ba1a1a] font-medium">45.0 m³</span>
                </div>
                <div className="flex justify-between text-[#444748]">
                  <span>{activeWellName} Actual Fluid Loss:</span>
                  <span className="text-[#765b00] font-bold">2.4 m³ (94.6% reduction)</span>
                </div>
                <div className="flex justify-between text-[#1b1c1a] pt-1 border-t border-[#dbdad6]">
                  <span className="font-medium">Net Estimated AFE Cost Saved:</span>
                  <span className="font-bold text-[#0d0d0d]">₹138,600 INR</span>
                </div>
              </div>
            </div>

            {/* Subsurface Geotechnical Field Notes */}
            <div className="p-4 rounded-2xl bg-white border border-[#dbdad6] space-y-2 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                  Shift Log // Day 16 Turn 2
                </span>
                <span className="text-[10px] font-mono text-[#444748] font-medium">14:15 UTC</span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#efeeea] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-[#1b1c1a]">engineering</span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs font-mono font-semibold text-[#0d0d0d]">Lead Mud Engineer: R. Sonowal</div>
                  <p className="text-[11px] font-sans text-[#444748] leading-normal">
                    "Shale shaker screens inspected. ECD stabilized at 1.34 SG. Lithology transitioning from fine siltstone
                    to porous Tipam sandstone. Drilling ahead on plan."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Editorial Table Section: Sequential Timeline & Variance Log */}
        <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#dbdad6]">
            <div>
              <h3 className="text-base font-bold font-mono text-[#0d0d0d] uppercase">
                Sequential Drilling Timeline & Variance Log
              </h3>
              <p className="text-xs font-mono text-[#444748]">
                Full chronological audit of major phase benchmarks, planned days versus actual recorded durations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full bg-[#efeeea] hover:bg-[#e3e2de] border border-[#dbdad6] text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer outline-none"
              >
                <option value="ALL">All Hole Sections</option>
                <option value="26">26" Surface</option>
                <option value="17-1/2">17-1/2" Conductor</option>
                <option value="12-1/4">12-1/4" Intermediate</option>
                <option value="8-1/2">8-1/2" Reservoir</option>
              </select>
              <button
                onClick={handleGenerateReport}
                className="px-3 py-1.5 rounded-full bg-[#0d0d0d] text-white text-xs font-mono uppercase tracking-wider font-semibold transition flex items-center gap-1.5 hover:bg-[#1c1b1b]"
              >
                <span className="material-symbols-outlined text-[14px]">download</span>
                Generate Report
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#dbdad6] text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Interval / Operation</th>
                  <th className="py-2.5 px-3">Section</th>
                  <th className="py-2.5 px-3">Start Depth</th>
                  <th className="py-2.5 px-3">End Depth</th>
                  <th className="py-2.5 px-3">Plan Days</th>
                  <th className="py-2.5 px-3">Actual Days</th>
                  <th className="py-2.5 px-3">Variance</th>
                  <th className="py-2.5 px-3">NPT (Hrs)</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-[#dbdad6] text-[#1b1c1a] font-mono">
                {filteredTimeline.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`hover:bg-[#f5f4ef] transition-colors ${
                      row.status === "In Progress" ? "bg-[#fecf50]/10 font-medium" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 font-semibold text-[#0d0d0d]">
                      {row.status === "In Progress" && (
                        <span className="inline-block w-2 h-2 rounded-full bg-[#fecf50] mr-2 animate-pulse"></span>
                      )}
                      {row.interval}
                    </td>
                    <td className="py-2.5 px-3 text-[#444748]">{row.section}</td>
                    <td className="py-2.5 px-3">{fmtDepthShort(row.startDepth, unitSystem)}</td>
                    <td className="py-2.5 px-3">
                      {fmtDepthShort(row.endDepth, unitSystem)}
                      {row.status === "In Progress" ? " (Act)" : ""}
                    </td>
                    <td className="py-2.5 px-3">{row.planDays.toFixed(1)} d</td>
                    <td className="py-2.5 px-3 font-medium">
                      {row.actualDays !== null ? `${row.actualDays.toFixed(1)} d` : "--"}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.variance !== null ? (
                        <span className={row.variance < 0 ? "text-[#765b00] font-bold" : "text-[#ba1a1a] font-bold"}>
                          {row.variance > 0 ? `+${row.variance.toFixed(1)}` : `${row.variance.toFixed(1)}`} d
                        </span>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {row.nptHours !== null ? (
                        <span className={row.nptHours > 0 ? "text-[#ba1a1a] font-medium" : ""}>
                          {row.nptHours.toFixed(1)}
                        </span>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          row.status === "Completed"
                            ? "bg-[#efeeea] text-[#1b1c1a]"
                            : row.status === "In Progress"
                            ? "bg-[#0d0d0d] text-white"
                            : "bg-[#e3e2de] text-[#444748]"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
