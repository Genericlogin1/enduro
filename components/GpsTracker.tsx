'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

type Point = { lat: number; lng: number; altitude: number; speed: number };
type Session = { id: string; name: string; status: string; started_at: string };

const WS_BASE = 'wss://enduro-production-20f5.up.railway.app/api/v1/tracking/ws';

export default function GpsTracker() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'starting' | 'recording' | 'finishing' | 'done'>('idle');
  const [session, setSession] = useState<Session | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [noAuth, setNoAuth] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const watchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!getToken()) setNoAuth(true);
  }, []);

  useEffect(() => {
    if (status === 'recording') {
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const sendPoint = useCallback((ws: WebSocket, pos: GeolocationPosition) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    const pt: Point = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      altitude: pos.coords.altitude ?? 0,
      speed: pos.coords.speed ?? 0,
    };
    ws.send(JSON.stringify({ ...pt, recorded_at: new Date(pos.timestamp).toISOString() }));
    setLastPoint(pt);
    setPoints(prev => [...prev, pt]);
  }, []);

  async function startRecording() {
    setError(null);
    setGeoError(null);
    const token = getToken();
    if (!token) { setNoAuth(true); return; }
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }
    setStatus('starting');
    try {
      const name = sessionName.trim() || `Ride ${new Date().toLocaleDateString()}`;
      const sess = await apiFetch<Session>('/tracking/sessions', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }, token);
      setSession(sess);
      setPoints([]);
      setElapsed(0);

      const ws = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('recording');
        watchRef.current = navigator.geolocation.watchPosition(
          (pos) => sendPoint(ws, pos),
          (err) => setGeoError(err.message),
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
        );
      };

      ws.onerror = () => setError('WebSocket connection failed — check your connection');
      ws.onclose = (e) => {
        if (watchRef.current !== null) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
      };
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
      setStatus('idle');
    }
  }

  async function stopRecording() {
    if (!session) return;
    setStatus('finishing');
    const token = getToken();

    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    try {
      await apiFetch(`/tracking/sessions/${session.id}/finish`, { method: 'PATCH' }, token);
      setStatus('done');
    } catch (e: any) {
      setError(e.message || 'Failed to finish session');
      setStatus('recording');
    }
  }

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (noAuth) {
    return (
      <div className="card p-6 text-center space-y-3">
        <p className="text-muted">You need to sign in to record GPS tracks.</p>
        <button onClick={() => router.push('/login?next=/gps')} className="btn btn-primary">Sign in</button>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="text-4xl">🏁</div>
        <h2 className="font-display text-2xl text-ink">Ride saved!</h2>
        <p className="text-sm text-muted">Duration: {formatTime(elapsed)}</p>
        <p className="text-sm text-muted">Points recorded: {points.length}</p>
        <button
          onClick={() => { setStatus('idle'); setSession(null); setPoints([]); setElapsed(0); setLastPoint(null); setSessionName(''); }}
          className="btn btn-primary w-full"
        >
          Record another ride
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 space-y-4">
        {status === 'idle' && (
          <>
            <div className="text-center space-y-1">
              <div className="text-5xl mb-2">📍</div>
              <h2 className="font-display text-xl text-ink">Ready to ride?</h2>
              <p className="text-sm text-muted">Your GPS track will be recorded in real-time</p>
            </div>
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder={`Ride ${new Date().toLocaleDateString()}`}
              className="input w-full"
            />
            <button onClick={startRecording} className="btn btn-primary w-full py-3 text-base">
              Start recording
            </button>
          </>
        )}

        {status === 'starting' && (
          <div className="text-center py-6 text-muted">
            <div className="animate-pulse text-4xl mb-3">📡</div>
            <p>Connecting to server...</p>
          </div>
        )}

        {status === 'recording' && (
          <>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rust-strong animate-pulse" />
                <span className="text-rust-strong font-semibold text-sm uppercase tracking-wider">Recording</span>
              </div>
              <div className="font-display text-5xl text-ink">{formatTime(elapsed)}</div>
              <p className="text-sm text-muted">{points.length} points captured</p>
            </div>

            {lastPoint && (
              <div className="bg-zinc-900 rounded-lg p-3 text-xs text-muted font-mono space-y-1">
                <div>Lat: {lastPoint.lat.toFixed(6)}</div>
                <div>Lng: {lastPoint.lng.toFixed(6)}</div>
                {lastPoint.altitude > 0 && <div>Alt: {Math.round(lastPoint.altitude)} m</div>}
                {lastPoint.speed > 0 && <div>Speed: {(lastPoint.speed * 3.6).toFixed(1)} km/h</div>}
              </div>
            )}

            <button onClick={stopRecording} className="w-full bg-rust hover:bg-rust/80 text-white font-semibold rounded-lg py-3">
              Stop & save
            </button>
          </>
        )}

        {status === 'finishing' && (
          <div className="text-center py-6 text-muted">
            <div className="animate-pulse text-4xl mb-3">💾</div>
            <p>Saving your ride...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">{error}</div>
      )}
      {geoError && (
        <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">
          GPS: {geoError}
        </div>
      )}

      {status === 'idle' && (
        <div className="card p-4 space-y-2 text-sm text-muted">
          <p className="font-semibold text-ink">How it works</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Allow location access when prompted</li>
            <li>GPS points are sent live via WebSocket</li>
            <li>Keep the screen on during your ride</li>
            <li>Tap "Stop & save" when you finish</li>
          </ul>
        </div>
      )}
    </div>
  );
}
