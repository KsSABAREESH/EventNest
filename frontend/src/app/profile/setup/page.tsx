import type { Metadata } from 'next';
import ProfileSetup from '@/components/auth/ProfileSetup';

export const metadata: Metadata = {
  title: 'Complete your profile | EventNest',
  description: 'Add your name and mobile number to finish setting up your EventNest profile.',
};

export default function ProfileSetupPage() {
  return <ProfileSetup />;
}
