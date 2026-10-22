const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function parseCSVLine(text) {
  let row = [""];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === String.fromCharCode(34)) {
      if (inQuotes && text[i+1] === String.fromCharCode(34)) {
        row[row.length - 1] += String.fromCharCode(34);
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

async function seedPrograms() {
  const csvPath = path.join(process.cwd(), 'programs.csv');
  if (!fs.existsSync(csvPath)) {
    console.error(`programs.csv not found at ${csvPath}`);
    process.exit(1);
  }

  const dbPath = path.join(process.cwd(), 'students.db');
  const db = new Database(dbPath);

  db.exec(`
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
  `);

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO programs (
      id, name, university_id, university_name, university_city, university_state, university_country,
      country_name, study_level, domain, duration, campus, tuition_amount, tuition_currency, tuition_fee_formatted,
      ielts_score, toefl_score, pte_score, det_score, gre_score, gmat_score, min_cgpa, max_backlogs,
      entry_requirement, intakes, deadlines, scholarship_available, course_link, logo_url
    ) VALUES (
      @id, @name, @university_id, @university_name, @university_city, @university_state, @university_country,
      @country_name, @study_level, @domain, @duration, @campus, @tuition_amount, @tuition_currency, @tuition_fee_formatted,
      @ielts_score, @toefl_score, @pte_score, @det_score, @gre_score, @gmat_score, @min_cgpa, @max_backlogs,
      @entry_requirement, @intakes, @deadlines, @scholarship_available, @course_link, @logo_url
    )
  `);

  const insertMany = db.transaction((rows) => {
    for (const r of rows) insertStmt.run(r);
  });

  const fd = fs.openSync(csvPath, "r");
  const bufferSize = 64 * 1024;
  const buffer = Buffer.alloc(bufferSize);
  let bytesRead = 0;
  let remainder = "";
  let inQuotes = false;
  let headers = null;
  let currentField = "";
  let currentRow = [];
  let batch = [];
  let count = 0;
  let skippedCount = 0;
  const startTime = Date.now();

  while ((bytesRead = fs.readSync(fd, buffer, 0, bufferSize, null)) > 0) {
    const chunk = remainder + buffer.toString("utf8", 0, bytesRead);
    let i = 0;
    for (; i < chunk.length; i++) {
      const c = chunk[i];
      if (c === String.fromCharCode(34)) {
        if (inQuotes && chunk[i+1] === String.fromCharCode(34)) {
          currentField += String.fromCharCode(34);
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        currentRow.push(currentField);
        currentField = "";
      } else if ((c === "\r" || c === "\n") && !inQuotes) {
        if (c === "\r" && chunk[i+1] === "\n") i++;
        currentRow.push(currentField);
        currentField = "";
        if (currentRow.length > 1) {
          if (!headers) {
            headers = currentRow;
            if (headers[0].charCodeAt(0) === 0xFEFF) headers[0] = headers[0].slice(1);
          } else {
            const countryName = currentRow[headers.indexOf("country_name")] || "";
            const uniCountry = currentRow[headers.indexOf("universityCountry")] || "";
            const cLower = countryName.toLowerCase();
            const uLower = uniCountry.toLowerCase();

            // Strict exclusion of Poland, India, and Search and Select
            if (
              cLower.includes("poland") || uLower.includes("poland") ||
              cLower === "india" || uLower === "india" ||
              cLower.includes("search and select") || uLower.includes("search and select") ||
              cLower.includes("search and selection") || uLower.includes("search and selection")
            ) {
              skippedCount++;
            } else {
              const id = parseInt(currentRow[headers.indexOf("Id")]) || 0;
              const name = currentRow[headers.indexOf("Name")] || "";
              const uniId = parseInt(currentRow[headers.indexOf("UniversityId")]) || 0;
              const uniName = currentRow[headers.indexOf("universityName")] || "";
              const uniCity = currentRow[headers.indexOf("universityCity")] || "";
              const uniState = currentRow[headers.indexOf("universityState")] || "";
              const studyLevel = currentRow[headers.indexOf("Studylvl")] || "";
              const duration = parseInt(currentRow[headers.indexOf("Duration")]) || 0;
              const campus = currentRow[headers.indexOf("Campus")] || "";
              const tuitionAmount = parseFloat(currentRow[headers.indexOf("Amount")]) || 0;
              const tuitionCurrency = currentRow[headers.indexOf("TuitionFeeCurrency")] || "USD";
              const tuitionFormatted = currentRow[headers.indexOf("TutionFee")] || "";
              const ielts = parseFloat(currentRow[headers.indexOf("IeltsOverall")]) || 0;
              const toefl = parseFloat(currentRow[headers.indexOf("ToeflScore")]) || 0;
              const pte = parseFloat(currentRow[headers.indexOf("PteScore")]) || 0;
              const det = parseFloat(currentRow[headers.indexOf("DETScore")]) || 0;
              const gre = parseFloat(currentRow[headers.indexOf("GreScore")]) || 0;
              const gmat = parseFloat(currentRow[headers.indexOf("GmatScore")]) || 0;

              let minCgpa = parseFloat(currentRow[headers.indexOf("EntryRequirementUgOutOf10")]) || 0;
              if (!minCgpa) {
                const outOf100 = parseFloat(currentRow[headers.indexOf("EntryRequirementUgOutOf100")]) || 0;
                if (outOf100 > 0) minCgpa = parseFloat((outOf100 / 10).toFixed(1));
              }
              if (!minCgpa || minCgpa < 4) minCgpa = 6.5;

              const maxBacklogs = parseInt(currentRow[headers.indexOf("backlog")]) || 4;
              const entryReq = currentRow[headers.indexOf("EntryRequirement")] || "";
              const intakes = currentRow[headers.indexOf("Intakes")] || "";
              const deadlines = currentRow[headers.indexOf("ApplicationDeadline")] || "";
              const scholarship = (currentRow[headers.indexOf("ScholarshipAvailable")] === "true") ? 1 : 0;
              const courseLink = (headers.indexOf("course_link") !== -1 && currentRow[headers.indexOf("course_link")])
                ? currentRow[headers.indexOf("course_link")]
                : `https://coursefinder.ai/courses/${id}`;
              const logoUrl = (headers.indexOf("logo-url") !== -1) ? currentRow[headers.indexOf("logo-url")] : "";
              const domain = classifyDomain(name);

              batch.push({
                id, name, university_id: uniId, university_name: uniName, university_city: uniCity,
                university_state: uniState, university_country: uniCountry, country_name: countryName,
                study_level: studyLevel, domain, duration, campus, tuition_amount: tuitionAmount,
                tuition_currency: tuitionCurrency, tuition_fee_formatted: tuitionFormatted,
                ielts_score: ielts, toefl_score: toefl, pte_score: pte, det_score: det,
                gre_score: gre, gmat_score: gmat, min_cgpa: minCgpa, max_backlogs: maxBacklogs,
                entry_requirement: entryReq, intakes, deadlines, scholarship_available: scholarship,
                course_link: courseLink, logo_url: logoUrl
              });

              count++;
              if (batch.length >= 2500) {
                insertMany(batch);
                batch = [];
              }
            }
          }
        }
        currentRow = [];
      } else {
        currentField += c;
      }
    }
    remainder = chunk.substring(i);
  }
  if (batch.length > 0) {
    insertMany(batch);
  }
  fs.closeSync(fd);

  console.log(`Successfully seeded ${count} programs in ${((Date.now() - startTime) / 1000).toFixed(2)}s (Excluded ${skippedCount} entries for Poland, India, and Search & Select)`);
}

seedPrograms().catch(console.error);
