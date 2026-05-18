import Link from 'next/link';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import { createClient } from '@/lib/supabase/server';
import { toggleLike } from '@/app/actions';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, media_urls, location, created_at, author_id, profiles:profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), comments(id)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const display = profile?.display_name || profile?.username || user.email;
  const username = profile?.username ? '@' + profile.username : user.email;
  const initials = (display || 'M').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="px-4 py-6 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl font-semibold">{initials}</div>
          )}
          <div className="flex-1">
            <div className="text-xl font-bold">{display}</div>
            <div className="text-sm text-zinc-500">{username}</div>
            {profile?.motorcycle && <div className="text-xs text-zinc-400 mt-1">🏍️ {profile.motorcycle}</div>}
            {profile?.location && <div className="text-xs text-zinc-400">📍 {profile.location}</div>}
          </div>
        </div>
        {profile?.bio && <p className="mt-3 text-sm text-zinc-300">{profile.bio}</p>}
        <form action="/logout" method="post" className="mt-4">
          <button className="text-xs text-zinc-500 hover:text-orange-400 underline">Sign out</button>
        </form>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        <h2 className="text-sm uppercase tracking-wider text-zinc-500">My posts ({posts?.length || 0})</h2>
        {!posts || posts.length === 0 ? (
          <div className="text-center py-10 text-zinc-500">
            <p>No posts yet.</p>
            <Link href="/new" className="inline-block mt-3 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg">Create first post</Link>
          </div>
        ) : (
          posts.map((p: any) => (
            <PostCard key={p.id} post={p} currentUserId={user.id} toggleLikeAction={toggleLike} />
          ))
        )}
      </main>

      <Nav active="me" />
    </div>
  );
}
