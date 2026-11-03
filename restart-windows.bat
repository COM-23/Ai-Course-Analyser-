@echo off
setlocal enabledelayedexpansion
title Restart Learn Overseas Server - Windows

echo ========================================================
echo   RESTARTING LEARN OVERSEAS SERVER (WINDOWS)
echo ========================================================
echo.

echo [1/3] Terminating any process currently listening on Port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    echo Terminating PID: %%a...
    taskkill /F /PID %%a >nul 2>&1
)

echo Port 3000 is clean.

echo.
echo [2/3] Rebuilding Next.js application for latest changes...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed! Check the errors above.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Learn Overseas Server on Port 3000...
echo ========================================================
echo   Local Web Access:   http://localhost:3000
echo   To stop the server: Press Ctrl + C
echo ========================================================
echo.

set PORT=3000
set NODE_ENV=production
call npm run start

pause
