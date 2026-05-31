import Link from 'next/link';
import Nav from '@/components/Nav';
import RideCard from '@/components/RideCard';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function RidePage({ params }: { params: { id: string } }) {
  const token = await getServerToken();

  const [ride, partsData] = await Promise.all([
    apiFetch<any>(`/rides/${params.id}`, {}, token).catch(() => null),
    apiFetch<{ participants: any[] }>(`/rides/${params.id}/participants`, {}, token).catch(() => ({ participants: [] })),
  ]);

  if (!ride) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-muted">
          <p className="text-lg">Покатушка не найдена</p>
          <Link href="/rides" className="btn btn-ghost mt-4 inline-block">← Все покатушки</Link>
        </div>
        <Nav active="rides" />
      </div>
    );
  }

  const participants = partsData?.participants ?? [];
  const date = new Date(ride.ride_date);
  const dateStr = format(date, "d MMMM yyyy, HH:mm", { locale: ru });

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/rides" className="text-muted hover:text-ink transition-colors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <h1 className="font-display text-xl tracking-widest truncate">ПОКАТУШКА</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Ride card */}
        <RideCard ride={ride} isLoggedIn={!!token} />

        {/* Full details */}
        <div className="card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📅</span>
            <span className="font-medium">{dateStr}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📍</span>
            <span>{ride.location}</span>
          </div>
          {ride.max_participants && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-lg">👥</span>
              <span>{ride.participant_count} / {ride.max_participants} мест</span>
            </div>
          )}
          {ride.route_id && (
            <Link href={`/routes/${ride.route_id}`}
              className="flex items-center gap-2 text-sm text-moss-strong hover:opacity-80 transition-opacity">
              <span className="text-lg">🗺️</span>
              <span>Посмотреть маршрут</span>
            </Link>
          )}
          {ride.description && (
            <div className="pt-2 border-t border-line">
              <p className="text-sm text-muted/90 leading-relaxed whitespace-pre-wrap">{ride.description}</p>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="card p-4">
          <h2 className="font-bold text-sm mb-3 uppercase tracking-wider">
            Едут {participants.length > 0 && <span className="text-moss-strong">{participants.length}</span>}
          </h2>
          {participants.length === 0 ? (
            <p className="text-sm text-muted">Пока никто не записался. Будь первым!</p>
          ) : (
            <div className="space-y-2">
              {participants.map(p => (
                <Link key={p.user_id} href={`/riders/${p.user_id}`}
                  className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xs font-bold">
                    {p.user_name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">{p.user_name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Nav active="rides" />
    </div>
  );
}
