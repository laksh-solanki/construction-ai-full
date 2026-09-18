@echo off
title BuildSight AI - Frontend Dev Server
echo ========================================================
echo   BuildSight AI - Starting Vite + React Frontend
echo ========================================================
echo.

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo [node_modules not found. Running npm install...]
    call npm install
)

echo.
echo Starting frontend dev server on http://localhost:5173 ...
echo.
call npm run dev

pause
