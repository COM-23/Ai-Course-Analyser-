export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  const isCloudEnv = !!(
    process.env.NETLIFY ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  const cloudDefaultEndpoint = 'https://entrepreneurs-psp-navigate-maternity.trycloudflare.com/api/generate';
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

  // Normalize configuredEndpoint if present
  if (configuredEndpoint) {
    if (!configuredEndpoint.endsWith('/api/generate')) {
      configuredEndpoint = configuredEndpoint.replace(/\/+$/, '') + '/api/generate';
    }
  }

  // Check if dead tunnel is configured (only if not explicitly passed by user)
  let isUserPassed = false;
  try {
    const urlCheck = new URL(req.url);
    isUserPassed = !!(urlCheck.searchParams.get('endpoint') || req.headers.get('x-ai-endpoint'));
  } catch (e) {}

  if (!isUserPassed && (configuredEndpoint.includes('headline-alive') || configuredEndpoint.includes('blink-competitions') || configuredEndpoint.includes('entrepreneurs-psp-navigate-maternity'))) {
    configuredEndpoint = '';
  }

  // Check if local .tunnel-status.json exists
  if (!configuredEndpoint) {
    try {
      const fs = require('fs');
      const path = require('path');
      const statusPath = path.resolve(process.cwd(), '.tunnel-status.json');
      if (fs.existsSync(statusPath)) {
        const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
        if (statusData && statusData.endpoint) {
          configuredEndpoint = statusData.endpoint;
        }
      }
    } catch (e) {}
  }

  if (!configuredApiKey) {
    configuredApiKey = cloudDefaultApiKey;
  }

  function normalize(u: string) {
    if (!u) return '';
    let clean = u.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api/generate')) {
      clean = clean + '/api/generate';
    }
    return clean;
  }

  const candidateEndpoints = (isCloudEnv
    ? [normalize(configuredEndpoint)]
    : [normalize(configuredEndpoint), 'http://192.168.0.76:11434/api/generate', 'http://192.168.0.66:11434/api/generate', 'http://127.0.0.1:11434/api/generate']
  ).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

  const result: any = {
    database: { status: 'unknown' },
    aiServer: {
      endpoint: candidateEndpoints[0] || configuredEndpoint,
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

  // 2. Check Candidate AI Server Endpoints in sequence
  let lastError = '';
  let connected = false;

  for (const ep of candidateEndpoints) {
    try {
      const baseUrl = ep.replace(/\/api\/generate\/?$/, '');
      const headers: Record<string, string> = {};
      if (configuredApiKey) {
        headers['Authorization'] = `Bearer ${configuredApiKey}`;
        headers['x-api-key'] = configuredApiKey;
      }

      let isUp = false;
      let modelList: string[] = [];

      // 1. Fast ping check
      try {
        const pingRes = await fetch(`${baseUrl}/ping`, {
          method: 'GET',
          signal: AbortSignal.timeout(isCloudEnv ? 3000 : 2000)
        });
        if (pingRes.ok) isUp = true;
      } catch (e) {}

      // 2. Authenticated tags check
      try {
        const tagsRes = await fetch(`${baseUrl}/api/tags`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(isCloudEnv ? 4000 : 3000)
        });
        if (tagsRes.ok) {
          const data = await tagsRes.json();
          modelList = data.models?.map((m: any) => m.name) || [];
          isUp = true;
        }
      } catch (e: any) {
        lastError = `${ep}: ${e?.message || String(e)}`;
      }

      if (isUp) {
        result.aiServer.status = 'connected';
        result.aiServer.endpoint = ep;
        result.aiServer.models = modelList.length > 0 ? modelList : ['llama3.1'];
        connected = true;
        break;
      } else if (!lastError) {
        lastError = `Unreachable: ${ep}`;
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

