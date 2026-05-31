import { redirect } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function BusinessDashboard() {
  const token = await getServerToken();
  if (!token) redirect('/login?next=/business');

  let userId = '';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userId = payload.user_id || payload.sub || '';
  } catch {}

  const [userInfo, toursData, bookingsData] = await Promise.all([
    userId ? apiFetch<any>(`/users/${userId}`, {}, token).catch(() => null) : null,
    apiFetch<{ tours: any[] }>(`/tours?organizer_id=${userId}&limit=50`, {}, token).catch(() => ({ tours: [] })),
    apiFetch<{ bookings: any[] }>('/bookings', {}, token).catch(() => ({ bookings: [] })),
  ]);

  const tours = toursData?.tours ?? [];
  const bookings = bookingsData?.bookings ?? [];
  const isBusiness = userInfo?.account_type === 'business';

  const pendingBookings = bookings.filter((b: any) => b.status === 'pending');
  const totalRevenue = 0; // будущая интеграция с оплатой

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 border-b" style={{ background: 'rgb(var(--bg-base) / 0.9)', backdropFilter: 'blur(16px)', borderColor: 'rgb(var(--border) / 0.5)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl leading-none">ДАШБОРД ОПЕРАТОРА</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>{userInfo?.business_name || userInfo?.name}</p>
          </div>
          <Link href="/me" className="btn btn-ghost text-xs">← Профиль</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {!isBusiness && (
          <div className="card p-4 border-l-2" style={{ borderLeftColor: 'rgb(var(--rust))' }}>
            <p className="text-sm font-semibold mb-1">Переключи профиль на Бизнес</p>
            <p className="text-xs mb-3" style={{ color: 'rgb(var(--text-muted))' }}>
              Для работы с туристами и бронированиями нужен бизнес-аккаунт
            </p>
            <Link href="/me/edit" className="btn btn-secondary text-xs">Настроить профиль</Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Туров', value: tours.length, icon: '🏕️' },
            { label: 'Заявок', value: bookings.length, icon: '📋', accent: pendingBookings.length > 0 },
            { label: 'Новых', value: pendingBookings.length, icon: '🔔', accent: pendingBookings.length > 0 },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="font-display text-3xl leading-none" style={s.accent ? { color: 'rgb(var(--accent))' } : {}}>
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'rgb(var(--text-muted))' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Incoming bookings */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl">
              Заявки на туры
              {pendingBookings.length > 0 && (
                <span className="ml-2 text-sm font-bold px-2 py-0.5 rounded"
                  style={{ background: 'rgb(var(--accent))', color: '#080909' }}>
                  {pendingBookings.length} новых
                </span>
              )}
            </h2>
          </div>

          {bookings.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">📭</p>
              <p className="font-semibold mb-1">Заявок пока нет</p>
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                Добавь туры — и первые заявки не заставят себя ждать
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b: any) => (
                <div key={b.id} className={`card p-4 ${b.status === 'pending' ? 'border-l-2' : ''}`}
                  style={b.status === 'pending' ? { borderLeftColor: 'rgb(var(--accent))' } : {}}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{b.name}</span>
                        {b.status === 'pending' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider"
                            style={{ background: 'rgb(var(--accent) / 0.15)', color: 'rgb(var(--accent))' }}>
                            Новая
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                        {b.tour_title}
                      </p>
                    </div>
                    <div className="text-right text-xs flex-shrink-0" style={{ color: 'rgb(var(--text-muted))' }}>
                      {b.seats} {b.seats === 1 ? 'место' : 'мест'}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <a href={`mailto:${b.email}`}
                      className="flex items-center gap-1 font-medium hover:underline"
                      style={{ color: 'rgb(var(--accent))' }}>
                      ✉️ {b.email}
                    </a>
                    {b.phone && (
                      <a href={`tel:${b.phone}`}
                        className="flex items-center gap-1 font-medium hover:underline"
                        style={{ color: 'rgb(var(--accent))' }}>
                        📱 {b.phone}
                      </a>
                    )}
                    {b.desired_date && (
                      <span style={{ color: 'rgb(var(--text-muted))' }}>📅 {b.desired_date}</span>
                    )}
                  </div>

                  {b.message && (
                    <p className="mt-2 text-xs p-2 rounded-lg" style={{ background: 'rgb(var(--bg-base))', color: 'rgb(var(--text-muted))' }}>
                      «{b.message}»
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My tours */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl">Мои туры ({tours.length})</h2>
            <Link href="/tours/new" className="btn btn-primary text-xs py-1.5 px-3">+ Добавить тур</Link>
          </div>

          {tours.length === 0 ? (
            <div className="card p-8 text-center space-y-3">
              <p className="text-3xl">🏕️</p>
              <p className="font-semibold">Туров ещё нет</p>
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
                Создай первый тур — он появится в каталоге и на карте
              </p>
              <Link href="/tours/new" className="btn btn-primary inline-block">Создать тур</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {tours.map((t: any) => (
                <div key={t.id} className="card p-4 flex items-center gap-3">
                  {t.cover_url ? (
                    <img src={t.cover_url} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: 'rgb(var(--bg-elev-2))' }}>🏕️</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{t.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgb(var(--text-muted))' }}>
                      {t.country && `${t.country} · `}
                      {t.duration_days && `${t.duration_days} дн · `}
                      {t.spots_left != null && `${t.spots_left}/${t.spots_total} мест`}
                    </div>
                    {t.price && (
                      <div className="text-xs font-bold mt-0.5" style={{ color: 'rgb(var(--accent))' }}>
                        от {t.price.toLocaleString('ru')} ₽
                      </div>
                    )}
                  </div>
                  <Link href={`/tours/${t.id}`}
                    className="text-xs flex-shrink-0 hover:underline"
                    style={{ color: 'rgb(var(--text-muted))' }}>
                    →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upgrade hint */}
        <div className="card p-5" style={{ background: 'rgb(var(--accent) / 0.05)', borderColor: 'rgb(var(--accent) / 0.2)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-sm mb-1">Business Pro — скоро</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
                Верифицированный бейдж, приоритет в поиске, расширенная аналитика и неограниченные туры.
              </p>
            </div>
          </div>
        </div>

      </main>
      
    </div>
  );
}
