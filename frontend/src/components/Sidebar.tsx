"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  code: string;
  iconName: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "01 · CORE OPERATIONS",
    items: [
      { href: "/dashboard", label: "Command Center", code: "01", iconName: "terminal" },
      { href: "/map", label: "Geospatial / 3D", code: "02", iconName: "public" },
      { href: "/correlation", label: "Correlation Curtain", code: "03", iconName: "view_column" },
      { href: "/telemetry", label: "Telemetry Cockpit", code: "04", iconName: "precision_manufacturing" },
    ],
  },
  {
    label: "02 · ANALYSIS & PROGNOSIS",
    items: [
      { href: "/pore-pressure", label: "Pore Pressure", code: "05", iconName: "speed" },
      { href: "/advisory", label: "Hazard Advisory", code: "06", iconName: "warning" },
      { href: "/analogues", label: "Offset Selector", code: "09", iconName: "straighten" },
      { href: "/planning", label: "Plan vs Actual", code: "11", iconName: "waterfall_chart" },
    ],
  },
  {
    label: "03 · MANAGEMENT",
    items: [
      { href: "/well/NH-04", label: "Master Well File", code: "10", iconName: "folder" },
      { href: "/documents", label: "Document Hub", code: "07", iconName: "library_books" },
      { href: "/reports", label: "Report Generator", code: "14", iconName: "description" },
      { href: "/admin/health", label: "System Health", code: "13", iconName: "memory" },
      { href: "/audit", label: "Audit Logs", code: "16", iconName: "receipt_long" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="sidebar select-none"
      aria-label="Main navigation"
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "230px",
        height: "100vh",
        backgroundColor: "#f5f4ef",
        borderRight: "1px solid #dbdad6",
        padding: "1.75rem 1.25rem 1.25rem",
        flexShrink: 0,
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <div>
        {/* Brand Wordmark Block */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "50%",
                backgroundColor: "#fecf50",
                border: "1px solid #d4a72c",
                display: "inline-block",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#765b00",
                textTransform: "uppercase",
              }}
            >
              SURFACE 01
            </span>
          </div>

          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "inherit",
              display: "block",
            }}
          >
            <h1
              style={{
                fontFamily: "var(--font-space-grotesk), sans-serif",
                fontWeight: 800,
                fontSize: "17px",
                lineHeight: 1.05,
                color: "#0d0d0d",
                letterSpacing: "-0.02em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              NEARBY<br />WELLS<br />INTEL
            </h1>
          </Link>
          <p
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "10px",
              color: "#87837d",
              margin: "6px 0 0",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            WELLS.INTEL · Subsurface
          </p>
        </div>

        {/* Navigation Menu Groups */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.label}>
              {groupIdx > 0 && (
                <div
                  style={{
                    height: "1px",
                    backgroundColor: "#dbdad6",
                    width: "100%",
                    marginBottom: "1.25rem",
                  }}
                />
              )}
              <h2
                style={{
                  fontFamily: "var(--font-space-grotesk), sans-serif",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  color: "#87837d",
                  textTransform: "uppercase",
                  margin: "0 0 8px 4px",
                }}
              >
                {group.label}
              </h2>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
                {group.items.map(({ href, label, code, iconName }) => {
                  const active = pathname === href || pathname.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: "6px",
                          textDecoration: "none",
                          color: active ? "#0d0d0d" : "#444748",
                          backgroundColor: active ? "#e9e8e4" : "transparent",
                          fontWeight: active ? 700 : 500,
                          fontSize: "12px",
                          fontFamily: "var(--font-space-grotesk), sans-serif",
                          transition: "background-color 0.12s, color 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.04)";
                            e.currentTarget.style.color = "#0d0d0d";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "#444748";
                          }
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span
                            className="material-symbols-outlined"
                            style={{
                              fontSize: "15px",
                              color: active ? "#0d0d0d" : "#747878",
                            }}
                          >
                            {iconName}
                          </span>
                          <span style={{ letterSpacing: "-0.01em" }}>{label}</span>
                        </span>
                        <span
                          style={{
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            fontSize: "10px",
                            fontWeight: 600,
                            color: active ? "#0d0d0d" : "#87837d",
                            opacity: active ? 1 : 0.7,
                          }}
                        >
                          {code}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer System Status Block */}
      <div
        style={{
          paddingTop: "1.25rem",
          borderTop: "1px solid #dbdad6",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          <span style={{ color: "#747878", textTransform: "uppercase" }}>STATUS // READY</span>
          <span style={{ color: "#765b00", fontWeight: 700 }}>1 Hz STREAM</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "6px 8px",
            borderRadius: "4px",
            backgroundColor: "#e9e8e4",
            border: "1px solid #dbdad6",
            fontSize: "10px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
          }}
        >
          <span style={{ fontWeight: 600, color: "#1b1c1a", letterSpacing: "0.06em" }}>LAT 28.314° N</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                backgroundColor: "#10b981",
                display: "inline-block",
                boxShadow: "0 0 6px #10b981",
              }}
            />
            <span style={{ color: "#747878" }}>SEC 12¼"</span>
          </span>
        </div>
      </div>
    </aside>
  );
}
