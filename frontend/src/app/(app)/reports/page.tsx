/**
 * Page 14: Morning Report & Handover Generator (/reports)
 * Redesigned to exact "Architectural Subsurface Editorial" standards
 * Source reference: Code/morning_report_pdf_generator/code.html
 */
"use client";

import { useState } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepth, fmtDepthShort } from "@/lib/units";

interface Chapter {
  id: string;
  number: string;
  category: string;
  badge: string;
  badgeColor?: string;
  title: string;
  desc: string;
  metrics?: { label: string; value: string }[];
  warning?: boolean;
}

const CHAPTERS: Chapter[] = [
  {
    id: "ch1",
    number: "CHAPTER 01",
    category: "OPERATIONS SUMMARY",
    badge: "Auto-Sync WITSML",
    title: "24-Hour Drilling Chronology & Activity Ledger",
    desc: 'Time-depth log breakdown: 06:00-11:30 Rotary drill 12-1/4" hole from 2,790m to 2,822m; 11:30-14:00 Flow check & survey; 14:00-06:00 Drilling ahead to current depth 2,850.2m.',
  },
  {
    id: "ch2",
    number: "CHAPTER 02",
    category: "DRILLING MECHANICS",
    badge: "1 Hz Stream Telemetry",
    title: "Downhole Hydraulics & Penetration Metrics",
    desc: "Real-time sensor averages across 24-hr drilling cycle with automatic out-of-spec flagging.",
    metrics: [
      { label: "INST. ROP", value: "14.8 m/hr" },
      { label: "WOB / TORQUE", value: "18 klbf / 12 kNm" },
      { label: "ECD SENSOR", value: "1.34 SG" },
      { label: "STANDPIPE PRESS", value: "3,115 psi" },
    ],
  },
  {
    id: "ch3",
    number: "CHAPTER 03",
    category: "MODEL 3 LOOKAHEAD",
    badge: "HIGH PRIORITY",
    badgeColor: "bg-[#fecf50] text-[#735800]",
    title: "Subsurface Hazard Forecast (+100m Interval)",
    desc: "Anticipated micro-fractured thief zone at 2,912m TVDSS. Gas kick probability spike (74%) predicted at upper Barail contact (2,985m). Pre-conditioned LCM pill prepared on active pit #3.",
    warning: true,
  },
  {
    id: "ch4",
    number: "CHAPTER 04",
    category: "FLUID & RHEOLOGY",
    badge: "Mud Lab 04:00 Check",
    title: "Active Drilling Fluid Properties (WBM Glycol System)",
    desc: "Circulating volume: 180 m³. API filtration: 4.2 mL/30min. Solids content: 4.8% by volume.",
    metrics: [
      { label: "DENSITY", value: "1.28 SG (10.7 ppg)" },
      { label: "PV", value: "22 cP" },
      { label: "YP", value: "18 lb/100ft²" },
      { label: "GEL (10s/10m)", value: "6 / 14" },
    ],
  },
  {
    id: "ch5",
    number: "CHAPTER 05",
    category: "ANALOGUE BENCHMARKS",
    badge: "Offset Correlation",
    title: "Historical Offset Citations (NH-04 Lost Circulation)",
    desc: "Correlated with NH-04 severe loss event at 2,918m (35 bbl/hr seepage). Recipe approved: 40 ppb coarse mica + calcium carbonate fiber blend standing by.",
  },
  {
    id: "ch6",
    number: "CHAPTER 06",
    category: "EFFICIENCY & NPT",
    badge: "-8.3 hrs vs Field Avg",
    title: "Non-Productive Time (NPT) Ledger & Invisible Loss",
    desc: "Cumulative section NPT sits at 14.2 hrs (Top drive IBOP leak repair: 1.8 hrs; MWD tool pulser re-seat: 2.1 hrs). Zero HSE loss incidents recorded during current tour.",
  },
  {
    id: "ch7",
    number: "CHAPTER 07",
    category: "LITHOLOGY & STRATIGRAPHY",
    badge: "Geosteering Log",
    title: "Cuttings Analysis & Formation Boundary Tracking",
    desc: "Transitioning out of Girujan Clay into Upper Tipam Sandstone. Cuttings display 65% fine-to-medium grained quartzose sand, sub-angular, moderate sorting with trace carbonaceous streaks.",
  },
  {
    id: "ch8",
    number: "CHAPTER 08",
    category: "COMPLIANCE & CREW ROSTER",
    badge: "Pending Final Signoff",
    badgeColor: "bg-[#ffdad6] text-[#ba1a1a]",
    title: "Rig Crew Tour Roster, BHA Inspection & Safety Audit",
    desc: "Requires Toolpusher shift validation signature and BOP accumulator recharge pressure certification.",
  },
];

type PresetTemplate = "ddr" | "tour" | "pre-spud" | "afe";

export default function ReportsPage() {
  const { unitSystem, activeWellName, sandboxSimulatedEcd, sandboxPill } = useGlobalContext();
  const [activeTemplate, setActiveTemplate] = useState<PresetTemplate>("ddr");
  const [selectedChapters, setSelectedChapters] = useState<Record<string, boolean>>({
    ch1: true,
    ch2: true,
    ch3: true,
    ch4: true,
    ch5: true,
    ch6: true,
    ch7: true,
    ch8: false, // 8th is unchecked by default
  });
  const [handoverNotes, setHandoverNotes] = useState<string>(
    "Incoming Tour 1 (Day Tour) must maintain pump rate strictly at 620 GPM when entering the 2,900m boundary. Monitor shaker #2 for limestone cavings. Standpipe pressure alarm threshold lowered to 3,350 psi. Keep second centrifuge operational for LGS reduction."
  );
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const toggleChapter = (id: string) => {
    setSelectedChapters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (state: boolean) => {
    setSelectedChapters({
      ch1: state,
      ch2: state,
      ch3: state,
      ch4: state,
      ch5: state,
      ch6: state,
      ch7: state,
      ch8: state,
    });
    showToast(state ? "All 8 Chapters Selected" : "Chapters Cleared");
  };

  const resetToDefault = () => {
    setSelectedChapters({
      ch1: true,
      ch2: true,
      ch3: true,
      ch4: true,
      ch5: true,
      ch6: true,
      ch7: true,
      ch8: false,
    });
    showToast("Restored Default 24H Chapter Configuration");
  };

  const activeCount = Object.values(selectedChapters).filter(Boolean).length;
  const estimatedMb = (activeCount * 0.55 + 0.35).toFixed(1);

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    setTimeout(() => {
      setIsGeneratingPdf(false);
      showToast(`Initiating print sequence for DDR_${activeWellName}...`);
      window.print();
    }, 800);
  };

  const handleDispatch = () => {
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      showToast("Dispatched to Rig SE-802, Duliajan RTOC & Superintendent Desks");
    }, 1200);
  };

  const handleExportPng = () => {
    showToast("Rendered 3 briefing PNG cards to local download tray");
  };

  return (
    <div className="flex flex-col w-full bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans print:bg-white">
      {/* Print-specific CSS injected globally to isolate the A4 sheet during window.print() */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
          }
          
          /* Override the CSS Grid layout from globals.css to stop the 240px sidebar track from offsetting content */
          .app-shell, .main-content {
            display: block !important;
            grid-template-columns: none !important;
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
          }
          
          /* Hide the global HeaderBar and Sidebar from layout.tsx */
          .app-shell > :not(.main-content) {
            display: none !important;
          }

          /* Hide all UI elements except the A4 sheet inside this page */
          .print-hidden {
            display: none !important;
          }

          /* Reset the main container to avoid flex grid issues on print */
          .print-block {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #printable-a4-sheet {
            width: 210mm !important;
            height: 297mm !important;
            max-width: none !important;
            padding: 15mm 20mm !important;
            margin: 0 auto !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
          }
          
          /* Hide the watermark pill on actual print */
          .print-hide { display: none !important; }
          
          /* Scale up fonts for actual print since they are mini on screen */
          #printable-a4-sheet { font-size: 1.5em; }
          #printable-a4-sheet .text-\\[6px\\] { font-size: 9px !important; }
          #printable-a4-sheet .text-\\[6\\.5px\\] { font-size: 10px !important; }
          #printable-a4-sheet .text-\\[7px\\] { font-size: 11px !important; }
          #printable-a4-sheet .text-\\[7\\.5px\\] { font-size: 12px !important; }
          #printable-a4-sheet .text-\\[8px\\] { font-size: 12.5px !important; }
          #printable-a4-sheet .text-\\[9px\\] { font-size: 14px !important; }
          #printable-a4-sheet .text-\\[13px\\] { font-size: 18px !important; }
        }
      `}} />
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1c1b1b] text-white shadow-2xl border border-[#30312e] flex items-center gap-3 animate-fade-in font-mono text-xs">
          <span className="material-symbols-outlined text-[#fecf50] text-[18px]">verified</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HUD Header & Breadcrumb Ribbon */}
      <div className="px-6 lg:px-8 pt-6 pb-4 bg-[#f5f4ef] border-b border-[#dbdad6] print-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded bg-[#e3e2de] text-[10px] font-mono text-[#444748] uppercase tracking-wider font-semibold">
                ENGINE // eRTMAC-NWIS // RIG SE-802
              </span>
              <span className="text-[10px] font-mono text-[#747878]">/</span>
              <span className="text-[10px] font-mono text-[#444748] font-medium">DISPATCH HUB // AUTOMATION</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-serif text-[#0d0d0d] tracking-tight font-bold">
              Morning Report & Handover Generator
            </h1>
            <p className="text-xs lg:text-sm font-sans text-[#444748] max-w-3xl mt-1">
              Automated generation, verification, and multi-channel distribution of Daily Drilling Reports (DDR),
              Tour Handover Summaries, and Lookahead Advisories.
            </p>
          </div>

          {/* Real-time HUD Chips */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <div className="px-3 py-1.5 rounded-full bg-[#efeeea] border border-[#dbdad6] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#fecf50] animate-pulse"></span>
              <span className="text-[10px] font-mono text-[#1b1c1a] font-semibold tracking-wider uppercase">
                TOUR 2 (18:00 - 06:00 IST)
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#efeeea] border border-[#dbdad6] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#747878]">explore</span>
              <span className="text-[10px] font-mono text-[#1b1c1a] font-semibold">WELL: {activeWellName}</span>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-[#1c1b1b] text-white border border-[#0d0d0d] flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-[#fecf50] font-semibold">BIT DEPTH:</span>
              <span className="text-[10px] font-mono font-semibold tracking-wider">
                {fmtDepth(2850.2, unitSystem)} TVDSS
              </span>
            </div>
          </div>
        </div>

        {/* Template Selector Ribbon */}
        <div className="mt-4 pt-3 border-t border-[#dbdad6]/60 flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "ddr", label: "Daily Morning Drilling Report (DDR) — 24H", icon: "description", preset: { ch1: true, ch2: true, ch3: true, ch4: true, ch5: true, ch6: true, ch7: true, ch8: false } },
            { id: "tour", label: "Shift / Tour Handover Briefing — 12H", icon: "schedule", preset: { ch1: true, ch2: true, ch3: true, ch4: true, ch5: false, ch6: false, ch7: false, ch8: true } },
            { id: "pre-spud", label: "Offset Well Analogue & Risk Brief — Pre-Spud", icon: "insights", preset: { ch1: false, ch2: false, ch3: true, ch4: false, ch5: true, ch6: false, ch7: true, ch8: false } },
            { id: "afe", label: "AFE Cost & NPT Reconciliation Pack", icon: "account_balance_wallet", preset: { ch1: true, ch2: true, ch3: false, ch4: false, ch5: false, ch6: true, ch7: false, ch8: true } },
          ].map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => {
                setActiveTemplate(tmpl.id as PresetTemplate);
                setSelectedChapters(tmpl.preset);
                showToast(`Switched active preset: ${tmpl.label}`);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-mono tracking-wider uppercase flex items-center gap-2 transition-all ${
                activeTemplate === tmpl.id
                  ? "bg-[#0d0d0d] text-white shadow-sm"
                  : "bg-[#e3e2de] hover:bg-[#dbdad6] text-[#1b1c1a] border border-[#dbdad6]"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  activeTemplate === tmpl.id ? "text-[#fecf50]" : "text-[#747878]"
                }`}
              >
                {tmpl.icon}
              </span>
              {tmpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Working Console */}
      <div className="p-6 lg:p-8 grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-[1720px] mx-auto w-full print-block">
        {/* Left Column: Report Chapters & Ingestion Checklist (7 Cols) */}
        <div className="xl:col-span-7 flex flex-col gap-5 print-hidden">
          {/* Ingestion Header Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#dbdad6] flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold text-[#0d0d0d] uppercase tracking-wider">
                  Modular Telemetry Ingestion
                </span>
                <span className="px-2 py-0.5 rounded bg-[#efeeea] text-[10px] font-mono text-[#444748]">
                  {activeCount} of 8 Active
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#747878] mt-0.5">
                Toggle live chapter payloads to compile target PDF envelope.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="px-2.5 py-1 rounded bg-[#efeeea] hover:bg-[#dbdad6] text-[10px] font-mono text-[#1b1c1a] uppercase tracking-wider font-semibold border border-[#dbdad6] transition-colors"
              >
                Select All
              </button>
              <button
                onClick={resetToDefault}
                className="px-2.5 py-1 rounded bg-[#efeeea] hover:bg-[#dbdad6] text-[10px] font-mono text-[#1b1c1a] uppercase tracking-wider font-semibold border border-[#dbdad6] transition-colors"
              >
                Default 24H
              </button>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="space-y-3">
            {CHAPTERS.map((ch) => {
              const isChecked = !!selectedChapters[ch.id];
              return (
                <label
                  key={ch.id}
                  className={`group relative flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer shadow-sm border ${
                    isChecked
                      ? ch.warning
                        ? "bg-white border-[#fecf50]"
                        : "bg-white border-[#dbdad6] hover:border-[#747878]/50"
                      : "bg-[#faf9f5]/60 border-[#dbdad6]/60 opacity-60"
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChapter(ch.id)}
                      className="w-4 h-4 rounded text-[#0d0d0d] focus:ring-0 accent-[#0d0d0d] cursor-pointer"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold ${
                          ch.warning ? "text-[#765b00] flex items-center gap-1" : "text-[#747878]"
                        }`}
                      >
                        {ch.warning && <span className="material-symbols-outlined text-[14px]">warning</span>}
                        {ch.number} · {ch.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                          ch.badgeColor ? ch.badgeColor : "bg-[#efeeea] text-[#444748]"
                        }`}
                      >
                        {!ch.badgeColor && <span className="w-1.5 h-1.5 rounded-full bg-[#765b00]"></span>}
                        {ch.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-mono font-semibold text-[#0d0d0d] mt-0.5">{ch.title}</h3>
                    <p className="text-xs font-sans text-[#444748] mt-1 leading-relaxed">{ch.desc}</p>

                    {ch.metrics && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        {ch.metrics.map((m) => (
                          <div key={m.label} className="p-2 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                            <div className="text-[9px] font-mono text-[#747878]">{m.label}</div>
                            <div className="text-xs font-mono font-semibold text-[#0d0d0d]">{m.value}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>

          {/* Live Handover Notes Text Area */}
          <div className="bg-white p-4 rounded-xl border border-[#dbdad6] shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="handoverNotes"
                className="text-xs font-mono font-semibold text-[#0d0d0d] uppercase tracking-wider flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Lead Drilling Engineer Handover Notes
              </label>
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#747878]">
                <span>R. Sonowal (DE-III)</span>
                <span>•</span>
                <span>14:15 UTC (20 min ago)</span>
              </div>
            </div>
            <textarea
              id="handoverNotes"
              rows={3}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              className="w-full p-3 bg-[#f5f4ef] border border-[#dbdad6] rounded-lg text-xs font-sans text-[#1b1c1a] focus:outline-none focus:border-[#0d0d0d] transition-colors resize-none leading-relaxed"
              placeholder="Type imperative handover directives for incoming tour..."
            />
            <div className="flex items-center justify-between text-[10px] font-mono text-[#747878] pt-1">
              <span>Auto-saved to Central Well File repository</span>
              <button
                onClick={() => showToast("Loaded archived Tour 1 shift directives")}
                className="hover:text-[#0d0d0d] transition-colors underline uppercase tracking-wider"
              >
                Load Previous Shift Archive
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live PDF Document Preview & Distribution (5 Cols) */}
        <div className="xl:col-span-5 flex flex-col gap-5 print-block">
          {/* Preview Header HUD */}
          <div className="bg-white p-4 rounded-xl border border-[#dbdad6] shadow-sm flex items-center justify-between print-hidden">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0d0d0d] text-[20px]">picture_as_pdf</span>
              <div>
                <div className="text-xs font-mono font-semibold text-[#0d0d0d] uppercase">PDF Rendering Engine</div>
                <div className="text-[10px] font-mono text-[#444748]">
                  READY · {activeCount} CHAPTERS · EST. {estimatedMb} MB
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded bg-[#efeeea] text-[10px] font-mono text-[#1b1c1a] font-semibold tracking-wider uppercase border border-[#dbdad6]">
              A4 / 300 DPI
            </span>
          </div>

          {/* Architectural Document Sheet Preview Container */}
          <div className="relative bg-[#dbdad6]/40 p-4 sm:p-6 rounded-2xl border border-[#dbdad6] flex justify-center items-start shadow-inner overflow-hidden min-h-[500px] print-block border-none shadow-none bg-transparent">
            {/* Miniature A4 Sheet */}
            <div id="printable-a4-sheet" className="w-full max-w-[400px] bg-[#faf9f5] rounded shadow-md border border-[#dbdad6]/80 p-5 flex flex-col justify-between text-[#1b1c1a] relative select-none aspect-[1/1.414]">
              {/* Sheet Header / Letterhead */}
              <div>
                <div className="flex items-start justify-between border-b border-[#0d0d0d]/20 pb-2.5">
                  <div>
                    <div className="text-[9px] font-mono font-bold tracking-widest text-[#0d0d0d] uppercase">
                      OIL INDIA LIMITED
                    </div>
                    <div className="text-[7px] font-mono tracking-wider text-[#747878] uppercase">
                      Subsurface Information & Real-Time Operations
                    </div>
                    <div className="text-[13px] font-serif font-bold text-[#0d0d0d] mt-1">
                      {activeTemplate === 'ddr' ? 'DAILY DRILLING REPORT (DDR)' : 
                       activeTemplate === 'tour' ? 'SHIFT HANDOVER BRIEFING' : 
                       activeTemplate === 'pre-spud' ? 'OFFSET RISK BRIEFING' : 'NPT RECONCILIATION'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] font-mono font-semibold text-[#0d0d0d]">REPORT #042</div>
                    <div className="text-[7px] font-mono text-[#747878]">DATE: 24-OCT-2024</div>
                    <div className="text-[7px] font-mono text-[#747878]">TIME: 06:00 IST</div>
                  </div>
                </div>

                {/* Mini Well Identifiers Strip */}
                <div className="grid grid-cols-3 gap-1 bg-[#f5f4ef] p-1.5 rounded my-2 text-[7px] font-mono border border-[#dbdad6]">
                  <div><span className="text-[#747878]">WELL:</span> {activeWellName}</div>
                  <div><span className="text-[#747878]">RIG:</span> SE-802</div>
                  <div><span className="text-[#747878]">FIELD:</span> Duliajan Ext.</div>
                  <div><span className="text-[#747878]">SEC:</span> 12-1/4"</div>
                  <div><span className="text-[#747878]">DEPTH:</span> {fmtDepthShort(2850.2, unitSystem)}</div>
                  <div><span className="text-[#747878]">STATUS:</span> DRILLING</div>
                </div>

                {/* Mini Section 01 preview: Chronology snippet */}
                {selectedChapters.ch1 && (
                  <div className="mb-2">
                    <div className="text-[7.5px] font-mono font-bold uppercase text-[#0d0d0d] border-b border-[#dbdad6] pb-0.5 mb-1 flex justify-between">
                      <span>01. 24-HR OPERATIONS SUMMARY</span>
                      <span className="text-[6.5px] text-[#747878] font-normal">2,790m → 2,850m (+60.2m)</span>
                    </div>
                    <div className="text-[7px] font-mono text-[#444748] leading-tight space-y-0.5">
                      <div>06:00 - 11:30 | Rotary drilling from 2,790m to 2,822m. Avg ROP: 15.2 m/h.</div>
                      <div>11:30 - 14:00 | Flow check neg. MWD survey (Inc 1.8°, Azm 142.1°).</div>
                      <div>14:00 - 06:00 | Continued drilling with motor assembly to current 2,850.2m.</div>
                    </div>
                  </div>
                )}

                {/* Mini Section 02 preview: Telemetry table */}
                {selectedChapters.ch2 && (
                  <div className="mb-2">
                    <div className="text-[7.5px] font-mono font-bold uppercase text-[#0d0d0d] border-b border-[#dbdad6] pb-0.5 mb-1">
                      02. HYDRAULIC & DRILLING TELEMETRY
                    </div>
                    <table className="w-full text-[6.5px] font-mono text-left">
                      <tbody>
                        <tr className="text-[#747878] border-b border-[#dbdad6]/60">
                          <th className="py-0.5">PARAM</th>
                          <th>VALUE</th>
                          <th>LIMIT</th>
                          <th>STATUS</th>
                        </tr>
                        <tr className="border-b border-[#dbdad6]/30">
                          <td className="py-0.5">SPP (psi)</td>
                          <td className="font-bold">3,115</td>
                          <td>3,500</td>
                          <td className="text-[#765b00] font-bold">NOMINAL</td>
                        </tr>
                        <tr className="border-b border-[#dbdad6]/30">
                          <td className="py-0.5">ECD (SG)</td>
                          <td className="font-bold">{sandboxSimulatedEcd ? sandboxSimulatedEcd.toFixed(2) : "1.34"}</td>
                          <td>1.40</td>
                          <td className={sandboxSimulatedEcd && sandboxSimulatedEcd > 1.38 ? "text-[#ba1a1a] font-bold" : "text-[#765b00] font-bold"}>
                            {sandboxSimulatedEcd && sandboxSimulatedEcd > 1.38 ? "FRAC RISK" : "STABLE"}
                          </td>
                        </tr>
                        {sandboxPill && (
                          <tr className="border-b border-[#dbdad6]/30">
                            <td className="py-0.5">LCM Pill</td>
                            <td className="font-bold uppercase" colSpan={2}>{sandboxPill}</td>
                            <td className="text-[#0d0d0d] font-bold">COMMITTED</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-0.5">Flow Out (%)</td>
                          <td className="font-bold">100.2</td>
                          <td>±5%</td>
                          <td className="text-[#765b00] font-bold">IN BALANCE</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mini Section 03 preview: Model 3 Lookahead Hazard Banner */}
                {selectedChapters.ch3 && (
                  <div className="bg-[#ffdf95]/30 border border-[#765b00] p-1.5 rounded mb-2">
                    <div className="flex items-center justify-between text-[7px] font-mono font-bold text-[#251a00]">
                      <span>03. LOOKAHEAD HAZARD: THIEF ZONE @ 2,912m</span>
                      <span className="text-[6px] uppercase px-1 bg-[#765b00] text-white rounded">WATCH</span>
                    </div>
                    <div className="text-[6.5px] text-[#444748] font-mono mt-0.5 leading-tight">
                      Loss probability 82%. Barail transition gas kick warning active at 2,985m. Pre-treated LCM on standby.
                    </div>
                  </div>
                )}

                {/* Mini Section 04: Mud & Rheology */}
                {selectedChapters.ch4 && (
                  <div className="text-[6.5px] font-mono text-[#444748] bg-[#f5f4ef] p-1 rounded border border-[#dbdad6] flex justify-between mb-2">
                    <span>MW: 1.28 SG</span>
                    <span>PV: 22 cP</span>
                    <span>YP: 18 lb</span>
                    <span>GEL: 6/14</span>
                    <span>PH: 9.4</span>
                  </div>
                )}

                {/* Mini Section 05: Offset Well Analogue */}
                {selectedChapters.ch5 && (
                  <div className="mb-2">
                    <div className="text-[7.5px] font-mono font-bold uppercase text-[#0d0d0d] border-b border-[#dbdad6] pb-0.5 mb-1">
                      05. HISTORICAL OFFSET CITATIONS
                    </div>
                    <div className="text-[7px] font-mono text-[#444748] leading-tight">
                      Correlated with NH-04 severe loss event at 2,918m (35 bbl/hr seepage). Recipe approved: 40 ppb coarse mica + calcium carbonate fiber blend standing by.
                    </div>
                  </div>
                )}

                {/* Mini Section 06: Efficiency & NPT */}
                {selectedChapters.ch6 && (
                  <div className="mb-2">
                    <div className="text-[7.5px] font-mono font-bold uppercase text-[#0d0d0d] border-b border-[#dbdad6] pb-0.5 mb-1">
                      06. NPT LEDGER & INVISIBLE LOSS
                    </div>
                    <div className="text-[7px] font-mono text-[#444748] leading-tight">
                      Cumulative section NPT: 14.2 hrs. Top drive IBOP leak repair: 1.8 hrs; MWD tool pulser re-seat: 2.1 hrs. HSE loss incidents: 0.
                    </div>
                  </div>
                )}

                {/* Mini Section 07: Lithology */}
                {selectedChapters.ch7 && (
                  <div className="mb-2">
                    <div className="text-[7.5px] font-mono font-bold uppercase text-[#0d0d0d] border-b border-[#dbdad6] pb-0.5 mb-1">
                      07. FORMATION BOUNDARY TRACKING
                    </div>
                    <div className="text-[7px] font-mono text-[#444748] leading-tight">
                      Transitioning out of Girujan Clay into Upper Tipam Sandstone. Cuttings: 65% fine-to-medium grained quartzose sand, sub-angular, trace carbonaceous streaks.
                    </div>
                  </div>
                )}

                {/* Mini Section 08: Compliance Roster */}
                {selectedChapters.ch8 && (
                  <div className="mb-2">
                    <div className="text-[7.5px] font-mono font-bold uppercase text-[#ba1a1a] border-b border-[#ba1a1a]/30 pb-0.5 mb-1">
                      08. COMPLIANCE & SAFETY AUDIT (PENDING)
                    </div>
                    <div className="text-[7px] font-mono text-[#444748] leading-tight flex items-center justify-between">
                      <span>Requires Toolpusher shift validation signature.</span>
                      <span className="text-[6px] border border-[#ba1a1a] text-[#ba1a1a] px-1 rounded">ACTION REQ</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Sheet Footer: Signature & Barcode Simulation */}
              <div className="pt-2 border-t border-[#0d0d0d]/20 flex items-end justify-between">
                <div>
                  <div className="h-4 w-28 bg-[#dbdad6] flex items-center justify-center text-[6px] font-mono text-[#747878] tracking-widest">
                    |||| | |||||| || | |||| |||
                  </div>
                  <div className="text-[6px] font-mono text-[#747878] mt-0.5">
                    SEC-HASH: 802-NH12-2410-DDR-VERIFIED
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[7.5px] font-serif italic text-[#0d0d0d] font-bold">R. Sonowal</div>
                  <div className="text-[6px] font-mono text-[#747878] border-t border-[#747878]/50 pt-0.5">
                    LEAD DRILLING ENGINEER SIGN-OFF
                  </div>
                </div>
              </div>

              {/* Document Watermark Pill */}
              <div className="print-hide absolute right-2 top-2 px-1.5 py-0.5 rounded bg-[#efeeea] text-[7px] font-mono text-[#747878] uppercase tracking-wider">
                Page 1 of {activeCount}
              </div>
            </div>
          </div>

          {/* Compilation & Distribution CTAs */}
          <div className="bg-white p-4 rounded-xl border border-[#dbdad6] shadow-sm flex flex-col gap-3 print-hidden">
            {/* Big Primary CTA */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="w-full py-3.5 px-4 rounded-full bg-[#0d0d0d] hover:bg-[#30312e] text-white font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-[0.99] disabled:opacity-75"
            >
              {isGeneratingPdf ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Compiling High-Res PDF...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] text-[#fecf50]">download</span>
                  <span>Generate & Download PDF Report ({activeCount} Pages)</span>
                </>
              )}
            </button>

            {/* Secondary Dispatch CTA */}
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className="w-full py-3 px-4 rounded-full bg-[#efeeea] hover:bg-[#dbdad6] text-[#1b1c1a] font-mono text-xs tracking-wider uppercase flex items-center justify-center gap-2 border border-[#dbdad6] transition-all disabled:opacity-75"
            >
              {isDispatching ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  <span>Transmitting via SMTP/REST...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  <span>Dispatch to Rig Superintendent & RTOC</span>
                </>
              )}
            </button>

            {/* Ghost / High-Res Image Export CTA */}
            <button
              onClick={handleExportPng}
              className="w-full py-2 px-4 rounded-full text-[#444748] hover:text-[#0d0d0d] hover:bg-[#efeeea] text-[11px] font-mono tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">image</span>
              <span>Export Summary PNG Cards (WhatsApp Briefing)</span>
            </button>

            {/* Distribution List Recipients */}
            <div className="pt-2 border-t border-[#dbdad6]">
              <div className="text-[10px] font-mono text-[#747878] uppercase font-semibold mb-2 flex items-center justify-between">
                <span>Verified Distribution Roster</span>
                <span className="text-[#765b00] font-semibold">3 Endpoints</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { email: "rig.se802@oilindia.in", label: "Rig Site Server" },
                  { email: "rtoc.duliajan@oilindia.in", label: "Operational Center" },
                  { email: "drilling.supt@oilindia.in", label: "Superintendent Desk" },
                ].map((item) => (
                  <div
                    key={item.email}
                    className="flex items-center justify-between p-1.5 rounded bg-[#f5f4ef] text-[10px] font-mono"
                  >
                    <span className="text-[#1b1c1a]">{item.email}</span>
                    <span className="text-[#747878] uppercase text-[9px]">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
