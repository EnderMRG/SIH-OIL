/**
 * Page 16: Compliance Audit & Action Attribution Log (/audit)
 * Redesigned to exact "Architectural Subsurface Editorial" standards
 * Source reference: Code/compliance_audit_action_attribution_log/code.html
 */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useGlobalContext } from "@/store/globalContext";

type ActionType =
  | "ACKNOWLEDGE_ALERT"
  | "PROMOTE_BASELINE"
  | "EXECUTE_WHAT_IF"
  | "VALIDATE_DDR_OCR"
  | "SHIFT_HANDOVER"
  | "SHELVE_ALERT";

interface AuditRecord {
  id: string;
  time: string;
  user: string;
  userName: string;
  userRole: string;
  userInitials: string;
  action: ActionType;
  targetRef: string;
  context: string;
  contextHighlight?: string;
  merkleHash: string;
  fullProof?: {
    blockId: number;
    edDsaSig: string;
    merklePath: string[];
    rigTelemetry: {
      depthM: number;
      sppPsi: number;
      ecdSg: number;
      flowOutPct: number;
    };
  };
}

const AUDIT_DATA: AuditRecord[] = [
  {
    id: "rec-1",
    time: "14:15:22 IST",
    user: "eng_arjun",
    userName: "eng_arjun",
    userRole: "RTOC Lead",
    userInitials: "EA",
    action: "ACKNOWLEDGE_ALERT",
    targetRef: "HZD-084-ML",
    context: "Acknowledged 78% Thief Zone loss hazard at 2,912 m TVDSS. Instructed mud engineer to mix 20 m³ coarse LCM pill on pit 4.",
    contextHighlight: "78% Thief Zone loss hazard",
    merkleHash: "#e8a9f2...90c4",
    fullProof: {
      blockId: 89142,
      edDsaSig: "3045022100e8a9f21234abcd5678ef0123456789abcdef0123456789abcdef0123456789",
      merklePath: ["e8a9f290c4", "43b18ef002", "99fa20bc10", "7c89a0b12f"],
      rigTelemetry: { depthM: 2850.2, sppPsi: 3115, ecdSg: 1.34, flowOutPct: 100.2 },
    },
  },
  {
    id: "rec-2",
    time: "13:48:05 IST",
    user: "geol_sarma",
    userName: "geol_sarma",
    userRole: "Chief Geologist",
    userInitials: "GS",
    action: "PROMOTE_BASELINE",
    targetRef: "OIL-NH-04",
    context: 'Locked OIL-NH-04 as official lookahead analogue for 12-1/4" intermediate section based on 88.2% similarity score.',
    contextHighlight: "OIL-NH-04",
    merkleHash: "#c4d711...e281",
    fullProof: {
      blockId: 89139,
      edDsaSig: "3045022100c4d71199887766554433221100aabbccddeeff00112233445566778899aabb",
      merklePath: ["c4d711e281", "12aa099011", "31d87c667b", "7c89a0b12f"],
      rigTelemetry: { depthM: 2842.0, sppPsi: 3090, ecdSg: 1.33, flowOutPct: 99.8 },
    },
  },
  {
    id: "rec-3",
    time: "12:30:19 IST",
    user: "eng_arjun",
    userName: "eng_arjun",
    userRole: "RTOC Lead",
    userInitials: "EA",
    action: "EXECUTE_WHAT_IF",
    targetRef: "SIM-0041",
    context: "Evaluated hydraulic ECD at 1.30 SG mud weight and 2,450 L/min flow rate. Returned SAFE DRILLING WINDOW with 1.48 SG shoe clearance.",
    contextHighlight: "SAFE DRILLING WINDOW",
    merkleHash: "#99fa20...bc10",
    fullProof: {
      blockId: 89130,
      edDsaSig: "304502210099fa201234567890abcdef1234567890abcdef1234567890abcdef12345678",
      merklePath: ["99fa20bc10", "e8a9f290c4", "43b18ef002", "7c89a0b12f"],
      rigTelemetry: { depthM: 2831.5, sppPsi: 3050, ecdSg: 1.34, flowOutPct: 100.1 },
    },
  },
  {
    id: "rec-4",
    time: "11:15:40 IST",
    user: "geol_sarma",
    userName: "geol_sarma",
    userRole: "Chief Geologist",
    userInitials: "GS",
    action: "VALIDATE_DDR_OCR",
    targetRef: "EVT-9042",
    context: "Approved OCR extraction from DDR_OIL_NH04_Phase2.pdf p.42: 45 m³ severe mud loss in Tipam Lower Sand committed to Knowledge Graph.",
    contextHighlight: "45 m³ severe mud loss",
    merkleHash: "#43b18e...f002",
    fullProof: {
      blockId: 89122,
      edDsaSig: "304502210043b18e11223344556677889900aabbccddeeff11223344556677889900aabb",
      merklePath: ["43b18ef002", "99fa20bc10", "e8a9f290c4", "7c89a0b12f"],
      rigTelemetry: { depthM: 2818.4, sppPsi: 3010, ecdSg: 1.33, flowOutPct: 100.0 },
    },
  },
  {
    id: "rec-5",
    time: "09:22:11 IST",
    user: "driller_deka",
    userName: "driller_deka",
    userRole: "Rig Doghouse",
    userInitials: "DD",
    action: "ACKNOWLEDGE_ALERT",
    targetRef: "HZD-076-DS",
    context: "Acknowledged differential sticking alert at 2,875 m TVDSS from Doghouse PWA. Limited static surveys to < 90s.",
    contextHighlight: "differential sticking alert",
    merkleHash: "#31d87c...667b",
    fullProof: {
      blockId: 89110,
      edDsaSig: "304502210031d87c1234567890abcdefabcdefabcdef1234567890abcdefabcdef12345678",
      merklePath: ["31d87c667b", "12aa099011", "c4d711e281", "7c89a0b12f"],
      rigTelemetry: { depthM: 2802.1, sppPsi: 2980, ecdSg: 1.32, flowOutPct: 99.7 },
    },
  },
  {
    id: "rec-6",
    time: "08:00:00 IST",
    user: "admin_system",
    userName: "admin_system",
    userRole: "System Daemon",
    userInitials: "SD",
    action: "SHIFT_HANDOVER",
    targetRef: "SHIFT-T1-T2",
    context: "Automated Tour 1 to Tour 2 handover event. Ingested morning report telemetry parameters.",
    merkleHash: "#12aa09...9011",
    fullProof: {
      blockId: 89100,
      edDsaSig: "304502210012aa090987654321fedcba0987654321fedcba0987654321fedcba09876543",
      merklePath: ["12aa099011", "31d87c667b", "c4d711e281", "7c89a0b12f"],
      rigTelemetry: { depthM: 2790.0, sppPsi: 2950, ecdSg: 1.32, flowOutPct: 100.0 },
    },
  },
];

export default function AuditPage() {
  const { activeWellName } = useGlobalContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [userFilter, setUserFilter] = useState<string>("ALL");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [selectedProof, setSelectedProof] = useState<AuditRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = document.getElementById("auditSearchInput");
        if (input) input.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleVerifyMerkle = () => {
    setIsVerifying(true);
    setVerificationSuccess(false);
    setTimeout(() => {
      setIsVerifying(false);
      setVerificationSuccess(true);
      showToast("Audit Tree Valid: Root 7c89...d091fb72 authenticated");
      setTimeout(() => setVerificationSuccess(false), 3000);
    }, 700);
  };

  const handleExportTrail = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Timestamp,User,Action,TargetRef,Context,MerkleHash\n" +
      AUDIT_DATA.map(
        (r) => `"${r.time}","${r.user}","${r.action}","${r.targetRef}","${r.context}","${r.merkleHash}"`
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Compliance_Audit_Trail_${activeWellName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Audit trail manifest exported (CSV / JSON format)");
  };

  const handleGenerateDgms = () => {
    showToast("Generating Form-IV Subsurface Operations Compliance Logbook (PDF/A statutory format)...");
  };

  const filteredRecords = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return AUDIT_DATA.filter((r) => {
      const matchesQ =
        !q ||
        r.targetRef.toLowerCase().includes(q) ||
        r.user.toLowerCase().includes(q) ||
        r.context.toLowerCase().includes(q) ||
        r.action.toLowerCase().includes(q);
      const matchesAction = actionFilter === "ALL" || r.action === actionFilter;
      const matchesUser = userFilter === "ALL" || r.user === userFilter;
      return matchesQ && matchesAction && matchesUser;
    });
  }, [searchQuery, actionFilter, userFilter]);

  const resetFilters = () => {
    setSearchQuery("");
    setActionFilter("ALL");
    setUserFilter("ALL");
    showToast("Filters reset to default view");
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

      {/* Top Utility Context Bar */}
      <div className="w-full bg-[#e9e8e4] px-6 lg:px-8 py-2 border-b border-[#dbdad6] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#444748]">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0d0d0d] text-white uppercase font-bold tracking-wider text-[10px]">
            SEC-GOV 204
          </span>
          <span className="text-[#1b1c1a] uppercase tracking-wider font-semibold">
            GOVERNANCE & STATUTORY COMPLIANCE // WELLS.INTEL
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#765b00] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#fecf50] inline-block animate-pulse"></span>
            NODE 08-DULIAJAN · SYNCHRONIZED
          </span>
          <span className="text-[#444748] opacity-75">DGMS FORM-IV CIRCULAR COMPLIANT</span>
        </div>
      </div>

      <div className="p-6 lg:p-8 max-w-[1720px] w-full mx-auto space-y-6">
        {/* Hero / Header Section */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-4 border-b border-[#dbdad6]">
          <div className="max-w-4xl space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#765b00] uppercase tracking-widest font-semibold">
              <span className="material-symbols-outlined text-[15px]">verified_user</span>
              <span>Statutory Provenance Engine · Cryptographic Block Registry</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-serif text-[#0d0d0d] tracking-tight font-bold">
              Compliance Audit & Action Attribution Log
            </h1>
            <p className="text-sm font-sans text-[#444748] max-w-3xl pt-1">
              Cryptographically verifiable audit trail of every engineering judgment, model override, hazard
              acknowledgment, What-If simulation, and OCR approval across well {activeWellName}.
            </p>
          </div>

          {/* Action Group */}
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-end">
            <button
              onClick={handleExportTrail}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#efeeea] hover:bg-[#dbdad6] text-[#1b1c1a] transition-colors text-xs font-mono uppercase tracking-wider border border-[#dbdad6] shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">file_download</span>
              <span>Export Trail CSV / JSON</span>
            </button>
            <button
              onClick={handleGenerateDgms}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#efeeea] hover:bg-[#dbdad6] text-[#1b1c1a] transition-colors text-xs font-mono uppercase tracking-wider border border-[#dbdad6] shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">menu_book</span>
              <span>Generate DGMS Statutory Logbook</span>
            </button>
            <button
              onClick={handleVerifyMerkle}
              disabled={isVerifying}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0d0d0d] text-white hover:bg-[#30312e] transition-colors text-xs font-mono uppercase tracking-wider shadow-sm disabled:opacity-75"
            >
              {isVerifying ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                  <span>Computing Hashes...</span>
                </>
              ) : verificationSuccess ? (
                <>
                  <span className="material-symbols-outlined text-[16px] text-[#fecf50]">check_circle</span>
                  <span>Audit Tree Valid</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">lock_clock</span>
                  <span>Verify Merkle Integrity</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Integrity Metric Chips */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#444748] uppercase">
              <span>Active Ledgers</span>
              <span className="material-symbols-outlined text-[16px]">database</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0d0d0d]">1,482</span>
              <span className="text-[11px] font-mono text-[#765b00] font-semibold">+18 Today</span>
            </div>
            <p className="text-[11px] font-mono text-[#747878] mt-1">Zero uncommitted write operations</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#444748] uppercase">
              <span>Hazard Acknowledgments</span>
              <span className="material-symbols-outlined text-[16px]">warning_amber</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0d0d0d]">28</span>
              <span className="text-[11px] font-mono text-[#444748]">100% Attributed</span>
            </div>
            <p className="text-[11px] font-mono text-[#747878] mt-1">Mean MTTA: 42s post-alarm trigger</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#444748] uppercase">
              <span>Simulation Overrides</span>
              <span className="material-symbols-outlined text-[16px]">alt_route</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0d0d0d]">06</span>
              <span className="text-[11px] font-mono text-[#765b00] font-semibold">Dual-Approved</span>
            </div>
            <p className="text-[11px] font-mono text-[#747878] mt-1">All lookahead projections signed</p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#444748] uppercase">
              <span>Ledger Seal Status</span>
              <span className="material-symbols-outlined text-[16px] text-[#765b00]">verified</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#0d0d0d] truncate">ROOT_OK</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#e9e8e4] text-[#1b1c1a] font-semibold">
                SHA-256
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#747878] mt-1 truncate">Root: 7c89...d091fb72</p>
          </div>
        </div>

        {/* Audit Filter Toolbar */}
        <div className="p-4 rounded-xl bg-white border border-[#dbdad6] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[280px] flex-1 sm:flex-initial sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#747878] text-[16px]">
                search
              </span>
              <input
                id="auditSearchInput"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by Ref, User, or context... (⌘K)"
                className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-[#f5f4ef] text-[#1b1c1a] placeholder:text-[#747878] rounded-lg border border-[#dbdad6] outline-none focus:border-[#0d0d0d] transition-all"
              />
            </div>

            {/* Action Type Filter */}
            <div className="relative">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-[#f5f4ef] text-[#1b1c1a] rounded-lg border border-[#dbdad6] text-xs font-mono uppercase tracking-wider outline-none cursor-pointer hover:bg-[#efeeea] transition-colors"
              >
                <option value="ALL">All Actions (128 Records)</option>
                <option value="ACKNOWLEDGE_ALERT">ACKNOWLEDGE_ALERT</option>
                <option value="VALIDATE_DDR_OCR">VALIDATE_DDR_OCR</option>
                <option value="EXECUTE_WHAT_IF">EXECUTE_WHAT_IF</option>
                <option value="PROMOTE_BASELINE">PROMOTE_BASELINE</option>
                <option value="SHIFT_HANDOVER">SHIFT_HANDOVER</option>
                <option value="SHELVE_ALERT">SHELVE_ALERT</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#747878] pointer-events-none text-[16px]">
                expand_more
              </span>
            </div>

            {/* User Filter */}
            <div className="relative">
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-[#f5f4ef] text-[#1b1c1a] rounded-lg border border-[#dbdad6] text-xs font-mono uppercase tracking-wider outline-none cursor-pointer hover:bg-[#efeeea] transition-colors"
              >
                <option value="ALL">All Engineers & Geologists</option>
                <option value="eng_arjun">eng_arjun (RTOC Lead)</option>
                <option value="geol_sarma">geol_sarma (Chief Geologist)</option>
                <option value="driller_deka">driller_deka (Rig Doghouse)</option>
                <option value="admin_system">admin_system (System Daemon)</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-[#747878] pointer-events-none text-[16px]">
                expand_more
              </span>
            </div>
          </div>

          {/* Date Range Selector & Counter */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f4ef] border border-[#dbdad6] rounded-lg text-xs font-mono text-[#1b1c1a] uppercase">
              <span className="material-symbols-outlined text-[15px] text-[#747878]">calendar_today</span>
              <span>Today (Last 24 Hours) · 28 May 2024</span>
            </div>
            <button
              onClick={resetFilters}
              className="p-2 bg-[#f5f4ef] hover:bg-[#efeeea] border border-[#dbdad6] rounded-lg text-[#444748] transition-colors"
              title="Reset View"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
            </button>
          </div>
        </div>

        {/* Master Audit Table */}
        <div className="rounded-2xl overflow-hidden bg-white border border-[#dbdad6] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#f5f4ef] text-[10px] font-mono uppercase tracking-widest text-[#444748] border-b border-[#dbdad6]">
                <tr>
                  <th className="py-3 px-4 w-28">Timestamp</th>
                  <th className="py-3 px-4 w-44">Authenticated User</th>
                  <th className="py-3 px-4 w-44">Action Vector</th>
                  <th className="py-3 px-4 w-36">Target Ref</th>
                  <th className="py-3 px-4 whitespace-normal min-w-[420px]">
                    Engineering Judgment & Telemetry Context
                  </th>
                  <th className="py-3 px-4 text-right w-36">Merkle SHA-256</th>
                  <th className="py-3 px-4 text-center w-16">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dbdad6]/50 text-[#1b1c1a] font-sans">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs font-mono text-[#747878]">
                      No audit events match current query or filter parameters.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f5f4ef] transition-colors">
                      <td className="py-3.5 px-4 text-xs font-mono text-[#444748] tabular-nums">
                        {row.time}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#efeeea] border border-[#dbdad6] flex items-center justify-center text-[10px] font-mono font-bold text-[#0d0d0d]">
                            {row.userInitials}
                          </span>
                          <div>
                            <div className="font-semibold text-[#0d0d0d] font-mono text-xs">{row.userName}</div>
                            <div className="text-[10px] font-mono text-[#747878]">{row.userRole}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                            row.action === "ACKNOWLEDGE_ALERT"
                              ? "bg-[#fecf50] text-[#735800]"
                              : row.action === "PROMOTE_BASELINE"
                              ? "bg-[#efeeea] text-[#0d0d0d]"
                              : row.action === "EXECUTE_WHAT_IF"
                              ? "bg-[#0d0d0d] text-white"
                              : row.action === "VALIDATE_DDR_OCR"
                              ? "bg-[#ffdf95] text-[#251a00]"
                              : "bg-[#e3e2de] text-[#444748]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              row.action === "EXECUTE_WHAT_IF" ? "bg-[#fecf50]" : "bg-current"
                            }`}
                          ></span>
                          {row.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-[#f5f4ef] border border-[#dbdad6] text-[10px] font-mono text-[#0d0d0d] font-bold">
                          {row.targetRef}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-normal max-w-xl text-xs text-[#1b1c1a] leading-relaxed">
                        {row.context}
                      </td>
                      <td className="py-3.5 px-4 text-right text-[11px] font-mono text-[#747878]">
                        {row.merkleHash}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedProof(row)}
                          className="p-1.5 rounded hover:bg-[#efeeea] text-[#444748] hover:text-[#0d0d0d] transition-colors"
                          title="Inspect cryptographic witness proof"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination / Ledger Summary Strip */}
          <div className="bg-[#f5f4ef] px-4 py-2.5 border-t border-[#dbdad6] flex flex-wrap items-center justify-between text-xs font-mono text-[#444748]">
            <div>
              Showing <span className="font-bold text-[#0d0d0d]">{filteredRecords.length}</span> of 128 registered events
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2.5 py-1 rounded bg-white border border-[#dbdad6] text-[#444748] font-semibold opacity-50 cursor-not-allowed">
                Previous
              </button>
              <span className="px-2 font-bold text-[#0d0d0d]">Page 1 of 22</span>
              <button
                onClick={() => showToast("Navigated to next audit ledger block")}
                className="px-2.5 py-1 rounded bg-white hover:bg-[#efeeea] border border-[#dbdad6] text-[#0d0d0d] font-semibold transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Merkle Verification & Ledger Security Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Integrity Details Panel (2 Cols) */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] shadow-sm col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#765b00] text-[20px]">account_tree</span>
                <h3 className="text-base font-bold font-mono text-[#0d0d0d] uppercase tracking-tight">
                  Merkle Tree Ledger Integrity
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#efeeea] text-[10px] font-mono font-bold uppercase text-[#0d0d0d] border border-[#dbdad6]">
                BLOCK #89,142
              </span>
            </div>
            <p className="text-xs font-sans text-[#444748] leading-relaxed">
              Every human action taken within the Real-Time Operations Center (RTOC) or Rig Doghouse generates an
              immutable payload with user public-key signature, WITSML telemetry snapshot, and UTC-coordinated GPS
              location. Blocks are sealed at 60-second intervals and attested to the Nexus Energy statutory archive.
            </p>

            {/* Mini Visual Pipeline */}
            <div className="p-4 rounded-xl bg-[#f5f4ef] border border-[#dbdad6] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e9e8e4] border border-[#dbdad6] flex items-center justify-center text-[#0d0d0d] font-bold font-mono text-sm">
                  01
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#444748]">Action Event</div>
                  <div className="text-xs font-mono font-bold text-[#0d0d0d]">EdDSA Signed</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#747878] hidden md:block">arrow_forward</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#e9e8e4] border border-[#dbdad6] flex items-center justify-center text-[#0d0d0d] font-bold font-mono text-sm">
                  02
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#444748]">Leaf Hash</div>
                  <div className="text-xs font-mono font-bold text-[#0d0d0d]">SHA-256 Digest</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#747878] hidden md:block">arrow_forward</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fecf50] border border-[#fecf50] flex items-center justify-center text-[#735800] font-bold font-mono text-sm">
                  03
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase text-[#765b00] font-bold">Ledger Root</div>
                  <div className="text-xs font-mono font-bold text-[#0d0d0d]">DGMS Verified</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-[#444748] bg-[#efeeea] px-3 py-2 rounded-lg border border-[#dbdad6]">
              <span>MERKLE ROOT: 7c89a0b12f45ea091d3345fe8923a1094892cbe34981</span>
              <span className="text-[#765b00] font-bold uppercase tracking-wider">CONSISTENT</span>
            </div>
          </div>

          {/* Quick Action Summary & Statutory Checklist (1 Col) */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[20px] text-[#0d0d0d]">gavel</span>
                <h3 className="text-base font-bold font-mono text-[#0d0d0d] uppercase tracking-tight">
                  Statutory Checklist
                </h3>
              </div>
              <p className="text-[10px] font-mono text-[#444748] uppercase tracking-wider mb-3">
                Mines Act 1952 · DGMS Technical Circular Compliance
              </p>
              <ul className="space-y-2 text-xs font-sans text-[#1b1c1a]">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#765b00] text-[18px] shrink-0">check_circle</span>
                  <span>All thief zone mitigation orders dual-signed by RTOC Lead</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#765b00] text-[18px] shrink-0">check_circle</span>
                  <span>Lookahead geological baseline changes logged with R² metrics</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#765b00] text-[18px] shrink-0">check_circle</span>
                  <span>Mud weight adjustments reconciled against fracture gradient</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[#765b00] text-[18px] shrink-0">check_circle</span>
                  <span>Shift handover telemetry verified with zero data drift</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 bg-[#f5f4ef] border border-[#dbdad6] p-3 rounded-xl text-xs font-mono">
              <div className="flex items-center justify-between text-[#444748] uppercase">
                <span>Next Scheduled Attestation</span>
                <span className="text-[#0d0d0d] font-bold">18:00 IST</span>
              </div>
              <div className="w-full bg-[#e9e8e4] h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-[#fecf50] h-full w-3/4"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Integrity Footer */}
        <div className="p-4 rounded-xl bg-[#e9e8e4] border border-[#dbdad6] flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono text-[#1b1c1a]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#fecf50] animate-pulse"></span>
            <span className="font-bold tracking-wider uppercase">
              SHA-256 LEDGER CONSISTENT · 1,482 AUDIT TRANSACTIONS VERIFIED
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#444748] text-[11px]">
            <span>LAST SYNC: 14:22:08 UTC</span>
            <span>LATENCY: 12ms</span>
            <span className="text-[#0d0d0d] font-bold">SEC-SYS OIL-INDIA-PROD-01</span>
          </div>
        </div>
      </div>

      {/* Cryptographic Witness Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-[#dbdad6] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#dbdad6]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#765b00]">verified</span>
                <h3 className="text-sm font-bold font-mono text-[#0d0d0d] uppercase">
                  Cryptographic Witness Proof
                </h3>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded-full hover:bg-[#efeeea] text-[#444748] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#f5f4ef] rounded-lg border border-[#dbdad6] space-y-1">
                <div className="text-[10px] text-[#747878] uppercase">ACTION VECTOR & TARGET</div>
                <div className="font-bold text-[#0d0d0d]">
                  {selectedProof.action} · {selectedProof.targetRef}
                </div>
                <div className="text-[#444748] text-[11px] pt-1">{selectedProof.context}</div>
              </div>

              <div>
                <div className="text-[10px] text-[#747878] uppercase mb-1">EdDSA Public-Key Signature</div>
                <div className="p-2 bg-[#efeeea] rounded text-[10px] break-all font-mono text-[#1b1c1a]">
                  {selectedProof.fullProof?.edDsaSig}
                </div>
              </div>

              <div>
                <div className="text-[10px] text-[#747878] uppercase mb-1">Merkle Tree Authentication Path</div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedProof.fullProof?.merklePath.map((hash, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[#f5f4ef] border border-[#dbdad6] text-[10px] text-[#0d0d0d] font-semibold"
                    >
                      Node #{i}: {hash}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProof.fullProof?.rigTelemetry && (
                <div className="pt-2 border-t border-[#dbdad6]">
                  <div className="text-[10px] text-[#747878] uppercase mb-1.5">
                    Attested Rig Telemetry Snapshot
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                    <div className="p-1.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                      <span className="text-[#747878] block">DEPTH</span>
                      <span className="font-bold text-[#0d0d0d]">
                        {selectedProof.fullProof.rigTelemetry.depthM} m
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                      <span className="text-[#747878] block">SPP</span>
                      <span className="font-bold text-[#0d0d0d]">
                        {selectedProof.fullProof.rigTelemetry.sppPsi} psi
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                      <span className="text-[#747878] block">ECD</span>
                      <span className="font-bold text-[#0d0d0d]">
                        {selectedProof.fullProof.rigTelemetry.ecdSg} SG
                      </span>
                    </div>
                    <div className="p-1.5 rounded bg-[#f5f4ef] border border-[#dbdad6]">
                      <span className="text-[#747878] block">FLOW</span>
                      <span className="font-bold text-[#0d0d0d]">
                        {selectedProof.fullProof.rigTelemetry.flowOutPct}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#dbdad6] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#765b00] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Attested to Nexus Energy DGMS Archive
              </span>
              <button
                onClick={() => {
                  showToast("Certificate bundle downloaded with SHA-256 seal");
                  setSelectedProof(null);
                }}
                className="px-4 py-1.5 rounded-full bg-[#0d0d0d] text-white text-xs font-mono uppercase tracking-wider font-semibold hover:bg-[#30312e] transition-colors"
              >
                Download Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
