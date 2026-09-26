"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle, XCircle, Clock, Search } from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  Approved: "badge-ok",
  Parsed: "badge-live",
  Pending_Validation: "badge-warning",
  Failed: "badge-critical",
};

const MOCK_DOCS = [
  { doc_id: "doc-001", filename: "DDR_NH-04_2022.pdf", status: "Approved", page_count: 142, extracted_events: 8, upload_date: "2026-09-01" },
  { doc_id: "doc-002", filename: "WCR_NH-07_Completion.pdf", status: "Pending_Validation", page_count: 88, extracted_events: 5, upload_date: "2026-09-15" },
  { doc_id: "doc-003", filename: "DDR_NH-09_2023.pdf", status: "Parsed", page_count: 210, extracted_events: 12, upload_date: "2026-09-18" },
];

const MOCK_QUEUE = [
  { entry_id: "q-001", doc_id: "doc-002", page: 44, status: "Pending_Validation",
    extracted_fields: { date: "2022-04-11", depth_tvdss: 2290.5, event_type: "Stuck_Pipe", mud_weight_sg: 1.18, remediation: "Worked pipe 45 min, pumped spotting fluid" } },
  { entry_id: "q-002", doc_id: "doc-002", page: 61, status: "Pending_Validation",
    extracted_fields: { date: "2022-05-02", depth_tvdss: 2540.0, event_type: "Gas_Kick", mud_weight_sg: 1.21, remediation: "Pumped 20 bbl weighted plug, shut-in 45 min" } },
];

export default function DocumentsPage() {
  const [docs, setDocs] = useState(MOCK_DOCS);
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [selected, setSelected] = useState<string | null>("doc-002");
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  function handleApprove(entryId: string) {
    setQueue((prev) => prev.map((q) => q.entry_id === entryId ? { ...q, status: "Approved" } : q));
  }
  function handleReject(entryId: string) {
    setQueue((prev) => prev.map((q) => q.entry_id === entryId ? { ...q, status: "Rejected" } : q));
  }

  function handleSearch() {
    if (!search.trim()) return;
    setSearchResults([
      { event_id: "ev-001", wellbore_name: "NH-04-WB01", event_type: "Lost_Circulation",
        depth_tvdss: 2310.5, remediation_applied: "40 ppb CaCO3 LCM pill spotted",
        mitigation_outcome: "Successful", source_document_name: "DDR_NH-04_2022.pdf",
        source_page_number: 42, relevance_score: 0.92 },
    ]);
  }

  const pendingQueue = queue.filter((q) => q.status === "Pending_Validation");

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Document Intelligence Hub</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            DDR / WCR PDF Ingestion · Engineering Validation Queue · Semantic Search
          </p>
        </div>
        <button className="btn btn-primary">
          <Upload size={14} /> Upload DDR/WCR PDF
        </button>
      </div>

      {/* Search bar */}
      <div className="panel mb-4">
        <div className="flex items-center gap-3">
          <Search size={15} style={{ color: "var(--color-base-600)" }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder='Search drilling events… e.g. "lost returns", "stuck pipe Barail"'
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-base-200)"
            }}
          />
          <button className="btn btn-ghost" onClick={handleSearch} style={{ padding: "0.3rem 0.75rem" }}>Search</button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 pt-3 divider">
            {searchResults.map((r) => (
              <div key={r.event_id} className="panel-sm" style={{ background: "var(--color-base-800)" }}>
                <div className="flex items-center justify-between">
                  <span className="section-heading" style={{ fontSize: "0.8rem", color: "var(--color-live)" }}>{r.event_type.replace(/_/g, " ")}</span>
                  <span className="badge badge-ok">Relevance {Math.round(r.relevance_score * 100)}%</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "var(--color-base-400)", marginTop: 4 }}>{r.remediation_applied}</p>
                <p className="mono-label" style={{ fontSize: "0.6rem", marginTop: 4 }}>
                  {r.source_document_name} · p.{r.source_page_number} · {r.depth_tvdss} m TVDSS
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Left — Document list */}
        <div className="panel">
          <h2 className="section-heading mb-3">Documents</h2>
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <button key={doc.doc_id}
                className="panel-sm text-left"
                style={{
                  background: selected === doc.doc_id ? "var(--color-base-800)" : "transparent",
                  border: selected === doc.doc_id ? "1px solid var(--color-live)" : "1px solid var(--color-base-700)",
                  cursor: "pointer", transition: "all 120ms ease"
                }}
                onClick={() => setSelected(doc.doc_id)}>
                <div className="section-heading" style={{ fontSize: "0.75rem", marginBottom: 4 }}>{doc.filename}</div>
                <div className="flex items-center justify-between">
                  <span className={`badge ${STATUS_BADGE[doc.status]}`} style={{ fontSize: "0.58rem" }}>{doc.status.replace(/_/g, " ")}</span>
                  <span className="mono-label" style={{ fontSize: "0.6rem" }}>{doc.extracted_events} events</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Validation Queue */}
        <div className="panel">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-heading">Engineering Validation Queue</h2>
            <span className="badge badge-warning">{pendingQueue.length} pending</span>
          </div>
          {pendingQueue.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center" }}>
              <CheckCircle size={24} style={{ margin: "0 auto 0.5rem", color: "var(--color-ok)" }} />
              <p className="text-secondary">All events validated</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {pendingQueue.map((entry) => (
                <div key={entry.entry_id} className="panel-sm" style={{ borderLeft: "3px solid var(--color-warning)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="mono-label">Source · p.{entry.page}</span>
                    <span className="badge badge-warning" style={{ fontSize: "0.58rem" }}>Pending Validation</span>
                  </div>
                  <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    {Object.entries(entry.extracted_fields).map(([k, v]) => (
                      <div key={k} className="metric-card">
                        <span className="mono-label" style={{ fontSize: "0.58rem" }}>{k.replace(/_/g, " ")}</span>
                        <span className="mono-data" style={{ fontSize: "0.85rem", color: "var(--color-base-200)" }}>{String(v)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button className="btn btn-primary" style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem" }}
                      onClick={() => handleApprove(entry.entry_id)}>
                      <CheckCircle size={12} /> Approve & Commit
                    </button>
                    <button className="btn btn-danger" style={{ justifyContent: "center", fontSize: "0.75rem" }}
                      onClick={() => handleReject(entry.entry_id)}>
                      <XCircle size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
