# eRTMAC-NWIS — Technical System Architecture & Implementation Blueprint

**Project Name:** Nearby Wells Intelligence System (NWIS)  
**SIH Problem Statement ID:** SIH26121  
**Organization:** Oil India Limited (OIL)  
**Document Purpose:** Master System Architecture, Data Engineering Specification, and Team Implementation Guide.

---

## Executive Summary & Team Guide

This document is the **single source of truth** for building the Nearby Wells Intelligence System (NWIS). It bridges historical engineering records (legacy PDFs, daily drilling reports, completion reports) with real-time operational rig telemetry streams from Oil India Limited’s eRTMAC (Real-Time Monitoring and Analysis Centre).

### For Developers & Teammates: What Are We Building?
When drilling a new oil/gas well, engineers face underground hazards like **mud losses** (fluid leaking into porous rock), **stuck pipe** (drill bit getting trapped), **overpressure gas kicks** (high-pressure gas rushing up the wellbore), **torque spikes**, and **cementing failures**. 

Historically, insights about these hazards are buried inside hundreds of scanned PDF Daily Drilling Reports (DDRs) and Well Completion Reports (WCRs). Engineers spent hours manually reading old PDFs.

**NWIS solves this by creating a unified system that:**
1. **Parses & Extracts PDF Records:** Converts legacy PDFs into a structured PostgreSQL database using layout-aware OCR table extraction and full-text/semantic search.
2. **Displays a 3D Geospatial Map:** Shows nearby offset wells on an interactive map, calculating 3D subsurface trajectory clearance relative to the active well.
3. **Aligns Underground Rock Formations (DFIM):** Matches current bit depth to historical formation layers in nearby wells using Dynamic Time Warping (DTW) on rock signatures.
4. **Predicts Hazards (Lookahead Advisory):** Warns drillers 50m to 100m *before* their drill bit hits a hazard zone that caused trouble in historical offset wells.
5. **Monitors Live Telemetry & Detects Anomalies:** Ingests 1 Hz WITSML rig sensor feeds, runs a deterministic **Rig-State Machine** to prevent false alarms, and alerts drillers to sudden flow or torque anomalies.
6. **Provides a Physics-Based What-If Sandbox:** Lets engineers test Mud Weight adjustments against the physical Pore Pressure vs. Fracture Gradient window.

---

## 0. Official Problem Statement Requirements (SIH26121)

| Problem Statement Requirement | System Feature / Architectural Solution |
| :--- | :--- |
| **1. PDF Document Extraction** | Layout-Aware PDF Parsing (PaddleOCR / camelot) + Engineering Validation Queue + Full-Text / Semantic Search. |
| **2. Interactive Geospatial Map** | Mapbox/Leaflet 2D Surface Map (EPSG:4326) + PostGIS Metric 3D Trajectory Proximity Filter (EPSG:32646) with user-defined radius. |
| **3. Searchable Knowledge Repository** | OSDU-aligned Event Ledger storing incidents, remediations, **mitigation outcomes** (Successful / Failed), and NPT hours saved. |
| **4. Depth & Formation Correlation** | Depth Normalization to TVDSS + Dynamic Formation-Interval Matching (DFIM) using formation-anchored DTW on MSE & Gamma Ray. |
| **5. Hazard Predictive Analytics** | Lookahead Risk Classifier (Model 3) covering all 6 named hazard targets: *Losses, Stuck Pipe, Overpressure, Kicks, Torque Spikes, Cementing Issues*. |
| **6. Real-Time Alerts & Recommendations** | 1 Hz WITSML Telemetry Streamer + Deterministic Rig-State Classifier + ISA-18.2 Compliant Alarm Management. |
| **7. Dual-Persona Dashboard** | Desktop RTOC Cockpit (Multi-display analytics) + Doghouse Mobile PWA (High-contrast, low-bandwidth offline hazard cards). |

---

## 1. Core Architectural Principles & Integrity Bounds

To ensure safety, explainability, and enterprise reliability in high-stakes drilling operations, NWIS enforces five mandatory **Integrity Boundaries**:

### 1. Facts vs. Inferences
* **The Rule:** Verified engineering data (actual casing shoe depths, measured mud weights, logged formation tops) must be clearly separated from AI model outputs or statistical probabilities.
* **Why it matters:** Engineers must always know whether a depth figure is a physical fact from a log or an AI estimate.

### 2. Historical Observations vs. Predictions
* **The Rule:** Past operational events (e.g., an actual 50 bbl mud loss at 2,910m TVDSS in Well B) are displayed separately from forward-looking lookahead risk scores.

### 3. Physics & Deterministic Code First
* **The Rule:** Quantitative trajectories, sensor numbers, and pressure curves are processed strictly via deterministic petroleum engineering formulas (e.g., Minimum Curvature, Mechanical Specific Energy [MSE], d-exponent, Eaton Pore Pressure). Generative AI is *never* allowed to calculate numeric depths or physical coordinates.

### 4. Deterministic Search & Source Provenance
* **The Rule:** Every historical event or mitigation step displayed in the UI must be bound to its source document ID, page number, and bounding box.

### 5. Human-in-the-Loop Decision Support
* **The Rule:** The platform advises and alerts human drilling engineers; it does not issue automated control signals to rig machinery.

---

## 2. High-Level 5-Tier System Architecture

```text
[ TIER 1: INGESTION & DATA CAPTURE ]
   Historical: Legacy PDFs (DDRs, WCRs), LAS Well Logs, Directional Survey CSVs
   Live Telemetry: eRTMAC WITSML 1.4.1.1 Streamer (Redis Stream Buffer)
                         
                         
[ TIER 2: EXTRACTION, NORMALIZATION & QC PIPELINE (OSDU-Aligned) ]
   Layout-Aware PDF & Table Extractor (PaddleOCR / camelot / Table Transformer)
   Depth Normalization Engine (Converts KB/GL elevations to TVDSS) & Unit Converter (`pint`)
   Directional Survey Engine (Computes 3D coordinates in UTM Zone 46N / EPSG:32646)
   Engineering Validation Queue (Human verification step before committing events to ledger)
                         
                         
[ TIER 3: MULTI-MODEL DATABASE LAYER (PostgreSQL + PostGIS + TimescaleDB) ]
   Spatial Store (PostGIS): EPSG:32646 3D Wellbores, EPSG:4326 Surface Pins, Stratigraphic Tops
   Time-Series Store (TimescaleDB): 1 Hz live rig telemetry logs & gas channels ($C_1-C_5$)
   Relational & Full-Text Store (PostgreSQL / FTS / pgvector): OSDU-aligned schemas & event ledger
   Fast Cache & Pub/Sub (Redis): Active bit position cache & ISA-18.2 alert dispatcher
                         
                         
[ TIER 4: ANALYTICS & ML CORE ]
   Rig-State Classifier: Deterministic State Machine (Drilling Rotary/Slide, Connecting, Tripping, Pumps Off)
   Model 1: Pre-Drilling Offset Analogue Selector (Interval-Ranked 6-Factor Engine)
   Model 2: Dynamic Formation-Interval Matcher (Tops-Constrained Exact DTW on MSE / Gamma Ray)
   Model 3: Subsurface Lookahead Risk Classifier (XGBoost / LightGBM with Beta-Prior Fallback)
   Model 4: Real-Time Telemetry Anomaly Detector (State-Gated Anomaly Forest)
                         
                         
[ TIER 5: APPLICATION DELIVERY (Web & PWA) ]
   Desktop Web Dashboard: RTOC multi-panel cockpit, Pore/Frac Pressure Window & Correlation Curtain
   Mobile / Tablet PWA: Offline-cached hazard cards for driller doghouse
```

---

## 3. Key Technical & Petroleum Engineering Concepts Explained Simply

To help all developers and teammates understand the domain terms used in this architecture, here are plain-language explanations:

### 1. TVDSS (True Vertical Depth Below Mean Sea Level)
* **What is it?** Measuring depth from the rig floor (Kelly Bushing - KB) is misleading because Rig A might sit on a hill at 50m elevation while Rig B sits near a river at 10m elevation. A "2,000m depth" on Rig A is at a completely different rock elevation than 2,000m on Rig B!
* **How we handle it:** We normalize every depth to **TVDSS** (True Vertical Depth below sea level). 
$$	ext{TVDSS} = 	ext{TVD from Rig Floor} - 	ext{Kelly Bushing Elevation (KB)}$$
This puts every well on a single universal sea-level baseline.

### 2. Projected 3D Coordinate System (UTM Zone 46N / EPSG:32646)
* **What is it?** GPS coordinates (Latitude/Longitude in EPSG:4326) are measured in angular degrees. You cannot calculate 3D Euclidean distance between deviated wells in degrees because 1 degree of longitude changes length depending on latitude!
* **How we handle it:** We convert all 3D trajectories into **UTM Zone 46N (EPSG:32646)** where X (Easting), Y (Northing), and Z (-TVDSS) are all measured in **meters**. PostGIS can then instantly execute `ST_3DDWithin` to find offset wells whose underground paths pass within 500 meters of our target bit depth.

### 3. Mechanical Specific Energy (MSE) & d-exponent
* **What is it?** Rate of Penetration (ROP - how fast the bit drills) depends heavily on how hard the driller pushes (WOB) and bit wear, not just the rock type. **MSE** measures the mechanical work required to crush a unit volume of rock:
$$	ext{MSE} = 
rac{	ext{WOB}}{	ext{Bit Area}} + 
rac{120 \pi \cdot 	ext{RPM} \cdot 	ext{Torque}}{	ext{Bit Area} \cdot 	ext{ROP}}$$
The **d-exponent** normalizes ROP for depth and bit weight. When drilling into an overpressured zone, the rock suddenly drills faster than expected, causing the d-exponent to drift off its normal trend line!
* **How we use it:** We use MSE and d-exponent to calculate pore pressure curves and align rock layers between wells without being tricked by driller behavior.

### 4. The Rig-State Machine (Eliminating False Alarms)
* **What is it?** Rigs constantly pause to screw on new pipe joints (connections) or pull pipe out to change bits (tripping). During connections, mud pumps shut off, so mud flow drops to zero. A naive AI anomaly detector sees flow = 0 and triggers a false "mud loss" alarm!
* **How we fix it:** Our deterministic **Rig-State Machine** evaluates hookload, block position, bit-on-bottom, flow-in, and RPM to determine the active rig state:
  - *Drilling Rotary:* Bit on bottom, ROP > 0, Flow > 0, RPM > 0.
  - *Drilling Slide:* Bit on bottom, ROP > 0, Flow > 0, RPM = 0.
  - *Connection:* Bit off bottom, Flow = 0/decreasing, Block height changing.
  - *Tripping:* Bit moving in hole, pumps low/off.
  - *Circulating:* Bit off bottom, Flow > 0, ROP = 0.
* **Impact:** Real-time anomaly alerts are **state-gated** — only firing during active drilling states.

### 5. Physics-Based Deterministic What-If Sandbox
* **What is it?** Why can't we use Machine Learning to answer "What if I increase mud weight?" Because in historical data, drillers *only increased mud weight when a kick was already happening*. An ML model trained on this data falsely learns that higher mud weight causes kicks!
* **How we fix it:** Our What-If console uses pure physics: calculating Equivalent Circulating Density (ECD) against the **Eaton Pore Pressure & Fracture Gradient Window**, casing shoe LOT/FIT margins, and kick tolerance.

---

## 4. Deep-Dive into the 4 Machine Learning & Analytics Models

NWIS implements four targeted models, numbered 1 through 4 sequentially:

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

### Candidate Generation Cascade (Pre-ML Filter)
Before running ML calculations across 10,000 historical wells, a fast deterministic spatial filter reduces the candidate set:
1. **Stage 1A (PostGIS 3D Spatial Radius):** `ST_3DDWithin` selects wells within 500m to 25km of the active well's target depth in EPSG:32646 ($
ightarrow$ ~2,000 wells).
2. **Stage 1B (Stratigraphic Top Filter):** Selects wells penetrating the target formation ($
ightarrow$ ~500 wells).
3. **Stage 1C (Depth Window Target Filter):** Selects wells within $\pm 300	ext{m}$ TVDSS of target depth ($
ightarrow$ ~250 wells).
4. **Stage 2 (Model 1 & 2 Scoring):** Ranks the top 10 offset candidates for each hole section.

---

### Model 1: Pre-Drilling Offset Analogue Selector (6-Factor Engine)
* **Purpose:** Executed before drilling starts to rank historical offset candidate wells for each specific hole section.
* **Equation:** 
$$	ext{Score} = 0.25(	ext{Geographic}) + 0.35(	ext{Geological}) + 0.15(	ext{Depth Target}) + 0.15(	ext{Well Type}) + 0.10(	ext{Drilling Context})$$
* **Selection Bias Fix:** Historical event counts are explicitly *excluded* from similarity scoring so that heavily documented wells with many reported incidents don't falsely skew similarity. Event density is used purely as a display layer.

---

### Model 2: Dynamic Formation-Interval Matcher (DFIM Engine)
* **Purpose:** Aligns active drilling depth with corresponding formation layers in offset wells in real time.
* **Technique:** Exact **Dynamic Time Warping (DTW)** using `dtaidistance` / `tslearn`.
* **Feature Inputs:** Computed on normalized **Mechanical Specific Energy (MSE)**, **d-exponent**, and **MWD Gamma Ray** curves.
* **Geological Anchor Constraints:** DTW is anchored by verified **Formation Tops** with Sakoe-Chiba constraint bands to prevent unphysical layer warping.

---

### Model 3: Subsurface Lookahead Hazard Classifier
* **Purpose:** Evaluates risk probability as active bit depth advances across 6 explicit SIH hazard target classes.
* **Hazard Target Classes:**
  1. *Lost Circulation* (partial / total mud losses)
  2. *Stuck Pipe* (differential / mechanical / pack-off)
  3. *Overpressure Zones* (pore pressure approaching ECD limits)
  4. *Gas Kicks / Influx*
  5. *Torque Spikes* (exceeding torque-and-drag baseline roadmaps)
  6. *Cementing Issues* (losses during cement, low TOC, squeeze operations)
* **Two-Tier Architecture:**
  - **Tier A (Always-On Baseline):** Transparent distance-weighted empirical incident frequency using a Beta-prior distribution (guarantees robust risk estimation even on small historical datasets).
  - **Tier B (ML Classifier):** XGBoost / LightGBM trained with well-grouped cross-validation and SHAP explanation cards.

---

### Model 4: Real-Time Telemetry Anomaly Detector (State-Gated)
* **Purpose:** Flags sudden downhole sensor anomalies in active rig telemetry.
* **Technique:** State-gated rules engine combined with Isolation Forest residuals.
* **State-Gating:** Operates *only* when the Rig-State Machine reports `DRILLING_ROTARY` or `DRILLING_SLIDE`. Automatically pauses during connections, pipe trips, and mud transfers.

---

## 5. OSDU-Aligned Database Schema Architecture

The multi-model database uses PostgreSQL with PostGIS, TimescaleDB, and `pgvector` extensions, structured around the industry-standard **OSDU (Open Subsurface Data Universe)** schema:

```text
                                  DATABASE LAYER (OSDU-Aligned)
 
  POSTGRESQL CORE ENGINE                                                                       
                                                                                               
   [ PostGIS Extension (Metric EPSG:32646) ]     [ TimescaleDB Extension ]                     
   • Wellhead coordinates (Point, EPSG:4326)     • 1 Hz live rig telemetry logs                
   • 3D Trajectory (LineStringZ, EPSG:32646)     • Time-stamped drilling parameters            
   • Spatial Subsurface Proximity (ST_3DDWithin)  • Gas logging time-series ($C_1-C_5$)          
                                                                                               
   [ Relational Core (OSDU Schema) ]             [ Full-Text & Vector Index ]                  
   • OSDU Well, Wellbore, WellboreMarker         • Full-text search of DDR shift remarks       
   • Casing, Cementing, Shoe LOT/FIT Records     • pgvector embeddings for semantic recall     
   • Historical Event Ledger & Mitigations       • Document bounding-box provenance metadata   
 
                                                
                                                 Fast Cache & Message Broker
                                         [ REDIS ENGINE ]
                                         • Active bit position & rig-state cache
                                         • Pub/Sub for ISA-18.2 real-time alerts
```

### Core Entity Definitions:
1. **`wellbore_path`**: Stores 3D trajectory linestrings in `geometry(LineStringZ, 32646)` (TVDSS meters), KB elevation, and survey reference datum (`KB`, `RT`, `GL`, `MSL`).
2. **`formation_catalog`**: Editable table for OIL geologists defining formation boundaries (*Girujan*, *Tipam*, *Barail*, *Kopili*), baseline pore pressure gradients, fracture gradients, lithology descriptions, and known hazards.
3. **`wellbore_casing`**: Stores casing shoe TVDSS, outer/inner diameter, LOT/FIT Equivalent Mud Weight (EMW), and shoe clearance margin.
4. **`event_ledger`**: Stores historical incidents (`Event_Type`, `Start_Depth_TVDSS`, `End_Depth_TVDSS`, `Severity`, `Remediation_Applied`, `Mitigation_Outcome` [Successful/Failed], `NPT_Hours`, `Validation_Status`).

---

## 6. Document Intelligence Pipeline & Engineering Validation Queue

1. **PDF Ingestion:** Historical DDRs and WCRs are parsed using layout-aware table transformers (`PaddleOCR` / `camelot` / Microsoft Table Transformer).
2. **Text & Data Normalization:** Depths are converted to TVDSS and units normalized via `pint`.
3. **Engineering Validation Queue:** Extracted records do *not* jump directly into the production database. They enter a human-in-the-loop **Validation Queue** where drilling engineers verify extracted depths, event types, remediations, and outcomes before committing to the master ledger.
4. **Search Hub:** Enables keyword full-text search combined with `pgvector` semantic recall for searching synonyms ("lost returns", "fluid seepage", "no returns") bound to source document page numbers and bounding boxes.

---

## 7. Alarm Management & Security (ISA-18.2 & IEC 62443)

* **ISA-18.2 Alarm Management:** Alerts feature debouncing, hysteresis, priority levels (*Critical*, *Warning*, *Advisory*), driller acknowledgement workflows, and escalation audit logs.
* **Role-Based Access Control (RBAC):** Differentiates *Field Personnel* (read-only doghouse PWA) from *RTOC Engineers* (full analytical access & validation queue approval).
* **Network Posture (IEC 62443):** Pull-based, read-only integration in a DMZ, isolated from rig OT networks.

---

## 8. System Resilience & Degradation Matrix

| Component Failure | Operational Impact | Automated Fallback Mechanism |
| :--- | :--- | :--- |
| **Live WITSML Feed Stale / Gapped** | Telemetry streaming paused | Dashboard displays "Data Stale" channel indicator and suppresses predictive ML alerts. |
| **Search / Vector Index Down** | Semantic search degraded | System falls back to direct SQL metadata filtering on structured well and incident tables. |
| **Lookahead Risk Classifier Down** | ML hazard probability offline | System displays raw historical offset incident markers (Tier A Beta-prior baseline) on trajectory curtain. |
| **PostgreSQL Main DB Down** | Core API unavailable | Frontend displays cached local well parameters and doghouse PWA offline summaries. |

---

## 9. Codebase Directory Structure

```text
ertmac-nwis/
 frontend/                     # React (Vite / Next.js) Web Dashboard & PWA
    src/
       components/           # 3D Trajectory, Telemetry Charts, Pore/Frac Window, Map Explorer
       hooks/                # WebSocket & Telemetry streaming hooks
       services/             # API clients & PostGIS fetchers
       store/                # Zustand global application state
       types/                # TypeScript interface definitions
 backend/                      # FastAPI Python Application
    app/
       api/                  # REST & WebSocket route handlers
       core/                 # App configuration & DB handlers
       models/               # SQLAlchemy OSDU ORM schemas (PostGIS, TimescaleDB)
       schemas/              # Pydantic validation schemas
       services/             # Domain logic (Well, Trajectory, Risk, Report services)
       workers/              # Background document OCR & parsing workers
    ai/                       # Analytics & ML Module
        rigstate/             # Deterministic Rig-State Classifier
        similarity/           # Model 1: 6-Factor Candidate Selector per Hole Section
        dfim/                 # Model 2: Tops-Constrained Exact DTW Alignment
        risk/                 # Model 3: 6-Target Lookahead Risk Classifier & Beta-Prior
        anomaly/              # Model 4: State-Gated Real-Time Telemetry Anomaly Detector
 data/                         # Ingestion scripts & telemetry emulators
    raw_pdfs/                 # Sample DDR & WCR historical documents
    trajectories/             # Directional survey CSV files
    telemetry_emulator/       # 1 Hz eRTMAC WITSML 1.4.1.1 emulator script
 docs/                         # Specifications
     Architecture.md
```

---

## 10. Open-Source Datasets & Python Tools for Development

To build and demo this project effectively under hackathon conditions:

### Recommended Datasets:
1. **Utah FORGE Dataset (Primary Demo Cluster):** Contains real cluster wells (16A, 16B, 78B). Run 16A/78B PDF reports through the OCR pipeline as historical offsets, and stream 16B 1 Hz logs as the live eRTMAC feed!
2. **Equinor Volve Dataset (Extraction Benchmark):** Contains matching PDF DDRs and structured WITSML XML files, giving a free benchmark to measure OCR extraction accuracy.
3. **FORCE 2020 (Lithology Benchmark):** Norwegian well log dataset for testing GR-based formation alignment at scale.

### Recommended Python Libraries:
* `welleng`: Trajectory minimum curvature calculation, TVD interpolation, and ISCWSA uncertainty.
* `lasio` / `welly` / `striplog`: Parse LAS well logs and formation tops.
* `dtaidistance` / `tslearn`: Exact constrained Dynamic Time Warping for DFIM.
* `pint`: Physical unit conversions.
* `PaddleOCR` / `camelot`: Layout-aware tabular PDF parsing.
* `pyproj` / `GeoAlchemy2`: CRS transformations (EPSG:4326 $\leftrightarrow$ EPSG:32646) and PostGIS integration.
