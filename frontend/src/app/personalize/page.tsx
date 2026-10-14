import type { Metadata } from 'next';
import PersonalizePage from '@/components/personalize/PersonalizePage';

export const metadata: Metadata = {
  title: 'Personalize | EventNest',
  description: 'Design a personal event card with your favorite colors and stickers.',
};

export default function PersonalizeRoute() {
  return <PersonalizePage />;
}
