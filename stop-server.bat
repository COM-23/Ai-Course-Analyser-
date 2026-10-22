@echo off
cd /d "%~dp0"
title Stop Learn Overseas Server
echo Stopping Learn Overseas server on port 3004...

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 3004 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }" >nul 2>&1

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3004') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [OK] Server stopped successfully.
timeout /t 3
