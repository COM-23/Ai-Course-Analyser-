import { NextResponse } from 'next/server';
import { getDb } from "@/lib/db";
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-default-key');

const isCloudEnv = !!(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
);

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (!match && !isCloudEnv) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    if (match) {
      try {
        await jwtVerify(match[1], JWT_SECRET);
      } catch {
        if (!isCloudEnv) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const db = getDb();
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentDetails JSON,
          studentSummary TEXT,
          strengths JSON,
          areasForImprovement JSON,
          careerOpportunities JSON,
          recommendedColleges JSON,
          visaDifficulty TEXT,
          keySkillsIdentified JSON,
          estimatedBudgetRange TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          counselor_id INTEGER,
          comparisonData JSON
        );
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT,
          username TEXT UNIQUE,
          passwordHash TEXT,
          role TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {}

    const url = new URL(req.url);
    const requestedCounselorId = url.searchParams.get('counselorId');

    let rows;
    if (requestedCounselorId && requestedCounselorId !== 'all') {
      rows = db.prepare(`
        SELECT students.*, users.name as counselorName 
        FROM students 
        LEFT JOIN users ON students.counselor_id = users.id 
        WHERE counselor_id = ? 
        ORDER BY students.createdAt DESC
      `).all(requestedCounselorId);
    } else {
      // Shared roster across all counselors: everyone can view all evaluated profiles
      rows = db.prepare(`
        SELECT students.*, users.name as counselorName 
        FROM students 
        LEFT JOIN users ON students.counselor_id = users.id 
        ORDER BY students.createdAt DESC
      `).all();
    }

    
    // Parse JSON strings back into objects safely
    const parseSafe = (val: any, fallback: any) => {
      if (!val) return fallback;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch { return fallback; }
    };

    const formattedRows = rows.map((row: any) => ({
      id: row.id,
      studentDetails: parseSafe(row.studentDetails, {}),
      studentSummary: row.studentSummary || '',
      strengths: parseSafe(row.strengths, []),
      areasForImprovement: parseSafe(row.areasForImprovement, []),
      careerOpportunities: parseSafe(row.careerOpportunities, []),
      recommendedColleges: parseSafe(row.recommendedColleges, []),
      visaDifficulty: row.visaDifficulty || '',
      keySkillsIdentified: parseSafe(row.keySkillsIdentified, []),
      estimatedBudgetRange: row.estimatedBudgetRange || '',
      createdAt: row.createdAt,
      counselorName: row.counselorName || 'Unknown Counselor',
      comparisonData: parseSafe(row.comparisonData, [])
    }));

    return NextResponse.json(formattedRows);
  } catch (error) {
    console.error('Failed to fetch students from DB:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }
    const stmt = getDb().prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete student from DB:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, studentSummary } = await req.json();
    if (!id || typeof studentSummary !== 'string') {
      return NextResponse.json({ error: 'Missing id or studentSummary' }, { status: 400 });
    }
    const stmt = getDb().prepare('UPDATE students SET studentSummary = ? WHERE id = ?');
    stmt.run(studentSummary, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update student summary in DB:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const list = Array.isArray(body) ? body : [body];
    const db = getDb();
    
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS students (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          studentDetails JSON,
          studentSummary TEXT,
          strengths JSON,
          areasForImprovement JSON,
          careerOpportunities JSON,
          recommendedColleges JSON,
          visaDifficulty TEXT,
          keySkillsIdentified JSON,
          estimatedBudgetRange TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          counselor_id INTEGER,
          comparisonData JSON
        );
      `);
    } catch (e) {}

    const upsertStmt = db.prepare(`
      INSERT INTO students (
        id, studentDetails, studentSummary, strengths, areasForImprovement,
        careerOpportunities, recommendedColleges, visaDifficulty,
        keySkillsIdentified, estimatedBudgetRange, counselor_id, comparisonData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        studentDetails = excluded.studentDetails,
        studentSummary = excluded.studentSummary,
        comparisonData = excluded.comparisonData,
        recommendedColleges = excluded.recommendedColleges
    `);

    for (const s of list) {
      if (!s || !s.studentDetails) continue;
      try {
        upsertStmt.run(
          s.id || null,
          typeof s.studentDetails === 'string' ? s.studentDetails : JSON.stringify(s.studentDetails),
          s.studentSummary || '',
          typeof s.strengths === 'string' ? s.strengths : JSON.stringify(s.strengths || []),
          typeof s.areasForImprovement === 'string' ? s.areasForImprovement : JSON.stringify(s.areasForImprovement || []),
          typeof s.careerOpportunities === 'string' ? s.careerOpportunities : JSON.stringify(s.careerOpportunities || []),
          typeof s.recommendedColleges === 'string' ? s.recommendedColleges : JSON.stringify(s.recommendedColleges || []),
          s.visaDifficulty || '',
          typeof s.keySkillsIdentified === 'string' ? s.keySkillsIdentified : JSON.stringify(s.keySkillsIdentified || []),
          s.estimatedBudgetRange || '',
          s.counselor_id || 1,
          s.comparisonData ? (typeof s.comparisonData === 'string' ? s.comparisonData : JSON.stringify(s.comparisonData)) : null
        );
      } catch (err) {}
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


