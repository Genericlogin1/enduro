import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function RiderPage({ params }: { params: { id: string } }) {
  const token = await getServerToken();
  const { id } = params;

  const [user, postsData, routesData] = await Promise.all([
    apiFetch<any>(`/users/${id}`, {}, token ?? undefined).catch(() => null),
    apiFetch<{ posts: any[] }>(`/posts?author_id=${id}&limit=20`, {}, token ?? undefined).catch(() => ({ posts: [] })),
    apiFetch<{ routes: any[] }>(`/routes?author_id=${id}&limit=20`, {}, token ?? undefined).catch(() => ({ routes: [] })),
  ]);

  const posts = postsData?.posts ?? [];
  const routes = routesData?.routes ?? [];
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
      <header className="px-4 py-6 border-b border-line">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-2xl leading-none">{name}</div>
            <div className="text-sm text-muted mt-1">
              {posts.length} post{posts.length !== 1 ? 's' : ''} · {routes.length} route{routes.length !== 1 ? 's' : ''}
            </div>
          </div>
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
