@echo off
cd /d "%~dp0"
title Reset and Rebuild Learn Overseas (Windows)

echo ========================================================
echo   RESET PM2 + REBUILD NEXT.JS (WINDOWS)
echo ========================================================
echo.

echo [1/4] Stopping and clearing PM2 processes...
call pm2 stop all >nul 2>&1
call pm2 delete all >nul 2>&1
call pm2 flush >nul 2>&1
call pm2 cleardump >nul 2>&1
call pm2 save --force >nul 2>&1

echo [2/4] Freeing port 3004...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /f /pid %%a >nul 2>&1

echo [3/4] Removing stale .next build cache...
if exist ".next" rmdir /s /q ".next"

echo [4/4] Compiling fresh build with latest logic...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check errors above.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   FRESH BUILD SUCCESSFUL! STARTING SERVER ON PORT 3004...
echo ========================================================
echo   App URL: http://localhost:3004
echo ========================================================
echo.

call npx next start -p 3004 -H 0.0.0.0
pause
