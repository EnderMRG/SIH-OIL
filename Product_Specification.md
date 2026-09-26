# eRTMAC-NWIS — Product & Web Application Specification

**Project:** Nearby Wells Intelligence System (NWIS)  
**SIH Problem Statement ID:** SIH26121  
**Organization:** Oil India Limited (OIL)  
**Document Purpose:** Complete Web/PWA Application Blueprint, Navigation Routing Flow, Feature Breakdown, ML Model Training Specifications, Database Schema Mapping, and GitHub/Resource Library Index.

---

## Section 1: Web & PWA Navigation & Application Architecture

The NWIS platform is structured as a **Dual-Persona Web Dashboard & PWA (Progressive Web App)**:
- **RTOC Desktop Cockpit:** Multi-screen, high-density layout designed for office-based drilling engineers and geologists at Oil India's Real-Time Monitoring and Analysis Centre.
- **Doghouse Mobile/Tablet PWA:** High-contrast, touch-optimized, low-bandwidth application with offline caching for field personnel operating at the rig site.

### System Sitemap & Route Tree

```text
/ (App Root)
 /dashboard (Command Center / Active Rig Overview)
 /map (Geospatial Well & Trajectory Explorer)
 /correlation (Subsurface Trajectory & Formation Curtain View)
 /telemetry (eRTMAC Real-Time 1 Hz Cockpit & Rig-State Monitor)
 /pore-pressure (Pore Pressure / Frac Window & Deterministic What-If Console)
 /advisory (Lookahead Hazard Radar & ISA-18.2 Alert Center)
 /documents (Historical Document Intelligence Hub & Extraction Queue)
 /pwa-field (Field Driller Doghouse Mobile View)
```

---

### Detailed Screen-by-Screen Layout & Page Flow Wireframes

```text
+----------------------------------------------------------------------------------------------------+
|  HEADER BAR (Global)                                                                               |
|  • Active Rig: "OIL-DGB-07" | Well: "NH-12" | Target TVDSS: 3,200m | Current TVDSS: 2,850m              |
|  • Formation: "Tipam Sandstone" | Rig-State: [ DRILLING ROTARY ] | Alert Status: [ 1 CRITICAL ]        |
+----------------------------------------------------------------------------------------------------+
```

#### Page 1: Command Center (`/dashboard`)
* **Navigation Flow:** Entry point upon login. Links directly to `/map`, `/telemetry`, and `/advisory`.
* **Layout Structure:**
  - **Top Row (Metrics Cards):** Active TVDSS depth, ROP (m/hr), Mud Weight (SG), Current Formation Name, Active Rig-State badge, Distance to Target.
  - **Center Left (Mini-Map):** Interactive preview map showing active rig location and 5km offset well pins.
  - **Center Right (Lookahead Alert Radar):** Cards showing upcoming hazard predictions for the next 100 meters (e.g., "78% Mud Loss Risk at 2,910m in Barail Formation").
  - **Bottom Row (Mini Telemetry Strip):** 1-minute rolling sparklines for ROP, WOB, Torque, Flow Delta, Total Gas.

#### Page 2: Geospatial Well & Trajectory Explorer (`/map`)
* **Navigation Flow:** Accessible from Header or `/dashboard`. Clicking any offset well pin opens a side drawer with well summary details and an "Add to Correlation Curtain" button.
* **Layout Structure:**
  - **Main Viewport (Full-screen Map):** Mapbox/Leaflet basemap in EPSG:4326.
  - **Top Toolbar:** Radius Buffer Slider (3km, 5km, 10km, 25km), Subsurface Depth Window Filter ($\pm 300	ext{m}$ TVDSS), Formation Filter Dropdown.
  - **3D Trajectory Toggle Button:** Switches map into 3D WebGL mode showing 3D subterranean wellbore paths in EPSG:32646 (UTM Zone 46N).
  - **Right Sidebar Drawer:** Displays selected offset well metadata (Spud date, Total Depth, Casing Shoes, Recorded Hazard Events count, Candidate Similarity Score).

#### Page 3: Subsurface Correlation Curtain (`/correlation`)
* **Navigation Flow:** Accessed via `/map` after selecting 1 to 3 offset wells.
* **Layout Structure:**
  - **Top Controls:** Target depth zoom slider, Offset Well Selection pills, Dynamic Formation Alignment Toggle (DFIM Model 2 ON/OFF).
  - **Multi-Track Depth Canvas (TVDSS synchronized scrolling):**
    - *Track 1 (Active Well):* Current TVDSS bit position, live Gamma Ray / MSE log.
    - *Track 2 (Offset Well 1):* Historical LAS log, Formation Tops boundaries (rendered as color-filled connecting bands), Depth-indexed hazard flags (Red = Kick, Yellow = Loss, Blue = Stuck Pipe).
    - *Track 3 (Offset Well 2):* Historical log and incident tags.
  - **Bottom Panel:** Detailed incident comparison card showing recorded remediations and outcome flags (*Successful*, *Failed*).

#### Page 4: eRTMAC Real-Time Telemetry Cockpit (`/telemetry`)
* **Navigation Flow:** Accessible from header.
* **Layout Structure:**
  - **Top Bar:** Live WebSocket Connection Status (1 Hz tick counter), Active Rig-State Pill (`DRILLING_ROTARY`, `DRILLING_SLIDE`, `CONNECTION`, `TRIPPING`, `CIRCULATING`, `PUMPS_OFF`).
  - **Multi-Channel Strip Charts (D3.js / ECharts scrolling logs):**
    - *Channel 1:* ROP (m/hr) & WOB (tonnes)
    - *Channel 2:* Surface Torque (kN·m) & Rotary RPM
    - *Channel 3:* Standpipe Pressure (SPP, psi) & Flow Differential (Flow Out % - Flow In %)
    - *Channel 4:* Pit Volume Total ($m^3$) & Mud Density In/Out (SG)
    - *Channel 5 (Mud Logging Gas):* Total Gas (%) & $C_1, C_2, C_3, C_4, C_5$ breakdown (ppm) + Connection Gas spikes.
  - **Ghost Curve Overlay:** Displays historical baseline average curves from selected offset wells behind live telemetry.

#### Page 5: Pore Pressure Window & Deterministic What-If Console (`/pore-pressure`)
* **Navigation Flow:** Accessed from `/telemetry` or `/advisory`.
* **Layout Structure:**
  - **Left Panel (Pore Pressure / Frac Gradient Window):**
    - Plot showing Depth (TVDSS) vs. Equivalent Mud Weight (SG).
    - Curves: Eaton Pore Pressure Gradient, Fracture Gradient, Planned Mud Weight, Active ECD, Casing Shoe LOT/FIT Equivalent Mud Weight.
  - **Right Panel (Deterministic What-If Sandbox):**
    - Sliders: Test Mud Weight (1.05 to 1.60 SG), Planned ROP, Flow Rate ($L/	ext{min}$).
    - Live Computation Outputs: Calculated ECD margin, Casing Shoe Integrity Clearance, Kick Tolerance ($m^3$), Risk Flag Updates.

#### Page 6: Lookahead Hazard Advisory & Alert Center (`/advisory`)
* **Navigation Flow:** Accessed from `/dashboard` or header alert badge.
* **Layout Structure:**
  - **Top Bar:** ISA-18.2 Priority Filter (Critical, Warning, Advisory), Status Filter (Active, Acknowledged, Dismissed).
  - **Main Hazard Table / Cards:**
    - Cards showing upcoming depth hazard predictions for 6 classes (*Losses, Stuck Pipe, Overpressure, Kicks, Torque Spikes, Cementing Issues*).
    - Card Details: Risk probability %, Stratigraphic Formation, Offset source citation ("Well NH-04 Completion Report, Page 42"), Historical Remediation Applied, Mitigation Outcome ("Successful - 40ppb CaCO3 pill"), NPT Hours Saved.
  - **Action Buttons:** "Acknowledge Alert", "View in Correlation Curtain", "Open Source PDF".

#### Page 7: Document Intelligence & Validation Queue (`/documents`)
* **Navigation Flow:** Accessed from header.
* **Layout Structure:**
  - **Left Sidebar:** Upload PDF button (DDR/WCR), Document List with Status Badges (*Parsed*, *Pending Validation*, *Failed*).
  - **Center Panel (Interactive PDF Viewer):** Displays uploaded PDF with highlighted bounding boxes over extracted tables and daily remarks.
  - **Right Panel (Engineering Validation Queue):** Form showing extracted fields (Date, Depth, Event Type, Mud Weight, Remediation). Drilling engineers click "Approve & Commit to Ledger" or edit values.
  - **Search Bar (Top):** Keyword + `pgvector` semantic search bar (e.g., searching "lost returns" highlights DDR shift remarks mentioning fluid seepage).

#### Page 8: Field Driller Doghouse Mobile PWA (`/pwa-field`)
* **Navigation Flow:** Automatically rendered on mobile/tablet user agents.
* **Layout Structure:**
  - **High-Contrast Dark Theme (Touch-friendly 48px buttons).**
  - **Offline Banner:** Shows local cache status and last synced timestamp.
  - **Single Scrollable View:**
    1. Active Depth & Rig State Header.
    2. Large "Next 100m Hazard Barometer" (Red/Yellow/Green cards).
    3. Quick Action Button: "Acknowledge Hazard".
    4. Offline Offset Summary Card: Key casing depths and mud loss mitigations for current formation.

---

## Section 2: Complete Feature Matrix & Database Entity Mapping

| Feature Name | Primary Page | Functionality Description | Database Tables & Query Types |
| :--- | :--- | :--- | :--- |
| **F-01: Spatial Radius Offset Search** | `/map` | Retrieves historical wells within user-defined surface radius (3-25km). | `wellhead` table via `ST_DWithin(geom_4326, point, radius_meters)` |
| **F-02: 3D Trajectory Proximity Filter** | `/map` | Filters wells whose subterranean 3D path passes within target distance of active well. | `wellbore_path` table via `ST_3DDWithin(geom_32646, target_segment, 500)` |
| **F-03: WebGL 3D Well Path Render** | `/map` | Visualizes 3D directional trajectories in Three.js. | `wellbore_path` Linestring coordinates (X, Y, Z=-TVDSS) |
| **F-04: Correlation Curtain View** | `/correlation` | Renders side-by-side depth tracks with formation top bands & incident flags. | `well_log`, `wellbore_marker`, `event_ledger` joined by `wellbore_id` |
| **F-05: DFIM Formation Alignment** | `/correlation` | Dynamic Time Warping (DTW) alignment of rock signatures across wells. | Executed via Model 2 microservice on `well_log` MSE/GR traces |
| **F-06: 1 Hz WITSML Live Telemetry** | `/telemetry` | Displays rolling strip charts for ROP, WOB, Torque, SPP, Flow Delta, Gas. | Redis Stream buffer $
ightarrow$ TimescaleDB `telemetry_1hz` hypertable |
| **F-07: Deterministic Rig-State Badge** | `/telemetry` | Classifies and displays active rig state (`DRILLING_ROTARY`, `CONNECTION`, etc.). | Computed in real time via Rig-State Machine on WITSML channels |
| **F-08: Mud Logging Gas Track** | `/telemetry` | Tracks total gas, $C_1-C_5$ chromatography, connection gas spikes. | `mud_log_gas` table indexed by time and TVDSS |
| **F-09: Pore / Frac Pressure Plot** | `/pore-pressure` | Displays Eaton pore pressure curve vs planned mud weight & fracture gradient. | `formation_catalog` & `wellbore_casing` LOT/FIT records |
| **F-10: Deterministic What-If Sandbox**| `/pore-pressure` | Simulates ECD shifts and shoe clearance margins for test mud weights. | Physics calculation engine against `casing_shoe` & `pore_pressure` |
| **F-11: 6-Target Lookahead Advisory** | `/advisory` | Surfacing hazard risk scores (0-100%) for 6 SIH hazard classes. | `event_ledger` + Model 3 inference outputs |
| **F-12: ISA-18.2 Alarm Manager** | `/advisory` | Debounces, prioritizes, and manages driller acknowledgement workflows. | `alarm_history` table tracking state, timestamp, user ID |
| **F-13: Mitigation Outcome Tracker** | `/advisory` | Displays whether past offset remediation succeeded/failed & NPT saved. | `event_ledger.mitigation_outcome` & `npt_hours_saved` |
| **F-14: PDF Table & Remark OCR** | `/documents` | Extracts tabular data and daily shift remarks from DDR/WCR PDFs. | Output stored in `documents_raw` and `extraction_staging` |
| **F-15: Engineering Validation Queue** | `/documents` | Human-in-the-loop review interface for approving extracted DDR events. | Staging table $
ightarrow$ committed `event_ledger` table |
| **F-16: Semantic & FTS Document Search**| `/documents` | Full-text search (BM25) + `pgvector` semantic recall for hazard synonyms. | `event_ledger` via PostgREST / FTS + `pgvector` HNSW index |
| **F-17: Doghouse Offline PWA Mode** | `/pwa-field` | Caches active well parameters & hazard cards for offline mobile field use. | Browser Service Worker + IndexedDB local storage |

---

## Section 3: Machine Learning Models & Data Training Specifications

NWIS includes **4 sequential models** plus a **Deterministic Rig-State Classifier**:

```text
                                ANALYTICS CORE
                                      
         
                                                                   
     [ MODEL 1 ]         [ MODEL 2 ]          [ MODEL 3 ]         [ MODEL 4 ]
    Pre-Drilling           D.F.I.M.           Subsurface Risk      Real-Time
    6-Factor Offset       Formation              Lookahead         Telemetry
   Analogue Selector      Alignment              Classifier        Anomaly Detector
                                                                   
  Ranks offset wells  Aligns active       Predicts stuck pipe,   Detects sudden
  per hole section    telemetry to past   losses, overpressure,  flow/torque drifts
  (excludes events)   formation vectors   torque & cementing     gated by rig state
```

---

### 0. Deterministic Rig-State Classifier (Pre-ML Filter)
* **Type:** Deterministic Decision-Tree State Machine.
* **Input Features:** `BitDepth`, `HoleDepth`, `HookLoad`, `BlockHeight`, `RPM`, `FlowIn`.
* **Output Classes:** `DRILLING_ROTARY`, `DRILLING_SLIDE`, `CONNECTION`, `TRIPPING_IN`, `TRIPPING_OUT`, `CIRCULATING`, `PUMPS_OFF`.
* **Rule Logic:**
  - `DRILLING_ROTARY`: $	ext{BitDepth} \ge (	ext{HoleDepth} - 0.2	ext{m}) \land 	ext{FlowIn} > 500 \land 	ext{RPM} > 20 \land 	ext{HookLoad} < 	ext{Threshold}$
  - `DRILLING_SLIDE`: $	ext{BitDepth} \ge (	ext{HoleDepth} - 0.2	ext{m}) \land 	ext{FlowIn} > 500 \land 	ext{RPM} \le 5$
  - `CONNECTION`: $	ext{BitDepth} < (	ext{HoleDepth} - 1.0	ext{m}) \land 	ext{FlowIn} \le 100 \land \Delta	ext{BlockHeight} > 0$

---

### Model 1: Pre-Drilling Offset Analogue Selector (6-Factor Engine)
* **Objective:** Ranks historical offset candidate wells prior to spudding for each specific hole section.
* **Input Features:**
  1. *Geographic Distance ($d_g$):* 3D subsurface distance between target depths ($m$).
  2. *Geological Stratigraphy ($S_{geo}$):* Formation top sequence match score (0.0 - 1.0).
  3. *Target TVDSS Delta ($\Delta z$):* Absolute difference in planned total depth ($m$).
  4. *Well Profile Type ($T_{well}$):* Vertical, Directional, Horizontal match.
  5. *Drilling Context ($C_{drill}$):* Hole diameter match (e.g., 12.25", 8.5").
* **Scoring Formula:**
$$	ext{Score} = 0.25(1 - 
rac{d_g}{d_{max}}) + 0.35(S_{geo}) + 0.15(1 - 
rac{\Delta z}{z_{max}}) + 0.15(T_{well}) + 0.10(C_{drill})$$
* **Training / Tuning:** Deterministic weighted scoring service (no ML training required; parameters configurable via admin panel).

---

### Model 2: Dynamic Formation-Interval Matcher (DFIM Engine)
* **Objective:** Real-time alignment of active well depth against historical offset formation intervals.
* **Algorithm:** Exact **Dynamic Time Warping (DTW)** via `dtaidistance` / `tslearn`.
* **Normalized Input Channels:**
  1. *Mechanical Specific Energy (MSE):* Computed from ROP, WOB, RPM, Torque.
  2. *Corrected d-exponent ($d_{xc}$):* Normalized ROP for depth.
  3. *MWD Gamma Ray (GR):* API units trace.
* **Constraints:** Anchored by verified **Formation Tops** with Sakoe-Chiba constraint window ($\pm 50	ext{m}$) to enforce geological boundaries.

---

### Model 3: Subsurface Lookahead Hazard Classifier
* **Objective:** Predicts risk probabilities (0.0 to 1.0) for 6 SIH hazard target classes in the upcoming 50m-100m depth window.
* **Target Incident Classes:**
  1. `Lost_Circulation`
  2. `Stuck_Pipe`
  3. `Overpressure_Zone`
  4. `Gas_Kick`
  5. `Torque_Spike`
  6. `Cementing_Issue`
* **Features:**
  - Offset historical incident density in target formation interval ($N_{events}/m$).
  - TVDSS depth difference to nearest historical incident ($m$).
  - Current Mud Weight vs Eaton Pore Pressure Gradient margin ($\Delta SG$).
  - Planned Casing Shoe clearance margin ($m$).
  - Bit diameter to casing clearance ratio.
* **Two-Tier Architecture:**
  - **Tier A (Always-On Baseline):** Distance-weighted empirical frequency with Beta-prior distribution ($lpha=1, eta=10$) for transparent baseline risk on small datasets.
  - **Tier B (ML Classifier):** XGBoost / LightGBM trained with well-grouped 5-fold cross-validation (`GroupKFold` on `wellbore_id`) to prevent depth-adjacent data leakage. Outputs SHAP feature importance values for alert cards.

---

### Model 4: Real-Time Telemetry Anomaly Detector (State-Gated)
* **Objective:** Flags real-time downhole anomalies during active drilling.
* **Algorithm:** **Isolation Forest** (Scikit-Learn) operating on residual sliding-window channels.
* **Input Channels (1 Hz):**
  - $\Delta	ext{Flow} = 	ext{Flow Out \%} - 	ext{Flow In \%}$
  - $\Delta	ext{Pit} = 	ext{Rate of change of Pit Volume Total}$
  - $\Delta	ext{Torque} = 	ext{Active Torque} - 	ext{Baseline Torque Roadmap}$
  - $\Delta	ext{SPP} = 	ext{Standpipe Pressure deviation}$
* **Execution Constraint:** Gated by the Rig-State Machine; executes *only* when `RigState IN ('DRILLING_ROTARY', 'DRILLING_SLIDE')`.

---

## Section 4: Database Schema & Entity Specifications

```sql
-- PostGIS Spatial Extension & Metric EPSG:32646 (UTM Zone 46N)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. OSDU Well Table
CREATE TABLE well (
    well_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_name VARCHAR(100) NOT NULL,
    operator VARCHAR(100) DEFAULT 'Oil India Limited',
    field_name VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    surface_geom GEOMETRY(Point, 4326) NOT NULL, -- Surface Pin in Lat/Lon
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. OSDU Wellbore & 3D Trajectory Table
CREATE TABLE wellbore_path (
    wellbore_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    well_id UUID REFERENCES well(well_id) ON DELETE CASCADE,
    wellbore_name VARCHAR(100) NOT NULL,
    kb_elevation_m DOUBLE PRECISION NOT NULL, -- Elevation offset from MSL
    survey_datum VARCHAR(10) NOT NULL DEFAULT 'KB',
    path_utm GEOMETRY(LineStringZ, 32646) NOT NULL, -- 3D Path: X(m), Y(m), Z=-TVDSS(m)
    total_depth_tvdss DOUBLE PRECISION NOT NULL
);

-- Spatial 3D Index for fast subsurface lookahead queries
CREATE INDEX idx_wellbore_path_3d ON wellbore_path USING gist (path_utm);

-- 3. Editable OIL Formation Catalog
CREATE TABLE formation_catalog (
    formation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    formation_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., 'Tipam Sandstone', 'Barail', 'Girujan'
    top_depth_tvdss DOUBLE PRECISION NOT NULL,
    base_depth_tvdss DOUBLE PRECISION NOT NULL,
    typical_pore_pressure_sg DOUBLE PRECISION NOT NULL,
    fracture_gradient_sg DOUBLE PRECISION NOT NULL,
    lithology_type VARCHAR(100) NOT NULL, -- e.g., 'Sandstone', 'Shale', 'Clay'
    known_drilling_hazards TEXT[]
);

-- 4. OSDU Casing & Shoe Records
CREATE TABLE wellbore_casing (
    casing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    casing_type VARCHAR(50) NOT NULL, -- e.g., 'Surface', 'Intermediate', 'Production'
    shoe_depth_tvdss DOUBLE PRECISION NOT NULL,
    outer_diameter_in DOUBLE PRECISION NOT NULL,
    lot_fit_emw_sg DOUBLE PRECISION NOT NULL -- Leak-Off Test EMW in SG
);

-- 5. Master Historical Event & Mitigation Ledger (Extracted & Validated)
CREATE TABLE event_ledger (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wellbore_id UUID REFERENCES wellbore_path(wellbore_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'Lost_Circulation', 'Stuck_Pipe', 'Overpressure', 'Gas_Kick', 'Torque_Spike', 'Cementing_Issue'
    start_depth_tvdss DOUBLE PRECISION NOT NULL,
    end_depth_tvdss DOUBLE PRECISION NOT NULL,
    severity VARCHAR(20) NOT NULL, -- 'Minor', 'Moderate', 'Severe', 'Critical'
    remediation_applied TEXT NOT NULL,
    mitigation_outcome VARCHAR(20) NOT NULL DEFAULT 'Successful', -- 'Successful', 'Partial', 'Failed'
    npt_hours_saved DOUBLE PRECISION DEFAULT 0.0,
    source_document_name VARCHAR(255) NOT NULL,
    source_page_number INT NOT NULL,
    bounding_box JSONB, -- Coordinates of table/text in original PDF
    validation_status VARCHAR(20) NOT NULL DEFAULT 'Approved', -- 'Pending_Queue', 'Approved', 'Rejected'
    embedding vector(384) -- pgvector embedding for semantic search
);

-- 6. TimescaleDB Live Telemetry Hypertable (1 Hz)
CREATE TABLE telemetry_1hz (
    time TIMESTAMP WITH TIME ZONE NOT NULL,
    wellbore_id UUID NOT NULL,
    bit_depth_md DOUBLE PRECISION NOT NULL,
    bit_depth_tvdss DOUBLE PRECISION NOT NULL,
    rop_mhr DOUBLE PRECISION,
    wob_tonnes DOUBLE PRECISION,
    torque_knm DOUBLE PRECISION,
    rpm DOUBLE PRECISION,
    spp_psi DOUBLE PRECISION,
    flow_in_lpm DOUBLE PRECISION,
    flow_out_pct DOUBLE PRECISION,
    pit_volume_m3 DOUBLE PRECISION,
    total_gas_pct DOUBLE PRECISION,
    rig_state VARCHAR(30) NOT NULL DEFAULT 'DRILLING_ROTARY'
);

SELECT create_hypertable('telemetry_1hz', 'time');
```

---

## Section 5: GitHub Repositories, Open-Source Tools & Dataset Index

To accelerate feature extraction and implementation, use the following verified resources:

### Python Libraries & GitHub Repositories:

| Domain Need | Recommended Tool / Repository | GitHub Link & Description |
| :--- | :--- | :--- |
| **3D Trajectory Math** | `welleng` | [github.com/nicolasflandin/welleng](https://github.com/nicolasflandin/welleng) — Minimum curvature calculations, TVD interpolation, ISCWSA uncertainty models. |
| **Well Log Parsing** | `lasio` | [github.com/kinverarity1/lasio](https://github.com/kinverarity1/lasio) — Parses LAS 2.0 and 3.0 well log files into Python dictionaries/Pandas. |
| **Multi-Well Projects** | `welly` | [github.com/agilescientific/welly](https://github.com/agilescientific/welly) — Object-oriented well log data structures and curve quality checks. |
| **Lithology Strip Logs** | `striplog` | [github.com/agilescientific/striplog](https://github.com/agilescientific/striplog) — Formation tops, lithology intervals, and strip chart generation. |
| **Fast Exact DTW** | `dtaidistance` | [github.com/wannesm/dtaidistance](https://github.com/wannesm/dtaidistance) — C-optimized exact Dynamic Time Warping alignment for curve matching. |
| **Physical Unit Conversion**| `pint` | [github.com/hgrecco/pint](https://github.com/hgrecco/pint) — Converts oilfield units (ppg $\leftrightarrow$ SG, ft $\leftrightarrow$ m, psi $\leftrightarrow$ kPa). |
| **Layout-Aware PDF OCR** | `PaddleOCR` | [github.com/PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) — PP-Structure model for tabular extraction from scanned PDFs. |
| **3D WebGL Visualization** | `@react-three/fiber` | [github.com/pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) — Three.js React wrapper for 3D well path trajectory canvas. |

---

### Open-Source Oilfield Datasets:

1. **Utah FORGE Dataset (Primary Demo Cluster):**
   - *Contents:* Real cluster wells (`16A(78)-32`, `16B(78)-32`, `78B-32`) drilled parallel to each other. Includes PDF daily reports, mud logs, directional survey CSVs, and 1 Hz telemetry logs.
   - *How to use in demo:* Ingest 16A and 78B PDFs as historical offset wells. Replay 16B 1 Hz telemetry logs as the live eRTMAC rig feed!
   - *Link:* [Utah FORGE GDR Data Repository](https://gdr.openei.org/)
2. **Equinor Volve Dataset (Extraction Accuracy Benchmark):**
   - *Contents:* Real Norwegian North Sea well dataset containing matching PDF Daily Drilling Reports AND structured WITSML XML files.
   - *How to use in demo:* Run PDF DDRs through your OCR pipeline, then measure extracted depth accuracy against the ground-truth WITSML XML files to report precision/recall metrics.
   - *Link:* [Equinor Volve Open Data](https://www.equinor.com/energy/volve-data-sharing)
3. **FORCE 2020 Machine Learning Contest Dataset:**
   - *Contents:* 118 Norwegian well logs with expert-labeled lithology and formation tops.
   - *How to use in demo:* Testing MWD Gamma Ray and MSE formation alignment (Model 2) at scale.
   - *Link:* [FORCE 2020 GitHub Repository](https://github.com/bolgebrygg/Force-2020-Machine-Learning-Competition)
