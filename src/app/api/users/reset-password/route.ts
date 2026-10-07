import { NextResponse } from 'next/server';
import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { id, newPassword } = await req.json();

    if (!id || !newPassword) {
      return NextResponse.json({ error: 'User ID and new password required' }, { status: 400 });
    }

    // Check strong password policy
    const settingsStmt = db.prepare('SELECT value FROM settings WHERE id = ?');
    const enforceStrongPwdRow = settingsStmt.get('enforceStrongPasswords') as any;
    const enforceStrongPwd = enforceStrongPwdRow ? JSON.parse(enforceStrongPwdRow.value) : false;
    
    if (enforceStrongPwd) {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
      if (!strongRegex.test(newPassword)) {
        return NextResponse.json({ 
          error: 'Password must be at least 12 characters and include numbers, symbols, and mixed case letters.' 
        }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const stmt = db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?');
    stmt.run(passwordHash, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
