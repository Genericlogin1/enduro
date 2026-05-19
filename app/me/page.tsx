import Link from 'next/link';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import RoutePreview from '@/components/RoutePreview';
import { createClient } from '@/lib/supabase/server';
import { toggleLike } from '@/app/actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const [{ data: posts }, { data: routes }] = await Promise.all([
    supabase
      .from('posts')
      .select('id, content, media_urls, location, created_at, author_id, profiles:profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), comments(id)')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('routes')
      .select('id, name, difficulty, distance_km, country, geojson, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false }),
  ]);

  const display = profile?.display_name || profile?.username || user.email;
  const username = profile?.username ? '@' + profile.username : user.email;
  const initials = (display || 'M').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 py-6 border-b border-line">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
            : <div className="w-16 h-16 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xl font-semibold">{initials}</div>}
          <div className="flex-1 min-w-0">
            <div className="font-display text-2xl leading-none">{display}</div>
            <div className="text-sm text-muted mt-1 truncate">{username}</div>
            <div className="flex gap-2 flex-wrap mt-2">
              {profile?.motorcycle && <span className="chip">🏍 {profile.motorcycle}</span>}
              {profile?.location && <span className="chip">📍 {profile.location}</span>}
            </div>
          </div>
        </div>
        {profile?.bio && <p className="max-w-xl mx-auto mt-3 text-sm text-ink/80">{profile.bio}</p>}
        <form action="/logout" method="post" className="max-w-xl mx-auto mt-4">
          <button className="text-xs text-muted hover:text-rust underline">Sign out</button>
        </form>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-8">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display text-xl">My maps <span className="text-muted text-base">({routes?.length || 0})</span></h2>
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
                <Link key={r.id} href={'/map?route=' + r.id} className="card card-hover overflow-hidden">
                  <RoutePreview geojson={r.geojson} />
                  <div className="p-3">
                    <div className="font-semibold text-sm truncate">{r.name}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {r.difficulty && <span className="chip chip-rust">{r.difficulty}</span>}
                      {r.distance_km != null && <span className="chip">{r.distance_km} km</span>}
                      {r.country && <span className="chip">{r.country}</span>}
                    </div>
                  </div>
                </Link>
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
                <PostCard key={p.id} post={p} currentUserId={user.id} toggleLikeAction={toggleLike} />
              ))}
            </div>
          )}
        </section>
      </main>

      <Nav active="me" />
    </div>
  );
}
