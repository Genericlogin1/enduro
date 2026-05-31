import Link from 'next/link';
import RideCard from '@/components/RideCard';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function RidesPage() {
  const token = await getServerToken();
  const data = await apiFetch<{ rides: any[] }>('/rides', {}, token).catch(() => ({ rides: [] }));
  const rides = data?.rides ?? [];

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl leading-none tracking-widest">ПОКАТУШКИ</h1>
            <p className="text-xs text-muted mt-0.5">Групповые выезды</p>
          </div>
          {token && (
            <Link href="/rides/new" className="btn btn-primary text-xs py-1.5 px-3">+ Создать</Link>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {rides.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-5xl mb-4">🏍️</div>
            <p className="text-lg mb-2">Пока нет покатушек</p>
            <p className="text-sm mb-6">Организуй первый групповой выезд!</p>
            {token && (
              <Link href="/rides/new" className="btn btn-primary">Создать покатушку</Link>
            )}
          </div>
        ) : (
          rides.map(ride => (
            <RideCard key={ride.id} ride={ride} isLoggedIn={!!token} />
          ))
        )}
      </main>
      
    </div>
  );
}
