import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import MapView from '@/components/MapView';
import MapSearch from '@/components/MapSearch';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }: { searchParams: { q?: string; country?: string; difficulty?: string; min?: string; max?: string } }) {
  const supabase = await createClient();
  let query = supabase
    .from('routes')
    .select('id, name, description, difficulty, distance_km, geojson, start_lat, start_lng, country, profiles:profiles!routes_author_id_fkey(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (searchParams.q) {
    const q = searchParams.q.replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }
  if (searchParams.country) query = query.ilike('country', '%' + searchParams.country + '%');
  if (searchParams.difficulty) query = query.eq('difficulty', searchParams.difficulty);
  if (searchParams.min) query = query.gte('distance_km', Number(searchParams.min));
  if (searchParams.max) query = query.lte('distance_km', Number(searchParams.max));

  const { data: routes } = await query;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="min-h-screen">
      <header className="px-4 py-3 border-b border-line">
        <div className="max-w-xl mx-auto flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl leading-none">Routes</h1>
            <p className="text-[11px] text-muted mt-0.5">Draw your route and share it</p>
          </div>
          <span className="chip">{routes?.length || 0} found</span>
        </div>
      </header>
      <MapSearch initial={searchParams} />
      <MapView apiKey={apiKey} routes={(routes as any) || []} />
      <Nav active="map" />
    </div>
  );
}
