/**
 * Page 14: Morning Report & Offset Review PDF Generator (/reports)
 */
"use client";

import { useState } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

const REPORT_TYPES = [
  "Daily Morning Drilling Report (DDR)",
  "Shift Handover Summary",
  "Offset Well Analogue Review",
  "NPT & AFE Cost Summary",
];

const REPORT_SECTIONS = [
  { id: "ops",      label: "24-Hour Operations Summary & Depth Progress",  default: true },
  { id: "rig",      label: "Active Rig State & Telemetry Highlights",      default: true },
  { id: "hazards",  label: "Lookahead Hazard Advisories (Next 200m)",      default: true },
  { id: "mud",      label: "Active Mud Properties & ECD Margin Summary",   default: true },
  { id: "offsets",  label: "Offset Well Analogue Citations (NH-04, NH-07)",default: true },
  { id: "alerts",   label: "Open Alert Acknowledgements & Handover Notes", default: true },
  { id: "npt",      label: "NPT Cause Breakdown & AFE Cost Incurred",      default: false },
  { id: "logs",     label: "MWD Gamma Ray & MSE Log Snapshot",             default: false },
];

export default function ReportsPage() {
  const ctx = useGlobalContext();
  const [reportType, setReportType] = useState(REPORT_TYPES[0]);
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(REPORT_SECTIONS.map((s) => [s.id, s.default]))
  );
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleSection = (id: string) =>
    setSelectedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const selectedCount = Object.values(selectedSections).filter(Boolean).length;
  const now = new Date();
  const shift = now.getHours() >= 6 && now.getHours() < 18 ? "Tour 1 (06:00 – 18:00)" : "Tour 2 (18:00 – 06:00)";

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1200px" }}>
      <div>
        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
          REPORT GENERATOR
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", margin: "4px 0 0" }}>
          Active Well: {ctx.activeWellName} · Shift: {shift}
        </p>
      </div>

      {/* Report type selector */}
      <Panel state="ready" style={{ padding: "14px 16px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Report Type
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {REPORT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setReportType(t)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.68rem",
                color: reportType === t ? "#f8fafc" : "#94a3b8",
                background: reportType === t ? "#1c253b" : "transparent",
                border: reportType === t ? "1px solid #3b82f6" : "1px solid #2a3654",
                borderRadius: "3px",
                padding: "6px 12px",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              {reportType === t && "▸ "}{t}
            </button>
          ))}
        </div>
      </Panel>

      {/* Section selector */}
      <Panel state="ready" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Select Report Sections to Include ({selectedCount}/{REPORT_SECTIONS.length})
          </div>
          <button
            onClick={() =>
              setSelectedSections(Object.fromEntries(REPORT_SECTIONS.map((s) => [s.id, true])))
            }
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#3b82f6", background: "none", border: "none", cursor: "pointer" }}
          >
            Select All
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          {REPORT_SECTIONS.map((s) => (
            <label
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                padding: "8px 10px",
                borderRadius: "3px",
                background: selectedSections[s.id] ? "rgba(59,130,246,0.08)" : "transparent",
                border: selectedSections[s.id] ? "1px solid rgba(59,130,246,0.2)" : "1px solid transparent",
                transition: "all 0.12s",
              }}
            >
              <input
                type="checkbox"
                checked={selectedSections[s.id]}
                onChange={() => toggleSection(s.id)}
                style={{ accentColor: "#3b82f6", width: "13px", height: "13px" }}
              />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: selectedSections[s.id] ? "#f8fafc" : "#94a3b8" }}>
                {s.label}
              </span>
            </label>
          ))}
        </div>
      </Panel>

      {/* Actions */}
      <Panel state="ready" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={handleGenerate}
            disabled={generating || selectedCount === 0}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "#0b0f19",
              background: generating ? "#64748b" : "#10b981",
              border: "none",
              borderRadius: "4px",
              padding: "10px 20px",
              cursor: generating || selectedCount === 0 ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {generating ? "⟳ Generating..." : "⬇ Generate PDF Morning Report"}
          </button>
          <button style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#3b82f6", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "3px", padding: "8px 14px", cursor: "pointer" }}>
            ✉ Email to Rig Superintendent
          </button>
          <button style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#94a3b8", background: "#1c253b", border: "1px solid #2a3654", borderRadius: "3px", padding: "8px 14px", cursor: "pointer" }}>
            ⬇ Download PNG Summary Cards
          </button>
        </div>

        {generated && (
          <div style={{ marginTop: "12px" }}>
            <StatusBadge level="nominal" label="DDR_OIL-NH-12_2026-09-30_Tour1.pdf generated — 4.2 MB · 8 pages" />
          </div>
        )}
      </Panel>
    </div>
  );
}
