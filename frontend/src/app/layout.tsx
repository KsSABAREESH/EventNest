import type { Metadata } from 'next';
import '@fontsource-variable/inter';
import './globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: 'EventNest | Discover local events',
  description: 'Find music, workshops, food fairs, sports, and family events happening near you.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
