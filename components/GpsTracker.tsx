'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';
import { savePointOffline, getPendingPoints, deletePoints, countPendingPoints } from '@/lib/gpsDb';

type Point = { lat: number; lng: number; altitude: number; speed: number; recorded_at: string };
type Session = { id: string; name: string; status: string; share_token: string };

const FLUSH_INTERVAL = 5000;
const LIVE_BASE = typeof window !== 'undefined' ? window.location.origin : '';

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
  const [isOnline, setIsOnline] = useState(true);
  const [offlineBuffer, setOfflineBuffer] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const watchRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingRef = useRef<Point[]>([]);
  const sessionIdRef = useRef<string>('');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!getToken()) setNoAuth(true);
  }, []);

  // Online / offline tracking
  useEffect(() => {
    const onOnline = () => { setIsOnline(true); syncOfflinePoints(); };
    const onOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Timer
  useEffect(() => {
    if (status === 'recording') {
      startTimeRef.current = Date.now() - elapsed * 1000;
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

  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {}
  };

  const releaseWakeLock = () => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  };

  // Re-acquire wake lock when tab becomes visible again
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'recording') {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [status]);

  const syncOfflinePoints = useCallback(async () => {
    const token = getToken();
    const id = sessionIdRef.current;
    if (!token || !id) return;
    const stored = await getPendingPoints().catch(() => []);
    const mine = stored.filter(s => s.point.sessionId === id);
    if (!mine.length) { setOfflineBuffer(0); return; }
    setSyncing(true);
    try {
      await apiFetch(`/tracking/sessions/${id}/points`, {
        method: 'POST',
        body: JSON.stringify(mine.map(({ point }) => ({
          lat: point.lat, lng: point.lng, altitude: point.altitude,
          speed: point.speed, recorded_at: point.recorded_at,
        }))),
      }, token);
      await deletePoints(mine.map(s => s.key));
      setOfflineBuffer(0);
    } catch {}
    finally { setSyncing(false); }
  }, []);

  const flushPoints = useCallback(async () => {
    const token = getToken();
    const id = sessionIdRef.current;
    if (!token || !id || pendingRef.current.length === 0) return;

    const batch = [...pendingRef.current];
    pendingRef.current = [];

    if (!navigator.onLine) {
      // Save to IndexedDB when offline
      await Promise.all(batch.map(pt =>
        savePointOffline({ sessionId: id, ...pt }).catch(() => {})
      ));
      const count = await countPendingPoints().catch(() => 0);
      setOfflineBuffer(count);
      return;
    }

    try {
      await apiFetch(`/tracking/sessions/${id}/points`, {
        method: 'POST',
        body: JSON.stringify(batch),
      }, token);
    } catch {
      // Network failed: buffer to IndexedDB
      await Promise.all(batch.map(pt =>
        savePointOffline({ sessionId: id, ...pt }).catch(() => {})
      ));
      const count = await countPendingPoints().catch(() => 0);
      setOfflineBuffer(count);
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
    if (!navigator.geolocation) { setGeoError('GPS недоступен в этом браузере'); return; }
    setStatus('starting');
    try {
      const name = sessionName.trim() || `Ride ${new Date().toLocaleDateString('ru')}`;
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
      setOfflineBuffer(0);

      await acquireWakeLock();

      watchRef.current = navigator.geolocation.watchPosition(
        (pos) => { setGeoError(null); onPosition(pos); },
        (err) => {
          const msg = err.code === 1
            ? 'Доступ к геолокации запрещён — разреши в настройках браузера'
            : err.code === 2
            ? 'GPS недоступен. Попробуй на мобильном устройстве'
            : 'Таймаут GPS — перейди в зону лучшего сигнала';
          setGeoError(msg);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
      );

      flushRef.current = setInterval(flushPoints, FLUSH_INTERVAL);
      setStatus('recording');
    } catch (e: any) {
      setError(e.message || 'Ошибка запуска сессии');
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
    releaseWakeLock();

    await flushPoints();
    if (navigator.onLine) await syncOfflinePoints();

    try {
      await apiFetch(`/tracking/sessions/${session.id}/finish`, { method: 'PATCH' }, token);
      setStatus('done');
    } catch (e: any) {
      setError(e.message || 'Ошибка завершения сессии');
      setStatus('recording');
    }
  }

  useEffect(() => {
    return () => {
      if (flushRef.current) clearInterval(flushRef.current);
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
    };
  }, []);

  const shareLink = session ? `${LIVE_BASE}/live/${session.share_token}` : '';

  function copyShareLink() {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  if (noAuth) {
    return (
      <div className="card p-6 text-center space-y-3">
        <p className="text-muted">Войди чтобы записывать GPS треки.</p>
        <button onClick={() => router.push('/login?next=/gps')} className="btn btn-primary">Войти</button>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="text-4xl">🏁</div>
        <h2 className="font-display text-2xl text-ink">Трек сохранён!</h2>
        <p className="text-sm text-muted">Время: {formatTime(elapsed)}</p>
        <p className="text-sm text-muted">Точек записано: {pointCount}</p>
        <button
          onClick={() => { setStatus('idle'); setSession(null); setPointCount(0); setElapsed(0); setLastPoint(null); setSessionName(''); }}
          className="btn btn-primary w-full"
        >
          Записать ещё
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Offline banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-2 text-sm text-yellow-400">
          <span className="text-base">✈️</span>
          <span>Офлайн — точки сохраняются локально</span>
          {offlineBuffer > 0 && <span className="ml-auto font-mono">{offlineBuffer} буф.</span>}
        </div>
      )}
      {isOnline && syncing && (
        <div className="flex items-center gap-2 bg-moss/10 border border-moss/30 rounded-lg px-3 py-2 text-sm text-moss-strong">
          <span className="animate-spin">⏳</span>
          <span>Синхронизирую офлайн-точки...</span>
        </div>
      )}
      {isOnline && !syncing && offlineBuffer === 0 && status === 'recording' && (
        <div className="flex items-center gap-2 bg-moss/10 border border-moss/30 rounded-lg px-3 py-2 text-sm text-moss-strong">
          <span>✓</span>
          <span>Онлайн — данные синхронизируются</span>
        </div>
      )}

      <div className="card p-5 space-y-4">
        {status === 'idle' && (
          <>
            <div className="text-center space-y-1">
              <div className="text-5xl mb-2">📍</div>
              <h2 className="font-display text-xl text-ink">Готов к поездке?</h2>
              <p className="text-sm text-muted">Работает офлайн — синхронизирует когда появится сеть</p>
            </div>
            <input
              type="text"
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder={`Ride ${new Date().toLocaleDateString('ru')}`}
              className="input w-full"
            />
            <button onClick={startRecording} className="btn btn-primary w-full py-3 text-base">
              Начать запись
            </button>
          </>
        )}

        {status === 'starting' && (
          <div className="text-center py-6 text-muted">
            <div className="animate-pulse text-4xl mb-3">📡</div>
            <p>Запускаю сессию...</p>
          </div>
        )}

        {status === 'recording' && (
          <>
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rust-strong animate-pulse" />
                <span className="text-rust-strong font-semibold text-sm uppercase tracking-wider">Запись</span>
              </div>
              <div className="font-display text-5xl text-ink">{formatTime(elapsed)}</div>
              <p className="text-sm text-muted">{pointCount} точек • синх каждые 5с</p>
            </div>

            {/* Share link */}
            {session?.share_token && (
              <div className="bg-moss/10 border border-moss/30 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-moss-strong uppercase tracking-wider">📡 Live-ссылка</p>
                <p className="text-xs text-muted">Поделись — друзья увидят тебя на карте в реальном времени</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareLink}
                    className="input text-xs flex-1 py-1.5 font-mono"
                  />
                  <button
                    onClick={copyShareLink}
                    className={`btn text-xs px-3 py-1.5 ${copied ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {copied ? '✓' : 'Копировать'}
                  </button>
                </div>
              </div>
            )}

            {geoError && (
              <div className="text-xs text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2 text-center">
                ⚠️ {geoError}
              </div>
            )}

            {lastPoint && (
              <div className="bg-zinc-900 rounded-lg p-3 text-xs text-muted font-mono space-y-1">
                <div>Lat: {lastPoint.lat.toFixed(6)}</div>
                <div>Lng: {lastPoint.lng.toFixed(6)}</div>
                {lastPoint.altitude > 0 && <div>Alt: {Math.round(lastPoint.altitude)} м</div>}
                {lastPoint.speed > 0 && <div>Скорость: {(lastPoint.speed * 3.6).toFixed(1)} км/ч</div>}
              </div>
            )}

            <button onClick={stopRecording} className="w-full bg-rust hover:bg-rust/80 text-white font-semibold rounded-lg py-3">
              Стоп и сохранить
            </button>
          </>
        )}

        {status === 'finishing' && (
          <div className="text-center py-6 text-muted">
            <div className="animate-pulse text-4xl mb-3">💾</div>
            <p>Сохраняю трек...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">{error}</div>
      )}
      {geoError && status === 'idle' && (
        <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">
          GPS: {geoError}
        </div>
      )}

      {status === 'idle' && (
        <div className="card p-4 space-y-2 text-sm text-muted">
          <p className="font-semibold text-ink">Как это работает</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Лучше всего работает на <strong>мобильном</strong> с GPS</li>
            <li>Разреши доступ к геолокации</li>
            <li>Работает <strong>без интернета</strong> — треки записываются локально</li>
            <li>Точки синхронизируются автоматически когда появится сеть</li>
            <li>Поделись ссылкой — друзья увидят тебя в реальном времени</li>
          </ul>
        </div>
      )}
    </div>
  );
}
