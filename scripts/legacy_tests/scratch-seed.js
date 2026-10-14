const bcrypt = require('bcryptjs');
const db = require('better-sqlite3')('students.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    username TEXT UNIQUE,
    passwordHash TEXT,
    role TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const defaultUsers = [
  { name: "Super Admin", role: "super_admin" },
  { name: "Vibha", role: "counselor" },
  { name: "Darshan", role: "counselor" },
  { name: "Gaurav", role: "counselor" },
  { name: "Hetal", role: "counselor" },
  { name: "Mehdi", role: "counselor" },
  { name: "Mala", role: "counselor" },
  { name: "Roshni", role: "counselor" },
  { name: "Sanjana", role: "counselor" },
  { name: "Meenakshi", role: "counselor" },
  { name: "Sameer", role: "counselor" },
  { name: "Harsh", role: "counselor" },
  { name: "Khushboo", role: "counselor" }
];

async function seed() {
  const defaultPasswordHash = await bcrypt.hash('password123', 10);
  const insert = db.prepare('INSERT INTO users (name, username, passwordHash, role) VALUES (?, ?, ?, ?)');
  
  db.transaction((usersToInsert) => {
    for (const user of usersToInsert) {
      const username = user.name.toLowerCase().replace(/\s+/g, '');
      insert.run(user.name, username, defaultPasswordHash, user.role);
    }
  })(defaultUsers);
  console.log("Seeded successfully");
}

seed();
