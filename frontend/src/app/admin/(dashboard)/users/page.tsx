import type { Metadata } from 'next';
import AdminUsers from '@/components/admin/AdminUsers';

export const metadata: Metadata = { title: 'Manage users | EventNest' };
export default function AdminUsersPage() { return <AdminUsers />; }
