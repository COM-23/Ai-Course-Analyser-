const Database = require('better-sqlite3');
const db = new Database('./students.db');

try {
  const stmt = db.prepare(`
             UPDATE students SET 
               studentDetails = ?, studentSummary = ?, strengths = ?, areasForImprovement = ?,
               careerOpportunities = ?, recommendedColleges = ?, visaDifficulty = ?,
               keySkillsIdentified = ?, estimatedBudgetRange = ?
             WHERE id = ?
           `);
  
  const info = stmt.run(
    '{"name":"Dishik L Setty"}',
    "Summary 2",
    '[]',
    '[]',
    '[]',
    '[]',
    "Hard",
    '[]',
    "50 lacs updated",
    2209 // the ID from last insert
  );
  console.log("Updated:", info);
} catch (e) {
  console.error("DB Error:", e);
}
