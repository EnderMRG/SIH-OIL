# NWIS Machine Learning Model Specifications

**Project:** Nearby Wells Intelligence System (NWIS) — SIH26121  
**Status:** Mock inference active; production models documented below  
**Document Purpose:** Full training, deployment, and data requirements for all 4 production ML models.

---

## Overview

NWIS implements **4 sequential analytics models** plus a **Deterministic Rig-State Classifier**. Current deployment uses mock inference endpoints. This document specifies what is required to train and deploy each production model.

> [!IMPORTANT]
> **Models 1 and 3 (Tier A)** can be deployed without any ML training — they are deterministic scoring functions. Only **Model 3 (Tier B)** and **Model 4** require ML training.

---

## 0. Deterministic Rig-State Classifier

| Property | Detail |
|---|---|
| **Type** | Deterministic Decision-Tree State Machine (no ML) |
| **Status** | ✅ Implemented in `backend/data/telemetry_emulator/emulator.py` |
| **Input Features** | `bit_depth_md`, `hole_depth`, `hookload`, `block_height`, `rpm`, `flow_in_lpm` |
| **Output Classes** | `DRILLING_ROTARY`, `DRILLING_SLIDE`, `CONNECTION`, `TRIPPING_IN`, `TRIPPING_OUT`, `CIRCULATING`, `PUMPS_OFF` |

**Production Rule Logic (exact thresholds — configurable via admin panel):**

```python
# DRILLING_ROTARY
bit_depth >= (hole_depth - 0.2) AND flow_in > 500 AND rpm > 20 AND hookload < wob_threshold

# DRILLING_SLIDE  
bit_depth >= (hole_depth - 0.2) AND flow_in > 500 AND rpm <= 5

# CONNECTION
bit_depth < (hole_depth - 1.0) AND flow_in <= 100 AND Δblock_height > 0
```

**Dataset needed:** None — deploy deterministic rules directly.

---

## Model 1: Pre-Drilling Offset Analogue Selector (6-Factor Engine)

| Property | Detail |
|---|---|
| **Type** | Deterministic weighted scoring (no ML training required) |
| **Status** | 🔶 Mock responses in `backend/api/advisory.py` |
| **Purpose** | Ranks historical offset wells for each drill hole section before spudding |

**Scoring Formula:**

```
Score = 0.25(Geographic) + 0.35(Geological) + 0.15(Depth Target) + 0.15(Well Type) + 0.10(Drilling Context)
```

**Input Features per Candidate Well:**

| Feature | Formula | Weight |
|---|---|---|
| Geographic Distance | `1 - (3D_subsurface_distance_m / max_distance_m)` | 0.25 |
| Geological Stratigraphy | Formation top sequence overlap score (0.0–1.0) | 0.35 |
| Target TVDSS Delta | `1 - (abs(delta_z_m) / max_delta_z_m)` | 0.15 |
| Well Profile Type | Binary match (Vertical/Directional/Horizontal) | 0.15 |
| Drilling Context | Hole diameter match (12.25", 8.5", etc.) | 0.10 |

**Implementation Needed:**
- `backend/ai/similarity/selector.py` — implement the 6-factor scoring function
- Wire to `/api/map/{wellbore_id}/analogues` endpoint

**Datasets:** `well`, `wellbore_path`, `formation_catalog`, `event_ledger` tables in SQLite.

---

## Model 2: Dynamic Formation-Interval Matcher (DFIM Engine)

| Property | Detail |
|---|---|
| **Type** | Exact Dynamic Time Warping (DTW) |
| **Status** | 🔶 Mock log curves in `backend/api/correlation.py` |
| **Library** | `dtaidistance` (C-optimized) or `tslearn` |
| **Purpose** | Aligns active bit depth against historical offset formation intervals in real-time |

**Algorithm:**

```
DTW alignment of 3-channel multivariate time-series:
  Channel 1: MSE (Mechanical Specific Energy) — normalized
  Channel 2: d-exponent (corrected) — normalized  
  Channel 3: MWD Gamma Ray (API units) — normalized
```

**Constraints:**
- Anchored by **Formation Tops** (geological boundaries from `formation_catalog`)
- **Sakoe-Chiba band** of ±50m TVDSS to prevent unphysical warping

**Inputs Required:**
- Active well: live 1 Hz telemetry from `telemetry_1hz` aggregated over 5m depth windows
- Offset well: LAS log curves parsed via `lasio` from historical LAS files

**Implementation Needed:**
```
backend/ai/dfim/
  aligner.py     # DTW alignment engine using dtaidistance
  features.py    # MSE, d-exponent, GR feature computation
  anchor.py      # Formation top constraint bands
```

**Python Dependencies to install:**
```bash
pip install dtaidistance tslearn lasio welleng pint
```

**Training/Tuning:** No ML training — DTW is an exact algorithm. The only tunable parameter is the Sakoe-Chiba window size (default: ±50m).

---

## Model 3: Subsurface Lookahead Hazard Classifier

| Property | Detail |
|---|---|
| **Type** | Two-tier: Beta-Prior baseline + XGBoost/LightGBM classifier |
| **Status** | 🔶 Mock probabilities in `backend/api/advisory.py` |
| **Hazard Targets** | Lost_Circulation, Stuck_Pipe, Overpressure_Zone, Gas_Kick, Torque_Spike, Cementing_Issue |

### Tier A (Always-On Baseline — Deploy First)

**Beta-Prior Distance-Weighted Frequency:**

```python
# For each hazard class H at depth window D:
k = count(events of type H within ±50m TVDSS of D in offset wells)
n = count(all wells penetrating this depth window)
alpha_0, beta_0 = 1, 10   # conservative Beta prior (α=1, β=10)

# Posterior mean probability:
P(H | D) = (alpha_0 + k) / (alpha_0 + beta_0 + n)
```

**Tier A needs only:** the `event_ledger` table — no ML training.

### Tier B (ML Classifier)

**Algorithm:** XGBoost or LightGBM (multi-output binary classifier, one output per hazard class)

**Training Features:**

| Feature | Source |
|---|---|
| `incident_density_per_m` | event_ledger: N events / depth window width |
| `tvdss_delta_to_nearest_event` | event_ledger: distance to nearest same-type event |
| `mud_weight_vs_pp_margin_sg` | formation_catalog pore pressure vs planned MW |
| `planned_casing_shoe_clearance_m` | wellbore_casing table |
| `bit_to_casing_clearance_ratio` | geometry calculation |
| `formation_lithology_encoded` | formation_catalog one-hot encoded |
| `offset_well_count_in_window` | spatial filter result |

**Training Protocol:**
```python
from sklearn.model_selection import GroupKFold

# CRITICAL: use well-grouped cross-validation to prevent data leakage
gkf = GroupKFold(n_splits=5)
groups = df["wellbore_id"]   # Group by well, NOT by depth
# This prevents depth-adjacent rows of the same well being in both train and test
```

**Recommended Training Dataset:**
1. **Utah FORGE Dataset** (Primary): [https://gdr.openei.org/](https://gdr.openei.org/)
   - Wells: `16A(78)-32`, `78B-32` as historical offsets
   - Well `16B(78)-32` 1 Hz telemetry as live rig feed
2. **Equinor Volve Dataset** (Benchmark): [https://www.equinor.com/energy/volve-data-sharing](https://www.equinor.com/energy/volve-data-sharing)
   - Match PDF DDRs → WITSML for extraction precision measurement

**Explainability:** Generate SHAP values per prediction using `shap` library for alert card drivers.

**Implementation Needed:**
```
backend/ai/risk/
  tier_a.py        # Beta-prior baseline (deploy first)
  tier_b.py        # XGBoost/LightGBM classifier
  trainer.py       # Training script with GroupKFold
  explainer.py     # SHAP value generation
```

**Python Dependencies:**
```bash
pip install xgboost lightgbm shap scikit-learn
```

---

## Model 4: Real-Time Telemetry Anomaly Detector (State-Gated)

| Property | Detail |
|---|---|
| **Type** | Isolation Forest + State-Gated Rules Engine |
| **Status** | 🔶 Mock alerts in `backend/api/advisory.py` |
| **Execution** | Only fires when `rig_state IN ('DRILLING_ROTARY', 'DRILLING_SLIDE')` |
| **Purpose** | Flags sudden downhole sensor anomalies during active drilling |

**Input Channels (1 Hz, computed as residuals):**

```
ΔFlow  = flow_out_pct - flow_in_lpm/baseline    # Mud loss indicator
ΔPit   = d/dt(pit_volume_m3)                     # Pit gain/loss rate
ΔTorque = torque_knm - torque_baseline_roadmap   # Torque deviation
ΔSPP   = spp_psi - spp_baseline                  # Standpipe pressure deviation
```

**Algorithm:**

```python
from sklearn.ensemble import IsolationForest

# Fit on baseline "normal drilling" windows from historical telemetry
iso = IsolationForest(n_estimators=200, contamination=0.02, random_state=42)
iso.fit(normal_windows)   # Shape: (n_windows, 4_features)

# At runtime: sliding 60-second window
score = iso.decision_function(current_window)
if score < -0.15 and rig_state in DRILLING_STATES:
    trigger_alarm()
```

**State Gate (mandatory):**
```python
DRILLING_STATES = {"DRILLING_ROTARY", "DRILLING_SLIDE"}

# Only run anomaly detection during active drilling
if telemetry_frame["rig_state"] not in DRILLING_STATES:
    return  # Suppress — prevents false alarms during connections/trips
```

**Baseline Roadmap:**
- Train baseline torque/SPP curves from first 200m of drilling each well
- These serve as the "ghost curve" reference the frontend displays behind live data

**Implementation Needed:**
```
backend/ai/anomaly/
  detector.py      # IsolationForest wrapper with state gating
  baseline.py      # Baseline roadmap calculation from historical telemetry
  trainer.py       # Training script
```

**Python Dependencies:**
```bash
pip install scikit-learn numpy pandas
```

---

## Deployment Order Recommendation

```
Priority 1 (This Sprint):
  ✅ Rig-State Machine (done in emulator)
  🔶 Model 3 Tier A — Beta-Prior (no training, uses event_ledger)

Priority 2 (Next Sprint):
  🔶 Model 1 — 6-Factor Selector (deterministic, no training)
  🔶 Model 4 — Isolation Forest (needs historical telemetry logs)

Priority 3 (Production Phase):
  🔶 Model 2 — DTW DFIM (needs LAS log files)
  🔶 Model 3 Tier B — XGBoost (needs labeled event data + Utah FORGE)
```
