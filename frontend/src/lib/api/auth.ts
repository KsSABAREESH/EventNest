export type AuthUser = {
  id: string;
  email: string;
  role: 'member' | 'admin';
};

export type AuthResponse = {
  tokenType: 'Bearer';
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
};

type ApiErrorResponse = {
  message?: string;
};

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
    throw new Error(result.message ?? 'We could not sign you in. Please try again.');
  }

  if (!result.accessToken || !result.user) {
    throw new Error('The server response was incomplete. Please try again.');
  }

  return result;
}
