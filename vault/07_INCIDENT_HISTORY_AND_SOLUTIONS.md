---
title: Incident History & Technical Solutions
last_updated: 2026-10-26
tags:
  - incidents
  - debugging
  - changelog
---

# 📜 Incident History & Permanent Solutions

This log records every technical incident, its underlying root cause, and the exact code or operational fix applied.

---

### Incident 1: Cloudflare Idle Tunnel Expiration
- **Symptom**: `Could not resolve host headline-alive-subsidiaries-merge.trycloudflare.com`. Cloud Netlify site was showing AI `OFFLINE`.
- **Root Cause**: Cloudflare quick tunnels expire after several hours of inactivity and issue a new random URL upon reconnect.
- **Solution**:
  - Moved tunnel supervisor to bare-metal Linux server (`192.168.0.66`) under PM2 (`LearnOverseasTunnel` & `LearnOverseasGateway`).
  - Added a 2-minute keep-alive cron job on Linux that sends periodic pings so Cloudflare never drops the quick tunnel connection.
  - Active tunnel: `https://entrepreneurs-psp-navigate-maternity.trycloudflare.com`.

---

### Incident 2: Netlify 502 Bad Gateway on Country Comparisons (Canada & UK)
- **Symptom**: `Analysis failed for Canada (502)` and `Analysis failed for United Kingdom (502)` when running multi-country comparisons in the cloud.
- **Root Cause**:
  1. Default Netlify synchronous function execution ceiling is **10 seconds**.
  2. Each country comparison was triggering a 3–5 second live Google/DuckDuckGo scrape despite having 165 Canadian and 310 UK colleges in `students.db`.
  3. The cloud AI timeout was set to 24s. Ollama on CPU took ~8–12 seconds, causing Netlify to kill the function at 10.0 seconds before completion.
- **Solution**:
  - In [`src/app/api/analyze/route.ts`](file:///Users/dishik/Downloads/Internship%20/Ai%20Course%20Analyser/src/app/api/analyze/route.ts), added a scraping guard: if `eligibleColleges.length >= 5`, skip slow external scraping.
  - Capped cloud AI timeout at `6000ms`. If Ollama takes longer, it cleanly aborts and activates the instant structured counselor engine report in ~6.2 seconds.
  - Added a 1.2-second automatic retry in [`src/app/page.tsx`](file:///Users/dishik/Downloads/Internship%20/Ai%20Course%20Analyser/src/app/page.tsx) to catch transient cold starts.

---

### Incident 3: CGPA Reading 10/10 Instead of 5.98
- **Symptom**: A student with a 5.98 CGPA was being read by the analyzer as `10/10 CGPA` in both cloud and on-premise environments.
- **Root Cause**:
  1. Indian resumes typically list secondary school (Class 10) near the top with scores like `10/10` or `10 CGPA`.
  2. The regex pattern contained `score` as a keyword: `(?:cgpa|gpa|pointer|score)`.
  3. It matched the first occurrence in the document (`Class 10 score: 10/10`) and stopped searching before reaching the Bachelor's degree line (`5.98 CGPA`).
  4. `.toFixed(1)` was rounding decimals instead of preserving two digits.
- **Solution**:
  - Purged `score` from CGPA regex.
  - Added classification logic to detect high school lines (`10th`, `class 10`, `matric`, `ssc`) and de-prioritize them in favor of university degree lines (`bachelor`, `b.tech`, `degree`).
  - Prioritized counselor manual input box as the absolute source of truth.
  - Preserved `.toFixed(2)` precision so `5.98` stays `5.98`.

---

### Incident 4: Cloud Database Student & Side-by-Side Comparison Persistence
- **Symptom**: On Cloud Netlify, analyzed students disappeared after refresh and side-by-side country comparison data was not being saved or restored.
- **Root Cause**:
  1. Netlify Lambda serverless uses Node 20 where native C++ bindings for `better-sqlite3` fail, falling back to `createPureJsDatabase`.
  2. `createPureJsDatabase` had stub implementations for `INSERT INTO students` (discarded profile parameters) and had zero implementation for `UPDATE students SET comparisonData = ?`.
  3. `all()` returned students with undefined JSON fields, causing `/api/students` to throw `SyntaxError` on `JSON.parse`, yielding HTTP 500.
  4. In `src/app/page.tsx`, if the user ran country comparisons without first clicking "Analyze", `primaryStudentId` was `null` across all iterations, creating isolated records rather than appending to comparisonData.
- **Solution**:
  - Implemented full parameter capture in `createPureJsDatabase` for `INSERT` (10 and 11 parameters) and `UPDATE` statements for both students and `comparisonData`.
  - Added safe parsing in `src/app/api/students/route.ts` to prevent any 500 crashes.
  - Linked `activeStudentId` across comparison iterations in `src/app/page.tsx` so all comparison countries attach to the student record and persist immediately in database, state, and `localStorage`.
  - Cast student IDs to `Number(...)` to prevent BigInt JSON serialization crashes.

  - Packaged the fixed project into `Ai-Course-Analyser-Windows.zip`.
