@echo off
title BuildSight AI - Mobile App (Expo Go)
echo ========================================================
echo   BuildSight AI - Mobile App Launcher (Expo Go)
echo ========================================================
echo.
echo   [!] Pure Mobile App Mode (No Android Studio / No Emulator)
echo   [!] Scan the QR code with the "Expo Go" app on your phone!
echo.

rem Check Backend API
echo [1/2] Checking Backend API (FastAPI)...
curl -s -m 2 http://localhost:8000/api/health >nul
if %errorlevel% equ 0 (
    echo   - Backend API is online on port 8000!
) else (
    echo   - Starting Backend API in background window...
    start "BuildSight Backend API" cmd /c "%~dp0run_backend.bat"
    timeout /t 3 /nobreak >nul
)

echo.
echo [2/2] Starting Expo Development Server...
echo.
echo --------------------------------------------------------
echo   INSTRUCTIONS FOR RUNNING ON YOUR MOBILE PHONE:
echo   1. Install "Expo Go" from Google Play Store or App Store.
echo   2. Ensure your phone and PC are on the same Wi-Fi.
echo   3. Open Expo Go and scan the QR code that appears below.
echo --------------------------------------------------------
echo.

cd /d "%~dp0mobile"
set EXPO_PUBLIC_USE_RN_FETCH=1
npx expo start -c

pause
