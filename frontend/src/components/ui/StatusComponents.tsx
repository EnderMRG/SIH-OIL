/**
 * NWIS Status & Provenance UI Components
 *
 * A-2: Multi-Modal Status Signals (shape + color + text — never color alone)
 * A-6: Fact vs. Inference Provenance Grammar
 * A-7: Strict 4-State Panel Standard
 */
"use client";

import React from "react";

// ── Types ────────────────────────────────────────────────────────────────────

export type StatusLevel = "critical" | "warning" | "advisory" | "nominal" | "stale";

interface StatusBadgeProps {
  level: StatusLevel;
  label?: string;
  size?: "sm" | "md" | "lg";
  /** Show full text label or icon only */
  compact?: boolean;
}

// ── A-2: Multi-Modal Status Badge ────────────────────────────────────────────
// Shape + border + text — never color alone.

const STATUS_CONFIG: Record<
  StatusLevel,
  { icon: string; label: string; color: string; border: string; bg: string }
> = {
  critical: {
    icon: "▲",
    label: "CRITICAL",
    color: "#ef4444",
    border: "#ef4444",
    bg: "rgba(239,68,68,0.10)",
  },
  warning: {
    icon: "◆",
    label: "WARNING",
    color: "#f59e0b",
    border: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
  },
  advisory: {
    icon: "ℹ",
    label: "ADVISORY",
    color: "#3b82f6",
    border: "#3b82f6",
    bg: "rgba(59,130,246,0.10)",
  },
  nominal: {
    icon: "✓",
    label: "OK",
    color: "#10b981",
    border: "#10b981",
    bg: "rgba(16,185,129,0.10)",
  },
  stale: {
    icon: "–",
    label: "NO DATA",
    color: "#6b7280",
    border: "#6b7280",
    bg: "repeating-linear-gradient(45deg, rgba(107,114,128,0.05) 0px, rgba(107,114,128,0.05) 4px, transparent 4px, transparent 8px)",
  },
};

export function StatusBadge({ level, label, size = "md", compact = false }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[level];
  const fontSize = size === "sm" ? "0.6rem" : size === "lg" ? "0.85rem" : "0.7rem";
  const px = size === "sm" ? "4px" : size === "lg" ? "10px" : "6px";
  const py = size === "sm" ? "1px" : size === "lg" ? "4px" : "2px";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
        fontSize,
        fontWeight: 700,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        borderRadius: "3px",
        padding: `${py} ${px}`,
        letterSpacing: "0.04em",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {!compact && <span>{label ?? cfg.label}</span>}
    </span>
  );
}

// ── Hazard direction variants ─────────────────────────────────────────────────
export function LossHazardBadge() {
  return <StatusBadge level="warning" label="▼ LOSS HAZARD" />;
}
export function KickHazardBadge() {
  return <StatusBadge level="critical" label="▲ KICK HAZARD" />;
}

// ── Stream status badge ───────────────────────────────────────────────────────
export function StreamStatusBadge({
  status,
  ageSeconds,
  hz,
}: {
  status: "LIVE" | "DELAYED" | "STALE";
  ageSeconds: number;
  hz?: number;
}) {
  if (status === "LIVE") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.65rem",
          color: "#10b981",
          border: "1px solid #10b981",
          background: "rgba(16,185,129,0.10)",
          borderRadius: "3px",
          padding: "2px 6px",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#10b981",
            animation: "pulse 1.5s infinite",
            display: "inline-block",
          }}
        />
        WITSML {hz ?? 1} Hz · {ageSeconds.toFixed(1)}s lag
      </span>
    );
  }

  if (status === "DELAYED") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.65rem",
          color: "#f59e0b",
          border: "1px solid #f59e0b",
          background: "rgba(245,158,11,0.10)",
          borderRadius: "3px",
          padding: "2px 6px",
        }}
      >
        ◆ DELAYED: {ageSeconds.toFixed(0)}s ago
      </span>
    );
  }

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
        fontSize: "0.65rem",
        color: "#6b7280",
        border: "1px solid #6b7280",
        background: "repeating-linear-gradient(45deg, rgba(107,114,128,0.08) 0px, rgba(107,114,128,0.08) 4px, transparent 4px, transparent 8px)",
        borderRadius: "3px",
        padding: "2px 6px",
      }}
    >
      – STALE · {Math.floor(ageSeconds / 60)}m ago
    </span>
  );
}

// ── A-6: Fact vs. Inference Provenance Wrappers ───────────────────────────────

interface ProvenanceCardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wrap hard historical facts (DDR data, offset logs, surveyed casing).
 * Solid 1px border — empirical, extracted data.
 */
export function FactCard({ children, className = "" }: ProvenanceCardProps) {
  return (
    <div
      className={className}
      style={{
        border: "1px solid #2a3654",
        borderRadius: "4px",
        background: "#131a29",
        padding: "10px 12px",
      }}
    >
      {children}
    </div>
  );
}

interface InferenceCardProps extends ProvenanceCardProps {
  probability: number;
  confidenceIntervalM: number;
  modelId: string;
  shapDrivers?: Array<{ feature: string; contribution: number }>;
}

/**
 * Wrap ML model predictions (Model 3 lookahead, Model 4 anomaly).
 * Dashed 1.5px amber border + probability badge + model ID.
 */
export function InferenceCard({
  children,
  probability,
  confidenceIntervalM,
  modelId,
  shapDrivers,
  className = "",
}: InferenceCardProps) {
  return (
    <div
      className={className}
      style={{
        border: "1.5px dashed #f59e0b",
        borderRadius: "4px",
        background: "rgba(245,158,11,0.04)",
        padding: "10px 12px",
      }}
    >
      {/* Model provenance header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.65rem",
            color: "#f59e0b",
            background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.3)",
            borderRadius: "3px",
            padding: "1px 5px",
            fontWeight: 700,
          }}
        >
          {Math.round(probability * 100)}% Risk
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.6rem",
            color: "#94a3b8",
          }}
        >
          ± {confidenceIntervalM.toFixed(0)}m
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.58rem",
            color: "#64748b",
          }}
        >
          {modelId}
        </span>
      </div>

      {children}

      {/* SHAP feature attributions */}
      {shapDrivers && shapDrivers.length > 0 && (
        <div style={{ marginTop: "8px", borderTop: "1px solid #2a3654", paddingTop: "6px" }}>
          <div
            style={{
              fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
              fontSize: "0.58rem",
              color: "#64748b",
              marginBottom: "4px",
            }}
          >
            SHAP DRIVERS
          </div>
          {shapDrivers.map((d) => (
            <div
              key={d.feature}
              style={{
                fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
                fontSize: "0.62rem",
                color: "#94a3b8",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{d.feature.replace(/_/g, " ")}</span>
              <span style={{ color: d.contribution > 0 ? "#f59e0b" : "#3b82f6" }}>
                {d.contribution > 0 ? "+" : ""}{d.contribution.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Citation chip — clicking opens the source PDF.
 */
export function CitationChip({
  documentName,
  pageNumber,
  validated = true,
  onClick,
}: {
  documentName: string;
  pageNumber: number;
  validated?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
        fontSize: "0.6rem",
        color: "#3b82f6",
        background: "rgba(59,130,246,0.08)",
        border: "1px solid rgba(59,130,246,0.25)",
        borderRadius: "3px",
        padding: "2px 6px",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      title={`Open ${documentName} page ${pageNumber}`}
    >
      📄 {documentName} · p.{pageNumber}
      {validated && (
        <span style={{ color: "#10b981", marginLeft: "2px" }}>✓ Validated</span>
      )}
    </button>
  );
}

// ── A-7: Strict 4-State Panel Component ──────────────────────────────────────

type PanelState = "loading" | "empty" | "error" | "degraded" | "ready";

interface PanelProps {
  state: PanelState;
  children?: React.ReactNode;
  title?: string;
  /** Reason text for empty/error/degraded states */
  message?: string;
  onRetry?: () => void;
  /** Fallback content shown in degraded state alongside children */
  fallbackLabel?: string;
  minHeight?: string;
  style?: React.CSSProperties;
}

export function Panel({
  state,
  children,
  title,
  message,
  onRetry,
  fallbackLabel = "Using cached data",
  minHeight = "120px",
  style,
}: PanelProps) {
  const baseStyle: React.CSSProperties = {
    background: "#131a29",
    border: "1px solid #2a3654",
    borderRadius: "4px",
    position: "relative",
    minHeight,
    ...style,
  };

  if (state === "loading") {
    return (
      <div style={baseStyle}>
        {title && (
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #2a3654" }}>
            <span
              style={{
                fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
                fontSize: "0.68rem",
                color: "#64748b",
              }}
            >
              {title}
            </span>
          </div>
        )}
        <div style={{ padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[100, 75, 55, 85, 40].map((w, i) => (
            <div
              key={i}
              style={{
                height: "10px",
                width: `${w}%`,
                background: "#1c253b",
                borderRadius: "2px",
                animation: "skeleton-pulse 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.12}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (state === "empty") {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "24px",
        }}
      >
        <span style={{ fontSize: "1.5rem", opacity: 0.3 }}>⊘</span>
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.7rem",
            color: "#64748b",
            textAlign: "center",
          }}
        >
          {message ?? "No data available. Select a well or upload documents to begin."}
        </span>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div
        style={{
          ...baseStyle,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "24px",
          border: "1px solid rgba(239,68,68,0.3)",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>▲</span>
        <span
          style={{
            fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
            fontSize: "0.7rem",
            color: "#ef4444",
            textAlign: "center",
          }}
        >
          {message ?? "Failed to load data"}
        </span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              marginTop: "8px",
              fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
              fontSize: "0.65rem",
              color: "#94a3b8",
              background: "#1c253b",
              border: "1px solid #2a3654",
              borderRadius: "3px",
              padding: "4px 10px",
              cursor: "pointer",
            }}
          >
            ↻ Retry
          </button>
        )}
      </div>
    );
  }

  if (state === "degraded") {
    return (
      <div style={baseStyle}>
        <div
          style={{
            background: "rgba(245,158,11,0.08)",
            borderBottom: "1px solid rgba(245,158,11,0.2)",
            padding: "4px 12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span style={{ fontSize: "0.65rem" }}>◆</span>
          <span
            style={{
              fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
              fontSize: "0.62rem",
              color: "#f59e0b",
            }}
          >
            DEGRADED MODE — {fallbackLabel}
          </span>
        </div>
        {children}
      </div>
    );
  }

  // "ready" — normal render
  return <div style={baseStyle}>{children}</div>;
}

// ── STALE overlay for charts (A-4) ────────────────────────────────────────────
export function StaleOverlay({ ageSeconds }: { ageSeconds: number }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "repeating-linear-gradient(45deg, rgba(107,114,128,0.08) 0px, rgba(107,114,128,0.08) 4px, transparent 4px, transparent 12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10,
        borderRadius: "inherit",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono, 'IBM Plex Mono', monospace)",
          fontSize: "0.7rem",
          color: "#6b7280",
          background: "#0b0f19",
          padding: "4px 10px",
          border: "1px solid #6b7280",
          borderRadius: "3px",
        }}
      >
        – STALE DATA · {Math.floor(ageSeconds / 60)}m ago · Prediction paused
      </span>
    </div>
  );
}
