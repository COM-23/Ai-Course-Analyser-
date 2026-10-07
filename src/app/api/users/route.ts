import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

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

export async function GET() {
  try {
    const stmt = db.prepare('SELECT id, name, username, role, createdAt FROM users');
    let users = stmt.all();

    // Auto-seed if empty
    if (users.length === 0) {
      const defaultPasswordHash = await bcrypt.hash('password123', 10);
      const insert = db.prepare('INSERT INTO users (name, username, passwordHash, role) VALUES (?, ?, ?, ?)');
      
      db.transaction((usersToInsert: any[]) => {
        for (const user of usersToInsert) {
          const username = user.name.toLowerCase().replace(/\s+/g, '');
          insert.run(user.name, username, defaultPasswordHash, user.role);
        }
      })(defaultUsers);
      
      users = stmt.all(); // Re-fetch without password hashes
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, username, password, role } = await req.json();
    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: 'Name, username, password, and role required' }, { status: 400 });
    }
    
    // Check strong password policy
    const settingsStmt = db.prepare('SELECT value FROM settings WHERE id = ?');
    const enforceStrongPwdRow = settingsStmt.get('enforceStrongPasswords') as any;
    const enforceStrongPwd = enforceStrongPwdRow ? JSON.parse(enforceStrongPwdRow.value) : false;
    
    if (enforceStrongPwd) {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
      if (!strongRegex.test(password)) {
        return NextResponse.json({ 
          error: 'Password must be at least 12 characters and include numbers, symbols, and mixed case letters.' 
        }, { status: 400 });
      }
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare('INSERT INTO users (name, username, passwordHash, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, username.toLowerCase(), passwordHash, role);
    
    return NextResponse.json({ id: info.lastInsertRowid, name, username, role }, { status: 201 });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json({ error: 'Failed to add user (might exist)' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
