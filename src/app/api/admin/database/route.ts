import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const universities = db.prepare('SELECT * FROM universities ORDER BY lastUpdated DESC').all().map(u => ({
      ...(u as any),
      programs: JSON.parse((u as any).programs as string)
    }));
    return NextResponse.json({ success: true, data: universities });
  } catch (error) {
    console.error("Database fetch error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch database" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'update') {
      const updateStmt = db.prepare(`
        INSERT OR REPLACE INTO universities (id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting, lastUpdated) 
        VALUES (@id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting, CURRENT_TIMESTAMP)
      `);
      updateStmt.run({
        ...payload,
        programs: typeof payload.programs === 'string' ? payload.programs : JSON.stringify(payload.programs || { bachelors: "N/A", masters: "N/A" })
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'import') {
      const insertStmt = db.prepare(`
        INSERT OR REPLACE INTO universities (id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting, lastUpdated) 
        VALUES (@id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting, CURRENT_TIMESTAMP)
      `);
      
      const insertMany = db.transaction((unis) => {
        for (const uni of unis) {
          insertStmt.run({
            ...uni,
            programs: typeof uni.programs === 'string' ? uni.programs : JSON.stringify(uni.programs || { bachelors: "N/A", masters: "N/A" })
          });
        }
      });
      
      insertMany(payload);
      return NextResponse.json({ success: true, count: payload.length });
    }
    
    if (action === 'delete') {
      const deleteStmt = db.prepare('DELETE FROM universities WHERE id = ?');
      deleteStmt.run(payload.id);
      return NextResponse.json({ success: true });
    }
    
    if (action === 'create') {
      const insertStmt = db.prepare(`
        INSERT INTO universities (id, name, location, domain, minCgpa, tuition, currency, programs, acceptanceRate, campusSetting) 
        VALUES (@id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs, @acceptanceRate, @campusSetting)
      `);
      insertStmt.run({
        ...payload,
        id: payload.id || `manual_${Date.now()}`,
        programs: JSON.stringify(payload.programs || { bachelors: "N/A", masters: "N/A" })
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Database update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
