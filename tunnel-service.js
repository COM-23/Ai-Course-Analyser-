/**
 * Learn Overseas - Autonomous Tunnel Supervisor & Keep-Alive Daemon
 * 
 * Ensures the On-Premises AI Server stays permanently connected to the Cloud:
 * 1. Automatically starts & monitors server-gateway.js (Port 11435)
 * 2. Launches and supervises Cloudflare Tunnel / Ngrok
 * 3. Keeps connection alive 24/7 via automated 30s heartbeats (prevents 1-day idle drops)
 * 4. Automatically re-establishes connection on server reboots or network drops
 * 5. Saves live connection state to .tunnel-status.json and .env.local
 */

const { spawn, execSync } = require('child_process');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const GATEWAY_PORT = process.env.GATEWAY_PORT || 11435;
const MONITOR_PORT = process.env.MONITOR_PORT || 11436;
const STATUS_FILE = path.resolve(__dirname, '.tunnel-status.json');
const ENV_LOCAL_FILE = path.resolve(__dirname, '.env.local');

let gatewayProcess = null;
let tunnelProcess = null;
let activeTunnelUrl = null;
let lastHeartbeatTime = null;
let consecutiveFailures = 0;
let isShuttingDown = false;

// 1. Locate cloudflared binary
function findCloudflared() {
  const candidates = [
    'cloudflared',
    '/opt/homebrew/bin/cloudflared',
    '/usr/local/bin/cloudflared',
    '/usr/bin/cloudflared',
    path.join(__dirname, 'cloudflared'),
    path.join(__dirname, 'cloudflared.exe'),
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
    'C:\\ProgramData\\chocolatey\\bin\\cloudflared.exe'
  ];

  for (const bin of candidates) {
    try {
      execSync(`"${bin}" --version`, { stdio: 'ignore' });
      return bin;
    } catch (e) {
      // try next
    }
  }
  return null;
}

// 2. Start Gateway
function startGateway() {
  if (gatewayProcess) return;

  console.log('[Supervisor] Starting AI Security Gateway (server-gateway.js)...');
  const gatewayPath = path.resolve(__dirname, 'server-gateway.js');
  
  gatewayProcess = spawn(process.execPath, [gatewayPath], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, GATEWAY_PORT }
  });

  gatewayProcess.on('exit', (code, signal) => {
    console.warn(`[Supervisor] Gateway exited (code: ${code}, signal: ${signal}).`);
    gatewayProcess = null;
    if (!isShuttingDown) {
      console.log('[Supervisor] Restarting Gateway in 3 seconds...');
      setTimeout(startGateway, 3000);
    }
  });
}

// 3. Save Active Tunnel State
function saveTunnelState(url) {
  activeTunnelUrl = url;
  const endpoint = `${url}/api/generate`;

  const status = {
    status: 'connected',
    url: url,
    endpoint: endpoint,
    updatedAt: new Date().toISOString(),
    pid: process.pid
  };

  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  } catch (e) {
    console.warn('[Supervisor] Could not write .tunnel-status.json:', e.message);
  }

  // Update .env.local if present
  try {
    let envContent = '';
    if (fs.existsSync(ENV_LOCAL_FILE)) {
      envContent = fs.readFileSync(ENV_LOCAL_FILE, 'utf-8');
    }

    if (envContent.includes('LOCAL_AI_ENDPOINT=')) {
      envContent = envContent.replace(/LOCAL_AI_ENDPOINT=.*$/m, `LOCAL_AI_ENDPOINT=${endpoint}`);
    } else {
      envContent = `LOCAL_AI_ENDPOINT=${endpoint}\n` + envContent;
    }

    fs.writeFileSync(ENV_LOCAL_FILE, envContent, 'utf-8');
    console.log(`[Supervisor] Updated .env.local with live endpoint: ${endpoint}`);
  } catch (e) {
    console.warn('[Supervisor] Could not update .env.local:', e.message);
  }
}

// 4. Start Cloudflare Tunnel
function startTunnel() {
  if (tunnelProcess) return;

  const cloudflared = findCloudflared();
  if (!cloudflared) {
    console.error('\n[ERROR] cloudflared is not installed or not found in PATH!');
    console.error('Install instructions:');
    console.error('  macOS:   brew install cloudflared');
    console.error('  Linux:   sudo apt-get install cloudflared (or curl -L ...)');
    console.error('  Windows: winget install --id Cloudflare.cloudflared');
    console.error('\nRetrying discovery in 10 seconds...\n');
    setTimeout(startTunnel, 10000);
    return;
  }

  // If a permanent token is set, use it (Zero Trust Named Tunnel)
  const tunnelToken = process.env.CLOUDFLARE_TUNNEL_TOKEN;
  let args = [];
  if (tunnelToken) {
    console.log('[Supervisor] Launching Permanent Cloudflare Tunnel (Token Mode)...');
    args = ['tunnel', 'run', '--token', tunnelToken];
  } else {
    console.log(`[Supervisor] Launching Cloudflare Tunnel for http://127.0.0.1:${GATEWAY_PORT}...`);
    args = ['tunnel', '--url', `http://127.0.0.1:${GATEWAY_PORT}`];
  }

  tunnelProcess = spawn(cloudflared, args, {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const urlRegex = /https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/g;

  const handleOutput = (data) => {
    const text = data.toString();
    const match = text.match(urlRegex);
    if (match && match[0]) {
      const foundUrl = match[0];
      if (foundUrl !== activeTunnelUrl) {
        console.log('\n========================================================');
        console.log('  🎉 LIVE CLOUD TUNNEL CONNECTED!');
        console.log(`  Tunnel URL:    ${foundUrl}`);
        console.log(`  Cloud Endpoint: ${foundUrl}/api/generate`);
        console.log('  Keep-Alive:    Active (Heartbeat every 30s)');
        console.log('========================================================\n');
        saveTunnelState(foundUrl);
      }
    }
  };

  tunnelProcess.stdout.on('data', handleOutput);
  tunnelProcess.stderr.on('data', handleOutput);

  tunnelProcess.on('exit', (code, signal) => {
    console.warn(`[Supervisor] Tunnel process exited (code: ${code}, signal: ${signal}).`);
    tunnelProcess = null;
    activeTunnelUrl = null;
    if (!isShuttingDown) {
      console.log('[Supervisor] Re-establishing tunnel in 5 seconds...');
      setTimeout(startTunnel, 5000);
    }
  });
}

// 5. 24/7 Keep-Alive Loop (Prevents Cloudflare 1-Day Inactivity Disconnection)
async function sendHeartbeat() {
  if (!activeTunnelUrl) return;

  const pingUrl = `${activeTunnelUrl}/ping`;

  try {
    const req = https.get(pingUrl, { timeout: 8000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        lastHeartbeatTime = new Date();
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }
    });

    req.on('timeout', () => {
      req.destroy();
      consecutiveFailures++;
    });

    req.on('error', (e) => {
      consecutiveFailures++;
      if (consecutiveFailures % 5 === 0) {
        console.warn(`[Keep-Alive] Heartbeat ping failed (${consecutiveFailures} in a row): ${e.message}`);
      }
    });
  } catch (err) {
    consecutiveFailures++;
  }

  // If 4 consecutive failures occurred (~2 minutes of broken connection), recycle the tunnel
  if (consecutiveFailures >= 4) {
    console.warn('[Keep-Alive] Tunnel appears unresponsive or severed. Recycling tunnel process...');
    consecutiveFailures = 0;
    if (tunnelProcess) {
      try { tunnelProcess.kill('SIGTERM'); } catch (e) {}
    }
  }
}

// 6. Local Status Server (port 11436)
function startStatusServer() {
  const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    if (req.url === '/status' || req.url === '/') {
      res.writeHead(200);
      res.end(JSON.stringify({
        status: activeTunnelUrl ? 'connected' : 'connecting',
        tunnelUrl: activeTunnelUrl,
        endpoint: activeTunnelUrl ? `${activeTunnelUrl}/api/generate` : null,
        lastHeartbeat: lastHeartbeatTime ? lastHeartbeatTime.toISOString() : null,
        uptimeSeconds: Math.floor(process.uptime()),
        pid: process.pid
      }, null, 2));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });

  server.listen(MONITOR_PORT, '127.0.0.1', () => {
    console.log(`[Supervisor] Local status monitor running on http://127.0.0.1:${MONITOR_PORT}/status\n`);
  });
}

// 7. Graceful Shutdown
function cleanup() {
  isShuttingDown = true;
  console.log('\n[Supervisor] Shutting down cleanly...');
  if (tunnelProcess) {
    try { tunnelProcess.kill('SIGTERM'); } catch (e) {}
  }
  if (gatewayProcess) {
    try { gatewayProcess.kill('SIGTERM'); } catch (e) {}
  }
  try {
    if (fs.existsSync(STATUS_FILE)) fs.unlinkSync(STATUS_FILE);
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('SIGHUP', cleanup);

// Master Launch
console.log('========================================================');
console.log('  LEARN OVERSEAS - AUTONOMOUS AI TUNNEL SUPERVISOR');
console.log('  Persistent 24/7 AI Connection Daemon with Auto-Recovery');
console.log('========================================================\n');

startGateway();
setTimeout(startTunnel, 2000);
startStatusServer();

// Send Keep-Alive ping every 30 seconds
setInterval(sendHeartbeat, 30000);
