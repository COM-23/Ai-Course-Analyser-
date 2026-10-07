import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-default-key');

async function requireSuperAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader.match(/auth_token=([^;]+)/);
  if (!match) return false;
  
  try {
    const { payload } = await jwtVerify(match[1], JWT_SECRET);
    return payload.role === 'super_admin';
  } catch {
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const isSuperAdmin = await requireSuperAdmin(req);
    if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rows = db.prepare('SELECT id, value FROM settings').all();
    const settings = rows.reduce((acc: any, row: any) => {
      acc[row.id] = JSON.parse(row.value);
      return acc;
    }, {});
    
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const isSuperAdmin = await requireSuperAdmin(req);
    if (!isSuperAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    
    const upsert = db.prepare(`
      INSERT INTO settings (id, value) VALUES (?, ?)
      ON CONFLICT(id) DO UPDATE SET value = excluded.value
    `);
    
    db.transaction(() => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, JSON.stringify(value));
      }
    })();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
