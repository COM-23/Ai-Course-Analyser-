import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-default-key');

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    // Get settings
    const settingsStmt = db.prepare('SELECT * FROM settings');
    const settingsRows = settingsStmt.all() as any[];
    const settings = settingsRows.reduce((acc, row) => ({ ...acc, [row.id]: JSON.parse(row.value) }), {});
    
    const maxAttemptsStr = settings.maxLoginAttempts || "3 Attempts";
    const maxAttempts = parseInt(maxAttemptsStr.split(' ')[0]) || 3;
    
    const timeoutStr = settings.sessionTimeout || "24 Hours";
    let expirationTime = '24h';
    let maxAgeSeconds = 60 * 60 * 24;
    
    if (timeoutStr.includes('Minutes')) {
      const mins = parseInt(timeoutStr.split(' ')[0]);
      expirationTime = `${mins}m`;
      maxAgeSeconds = mins * 60;
    } else if (timeoutStr.includes('Hours')) {
      const hrs = parseInt(timeoutStr.split(' ')[0]);
      expirationTime = `${hrs}h`;
      maxAgeSeconds = hrs * 60 * 60;
    }

    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const user = stmt.get(username.toLowerCase()) as any;

    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Check lockout
    if (user.lockoutUntil) {
      const lockoutDate = new Date(user.lockoutUntil);
      if (lockoutDate > new Date()) {
        const minsLeft = Math.ceil((lockoutDate.getTime() - new Date().getTime()) / 60000);
        return NextResponse.json({ error: `Account locked. Try again in ${minsLeft} minutes.` }, { status: 403 });
      }
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      // Increment failed attempts
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let lockoutStr = null;
      
      if (attempts >= maxAttempts) {
        // Lock for 15 minutes
        const d = new Date();
        d.setMinutes(d.getMinutes() + 15);
        lockoutStr = d.toISOString();
      }
      
      db.prepare('UPDATE users SET failedLoginAttempts = ?, lockoutUntil = ? WHERE id = ?').run(attempts, lockoutStr, user.id);
      
      if (lockoutStr) {
        return NextResponse.json({ error: `Account locked due to too many failed attempts.` }, { status: 403 });
      }
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Success! Reset attempts
    db.prepare('UPDATE users SET failedLoginAttempts = 0, lockoutUntil = NULL WHERE id = ?').run(user.id);

    // Create JWT
    const token = await new SignJWT({ 
      id: user.id, 
      name: user.name, 
      username: user.username,
      role: user.role 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAgeSeconds
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
