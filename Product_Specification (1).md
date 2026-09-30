# eRTMAC-NWIS — Master Product & Web Application Specification

**Project:** Nearby Wells Intelligence System (NWIS)  
**SIH Problem Statement ID:** SIH26121  
**Organization:** Oil India Limited (OIL)  
**Document Purpose:** Complete Industrial Web/PWA Blueprint, Design Token System, Sitemap & Wireframes (16 Screens), Feature Matrix (F-01 to F-25), SQL Database Schemas, ML Models Specifications, Open-Source E&P Tool Index, and Developer's Petroleum Glossary.

---

## Executive Summary & Design Philosophy

The Nearby Wells Intelligence System (NWIS) is an industrial-grade subsurface decision-support platform designed for **Oil India Limited (OIL)**. It transforms historical offset well records (PDF reports, LAS well logs, spatial trajectories) and real-time WITSML telemetry feeds into actionable lookahead hazard advisories for active drilling operations.

To transition from a typical web dashboard to a credible **oilfield operations system**, NWIS strictly enforces:
1. **High Data Density:** Desktop row heights of 28–32px, 4px grid spacing, and tabular typography to maximize information per screen.
2. **Explicit Provenance & Integrity Visual Grammar:** Hard historical facts feature solid borders and direct source citation chips (`DDR NH-04 · p.42`); ML model predictions feature dashed borders, probability scores, and confidence intervals.
3. **"One Truth, Many Views" Global Context Cursor:** A unified depth/time cursor synchronized via Zustand state across all 16 application screens.
4. **Resilient Data Freshness Model:** Standardized handling for `LIVE`, `DELAYED`, and `STALE` data streams with automated prediction suppression on frozen channels.

---

## Section 1: Industrial Design System & Global UI Tokens

### A-1. Dark-First Industrial Color Palette & Typography

The UI palette uses a 4-step dark background scale, a 3-step text hierarchy, and a **locked 5-tier semantic status scale**. Status colors are strictly reserved for operational health and hazards—never for visual decoration.

#### Color Tokens
- **Background Scale:**
  - `App Background`: `#0b0f19` (Deep Obsidian - reduces eye strain in RTOC control rooms)
  - `Panel Background`: `#131a29` (Dark Navy Container)
  - `Raised Component`: `#1c253b` (Elevated Cards & Popovers)
  - `Border / Divider`: `#2a3654` (Subtle Grid Alignment Lines)
- **Text Hierarchy:**
  - `Primary Text`: `#f8fafc` (High Contrast White)
  - `Secondary Text`: `#94a3b8` (Muted Blue-Grey for Labels & Units)
  - `Muted / Disabled`: `#64748b` (Low Emphasis Metadata)
- **Locked Semantic Status Scale:**
  - `Critical Hazard`: `#ef4444` (Bright Red) — Kicks, Severe Losses, Stuck Pipe
  - `Warning`: `#f59e0b` (Amber / Orange) — Torque Spikes, Overpressure Margin Warnings
  - `Advisory`: `#3b82f6` (Operational Blue) — Formation Top Transitions, Offset Analogue Notes
  - `Nominal / Normal`: `#10b981` (Emerald Green) — Stable Drilling Progress, In-Window Parameters
  - `Stale / No-Data`: `#6b7280` (Muted Slate Grey with 45° diagonal hatch pattern `background-image: repeating-linear-gradient(...)`)

#### Typography & Numeric Discipline
- **UI Font Stack:** `Inter`, `IBM Plex Sans`, or system sans-serif for UI labels and navigation.
- **Numeric Font Stack:** `IBM Plex Mono` or `JetBrains Mono` with mandatory tabular numerals (`font-variant-numeric: tabular-nums`).
  > *Why Tabular Numerals?* Standard proportional fonts cause numbers to shift horizontally as values change (e.g., `1` vs `8`), causing visual jitter on 1 Hz telemetry feeds. Tabular numerals enforce fixed character widths so numbers stay aligned.

#### Layout Density Tokens
- **Row Height:** Compact 28px–32px on desktop RTOC views.
- **Base Grid Spacing:** 4px incremental scale (4px, 8px, 12px, 16px, 24px).
- **Body Font Size:** 12px–13px for dense operational tables.

---

### A-2. Multi-Modal Status Signals (Colorblind & Sunlight Resilience)
Status indicators **must never rely on color alone**. Every status badge, alert card, and map pin incorporates shape, text, and icon overlays to ensure legibility on sunlight-washed rig tablets and for colorblind engineers:
- **Critical:** Filled Triangle `▲` + Red Border + `CRITICAL` Label.
- **Warning:** Diamond `◆` + Amber Border + `WARNING` Label.
- **Advisory:** Circle `ℹ` + Blue Border + `ADVISORY` Label.
- **Nominal:** Checkmark `✓` + Green Border + `OK` Label.
- **Loss Hazard:** Downward Arrow `▼` (Fluid leaving wellbore).
- **Kick Hazard:** Upward Arrow `▲` (Influx entering wellbore).

---

### A-3. Explicit Units, Datums & Global Unit Toggle
**Rule:** No bare numbers anywhere in the application interface. Every numeric display must explicitly label its unit and measurement datum.

```text
CORRECT:   2,850 m TVDSS   |   1.42 SG (EMW)   |   3,010 m MD   |   45.2 m³/hr
INCORRECT: 2850           |   1.42            |   3010         |   45.2
```

#### Global Unit Toggle (Oilfield Standard ↔ SI Metric)
A global toggle in the application header allows instant switching between standard oilfield units and metric units, persisted in user local storage:

| Parameter | SI Metric Unit | Oilfield Standard Unit | Conversion Factor |
| :--- | :--- | :--- | :--- |
| **Depth** | Meters (`m`) | Feet (`ft`) | $1\text{ m} = 3.28084\text{ ft}$ |
| **Mud Weight / Density** | Specific Gravity (`SG`) | Pounds per Gallon (`ppg`) | $1\text{ SG} = 8.33\text{ ppg}$ |
| **Pressure** | Kilopascals (`kPa`) / Bar | Pounds per Square Inch (`psi`) | $1\text{ bar} = 14.5038\text{ psi}$ |
| **Volume** | Cubic Meters (`m³`) | Barrels (`bbl`) | $1\text{ m³} = 6.28981\text{ bbl}$ |
| **Flow Rate** | Liters per Minute (`L/min`) | Gallons per Minute (`gpm`) | $1\text{ L/min} = 0.264172\text{ gpm}$ |

---

### A-4. Global Data-Freshness & Streaming Latency Model
Every component consuming live WITSML telemetry evaluates stream latency and renders one of three explicit visual states:

1. **`LIVE` (Stream Age < 5s):** Normal operation. Green connection dot + active stream latency badge (`WITSML 1 Hz · 0.8s lag`).
2. **`DELAYED` (Stream Age 5s – 60s):** Amber warning badge + stream age ticker (`DELAYED: 24s ago`). Charts continue scrolling but display an amber background tint.
3. **`STALE` (Stream Age > 60s):** Grey diagonal hatch overlay across charts. Telemetry values dim to 50% opacity, and real-time anomaly detection (Model 4) automatically pauses to prevent false alarms on frozen data.

---

### A-5. Global Depth Cursor & Context State (Zustand)
The application maintains a single shared global context state object in Zustand. Scrubbing a depth on the Correlation Curtain immediately syncs the active depth across all open tabs:

```typescript
interface GlobalContextState {
  activeWellboreId: string;       // e.g., "OIL-NH-12"
  cursorTVDSS: number;            // Depth in meters TVDSS (e.g., 2850.5)
  cursorMD: number;               // Depth in meters MD (e.g., 3010.2)
  selectedOffsetIds: string[];   // Array of offset well IDs (max 5)
  timeWindowHours: number;        // Rolling telemetry window (1h, 6h, 24h)
  rigState: RigStateEnum;         // 'DRILLING_ROTARY' | 'CONNECTION' | etc.
  unitSystem: 'METRIC' | 'IMPERIAL';
  
  setCursorDepth: (tvdss: number, md: number) => void;
  setSelectedOffsets: (wellIds: string[]) => void;
}
```

---

### A-6. Fact vs. Inference Provenance Grammar & Citation Chips

To maintain trust with drilling engineers, the system visually distinguishes empirical historical records (facts) from machine learning predictions (inferences):

- **Hard Historical Facts (Solid Borders):** Extracted DDR shift logs, offset LAS logs, surveyed casing shoes. Renders with a **solid 1px border** (`border: 1px solid #2a3654`).
- **Model Inferences (Dashed Borders + Metadata):** Predictions from Model 3 lookahead or Model 4 anomaly detectors. Renders with a **dashed 1.5px border** (`border: 1.5px dashed #f59e0b`), accompanied by:
  - Probability Score (`78% Risk`)
  - Confidence Interval (`± 12m`)
  - Underlying Model ID (`Model 3 - XGBoost Tier B`)
- **Provenance Citation Chip:** Clicking any historical fact or hazard reference displays a citation chip (`DDR NH-04 · p.42 · ✓ Validated`). Clicking the chip opens the PDF in Document View with the source bounding box highlighted.

---

### A-7. Strict 4-State Panel Component Standard
Every UI panel, chart container, and metric card must implement four distinct rendering states:

```text
+-----------------------+  +-----------------------+  +-----------------------+  +-----------------------+
| 1. LOADING            |  | 2. EMPTY              |  | 3. ERROR              |  | 4. DEGRADED           |
| Skeleton UI Animation |  | Guidance & Next Steps |  | Failure Cause & Retry |  | Active Fallback Mode  |
+-----------------------+  +-----------------------+  +-----------------------+  +-----------------------+
```

---

### A-8. Keyboard Command Layer for Control Room Efficiency
RTOC engineers operate in fast-paced environments. NWIS includes a keyboard hotkey layer:

- `⌘K` / `Ctrl+K`: Open Global Command Palette (Jump to well, search depth, find document).
- `1` – `8`: Direct page navigation (`1` Command Center, `2` Map, `3` Curtain, etc.).
- `[` / `]`: Step global depth cursor up/down by 10 meters.
- `Space`: Pause / Resume live telemetry scrolling stream.
- `Esc`: Clear depth cursor / Close side drawers.

---

### A-9. Timezone & Rig-Time Tour Boundary Handling
- **Primary Display:** Rig Local Time (IST - Indian Standard Time, UTC+5:30).
- **Tooltips:** ISO 8601 UTC timestamp (`2026-09-29T14:30:00Z`).
- **Tour Boundary Convention:** Daily Drilling Reports (DDR) run on 12-hour / 24-hour tour boundaries (e.g., 06:00 AM to 06:00 PM), not midnight-to-midnight. The UI aligns day summaries to the active tour shift.

---

### A-10. Auditability & Action Attribution Layer
Every operational interaction (alert acknowledgement, extraction validation, what-if parameter modification) records an immutable audit log entry:
- `{ timestamp: ISO8601, user_id: "eng_arjun", user_role: "RTOC_DRILLING_ENGINEER", action: "ACKNOWLEDGE_ALERT", target_id: "ALT-8841", reason: "CaCO3 pill prepared" }`

---

### A-11. Mobile Field Mode (PWA Doghouse App)
- **User-Selectable Toggle:** Available on any device viewport via header toggle (`Field Mode`). Auto-suggested on touch viewports (< 768px).
- **Service Worker Caching:** Offline cache stores active well trajectory, formation tops, and hazard cards for zero-connectivity rig environments.

---

## Section 2: Complete System Sitemap & 16 Page Wireframe Specifications

### System Sitemap & Route Tree

```text
/ (App Root)
 ├── /dashboard         (Page 1: Command Center / Active Rig Overview)
 ├── /map               (Page 2: Geospatial & 3D Depth-Slice Explorer)
 ├── /correlation       (Page 3: Subsurface Trajectory & Formation Curtain View)
 ├── /telemetry         (Page 4: eRTMAC Real-Time 1 Hz Cockpit & Rig-State Monitor)
 ├── /pore-pressure     (Page 5: Pore Pressure / Frac Window & What-If Console)
 ├── /advisory          (Page 6: Lookahead Hazard Radar & ISA-18.2 Alert Center)
 ├── /documents         (Page 7: Document Intelligence Hub & Extraction Queue)
 ├── /pwa-field         (Page 8: Field Driller Doghouse PWA View)
 ├── /analogues         (Page 9: Pre-Drilling Offset Analogue Selector - Model 1 UI) [NEW]
 ├── /well/:id          (Page 10: Master Well File 360° View) [NEW]
 ├── /planning          (Page 11: Plan vs Actual Days-vs-Depth Cockpit) [NEW]
 ├── /admin/catalog     (Page 12: OIL Formation Catalog Admin Editor) [NEW]
 ├── /admin/health      (Page 13: System Data & Model Health Dashboard) [NEW]
 ├── /reports           (Page 14: Morning Report & Offset Review PDF Generator) [NEW]
 ├── /admin/auth        (Page 15: Auth, User Management & RBAC Config) [NEW]
 └── /audit             (Page 16: System Audit & Action Attribution Log) [NEW]
```

---

### Global Header Bar (Rendered Across All Pages)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| NWIS | Active: [ OIL-NH-12 ▼ ] | Bit: 3,010m MD / 2,850m TVDSS | Hole: 3,012m MD | Section: 12¼" (Shoe 9⅝" @ 2,150m TVDSS)        |
| Last Survey: 27m ago | MW In/Out: 1.28 / 1.30 SG | ECD: 1.34 SG | Rig State: [ DRILLING ROTARY ] | WITSML 1Hz (0.8s) | [DEMO DATA]    |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Depth Readouts:** Simultaneous Bit MD, Bit TVDSS, and Hole MD.
- **Section Info:** Current hole diameter (12.25") and last casing shoe depth/size (9.58" shoe at 2,150m TVDSS).
- **Survey Age:** Distance since last survey station ("Last survey 27m ago").
- **Mud Metrics:** Live Mud Weight In, Mud Weight Out, and Equivalent Circulating Density (ECD).
- **Environment Badge:** Explicit `[ DEMO DATA ]` or `[ LIVE OIL FEED ]` indicator.

---

### Page 1: Command Center (`/dashboard`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| METRIC CARDS WITH TREND SPARK LINES                                                                                               |
| [ Bit Depth: 2,850m TVDSS ]  [ ROP: 18.4 m/hr (▲+2.1) ]  [ Mud Weight: 1.28 SG (P50 Plan: 1.26) ]  [ Active Gas: 2.4% (▲ Connection) ]|
+---------------------------------------------------------------+-------------------------------------------------------------------+
| DAYS-VS-DEPTH PLOT (Active vs Offset P10/P50/P90 Envelope)    | LOOKAHEAD HAZARD RADAR (Next 100m)                                |
|                                                               | ⚠️ 78% Risk: Lost Circulation @ 2,910m TVDSS (60m ahead)          |
| Depth (m)                                                     |    Formation: Barail Sandstone | Confidence: ±8m                   |
| 0 |--- P10                                                    |    Source: Offset NH-04 (Loss of 45m³ mud @ 2,915m)               |
|   |   \-- P50                                                 |    Mitigation: Prepare 40 ppb CaCO3 pill                           |
|   |      \-- P90                                              |    [ Acknowledge ] [ View Offset PDF ] [ Open Correlation ]       |
|3k |       * (Active NH-12)                                    |-------------------------------------------------------------------|
|   +------------------------------------ Days                  | NPT TICKER: 14.2 hrs NPT on NH-12 (Field Avg: 22.5 hrs)           |
+---------------------------------------------------------------+-------------------------------------------------------------------+
| RIG STATE GANTT TIMELINE & SECTION PROGRESS BAR                                                                                   |
| Progress: 12¼" Hole Section [========================>........] 82% to Casing Point (3,200m TVDSS)                                |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Features:** Trend sparklines with 1-hour deltas and offset P50 targets; hazard lookahead cards displaying exact distance ahead in meters (`60m ahead`), confidence interval, and offset source citation; Days-vs-Depth active tracking against P10/P50/P90 envelopes; NPT ticker categorized by operational cause; Section progress bar.

---

### Page 2: Geospatial & 3D Depth-Slice Explorer (`/map`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| MAP TOOLBAR: Search [ NH-12 ] | Radius: [======o======] 12.5 km (318 candidate wells) | Depth Window: ±300m TVDSS | Funnel: 2000->318 |
| Layer Toggles: [x] Subcrop [x] Trajectories [x] Facilities [x] Incident Heat Slice | Mode: [ 2D Map ] [ 3D Trajectory ] [ Depth Slice ] |
+---------------------------------------------------------------+-------------------------------------------------------------------+
| MAP VIEWPORT (EPSG:3857 Render / EPSG:32646 Math)             | SELECTED WELL SIDE DRAWER: Offset NH-04                           |
|                                                               | ----------------------------------------------------------------- |
|   (▲ vertical)    (◆ deviated)     (● active NH-12)           | Similarity Score: 87.4%                                           |
|                                                               |   - Geographic Distance (3.2 km):     ████████░░ 82%                |
|                                                               |   - Stratigraphic Match (Barail):    ██████████ 95%                |
|   [ Pin Encoding Legend ]                                     |   - Depth Window Delta (45m):        █████████░ 88%                |
|   Shape = Profile | Fill = Hazard | Ring = Data Richness     |   - Well Profile & Size Match:       ████████░░ 80%                |
|                                                               | ----------------------------------------------------------------- |
| [ Depth-Slice Slider: TVDSS 2,850m [=======o========] ]       | [ Add to Correlation Curtain ] [ Open Well File 360 ]             |
+---------------------------------------------------------------+-------------------------------------------------------------------+
```

- **Features:** Continuous 1–25 km radius buffer slider displaying real-time funnel filtering (`2,000 → 318 candidate wells`); Multi-variable pin encoding (Shape = Profile, Fill = Hazard Severity, Outer Ring = Document Richness); Depth-Slice Slider showing subterranean wellbore locations at selected TVDSS slice; Side drawer displaying candidate similarity breakdown stacked bars; ISCWSA 3D anti-collision proximity warnings.

---

### Page 3: Subsurface Trajectory & Formation Curtain View (`/correlation`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| CURTAIN CONTROLS: Active: [ NH-12 ] | Offsets: [ NH-04 x ] [ NH-07 x ] [ NH-02 x ] | Flatten On: [ Top Barail ▼ ] | DFIM: [ ON ] |
+------------------+------------------+------------------+------------------+-------------------------------------------------------+
| TRACK 1: ACTIVE  | TRACK 2: LITH    | TRACK 3: NH-04   | TRACK 4: NH-07   | TRACK 5: DIFFERENCE & EVENTS                          |
| GR / MSE Logs    | Lithology Strip  | Log + Casing     | Log + Casing     | Active minus Offset Delta                             |
|                  | (striplog)       |                  |                  |                                                       |
| 2800m ---------- | [ Tipam Sand ]   | [ 9⅝" Shoe ]     | [ 9⅝" Shoe ]     | Delta MSE: +14 MPa (Harder Stringer)                  |
| 2850m === BIT == | [ Barail Shale ] |                  | ⚠️ Loss (45m³)   | ----------------------------------------------------- |
| 2900m ---------- | [ Barail Coal ]  | 🔴 Kick (1.4m³)  |                  | Alignment Confidence: [ ████████░░ 82% ]              |
+------------------+------------------+------------------+------------------+-------------------------------------------------------+
| SYNCHRONIZED READOUT BAR AT CURSOR (2,850m TVDSS):                                                                                 |
| Active GR: 84 API | Active MSE: 142 MPa | NH-04 GR: 88 API | NH-07 GR: 79 API | Formation: Barail Top (+5m Delta)                     |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Features:** Supports up to 5 side-by-side offset wells; Multi-datum flattening control (MD, TVDSS, Formation Top, DFIM Aligned); DFIM alignment confidence bar with greyed-out weak intervals; `striplog` lithology columns; Casing schematics inline; Delta difference track highlighting formation hardness variances.

---

### Page 4: eRTMAC Real-Time Telemetry Cockpit (`/telemetry`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| TELEMETRY CONTROLS: Mode: [ Time (1 Hz) ] [ Depth (TVDSS) ] | View: [ 15 min ] | Feed: [ LIVE 0.8s ] | [ Pause Stream ]          |
+-----------------------------------------------------------------------------------------------------------------------------------+
| STRIP CHART 1: ROP (m/hr) & WOB (tonnes) ------------ [ Ghost Curve: NH-04 Offset P50 (Dashed) ]                                  |
| STRIP CHART 2: Surface Torque (kN·m) & Rotary RPM --- [ Threshold Limit: 28 kN·m (Red Line) ]                                      |
| STRIP CHART 3: SPP (psi) & Flow Delta --------------- [ Flow Out % Trend vs Flow In L/min Baseline ]                               |
| STRIP CHART 4: Gas Chromatography (C1-C5) ----------- [ Total Gas % & Connection Spikes ]                                         |
+-----------------------------------------------------------------------------------------------------------------------------------+
| RIG-STATE GANTT RIBBON:                                                                                                           |
| [ DRILLING ROTARY (02:10) ] [ CONNECTION (00:04) ] [ DRILLING ROTARY (01:45) ] [ CIRCULATING (00:15) ]                            |
+-----------------------------------------------------------------------------------------------------------------------------------+
| CHANNEL HEALTH: Hookload: OK | BlockPos: OK | ROP: OK | MW In/Out: OK | Sensor Age: 0.4s | Out-of-Range: 0                       |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Features:** 12 live WITSML channels including hookload, block position, torque limit, ECD, and gas breakdown; Flow differential calculated correctly as $\text{Flow Out \% (Trended)} - \text{Flow In (L/min) baseline}$; Rig-state Gantt timeline ribbon; MSE efficiency shading; Manual annotation tool (`user_annotation`); Alarm setpoint editor with hi/hi-hi thresholds.

---

### Page 5: Pore Pressure Window & Deterministic What-If Console (`/pore-pressure`)

```text
+---------------------------------------------------------------+-------------------------------------------------------------------+
| PORE PRESSURE & FRACTURE GRADIENT WINDOW                      | DETERMINISTIC WHAT-IF SANDBOX (Physics Engine)                    |
| Depth (m TVDSS) vs Density (SG EMW)                           | ----------------------------------------------------------------- |
| 2,000m |     |  Pore Pressure (Eaton, n=1.2)                  | TEST PARAMETERS:                                                  |
|        |     |  Fracture Gradient (Hubbert-Willis)           | Mud Weight In:  [=======o======] 1.32 SG                          |
|        |  |  |  Planned Mud Weight (1.28 SG)                 | Target Flow Rate: [======o=======] 2,400 L/min                    |
| 2,850m |  *  |  Active ECD (1.34 SG)                          | Planned ROP:     [====o==========] 15.0 m/hr                      |
|        |     |  Casing Shoe LOT (1.45 SG @ 2,150m)           | ----------------------------------------------------------------- |
| 3,500m +-----+--------------------------------------- EMW (SG) | LIVE EVALUATION OUTPUTS:                                          |
|        0.8  1.0  1.2  1.4  1.6  1.8                           |  - Calculated ECD: 1.35 SG (Margin: +0.03 SG above Pore Press)     |
|                                                               |  - Casing Shoe Clearance: 0.10 SG below LOT (SAFE)                |
| EVIDENCE STRIP: At 2,850m, Offsets NH-04 & NH-07 drilled at   |  - Kick Tolerance Volume: 2.4 m³ (Assuming 0.40 SG/m gas influx)  |
| 1.32-1.38 SG. Offset NH-04 experienced losses at 1.41 SG.     |  - Hole Cleaning Status: Annular Vel 48 m/min (SLIP SAFE)         |
+---------------------------------------------------------------+-------------------------------------------------------------------+
```

- **Features:** Eaton pore pressure profile with explicitly stated exponent $n=1.2$ and source LOT/FIT baseline points; Real-time overpressure indicator panel (d-exponent, connection gas, torque/drag, cavings); What-if sandbox with hard physical bounds and safety warnings (e.g., *MW < Pore Pressure $\rightarrow$ Underbalanced Risk*); Kick tolerance calculation volume with explicit influx assumptions; Cuttings hole cleaning index; Offset evidence citation strip.

---

### Page 6: Lookahead Hazard Advisory & Alert Center (`/advisory`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| ALERT CENTER | ISA-18.2 Alarm Rate: 2.1 Alarms/hr (Target < 6.0) | Active: 1 Critical, 2 Warning | Filter: [ All ] [ Lookahead ]  |
+-----------------------------------------------------------------------------------------------------------------------------------+
| ALERT CARD #ALT-8841 (ISA-18.2 State: ACKNOWLEDGED by eng_arjun @ 14:22)                                                          |
| ⚠️ HAZARD CLASS: Lost Circulation | DISTANCE: 60m Ahead (2,910m TVDSS) | FORMATION: Barail Sandstone                              |
| PROBABILITY: 78% (Confidence: ±8m) | MODEL: Model 3 Lookahead Classifier (Tier B XGBoost + SHAP)                                 |
| --------------------------------------------------------------------------------------------------------------------------------- |
| EMPIRICAL EVIDENCE: 3 historical loss events recorded in formation across Offsets NH-04 (45m³), NH-07 (12m³), and NH-02 (30m³). |
| RECOMMENDED MITIGATION: Pre-mix 40 ppb CaCO3 LCM pill in pit #3 prior to reaching 2,900m TVDSS.                                    |
| HISTORICAL OUTCOME: CaCO3 pill applied in 6 analogue events -> 83% Success Rate (5/6 resolved, Avg NPT Incurred: 3.5 hrs).         |
| --------------------------------------------------------------------------------------------------------------------------------- |
| ACTIONS: [ Acknowledge Alert ] [ Shelve Alert (2 hrs) ] [ Export Handover PDF ] [ Open Source DDR Page 42 ]                       |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Features:** Split lanes for Live Telemetry Anomalies (Model 4) vs Lookahead Advisories (Model 3); Strict alert card anatomy (Hazard Icon $\rightarrow$ Depth Ahead $\rightarrow$ Prob/Conf $\rightarrow$ Empirical Evidence $\rightarrow$ Recommended Mitigation $\rightarrow$ Historical Outcome); ISA-18.2 Alarm Lifecycle Management (Unacknowledged, Acknowledged, Cleared, Shelved, Suppressed); Mitigation Playbook panel with sample sizes; Depth replay simulator; Shift handover PDF export.

---

### Page 7: Document Intelligence Hub & Validation Queue (`/documents`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| PIPELINE STATUS: Uploaded (42) -> OCR Parsed (42) -> Extracted (318) -> Pending Review (4) -> Validated (314) | Accuracy: 94.2%   |
+---------------------------------------------------------------+-------------------------------------------------------------------+
| INTERACTIVE PDF VIEWER (DDR_OIL_NH04_Phase2.pdf - Page 42)    | ENGINEERING VALIDATION QUEUE (Item 4 of 4) [ Keyboard Mode ]     |
| +-----------------------------------------------------------+ | ----------------------------------------------------------------- |
| | DAILY REMARKS (14:00 - 18:00):                            | | Document: DDR_OIL_NH04_Phase2.pdf (Page 42)                       |
| | Experienced total loss of returns at 2,915m TVDSS while   | | Event Type:     [ Lost Circulation       ] (Conf: 98%)          |
| | drilling Barail sandstone. Pumped 45m³ LCM pill.          | | Start Depth:    [ 2915.0 m TVDSS         ] (Conf: 96%)          |
| | [ Bounding Box #4 Highlighted in Yellow ]                 | | Volume Lost:    [ 45.0 m³                ] (Conf: 91%)          |
| +-----------------------------------------------------------+ | Remediation:    [ Pumped 45m³ LCM pill   ] (Conf: 89%)          |
|                                                               | Outcome:        [ Successful             ] (Conf: 95%)          |
| SEARCH HUB: [ "lost returns Barail"                         ] | ----------------------------------------------------------------- |
| Recall Path: Hybrid (BM25 Full-Text + pgvector Semantic HNSW) | [ Approve & Commit (Enter) ] [ Edit ] [ Reject ]                  |
+---------------------------------------------------------------+-------------------------------------------------------------------+
```

- **Features:** 6-stage document processing pipeline; PDF viewer with bounding box highlights; Engineering validation form with field-level OCR confidence scores and keyboard-first shortcuts (`Enter` approve, `Tab` next); Volve benchmark accuracy display; Hybrid BM25 + `pgvector` semantic search.

---

### Page 8: Field Driller Doghouse PWA View (`/pwa-field`)

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| DOGHOUSE MOBILE MODE | WELL: NH-12 | RIG STATE: DRILLING ROTARY | CACHE STATUS: OFFLINE READY (Synced 4m ago)                     |
+-----------------------------------------------------------------------------------------------------------------------------------+
| NEXT 100m HAZARD BAROMETER (Readable from 2 meters distance):                                                                     |
|                                                                                                                                   |
|   🔴 2,910m TVDSS (60m AHEAD): MUD LOSS RISK (78%)                                                                                |
|      Formation: Barail Sandstone | Expected Loss: 15-45 m³                                                                    |
|      ACTION: Prepare 40 ppb CaCO3 pill in pit #3. Notify Company Man if flow out drops below 85%.                                 |
|                                                                                                                                   |
|   🟡 3,050m TVDSS (200m AHEAD): TORQUE SPIKE RISK (42%)                                                                           |
+-----------------------------------------------------------------------------------------------------------------------------------+
| [ ACKNOWLEDGE HAZARD ]   |   [ CALL RTOC / COMPANY MAN ]   |   [ SHIFT HANDOVER SUMMARY ]                                          |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Features:** Glove-friendly 56px touch targets; Sunlight-readable high-contrast theme; Offline queueing for hazard acknowledgements; 2-meter visual hazard barometer; 3 imperative "What do I do now" steps per hazard.

---

### Page 9: Pre-Drilling Offset Analogue Selector (`/analogues`) [NEW - Model 1 UI]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| MODEL 1 ANALOGUE SELECTOR | Target Well: OIL-NH-12 | Target Hole Section: 12¼" (2,150m to 3,200m TVDSS)                            |
| 5-FACTOR WEIGHT SLIDERS: Geo Dist (25%) | Stratigraphy (35%) | Depth Delta (15%) | Profile Match (15%) | Hole Size Match (10%)        |
+-----------------------------------------------------------------------------------------------------------------------------------+
| RANKED TOP-10 OFFSET ANALOGUES TABLE                                                                                              |
| Rank | Well Name | Field    | Dist (km) | TVD Delta | Similarity Score | Score Breakdown (Geo / Strat / Depth / Prof / Size)       |
| #1   | NH-04     | Digboi   | 3.2 km    | 45m       | 87.4%            | [ ████████░░ 82% | ██████████ 95% | █████████░ 88% ... ]  |
| #2   | NH-07     | Digboi   | 4.1 km    | 120m      | 82.1%            | [ ███████░░░ 74% | █████████░ 90% | ████████░░ 81% ... ]  |
| #3   | NH-02     | Tinsukia | 8.5 km    | 10m       | 79.5%            | [ █████░░░░░ 52% | ██████████ 98% | ██████████ 96% ... ]  |
+-----------------------------------------------------------------------------------------------------------------------------------+
| "WHY THIS WELL" EXPLANATION PANEL (NH-04):                                                                                        |
| Shares exact Barail sandstone formation top sequence and identical 12¼" hole section diameter. Drilled in 2021 with 3 loss events. |
| [ Select for Offset Roadmap Baseline ] [ Export Analogue Selection PDF ]                                                          |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Purpose:** UI for Model 1 pre-drilling analogue ranking. Enables drilling engineers to weight distance vs geological stratigraphy before spudding.

---

### Page 10: Master Well File 360° View (`/well/:id`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| MASTER WELL FILE: OIL-NH-04 | Field: Digboi | Status: Completed (2021) | Total Depth: 3,420m TVDSS | Profile: Deviated (24° max)    |
+-----------------------------------------------------------------------------------------------------------------------------------+
| TAB NAVIGATION: [ Profile & Casing ] [ Formation Tops ] [ Composite Log ] [ Historical Events (6) ] [ Documents (8) ]           |
| --------------------------------------------------------------------------------------------------------------------------------- |
| CASING SCHEMATIC & HOLE SUMMARY:                                                                                                  |
|  - 20" Conductor @ 50m TVDSS                                                                                                      |
|  - 13⅜" Surface Casing @ 850m TVDSS (LOT: 1.52 SG)                                                                                |
|  - 9⅝" Intermediate Casing @ 2,150m TVDSS (LOT: 1.45 SG)                                                                          |
|  - 7" Production Liner @ 3,420m TVDSS                                                                                             |
| HISTORICAL INCIDENT TIMELINE:                                                                                                     |
|  - 2021-04-12 @ 2,915m TVDSS: Lost Circulation (45m³ mud lost in Barail sandstone, resolved with 40 ppb CaCO3 pill).               |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Purpose:** Single 360° lookup page for any historical or active well referenced in map pins, correlation curtains, or alert citations.

---

### Page 11: Plan vs. Actual Drilling Cockpit (`/planning`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| DRILLING PROGRESS & AFE COST COCKPIT | Active Well: OIL-NH-12 | Spud Date: 2026-09-01 | Days Elapsed: 28 Days                      |
+---------------------------------------------------------------+-------------------------------------------------------------------+
| DAYS-VS-DEPTH CURVE (Plan vs Actual)                          | SECTION NPT BREAKDOWN & AFE COST TRACKING                         |
| Depth (m)                                                     | ----------------------------------------------------------------- |
| 0 |--- Planned AFE Schedule                                   | Total NPT: 14.2 hrs (5.1% of total rig time)                     |
|   |    *** Actual Progress (NH-12)                            |   - Stuck Pipe / Reaming:   6.5 hrs (45%)                      |
|   |                                                           |   - Lost Circulation:       4.2 hrs (30%)                      |
|3k |                                                           |   - Equipment / Telemetry:  3.5 hrs (25%)                      |
|   +------------------------------------ Days (0 to 45)        | Estimated Cost Incurred: $142,000 USD                             |
+---------------------------------------------------------------+-------------------------------------------------------------------+
```

- **Purpose:** Tracks operational performance, days-vs-depth schedule adherence, and non-productive time (NPT) financial impact.

---

### Page 12: OIL Formation Catalog Admin Editor (`/admin/catalog`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| OIL MASTER FORMATION CATALOG EDITOR | Region: Upper Assam Basin | Total Formations Defined: 14                                    |
+-----------------------------------------------------------------------------------------------------------------------------------+
| Formation Name  | Typical Lithology | Avg Pore Press | Frac Grad | Known Hazards               | Actions                          |
| Dihing          | Pebble Bed        | 1.03 SG        | 1.35 SG   | Surface Washouts            | [ Edit ] [ Markers (42 wells) ]  |
| Tipam Sandstone | Fine Sandstone    | 1.05 SG        | 1.42 SG   | Seepage Losses              | [ Edit ] [ Markers (88 wells) ]  |
| Barail          | Interbedded Shale | 1.28 SG        | 1.62 SG   | Overpressure, Kicks, Losses | [ Edit ] [ Markers (112 wells) ] |
+-----------------------------------------------------------------------------------------------------------------------------------+
| [ + Add New Formation Definition ] | [ Export Catalog Schema JSON ]                                                               |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Purpose:** Administrative interface allowing OIL geologists to maintain master formation definitions and lithology properties across Assam fields.

---

### Page 13: System Data & Model Health Dashboard (`/admin/health`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| SYSTEM HEALTH | WITSML Feed: ONLINE (1.0 Hz) | OCR Ingestion Backlog: 0 Pending | Active Model Version: v2.4 (Updated 2026-09-15) |
+---------------------------------------------------------------+-------------------------------------------------------------------+
| MODEL PERFORMANCE METRICS                                     | SENSOR CHANNEL INTEGRITY & DRIFT                                  |
| Model 1 Analogue Selector:  100% Availability (Deterministic) | Bit Depth Channel:   0 Gaps / 24h (100% Quality)               |
| Model 2 DFIM Alignment:     Avg Warp Quality 88.4%            | Standpipe Pressure:  0.2s Avg Latency                             |
| Model 3 Hazard Lookahead:   AUC-ROC 0.91 (GroupKFold Val)     | Mud Flow Out %:      1 Sensor Noise Warning (Recalibrate)          |
| Model 4 Anomaly Detector:   False Alarm Rate 1.2 / 24h        | Model Drift Indicator: PSI = 0.04 (Stable Feature Distribution)   |
+---------------------------------------------------------------+-------------------------------------------------------------------+
```

- **Purpose:** System operations panel tracking feed uptime, sensor data quality, model inference latency, and data drift metrics.

---

### Page 14: Morning Report & Offset Review PDF Generator (`/reports`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| REPORT GENERATOR | Active Well: OIL-NH-12 | Report Type: [ Daily Morning Drilling Report (DDR) ▼ ] | Shift: Tour 1 (06:00 - 18:00) |
+-----------------------------------------------------------------------------------------------------------------------------------+
| SELECT REPORT SECTIONS TO INCLUDE:                                                                                                |
|  [x] 24-Hour Operations Summary & Depth Progress               [x] Active Rig State & Telemetry Highlights                        |
|  [x] Lookahead Hazard Advisories (Next 200m Interval)          [x] Active Mud Properties & ECD Margin Summary                     |
|  [x] Offset Well Analogue Citations (NH-04, NH-07)            [x] Open Alert Acknowledgements & Handover Notes                   |
+-----------------------------------------------------------------------------------------------------------------------------------+
| [ Generate PDF Morning Report ] [ Email to Rig Superintendent ] [ Download PNG Summary Cards ]                                    |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Purpose:** Automatically compiles active telemetry, lookahead hazards, and shift notes into standardized PDF reports for tour handover meetings.

---

### Page 15: Auth, User Management & RBAC Config (`/admin/auth`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| USER MANAGEMENT & ROLE-BASED ACCESS CONTROL (RBAC)                                                                                |
+-----------------------------------------------------------------------------------------------------------------------------------+
| User Name    | Email                 | Assigned Role        | Permissions                                 | Field Mode State |
| Arjun Das    | arjun@oilindia.in     | RTOC_ENGINEER        | Full Read/Write, Alert Ack, What-If Exec    | Desktop          |
| Rajesh Kumar | rkumar@oilindia.in    | FIELD_DRILLER        | Read-Only Telemetry, Alert Ack, Offline PWA | Mobile Doghouse  |
| Dr. S. Sarma | ssarma@oilindia.in    | GEOLOGIST            | Read/Write Formations & Correlation Curtain | Desktop          |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Purpose:** User management panel enforcing role-based permissions (`RTOC_ENGINEER`, `FIELD_DRILLER`, `GEOLOGIST`, `SYSTEM_ADMIN`).

---

### Page 16: System Audit & Action Attribution Log (`/audit`) [NEW]

```text
+-----------------------------------------------------------------------------------------------------------------------------------+
| AUDIT & ATTRIBUTION LOG | Total Logged Events: 1,428 | Filter: [ All Actions ] | User: [ All Users ] | Range: Last 7 Days       |
+-----------------------------------------------------------------------------------------------------------------------------------+
| Timestamp (IST)      | User ID     | User Role     | Action Type       | Target ID | Action Details / Reason                      |
| 2026-09-29 14:22:18  | eng_arjun   | RTOC_ENGINEER | ACKNOWLEDGE_ALERT | ALT-8841  | "CaCO3 LCM pill mixed in Pit #3"             |
| 2026-09-29 13:45:02  | geol_sarma  | GEOLOGIST     | VALIDATE_DDR_OCR  | EVT-0912  | "Approved start depth 2,915m TVDSS from PDF" |
| 2026-09-29 11:10:45  | eng_arjun   | RTOC_ENGINEER | EXECUTE_WHAT_IF   | SIM-0041  | "Tested MW 1.34 SG -> ECD 1.37 SG Clearance" |
+-----------------------------------------------------------------------------------------------------------------------------------+
```

- **Purpose:** Immutable compliance audit log tracking every user decision, alert acknowledgement, and validation edit.

---

## Section 3: Complete Feature Matrix (F-01 to F-25)

| Feature ID | Feature Name | Primary Screen | Technical Functionality & Operational Goal | Database Tables & SQL / ML Implementation |
| :--- | :--- | :--- | :--- | :--- |
| **F-01** | **Spatial Radius Offset Search** | `/map` | Finds historical offset wells within user-defined metric radius (1-25 km). | `well` table via PostGIS `ST_DWithin(surface_geom::geography, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, radius_m)` |
| **F-02** | **3D Trajectory Proximity Filter** | `/map` | Filters offset wells whose subterranean 3D path passes within target distance of active well. | `wellbore_path` table via PostGIS 3D metric distance `ST_3DDWithin(path_utm, target_segment_32646, 500)` in EPSG:32646 |
| **F-03** | **WebGL 3D Well Path Render** | `/map` | Visualizes subterranean 3D directional trajectories in Three.js / React Three Fiber. | `wellbore_path` Linestring Z coordinates mapped to metric 3D scene (X, Y, Z=-TVDSS) |
| **F-04** | **Correlation Curtain View** | `/correlation` | Renders side-by-side depth tracks with formation top bands & incident flags. | `well_log`, `wellbore_marker`, and `event_ledger` joined by `wellbore_id` |
| **F-05** | **DFIM Formation Alignment** | `/correlation` | Dynamic Time Warping (DTW) alignment of rock signatures (GR, MSE) across wells. | Executed via Model 2 microservice using `dtaidistance` exact C-DTW with Sakoe-Chiba window (±50m) |
| **F-06** | **1 Hz WITSML Live Telemetry** | `/telemetry` | Displays rolling 1 Hz strip charts for ROP, WOB, Torque, SPP, Flow Delta, Gas. | Redis Stream buffer $\rightarrow$ TimescaleDB `telemetry_1hz` hypertable |
| **F-07** | **Deterministic Rig-State Badge**| `/telemetry` | Classifies active rig state (`DRILLING_ROTARY`, `CONNECTION`, etc.) in real time. | Deterministic decision tree evaluating BitDepth, HoleDepth, HookLoad, RPM, FlowIn |
| **F-08** | **Mud Logging Gas Track** | `/telemetry` | Tracks total gas %, $C_1-C_5$ chromatography, and connection gas spikes. | `mud_log_gas` table indexed by time and TVDSS depth |
| **F-09** | **Pore / Frac Pressure Plot** | `/pore-pressure` | Displays Eaton pore pressure curve vs planned mud weight & fracture gradient. | `wellbore_marker`, `formation_catalog`, & `wellbore_casing` LOT/FIT records |
| **F-10** | **Deterministic What-If Sandbox** | `/pore-pressure` | Simulates ECD shifts, shoe clearance margins, and kick tolerance for test mud weights. | Physics calculation engine evaluating hydrostatic + annular friction pressure drop against shoe LOT |
| **F-11** | **6-Target Lookahead Advisory** | `/advisory` | Surfacing hazard risk scores (0-100%) for 6 SIH hazard classes in next 100m. | `event_ledger` historical density + Model 3 XGBoost classifier inference |
| **F-12** | **ISA-18.2 Alarm Manager** | `/advisory` | Debounces, prioritizes, and manages driller acknowledgement workflows. | `alarm_history` table tracking state (Unack, Ack, Shelved, Cleared) and timestamp |
| **F-13** | **Mitigation Outcome Tracker** | `/advisory` | Displays historical remediation success rates and NPT hours incurred in offset events. | `event_ledger.mitigation_outcome` and `npt_hours_incurred` |
| **F-14** | **PDF Table & Remark OCR** | `/documents` | Extracts tabular data and daily shift remarks from DDR/WCR PDFs. | `PaddleOCR` (PP-Structure) $\rightarrow$ `documents_raw` and `extraction_staging` |
| **F-15** | **Engineering Validation Queue** | `/documents` | Human-in-the-loop review interface for approving extracted DDR events with hotkeys. | Staging table $\rightarrow$ committed `event_ledger` table |
| **F-16** | **Hybrid Document Search** | `/documents` | Full-text search (BM25) + `pgvector` semantic recall for hazard synonyms. | `event_ledger` via PostgreSQL FTS (`to_tsvector`) + `pgvector` HNSW index on 384d embeddings |
| **F-17** | **Doghouse Offline PWA Mode** | `/pwa-field` | Caches active well parameters & hazard cards for offline mobile field use. | Browser Service Worker + IndexedDB local storage |
| **F-18** | **Pre-Drilling Analogue Selector** | `/analogues` | Ranks historical offset candidate wells prior to spudding per hole section. | Model 1 5-factor weighted scoring algorithm executing against `wellbore_path` & markers |
| **F-19** | **Master Well File 360° View** | `/well/:id` | Unified lookup page displaying trajectory, casing, logs, events, and DDR files. | Aggregation query joining `well`, `wellbore_path`, `wellbore_casing`, `event_ledger` |
| **F-20** | **Plan vs Actual Days-vs-Depth** | `/planning` | Tracks active drilling progress against planned AFE schedule and offset envelopes. | `telemetry_1hz` daily progress vs P10/P50/P90 depth-days benchmark tables |
| **F-21** | **Formation Catalog Editor** | `/admin/catalog` | Administrative screen for OIL geologists to manage master formation definitions. | CRUD interface managing the `formation_catalog` table |
| **F-22** | **System Health & Model Monitor** | `/admin/health` | Monitors WITSML stream latency, OCR backlog, and ML model drift metrics. | Microservice polling feed age, queue size, and SHAP feature drift |
| **F-23** | **Morning Report PDF Generator** | `/reports` | Compiles active telemetry, advisories, and shift notes into morning PDF reports. | `reportlab` / `puppeteer` PDF generator rendering selected report template |
| **F-24** | **RBAC & Persona Management** | `/admin/auth` | Enforces role-based permissions (RTOC Engineer, Field Driller, Geologist). | JWT auth tokens with role claims enforcing UI component visibility |
| **F-25** | **Audit Trail & Attribution Log** | `/audit` | Records immutable log of all user acknowledgements, validations, and sandbox runs.| `audit_log` table with user ID, timestamp, action type, and reason text |

---

## Section 4: Machine Learning Models & Data Processing Specifications

```text
                                         ANALYTICS PIPELINE
                                                 │
      ┌───────────────────┬──────────────────────┼──────────────────────┬───────────────────┐
      │                   │                      │                      │                   │
┌─────────────┐   ┌───────────────┐      ┌───────────────┐      ┌───────────────┐   ┌───────────────┐
│ RIG STATE   │   │  MODEL 1      │      │  MODEL 2      │      │  MODEL 3      │   │  MODEL 4      │
│ CLASSIFIER  │   │  Pre-Drilling │      │  D.F.I.M.     │      │  Subsurface   │   │  Real-Time    │
│ (Rule-Based)│   │  Analogue     │      │  Formation    │      │  Lookahead    │   │  Telemetry    │
│             │   │  Selector     │      │  Alignment    │      │  Classifier   │   │  Anomaly Det. │
└──────┬──────┘   └───────┬───────┘      └───────┬───────┘      └───────┬───────┘   └───────┬───────┘
       │                  │                      │                      │                   │
  Determines        Ranks top-10           Aligns rock            Predicts 6          Detects kick /
  active rig        offset wells           signatures             hazard risks        loss anomalies
  operation         prior to spud          across wells           100m ahead          (State-Gated)
```

---

### 0. Deterministic Rig-State Classifier (Pre-ML Filter)
- **Type:** Deterministic Decision-Tree State Machine.
- **Input Channels:** `BitDepth` (m), `HoleDepth` (m), `HookLoad` (tonnes), `BlockHeight` (m), `RPM`, `FlowIn` (L/min).
- **Configurable Rig Thresholds (Per Rig Configuration):**
  - `FlowIn_Threshold` = 500 L/min
  - `RPM_Threshold` = 20 RPM
  - `HookLoad_Weight_On_Bit_Threshold` = 2.0 tonnes below off-bottom hookload
- **Output Classes:** `DRILLING_ROTARY`, `DRILLING_SLIDE`, `CONNECTION`, `TRIPPING_IN`, `TRIPPING_OUT`, `CIRCULATING`, `PUMPS_OFF`.
- **Classification Rules:**
  1. `DRILLING_ROTARY`: $\text{BitDepth} \ge (\text{HoleDepth} - 0.2\text{m}) \land \text{FlowIn} > 500\text{ L/min} \land \text{RPM} > 20 \land \text{HookLoad} < (\text{OffBottomHookLoad} - 2.0\text{t})$
  2. `DRILLING_SLIDE`: $\text{BitDepth} \ge (\text{HoleDepth} - 0.2\text{m}) \land \text{FlowIn} > 500\text{ L/min} \land \text{RPM} \le 5$
  3. `CONNECTION`: $\text{BitDepth} < (\text{HoleDepth} - 1.0\text{m}) \land \text{FlowIn} \le 100\text{ L/min} \land \Delta\text{BlockHeight} > 0$
  4. `CIRCULATING`: $\text{BitDepth} < (\text{HoleDepth} - 0.5\text{m}) \land \text{FlowIn} > 500\text{ L/min} \land \text{RPM} \le 10$

---

### Model 1: Pre-Drilling Offset Analogue Selector (5-Factor Engine)
- **Objective:** Ranks candidate historical wells per hole section prior to spudding.
- **Input Features & Weights:**
  1. *Geographic Distance ($d_g$):* 3D subsurface separation ($m$). Normalization constant $d_{\max} = 25,000\text{ m}$ (Weight = 0.25).
  2. *Geological Stratigraphy ($S_{\text{geo}}$):* Formation top sequence match score (0.0 to 1.0) (Weight = 0.35).
  3. *Target TVDSS Delta ($\Delta z$):* Absolute difference in planned total depth ($m$). Normalization constant $z_{\max} = 5,000\text{ m}$ (Weight = 0.15).
  4. *Well Profile Match ($T_{\text{well}}$):* Exact match on profile type (Vertical=1.0, Deviated=0.8, Horizontal=0.5) (Weight = 0.15).
  5. *Hole Diameter Match ($C_{\text{drill}}$):* Ratio of hole diameter match (e.g., 12.25" vs 12.25" = 1.0) (Weight = 0.10).
- **Scoring Formula:**
  $$\text{Similarity Score} = 0.25\left(1 - \frac{d_g}{d_{\max}}\right) + 0.35(S_{\text{geo}}) + 0.15\left(1 - \frac{\Delta z}{z_{\max}}\right) + 0.15(T_{\text{well}}) + 0.10(C_{\text{drill}})$$

---

### Model 2: Dynamic Formation-Interval Matcher (DFIM Engine)
- **Objective:** Real-time depth alignment of active well logs against historical offset logs.
- **Algorithm:** C-optimized exact Dynamic Time Warping (DTW) via `dtaidistance`.
- **Input Traces:** Mechanical Specific Energy (MSE in MPa) + MWD Gamma Ray (GR in API units).
- **Geological Constraints:** Anchored by picked **Formation Tops** (`wellbore_marker`) using a Sakoe-Chiba constraint window ($\pm 50\text{ m}$) to prevent geologically impossible alignments.
- **Warp Path Quality Score:** Evaluates local alignment distance variance. Intervals with high warping path distortion display a degraded confidence indicator and grey shading on the Correlation Curtain.

---

### Model 3: Subsurface Lookahead Hazard Classifier
- **Objective:** Predicts risk probabilities (0.0 to 1.0) for 6 target hazard classes in the upcoming 100m depth window:
  1. `Lost_Circulation`
  2. `Stuck_Pipe`
  3. `Overpressure_Zone`
  4. `Gas_Kick`
  5. `Torque_Spike`
  6. `Cementing_Issue`
- **Two-Tier Architecture:**
  - **Tier A (Empirical Beta-Prior Baseline):** Distance-weighted historical event frequency with a Beta-prior distribution ($\alpha=1, \beta=10$). Ensures stable, transparent baseline risk estimates when offset data is sparse.
  - **Tier B (XGBoost ML Classifier):** Gradient boosted trees trained using well-grouped 5-fold cross-validation (`GroupKFold` on `wellbore_id`) to prevent spatial data leakage across adjacent depths of the same well.
- **Explainability:** Generates SHAP (SHapley Additive exPlanations) values to output human-readable feature attributions on alert cards (e.g., *"Risk driven by +0.08 SG mud weight underbalance vs Eaton pore pressure"*).

---

### Model 4: Real-Time Telemetry Anomaly Detector (State-Gated)
- **Objective:** Flags real-time downhole anomalies during active drilling operations.
- **Algorithm:** **Isolation Forest** (Scikit-Learn) operating on sliding-window residual telemetry channels.
- **Input Channels (1 Hz):**
  - $\Delta\text{Flow} = \text{Flow Out \% (Trended)} - \text{Flow In (L/min) Baseline}$
  - $\Delta\text{Pit} = \text{Rate of change of Pit Volume Total (m³/hr)}$
  - $\Delta\text{Torque} = \text{Active Torque} - \text{Baseline Torque Roadmap}$
  - $\Delta\text{SPP} = \text{Standpipe Pressure deviation from baseline (psi)}$
- **Rig-State Gate:** Executes **only** when `RigState IN ('DRILLING_ROTARY', 'DRILLING_SLIDE')`. Anomaly detection is paused during connections, tripping, or circulating to eliminate false alarms caused by pump changes.

---

## Section 5: Database Schema & Entity Specifications

NWIS uses a normalized **PostgreSQL** database powered by **PostGIS** (geospatial), **TimescaleDB** (time-series telemetry), and **`pgvector`** (semantic embeddings).

```sql
-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. OSDU Master Well Table (Surface Locations)
CREATE TABLE well (
    well_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_name VARCHAR(100) NOT NULL UNIQUE,
    operator VARCHAR(100) DEFAULT 'Oil India Limited',
    field_name VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    surface_geom GEOMETRY(Point, 4326) NOT NULL, -- Surface location in Lat/Lon (EPSG:4326)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. OSDU Wellbore & Subsurface 3D Trajectory Table
CREATE TABLE wellbore_path (
    wellbore_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID REFERENCES well(well_id) ON DELETE CASCADE,
    wellbore_name VARCHAR(100) NOT NULL,
    kb_elevation_m DOUBLE PRECISION NOT NULL, -- Elevation above Mean Sea Level
    survey_datum VARCHAR(10) NOT NULL DEFAULT 'KB',
    path_utm GEOMETRY(LineStringZ, 32646) NOT NULL, -- Metric 3D Path: X(m), Y(m), Z=-TVDSS(m) in UTM Zone 46N
    total_depth_tvdss DOUBLE PRECISION NOT NULL,
    total_depth_md DOUBLE PRECISION NOT NULL
);

-- Spatial 3D Index for fast lookahead proximity queries
CREATE INDEX idx_wellbore_path_3d ON wellbore_path USING gist (path_utm);

-- 3. Editable Master Formation Catalog
CREATE TABLE formation_catalog (
    formation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Tipam Sandstone', 'Barail', 'Girujan'
    typical_pore_pressure_sg DOUBLE PRECISION NOT NULL,
    typical_frac_gradient_sg DOUBLE PRECISION NOT NULL,
    lithology_type VARCHAR(100) NOT NULL, -- e.g., 'Sandstone', 'Shale', 'Coal'
    known_drilling_hazards TEXT[]
);

-- 4. Wellbore Formation Top Markers (Per-Wellbore Picked Depth Tops)
CREATE TABLE wellbore_marker (
    marker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    formation_id UUID REFERENCES formation_catalog(formation_id) ON DELETE RESTRICT,
    top_md_m DOUBLE PRECISION NOT NULL,
    top_tvdss_m DOUBLE PRECISION NOT NULL,
    pick_source VARCHAR(50) DEFAULT 'WCR_Report', -- 'WCR_Report', 'Log_Pick', 'DFIM_Aligned'
    confidence_score DOUBLE PRECISION DEFAULT 1.0
);

-- 5. Raw Survey Stations (Source of Truth for Trajectories)
CREATE TABLE survey_station (
    station_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    md_m DOUBLE PRECISION NOT NULL,
    inclination_deg DOUBLE PRECISION NOT NULL,
    azimuth_deg DOUBLE PRECISION NOT NULL,
    tvdss_m DOUBLE PRECISION NOT NULL,
    easting_m DOUBLE PRECISION NOT NULL,
    northing_m DOUBLE PRECISION NOT NULL,
    survey_tool VARCHAR(50) DEFAULT 'MWD_Gyro'
);

-- 6. OSDU Casing & Shoe Records
CREATE TABLE wellbore_casing (
    casing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    casing_type VARCHAR(50) NOT NULL, -- 'Conductor', 'Surface', 'Intermediate', 'Production'
    shoe_depth_tvdss DOUBLE PRECISION NOT NULL,
    shoe_depth_md DOUBLE PRECISION NOT NULL,
    outer_diameter_in DOUBLE PRECISION NOT NULL,
    inner_diameter_in DOUBLE PRECISION NOT NULL,
    lot_fit_emw_sg DOUBLE PRECISION NOT NULL -- Leak-Off Test EMW in SG
);

-- 7. Well Logs Curve Table (LAS Curve Data)
CREATE TABLE well_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    depth_tvdss DOUBLE PRECISION NOT NULL,
    gr_api DOUBLE PRECISION,   -- Gamma Ray
    res_ohm DOUBLE PRECISION,  -- Resistivity
    dt_usft DOUBLE PRECISION,  -- Sonic Transit Time
    rhob_gcc DOUBLE PRECISION, -- Bulk Density
    mse_mpa DOUBLE PRECISION   -- Mechanical Specific Energy
);
CREATE INDEX idx_well_log_depth ON well_log(wellbore_id, depth_tvdss);

-- 8. Master Historical Event & Mitigation Ledger
CREATE TABLE event_ledger (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'Lost_Circulation', 'Stuck_Pipe', 'Overpressure', 'Gas_Kick', 'Torque_Spike', 'Cementing_Issue'
    event_date TIMESTAMP WITH TIME ZONE,
    start_depth_tvdss DOUBLE PRECISION NOT NULL,
    end_depth_tvdss DOUBLE PRECISION NOT NULL,
    hole_section VARCHAR(20), -- e.g., '12.25"', '8.5"'
    mud_weight_at_event_sg DOUBLE PRECISION,
    severity VARCHAR(20) NOT NULL, -- 'Minor', 'Moderate', 'Severe', 'Critical'
    volume_lost_bbl DOUBLE PRECISION,
    duration_hr DOUBLE PRECISION,
    remediation_applied TEXT, -- Nullable for un-remediated events
    mitigation_outcome VARCHAR(20) NOT NULL DEFAULT 'Successful', -- 'Successful', 'Partial', 'Failed'
    npt_hours_incurred DOUBLE PRECISION DEFAULT 0.0,
    source_document_name VARCHAR(255) NOT NULL,
    source_page_number INT NOT NULL,
    bounding_box JSONB, -- PDF bounding box coordinates
    validation_status VARCHAR(20) NOT NULL DEFAULT 'Pending_Queue', -- 'Pending_Queue', 'Approved', 'Rejected'
    created_by VARCHAR(100) DEFAULT 'OCR_Pipeline',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    embedding vector(384) -- pgvector embedding for hybrid search
);

-- 9. Mud Logging Gas Chromatography Table
CREATE TABLE mud_log_gas (
    gas_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    depth_tvdss DOUBLE PRECISION NOT NULL,
    total_gas_pct DOUBLE PRECISION NOT NULL,
    c1_ppm DOUBLE PRECISION, -- Methane
    c2_ppm DOUBLE PRECISION, -- Ethane
    c3_ppm DOUBLE PRECISION, -- Propane
    ic4_ppm DOUBLE PRECISION,-- Iso-Butane
    nc4_ppm DOUBLE PRECISION,-- Normal-Butane
    c5_ppm DOUBLE PRECISION, -- Pentane
    is_connection_gas BOOLEAN DEFAULT FALSE
);

-- 10. ISA-18.2 Alarm History Table
CREATE TABLE alarm_history (
    alarm_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hazard_class VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'Critical', 'Warning', 'Advisory'
    alarm_state VARCHAR(30) NOT NULL DEFAULT 'UNACKNOWLEDGED', -- 'UNACKNOWLEDGED', 'ACKNOWLEDGED', 'SHELVED', 'CLEARED'
    trigger_depth_tvdss DOUBLE PRECISION NOT NULL,
    acknowledged_by VARCHAR(100),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgement_reason TEXT,
    shelved_until TIMESTAMP WITH TIME ZONE
);

-- 11. PDF Document Intake Staging Tables
CREATE TABLE documents_raw (
    document_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'DDR', 'WCR', 'Mud_Log', 'End_Of_Well'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ocr_status VARCHAR(30) DEFAULT 'PENDING',
    file_path TEXT NOT NULL
);

CREATE TABLE extraction_staging (
    staging_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents_raw(document_id) ON DELETE CASCADE,
    well_name_raw VARCHAR(100),
    event_type_raw VARCHAR(100),
    extracted_depth DOUBLE PRECISION,
    confidence_score DOUBLE PRECISION,
    raw_text_snippet TEXT,
    bounding_box JSONB,
    review_status VARCHAR(30) DEFAULT 'PENDING'
);

-- 12. TimescaleDB Live 1 Hz Telemetry Hypertable
CREATE TABLE telemetry_1hz (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    wellbore_id UUID NOT NULL,
    bit_depth_md DOUBLE PRECISION NOT NULL,
    bit_depth_tvdss DOUBLE PRECISION NOT NULL,
    hookload_tonnes DOUBLE PRECISION,
    block_height_m DOUBLE PRECISION,
    rop_mhr DOUBLE PRECISION,
    wob_tonnes DOUBLE PRECISION,
    torque_knm DOUBLE PRECISION,
    rpm DOUBLE PRECISION,
    spp_psi DOUBLE PRECISION,
    flow_in_lpm DOUBLE PRECISION,
    flow_out_pct DOUBLE PRECISION,
    mud_weight_in_sg DOUBLE PRECISION,
    mud_weight_out_sg DOUBLE PRECISION,
    ecd_sg DOUBLE PRECISION,
    pit_volume_m3 DOUBLE PRECISION,
    total_gas_pct DOUBLE PRECISION,
    rig_state VARCHAR(30) NOT NULL DEFAULT 'DRILLING_ROTARY',
    PRIMARY KEY (wellbore_id, time)
);

-- Convert telemetry table into TimescaleDB Hypertable
SELECT create_hypertable('telemetry_1hz', 'time', chunk_time_interval => INTERVAL '1 day', if_not_exists => TRUE);
```

---

## Section 6: Open-Source E&P Tool Directory & Library Index

| Domain Need | Open-Source Tool / Package | Verified GitHub / PyPI Link | Operational Purpose |
| :--- | :--- | :--- | :--- |
| **3D Trajectory Math** | `welleng` | [github.com/jonnymaserati/welleng](https://github.com/jonnymaserati/welleng) | Minimum curvature trajectory math, TVD interpolation, ISCWSA uncertainty modeling. |
| **Well Log Parsing** | `lasio` | [github.com/kinverarity1/lasio](https://github.com/kinverarity1/lasio) | Reading and writing LAS 2.0/3.0 well log files into Pandas DataFrames. |
| **Multi-Well Analytics** | `welly` | [github.com/agilescientific/welly](https://github.com/agilescientific/welly) | Well log data structures, curve quality checks, multi-well log cross-sections. |
| **Lithology Strip Logs** | `striplog` | [github.com/agilescientific/striplog](https://github.com/agilescientific/striplog) | Formation top intervals, lithology descriptions, SVG strip chart generation. |
| **Fast Exact DTW** | `dtaidistance` | [github.com/wannesm/dtaidistance](https://github.com/wannesm/dtaidistance) | C-optimized exact Dynamic Time Warping alignment for curve matching (Model 2). |
| **Unit Conversion** | `pint` | [github.com/hgrecco/pint](https://github.com/hgrecco/pint) | Enforces oilfield unit conversions (m $\leftrightarrow$ ft, SG $\leftrightarrow$ ppg, kPa $\leftrightarrow$ psi). |
| **Layout-Aware OCR** | `PaddleOCR` | [github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | PP-Structure model for layout extraction and tabular parsing from scanned PDFs. |
| **Digital PDF Parser** | `camelot` / `pdfplumber` | [github.com/camelot-py/camelot](https://github.com/camelot-py/camelot) | Native table extraction from digital (non-scanned) Daily Drilling Report PDFs. |
| **Coordinate Ref Systems**| `pyproj` | [github.com/pyproj4/pyproj](https://github.com/pyproj4/pyproj) | Transformations between WGS84 (EPSG:4326) and UTM Zone 46N (EPSG:32646). |
| **Streaming Anomaly Detection**| `river` / `stumpy` | [github.com/online-ml/river](https://github.com/online-ml/river) | Streaming matrix profiles and online ML anomaly detection on 1 Hz telemetry. |
| **Drilling-Break Detection**| `ruptures` | [github.com/deepinsight/ruptures](https://github.com/deepinsight/ruptures) | Change-point detection for automated drilling break identification in ROP logs. |
| **WITSML Exploration** | `witsml-explorer` | [github.com/equinor/witsml-explorer](https://github.com/equinor/witsml-explorer) | Equinor's open-source UI tool for browsing and testing WITSML server connections. |
| **ML Model Explainability**| `shap` | [github.com/shap/shap](https://github.com/shap/shap) | SHAP feature attribution generation for Model 3 hazard lookahead alert cards. |

---

### Open-Source Oilfield Benchmark Datasets

1. **Utah FORGE Dataset (Primary Demo Dataset):**
   - *Contents:* Parallel cluster wells (`16A(78)-32`, `16B(78)-32`, `78B-32`). Includes daily PDF reports, mud logs, directional survey CSVs, and 1 Hz telemetry logs.
   - *Demo Workflow:* Ingest 16A and 78B as historical offset wells; stream 16B 1 Hz telemetry as live rig feed.
   - *Link:* [Utah FORGE GDR Data Repository](https://gdr.openei.org/)
2. **Equinor Volve Dataset (Extraction Accuracy Benchmark):**
   - *Contents:* Norwegian North Sea dataset containing matching PDF Daily Drilling Reports AND structured WITSML XML files.
   - *Demo Workflow:* Run PDF DDRs through OCR pipeline and benchmark extracted values against ground-truth WITSML XML to report accuracy metrics.
   - *Link:* [Equinor Volve Open Data](https://www.equinor.com/energy/volve-data-sharing)
3. **FORCE 2020 Machine Learning Competition Dataset:**
   - *Contents:* 118 Norwegian offshore well logs with expert-labeled lithology and formation tops.
   - *Demo Workflow:* Testing MWD Gamma Ray and MSE formation alignment (Model 2) at scale.
   - *Link:* [FORCE 2020 GitHub Repository](https://github.com/bolgebrygg/Force-2020-Machine-Learning-Competition)

---

## Section 7: Developer's Plain-English E&P Petroleum Glossary

For software engineers without an oil and gas background, this section explains key petroleum concepts referenced throughout the codebase:

1. **TVDSS vs. MD (Depth Datums):**
   - **MD (Measured Depth):** Total length of the wellbore path measured along the pipe from the rig floor.
   - **TVDSS (True Vertical Depth Sub-Sea):** The exact vertical distance straight down from Mean Sea Level (MSL). Used to correlate geological formations across wells.
2. **Mud Weight (MW) & EMW (Density):**
   - Drilling fluid ("mud") is pumped downhole to cool the bit and exert hydrostatic pressure against rock formations to prevent fluids from blowing out.
   - **SG (Specific Gravity):** Density relative to water ($1.00\text{ SG} = 1.00\text{ g/cm}^3$).
   - **EMW (Equivalent Mud Weight):** Effective density taking into account dynamic fluid friction while pumping.
3. **Casing Shoe & LOT / FIT (Structural Integrity):**
   - Steel casing pipes are cemented into the wellbore to protect upper formations. The bottom edge is the **Casing Shoe**.
   - **LOT (Leak-Off Test):** Physical pressure test at the casing shoe to measure maximum fluid density (EMW) the exposed rock can withstand before fracturing.
4. **Pore Pressure & Fracture Gradient (The Safe Drilling Window):**
   - **Pore Pressure:** Pressure of natural fluids (water, gas, oil) trapped inside rock pores. If mud weight falls below pore pressure, fluid rushes into the well (**Gas Kick**).
   - **Fracture Gradient:** Pressure at which rock cracks. If mud weight exceeds fracture gradient, fluid leaks into rock (**Lost Circulation**).
   - **The Safe Window:** Mud weight must be kept strictly *between* Pore Pressure and Fracture Gradient.
5. **d-exponent & Corrected $d_{xc}$ (Drilling Efficiency):**
   - Normalized ratio comparing penetration rate (ROP) against bit weight (WOB) and rotary speed (RPM). A sudden unexplained drop in $d_{xc}$ signals entry into an overpressured formation zone.
6. **Mechanical Specific Energy (MSE):**
   - Amount of mechanical energy required to excavate a unit volume of rock ($\text{MPa}$ or $\text{psi}$). High MSE spikes indicate bit dulling, vibration, or harder formation stringers.
7. **WITSML & WITS (Data Standards):**
   - Standard XML web service protocol used across the petroleum industry to stream live 1 Hz sensor data from rig sensors to monitoring offices.
8. **NPT (Non-Productive Time):**
   - Unplanned rig downtime caused by operational incidents (stuck pipe, lost circulation, equipment repairs). NPT costs oil companies \$50,000–\$250,000+ per day.
9. **ECD (Equivalent Circulating Density):**
   - Effective downhole density when mud pumps are running: $\text{ECD} = \text{Static Mud Weight} + \text{Annular Friction Pressure Drop}$.

---

## Section 8: Five Immediate Implementation Priorities

If development time is constrained, completing these five high-impact priorities delivers 80% of the industrial-grade control room impression:

1. **Tabular Numerals & Explicit Units Everywhere (A-3):** Enforce `font-variant-numeric: tabular-nums` and display explicit units (`2,850 m TVDSS`, `1.28 SG`) across all metric components.
2. **Data-Freshness & Stale Overlay System (A-4):** Implement the `LIVE`, `DELAYED`, and `STALE` connection states with grey diagonal hatch overlays on delayed charts.
3. **Global Depth Cursor State in Zustand (A-5):** Build the shared depth/time context state object to synchronize scrolling across correlation, advisory, and document pages.
4. **Fact vs. Inference Provenance Grammar (A-6):** Render historical facts with solid borders and ML model predictions with dashed borders and SHAP probability badges.
5. **Strict Alert Card Anatomy & Historical Evidence (Page 6):** Layout alert cards with hazard icons, distance ahead in meters, empirical offset evidence, and historical mitigation success rates.
