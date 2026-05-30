import LiveMap from '@/components/LiveMap';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { token: string } }) {
  const data = await apiFetch<any>(`/tracking/live/${params.token}`).catch(() => null);
  if (!data) return { title: 'Live трек | Enduro World' };
  return {
    title: `Live: ${data.name} | Enduro World`,
    description: 'Следи за маршрутом в реальном времени',
  };
}

export default async function LivePage({ params }: { params: { token: string } }) {
  const data = await apiFetch<any>(`/tracking/live/${params.token}`).catch(() => null);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="font-display text-xl">Трек не найден</p>
          <p className="text-sm text-muted">Ссылка недействительна или сессия завершена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-base/95 backdrop-blur border-b border-line px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {data.status === 'active' ? (
              <span className="w-2.5 h-2.5 rounded-full bg-rust-strong animate-pulse flex-shrink-0" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-muted flex-shrink-0" />
            )}
            <h1 className="font-display text-lg leading-none truncate">{data.name}</h1>
          </div>
          <p className="text-xs text-muted mt-0.5">
            {data.status === 'active' ? 'Едет сейчас · обновляется каждые 3с' : 'Сессия завершена'}
          </p>
        </div>
        <a href="/" className="text-xs text-muted hover:text-ink">Enduro World →</a>
      </header>

      {/* Map fills remaining height */}
      <div className="flex-1">
        <LiveMap
          token={params.token}
          initialLat={data.last_point?.lat ?? null}
          initialLng={data.last_point?.lng ?? null}
          isActive={data.status === 'active'}
        />
      </div>

      {/* Bottom info bar */}
      <div className="bg-base/95 backdrop-blur border-t border-line px-4 py-2 flex gap-4 text-xs text-muted">
        {data.last_point ? (
          <>
            <span>📍 {data.last_point.lat.toFixed(5)}, {data.last_point.lng.toFixed(5)}</span>
            {data.last_point.speed > 0 && (
              <span>🏎 {(data.last_point.speed * 3.6).toFixed(0)} км/ч</span>
            )}
            {data.last_point.altitude > 0 && (
              <span>⛰ {Math.round(data.last_point.altitude)} м</span>
            )}
          </>
        ) : (
          <span>Ожидаю первую точку...</span>
        )}
      </div>
    </div>
  );
}
