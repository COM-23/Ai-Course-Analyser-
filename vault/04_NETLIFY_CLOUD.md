---
title: Netlify Cloud Deployment Architecture
last_updated: 2026-10-26
tags:
  - netlify
  - cloud
  - ci-cd
---

# ☁️ Netlify Cloud Deployment

The public cloud version allows remote students and counselors to access the platform from anywhere.

---

## 🔗 Deployment Pipeline

- **Repository**: `https://github.com/COM-23/Ai-Course-Analyser-.git`
- **Tracked Branch**: `main`
- **Build Trigger**: Automatic on every `git push origin main`
- **Build Command**: `npm run build` (`next build --webpack`)
- **Node Version**: `20`

---

## ⚙️ Environment Variables (Configured in `netlify.toml` and Netlify Dashboard)

| Variable | Current Live Value | Purpose |
|---|---|---|
| `LOCAL_AI_ENDPOINT` | `https://millions-librarian-consumer-desktops.trycloudflare.com/api/generate` | Outbound tunnel to on-premise Linux gateway |
| `LOCAL_AI_API_KEY` | `lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO` | Matches on-premise SHA-256 gateway authentication |
| `LOCAL_AI_MODEL` | `llama3.1:latest` | Model target on Linux Ollama |

---

## ⏱️ Critical Serverless Constraints

1. **Execution Ceiling**: Netlify serverless functions enforce a strict **10-second timeout**. If a function does not return within 10 seconds, Netlify terminates the Lambda with `502 Bad Gateway`.
2. **Cloud AI Timeout (6.0s)**:
   - In [`src/app/api/analyze/route.ts`](file:///Users/dishik/Downloads/Internship%20/Ai%20Course%20Analyser/src/app/api/analyze/route.ts), `timeoutMs` in cloud environments is capped at **6000ms**.
   - If Ollama responds within 6s: Response is utilized.
   - If Ollama takes longer: Aborts cleanly before Netlify's 10s ceiling and instantly serves the 3-part structured counselor engine report (zero latency).
3. **No LAN IP Invocations**:
   - `192.168.0.66` and `127.0.0.1` are unroutable in AWS Lambda. Candidate lists in cloud environments strictly filter them out to prevent TCP SYN wait delays.
