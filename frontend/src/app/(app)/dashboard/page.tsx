"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useGlobalContext } from "@/store/globalContext";

export default function DashboardPage() {
  const ctx = useGlobalContext();
  const [tvdss, setTvdss] = useState(3804.2);
  const [rop, setRop] = useState(13.0);
  const [wob, setWob] = useState(18.4);
  const [torque, setTorque] = useState(24.6);
  const [flow, setFlow] = useState(3240);
  const [gas, setGas] = useState(1.4);

  // 1 Hz simulated live micro-variations
  useEffect(() => {
    const timer = setInterval(() => {
      setTvdss((d) => parseFloat((d + 0.003).toFixed(1)));
      setRop((r) => parseFloat((13.0 + (Math.random() - 0.48) * 0.6).toFixed(1)));
      setWob((w) => parseFloat((18.4 + (Math.random() - 0.5) * 0.3).toFixed(1)));
      setTorque((t) => parseFloat((24.6 + (Math.random() - 0.5) * 0.4).toFixed(1)));
      setGas((g) => parseFloat((1.4 + (Math.random() - 0.5) * 0.05).toFixed(2)));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hero-warm-glow min-w-0 pb-16 px-10 pt-8 max-w-[1440px] mx-auto">
      {/* ─── Header Title Section ─────────────────────────────────────────── */}
      <section
        style={{
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderBottom: "1px solid #dbdad6",
          paddingBottom: "1.5rem",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "10px",
                textTransform: "uppercase",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#765b00",
                backgroundColor: "rgba(254, 207, 80, 0.2)",
                padding: "2px 8px",
                borderRadius: "4px",
                border: "1px solid rgba(254, 207, 80, 0.4)",
              }}
            >
              RIG SE-802 · WELL INTEL HUD
            </span>
            <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "#87837d" }}>
              UTC 14:22:08
            </span>
          </div>

          <h2
            style={{
              fontSize: "52px",
              lineHeight: 0.96,
              fontWeight: 700,
              color: "#0d0d0d",
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
              margin: 0,
              display: "flex",
              alignItems: "baseline",
            }}
          >
            <span>
              Command<br />
              <span style={{ fontStyle: "italic", fontWeight: 400 }}>Center</span>
            </span>
            <span
              style={{
                display: "inline-block",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#fecf50",
                border: "1px solid #d4a72c",
                marginLeft: "12px",
                marginBottom: "8px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            />
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "4px" }}>
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "#444748" }}>
            ACTIVE SECTION: <strong style={{ color: "#0d0d0d" }}>12¼&quot; INTERMEDIATE</strong>
          </span>
          <span style={{ display: "inline-block", width: "5px", height: "5px", backgroundColor: "#87837d", borderRadius: "50%" }} />
          <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", color: "#444748" }}>
            FORMATION: <strong style={{ color: "#0d0d0d" }}>SHALE / REEF</strong>
          </span>
        </div>
      </section>

      {/* ─── Telemetry HUD Strip ─────────────────────────────────────────── */}
      <section style={{ marginBottom: "3rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "1.5rem", paddingTop: "4px" }}>
          {/* Metric 1: TVDSS DEPTH */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid #dbdad6", paddingRight: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #0d0d0d", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "-0.01em", color: "#0d0d0d", textTransform: "uppercase" }}>TVDSS DEPTH</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 600, color: "#87837d" }}>M</span>
            </div>
            <div>
              <div style={{ fontSize: "34px", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: "#0d0d0d", display: "flex", alignItems: "baseline", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span className="num-tabular">{tvdss.toLocaleString()}</span>
                <span style={{ fontSize: "18px", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 400, color: "#444748", marginLeft: "4px" }}>m</span>
              </div>
            </div>
            <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.05em" }}>
              <span style={{ color: "#87837d" }}>1 HZ TELEMETRY</span>
              <span style={{ fontWeight: 700, color: "#0d0d0d" }}>LOCKED</span>
            </div>
          </div>

          {/* Metric 2: ROP */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid #dbdad6", paddingRight: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #0d0d0d", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "-0.01em", color: "#0d0d0d", textTransform: "uppercase" }}>ROP</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 600, color: "#87837d" }}>M/HR</span>
            </div>
            <div>
              <div style={{ fontSize: "34px", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: "#0d0d0d", display: "flex", alignItems: "baseline", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span className="num-tabular">{rop.toFixed(1)}</span>
                <span style={{ fontSize: "16px", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 400, color: "#444748", marginLeft: "6px" }}>m/hr</span>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <svg style={{ width: "100%", height: "12px", stroke: "#0d0d0d", fill: "none", marginBottom: "6px" }} preserveAspectRatio="none" viewBox="0 0 140 14">
                <path d="M0,10 Q25,8 45,9 T85,5 T120,6 L140,4" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span style={{ color: "#87837d" }}>60S TREND</span>
                <span style={{ fontWeight: 700, color: "#ba1a1a" }}>+4.2%</span>
              </div>
            </div>
          </div>

          {/* Metric 3: WOB */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid #dbdad6", paddingRight: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #0d0d0d", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "-0.01em", color: "#0d0d0d", textTransform: "uppercase" }}>WOB</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 600, color: "#87837d" }}>TONNES</span>
            </div>
            <div>
              <div style={{ fontSize: "34px", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: "#0d0d0d", display: "flex", alignItems: "baseline", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span className="num-tabular">{wob.toFixed(1)}</span>
                <span style={{ fontSize: "18px", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 400, color: "#444748", marginLeft: "4px" }}>t</span>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <svg style={{ width: "100%", height: "12px", stroke: "#0d0d0d", fill: "none", marginBottom: "6px" }} preserveAspectRatio="none" viewBox="0 0 140 14">
                <path d="M0,7 Q30,11 65,7 T115,8 L140,7" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span style={{ color: "#87837d" }}>60S TREND</span>
                <span style={{ fontWeight: 700, color: "#0d0d0d" }}>STEADY</span>
              </div>
            </div>
          </div>

          {/* Metric 4: SURFACE TORQUE */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid #dbdad6", paddingRight: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #0d0d0d", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "-0.01em", color: "#0d0d0d", textTransform: "uppercase" }}>SURFACE TORQUE</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 600, color: "#87837d" }}>KN·M</span>
            </div>
            <div>
              <div style={{ fontSize: "34px", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: "#0d0d0d", display: "flex", alignItems: "baseline", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span className="num-tabular">{torque.toFixed(1)}</span>
                <span style={{ fontSize: "15px", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 400, color: "#444748", marginLeft: "6px" }}>kN·m</span>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <svg style={{ width: "100%", height: "12px", stroke: "#0d0d0d", fill: "none", marginBottom: "6px" }} preserveAspectRatio="none" viewBox="0 0 140 14">
                <path d="M0,5 Q35,8 70,6 T115,8 L140,10" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span style={{ color: "#87837d" }}>60S TREND</span>
                <span style={{ fontWeight: 700, color: "#0d0d0d" }}>-1.8%</span>
              </div>
            </div>
          </div>

          {/* Metric 5: FLOW RATE IN */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", borderRight: "1px solid #dbdad6", paddingRight: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #0d0d0d", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "-0.01em", color: "#0d0d0d", textTransform: "uppercase" }}>FLOW RATE IN</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 600, color: "#87837d" }}>LPM</span>
            </div>
            <div>
              <div style={{ fontSize: "34px", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: "#0d0d0d", display: "flex", alignItems: "baseline", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span className="num-tabular">{flow.toLocaleString()}</span>
                <span style={{ fontSize: "16px", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 400, color: "#444748", marginLeft: "6px" }}>lpm</span>
              </div>
            </div>
            <div style={{ marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace", letterSpacing: "0.05em" }}>
              <span style={{ color: "#87837d" }}>PUMPS 1 + 2</span>
              <span style={{ fontWeight: 700, color: "#0d0d0d" }}>NOMINAL</span>
            </div>
          </div>

          {/* Metric 6: TOTAL GAS */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", paddingLeft: "4px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", borderBottom: "1px solid #0d0d0d", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "-0.01em", color: "#ba1a1a", textTransform: "uppercase" }}>TOTAL GAS</span>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 600, color: "#87837d" }}>%</span>
            </div>
            <div>
              <div style={{ fontSize: "34px", lineHeight: 1, fontWeight: 700, letterSpacing: "-0.02em", color: "#ba1a1a", display: "flex", alignItems: "baseline", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span className="num-tabular">{gas.toFixed(1)}</span>
                <span style={{ fontSize: "18px", fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 400, color: "#ba1a1a", marginLeft: "4px" }}>%</span>
              </div>
            </div>
            <div style={{ marginTop: "0.75rem" }}>
              <svg style={{ width: "100%", height: "12px", stroke: "#ba1a1a", fill: "none", marginBottom: "6px" }} preserveAspectRatio="none" viewBox="0 0 140 14">
                <path d="M0,12 C40,11 75,10 100,7 L140,2" strokeLinecap="round" strokeWidth="1.8" />
              </svg>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                <span style={{ color: "#87837d" }}>LIMIT 1.2%</span>
                <span style={{ fontWeight: 700, color: "#ba1a1a" }}>+0.2 OVER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bottom Operational Panels (8 Cols | 4 Cols) ──────────────────── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem" }}>
        {/* Left Sub-Grid: Next 100M Hazard Radar */}
        <div>
          <div style={{ borderBottom: "1px solid #0d0d0d", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "#765b00", fontWeight: 700 }}>[RADAR]</span>
              <h3 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0d0d0d", margin: 0 }}>
                NEXT 100 M HAZARD RADAR
              </h3>
            </div>
            <Link
              href="/advisory"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                fontWeight: 600,
                color: "#444748",
                textDecoration: "none",
              }}
            >
              [ FULL ADVISORY → ]
            </Link>
          </div>

          {/* 2x2 Hazard Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {/* Card 1: Critical Kick / Influx */}
            <article style={{ backgroundColor: "#ffffff", border: "1px solid #dbdad6", position: "relative", padding: "14px 16px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", backgroundColor: "#ba1a1a" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 6px", backgroundColor: "rgba(186, 26, 26, 0.1)", color: "#ba1a1a", border: "1px solid rgba(186, 26, 26, 0.3)", borderRadius: "3px", textTransform: "uppercase" }}>
                    CRITICAL
                  </span>
                  <h4 style={{ fontWeight: 700, fontSize: "13px", color: "#0d0d0d", margin: 0, letterSpacing: "-0.01em" }}>Kick / Influx</h4>
                </div>
                <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "0.06em", color: "#87837d", margin: "0 0 10px" }}>
                  ZONE 4B · TOP 3,742 M TVDSS
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, backgroundColor: "#efeeea", height: "5px", overflow: "hidden", borderRadius: "9999px" }}>
                    <div style={{ backgroundColor: "#ba1a1a", height: "100%", width: "78%", borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d" }}>78%</span>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.45, color: "#444748", margin: 0 }}>
                  Throttle to 55 lpm & raise mud weight +0.2 ppg — matches the fix used on 3 historical kicks in offsets NH-01...NH-03.
                </p>
              </div>
              <div style={{ marginTop: "1rem", paddingTop: "8px", borderTop: "1px solid #f5f4ef", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "#87837d" }}>
                <span>OFFSET NH-04</span>
                <span style={{ backgroundColor: "#f5f4ef", padding: "2px 6px", borderRadius: "3px", border: "1px solid rgba(219, 218, 214, 0.6)" }}>DDR NH-04 · p.42</span>
              </div>
            </article>

            {/* Card 2: Warning Stuck Pipe */}
            <article style={{ backgroundColor: "#ffffff", border: "1px solid #dbdad6", position: "relative", padding: "14px 16px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", backgroundColor: "#d97706" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 6px", backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "3px", textTransform: "uppercase" }}>
                    WARNING
                  </span>
                  <h4 style={{ fontWeight: 700, fontSize: "13px", color: "#0d0d0d", margin: 0, letterSpacing: "-0.01em" }}>Stuck Pipe</h4>
                </div>
                <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "0.06em", color: "#87837d", margin: "0 0 10px" }}>
                  REEF LIMESTONE · TOP 3,798 M TVDSS
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, backgroundColor: "#efeeea", height: "5px", overflow: "hidden", borderRadius: "9999px" }}>
                    <div style={{ backgroundColor: "#d97706", height: "100%", width: "54%", borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d" }}>54%</span>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.45, color: "#444748", margin: 0 }}>
                  Reduce RPM to 90 & work pipe ±2 m after every 3 m of new hole — cleared stick-slip in 2 of 3 reef sections nearby.
                </p>
              </div>
              <div style={{ marginTop: "1rem", paddingTop: "8px", borderTop: "1px solid #f5f4ef", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "#87837d" }}>
                <span>OFFSET NH-04</span>
                <span style={{ backgroundColor: "#f5f4ef", padding: "2px 6px", borderRadius: "3px", border: "1px solid rgba(219, 218, 214, 0.6)" }}>DDR NH-04 · p.42</span>
              </div>
            </article>

            {/* Card 3: Warning Loss Circulation */}
            <article style={{ backgroundColor: "#ffffff", border: "1px solid #dbdad6", position: "relative", padding: "14px 16px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", backgroundColor: "#d97706" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 6px", backgroundColor: "rgba(217, 119, 6, 0.1)", color: "#d97706", border: "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "3px", textTransform: "uppercase" }}>
                    WARNING
                  </span>
                  <h4 style={{ fontWeight: 700, fontSize: "13px", color: "#0d0d0d", margin: 0, letterSpacing: "-0.01em" }}>Loss Circulation</h4>
                </div>
                <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "0.06em", color: "#87837d", margin: "0 0 10px" }}>
                  BASE SALT · TOP 3,861 M TVDSS
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, backgroundColor: "#efeeea", height: "5px", overflow: "hidden", borderRadius: "9999px" }}>
                    <div style={{ backgroundColor: "#d97706", height: "100%", width: "47%", borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d" }}>47%</span>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.45, color: "#444748", margin: 0 }}>
                  Premix an 8 ppb LCM pill and watch pit level — resolved both loss events on offset NH-02 with this recipe.
                </p>
              </div>
              <div style={{ marginTop: "1rem", paddingTop: "8px", borderTop: "1px solid #f5f4ef", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "#87837d" }}>
                <span>OFFSET NH-02</span>
                <span style={{ backgroundColor: "#f5f4ef", padding: "2px 6px", borderRadius: "3px", border: "1px solid rgba(219, 218, 214, 0.6)" }}>DDR NH-02 · p.31</span>
              </div>
            </article>

            {/* Card 4: Watch Pore Pressure Ramp */}
            <article style={{ backgroundColor: "#ffffff", border: "1px solid #dbdad6", position: "relative", padding: "14px 16px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", backgroundColor: "#2563eb" }} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", padding: "2px 6px", backgroundColor: "rgba(37, 99, 235, 0.1)", color: "#2563eb", border: "1px solid rgba(37, 99, 235, 0.3)", borderRadius: "3px", textTransform: "uppercase" }}>
                    WATCH
                  </span>
                  <h4 style={{ fontWeight: 700, fontSize: "13px", color: "#0d0d0d", margin: 0, letterSpacing: "-0.01em" }}>Pore Pressure Ramp</h4>
                </div>
                <p style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", letterSpacing: "0.06em", color: "#87837d", margin: "0 0 10px" }}>
                  SHALE X-4 · TOP 3,905 M TVDSS
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <div style={{ flex: 1, backgroundColor: "#efeeea", height: "5px", overflow: "hidden", borderRadius: "9999px" }}>
                    <div style={{ backgroundColor: "#2563eb", height: "100%", width: "31%", borderRadius: "9999px" }} />
                  </div>
                  <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d" }}>31%</span>
                </div>
                <p style={{ fontSize: "11px", lineHeight: 1.45, color: "#444748", margin: 0 }}>
                  Raise the ECD ceiling +0.15 ppg and double the pore-pressure model update rate before entering the ramp.
                </p>
              </div>
              <div style={{ marginTop: "1rem", paddingTop: "8px", borderTop: "1px solid #f5f4ef", display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "9px", color: "#87837d" }}>
                <span>OFFSET NH-03</span>
                <span style={{ backgroundColor: "#f5f4ef", padding: "2px 6px", borderRadius: "3px", border: "1px solid rgba(219, 218, 214, 0.6)" }}>DDR NH-03 · p.18</span>
              </div>
            </article>
          </div>
        </div>

        {/* Right Sub-Grid: Live Strip — 60 Sec */}
        <div>
          <div style={{ borderBottom: "1px solid #0d0d0d", paddingBottom: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", color: "#765b00", fontWeight: 700 }}>[SYNC]</span>
              <h3 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#0d0d0d", margin: 0 }}>
                LIVE STRIP — 60 SEC
              </h3>
            </div>
            <Link
              href="/telemetry"
              style={{
                fontFamily: "var(--font-jetbrains-mono), monospace",
                fontSize: "11px",
                fontWeight: 600,
                color: "#444748",
                textDecoration: "none",
              }}
            >
              [ FULL COCKPIT → ]
            </Link>
          </div>

          {/* Sparkline Stack Card */}
          <div style={{ border: "1px solid #dbdad6", backgroundColor: "#ffffff", borderRadius: "8px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            {/* Strip Row 1: ROP */}
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #efeeea" }}>
              <div style={{ width: "48px" }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d", display: "block" }}>ROP</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "8px", color: "#87837d" }}>m/hr</span>
              </div>
              <div style={{ flex: 1, padding: "0 16px" }}>
                <svg style={{ width: "100%", height: "16px", stroke: "#0d0d0d", fill: "none" }} preserveAspectRatio="none" viewBox="0 0 200 16">
                  <path d="M0,10 L15,11 L35,8 L50,9 L75,7 L95,8 L120,6 L140,8 L170,5 L190,6 L200,4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", fontWeight: 700, color: "#0d0d0d", minWidth: "70px", textAlign: "right" }}>
                {rop.toFixed(1)} m/hr
              </span>
            </div>

            {/* Strip Row 2: WOB */}
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #efeeea" }}>
              <div style={{ width: "48px" }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d", display: "block" }}>WOB</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "8px", color: "#87837d" }}>tonnes</span>
              </div>
              <div style={{ flex: 1, padding: "0 16px" }}>
                <svg style={{ width: "100%", height: "16px", stroke: "#0d0d0d", fill: "none" }} preserveAspectRatio="none" viewBox="0 0 200 16">
                  <path d="M0,8 L25,8 L45,10 L65,8 L85,9 L115,8 L140,10 L170,8 L200,8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", fontWeight: 700, color: "#0d0d0d", minWidth: "70px", textAlign: "right" }}>
                {wob.toFixed(1)} t
              </span>
            </div>

            {/* Strip Row 3: TORQUE */}
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #efeeea" }}>
              <div style={{ width: "48px" }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#0d0d0d", display: "block" }}>TORQUE</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "8px", color: "#87837d" }}>kN·m</span>
              </div>
              <div style={{ flex: 1, padding: "0 16px" }}>
                <svg style={{ width: "100%", height: "16px", stroke: "#0d0d0d", fill: "none" }} preserveAspectRatio="none" viewBox="0 0 200 16">
                  <path d="M0,7 L30,8 L55,6 L85,7 L110,6 L140,7 L170,6 L190,8 L200,7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", fontWeight: 700, color: "#0d0d0d", minWidth: "70px", textAlign: "right" }}>
                {torque.toFixed(1)} kN·m
              </span>
            </div>

            {/* Strip Row 4: GAS */}
            <div style={{ padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fffbfa" }}>
              <div style={{ width: "48px" }}>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "10px", fontWeight: 700, color: "#ba1a1a", display: "block" }}>GAS</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "8px", color: "rgba(186, 26, 26, 0.8)" }}>%</span>
              </div>
              <div style={{ flex: 1, padding: "0 16px" }}>
                <svg style={{ width: "100%", height: "16px", stroke: "#ba1a1a", fill: "none" }} preserveAspectRatio="none" viewBox="0 0 200 16">
                  <path d="M0,13 L20,13 L45,12 L70,11 L95,11 L120,9 L145,9 L175,7 L200,4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
                </svg>
              </div>
              <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace", fontSize: "11px", fontWeight: 700, color: "#ba1a1a", minWidth: "70px", textAlign: "right" }}>
                {gas.toFixed(1)} %
              </span>
            </div>
          </div>

          {/* Cockpit Quick Status Pill */}
          <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: "#f5f4ef", border: "1px solid #dbdad6", borderRadius: "6px", fontSize: "10px", fontFamily: "var(--font-jetbrains-mono), monospace", color: "#444748" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#fecf50", border: "1px solid #d4a72c", display: "inline-block" }} />
              <span>MWD / LWD SYNC</span>
            </span>
            <span style={{ color: "#0d0d0d", fontWeight: 700 }}>12 OFFSET LOGS LINKED</span>
          </div>
        </div>
      </section>
    </div>
  );
}
