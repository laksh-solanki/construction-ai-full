# BuildSight AI — Complete Installation & User Guide

> **AI-Powered Daily Progress Monitoring System for Civil Construction**  
> *Smart India Hackathon (SIH 2026) Prototype — ByteBloom*

---

## Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Prerequisites & System Requirements](#2-prerequisites--system-requirements)
3. [Step-by-Step Installation](#3-step-by-step-installation)
   - [Step 3.1: Clone or Extract the Repository](#step-31-clone-or-extract-the-repository)
   - [Step 3.2: Configure the Backend (FastAPI + Python)](#step-32-configure-the-backend-fastapi--python)
   - [Step 3.3: Verify or Place AI Model Weights (YOLOv8)](#step-33-verify-or-place-ai-model-weights-yolov8)
   - [Step 3.4: Configure the Frontend (React + Vite)](#step-34-configure-the-frontend-react--vite)
4. [How to Run the Application](#4-how-to-run-the-application)
   - [Option A: 1-Click Launchers (Windows)](#option-a-1-click-launchers-windows-recommended)
   - [Option B: Manual Terminal Launch (Windows PowerShell / CMD)](#option-b-manual-terminal-launch-windows-powershell--cmd)
   - [Option C: Manual Terminal Launch (macOS / Linux)](#option-c-manual-terminal-launch-macos--linux)
5. [How to Verify & Test the Setup](#5-how-to-verify--test-the-setup)
   - [Run Automated Backend Test Suite (16/16 Endpoints)](#run-automated-backend-test-suite)
   - [Test Frontend Build](#test-frontend-production-build)
6. [Step-by-Step Workflow & UI Walkthrough](#6-step-by-step-workflow--ui-walkthrough)
   - [Demo Login & Roles](#demo-login--roles)
   - [Core Workflow: Capture -> Analyse -> Compare -> Report](#core-workflow-capture---analyse---compare---report)
   - [Downloading DPR PDF Reports](#downloading-dpr-pdf-reports)
   - [Exploring Key Modules](#exploring-key-modules)
7. [Database Setup: SQLite vs PostgreSQL](#7-database-setup-sqlite-vs-postgresql)
8. [Troubleshooting & FAQs](#8-troubleshooting--faqs)

---

## 1. Project Overview & Architecture

BuildSight AI is an end-to-end civil construction progress monitoring platform. It takes on-site photographic evidence, performs computer vision inference using YOLOv8 (detecting workers, machinery, safety equipment, foundation/column structures), calculates planned-vs-actual variance against the project BOQ schedule, and automatically exports branded Daily Progress Reports (DPR) in PDF format.

```
┌────────────────────────────────────────────────────────┐
│                   Vite + React (Port 5173)             │
│  - Dashboard & S-Curve Analytics                       │
│  - AI Progress & Photo Evidence Capture (GPS + Weather)│
│  - DPR Archive & Download                              │
└───────────────────────────▲────────────────────────────┘
                            │ REST / JSON (HTTP)
┌───────────────────────────▼────────────────────────────┐
│                  FastAPI Backend (Port 8000)           │
│  - Auth & Role Management                              │
│  - Project, BOQ & Activity Tracking                    │
│  - Alert & Schedule Delay Triggers                     │
│  - ReportLab PDF Generation                            │
└─────────────┬───────────────────────────┬──────────────┘
              │                           │
              ▼                           ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│ YOLOv8 Computer Vision    │ │ SQLite / PostgreSQL DB   │
│ - ai-model/weights/best.pt│ │ - buildsight.db          │
│ - Safety & Object Classes │ │ - Auto-seeded on start   │
└───────────────────────────┘ └──────────────────────────┘
```

### Directory Structure
```text
construction-ai-full/
├── ai-model/
│   └── weights/
│       ├── best.pt              # Trained YOLOv8 model weights
│       └── data.yaml            # Dataset class labels
├── backend/
│   ├── .env.example             # Template for backend settings
│   ├── .env                     # Active environment configuration
│   ├── buildsight.db            # Default SQLite database
│   ├── requirements.txt         # Python dependencies
│   ├── test_all_endpoints.py    # Automated test suite (16 tests)
│   ├── generated_reports/       # Output folder for generated DPR PDFs
│   ├── uploads/                 # Uploaded site evidence photos
│   └── app/
│       ├── main.py              # FastAPI endpoints & database seed
│       ├── ai.py                # YOLOv8 inference & fallback engine
│       ├── db.py                # Database connection & settings
│       ├── models.py            # SQLAlchemy database models
│       ├── report.py            # ReportLab PDF generator
│       └── schemas.py           # Pydantic schemas
├── frontend/
│   ├── package.json             # React/Vite dependencies
│   ├── vite.config.js           # Vite dev server configuration
│   └── src/
│       ├── App.jsx              # Main dashboard and UI views
│       ├── api.js               # Frontend API client
│       ├── styles.css           # Premium UI styling
│       └── main.jsx             # React DOM root
├── run_all.bat                  # 1-Click launcher for both services
├── run_backend.bat              # 1-Click launcher for FastAPI backend
├── run_frontend.bat             # 1-Click launcher for React frontend
└── README.md                    # Quick overview
```

---

## 2. Prerequisites & System Requirements

Before running the project, verify that the following tools are installed on your computer:

| Requirement | Recommended Version | Check Command | Download / Install |
| :--- | :--- | :--- | :--- |
| **Python** | 3.10, 3.11, 3.12, 3.13 or 3.14 | `python --version` | [python.org](https://www.python.org/downloads/) *(Check "Add Python to PATH" during installation)* |
| **Node.js & npm** | Node v18+ (v20 or v24 recommended) | `node -v` & `npm -v` | [nodejs.org](https://nodejs.org/) |
| **Git** | Any recent version | `git --version` | [git-scm.com](https://git-scm.com/) |
| **Hardware** | 4GB RAM minimum (8GB+ recommended) | — | CPU inference works out of the box; NVIDIA GPU with CUDA is optional |

> [!IMPORTANT]
> **Windows PowerShell Users**: If you encounter an error saying `running scripts is disabled on this system` when activating Python virtual environments, run this command in PowerShell once as Administrator:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

---

## 3. Step-by-Step Installation

### Step 3.1: Clone or Extract the Repository

Open a terminal or command prompt and navigate to your project directory:
```bash
cd path/to/construction-ai-full
```

---

### Step 3.2: Configure the Backend (FastAPI + Python)

1. Open your terminal and enter the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   - **Windows PowerShell**:
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt (cmd)**:
     ```cmd
     .\.venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source .venv/bin/activate
     ```
   *(You will see `(.venv)` appear in your prompt.)*

4. Upgrade `pip` and install all required packages:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

   **Installed dependencies:**
   - `fastapi` & `uvicorn[standard]` — High-performance asynchronous web API
   - `sqlalchemy` — Object Relational Mapper (ORM)
   - `pydantic-settings` & `python-multipart` — Settings and multipart form/upload handling
   - `psycopg[binary]` — PostgreSQL adapter
   - `reportlab` & `Pillow` — Dynamic PDF compilation and image processing
   - `ultralytics` — YOLOv8 computer vision model inference

5. Setup the environment file (`.env`):
   - On Windows:
     ```cmd
     copy .env.example .env
     ```
   - On Linux/macOS:
     ```bash
     cp .env.example .env
     ```
   
   The default `.env` contents are pre-configured for zero-setup local execution:
   ```ini
   DATABASE_URL=sqlite:///./buildsight.db
   CORS_ORIGINS=http://localhost:5173
   YOLO_MODEL_PATH=../ai-model/weights/best.pt
   SECRET_KEY=change-this-for-production
   ```

---

### Step 3.3: Verify or Place AI Model Weights (YOLOv8)

The project includes an AI computer vision model trained to recognize construction site safety gear, workers, and structures.

1. Verify that the model weight file exists at:
   ```
   ai-model/weights/best.pt
   ```
2. **Fallback Feature**: If `best.pt` is ever moved or absent, the backend automatically enters **`DEMO_FALLBACK`** mode. This ensures all API endpoints, DPR generation, and frontend dashboards remain 100% operational even without a weights file!

---

### Step 3.4: Configure the Frontend (React + Vite)

1. Open a new terminal window or tab and navigate into the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install Node.js packages:
   ```bash
   npm install
   ```

3. *(Optional)* If you ever run your backend on a custom port or remote server, create `frontend/.env` and set:
   ```ini
   VITE_API_URL=http://localhost:8000
   ```
   *(By default, it automatically targets `http://localhost:8000`.)*

---

### Step 3.5: Run Mobile App (Expo Go on your Phone)

The mobile app is built with pure **React Native + Expo Go** (zero Android Studio or emulator required!).

1. Install **Expo Go** from Google Play Store or Apple App Store on your mobile phone.
2. Connect your phone to the same Wi-Fi network as your computer.
3. Start the mobile app development server:
   ```bash
   cd mobile
   npx expo start -c
   ```
   *(Or simply double-click `run_mobile.bat`)*
4. Scan the QR code displayed in your terminal using the **Expo Go** app (on Android) or Camera app (on iOS).
5. The app will open directly on your phone and automatically detect your PC's IP to communicate with the FastAPI backend!

---

## 4. How to Run the Application

### Option A: 1-Click Launchers (Windows Recommended)

We have provided convenient Windows batch scripts in the project root:

- **Launch Both (Backend + Frontend)**: Double-click **`run_all.bat`**  
- **Launch Mobile App (Expo Go)**: Double-click **`run_mobile.bat`** (displays QR code to scan with your phone)
- **Launch Backend Only**: Double-click **`run_backend.bat`**
- **Launch Frontend Only**: Double-click **`run_frontend.bat`**

---

### Option B: Manual Terminal Launch (Windows PowerShell / CMD)

#### Terminal 1 — Start the Backend API
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> The API will be live at: **`http://localhost:8000`** (and accessible on your Wi-Fi network)  
> Interactive Swagger Documentation: **`http://localhost:8000/docs`**  
> Health Check: **`http://localhost:8000/api/health`**

#### Terminal 2 — Start the Mobile App (Expo Go)
```powershell
cd mobile
npx expo start -c
```
> Scan the displayed QR code with the **Expo Go** mobile app on your phone!

#### Terminal 3 — Start the Frontend Web App
```powershell
cd frontend
npm run dev
```
> The web application will be live at: **`http://localhost:5173`**

---

### Option C: Manual Terminal Launch (macOS / Linux)

#### Terminal 1 — Backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 — Mobile App (Expo Go)
```bash
cd mobile
npx expo start -c
```

#### Terminal 3 — Frontend Web
```bash
cd frontend
npm run dev
```

---

## 5. How to Verify & Test the Setup

### Run Automated Backend Test Suite
The project includes a comprehensive test suite verifying all 16 API endpoints (authentication, project creation, activities, image analysis, PDF generation, static files, and forecasts).

To run the tests:
```powershell
cd backend
.\.venv\Scripts\python.exe test_all_endpoints.py
```
**Expected Output:**
```text
[PASS] Health Endpoint (GET /api/health)
[PASS] Auth Login Existing User (POST /api/auth/login)
[PASS] Auth Login New User Creation (POST /api/auth/login)
[PASS] Get Users (GET /api/users)
[PASS] Get Projects List (GET /api/projects)
[PASS] Create Project (POST /api/projects)
[PASS] Get Project Details & 404 (GET /api/projects/{id})
[PASS] Create Activity & Validation (POST /api/activities)
[PASS] Dashboard Metrics (GET /api/dashboard)
[PASS] Alerts & Acknowledgment (GET & POST /api/alerts)
[PASS] AI Image Analysis & Report Creation (POST /api/analyze)
[PASS] Reports List (GET /api/reports)
[PASS] Report Detail & 404 (GET /api/reports/{id})
[PASS] DPR PDF Generation & Download (GET /api/reports/{id}/pdf)
[PASS] Completion Forecast (GET /api/forecast)
[PASS] Static Image Serving (GET /uploads/...)

==================================================
RESULTS: 16 PASSED, 0 FAILED
==================================================
```

### Test Frontend Production Build
To ensure there are no compilation or bundle errors:
```bash
cd frontend
npm run build
```
You should see: `✓ built in ~3s` with generated assets in `dist/`.

---

## 6. Step-by-Step Workflow & UI Walkthrough

Once both servers are running, open your web browser to:
👉 **`http://localhost:5173`**

### Demo Login & Roles
The prototype features role-based access. In demo mode, any email/password is accepted. You can choose from four pre-configured roles:
- **`PROJECT_MANAGER`** (e.g. `manager@buildsight.ai`): Full overview, forecast, and reports.
- **`SITE_ENGINEER`** (e.g. `engineer@buildsight.ai`): Field capture, geotagging, upload evidence.
- **`ADMIN`** (e.g. `admin@buildsight.ai`): System settings and project management.
- **`VIEWER`**: Read-only oversight.

Click **"Enter BuildSight AI"**.

---

### Core Workflow: Capture -> Analyse -> Compare -> Report

1. **Dashboard Overview**:
   - View headline metrics: Overall Progress, Total Activities, Open Alerts, Total DPRs.
   - Planned vs. Actual progress bars for each workfront (Excavation, Foundation, Columns, Formwork, Slab).
   - Click the blue **`Create AI DPR`** button or navigate to **`AI Progress`** in the sidebar.

2. **Step 1: Capture & Context**:
   - **Activity Workfront**: Select the target activity (e.g., *Foundation* or *Excavation*).
   - **Site Weather**: Choose today's weather condition (*Sunny*, *Cloudy*, *Rainy*, *Wind/Heat*).
   - **Geotagging & Coordinates**: Click **"Auto-Detect Site GPS"** to record your live browser latitude/longitude coordinates (with a green "Tagged" badge).
   - **Site Diary Notes**: Add notes (e.g., *"Grid B4 foundation rebars inspected with sub-contractor"*).
   - **Evidence Photo**: Drag and drop a construction photo or click **"Browse"** (or **"Camera"** on mobile/tablet) to upload evidence. An instant thumbnail preview with file size is displayed.

3. **Step 2: AI Inspection & Verification**:
   - Click **"Analyse With AI"**.
   - The backend runs YOLOv8 on the image:
     - Detects workers, machinery, safety gear, and structural components.
     - Displays tags with individual detection confidence percentages directly on the image.
     - Calculates an estimated **Visible Progress %**, **Confidence %**, and **Risk Level** (Low, Medium, High).
     - Compares AI progress against the planned baseline to compute **Variance %**.
     - Generates an automated AI observation summary.

4. **Step 3: Download Official DPR PDF**:
   - Click **"Download DPR PDF"**.
   - The system dynamically generates an A4 PDF complete with:
     - Company header & timestamp
     - Weather & GPS coordinates
     - Planned vs. Actual progress and variance
     - AI detections list
     - Embedded photographic evidence
     - Compliance disclaimer

---

### Exploring Key Modules

- **Daily Reports**: Archive of all previously generated DPRs with direct links to view and re-download PDFs.
- **Progress Analytics**: Visual S-curve ready view comparing actual vs planned percentage by activity, with AI completion date forecast and delay estimations.
- **BOQ & Activities**: Table showing planned quantities, completed units (m³, m²), and track status.
- **Alerts & Risk**: Real-time alerts generated when progress falls behind schedule (with one-click "Acknowledge" capability).
- **Evidence Archive**: Visual grid gallery of all site inspection photos geotagged with GPS coordinates, dates, and weather badges.
- **Team**: List of team members, roles, and emails.
- **Settings**: System configuration, AI model status, and signed-in account details.

---

## 7. Database Setup: SQLite vs PostgreSQL

### Default: SQLite (Zero Configuration)
By default, the backend uses SQLite (`buildsight.db`). It requires no installation, is fully portable, and automatically creates all tables and initial sample data on the first startup.

### Switching to PostgreSQL (Optional for Production)
If you wish to run on PostgreSQL:
1. Ensure PostgreSQL is installed and running (or run `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres`).
2. Open `backend/.env` and update the `DATABASE_URL`:
   ```ini
   DATABASE_URL=postgresql+psycopg://postgres:password@localhost:5432/buildsight
   ```
3. Restart the backend server. The app automatically detects PostgreSQL, creates the `buildsight` database if it doesn't already exist, and initializes all tables and seed records.

---

## 8. Troubleshooting & FAQs

### Q1: `running scripts is disabled on this system` in PowerShell
**Fix**: Open PowerShell as Administrator or in your current terminal session run:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then run the activation command again:
```powershell
.\.venv\Scripts\Activate.ps1
```

### Q2: Port 8000 or Port 5173 is already in use
**Fix**: If another service is occupying the port:
- To run FastAPI backend on a different port (e.g. 8001):
  ```powershell
  uvicorn app.main:app --reload --port 8001
  ```
  Then in `frontend/src/api.js`, or via `frontend/.env`, set `VITE_API_URL=http://localhost:8001`.
- To run Vite on a different port:
  ```powershell
  npm run dev -- --port 5174
  ```

### Q3: How do I reset or re-seed the database?
**Fix**: Simply stop the backend, delete `backend/buildsight.db`, and restart the backend. FastAPI's startup event will recreate fresh tables and seed data automatically.

### Q4: GPS Location button says "Geolocation is not supported" or timed out
**Fix**: Browsers only permit GPS access on `localhost` or secure `https://` origins. When prompted by your browser, make sure to click **"Allow"** to grant location access. If testing indoors on desktop without GPS hardware, the browser uses Wi-Fi IP geolocation.

### Q5: Can I run this on a mobile device or tablet on the same Wi-Fi?
**Fix**: Yes!
1. Start the backend with `--host 0.0.0.0`:
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
2. Start frontend with `--host`:
   ```powershell
   npm run dev -- --host
   ```
3. In `backend/.env`, add your machine's local LAN IP to `CORS_ORIGINS` (e.g. `http://192.168.1.15:5173`).
4. On your phone's browser, open `http://<your-lan-ip>:5173`. You can now use your phone's native camera and GPS directly on site!

---

*BuildSight AI — Engineering Tomorrow's Infrastructure with Precision Computer Vision.*
