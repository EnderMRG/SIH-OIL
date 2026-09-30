/**
 * Page 10: Master Well File 360° View (/well/[id])
 * Single lookup page for any well referenced in map, curtain, or alert citations.
 */
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Panel, StatusBadge, FactCard, CitationChip } from "@/components/ui/StatusComponents";

const MOCK_WELLS: Record<string, WellData> = {
  "NH-04": {
    name: "OIL-NH-04", field: "Digboi", status: "Completed (2021)",
    totalDepthTVDSS: 3420, maxInclination: 24, profile: "Deviated",
    casings: [
      { type: "Conductor",    depthTVDSS: 50,   odIn: 20,    idIn: 19.25, lotSg: null },
      { type: "Surface",      depthTVDSS: 850,  odIn: 13.375,idIn: 12.415,lotSg: 1.52 },
      { type: "Intermediate", depthTVDSS: 2150, odIn: 9.625, idIn: 8.835, lotSg: 1.45 },
      { type: "Prod. Liner",  depthTVDSS: 3420, odIn: 7,     idIn: 6.184, lotSg: null },
    ],
    events: [
      { date: "2021-04-12", depthTVDSS: 2915, type: "Lost_Circulation", severity: "Severe",
        details: "Lost Circulation — 45m³ mud lost in Barail sandstone, resolved with 40 ppb CaCO3 pill.",
        nptHrs: 4.2, outcome: "Successful", doc: "DDR_OIL_NH04_Phase2.pdf", page: 42 },
      { date: "2021-03-28", depthTVDSS: 2640, type: "Gas_Kick",          severity: "Moderate",
        details: "Gas Kick — 1.4m³ influx at Barail top, circulated out safely. MW increased 0.04 SG.",
        nptHrs: 2.5, outcome: "Successful", doc: "DDR_OIL_NH04_Phase1.pdf", page: 61 },
      { date: "2021-02-15", depthTVDSS: 1430, type: "Stuck_Pipe",        severity: "Minor",
        details: "Momentary packoff in Tipam Sandstone. Picked up 5t overpull, free in 20 min.",
        nptHrs: 0.5, outcome: "Successful", doc: "DDR_OIL_NH04_Phase1.pdf", page: 18 },
    ],
    documents: [
      { name: "DDR_OIL_NH04_Phase1.pdf", type: "DDR", pages: 120, year: 2021 },
      { name: "DDR_OIL_NH04_Phase2.pdf", type: "DDR", pages: 88,  year: 2021 },
      { name: "NH04_Completion_Report.pdf", type: "WCR", pages: 210, year: 2022 },
    ],
    formationTops: [
      { formation: "Dihing",          topTVDSS: 0,    lithology: "Pebble Bed" },
      { formation: "Tipam Sandstone", topTVDSS: 580,  lithology: "Fine Sandstone" },
      { formation: "Barail Group",    topTVDSS: 1590, lithology: "Interbedded Shale" },
      { formation: "Kopili Shale",    topTVDSS: 2605, lithology: "Shale" },
    ],
  },
};

// Fallback for unknown wells
const FALLBACK_WELL: WellData = MOCK_WELLS["NH-04"];

interface WellData {
  name: string; field: string; status: string;
  totalDepthTVDSS: number; maxInclination: number; profile: string;
  casings: { type: string; depthTVDSS: number; odIn: number; idIn: number; lotSg: number | null }[];
  events: { date: string; depthTVDSS: number; type: string; severity: string; details: string; nptHrs: number; outcome: string; doc: string; page: number }[];
  documents: { name: string; type: string; pages: number; year: number }[];
  formationTops: { formation: string; topTVDSS: number; lithology: string }[];
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "#ef4444", Severe: "#ef4444", Moderate: "#f59e0b", Minor: "#3b82f6",
};

const TABS = ["Profile & Casing", "Formation Tops", "Historical Events", "Documents"] as const;
type Tab = typeof TABS[number];

export default function WellPage() {
  const params = useParams();
  const wellId = typeof params?.id === "string" ? params.id : "NH-04";
  const well = MOCK_WELLS[wellId] ?? FALLBACK_WELL;
  const [activeTab, setActiveTab] = useState<Tab>("Profile & Casing");

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      {/* Well header */}
      <Panel state="ready" style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "1rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
              MASTER WELL FILE: {well.name}
            </h1>
            <div style={{ display: "flex", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
              {[
                ["Field", well.field],
                ["Status", well.status],
                ["Total Depth", `${well.totalDepthTVDSS.toLocaleString()} m TVDSS`],
                ["Profile", `${well.profile} (${well.maxInclination}° max)`],
              ].map(([l, v]) => (
                <span key={l} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem" }}>
                  <span style={{ color: "#64748b" }}>{l}: </span>
                  <span style={{ color: "#f8fafc" }}>{v}</span>
                </span>
              ))}
            </div>
          </div>
          <StatusBadge level="nominal" label={well.status} />
        </div>
      </Panel>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid #2a3654" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.7rem",
              color: activeTab === tab ? "#f8fafc" : "#64748b",
              background: activeTab === tab ? "#1c253b" : "transparent",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #10b981" : "2px solid transparent",
              padding: "8px 16px",
              cursor: "pointer",
              transition: "all 0.12s",
            }}
          >
            {tab}
            {tab === "Historical Events" && (
              <span style={{ marginLeft: "5px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#f59e0b" }}>
                ({well.events.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "Profile & Casing" && (
        <Panel state="ready" style={{ padding: "14px 16px" }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Casing Schematic & Hole Summary
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["String Type", "Shoe Depth (TVDSS)", "OD (in)", "ID (in)", "LOT / FIT EMW"].map((h) => (
                  <th key={h} style={{ padding: "7px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.57rem", color: "#64748b", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #2a3654" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {well.casings.map((c) => (
                <tr key={c.type} style={{ borderBottom: "1px solid #2a3654" }}>
                  <td style={{ padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 600, color: "#f8fafc" }}>{c.type}</td>
                  <td style={{ padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{c.depthTVDSS.toLocaleString()} m TVDSS</td>
                  <td style={{ padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#f8fafc", fontVariantNumeric: "tabular-nums" }}>{c.odIn}&quot;</td>
                  <td style={{ padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{c.idIn}&quot;</td>
                  <td style={{ padding: "9px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: c.lotSg ? "#f8fafc" : "#64748b", fontVariantNumeric: "tabular-nums" }}>
                    {c.lotSg ? `${c.lotSg.toFixed(2)} SG` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {activeTab === "Formation Tops" && (
        <Panel state="ready" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {well.formationTops.map((f, i) => (
              <div key={f.formation} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "10px 12px", background: i % 2 === 0 ? "#131a29" : "#0b0f19", borderRadius: "3px" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc", minWidth: "160px" }}>{f.formation}</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", color: "#10b981", fontVariantNumeric: "tabular-nums" }}>Top @ {f.topTVDSS.toLocaleString()} m TVDSS</span>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#94a3b8" }}>{f.lithology}</span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === "Historical Events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {well.events.map((e, i) => (
            <FactCard key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 700, color: SEVERITY_COLORS[e.severity] ?? "#94a3b8" }}>
                    {e.type.replace(/_/g, " ")}
                  </span>
                  <StatusBadge level={e.severity === "Severe" || e.severity === "Critical" ? "critical" : e.severity === "Moderate" ? "warning" : "advisory"} label={e.severity} size="sm" />
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b" }}>{e.date}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>{e.depthTVDSS.toLocaleString()} m TVDSS</span>
                  <CitationChip documentName={e.doc} pageNumber={e.page} />
                </div>
              </div>
              <p style={{ fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.78rem", color: "#f8fafc", margin: "0 0 8px", lineHeight: 1.5 }}>{e.details}</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#94a3b8" }}>NPT: {e.nptHrs} hrs</span>
                <StatusBadge level={e.outcome === "Successful" ? "nominal" : "warning"} label={`Outcome: ${e.outcome}`} size="sm" />
              </div>
            </FactCard>
          ))}
        </div>
      )}

      {activeTab === "Documents" && (
        <Panel state="ready" style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {well.documents.map((d) => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#0b0f19", border: "1px solid #2a3654", borderRadius: "3px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "1.1rem" }}>📄</span>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.72rem", fontWeight: 600, color: "#f8fafc" }}>{d.name}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b" }}>{d.type} · {d.pages} pages · {d.year}</div>
                  </div>
                </div>
                <button style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#3b82f6", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "3px", padding: "4px 9px", cursor: "pointer" }}>
                  Open in Document Hub
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
