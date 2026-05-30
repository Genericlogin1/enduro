'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

type LiveData = {
  status: string;
  last_point: { lat: number; lng: number; speed: number; altitude: number; recorded_at: string } | null;
};

export default function LiveMap({
  token, initialLat, initialLng, isActive,
}: {
  token: string;
  initialLat: number | null;
  initialLng: number | null;
  isActive: boolean;
}) {
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  );
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
        const { lat, lng } = data.last_point;
        setPos({ lat, lng });
        if (followRef.current && mapRef.current) {
          mapRef.current.panTo({ lat, lng });
        }
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [active, poll]);

  const center = pos ?? { lat: 55.75, lng: 37.6 };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '60vh', position: 'relative' }}>
      <LoadScript googleMapsApiKey={MAPS_KEY}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%', minHeight: '60vh' }}
          center={center}
          zoom={pos ? 15 : 5}
          mapTypeId="satellite"
          options={{ gestureHandling: 'greedy', disableDefaultUI: false }}
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
                strokeWeight: 2,
                scale: 10,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {/* Follow button */}
      {pos && (
        <button
          onClick={() => {
            followRef.current = true;
            if (mapRef.current && pos) mapRef.current.panTo(pos);
          }}
          style={{ position: 'absolute', bottom: 16, right: 16 }}
          className="bg-base/90 backdrop-blur border border-line rounded-lg px-3 py-2 text-xs font-semibold shadow-lg z-10"
        >
          📍 Следить
        </button>
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
