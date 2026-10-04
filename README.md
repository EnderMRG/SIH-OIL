# eRTMAC-NWIS Platform

**National Well Intelligence System (NWIS)** built for **Oil India Limited (OIL)**.
An advanced, real-time subsurface operations platform engineered to integrate high-frequency rig telemetry with predictive machine learning models to prevent NPT (Non-Productive Time) and surface critical drilling hazards before they occur.

## 🚀 Features

- **Real-Time Telemetry Cockpit:** Live 1Hz stream ingestion of drilling parameters (SPP, ECD, Flow, RPM, WOB) with automatic out-of-spec flagging and rig-state correlation.
- **Predictive Hazard Advisory (Model 3 Lookahead):** Predictive ML models running on historical offset data to forecast gas kicks, thief zones, and overpressure gradients up to 100m ahead of the bit.
- **Document Intelligence Hub:** Automated OCR pipeline to ingest Daily Drilling Reports (DDR) and Well Completion Reports (WCR). Extracts structured data (depths, formations, mud losses) seamlessly into the database via a human-in-the-loop review queue.
- **Dynamic Morning Report & Handover Generator:** Automates the creation of 8-chapter PDF handover documents complete with geosteering logs, mud lab checks, NPT ledgers, and live architectural rendering.
- **Geospatial & 3D Analytics:** Interactive tracking of rigs, active wellbores, and structural offset models to track field-wide drilling operations.

## 🏗️ Architecture

The platform follows a decoupled client-server architecture:

- **Frontend (`/frontend`):** A high-performance, strictly typed React application built on **Next.js 14**. It uses **Tailwind CSS** for an architectural, editorial UI design (warm parchment, carbon ink, and mustard accents) and **Zustand** for global cross-module telemetry state synchronization.
- **Backend (`/backend`):** A high-throughput, async Python API built with **FastAPI**. It manages the WebSocket telemetry streaming, simulated real-time data generation, and acts as the inference API gateway for the ML advisory models.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js v18+
- Python 3.10+

### 1. Backend Setup (FastAPI)
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv .venv

# Activate the virtual environment:
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
python -m uvicorn app.main:app --reload --port 8000
```

### 2. ML Models Setup (FastAPI)
In a new terminal, start the ML Inference server on port 8001:
```bash
cd "ML models/nwis"
python -m venv .venv

# Activate the virtual environment:
# Windows:
.\.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r ../requirements.txt

# Run the API server
python serve.py
```

### 3. Frontend Setup (Next.js)
In a new terminal window, navigate to the frontend directory:
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The platform will be accessible at `http://localhost:3000`.

## 📂 Repository Structure

- `/frontend` - Next.js React application (UI, State, Components)
- `/backend` - FastAPI Python server (API, Data Emulation, ML Gateway)
- `/ML models` - Python inference API with trained XGBoost, Isolation Forest & DTW models
- `/Architecture.md` - Core system architecture and dataflow specifications
- `/ML_Model_Spec.md` - Specifications for the predictive Lookahead ML models
- `/Product_Specification.md` - Complete UI/UX and product feature specifications

## 🔒 License
This software is developed exclusively for **Oil India Limited (OIL)** and the Smart India Hackathon (SIH). Unauthorized distribution is prohibited.
