'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, DrawingManager, Polyline, Marker } from '@react-google-maps/api';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

const libraries: ('drawing' | 'places' | 'geometry')[] = ['drawing', 'geometry'];

function haversineKm(coords: { lat: number; lng: number }[]): number {
  if (coords.length < 2) return 0;
  const R = 6371;
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1], b = coords[i];
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
    total += 2 * R * Math.asin(Math.sqrt(x));
  }
  return Math.round(total * 100) / 100;
}

type Route = {
  id: string;
  name: string;
  difficulty: string | null;
  distance_km: number | null;
  geojson: any;
  start_lat: number | null;
  start_lng: number | null;
  country: string | null;
  profiles?: { username: string | null; display_name: string | null } | null;
};

export default function MapView({ apiKey, routes }: { apiKey: string; routes: Route[] }) {
  const router = useRouter();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries });
  const [path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const drawingRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const center = useMemo(() => ({ lat: 47, lng: 15 }), []);
  const distance = haversineKm(path);

  const onPolylineComplete = useCallback((polyline: google.maps.Polyline) => {
    const arr = polyline.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
    setPath(arr);
    polyline.setMap(null);
    if (drawingRef.current) drawingRef.current.setDrawingMode(null);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { setError('Route name required'); return; }
    if (path.length < 2) { setError('Draw a route first (at least 2 points)'); return; }
    const token = getToken();
    if (!token) { router.push('/login?next=/map'); return; }
    setError(null);
    setSaving(true);
    try {
      const geojson = { type: 'LineString', coordinates: path.map(p => [p.lng, p.lat]) };
      await apiFetch('/routes', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          difficulty,
          country: country.trim() || null,
          distance_km: distance,
          geojson,
          start_lat: path[0].lat,
          start_lng: path[0].lng,
        }),
      }, token);
      setPath([]); setName(''); setDescription(''); setCountry('');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to save route');
    } finally {
      setSaving(false);
    }
  };

  if (!apiKey) return <div className="p-6 text-center text-zinc-400">Google Maps API key is not configured.</div>;
  if (!isLoaded) return <div className="p-6 text-center text-zinc-500">Loading map...</div>;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={4}
          options={{ streetViewControl: false, mapTypeId: 'terrain' }}
        >
          <DrawingManager
            onLoad={dm => { drawingRef.current = dm; }}
            onPolylineComplete={onPolylineComplete}
            options={{
              drawingControl: true,
              drawingControlOptions: { drawingModes: ['polyline' as any] },
              polylineOptions: { strokeColor: '#f97316', strokeWeight: 4, editable: true },
            }}
          />
          {path.length > 1 && (
            <Polyline path={path} options={{ strokeColor: '#f97316', strokeWeight: 4 }} />
          )}
          {routes.map(r => {
            const coords = r.geojson?.coordinates?.map((c: number[]) => ({ lat: c[1], lng: c[0] })) || [];
            if (coords.length < 2) return null;
            return (
              <Polyline
                key={r.id}
                path={coords}
                options={{ strokeColor: activeRoute?.id === r.id ? '#22d3ee' : '#71717a', strokeWeight: activeRoute?.id === r.id ? 5 : 3, strokeOpacity: 0.7 }}
                onClick={() => setActiveRoute(r)}
              />
            );
          })}
          {routes.filter(r => r.start_lat && r.start_lng).map(r => (
            <Marker key={'m-' + r.id} position={{ lat: r.start_lat as number, lng: r.start_lng as number }} onClick={() => setActiveRoute(r)} />
          ))}
        </GoogleMap>

        {activeRoute && (
          <div className="absolute top-2 left-2 right-2 max-w-sm bg-zinc-900/95 border border-zinc-800 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{activeRoute.name}</div>
                <div className="text-xs text-zinc-400">
                  {activeRoute.country && activeRoute.country + ' · '}
                  {activeRoute.distance_km && activeRoute.distance_km + ' km · '}
                  {activeRoute.difficulty}
                </div>
              </div>
              <button onClick={() => setActiveRoute(null)} className="text-zinc-500 hover:text-zinc-300">✕</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-zinc-900 border-t border-zinc-800 p-3 space-y-2">
        {path.length > 0 ? (
          <>
            <div className="text-sm text-zinc-400">Drawn: {path.length} points · {distance} km</div>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Route name (required)" className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm">
                <option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option>
              </select>
              <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm" />
            </div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" rows={2} className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm" />
            {error && <div className="text-red-400 text-xs">{error}</div>}
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded py-2">{saving ? 'Saving...' : 'Save route'}</button>
              <button onClick={() => { setPath([]); setError(null); }} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 rounded">Clear</button>
            </div>
          </>
        ) : (
          <div className="text-sm text-zinc-500 text-center py-2">Use the polyline tool on the map to draw your route, then fill in the details to save.</div>
        )}
      </div>
    </div>
  );
}
