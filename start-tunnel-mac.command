#!/bin/bash
cd "$(dirname "$0")"
echo "========================================================"
echo "  LEARN OVERSEAS - AUTONOMOUS AI TUNNEL SUPERVISOR (MAC)"
echo "========================================================"
echo "Starting Gateway + Cloudflare Tunnel + 24/7 Keep-Alive..."
echo ""

node tunnel-service.js
