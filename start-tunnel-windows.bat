@echo off
cd /d "%~dp0"
title Learn Overseas - AI Tunnel & Gateway Supervisor

echo ========================================================
echo   LEARN OVERSEAS - AUTONOMOUS AI TUNNEL SUPERVISOR
echo   Keeps Ollama, Gateway, and Cloud Tunnel Active 24/7
echo ========================================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

node tunnel-service.js
pause
