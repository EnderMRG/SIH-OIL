/**
 * Page 15: Auth, User Management & RBAC Config (/admin/auth)
 */
"use client";

import { useState } from "react";
import { Panel, StatusBadge } from "@/components/ui/StatusComponents";

type UserRole = "RTOC_ENGINEER" | "FIELD_DRILLER" | "GEOLOGIST" | "SYSTEM_ADMIN";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  fieldModeState: string;
  lastActive: string;
  permissions: string[];
}

const ROLE_COLORS: Record<UserRole, string> = {
  RTOC_ENGINEER:  "#10b981",
  GEOLOGIST:      "#3b82f6",
  FIELD_DRILLER:  "#f59e0b",
  SYSTEM_ADMIN:   "#a78bfa",
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  RTOC_ENGINEER:  ["Full Read/Write", "Alert Acknowledge", "What-If Execute", "Report Generate"],
  GEOLOGIST:      ["Read/Write Formations", "Correlation Curtain", "Document Validate"],
  FIELD_DRILLER:  ["Read-Only Telemetry", "Alert Acknowledge", "Offline PWA"],
  SYSTEM_ADMIN:   ["Full System Access", "User Management", "RBAC Config", "Audit Logs"],
};

const INITIAL_USERS: AppUser[] = [
  {
    id: "u1", name: "Arjun Das",    email: "arjun@oilindia.in",    role: "RTOC_ENGINEER",
    fieldModeState: "Desktop", lastActive: "2026-09-30 18:22", permissions: ROLE_PERMISSIONS.RTOC_ENGINEER,
  },
  {
    id: "u2", name: "Rajesh Kumar",  email: "rkumar@oilindia.in",  role: "FIELD_DRILLER",
    fieldModeState: "Mobile Doghouse", lastActive: "2026-09-30 17:45", permissions: ROLE_PERMISSIONS.FIELD_DRILLER,
  },
  {
    id: "u3", name: "Dr. S. Sarma",  email: "ssarma@oilindia.in",  role: "GEOLOGIST",
    fieldModeState: "Desktop", lastActive: "2026-09-30 16:10", permissions: ROLE_PERMISSIONS.GEOLOGIST,
  },
  {
    id: "u4", name: "System Admin",  email: "admin@oilindia.in",   role: "SYSTEM_ADMIN",
    fieldModeState: "Desktop", lastActive: "2026-09-30 09:00", permissions: ROLE_PERMISSIONS.SYSTEM_ADMIN,
  },
];

const ALL_ROLES: UserRole[] = ["RTOC_ENGINEER", "FIELD_DRILLER", "GEOLOGIST", "SYSTEM_ADMIN"];

export default function AuthPage() {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [editingRole, setEditingRole] = useState<string | null>(null);

  const updateRole = (userId: string, role: UserRole) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, role, permissions: ROLE_PERMISSIONS[role] } : u
      )
    );
    setEditingRole(null);
  };

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", maxWidth: "1400px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h1 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
            USER MANAGEMENT & ROLE-BASED ACCESS CONTROL (RBAC)
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", margin: "4px 0 0" }}>
            {users.length} users registered · JWT auth with role claims
          </p>
        </div>
        <button style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#10b981", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "3px", padding: "6px 12px", cursor: "pointer" }}>
          + Invite User
        </button>
      </div>

      {/* Role legend */}
      <Panel state="ready" style={{ padding: "12px 16px" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.6rem", color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Role Definitions</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {ALL_ROLES.map((role) => (
            <div key={role}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: ROLE_COLORS[role], fontWeight: 700 }}>{role}</span>
              <ul style={{ margin: "4px 0 0", padding: "0 0 0 12px" }}>
                {ROLE_PERMISSIONS[role].map((p) => (
                  <li key={p} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#94a3b8", marginBottom: "2px" }}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      {/* User table */}
      <Panel state="ready">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["User Name", "Email", "Assigned Role", "Permissions", "Field Mode", "Last Active", "Actions"].map((h) => (
                <th key={h} style={{ padding: "8px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.58rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", textAlign: "left", borderBottom: "1px solid #2a3654" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #2a3654" }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.75rem", fontWeight: 700, color: "#f8fafc" }}>{u.name}</div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#94a3b8" }}>{u.email}</span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  {editingRole === u.id ? (
                    <select
                      defaultValue={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value as UserRole)}
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: "#f8fafc", background: "#0b0f19", border: "1px solid #3b82f6", borderRadius: "3px", padding: "3px 6px" }}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  ) : (
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.68rem", color: ROLE_COLORS[u.role], fontWeight: 600 }}>
                      {u.role}
                    </span>
                  )}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                    {u.permissions.slice(0, 2).map((p) => (
                      <span key={p} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.56rem", color: "#94a3b8", background: "#1c253b", border: "1px solid #2a3654", borderRadius: "2px", padding: "1px 4px" }}>
                        {p}
                      </span>
                    ))}
                    {u.permissions.length > 2 && (
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.56rem", color: "#64748b" }}>+{u.permissions.length - 2}</span>
                    )}
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <StatusBadge
                    level={u.fieldModeState === "Mobile Doghouse" ? "advisory" : "nominal"}
                    label={u.fieldModeState}
                    size="sm"
                  />
                </td>
                <td style={{ padding: "10px 12px", fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.65rem", color: "#64748b", fontVariantNumeric: "tabular-nums" }}>
                  {u.lastActive}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    onClick={() => setEditingRole(editingRole === u.id ? null : u.id)}
                    style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.62rem", color: "#3b82f6", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "3px", padding: "3px 8px", cursor: "pointer" }}
                  >
                    {editingRole === u.id ? "Cancel" : "Edit Role"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
