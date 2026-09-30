/**
 * NWIS Unit Conversion Utilities (A-3)
 * All numeric displays must use these helpers — never bare numbers.
 * Enforces explicit unit labels and tabular numeral formatting.
 */

export type UnitSystem = "METRIC" | "IMPERIAL";

// ── Conversion constants ────────────────────────────────────────────────────
const M_TO_FT = 3.28084;
const SG_TO_PPG = 8.33;
const BAR_TO_PSI = 14.5038;
const M3_TO_BBL = 6.28981;
const LPM_TO_GPM = 0.264172;

// ── Formatters ───────────────────────────────────────────────────────────────

/**
 * Format depth value with explicit TVDSS or MD datum label.
 * CORRECT: "2,850 m TVDSS" | "9,350 ft TVDSS"
 */
export function fmtDepth(
  m: number,
  system: UnitSystem,
  datum: "TVDSS" | "MD" = "TVDSS"
): string {
  if (system === "IMPERIAL") {
    return `${(m * M_TO_FT).toLocaleString("en-US", { maximumFractionDigits: 0 })} ft ${datum}`;
  }
  return `${m.toLocaleString("en-US", { maximumFractionDigits: 1 })} m ${datum}`;
}

/** Format depth as a plain number+unit string without datum */
export function fmtDepthShort(m: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `${(m * M_TO_FT).toLocaleString("en-US", { maximumFractionDigits: 0 })} ft`;
  }
  return `${m.toLocaleString("en-US", { maximumFractionDigits: 1 })} m`;
}

/**
 * Format mud weight / density with SG or ppg.
 * CORRECT: "1.28 SG" | "10.67 ppg"
 */
export function fmtMudWeight(sg: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `${(sg * SG_TO_PPG).toFixed(2)} ppg`;
  }
  return `${sg.toFixed(2)} SG`;
}

/**
 * Format pressure in kPa/Bar or psi.
 * CORRECT: "18,500 kPa" | "2,683 psi"
 */
export function fmtPressure(kPa: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    const psi = (kPa / 100) * BAR_TO_PSI; // kPa -> bar -> psi
    return `${psi.toLocaleString("en-US", { maximumFractionDigits: 0 })} psi`;
  }
  return `${kPa.toLocaleString("en-US", { maximumFractionDigits: 0 })} kPa`;
}

/**
 * Format volume in m³ or barrels.
 */
export function fmtVolume(m3: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `${(m3 * M3_TO_BBL).toFixed(1)} bbl`;
  }
  return `${m3.toFixed(1)} m³`;
}

/**
 * Format flow rate in L/min or gpm.
 */
export function fmtFlowRate(lpm: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `${(lpm * LPM_TO_GPM).toFixed(1)} gpm`;
  }
  return `${lpm.toFixed(0)} L/min`;
}

/**
 * Format ECD / EMW — same as mud weight but labelled EMW.
 */
export function fmtEMW(sg: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `${(sg * SG_TO_PPG).toFixed(2)} ppg EMW`;
  }
  return `${sg.toFixed(2)} SG (EMW)`;
}

/**
 * Format ROP in m/hr.
 */
export function fmtROP(mhr: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `${(mhr * M_TO_FT).toFixed(1)} ft/hr`;
  }
  return `${mhr.toFixed(1)} m/hr`;
}

/**
 * Format torque in kN·m.
 */
export function fmtTorque(knm: number): string {
  return `${knm.toFixed(1)} kN·m`;
}

/**
 * Format weight-on-bit in tonnes.
 */
export function fmtWOB(tonnes: number): string {
  return `${tonnes.toFixed(1)} t`;
}

/**
 * Format gas percentage.
 */
export function fmtGas(pct: number): string {
  return `${pct.toFixed(2)}%`;
}

/**
 * Format a probability score for ML inference display.
 * e.g. "78% Risk"
 */
export function fmtRisk(prob: number): string {
  return `${Math.round(prob * 100)}% Risk`;
}

/**
 * Format confidence interval in depth.
 * e.g. "± 12 m"
 */
export function fmtCI(meters: number, system: UnitSystem): string {
  if (system === "IMPERIAL") {
    return `± ${(meters * M_TO_FT).toFixed(0)} ft`;
  }
  return `± ${meters.toFixed(0)} m`;
}

/** Raw numeric value for METRIC depth (for chart axis etc.) */
export function toDisplayDepth(m: number, system: UnitSystem): number {
  return system === "IMPERIAL" ? m * M_TO_FT : m;
}

export const UNIT_LABELS = {
  depth: (s: UnitSystem) => (s === "METRIC" ? "m" : "ft"),
  mudWeight: (s: UnitSystem) => (s === "METRIC" ? "SG" : "ppg"),
  pressure: (s: UnitSystem) => (s === "METRIC" ? "kPa" : "psi"),
  volume: (s: UnitSystem) => (s === "METRIC" ? "m³" : "bbl"),
  flowRate: (s: UnitSystem) => (s === "METRIC" ? "L/min" : "gpm"),
  rop: (s: UnitSystem) => (s === "METRIC" ? "m/hr" : "ft/hr"),
};
