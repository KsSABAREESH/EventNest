export const eventCategories = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'] as const;

export type EventCategory = (typeof eventCategories)[number];

export type CommunityEvent = {
  id: string;
  title: string;
  category: EventCategory;
  city: string;
  startsAt: string;
  pricePaise: string;
  description: string;
  imageUrl: string;
};

export type EventsPage = {
  data: CommunityEvent[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type EventsFilters = {
  category: EventCategory | '';
  city: string;
  q: string;
  page: number;
  pageSize: number;
};

type ApiError = { message?: string };

const eventsApiUrl = process.env.NEXT_PUBLIC_EVENTS_API_URL ?? 'http://localhost:4002';
const preferencesApiUrl = process.env.NEXT_PUBLIC_PREFERENCES_API_URL ?? 'http://localhost:4003';

export async function getEvents(filters: EventsFilters, signal?: AbortSignal, token?: string, myFeed = false): Promise<EventsPage> {
  const query = new URLSearchParams();
  if (filters.category) query.set('category', filters.category);
  if (filters.city.trim()) query.set('city', filters.city.trim());
  if (filters.q.trim()) query.set('q', filters.q.trim());
  query.set('page', String(filters.page));
  query.set('pageSize', String(filters.pageSize));

  let response: Response;
  try {
    if (myFeed && token) {
      const feedQuery = new URLSearchParams();
      if (filters.category) feedQuery.set('category', filters.category);
      if (filters.city.trim()) feedQuery.set('city', filters.city.trim());
      if (filters.q.trim()) feedQuery.set('q', filters.q.trim());
      feedQuery.set('page', String(filters.page));
      feedQuery.set('pageSize', String(filters.pageSize));
      response = await fetch(`${preferencesApiUrl}/feed?${feedQuery.toString()}`, {
        signal, headers: { authorization: `Bearer ${token}` },
      });
    } else {
      response = await fetch(`${eventsApiUrl}/events?${query.toString()}`, { signal });
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Could not connect to the events service. Check that it is running.');
  }

  const result = (await response.json().catch(() => ({}))) as EventsPage & ApiError;
  if (!response.ok) throw new Error(result.message ?? 'We could not load events. Please try again.');
  if (!Array.isArray(result.data) || !result.pagination) {
    throw new Error('The events service returned an incomplete response.');
  }

  return result;
}
