import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import MapView from '@/components/MapView';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = await createClient();
  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, description, difficulty, distance_km, geojson, start_lat, start_lng, country, profiles:profiles!routes_author_id_fkey(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Routes</h1>
          <p className="text-xs text-zinc-500">Draw your route and share it</p>
        </div>
      </header>
      <MapView apiKey={apiKey} routes={(routes as any) || []} />
      <Nav active="map" />
    </div>
  );
}
import { createClient } from '@/lib/supabase/server';
import Nav from '@/components/Nav';
import MapView from '@/components/MapView';

export const dynamic = 'force-dynamic';

export default async function MapPage() {
  const supabase = await createClient();
  const { data: routes } = await supabase
    .from('routes')
    .select('id, name, description, difficulty, distance_km, geojson, start_lat, start_lng, country, profiles:profiles!routes_author_id_fkey(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Routes</h1>
          <p className="text-xs text-zinc-500">Draw your route and share it</p>
        </div>
      </header>
      <MapView apiKey={apiKey} routes={routes || []} />
      <Nav active="map" />
    </div>
  );
}
