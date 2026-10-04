# NWIS eRTMAC — Nearby Wells Intelligence System

## SIH2026 | Problem Statement SIH26121 | Oil India Limited

---

## Quick Start

### 1. Install Dependencies
```powershell
pip install -r requirements.txt
```

### 2. Train All Models
```powershell
# Standard (FORCE 2020 Real Dataset)
$env:PYTHONIOENCODING='utf-8'; python run_training.py

# With LightGBM for Model 3
$env:PYTHONIOENCODING='utf-8'; python run_training.py --lgb

# With real Utah FORGE data augmentation
$env:PYTHONIOENCODING='utf-8'; python run_training.py --forge-csv "path/to/forge_pason.csv"
```

### 3. Start the Serving API
```powershell
cd nwis
uvicorn serve:app --host 0.0.0.0 --port 8000 --reload
# API docs: http://localhost:8000/docs
```

---

## Project Structure

```
ML models/
├── requirements.txt              # All Python dependencies
├── run_training.py               # Top-level training entry point
├── nwis/
│   ├── train_all.py              # Master training orchestrator
│   ├── serve.py                  # FastAPI REST API
│   ├── data/
│   │   ├── data_generator.py     # Synthetic + FORGE data loader
│   │   └── synthetic/            # Generated parquet files (after training)
│   ├── models/
│   │   ├── model1_offset_selector.py   # Pre-Drilling 6-Factor Scorer
│   │   ├── model2_dfim.py              # DTW Formation Aligner
│   │   ├── model3_hazard_classifier.py # XGBoost Hazard Classifier
│   │   ├── model4_anomaly_detector.py  # Isolation Forest Detector
│   │   └── *.pkl / *.onnx / *.json    # Saved model artifacts
│   └── reports/
│       ├── training_report.md    # Auto-generated evaluation report
│       ├── training_report.json  # Machine-readable metrics
│       └── shap_*.png            # Per-class SHAP feature importance plots
```

---

## Model Architectures

| # | Model | Architecture | Purpose | Metric |
|---|-------|-------------|---------|--------|
| 0 | Rig-State Classifier | Rule-Based State Machine | Gate Model 4 | Deterministic |
| 1 | Offset Analogue Selector | 6-Factor Weighted Score | Rank offset wells | R² calibration |
| 2 | DFIM | DTW + Formation Anchors | Real-time log alignment | Alignment score ≥ 0.90 |
| 3 | Hazard Classifier | XGBoost + Beta-Prior Ensemble | 6-class risk prediction | PR-AUC ≥ 0.90 |
| 4 | Anomaly Detector | Isolation Forest | Kick/loss real-time alerts | Recall ≥ 0.90 |

---

## Anti-Overfitting & Anti-Leakage Measures

| Measure | Implementation |
|---------|----------------|
| **Cross-Validation** | `GroupKFold(n=5)` grouped by `wellbore_id` — entire wells held out |
| **No depth-leakage** | Never use standard K-Fold on depth-series data |
| **SMOTE** | Applied **only** inside training folds, never on validation splits |
| **Primary metric** | `PR-AUC` (not ROC-AUC) — calibrated for <2% positive rate |
| **Early stopping** | 30 rounds (XGBoost/LightGBM) |
| **DTW constraints** | Sakoe-Chiba ±50m + verified formation-top anchors |
| **IF contamination** | Conservative 0.015 (1.5%) — trained on normal samples only |
| **Threshold tuning** | OOF threshold sweep — tuned on validation wells, not training |

---

## API Endpoints

| Method | Endpoint | Model | Description |
|--------|----------|-------|-------------|
| GET | `/healthz` | — | Health check |
| GET | `/v1/rig-state` | 0 | Classify rig state |
| POST | `/v1/offset-rank` | 1 | Rank offset well candidates |
| POST | `/v1/dfim-align` | 2 | DTW formation alignment |
| POST | `/v1/hazard-predict` | 3 | 6-class hazard probabilities |
| POST | `/v1/anomaly-detect` | 4 | Real-time anomaly alert |

---

## Utah FORGE Dataset Integration

The system is designed to ingest real Utah FORGE Pason 1Hz CSV files:
1. Download from: https://gdr.openei.org/submissions/1183
2. Pass the CSV path: `--forge-csv path/to/forge_16B.csv`
3. The loader auto-maps column names and augments the synthetic training set.

---

## 6 Hazard Classes (Model 3)

| Class | Description | Key Indicators |
|-------|-------------|----------------|
| `Lost_Circulation` | Mud losses into formation | ΔFlow < -5%, ΔPit < -0.5 m³/min |
| `Stuck_Pipe` | Differential or mechanical sticking | ΔTorque > +8 kN·m, WOB spike |
| `Overpressure_Zone` | Pore pressure > ECD margin | d-exponent reversal, flow increase |
| `Gas_Kick` | Gas influx into wellbore | Total gas spike, flow gain, ΔPit+ |
| `Torque_Spike` | Erratic torque beyond T&D roadmap | ΔTorque deviation > 2σ |
| `Cementing_Issue` | Losses/low TOC during cementing | Flow anomalies at low-ROP |
