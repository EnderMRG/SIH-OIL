/**
 * Page 13: System Data & Model Health Dashboard (/admin/health)
 * Redesigned to exact "Architectural Subsurface Editorial" standards
 * Source reference: Code/system_data_model_health_dashboard/code.html
 */
"use client";

import { useState } from "react";
import { useGlobalContext } from "@/store/globalContext";

interface SensorRow {
  channel: string;
  tag: string;
  quality: string;
  latency: string;
  drift: string;
  status: "Nominal" | "Recal in 6h";
  advisory?: boolean;
}

const SENSOR_CHANNELS: SensorRow[] = [
  {
    channel: "Bit Depth (TVDSS)",
    tag: "DEPTH_BIT // ENCODER-A",
    quality: "99.9%",
    latency: "0.2s",
    drift: "0.00 m",
    status: "Nominal",
  },
  {
    channel: "Standpipe Pressure (SPP)",
    tag: "PRESS_SPP // 0-5000 PSI",
    quality: "98.7%",
    latency: "0.4s",
    drift: "+12 psi",
    status: "Nominal",
  },
  {
    channel: "Flow Delta (Paddle vs In)",
    tag: "FLOW_DELTA // COMP-DIFF",
    quality: "97.4%",
    latency: "0.5s",
    drift: "+0.4%",
    status: "Nominal",
  },
  {
    channel: "Hookload / WOB",
    tag: "LOAD_CELL_DEADLINE",
    quality: "99.2%",
    latency: "0.3s",
    drift: "-0.2 tonnes",
    status: "Nominal",
  },
  {
    channel: "Surface Torque",
    tag: "TORQ_TOPDRIVE // VFD-AMP",
    quality: "98.9%",
    latency: "0.3s",
    drift: "+0.1 kN·m",
    status: "Nominal",
  },
  {
    channel: "Mud Weight In/Out",
    tag: "CORIOLIS_MUD_DENSITY",
    quality: "96.5%",
    latency: "1.2s",
    drift: "+0.01 SG",
    status: "Recal in 6h",
    advisory: true,
  },
  {
    channel: "Gas Chromatography",
    tag: "C1-C5 TOTAL FLAME DETECTOR",
    quality: "99.5%",
    latency: "0.8s",
    drift: "0.00%",
    status: "Nominal",
  },
];

export default function HealthPage() {
  const { activeWellName } = useGlobalContext();
  const [feedRate, setFeedRate] = useState<string>("1.0 Hz");
  const [psiValue, setPsiValue] = useState<string>("0.0412");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ title: string; desc: string } | null>(null);

  const showToast = (title: string, desc: string) => {
    setToastMsg({ title, desc });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleSync = () => {
    setIsSyncing(true);
    setFeedRate("SYNCING...");
    setTimeout(() => {
      setFeedRate("1.0 Hz");
      setIsSyncing(false);
      showToast("Telemetry Synchronized", "1 Hz WITSML edge buffer flushed & synced with TimescaleDB.");
    }, 600);
  };

  const handlePsiRecalc = () => {
    setPsiValue("CALC...");
    setTimeout(() => {
      setPsiValue("0.0412");
      showToast("PSI Re-Calculated", "Concept drift horizon updated: 0.0412. Distribution remains optimal.");
    }, 800);
  };

  const handleRetrain = () => {
    showToast("Retraining Dispatched", "Pipeline execution job #JOB-8841 queued on Slurm cluster with 142 wells.");
  };

  const handleExportDiagnostics = () => {
    const diagData = {
      timestamp: new Date().toISOString(),
      host: "OIL-NODE-MUMBAI-04",
      well: activeWellName,
      model: "NWIS v2.4-PROD",
      psi: 0.0412,
      witsml_rate_hz: 1.0,
      active_channels: 7,
      db_connections: "4/20",
      redis_latency_ms: 0,
      models: [
        { name: "Analogue Similarity Ranker", uptime: "100%", confidence: "99.1%" },
        { name: "DFIM Stratigraphic Alignment", score: "88.4%", dtw_quality: "88.4%" },
        { name: "ISA-18.2 Hazard Lookahead Engine", auc_roc: "0.910", warnings: 2 },
        { name: "Vibration & Anomaly Detector", accuracy: "96.2%", alarms_24h: 1.2 },
      ],
    };
    const blob = new Blob([JSON.stringify(diagData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diagnostics-nwis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Export Generated", "diagnostics-nwis.json successfully downloaded.");
  };

  return (
    <div className="flex flex-col w-full bg-[#faf9f5] min-h-screen text-[#1b1c1a] font-sans">
      {/* Interactive Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-[#1c1b1b] text-white shadow-2xl border border-[#30312e] flex items-center gap-3 animate-fade-in font-mono text-xs">
          <span className="material-symbols-outlined text-[#fecf50] text-[18px]">verified</span>
          <div className="flex flex-col">
            <span className="font-semibold text-white uppercase tracking-wider">{toastMsg.title}</span>
            <span className="text-[#dbdad6] text-[11px]">{toastMsg.desc}</span>
          </div>
        </div>
      )}

      <div className="p-6 lg:p-8 space-y-6 max-w-[1720px] mx-auto w-full">
        {/* 1. Breadcrumbs & Header HUD */}
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#e9e8e4] text-[10px] font-mono text-[#444748] uppercase tracking-widest font-semibold">
                INFRASTRUCTURE MONITORING & MLOps // eRTMAC-NWIS V2.4
              </span>
              <span className="text-[10px] font-mono text-[#dbdad6]">/</span>
              <span className="px-2 py-0.5 rounded bg-[#fecf50]/20 text-[10px] font-mono text-[#765b00] font-semibold uppercase tracking-wider">
                LIVE HEALTH ENGINE
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#444748]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#fecf50] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#765b00]"></span>
              </span>
              <span>SYSTEM RUNTIME: 844h 12m</span>
              <span className="text-[#dbdad6]">·</span>
              <span>HOST: OIL-NODE-MUMBAI-04</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 pb-2 border-b border-[#dbdad6]">
            <div className="space-y-1">
              <h1 className="text-3xl lg:text-4xl font-serif text-[#0d0d0d] tracking-tight font-bold">
                System Data & Model Health
              </h1>
              <p className="text-sm font-sans text-[#444748] max-w-3xl">
                Real-time edge ingestion rates, sensor calibration drift, WITSML latency, and machine learning model
                validation metrics across active borehole rigs.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 rounded-full bg-[#efeeea] hover:bg-[#dbdad6] text-xs font-mono text-[#1b1c1a] font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 border border-[#dbdad6] shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-[#0d0d0d]">sync</span>
                <span>Force Telemetry Sync (1 Hz)</span>
              </button>
              <button
                onClick={handlePsiRecalc}
                className="px-4 py-2 rounded-full bg-[#efeeea] hover:bg-[#dbdad6] text-xs font-mono text-[#1b1c1a] font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 border border-[#dbdad6] shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px] text-[#765b00]">tune</span>
                <span>Re-Calculate PSI</span>
              </button>
              <button
                onClick={handleExportDiagnostics}
                className="px-4 py-2 rounded-full bg-[#0d0d0d] hover:bg-[#30312e] text-xs font-mono text-white font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export Diagnostics JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Top System Status Ribbon (6 KPI Metric Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Card 1: WITSML Feed Rate */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">WITSML Feed</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#765b00] font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-[#765b00]"></span> 0.8s LAT
              </span>
            </div>
            <div className="space-y-0.5 my-1">
              <div className="text-2xl font-serif text-[#0d0d0d]">{feedRate}</div>
              <div className="text-[10px] font-mono text-[#444748] font-medium uppercase tracking-wider">
                STREAM ACTIVE
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] text-[10px] font-mono text-[#747878] flex items-center justify-between">
              <span>PACKET LOSS</span>
              <span className="font-semibold text-[#0d0d0d]">0.00%</span>
            </div>
          </div>

          {/* Card 2: OCR Extraction Backlog */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">OCR Pipeline</span>
              <span className="text-[10px] font-mono text-[#0d0d0d] font-semibold">4 / 24h</span>
            </div>
            <div className="space-y-0.5 my-1">
              <div className="text-2xl font-serif text-[#0d0d0d]">0 Pending</div>
              <div className="text-[10px] font-mono text-[#444748] font-medium uppercase tracking-wider">
                VALIDATED REALTIME
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] text-[10px] font-mono text-[#747878] flex items-center justify-between">
              <span>CONFIDENCE</span>
              <span className="font-semibold text-[#0d0d0d]">97.6% AVG</span>
            </div>
          </div>

          {/* Card 3: Active ML Model Version */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">Active ML Engine</span>
              <span className="px-1.5 py-0.2 rounded bg-[#e9e8e4] text-[9px] font-mono font-semibold">PROD</span>
            </div>
            <div className="space-y-0.5 my-1">
              <div className="text-2xl font-serif text-[#0d0d0d] truncate" title="NWIS v2.4-PROD">
                v2.4-PROD
              </div>
              <div className="text-[10px] font-mono text-[#444748] font-medium uppercase tracking-wider truncate">
                2024-Q2-REV8
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] text-[10px] font-mono text-[#747878] flex items-center justify-between">
              <span>TRAINED ON</span>
              <span className="font-semibold text-[#0d0d0d]">142 WELLS</span>
            </div>
          </div>

          {/* Card 4: Population Stability Index */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">Stability (PSI)</span>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold">&lt; 0.10 SAFE</span>
            </div>
            <div className="space-y-0.5 my-1">
              <div className="text-2xl font-serif text-[#0d0d0d]">{psiValue}</div>
              <div className="text-[10px] font-mono text-[#444748] font-medium uppercase tracking-wider">
                STABLE DRIFT
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] text-[10px] font-mono text-[#747878] flex items-center justify-between">
              <span>DRIFT HORIZON</span>
              <span className="font-semibold text-[#0d0d0d]">NORMAL</span>
            </div>
          </div>

          {/* Card 5: TimescaleDB Health */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">TimescaleDB</span>
              <span className="text-[10px] font-mono text-[#0d0d0d] font-semibold">12ms LAT</span>
            </div>
            <div className="space-y-0.5 my-1">
              <div className="text-2xl font-serif text-[#0d0d0d]">4 / 20 Conn</div>
              <div className="text-[10px] font-mono text-[#444748] font-medium uppercase tracking-wider">
                0 DEADLOCKS
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] text-[10px] font-mono text-[#747878] flex items-center justify-between">
              <span>HYPERTABLES</span>
              <span className="font-semibold text-[#0d0d0d]">8 POOLS</span>
            </div>
          </div>

          {/* Card 6: Redis Telemetry Stream */}
          <div className="p-4 rounded-xl bg-white border border-[#dbdad6] flex flex-col justify-between shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">Redis Cache</span>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold">120s LOCKED</span>
            </div>
            <div className="space-y-0.5 my-1">
              <div className="text-2xl font-serif text-[#0d0d0d]">0 ms Lag</div>
              <div className="text-[10px] font-mono text-[#444748] font-medium uppercase tracking-wider">
                1.2M INGEST PTS
              </div>
            </div>
            <div className="pt-2 border-t border-[#dbdad6] text-[10px] font-mono text-[#747878] flex items-center justify-between">
              <span>MEM USAGE</span>
              <span className="font-semibold text-[#0d0d0d]">482 MB</span>
            </div>
          </div>
        </div>

        {/* 3. Middle Grid (2 Columns: 1fr | 1fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: ML Subsurface Model Performance */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider block mb-1">
                  SECTION 02 // INFERENCE MONITOR
                </span>
                <h2 className="text-xl font-serif font-bold text-[#0d0d0d]">
                  ML Subsurface Model Performance & Accuracy
                </h2>
              </div>
              <span className="material-symbols-outlined text-[#747878] text-[24px]">model_training</span>
            </div>

            <div className="space-y-3">
              {/* Model 1 */}
              <div className="p-3.5 rounded-xl bg-[#f5f4ef] border border-[#dbdad6] transition-all hover:bg-[#efeeea]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#765b00]"></span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">Analogue Similarity Ranker</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#e3e2de] text-[9px] font-mono text-[#444748]">
                      GEO-SIM-01
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#765b00] font-semibold">100% UPTIME</span>
                </div>
                <p className="text-xs font-sans text-[#444748] mb-2.5">
                  Multi-factor weighted cosine distance on offset formation tops and litho-logs.
                </p>
                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-[#dbdad6]">
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Confidence</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">99.1%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Top-3 Hit Rate</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">94.4%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Inference</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">18 ms</span>
                  </div>
                </div>
              </div>

              {/* Model 2 */}
              <div className="p-3.5 rounded-xl bg-[#f5f4ef] border border-[#dbdad6] transition-all hover:bg-[#efeeea]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#765b00]"></span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">DFIM Stratigraphic Alignment</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#e3e2de] text-[9px] font-mono text-[#444748]">
                      STRAT-ALIGN
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#1b1c1a] font-semibold">88.4% SCORE</span>
                </div>
                <p className="text-xs font-sans text-[#444748] mb-2.5">
                  Non-linear depth morphing active across Digboi-Tipam formation interfaces.
                </p>
                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-[#dbdad6]">
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">DTW Quality</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">88.4%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Markers Synced</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">16 / 18</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Warp Factor</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">1.032</span>
                  </div>
                </div>
              </div>

              {/* Model 3 */}
              <div className="p-3.5 rounded-xl bg-[#f5f4ef] border border-[#dbdad6] transition-all hover:bg-[#efeeea]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#fecf50]"></span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">
                      ISA-18.2 Hazard Lookahead Engine
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#e3e2de] text-[9px] font-mono text-[#444748]">
                      HAZ-AI
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#fecf50] text-[9px] font-mono text-[#735800] font-semibold">
                    2 WARNINGS ACTIVE
                  </span>
                </div>
                <p className="text-xs font-sans text-[#444748] mb-2.5">
                  Predictive pore-pressure regression and kick potential window classification.
                </p>
                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-[#dbdad6]">
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">AUC-ROC</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">0.910</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">SHAP Fidelity</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">94.8%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Horizon</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">+45 m TVD</span>
                  </div>
                </div>
              </div>

              {/* Model 4 */}
              <div className="p-3.5 rounded-xl bg-[#f5f4ef] border border-[#dbdad6] transition-all hover:bg-[#efeeea]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#765b00]"></span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">
                      Vibration & Anomaly Detector
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#e3e2de] text-[9px] font-mono text-[#444748]">
                      D-DYN
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#444748] font-semibold">1.2 ALARMS / 24H</span>
                </div>
                <p className="text-xs font-sans text-[#444748] mb-2.5">
                  Torsional stick-slip detection and bit bounce frequency clustering.
                </p>
                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-lg border border-[#dbdad6]">
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Accuracy</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">96.2%</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">False Positives</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">0.08 / hr</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-[#747878] uppercase">Window</span>
                    <span className="text-xs font-mono font-semibold text-[#0d0d0d]">300 samples</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#dbdad6] flex items-center justify-between flex-wrap gap-2">
              <div className="text-[10px] font-mono text-[#444748]">
                AUTO-RETRAIN TRIGGER: WHEN PSI &gt; 0.15 OR AUC &lt; 0.85
              </div>
              <button
                onClick={handleRetrain}
                className="px-4 py-2 rounded-full bg-[#0d0d0d] hover:bg-[#30312e] text-[10px] font-mono text-white font-semibold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">play_circle</span>
                <span>Trigger Retraining Pipeline</span>
              </button>
            </div>
          </div>

          {/* Right Column: Drilling Sensor Channel Integrity & Calibration Drift */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider block mb-1">
                  SECTION 03 // SURFACE & DOWNHOLE BUS
                </span>
                <h2 className="text-xl font-serif font-bold text-[#0d0d0d]">
                  Drilling Sensor Channel Integrity & Drift
                </h2>
              </div>
              <span className="px-2 py-1 rounded bg-[#efeeea] text-[10px] font-mono text-[#444748] uppercase font-semibold border border-[#dbdad6]">
                7 ACTIVE CHANNELS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f5f4ef] text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l-lg">Channel / Parameter</th>
                    <th className="py-2.5 px-3">Quality</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Drift Value</th>
                    <th className="py-2.5 px-3 rounded-r-lg text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-mono divide-y divide-[#dbdad6]/40">
                  {SENSOR_CHANNELS.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#f5f4ef] transition-colors ${
                        row.advisory ? "bg-[#fecf50]/10 hover:bg-[#fecf50]/20" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#0d0d0d] flex items-center gap-1.5">
                          <span>{row.channel}</span>
                          {row.advisory && (
                            <span className="material-symbols-outlined text-[14px] text-[#765b00]">info</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-[#747878]">{row.tag}</div>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#0d0d0d]">{row.quality}</td>
                      <td className="py-2.5 px-3 text-[11px] text-[#444748]">{row.latency}</td>
                      <td
                        className={`py-2.5 px-3 text-[11px] font-semibold ${
                          row.advisory ? "text-[#765b00]" : "text-[#0d0d0d]"
                        }`}
                      >
                        {row.drift}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            row.status === "Nominal"
                              ? "bg-[#efeeea] text-[#0d0d0d]"
                              : "bg-[#fecf50] text-[#735800]"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] flex items-center justify-between text-[11px] font-mono text-[#444748]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#765b00]">sensors</span>
                Rig Bus Protocol: Profibus DP & WITSML 1.4.1.1
              </span>
              <span className="text-[#0d0d0d] font-semibold">All 7/7 Channels Polling</span>
            </div>
          </div>
        </div>

        {/* 4. Bottom Panel: Population Stability Index & Concept Drift Horizon */}
        <div className="p-5 lg:p-6 rounded-2xl bg-white border border-[#dbdad6] shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider block mb-1">
                SECTION 04 // DATA DISTRIBUTION FIDELITY
              </span>
              <h2 className="text-xl font-serif font-bold text-[#0d0d0d]">
                Population Stability Index (PSI) & Concept Drift Horizon
              </h2>
              <p className="text-xs font-sans text-[#444748]">
                Quantifies feature distribution variation between baseline offset wells and active drilling borehole telemetry.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-[#f5f4ef] border border-[#dbdad6] text-right">
                <span className="block text-[9px] font-mono text-[#747878] uppercase">CURRENT PSI</span>
                <span className="text-base font-serif font-bold text-[#0d0d0d]">{psiValue}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-[#fecf50]/20 border border-[#fecf50] text-right">
                <span className="block text-[9px] font-mono text-[#765b00] uppercase font-semibold">CLASSIFICATION</span>
                <span className="text-base font-serif font-bold text-[#765b00]">STABLE</span>
              </div>
            </div>
          </div>

          {/* PSI Visual Gauge & Progress Scale */}
          <div className="space-y-2 py-1">
            <div className="flex justify-between text-[10px] font-mono uppercase text-[#444748] font-semibold">
              <span>0.00 (Perfect Alignment)</span>
              <span className="text-[#0d0d0d]">0.10 (Warning Horizon)</span>
              <span className="text-[#ba1a1a] font-bold">0.25 (Critical Retrain)</span>
              <span>0.30+</span>
            </div>

            {/* Scale Container */}
            <div className="relative h-6 w-full rounded-full bg-[#efeeea] border border-[#dbdad6] overflow-hidden p-1 flex items-center">
              <div className="h-full bg-[#e9e8e4] rounded-l-full w-1/3"></div>
              <div className="h-full bg-[#fecf50]/30 w-1/2"></div>
              <div className="h-full bg-[#ffdad6]/40 rounded-r-full flex-1"></div>

              {/* Current Metric Marker Pin (Positioned at 0.04 / 0.30 = 13.3%) */}
              <div
                className="absolute left-[13.3%] top-0 bottom-0 w-3 bg-[#0d0d0d] rounded-full shadow-md flex items-center justify-center transform -translate-x-1/2 cursor-pointer transition-all hover:scale-125"
                title={`Active PSI: ${psiValue}`}
              >
                <div className="w-1 h-3 bg-[#fecf50] rounded-full"></div>
              </div>

              {/* Warning Line Marker */}
              <div className="absolute left-[33.3%] top-0 bottom-0 w-0.5 bg-[#747878] pointer-events-none"></div>
              {/* Critical Line Marker */}
              <div className="absolute left-[83.3%] top-0 bottom-0 w-0.5 bg-[#ba1a1a]/60 pointer-events-none"></div>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#747878] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded bg-[#e9e8e4] border border-[#dbdad6]"></span>
                <span>Stable Drift (&lt; 0.10)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded bg-[#fecf50]/60 border border-[#fecf50]"></span>
                <span>Moderate Shift (0.10 - 0.25)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded bg-[#ffdad6] border border-[#ba1a1a]"></span>
                <span>Significant Shift: Trigger Pipeline (&gt; 0.25)</span>
              </div>
            </div>
          </div>

          {/* Real-time Telemetry Ingestion Log & Audit Trail */}
          <div className="pt-3 border-t border-[#dbdad6] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#0d0d0d]">
                Telemetry Ingestion Log & Real-time Audit Trail
              </span>
              <span className="text-[10px] font-mono text-[#747878]">AUTO-REFRESHING 1 HZ</span>
            </div>

            <div className="rounded-xl bg-[#f5f4ef] border border-[#dbdad6] p-3 space-y-2 font-mono text-[11px] text-[#444748] max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between py-1 border-b border-[#dbdad6]/30">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#efeeea] text-[#0d0d0d] font-bold">14:22:07.892</span>
                  <span className="text-[#0d0d0d] font-semibold">[WITSML_INGEST]</span>
                  <span>102 records pushed to hypertable 'telemetry_depth_1hz'. Chunk compression ratio: 4.8x.</span>
                </div>
                <span className="text-[#765b00] font-semibold">SUCCESS (0.8s)</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#dbdad6]/30">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#efeeea] text-[#0d0d0d] font-bold">14:22:06.120</span>
                  <span className="text-[#0d0d0d] font-semibold">[PSI_EVAL]</span>
                  <span>Distribution snapshot verified for Gamma Ray & Resistivity against Digboi offset cluster. Delta = 0.0018.</span>
                </div>
                <span className="text-[#0d0d0d] font-semibold">STABLE</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#dbdad6]/30">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#efeeea] text-[#0d0d0d] font-bold">14:21:55.404</span>
                  <span className="text-[#765b00] font-semibold">[SENSOR_ADVISORY]</span>
                  <span>Coriolis Mud Density channel exhibited +0.01 SG tare drift during mud circulation switch.</span>
                </div>
                <span className="text-[#765b00] font-semibold">FLAGGED ADVISORY</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#dbdad6]/30">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#efeeea] text-[#0d0d0d] font-bold">14:21:30.001</span>
                  <span className="text-[#0d0d0d] font-semibold">[ML_CHECKPOINT]</span>
                  <span>ISA-18.2 Hazard Lookahead Engine weights verified: SHA-256 integrity match.</span>
                </div>
                <span className="text-[#0d0d0d] font-semibold">VERIFIED</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-[#efeeea] text-[#0d0d0d] font-bold">14:20:00.000</span>
                  <span className="text-[#0d0d0d] font-semibold">[OCR_CLEANUP]</span>
                  <span>Completed daily run: 4 daily drilling reports parsed, 0 ambiguous entities flagged.</span>
                </div>
                <span className="text-[#765b00] font-semibold">READY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
