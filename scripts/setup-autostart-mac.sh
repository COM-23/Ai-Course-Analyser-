#!/bin/bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
PLIST_PATH="$HOME/Library/LaunchAgents/com.learnoverseas.aitunnel.plist"
NODE_BIN="$(which node || echo "/opt/homebrew/bin/node")"

echo "========================================================"
echo "  LEARN OVERSEAS - SETUP AUTOSTART ON MAC REBOOT"
echo "========================================================"
echo "Directory: $DIR"
echo "Node Binary: $NODE_BIN"
echo ""

mkdir -p "$HOME/Library/LaunchAgents"

# Unload previous service if exists
launchctl unload "$PLIST_PATH" 2>/dev/null || true

cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.learnoverseas.aitunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>$NODE_BIN</string>
        <string>$DIR/tunnel-service.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$DIR</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$DIR/aitunnel.log</string>
    <key>StandardErrorPath</key>
    <string>$DIR/aitunnel-err.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
    </dict>
</dict>
</plist>
EOF

chmod 644 "$PLIST_PATH"
launchctl load -w "$PLIST_PATH"

echo "✅ Autostart configured successfully!"
echo "   The AI Tunnel & Gateway will automatically start every time this Mac boots."
echo "   LaunchAgent: $PLIST_PATH"
echo "   Logs: $DIR/aitunnel.log"
echo "========================================================"
