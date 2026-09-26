"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, Clock, ExternalLink, Eye } from "lucide-react";

const HAZARD_ICONS: Record<string, string> = {
  Lost_Circulation: "💧",
  Stuck_Pipe: "🔩",
  Overpressure_Zone: "⚡",
  Gas_Kick: "💨",
  Torque_Spike: "🌀",
  Cementing_Issue: "🏗️",
};

const MOCK_ADVISORY = [
  { hazard_class: "Lost_Circulation", risk_probability: 0.78, priority: "Critical",
    depth_window_start_tvdss: 2850, depth_window_end_tvdss: 2950, formation: "Barail Group",
    historical_remediation: "Spotted 40 ppb CaCO3 pill at loss zone. Squeeze with LCM for 2 hrs.",
    mitigation_outcome: "Successful", npt_hours_saved: 14.5,
    source_citation: { document: "NH-04 Completion Report", page: 42 },
    shap_drivers: [
      { feature: "incident_density_per_m", contribution: 0.31 },
      { feature: "mud_weight_vs_pp_margin_sg", contribution: 0.19 },
      { feature: "tvdss_delta_to_nearest_event", contribution: 0.14 },
    ], status: "Active" },
  { hazard_class: "Overpressure_Zone", risk_probability: 0.52, priority: "Warning",
    depth_window_start_tvdss: 2850, depth_window_end_tvdss: 2950, formation: "Barail Group",
    historical_remediation: "Increased MW by 0.05 SG. Monitored gas trend for 2 hrs.",
    mitigation_outcome: "Partial", npt_hours_saved: 6.0,
    source_citation: { document: "NH-09 Completion Report", page: 31 },
    shap_drivers: [
      { feature: "mud_weight_vs_pp_margin_sg", contribution: 0.26 },
      { feature: "incident_density_per_m", contribution: 0.14 },
      { feature: "tvdss_delta_to_nearest_event", contribution: 0.09 },
    ], status: "Active" },
  { hazard_class: "Gas_Kick", risk_probability: 0.35, priority: "Warning",
    depth_window_start_tvdss: 2850, depth_window_end_tvdss: 2950, formation: "Barail Group",
    historical_remediation: "Pumped 20 bbl 16-ppg weighted plug. Well shut-in 45 min.",
    mitigation_outcome: "Successful", npt_hours_saved: 22.0,
    source_citation: { document: "NH-04 DDR – Shift 2022-05-02", page: 61 },
    shap_drivers: [
      { feature: "tvdss_delta_to_nearest_event", contribution: 0.17 },
      { feature: "incident_density_per_m", contribution: 0.11 },
      { feature: "mud_weight_vs_pp_margin_sg", contribution: 0.07 },
    ], status: "Acknowledged" },
  { hazard_class: "Stuck_Pipe", risk_probability: 0.19, priority: "Advisory",
    depth_window_start_tvdss: 2850, depth_window_end_tvdss: 2950, formation: "Barail Group",
    historical_remediation: "50 bbl weighted spotting fluid + 30 min soak, 5t overpull applied.",
    mitigation_outcome: "Successful", npt_hours_saved: 8.0,
    source_citation: { document: "NH-07 DDR – Shift 2022-03-14", page: 88 },
    shap_drivers: [
      { feature: "incident_density_per_m", contribution: 0.09 },
      { feature: "tvdss_delta_to_nearest_event", contribution: 0.06 },
      { feature: "planned_casing_shoe_clearance_m", contribution: 0.04 },
    ], status: "Active" },
  { hazard_class: "Torque_Spike", risk_probability: 0.11, priority: "Advisory",
    depth_window_start_tvdss: 2850, depth_window_end_tvdss: 2950, formation: "Barail Group",
    historical_remediation: "Reduced RPM to 80. Applied torque limit alarm at 18 kN·m.",
    mitigation_outcome: "Successful", npt_hours_saved: 3.5,
    source_citation: { document: "NH-07 Completion Report", page: 55 },
    shap_drivers: [
      { feature: "incident_density_per_m", contribution: 0.05 },
      { feature: "tvdss_delta_to_nearest_event", contribution: 0.04 },
      { feature: "mud_weight_vs_pp_margin_sg", contribution: 0.02 },
    ], status: "Active" },
  { hazard_class: "Cementing_Issue", risk_probability: 0.08, priority: "Advisory",
    depth_window_start_tvdss: 2850, depth_window_end_tvdss: 2950, formation: "Barail Group",
    historical_remediation: "Squeeze cement job performed. TOC confirmed via temperature log.",
    mitigation_outcome: "Partial", npt_hours_saved: 18.0,
    source_citation: { document: "NH-09 DDR – Shift 2022-07-19", page: 73 },
    shap_drivers: [
      { feature: "incident_density_per_m", contribution: 0.04 },
      { feature: "tvdss_delta_to_nearest_event", contribution: 0.03 },
      { feature: "planned_casing_shoe_clearance_m", contribution: 0.01 },
    ], status: "Active" },
];

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "var(--color-critical)",
  Warning: "var(--color-warning)",
  Advisory: "var(--color-advisory)",
};

const OUTCOME_BADGE: Record<string, string> = {
  Successful: "badge-ok",
  Partial: "badge-warning",
  Failed: "badge-critical",
};

type Hazard = typeof MOCK_ADVISORY[0];

function HazardDetailCard({ h, onAcknowledge }: { h: Hazard; onAcknowledge: (cls: string) => void }) {
  const pct = Math.round(h.risk_probability * 100);
  const color = PRIORITY_COLORS[h.priority];
  const badgeCls = h.priority === "Critical" ? "badge-critical" : h.priority === "Warning" ? "badge-warning" : "badge-advisory";

  return (
    <div className="panel" style={{ borderTop: `3px solid ${color}` }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "1.2rem" }}>{HAZARD_ICONS[h.hazard_class]}</span>
          <div>
            <div className="section-heading" style={{ color }}>
              {h.hazard_class.replace(/_/g, " ")}
            </div>
            <div className="mono-label" style={{ marginTop: 2 }}>
              {h.depth_window_start_tvdss}–{h.depth_window_end_tvdss} m TVDSS · {h.formation}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`badge ${badgeCls}`} style={{ fontSize: "0.7rem" }}>{h.priority} · {pct}%</span>
          <span className={`badge ${h.status === "Active" ? "badge-critical" : "badge-muted"}`}
            style={{ fontSize: "0.58rem" }}>{h.status}</span>
        </div>
      </div>

      {/* Risk bar */}
      <div className="risk-bar-track mb-3">
        <div
          style={{
            width: `${pct}%`, height: "100%",
            background: pct >= 65 ? "var(--color-critical)" : pct >= 40 ? "var(--color-warning)" : "var(--color-ok)",
            transition: "width 400ms ease"
          }}
        />
      </div>

      {/* Remediation */}
      <div className="panel-sm mb-3" style={{ background: "var(--color-base-800)" }}>
        <div className="mono-label mb-1">Recommended Remediation (Historical)</div>
        <p style={{ fontSize: "0.8rem", color: "var(--color-base-200)", lineHeight: 1.5 }}>{h.historical_remediation}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className={`badge ${OUTCOME_BADGE[h.mitigation_outcome]}`}>{h.mitigation_outcome}</span>
          <span className="mono-label">NPT Saved: {h.npt_hours_saved} hrs</span>
        </div>
      </div>

      {/* SHAP drivers */}
      <div className="mb-3">
        <div className="mono-label mb-1.5">Risk Drivers (SHAP)</div>
        <div className="flex flex-col gap-1">
          {h.shap_drivers.map((d) => (
            <div key={d.feature} className="flex items-center gap-2">
              <div style={{ flex: 1, fontSize: "0.7rem", color: "var(--color-base-400)", fontFamily: "var(--font-mono)" }}>
                {d.feature.replace(/_/g, " ")}
              </div>
              <div className="risk-bar-track" style={{ width: 80 }}>
                <div style={{ width: `${(d.contribution / 0.35) * 100}%`, height: "100%", background: color }} />
              </div>
              <span className="mono-label" style={{ fontSize: "0.6rem", minWidth: 32, textAlign: "right" }}>
                +{d.contribution.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Source + Actions */}
      <div className="divider pt-3 flex items-center justify-between">
        <span className="mono-label" style={{ fontSize: "0.6rem" }}>
          {h.source_citation.document} · p.{h.source_citation.page}
        </span>
        <div className="flex gap-2">
          <button className="btn btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem" }}>
            <Eye size={11} /> Correlation
          </button>
          <button className="btn btn-ghost" style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem" }}>
            <ExternalLink size={11} /> Open PDF
          </button>
          {h.status === "Active" && (
            <button className="btn btn-primary" style={{ padding: "0.25rem 0.6rem", fontSize: "0.7rem" }}
              onClick={() => onAcknowledge(h.hazard_class)}>
              <CheckCircle size={11} /> Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdvisoryPage() {
  const [advisory, setAdvisory] = useState(MOCK_ADVISORY);
  const [filter, setFilter] = useState<string>("All");

  function handleAcknowledge(cls: string) {
    setAdvisory((prev) => prev.map((h) => h.hazard_class === cls ? { ...h, status: "Acknowledged" } : h));
  }

  const filtered = filter === "All" ? advisory : advisory.filter((h) => h.priority === filter || h.status === filter);
  const criticalCount = advisory.filter((h) => h.priority === "Critical" && h.status === "Active").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Lookahead Advisory & Alert Center</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            ISA-18.2 Alarm Management · Model 3 Subsurface Risk Classifier (Mock)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <span className="badge badge-critical">
              <AlertTriangle size={9} /> {criticalCount} Critical Active
            </span>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4">
        {["All", "Critical", "Warning", "Advisory", "Active", "Acknowledged"].map((f) => (
          <button key={f}
            className={`badge ${filter === f ? "badge-live" : "badge-muted"}`}
            style={{ cursor: "pointer", fontSize: "0.7rem", padding: "0.3rem 0.75rem" }}
            onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {filtered.map((h) => (
          <HazardDetailCard key={h.hazard_class} h={h as Hazard} onAcknowledge={handleAcknowledge} />
        ))}
      </div>
    </div>
  );
}
