# NWIS eRTMAC — Training Report

**Generated:** 2026-10-01T02:56:42.676751  
**Training time:** 2218s  

---

## Model 1 — Offset Analogue Selector
> Deterministic scoring engine — no ML training required.
> Weights calibrated via Ridge regression on engineer selections.

| Metric | Value |
|--------|-------|
| CV R² | see model1_weights.json |

---

## Model 2 — Dynamic Formation-Interval Matcher (DFIM)

| Metric | Value | Target |
|--------|-------|--------|
| Mean Alignment Score | 0.7864 | ≥ 0.90 |
| N Evaluated | 996 | — |
| Target Met | False | ✓ |

---

## Model 3 — Subsurface Hazard Classifier

| Hazard Class | PR-AUC | F1 | ROC-AUC | Target |
|---|---|---|---|---|
| Lost_Circulation | 0.962 | 0.9187 | 0.9588 | ✓ |
| Stuck_Pipe | 0.9031 | 0.8711 | 0.9511 | ✓ |
| Overpressure_Zone | 0.4761 | 0.5598 | 0.9655 | ✗ |
| Gas_Kick | 0.9998 | 0.9987 | 0.9331 | ✓ |
| Torque_Spike | 0.8472 | 0.8134 | 0.9059 | ✗ |
| Cementing_Issue | 0.8716 | 0.826 | 0.944 | ✗ |

---

## Model 4 — Telemetry Anomaly Detector

| Metric | Value | Target |
|--------|-------|--------|
| CV Mean F1 | N/A | — |
| CV Mean Recall | N/A | ≥ 0.90 |
| Holdout F1 | N/A | — |
| Holdout Recall | N/A | ≥ 0.90 |
| False Alarm Rate | N/A | ≤ 0.05 |
| Target Met | False | ✓ |

---

## Anti-Leakage & Anti-Overfitting Summary

| Measure | Implementation |
|---------|----------------|
| Cross-Validation | `GroupKFold(n=5)` grouped by `wellbore_id` |
| SMOTE | Applied **only** inside each training fold, never on validation |
| Primary metric | `PR-AUC` (not ROC-AUC) — designed for imbalanced classes |
| Early stopping | 30 rounds (XGBoost), 30 rounds (LightGBM) |
| DTW constraint | Sakoe-Chiba ±50m + formation-top anchors |
| Isolation Forest | Trained on normal samples only; threshold calibrated separately |
| Depth leakage | Never use random K-Fold on depth-adjacent series data |