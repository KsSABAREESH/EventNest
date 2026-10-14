import type { Metadata } from 'next';
import AdminEvents from '@/components/admin/AdminEvents';

export const metadata: Metadata = { title: 'Manage events | EventNest' };
export default function AdminEventsPage() { return <AdminEvents />; }
