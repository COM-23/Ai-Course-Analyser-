export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const result: any = {
    database: { status: 'unknown' },
    aiServer: {
      endpoint: process.env.LOCAL_AI_ENDPOINT || 'http://192.168.0.66:11434/api/generate',
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

  // 2. Check Linux Ollama Server (primary endpoint with LAN fallbacks)
  const primaryUrl = (process.env.LOCAL_AI_ENDPOINT || 'http://192.168.0.66:11434/api/generate')
    .replace(/\/api\/generate$/, '');
  
  const candidateUrls = [
    primaryUrl,
    'http://192.168.0.66:11434',
    'http://127.0.0.1:11434',
    'http://localhost:11434'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let connected = false;
  let lastError = '';

  for (const testUrl of candidateUrls) {
    try {
      const headers: Record<string, string> = {};
      if (process.env.LOCAL_AI_API_KEY && (testUrl === primaryUrl || testUrl.includes('trycloudflare.com') || testUrl.includes(':11435'))) {
        headers['Authorization'] = `Bearer ${process.env.LOCAL_AI_API_KEY}`;
        headers['x-api-key'] = process.env.LOCAL_AI_API_KEY;
      }

      const tagsRes = await fetch(`${testUrl}/api/tags`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(3000)
      });

      if (tagsRes.ok) {
        const data = await tagsRes.json();
        result.aiServer.status = 'connected';
        result.aiServer.endpoint = `${testUrl}/api/generate`;
        result.aiServer.models = data.models?.map((m: any) => m.name) || [];
        connected = true;
        break;
      } else {
        lastError = `Status ${tagsRes.status}`;
      }
    } catch (e: any) {
      lastError = e?.message || String(e);
    }
  }

  if (!connected) {
    result.aiServer.status = 'unreachable';
    result.aiServer.error = lastError;
  }

  return NextResponse.json(result);
}
