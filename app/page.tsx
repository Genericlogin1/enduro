import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { toggleLike } from '@/app/actions';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, media_urls, location, created_at, author_id, profiles:profiles!posts_author_id_fkey(username, display_name, avatar_url), likes(user_id), comments(id)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">ENDURO WORLD</h1>
          <p className="text-xs text-zinc-500">Global Enduro Community</p>
        </div>
        <Link href="/new" className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg">+ Post</Link>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {!posts || posts.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg mb-2">No posts yet</p>
            <p className="text-sm">Be the first to share your ride.</p>
            <Link href="/new" className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg">Create post</Link>
          </div>
        ) : (
          posts.map((p: any) => (
            <PostCard
              key={p.id}
              post={p}
              currentUserId={user?.id}
              toggleLikeAction={toggleLike}
            />
          ))
        )}
      </main>

      <Nav active="feed" />
    </div>
  );
}
