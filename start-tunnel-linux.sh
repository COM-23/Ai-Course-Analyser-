#!/usr/bin/env bash
# ==============================================================================
# Learn Overseas - On-Prem Linux Cloudflare Tunnel & PM2 Launcher
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "========================================================"
echo "  LEARN OVERSEAS - ON-PREM LINUX CLOUDFLARE PM2 LAUNCHER"
echo "========================================================"
echo "Working directory: $DIR"
echo ""

# 1. Check cloudflared binary
if ! command -v cloudflared &> /dev/null; then
  echo "[WARNING] cloudflared is not installed or not in PATH."
  echo "To install on Ubuntu/Debian, run:"
  echo "  sudo mkdir -p --mode=0755 /etc/apt/keyrings"
  echo "  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /etc/apt/keyrings/cloudflare-main.gpg >/dev/null"
  echo "  echo 'deb [signed-by=/etc/apt/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list"
  echo "  sudo apt-get update && sudo apt-get install -y cloudflared"
  echo ""
else
  echo "[OK] Found cloudflared: $(command -v cloudflared)"
  cloudflared --version
fi

# 2. Check PM2
if ! command -v pm2 &> /dev/null; then
  echo "[INFO] PM2 not found globally, checking local npx pm2..."
  PM2_CMD="npx pm2"
else
  PM2_CMD="pm2"
fi

echo ""
echo "Starting Cloudflare AI Tunnel in PM2..."
$PM2_CMD start ecosystem.cloudflare.config.js

echo ""
echo "Saving PM2 process list to persist across reboots..."
$PM2_CMD save

echo ""
echo "========================================================"
echo "  PM2 PROCESS STATUS"
echo "========================================================"
$PM2_CMD status
echo ""
echo "Logs can be viewed anytime via:"
echo "  $PM2_CMD logs cloudflare-ai-tunnel"

