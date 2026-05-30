import Link from 'next/link';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import NewsCard from '@/components/NewsCard';
import { getNews } from '@/lib/news';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import { toggleLike } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function FeedPage() {
  const token = await getServerToken();

  const [postsData, news] = await Promise.all([
    apiFetch<{ posts: any[] }>('/posts?limit=40', {}, token).catch(() => ({ posts: [] })),
    getNews().catch(() => []),
  ]);
  const posts = postsData?.posts ?? [];

  const feed: Array<{ kind: 'post' | 'news'; data: any }> = [];
  const p = posts || [];
  const n = news || [];
  let pi = 0, ni = 0;
  while (pi < p.length || ni < n.length) {
    for (let k = 0; k < 3 && pi < p.length; k++) feed.push({ kind: 'post', data: p[pi++] });
    if (ni < n.length) feed.push({ kind: 'news', data: n[ni++] });
  }

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl leading-none text-ink">ENDURO WORLD</h1>
            <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">Global Enduro Community</p>
          </div>
          {token ? (
            <Link href="/new" className="btn btn-secondary text-xs">+ Post</Link>
          ) : (
            <Link href="/login" className="btn btn-primary text-xs">Sign in</Link>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {feed.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-lg mb-2">The trail is quiet</p>
            <p className="text-sm">Be the first to share your ride.</p>
            <Link href={token ? '/new' : '/login'} className="btn btn-primary mt-4">
              {token ? 'Create post' : 'Sign in to post'}
            </Link>
          </div>
        ) : (
          feed.map((item, idx) =>
            item.kind === 'post'
              ? <PostCard key={'p' + item.data.id} post={item.data} isLoggedIn={!!token} toggleLikeAction={toggleLike} />
              : <NewsCard key={'n' + idx} item={item.data} />
          )
        )}
      </main>

      <Nav active="feed" />
    </div>
  );
}
