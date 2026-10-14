import { proxyAdminRequest, authServiceUrl } from '@/lib/admin-server';

export function GET(request: Request) {
  return proxyAdminRequest('/auth/admin/users', request, authServiceUrl);
}
