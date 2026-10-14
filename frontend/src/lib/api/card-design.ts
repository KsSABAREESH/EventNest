export const cardThemes = ['paper', 'sunset', 'midnight'] as const;
export type CardTheme = (typeof cardThemes)[number];

export const cardStickers = ['sparkles', 'music-notes', 'confetti', 'heart', 'star'] as const;
export type CardSticker = (typeof cardStickers)[number];

export type EventCardDesign = { theme: CardTheme; stickers: CardSticker[] };
export type SavedEventCardDesign = EventCardDesign & { eventId: string };

const preferencesApiUrl = process.env.NEXT_PUBLIC_PREFERENCES_API_URL ?? 'http://localhost:4003';

async function requestCardDesign(eventId: string, token: string, method: 'GET' | 'PUT', design?: EventCardDesign, signal?: AbortSignal): Promise<EventCardDesign> {
  let response: Response;
  try {
    response = await fetch(`${preferencesApiUrl}/events/${encodeURIComponent(eventId)}/card-design`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        ...(design ? { 'content-type': 'application/json' } : {}),
      },
      ...(design ? { body: JSON.stringify(design) } : {}),
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Could not reach the personalization service. Check that it is running.');
  }

  const result = (await response.json().catch(() => ({}))) as { data?: EventCardDesign; message?: string };
  if (!response.ok) throw new Error(result.message ?? 'We could not load this card design. Please try again.');
  if (!result.data || !Array.isArray(result.data.stickers)) throw new Error('The personalization service returned an incomplete design.');
  return result.data;
}

export function getEventCardDesign(eventId: string, token: string, signal?: AbortSignal): Promise<EventCardDesign> {
  return requestCardDesign(eventId, token, 'GET', undefined, signal);
}

export async function getEventCardDesigns(eventIds: string[], token: string, signal?: AbortSignal): Promise<SavedEventCardDesign[]> {
  if (eventIds.length === 0) return [];
  const query = new URLSearchParams();
  for (const eventId of eventIds) query.append('eventIds', eventId);

  let response: Response;
  try {
    response = await fetch(`${preferencesApiUrl}/events/card-designs?${query.toString()}`, {
      headers: { authorization: `Bearer ${token}` },
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Could not reach the personalization service. Check that it is running.');
  }

  const result = (await response.json().catch(() => ({}))) as { data?: SavedEventCardDesign[]; message?: string };
  if (!response.ok) throw new Error(result.message ?? 'We could not load your saved card designs.');
  if (!Array.isArray(result.data)) throw new Error('The personalization service returned an incomplete set of card designs.');
  return result.data;
}

export function saveEventCardDesign(eventId: string, token: string, design: EventCardDesign): Promise<EventCardDesign> {
  return requestCardDesign(eventId, token, 'PUT', design);
}
