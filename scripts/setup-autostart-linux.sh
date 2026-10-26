#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
NODE_BIN="$(which node || echo "/usr/bin/node")"
USER_NAME="$(whoami)"

echo "========================================================"
echo "  LEARN OVERSEAS - SETUP AUTOSTART ON LINUX SERVER"
echo "  Target: Ubuntu / Debian Server (e.g. 192.168.0.66)"
echo "========================================================"
echo "Working directory: $DIR"
echo "Node binary:       $NODE_BIN"
echo "User:              $USER_NAME"
echo ""

# 1. Enable Ollama service on boot
if command -v systemctl >/dev/null 2>&1; then
    echo "-> Ensuring Ollama auto-starts on boot..."
    sudo systemctl enable ollama 2>/dev/null || true
    sudo systemctl start ollama 2>/dev/null || true
fi

# 2. Prefer PM2 if installed, else fallback to systemd unit
if command -v pm2 >/dev/null 2>&1; then
    echo "-> PM2 detected. Registering tunnel-service.js with PM2..."
    cd "$DIR"
    pm2 delete "learn-overseas-ai" 2>/dev/null || true
    pm2 start tunnel-service.js --name "learn-overseas-ai" --cwd "$DIR"
    pm2 save
    echo ""
    echo "-> Generating PM2 boot startup script..."
    pm2 startup || true
    echo "✅ Tunnel supervisor registered with PM2!"
else
    echo "-> Creating systemd service: /etc/systemd/system/learn-overseas-ai.service..."
    SERVICE_FILE="/etc/systemd/system/learn-overseas-ai.service"
    
    sudo bash -c "cat <<EOF > $SERVICE_FILE
[Unit]
Description=Learn Overseas AI Security Gateway & Cloud Tunnel
After=network.target ollama.service
Wants=ollama.service

[Service]
Type=simple
User=$USER_NAME
WorkingDirectory=$DIR
ExecStart=$NODE_BIN $DIR/tunnel-service.js
Restart=always
RestartSec=5
Environment=PATH=/usr/local/bin:/usr/bin:/bin
StandardOutput=append:$DIR/aitunnel.log
StandardError=append:$DIR/aitunnel-err.log

[Install]
WantedBy=multi-user.target
EOF"

    sudo systemctl daemon-reload
    sudo systemctl enable learn-overseas-ai.service
    sudo systemctl restart learn-overseas-ai.service
    echo "✅ Systemd service installed and started!"
fi

echo ""
echo "========================================================"
echo "🎉 AUTOSTART ACTIVATED!"
echo "   Even if the server reboots or is unused for days,"
echo "   Ollama, Gateway, and Tunnel will automatically start."
echo "========================================================"
