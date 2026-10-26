@echo off
cd /d "%~dp0\.."
echo ========================================================
echo   LEARN OVERSEAS - CONFIGURE AUTOSTART ON WINDOWS BOOT
echo ========================================================
echo.

set SCRIPT_PATH=%CD%\start-tunnel-windows.bat
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set VBS_PATH=%STARTUP_DIR%\LearnOverseasAITunnel.vbs

echo [Step 1] Creating background launcher in Windows Startup folder...
(
echo Set WshShell = CreateObject^("WScript.Shell"^)
echo WshShell.Run chr^(34^) ^& "%SCRIPT_PATH%" ^& chr^(34^), 0
echo Set WshShell = Nothing
) > "%VBS_PATH%"

if exist "%VBS_PATH%" (
    echo [OK] Created autostart entry:
    echo      %VBS_PATH%
    echo.
    echo ========================================================
    echo   🎉 WINDOWS AUTOSTART ACTIVATED!
    echo   Whenever this computer reboots or turns on,
    echo   the AI Security Gateway and Tunnel will start
    echo   silently in the background!
    echo ========================================================
) else (
    echo [ERROR] Could not write to Startup folder.
)

pause
