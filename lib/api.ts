const API_BASE = 'https://enduro-production-20f5.up.railway.app/api/v1';

export class ApiError extends Error {
  constructor(public code: string, message: string) {
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

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error;
    throw new ApiError(err?.code || 'UNKNOWN', err?.message || 'Request failed');
  }

  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}
