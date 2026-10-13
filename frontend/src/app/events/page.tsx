import type { Metadata } from 'next';
import EventBrowse from '@/components/events/EventBrowse';

export const metadata: Metadata = {
  title: 'Discover events | EventNest',
  description: 'Browse upcoming community events by category, city, or search.',
};

export default function EventsPage() {
  return <EventBrowse />;
}
