import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

let embeddedSeed: any = null;
try {
  embeddedSeed = require('./db-seed.json');
} catch (e) {
  try {
    embeddedSeed = require('../lib/db-seed.json');
  } catch (e2) {}
}

let poolInstance: Pool | null = null;
let tablesInitialized = false;

export function getCloudDbConnectionString(): string {
  const url = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL ||
    ''
  ).trim();
  return url;
}

export function isCloudDbEnabled(): boolean {
  const connStr = getCloudDbConnectionString();
  return !!connStr && connStr.startsWith('postgres');
}

export function getCloudPool(): Pool | null {
  if (!isCloudDbEnabled()) return null;
  if (poolInstance) return poolInstance;

  const connectionString = getCloudDbConnectionString();
  try {
    poolInstance = new Pool({
      connectionString,
      ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      idleTimeoutMillis: 30000,
      max: 10
    });

    poolInstance.on('error', (err) => {
      console.warn('[CloudDB] Pool client error notice:', err.message);
    });

    return poolInstance;
  } catch (err: any) {
    console.error('[CloudDB] Failed to instantiate PostgreSQL pool:', err.message);
    return null;
  }
}

export async function initCloudDb(): Promise<boolean> {
  if (tablesInitialized) return true;
  const pool = getCloudPool();
  if (!pool) return false;

  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT,
          username TEXT UNIQUE,
          password_hash TEXT,
          role TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          failed_login_attempts INT DEFAULT 0,
          lockout_until TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          value JSONB
        );

        CREATE TABLE IF NOT EXISTS students (
          id SERIAL PRIMARY KEY,
          student_details JSONB,
          student_summary TEXT,
          strengths JSONB,
          areas_for_improvement JSONB,
          career_opportunities JSONB,
          recommended_colleges JSONB,
          visa_difficulty TEXT,
          key_skills_identified JSONB,
          estimated_budget_range TEXT,
          counselor_id INT,
          comparison_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_pg_students_cid ON students(counselor_id);
        CREATE INDEX IF NOT EXISTS idx_pg_students_created ON students(created_at DESC);
      `);

      // Seed default accounts if users table is empty
      const userCountRes = await client.query('SELECT COUNT(*) as count FROM users');
      const count = parseInt(userCountRes.rows[0]?.count || '0', 10);
      if (count === 0) {
        let seedUsers = embeddedSeed?.users || [];
        if (!seedUsers || seedUsers.length === 0) {
          const hash = await bcrypt.hash('superadmin', 10);
          seedUsers = [
            { name: 'Super Admin', username: 'superadmin', passwordHash: hash, role: 'super_admin' },
            { name: 'Vibha', username: 'vibha', passwordHash: hash, role: 'counselor' },
            { name: 'Darshan', username: 'darshan', passwordHash: hash, role: 'counselor' }
          ];
        }

        for (const u of seedUsers) {
          const pHash = u.passwordHash || (await bcrypt.hash('password123', 10));
          await client.query(`
            INSERT INTO users (name, username, password_hash, role)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
          `, [u.name, u.username.toLowerCase(), pHash, u.role]);
        }
        console.log(`[CloudDB] Seeded ${seedUsers.length} accounts into Cloud PostgreSQL.`);
      }

      tablesInitialized = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[CloudDB] Initialization error:', err.message);
    return false;
  }
}

export async function getCloudDbStatus(): Promise<{ connected: boolean; provider: string; error?: string }> {
  if (!isCloudDbEnabled()) {
    return { connected: false, provider: 'Local Embedded SQLite' };
  }
  const pool = getCloudPool();
  if (!pool) {
    return { connected: false, provider: 'Cloud PostgreSQL (Not configured)' };
  }
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return { connected: true, provider: 'Centralized Cloud PostgreSQL' };
    } finally {
      client.release();
    }
  } catch (err: any) {
    return { connected: false, provider: 'Centralized Cloud PostgreSQL', error: err.message };
  }
}

export async function cloudGetStudents(counselorId: number | null, isSuperAdmin: boolean): Promise<any[]> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return [];

  let query = '';
  let params: any[] = [];

  if (isSuperAdmin) {
    if (counselorId && !isNaN(counselorId)) {
      query = `
        SELECT s.*, u.name as "counselorName"
        FROM students s
        LEFT JOIN users u ON s.counselor_id = u.id
        WHERE s.counselor_id = $1
        ORDER BY s.created_at DESC
      `;
      params = [counselorId];
    } else {
      query = `
        SELECT s.*, u.name as "counselorName"
        FROM students s
        LEFT JOIN users u ON s.counselor_id = u.id
        ORDER BY s.created_at DESC
      `;
    }
  } else {
    query = `
      SELECT s.*, u.name as "counselorName"
      FROM students s
      LEFT JOIN users u ON s.counselor_id = u.id
      WHERE s.counselor_id = $1
      ORDER BY s.created_at DESC
    `;
    params = [counselorId || 1];
  }

  const res = await pool.query(query, params);
  return res.rows.map(row => ({
    id: row.id,
    studentDetails: typeof row.student_details === 'string' ? JSON.parse(row.student_details) : (row.student_details || {}),
    studentSummary: row.student_summary || '',
    strengths: typeof row.strengths === 'string' ? JSON.parse(row.strengths) : (row.strengths || []),
    areasForImprovement: typeof row.areas_for_improvement === 'string' ? JSON.parse(row.areas_for_improvement) : (row.areas_for_improvement || []),
    careerOpportunities: typeof row.career_opportunities === 'string' ? JSON.parse(row.career_opportunities) : (row.career_opportunities || []),
    recommendedColleges: typeof row.recommended_colleges === 'string' ? JSON.parse(row.recommended_colleges) : (row.recommended_colleges || []),
    visaDifficulty: row.visa_difficulty || '',
    keySkillsIdentified: typeof row.key_skills_identified === 'string' ? JSON.parse(row.key_skills_identified) : (row.key_skills_identified || []),
    estimatedBudgetRange: row.estimated_budget_range || '',
    createdAt: row.created_at,
    counselor_id: row.counselor_id,
    counselorName: row.counselorName || 'Unknown Counselor',
    comparisonData: typeof row.comparison_data === 'string' ? JSON.parse(row.comparison_data) : (row.comparison_data || [])
  }));
}

export async function cloudSaveStudents(list: any[], userCounselorId: number, isSuperAdmin: boolean): Promise<number[]> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return [];

  const savedIds: number[] = [];

  for (const s of list) {
    if (!s || !s.studentDetails) continue;
    try {
      const targetCid = isSuperAdmin ? Number(s.counselor_id || userCounselorId || 1) : Number(userCounselorId);
      const sDetails = typeof s.studentDetails === 'string' ? JSON.parse(s.studentDetails) : s.studentDetails;

      let studentId: number | null = null;
      if (s.id && Number(s.id) < 1000000000) {
        const idCheck = isSuperAdmin
          ? await pool.query('SELECT id FROM students WHERE id = $1', [Number(s.id)])
          : await pool.query('SELECT id FROM students WHERE id = $1 AND counselor_id = $2', [Number(s.id), targetCid]);
        if (idCheck.rows.length > 0) studentId = idCheck.rows[0].id;
      }

      if (!studentId && sDetails?.email && sDetails.email !== 'Not Provided') {
        const emailCheck = isSuperAdmin
          ? await pool.query("SELECT id FROM students WHERE LOWER(student_details->>'email') = LOWER($1)", [sDetails.email.trim()])
          : await pool.query("SELECT id FROM students WHERE LOWER(student_details->>'email') = LOWER($1) AND counselor_id = $2", [sDetails.email.trim(), targetCid]);
        if (emailCheck.rows.length > 0) studentId = emailCheck.rows[0].id;
      }

      if (!studentId && sDetails?.name && sDetails.name !== 'Unknown Student') {
        const nameCheck = isSuperAdmin
          ? await pool.query("SELECT id FROM students WHERE LOWER(student_details->>'name') = LOWER($1)", [sDetails.name.trim()])
          : await pool.query("SELECT id FROM students WHERE LOWER(student_details->>'name') = LOWER($1) AND counselor_id = $2", [sDetails.name.trim(), targetCid]);
        if (nameCheck.rows.length > 0) studentId = nameCheck.rows[0].id;
      }

      if (studentId) {
        await pool.query(`
          UPDATE students SET
            student_details = $1,
            student_summary = $2,
            strengths = $3,
            areas_for_improvement = $4,
            career_opportunities = $5,
            recommended_colleges = $6,
            visa_difficulty = $7,
            key_skills_identified = $8,
            estimated_budget_range = $9,
            counselor_id = $10,
            comparison_data = COALESCE($11, comparison_data),
            created_at = CURRENT_TIMESTAMP
          WHERE id = $12
        `, [
          JSON.stringify(sDetails),
          s.studentSummary || '',
          JSON.stringify(s.strengths || []),
          JSON.stringify(s.areasForImprovement || []),
          JSON.stringify(s.careerOpportunities || []),
          JSON.stringify(s.recommendedColleges || []),
          s.visaDifficulty || '',
          JSON.stringify(s.keySkillsIdentified || []),
          s.estimatedBudgetRange || '',
          targetCid,
          s.comparisonData ? JSON.stringify(s.comparisonData) : null,
          studentId
        ]);
        savedIds.push(studentId);
      } else {
        const insertRes = await pool.query(`
          INSERT INTO students (
            student_details, student_summary, strengths, areas_for_improvement,
            career_opportunities, recommended_colleges, visa_difficulty,
            key_skills_identified, estimated_budget_range, counselor_id, comparison_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `, [
          JSON.stringify(sDetails),
          s.studentSummary || '',
          JSON.stringify(s.strengths || []),
          JSON.stringify(s.areasForImprovement || []),
          JSON.stringify(s.careerOpportunities || []),
          JSON.stringify(s.recommendedColleges || []),
          s.visaDifficulty || '',
          JSON.stringify(s.keySkillsIdentified || []),
          s.estimatedBudgetRange || '',
          targetCid,
          s.comparisonData ? JSON.stringify(s.comparisonData) : null
        ]);
        if (insertRes.rows[0]?.id) savedIds.push(insertRes.rows[0].id);
      }
    } catch (e: any) {
      console.error('[CloudDB] Failed to upsert student record:', e.message);
    }
  }

  return savedIds;
}

export async function cloudSaveStudent(analysis: any, counselorId: number, isSuperAdmin: boolean): Promise<number> {
  const ids = await cloudSaveStudents([analysis], counselorId, isSuperAdmin);
  return ids[0] || 0;
}

export async function cloudUpdateStudent(
  id: number,
  details: any,
  summary: string | undefined,
  counselorId: number,
  isSuperAdmin: boolean
): Promise<boolean> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return false;

  let query = '';
  let params: any[] = [];

  if (details && typeof summary === 'string') {
    if (isSuperAdmin) {
      query = `UPDATE students SET student_details = $1, student_summary = $2 WHERE id = $3`;
      params = [JSON.stringify(details), summary, id];
    } else {
      query = `UPDATE students SET student_details = $1, student_summary = $2 WHERE id = $3 AND counselor_id = $4`;
      params = [JSON.stringify(details), summary, id, counselorId];
    }
  } else if (details) {
    if (isSuperAdmin) {
      query = `UPDATE students SET student_details = $1 WHERE id = $2`;
      params = [JSON.stringify(details), id];
    } else {
      query = `UPDATE students SET student_details = $1 WHERE id = $2 AND counselor_id = $3`;
      params = [JSON.stringify(details), id, counselorId];
    }
  } else if (typeof summary === 'string') {
    if (isSuperAdmin) {
      query = `UPDATE students SET student_summary = $1 WHERE id = $2`;
      params = [summary, id];
    } else {
      query = `UPDATE students SET student_summary = $1 WHERE id = $2 AND counselor_id = $3`;
      params = [summary, id, counselorId];
    }
  } else {
    return false;
  }

  const res = await pool.query(query, params);
  return (res.rowCount || 0) > 0;
}

export async function cloudDeleteStudent(id: number, counselorId: number, isSuperAdmin: boolean): Promise<boolean> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return false;

  const query = isSuperAdmin
    ? 'DELETE FROM students WHERE id = $1'
    : 'DELETE FROM students WHERE id = $1 AND counselor_id = $2';
  const params = isSuperAdmin ? [id] : [id, counselorId];

  const res = await pool.query(query, params);
  return (res.rowCount || 0) > 0;
}

export async function cloudSaveComparison(
  targetStudentId: number,
  analysis: any,
  destinationCountry: string,
  counselorId: number,
  isSuperAdmin: boolean
): Promise<any[]> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return [];

  const query = isSuperAdmin
    ? 'SELECT id, comparison_data FROM students WHERE id = $1'
    : 'SELECT id, comparison_data FROM students WHERE id = $1 AND counselor_id = $2';
  const params = isSuperAdmin ? [targetStudentId] : [targetStudentId, counselorId];

  const check = await pool.query(query, params);
  if (check.rows.length === 0) return [];

  let compareArray: any[] = [];
  const rawComp = check.rows[0].comparison_data;
  if (rawComp) {
    compareArray = typeof rawComp === 'string' ? JSON.parse(rawComp) : rawComp;
  }
  if (!Array.isArray(compareArray)) compareArray = [];

  compareArray = compareArray.filter((c: any) => c.compareCountry !== destinationCountry);
  compareArray.push({
    compareCountry: destinationCountry,
    studentDetails: analysis.studentDetails,
    studentSummary: analysis.studentSummary,
    strengths: analysis.strengths,
    areasForImprovement: analysis.areasForImprovement,
    careerOpportunities: analysis.careerOpportunities,
    recommendedColleges: analysis.recommendedColleges,
    visaDifficulty: analysis.visaDifficulty,
    keySkillsIdentified: analysis.keySkillsIdentified,
    estimatedBudgetRange: analysis.estimatedBudgetRange,
  });

  await pool.query('UPDATE students SET comparison_data = $1 WHERE id = $2', [
    JSON.stringify(compareArray),
    targetStudentId
  ]);

  return compareArray;
}

export async function cloudGetUser(username: string): Promise<any | null> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return null;

  const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username.trim()]);
  if (res.rows.length === 0) return null;
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
    failedLoginAttempts: row.failed_login_attempts || 0,
    lockoutUntil: row.lockout_until
  };
}

export async function cloudGetUsers(): Promise<any[]> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return [];

  const res = await pool.query('SELECT id, name, username, role, created_at as "createdAt" FROM users ORDER BY id ASC');
  return res.rows;
}

export async function cloudCreateUser(name: string, username: string, passwordHash: string, role: string): Promise<any> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return null;

  const res = await pool.query(`
    INSERT INTO users (name, username, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, username, role, created_at as "createdAt"
  `, [name, username.toLowerCase(), passwordHash, role]);

  return res.rows[0];
}

export async function cloudDeleteUser(id: number): Promise<boolean> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return false;

  const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
  return (res.rowCount || 0) > 0;
}

export async function cloudUpdateUserLoginAttempts(id: number, attempts: number, lockoutUntil: string | null): Promise<void> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return;

  await pool.query('UPDATE users SET failed_login_attempts = $1, lockout_until = $2 WHERE id = $3', [
    attempts,
    lockoutUntil,
    id
  ]);
}

export async function cloudResetUserPassword(id: number, passwordHash: string): Promise<void> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return;

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

export async function cloudGetSettings(): Promise<Record<string, any>> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return {};

  const res = await pool.query('SELECT id, value FROM settings');
  const settings: Record<string, any> = {};
  for (const row of res.rows) {
    settings[row.id] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
  }
  return settings;
}

export async function cloudSaveSetting(id: string, value: any): Promise<void> {
  await initCloudDb();
  const pool = getCloudPool();
  if (!pool) return;

  await pool.query(`
    INSERT INTO settings (id, value)
    VALUES ($1, $2)
    ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value
  `, [id, JSON.stringify(value)]);
}
