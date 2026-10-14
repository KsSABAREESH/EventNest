import type { Metadata } from 'next';
import AdminLogin from '@/components/admin/AdminLogin';

export const metadata: Metadata = { title: 'Admin sign in | EventNest' };
export default function AdminLoginPage() { return <AdminLogin />; }
