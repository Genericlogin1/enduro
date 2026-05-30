const API_BASE = 'https://enduro-production-20f5.up.railway.app/api/v1';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message);
  }
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers, cache: 'no-store' });

  if (res.status === 401) {
    // Only auto-logout if we're not already on an auth page
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/signup')) {
      localStorage.removeItem('enduro_token');
      localStorage.removeItem('enduro_user');
      document.cookie = 'enduro_token=; path=/; max-age=0';
      window.location.href = '/login';
    }
    const body = await res.json().catch(() => ({}));
    const err = body?.error;
    throw new ApiError(err?.code || 'UNAUTHORIZED', err?.message || 'Invalid email or password', 401);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error;
    throw new ApiError(err?.code || 'UNKNOWN', err?.message || 'Request failed', res.status);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}
