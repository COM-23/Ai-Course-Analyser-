/**
 * Cloud PostgreSQL Migration & Seeder
 * Connects to Cloud PostgreSQL (Neon / Supabase) via DATABASE_URL
 * Creates tables and streams all programs from programs.csv + universities
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { Pool } = require('pg');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('[ERROR] DATABASE_URL environment variable is missing.');
  console.error('Usage: DATABASE_URL="postgresql://user:pass@host/db?sslmode=require" node scripts/seed-cloud-postgres.js');
  process.exit(1);
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

function parseCSVLine(text) {
  let row = [""];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      row.push("");
    } else {
      row[row.length - 1] += c;
    }
  }
  return row;
}

function classifyDomain(courseName) {
  const n = (courseName || "").toLowerCase();
  if (/agri|crop|soil|horticult|plant|veterin|animal science|forestry|agronomy/i.test(n)) return "agricultural_sciences";
  if (/comput|data|softw|artifici|intelligen|cyber|robot|engineer|physic|chemis|mathem|biotech|bioinform|technol|aerospace|mechanic|electr|civil|inform/i.test(n)) return "science_technology";
  if (/m\.?b\.?a|business|manag|financ|account|market|econom|commerc|entrepreneur|bank|logist|supply chain/i.test(n)) return "commerce_management";
  if (/medicin|nurs|pharmac|dent|public health|health|biomed|kinesiol|physiotherap|anatom|pathol/i.test(n)) return "medicine_allied_health";
  if (/law|legal|crimin|counsel|criminol|juris/i.test(n)) return "law";
  if (/educat|pedagog|teach|curricul/i.test(n)) return "education";
  if (/hotel|hospit|tourism|culin|event|leisure/i.test(n)) return "hospitality_tourism_events";
  if (/film|drama|music|theat|acting|dance|animat|media|journalis|design|art|photograph/i.test(n)) return "performing_arts_media";
  if (/philosoph|histor|linguist|literat|sociol|polit|psychol|social|anthrop/i.test(n)) return "arts_humanities_social_sciences";
  return "science_technology";
}

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('========================================================');
    console.log('  LEARN OVERSEAS - CLOUD POSTGRESQL INITIALIZER');
    console.log('========================================================\n');

    console.log('[1/4] Creating database schema in Cloud PostgreSQL...');
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

      CREATE TABLE IF NOT EXISTS universities (
        id TEXT PRIMARY KEY,
        name TEXT,
        location TEXT,
        domain TEXT,
        min_cgpa DOUBLE PRECISION,
        tuition INT,
        currency TEXT,
        programs JSONB,
        acceptance_rate TEXT,
        campus_setting TEXT,
        min_ielts TEXT DEFAULT '6.5 (min 6.0 each)',
        min_toefl TEXT DEFAULT '88',
        min_pte TEXT DEFAULT '62',
        min_duolingo TEXT DEFAULT '115',
        ielts_waiver TEXT DEFAULT 'Yes - 70%+ in CBSE/ICSE 12th English',
        max_backlogs INT DEFAULT 4,
        ranking TEXT DEFAULT 'Top Tier',
        scholarships TEXT DEFAULT 'Available',
        intakes TEXT DEFAULT 'Fall, Spring',
        course_link TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS programs (
        id INT PRIMARY KEY,
        name TEXT,
        university_id INT,
        university_name TEXT,
        university_city TEXT,
        university_state TEXT,
        university_country TEXT,
        country_name TEXT,
        study_level TEXT,
        domain TEXT,
        duration INT,
        campus TEXT,
        tuition_amount DOUBLE PRECISION,
        tuition_currency TEXT,
        tuition_fee_formatted TEXT,
        ielts_score DOUBLE PRECISION,
        toefl_score DOUBLE PRECISION,
        pte_score DOUBLE PRECISION,
        det_score DOUBLE PRECISION,
        gre_score DOUBLE PRECISION,
        gmat_score DOUBLE PRECISION,
        min_cgpa DOUBLE PRECISION,
        max_backlogs INT,
        entry_requirement TEXT,
        intakes TEXT,
        deadlines TEXT,
        scholarship_available INT,
        course_link TEXT,
        logo_url TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_pg_programs_country ON programs(country_name);
      CREATE INDEX IF NOT EXISTS idx_pg_programs_domain ON programs(domain);
      CREATE INDEX IF NOT EXISTS idx_pg_programs_level ON programs(study_level);
      CREATE INDEX IF NOT EXISTS idx_pg_programs_cgpa ON programs(min_cgpa);
      CREATE INDEX IF NOT EXISTS idx_pg_unis_country ON universities(location);
    `);

    // Default Super Admin User
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('superadmin', 10);
    await client.query(`
      INSERT INTO users (name, username, password_hash, role)
      VALUES ('Super Admin', 'superadmin', $1, 'super_admin')
      ON CONFLICT (username) DO NOTHING
    `, [hash]);
    console.log('  [OK] Tables created & default admin verified.');

    // Seed Universities from db-seed.json
    console.log('\n[2/4] Seeding 1,522 Universities...');
    const seedPath = path.resolve(__dirname, '../src/lib/db-seed.json');
    if (fs.existsSync(seedPath)) {
      const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      if (Array.isArray(seedData.universities)) {
        let insertedUnis = 0;
        for (const u of seedData.universities) {
          await client.query(`
            INSERT INTO universities (
              id, name, location, domain, min_cgpa, tuition, currency, programs,
              acceptance_rate, campus_setting, min_ielts, min_toefl, min_pte, min_duolingo,
              ielts_waiver, max_backlogs, ranking, scholarships, intakes, course_link
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              location = EXCLUDED.location,
              tuition = EXCLUDED.tuition,
              currency = EXCLUDED.currency,
              course_link = EXCLUDED.course_link
          `, [
            u.id, u.name, u.location, u.domain || 'science_technology',
            u.minCgpa || 7.0, u.tuition || 30000, u.currency || 'USD',
            JSON.stringify(u.programs || {}), u.acceptanceRate || '50%',
            u.campusSetting || 'Urban', u.minIelts || '6.5', u.minToefl || '88',
            u.minPte || '62', u.minDuolingo || '115', u.ieltsWaiver || 'Yes',
            u.maxBacklogs || 4, u.ranking || 'Top Tier', u.scholarships || 'Available',
            u.intakes || 'Fall, Spring', u.courseLink || null
          ]);
          insertedUnis++;
        }
        console.log(`  [OK] Successfully populated ${insertedUnis} universities.`);
      }
    }

    // Seed Programs from programs.csv or confidential encrypted programs.csv.enc
    const csvPath = path.resolve(__dirname, '../programs.csv');
    const encPath = path.resolve(__dirname, '../programs.csv.enc');

    let fileStream = null;
    if (fs.existsSync(csvPath)) {
      console.log('\n[3/4] Streaming programs from plaintext programs.csv (99,219 programs)...');
      fileStream = fs.createReadStream(csvPath);
    } else if (fs.existsSync(encPath)) {
      console.log('\n[3/4] Streaming programs from ENCRYPTED programs.csv.enc (In-memory AES-256 decryption)...');
      const { createDecryptedReadStream } = require('./decrypt-csv.js');
      fileStream = createDecryptedReadStream(encPath, process.env.CSV_ENCRYPTION_KEY);
    } else {
      console.log('\n[3/4] Neither programs.csv nor programs.csv.enc found. Skipping program batch import.');
    }

    if (fileStream) {
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let lineCount = 0;
      let programCount = 0;
      let batch = [];

      for await (const line of rl) {
        lineCount++;
        if (lineCount === 1) continue; // header
        if (!line.trim()) continue;

        const row = parseCSVLine(line);
        const id = parseInt(row[3], 10);
        if (!id || isNaN(id)) continue;

        const name = row[4];
        const country = row[1];
        const uniName = row[33];

        // Skip excluded countries
        if (country === 'Poland' || country === 'India' || country === 'Search and Selection (Non-Tie-up)') continue;
        if (uniName && (uniName.includes('Poland') || uniName.includes('India'))) continue;

        const domain = classifyDomain(name);
        const tuition = parseFloat(row[48]) || 0;
        const ielts = parseFloat(row[56]) || 0;
        const toefl = parseFloat(row[57]) || 0;
        const pte = parseFloat(row[58]) || 0;
        const det = parseFloat(row[59]) || 0;
        const minCgpa = parseFloat(row[62]) || 0;
        const maxBacklogs = parseInt(row[63], 10) || 0;
        const scholarship = row[22] === 'true' || row[23] === 'true' ? 1 : 0;
        const courseLink = row[86] || `https://coursefinder.ai/courses/${id}`;

        batch.push({
          id, name,
          university_id: parseInt(row[32], 10) || 0,
          university_name: uniName,
          university_city: row[34] || '',
          university_state: row[35] || '',
          university_country: row[36] || country,
          country_name: country,
          study_level: row[38] || '',
          domain,
          duration: parseInt(row[15], 10) || 0,
          campus: row[10] || '',
          tuition_amount: tuition,
          tuition_currency: row[37] || 'USD',
          tuition_fee_formatted: row[20] || '',
          ielts_score: ielts,
          toefl_score: toefl,
          pte_score: pte,
          det_score: det,
          gre_score: parseFloat(row[60]) || 0,
          gmat_score: parseFloat(row[61]) || 0,
          min_cgpa: minCgpa,
          max_backlogs: maxBacklogs,
          entry_requirement: row[47] || '',
          intakes: row[74] || '',
          deadlines: row[17] || '',
          scholarship_available: scholarship,
          course_link: courseLink,
          logo_url: row[85] || ''
        });

        if (batch.length >= 500) {
          await insertProgramBatch(client, batch);
          programCount += batch.length;
          process.stdout.write(`\r  -> Inserted ${programCount} programs...`);
          batch = [];
        }
      }

      if (batch.length > 0) {
        await insertProgramBatch(client, batch);
        programCount += batch.length;
      }
      console.log(`\n  [OK] Successfully populated ${programCount} programs into Cloud PostgreSQL!`);
    }

    console.log('\n[4/4] Verifying Cloud Database counts...');
    const uRes = await client.query('SELECT COUNT(*) FROM universities');
    const pRes = await client.query('SELECT COUNT(*) FROM programs');
    const userRes = await client.query('SELECT COUNT(*) FROM users');

    console.log(`  -> Universities in Cloud DB: ${uRes.rows[0].count}`);
    console.log(`  -> Programs in Cloud DB:     ${pRes.rows[0].count}`);
    console.log(`  -> Users in Cloud DB:        ${userRes.rows[0].count}`);
    console.log('\n========================================================');
    console.log('  SUCCESS! Cloud PostgreSQL is 100% Ready for Netlify.');
    console.log('========================================================');
  } finally {
    client.release();
    await pool.end();
  }
}

async function insertProgramBatch(client, batch) {
  const valueStrings = [];
  const params = [];
  let idx = 1;

  for (const p of batch) {
    valueStrings.push(`(
      $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++},
      $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++},
      $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++},
      $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}
    )`);
    params.push(
      p.id, p.name, p.university_id, p.university_name, p.university_city,
      p.university_state, p.university_country, p.country_name, p.study_level,
      p.domain, p.duration, p.campus, p.tuition_amount, p.tuition_currency,
      p.tuition_fee_formatted, p.ielts_score, p.toefl_score, p.pte_score,
      p.det_score, p.gre_score, p.gmat_score, p.min_cgpa, p.max_backlogs,
      p.entry_requirement, p.intakes, p.deadlines, p.scholarship_available,
      p.course_link, p.logo_url
    );
  }

  const query = `
    INSERT INTO programs (
      id, name, university_id, university_name, university_city,
      university_state, university_country, country_name, study_level,
      domain, duration, campus, tuition_amount, tuition_currency,
      tuition_fee_formatted, ielts_score, toefl_score, pte_score,
      det_score, gre_score, gmat_score, min_cgpa, max_backlogs,
      entry_requirement, intakes, deadlines, scholarship_available,
      course_link, logo_url
    ) VALUES ${valueStrings.join(', ')}
    ON CONFLICT (id) DO NOTHING
  `;

  await client.query(query, params);
}

runMigration().catch(err => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});
