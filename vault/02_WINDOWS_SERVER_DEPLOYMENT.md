---
title: Windows Server Deployment Protocol
last_updated: 2026-10-26
tags:
  - windows
  - deployment
  - batch
---

# 🪟 Windows Server & Local Deployment

The on-premises user interface and application logic run on a dedicated **Windows machine** in the office.

---

## 📦 The Deployment Package: `Ai-Course-Analyser-Windows.zip`

Whenever updates to the frontend UI, PDF parsing logic, or student matching algorithm are made, the project is packaged into:

**Location**:
- `../Ai-Course-Analyser-Windows.zip` (in parent directory)
- `./Ai-Course-Analyser-Windows.zip` (in root directory)

### Contents of the Package:
- `src/` — All React frontend components and API routes (including the fixed CGPA extractor).
- `public/` — Logos, icons, branding assets.
- `students.db` — Full SQLite database with 165 Canadian, 310 UK, and global universities.
- `reset-and-restart-windows.bat` — Automates stopping old processes, clearing port 3004, rebuilding, and starting the server.
- `run.bat` — One-click launcher for rapid dev startup on port 3004.
- `package.json` & `package-lock.json` — Exact pinned npm dependencies.
- **Excluded**: `node_modules`, `.next`, `.git`, temporary raw CSVs (keeps file size under 15MB).

---

## 🚀 How to Deploy on the Windows Machine

1. Copy `Ai-Course-Analyser-Windows.zip` to the Windows machine.
2. Extract the zip file into your project directory (e.g. `C:\LearnOverseas\ai-course-analyser`).
3. Double-click **`reset-and-restart-windows.bat`** (or **`run.bat`**).
4. The batch file automatically:
   - Frees port `3004`.
   - Checks Node.js dependencies.
   - Launches the app at: **`http://localhost:3004`** (and accessible across office LAN at `http://<WINDOWS_IP>:3004`).

---

## 🛠️ Windows Batch Scripts Overview

| File | Purpose |
|---|---|
| `reset-and-restart-windows.bat` | Cleans PM2, kills any stuck port 3004 process, deletes stale `.next`, builds production bundle, and starts on port 3004. |
| `run.bat` | Lightweight startup script: checks Node, frees port 3004, runs `npx next dev --webpack -p 3004 -H 0.0.0.0`. |
| `start-windows.bat` | Production script for background PM2 deployment. |
| `stop-server.bat` | Emergency kill script that terminates all processes occupying port 3004. |
