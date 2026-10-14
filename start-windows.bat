@echo off
cd /d "%~dp0"
title Learn Overseas - AI Course Analyser (Windows)

echo ========================================================
echo   LEARN OVERSEAS - AI COURSE ANALYSER
echo   UI + Database + Matching Engine (Windows OptiPlex)
echo ========================================================
echo Current Directory: %CD%
echo.

:: Free port 3004 if already held by any old process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /f /pid %%a >nul 2>&1

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT found in system PATH!
    echo.
    echo Please install Node.js from https://nodejs.org
    echo If you just installed it, please restart your computer or command prompt.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected:
node -v
echo.

if not exist "package.json" (
    echo [ERROR] Cannot find package.json in %CD%!
    echo Please make sure all files were extracted properly.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [Step 1/3] Installing dependencies (first run only)...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
) else (
    echo [Step 1/3] Dependencies already installed.
)

if not exist ".next" (
    echo [Step 2/3] Compiling optimized build (one-time setup)...
    call npm run build
)

echo.
echo [Step 2.5] Checking Windows Firewall for Port 3004...
netsh advfirewall firewall show rule name="NextJS Server 3004" >nul 2>&1
if %errorlevel% neq 0 (
    echo [Firewall] Allowing inbound traffic on Port 3004...
    netsh advfirewall firewall add rule name="NextJS Server 3004" dir=in action=allow protocol=TCP localport=3004 >nul 2>&1
    if %errorlevel% neq 0 (
        echo [NOTICE] If other computers cannot connect, open CMD as Administrator and run:
        echo   netsh advfirewall firewall add rule name="NextJS Server 3004" dir=in action=allow protocol=TCP localport=3004
    ) else (
        echo [Firewall] Port 3004 successfully opened!
    )
) else (
    echo [Firewall] Port 3004 is already open.
)

echo.
echo ========================================================
echo   DETECTING LOCAL NETWORK IP FOR COLLEAGUES:
echo ========================================================
ipconfig | findstr /i "IPv4"
echo ========================================================
echo.
echo [Step 3/3] Starting web server on port 3004...
echo ========================================================
echo   Web App is LIVE!
echo   On this Windows PC:   http://localhost:3004
echo   For your colleagues:  http://[Your-IPv4-Above]:3004
echo ========================================================
echo.

call npx next start -p 3004 -H 0.0.0.0
if %errorlevel% neq 0 (
    echo [Notice] Falling back to Webpack dev mode...
    call npx next dev --webpack -p 3004 -H 0.0.0.0
)

pause
