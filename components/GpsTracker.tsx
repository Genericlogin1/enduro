'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

type Point = { lat: number; lng: number; altitude: number; speed: number; recorded_at: string };
type Session = { id: string; name: string; status: string };

const FLUSH_INTERVAL = 5000; // send batch every 5 seconds

export default function GpsTracker() {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'starting' | 'recording' | 'finishing' | 'done'>('idle');
  const [session, setSession] = useState<Session | null>(null);
  const [pointCount, setPointCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [noAuth, setNoAuth] = useState(false);

  const watchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<Point[]>([]);
  const sessionIdRef = useRef<string>('');

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

  const flushPoints = useCallback(async () => {
    const token = getToken();
    const id = sessionIdRef.current;
    if (!token || !id || pendingRef.current.length === 0) return;
    const batch = [...pendingRef.current];
    pendingRef.current = [];
    try {
      await apiFetch(`/tracking/sessions/${id}/points`, {
        method: 'POST',
        body: JSON.stringify(batch),
      }, token);
    } catch {
      // put points back if flush failed
      pendingRef.current = [...batch, ...pendingRef.current];
    }
  }, []);

  const onPosition = useCallback((pos: GeolocationPosition) => {
    const pt: Point = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      altitude: pos.coords.altitude ?? 0,
      speed: pos.coords.speed ?? 0,
      recorded_at: new Date(pos.timestamp).toISOString(),
    };
    pendingRef.current.push(pt);
    setLastPoint(pt);
    setPointCount(c => c + 1);
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
      sessionIdRef.current = sess.id;
      pendingRef.current = [];
      setPointCount(0);
      setElapsed(0);
      setLastPoint(null);

      watchRef.current = navigator.geolocation.watchPosition(
        onPosition,
        (err) => setGeoError(err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
      );

      flushRef.current = setInterval(flushPoints, FLUSH_INTERVAL);
      setStatus('recording');
    } catch (e: any) {
      setError(e.message || 'Failed to start session');
      setStatus('idle');
    }
  }

  async function stopRecording() {
    if (!session) return;
    setStatus('finishing');
    const token = getToken();

    if (flushRef.current) { clearInterval(flushRef.current); flushRef.current = null; }
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    // flush remaining points
    await flushPoints();

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
      if (flushRef.current) clearInterval(flushRef.current);
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
        <p className="text-sm text-muted">Points recorded: {pointCount}</p>
        <button
          onClick={() => { setStatus('idle'); setSession(null); setPointCount(0); setElapsed(0); setLastPoint(null); setSessionName(''); }}
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
              <p className="text-sm text-muted">GPS points are sent every 5 seconds</p>
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
            <p>Starting session...</p>
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
              <p className="text-sm text-muted">{pointCount} points • syncs every 5s</p>
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
            <li>Points collected every second, synced every 5s</li>
            <li>Keep the screen on during your ride</li>
            <li>Tap "Stop & save" when you finish</li>
          </ul>
        </div>
      )}
    </div>
  );
}
