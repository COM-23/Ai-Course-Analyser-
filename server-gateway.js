/**
 * On-Premises AI Security Gateway
 * Protects local Ollama instance with API Key authentication.
 * Forwards verified requests to Ollama at http://127.0.0.1:11434
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.GATEWAY_PORT || 11435;
const OLLAMA_HOST = process.env.OLLAMA_HOST || '127.0.0.1';
const OLLAMA_PORT = process.env.OLLAMA_PORT || 11434;

const KEYS_FILE = path.resolve(__dirname, 'api-keys.json');

function hashKey(k) {
  return crypto.createHash('sha256').update(String(k).trim()).digest('hex');
}

function getActiveKeyHashes() {
  const activeHashes = new Set();
  if (process.env.AI_SECRET_KEY) {
    activeHashes.add(hashKey(process.env.AI_SECRET_KEY));
  }
  if (fs.existsSync(KEYS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(KEYS_FILE, 'utf-8'));
      if (Array.isArray(data.keys)) {
        for (const k of data.keys) {
          if (!k.active) continue;
          if (k.keyHash) activeHashes.add(k.keyHash);
          if (k.key) activeHashes.add(hashKey(k.key)); // backwards compat
        }
      }
    } catch {}
  }
  return activeHashes;
}

console.log('========================================================');
console.log('  LEARN OVERSEAS - ON-PREM AI SECURITY GATEWAY');
console.log('========================================================');
console.log(`  Listening on port: ${PORT}`);
console.log(`  Target (Ollama):   http://${OLLAMA_HOST}:${OLLAMA_PORT}`);
console.log(`  Active API Keys:   ${getActiveKeyHashes().size} registered`);
console.log('========================================================\n');

const server = http.createServer((req, res) => {
  // CORS headers so cloud frontend can connect seamlessly
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // 1. Validate API Key
  const authHeader = req.headers['authorization'] || '';
  const apiKeyHeader = req.headers['x-api-key'] || '';
  
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  const providedKey = apiKeyHeader || bearerToken;

  const validHashes = getActiveKeyHashes();
  const providedHash = hashKey(providedKey);
  if (!providedKey || !validHashes.has(providedHash)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: 'Unauthorized',
      message: 'Missing or invalid API Key. Please provide X-API-Key or Bearer token.'
    }));
  }

  // 2. Forward authorized request to local Ollama
  const options = {
    hostname: OLLAMA_HOST,
    port: OLLAMA_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${OLLAMA_HOST}:${OLLAMA_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Gateway Error] Failed to reach local Ollama:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Bad Gateway', message: 'Local Ollama is offline or unreachable' }));
    }
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[OK] Security Gateway running on http://0.0.0.0:${PORT}`);
});
