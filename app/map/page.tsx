import MapView from '@/components/MapView';
import MapSearch from '@/components/MapSearch';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function MapPage({ searchParams }: { searchParams: { q?: string; country?: string; difficulty?: string } }) {
  const token = await getServerToken();
  const params = new URLSearchParams({ limit: '100' });
  if (searchParams.q) params.set('search', searchParams.q);
  if (searchParams.country) params.set('country', searchParams.country);
  if (searchParams.difficulty) params.set('difficulty', searchParams.difficulty);

  const data = await apiFetch<{ routes: any[] }>(`/routes?${params}`, {}, token).catch(() => ({ routes: [] }));
  const routes = data?.routes ?? [];
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <div className="flex flex-col" style={{ height: '100dvh' }}>
      <header className="px-4 py-3 border-b border-line flex-shrink-0">
        <div className="max-w-full flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl leading-none">Маршруты</h1>
            <p className="text-[11px] text-muted mt-0.5">Нарисуй маршрут и поделись</p>
          </div>
          <span className="chip">{routes.length} найдено</span>
        </div>
      </header>
      <MapSearch initial={searchParams} />
      <div className="flex-1 overflow-hidden">
        <MapView apiKey={apiKey} routes={routes} />
      </div>
      
    </div>
  );
}
