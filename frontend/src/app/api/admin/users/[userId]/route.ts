import { NextResponse } from 'next/server';
import { authServiceUrl, preferencesUrl, proxyAdminRequest } from '@/lib/admin-server';

type Context = { params: Promise<{ userId: string }> };

export async function GET(request: Request, context: Context) {
  const { userId } = await context.params;
  const encodedId = encodeURIComponent(userId);
  const userResponse = await proxyAdminRequest(`/auth/admin/users/${encodedId}`, request, authServiceUrl);
  if (!userResponse.ok) return userResponse;

  const userBody = await userResponse.json().catch(() => null) as { data?: Record<string, unknown> } | null;
  if (!userBody?.data) return NextResponse.json({ message: 'The auth service returned an incomplete user record.' }, { status: 502 });

  const preferencesResponse = await proxyAdminRequest(`/admin/users/${encodedId}/favourites`, request, preferencesUrl);
  if (!preferencesResponse.ok) return preferencesResponse;
  const preferencesBody = await preferencesResponse.json().catch(() => null) as { data?: { categories?: string[] } } | null;
  if (!Array.isArray(preferencesBody?.data?.categories)) {
    return NextResponse.json({ message: 'The preferences service returned incomplete category data.' }, { status: 502 });
  }

  return NextResponse.json({ data: { ...userBody.data, favouriteCategories: preferencesBody.data.categories } });
}
