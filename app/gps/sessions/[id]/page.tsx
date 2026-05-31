import Nav from '@/components/Nav';
import GpsTrackMap from '@/components/GpsTrackMap';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GpsSessionPage({ params }: { params: { id: string } }) {
  const token = await getServerToken();
  if (!token) redirect('/login?next=/gps');

  const session = await apiFetch<any>(`/tracking/sessions/${params.id}`, {}, token).catch(() => null);
  if (!session) notFound();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const points = session.points ?? [];

  const durMin = session.finished_at
    ? Math.round((new Date(session.finished_at).getTime() - new Date(session.started_at).getTime()) / 60000)
    : null;

  const startDate = new Date(session.started_at).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="min-h-screen pb-nav">
      <header className="px-4 py-3 border-b border-line">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/me" className="text-muted text-xs hover:text-ink">← My profile</Link>
          </div>
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-2xl leading-none">{session.name || 'Unnamed ride'}</h1>
            {points.length > 0 && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'https://enduro-production-20f5.up.railway.app/api/v1'}/tracking/sessions/${session.id}/gpx`}
                download
                className="btn btn-ghost text-xs py-1 px-2.5 flex-shrink-0"
                style={{ fontSize: '11px' }}
              >
                ↓ GPX
              </a>
            )}
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted">
            <span>{startDate}</span>
            {durMin !== null && <span>{durMin} min</span>}
            <span>{points.length} GPS points</span>
            {session.distance_km && <span>{session.distance_km} km</span>}
            <span className={`font-medium ${session.status === 'active' ? 'text-rust-strong' : 'text-moss-strong'}`}>
              {session.status === 'active' ? '● live' : 'завершён'}
            </span>
          </div>
          {session.share_token && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Live ссылка:</span>
              <Link
                href={`/live/${session.share_token}`}
                className="text-xs font-medium underline"
                style={{ color: 'rgb(var(--accent))' }}
              >
                enduro.world/live/{session.share_token.slice(0, 8)}...
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4">
        <GpsTrackMap apiKey={apiKey} points={points} />
      </main>

      <Nav active="me" />
    </div>
  );
}
