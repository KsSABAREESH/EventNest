import type { Metadata } from 'next';
import EventBrowse from '@/components/events/EventBrowse';

export const metadata: Metadata = {
  title: 'Discover events | EventNest',
  description: 'Browse upcoming community events by category, city, or search.',
};

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ my_feed?: string }> }) {
  const params = await searchParams;
  return <EventBrowse myFeedRequested={params.my_feed === 'true'} />;
}
