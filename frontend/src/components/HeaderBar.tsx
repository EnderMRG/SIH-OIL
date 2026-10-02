"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepth, fmtMudWeight, fmtEMW } from "@/lib/units";

const DIVIDER = (
  <div
    aria-hidden="true"
    style={{
      width: 1,
      height: 16,
      backgroundColor: "#dbdad6",
      flexShrink: 0,
    }}
  />
);

export function HeaderBar() {
  const ctx = useGlobalContext();
  const [timeStr, setTimeStr] = useState("UTC 14:22:08");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(`UTC ${now.toTimeString().split(" ")[0]}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate live depth advancement + stream age
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useGlobalContext.getState();
      let nextAge = state.streamAgeSeconds + 1;
      if (nextAge > 10) nextAge = 0.4;
      const status = nextAge < 5 ? "LIVE" : nextAge < 60 ? "DELAYED" : "STALE";

      state.updateLiveMetrics({
        liveBitDepthMD: parseFloat((state.liveBitDepthMD + 0.005).toFixed(3)),
        liveBitDepthTVDSS: parseFloat((state.liveBitDepthTVDSS + 0.0047).toFixed(3)),
        liveROP: parseFloat((13 + Math.random() * 3).toFixed(1)),
        liveECD: parseFloat((1.33 + Math.random() * 0.02).toFixed(3)),
      });
      state.setStreamStatus(status as "LIVE" | "DELAYED" | "STALE", nextAge);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const u = ctx.unitSystem;
  const toggleUnit = useCallback(() => {
    ctx.setUnitSystem(u === "METRIC" ? "IMPERIAL" : "METRIC");
  }, [ctx, u]);

  const alerts = ctx.liveActiveAlertCount;

  return (
    <header
      role="banner"
      className="header-bar select-none"
      style={{
        height: "56px",
        backgroundColor: "rgba(250, 249, 245, 0.94)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid #dbdad6",
        padding: "0 1.75rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Rig info & Active section tags */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "#fecf50",
              border: "1px solid #d4a72c",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#0d0d0d",
              textTransform: "uppercase",
            }}
          >
            RIG SE-802
          </span>
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono), monospace",
              fontSize: "10px",
              color: "#747878",
              letterSpacing: "0.05em",
            }}
          >
            WELL INTEL HUD
          </span>
        </div>

        {DIVIDER}

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "10px", fontFamily: "var(--font-jetbrains-mono), monospace", color: "#444748" }}>
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "4px",
              backgroundColor: "#efeeea",
              border: "1px solid #dbdad6",
              color: "#0d0d0d",
              fontWeight: 600,
            }}
          >
            ACTIVE SEC: 12¼&quot; INT
          </span>
          <span>FM: BARAIL / REEF</span>
          {DIVIDER}
          <span>TARGET: OIL-NH-12</span>
          {DIVIDER}
          <span style={{ fontWeight: 600, color: "#0d0d0d" }}>{timeStr}</span>
        </div>
      </div>

      {/* Right: Live depth, alerts, unit toggle, user avatar */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Bit Depth Readout */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "5px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
          <span style={{ fontSize: "9px", textTransform: "uppercase", color: "#747878", fontWeight: 600 }}>BIT:</span>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#0d0d0d", fontVariantNumeric: "tabular-nums" }}>
            {fmtDepth(ctx.liveBitDepthTVDSS, u, "TVDSS")}
          </span>
        </div>

        {DIVIDER}

        {/* Hazard Level Badge */}
        <Link
          href="/advisory"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "3px 9px",
            borderRadius: "9999px",
            backgroundColor: alerts.critical > 0 ? "rgba(186, 26, 26, 0.1)" : "#efeeea",
            border: `1px solid ${alerts.critical > 0 ? "rgba(186, 26, 26, 0.3)" : "#dbdad6"}`,
            fontSize: "10px",
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontWeight: 600,
            color: alerts.critical > 0 ? "#ba1a1a" : "#1b1c1a",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: alerts.critical > 0 ? "#ba1a1a" : "#10b981",
              display: "inline-block",
            }}
          />
          <span>{alerts.critical > 0 ? `${alerts.critical} CRITICAL ACTIVE` : "HAZARD LVL: MINIMAL"}</span>
        </Link>

        {/* Unit Toggle Button */}
        <button
          onClick={toggleUnit}
          title="Toggle Metric (m/SG) vs Oilfield Standard (ft/ppg)"
          style={{
            fontFamily: "var(--font-jetbrains-mono), monospace",
            fontSize: "10px",
            fontWeight: 600,
            color: "#444748",
            backgroundColor: "#efeeea",
            border: "1px solid #dbdad6",
            borderRadius: "9999px",
            padding: "4px 10px",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e9e8e4";
            e.currentTarget.style.color = "#0d0d0d";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#efeeea";
            e.currentTarget.style.color = "#444748";
          }}
        >
          {u === "METRIC" ? "SI [m/SG]" : "OFS [ft/ppg]"}
        </button>

        {/* Stream Health Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", fontFamily: "var(--font-jetbrains-mono), monospace", color: "#10b981" }}>
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
          <span style={{ fontWeight: 600 }}>1 Hz</span>
        </div>

        {/* User Avatar Circle */}
        <div
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            backgroundColor: "#0d0d0d",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 700,
            fontFamily: "var(--font-space-grotesk), sans-serif",
            userSelect: "none",
          }}
          title="Operator: Arjun Das (RTOC Engineer)"
        >
          AD
        </div>
      </div>
    </header>
  );
}
