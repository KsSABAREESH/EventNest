import type { Metadata } from 'next';
import PreferencesPage from '@/components/preferences/PreferencesPage';

export const metadata: Metadata = {
  title: 'My preferences | EventNest',
  description: 'Choose the event categories that shape your EventNest feed.',
};

export default function PreferencesRoute() {
  return <PreferencesPage />;
}
