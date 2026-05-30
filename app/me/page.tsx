import Link from 'next/link';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import SignOutButton from '@/components/SignOutButton';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const token = await getServerToken();

  if (!token) {
    return (
      <div className="min-h-screen pb-24">
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
        <Nav active="me" />
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

  const [postsData, routesData, userInfo] = await Promise.all([
    userId ? apiFetch<{ posts: any[] }>(`/posts?author_id=${userId}&limit=20`, {}, token).catch(() => ({ posts: [] })) : { posts: [] },
    userId ? apiFetch<{ routes: any[] }>(`/routes?author_id=${userId}&limit=20`, {}, token).catch(() => ({ routes: [] })) : { routes: [] },
    userId ? apiFetch<any>(`/users/${userId}`, {}, token).catch(() => null) : null,
  ]);
  const posts = postsData?.posts ?? [];
  const routes = routesData?.routes ?? [];

  userName = userInfo?.name || 'Rider';
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 py-6 border-b border-line">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xl font-semibold">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-2xl leading-none">{userName}</div>
            <div className="text-sm text-muted mt-1">{userInfo?.email}</div>
          </div>
        </div>
        <div className="max-w-xl mx-auto mt-4">
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-8">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl">My routes <span className="text-muted text-base">({routes?.length || 0})</span></h2>
            <Link href="/map" className="text-xs text-moss-strong hover:underline">Open map</Link>
          </div>
          {!routes || routes.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">
              No routes saved yet.{' '}
              <Link href="/map" className="text-moss-strong">Draw your first route →</Link>
            </div>
          ) : (
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
          )}
        </section>

        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl">My posts <span className="text-muted text-base">({posts?.length || 0})</span></h2>
            <Link href="/new" className="text-xs text-rust-strong hover:underline">+ New post</Link>
          </div>
          {!posts || posts.length === 0 ? (
            <div className="card p-6 text-center text-muted text-sm">
              No posts yet.{' '}
              <Link href="/new" className="text-rust-strong">Create your first →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((p: any) => (
                <PostCard key={p.id} post={p} isLoggedIn={true} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Nav active="me" />
    </div>
  );
}
