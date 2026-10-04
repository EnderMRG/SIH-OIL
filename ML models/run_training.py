"""
NWIS eRTMAC — Standalone Training Script (no package install needed)
====================================================================
Run this directly from the project root:
    python run_training.py

This script adds the nwis/ directory to sys.path and runs the full pipeline.
"""

import sys
import os
from pathlib import Path

# ── Fix: loky/joblib crashes on some Windows environments when counting CPUs
# via a subprocess. Setting these env vars before importing sklearn/xgb/lgbm
# tells loky to skip the subprocess and use 1 core directly.
os.environ.setdefault("LOKY_MAX_CPU_COUNT", "1")
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

# Add the nwis subdirectory to path so imports work without pip install
PROJECT_ROOT = Path(__file__).parent
sys.path.insert(0, str(PROJECT_ROOT / "nwis"))
sys.path.insert(0, str(PROJECT_ROOT))

os.chdir(PROJECT_ROOT / "nwis")

# Import and run training
from train_all import main
main()
