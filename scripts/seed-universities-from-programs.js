const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../students.db');
const db = new Database(dbPath);

console.log('[SEED-UNIS] Initializing university import from programs table...');

// Ensure index exists
db.exec('CREATE INDEX IF NOT EXISTS idx_programs_uni_name ON programs(university_name);');

// Prepare aggregation statement
const getUniversities = db.prepare(`
  SELECT 
    university_name,
    country_name,
    university_city,
    tuition_currency,
    ROUND(AVG(CASE WHEN min_cgpa > 0 THEN min_cgpa ELSE NULL END), 1) as avg_cgpa,
    ROUND(AVG(CASE WHEN tuition_amount > 0 THEN tuition_amount ELSE NULL END)) as avg_tuition,
    ROUND(AVG(CASE WHEN ielts_score > 0 THEN ielts_score ELSE NULL END), 1) as avg_ielts,
    ROUND(AVG(CASE WHEN toefl_score > 0 THEN toefl_score ELSE NULL END)) as avg_toefl,
    ROUND(AVG(CASE WHEN pte_score > 0 THEN pte_score ELSE NULL END)) as avg_pte,
    ROUND(AVG(CASE WHEN det_score > 0 THEN det_score ELSE NULL END)) as avg_det,
    ROUND(AVG(CASE WHEN max_backlogs > 0 THEN max_backlogs ELSE NULL END)) as avg_backlogs,
    MAX(scholarship_available) as has_scholarship,
    MIN(course_link) as sample_link,
    COUNT(*) as total_progs
  FROM programs
  WHERE country_name NOT IN ('Poland', 'India', 'Search and Selection (Non-Tie-up)')
    AND (university_country IS NULL OR university_country NOT IN ('Poland', 'India', 'Search and Selection (Non-Tie-up)'))
  GROUP BY university_name, country_name
`);

const getBachelors = db.prepare(`
  SELECT name FROM programs 
  WHERE university_name = ? 
    AND (study_level LIKE '%Undergraduate%' OR study_level LIKE '%UG%') 
  LIMIT 1
`);

const getMasters = db.prepare(`
  SELECT name FROM programs 
  WHERE university_name = ? 
    AND (study_level LIKE '%Postgraduate%' OR study_level LIKE '%PG%') 
  LIMIT 1
`);

const getDomain = db.prepare(`
  SELECT domain FROM programs 
  WHERE university_name = ? 
  GROUP BY domain 
  ORDER BY COUNT(*) DESC 
  LIMIT 1
`);

const insertOrUpdateStmt = db.prepare(`
  INSERT INTO universities (
    id, name, location, domain, minCgpa, tuition, currency, programs,
    acceptanceRate, campusSetting, minIelts, minToefl, minPte, minDuolingo,
    ieltsWaiver, maxBacklogs, ranking, scholarships, intakes, courseLink
  ) VALUES (
    @id, @name, @location, @domain, @minCgpa, @tuition, @currency, @programs,
    @acceptanceRate, @campusSetting, @minIelts, @minToefl, @minPte, @minDuolingo,
    @ieltsWaiver, @maxBacklogs, @ranking, @scholarships, @intakes, @courseLink
  )
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    location = excluded.location,
    domain = excluded.domain,
    minCgpa = excluded.minCgpa,
    tuition = excluded.tuition,
    currency = excluded.currency,
    programs = excluded.programs,
    acceptanceRate = excluded.acceptanceRate,
    campusSetting = excluded.campusSetting,
    minIelts = excluded.minIelts,
    minToefl = excluded.minToefl,
    minPte = excluded.minPte,
    minDuolingo = excluded.minDuolingo,
    maxBacklogs = excluded.maxBacklogs,
    scholarships = excluded.scholarships,
    intakes = excluded.intakes,
    courseLink = excluded.courseLink
`);

const rawUnis = getUniversities.all();
console.log(`[SEED-UNIS] Found ${rawUnis.length} distinct universities across programs dataset.`);

let insertedCount = 0;

const runSeed = db.transaction(() => {
  for (const u of rawUnis) {
    const uniName = (u.university_name || '').trim();
    if (!uniName) continue;

    const country = (u.country_name || '').trim();
    const city = (u.university_city || '').trim();
    const location = city ? `${city}, ${country}` : country;

    const hasIndiaWord = (str) => /\bindia\b/i.test(str) && !/\bindiana\b/i.test(str) && !/\bindianapolis\b/i.test(str);
    if (/\bpoland\b/i.test(uniName) || /\bpoland\b/i.test(location) ||
        uniName.toLowerCase().includes('search and select') || location.toLowerCase().includes('search and select') ||
        hasIndiaWord(uniName) || hasIndiaWord(location)) {
      continue;
    }

    const id = 'uni_' + crypto.createHash('md5').update((uniName + ' ' + country).toLowerCase()).digest('hex').slice(0, 16);

    const domainRow = getDomain.get(uniName);
    const domain = (domainRow && domainRow.domain) ? domainRow.domain : 'science_technology';

    const bachRow = getBachelors.get(uniName);
    const mastRow = getMasters.get(uniName);
    const programsObj = {
      bachelors: (bachRow && bachRow.name) ? bachRow.name : 'Bachelor of Science / Arts Degree',
      masters: (mastRow && mastRow.name) ? mastRow.name : 'Master of Science / Arts Degree'
    };

    const minCgpa = u.avg_cgpa && u.avg_cgpa > 0 ? u.avg_cgpa : 6.5;
    const tuition = u.avg_tuition && u.avg_tuition > 0 ? Math.round(u.avg_tuition) : 25000;
    const currency = (u.tuition_currency || 'USD').toUpperCase().trim();

    let acceptanceRate = '45%';
    if (minCgpa >= 8.5) acceptanceRate = '12%';
    else if (minCgpa >= 7.5) acceptanceRate = '28%';
    else if (minCgpa >= 6.5) acceptanceRate = '55%';
    else acceptanceRate = '75%';

    let ranking = 'Mid Tier';
    if (minCgpa >= 8.0) ranking = 'Top Tier';
    else if (minCgpa >= 7.0) ranking = 'High Tier';

    const minIelts = u.avg_ielts && u.avg_ielts > 0 ? `${u.avg_ielts} (min ${(u.avg_ielts - 0.5).toFixed(1)} each)` : '6.5 (min 6.0 each)';
    const minToefl = u.avg_toefl && u.avg_toefl > 0 ? String(Math.round(u.avg_toefl)) : '88';
    const minPte = u.avg_pte && u.avg_pte > 0 ? String(Math.round(u.avg_pte)) : '62';
    const minDuolingo = u.avg_det && u.avg_det > 0 ? String(Math.round(u.avg_det)) : '115';
    const maxBacklogs = u.avg_backlogs && u.avg_backlogs > 0 ? Math.round(u.avg_backlogs) : 4;
    const scholarships = u.has_scholarship ? 'Available' : 'Merit-Based / Upon Admission';

    insertOrUpdateStmt.run({
      id,
      name: uniName,
      location,
      domain,
      minCgpa,
      tuition,
      currency,
      programs: JSON.stringify(programsObj),
      acceptanceRate,
      campusSetting: 'Urban',
      minIelts,
      minToefl,
      minPte,
      minDuolingo,
      ieltsWaiver: 'Yes - 70%+ in CBSE/ICSE 12th English',
      maxBacklogs,
      ranking,
      scholarships,
      intakes: 'Fall, Spring',
      courseLink: u.sample_link || null
    });

    insertedCount++;
  }
});

runSeed();

const finalCount = db.prepare('SELECT COUNT(*) as count FROM universities').get().count;
console.log(`[SEED-UNIS] Successfully seeded/updated ${insertedCount} universities.`);
console.log(`[SEED-UNIS] Total universities in database now: ${finalCount}`);

db.close();
