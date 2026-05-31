import Nav from '@/components/Nav';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const token = await getServerToken();
  const q = searchParams.q?.trim() || '';

  const [usersData, toursData] = await Promise.all([
    q ? apiFetch<{ users: any[] }>(`/users?search=${encodeURIComponent(q)}&limit=20`, {}, token).catch(() => ({ users: [] })) : Promise.resolve({ users: [] }),
    q ? apiFetch<{ tours: any[] }>(`/tours?limit=10`, {}, token).catch(() => ({ tours: [] })) : Promise.resolve({ tours: [] }),
  ]);

  const users = usersData?.users ?? [];
  const tours = (toursData?.tours ?? []).filter((t: any) =>
    !q || t.title?.toLowerCase().includes(q.toLowerCase()) || t.region?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3">
          <h1 className="font-display text-2xl leading-none mb-3">Поиск</h1>
          <form method="GET" action="/search">
            <div className="flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder="Имя райдера, тур, маршрут..."
                autoFocus
                className="input flex-1"
              />
              <button type="submit" className="btn btn-primary">Найти</button>
            </div>
          </form>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-6">
        {!q && (
          <div className="text-center py-12 text-muted">
            <p className="text-4xl mb-3">🔍</p>
            <p>Введи имя райдера или название тура</p>
          </div>
        )}

        {q && users.length === 0 && tours.length === 0 && (
          <div className="text-center py-12 text-muted">
            <p className="text-lg">Ничего не найдено по «{q}»</p>
          </div>
        )}

        {/* Riders */}
        {users.length > 0 && (
          <section>
            <h2 className="font-display text-lg mb-3 text-muted uppercase tracking-wider">Райдеры ({users.length})</h2>
            <div className="space-y-2">
              {users.map((u: any) => {
                const initials = (u.name || 'R').slice(0, 2).toUpperCase();
                return (
                  <Link key={u.id} href={`/riders/${u.id}`}
                    className="card p-3 flex items-center gap-3 hover:border-moss/40 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{u.name}</div>
                      {u.is_verified && <span className="text-[10px] text-moss-strong font-bold">✓ Верифицировано</span>}
                      {u.business_name && <div className="text-xs text-muted">{u.business_name}</div>}
                    </div>
                    <span className="text-moss-strong text-xs">→</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Tours */}
        {tours.length > 0 && (
          <section>
            <h2 className="font-display text-lg mb-3 text-muted uppercase tracking-wider">Туры ({tours.length})</h2>
            <div className="space-y-3">
              {tours.map((t: any) => (
                <Link key={t.id} href={`/tours/${t.id}`}
                  className="card p-4 block hover:border-moss/40 transition-colors">
                  <div className="font-semibold">{t.title}</div>
                  <div className="text-xs text-muted mt-1 flex gap-2 flex-wrap">
                    {t.region && <span>📍 {t.region}</span>}
                    {t.start_date && <span>🗓 {new Date(t.start_date).toLocaleDateString('ru')}</span>}
                    {t.price_usd && <span>💰 ${t.price_usd}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Nav />
    </div>
  );
}
