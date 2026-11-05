import { NextResponse } from 'next/server';
import { getDb } from "@/lib/db";
import { 
  isCloudDbEnabled, 
  cloudGetStudents, 
  cloudSaveStudents, 
  cloudDeleteStudent, 
  cloudUpdateStudent 
} from "@/lib/cloud-db";
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

async function getAuthUser(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const authHeader = req.headers.get('authorization') || '';
    let token = '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    if (match) token = match[1];
    else if (authHeader.startsWith('Bearer ')) token = authHeader.substring(7);

    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { id: number; name: string; username: string; role: string };
  } catch {
    return null;
  }
}

function ensureTables(db: any) {
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
}

export async function GET(req: Request) {
  try {
    let user = await getAuthUser(req);
    if (!user && !isCloudEnv) {
      // Local on-prem fallback to avoid blocking standalone desktop/counselor access
      user = { id: 1, name: 'Local Admin', username: 'localadmin', role: 'super_admin' };
    }

    const url = new URL(req.url);
    const requestedCounselorId = url.searchParams.get('counselorId');
    const isSuperAdmin = user?.role === 'super_admin';

    // Prevent unauthorized cross-account access for counselors
    if (!isSuperAdmin && user?.id && requestedCounselorId && requestedCounselorId !== 'all' && Number(requestedCounselorId) !== Number(user.id)) {
      return NextResponse.json({ error: 'Access denied: You can only view your own assigned students.' }, { status: 403 });
    }

    if (isCloudDbEnabled()) {
      try {
        const rows = await cloudGetStudents(
          requestedCounselorId && requestedCounselorId !== 'all' ? Number(requestedCounselorId) : (isSuperAdmin ? null : (user?.id ? Number(user.id) : 1)),
          isSuperAdmin
        );
        return NextResponse.json(rows);
      } catch (cloudErr) {
        console.warn('[CloudDB] Cloud fetch fallback to local DB:', cloudErr);
      }
    }

    const db = getDb();
    ensureTables(db);

    let rows: any[] = [];
    if (isSuperAdmin) {
      // Superadmin has global visibility across all counselors, with optional counselor filter
      if (requestedCounselorId && requestedCounselorId !== 'all') {
        rows = db.prepare(`
          SELECT students.*, users.name as counselorName 
          FROM students 
          LEFT JOIN users ON students.counselor_id = users.id 
          WHERE students.counselor_id = ? 
          ORDER BY students.createdAt DESC
        `).all(Number(requestedCounselorId));
      } else {
        rows = db.prepare(`
          SELECT students.*, users.name as counselorName 
          FROM students 
          LEFT JOIN users ON students.counselor_id = users.id 
          ORDER BY students.createdAt DESC
        `).all();
      }
    } else {
      // Counselor account: Strictly isolated to own students
      const effectiveCounselorId = user?.id ? Number(user?.id) : (requestedCounselorId ? Number(requestedCounselorId) : 1);

      // Prevent unauthorized cross-account access
      if (user?.id && requestedCounselorId && requestedCounselorId !== 'all' && Number(requestedCounselorId) !== Number(user.id)) {
        return NextResponse.json({ error: 'Access denied: You can only view your own assigned students.' }, { status: 403 });
      }

      rows = db.prepare(`
        SELECT students.*, users.name as counselorName 
        FROM students 
        LEFT JOIN users ON students.counselor_id = users.id 
        WHERE students.counselor_id = ? 
        ORDER BY students.createdAt DESC
      `).all(effectiveCounselorId);
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
      counselor_id: row.counselor_id,
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
    const user = await getAuthUser(req);
    if (!user && !isCloudEnv) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    const isSuperAdmin = user?.role === 'super_admin';

    if (isCloudDbEnabled()) {
      try {
        const ok = await cloudDeleteStudent(Number(id), user?.id ? Number(user.id) : 1, isSuperAdmin);
        if (!ok && !isSuperAdmin) {
          return NextResponse.json({ error: 'Student not found or access denied.' }, { status: 403 });
        }
        return NextResponse.json({ success: true });
      } catch (cloudErr) {
        console.warn('[CloudDB] Cloud delete fallback to local DB:', cloudErr);
      }
    }

    const db = getDb();

    if (isSuperAdmin) {
      const stmt = db.prepare('DELETE FROM students WHERE id = ?');
      stmt.run(id);
    } else if (user?.id) {
      // Counselors can only delete students assigned to their own account
      const stmt = db.prepare('DELETE FROM students WHERE id = ? AND counselor_id = ?');
      const result = stmt.run(id, Number(user.id));
      if (result && result.changes === 0) {
        return NextResponse.json({ error: 'Student not found or access denied.' }, { status: 403 });
      }
    } else {
      const stmt = db.prepare('DELETE FROM students WHERE id = ?');
      stmt.run(id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete student from DB:', error);
    return NextResponse.json({ error: 'Failed to delete student' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    let user = await getAuthUser(req);
    if (!user && !isCloudEnv) {
      user = { id: 1, name: 'Local Admin', username: 'localadmin', role: 'super_admin' };
    }

    const { id, studentSummary, studentDetails } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const isSuperAdmin = user?.role === 'super_admin' || (!user && !isCloudEnv);

    if (isCloudDbEnabled()) {
      try {
        const ok = await cloudUpdateStudent(Number(id), studentDetails, studentSummary, user?.id ? Number(user.id) : 1, isSuperAdmin);
        if (!ok && !isSuperAdmin) {
          return NextResponse.json({ error: 'Student record not found or access denied.' }, { status: 403 });
        }
        return NextResponse.json({ success: true });
      } catch (cloudErr) {
        console.warn('[CloudDB] Cloud patch fallback to local DB:', cloudErr);
      }
    }

    const db = getDb();

    if (studentDetails && typeof studentSummary === 'string') {
      const detailsStr = typeof studentDetails === 'string' ? studentDetails : JSON.stringify(studentDetails);
      let res: any;
      if (isSuperAdmin) {
        res = db.prepare('UPDATE students SET studentDetails = ?, studentSummary = ? WHERE id = ?').run(detailsStr, studentSummary, id);
      } else if (user?.id) {
        res = db.prepare('UPDATE students SET studentDetails = ?, studentSummary = ? WHERE id = ? AND counselor_id = ?').run(detailsStr, studentSummary, id, Number(user.id));
        if (res && res.changes === 0) {
          return NextResponse.json({ error: 'Student record not found or access denied.' }, { status: 403 });
        }
      } else {
        res = db.prepare('UPDATE students SET studentDetails = ?, studentSummary = ? WHERE id = ?').run(detailsStr, studentSummary, id);
      }
      return NextResponse.json({ success: true });
    }

    if (studentDetails) {
      const detailsStr = typeof studentDetails === 'string' ? studentDetails : JSON.stringify(studentDetails);
      let res: any;
      if (isSuperAdmin) {
        res = db.prepare('UPDATE students SET studentDetails = ? WHERE id = ?').run(detailsStr, id);
      } else if (user?.id) {
        res = db.prepare('UPDATE students SET studentDetails = ? WHERE id = ? AND counselor_id = ?').run(detailsStr, id, Number(user.id));
        if (res && res.changes === 0) {
          return NextResponse.json({ error: 'Student record not found or access denied.' }, { status: 403 });
        }
      } else {
        res = db.prepare('UPDATE students SET studentDetails = ? WHERE id = ?').run(detailsStr, id);
      }
      return NextResponse.json({ success: true });
    }

    if (typeof studentSummary === 'string') {
      if (isSuperAdmin) {
        const stmt = db.prepare('UPDATE students SET studentSummary = ? WHERE id = ?');
        stmt.run(studentSummary, id);
      } else if (user?.id) {
        const stmt = db.prepare('UPDATE students SET studentSummary = ? WHERE id = ? AND counselor_id = ?');
        const result = stmt.run(studentSummary, id, Number(user.id));
        if (result && result.changes === 0) {
          return NextResponse.json({ error: 'Student record not found or access denied.' }, { status: 403 });
        }
      } else {
        const stmt = db.prepare('UPDATE students SET studentSummary = ? WHERE id = ?');
        stmt.run(studentSummary, id);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update student in DB:', error);
    return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    let user = await getAuthUser(req);
    if (!user && !isCloudEnv) {
      user = { id: 1, name: 'Local Admin', username: 'localadmin', role: 'super_admin' };
    }

    const body = await req.json();
    const list = Array.isArray(body) ? body : [body];
    const isSuperAdmin = user?.role === 'super_admin';

    if (isCloudDbEnabled()) {
      try {
        const savedIds = await cloudSaveStudents(list, user?.id ? Number(user.id) : 1, isSuperAdmin);
        return NextResponse.json({ success: true, id: savedIds[0] ?? null, ids: savedIds });
      } catch (cloudErr) {
        console.warn('[CloudDB] Cloud post fallback to local DB:', cloudErr);
      }
    }

    const db = getDb();
    ensureTables(db);

    const upsertStmt = db.prepare(`
      INSERT INTO students (
        id, studentDetails, studentSummary, strengths, areasForImprovement,
        careerOpportunities, recommendedColleges, visaDifficulty,
        keySkillsIdentified, estimatedBudgetRange, counselor_id, comparisonData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        studentDetails = excluded.studentDetails,
        studentSummary = excluded.studentSummary,
        strengths = excluded.strengths,
        areasForImprovement = excluded.areasForImprovement,
        careerOpportunities = excluded.careerOpportunities,
        recommendedColleges = excluded.recommendedColleges,
        visaDifficulty = excluded.visaDifficulty,
        keySkillsIdentified = excluded.keySkillsIdentified,
        estimatedBudgetRange = excluded.estimatedBudgetRange,
        counselor_id = excluded.counselor_id,
        comparisonData = COALESCE(excluded.comparisonData, students.comparisonData),
        createdAt = CURRENT_TIMESTAMP
    `);

    const savedIds: number[] = [];

    for (const s of list) {
      if (!s || !s.studentDetails) continue;
      try {
        let targetCounselorId: number;
        if (isSuperAdmin) {
          targetCounselorId = Number(s.counselor_id || user?.id || 1);
        } else if (user?.id) {
          targetCounselorId = Number(user.id);
        } else {
          targetCounselorId = Number(s.counselor_id || 1);
        }

        let studentRecordId: number | null = null;
        if (s.id && Number(s.id) < 1000000000) {
          try {
            const exists = isSuperAdmin
              ? db.prepare('SELECT id FROM students WHERE id = ?').get(Number(s.id)) as any
              : db.prepare('SELECT id FROM students WHERE id = ? AND counselor_id = ?').get(Number(s.id), targetCounselorId) as any;
            if (exists?.id) studentRecordId = Number(exists.id);
          } catch (e) {}
        }

        // If not matched by valid primary key, look up by email or name scoped to counselor
        if (!studentRecordId) {
          try {
            const sDet = typeof s.studentDetails === 'string' ? JSON.parse(s.studentDetails) : s.studentDetails;
            if (sDet?.email && sDet.email !== 'Not Provided') {
              const existing = isSuperAdmin
                ? db.prepare("SELECT id FROM students WHERE json_extract(studentDetails, '$.email') = ? COLLATE NOCASE").get(sDet.email) as any
                : db.prepare("SELECT id FROM students WHERE json_extract(studentDetails, '$.email') = ? COLLATE NOCASE AND counselor_id = ?").get(sDet.email, targetCounselorId) as any;
              if (existing?.id) studentRecordId = Number(existing.id);
            }
            if (!studentRecordId && sDet?.name && sDet.name !== 'Unknown Student') {
              const existing = isSuperAdmin
                ? db.prepare("SELECT id FROM students WHERE json_extract(studentDetails, '$.name') = ? COLLATE NOCASE").get(sDet.name) as any
                : db.prepare("SELECT id FROM students WHERE json_extract(studentDetails, '$.name') = ? COLLATE NOCASE AND counselor_id = ?").get(sDet.name, targetCounselorId) as any;
              if (existing?.id) studentRecordId = Number(existing.id);
            }
          } catch (lookupErr) {}
        }

        const runResult = upsertStmt.run(
          studentRecordId,
          typeof s.studentDetails === 'string' ? s.studentDetails : JSON.stringify(s.studentDetails),
          s.studentSummary || '',
          typeof s.strengths === 'string' ? s.strengths : JSON.stringify(s.strengths || []),
          typeof s.areasForImprovement === 'string' ? s.areasForImprovement : JSON.stringify(s.areasForImprovement || []),
          typeof s.careerOpportunities === 'string' ? s.careerOpportunities : JSON.stringify(s.careerOpportunities || []),
          typeof s.recommendedColleges === 'string' ? s.recommendedColleges : JSON.stringify(s.recommendedColleges || []),
          s.visaDifficulty || '',
          typeof s.keySkillsIdentified === 'string' ? s.keySkillsIdentified : JSON.stringify(s.keySkillsIdentified || []),
          s.estimatedBudgetRange || '',
          targetCounselorId,
          s.comparisonData ? (typeof s.comparisonData === 'string' ? s.comparisonData : JSON.stringify(s.comparisonData)) : null
        );

        const effectiveId = studentRecordId || (runResult && runResult.lastInsertRowid ? Number(runResult.lastInsertRowid) : null);
        if (effectiveId) savedIds.push(effectiveId);
      } catch (err) {}
    }

    return NextResponse.json({ success: true, id: savedIds[0] ?? null, ids: savedIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
