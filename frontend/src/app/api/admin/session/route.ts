import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminCookieName } from '@/lib/admin-server';

const authUrl = process.env.AUTH_SERVICE_URL ?? process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:4001';

export async function POST(request: NextRequest) {
  let credentials: unknown;
  try { credentials = await request.json(); } catch { return NextResponse.json({ message: 'Enter your admin email and password.' }, { status: 400 }); }
  try {
    const response = await fetch(`${authUrl}/auth/admin/login`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(credentials), cache: 'no-store',
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json(result, { status: response.status });
    const token = result?.accessToken;
    if (!token || result?.user?.role !== 'admin') return NextResponse.json({ message: 'The admin service returned an invalid session.' }, { status: 502 });
    const next = NextResponse.json({ user: result.user });
    next.cookies.set(adminCookieName, token, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: result.expiresIn ?? 3600,
    });
    return next;
  } catch {
    return NextResponse.json({ message: 'Could not reach the authentication service.' }, { status: 503 });
  }
}

export async function GET() {
  const token = (await cookies()).get(adminCookieName)?.value;
  if (!token) return NextResponse.json({ message: 'Admin sign-in is required.' }, { status: 401 });
  try {
    const response = await fetch(`${authUrl}/auth/admin/me`, { headers: { authorization: `Bearer ${token}` }, cache: 'no-store' });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const next = NextResponse.json(result, { status: response.status });
      next.cookies.delete(adminCookieName);
      return next;
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: 'Could not reach the authentication service.' }, { status: 503 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: 'Signed out.' });
  response.cookies.set(adminCookieName, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
