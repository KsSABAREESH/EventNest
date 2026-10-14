export const categories = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'] as const;
export type AdminCategory = (typeof categories)[number];
export type AdminEvent = {
  id: string; title: string; category: AdminCategory; city: string; startsAt: string;
  pricePaise: string; description: string; imageUrl: string; isActive: boolean;
};
export type AdminEventPage = { data: AdminEvent[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } };
export function formatDate(value: string) { return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }
export function formatPrice(paise: string) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(paise) / 100); }
