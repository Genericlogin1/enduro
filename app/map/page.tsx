import Nav from '@/components/Nav';
import MapView from '@/components/MapView';
import MapSearch from '@/components/MapSearch';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }: { searchParams: { q?: string; country?: string; difficulty?: string } }) {
  const params = new URLSearchParams({ limit: '100' });
  if (searchParams.q) params.set('search', searchParams.q);
  if (searchParams.country) params.set('country', searchParams.country);
  if (searchParams.difficulty) params.set('difficulty', searchParams.difficulty);

  const routes = await apiFetch<any[]>(`/routes?${params}`).catch(() => []);
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
