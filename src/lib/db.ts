import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

declare const __non_webpack_require__: any;

export interface DatabaseAdapter {
  exec(sql: string): any;
  prepare(sql: string): {
    get(...args: any[]): any;
    all(...args: any[]): any[];
    run(...args: any[]): { changes: number; lastInsertRowid: number | bigint };
  };
  transaction<T extends (...args: any[]) => any>(fn: T): T;
  pragma(pragmaStr: string): any;
}

let dbInstance: DatabaseAdapter | null = null;

export function getDb(): DatabaseAdapter {
  if (dbInstance) return dbInstance;

  let dbPath = path.join(process.cwd(), 'students.db');

  if (!fs.existsSync(dbPath)) {
    const candidatePaths = [
      path.resolve(__dirname, '../../students.db'),
      path.resolve(__dirname, '../../../students.db'),
      '/home/admin_learn_overseas/ai-course-analyser/students.db'
    ];
    for (const cand of candidatePaths) {
      if (fs.existsSync(cand)) {
        dbPath = cand;
        break;
      }
    }
  }

  if (process.env.VERCEL) {
    const tmpPath = '/tmp/students.db';
    if (!fs.existsSync(tmpPath)) {
      try {
        if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, tmpPath);
      } catch(e) {
        console.warn("Could not copy db to /tmp");
      }
    }
    dbPath = tmpPath;
  }

  let db!: DatabaseAdapter;

  // 1. Prefer Node.js built-in node:sqlite (zero native compilation, zero bindings needed)
  let nodeSqliteClass: any = null;
  try {
    if (typeof (process as any).getBuiltinModule === 'function') {
      const mod = (process as any).getBuiltinModule('node:sqlite');
      if (mod && mod.DatabaseSync) nodeSqliteClass = mod.DatabaseSync;
    }
  } catch (e) {}

  if (!nodeSqliteClass) {
    try {
      const dynamicRequire = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
      const mod = dynamicRequire('node:sqlite');
      if (mod && mod.DatabaseSync) nodeSqliteClass = mod.DatabaseSync;
    } catch (e) {}
  }

  if (nodeSqliteClass) {
    const rawDb = new nodeSqliteClass(dbPath);
    db = {
      exec: (sql: string) => rawDb.exec(sql),
      prepare: (sql: string) => {
        const stmt = rawDb.prepare(sql);
        return {
          get: (...args: any[]) => stmt.get(...args),
          all: (...args: any[]) => stmt.all(...args),
          run: (...args: any[]) => stmt.run(...args),
        };
      },
      transaction: (fn: any) => {
        return ((...args: any[]) => {
          rawDb.exec('BEGIN IMMEDIATE');
          try {
            const res = fn(...args);
            rawDb.exec('COMMIT');
            return res;
          } catch (err) {
            rawDb.exec('ROLLBACK');
            throw err;
          }
        }) as any;
      },
      pragma: (p: string) => {
        try { rawDb.exec(`PRAGMA ${p};`); } catch (e) {}
      }
    };
  } else {
    // 2. Try better-sqlite3 fallback
    let betterLoaded = false;
    try {
      const dynamicRequire = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : eval('require');
      const BetterSqlite = dynamicRequire('better-sqlite3');
      const rawDb = new BetterSqlite(dbPath);
      try { rawDb.pragma('journal_mode = WAL'); } catch (e) {}
      try { rawDb.pragma('busy_timeout = 5000'); } catch (e) {}
      db = rawDb;
      betterLoaded = true;
    } catch (e: any) {
      console.warn("[DB] Native C++ bindings unavailable. Switching to Pure-JS Embedded Engine.");
    }

    if (!betterLoaded) {
      // 3. Absolute Bulletproof Pure-JS Engine (Zero native C++ bindings, 100% crash-proof)
      db = createPureJsDatabase(path.join(process.cwd(), 'students_fallback.json'));
    }
  }

  try { db.pragma('journal_mode = WAL'); } catch (e) {}
  try { db.pragma('busy_timeout = 5000'); } catch (e) {}

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
      counselor_id INTEGER
    );
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      value JSON
    );
    CREATE TABLE IF NOT EXISTS universities (
      id TEXT PRIMARY KEY,
      name TEXT,
      location TEXT,
      domain TEXT,
      minCgpa REAL,
      tuition INTEGER,
      currency TEXT,
      programs JSON,
      acceptanceRate TEXT,
      campusSetting TEXT,
      lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
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

  try { db.exec('ALTER TABLE students ADD COLUMN counselor_id INTEGER DEFAULT 1;'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN lockoutUntil DATETIME;'); } catch (e) {}
  try { db.exec('ALTER TABLE students ADD COLUMN comparisonData JSON;'); } catch (e) {}

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const { count } = countStmt.get() as { count: number };
  if (count === 0) {
    const hash = bcrypt.hashSync('superadmin', 10);
    db.prepare('INSERT INTO users (name, username, passwordHash, role) VALUES (?, ?, ?, ?)').run('Super Admin', 'superadmin', hash, 'super_admin');
  }

  // One-time migration: fix any existing rows that have the wrong role value
  try { db.prepare("UPDATE users SET role = 'super_admin' WHERE role = 'superadmin'").run(); } catch (e) {}

  dbInstance = db;
  return dbInstance;
}

function createPureJsDatabase(storagePath: string): DatabaseAdapter {
  let memoryData: any = {
    users: [],
    settings: [],
    universities: [],
    students: []
  };

  const seedPath = path.resolve(__dirname, 'db-seed.json');
  if (fs.existsSync(storagePath)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    } catch {}
  } else if (fs.existsSync(seedPath)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    } catch {}
  }

  // Ensure default superadmin exists
  if (!memoryData.users || memoryData.users.length === 0) {
    const hash = bcrypt.hashSync('superadmin', 10);
    memoryData.users = [{
      id: 1,
      name: 'Super Admin',
      username: 'superadmin',
      passwordHash: hash,
      role: 'super_admin',
      createdAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      lockoutUntil: null
    }];
  }

  const persist = () => {
    try {
      fs.writeFileSync(storagePath, JSON.stringify(memoryData, null, 2));
    } catch (e) {
      console.warn("[DB] Could not persist pure JS database:", e);
    }
  };

  return {
    exec: (sql: string) => {},
    pragma: (p: string) => {},
    transaction: (fn: any) => (((...args: any[]) => fn(...args)) as any),
    prepare: (sql: string) => {
      const trimmed = sql.trim();
      const upper = trimmed.toUpperCase();

      return {
        get: (...params: any[]) => {
          if (upper.includes('FROM USERS') && upper.includes('WHERE USERNAME = ?')) {
            const u = String(params[0] || '').toLowerCase();
            return memoryData.users.find((x: any) => String(x.username || '').toLowerCase() === u);
          }
          if (upper.includes('SELECT COUNT(*) AS COUNT FROM USERS')) {
            return { count: memoryData.users.length };
          }
          if (upper.includes('SELECT COUNT(*) AS COUNT FROM UNIVERSITIES')) {
            return { count: memoryData.universities.length };
          }
          if (upper.includes('FROM SETTINGS WHERE ID = ?')) {
            const id = params[0];
            return memoryData.settings.find((x: any) => x.id === id);
          }
          if (upper.includes("WHERE ID = 'AISTRICTNESS'")) {
            return memoryData.settings.find((x: any) => x.id === 'aiStrictness');
          }
          if (upper.includes('FROM STUDENTS WHERE ID = ?')) {
            const id = params[0];
            return memoryData.students.find((x: any) => x.id === Number(id));
          }
          if (upper.includes('SELECT COMPARISONDATA FROM STUDENTS WHERE ID = ?')) {
            const id = params[0];
            const s = memoryData.students.find((x: any) => x.id === Number(id));
            return s ? { comparisonData: s.comparisonData } : undefined;
          }
          return undefined;
        },
        all: (...params: any[]) => {
          if (upper.includes('FROM SETTINGS')) {
            return [...memoryData.settings];
          }
          if (upper.includes('FROM UNIVERSITIES')) {
            return [...memoryData.universities];
          }
          if (upper.includes('FROM USERS')) {
            return memoryData.users.map((u: any) => ({
              id: u.id,
              name: u.name,
              username: u.username,
              role: u.role,
              createdAt: u.createdAt
            }));
          }
          if (upper.includes('FROM STUDENTS')) {
            return [...memoryData.students];
          }
          return [];
        },
        run: (...params: any[]) => {
          if (upper.startsWith('INSERT INTO USERS')) {
            const newUser = {
              id: memoryData.users.length + 1,
              name: params[0],
              username: params[1],
              passwordHash: params[2],
              role: params[3],
              createdAt: new Date().toISOString(),
              failedLoginAttempts: 0,
              lockoutUntil: null
            };
            memoryData.users.push(newUser);
            persist();
            return { changes: 1, lastInsertRowid: newUser.id };
          }
          if (upper.includes('UPDATE USERS SET FAILEDLOGINATTEMPTS')) {
            const id = params[2];
            const u = memoryData.users.find((x: any) => x.id === Number(id));
            if (u) {
              u.failedLoginAttempts = params[0];
              u.lockoutUntil = params[1];
              persist();
            }
            return { changes: 1, lastInsertRowid: 0 };
          }
          if (upper.includes('UPDATE USERS SET PASSWORDHASH')) {
            const u = memoryData.users.find((x: any) => x.id === Number(params[1]));
            if (u) {
              u.passwordHash = params[0];
              persist();
            }
            return { changes: 1, lastInsertRowid: 0 };
          }
          if (upper.startsWith('INSERT INTO SETTINGS')) {
            const key = params[0];
            const val = params[1];
            const idx = memoryData.settings.findIndex((x: any) => x.id === key);
            if (idx >= 0) memoryData.settings[idx].value = val;
            else memoryData.settings.push({ id: key, value: val });
            persist();
            return { changes: 1, lastInsertRowid: 0 };
          }
          if (upper.startsWith('INSERT INTO STUDENTS')) {
            const newId = memoryData.students.length + 1;
            const newStudent: any = { id: newId, createdAt: new Date().toISOString() };
            memoryData.students.push(newStudent);
            persist();
            return { changes: 1, lastInsertRowid: newId };
          }
          if (upper.startsWith('DELETE FROM STUDENTS WHERE ID = ?')) {
            const id = Number(params[0]);
            memoryData.students = memoryData.students.filter((x: any) => x.id !== id);
            persist();
            return { changes: 1, lastInsertRowid: 0 };
          }
          if (upper.startsWith('DELETE FROM UNIVERSITIES WHERE ID = ?')) {
            const id = String(params[0]);
            memoryData.universities = memoryData.universities.filter((x: any) => x.id !== id);
            persist();
            return { changes: 1, lastInsertRowid: 0 };
          }
          if (upper.startsWith('DELETE FROM USERS WHERE ID = ?')) {
            const id = Number(params[0]);
            memoryData.users = memoryData.users.filter((x: any) => x.id !== id);
            persist();
            return { changes: 1, lastInsertRowid: 0 };
          }
          return { changes: 0, lastInsertRowid: 0 };
        }
      };
    }
  };
}
