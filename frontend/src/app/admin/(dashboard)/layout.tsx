import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getAdminSession } from '@/lib/admin-server';

export const dynamic = 'force-dynamic';
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getAdminSession();
  if (!user) redirect('/admin/login');
  return <AdminShell email={user.email}>{children}</AdminShell>;
}
