---
title: System Architecture & Component Mapping
last_updated: 2026-10-26
tags:
  - architecture
  - networking
  - infrastructure
---

# 🏗️ Triple-Tier System Architecture

The AI Course Analyser system consists of three distinct components designed to operate both on-premise and in the cloud:

```
+-----------------------------------------------------------------------------------+
|                                 1. CLOUD LAYER                                    |
|  Netlify Production Site (https://...netlify.app)                                  |
|  - Serverless Next.js App Router                                                  |
|  - Triggered automatically via push to GitHub (COM-23/Ai-Course-Analyser-)         |
+-----------------------------------------+-----------------------------------------+
                                          |
                        Cloudflare Tunnel (QUIC / HTTP2)
                                          |
                                          v
+-----------------------------------------+-----------------------------------------+
|                         2. ON-PREMISES AI ENGINE                                  |
|  Ubuntu Linux Server: admin_learn_overseas@loai (192.168.0.66)                    |
|  - Ollama on Port 11434 (llama3.1:latest)                                         |
|  - Security Gateway on Port 11435 (server-gateway.js with API Key authentication) |
|  - Cloudflare Tunnel (cloudflared forwards public traffic to port 11435)           |
|  - Supervised by PM2: LearnOverseasGateway & LearnOverseasTunnel                  |
+-----------------------------------------------------------------------------------+
                                          ^
                                          | Internal LAN HTTP (http://192.168.0.66:11434)
                                          |
+-----------------------------------------+-----------------------------------------+
|                        3. ON-PREMISES UI & APP SERVER                             |
|  Local Windows Machine                                                            |
|  - Next.js UI & API Routes running locally on Port 3004                           |
|  - Launched via run.bat or reset-and-restart-windows.bat                          |
|  - Local SQLite Database (students.db)                                            |
|  - Communicates directly over local LAN to Linux Ollama without needing internet  |
|  - Updated by unzipping [[02_WINDOWS_SERVER_DEPLOYMENT|Ai-Course-Analyser-Windows.zip]] |
+-----------------------------------------------------------------------------------+
```

---

## 🔌 Port & Protocol Inventory

| Machine | Service | Port | Protocol | Purpose |
|---|---|---|---|---|
| **Linux Server** (`192.168.0.66`) | Ollama LLM | `11434` | HTTP | Runs `llama3.1` model inferences |
| **Linux Server** (`192.168.0.66`) | Security Gateway | `11435` | HTTP | Validates `x-api-key`, rate limits, rewrites root paths |
| **Linux Server** (`192.168.0.66`) | Cloudflare Tunnel | Edge | QUIC | Secure outbound tunnel connecting Netlify Cloud to Port 11435 |
| **Windows Server** | Next.js Frontend & API | `3004` | HTTP | On-premises user interface for office counselors |
| **Netlify Cloud** | Serverless Next.js | `443` | HTTPS | Remote public website for students and counselors |

---

## 🔒 Security Credentials

- **Gateway Shared Secret (API Key)**: `lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO`
- **Hash Algorithm**: SHA-256 (stored in `api-keys.json`)
- **Headers accepted**: `x-api-key: <KEY>` or `Authorization: Bearer <KEY>`
- **Direct LAN Bypass**: Requests from the Windows machine directly to `http://192.168.0.66:11434` do not require gateway tokens.
