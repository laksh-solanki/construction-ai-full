@echo off
title BuildSight AI - Backend Server
echo ========================================================
echo   BuildSight AI - Starting FastAPI Backend Server
echo ========================================================
echo.

cd /d "%~dp0backend"

if not exist ".env" (
    echo [.env not found - creating from .env.example...]
    copy .env.example .env >nul
    echo [.env created successfully]
)

if exist ".venv\Scripts\python.exe" (
    echo [Activating Python virtual environment...]
    call .venv\Scripts\activate.bat
) else (
    echo [WARNING: .venv not found. Running with global python...]
)

echo.
echo Starting backend on http://0.0.0.0:8000 (accessible locally and on your Wi-Fi network)
echo Swagger API docs will be at http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
