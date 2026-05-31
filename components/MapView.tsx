'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, DrawingManager, Polyline, Marker } from '@react-google-maps/api';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';
import { MAPS_LIBRARIES } from '@/lib/mapsLoader';
import Link from 'next/link';

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
  route_type?: string;
  avg_rating: number;
  rating_count: number;
};

type GpsTrack = {
  id: string;
  name: string;
  status: string;
  started_at: string;
  points: { lat: number; lng: number }[];
};

type Spot = {
  id: string;
  author_id: string;
  author_name: string;
  title: string;
  description: string;
  kind: string;
  lat: number;
  lng: number;
  country: string;
  upvotes: number;
  my_vote: number;
};

const SPOT_KINDS = [
  { id: 'danger', label: '⚠️ Опасность', color: '#ef4444' },
  { id: 'view',   label: '🌄 Панорама',  color: '#3b82f6' },
  { id: 'fuel',   label: '⛽ Заправка',  color: '#f59e0b' },
  { id: 'camp',   label: '🏕️ Лагерь',   color: '#10b981' },
  { id: 'tech',   label: '🔧 Помощь',    color: '#8b5cf6' },
  { id: 'mud',    label: '🪨 Грязь',     color: '#92400e' },
];

const SPOT_EMOJI: Record<string, string> = {
  danger: '⚠️', view: '🌄', fuel: '⛽', camp: '🏕️', tech: '🔧', mud: '🪨',
};

type ActiveItem =
  | { kind: 'route'; data: Route }
  | { kind: 'gps'; data: GpsTrack };

export default function MapView({ apiKey, routes }: { apiKey: string; routes: Route[] }) {
  const router = useRouter();
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries: MAPS_LIBRARIES });
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingRef = useRef<google.maps.drawing.DrawingManager | null>(null);

  const [path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [country, setCountry] = useState('');
  const [routeType, setRouteType] = useState<'personal' | 'tour'>('personal');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ActiveItem | null>(null);
  const [gpsTracks, setGpsTracks] = useState<GpsTrack[]>([]);
  const [tab, setTab] = useState<'routes' | 'gps' | 'draw' | 'spots'>('routes');
  const [sortBy, setSortBy] = useState<'created_at' | 'rating'>('created_at');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [spotKind, setSpotKind] = useState('danger');
  const [spotTitle, setSpotTitle] = useState('');
  const [spotDesc, setSpotDesc] = useState('');
  const [addingSpot, setAddingSpot] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [savingSpot, setSavingSpot] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiFetch<{ sessions: any[] }>('/tracking/sessions?limit=20', {}, token)
      .then(async d => {
        const sessions = d?.sessions ?? [];
        const tracks = await Promise.all(
          sessions.map(async s => {
            const full = await apiFetch<any>(`/tracking/sessions/${s.id}`, {}, token).catch(() => null);
            const pts = (full?.points ?? []).map((p: any) => ({ lat: p.lat, lng: p.lng }));
            return { id: s.id, name: s.name || 'Без названия', status: s.status, started_at: s.started_at, points: pts };
          })
        );
        const withPoints = tracks.filter(t => t.points.length > 0);
        setGpsTracks(withPoints);

        // Авто-зум: если есть GPS треки, показать их область
        if (withPoints.length > 0 && mapRef.current) {
          fitToTracks(withPoints, mapRef.current);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch<{ spots: Spot[] }>('/spots?limit=500')
      .then(d => setSpots(d?.spots ?? []))
      .catch(() => {});
  }, []);

  async function handleMapClick(e: google.maps.MapMouseEvent) {
    if (!addingSpot || !e.latLng) return;
    setPendingLatLng({ lat: e.latLng.lat(), lng: e.latLng.lng() });
  }

  async function saveSpot() {
    if (!pendingLatLng || !spotTitle.trim()) return;
    const token = getToken();
    if (!token) return;
    setSavingSpot(true);
    try {
      const sp = await apiFetch<Spot>('/spots', {
        method: 'POST',
        body: JSON.stringify({ title: spotTitle.trim(), description: spotDesc.trim(), kind: spotKind, lat: pendingLatLng.lat, lng: pendingLatLng.lng }),
      }, token);
      if (sp) setSpots(prev => [sp, ...prev]);
      setPendingLatLng(null);
      setSpotTitle('');
      setSpotDesc('');
      setAddingSpot(false);
    } catch {}
    setSavingSpot(false);
  }

  async function voteSpot(spotId: string, value: number) {
    const token = getToken();
    if (!token) return;
    try {
      const res = await apiFetch<{ upvotes: number; my_vote: number }>(`/spots/${spotId}/vote`, {
        method: 'POST', body: JSON.stringify({ value }),
      }, token);
      if (res) setSpots(prev => prev.map(s => s.id === spotId ? { ...s, upvotes: res.upvotes, my_vote: res.my_vote } : s));
    } catch {}
  }

  async function deleteSpot(spotId: string) {
    const token = getToken();
    if (!token) return;
    await apiFetch(`/spots/${spotId}`, { method: 'DELETE' }, token).catch(() => {});
    setSpots(prev => prev.filter(s => s.id !== spotId));
  }

  function fitToTracks(tracks: GpsTrack[], map: google.maps.Map) {
    const bounds = new google.maps.LatLngBounds();
    tracks.forEach(t => t.points.forEach(p => bounds.extend(p)));
    if (!bounds.isEmpty()) map.fitBounds(bounds, 60);
  }

  function fitToTrack(track: GpsTrack) {
    if (!mapRef.current || track.points.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    track.points.forEach(p => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 80);
  }

  function fitToRoute(route: Route) {
    if (!mapRef.current) return;
    const coords = route.geojson?.coordinates?.map((c: number[]) => ({ lat: c[1], lng: c[0] })) || [];
    if (coords.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    coords.forEach((p: any) => bounds.extend(p));
    mapRef.current.fitBounds(bounds, 80);
  }

  const center = useMemo(() => ({ lat: 47, lng: 15 }), []);
  const distance = haversineKm(path);

  const onPolylineComplete = useCallback((polyline: google.maps.Polyline) => {
    const arr = polyline.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
    setPath(arr);
    polyline.setMap(null);
    if (drawingRef.current) drawingRef.current.setDrawingMode(null);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) { setError('Введи название маршрута'); return; }
    if (path.length < 2) { setError('Нарисуй маршрут (минимум 2 точки)'); return; }
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
          route_type: routeType,
          distance_km: distance,
          geojson,
          start_lat: path[0].lat,
          start_lng: path[0].lng,
        }),
      }, token);
      setPath([]); setName(''); setDescription(''); setCountry('');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  if (!apiKey) return <div className="p-6 text-center text-muted">Google Maps API key не настроен.</div>;
  if (!isLoaded) return <div className="p-6 text-center text-muted">Загрузка карты...</div>;

  const diffColor: Record<string, string> = { Easy: '#4ade80', Medium: '#facc15', Hard: '#f97316', Expert: '#ef4444' };

  return (
    <div className="flex" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0 bg-bg-elev-1 border-r border-line flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-line">
          {(['routes', 'gps', 'spots', 'draw'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t !== 'spots') setAddingSpot(false); }}
              className={'flex-1 py-2 text-[10px] font-semibold transition-colors ' +
                (tab === t ? 'text-moss-strong border-b-2 border-moss-strong' : 'text-muted hover:text-ink')}
            >
              {t === 'routes' ? `Маршруты` : t === 'gps' ? `GPS` : t === 'spots' ? `Споты (${spots.length})` : 'Нарисовать'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Routes tab */}
          {tab === 'routes' && (
            <div className="p-2 space-y-1">
              {/* Sort + Legend */}
              {routes.length > 0 && (
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex gap-3 text-[10px] text-muted">
                    <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-green-400 inline-block" />Личные</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-1 rounded-full bg-orange-400 inline-block" />Туры</span>
                  </div>
                  <button
                    onClick={() => setSortBy(s => s === 'rating' ? 'created_at' : 'rating')}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${sortBy === 'rating' ? 'bg-accent/20 text-accent' : 'text-muted hover:text-ink'}`}
                  >
                    {sortBy === 'rating' ? '★ Рейтинг' : 'Новые'}
                  </button>
                </div>
              )}
              {routes.length === 0 ? (
                <div className="p-4 text-center text-muted text-xs">
                  Нет маршрутов. Перейди на вкладку «Нарисовать» и создай первый!
                </div>
              ) : [...routes].sort((a, b) => sortBy === 'rating'
                  ? (b.avg_rating ?? 0) - (a.avg_rating ?? 0)
                  : 0
                ).map(r => (
                <button
                  key={r.id}
                  onClick={() => { setActive({ kind: 'route', data: r }); fitToRoute(r); }}
                  className={'w-full text-left p-2.5 rounded-lg transition-colors ' +
                    (active?.kind === 'route' && active.data.id === r.id ? 'bg-moss/15 text-ink' : 'hover:bg-bg-elev-2')}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.route_type === 'tour' ? 'bg-orange-400' : 'bg-green-400'}`} />
                    <div className="text-sm font-semibold truncate">{r.name}</div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap pl-3.5">
                    {r.difficulty && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${diffColor[r.difficulty]}20`, color: diffColor[r.difficulty] }}>
                        {r.difficulty}
                      </span>
                    )}
                    {r.distance_km && <span className="text-[10px] text-muted">{r.distance_km} km</span>}
                    {r.country && <span className="text-[10px] text-muted">{r.country}</span>}
                    {r.route_type === 'tour' && <span className="text-[10px] text-orange-400 font-bold">Тур</span>}
                    {r.avg_rating > 0 && (
                      <span className="text-[10px] font-bold" style={{ color: 'rgb(var(--accent))' }}>
                        ★ {r.avg_rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* GPS tab */}
          {tab === 'gps' && (
            <div className="p-2 space-y-1">
              {gpsTracks.length === 0 ? (
                <div className="p-4 text-center text-muted text-xs">
                  Нет GPS-треков. Запиши поездку на вкладке GPS.
                </div>
              ) : gpsTracks.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setActive({ kind: 'gps', data: t }); fitToTrack(t); }}
                  className={'w-full text-left p-2.5 rounded-lg transition-colors ' +
                    (active?.kind === 'gps' && active.data.id === t.id ? 'bg-moss/15 text-ink' : 'hover:bg-bg-elev-2')}
                >
                  <div className="text-sm font-semibold truncate">{t.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${t.status === 'active' ? 'bg-rust/20 text-rust-strong' : 'bg-moss/15 text-moss-strong'}`}>
                      {t.status === 'active' ? 'live' : 'done'}
                    </span>
                    <span className="text-[10px] text-muted">{t.points.length} точек</span>
                  </div>
                </button>
              ))}
              {gpsTracks.length > 0 && (
                <button
                  onClick={() => { setActive(null); if (mapRef.current) fitToTracks(gpsTracks, mapRef.current); }}
                  className="w-full text-center text-xs text-moss-strong py-2 hover:underline"
                >
                  Показать все треки
                </button>
              )}
            </div>
          )}

          {/* Spots tab */}
          {tab === 'spots' && (
            <div className="p-3 space-y-2">
              <button
                onClick={() => { setAddingSpot(a => !a); setPendingLatLng(null); }}
                className={`w-full py-2 rounded-lg text-xs font-bold border-2 transition-all ${addingSpot ? 'border-rust bg-rust/10 text-rust-strong' : 'border-moss-strong bg-moss/10 text-moss-strong'}`}
              >
                {addingSpot ? '✕ Отменить' : '+ Добавить спот'}
              </button>

              {addingSpot && !pendingLatLng && (
                <p className="text-xs text-muted text-center py-2">👆 Нажми на карту, чтобы выбрать место</p>
              )}

              {addingSpot && pendingLatLng && (
                <div className="space-y-2 p-2 bg-moss/5 rounded-lg border border-moss/20">
                  <div className="grid grid-cols-3 gap-1">
                    {SPOT_KINDS.map(k => (
                      <button key={k.id} type="button" onClick={() => setSpotKind(k.id)}
                        className={`text-[10px] py-1 rounded-md border transition-all ${spotKind === k.id ? 'border-current font-bold' : 'border-line text-muted'}`}
                        style={spotKind === k.id ? { color: k.color, borderColor: k.color, background: k.color + '15' } : {}}
                      >
                        {k.label}
                      </button>
                    ))}
                  </div>
                  <input
                    value={spotTitle}
                    onChange={e => setSpotTitle(e.target.value)}
                    placeholder="Название *"
                    className="input text-xs"
                  />
                  <input
                    value={spotDesc}
                    onChange={e => setSpotDesc(e.target.value)}
                    placeholder="Описание (необязательно)"
                    className="input text-xs"
                  />
                  <button onClick={saveSpot} disabled={savingSpot || !spotTitle.trim()} className="btn btn-primary w-full text-xs py-1.5 disabled:opacity-50">
                    {savingSpot ? 'Сохраняю...' : 'Сохранить спот'}
                  </button>
                </div>
              )}

              <div className="space-y-1 mt-1">
                {spots.length === 0 && (
                  <p className="text-xs text-muted text-center py-4">Нет спотов. Добавь первый!</p>
                )}
                {spots.map(sp => {
                  const kindInfo = SPOT_KINDS.find(k => k.id === sp.kind);
                  return (
                    <div key={sp.id} className="p-2 rounded-lg bg-bg-elev-2 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span>{SPOT_EMOJI[sp.kind] || '📍'}</span>
                          <span className="text-xs font-semibold truncate">{sp.title}</span>
                        </div>
                        <button
                          onClick={() => mapRef.current?.panTo({ lat: sp.lat, lng: sp.lng })}
                          className="text-[10px] text-moss-strong hover:underline shrink-0"
                        >↗</button>
                      </div>
                      {sp.description && <p className="text-[10px] text-muted pl-5">{sp.description}</p>}
                      <div className="flex items-center justify-between pl-5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => voteSpot(sp.id, sp.my_vote === 1 ? 0 : 1)}
                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${sp.my_vote === 1 ? 'text-moss-strong' : 'text-muted hover:text-moss-strong'}`}>
                            👍 {sp.upvotes > 0 ? sp.upvotes : ''}
                          </button>
                          <button onClick={() => voteSpot(sp.id, sp.my_vote === -1 ? 0 : -1)}
                            className={`text-xs px-1.5 py-0.5 rounded transition-colors ${sp.my_vote === -1 ? 'text-rust-strong' : 'text-muted hover:text-rust-strong'}`}>
                            👎
                          </button>
                        </div>
                        <span className="text-[10px] text-muted">{sp.author_name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Draw tab */}
          {tab === 'draw' && (
            <div className="p-3 space-y-2">
              <p className="text-xs text-muted mb-3">
                Нажми на инструмент линии на карте, нарисуй маршрут, затем заполни форму.
              </p>
              {path.length > 0 ? (
                <>
                  <div className="text-xs text-muted">{path.length} точек · {distance} км</div>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Название маршрута *"
                    className="input text-sm"
                  />
                  {/* Route type */}
                  <div className="grid grid-cols-2 gap-2">
                    {(['personal', 'tour'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setRouteType(t)}
                        className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                          routeType === t
                            ? t === 'tour' ? 'border-orange-400 bg-orange-400/20 text-orange-500' : 'border-green-500 bg-green-500/20 text-green-600'
                            : 'border-line text-muted hover:border-moss/40'
                        }`}
                      >
                        {t === 'personal' ? '🏍 Личный' : '🏕️ Тур'}
                      </button>
                    ))}
                  </div>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value)}
                    className="input text-sm"
                  >
                    <option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option>
                  </select>
                  <input
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="Страна"
                    className="input text-sm"
                  />
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Описание (необязательно)"
                    rows={2}
                    className="input text-sm resize-none"
                  />
                  {error && <div className="text-rust-strong text-xs">{error}</div>}
                  <button onClick={handleSave} disabled={saving} className="btn btn-primary w-full">
                    {saving ? 'Сохраняю...' : 'Сохранить маршрут'}
                  </button>
                  <button onClick={() => { setPath([]); setError(null); }} className="btn btn-ghost w-full text-xs">
                    Очистить
                  </button>
                </>
              ) : (
                <div className="text-xs text-muted text-center py-4">
                  Используй инструмент «Ломаная» на карте чтобы нарисовать маршрут
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={4}
          options={{ streetViewControl: false, mapTypeId: 'terrain', fullscreenControl: false }}
          onLoad={map => { mapRef.current = map; }}
          onClick={handleMapClick}
        >
          <DrawingManager
            onLoad={dm => { drawingRef.current = dm; }}
            onPolylineComplete={onPolylineComplete}
            options={{
              drawingControl: tab === 'draw',
              drawingControlOptions: { drawingModes: ['polyline' as any] },
              polylineOptions: { strokeColor: '#f97316', strokeWeight: 4, editable: true },
            }}
          />
          {path.length > 1 && (
            <Polyline path={path} options={{ strokeColor: '#f97316', strokeWeight: 4 }} />
          )}

          {/* Saved routes */}
          {routes.map(r => {
            const coords = r.geojson?.coordinates?.map((c: number[]) => ({ lat: c[1], lng: c[0] })) || [];
            if (coords.length < 2) return null;
            const isActive = active?.kind === 'route' && active.data.id === r.id;
            const isTour = r.route_type === 'tour';
            // Personal routes: green | Tour routes: orange
            const baseColor = isTour ? '#f97316' : '#4ade80';
            const activeColor = isTour ? '#fb923c' : '#86efac';
            return (
              <Polyline
                key={r.id}
                path={coords}
                options={{
                  strokeColor: isActive ? activeColor : baseColor,
                  strokeWeight: isActive ? 5 : 3,
                  strokeOpacity: 0.85,
                }}
                onClick={() => { setActive({ kind: 'route', data: r }); setTab('routes'); }}
              />
            );
          })}
          {routes.filter(r => r.start_lat && r.start_lng).map(r => (
            <Marker
              key={'m-' + r.id}
              position={{ lat: r.start_lat as number, lng: r.start_lng as number }}
              onClick={() => { setActive({ kind: 'route', data: r }); setTab('routes'); }}
            />
          ))}

          {/* GPS tracks */}
          {gpsTracks.map(t => {
            if (t.points.length < 2) return null;
            const isActive = active?.kind === 'gps' && active.data.id === t.id;
            return (
              <Polyline
                key={'gps-' + t.id}
                path={t.points}
                options={{
                  strokeColor: isActive ? '#22d3ee' : '#06b6d4',
                  strokeWeight: isActive ? 5 : 3,
                  strokeOpacity: isActive ? 1 : 0.7,
                  zIndex: isActive ? 10 : 1,
                }}
                onClick={() => { setActive({ kind: 'gps', data: t }); setTab('gps'); }}
              />
            );
          })}
          {gpsTracks.map(t => t.points.length > 0 ? (
            <Marker
              key={'gps-start-' + t.id}
              position={t.points[0]}
              onClick={() => { setActive({ kind: 'gps', data: t }); setTab('gps'); }}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 6, fillColor: '#22d3ee', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
            />
          ) : null)}

          {/* Spot markers */}
          {spots.map(sp => {
            const kindInfo = SPOT_KINDS.find(k => k.id === sp.kind);
            return (
              <Marker
                key={'spot-' + sp.id}
                position={{ lat: sp.lat, lng: sp.lng }}
                onClick={() => { setTab('spots'); }}
                label={{ text: SPOT_EMOJI[sp.kind] || '📍', fontSize: '18px' }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 14,
                  fillColor: kindInfo?.color ?? '#ef4444',
                  fillOpacity: 0.85,
                  strokeColor: '#fff',
                  strokeWeight: 2,
                }}
              />
            );
          })}

          {/* Pending spot marker */}
          {pendingLatLng && (
            <Marker
              position={pendingLatLng}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: '#f97316', fillOpacity: 1, strokeColor: '#fff', strokeWeight: 2 }}
            />
          )}
        </GoogleMap>

        {/* Active item info popup */}
        {active && (
          <div className="absolute top-3 right-3 w-60 bg-bg-elev-1/95 backdrop-blur border border-line rounded-xl p-3 shadow-lg text-sm">
            <div className="flex justify-between items-start mb-1">
              <div>
                <div className="font-semibold text-sm">{active.data.name}</div>
                {active.kind === 'route' && (
                  <div className="text-xs text-muted mt-0.5">
                    {active.data.country && active.data.country + ' · '}
                    {active.data.distance_km && active.data.distance_km + ' km · '}
                    {active.data.difficulty}
                  </div>
                )}
                {active.kind === 'gps' && (
                  <div className="text-xs text-muted mt-0.5">
                    {active.data.points.length} точек · {active.data.status === 'active' ? '🔴 live' : 'завершён'}
                  </div>
                )}
              </div>
              <button onClick={() => setActive(null)} className="text-muted hover:text-ink ml-2">✕</button>
            </div>
            {active.kind === 'gps' && (
              <Link
                href={`/gps/sessions/${active.data.id}`}
                className="mt-2 block text-center btn btn-ghost text-xs py-1"
              >
                Открыть детали →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
