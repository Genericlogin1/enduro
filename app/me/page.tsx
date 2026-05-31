import Link from 'next/link';
import PostCard from '@/components/PostCard';
import Garage from '@/components/Garage';
import DeleteButton from '@/components/DeleteButton';
import SeasonCard from '@/components/SeasonCard';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const token = await getServerToken();

  if (!token) {
    return (
      <div className="min-h-screen pb-nav">
        <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
          <div className="max-w-xl mx-auto px-4 py-3">
            <h1 className="font-display text-3xl leading-none text-ink">ME</h1>
            <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">Your trail journal</p>
          </div>
        </header>
        <main className="max-w-xl mx-auto px-4 py-10">
          <div className="card p-8 text-center space-y-3">
            <div className="text-5xl">🏕️</div>
            <h2 className="font-display text-2xl text-ink">Camp not set up yet</h2>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Sign in to save your routes, post rides and keep your trail journal.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
              <Link href="/login?next=/me" className="btn btn-primary">Sign in</Link>
              <Link href="/signup" className="btn btn-ghost">Create account</Link>
            </div>
          </div>
        </main>
        
      </div>
    );
  }

  // Decode user info from token (JWT payload is base64)
  let userId = '';
  let userName = '';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userId = payload.user_id || payload.sub || '';
  } catch {}

  const [postsData, routesData, sessionsData, userInfo, statsData] = await Promise.all([
    userId ? apiFetch<{ posts: any[] }>(`/posts?author_id=${userId}&limit=20`, {}, token).catch(() => ({ posts: [] })) : { posts: [] },
    userId ? apiFetch<{ routes: any[] }>(`/routes?author_id=${userId}&limit=20`, {}, token).catch(() => ({ routes: [] })) : { routes: [] },
    token ? apiFetch<{ sessions: any[] }>('/tracking/sessions?limit=10', {}, token).catch(() => ({ sessions: [] })) : { sessions: [] },
    userId ? apiFetch<any>(`/users/${userId}`, {}, token).catch(() => null) : null,
    userId ? apiFetch<any>(`/users/${userId}/stats`, {}, token).catch(() => null) : null,
  ]);
  const posts = postsData?.posts ?? [];
  const routes = routesData?.routes ?? [];
  const sessions = sessionsData?.sessions ?? [];
  const stats = statsData ?? null;
  const currentYear = new Date().getFullYear();

  userName = userInfo?.name || 'Rider';
  const initials = userName.slice(0, 2).toUpperCase();

  const totalRides = sessions.length;
  const totalMinutes = sessions.reduce((acc: number, s: any) => acc + Math.round((s.duration_sec || 0) / 60), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;
  const durationLabel = totalHours > 0 ? `${totalHours}h ${remainingMins}m` : `${totalMinutes}m`;

  return (
    <div className="min-h-screen pb-nav">
      {/* Profile hero */}
      <div className="relative">
        <div className="h-24" style={{ background: 'linear-gradient(135deg, rgb(var(--accent) / 0.12) 0%, rgb(var(--accent) / 0.04) 50%, transparent 100%)' }} />
        <div className="max-w-xl mx-auto px-4">
          <div className="flex items-end gap-4 -mt-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {userInfo?.avatar_url ? (
                <img src={userInfo.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-base shadow-lg" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-moss/20 text-moss-strong border-4 border-base flex items-center justify-center text-2xl font-bold shadow-lg">
                  {initials}
                </div>
              )}
              {userInfo?.is_verified && (
                <span className="absolute -bottom-1 -right-1 bg-moss-strong text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">✓</span>
              )}
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-display text-2xl leading-none">{userName}</div>
                {userInfo?.account_type === 'business' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rust/15 text-rust-strong">Бизнес</span>
                )}
              </div>
              {userInfo?.business_name && (
                <div className="text-sm text-muted font-semibold mt-0.5">{userInfo.business_name}</div>
              )}
              {userInfo?.bio && (
                <p className="text-xs text-muted mt-1 leading-relaxed line-clamp-2">{userInfo.bio}</p>
              )}
              {/* Social links */}
              {(userInfo?.telegram || userInfo?.instagram) && (
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  {userInfo?.telegram && (
                    <a href={`https://t.me/${userInfo.telegram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-moss-strong hover:underline">✈️ {userInfo.telegram}</a>
                  )}
                  {userInfo?.instagram && (
                    <a href={`https://instagram.com/${userInfo.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="text-[10px] text-moss-strong hover:underline">📸 {userInfo.instagram}</a>
                  )}
                </div>
              )}
            </div>
            <div className="pb-1 flex flex-col items-end gap-1.5">
              <SignOutButton />
              <Link href="/me/edit" className="text-xs text-muted hover:text-ink border border-line rounded-lg px-2.5 py-1 hover:border-moss/40 transition-colors">
                ✏️ Изменить
              </Link>
              {userInfo?.account_type === 'business' && (
                <Link href="/business" className="text-xs font-bold rounded-lg px-2.5 py-1 transition-colors"
                  style={{ background: 'rgb(var(--accent) / 0.15)', color: 'rgb(var(--accent))' }}>
                  📊 Дашборд
                </Link>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-5 mb-3">
            {[
              { label: 'Rides', value: totalRides, href: '#gps-rides' },
              { label: 'Time', value: totalRides > 0 ? durationLabel : '—', href: '#gps-rides' },
              { label: 'Routes', value: routes.length, href: '#routes' },
              { label: 'Posts', value: posts.length, href: '#posts' },
            ].map(({ label, value, href }) => (
              <a key={label} href={href}
                className="rounded-xl py-3 text-center transition-all hover:scale-105 cursor-pointer"
                style={{ background: 'rgb(var(--bg-elev-2))', border: '1px solid rgb(var(--border) / 0.5)' }}>
                <div className="font-display text-2xl leading-none" style={{ color: 'rgb(var(--accent))' }}>{value}</div>
                <div className="text-[9px] text-muted mt-1 uppercase tracking-wider">{label}</div>
              </a>
            ))}
          </div>

          {/* Season card */}
          {stats && (
            <SeasonCard
              year={currentYear}
              thisYearRides={stats.this_year_rides ?? 0}
              totalRoutes={stats.total_routes ?? 0}
              totalPosts={stats.total_posts ?? 0}
              topRegions={stats.top_regions ?? []}
              userName={userName}
            />
          )}
        </div>
      </div>
      <header className="hidden" />

      <main className="max-w-xl mx-auto px-4 py-5 space-y-8">
        <Garage />

        {sessions.length > 0 && (
          <section id="gps-rides">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📡</span>
                <h2 className="font-display text-xl leading-none">GPS RIDES</h2>
                <span className="font-display text-base leading-none" style={{ color: 'rgb(var(--accent))' }}>{sessions.length}</span>
              </div>
              <Link href="/gps" className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'rgb(var(--accent))' }}>+ ЗАПИСЬ</Link>
            </div>
            <div className="space-y-1.5">
              {sessions.map((s: any) => {
                const mins = Math.round((s.duration_sec || 0) / 60);
                const km = s.distance_km != null ? s.distance_km.toFixed(1) : null;
                const isLive = s.status === 'active';
                return (
                  <Link key={s.id} href={`/gps/sessions/${s.id}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:scale-[1.01]"
                    style={{ background: 'rgb(var(--bg-elev-2))', border: isLive ? '1px solid rgb(var(--rust) / 0.4)' : '1px solid rgb(var(--border) / 0.4)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background: isLive ? 'rgb(var(--rust) / 0.15)' : 'rgb(var(--accent) / 0.08)' }}>
                      {isLive ? '🔴' : '📍'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{s.name || 'Без названия'}</div>
                      <div className="flex gap-2 mt-0.5">
                        {km && <span className="text-[10px] font-bold" style={{ color: 'rgb(var(--accent))' }}>{km} km</span>}
                        {mins > 0 && <span className="text-[10px] text-muted">{mins} мин</span>}
                      </div>
                    </div>
                    {isLive && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                      style={{ background: 'rgb(var(--rust) / 0.15)', color: 'rgb(var(--rust-strong))' }}>LIVE</span>}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-muted flex-shrink-0">
                      <path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {routes && routes.length > 0 && (
          <section id="routes">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">🗺️</span>
                <h2 className="font-display text-xl leading-none">МАРШРУТЫ</h2>
                <span className="font-display text-base leading-none" style={{ color: 'rgb(var(--accent))' }}>{routes.length}</span>
              </div>
              <Link href="/map" className="text-[11px] font-bold uppercase tracking-wider text-muted hover:text-ink">КАРТА</Link>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {routes.map((r: any) => {
                const diffColors: Record<string, string> = { Easy: '#4ade80', Medium: '#facc15', Hard: '#f97316', Expert: '#ef4444' };
                return (
                  <div key={r.id}
                    className="rounded-xl p-3 flex flex-col gap-2"
                    style={{ background: 'rgb(var(--bg-elev-2))', border: '1px solid rgb(var(--border) / 0.4)' }}>
                    <div className="font-semibold text-sm leading-tight">{r.name}</div>
                    <div className="flex flex-wrap gap-1">
                      {r.difficulty && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: (diffColors[r.difficulty] || '#888') + '20', color: diffColors[r.difficulty] || '#888' }}>
                          {r.difficulty}
                        </span>
                      )}
                      {r.distance_km > 0 && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgb(var(--accent) / 0.1)', color: 'rgb(var(--accent))' }}>
                          {r.distance_km} km
                        </span>
                      )}
                    </div>
                    <DeleteButton path={`/routes/${r.id}`} label="Удалить" confirm={`Удалить «${r.name}»?`} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {posts && posts.length > 0 && (
          <section id="posts">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-base">📸</span>
                <h2 className="font-display text-xl leading-none">ПОСТЫ</h2>
                <span className="font-display text-base leading-none" style={{ color: 'rgb(var(--accent))' }}>{posts.length}</span>
              </div>
              <Link href="/new" className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: 'rgb(var(--rust-strong))' }}>+ ПОСТ</Link>
            </div>
            <div className="space-y-4">
              {posts.map((p: any) => (
                <PostCard key={p.id} post={p} isLoggedIn={true} canDelete={true} />
              ))}
            </div>
          </section>
        )}
      </main>

      
    </div>
  );
}
