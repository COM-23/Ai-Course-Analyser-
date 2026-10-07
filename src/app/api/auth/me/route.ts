import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'super-secret-default-key');

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const match = cookieHeader.match(/auth_token=([^;]+)/);
    
    if (!match) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const token = match[1];
    
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      authenticated: true,
      user: payload
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
