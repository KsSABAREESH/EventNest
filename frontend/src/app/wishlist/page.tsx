import type { Metadata } from 'next';
import WishlistPage from '@/components/wishlist/WishlistPage';

export const metadata: Metadata = {
  title: 'Wishlist | EventNest',
  description: 'Events you saved with Remind me.',
};

export default function WishlistRoute() {
  return <WishlistPage />;
}
