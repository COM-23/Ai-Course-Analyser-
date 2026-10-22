@echo off
cd /d "%~dp0"
title Learn Overseas - On-Premises AI Security Gateway

echo ========================================================
echo   LEARN OVERSEAS - ON-PREMISES AI SECURITY GATEWAY
echo   Protects Ollama with API Key Verification (Port 11435)
echo ========================================================
echo.

node server-gateway.js

pause
