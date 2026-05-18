'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function toggleLike(postId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: existing } = await supabase
    .from('likes')
    .select('user_id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', user.id);
  } else {
    await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
  }
  revalidatePath('/');
  revalidatePath('/me');
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const content = String(formData.get('content') || '').trim();
  const location = String(formData.get('location') || '').trim() || null;
  const mediaUrlsRaw = String(formData.get('media_urls') || '');
  const media_urls = mediaUrlsRaw ? mediaUrlsRaw.split(',').filter(Boolean) : [];

  if (!content && media_urls.length === 0) {
    throw new Error('Post must have text or media');
  }

  const { error } = await supabase.from('posts').insert({
    author_id: user.id,
    content,
    location,
    media_urls,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/');
  redirect('/');
}

export async function saveRoute(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim() || null;
  const difficulty = String(formData.get('difficulty') || 'Medium');
  const country = String(formData.get('country') || '').trim() || null;
  const distance_km = parseFloat(String(formData.get('distance_km') || '0')) || null;
  const geojsonRaw = String(formData.get('geojson') || '');
  const start_lat = parseFloat(String(formData.get('start_lat') || ''));
  const start_lng = parseFloat(String(formData.get('start_lng') || ''));

  if (!name || !geojsonRaw) throw new Error('Route name and path are required');

  let geojson;
  try { geojson = JSON.parse(geojsonRaw); } catch { throw new Error('Invalid geojson'); }

  const { error } = await supabase.from('routes').insert({
    author_id: user.id,
    name,
    description,
    difficulty,
    country,
    distance_km,
    geojson,
    start_lat: isNaN(start_lat) ? null : start_lat,
    start_lng: isNaN(start_lng) ? null : start_lng,
  });
  if (error) throw new Error(error.message);

  revalidatePath('/map');
  redirect('/map');
}
