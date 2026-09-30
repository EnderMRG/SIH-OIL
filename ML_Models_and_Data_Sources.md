# eRTMAC-NWIS — Machine Learning Models, Training Specifications & Data Source Index

**Project:** Nearby Wells Intelligence System (NWIS)  
**SIH Problem Statement ID:** SIH26121  
**Organization:** Oil India Limited (OIL)  
**Document Purpose:** Complete Technical Specification for AI/ML Model Architectures, Feature Engineering, Training Pipelines, Metadata Schemas, and an Exhaustive Directory of Open-Source E&P Datasets & Tools.

---

## 📌 Document Overview

This document defines the complete machine learning architecture for the **Nearby Wells Intelligence System (NWIS)**. It details:
1. **Model Specs & Mathematical Formulations:** Detailed breakdowns of all 4 analytical models and the pre-ML Rig-State Machine.
2. **Feature Engineering & Metadata Schemas:** Exact input channels, units, data types, and preprocessing steps.
3. **Training & Evaluation Pipelines:** Cross-validation strategies, class imbalance handling, and explainability frameworks.
4. **Exhaustive Data Source Directory:** A comprehensive collection of public oilfield datasets, GitHub repositories, data archives, and E&P software tools.

---

## 🤖 Section 1: Machine Learning Architecture & Model Specifications

```text
                                ANALYTICS CORE
                                      │
         ┌───────────────────┬────────┴───────────┬───────────────────┐
         ▼                   ▼                    ▼                   ▼
     [ MODEL 1 ]         [ MODEL 2 ]          [ MODEL 3 ]         [ MODEL 4 ]
    Pre-Drilling           D.F.I.M.           Subsurface Risk      Real-Time
    6-Factor Offset       Formation              Lookahead         Telemetry
   Analogue Selector      Alignment              Classifier        Anomaly Detector
         │                   │                    │                   │
  Ranks offset wells  Aligns active       Predicts stuck pipe,   Detects sudden
  per hole section    telemetry to past   losses, overpressure,  flow/torque drifts
  (excludes events)   formation vectors   torque & cementing     gated by rig state
```

---

### 0. Deterministic Rig-State Classifier (Pre-ML Gating Engine)

* **Architecture:** Rule-Based State Machine / Decision Tree.
* **Purpose:** Classifies rig operations at 1 Hz to gate downstream anomaly detection (Model 4) and prevent false alarms during routine connections, tripping, and mud transfers.
* **Input Features & Channels:**
  - `BitDepth_MD` ($m$): Current measured bit depth.
  - `HoleDepth_MD` ($m$): Current total hole depth.
  - `HookLoad` ($	ext{tonnes}$ / $	ext{klbs}$): Total weight supported by derrick hook.
  - `BlockHeight` ($m$): Travelling block vertical position.
  - `RPM` ($	ext{rev/min}$): Top drive / rotary table speed.
  - `FlowIn_LPM` ($L/	ext{min}$): Mud pump flow rate in.

#### Decision Rules Engine:
```python
def classify_rig_state(bit_depth, hole_depth, hookload, block_height_delta, rpm, flow_in, weight_on_bit):
    on_bottom = (hole_depth - bit_depth) <= 0.2  # Bit within 20cm of hole bottom
    pumps_running = flow_in > 200                # Active mud circulation
    rotating = rpm > 10                          # String rotation active

    if on_bottom and pumps_running and rotating:
        return "DRILLING_ROTARY"
    elif on_bottom and pumps_running and not rotating:
        return "DRILLING_SLIDE"                  # Mud motor directional drilling
    elif not on_bottom and pumps_running and not rotating and ROP == 0:
        return "CIRCULATING"                     # Hole cleaning / conditioning
    elif not on_bottom and not pumps_running and abs(block_height_delta) > 0.1:
        return "TRIPPING"                        # Running in / pulling out of hole
    elif not on_bottom and flow_in <= 50 and ROP == 0:
        return "CONNECTION"                      # Adding pipe joint
    elif flow_in <= 10:
        return "PUMPS_OFF"
    else:
        return "IDLE_OTHER"
```

---

### Model 1: Pre-Drilling Offset Analogue Selector (6-Factor Engine)

* **Architecture:** Multi-Factor Weighted Scoring Service (Interval-Ranked).
* **Purpose:** Ranks candidate historical offset wells before spudding for a specific planned hole section/formation interval.
* **Input Features & Metadata:**
  1. **Geographic 3D Distance ($d_g$):** Distance between planned target TVDSS segment and offset path in projected meters (UTM Zone 46N / EPSG:32646).
  2. **Stratigraphic Sequence Match ($S_{geo}$):** Jaccard index of formation top sequences above and within target zone.
  3. **Target TVDSS Difference ($\Delta z$):** Absolute vertical depth difference $|Z_{	ext{active}} - Z_{	ext{offset}}|$ ($m$).
  4. **Well Profile Trajectory Type ($T_{well}$):** Match score between Vertical (1.0), Directional (0.8), Horizontal (0.6).
  5. **Hole Section Clearance ($C_{drill}$):** Match ratio of planned bit diameter to offset hole size (e.g., $12.25'' \leftrightarrow 12.25'' = 1.0$).
  6. **Data Resolution Quality ($Q_{data}$):** Score based on available data types (LAS High-Res = 1.0, Mud Log Only = 0.6, Paper DDR Only = 0.4).

#### Scoring Formula:
$$	ext{Score} = w_1 \left(1 - rac{d_g}{d_{	ext{max}}}ight) + w_2 S_{geo} + w_3 \left(1 - rac{\Delta z}{z_{	ext{max}}}ight) + w_4 T_{well} + w_5 C_{drill} + w_6 Q_{data}$$
*Default Weights:* $w_1 = 0.25, w_2 = 0.35, w_3 = 0.15, w_4 = 0.10, w_5 = 0.08, w_6 = 0.07$.

* **Selection Bias Protection:** Historical incident counts are explicitly **excluded** from this scoring equation. Event density is rendered strictly as an informational layer to prevent well selection bias.

---

### Model 2: Dynamic Formation-Interval Matcher (DFIM Engine)

* **Architecture:** Formation-Anchored Exact Dynamic Time Warping (DTW).
* **Purpose:** Real-time alignment of active bit telemetry curves to offset well logs, correcting for layer thickness variations (stretching/compression) across space.
* **Feature Normalized Inputs:**
  1. **Mechanical Specific Energy (MSE):**
     $$	ext{MSE} = rac{	ext{WOB}}{	ext{Bit Area}} + rac{120 \pi \cdot 	ext{RPM} \cdot 	ext{Torque}}{	ext{Bit Area} \cdot 	ext{ROP}}$$
  2. **Corrected d-exponent ($d_{xc}$):**
     $$d_{xc} = rac{\log_{10}\left(rac{	ext{ROP}}{60 \cdot 	ext{RPM}}ight)}{\log_{10}\left(rac{12 \cdot 	ext{WOB}}{10^6 \cdot D_{	ext{bit}}}ight)} \cdot \left(rac{	ext{Normal Mud Weight}}{	ext{Active Mud Weight}}ight)$$
  3. **MWD Gamma Ray (GR):** API unit trace (when available).

#### DTW Execution Details:
* **Library:** `dtaidistance` / `tslearn` (C-optimized exact DTW).
* **Constraints:** Anchored by verified **Formation Tops** with a Sakoe-Chiba constraint band ($\pm 50	ext{m}$) to prevent unphysical layer matching across major geological boundaries.
* **Subsequence Alignment:** Uses open-ended subsequence DTW matching the active growing well prefix against offset logs.

---

### Model 3: Subsurface Lookahead Hazard Classifier

* **Architecture:** Two-Tier Ensemble (Tier A Empirical Baseline + Tier B XGBoost/LightGBM).
* **Purpose:** Predicts risk probabilities (0.0 to 1.0) for 6 SIH hazard target classes in the upcoming 50m–100m depth window ahead of the bit.

#### 6 Target Hazard Classes:
1. `Lost_Circulation`: Partial/Total mud losses ($m^3/hr$).
2. `Stuck_Pipe`: Differential sticking, mechanical tight spots, pack-offs.
3. `Overpressure_Zone`: Pore pressure approaching or exceeding ECD margin.
4. `Gas_Kick`: Influx of formation gas ($C_1-C_5$) into wellbore.
5. `Torque_Spike`: Erratic torque exceeding torque-and-drag roadmap baseline.
6. `Cementing_Issue`: Losses during cementing, low TOC, remedial squeeze operations.

#### Feature Matrix ($X$):
| Feature Name | Description | Unit | Source |
| :--- | :--- | :--- | :--- |
| `offset_incident_density` | Incident count per 100m in target formation across top 5 offsets | count/100m | `event_ledger` |
| `min_distance_to_historical_event` | Subsurface 3D distance to nearest historical incident | meters | `event_ledger` + PostGIS |
| `pore_pressure_margin_sg` | Active Mud Weight minus Eaton Pore Pressure Gradient | SG | `formation_catalog` / telemetry |
| `casing_shoe_clearance_m` | TVDSS distance to last casing shoe | meters | `wellbore_casing` |
| `shoe_lot_fit_margin_sg` | Active Mud Weight minus Casing Shoe LOT/FIT EMW | SG | `wellbore_casing` |
| `bit_to_casing_clearance_ratio` | Bit diameter divided by casing inner diameter | ratio | `wellbore_casing` |
| `dfim_alignment_score` | Model 2 DTW similarity match score | 0.0 - 1.0 | Model 2 Engine |
| `formation_lithology_code` | Categorical encoding of formation rock type (Shale, Sand, Clay) | One-Hot | `formation_catalog` |

#### Two-Tier Architecture:
* **Tier A (Always-On Empirical Baseline):**
  Calculates distance-weighted historical incident frequency using a **Beta-Prior Distribution** ($lpha=1, eta=10$):
  $$P(	ext{Hazard}) = rac{k + lpha}{n + lpha + eta}$$
  *Why:* Guarantees a transparent, physically grounded baseline risk estimate even when training data is small.
* **Tier B (Machine Learning Classifier):**
  - **Models:** XGBoost / LightGBM.
  - **Validation:** 5-Fold Group Cross-Validation (`GroupKFold` grouped by `wellbore_id`) to prevent data leakage between depth-adjacent samples of the same well.
  - **Explainability:** Generates **SHAP (SHapley Additive exPlanations)** values for every prediction, populating the risk factors breakdown on alert cards.

---

### Model 4: Real-Time Telemetry Anomaly Detector (State-Gated)

* **Architecture:** Isolation Forest Residual Detector.
* **Purpose:** Detects sudden downhole operational anomalies during active drilling.
* **State Gating:** Executes *only* when Rig-State is `DRILLING_ROTARY` or `DRILLING_SLIDE`. Pauses during connections and trips.

#### Residual Input Features:
1. **Flow Differential Residual ($\Delta	ext{Flow}$):**
   $$\Delta	ext{Flow} = 	ext{Flow Out \% (Trended)} - 	ext{Flow In \%}$$
2. **Pit Volume Rate of Change ($\Delta	ext{Pit}$):**
   $$\Delta	ext{Pit} = rac{d}{dt}(	ext{Pit Volume Total})$$
3. **Torque Deviation ($\Delta	ext{Torque}$):**
   $$\Delta	ext{Torque} = 	ext{Active Torque} - 	ext{Offset Baseline Torque Roadmap}$$
4. **Standpipe Pressure Deviation ($\Delta	ext{SPP}$):**
   $$\Delta	ext{SPP} = 	ext{Active SPP} - 	ext{Expected Hydraulics SPP}$$

---

### Document OCR & NLP Event Extraction Pipeline

* **Architecture:** Layout-Aware PDF Parser + Rule-Based NER + Vector Embedding.
* **Tools:** `PaddleOCR` (PP-Structure) / Microsoft Table Transformer + `spaCy` + `sentence-transformers` (`all-MiniLM-L6-v2`).
* **Workflow:**
  1. **Table Extraction:** Parses structured tabular logs (depths, mud weights, casing sizes) into CSV JSON.
  2. **Narrative NER Extraction:** Extracts shift remarks for entities: `DEPTH`, `MUD_WEIGHT`, `EVENT_TYPE`, `REMEDIATION`, `VOLUME_LOST`.
  3. **Engineering Validation Queue:** Extracted records are held in staging tables until approved by a drilling engineer.
  4. **Vector Embedding:** Approved remarks are embedded using `all-MiniLM-L6-v2` (384 dimensions) and stored in `pgvector` for semantic recall.

---

## 🗂️ Section 2: Complete Metadata & Feature Schema Blueprint

Below is the complete parameter dictionary required across all system models:

| Field Name | Data Type | Unit | Allowed Range | Default / Fallback | Model Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `wellbore_id` | UUID | N/A | Valid UUID | Required | All Models |
| `bit_depth_md` | Float | meters | $0 - 10,000$ | Required | Model 2, 3, 4 |
| `bit_depth_tvdss` | Float | meters | $-500 - 10,000$ | Computed from trajectory | Model 1, 2, 3 |
| `rop_mhr` | Float | m/hr | $0 - 200$ | $0.0$ | Model 2 |
| `wob_tonnes` | Float | tonnes | $0 - 50$ | $0.0$ | Model 2 |
| `torque_knm` | Float | kN·m | $0 - 60$ | $0.0$ | Model 2, 4 |
| `rpm` | Float | rev/min | $0 - 300$ | $0.0$ | Model 2 |
| `spp_psi` | Float | psi | $0 - 6,000$ | $0.0$ | Model 4 |
| `flow_in_lpm` | Float | L/min | $0 - 4,000$ | $0.0$ | Model 4, Rig-State |
| `flow_out_pct` | Float | % | $0 - 100\%$ | $0.0$ | Model 4 |
| `pit_volume_m3` | Float | $m^3$ | $0 - 300$ | $0.0$ | Model 4 |
| `mud_weight_sg` | Float | SG | $0.8 - 2.5$ | $1.10$ | Model 3, What-If |
| `gamma_ray_api` | Float | API | $0 - 350$ | $50.0$ | Model 2 |
| `total_gas_pct` | Float | % | $0 - 100\%$ | $0.0$ | Model 3, 4 |
| `c1_ppm` | Float | ppm | $0 - 1,000,000$ | $0.0$ | Model 3 |
| `casing_shoe_tvdss` | Float | meters | $0 - 10,000$ | $0.0$ | Model 3 |
| `lot_fit_emw_sg` | Float | SG | $1.0 - 2.5$ | $1.50$ | Model 3, What-If |

---

## 🌐 Section 3: Exhaustive Index of Data Sources, Repositories & Datasets

To train, validate, and demo these models under real-world conditions, use this exhaustive index of open-source datasets, E&P data repositories, and Python packages:

### 1. Primary Public Oilfield & Subsurface Datasets

#### 1.1 Utah FORGE Geothermal Data Repository (Primary Demo Cluster)
* **Description:** A premier public dataset featuring a cluster of closely spaced directional wells (`16A(78)-32`, `16B(78)-32`, `78B-32`) drilled parallel to each other.
* **Included Data:** PDF Daily Drilling Reports, 1 Hz Pason drilling telemetry logs, mud logs, directional survey CSVs, and final well reports.
* **NWIS Usage:** Use 16A and 78B PDF reports to test document extraction and populate historical offset well ledgers. Replay 16B 1 Hz telemetry logs to demonstrate live eRTMAC monitoring!
* **Link:** [Utah FORGE OpenEI Repository](https://gdr.openei.org/submissions/1183)

#### 1.2 Equinor Volve Data Village (Extraction & Benchmark Suite)
* **Description:** 5 Terabytes of real North Sea operational data released by Equinor.
* **Included Data:** Daily Drilling Reports in BOTH scanned PDF format AND structured WITSML 1.4.1.1 XML files, LAS logs, production records.
* **NWIS Usage:** Gold-standard dataset for measuring OCR extraction accuracy. Run PDF DDRs through PaddleOCR, then measure extracted depth accuracy against the structured WITSML XML ground truth to report precision/recall metrics!
* **Link:** [Equinor Volve Data Sharing Portal](https://www.equinor.com/energy/volve-data-sharing)

#### 1.3 FORCE 2020 Subsurface ML Contest Dataset
* **Description:** 118 Norwegian North Sea well logs with expert-labeled lithology and formation tops.
* **Included Data:** Well logs (Gamma Ray, Resistivity, Density, Sonic, Caliper) with standardized formation tops.
* **NWIS Usage:** Used for training and testing MWD Gamma Ray and MSE Dynamic Time Warping (Model 2) formation alignment at scale.
* **Link:** [FORCE 2020 GitHub Repository](https://github.com/bolgebrygg/Force-2020-Machine-Learning-Competition)

#### 1.4 Offshore Norway (NPD / NOD) FactPages & Diskos
* **Description:** Public data archive from the Norwegian Offshore Directorate containing thousands of well logs, drilling completion reports, and NPT records.
* **Link:** [NPD FactPages Portal](https://factpages.sodir.no/)

#### 1.5 UK National Data Repository (NDR) / NSTA
* **Description:** UK North Sea open data portal containing historical Well Completion Reports, Daily Drilling Summaries, and directional survey listings.
* **Link:** [UK NSTA Data Repository](https://ndr.nsta.co.uk/)

#### 1.6 Kansas Geological Survey (KGS) Well Database
* **Description:** Over 100,000 public US onshore well records with downloadable LAS log files and directional survey listings.
* **Link:** [Kansas Geological Survey Database](https://www.kgs.ku.edu/Magellan/Qualified/index.html)

#### 1.7 Wyoming Oil & Gas Conservation Commission (WOGCC)
* **Description:** Public database containing downloadable directional survey listings, casing reports, and drilling completion PDFs.
* **Link:** [WOGCC Data Portal](http://wogcc.wyo.gov/)

#### 1.8 NORCE OpenLab Drilling Simulator Data
* **Description:** High-fidelity simulated real-time drilling datasets containing simulated gas kicks, mud losses, and stuck pipe incidents.
* **Link:** [NORCE OpenLab Infrastructure](https://openlab.norceresearch.no/)

---

### 2. Specialized Python Packages & GitHub Repositories

| Package / Repository | GitHub Link | Purpose & Domain Application |
| :--- | :--- | :--- |
| **`welleng`** | [nicolasflandin/welleng](https://github.com/nicolasflandin/welleng) | Minimum curvature 3D trajectories, TVD interpolation, ISCWSA MWD error models, anti-collision separation factors. |
| **`lasio`** | [kinverarity1/lasio](https://github.com/kinverarity1/lasio) | Robust parsing of LAS 1.2, 2.0, and 3.0 well log files into Python dictionaries/Pandas DataFrames. |
| **`welly`** | [agilescientific/welly](https://github.com/agilescientific/welly) | Object-oriented well log data handling, curve quality auditing, and multi-well project management. |
| **`striplog`** | [agilescientific/striplog](https://github.com/agilescientific/striplog) | Processing lithology strip charts, stratigraphic column representations, and formation top boundaries. |
| **`dlisio`** | [equinor/dlisio](https://github.com/equinor/dlisio) | Equinor's open-source Python parser for binary DLIS and LIS well log files. |
| **`dtaidistance`** | [wannesm/dtaidistance](https://github.com/wannesm/dtaidistance) | Fast, C-optimized exact Dynamic Time Warping (DTW) calculation for curve pattern matching. |
| **`stumpy`** | [TDAmeritrade/stumpy](https://github.com/TDAmeritrade/stumpy) | Modern matrix profile library for time-series pattern discovery, anomaly detection, and motif identification. |
| **`river`** | [online-ml/river](https://github.com/online-ml/river) | Online incremental machine learning library for continuous streaming 1 Hz telemetry anomaly detection. |
| **`ruptures`** | [deepcharles/ruptures](https://github.com/deepcharles/ruptures) | Change-point detection in Python for detecting sudden drilling breaks and ROP shifts. |
| **`pint`** | [hgrecco/pint](https://github.com/hgrecco/pint) | Physical unit conversion framework for converting oilfield units ($	ext{ppg} \leftrightarrow 	ext{SG}$, $	ext{ft} \leftrightarrow 	ext{m}$, $	ext{psi} \leftrightarrow 	ext{kPa}$). |
| **`PaddleOCR`** | [PaddlePaddle/PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) | PP-Structure layout analysis and table transformer for extracting tabular data from scanned DDR PDFs. |
| **`camelot`** | [camelot-dev/camelot](https://github.com/camelot-dev/camelot) | Extracting tabular data from digital text-based PDF drilling reports. |
| **`tadi`** | [TADI Agentic RAG Repo](https://github.com/) | Academic research benchmark applying Agentic LLM systems on Volve DDRs + WITSML + DuckDB + ChromaDB. |

---

## 🛠️ Section 4: Model Training, Evaluation & Deployment Pipeline

### 1. Training & Cross-Validation Protocol
* **Data Leakage Warning:** Never use standard random $K$-Fold cross-validation on well depth series data! Depth-adjacent samples from the same well will leak future information into the training fold.
* **Strict Protocol:** Use **`GroupKFold(n_splits=5)`** grouped strictly by `wellbore_id`. This ensures entire wells are held out during validation folds, testing how the model generalizes to brand new unseen wells.

```python
from sklearn.model_selection import GroupKFold
import xgboost as xgb

gkf = GroupKFold(n_splits=5)
for train_idx, val_idx in gkf.split(X, y, groups=df['wellbore_id']):
    X_train, y_train = X.iloc[train_idx], y.iloc[train_idx]
    X_val, y_val = X.iloc[val_idx], y.iloc[val_idx]

    model = xgb.XGBClassifier(n_estimators=200, max_depth=5, learning_rate=0.05)
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], early_stopping_rounds=20)
```

### 2. Handling Class Imbalance
* In drilling datasets, NPT hazard events (kicks, losses, stuck pipe) represent $< 2\%$ of total drilled depth intervals.
* **Mitigation Strategy:**
  - Use `scale_pos_weight` in XGBoost (ratio of negative to positive samples).
  - Train using Precision-Recall Area Under Curve (`PR-AUC`) as the primary evaluation metric rather than standard ROC-AUC or Accuracy.
  - Apply SMOTE (Synthetic Minority Over-sampling Technique) strictly on the *training* split, never on the validation split.

### 3. Model Export & Production Serving
* Train models offline using Jupyter/Python scripts.
* Export trained models to **ONNX** format or native XGBoost JSON files (`model.save_model("risk_model.json")`).
* Serve predictions via lightweight FastAPI microservices loading ONNX runtime bindings for sub-10ms inference latency during live WITSML telemetry streaming.
