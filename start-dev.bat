@echo off
cd /d "%~dp0"
title Learn Overseas - Fast Dev Mode (Windows)
call npx next dev --webpack -p 3004 -H 0.0.0.0
pause
