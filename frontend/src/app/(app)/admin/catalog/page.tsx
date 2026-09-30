/**
 * Page 12: OIL Formation Catalog Admin Editor (/admin/catalog)
 */
"use client";

import { useState } from "react";
import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

interface Formation {
  id: string;
  name: string;
  lithology: string;
  porePressureSg: number;
  fracGradSg: number;
  hazards: string[];
  markerCount: number;
}

const INITIAL_FORMATIONS: Formation[] = [
  { id: "1", name: "Dihing",          lithology: "Pebble Bed",          porePressureSg: 1.03, fracGradSg: 1.35, hazards: ["Surface Washouts"],                           markerCount: 42 },
  { id: "2", name: "Tipam Sandstone", lithology: "Fine Sandstone",       porePressureSg: 1.05, fracGradSg: 1.42, hazards: ["Seepage Losses"],                              markerCount: 88 },
  { id: "3", name: "Girujan Clay",    lithology: "Clay",                  porePressureSg: 1.05, fracGradSg: 1.55, hazards: ["Stuck_Pipe"],                                  markerCount: 34 },
  { id: "4", name: "Barail Group",    lithology: "Interbedded Shale",    porePressureSg: 1.28, fracGradSg: 1.62, hazards: ["Overpressure_Zone", "Gas_Kick", "Lost_Circulation"], markerCount: 112 },
  { id: "5", name: "Kopili Shale",    lithology: "Shale",                 porePressureSg: 1.18, fracGradSg: 1.72, hazards: ["Overpressure_Zone", "Stuck_Pipe"],             markerCount: 67 },
];

const HAZARD_COLORS: Record<string, string> = {
  "Overpressure_Zone": "#ef4444",
  "Gas_Kick":          "#ef4444",
  "Lost_Circulation":  "#f59e0b",
  "Stuck_Pipe":        "#f59e0b",
  "Seepage Losses":    "#3b82f6",
  "Surface Washouts":  "#3b82f6",
};

const thStyle: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.58rem",
  color: "#64748b",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #2a3654",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
  borderBottom: "1px solid #2a3654",
};

export default function CatalogPage() {
  const [formations, setFormations] = useState<Formation[]>(INITIAL_FORMATIONS);
  const [editing, setEditing] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Partial<Formation>>({});

  const startEdit = (f: Formation) => {
    setEditing(f.id);
    setEditBuf({ ...f });
  };

  const saveEdit = () => {
    setFormations((prev) =>
      prev.map((f) => (f.id === editing ? { ...f, ...editBuf } : f))
    );
    setEditing(null);
    setEditBuf({});
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", margin: 0, letterSpacing: "0.04em" }}>
            OIL MASTER FORMATION CATALOG EDITOR
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", margin: "4px 0 0" }}>
            Region: Upper Assam Basin · Total Formations Defined: {formations.length}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={btnStyle("#10b981")}>+ Add New Formation</button>
          <button style={btnStyle("#3b82f6")}>Export Catalog JSON</button>
        </div>
      </div>

      <Panel state="ready">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Formation Name", "Typical Lithology", "Avg Pore Press", "Frac Grad", "Known Hazards", "Markers", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {formations.map((f) => (
              <tr key={f.id} style={{ transition: "background 0.12s" }}>
                <td style={tdStyle}>
                  {editing === f.id ? (
                    <input
                      value={editBuf.name ?? f.name}
                      onChange={(e) => setEditBuf((b) => ({ ...b, name: e.target.value }))}
                      style={inputStyle}
                    />
                  ) : (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.78rem", fontWeight: 700, color: "#f8fafc" }}>
                      {f.name}
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#94a3b8" }}>{f.lithology}</span>
                </td>
                <td style={tdStyle}>
                  {editing === f.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editBuf.porePressureSg ?? f.porePressureSg}
                      onChange={(e) => setEditBuf((b) => ({ ...b, porePressureSg: Number(e.target.value) }))}
                      style={{ ...inputStyle, width: "70px" }}
                    />
                  ) : (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#f8fafc", fontVariantNumeric: "tabular-nums" }}>
                      {f.porePressureSg.toFixed(2)} SG
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  {editing === f.id ? (
                    <input
                      type="number"
                      step="0.01"
                      value={editBuf.fracGradSg ?? f.fracGradSg}
                      onChange={(e) => setEditBuf((b) => ({ ...b, fracGradSg: Number(e.target.value) }))}
                      style={{ ...inputStyle, width: "70px" }}
                    />
                  ) : (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", color: "#f8fafc", fontVariantNumeric: "tabular-nums" }}>
                      {f.fracGradSg.toFixed(2)} SG
                    </span>
                  )}
                </td>
                <td style={tdStyle}>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {f.hazards.map((h) => (
                      <span
                        key={h}
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "0.58rem",
                          color: HAZARD_COLORS[h] ?? "#94a3b8",
                          background: `${HAZARD_COLORS[h] ?? "#94a3b8"}18`,
                          border: `1px solid ${HAZARD_COLORS[h] ?? "#94a3b8"}44`,
                          borderRadius: "3px",
                          padding: "1px 5px",
                        }}
                      >
                        {h.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={tdStyle}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", color: "#94a3b8", fontVariantNumeric: "tabular-nums" }}>
                    {f.markerCount} wells
                  </span>
                </td>
                <td style={tdStyle}>
                  {editing === f.id ? (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={saveEdit} style={btnStyle("#10b981")}>Save</button>
                      <button onClick={() => setEditing(null)} style={btnStyle("#64748b")}>Cancel</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => startEdit(f)} style={btnStyle("#3b82f6")}>Edit</button>
                      <button style={btnStyle("#94a3b8")}>Markers ({f.markerCount})</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div>
        <StatusBadge level="advisory" label="Changes saved to formation_catalog table on Approve" />
      </div>
    </div>
  );
}

const btnStyle = (color: string): React.CSSProperties => ({
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.62rem",
  color,
  background: `${color}18`,
  border: `1px solid ${color}55`,
  borderRadius: "3px",
  padding: "4px 9px",
  cursor: "pointer",
  whiteSpace: "nowrap",
});

const inputStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.72rem",
  color: "#f8fafc",
  background: "#0b0f19",
  border: "1px solid #3b82f6",
  borderRadius: "3px",
  padding: "3px 6px",
  outline: "none",
  width: "130px",
};
