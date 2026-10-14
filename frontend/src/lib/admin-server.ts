import { cookies } from 'next/headers';

export type AdminUser = { id: string; email: string; role: 'admin'; username?: string | null };

const authUrl = process.env.AUTH_SERVICE_URL ?? process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:4001';
const eventsUrl = process.env.EVENTS_SERVICE_URL ?? process.env.NEXT_PUBLIC_EVENTS_API_URL ?? 'http://localhost:4002';
export const preferencesUrl = process.env.PREFERENCES_SERVICE_URL ?? process.env.NEXT_PUBLIC_PREFERENCES_API_URL ?? 'http://localhost:4003';
export const authServiceUrl = authUrl;
export const adminCookieName = 'eventnest.adminToken';

export async function getAdminSession(): Promise<AdminUser | null> {
  const token = (await cookies()).get(adminCookieName)?.value;
  if (!token) return null;
  try {
    const response = await fetch(`${authUrl}/auth/admin/me`, {
      headers: { authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { user?: AdminUser };
    return body.user?.role === 'admin' ? body.user : null;
  } catch {
    return null;
  }
}

export async function proxyAdminRequest(path: string, request: Request, serviceUrl = eventsUrl): Promise<Response> {
  const token = (await cookies()).get(adminCookieName)?.value;
  if (!token) return Response.json({ message: 'Admin sign-in is required.' }, { status: 401 });
  const target = new URL(path, serviceUrl);
  target.search = new URL(request.url).search;
  const headers = new Headers({ authorization: `Bearer ${token}` });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text(),
      cache: 'no-store',
    });
    return new Response(response.body, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return Response.json({ message: 'Could not reach the events service.' }, { status: 503 });
  }
}
