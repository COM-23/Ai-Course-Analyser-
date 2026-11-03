@echo off
setlocal enabledelayedexpansion
title Learn Overseas AI Server - Production (Windows)

echo ========================================================
echo   LEARN OVERSEAS - WINDOWS SERVER PRODUCTION RUNNER
echo ========================================================
echo.

:: 1. Check Node.js installation
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in your system PATH!
    echo Please install Node.js LTS (v18, v20 or v22) from https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [OK] Detected Node.js: %NODE_VERSION%

:: 2. Check dependencies
echo.
echo [1/3] Verifying npm dependencies...
if not exist "node_modules" (
    echo Installing dependencies (this may take a couple minutes on first run)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

:: 3. Build Next.js application if not built
echo.
echo [2/3] Checking production build...
if not exist ".next" (
    echo Building Next.js application for production...
    call npm run build
    if %errorlevel% neq 0 (
        echo [ERROR] Build failed! Check the errors above.
        pause
        exit /b 1
    )
) else (
    echo Production build found (.next).
)

:: 4. Start production server
echo.
echo [3/3] Starting Learn Overseas Server on Port 3000...
echo ========================================================
echo   Local Web Access:   http://localhost:3000
echo   LAN Network Access: http://0.0.0.0:3000
echo   To stop the server: Press Ctrl + C
echo ========================================================
echo.

set PORT=3000
set NODE_ENV=production
call npm run start

pause
