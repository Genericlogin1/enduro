import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

const diffColor: Record<string, string> = {
  Easy: 'bg-green-400/15 text-green-400',
  Medium: 'bg-yellow-400/15 text-yellow-400',
  Hard: 'bg-orange-400/15 text-orange-400',
  Expert: 'bg-red-400/15 text-red-400',
};

export default async function ToursPage() {
  const token = await getServerToken();
  const data = await apiFetch<{ tours: any[] }>('/tours?limit=50', {}, token).catch(() => ({ tours: [] }));
  const tours = data?.tours ?? [];

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl leading-none">ТУРЫ</h1>
            <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">Эндуро путешествия</p>
          </div>
          {token && <Link href="/tours/new" className="btn btn-primary text-xs">+ Тур</Link>}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {tours.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-4">🏔️</p>
            <p className="text-lg mb-2">Туров пока нет</p>
            <p className="text-sm mb-6">Организуй первый эндуро-тур для сообщества</p>
            {token && <Link href="/tours/new" className="btn btn-primary">Создать тур</Link>}
          </div>
        ) : tours.map((t: any) => {
          const organizer = t.business_name || t.organizer_name || 'Организатор';
          const initials = organizer.slice(0, 2).toUpperCase();
          return (
            <Link key={t.id} href={`/tours/${t.id}`} className="card block card-hover overflow-hidden">
              {t.cover_url && (
                <div className="relative">
                  <img src={t.cover_url} alt="" className="w-full h-44 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h2 className="font-display text-xl text-white leading-tight">{t.title}</h2>
                  </div>
                  {t.is_verified && (
                    <div className="absolute top-3 right-3 bg-moss/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Верифицировано</div>
                  )}
                </div>
              )}
              <div className="p-4">
                {!t.cover_url && <h2 className="font-display text-xl mb-2">{t.title}</h2>}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xs font-bold">{initials}</div>
                  <span className="text-sm text-muted">{organizer}</span>
                  {t.is_verified && <span className="text-[10px] text-moss-strong font-bold">✓</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.region && <span className="chip">📍 {t.region}</span>}
                  {t.start_date && <span className="chip">🗓 {new Date(t.start_date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                  {t.price_usd && <span className="chip chip-accent">💰 ${t.price_usd}</span>}
                  {t.difficulty && <span className={`chip font-bold ${diffColor[t.difficulty] || ''}`}>{t.difficulty}</span>}
                  {t.spots_left != null && <span className={`chip ${t.spots_left === 0 ? 'chip-rust' : ''}`}>{t.spots_left === 0 ? 'Мест нет' : `${t.spots_left} мест`}</span>}
                  {t.regs_count > 0 && <span className="chip">👥 {t.regs_count}</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </main>
      
    </div>
  );
}
