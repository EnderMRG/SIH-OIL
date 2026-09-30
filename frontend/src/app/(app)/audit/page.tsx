/**
 * Page 16: System Audit & Action Attribution Log (/audit)
 */
"use client";

import { useState, useMemo } from "react";
import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

type ActionType =
  | "ACKNOWLEDGE_ALERT"
  | "VALIDATE_DDR_OCR"
  | "EXECUTE_WHAT_IF"
  | "LOGIN"
  | "SHELVE_ALERT"
  | "EDIT_FORMATION"
  | "CHANGE_ROLE"
  | "GENERATE_REPORT";

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userRole: string;
  action: ActionType;
  targetId: string;
  details: string;
}

const ACTION_COLORS: Record<ActionType, string> = {
  ACKNOWLEDGE_ALERT: "#f59e0b",
  VALIDATE_DDR_OCR:  "#3b82f6",
  EXECUTE_WHAT_IF:   "#a78bfa",
  LOGIN:             "#64748b",
  SHELVE_ALERT:      "#94a3b8",
  EDIT_FORMATION:    "#10b981",
  CHANGE_ROLE:       "#ef4444",
  GENERATE_REPORT:   "#fb923c",
};

const MOCK_AUDIT: AuditEntry[] = [
  { id: "a1", timestamp: "2026-09-30 18:22:18", userId: "eng_arjun",  userRole: "RTOC_ENGINEER", action: "ACKNOWLEDGE_ALERT",  targetId: "ALT-8841", details: "CaCO3 LCM pill mixed in Pit #3" },
  { id: "a2", timestamp: "2026-09-30 13:45:02", userId: "geol_sarma", userRole: "GEOLOGIST",     action: "VALIDATE_DDR_OCR",  targetId: "EVT-0912", details: "Approved start depth 2,915m TVDSS from PDF" },
  { id: "a3", timestamp: "2026-09-30 11:10:45", userId: "eng_arjun",  userRole: "RTOC_ENGINEER", action: "EXECUTE_WHAT_IF",   targetId: "SIM-0041", details: "Tested MW 1.34 SG → ECD 1.37 SG Clearance" },
  { id: "a4", timestamp: "2026-09-30 09:30:00", userId: "eng_arjun",  userRole: "RTOC_ENGINEER", action: "SHELVE_ALERT",      targetId: "ALT-8832", details: "Shelved for 2 hours — bit cleaning run in progress" },
  { id: "a5", timestamp: "2026-09-30 08:15:00", userId: "admin",       userRole: "SYSTEM_ADMIN",  action: "CHANGE_ROLE",      targetId: "USR-0031", details: "Changed role: FIELD_DRILLER → RTOC_ENGINEER" },
  { id: "a6", timestamp: "2026-09-29 16:40:12", userId: "geol_sarma", userRole: "GEOLOGIST",     action: "EDIT_FORMATION",   targetId: "FRM-Barail", details: "Updated frac gradient from 1.60 to 1.62 SG" },
  { id: "a7", timestamp: "2026-09-29 14:22:10", userId: "eng_arjun",  userRole: "RTOC_ENGINEER", action: "VALIDATE_DDR_OCR", targetId: "EVT-0905", details: "Rejected — depth mismatch in OCR extraction" },
  { id: "a8", timestamp: "2026-09-29 07:00:00", userId: "eng_arjun",  userRole: "RTOC_ENGINEER", action: "GENERATE_REPORT",  targetId: "RPT-0201", details: "Daily Morning Drilling Report Tour 1 generated" },
  { id: "a9", timestamp: "2026-09-28 18:00:22", userId: "eng_rk",     userRole: "FIELD_DRILLER", action: "ACKNOWLEDGE_ALERT",targetId: "ALT-8810", details: "Noted gas kick risk — circulating bottoms up" },
  { id: "a10",timestamp: "2026-09-28 09:12:34", userId: "admin",       userRole: "SYSTEM_ADMIN",  action: "LOGIN",           targetId: "SESS-9921", details: "Admin login from 10.0.0.4" },
];

const ACTION_TYPES: ActionType[] = [
  "ACKNOWLEDGE_ALERT", "VALIDATE_DDR_OCR", "EXECUTE_WHAT_IF",
  "LOGIN", "SHELVE_ALERT", "EDIT_FORMATION", "CHANGE_ROLE", "GENERATE_REPORT",
];

export default function AuditPage() {
  const [filterAction, setFilterAction] = useState<string>("ALL");
  const [filterUser, setFilterUser] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const users = useMemo(() => ["ALL", ...Array.from(new Set(MOCK_AUDIT.map((e) => e.userId)))], []);

  const filtered = useMemo(
    () =>
      MOCK_AUDIT.filter(
        (e) =>
          (filterAction === "ALL" || e.action === filterAction) &&
          (filterUser === "ALL" || e.userId === filterUser) &&
          (search === "" ||
            e.details.toLowerCase().includes(search.toLowerCase()) ||
            e.targetId.toLowerCase().includes(search.toLowerCase()))
      ),
    [filterAction, filterUser, search]
  );

  const selectStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.65rem",
    color: "#94a3b8",
    background: "#131a29",
    border: "1px solid #2a3654",
    borderRadius: "3px",
    padding: "5px 10px",
    outline: "none",
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      <div>
        <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
          SYSTEM AUDIT & ACTION ATTRIBUTION LOG
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", margin: "4px 0 0" }}>
          Total Logged Events: {MOCK_AUDIT.length} · Immutable compliance record · Last 7 Days
        </p>
      </div>

      {/* Filters */}
      <Panel state="ready" style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Filter:
          </span>
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} style={selectStyle}>
            <option value="ALL">All Actions</option>
            {ACTION_TYPES.map((a) => <option key={a} value={a}>{a.replace(/_/g, " ")}</option>)}
          </select>
          <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} style={selectStyle}>
            {users.map((u) => <option key={u} value={u}>{u === "ALL" ? "All Users" : u}</option>)}
          </select>
          <input
            placeholder="Search details or target ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...selectStyle, width: "260px" }}
          />
          <StatusBadge level="nominal" label={`${filtered.length} entries shown`} size="sm" />
        </div>
      </Panel>

      {/* Audit table */}
      <Panel state="ready">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Timestamp (IST)", "User ID", "User Role", "Action Type", "Target ID", "Action Details / Reason"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.57rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", borderBottom: "1px solid #2a3654", whiteSpace: "nowrap" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} style={{ borderBottom: "1px solid #2a3654", transition: "background 0.12s" }}>
                <td style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                  {e.timestamp}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.7rem", fontWeight: 600, color: "#f8fafc" }}>
                  {e.userId}
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#94a3b8" }}>
                    {e.userRole}
                  </span>
                </td>
                <td style={{ padding: "8px 12px" }}>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.62rem",
                      fontWeight: 700,
                      color: ACTION_COLORS[e.action],
                      background: `${ACTION_COLORS[e.action]}18`,
                      border: `1px solid ${ACTION_COLORS[e.action]}44`,
                      borderRadius: "3px",
                      padding: "2px 6px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.action.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#3b82f6" }}>
                  {e.targetId}
                </td>
                <td style={{ padding: "8px 12px", fontFamily: "Inter, system-ui, sans-serif", fontSize: "0.75rem", color: "#94a3b8" }}>
                  &quot;{e.details}&quot;
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
