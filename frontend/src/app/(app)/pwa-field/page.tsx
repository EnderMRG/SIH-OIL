/**
 * Doghouse Offline Field PWA (/pwa-field)
 * Optimized for mobile viewport & offline rig site operations
 * Architectural Subsurface Editorial styling
 */
"use client";

import { useState, useEffect } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepth, fmtDepthShort } from "@/lib/units";

const HAZARDS = [
  { class: "Lost Circulation", prob: 78, color: "#ba1a1a", depth: 2910, formation: "Barail Group" },
  { class: "Overpressure", prob: 52, color: "#765b00", depth: 2950, formation: "Barail Group" },
  { class: "Gas Kick", prob: 35, color: "#765b00", depth: 2900, formation: "Barail Group" },
];

export default function PwaFieldPage() {
  const { unitSystem, activeWellName } = useGlobalContext();
  const [tvdss, setTvdss] = useState(2850.2);
  const [rigState] = useState("DRILLING_ROTARY");
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setTvdss((d) => parseFloat((d + 0.0024).toFixed(2)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[440px] mx-auto min-h-screen bg-[#faf9f5] border-x border-[#dbdad6] pb-10 text-[#1b1c1a] font-sans">
      {/* Offline/Online Banner */}
      <div
        className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono transition-colors ${
          isOnline
            ? "bg-[#e9e8e4] border-[#dbdad6] text-[#1b1c1a]"
            : "bg-[#ffdad6] border-[#ba1a1a] text-[#ba1a1a]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-[#fecf50] animate-pulse" : "bg-[#ba1a1a]"
            }`}
          />
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            {isOnline ? "RIG SE-802 · CONNECTED" : "OFFLINE — CACHED DATA"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#444748]">
          <span className="material-symbols-outlined text-[14px]">schedule</span>
          <span>{lastSync}</span>
        </div>
      </div>

      {/* Active Depth Header Card */}
      <div className="m-4 p-5 rounded-2xl bg-white border border-[#dbdad6] shadow-sm space-y-2 border-l-4 border-l-[#0d0d0d]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
            Active Depth (TVDSS) · {activeWellName}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[#fecf50]/30 text-[#765b00] text-[10px] font-mono font-bold uppercase">
            1 Hz Stream
          </span>
        </div>
        <div className="text-4xl font-serif font-bold text-[#0d0d0d] tracking-tight leading-none">
          {fmtDepth(tvdss, unitSystem)}
        </div>
        <div className="flex items-center gap-2 pt-1">
          <span className="px-2 py-0.5 rounded bg-[#efeeea] border border-[#dbdad6] text-[10px] font-mono font-semibold uppercase text-[#0d0d0d]">
            {rigState.replace(/_/g, " ")}
          </span>
          <span className="text-xs font-mono text-[#444748]">FM: Barail Group</span>
        </div>
      </div>

      {/* Hazard Barometer */}
      <div className="mx-4 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0d0d0d]">
            Next 100 m Hazard Barometer
          </span>
          <span className="text-[10px] font-mono text-[#765b00] font-semibold">ISA-18.2</span>
        </div>

        <div className="space-y-2.5">
          {HAZARDS.map((h) => {
            const acked = acknowledged.has(h.class);
            return (
              <div
                key={h.class}
                className={`p-3.5 rounded-xl bg-white border transition-all ${
                  acked
                    ? "border-[#dbdad6] opacity-60"
                    : h.prob >= 65
                    ? "border-[#ba1a1a] shadow-sm"
                    : "border-[#dbdad6] shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div
                      className={`text-sm font-mono font-bold ${
                        acked ? "text-[#747878]" : h.prob >= 65 ? "text-[#ba1a1a]" : "text-[#765b00]"
                      }`}
                    >
                      {h.class}
                    </div>
                    <div className="text-[11px] font-mono text-[#444748]">
                      {fmtDepthShort(h.depth, unitSystem)} TVDSS · {h.formation}
                    </div>
                  </div>
                  <div
                    className={`text-xl font-serif font-bold ${
                      acked ? "text-[#747878]" : h.prob >= 65 ? "text-[#ba1a1a]" : "text-[#765b00]"
                    }`}
                  >
                    {h.prob}%
                  </div>
                </div>

                <div className="h-1.5 w-full rounded-full bg-[#efeeea] overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${h.prob}%`,
                      backgroundColor: acked ? "#747878" : h.prob >= 65 ? "#ba1a1a" : "#765b00",
                    }}
                  />
                </div>

                {!acked ? (
                  <button
                    onClick={() => setAcknowledged((prev) => new Set([...prev, h.class]))}
                    className="w-full py-2 px-3 rounded-lg bg-[#0d0d0d] hover:bg-[#30312e] text-white text-xs font-mono uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#fecf50]">warning</span>
                    Acknowledge Hazard
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-[#765b00] font-semibold py-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>Attributed & Acknowledged</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Offline Offset Summary */}
      <div className="mx-4 p-4 rounded-2xl bg-white border border-[#dbdad6] shadow-sm space-y-2">
        <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0d0d0d]">
          Offline Offset Summary (NH-04, Barail)
        </div>
        <div className="pt-2 border-t border-[#dbdad6] space-y-2 text-xs font-mono">
          <div className="flex justify-between text-[#444748]">
            <span>Intermediate Casing Shoe</span>
            <span className="font-bold text-[#0d0d0d]">{fmtDepthShort(1800, unitSystem)}</span>
          </div>
          <div className="flex justify-between text-[#444748]">
            <span>Mud Loss Pill Recipe</span>
            <span className="font-bold text-[#765b00]">40 ppb CaCO3 Blend</span>
          </div>
          <div className="flex justify-between text-[#444748]">
            <span>LOT EMW at Shoe</span>
            <span className="font-bold text-[#0d0d0d]">1.58 SG (13.18 ppg)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
