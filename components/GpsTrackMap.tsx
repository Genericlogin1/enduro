'use client';

import { useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';

type Point = { lat: number; lng: number; altitude: number; speed: number; recorded_at: string };

export default function GpsTrackMap({ apiKey, points }: { apiKey: string; points: Point[] }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: apiKey });

  const path = useMemo(() => points.map(p => ({ lat: p.lat, lng: p.lng })), [points]);

  const center = useMemo(() => {
    if (path.length === 0) return { lat: 47, lng: 15 };
    const lat = path.reduce((s, p) => s + p.lat, 0) / path.length;
    const lng = path.reduce((s, p) => s + p.lng, 0) / path.length;
    return { lat, lng };
  }, [path]);

  const bounds = useMemo(() => {
    if (typeof window === 'undefined' || !path.length) return undefined;
    return path.reduce(
      (b, p) => ({
        minLat: Math.min(b.minLat, p.lat), maxLat: Math.max(b.maxLat, p.lat),
        minLng: Math.min(b.minLng, p.lng), maxLng: Math.max(b.maxLng, p.lng),
      }),
      { minLat: path[0].lat, maxLat: path[0].lat, minLng: path[0].lng, maxLng: path[0].lng }
    );
  }, [path]);

  if (!apiKey) return <div className="p-6 text-center text-muted">Maps API key not configured.</div>;
  if (!isLoaded) return <div className="p-6 text-center text-muted animate-pulse">Loading map...</div>;
  if (path.length === 0) return <div className="p-6 text-center text-muted">No GPS points recorded.</div>;

  const zoom = bounds
    ? Math.min(16, Math.max(10, 14 - Math.log2(Math.max(
        (bounds.maxLat - bounds.minLat) * 111,
        (bounds.maxLng - bounds.minLng) * 111 * Math.cos(center.lat * Math.PI / 180)
      ) + 0.001)))
    : 14;

  const maxSpeed = Math.max(...points.map(p => p.speed ?? 0));
  const avgSpeed = points.length ? points.reduce((s, p) => s + (p.speed ?? 0), 0) / points.length : 0;
  const maxAlt = Math.max(...points.map(p => p.altitude ?? 0));

  return (
    <div>
      <div style={{ height: '55vh', minHeight: 280 }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={zoom}
          options={{ streetViewControl: false, mapTypeId: 'terrain', fullscreenControl: false }}
        >
          <Polyline
            path={path}
            options={{ strokeColor: '#f97316', strokeWeight: 4, strokeOpacity: 0.9 }}
          />
          {path.length > 0 && (
            <Marker
              position={path[0]}
              label={{ text: 'S', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
            />
          )}
          {path.length > 1 && (
            <Marker
              position={path[path.length - 1]}
              label={{ text: 'F', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}
            />
          )}
        </GoogleMap>
      </div>

      {(maxSpeed > 0 || maxAlt > 0) && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {maxSpeed > 0 && (
            <div className="card p-3 text-center">
              <div className="text-xs text-muted">Max speed</div>
              <div className="font-display text-lg">{(maxSpeed * 3.6).toFixed(0)}</div>
              <div className="text-xs text-muted">km/h</div>
            </div>
          )}
          {avgSpeed > 0 && (
            <div className="card p-3 text-center">
              <div className="text-xs text-muted">Avg speed</div>
              <div className="font-display text-lg">{(avgSpeed * 3.6).toFixed(0)}</div>
              <div className="text-xs text-muted">km/h</div>
            </div>
          )}
          {maxAlt > 0 && (
            <div className="card p-3 text-center">
              <div className="text-xs text-muted">Max alt</div>
              <div className="font-display text-lg">{Math.round(maxAlt)}</div>
              <div className="text-xs text-muted">m</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
