import Database from 'better-sqlite3';
import path from 'path';

// Connect to or create a new SQLite database file
const dbPath = path.join(process.cwd(), 'students.db');
const db = new Database(dbPath);

// Initialize the database with a table if it doesn't exist
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

// Migration to add counselor_id to existing DB
try {
  db.exec('ALTER TABLE students ADD COLUMN counselor_id INTEGER DEFAULT 1;');
} catch (e) {
  // Column already exists, ignore
}

try {
  db.exec('ALTER TABLE users ADD COLUMN failedLoginAttempts INTEGER DEFAULT 0;');
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN lockoutUntil DATETIME;');
} catch (e) {}

export default db;

 
