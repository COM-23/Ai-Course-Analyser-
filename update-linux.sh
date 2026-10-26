#!/bin/bash
set -e

cd "$(dirname "$0")"
echo "========================================================"
echo "  LEARN OVERSEAS - LINUX SERVER AUTO-UPDATE & LAUNCH"
echo "========================================================"
echo "Directory: $(pwd)"
echo ""

# 1. Pull latest code if git repo
if [ -d ".git" ]; then
    echo "-> Pulling latest code from GitHub..."
    git pull origin main || true
fi

# 2. Install dependencies
echo "-> Checking dependencies..."
npm install --prefer-offline 2>&1 | tail -5

# 3. Build Webpack production bundle
echo "-> Compiling production build..."
npm run build

# 4. Register 24/7 autonomous tunnel supervisor with PM2
echo "-> Starting AI Security Gateway + Cloud Tunnel + Keep-Alive Daemon..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 delete LearnOverseasAI 2>/dev/null || true
    pm2 delete LearnOverseas 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup 2>/dev/null || true
    echo ""
    echo "PM2 Status:"
    pm2 status
fi

echo ""
echo "========================================================"
echo "🎉 LINUX SERVER IS LIVE & PROTECTED 24/7!"
echo "   Even after server reboots, everything will auto-start."
echo "========================================================"
