import { NextResponse } from 'next/server';
import db from '@/lib/db';
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
    
    // Security Check: You can only request your own ID unless you are super_admin
    if (payload.role !== 'super_admin' && (payload as any).id.toString() !== requestedCounselorId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let rows;
    if (payload.role === 'super_admin') {
      rows = db.prepare(`
        SELECT students.*, users.name as counselorName 
        FROM students 
        LEFT JOIN users ON students.counselor_id = users.id 
        ORDER BY students.createdAt DESC
      `).all();
    } else {
      rows = db.prepare(`
        SELECT students.*, users.name as counselorName 
        FROM students 
        LEFT JOIN users ON students.counselor_id = users.id 
        WHERE counselor_id = ? 
        ORDER BY students.createdAt DESC
      `).all(payload.id);
    }
    
    // Parse JSON strings back into objects
    const formattedRows = rows.map((row: any) => ({
      id: row.id,
      studentDetails: JSON.parse(row.studentDetails),
      studentSummary: row.studentSummary,
      strengths: JSON.parse(row.strengths),
      areasForImprovement: JSON.parse(row.areasForImprovement),
      careerOpportunities: JSON.parse(row.careerOpportunities),
      recommendedColleges: JSON.parse(row.recommendedColleges),
      visaDifficulty: row.visaDifficulty,
      keySkillsIdentified: JSON.parse(row.keySkillsIdentified),
      estimatedBudgetRange: row.estimatedBudgetRange,
      createdAt: row.createdAt,
      counselorName: row.counselorName || 'Unknown Counselor'
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
    const stmt = db.prepare('DELETE FROM students WHERE id = ?');
    stmt.run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete student from DB:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}
