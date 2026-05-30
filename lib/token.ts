'use client';

const KEY = 'enduro_token';
const USER_KEY = 'enduro_user';

export type StoredUser = { id: string; name: string; email: string };

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;

export const setSession = (token: string, user: StoredUser) => {
  localStorage.setItem(KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `enduro_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
};

export const clearSession = () => {
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = 'enduro_token=; path=/; max-age=0';
};

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};
