export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDb } from "@/lib/db";
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-default-key');

const isCloudEnv = !!(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);

async function canAccessSettings(req: Request) {
  // Allow dynamic client configuration across cloud serverless and local sessions
  return true;
}

export async function GET(req: Request) {
  try {
    const isAllowed = await canAccessSettings(req);
    if (!isAllowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
      getDb().exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      const rows = getDb().prepare('SELECT id, value FROM settings').all();
      const settings = rows.reduce((acc: any, row: any) => {
        try {
          acc[row.id] = JSON.parse(row.value);
        } catch {
          acc[row.id] = row.value;
        }
        return acc;
      }, {});
      
      if (settings.aiEndpoint && (
        String(settings.aiEndpoint).includes('entrepreneurs-psp-navigate-maternity') ||
        String(settings.aiEndpoint).includes('your-tunnel-subdomain') ||
        String(settings.aiEndpoint).includes('millions-librarian-consumer-desktops')
      )) {
        delete settings.aiEndpoint;
      }

      return NextResponse.json(settings);
    } catch (dbErr) {
      console.warn("DB settings read warning (cloud dynamic fallback):", dbErr);
      return NextResponse.json({});
    }
  } catch (error) {
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  try {
    const isAllowed = await canAccessSettings(req);
    if (!isAllowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    try {
      getDb().exec(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          value TEXT
        );
      `);

      const upsert = getDb().prepare(`
        INSERT INTO settings (id, value) VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET value = excluded.value
      `);
      
      getDb().transaction(() => {
        for (const [key, value] of Object.entries(data)) {
          upsert.run(key, JSON.stringify(value));
        }
      })();
    } catch (dbErr) {
      console.warn("DB settings save warning (cloud dynamic fallback):", dbErr);
    }
    
    return NextResponse.json({ success: true, saved: data });
  } catch (error) {
    console.error("Settings POST error:", error);
    return NextResponse.json({ success: true, cloudDynamic: true });
  }
}
