import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import FollowButton from '@/components/FollowButton';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RiderPage({ params }: { params: { id: string } }) {
  const token = await getServerToken();
  const { id } = params;

  const [user, postsData, routesData, followersData, followingData] = await Promise.all([
    apiFetch<any>(`/users/${id}`, {}, token ?? undefined).catch(() => null),
    apiFetch<{ posts: any[] }>(`/posts?author_id=${id}&limit=20`, {}, token ?? undefined).catch(() => ({ posts: [] })),
    apiFetch<{ routes: any[] }>(`/routes?author_id=${id}&limit=20`, {}, token ?? undefined).catch(() => ({ routes: [] })),
    apiFetch<{ followers: any[] }>(`/users/${id}/followers?limit=1000`, {}, token ?? undefined).catch(() => ({ followers: [] })),
    apiFetch<{ following: any[] }>(`/users/${id}/following?limit=1000`, {}, token ?? undefined).catch(() => ({ following: [] })),
  ]);

  const posts = postsData?.posts ?? [];
  const routes = routesData?.routes ?? [];
  const followersCount = followersData?.followers?.length ?? 0;
  const followingCount = followingData?.following?.length ?? 0;
  const name = user?.name || 'Rider';
  const initials = name.slice(0, 2).toUpperCase();

  if (!user) {
    return (
      <div className="min-h-screen pb-24">
        <main className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="text-4xl mb-3">🏕️</div>
          <h2 className="font-display text-2xl text-ink">Rider not found</h2>
          <Link href="/" className="btn btn-ghost mt-6">Back to feed</Link>
        </main>
        <Nav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 py-5 border-b border-line">
        <div className="max-w-xl mx-auto">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-line flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xl font-semibold flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="font-display text-2xl leading-none">{name}</div>
                {user?.is_verified && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-moss/15 text-moss-strong">✓ Верифицировано</span>}
                {user?.account_type === 'business' && !user?.is_verified && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rust/15 text-rust-strong">Бизнес</span>
                )}
              </div>
              {user?.business_name && (
                <div className="text-sm font-semibold text-muted mt-0.5">{user.business_name}</div>
              )}
              {user?.bio && (
                <p className="text-xs text-muted mt-1.5 leading-relaxed">{user.bio}</p>
              )}
              <div className="flex gap-3 text-xs text-muted mt-1.5 flex-wrap">
                <span><b className="text-ink">{followersCount}</b> подписчиков</span>
                <span><b className="text-ink">{followingCount}</b> подписок</span>
                <span><b className="text-ink">{posts.length}</b> постов</span>
                <span><b className="text-ink">{routes.length}</b> маршрутов</span>
              </div>
              {/* Social links */}
              {(user?.telegram || user?.whatsapp || user?.instagram) && (
                <div className="flex gap-3 mt-2 flex-wrap">
                  {user?.telegram && (
                    <a href={`https://t.me/${user.telegram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#229ED9' }}>
                      ✈️ {user.telegram}
                    </a>
                  )}
                  {user?.whatsapp && (
                    <a href={`https://wa.me/${user.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: '#25D366' }}>
                      📱 WA
                    </a>
                  )}
                  {user?.instagram && (
                    <a href={`https://instagram.com/${user.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-moss-strong hover:underline">📸 {user.instagram}</a>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <FollowButton targetId={id} />
            </div>
          </div>
          {/* Organizer tours if business */}
          {user?.account_type === 'business' && (
            <div className="mt-3">
              <Link href={`/tours?organizer_id=${id}`} className="text-xs text-rust-strong hover:underline font-semibold">
                🏕️ Смотреть туры организатора →
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-8">
        {routes.length > 0 && (
          <section>
            <h2 className="font-display text-xl mb-3">Routes</h2>
            <div className="grid grid-cols-2 gap-3">
              {routes.map((r: any) => (
                <div key={r.id} className="card overflow-hidden">
                  <div className="p-3">
                    <div className="font-semibold text-sm truncate">{r.name}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {r.difficulty && <span className="chip chip-rust">{r.difficulty}</span>}
                      {r.distance_km != null && <span className="chip">{r.distance_km} km</span>}
                      {r.country && <span className="chip">{r.country}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-xl mb-3">Posts</h2>
          {posts.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">No posts yet.</div>
          ) : (
            <div className="space-y-4">
              {posts.map((p: any) => (
                <PostCard key={p.id} post={p} isLoggedIn={!!token} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Nav />
    </div>
  );
}
