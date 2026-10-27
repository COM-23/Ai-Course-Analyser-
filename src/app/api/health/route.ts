export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function cleanAndNormalizeUrl(input: string): string {
  if (!input) return '';
  let str = input.trim();
  if (!str.startsWith('http://') && !str.startsWith('https://')) {
    if (str.startsWith('192.168.') || str.startsWith('10.') || str.startsWith('127.0.0.1') || str.startsWith('localhost')) {
      str = 'http://' + str;
    } else {
      str = 'https://' + str;
    }
  }
  str = str.replace(/\/+$/, '');
  if (!str.endsWith('/api/generate')) {
    str = str.replace(/\/api\/?$/, '');
    str = str + '/api/generate';
  }
  return str;
}

export async function GET(req: Request) {
  const isCloudEnv = !!(
    process.env.NETLIFY ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  const cloudDefaultApiKey = 'lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO';

  let configuredEndpoint = (process.env.LOCAL_AI_ENDPOINT || '').trim();
  let configuredApiKey = (process.env.LOCAL_AI_API_KEY || '').trim();

  // 1. Check if client passed an endpoint via query param or header
  try {
    const url = new URL(req.url);
    const paramEp = url.searchParams.get('endpoint') || req.headers.get('x-ai-endpoint');
    if (paramEp && paramEp.trim()) {
      configuredEndpoint = paramEp.trim();
    }
  } catch (e) {}

  // 2. Check if Super Admin configured an AI endpoint in UI Settings table
  if (!configuredEndpoint) {
    try {
      const settingRow = getDb().prepare("SELECT value FROM settings WHERE id = 'aiEndpoint'").get() as any;
      if (settingRow && settingRow.value) {
        const parsed = JSON.parse(settingRow.value);
        if (typeof parsed === 'string' && parsed.trim()) {
          configuredEndpoint = parsed.trim();
        }
      }
    } catch (e) {}
  }

  // 3. Normalize configuredEndpoint if present
  if (configuredEndpoint) {
    configuredEndpoint = cleanAndNormalizeUrl(configuredEndpoint);
  }

  // 4. Check if local .tunnel-status.json exists (on-premise local dev/server)
  if (!configuredEndpoint) {
    try {
      const fs = require('fs');
      const path = require('path');
      const statusPath = path.resolve(process.cwd(), '.tunnel-status.json');
      if (fs.existsSync(statusPath)) {
        const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        if (statusData && statusData.endpoint) {
          configuredEndpoint = cleanAndNormalizeUrl(statusData.endpoint);
        }
      }
    } catch (e) {}
  }

  if (!configuredApiKey) {
    configuredApiKey = cloudDefaultApiKey;
  }

  const candidateEndpoints = (isCloudEnv
    ? [configuredEndpoint]
    : [configuredEndpoint, 'http://192.168.0.76:11434/api/generate', 'http://192.168.0.66:11434/api/generate', 'http://127.0.0.1:11434/api/generate']
  ).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const result: any = {
    database: { status: 'unknown' },
    aiServer: {
      endpoint: candidateEndpoints[0] || configuredEndpoint || null,
      model: process.env.LOCAL_AI_MODEL || 'llama3.1',
      status: 'unknown'
    }
  };

  // 1. Check SQLite
  try {
    const db = getDb();
    const userCount = db.prepare('SELECT count(*) as count FROM users').get() as any;
    result.database = {
      status: 'connected',
      totalUsers: userCount?.count || 0
    };
  } catch (dbErr: any) {
    result.database = {
      status: 'error',
      error: dbErr?.message || String(dbErr)
    };
  }

  if (candidateEndpoints.length === 0) {
    result.aiServer.status = 'unconfigured';
    result.aiServer.error = 'No AI tunnel URL configured yet. Enter your Cloudflare URL in Settings to connect.';
    return NextResponse.json(result);
  }

  // 2. Multi-Probe candidate AI endpoints with resilient fallback
  let lastError = '';
  let connected = false;

  for (const ep of candidateEndpoints) {
    try {
      const baseUrl = ep.replace(/\/api\/generate\/?$/, '').replace(/\/+$/, '');
      const authHeaders: Record<string, string> = {};
      if (configuredApiKey) {
        authHeaders['Authorization'] = `Bearer ${configuredApiKey}`;
        authHeaders['x-api-key'] = configuredApiKey;
      }

      let isUp = false;
      let modelList: string[] = [];
      const probeTimeout = 8000; // 8 seconds allows Cloudflare edge handshake to warm up

      // Probe 1: Direct Ollama /api/tags (with auth headers)
      try {
        const tagsRes = await fetch(`${baseUrl}/api/tags`, {
          method: 'GET',
          headers: authHeaders,
          signal: AbortSignal.timeout(probeTimeout)
        });
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          modelList = data.models?.map((m: any) => m.name) || [];
          isUp = true;
        }
      } catch (e: any) {
        lastError = e?.message || String(e);
      }

      // Probe 2: Ollama /api/tags (without auth headers, in case direct tunnel to 11434)
      if (!isUp) {
        try {
          const noAuthRes = await fetch(`${baseUrl}/api/tags`, {
            method: 'GET',
            signal: AbortSignal.timeout(probeTimeout)
          });
          if (noAuthRes.ok) {
            const data = await noAuthRes.json();
            modelList = data.models?.map((m: any) => m.name) || [];
            isUp = true;
          }
        } catch (e: any) {}
      }

      // Probe 3: Lightweight gateway ping
      if (!isUp) {
        try {
          const pingRes = await fetch(`${baseUrl}/ping`, {
            method: 'GET',
            signal: AbortSignal.timeout(4000)
          });
          if (pingRes.ok) isUp = true;
        } catch (e) {}
      }

      // Probe 4: Root endpoint (standard Ollama returns "Ollama is running" with 200 OK)
      if (!isUp) {
        try {
          const rootRes = await fetch(`${baseUrl}/`, {
            method: 'GET',
            signal: AbortSignal.timeout(probeTimeout)
          });
          if (rootRes.ok) {
            isUp = true;
          }
        } catch (e) {}
      }

      // Probe 5: Ollama version check
      if (!isUp) {
        try {
          const verRes = await fetch(`${baseUrl}/api/version`, {
            method: 'GET',
            signal: AbortSignal.timeout(probeTimeout)
          });
          if (verRes.ok) isUp = true;
        } catch (e) {}
      }

      if (isUp) {
        result.aiServer.status = 'connected';
        result.aiServer.endpoint = ep;
        result.aiServer.models = modelList.length > 0 ? modelList : ['llama3.1'];
        connected = true;
        break;
      } else if (!lastError) {
        lastError = `Target endpoint ${ep} did not respond to health probes.`;
      }
    } catch (e: any) {
      lastError = `${ep}: ${e?.message || String(e)}`;
    }
  }

  if (!connected) {
    result.aiServer.status = 'unreachable';
    result.aiServer.error = lastError;
  }

  return NextResponse.json(result);
}
