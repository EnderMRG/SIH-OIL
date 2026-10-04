/**
 * NWIS Global Context State — Zustand Store (A-5)
 * Single shared state object synchronized across all 16 pages.
 * Scrubbing depth on the Correlation Curtain syncs all open tabs.
 */
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RigStateEnum =
  | "DRILLING_ROTARY"
  | "DRILLING_SLIDE"
  | "CONNECTION"
  | "TRIPPING_IN"
  | "TRIPPING_OUT"
  | "CIRCULATING"
  | "PUMPS_OFF";

export type UnitSystem = "METRIC" | "IMPERIAL";

export type StreamStatus = "LIVE" | "DELAYED" | "STALE";

export interface GlobalContextState {
  // Well & depth context
  activeWellboreId: string;
  activeWellName: string;
  cursorTVDSS: number;
  cursorMD: number;
  selectedOffsetIds: string[];

  // Telemetry context
  timeWindowHours: number;
  rigState: RigStateEnum;
  streamStatus: StreamStatus;
  streamAgeSeconds: number;

  // Display settings
  unitSystem: UnitSystem;

  // Active live metrics (updated by telemetry WS)
  liveBitDepthMD: number;
  liveBitDepthTVDSS: number;
  liveROP: number;
  liveMudWeightIn: number;
  liveMudWeightOut: number;
  liveECD: number;
  liveLastSurveyMetersAgo: number;
  liveHoleSection: string;
  liveCasingShoeDepth: number;
  liveCasingShoeSize: string;
  liveActiveAlertCount: { critical: number; warning: number };

  // Sandbox parameters for reporting
  sandboxSimulatedEcd: number | null;
  sandboxPill: string | null;

  // Linked Reports from NLP Hub
  customReports: any[];
  addCustomReport: (report: any) => void;

  // Actions
  setCursorDepth: (tvdss: number, md: number) => void;
  setSelectedOffsets: (wellIds: string[]) => void;
  setActiveWell: (wellboreId: string, wellName: string) => void;
  setTimeWindow: (hours: number) => void;
  setRigState: (state: RigStateEnum) => void;
  setUnitSystem: (system: UnitSystem) => void;
  setStreamStatus: (status: StreamStatus, ageSeconds: number) => void;
  updateLiveMetrics: (metrics: Partial<Pick<
    GlobalContextState,
    | "liveBitDepthMD" | "liveBitDepthTVDSS" | "liveROP"
    | "liveMudWeightIn" | "liveMudWeightOut" | "liveECD"
    | "liveLastSurveyMetersAgo" | "rigState"
    | "liveActiveAlertCount"
  >>) => void;
  setSandboxParameters: (ecd: number | null, pill: string | null) => void;
}

export const useGlobalContext = create<GlobalContextState>()(
  persist(
    (set) => ({
      // Defaults — pre-loaded with NH-12 demo context
      activeWellboreId: "NH-12-WB01",
      activeWellName: "OIL-NH-12",
      cursorTVDSS: 2850.0,
      cursorMD: 3010.2,
      selectedOffsetIds: ["NH-04", "NH-07"],
      timeWindowHours: 6,
      rigState: "DRILLING_ROTARY",
      streamStatus: "LIVE",
      streamAgeSeconds: 0,
      unitSystem: "METRIC",

      // Live metrics — defaults matching spec wireframe
      liveBitDepthMD: 3010.0,
      liveBitDepthTVDSS: 2850.2,
      liveROP: 18.4,
      liveMudWeightIn: 1.28,
      liveMudWeightOut: 1.30,
      liveECD: 1.34,
      liveLastSurveyMetersAgo: 27,
      liveHoleSection: '12¼"',
      liveCasingShoeDepth: 2150,
      liveCasingShoeSize: '9⅝"',
      liveActiveAlertCount: { critical: 1, warning: 2 },

      sandboxSimulatedEcd: null,
      sandboxPill: null,

      // Custom Reports from NLP Uploads
      customReports: [],
      addCustomReport: (report) => set((state) => ({ customReports: [report, ...state.customReports] })),

      // Actions
      setCursorDepth: (tvdss, md) => set({ cursorTVDSS: tvdss, cursorMD: md }),
      setSelectedOffsets: (wellIds) =>
        set({ selectedOffsetIds: wellIds.slice(0, 5) }),
      setActiveWell: (wellboreId, wellName) =>
        set({ activeWellboreId: wellboreId, activeWellName: wellName }),
      setTimeWindow: (hours) => set({ timeWindowHours: hours }),
      setRigState: (state) => set({ rigState: state }),
      setUnitSystem: (system) => set({ unitSystem: system }),
      setStreamStatus: (status, ageSeconds) =>
        set({ streamStatus: status, streamAgeSeconds: ageSeconds }),
      updateLiveMetrics: (metrics) => set((s) => ({ ...s, ...metrics })),
      setSandboxParameters: (ecd, pill) => set({ sandboxSimulatedEcd: ecd, sandboxPill: pill }),
    }),
    {
      name: "nwis-global-context",
      partialize: (state) => ({
        unitSystem: state.unitSystem,
        activeWellboreId: state.activeWellboreId,
        activeWellName: state.activeWellName,
        selectedOffsetIds: state.selectedOffsetIds,
        timeWindowHours: state.timeWindowHours,
      }),
    }
  )
);
