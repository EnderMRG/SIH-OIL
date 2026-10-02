"use client";

import React, { useState } from "react";

interface ExtractionCandidate {
  id: string;
  docId: string;
  code: string;
  eventType: string;
  severity: "critical" | "warning";
  probability: number;
  depth: string;
  formation: string;
  lossMud: string;
  ocrSnippet: string;
  highlightedPhrase: string;
  spatialImpact: string;
  proximity: string;
}

interface ScannedDocument {
  id: string;
  filename: string;
  subtitle: string;
  type: "pdf" | "las";
  status: "pending" | "approved" | "synced";
  stats: { label: string; value: string }[];
  page: number;
}

const INITIAL_CANDIDATES: ExtractionCandidate[] = [
  {
    id: "candidate-1",
    docId: "doc-1",
    code: "#OIL-EVT-9042",
    eventType: "Severe Lost Circulation",
    severity: "critical",
    probability: 98.9,
    depth: "2,912.0 m TVDSS",
    formation: "Tipam Lower Sand",
    lossMud: "45.0 m³ | 1.28 SG",
    ocrSnippet:
      "...at 2912m bit encountered sudden loss of returns. Pit level dropped 45m3 before pumps stopped. Mixed 20m3 coarse LCM pill with 40ppb CaCO3 and pumped into annulus...",
    highlightedPhrase: "sudden loss of returns",
    spatialImpact: "Offset NH-04 to Target NH-12: Projected 28m shallower in current well plan.",
    proximity: "PROXIMITY: 480m SE",
  },
  {
    id: "candidate-2",
    docId: "doc-1",
    code: "#OIL-EVT-9043",
    eventType: "Gas Influx / Connection Gas",
    severity: "warning",
    probability: 91.4,
    depth: "2,985.5 m TVDSS",
    formation: "Barail Arenaceous Unit",
    lossMud: "2.4% peak | C1/C2: 8.2",
    ocrSnippet:
      "...flow check negative after connection at 2985.5m. Circulated bottoms up. Max connection gas peaked at 2.4% with chromatographic C1-C4 traces. Weight up mud from 1.28 to 1.31 SG approved by DS...",
    highlightedPhrase: "connection gas peaked at 2.4%",
    spatialImpact: "Overpressure gas sand extends southward toward active target NH-12 trajectory.",
    proximity: "PROXIMITY: 3.4km S",
  },
  {
    id: "candidate-3",
    docId: "doc-1",
    code: "#OIL-EVT-9044",
    eventType: "Differential Sticking Indication",
    severity: "warning",
    probability: 88.5,
    depth: "2,450.0 m TVDSS",
    formation: "Tipam Upper Permeable",
    lossMud: "Overpull: 15t | 1.30 SG",
    ocrSnippet:
      "...pipe stationary during survey for 12 mins. Bit stuck on bottom with 15t overpull. Pumped 10 bbl lubricant pill and resumed rotation after 35 mins...",
    highlightedPhrase: "Bit stuck on bottom with 15t overpull",
    spatialImpact: "High filter cake buildup noted in thick permeable sand intervals.",
    proximity: "PROXIMITY: 1.8km NE",
  },
];

const INITIAL_DOCS: ScannedDocument[] = [
  { id: "doc-1", filename: "DDR_OIL_NH04_Phase2.pdf", subtitle: "Offset NH-04 · Daily Drilling Report", type: "pdf", status: "pending", stats: [{label: "VOLUME", value: "48 Pages"}, {label: "OCR CONF.", value: "96.8%"}, {label: "EXTRACTED", value: "6 Incidents"}], page: 42 },
  { id: "doc-2", filename: "WCR_OIL_NH07_Final.pdf", subtitle: "Offset NH-07 · Completion Report", type: "pdf", status: "approved", stats: [{label: "VOLUME", value: "112 Pages"}, {label: "OCR CONF.", value: "98.4%"}, {label: "EXTRACTED", value: "4 Incidents"}], page: 12 },
  { id: "doc-3", filename: "DDR_OIL_NH09_Section3.pdf", subtitle: "Offset NH-09 · Section Drilling Log", type: "pdf", status: "approved", stats: [{label: "VOLUME", value: "32 Pages"}, {label: "OCR CONF.", value: "99.1%"}, {label: "EXTRACTED", value: "2 Incidents"}], page: 5 },
  { id: "doc-4", filename: "LAS_LOG_NH12_MWD_RUN4.las", subtitle: "Active Well Run 4 · MWD Log", type: "las", status: "synced", stats: [{label: "CURVES", value: "14 Channels"}, {label: "DEPTH RANGE", value: "2,100 - 3,015 m"}, {label: "STEP", value: "0.1 m"}], page: 1 },
];

export default function DocumentsPage() {
  const [candidates, setCandidates] = useState<ExtractionCandidate[]>(INITIAL_CANDIDATES);
  const [documents, setDocuments] = useState<ScannedDocument[]>(INITIAL_DOCS);
  const [docFilter, setDocFilter] = useState<"all" | "validated" | "pending">("all");
  const [selectedDocId, setSelectedDocId] = useState<string>("doc-1");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [editingCandidate, setEditingCandidate] = useState<ExtractionCandidate | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const checkDocCompletion = (docId: string, currentCandidates: ExtractionCandidate[]) => {
    const remainingForDoc = currentCandidates.filter((c) => c.docId === docId);
    if (remainingForDoc.length === 0) {
      setDocuments((docs) => docs.map((d) => (d.id === docId ? { ...d, status: "approved" } : d)));
    }
  };

  const handleApprove = (id: string, docId: string) => {
    setCandidates((prev) => {
      const next = prev.filter((c) => c.id !== id);
      checkDocCompletion(docId, next);
      return next;
    });
    showToast("✓ Extraction candidate approved & vectorized into Subsurface Knowledge Graph.");
  };

  const handleReject = (id: string, docId: string) => {
    setCandidates((prev) => {
      const next = prev.filter((c) => c.id !== id);
      checkDocCompletion(docId, next);
      return next;
    });
    showToast("✕ Candidate rejected and archived from validation queue.");
  };

  const filteredDocs = documents.filter((doc) => {
    if (docFilter === "validated" && doc.status !== "approved" && doc.status !== "synced") return false;
    if (docFilter === "pending" && doc.status !== "pending") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!doc.filename.toLowerCase().includes(q) && !doc.subtitle.toLowerCase().includes(q)) {
        // Also check if any candidate matches
        const hasMatchingCandidate = candidates.some(c => c.docId === doc.id && c.ocrSnippet.toLowerCase().includes(q));
        if (!hasMatchingCandidate) return false;
      }
    }
    return true;
  });

  const selectedDoc = documents.find(d => d.id === selectedDocId);
  const displayedCandidates = candidates.filter(c => c.docId === selectedDocId && (!searchQuery || c.ocrSnippet.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#0d0d0d] text-white px-4 py-2.5 rounded-full text-[12px] font-mono shadow-lg flex items-center gap-2 border border-[#dbdad6]">
          <span className="w-2 h-2 rounded-full bg-[#fecf50]"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Subsurface Header Section */}
      <header className="px-8 pt-6 pb-4 border-b border-[#dbdad6]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase text-[#444748] tracking-wider">
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#e9e8e4] text-[#0d0d0d] border border-[#dbdad6]">
                eRTMAC-NWIS
              </span>
              <span>/</span>
              <span>OIL INDIA SUB-SURFACE REGISTRY</span>
              <span>/</span>
              <span className="text-[#765b00] font-semibold">MODULE 07</span>
            </div>
            <h1 className="font-serif text-[34px] font-bold text-[#0d0d0d] tracking-tight leading-none">
              Document Intelligence Hub
            </h1>
            <p className="text-[14px] text-[#444748]">
              OCR Extraction, Vector Semantic Search &amp; Human-in-the-Loop Engineering Validation Queue.
            </p>
          </div>

          {/* Action Panel: Semantic Search + Upload Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex items-center bg-[#e9e8e4] border border-[#dbdad6] rounded-full px-4 py-1.5 min-w-[320px]">
              <span className="material-symbols-outlined text-[18px] text-[#444748] mr-2">
                manage_search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., lost returns Barail, stuck pipe NH-04"
                className="bg-transparent text-[12px] font-mono text-[#0d0d0d] placeholder:text-[#444748]/60 focus:outline-none w-full"
              />
              <button
                onClick={() => showToast(`Searching knowledge graph for: "${searchQuery}"...`)}
                className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-[10px] font-mono text-[#0d0d0d] border border-[#dbdad6] hover:bg-[#efeeea] transition-colors"
              >
                <span>Search</span>
                <span className="opacity-60 text-[9px]">↵</span>
              </button>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>+ Upload DDR / WCR PDF</span>
            </button>
          </div>
        </div>
      </header>

      {/* Editorial Architectural Metric Ribbons */}
      <section className="px-8 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-[#f5f4ef] border border-[#dbdad6] rounded-xl shadow-sm">
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              Indexed Documents
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[28px] font-bold text-[#0d0d0d]">1,482</span>
              <span className="text-[10px] font-mono text-[#765b00] font-semibold">18 NEW (24H)</span>
            </div>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              Model Precision (OCR)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[28px] font-bold text-[#0d0d0d]">97.6%</span>
              <span className="text-[10px] font-mono text-[#444748]">GEO-LAYOUT-LM</span>
            </div>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              Extracted Geohazards
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[28px] font-bold text-[#0d0d0d]">318</span>
              <span className="text-[10px] font-mono text-[#ba1a1a] font-semibold">12 HIGH RISK</span>
            </div>
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
              Active Validation Queue
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-[28px] font-bold text-[#0d0d0d]">
                {candidates.length}
              </span>
              <span className="text-[10px] font-mono text-[#444748]">CANDIDATES AWAITING</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Asymmetric Workspace Layout */}
      <main className="px-8 py-3 flex-1">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: Ingested Documents Library (col-span-4) ================= */}
          <div className="xl:col-span-4 flex flex-col space-y-4">
            {/* Filter Tabs */}
            <div className="flex items-center justify-between p-1 bg-[#efeeea] border border-[#dbdad6] rounded-lg">
              <button
                onClick={() => setDocFilter("all")}
                className={`flex-1 py-1 px-3 rounded-md text-[11px] font-mono transition-all text-center ${
                  docFilter === "all"
                    ? "bg-white text-[#0d0d0d] font-semibold shadow-sm"
                    : "text-[#444748] hover:text-[#0d0d0d]"
                }`}
              >
                All (18)
              </button>
              <button
                onClick={() => setDocFilter("validated")}
                className={`flex-1 py-1 px-3 rounded-md text-[11px] font-mono transition-all text-center ${
                  docFilter === "validated"
                    ? "bg-white text-[#0d0d0d] font-semibold shadow-sm"
                    : "text-[#444748] hover:text-[#0d0d0d]"
                }`}
              >
                Validated (14)
              </button>
              <button
                onClick={() => setDocFilter("pending")}
                className={`flex-1 py-1 px-3 rounded-md text-[11px] font-mono transition-all text-center flex items-center justify-center gap-1 ${
                  docFilter === "pending"
                    ? "bg-white text-[#0d0d0d] font-semibold shadow-sm"
                    : "text-[#444748] hover:text-[#0d0d0d]"
                }`}
              >
                <span>Pending</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50]"></span>
                <span>({candidates.length})</span>
              </button>
            </div>

            {/* Document Stack */}
            <div className="space-y-3">
              {filteredDocs.map((doc) => {
                const docCandidates = candidates.filter(c => c.docId === doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`group relative p-4 rounded-xl transition-all cursor-pointer border ${
                      selectedDocId === doc.id
                        ? "bg-white border-[#0d0d0d] shadow-md"
                        : "bg-[#f5f4ef] border-[#dbdad6] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg bg-[#efeeea] border border-[#dbdad6] flex items-center justify-center ${doc.type === "las" ? "text-[#765b00]" : "text-[#444748]"}`}>
                          <span className="material-symbols-outlined text-[20px]">
                            {doc.type === "las" ? "show_chart" : (doc.status === "pending" ? "description" : "assignment_turned_in")}
                          </span>
                        </div>
                        <div>
                          <h2 className="font-serif text-[17px] font-bold text-[#0d0d0d] leading-snug truncate max-w-[200px]">
                            {doc.filename}
                          </h2>
                          <p className="text-[10px] font-mono text-[#444748] uppercase">
                            {doc.subtitle}
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        doc.status === "pending" 
                          ? "bg-[#fecf50] text-[#735800]"
                          : (doc.status === "synced" ? "bg-[#efeeea] text-[#765b00] inline-flex items-center gap-1" : "bg-[#e9e8e4] text-[#0d0d0d]")
                      }`}>
                        {doc.status === "pending" && `${docCandidates.length} PENDING`}
                        {doc.status === "approved" && "APPROVED"}
                        {doc.status === "synced" && (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fecf50] animate-pulse"></span>
                            SYNCED (1 Hz)
                          </>
                        )}
                      </span>
                    </div>
                    <div className="mt-3 pt-2 border-t border-[#dbdad6] grid grid-cols-3 gap-2 text-[10px] font-mono">
                      {doc.stats.map((stat, i) => (
                        <div key={i}>
                          <span className="text-[#444748] block">{stat.label}</span>
                          <span className={`font-semibold ${i === 1 ? "text-[#765b00]" : "text-[#0d0d0d]"}`}>
                            {stat.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Archival Box Stamp */}
            <div className="p-3.5 bg-[#f5f4ef] border border-[#dbdad6] rounded-xl flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#444748]">folder_special</span>
                <span className="text-[#0d0d0d] uppercase font-semibold">Archive Index Node</span>
              </div>
              <span className="text-[#444748]">SERIES 2024 / NH-AS</span>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: Human-in-the-Loop Extraction Queue ================= */}
          <div className="xl:col-span-8 flex flex-col space-y-4">
            {/* Queue Header Card */}
            <div className="bg-white border border-[#dbdad6] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#fecf50]"></span>
                  <span className="text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                    Human-in-the-Loop Extraction Review
                  </span>
                </div>
                <h2 className="font-serif text-[24px] font-bold text-[#0d0d0d]">
                  {selectedDoc ? selectedDoc.filename : "No Document Selected"} <span className="text-[14px] font-mono text-[#444748] font-normal">(Page {selectedDoc?.page || 1})</span>
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f5f4ef] border border-[#dbdad6] text-[10px] font-mono text-[#0d0d0d] font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-[#765b00]">verified</span>
                  OCR Confidence: 94.2%
                </span>
              </div>
            </div>

            {displayedCandidates.length === 0 ? (
              <div className="bg-white border border-[#dbdad6] rounded-xl p-12 text-center space-y-2">
                <span className="material-symbols-outlined text-[48px] text-[#765b00]">task_alt</span>
                <h3 className="font-serif text-[22px] font-bold text-[#0d0d0d]">
                  {selectedDoc?.status === "synced" ? "Data Synced Automatically" : "Validation Queue Cleared"}
                </h3>
                <p className="text-[12px] font-mono text-[#444748]">
                  {selectedDoc?.status === "synced" 
                    ? "This log is directly streamed via WITSML and requires no manual OCR validation."
                    : "All candidates for this document have been processed or none exist."}
                </p>
              </div>
            ) : (
              displayedCandidates.map((c) => (
                <article
                  key={c.id}
                  className="bg-white border border-[#dbdad6] p-5 rounded-xl flex flex-col space-y-4 transition-all shadow-sm"
                >
                  {/* Event Status Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold ${
                          c.severity === "critical"
                            ? "bg-[#ba1a1a] text-white"
                            : "bg-[#fecf50] text-[#735800]"
                        }`}
                      >
                        {c.eventType}
                      </span>
                      <span className="text-[10px] font-mono text-[#444748] uppercase">
                        ENTITY ID: {c.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#444748]">
                      <span>PROBABILITY MATCH:</span>
                      <span className="text-[#0d0d0d] font-bold">{c.probability}%</span>
                    </div>
                  </div>

                  {/* Architectural Form Field Grids */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-[#f5f4ef] border border-[#dbdad6] rounded-lg flex flex-col justify-between">
                      <label className="text-[9px] font-mono text-[#444748] uppercase tracking-wider mb-1">
                        Extracted Depth (TVDSS)
                      </label>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[16px] font-bold text-[#0d0d0d]">{c.depth}</span>
                        <span className="material-symbols-outlined text-[16px] text-[#444748]">edit</span>
                      </div>
                    </div>
                    <div className="p-3 bg-[#f5f4ef] border border-[#dbdad6] rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] font-mono text-[#444748] uppercase tracking-wider mb-1">
                        Formation Top
                      </span>
                      <div className="font-serif text-[17px] font-bold text-[#0d0d0d]">{c.formation}</div>
                    </div>
                    <div className="p-3 bg-[#f5f4ef] border border-[#dbdad6] rounded-lg flex flex-col justify-between">
                      <span className="text-[9px] font-mono text-[#444748] uppercase tracking-wider mb-1">
                        Loss Volume &amp; Mud Weight
                      </span>
                      <div className="font-mono text-[16px] font-bold text-[#0d0d0d]">{c.lossMud}</div>
                    </div>
                  </div>

                  {/* Original OCR Raw Snippet Section */}
                  <div className="p-3.5 bg-[#faf9f5] border border-[#dbdad6] rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#444748] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">scanner</span>
                        Original OCR Telemetry Excerpt (Line 24-27)
                      </span>
                      <span>Matched with Barail/Tipam Stratigraphy</span>
                    </div>
                    <p className="text-[12px] text-[#0d0d0d] leading-relaxed font-mono">
                      &quot;...at <mark className="bg-[#fecf50] text-[#0d0d0d] px-1 py-0.5 rounded font-semibold">{c.highlightedPhrase}</mark>. {c.ocrSnippet}...&quot;
                    </p>
                  </div>

                  {/* Visual Stratigraphic Marker Preview */}
                  <div className="p-2.5 bg-[#f5f4ef] border border-[#dbdad6] rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-7 rounded-full ${c.severity === "critical" ? "bg-[#ba1a1a]" : "bg-[#765b00]"}`}></div>
                      <div>
                        <span className="text-[10px] font-mono text-[#0d0d0d] uppercase font-semibold">
                          Cross-Well Spatial Impact
                        </span>
                        <p className="text-[10px] font-mono text-[#444748]">{c.spatialImpact}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#765b00] font-semibold uppercase">
                      {c.proximity}
                    </span>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-[#dbdad6]">
                    <button
                      onClick={() => handleReject(c.id, c.docId)}
                      className="px-4 py-2 rounded-full bg-[#f5f4ef] hover:bg-[#e9e8e4] text-[#0d0d0d] border border-[#dbdad6] text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#ba1a1a]">close</span>
                      <span>✕ Reject</span>
                    </button>
                    <button
                      onClick={() => setEditingCandidate(c)}
                      className="px-4 py-2 rounded-full bg-[#f5f4ef] hover:bg-[#e9e8e4] text-[#0d0d0d] border border-[#dbdad6] text-[11px] font-mono uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      <span>✎ Edit</span>
                    </button>
                    <button
                      onClick={() => handleApprove(c.id, c.docId)}
                      className="px-6 py-2 rounded-full bg-[#0d0d0d] hover:opacity-90 text-white text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#fecf50]">check_circle</span>
                      <span>✓ Approve &amp; Commit to Database</span>
                    </button>
                  </div>
                </article>
              ))
            )}

            {/* Informational Engineering Footnote Banner */}
            <aside className="p-4 bg-[#f5f4ef] border border-[#dbdad6] rounded-xl flex items-start gap-3 text-[#0d0d0d]">
              <span className="material-symbols-outlined text-[#765b00] text-[20px] mt-0.5">info</span>
              <div className="space-y-0.5">
                <h3 className="font-serif text-[15px] font-bold text-[#0d0d0d]">
                  Regulatory Subsurface Compliance
                </h3>
                <p className="text-[12px] text-[#444748]">
                  Approved incidents are vectorized into the Subsurface Spatial Knowledge Graph and correlated instantly with active 12-1/4&quot; drilling dynamics on Rig SE-802.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#dbdad6] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#dbdad6] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#0d0d0d]">upload_file</span>
                <h3 className="font-serif text-[20px] font-bold text-[#0d0d0d]">
                  Ingest Subsurface PDF Document
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-[#444748] hover:text-[#0d0d0d] text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="border-2 border-dashed border-[#dbdad6] rounded-xl p-8 text-center space-y-3 bg-[#faf9f5]">
              <span className="material-symbols-outlined text-[42px] text-[#765b00]">cloud_upload</span>
              <div>
                <p className="text-[13px] font-semibold text-[#0d0d0d]">
                  Drag &amp; drop Daily Drilling Report or Completion Report
                </p>
                <p className="text-[10px] font-mono text-[#444748] mt-1">
                  Supported formats: PDF, TIFF, scanned LAS files (Up to 50 MB)
                </p>
              </div>
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const newDocId = `doc-${Date.now()}`;
                    const fileName = e.target.files[0].name;
                    const newDoc: ScannedDocument = {
                      id: newDocId,
                      filename: fileName,
                      subtitle: "Uploaded Document",
                      type: "pdf",
                      status: "pending",
                      stats: [{label: "VOLUME", value: "12 Pages"}, {label: "OCR CONF.", value: "Processing..."}, {label: "EXTRACTED", value: "0 Incidents"}],
                      page: 1,
                    };
                    
                    setDocuments(prev => [newDoc, ...prev]);
                    setSelectedDocId(newDocId);
                    showToast(`Ingesting ${fileName} into OCR parsing queue...`);
                    setShowUploadModal(false);
                    
                    setTimeout(() => {
                      setDocuments(prev => prev.map(d => d.id === newDocId ? {
                        ...d, 
                        stats: [{label: "VOLUME", value: "12 Pages"}, {label: "OCR CONF.", value: "92.1%"}, {label: "EXTRACTED", value: "1 Incident"}]
                      } : d));
                      setCandidates(prev => [{
                        id: `cand-${Date.now()}`,
                        docId: newDocId,
                        code: "#OIL-EVT-NEW",
                        eventType: "Potential Hazard Detected",
                        severity: "warning",
                        probability: 85.0,
                        depth: "Unknown",
                        formation: "Unknown",
                        lossMud: "Unknown",
                        ocrSnippet: "...detected an anomaly at undefined depth. Review required...",
                        highlightedPhrase: "detected an anomaly",
                        spatialImpact: "Pending analysis",
                        proximity: "Unknown",
                      }, ...prev]);
                    }, 2500);
                  }
                }}
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider font-semibold cursor-pointer hover:opacity-90"
              >
                Browse Local Files
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-full bg-[#e9e8e4] text-[#0d0d0d] text-[11px] font-mono uppercase tracking-wider font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Candidate Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#dbdad6] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#dbdad6] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#0d0d0d]">edit_note</span>
                <h3 className="font-serif text-[20px] font-bold text-[#0d0d0d]">
                  Refine Extraction
                </h3>
              </div>
              <button
                onClick={() => setEditingCandidate(null)}
                className="text-[#444748] hover:text-[#0d0d0d] text-[18px]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 font-mono text-[11px]">
              <div>
                <label className="block text-[#444748] mb-1.5 uppercase tracking-wider">Depth (TVDSS)</label>
                <input 
                  type="text" 
                  className="w-full border border-[#dbdad6] bg-[#faf9f5] p-2.5 rounded-lg focus:outline-none focus:border-[#0d0d0d] transition-colors text-[13px] text-[#0d0d0d] font-bold" 
                  value={editingCandidate.depth} 
                  onChange={e => setEditingCandidate({...editingCandidate, depth: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[#444748] mb-1.5 uppercase tracking-wider">Formation Top</label>
                <input 
                  type="text" 
                  className="w-full border border-[#dbdad6] bg-[#faf9f5] p-2.5 rounded-lg focus:outline-none focus:border-[#0d0d0d] transition-colors text-[13px] text-[#0d0d0d] font-bold font-serif" 
                  value={editingCandidate.formation} 
                  onChange={e => setEditingCandidate({...editingCandidate, formation: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[#444748] mb-1.5 uppercase tracking-wider">Loss Volume / Mud Weight</label>
                <input 
                  type="text" 
                  className="w-full border border-[#dbdad6] bg-[#faf9f5] p-2.5 rounded-lg focus:outline-none focus:border-[#0d0d0d] transition-colors text-[13px] text-[#0d0d0d] font-bold" 
                  value={editingCandidate.lossMud} 
                  onChange={e => setEditingCandidate({...editingCandidate, lossMud: e.target.value})} 
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#dbdad6]">
              <button
                onClick={() => setEditingCandidate(null)}
                className="px-5 py-2.5 rounded-full bg-[#e9e8e4] text-[#0d0d0d] text-[11px] font-mono uppercase tracking-wider font-semibold hover:bg-[#dbdad6] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setCandidates(prev => prev.map(c => c.id === editingCandidate.id ? editingCandidate : c));
                  setEditingCandidate(null);
                  showToast("✓ Extraction details updated successfully.");
                }}
                className="px-5 py-2.5 rounded-full bg-[#0d0d0d] text-white text-[11px] font-mono uppercase tracking-wider font-semibold hover:opacity-90 transition-opacity"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
