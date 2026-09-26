"use client";

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend
} from "recharts";
import { FlaskConical } from "lucide-react";

export default function PorePressurePage() {
  const [curves, setCurves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testMW, setTestMW] = useState(1.15);
  const [flowRate, setFlowRate] = useState(2200);
  const [rop, setRop] = useState(8.0);
  const [whatIf, setWhatIf] = useState<any | null>(null);
  const [computing, setComputing] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/pore-pressure/curves?depth_from=0&depth_to=3200&step_m=50")
      .then((r) => r.json())
      .then((d) => { setCurves(d.curves); setLoading(false); })
      .catch(() => {
        // Mock fallback
        const mock = [];
        for (let d = 0; d <= 3200; d += 50) {
          const pp = 1.05 + d / 30000;
          const fg = d < 600 ? 1.55 : d < 1600 ? 1.62 : d < 2600 ? 1.68 : 1.72;
          const mw = Math.min(pp + 0.07 + d / 50000, fg - 0.08);
          mock.push({
            tvdss: d,
            pore_pressure_sg: parseFloat(pp.toFixed(3)),
            fracture_gradient_sg: parseFloat(fg.toFixed(3)),
            planned_mud_weight_sg: parseFloat(mw.toFixed(3)),
            ecd_sg: parseFloat((mw + 0.04).toFixed(3)),
          });
        }
        setCurves(mock);
        setLoading(false);
      });
  }, []);

  async function runWhatIf() {
    setComputing(true);
    try {
      const r = await fetch(
        `http://localhost:8000/api/pore-pressure/whats-if?test_mud_weight_sg=${testMW}&flow_rate_lpm=${flowRate}&rop_mhr=${rop}&current_tvdss=2850`
      );
      const d = await r.json();
      setWhatIf(d);
    } catch {
      // Mock computation
      const fg = 1.68;
      const pp = 1.15;
      const annLoss = (flowRate / 1000) * 12.5 * (2850 / 1000);
      const ecd = testMW + annLoss / (0.052 * 2850 * 3.28084);
      const flags = [];
      if (ecd >= fg) flags.push({ flag: "ECD_EXCEEDS_FRACTURE_GRADIENT", severity: "Critical" });
      else if (fg - ecd < 0.05) flags.push({ flag: "ECD_NEAR_FRACTURE_GRADIENT", severity: "Warning" });
      if (testMW < pp) flags.push({ flag: "UNDERBALANCED_DRILLING", severity: "Critical" });
      setWhatIf({
        inputs: { test_mud_weight_sg: testMW, flow_rate_lpm: flowRate, rop_mhr: rop },
        computed: {
          ecd_sg: parseFloat(ecd.toFixed(3)),
          ecd_to_fracture_margin_sg: parseFloat((fg - ecd).toFixed(3)),
          pore_pressure_sg: pp,
          fracture_gradient_sg: fg,
          casing_shoe_clearance_sg: parseFloat((1.58 - ecd).toFixed(3)),
          kick_tolerance_m3: parseFloat((Math.max(0, (1.58 - ecd) * 1800 * 0.015)).toFixed(2)),
        },
        risk_flags: flags,
        verdict: flags.length === 0 ? "SAFE" : flags.some((f) => f.severity === "Critical") ? "CRITICAL" : "WARNING",
      });
    }
    setComputing(false);
  }

  const CASING_SHOES = [
    { depth: 380, label: "Surface Casing (13⅜\")", emw: 1.48 },
    { depth: 1800, label: "Intermediate Casing (9⅝\")", emw: 1.58 },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <FlaskConical size={20} style={{ color: "var(--color-advisory)" }} />
        <div>
          <h1 className="display-lg" style={{ fontSize: "1.4rem" }}>Pore Pressure / Frac Window</h1>
          <p className="text-secondary" style={{ fontSize: "0.8rem", marginTop: 2 }}>
            Eaton Pore Pressure & Fracture Gradient · Deterministic What-If Console
          </p>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 380px" }}>
        {/* Left — Pressure window chart */}
        <div className="panel">
          <h2 className="section-heading mb-3">Pore Pressure / Fracture Gradient Window</h2>
          {loading ? (
            <div style={{ height: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="pulse-dot" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={curves} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-base-700)" />
                <XAxis type="number" domain={[0.9, 1.9]} tickFormatter={(v) => v.toFixed(2)}
                  style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                  label={{ value: "Equivalent Mud Weight (SG)", position: "bottom", offset: -5, style: { fontSize: 10, fill: "var(--color-base-400)" } }} />
                <YAxis type="number" dataKey="tvdss" domain={[0, 3200]} reversed
                  style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                  label={{ value: "TVDSS (m)", angle: -90, position: "insideLeft", style: { fontSize: 10, fill: "var(--color-base-400)" } }} />
                <Tooltip
                  contentStyle={{ background: "var(--color-base-900)", border: "1px solid var(--color-base-700)", fontSize: 11 }}
                  formatter={(v: any, name: any) => [Number(v).toFixed(3) + " SG", name]}
                  labelFormatter={(l: any) => `${l} m TVDSS`}
                />
                <Legend iconType="line" wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)", paddingTop: 12 }} />
                <Line dataKey="pore_pressure_sg"     name="Pore Pressure"  dot={false} strokeWidth={2} stroke="var(--color-critical)" animationDuration={300} />
                <Line dataKey="fracture_gradient_sg" name="Fracture Grad."  dot={false} strokeWidth={2} stroke="var(--color-warning)" animationDuration={300} />
                <Line dataKey="planned_mud_weight_sg" name="Planned MW"    dot={false} strokeWidth={1.5} stroke="var(--color-live)" strokeDasharray="4 2" animationDuration={300} />
                <Line dataKey="ecd_sg"               name="Active ECD"     dot={false} strokeWidth={1.5} stroke="var(--color-ok)" strokeDasharray="2 2" animationDuration={300} />
                {CASING_SHOES.map((s) => (
                  <ReferenceLine key={s.depth} y={s.depth} stroke="var(--color-advisory)" strokeDasharray="4 2"
                    label={{ value: s.label, position: "right", style: { fontSize: 9, fill: "var(--color-advisory)", fontFamily: "var(--font-mono)" } }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Right — What-If Console */}
        <div className="panel">
          <h2 className="section-heading mb-4">What-If Sandbox</h2>
          <p className="text-secondary mb-4" style={{ fontSize: "0.75rem" }}>
            Deterministic physics model — no ML. Computes ECD & kick tolerance.
          </p>

          {/* Sliders */}
          <div className="flex flex-col gap-4 mb-5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="mono-label">Test Mud Weight</span>
                <span className="mono-data" style={{ color: "var(--color-live)" }}>{testMW.toFixed(2)} SG</span>
              </div>
              <input type="range" min="1.00" max="1.80" step="0.01" value={testMW}
                onChange={(e) => setTestMW(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-live)" }} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="mono-label">Flow Rate</span>
                <span className="mono-data" style={{ color: "var(--color-live)" }}>{flowRate} L/min</span>
              </div>
              <input type="range" min="800" max="3500" step="50" value={flowRate}
                onChange={(e) => setFlowRate(parseInt(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-live)" }} />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="mono-label">Planned ROP</span>
                <span className="mono-data" style={{ color: "var(--color-live)" }}>{rop} m/hr</span>
              </div>
              <input type="range" min="1" max="30" step="0.5" value={rop}
                onChange={(e) => setRop(parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "var(--color-live)" }} />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}
            onClick={runWhatIf} disabled={computing}>
            {computing ? "Computing…" : "Run Physics Calculation"}
          </button>

          {/* Results */}
          {whatIf && (
            <div className="mt-4">
              <div className={`badge mb-3 ${whatIf.verdict === "SAFE" ? "badge-ok" : whatIf.verdict === "CRITICAL" ? "badge-critical" : "badge-warning"}`}
                style={{ fontSize: "0.75rem" }}>
                {whatIf.verdict}
              </div>

              <div className="grid gap-2" style={{ gridTemplateColumns: "1fr 1fr" }}>
                {Object.entries(whatIf.computed).map(([k, v]) => (
                  <div key={k} className="metric-card">
                    <span className="mono-label" style={{ fontSize: "0.6rem" }}>{k.replace(/_/g, " ")}</span>
                    <span className="mono-data" style={{ color: "var(--color-live)", fontSize: "1rem", fontWeight: 700 }}>
                      {typeof v === "number" ? v.toFixed(3) : String(v)}
                    </span>
                  </div>
                ))}
              </div>

              {whatIf.risk_flags.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {whatIf.risk_flags.map((f: any) => (
                    <div key={f.flag} className={`badge ${f.severity === "Critical" ? "badge-critical" : "badge-warning"}`}
                      style={{ fontSize: "0.65rem", whiteSpace: "normal" }}>
                      {f.flag.replace(/_/g, " ")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
