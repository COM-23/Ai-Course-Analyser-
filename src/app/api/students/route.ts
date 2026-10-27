import { NextResponse } from 'next/server';
import { getDb } from "@/lib/db";
import { jwtVerify } from 'jose';

export const dynamic = 'force-dynamic';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-default-key');

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (!match) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    let payload;
    try {
      const verified = await jwtVerify(match[1], JWT_SECRET);
      payload = verified.payload;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const url = new URL(req.url);
    const requestedCounselorId = url.searchParams.get('counselorId');

    let rows;
    if (requestedCounselorId && requestedCounselorId !== 'all') {
      rows = getDb().prepare(`
        SELECT students.*, users.name as counselorName 
        FROM students 
        LEFT JOIN users ON students.counselor_id = users.id 
        WHERE counselor_id = ? 
        ORDER BY students.createdAt DESC
      `).all(requestedCounselorId);
    } else {
      // Shared roster across all counselors: everyone can view all evaluated profiles
      rows = getDb().prepare(`
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

