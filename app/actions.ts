'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { apiFetch } from '@/lib/api';

async function getToken(): Promise<string | null> {
  return (await cookies()).get('enduro_token')?.value ?? null;
}

export async function toggleLike(postId: string) {
  const token = await getToken();
  if (!token) redirect('/login');
  await apiFetch(`/posts/${postId}/like`, { method: 'POST' }, token);
  revalidatePath('/');
  revalidatePath('/me');
}

export async function createPost(formData: FormData) {
  const token = await getToken();
  if (!token) redirect('/login');

  const content = String(formData.get('content') || '').trim();
  const location = String(formData.get('location') || '').trim() || null;

  if (!content) throw new Error('Post must have text');

  await apiFetch('/posts', {
    method: 'POST',
    body: JSON.stringify({ content, location, media_urls: [] }),
  }, token);

  revalidatePath('/');
  redirect('/');
}

export async function saveRoute(formData: FormData) {
  const token = await getToken();
  if (!token) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const difficulty = String(formData.get('difficulty') || 'Medium');
  const country = String(formData.get('country') || '').trim() || null;
  const distance_km = parseFloat(String(formData.get('distance_km') || '0')) || 0;
  const geojsonRaw = String(formData.get('geojson') || '');
  const start_lat = parseFloat(String(formData.get('start_lat') || ''));
  const start_lng = parseFloat(String(formData.get('start_lng') || ''));

  if (!name || !geojsonRaw) throw new Error('Route name and path are required');

  let geojson;
  try { geojson = JSON.parse(geojsonRaw); } catch { throw new Error('Invalid geojson'); }

  await apiFetch('/routes', {
    method: 'POST',
    body: JSON.stringify({
      name, description, difficulty, country, distance_km, geojson,
      start_lat: isNaN(start_lat) ? 0 : start_lat,
      start_lng: isNaN(start_lng) ? 0 : start_lng,
    }),
  }, token);

  revalidatePath('/map');
  redirect('/map');
}
