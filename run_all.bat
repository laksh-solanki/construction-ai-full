@echo off
title BuildSight AI - Complete Launcher
echo ========================================================
echo   BuildSight AI - Dual Service Launcher
echo ========================================================
echo.
echo Launching Backend (FastAPI) and Frontend (Vite React)...
echo.

start "BuildSight Backend API" cmd /c "%~dp0run_backend.bat"
timeout /t 3 /nobreak >nul
start "BuildSight Frontend Web" cmd /c "%~dp0run_frontend.bat"
timeout /t 2 /nobreak >nul

echo ========================================================
echo  Services launched in dedicated console windows:
echo   - Backend API (FastAPI):  http://0.0.0.0:8000
echo   - Interactive API Docs:   http://localhost:8000/docs
echo   - Web Application:        http://localhost:5173
echo   - Mobile App (Expo Go):   Double-click run_mobile.bat
echo ========================================================
echo You can minimize this launcher window.
pause
