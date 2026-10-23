export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const isCloudEnv = !!(
    process.env.NETLIFY ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  const cloudDefaultEndpoint = 'https://headline-alive-subsidiaries-merge.trycloudflare.com/api/generate';
  const cloudDefaultApiKey = 'lo_live_qDYoGoQFKz7bM35ijtVa-9BwznoFZhqO';

  let configuredEndpoint = (process.env.LOCAL_AI_ENDPOINT || '').trim();
  let configuredApiKey = (process.env.LOCAL_AI_API_KEY || '').trim();

  if (isCloudEnv) {
    if (!configuredEndpoint || configuredEndpoint.includes('192.168.') || configuredEndpoint.includes('127.0.0.1') || configuredEndpoint.includes('localhost')) {
      configuredEndpoint = cloudDefaultEndpoint;
    }
    if (!configuredApiKey) {
      configuredApiKey = cloudDefaultApiKey;
    }
  } else {
    if (!configuredEndpoint) {
      configuredEndpoint = 'http://192.168.0.66:11434/api/generate';
    }
  }

  const result: any = {
    database: { status: 'unknown' },
    aiServer: {
      endpoint: configuredEndpoint,
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

  // 2. Check Linux Ollama Server
  try {
    const baseUrl = configuredEndpoint.replace(/\/api\/generate\/?$/, '');
    
    const headers: Record<string, string> = {};
    if (configuredApiKey) {
      headers['Authorization'] = `Bearer ${configuredApiKey}`;
      headers['x-api-key'] = configuredApiKey;
    }

    const tagsRes = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(isCloudEnv ? 8000 : 4000)
    });

    if (tagsRes.ok) {
      const data = await tagsRes.json();
      result.aiServer.status = 'connected';
      result.aiServer.models = data.models?.map((m: any) => m.name) || [];
    } else {
      result.aiServer.status = 'error';
      result.aiServer.statusCode = tagsRes.status;
    }
  } catch (aiErr: any) {
    result.aiServer.status = 'unreachable';
    result.aiServer.error = aiErr?.message || String(aiErr);
  }

  return NextResponse.json(result);
}

