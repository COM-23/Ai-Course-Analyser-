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

  // 2. Check Linux Ollama Server across LAN switch
  try {
    const baseUrl = (process.env.LOCAL_AI_ENDPOINT || 'http://192.168.0.66:11434/api/generate')
      .replace(/\/api\/generate$/, '');
    
    const headers: Record<string, string> = {};
    if (process.env.LOCAL_AI_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.LOCAL_AI_API_KEY}`;
      headers['x-api-key'] = process.env.LOCAL_AI_API_KEY;
    }

    const tagsRes = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(4000)
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
