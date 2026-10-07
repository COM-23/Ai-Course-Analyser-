const Database = require('better-sqlite3');
const path = require('path');

// Connect to the SQLite database
const dbPath = path.join(process.cwd(), 'students.db');
const db = new Database(dbPath);

console.log("=========================================");
console.log("🗑️  CLEARING STUDENT DATABASE...");
console.log("=========================================");

try {
  // Delete all records from the students table
  const info = db.prepare('DELETE FROM students').run();
  
  console.log(`✅ Success! Deleted ${info.changes} student records.`);
  console.log("Your dashboard is now completely empty and ready for fresh testing.");
} catch (error) {
  console.error("❌ Failed to clear database:", error.message);
} finally {
  db.close();
}
