"use client";

import { useState, useEffect } from "react";
import { MapPin, Info, X, Layers } from "lucide-react";

// Simple SVG map placeholder (leaflet needs dynamic import for SSR)
const WELLS = [
  { well_id: "active", well_name: "NH-12 (Active)", latitude: 27.1234, longitude: 95.3456, isActive: true, events: 0 },
  { well_id: "nh04", well_name: "NH-04", latitude: 27.1180, longitude: 95.3410, isActive: false, events: 8 },
  { well_id: "nh07", well_name: "NH-07", latitude: 27.1290, longitude: 95.3510, isActive: false, events: 5 },
  { well_id: "nh09", well_name: "NH-09", latitude: 27.1150, longitude: 95.3560, isActive: false, events: 12 },
];

const WELL_DETAILS: Record<string, any> = {
  nh04: { total_depth: 3100, spud_date: "2022-01-15", casing_count: 3, hazard_events: 8, similarity_score: 0.87 },
  nh07: { total_depth: 2950, spud_date: "2021-08-22", casing_count: 2, hazard_events: 5, similarity_score: 0.79 },
  nh09: { total_depth: 3300, spud_date: "2023-02-10", casing_count: 3, hazard_events: 12, similarity_score: 0.91 },
};

export default function MapPage() {
  const [radiusKm, setRadiusKm] = useState(25);
  const [selected, setSelected] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(false);

  // Simple SVG coordinate projection (demo purposes)
  // Origin: NH-12 at center
  const toSvg = (lat: number, lon: number) => {
    const cx = 400, cy = 300;
    const scale = 6000;
    const x = cx + (lon - 95.3456) * scale;
    const y = cy - (lat - 27.1234) * scale;
    return { x, y };
  };

  const selectedWell = WELLS.find((w) => w.well_id === selected);
  const details = selected ? WELL_DETAILS[selected] : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Geospatial Well & Trajectory Explorer</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            EPSG:4326 surface map · Offset well radius filter · 3D trajectory viewer
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className={`btn ${show3D ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setShow3D(!show3D)}>
            <Layers size={14} /> {show3D ? "3D Mode Active" : "Enable 3D View"}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="panel mb-4">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex justify-between mb-1">
              <span className="mono-label">Surface Radius</span>
              <span className="mono-data" style={{ color: "var(--color-live)" }}>{radiusKm} km</span>
            </div>
            <input type="range" min="3" max="50" step="1" value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              style={{ width: 200, accentColor: "var(--color-live)" }} />
          </div>
          <div className="flex items-center gap-3">
            {WELLS.filter((w) => !w.isActive).map((w) => {
              const pos = toSvg(w.latitude, w.longitude);
              const dist = Math.sqrt((w.latitude - 27.1234) ** 2 + (w.longitude - 95.3456) ** 2) * 111;
              const inRadius = dist <= radiusKm;
              return (
                <div key={w.well_id} className={`badge ${inRadius ? "badge-ok" : "badge-muted"}`}
                  style={{ fontSize: "0.65rem" }}>
                  {w.well_name} · {dist.toFixed(1)} km
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* Map canvas */}
        <div className="panel" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
          {/* 3D mode banner */}
          {show3D && (
            <div className="badge badge-live" style={{ position: "absolute", top: 12, left: 12, zIndex: 10, fontSize: "0.65rem" }}>
              ⬡ 3D WebGL Mode (Three.js) — coming in next sprint
            </div>
          )}

          <svg width="100%" viewBox="0 0 800 600" style={{ background: "#0f172a", display: "block" }}>
            {/* Grid lines */}
            {[...Array(8)].map((_, i) => (
              <g key={i}>
                <line x1={i * 100} y1={0} x2={i * 100} y2={600} stroke="#1e293b" strokeWidth={1} />
                <line x1={0} y1={i * 75} x2={800} y2={i * 75} stroke="#1e293b" strokeWidth={1} />
              </g>
            ))}

            {/* Radius circle */}
            <circle cx={400} cy={300} r={radiusKm * 24}
              fill="none" stroke="var(--color-live)" strokeWidth={1} strokeDasharray="6 4" opacity={0.4} />
            <circle cx={400} cy={300} r={radiusKm * 24 * 0.4}
              fill="none" stroke="var(--color-base-600)" strokeWidth={0.5} strokeDasharray="3 3" opacity={0.3} />

            {/* Well trajectory lines (simplified) */}
            {WELLS.filter((w) => !w.isActive).map((w) => {
              const { x, y } = toSvg(w.latitude, w.longitude);
              return (
                <line key={w.well_id} x1={400} y1={300} x2={x} y2={y}
                  stroke="var(--color-base-600)" strokeWidth={0.5} strokeDasharray="2 3" opacity={0.5} />
              );
            })}

            {/* Well pins */}
            {WELLS.map((w) => {
              const { x, y } = toSvg(w.latitude, w.longitude);
              const isSelected = selected === w.well_id;
              return (
                <g key={w.well_id} style={{ cursor: w.isActive ? "default" : "pointer" }}
                  onClick={() => !w.isActive && setSelected(isSelected ? null : w.well_id)}>
                  {/* Glow */}
                  {w.isActive && (
                    <circle cx={x} cy={y} r={20} fill="var(--color-live)" opacity={0.1}>
                      <animate attributeName="r" values="20;30;20" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.1;0.02;0.1" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={x} cy={y} r={isSelected ? 9 : 7}
                    fill={w.isActive ? "var(--color-live)" : isSelected ? "var(--color-ok)" : "var(--color-base-600)"}
                    stroke={w.isActive ? "#0a1929" : isSelected ? "var(--color-ok)" : "var(--color-base-400)"}
                    strokeWidth={isSelected ? 2 : 1.5} />
                  <text x={x + 12} y={y + 4} fontSize={10} fill="var(--color-base-200)"
                    style={{ fontFamily: "var(--font-mono)" }}>
                    {w.well_name}
                  </text>
                  {!w.isActive && (
                    <text x={x + 12} y={y + 16} fontSize={9} fill="var(--color-base-600)"
                      style={{ fontFamily: "var(--font-mono)" }}>
                      {w.events} events
                    </text>
                  )}
                </g>
              );
            })}

            {/* Scale */}
            <g transform="translate(20,570)">
              <line x1={0} y1={0} x2={48} y2={0} stroke="var(--color-base-400)" strokeWidth={1} />
              <line x1={0} y1={-4} x2={0} y2={4} stroke="var(--color-base-400)" strokeWidth={1} />
              <line x1={48} y1={-4} x2={48} y2={4} stroke="var(--color-base-400)" strokeWidth={1} />
              <text x={24} y={-8} textAnchor="middle" fontSize={8} fill="var(--color-base-400)"
                style={{ fontFamily: "var(--font-mono)" }}>~2 km</text>
            </g>
          </svg>
        </div>

        {/* Right drawer — selected well details */}
        <div className="panel">
          {!selected ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <MapPin size={24} style={{ margin: "0 auto 0.75rem", color: "var(--color-base-600)" }} />
              <p className="text-secondary" style={{ fontSize: "0.8rem" }}>
                Click an offset well pin to view details
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="section-heading" style={{ color: "var(--color-ok)" }}>
                  {selectedWell?.well_name}
                </div>
                <button className="btn btn-ghost" style={{ padding: "0.25rem" }}
                  onClick={() => setSelected(null)}>
                  <X size={14} />
                </button>
              </div>
              {details && (
                <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="metric-card">
                    <span className="mono-label">Total Depth</span>
                    <span className="mono-data" style={{ color: "var(--color-live)" }}>{details.total_depth} m</span>
                  </div>
                  <div className="metric-card">
                    <span className="mono-label">Spud Date</span>
                    <span className="mono-data" style={{ fontSize: "0.8rem" }}>{details.spud_date}</span>
                  </div>
                  <div className="metric-card">
                    <span className="mono-label">Hazard Events</span>
                    <span className="mono-data" style={{ color: "var(--color-critical)" }}>{details.hazard_events}</span>
                  </div>
                  <div className="metric-card">
                    <span className="mono-label">Similarity Score</span>
                    <span className="mono-data" style={{ color: "var(--color-ok)" }}>{Math.round(details.similarity_score * 100)}%</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 mt-3">
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                  <Layers size={14} /> Add to Correlation Curtain
                </button>
                <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center" }}>
                  <Info size={14} /> View Full Well Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
