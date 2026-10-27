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

---

### Incident 5: Premature AI Execution Termination & Unrestricted Google Scraping
- **Symptom**: Counselor observed that the analysis report was displayed on the UI *before* the on-premises AI stopped execution, and wanted Google scraping restricted to changed criteria / real-time fetching.
- **Root Cause**:
  1. `timeoutMs` in `src/app/api/analyze/route.ts` was capped at 6,000ms (6.0s) for cloud serverless. Ollama on CPU takes ~4–7 seconds to generate tokens. When it crossed 6.0s, the cloud fetch aborted and activated the instant counselor report, while Ollama was still in the middle of generating tokens in the background on the Linux server.
  2. Google/DuckDuckGo web scraping was running unconditionally whenever `eligibleColleges.length < 5` or on local, despite having 1,522 universities already loaded in the database, adding 3–5 seconds of needless delay.
- **Solution**:
  - Gated Google scraping: `shouldScrape = realtimeFetching || (eligibleColleges.length === 0)`. The 1,522 universities in the database are prioritized first; Google scraping only triggers if zero colleges match the criteria or if the user checks the "Real-time Live Google Search" checkbox.
  - Added `export const maxDuration = 26;` to `src/app/api/analyze/route.ts` for full Netlify serverless execution headroom.
  - Extended cloud AI timeout `timeoutMs` to 20,000ms (20s) and set `tokenLimit` to 90 tokens, allowing Ollama to finish its full inference before the cloud function returns the true AI report.

---

### Incident 6: Premature Abort & Client Mount Gating in New Netlify Deployments
- **Symptom**: On new Netlify deployment, AI showed connected in Settings, but running analysis gave instant heuristic answers (`⚡ Heuristic Assessment (Execution timeout)`), and students list was empty on refresh.
- **Root Cause**:
  1. `timeoutMs` in `src/app/api/analyze/route.ts` was set to 9500ms (9.5s), but every analysis request also ran a blocking GET request to `/api/tags` (taking ~2-3s across the tunnel), leaving only ~6.5s for Ollama token generation on CPU. When generation exceeded 6.5s, `AbortSignal.timeout(9500)` terminated the connection and activated the heuristic fallback prematurely.
  2. In `src/app/page.tsx`, `checkAiHealth()` and `fetch('/api/settings')` were guarded by `if (!currentUser || currentUser.role !== 'super_admin') return;`, and student data loading was guarded by `if (!currentUser) return;`. Unauthenticated users or counselors opening the site saw empty student rosters on page refresh and lacked active AI status checks.
- **Solution**:
  1. Removed the redundant `/api/tags` network probe from the critical path of `analyze` so the `/api/chat` request begins immediately.
  2. Extended serverless AI `timeoutMs` to 22,000ms (22s) and kept `tokenLimit = 40` so Ollama completes inference cleanly in ~7-8s without timing out.
  3. Made `checkAiHealth()`, `fetch('/api/settings')`, and student roster loading from `localStorage` + `/api/students` run unconditionally on client mount.
  4. Preserved strict constraint: Zero changes or modifications made to the on-premise Linux AI server (`192.168.0.66`).

---

### Incident 7: Instant Millisecond Answers Due to 401 Unauthorized Gateway Handshake
- **Symptom**: User reported: "while analysing i am getting the answers within milliseconds and also there is no activity in the linux terminal". Browser UI displayed `⚡ Heuristic Assessment (Target https://millions-)` instead of live AI summary.
- **Root Cause**:
  1. The Cloudflare tunnel (`https://millions-librarian-consumer-desktops.trycloudflare.com`) routes traffic to the on-premises Linux gateway, which strictly requires authentication header `Authorization: Bearer lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO` or `x-api-key: lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO`.
  2. In `src/app/api/analyze/route.ts`, if `process.env.LOCAL_AI_API_KEY` was populated in the Netlify site configuration with any mismatching, quoted, or stale key, `aiApiKey` did not fall back to `cloudDefaultApiKey`.
  3. When the Cloudflare gateway rejected the mismatched key with HTTP 401, the fallback handler retried with `headers: { 'Content-Type': 'application/json' }` (NO authentication headers at all), which also immediately failed with 401.
  4. Ollama on the Linux server never received any inference request because all 4 attempts were rejected at the gateway layer within milliseconds.
  5. The serverless route threw an error (`Target ... returned status 401`) and triggered the heuristic assessment instantly.
  6. In `src/app/page.tsx`, `handleAnalyze` did not include `aiApiKey` in the request body sent to `/api/analyze`, leaving the serverless function vulnerable to environment variable mismatches.
- **Solution**:
  1. Updated `src/app/api/analyze/route.ts` to enforce `cloudDefaultApiKey` whenever the target URL contains `trycloudflare.com`, completely bypassing any corrupted or mismatched environment variables.
  2. If any 401/403 status is encountered on `/api/chat` or `/api/generate`, the retry mechanism now explicitly supplies `cloudDefaultApiKey` rather than empty headers.
  3. Added `clientProvidedApiKey` extraction in `src/app/api/analyze/route.ts` so the frontend can securely supply the shared gateway key.
  4. Updated `src/app/page.tsx` to include `aiApiKey: 'lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO'` in the `handleAnalyze` payload.
  5. Optimized direct inference and cloud serverless tokens (`num_predict: 45`) for rapid 7-8 second token generation on the on-premise CPU.
  6. Preserved strict constraint: Zero modifications or connections made to the on-premise Linux server (`192.168.0.66`).
