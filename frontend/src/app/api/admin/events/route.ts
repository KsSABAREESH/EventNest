import { proxyAdminRequest } from '@/lib/admin-server';

export function GET(request: Request) { return proxyAdminRequest('/admin/events', request); }
export function POST(request: Request) { return proxyAdminRequest('/admin/events', request); }
