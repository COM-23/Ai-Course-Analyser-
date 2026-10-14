const Database = require('better-sqlite3');
const db = new Database('./students.db');

try {
  const stmt = db.prepare(`
    INSERT INTO students (
      studentDetails, studentSummary, strengths, areasForImprovement,
      careerOpportunities, recommendedColleges, visaDifficulty,
      keySkillsIdentified, estimatedBudgetRange, counselor_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const info = stmt.run(
    '{"name":"Dishik L Setty"}',
    "Summary",
    '[]',
    '[]',
    '[]',
    '[]',
    "Hard",
    '[]',
    "50 lacs",
    1
  );
  console.log("Inserted:", info);
} catch (e) {
  console.error("DB Error:", e);
}
