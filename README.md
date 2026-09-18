# BuildSight AI — Complete SIH 2026 MVP

**AI Powered Daily Progress Monitoring System for Civil Construction** — ByteBloom

BuildSight AI follows the official SIH workflow: **Capture → Analyse → Compare → Report**. It provides a fully functional, production-ready prototype with live site evidence geotagging, weather context, YOLOv8 computer vision detection, schedule variance comparison against BOQ baselines, real-time alert triggers, completion forecasts, team permissions, and branded PDF Daily Progress Report (DPR) generation.

> 📖 **Looking for full, detailed instructions?** Check out the comprehensive [SETUP_GUIDE.md](SETUP_GUIDE.md) for architecture deep-dive, mobile field testing, database options, and troubleshooting!

---

## Tech Stack

- **Mobile**: React Native 0.76 + Expo 52 (Expo Go managed workflow)
- **Frontend**: React 18 + Vite 6 + Lucide Icons + Recharts
- **Backend**: FastAPI (Python 3.10+) + SQLAlchemy ORM + Pydantic v2
- **Database**: SQLite (default zero-config) or PostgreSQL
- **Computer Vision**: Ultralytics YOLOv8 (`ai-model/weights/best.pt`) with automatic demo fallback
- **Report Engine**: ReportLab PDF generator with image embedding

---

## Quick Start (Windows — 1-Click)

We provide pre-configured batch launchers in the root folder:

1. **Launch Everything**: Double-click **`run_all.bat`** (opens Backend and Web/Mobile in separate windows).
2. **Launch Mobile App (Expo Go)**: Double-click **`run_mobile.bat`** (generates QR code; open Expo Go on your mobile phone and scan!).
3. **Launch Backend Only**: Double-click **`run_backend.bat`**
4. **Launch Web Frontend Only**: Double-click **`run_frontend.bat`**

---

## Manual Installation & Run Guide

### 1. Prerequisites
- **Python 3.10+**: [python.org](https://www.python.org/) *(Ensure "Add to PATH" is checked)*
- **Node.js 18+ & npm**: [nodejs.org](https://nodejs.org/)

*(Windows PowerShell users: If script activation is blocked, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in your terminal)*

### 2. Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1       # On Command Prompt: .venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env             # Linux/macOS: cp .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- **API URL**: `http://localhost:8000`
- **Swagger Docs**: `http://localhost:8000/docs`
- **Health Check**: `http://localhost:8000/api/health`

### 3. Frontend Setup
Open a second terminal window:
```powershell
cd frontend
npm install
npm run dev
```
- **Web App**: `http://localhost:5173`

---

## Automated Verification

You can verify the entire backend (16 endpoints including login, project creation, image upload, YOLO detection, PDF compilation, and forecasts) using the built-in test runner:
```powershell
cd backend
.\.venv\Scripts\python.exe test_all_endpoints.py
```
*Expected: 16 PASSED, 0 FAILED*

---

## Prototype Login & Credentials

In prototype mode, any email/password is accepted with your desired role:
- `PROJECT_MANAGER` (e.g. `manager@buildsight.ai` / `demo`)
- `SITE_ENGINEER` (e.g. `engineer@buildsight.ai` / `demo`)
- `ADMIN` (e.g. `admin@buildsight.ai` / `demo`)
- `VIEWER` (e.g. `viewer@buildsight.ai` / `demo`)

---

## YOLO Computer Vision Model

Place your trained YOLOv8 model weights at:
```text
ai-model/weights/best.pt
```
- When `best.pt` is present: The system performs real-time YOLO object detection for construction workers, machinery, safety gear, and structural progress.
- When `best.pt` is missing: The system automatically engages **`DEMO_FALLBACK`** mode, allowing full evaluation without missing dependencies.

---

## PostgreSQL (Optional)

To switch from SQLite to PostgreSQL, simply change `DATABASE_URL` in `backend/.env`:
```ini
DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/buildsight
```
The backend will automatically create the database and tables on startup.

---

## Full Documentation

For exhaustive guidance including field-testing on mobile devices, GPS geotagging notes, and troubleshooting, refer to **[SETUP_GUIDE.md](SETUP_GUIDE.md)**.
