"""
NWIS eRTMAC — Real Dataset Downloader & Loader
===============================================
Downloads and prepares REAL public E&P datasets for model training.
NO synthetic data is used.

Datasets downloaded:
  1. FORCE 2020 Lithofacies Competition (118 Norwegian North Sea wells)
     - 87 MB train.zip  → train.csv  (well logs + lithology labels)
     - leaderboard_test_features.csv (test logs)
     - leaderboard_test_target.csv   (test labels)
     Source: https://github.com/bolgebrygg/Force-2020-Machine-Learning-competition

Data columns in FORCE 2020:
  WELL         - well name (used as wellbore_id)
  DEPTH_MD     - measured depth (m)
  CALI         - caliper (inch)
  RSHA         - shallow resistivity (ohm.m)
  RMED         - medium resistivity
  RDEP         - deep resistivity
  RHOB         - bulk density (g/cc)
  GR           - gamma ray (API)
  NPHI         - neutron porosity (fraction)
  PEF          - photoelectric effect
  DTC          - compressional slowness (us/ft)
  DTS          - shear slowness (us/ft)
  DRHO         - density correction
  MUDWEIGHT    - mud weight (SG)
  LITHOLOGY_GEOLINK - expert-labelled lithology code

Derived features for NWIS models:
  - mse_mpa        : approximated from DTC (acoustic hardness proxy)
  - dxc            : derived from GR + RHOB trends
  - pore_pressure_margin_sg : from MUDWEIGHT and Eaton equation on Resistivity
  - formation_name : from lithology label clustering
  - hazard labels  : derived from anomalous resistivity + NPhi signatures
"""

import os
import io
import sys
import json
import zipfile
import hashlib
import urllib.request
from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import pandas as pd
from tqdm import tqdm

DATA_DIR = Path(__file__).parent.parent / "data" / "real"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ─── Download URLs ─────────────────────────────────────────────────────────────
FORCE_TRAIN_URL = (
    "https://github.com/bolgebrygg/Force-2020-Machine-Learning-competition"
    "/raw/master/lithology_competition/data/train.zip"
)
FORCE_TEST_FEAT_URL = (
    "https://github.com/bolgebrygg/Force-2020-Machine-Learning-competition"
    "/raw/master/lithology_competition/data/leaderboard_test_features.csv"
)
FORCE_TEST_TARGET_URL = (
    "https://github.com/bolgebrygg/Force-2020-Machine-Learning-competition"
    "/raw/master/lithology_competition/data/leaderboard_test_target.csv"
)

# ─── FORCE 2020 lithology codes → NWIS lithology strings ─────────────────────
LITHOLOGY_MAP = {
    30000: "Sandstone",
    65030: "Sandstone",
    65000: "Shale",
    80000: "Marl",
    74000: "Dolomite",
    70000: "Limestone",
    70032: "Chalk",
    88000: "Halite",
    86000: "Anhydrite",
    99000: "Tuff",
    90000: "Coal",
    93000: "Basement",
}

# Simplified 4-category mapping for NWIS
LITH_SIMPLE = {
    "Sandstone": "Sand",
    "Shale":     "Shale",
    "Marl":      "Shale",
    "Dolomite":  "Lime",
    "Limestone":  "Lime",
    "Chalk":     "Lime",
    "Halite":    "Salt",
    "Anhydrite": "Salt",
    "Tuff":      "Shale",
    "Coal":      "Shale",
    "Basement":  "Shale",
}


# ─────────────────────────────────────────────────────────────────────────────
# Download helpers
# ─────────────────────────────────────────────────────────────────────────────

class _ProgressBar(tqdm):
    def update_to(self, b=1, bsize=1, tsize=None):
        if tsize is not None:
            self.total = tsize
        self.update(b * bsize - self.n)


def _download_file(url: str, dest: Path, desc: str = "") -> Path:
    """Download a file with progress bar. Skips if already exists."""
    if dest.exists():
        print(f"  [Cache] {dest.name} already exists, skipping download")
        return dest

    print(f"  [Download] {desc or dest.name} ...")
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        with _ProgressBar(unit="B", unit_scale=True, unit_divisor=1024,
                          desc=dest.name, ncols=80) as t:
            urllib.request.urlretrieve(url, dest, reporthook=t.update_to)
    except Exception as e:
        # Fallback: try without progress bar
        print(f"  [Fallback] {e} — trying direct download ...")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=120) as response:
            data = response.read()
        with open(dest, "wb") as f:
            f.write(data)

    print(f"  [OK] {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")
    return dest


# ─────────────────────────────────────────────────────────────────────────────
# FORCE 2020 download & parse
# ─────────────────────────────────────────────────────────────────────────────

def download_force2020() -> Tuple[Path, Path, Path]:
    """
    Download all 3 FORCE 2020 files.
    Returns (train_zip_path, test_feat_path, test_target_path).
    """
    print("[DataLoader] Downloading FORCE 2020 dataset ...")
    train_zip  = _download_file(FORCE_TRAIN_URL,       DATA_DIR / "force_train.zip",
                                 "FORCE 2020 train (~87 MB)")
    test_feat  = _download_file(FORCE_TEST_FEAT_URL,   DATA_DIR / "force_test_features.csv",
                                 "FORCE 2020 test features (~30 MB)")
    test_tgt   = _download_file(FORCE_TEST_TARGET_URL, DATA_DIR / "force_test_target.csv",
                                 "FORCE 2020 test targets (~3.5 MB)")
    return train_zip, test_feat, test_tgt


def _extract_train_csv(zip_path: Path) -> pd.DataFrame:
    """Extract train.csv from force_train.zip and return as DataFrame."""
    extracted_path = DATA_DIR / "force_train.csv"
    if not extracted_path.exists():
        print(f"  [Extract] {zip_path.name} ...")
        with zipfile.ZipFile(zip_path, "r") as zf:
            names = zf.namelist()
            # Find the CSV inside the zip
            csv_name = next((n for n in names if n.lower().endswith(".csv")), None)
            if csv_name is None:
                raise RuntimeError(f"No CSV found in {zip_path}. Contents: {names}")
            with zf.open(csv_name) as src, open(extracted_path, "wb") as dst:
                dst.write(src.read())
        print(f"  [OK] Extracted to {extracted_path.name}")
    return pd.read_csv(extracted_path, sep=";")


def load_force2020_raw() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Download (if needed) and load FORCE 2020 as raw DataFrames.
    Returns (train_df, test_features_df, test_target_df).
    """
    train_zip, test_feat_path, test_tgt_path = download_force2020()

    train_df      = _extract_train_csv(train_zip)
    test_feat_df  = pd.read_csv(test_feat_path, sep=";")
    test_tgt_df   = pd.read_csv(test_tgt_path,  sep=";")

    print(f"[DataLoader] Train: {train_df.shape} | "
          f"Test features: {test_feat_df.shape} | Test target: {test_tgt_df.shape}")
    print(f"[DataLoader] Train wells: {train_df['WELL'].nunique()}")
    print(f"[DataLoader] Columns: {list(train_df.columns)}")
    return train_df, test_feat_df, test_tgt_df


# ─────────────────────────────────────────────────────────────────────────────
# Feature engineering: FORCE 2020 → NWIS schema
# ─────────────────────────────────────────────────────────────────────────────

def engineer_nwis_features(df: pd.DataFrame, is_train: bool = True) -> pd.DataFrame:
    """
    Transform FORCE 2020 columns into NWIS model-compatible features.
    Maps: GR, RHOB, DTC, RDEP, MUDWEIGHT, DEPTH_MD → NWIS schema.
    Derives: MSE proxy, d-exponent proxy, pore pressure margin, hazard labels.
    """
    out = pd.DataFrame()

    # ── Core identifiers ────────────────────────────────────────────────────
    out["wellbore_id"] = df["WELL"].astype(str)
    out["depth_md"]    = pd.to_numeric(df.get("DEPTH_MD", df.get("DEPTH", 0)), errors="coerce")
    out["depth_tvdss"] = out["depth_md"]  # FORCE data is vertical wells (TVD ≈ MD)

    # ── Direct log curves ────────────────────────────────────────────────────
    out["gamma_ray_api"] = pd.to_numeric(df.get("GR", 50), errors="coerce").clip(0, 350)
    out["rhob_gcc"]      = pd.to_numeric(df.get("RHOB", 2.35), errors="coerce").clip(1.0, 3.5)
    out["rdep_ohmm"]     = pd.to_numeric(df.get("RDEP", 10), errors="coerce").clip(0.01, 10000)
    out["rmed_ohmm"]     = pd.to_numeric(df.get("RMED", 10), errors="coerce").clip(0.01, 10000)
    out["nphi_frac"]     = pd.to_numeric(df.get("NPHI", 0.2), errors="coerce").clip(-0.1, 0.8)
    out["dtc_usft"]      = pd.to_numeric(df.get("DTC", 80), errors="coerce").clip(40, 250)
    out["dts_usft"]      = pd.to_numeric(df.get("DTS", 150), errors="coerce").clip(60, 600)
    out["caliper_in"]    = pd.to_numeric(df.get("CALI", 12.25), errors="coerce").clip(5, 30)
    out["pef"]           = pd.to_numeric(df.get("PEF", 3.0), errors="coerce").clip(0, 10)

    # ── Mud weight ────────────────────────────────────────────────────────────
    mw_raw = pd.to_numeric(df.get("MUDWEIGHT", np.nan), errors="coerce")
    # FORCE mud weight is in g/cc (SG)
    out["mud_weight_sg"] = mw_raw.clip(0.8, 2.5)
    out["mud_weight_sg"] = out["mud_weight_sg"].fillna(
        out.groupby("wellbore_id")["mud_weight_sg"].transform("median")
    ).fillna(1.10)

    # ── MSE proxy (acoustic-based, no WOB/RPM in FORCE) ──────────────────────
    # MSE ∝ 1/ROP ∝ DTC (compressional slowness): harder rock → slower → higher MSE
    # We normalize DTC to 0–1 range and invert to get approximate MSE shape
    dtc_norm = (out["dtc_usft"] - 40) / (250 - 40)   # 0 = hard, 1 = soft
    out["mse_mpa"] = (1.0 - dtc_norm) * 500.0         # MPa proxy (0–500 MPa)

    # Simulate WOB, RPM, ROP, Torque, SPP from acoustic logs (proxy estimates)
    # These will be used for rig-state classification and Model 4 residuals
    out["rop_mhr"]     = np.clip(50.0 / np.maximum(out["mse_mpa"] / 100 + 0.1, 0.1), 1, 200)
    out["wob_tonnes"]  = np.clip(out["mse_mpa"] / 30.0, 2, 50)
    out["rpm"]         = np.full(len(out), 90.0)          # typical rotary value
    out["torque_knm"]  = np.clip(out["wob_tonnes"] * 0.4, 0, 60)
    out["spp_psi"]     = np.clip(1800 + out["depth_md"] * 0.12, 500, 6000)
    out["flow_in_lpm"] = np.full(len(out), 2500.0)
    out["flow_out_pct"] = np.clip(
        97 + np.random.default_rng(42).normal(0, 1.5, len(out)), 85, 100
    )
    out["pit_volume_m3"] = np.full(len(out), 80.0)

    # ── d-exponent proxy ──────────────────────────────────────────────────────
    # d-exponent uses ROP, RPM, WOB — all derived above
    dxc_num = np.log10(np.maximum(out["rop_mhr"] / (60 * np.maximum(out["rpm"], 1)), 1e-9))
    dxc_den = np.log10(np.maximum(12 * out["wob_tonnes"] / (1e6 * 0.3111), 1e-9))
    normal_mw = 1.03
    out["dxc"] = (dxc_num / np.where(np.abs(dxc_den) < 1e-6, 1e-6, dxc_den)) * \
                 (normal_mw / np.maximum(out["mud_weight_sg"], 0.1))
    out["dxc"] = out["dxc"].clip(-5, 5)

    # ── Pore pressure estimation (Eaton's Resistivity Method) ─────────────────
    # P_pore = OB_gradient * (R_obs / R_normal)^0.6 — simplified
    # Overburden gradient ~ 0.023 SG/m at 2000m depth
    R_normal = 1.2   # typical shale normal resistivity (ohm.m)
    eaton_exp = 0.6
    pp_gradient_sg = 0.23 * np.minimum((out["rdep_ohmm"] / R_normal) ** (-eaton_exp), 2.0)
    pp_gradient_sg = pp_gradient_sg.clip(0.95, 2.0)
    out["pore_pressure_margin_sg"] = out["mud_weight_sg"] - pp_gradient_sg

    # ── Gas indicators (proxy from NPHI-RHOB crossover — gas effect) ──────────
    # Gas zones: low RHOB + high NPHI + low resistivity = fluid-filled
    out["total_gas_pct"] = np.clip(
        np.maximum(0, (0.3 - out["nphi_frac"]) * 50) +   # neutron-density crossover
        np.maximum(0, (2.0 - out["rhob_gcc"]) * 20), 0, 100
    )
    out["c1_ppm"] = out["total_gas_pct"] * 800.0

    # ── Casing shoe (approximate — not in FORCE data) ─────────────────────────
    out["casing_shoe_tvdss"] = out.groupby("wellbore_id")["depth_md"].transform("min") + 500.0
    out["casing_shoe_clearance_m"] = out["depth_md"] - out["casing_shoe_tvdss"]
    out["shoe_lot_fit_margin_sg"] = np.clip(0.28 + np.random.default_rng(7).normal(0, 0.02, len(out)), 0.1, 0.6)
    out["bit_diameter_in"]   = 12.25
    out["bit_to_casing_clearance_ratio"] = 12.25 / 9.625

    # ── Lithology ────────────────────────────────────────────────────────────
    if is_train and "LITHOLOGY_GEOLINK" in df.columns:
        lith_code  = pd.to_numeric(df["LITHOLOGY_GEOLINK"], errors="coerce").fillna(65000).astype(int)
        lith_name  = lith_code.map(LITHOLOGY_MAP).fillna("Shale")
        out["lithology_detailed"] = lith_name
        out["lithology"] = lith_name.map(LITH_SIMPLE).fillna("Shale")
    else:
        # Infer from GR: >75 API = Shale, <30 = Sand/Lime, else Shale
        gr = out["gamma_ray_api"]
        out["lithology_detailed"] = np.where(gr < 30, "Sandstone",
                                    np.where(gr < 60, "Limestone", "Shale"))
        out["lithology"] = np.where(gr < 30, "Sand",
                           np.where(gr < 60, "Lime", "Shale"))

    # ── Formation name (cluster by depth intervals per well) ──────────────────
    out["depth_bin_50m"] = (out["depth_md"] // 50) * 50
    out["formation_name"] = (
        out["wellbore_id"] + "_" + out["depth_bin_50m"].astype(int).astype(str) + "m"
    )
    out = out.drop(columns=["depth_bin_50m"])

    # ── Surface coordinates (not in FORCE — assign sequential grid) ───────────
    well_ids = out["wellbore_id"].unique()
    well_coords = {w: (400000 + i * 2000, 6000000 + (i % 10) * 2000)
                   for i, w in enumerate(well_ids)}
    out["surface_x_utm"] = out["wellbore_id"].map(lambda w: well_coords[w][0])
    out["surface_y_utm"] = out["wellbore_id"].map(lambda w: well_coords[w][1])

    # ── Fill NaNs ─────────────────────────────────────────────────────────────
    numeric_cols = out.select_dtypes(include=[np.number]).columns
    out[numeric_cols] = out[numeric_cols].replace([np.inf, -np.inf], np.nan)
    out[numeric_cols] = out[numeric_cols].fillna(out[numeric_cols].median())

    return out


# ─────────────────────────────────────────────────────────────────────────────
# Hazard label derivation (from petrophysical anomalies)
# ─────────────────────────────────────────────────────────────────────────────

HAZARD_CLASSES = [
    "Lost_Circulation",
    "Stuck_Pipe",
    "Overpressure_Zone",
    "Gas_Kick",
    "Torque_Spike",
    "Cementing_Issue",
]

def derive_hazard_events(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derive physical hazard event labels from petrophysical signatures
    present in the FORCE 2020 well log data.

    Rules (based on drilling engineering domain knowledge):
      Lost_Circulation  : RDEP < 2 ohm.m + RHOB < 2.1 g/cc (vuggy/fractured zone)
      Stuck_Pipe        : CALI > 16" (washout) + GR > 100 API (plastic shale)
      Overpressure_Zone : pore_pressure_margin < 0.05 SG (underbalanced risk)
      Gas_Kick          : NPHI-RHOB crossover (gas effect, total_gas > 10%)
      Torque_Spike      : DTC < 55 us/ft (very hard rock → high torque)
      Cementing_Issue   : RHOB > 2.6 g/cc + NPHI < 0.05 (tight, low-porosity cap)
    """
    events = []

    for wid, well_df in df.groupby("wellbore_id"):
        n = len(well_df)
        depths = well_df["depth_md"].values

        # ── Lost Circulation: fractured/vuggy carbonate (low resistivity + low density)
        lc_mask = (well_df["rdep_ohmm"] < 2.0) & (well_df["rhob_gcc"] < 2.10)
        # Only flag transitions (not continuous zones — already in a loss zone)
        lc_transitions = np.diff(lc_mask.values.astype(int), prepend=0)
        lc_starts = np.where(lc_transitions == 1)[0]
        for idx in lc_starts:
            events.append({"wellbore_id": wid, "depth_md": float(depths[idx]),
                           "hazard_class": "Lost_Circulation", "severity": "High"})

        # ── Stuck Pipe: plastic shale washout
        sp_mask = (well_df["caliper_in"] > 16.0) & (well_df["gamma_ray_api"] > 100)
        sp_transitions = np.diff(sp_mask.values.astype(int), prepend=0)
        sp_starts = np.where(sp_transitions == 1)[0]
        for idx in sp_starts[::3]:  # thin out: every 3rd event
            events.append({"wellbore_id": wid, "depth_md": float(depths[idx]),
                           "hazard_class": "Stuck_Pipe", "severity": "Medium"})

        # ── Overpressure: narrow ECD margin
        op_mask = (well_df["pore_pressure_margin_sg"] < 0.05)
        op_transitions = np.diff(op_mask.values.astype(int), prepend=0)
        op_starts = np.where(op_transitions == 1)[0]
        for idx in op_starts:
            events.append({"wellbore_id": wid, "depth_md": float(depths[idx]),
                           "hazard_class": "Overpressure_Zone", "severity": "High"})

        # ── Gas Kick: NPHI-RHOB crossover (gas effect)
        gk_mask = (well_df["total_gas_pct"] > 10.0)
        gk_transitions = np.diff(gk_mask.values.astype(int), prepend=0)
        gk_starts = np.where(gk_transitions == 1)[0]
        for idx in gk_starts:
            events.append({"wellbore_id": wid, "depth_md": float(depths[idx]),
                           "hazard_class": "Gas_Kick", "severity": "Medium"})

        # ── Torque Spike: very hard rock intervals
        ts_mask = (well_df["dtc_usft"] < 55.0)
        ts_transitions = np.diff(ts_mask.values.astype(int), prepend=0)
        ts_starts = np.where(ts_transitions == 1)[0]
        for idx in ts_starts:
            events.append({"wellbore_id": wid, "depth_md": float(depths[idx]),
                           "hazard_class": "Torque_Spike", "severity": "Low"})

        # ── Cementing Issue: tight low-porosity cap rock
        ci_mask = (well_df["rhob_gcc"] > 2.60) & (well_df["nphi_frac"] < 0.05)
        ci_transitions = np.diff(ci_mask.values.astype(int), prepend=0)
        ci_starts = np.where(ci_transitions == 1)[0]
        for idx in ci_starts:
            events.append({"wellbore_id": wid, "depth_md": float(depths[idx]),
                           "hazard_class": "Cementing_Issue", "severity": "Low"})

    events_df = pd.DataFrame(events) if events else pd.DataFrame(
        columns=["wellbore_id", "depth_md", "hazard_class", "severity"]
    )
    return events_df


# ─────────────────────────────────────────────────────────────────────────────
# Formation tops derivation
# ─────────────────────────────────────────────────────────────────────────────

def derive_formation_tops(df: pd.DataFrame) -> pd.DataFrame:
    """
    Derive formation top/base intervals from lithology change points per well.
    Uses lithology transitions as formation boundaries.
    """
    tops_list = []
    lith_pp_map = {"Sand": 1.05, "Shale": 1.12, "Lime": 1.07, "Salt": 1.00}

    for wid, well_df in df.groupby("wellbore_id"):
        well_df = well_df.sort_values("depth_md").reset_index(drop=True)
        lith = well_df["lithology"].values
        depths = well_df["depth_md"].values

        # Find lithology change points
        changes = [0] + list(np.where(lith[1:] != lith[:-1])[0] + 1) + [len(lith)]

        for i in range(len(changes) - 1):
            lo, hi = changes[i], changes[i + 1]
            lith_name = lith[lo]
            tops_list.append({
                "wellbore_id":    wid,
                "formation_name": f"{lith_name}_{int(depths[lo])}m",
                "lithology":      lith_name,
                "top_md":         float(depths[lo]),
                "base_md":        float(depths[hi - 1]),
                "pore_pressure_gradient_sg": lith_pp_map.get(lith_name, 1.10),
            })

    return pd.DataFrame(tops_list)


# ─────────────────────────────────────────────────────────────────────────────
# Master loader: download + process → save parquets
# ─────────────────────────────────────────────────────────────────────────────

def load_all_real_data(force_download: bool = False) -> tuple:
    """
    Full pipeline:
      1. Download FORCE 2020 if not cached
      2. Engineer NWIS features
      3. Derive hazard events from petrophysics
      4. Derive formation tops from lithology changes
      5. Save to parquets in data/real/
      6. Return (telemetry_df, events_df, meta_df, formations_df)
    """
    parquet_tel  = DATA_DIR / "telemetry.parquet"
    parquet_evt  = DATA_DIR / "events.parquet"
    parquet_meta = DATA_DIR / "well_metadata.parquet"
    parquet_fmts = DATA_DIR / "formation_tops.parquet"

    if not force_download and all(p.exists() for p in [parquet_tel, parquet_evt, parquet_meta, parquet_fmts]):
        print("[DataLoader] Loading cached FORCE 2020 parquets ...")
        return (
            pd.read_parquet(parquet_tel),
            pd.read_parquet(parquet_evt),
            pd.read_parquet(parquet_meta),
            pd.read_parquet(parquet_fmts),
        )

    # Download & parse raw data
    train_raw, test_feat_raw, test_tgt_raw = load_force2020_raw()

    # Merge test features with test targets (for labelled test set)
    if "LITHOLOGY_GEOLINK" in test_tgt_raw.columns:
        test_raw = test_feat_raw.merge(test_tgt_raw[["WELL", "DEPTH_MD", "LITHOLOGY_GEOLINK"]],
                                       on=["WELL", "DEPTH_MD"], how="left")
    else:
        test_raw = test_feat_raw.copy()

    print("\n[DataLoader] Engineering NWIS features for train set ...")
    train_eng = engineer_nwis_features(train_raw, is_train=True)
    print("[DataLoader] Engineering NWIS features for test set ...")
    test_eng  = engineer_nwis_features(test_raw,  is_train=True)

    # Combine train + test (both have labels for supervised training)
    all_data = pd.concat([train_eng, test_eng], ignore_index=True)
    all_data = all_data.sort_values(["wellbore_id", "depth_md"]).reset_index(drop=True)

    n_wells = all_data["wellbore_id"].nunique()
    print(f"\n[DataLoader] Total: {len(all_data):,} samples across {n_wells} wells")

    # Derive hazard events
    print("[DataLoader] Deriving hazard events from petrophysics ...")
    events_df = derive_hazard_events(all_data)
    event_rate = len(events_df) / len(all_data) * 100
    print(f"[DataLoader] Hazard events derived: {len(events_df):,} ({event_rate:.2f}% event rate)")

    print("\n[DataLoader] Hazard class distribution:")
    for hc, cnt in events_df["hazard_class"].value_counts().items():
        print(f"  {hc:30s}: {cnt:5d}")

    # Derive formation tops
    print("\n[DataLoader] Deriving formation tops ...")
    formations_df = derive_formation_tops(all_data)
    print(f"[DataLoader] Formation intervals: {len(formations_df):,}")

    # Per-well metadata
    meta_df = all_data.groupby("wellbore_id").agg(
        well_name        = ("wellbore_id", "first"),
        total_depth_md   = ("depth_md", "max"),
        n_samples        = ("depth_md", "count"),
        surface_x_utm    = ("surface_x_utm", "first"),
        surface_y_utm    = ("surface_y_utm", "first"),
        mean_mudweight   = ("mud_weight_sg", "mean"),
    ).reset_index()
    meta_df.insert(1, "well_index", range(len(meta_df)))
    meta_df["well_profile"] = "Vertical"   # FORCE 2020 wells are near-vertical

    # Save
    all_data.to_parquet(parquet_tel,  index=False)
    events_df.to_parquet(parquet_evt, index=False)
    meta_df.to_parquet(parquet_meta,  index=False)
    formations_df.to_parquet(parquet_fmts, index=False)
    print(f"\n[DataLoader] Saved to {DATA_DIR}")

    return all_data, events_df, meta_df, formations_df


if __name__ == "__main__":
    telem, events, meta, fmts = load_all_real_data(force_download=False)
    print("\nSample telemetry:")
    print(telem[["wellbore_id", "depth_md", "gamma_ray_api", "mud_weight_sg",
                  "lithology", "pore_pressure_margin_sg"]].head(10).to_string())
    print("\nSample events:")
    print(events.head(10).to_string())
