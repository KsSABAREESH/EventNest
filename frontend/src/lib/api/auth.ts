export type AuthUser = {
  id: string;
  email: string;
  role: 'member' | 'admin';
  username: string | null;
  profileComplete: boolean;
};

export const favouriteCategories = ['Music', 'Workshop', 'Food', 'Sports', 'Kids'] as const;
export type FavouriteCategory = (typeof favouriteCategories)[number];

export type AuthResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

type ApiErrorResponse = {
  message?: string;
};

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AuthApiError';
    this.status = status;
  }
}

const authApiUrl = process.env.NEXT_PUBLIC_AUTH_API_URL ?? 'http://localhost:4001';

export async function submitCredentials(
  mode: 'login' | 'signup',
  credentials: { email: string; password: string },
): Promise<AuthResponse> {
  let response: Response;
  try {
    response = await fetch(`${authApiUrl}/auth/${mode}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch {
    throw new Error('Could not reach EventNest. Check that the auth service is running.');
  }

  const result = (await response.json().catch(() => ({}))) as AuthResponse & ApiErrorResponse;
  if (!response.ok) {
    throw new AuthApiError(result.message ?? 'We could not sign you in. Please try again.', response.status);
  }

  if (!result.accessToken || !result.user) {
    throw new Error('The server response was incomplete. Please try again.');
  }

  return result;
}

export async function getCurrentUser(token: string, signal?: AbortSignal): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${authApiUrl}/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Could not reach EventNest authentication. Check that the auth service is running.');
  }

  const result = (await response.json().catch(() => ({}))) as { user?: AuthUser } & ApiErrorResponse;
  if (!response.ok) throw new AuthApiError(result.message ?? 'Please sign in again.', response.status);
  if (!result.user) throw new Error('The server response was incomplete.');
  return result.user;
}

export async function saveProfile(
  token: string,
  profile: { username: string },
): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${authApiUrl}/auth/me/profile`, {
      method: 'PATCH',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
  } catch {
    throw new Error('Could not reach EventNest authentication. Check that the auth service is running.');
  }

  const result = (await response.json().catch(() => ({}))) as { user?: AuthUser } & ApiErrorResponse;
  if (!response.ok) throw new AuthApiError(result.message ?? 'We could not save your profile.', response.status);
  if (!result.user) throw new Error('The server response was incomplete.');
  return result.user;
}

const preferencesApiUrl = process.env.NEXT_PUBLIC_PREFERENCES_API_URL ?? 'http://localhost:4003';

export async function getFavouriteCategories(token: string, signal?: AbortSignal): Promise<FavouriteCategory[]> {
  let response: Response;
  try {
    response = await fetch(`${preferencesApiUrl}/preferences/favourites`, {
      headers: { authorization: `Bearer ${token}` }, signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new Error('Could not reach EventNest preferences. Check that the preferences service is running.');
  }
  const result = (await response.json().catch(() => ({}))) as { data?: FavouriteCategory[] } & ApiErrorResponse;
  if (!response.ok) throw new AuthApiError(result.message ?? 'We could not load your favourite categories.', response.status);
  if (!Array.isArray(result.data)) throw new Error('The preferences service returned an incomplete response.');
  return result.data;
}

export async function saveFavouriteCategories(token: string, categories: FavouriteCategory[]): Promise<FavouriteCategory[]> {
  let response: Response;
  try {
    response = await fetch(`${preferencesApiUrl}/preferences/favourites`, {
      method: 'PUT',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
  } catch {
    throw new Error('Could not reach EventNest preferences. Check that the preferences service is running.');
  }
  const result = (await response.json().catch(() => ({}))) as { data?: FavouriteCategory[] } & ApiErrorResponse;
  if (!response.ok) throw new AuthApiError(result.message ?? 'We could not save your favourite categories.', response.status);
  if (!Array.isArray(result.data)) throw new Error('The preferences service returned an incomplete response.');
  return result.data;
}
