"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Map, Layers, Activity, FlaskConical,
  AlertTriangle, FileText, Smartphone, GitCompare,
  BookOpen, BarChart2, Database, HeartPulse,
  FileBarChart, Shield, ClipboardList, ChevronRight,
} from "lucide-react";

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  tag?: string; // e.g. "NEW"
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { href: "/dashboard",     icon: LayoutDashboard, label: "Command Center" },
      { href: "/map",           icon: Map,             label: "Well Map" },
      { href: "/correlation",   icon: Layers,          label: "Correlation" },
      { href: "/telemetry",     icon: Activity,        label: "Live Telemetry" },
      { href: "/pore-pressure", icon: FlaskConical,    label: "Pore Pressure" },
      { href: "/advisory",      icon: AlertTriangle,   label: "Advisory" },
      { href: "/documents",     icon: FileText,        label: "Documents" },
      { href: "/pwa-field",     icon: Smartphone,      label: "Field View" },
    ],
  },
  {
    label: "Analysis",
    items: [
      { href: "/analogues", icon: GitCompare,   label: "Analogue Selector", tag: "NEW" },
      { href: "/well/NH-04",icon: BookOpen,     label: "Well File 360°",    tag: "NEW" },
      { href: "/planning",  icon: BarChart2,    label: "Plan vs Actual",    tag: "NEW" },
      { href: "/reports",   icon: FileBarChart, label: "Report Generator",  tag: "NEW" },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/admin/catalog", icon: Database,      label: "Formation Catalog", tag: "NEW" },
      { href: "/admin/health",  icon: HeartPulse,    label: "System Health",     tag: "NEW" },
      { href: "/admin/auth",    icon: Shield,        label: "Auth & RBAC",       tag: "NEW" },
      { href: "/audit",         icon: ClipboardList, label: "Audit Log",         tag: "NEW" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav
      className="sidebar"
      aria-label="Main navigation"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#0b0f19",
        borderRight: "1px solid #2a3654",
        width: "192px",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo / Brand */}
      <div
        style={{
          padding: "16px 14px 12px",
          borderBottom: "1px solid #2a3654",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "4px",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.58rem",
                fontWeight: 700,
                color: "#0a1929",
              }}
            >
              NW
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#f8fafc",
                letterSpacing: "0.06em",
              }}
            >
              NWIS
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.55rem",
                color: "#64748b",
                letterSpacing: "0.03em",
              }}
            >
              eRTMAC Platform
            </div>
          </div>
        </div>
      </div>

      {/* Nav Groups */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 8px" }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label} style={{ marginBottom: "4px" }}>
            {/* Group label */}
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.55rem",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                padding: "10px 8px 4px",
                userSelect: "none",
              }}
            >
              {group.label}
            </div>

            <ul role="list" style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {group.items.map(({ href, icon: Icon, label, tag }) => {
                const active =
                  pathname === href || pathname.startsWith(href + "/");
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "9px",
                        padding: "6px 8px",
                        borderRadius: "4px",
                        textDecoration: "none",
                        color: active ? "#f8fafc" : "#94a3b8",
                        background: active ? "#1c253b" : "transparent",
                        fontWeight: active ? 600 : 400,
                        fontSize: "0.78rem",
                        fontFamily: "Inter, system-ui, sans-serif",
                        transition: "background 0.12s, color 0.12s",
                        marginBottom: "1px",
                      }}
                    >
                      <Icon
                        size={13}
                        style={{
                          color: active ? "#10b981" : "#64748b",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ flex: 1, lineHeight: "1.1" }}>{label}</span>
                      {tag && (
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: "0.48rem",
                            color: "#3b82f6",
                            border: "1px solid rgba(59,130,246,0.3)",
                            borderRadius: "2px",
                            padding: "0px 3px",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {tag}
                        </span>
                      )}
                      {active && (
                        <ChevronRight
                          size={10}
                          style={{ color: "#10b981", flexShrink: 0 }}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid #2a3654",
          padding: "10px 14px",
          flexShrink: 0,
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.55rem",
            color: "#64748b",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          SIH26121 · Oil India Limited
        </p>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.55rem",
            color: "#64748b",
            margin: 0,
          }}
        >
          v2.0.0 — eRTMAC-NWIS
        </p>
      </div>
    </nav>
  );
}
