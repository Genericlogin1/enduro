'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { MAPS_LIBRARIES } from '@/lib/mapsLoader';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const API_BASE = 'https://enduro-production-20f5.up.railway.app/api/v1';

type LiveData = {
  status: string;
  name: string;
  last_point: { lat: number; lng: number; speed: number; altitude: number } | null;
};

export default function LiveMap({
  token, initialLat, initialLng, isActive,
}: {
  token: string;
  initialLat: number | null;
  initialLng: number | null;
  isActive: boolean;
}) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: MAPS_KEY, libraries: MAPS_LIBRARIES });

  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );
  const [speed, setSpeed] = useState(0);
  const [active, setActive] = useState(isActive);
  const mapRef = useRef<google.maps.Map | null>(null);
  const followRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/tracking/live/${token}`);
      if (!res.ok) return;
      const data: LiveData = await res.json();
      setActive(data.status === 'active');
      if (data.last_point) {
        const { lat, lng, speed: spd } = data.last_point;
        setPos({ lat, lng });
        setSpeed(spd ?? 0);
        if (followRef.current && mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!active) return;
    poll(); // immediate first poll
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [active, poll]);

  const center = pos ?? { lat: 55.75, lng: 37.6 };

  if (!isLoaded) {
    return (
      <div className="w-full flex items-center justify-center" style={{ minHeight: '60vh' }}>
        <p className="text-muted text-sm">Загрузка карты...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '60vh', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%', minHeight: '60vh' }}
        center={center}
        zoom={pos ? 15 : 5}
        mapTypeId="satellite"
        options={{ gestureHandling: 'greedy', fullscreenControl: false, streetViewControl: false }}
        onLoad={map => { mapRef.current = map; }}
        onDragStart={() => { followRef.current = false; }}
      >
        {pos && (
          <Marker
            position={pos}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2.5,
              scale: 11,
            }}
          />
        )}
      </GoogleMap>

      {/* Speed overlay */}
      {pos && speed > 0 && (
        <div style={{ position: 'absolute', top: 12, left: 12 }}
          className="bg-base/90 backdrop-blur rounded-xl px-3 py-2 text-center shadow-lg">
          <div className="font-display text-2xl leading-none">{Math.round(speed * 3.6)}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider">км/ч</div>
        </div>
      )}

      {/* Follow button */}
      {pos && (
        <button
          onClick={() => {
            followRef.current = true;
            if (mapRef.current && pos) mapRef.current.panTo(pos);
          }}
          style={{ position: 'absolute', bottom: 16, right: 16 }}
          className="bg-base/90 backdrop-blur border border-line rounded-lg px-3 py-2 text-xs font-semibold shadow-lg"
        >
          📍 Следить
        </button>
      )}

      {/* Status */}
      {!active && (
        <div style={{ position: 'absolute', top: 12, right: 12 }}
          className="bg-base/90 backdrop-blur rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted">
          Сессия завершена
        </div>
      )}

      {!pos && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div className="bg-base/90 backdrop-blur rounded-xl px-4 py-3 text-center">
            <p className="text-2xl mb-1">📡</p>
            <p className="text-sm text-muted">Ожидаю первую GPS-точку...</p>
          </div>
        </div>
      )}
    </div>
  );
}
