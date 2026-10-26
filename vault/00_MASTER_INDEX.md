---
title: Learn Overseas — Master Brain & Project Knowledge Vault
last_updated: 2026-10-26
system: AI Course Analyser (Triple-Tier Architecture)
tags:
  - index
  - architecture
  - learn-overseas
---

# 🧠 Learn Overseas — AI Course Analyser Master Brain

Welcome to the central Obsidian-compatible brain vault for the **AI Course Analyser** project. This repository contains the complete operational memory, architecture maps, deployment protocols, and troubleshooting histories.

---

## 🗺️ Quick Navigation (Wikilinks)

- [[01_ARCHITECTURE|01. Complete Triple-Tier Architecture]] — Detailed explanation of Windows Server, Linux AI Server, and Netlify Cloud.
- [[02_WINDOWS_SERVER_DEPLOYMENT|02. Windows Server & Zip Deployment]] — How the on-premise Windows server runs on Port 3004, batch scripts, and `Ai-Course-Analyser-Windows.zip`.
- [[03_LINUX_AI_SERVER|03. Linux AI Server (Ollama + Tunnel)]] — Linux server (`loai` / 192.168.0.66), Ollama llama3.1, PM2, security gateway, and Cloudflare tunnel.
- [[04_NETLIFY_CLOUD|04. Netlify Cloud Deployment]] — Production website, GitHub CI/CD, serverless execution limits, and tunnel failover.
- [[05_CGPA_AND_RESUME_PARSER|05. Academic Parser & CGPA Rules]] — How PDF and text profiles are parsed, high school vs degree isolation, and exact decimal preservation.
- [[06_DATABASE_AND_UNIVERSITIES|06. Database & Universities]] — `students.db` structure, tables, seeded data (165 Canada, 310 UK), and dynamic overrides.
- [[07_INCIDENT_HISTORY_AND_SOLUTIONS|07. Incident History & Fixes]] — Chronological log of every issue encountered and solved (502 timeouts, tunnel drops, CGPA false-positives).

---

## ⚡ Core Rules & Non-Negotiables

1. **Windows is the On-Premises Host**: The user runs the Next.js UI and business logic on a local Windows machine on port `3004`. Updates to Windows are delivered via [[02_WINDOWS_SERVER_DEPLOYMENT|Ai-Course-Analyser-Windows.zip]].
2. **Never Touch Linux unnecessarily**: The Linux machine (`192.168.0.66`) only hosts the Ollama model and tunnel gateway. Do NOT disrupt its PM2 processes unless re-establishing a tunnel.
3. **No Direct Coupling Between Local & Netlify**: Local on-premise servers do NOT pull data or sync state from Netlify. They run standalone using local SQLite (`students.db`).
4. **Preserve Exact Comments and Logic**: Maintain existing business rules for university rankings, currency conversions, and counselor notes.
