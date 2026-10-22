@echo off
cd /d "%~dp0"
title Learn Overseas - Start Server (Port 3004)

echo ========================================================
echo   LEARN OVERSEAS - AI COURSE ANALYSER
echo ========================================================
echo.

echo Checking Node.js...
node -v
if %errorlevel% neq 0 goto NoNode

echo Freeing port 3004...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do taskkill /f /pid %%a >nul 2>&1

if not exist "node_modules" goto InstallDeps
goto StartApp

:InstallDeps
echo Installing dependencies for Windows...
call npm install --prefer-offline
if %errorlevel% neq 0 call npm install --legacy-peer-deps

:StartApp
echo Starting server on port 3004...
echo.
echo App will be live at:
echo http://localhost:3004
echo.
call npx next dev --webpack -p 3004 -H 0.0.0.0
pause
exit /b 0

:NoNode
echo.
echo [ERROR] Node.js is not installed!
echo Please install Node.js from https://nodejs.org
echo.
pause
exit /b 1
