import { proxyAdminRequest } from '@/lib/admin-server';

type Context = { params: Promise<{ eventId: string }> };
export async function PATCH(request: Request, context: Context) {
  const { eventId } = await context.params;
  return proxyAdminRequest(`/admin/events/${encodeURIComponent(eventId)}/status`, request);
}
