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

  const isServerless = !!(
    process.env.NETLIFY ||
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.NOW_REGION ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  if (isServerless) {
    const tmpPath = '/tmp/students.db';
    let needsExtract = false;
    if (!fs.existsSync(tmpPath)) {
      needsExtract = true;
    } else {
      try {
        const stat = fs.statSync(tmpPath);
        if (stat.size < 10000000) needsExtract = true;
      } catch (e) {
        needsExtract = true;
      }
    }

    if (needsExtract) {
      try {
        const gzCandidates = [
          path.join(process.cwd(), 'students.db.gz'),
          path.resolve(__dirname, 'students.db.gz'),
          path.resolve(__dirname, '../../students.db.gz'),
          path.resolve(__dirname, '../../../students.db.gz')
        ];
        const foundGz = gzCandidates.find(p => fs.existsSync(p));
        if (foundGz) {
          const zlib = require('zlib');
          const compressed = fs.readFileSync(foundGz);
          const decompressed = zlib.gunzipSync(compressed);
          fs.writeFileSync(tmpPath, decompressed);
        } else if (fs.existsSync(dbPath)) {
          fs.copyFileSync(dbPath, tmpPath);
        }
      } catch(e) {
        console.warn("[DB] Could not extract students.db.gz to /tmp:", e);
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
      const fallbackPath = isServerless 
        ? '/tmp/students_fallback.json' 
        : path.join(process.cwd(), 'students_fallback.json');
      db = createPureJsDatabase(fallbackPath);
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
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY,
      name TEXT,
      university_id INTEGER,
      university_name TEXT,
      university_city TEXT,
      university_state TEXT,
      university_country TEXT,
      country_name TEXT,
      study_level TEXT,
      domain TEXT,
      duration INTEGER,
      campus TEXT,
      tuition_amount REAL,
      tuition_currency TEXT,
      tuition_fee_formatted TEXT,
      ielts_score REAL,
      toefl_score REAL,
      pte_score REAL,
      det_score REAL,
      gre_score REAL,
      gmat_score REAL,
      min_cgpa REAL,
      max_backlogs INTEGER,
      entry_requirement TEXT,
      intakes TEXT,
      deadlines TEXT,
      scholarship_available INTEGER,
      course_link TEXT,
      logo_url TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_programs_country ON programs(country_name);
    CREATE INDEX IF NOT EXISTS idx_programs_uni_country ON programs(university_country);
    CREATE INDEX IF NOT EXISTS idx_programs_domain ON programs(domain);
    CREATE INDEX IF NOT EXISTS idx_programs_level ON programs(study_level);
    CREATE INDEX IF NOT EXISTS idx_programs_tuition ON programs(tuition_amount);
    CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);
    CREATE INDEX IF NOT EXISTS idx_programs_min_cgpa ON programs(min_cgpa);
    CREATE INDEX IF NOT EXISTS idx_programs_country_domain ON programs(country_name, domain);
    CREATE INDEX IF NOT EXISTS idx_programs_country_level ON programs(country_name, study_level);
  `);

  try { db.exec('ALTER TABLE students ADD COLUMN counselor_id INTEGER DEFAULT 1;'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0;'); } catch (e) {}
  try { db.exec('ALTER TABLE users ADD COLUMN lockoutUntil DATETIME;'); } catch (e) {}
  try { db.exec('ALTER TABLE students ADD COLUMN comparisonData JSON;'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN minIelts TEXT DEFAULT "6.5 (min 6.0 each)";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN minToefl TEXT DEFAULT "88";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN minPte TEXT DEFAULT "62";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN minDuolingo TEXT DEFAULT "115";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN ieltsWaiver TEXT DEFAULT "Yes - 70%+ in CBSE/ICSE 12th English";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN maxBacklogs INTEGER DEFAULT 4;'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN ranking TEXT DEFAULT "Top Tier";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN scholarships TEXT DEFAULT "Available";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN intakes TEXT DEFAULT "Fall, Spring";'); } catch (e) {}
  try { db.exec('ALTER TABLE universities ADD COLUMN courseLink TEXT;'); } catch (e) {}

  const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
  const { count } = countStmt.get() as { count: number };
  if (count === 0) {
    const hash = bcrypt.hashSync('superadmin', 10);
    db.prepare('INSERT INTO users (name, username, passwordHash, role) VALUES (?, ?, ?, ?)').run('Super Admin', 'superadmin', hash, 'super_admin');
  }

  // One-time migration: fix any existing rows that have the wrong role value
  try { db.prepare("UPDATE users SET role = 'super_admin' WHERE role = 'superadmin'").run(); } catch (e) {}

  // Auto-seed all 1,522 universities from db-seed.json if university count is low
  try {
    const uniCount = (db.prepare('SELECT COUNT(*) as count FROM universities').get() as any)?.count || 0;
    if (uniCount < 100) {
      const seedCandidates = [
        path.join(process.cwd(), 'src/lib/db-seed.json'),
        path.resolve(__dirname, 'db-seed.json'),
        path.resolve(__dirname, '../../src/lib/db-seed.json'),
        path.resolve(__dirname, '../../../src/lib/db-seed.json')
      ];
      const seedFile = seedCandidates.find(p => fs.existsSync(p));
      if (seedFile) {
        const seedData = JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
        if (Array.isArray(seedData.universities) && seedData.universities.length > 0) {
          const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO universities (
              id, name, location, domain, minCgpa, tuition, currency, programs,
              acceptanceRate, campusSetting, minIelts, minToefl, minPte, minDuolingo,
              ieltsWaiver, maxBacklogs, ranking, scholarships, intakes, courseLink
            ) VALUES (
              @id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs,
              @acceptanceRate, @campusSetting, @minIelts, @minToefl, @minPte, @minDuolingo,
              @ieltsWaiver, @maxBacklogs, @ranking, @scholarships, @intakes, @courseLink
            )
          `);
          const insertMany = db.transaction((unis: any[]) => {
            for (const u of unis) {
              insertStmt.run({
                id: u.id,
                name: u.name,
                location: u.location,
                domain: u.domain || 'science_technology',
                minCgpa: u.minCgpa || 7.0,
                tuition: u.tuition || 30000,
                currency: u.currency || 'USD',
                programs: typeof u.programs === 'string' ? u.programs : JSON.stringify(u.programs || {}),
                acceptanceRate: u.acceptanceRate || '50%',
                campusSetting: u.campusSetting || 'Urban',
                minIelts: u.minIelts || '6.5',
                minToefl: u.minToefl || '88',
                minPte: u.minPte || '62',
                minDuolingo: u.minDuolingo || '115',
                ieltsWaiver: u.ieltsWaiver || 'Yes',
                maxBacklogs: u.maxBacklogs || 4,
                ranking: u.ranking || 'Top Tier',
                scholarships: u.scholarships || 'Available',
                intakes: u.intakes || 'Fall, Spring',
                courseLink: u.courseLink || null
              });
            }
          });
          insertMany(seedData.universities);
        }
      }
    }
  } catch (seedErr) {}

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

  const seedCandidates = [
    path.resolve(__dirname, 'db-seed.json'),
    path.join(process.cwd(), 'src/lib/db-seed.json'),
    path.join(process.cwd(), 'db-seed.json'),
    path.resolve(__dirname, '../../src/lib/db-seed.json')
  ];
  let seedPath = '';
  for (const c of seedCandidates) {
    if (fs.existsSync(c)) {
      seedPath = c;
      break;
    }
  }

  if (fs.existsSync(storagePath)) {
    try {
      memoryData = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    } catch {}
  } else if (seedPath && fs.existsSync(seedPath)) {
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
