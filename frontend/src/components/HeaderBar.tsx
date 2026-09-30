"use client";

import { useState, useEffect, useCallback } from "react";
import { useGlobalContext } from "@/store/globalContext";
import { fmtDepth, fmtMudWeight, fmtEMW } from "@/lib/units";
import { StreamStatusBadge, StatusBadge } from "@/components/ui/StatusComponents";

const DIVIDER = (
  <div
    aria-hidden="true"
    style={{
      width: 1,
      height: 18,
      borderLeft: "1px solid #2a3654",
      flexShrink: 0,
    }}
  />
);

const MetricCell = ({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) => (
  <div style={{ display: "flex", alignItems: "baseline", gap: "5px", flexShrink: 0 }}>
    <span
      style={{
        fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
        fontSize: "0.6rem",
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: valueColor ?? "#f8fafc",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {value}
    </span>
  </div>
);

export function HeaderBar() {
  const ctx = useGlobalContext();

  // Simulate live depth advancement + stream age
  useEffect(() => {
    const interval = setInterval(() => {
      // Get latest state without adding it to deps and causing re-renders
      const state = useGlobalContext.getState();
      
      let nextAge = state.streamAgeSeconds + 1;
      if (nextAge > 10) nextAge = 0.4; // reset to keep demo live
      
      const status = nextAge < 5 ? "LIVE" : nextAge < 60 ? "DELAYED" : "STALE";
      
      state.updateLiveMetrics({
        liveBitDepthMD: parseFloat((state.liveBitDepthMD + 0.005).toFixed(3)),
        liveBitDepthTVDSS: parseFloat((state.liveBitDepthTVDSS + 0.0047).toFixed(3)),
        liveROP: parseFloat((16 + Math.random() * 5).toFixed(1)),
        liveECD: parseFloat((1.33 + Math.random() * 0.02).toFixed(3)),
      });
      state.setStreamStatus(status as "LIVE" | "DELAYED" | "STALE", nextAge);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const u = ctx.unitSystem;
  const alerts = ctx.liveActiveAlertCount;

  const toggleUnit = useCallback(() => {
    ctx.setUnitSystem(u === "METRIC" ? "IMPERIAL" : "METRIC");
  }, [ctx, u]);

  const rigStateColor =
    ctx.rigState === "DRILLING_ROTARY" || ctx.rigState === "DRILLING_SLIDE"
      ? "#10b981"
      : ctx.rigState === "CONNECTION"
      ? "#f59e0b"
      : "#94a3b8";

  return (
    <header
      role="banner"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "#0b0f19",
        borderBottom: "1px solid #2a3654",
        padding: "0 16px",
        height: "52px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        overflow: "hidden",
      }}
    >
      {/* Brand */}
      <div
        style={{
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "#f8fafc",
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        NWIS
      </div>

      {DIVIDER}

      {/* Active Well selector */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.6rem",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Active
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.75rem",
            fontWeight: 700,
            color: "#10b981",
          }}
        >
          {ctx.activeWellName} ▾
        </span>
      </div>

      {DIVIDER}

      {/* Bit depth MD + TVDSS */}
      <MetricCell
        label="Bit MD"
        value={fmtDepth(ctx.liveBitDepthMD, u, "MD")}
        valueColor="#10b981"
      />
      <MetricCell
        label="Bit TVDSS"
        value={fmtDepth(ctx.liveBitDepthTVDSS, u, "TVDSS")}
        valueColor="#f8fafc"
      />

      {DIVIDER}

      {/* Hole section + casing shoe */}
      <MetricCell label="Section" value={ctx.liveHoleSection} />
      <span
        style={{
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.65rem",
          color: "#94a3b8",
          flexShrink: 0,
        }}
      >
        Shoe {ctx.liveCasingShoeSize} @{" "}
        {fmtDepth(ctx.liveCasingShoeDepth, u, "TVDSS")}
      </span>

      {DIVIDER}

      {/* Survey age */}
      <MetricCell
        label="Last Survey"
        value={`${ctx.liveLastSurveyMetersAgo.toFixed(0)} m ago`}
        valueColor="#94a3b8"
      />

      {DIVIDER}

      {/* MW In / Out / ECD */}
      <MetricCell
        label="MW In"
        value={fmtMudWeight(ctx.liveMudWeightIn, u)}
        valueColor="#f8fafc"
      />
      <MetricCell
        label="Out"
        value={fmtMudWeight(ctx.liveMudWeightOut, u)}
        valueColor="#f8fafc"
      />
      <MetricCell
        label="ECD"
        value={fmtEMW(ctx.liveECD, u)}
        valueColor={ctx.liveECD > 1.40 ? "#f59e0b" : "#f8fafc"}
      />

      {DIVIDER}

      {/* Rig state */}
      <span
        style={{
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.65rem",
          fontWeight: 700,
          color: rigStateColor,
          border: `1px solid ${rigStateColor}`,
          background: `${rigStateColor}18`,
          borderRadius: "3px",
          padding: "2px 7px",
          flexShrink: 0,
          letterSpacing: "0.04em",
        }}
      >
        {ctx.rigState.replace(/_/g, " ")}
      </span>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Stream status */}
      <StreamStatusBadge
        status={ctx.streamStatus}
        ageSeconds={ctx.streamAgeSeconds}
        hz={1}
      />

      {/* Alert counts */}
      {alerts.critical > 0 && (
        <StatusBadge level="critical" label={`${alerts.critical} Critical`} size="sm" />
      )}
      {alerts.warning > 0 && (
        <StatusBadge level="warning" label={`${alerts.warning} Warning`} size="sm" />
      )}

      {/* Unit toggle */}
      <button
        id="unit-toggle"
        onClick={toggleUnit}
        title="Toggle metric / imperial units"
        style={{
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.62rem",
          color: "#94a3b8",
          background: "#1c253b",
          border: "1px solid #2a3654",
          borderRadius: "3px",
          padding: "3px 8px",
          cursor: "pointer",
          flexShrink: 0,
          transition: "border-color 0.15s",
        }}
      >
        {u === "METRIC" ? "SI →" : "OFS →"}
      </button>

      {/* Demo tag */}
      <span
        style={{
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.58rem",
          color: "#64748b",
          border: "1px solid #2a3654",
          borderRadius: "3px",
          padding: "2px 5px",
          flexShrink: 0,
        }}
      >
        DEMO DATA
      </span>
    </header>
  );
}
