"use client";

import { useState, useEffect } from "react";
import { useGlobalContext } from "@/store/globalContext";

interface DdrOperation {
  from: string;
  to: string;
  elapsed: number;
  endMd: number;
  code: string;
  desc: string;
}

interface DdrData {
  reportNo: number;
  date: string;
  operator: string;
  rig: string;
  wellName: string;
  measuredDepth: number;
  verticalDepth: number;
  holeMade: number;
  drillingDays: string;
  currentOps: string;
  plannedOps: string;
  safetySummary: string;
  operations: DdrOperation[];
  managementSummary: string;
  casing: { size: string; topMd: number; botMd: number; grade: string; lot: number }[];
  mud: { density: number; pv: number; yp: number; solids: number; chlorides: number };
  bha: { make: string; model: string; diam: string; wob: number; rpm: number; flow: number; press: number };
}

export default function ReportsPage() {
  const { unitSystem, customReports, activeWellName } = useGlobalContext();
  const [db, setDb] = useState<Record<string, DdrData[]>>({});
  const [selectedWell, setSelectedWell] = useState<string>("OIL-NH-12");
  const [selectedReportIdx, setSelectedReportIdx] = useState<number>(29);
  
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Real-time Editable State
  const [ddr, setDdr] = useState<DdrData | null>(null);

  useEffect(() => {
    fetch("/mock_ddrs.json")
      .then((res) => res.json())
      .then((data) => setDb(data))
      .catch((err) => console.error("Error loading mock DDRs:", err));
  }, []);

  // When DB or selection changes, clone into editable state
  useEffect(() => {
    const wellData = db[selectedWell] ? [...db[selectedWell], ...customReports.filter((r: any) => r.wellName === selectedWell || selectedWell === 'CUSTOM NLP REPORTS')] : customReports;
    if (wellData && wellData[selectedReportIdx]) {
      setDdr(JSON.parse(JSON.stringify(wellData[selectedReportIdx])));
    } else {
      setDdr(null);
    }
  }, [db, selectedWell, selectedReportIdx, customReports]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDownloadPdf = () => {
    setIsGeneratingPdf(true);
    showToast("Compiling High-Res A4 Vector PDF...");
    setTimeout(() => {
      window.print();
      setIsGeneratingPdf(false);
    }, 1000);
  };

  const wellDataOptions = db[selectedWell] ? [...db[selectedWell], ...customReports.filter((r: any) => r.wellName === selectedWell || selectedWell === 'CUSTOM NLP REPORTS')] : customReports;

  const updateDdr = (field: keyof DdrData, value: any) => {
    if (!ddr) return;
    setDdr({ ...ddr, [field]: value });
  };

  const updateMud = (field: keyof DdrData['mud'], value: any) => {
    if (!ddr) return;
    setDdr({ ...ddr, mud: { ...ddr.mud, [field]: value } });
  };

  return (
    <div className="flex h-screen w-full bg-white text-[#1b1c1a] font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .app-shell, .main-content { display: block !important; grid-template-columns: none !important; width: 100% !important; }
          .app-shell > :not(.main-content) { display: none !important; }
          .print-hidden { display: none !important; }
          #printable-a4-sheet { 
            width: 210mm !important; 
            min-height: 297mm !important; 
            padding: 10mm 15mm !important; 
            margin: 0 auto !important; 
            background: white !important; 
            color: black !important;
            box-shadow: none !important;
            font-size: 10px !important;
          }
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
        }
      `}} />

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1c1b1b] text-white shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-xs print-hidden">
          <span className="material-symbols-outlined text-[#fecf50]">verified</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT PANEL: The Approval Review (Hidden on print) */}
      <div className="w-[45%] flex flex-col border-r border-[#dbdad6] print-hidden overflow-hidden">
        <header className="flex flex-col bg-[#f5f4ef] border-b border-[#dbdad6] p-6 shrink-0">
          <h1 className="text-xl font-serif text-[#0d0d0d] flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#747878]">fact_check</span>
            DDR Approval & Review
          </h1>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <select 
                value={selectedWell} 
                onChange={(e) => { setSelectedWell(e.target.value); setSelectedReportIdx(0); }}
                className="flex-1 px-3 py-2 bg-white border border-[#dbdad6] rounded text-xs font-mono outline-none focus:border-[#0d0d0d]"
              >
                <option value={activeWellName}>{activeWellName}</option>
                <option value="CUSTOM NLP REPORTS">CUSTOM NLP REPORTS</option>
              </select>
              <select 
                value={selectedReportIdx} 
                onChange={(e) => setSelectedReportIdx(Number(e.target.value))}
                className="flex-1 px-3 py-2 bg-white border border-[#dbdad6] rounded text-xs font-mono outline-none focus:border-[#0d0d0d]"
              >
                {wellDataOptions.map((d: any, i: number) => (
                  <option key={i} value={i}>Report #{d.reportNo} ({d.date})</option>
                ))}
              </select>
            </div>
            <button onClick={handleDownloadPdf} className="w-full px-5 py-2.5 bg-[#0d0d0d] text-white rounded text-xs font-mono font-bold uppercase hover:bg-[#30312e] transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">print</span>
              {isGeneratingPdf ? "Compiling PDF..." : "Generate PDF Report"}
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-[#faf9f5]">
          {ddr ? (
            <div className="flex flex-col gap-6">
              {/* Form Groups */}
              <div className="bg-white border border-[#dbdad6] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-[#efeeea] pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0d0d0d]">Well Data</div>
                  <button className="text-[10px] bg-[#008f51] text-white px-2 py-1 rounded font-bold">APPROVED</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#747878] mb-1">MEASURED DEPTH (ft)</label>
                    <div className="w-full px-3 py-1.5 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm text-[#747878]">{ddr.measuredDepth}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#747878] mb-1">HOLE MADE (ft)</label>
                    <div className="w-full px-3 py-1.5 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm text-[#747878]">{ddr.holeMade}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#dbdad6] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-[#efeeea] pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0d0d0d]">Operations Summary</div>
                  <button className="text-[10px] bg-[#008f51] text-white px-2 py-1 rounded font-bold">APPROVED</button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#747878] mb-1">CURRENT OPS</label>
                  <div className="w-full px-3 py-2 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm min-h-[60px] text-[#747878]">{ddr.currentOps}</div>
                </div>
                <div className="mt-3">
                  <label className="block text-[10px] font-bold text-[#747878] mb-1">MANAGEMENT SUMMARY (EDITABLE)</label>
                  <textarea value={ddr.managementSummary} onChange={(e) => updateDdr('managementSummary', e.target.value)} className="w-full px-3 py-2 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm min-h-[100px] outline-none focus:border-[#0d0d0d]" />
                </div>
              </div>

              <div className="bg-white border border-[#dbdad6] rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4 border-b border-[#efeeea] pb-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#0d0d0d]">Mud Properties</div>
                  <button className="text-[10px] bg-[#008f51] text-white px-2 py-1 rounded font-bold">APPROVED</button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#747878] mb-1">DENSITY (ppg)</label>
                    <div className="w-full px-3 py-1.5 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm text-[#747878]">{ddr.mud.density}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#747878] mb-1">CHLORIDES</label>
                    <div className="w-full px-3 py-1.5 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm text-[#747878]">{ddr.mud.chlorides}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#747878] mb-1">PV</label>
                    <div className="w-full px-3 py-1.5 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm text-[#747878]">{ddr.mud.pv}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#747878] mb-1">YP</label>
                    <div className="w-full px-3 py-1.5 bg-[#f5f4ef] border border-[#efeeea] rounded text-sm text-[#747878]">{ddr.mud.yp}</div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#747878] italic text-center">More fields can be edited directly on the A4 preview sheet.</p>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-mono text-[#747878]">No Report Selected</div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL: A4 Sheet Rendering */}
      <main className="flex-1 overflow-y-auto p-8 print:p-0 print:overflow-visible flex flex-col items-center bg-[#dbdad6] print:bg-white">
        {!ddr ? null : (
          <div 
            id="printable-a4-sheet" 
            className="w-[210mm] min-h-[297mm] bg-white border border-[#dbdad6] shadow-2xl p-[10mm] flex flex-col mx-auto text-[#0d0d0d] font-sans shrink-0 transition-all"
          >
            {/* GRG Logo / Header Clone */}
            <div className="flex items-start border border-[#0d0d0d] bg-[#e6e6e6] p-2 mb-1">
              <div className="w-[60px] h-[60px] bg-[#008f51] flex items-center justify-center mr-4 shrink-0">
                 <span className="text-white font-bold text-2xl">WELLS</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold uppercase m-0 leading-tight">Daily Drilling Report</h2>
                    <div className="text-[10px] font-bold flex gap-1">Well ID: <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.wellName}</span></div>
                    <div className="text-[10px] flex gap-1">Field: <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">Duliajan Ext.</span></div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-lg font-bold uppercase m-0 leading-tight" contentEditable suppressContentEditableWarning>WELLS.INTEL</h2>
                    <div className="text-[10px] font-bold flex gap-1 justify-end">Well Name: <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.wellName}</span></div>
                    <div className="text-[10px]" contentEditable suppressContentEditableWarning>Sect: 12 Town: 26 Rng: 9W County: Assam</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Strip */}
            <div className="flex justify-between border border-[#0d0d0d] bg-[#d9d9d9] font-bold text-[9px] px-1 border-t-0 mb-1">
              <span className="flex gap-1">Report No: <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-white/50">{ddr.reportNo}</span></span>
              <span className="flex gap-1">Report For: <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-white/50">{ddr.date}</span></span>
            </div>

            {/* General Info Grid */}
            <div className="border border-[#0d0d0d] text-[8px] mb-1">
              <div className="grid grid-cols-4 border-b border-[#0d0d0d]">
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Operator:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">{ddr.operator}</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Rig:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">{ddr.rig}</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Spud Date:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full">28-Jun-24</span></div>
                <div className="p-0.5 bg-[#e6e6e6] font-bold flex gap-1"><span className="shrink-0">Daily Cost / Mud ($):</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-white/50 w-full">---</span></div>
              </div>
              <div className="grid grid-cols-4 border-b border-[#0d0d0d]">
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Measured Depth (ft):</span> <span className="w-full truncate font-bold text-[#008f51]">{ddr.measuredDepth}</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Last Casing:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">11.750 at 2,990</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Wellbore:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">Original</span></div>
                <div className="p-0.5 flex gap-1"><span className="font-bold shrink-0">AFE No:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full">---</span></div>
              </div>
              <div className="grid grid-cols-4 border-b border-[#0d0d0d]">
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Vertical Depth (ft):</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">{ddr.verticalDepth}</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Next Casing:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">7.000 at 8,500</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">RKB Elevation (ft):</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">30.40</span></div>
                <div className="p-0.5 bg-[#e6e6e6] font-bold flex gap-1"><span className="shrink-0">Totals:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-white/50 w-full">---</span></div>
              </div>
              <div className="grid grid-cols-4">
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Hole Made (ft):</span> <span className="w-full truncate font-bold text-[#008f51]">{ddr.holeMade}</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Drilling Days:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">{ddr.drillingDays}</span></div>
                <div className="p-0.5 border-r border-[#0d0d0d] flex gap-1"><span className="font-bold shrink-0">Working Interest:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30 w-full truncate">100%</span></div>
                <div className="p-0.5 bg-[#e6e6e6] font-bold flex gap-1"><span className="shrink-0">Well Cost ($):</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-white/50 w-full">---</span></div>
              </div>
            </div>

            {/* Ops Grid */}
            <div className="border border-[#0d0d0d] text-[8px] mb-1 p-0.5">
              <div className="font-bold border-b border-[#0d0d0d] pb-0.5 mb-0.5 flex gap-1">Safety Summary: <span contentEditable suppressContentEditableWarning className="font-normal outline-none focus:bg-[#fecf50]/30 w-full truncate">{ddr.safetySummary}</span></div>
              <div className="flex border-b border-[#0d0d0d]/30 pb-0.5 mb-0.5">
                <div className="w-[100px] font-bold shrink-0">Current Operations:</div>
                <div className="flex-1 font-bold text-[#008f51]">{ddr.currentOps}</div>
              </div>
              <div className="flex border-b border-[#0d0d0d]/30 pb-0.5 mb-0.5">
                <div className="w-[100px] font-bold shrink-0">Planned Operations:</div>
                <div className="flex-1 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{ddr.plannedOps}</div>
              </div>
              <div className="flex">
                <div className="w-[100px] font-bold shrink-0">Toolpusher:</div>
                <div className="flex-1 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>Steve Caldwell, Justin Bristol</div>
              </div>
            </div>

            {/* Operations Summary Header */}
            <div className="text-center font-bold text-[9px] bg-[#d9d9d9] border border-[#0d0d0d] border-b-0">
              Operations Summary
            </div>
            
            {/* Ops Table */}
            <table className="w-full text-[8px] border border-[#0d0d0d] border-collapse mb-1">
              <thead>
                <tr className="bg-[#f2f2f2]">
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1 text-left w-10">From</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1 text-left w-10">To</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1 text-right w-10">Elapsed</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1 text-right w-12">End MD(ft)</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1 text-left w-10">Code</th>
                  <th className="border-b border-[#0d0d0d] font-bold px-1 text-left">Operations Description</th>
                </tr>
              </thead>
              <tbody>
                {ddr.operations.map((op: any, i: number) => (
                  <tr key={i} className="align-top">
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{op.from}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{op.to}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 text-right outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{op.elapsed.toFixed(2)}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 text-right outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{op.endMd.toFixed(0)}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{op.code}</td>
                    <td className="px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{op.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mgmt Summary */}
            <div className="text-center font-bold text-[9px] bg-[#d9d9d9] border border-[#0d0d0d] border-b-0">
              Management Summary
            </div>
            <div className="border border-[#0d0d0d] text-[8px] p-1 min-h-[40px] whitespace-pre-wrap mb-1 text-[#008f51] font-bold">
              {ddr.managementSummary}
            </div>

            {/* Casing Table */}
            <div className="text-center font-bold text-[9px] bg-[#d9d9d9] border border-[#0d0d0d] border-b-0">
              Casing/Tubular Information
            </div>
            <table className="w-full text-[8px] border border-[#0d0d0d] border-collapse mb-1 text-center">
              <thead>
                <tr className="bg-[#f2f2f2]">
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1">Size (ins)</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1">Top MD</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1">Bottom MD</th>
                  <th className="border-r border-b border-[#0d0d0d] font-bold px-1">Grade</th>
                  <th className="border-b border-[#0d0d0d] font-bold px-1">LOT (lbs/gal)</th>
                </tr>
              </thead>
              <tbody>
                {ddr.casing.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{c.size}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{c.topMd}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{c.botMd}</td>
                    <td className="border-r border-[#0d0d0d]/30 px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{c.grade}</td>
                    <td className="px-1 py-0.5 outline-none focus:bg-[#fecf50]/30" contentEditable suppressContentEditableWarning>{c.lot}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mud & BHA Grid */}
            <div className="grid grid-cols-2 gap-1 mb-1">
              <div>
                <div className="text-center font-bold text-[9px] bg-[#d9d9d9] border border-[#0d0d0d] border-b-0">
                  Mud Information
                </div>
                <div className="border border-[#0d0d0d] text-[8px] p-1 flex justify-between h-[30px] items-center">
                  <span className="flex gap-1"><span className="font-bold shrink-0">Dens:</span> <span className="font-bold text-[#008f51]">{ddr.mud.density}</span></span>
                  <span className="flex gap-1"><span className="font-bold shrink-0">PV/YP:</span> <span className="font-bold text-[#008f51]">{ddr.mud.pv}/{ddr.mud.yp}</span></span>
                  <span className="flex gap-1"><span className="font-bold shrink-0">Solids %:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.mud.solids}</span></span>
                  <span className="flex gap-1"><span className="font-bold shrink-0">Cl:</span> <span className="font-bold text-[#008f51]">{ddr.mud.chlorides}</span></span>
                </div>
              </div>
              <div>
                <div className="text-center font-bold text-[9px] bg-[#d9d9d9] border border-[#0d0d0d] border-b-0">
                  Bit/BHA Information
                </div>
                <div className="border border-[#0d0d0d] text-[8px] p-1 flex justify-between h-[30px] items-center">
                  <span className="flex gap-1"><span className="font-bold shrink-0">Make/Model:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.bha.make} {ddr.bha.model}</span></span>
                  <span className="flex gap-1"><span className="font-bold shrink-0">Diam:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.bha.diam}"</span></span>
                  <span className="flex gap-1"><span className="font-bold shrink-0">WOB:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.bha.wob}k</span></span>
                  <span className="flex gap-1"><span className="font-bold shrink-0">RPM:</span> <span contentEditable suppressContentEditableWarning className="outline-none focus:bg-[#fecf50]/30">{ddr.bha.rpm}</span></span>
                </div>
              </div>
            </div>

            {/* Bottom Info */}
            <div className="flex justify-between items-center text-[7px] italic border-t border-[#0d0d0d] pt-1 mt-auto">
              <span>Printed via WELLS.INTEL Professional DDR Engine</span>
              <span>Page 1 of 1</span>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
