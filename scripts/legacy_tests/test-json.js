const Database = require('better-sqlite3');
const db = new Database(':memory:');
db.exec(`CREATE TABLE students (id INTEGER PRIMARY KEY, studentDetails JSON, counselor_id INTEGER);`);
db.prepare(`INSERT INTO students (studentDetails, counselor_id) VALUES ('{"name": "Valid"}', 1)`).run();
db.prepare(`INSERT INTO students (studentDetails, counselor_id) VALUES ('invalid json', 1)`).run();

try {
  const row = db.prepare(`SELECT id FROM students WHERE json_extract(studentDetails, '$.name') = ? COLLATE NOCASE AND counselor_id = ?`).get("Valid", 1);
  console.log("Result:", row);
} catch (e) {
  console.error("DB Error:", e);
}
