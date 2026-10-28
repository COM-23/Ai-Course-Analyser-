@echo off
cd /d "%~dp0"
title Learn Overseas - One-Click Reset, Sync & Start (Windows)

echo ========================================================
echo   LEARN OVERSEAS - ALL-IN-ONE WINDOWS LAUNCHER
echo   Automated Sync + Cache Purge + Production Build + Run
echo ========================================================
echo.

:: 1. SYNC LATEST CODE FROM GITHUB
echo [1/5] Checking and pulling latest updates from GitHub...
where git >nul 2>&1
if %errorlevel% equ 0 (
    echo Pulling latest fixes from origin/main...
    call git pull origin main --no-rebase
    if %errorlevel% neq 0 (
        echo [NOTICE] Resolving local file state and retrying sync...
        call git stash >nul 2>&1
        call git pull origin main
    )
) else (
    echo [INFO] Git command not found in PATH, continuing with local files.
)
echo.

:: 2. STOP STALE PROCESSES & FREE PORT 3004
echo [2/5] Cleaning up existing processes and freeing port 3004...
call pm2 stop all >nul 2>&1
call pm2 delete all >nul 2>&1
call pm2 flush >nul 2>&1
call pm2 cleardump >nul 2>&1
call pm2 save --force >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo Port 3004 is clear.
echo.

:: 3. CLEAR STALE BUILD CACHE & VERIFY DEPENDENCIES
echo [3/5] Purging stale .next build cache...
if exist ".next" rmdir /s /q ".next"

if not exist "node_modules" (
    echo [DEPS] Installing dependencies...
    call npm install --prefer-offline
    if %errorlevel% neq 0 call npm install --legacy-peer-deps
)

if not exist "node_modules\caniuse-lite\data\features\hidden.js" (
    echo [REPAIR] Refreshing browserslist database...
    call npx update-browserslist-db@latest -y >nul 2>&1
    call npm install caniuse-lite@latest --no-audit >nul 2>&1
)
echo Cache and dependencies ready.
echo.

:: 4. COMPILE FRESH PRODUCTION BUILD
echo [4/5] Compiling fresh production build with latest logic...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo   [ERROR] Build failed! Review error messages above.
    echo ========================================================
    pause
    exit /b 1
)
echo Build successful!
echo.

:: 5. START SERVER
echo ========================================================
echo   SERVER STARTING ON PORT 3004
echo ========================================================
echo   Local URL:   http://localhost:3004
echo   Network URL: http://0.0.0.0:3004
echo ========================================================
echo.

call npx next start -p 3004 -H 0.0.0.0
pause
