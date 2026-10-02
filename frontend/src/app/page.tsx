"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [activeSystemTab, setActiveSystemTab] = useState("DASHBOARD");
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const [activeMenuRow, setActiveMenuRow] = useState<string | null>(null);

  // Design Tokens based on frontend/DESIGN.md and Code/code.html
  const theme = isDark
    ? {
        bg: "#101114",
        text: "#F4F3EF",
        textMuted: "#8E8D88",
        textSub: "#C2C0B8",
        border: "#26282B",
        cardBg: "#17181D",
        cardBorder: "#2E3036",
        pillInactiveBg: "#1E2026",
        pillInactiveText: "#D8D6CE",
        pillInactiveBorder: "#2E3036",
        pillActiveBg: "#F4F3EF",
        pillActiveText: "#101114",
        alertBg: "#22242B",
        alertBorder: "#343842",
        alertText: "#F4F3EF",
        accent: "#ECC645",
        rowHover: "rgba(255, 255, 255, 0.03)",
        cadBg: "#070A0E",
      }
    : {
        bg: "#ECEBE6",
        text: "#111111",
        textMuted: "#71717A",
        textSub: "#444748",
        border: "#D7D5CC",
        cardBg: "#F8F7F4",
        cardBorder: "rgba(0, 0, 0, 0.06)",
        pillInactiveBg: "#FFFFFF",
        pillInactiveText: "#111111",
        pillInactiveBorder: "rgba(0, 0, 0, 0.08)",
        pillActiveBg: "#111111",
        pillActiveText: "#FFFFFF",
        alertBg: "#E5E3DC",
        alertBorder: "rgba(0, 0, 0, 0.12)",
        alertText: "#111111",
        accent: "#E2B93B",
        rowHover: "rgba(0, 0, 0, 0.028)",
        cadBg: "#0A0D11",
      };

  const records = [
    {
      id: "borealis",
      num: "01",
      name: "Borealis Main Unit",
      status: "Active Drill Site",
      date: "12 MAY, 2024",
      link: "/dashboard",
      type: "number",
    },
    {
      id: "goliath",
      num: "02",
      name: "Goliath Offset #2",
      status: "Analysis Pending",
      date: "08 JUN, 2024",
      link: "/well/NH-04",
      type: "core",
    },
    {
      id: "sentinel",
      num: "ARC",
      name: "Sentinel Basin",
      status: "Historical Record",
      date: "14 JAN, 2023",
      link: "/correlation",
      type: "archive",
    },
  ];

  const systemLinks = [
    { label: "DASHBOARD", href: "/dashboard" },
    { label: "MAP", href: "/map" },
    { label: "TELEMETRY", href: "/telemetry" },
    { label: "CORRELATION", href: "/correlation" },
    { label: "ADVISORY", href: "/advisory" },
    { label: "DOCUMENTS", href: "/documents" },
    { label: "PLANNING", href: "/planning" },
    { label: "HEALTH", href: "/admin/health" },
  ];

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-space-grotesk), 'Space Grotesk', system-ui, sans-serif",
        transition: "background-color 0.3s ease, color 0.3s ease",
      }}
    >
      {/* ─── Top Header Navigation ────────────────────────────────────────── */}
      <header
        style={{
          width: "100%",
          padding: "2rem 2.5rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${theme.border}33`,
        }}
      >
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Link
            href="/"
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              textDecoration: "none",
              color: theme.text,
              fontFamily: "var(--font-space-grotesk), 'Space Grotesk', sans-serif",
            }}
          >
            WELLS.INTEL
          </Link>
        </div>

        {/* Center Navigation Links */}
        <nav
          aria-label="Main Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "2.5rem",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <Link
            href="/"
            style={{
              color: theme.text,
              textDecoration: "none",
              position: "relative",
              paddingBottom: "4px",
              borderBottom: `1.5px solid ${theme.text}`,
            }}
          >
            HUB
          </Link>
          <Link
            href="/map"
            style={{
              color: theme.textMuted,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            EXPLORATION
          </Link>
          <Link
            href="/telemetry"
            style={{
              color: theme.textMuted,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            COCKPIT
          </Link>
          <Link
            href="/admin/health"
            style={{
              color: theme.textMuted,
              textDecoration: "none",
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = theme.text)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.textMuted)}
          >
            ADMIN
          </Link>
        </nav>

        {/* Header Actions: Theme Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            id="themeToggleBtn"
            type="button"
            aria-label="Toggle theme mode"
            onClick={() => setIsDark(!isDark)}
            style={{
              width: "48px",
              height: "26px",
              backgroundColor: isDark ? "#2C2D33" : "#0D0D0D",
              borderRadius: "9999px",
              padding: "3px",
              border: `1px solid ${isDark ? "#484B52" : "transparent"}`,
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              position: "relative",
              transition: "all 0.25s ease",
            }}
            title={isDark ? "Switch to Architectural Paper theme" : "Switch to Dark Editorial theme"}
          >
            <span
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: isDark ? "#ECC645" : "#FFFFFF",
                borderRadius: "50%",
                display: "block",
                transform: isDark ? "translateX(22px)" : "translateX(1px)",
                transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            />
          </button>
        </div>
      </header>

      {/* ─── Main Content Layout ────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          width: "100%",
          padding: "1.5rem 2.5rem 3rem",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 380px",
          gap: "3.5rem",
          maxWidth: "1600px",
          margin: "0 auto",
        }}
      >
        {/* ─── Left Hero and Records Column ─────────────────────────────── */}
        <section
          aria-label="Hero and Active Drill Projects"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: "0.5rem",
            paddingBottom: "1.5rem",
          }}
        >
          {/* Upper Section: Year Stamp & Grand Editorial Typography */}
          <div>
            {/* Year Stamp Box */}
            <div
              style={{
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${theme.text}`,
                padding: "2px 7px",
                fontSize: "10px",
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "0.08em",
                marginBottom: "1.75rem",
                userSelect: "none",
              }}
            >
              <span>20</span>
              <span>24</span>
            </div>

            {/* Monumental Serif Headline with Golden Organic Accent */}
            <h1
              style={{
                fontFamily: "var(--font-eb-garamond), 'EB Garamond', 'Newsreader', serif",
                color: theme.text,
                lineHeight: 0.94,
                letterSpacing: "-0.035em",
                margin: 0,
                userSelect: "none",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(3.5rem, 6.2vw, 6.2rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.03em",
                }}
              >
                Nearby
              </span>

              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  columnGap: "1.25rem",
                  fontSize: "clamp(3.5rem, 6.2vw, 6.2rem)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  color: isDark ? "#E5E4DE" : "#242523",
                }}
              >
                <span>Subsurface</span>
                {/* Organic Mustard Egg/Blob Accent */}
                <span
                  className="golden-egg-accent"
                  style={{
                    backgroundColor: theme.accent,
                    borderRadius: "48% 52% 56% 44% / 46% 48% 52% 54%",
                    width: "clamp(34px, 3.2vw, 48px)",
                    height: "clamp(46px, 4.2vw, 64px)",
                    display: "inline-block",
                    boxShadow: "0 2px 8px rgba(226, 185, 59, 0.25)",
                    cursor: "pointer",
                    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.12) rotate(6deg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                  }}
                  title="Architectural Subsurface Geometry Accent"
                />
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "baseline",
                  fontSize: "clamp(3.5rem, 6.2vw, 6.2rem)",
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  color: theme.text,
                }}
              >
                <span>Intelligence</span>
                <span
                  style={{
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-space-grotesk), sans-serif",
                    fontWeight: 400,
                    color: theme.textMuted,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "50%",
                    width: "22px",
                    height: "22px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "0.65rem",
                    transform: "translateY(-1.2rem)",
                  }}
                >
                  ©
                </span>
              </span>
            </h1>
          </div>

          {/* Active Subsurface Records Listing Table */}
          <div
            style={{
              width: "100%",
              marginTop: "3.5rem",
            }}
          >
            <ul
              role="list"
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                borderTop: `1px solid ${theme.border}`,
              }}
            >
              {records.map((rec) => (
                <li
                  key={rec.id}
                  onClick={() => router.push(rec.link)}
                  style={{
                    padding: "1.25rem 0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: `1px solid ${theme.border}`,
                    cursor: "pointer",
                    transition: "background-color 0.15s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.rowHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {/* Left: Thumbnail & Title */}
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    {rec.type === "number" && (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: isDark ? "#28292E" : "#CECCC4",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: theme.textMuted,
                            fontSize: "0.75rem",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                          }}
                        >
                          {rec.num}
                        </span>
                      </div>
                    )}

                    {rec.type === "core" && (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: "#000000",
                          flexShrink: 0,
                          overflow: "hidden",
                          position: "relative",
                          border: "1px solid rgba(226, 185, 59, 0.4)",
                        }}
                      >
                        <div
                          style={{
                            position: "absolute",
                            inset: "2px",
                            borderRadius: "50%",
                            background: "radial-gradient(circle, #D97706 20%, #B45309 60%, #78350F 100%)",
                          }}
                        />
                      </div>
                    )}

                    {rec.type === "archive" && (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          backgroundColor: isDark ? "#38393F" : "#4A4945",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <span
                          style={{
                            color: "#FFFFFF",
                            fontSize: "9px",
                            fontFamily: "var(--font-jetbrains-mono), monospace",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {rec.num}
                        </span>
                      </div>
                    )}

                    <div>
                      <p
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: theme.text,
                          margin: 0,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {rec.name}
                      </p>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: theme.textMuted,
                          margin: "2px 0 0",
                          fontWeight: 400,
                        }}
                      >
                        {rec.status}
                      </p>
                    </div>
                  </div>

                  {/* Right: Date Stamp & Action Trigger */}
                  <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        letterSpacing: "0.06em",
                        color: theme.text,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {rec.date}
                    </span>
                    <button
                      type="button"
                      aria-label={`Options for ${rec.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuRow(activeMenuRow === rec.id ? null : rec.id);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: theme.text,
                        fontSize: "1.1rem",
                        cursor: "pointer",
                        letterSpacing: "0.15em",
                        padding: "4px 8px",
                      }}
                    >
                      •••
                    </button>

                    {/* Popover Action Menu */}
                    {activeMenuRow === rec.id && (
                      <div
                        style={{
                          position: "absolute",
                          right: "0",
                          top: "100%",
                          zIndex: 40,
                          backgroundColor: isDark ? "#1C1D24" : "#FFFFFF",
                          border: `1px solid ${theme.border}`,
                          borderRadius: "8px",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                          padding: "6px",
                          minWidth: "180px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(rec.link);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "8px 12px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: theme.text,
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                        >
                          Open in Workspace →
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/correlation");
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "8px 12px",
                            textAlign: "left",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: theme.textMuted,
                            cursor: "pointer",
                            borderRadius: "4px",
                          }}
                        >
                          View Correlation Track
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ─── Right Sidebar Controls & System Architecture ──────────────── */}
        <aside
          aria-label="Telemetry & System Architecture"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Discover Action Pill Dropdown */}
          <div style={{ position: "relative", width: "100%" }}>
            <button
              id="discoverDropdownBtn"
              type="button"
              aria-haspopup="true"
              aria-expanded={discoverOpen}
              onClick={() => setDiscoverOpen(!discoverOpen)}
              style={{
                width: "100%",
                backgroundColor: isDark ? "#F4F3EF" : "#111111",
                color: isDark ? "#111111" : "#FFFFFF",
                fontWeight: 600,
                fontSize: "13px",
                padding: "1rem 1.5rem",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "none",
                cursor: "pointer",
                transition: "opacity 0.2s, transform 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.92")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              <span>Discover wells & data</span>
              <svg
                style={{
                  width: "12px",
                  height: "12px",
                  fill: "currentColor",
                  transform: discoverOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
                viewBox="0 0 20 20"
              >
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </button>

            {/* Discover Quick Jump Dropdown Menu */}
            {discoverOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  backgroundColor: isDark ? "#1A1B22" : "#FFFFFF",
                  border: `1px solid ${theme.border}`,
                  borderRadius: "16px",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
                  padding: "8px",
                  zIndex: 50,
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                }}
              >
                <Link
                  href="/dashboard"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: theme.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Launch Command Center</span>
                  <span style={{ color: theme.textMuted }}>/dashboard</span>
                </Link>
                <Link
                  href="/map"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: theme.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Geospatial Well Map</span>
                  <span style={{ color: theme.textMuted }}>/map</span>
                </Link>
                <Link
                  href="/correlation"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: theme.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Correlation Curtain</span>
                  <span style={{ color: theme.textMuted }}>/correlation</span>
                </Link>
                <Link
                  href="/well/NH-04"
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: theme.text,
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>Master Well File 360° (3D)</span>
                  <span style={{ color: theme.textMuted }}>/well/NH-04</span>
                </Link>
              </div>
            )}
          </div>

          {/* Formation Analysis Intelligence Card */}
          <article
            onClick={() => router.push("/pore-pressure")}
            style={{
              backgroundColor: theme.cardBg,
              borderRadius: "1.75rem",
              padding: "1.25rem",
              border: `1px solid ${theme.cardBorder}`,
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              cursor: "pointer",
              transition: "transform 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = isDark ? "#4F535D" : "#B8B5AA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.cardBorder;
            }}
          >
            {/* Screen Cross-Section Vector CAD Preview Mockup */}
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 3",
                borderRadius: "1rem",
                overflow: "hidden",
                backgroundColor: theme.cadBg,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "0.85rem",
                userSelect: "none",
              }}
            >
              {/* Technical Tool Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                  paddingBottom: "6px",
                  fontSize: "9px",
                  color: "#9CA3AF",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: "#10B981",
                      display: "inline-block",
                      boxShadow: "0 0 6px #10B981",
                    }}
                  />
                  <span>WELL CAD v4.8</span>
                </span>
                <span>DEPTH: 3,420M</span>
              </div>

              {/* Simulated Geological Vector Schematics */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg
                  style={{ width: "100%", height: "130px" }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 260 140"
                >
                  {/* Grid Lines */}
                  <line x1="0" y1="35" x2="260" y2="35" stroke="#1F2937" strokeWidth="0.5" />
                  <line x1="0" y1="70" x2="260" y2="70" stroke="#1F2937" strokeWidth="0.5" />
                  <line x1="0" y1="105" x2="260" y2="105" stroke="#1F2937" strokeWidth="0.5" />
                  <line x1="65" y1="0" x2="65" y2="140" stroke="#1F2937" strokeWidth="0.5" />
                  <line x1="130" y1="0" x2="130" y2="140" stroke="#1F2937" strokeWidth="0.5" />
                  <line x1="195" y1="0" x2="195" y2="140" stroke="#1F2937" strokeWidth="0.5" />

                  {/* Strata Curve Lines */}
                  <path
                    d="M 0,30 Q 70,10 140,35 T 260,25"
                    stroke="#4B5563"
                    strokeDasharray="2 3"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 0,70 Q 60,85 130,65 T 260,75"
                    stroke="#E2B93B"
                    strokeWidth="2"
                  />
                  <path
                    d="M 0,110 Q 80,95 150,115 T 260,100"
                    stroke="#3B82F6"
                    strokeWidth="1.5"
                  />

                  {/* Vertical Drill String Trajectory */}
                  <line x1="85" y1="0" x2="85" y2="120" stroke="#EF4444" strokeWidth="2.5" />
                  <circle cx="85" cy="80" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />

                  {/* Stratigraphic Column Zone Tag */}
                  <rect
                    x="110"
                    y="45"
                    width="70"
                    height="35"
                    fill="#E2B93B"
                    fillOpacity="0.16"
                    stroke="#E2B93B"
                    strokeWidth="1"
                    rx="2"
                  />
                  <text
                    x="116"
                    y="66"
                    fill="#FBBF24"
                    fontFamily="monospace"
                    fontSize="8"
                    fontWeight="700"
                  >
                    CRETACEOUS
                  </text>
                </svg>
              </div>

              {/* Footer Telemetry Strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "8px",
                  fontFamily: "var(--font-jetbrains-mono), monospace",
                  color: "#9CA3AF",
                  paddingTop: "4px",
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <span>BIT_PRESS: 14.8 MPa</span>
                <span>POROSITY: 19.4%</span>
              </div>
            </div>

            {/* Formation Card Body Content */}
            <div style={{ padding: "0 4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <svg
                  style={{ width: "16px", height: "16px", color: theme.text, flexShrink: 0 }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3
                  style={{
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: theme.text,
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Formation Analysis
                </h3>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: theme.textSub,
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Current drill string is traversing the Lower Cretaceous limestone. Porosity remains within expected deviations.
              </p>
            </div>
          </article>

          {/* System Architecture Navigation Matrix */}
          <section aria-labelledby="architecture-heading" style={{ marginTop: "0.5rem" }}>
            <h2
              id="architecture-heading"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: theme.text,
                margin: "0 0 0.75rem 4px",
              }}
            >
              SYSTEM ARCHITECTURE
            </h2>

            {/* 2-Column Pill Button Grid */}
            <div
              aria-label="System Navigation"
              role="group"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              {systemLinks.map((item) => {
                const isActive = activeSystemTab === item.label;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setActiveSystemTab(item.label);
                      router.push(item.href);
                    }}
                    style={{
                      backgroundColor: isActive ? theme.pillActiveBg : theme.pillInactiveBg,
                      color: isActive ? theme.pillActiveText : theme.pillInactiveText,
                      border: `1px solid ${isActive ? "transparent" : theme.pillInactiveBorder}`,
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "11px 0",
                      borderRadius: "12px",
                      textAlign: "center",
                      cursor: "pointer",
                      transition: "all 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
                      boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = isDark ? "#282A33" : "#E8E6DE";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = theme.pillInactiveBg;
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* System Critical Alert Pill Banner */}
          <aside aria-label="System Alert" style={{ marginTop: "0.25rem" }}>
            <Link
              href="/advisory"
              style={{
                textDecoration: "none",
                display: "block",
              }}
            >
              <div
                style={{
                  width: "100%",
                  backgroundColor: theme.alertBg,
                  border: `1px solid ${theme.alertBorder}`,
                  borderRadius: "16px",
                  padding: "0.95rem 1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDark ? "#2A2C35" : "#DCDACF";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = theme.alertBg;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Asterisk / Industrial Hazard Glyph */}
                <span
                  style={{
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: theme.alertText,
                    userSelect: "none",
                    lineHeight: 1,
                  }}
                >
                  ✱
                </span>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: theme.alertText,
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  SYSTEM ALERT: HAZARD DETECTED IN OFFSET 4B
                </p>
              </div>
            </Link>
          </aside>
        </aside>
      </main>
    </div>
  );
}
