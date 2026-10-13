import type { CommunityEvent } from './events';

type ReminderResponse = { message?: string; data?: string[]; events?: CommunityEvent[]; reminded?: boolean };

const preferencesApiUrl = process.env.NEXT_PUBLIC_PREFERENCES_API_URL ?? 'http://localhost:4003';

async function requestReminderApi(path: string, token: string, method = 'GET', signal?: AbortSignal): Promise<ReminderResponse> {
  let response: Response;
  try {
    response = await fetch(`${preferencesApiUrl}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}` },
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Could not reach EventNest reminders. Check that the preferences service is running.');
  }

  const result = (await response.json().catch(() => ({}))) as ReminderResponse;
  if (!response.ok) throw new Error(result.message ?? 'We could not update your reminder. Please try again.');
  return result;
}

export async function getReminderEventIds(token: string, signal?: AbortSignal): Promise<string[]> {
  const result = await requestReminderApi('/reminders', token, 'GET', signal);
  if (!Array.isArray(result.data)) throw new Error('The reminders service returned an incomplete response.');
  return result.data;
}

export async function getReminderEvents(token: string, signal?: AbortSignal): Promise<CommunityEvent[]> {
  const result = await requestReminderApi('/reminders', token, 'GET', signal);
  if (!Array.isArray(result.events)) throw new Error('The reminders service did not return saved event details.');
  return result.events;
}

export async function saveEventReminder(token: string, eventId: string, reminded: boolean): Promise<void> {
  await requestReminderApi(`/reminders/${encodeURIComponent(eventId)}`, token, reminded ? 'PUT' : 'DELETE');
}
