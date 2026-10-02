"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepthShort } from "@/lib/units";

interface ShapDriver {
  name: string;
  value: number;
  isNegative?: boolean;
}

interface Hazard {
  id: string;
  code: string;
  title: string;
  severity: "critical" | "warning" | "advisory";
  status: "active" | "acknowledged";
  depthM: number;
  deltaM: number;
  formation: string;
  probability: number;
  remediationTitle: string;
  remediationDoc: string;
  remediationText: string;
  baseLogOdds: string;
  shapDrivers: ShapDriver[];
}

const INITIAL_HAZARDS: Hazard[] = [
  {
    id: "h1",
    code: "HZD-084-ML",
    title: "Severe Mud Loss / Thief Zone",
    severity: "critical",
    status: "active",
    depthM: 2912,
    deltaM: 61.8,
    formation: "Tipam Lower / Barail Transition",
    probability: 78,
    remediationTitle: "Recommended Historical Remediation",
    remediationDoc: "DDR NH-04 · p.42",
    remediationText:
      "Premix 20 m³ coarse LCM pill on pit 4; cap circulating ECD ≤ 1.32 SG before entering sand top. Offset NH-04 experienced total loss of returns (45 m³ lost) at this exact horizon.",
    baseLogOdds: "+1.42",
    shapDrivers: [
      { name: "Proximity to Fault F-14", value: 0.34 },
      { name: "Sonic Delta-t divergence", value: 0.22 },
      { name: "ROP acceleration anomaly", value: 0.18 },
      { name: "Mud weight hydrostatic head", value: 0.08, isNegative: true },
    ],
  },
  {
    id: "h2",
    code: "HZD-089-GK",
    title: "High-Pressure Gas Influx / Kick",
    severity: "critical",
    status: "active",
    depthM: 2985,
    deltaM: 134.8,
    formation: "Barail Basal Sand",
    probability: 74,
    remediationTitle: "Recommended Historical Remediation",
    remediationDoc: "WCR NH-07 · p.18",
    remediationText:
      "Weight mud to 1.34 SG with barite prior to drilling break. Offset NH-07 recorded 2.4% gas influx and 320 psi SIDPP upon penetrating top Barail Basal Sand.",
    baseLogOdds: "+1.28",
    shapDrivers: [
      { name: "Offset Overpressure Gradient", value: 0.38 },
      { name: "D-exponent undercompaction", value: 0.21 },
      { name: "Lithological Pore Throat Index", value: 0.13 },
      { name: "Annular Flowrate stability", value: 0.05, isNegative: true },
    ],
  },
  {
    id: "h3",
    code: "HZD-076-DS",
    title: "Differential Sticking Risk",
    severity: "warning",
    status: "active",
    depthM: 2875,
    deltaM: 24.8,
    formation: "Permeable Arenaceous Sand",
    probability: 54,
    remediationTitle: "Recommended Historical Remediation",
    remediationDoc: "DDR NH-04 · p.28",
    remediationText:
      "Limit stationary connections to < 90s; maintain pipe rotation ≥ 60 RPM. High overbalance of 0.18 SG with high filter cake thickness observed on nearby offset well log.",
    baseLogOdds: "+0.62",
    shapDrivers: [
      { name: "Formation Permeability Proxy", value: 0.28 },
      { name: "Overbalance Delta-P (Hydrostatic)", value: 0.22 },
      { name: "Drillstring Standstill Interval", value: 0.12 },
    ],
  },
  {
    id: "h4",
    code: "HZD-092-SS",
    title: "Severe Torsional Stick-Slip & Bit Bounce",
    severity: "warning",
    status: "acknowledged",
    depthM: 2940,
    deltaM: 89.8,
    formation: "Interbedded Hard Siltstone Stringer",
    probability: 48,
    remediationTitle: "Recommended Historical Remediation",
    remediationDoc: "NH-09 LAS Log · p.12",
    remediationText:
      "Engage SoftTorque system; limit WOB to ≤ 12 tonnes; optimize rotary speed at 135 RPM to bypass critical harmonic torsional resonance frequency.",
    baseLogOdds: "+0.45",
    shapDrivers: [
      { name: "UCS Lithology Contrast (Sand-Chert)", value: 0.29 },
      { name: "BHA Resonant Frequency Match", value: 0.19 },
      { name: "Bit Wear Index (PDC Dullness)", value: 0.09 },
    ],
  },
  {
    id: "h5",
    code: "HZD-095-SP",
    title: "Micro-Fractured Shale Spalling",
    severity: "warning",
    status: "active",
    depthM: 2965,
    deltaM: 114.8,
    formation: "Tipam Intercalated Claystone",
    probability: 42,
    remediationTitle: "Recommended Historical Remediation",
    remediationDoc: "DDR NH-07 · p.33",
    remediationText:
      "Maintain active polymer concentration; run high-viscosity pill sweeps every 30m drilled to prevent cuttings bedding and cavings accumulation.",
    baseLogOdds: "+0.38",
    shapDrivers: [
      { name: "Clay Hydration Index", value: 0.24 },
      { name: "Borehole Stress Anisotropy", value: 0.16 },
      { name: "Circulation Annular Velocity", value: 0.08 },
    ],
  },
  {
    id: "h6",
    code: "HZD-101-BW",
    title: "Thermal Degradation & Cutter Spalling",
    severity: "advisory",
    status: "acknowledged",
    depthM: 3010,
    deltaM: 159.8,
    formation: "Deep Barail Quartzite",
    probability: 28,
    remediationTitle: "Recommended Historical Remediation",
    remediationDoc: "Bit Record OIL-NH-04",
    remediationText:
      "Monitor flowline temperature; trip for PDC cutter inspection if ROP drops below 6 m/hr with steady surface torque.",
    baseLogOdds: "-0.15",
    shapDrivers: [
      { name: "Bottomhole Static Temperature", value: 0.18 },
      { name: "Quartz Content (XRD)", value: 0.14 },
    ],
  },
];

export default function AdvisoryPage() {
  const { unitSystem } = useGlobalContext();
  const [hazards, setHazards] = useState<Hazard[]>(INITIAL_HAZARDS);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [activePdfModal, setActivePdfModal] = useState<string | null>(null);

  const toggleAcknowledge = (id: string) => {
    setHazards((prev) =>
      prev.map((h) =>
        h.id === id
          ? {
              ...h,
              status: h.status === "active" ? "acknowledged" : "active",
            }
          : h
      )
    );
  };

  const filteredHazards = hazards.filter((h) => {
    if (filter === "critical" && h.severity !== "critical") return false;
    if (filter === "warning" && h.severity !== "warning") return false;
    if (filter === "advisory" && h.severity !== "advisory") return false;
    if (filter === "active" && h.status !== "active") return false;
    if (filter === "acknowledged" && h.status !== "acknowledged") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        h.title.toLowerCase().includes(q) ||
        h.formation.toLowerCase().includes(q) ||
        h.remediationText.toLowerCase().includes(q) ||
        h.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const criticalCount = hazards.filter((h) => h.severity === "critical").length;
  const warningCount = hazards.filter((h) => h.severity === "warning").length;
  const advisoryCount = hazards.filter((h) => h.severity === "advisory").length;
  const activeCount = hazards.filter((h) => h.status === "active").length;
  const ackCount = hazards.filter((h) => h.status === "acknowledged").length;

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      <div className="p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">
        {/* Editorial Header Stage */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#dbdad6]">
          <div className="space-y-1 max-w-4xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono uppercase tracking-wider text-[#444748] border border-[#dbdad6]">
                eRTMAC-NWIS · SECTOR 04
              </span>
              <span className="text-[10px] font-mono text-[#444748]">/</span>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold uppercase tracking-wider">
                MODULE 06 : SUB-SURFACE ADVISORY
              </span>
              <span className="text-[10px] font-mono text-[#444748]">/</span>
              <span className="text-[10px] font-mono text-[#444748] uppercase">
                BIT DEPTH: {fmtDepthShort(2850.2, unitSystem)} TVDSS
              </span>
            </div>
            <h1 className="font-serif text-[34px] font-bold text-[#0d0d0d] tracking-tight leading-none">
              Lookahead Hazard Advisory
            </h1>
            <p className="text-[14px] text-[#444748] max-w-3xl">
              ISA-18.2 Alarm Rationalization &amp; Model 3 Explainable AI (SHAP) Subsurface Risk Horizons
            </p>
          </div>

          {/* Telemetry Stamp & Rig Micro-Status */}
          <div className="flex items-center gap-4 bg-[#f5f4ef] border border-[#dbdad6] p-3.5 rounded-xl self-start lg:self-auto shadow-sm">
            <div className="flex flex-col text-right">
              <span className="text-[9px] font-mono text-[#444748] uppercase tracking-wider">
                PROGNOSTIC CONFIDENCE
              </span>
              <span className="font-serif text-[20px] font-bold text-[#0d0d0d]">
                94.8% · SHAP v3.1
              </span>
            </div>
            <div className="w-10 h-10 rounded-lg bg-[#e9e8e4] flex items-center justify-center text-[#0d0d0d]">
              <span className="material-symbols-outlined text-[20px]">analytics</span>
            </div>
          </div>
        </header>

        {/* Elevated Critical Alert Notification Banner */}
        <div className="bg-[#e9e8e4] border border-[#dbdad6] p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#ba1a1a]"></div>
          <div className="flex items-start md:items-center gap-4 pl-1">
            <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#93000a] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">emergency_home</span>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#ba1a1a]">
                  ALARM CONDITION ACTIVE
                </span>
                <span className="text-[10px] font-mono text-[#444748]">· ISA-18.2 PRIORITY LEVEL 1</span>
              </div>
              <p className="text-[13px] text-[#0d0d0d] font-semibold">
                {criticalCount} Critical Hazards detected within 100m lookahead window on active bit ({fmtDepthShort(2850.2, unitSystem)} TVDSS). Immediate offset mitigation protocol required for Barail Sandstone boundary.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <a
              href="#cards-stage"
              className="px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 hover:opacity-90 transition-opacity"
            >
              <span>Review Lookahead</span>
              <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
            </a>
          </div>
        </div>

        {/* Filter Control Strip & Tabular Search Ribbon */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#f5f4ef] border border-[#dbdad6] p-2 rounded-xl">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            {[
              { id: "all", label: `All (${hazards.length})` },
              { id: "critical", label: `Critical (${criticalCount})` },
              { id: "warning", label: `Warning (${warningCount})` },
              { id: "advisory", label: `Advisory (${advisoryCount})` },
              { id: "active", label: `Active (${activeCount})` },
              { id: "acknowledged", label: `Acknowledged (${ackCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono uppercase tracking-wider transition-colors shrink-0 ${
                  filter === f.id
                    ? "bg-[#0d0d0d] text-white font-semibold"
                    : "bg-white text-[#0d0d0d] hover:bg-[#efeeea] border border-[#dbdad6]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#444748]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search horizon, fault, mud..."
                className="w-full bg-white text-[#0d0d0d] placeholder:text-[#444748]/60 text-[12px] font-mono pl-9 pr-3 py-1.5 rounded-lg border border-[#dbdad6] focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-[#dbdad6] px-3 py-1.5 rounded-lg shrink-0 text-[11px] font-mono">
              <span className="text-[#444748] uppercase">SORT:</span>
              <span className="text-[#0d0d0d] font-semibold">Severity (Desc)</span>
            </div>
          </div>
        </div>

        {/* Primary Lookahead Section */}
        <div className="space-y-5" id="cards-stage">
          {/* Stratigraphic Lookahead Horizon Tracker Graphic */}
          <div className="bg-white border border-[#dbdad6] p-4 rounded-xl space-y-2 shadow-sm">
            <div className="flex items-center justify-between text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              <span>LOOKAHEAD SPAN: {fmtDepthShort(2850.2, unitSystem)} — {fmtDepthShort(3050.0, unitSystem)} TVDSS</span>
              <span className="text-[#765b00] font-semibold">12-1/4&quot; INTERMEDIATE CASING SECTION TARGET</span>
            </div>

            {/* Horizon Scale Graphic */}
            <div className="w-full bg-[#f5f4ef] h-10 rounded-lg p-1 relative flex items-center overflow-hidden border border-[#dbdad6]">
              <div className="absolute left-[0%] w-1.5 h-full bg-[#0d0d0d] rounded-full z-20"></div>
              <span className="absolute left-2 text-[10px] font-mono font-bold text-[#0d0d0d] z-20 bg-white/90 border border-[#dbdad6] px-1.5 py-0.5 rounded shadow-sm">
                BIT: {fmtDepthShort(2850.2, unitSystem)}
              </span>

              {/* Hazard markers */}
              <div className="absolute left-[12.4%] h-full w-28 bg-[#ffdf95]/60 rounded flex items-center px-1.5 border-l-2 border-[#765b00]">
                <span className="text-[9px] font-mono text-[#594400] truncate font-semibold">STICKING 2875m</span>
              </div>
              <div className="absolute left-[30.9%] h-full w-28 bg-[#ffdad6]/80 rounded flex items-center px-1.5 border-l-2 border-[#ba1a1a]">
                <span className="text-[9px] font-mono text-[#93000a] truncate font-bold">MUD LOSS 2912m</span>
              </div>
              <div className="absolute left-[44.9%] h-full w-28 bg-[#ffdf95]/60 rounded flex items-center px-1.5 border-l-2 border-[#765b00]">
                <span className="text-[9px] font-mono text-[#594400] truncate font-semibold">STICK-SLIP 2940m</span>
              </div>
              <div className="absolute left-[67.4%] h-full w-28 bg-[#ffdad6]/80 rounded flex items-center px-1.5 border-l-2 border-[#ba1a1a]">
                <span className="text-[9px] font-mono text-[#93000a] truncate font-bold">GAS KICK 2985m</span>
              </div>
            </div>
          </div>

          {/* 2-Column Hazard Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {filteredHazards.map((h) => {
              const isCrit = h.severity === "critical";
              const isWarn = h.severity === "warning";
              const isAck = h.status === "acknowledged";

              return (
                <div
                  key={h.id}
                  className="bg-white border border-[#dbdad6] rounded-xl p-5 space-y-4 shadow-sm relative flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                              isCrit
                                ? "bg-[#ba1a1a] text-white"
                                : isWarn
                                ? "bg-[#fecf50] text-[#735800]"
                                : "bg-[#e9e8e4] text-[#0d0d0d]"
                            }`}
                          >
                            {isCrit ? "CRITICAL HAZARD" : isWarn ? "WARNING ADVISORY" : "MONITORING"}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              isAck
                                ? "bg-[#e9e8e4] text-[#444748]"
                                : "bg-[#f5f4ef] border border-[#dbdad6] text-[#0d0d0d]"
                            }`}
                          >
                            {isAck ? "ACKNOWLEDGED" : "ACTIVE · LEVEL 1"}
                          </span>
                          <span className="text-[10px] font-mono text-[#444748]">
                            ID: {h.code}
                          </span>
                        </div>
                        <h3 className="font-serif text-[24px] font-bold text-[#0d0d0d] pt-1">
                          {h.title}
                        </h3>
                        <div className="text-[11px] font-mono text-[#444748] flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#0d0d0d]">
                            @ {fmtDepthShort(h.depthM, unitSystem)} TVDSS
                          </span>
                          <span>({fmtDepthShort(h.deltaM, unitSystem)} ahead)</span>
                          <span>·</span>
                          <span className="px-1.5 py-0.5 rounded bg-[#f5f4ef] border border-[#dbdad6] text-[#0d0d0d]">
                            {h.formation}
                          </span>
                        </div>
                      </div>

                      {/* Probability Gauge */}
                      <div className="bg-[#f5f4ef] border border-[#dbdad6] p-2.5 rounded-xl flex flex-col items-center shrink-0 w-28 text-center">
                        <span className="text-[9px] font-mono uppercase text-[#444748] tracking-wider">
                          PROBABILITY
                        </span>
                        <span
                          className={`font-serif text-[28px] font-bold leading-none my-1 ${
                            isCrit ? "text-[#ba1a1a]" : "text-[#765b00]"
                          }`}
                        >
                          {h.probability}%
                        </span>
                        <div className="w-full bg-[#dbdad6] h-1.5 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full rounded-full ${
                              isCrit ? "bg-[#ba1a1a]" : "bg-[#765b00]"
                            }`}
                            style={{ width: `${h.probability}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Historical Remediation Advisory Box */}
                    <div className="bg-[#f5f4ef] border border-[#dbdad6] p-3.5 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#0d0d0d] font-bold flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#765b00]">
                            verified_user
                          </span>
                          {h.remediationTitle}
                        </span>
                        <button
                          onClick={() => setActivePdfModal(h.remediationDoc)}
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white border border-[#dbdad6] text-[#0d0d0d] hover:bg-[#e9e8e4]"
                        >
                          [ {h.remediationDoc} ]
                        </button>
                      </div>
                      <p className="text-[12px] text-[#0d0d0d] leading-relaxed">
                        {h.remediationText}
                      </p>
                    </div>

                    {/* SHAP Explainable AI Feature Drivers */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                        <span>MODEL 3 EXPLAINABLE AI · SHAP FEATURE ATTRIBUTION</span>
                        <span>BASE LOG ODDS: {h.baseLogOdds}</span>
                      </div>
                      <div className="bg-[#f5f4ef] border border-[#dbdad6] p-2.5 rounded-xl space-y-2">
                        {h.shapDrivers.map((driver, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-[#0d0d0d]">{driver.name}</span>
                            <div className="flex items-center gap-2 w-48">
                              <div className="w-full bg-[#dbdad6] h-2 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    driver.isNegative ? "bg-[#858383]" : "bg-[#0d0d0d]"
                                  }`}
                                  style={{ width: `${Math.abs(driver.value) * 150}%` }}
                                />
                              </div>
                              <span
                                className={`text-[10px] font-mono font-bold w-12 text-right ${
                                  driver.isNegative ? "text-[#858383]" : "text-[#0d0d0d]"
                                }`}
                              >
                                {driver.isNegative ? `-${driver.value}` : `+${driver.value}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Ribbon */}
                  <div className="pt-3 border-t border-[#dbdad6] flex items-center justify-between flex-wrap gap-2">
                    <button
                      onClick={() => toggleAcknowledge(h.id)}
                      className={`px-4 py-2 rounded-full text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                        isAck
                          ? "bg-[#e9e8e4] text-[#444748] border border-[#dbdad6]"
                          : "bg-[#0d0d0d] text-white hover:opacity-90 shadow-sm font-semibold"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        {isAck ? "check_circle" : "done"}
                      </span>
                      <span>{isAck ? "Acknowledged" : "Acknowledge Hazard"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/correlation"
                        className="px-3 py-1.5 rounded-full bg-[#f5f4ef] border border-[#dbdad6] text-[#0d0d0d] text-[11px] font-mono uppercase tracking-wider flex items-center gap-1 hover:bg-[#e9e8e4] transition-colors"
                      >
                        <span>Jump to Correlation (03)</span>
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </Link>
                      <button
                        onClick={() => setActivePdfModal(h.remediationDoc)}
                        className="p-2 rounded-full bg-[#f5f4ef] border border-[#dbdad6] text-[#0d0d0d] hover:bg-[#e9e8e4] transition-colors"
                        title="View PDF Evidence"
                      >
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal for PDF Evidence */}
        {activePdfModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#dbdad6] shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#dbdad6] pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-[#0d0d0d]">picture_as_pdf</span>
                  <h3 className="font-serif text-[18px] font-bold text-[#0d0d0d]">
                    Archival Provenance Viewer
                  </h3>
                </div>
                <button
                  onClick={() => setActivePdfModal(null)}
                  className="text-[#444748] hover:text-[#0d0d0d] text-[18px]"
                >
                  ✕
                </button>
              </div>

              <div className="bg-[#f5f4ef] p-4 rounded-xl border border-[#dbdad6] space-y-2 text-[12px] font-mono">
                <div className="text-[10px] uppercase text-[#765b00] font-bold">DOCUMENT RECORD:</div>
                <div className="font-bold text-[#0d0d0d] text-[14px]">{activePdfModal}</div>
                <p className="text-[#444748] leading-relaxed pt-2 border-t border-[#dbdad6]">
                  Verified E-Archive record ingested via OCR extraction pipeline. Matches historical mud loss incident on Rig SE-802 drilling campaign.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActivePdfModal(null)}
                  className="px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider font-semibold"
                >
                  Close Document
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
