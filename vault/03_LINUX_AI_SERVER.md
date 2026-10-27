---
title: Linux AI Server (Ollama + PM2 Gateway + Tunnel)
last_updated: 2026-10-26
tags:
  - linux
  - ollama
  - pm2
  - cloudflare
---

# 🐧 Linux AI Server (`loai` / 192.168.0.66)

The Linux server acts as the dedicated, heavy-lifting AI engine running on bare-metal hardware on the local network.

---

## 💻 Server Details

- **Hostname / User**: `admin_learn_overseas@loai`
- **LAN IP**: `192.168.0.66`
- **Installed LLM**: `llama3.1:latest` (8.0B parameters, GGUF Q4_K_M)
- **Directory**: `~/ai-course-analyser`

---

## ⚙️ PM2 Process Inventory

On the Linux server, two core processes are registered under PM2:

```bash
pm2 list
```

1. **`LearnOverseasGateway`**:
   - Executes `server-gateway.js` on port `11435`.
   - Protects Ollama from unauthenticated access.
   - Requires header: `x-api-key: lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO`.
   - Exposes public `/ping` and `/healthz` endpoints.
   - Forwards authenticated requests to internal Ollama port `11434`.

2. **`LearnOverseasTunnel`**:
   - Executes: `cloudflared tunnel --url http://127.0.0.1:11435`.
   - Establishes an outbound QUIC connection to Cloudflare Edge (`bom09` - Mumbai).
   - Generates the public `https://<subdomain>.trycloudflare.com` URL used by Netlify Cloud.

---

## 🔄 Useful Linux Commands

### Check Live Status:
```bash
pm2 status
```

### Inspect Tunnel Logs & Find Assigned URL:
```bash
grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' ~/.pm2/logs/LearnOverseasTunnel*.log | tail -n 1
```

### Test Ollama Directly on Linux:
```bash
curl -s http://127.0.0.1:11434/api/tags
```

### Keep-Alive Cron (Prevents Cloudflare Idle Disconnection):
```bash
(crontab -l 2>/dev/null; echo "*/2 * * * * curl -s -f https://millions-librarian-consumer-desktops.trycloudflare.com/ping >/dev/null 2>&1") | crontab -
```
