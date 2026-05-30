import Link from 'next/link';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import ReportCard from '@/components/ReportCard';
import NewsCard from '@/components/NewsCard';
import { getNews } from '@/lib/news';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const token = await getServerToken();
  const tab = searchParams?.tab === 'following' ? 'following'
    : searchParams?.tab === 'reports' ? 'reports'
    : 'all';

  const [postsData, reportsData, news] = await Promise.all([
    (tab === 'all' || tab === 'following')
      ? apiFetch<{ posts: any[] }>(
          tab === 'following' ? '/posts?following=true&limit=40' : '/posts?limit=40',
          {}, token
        ).catch(() => ({ posts: [] }))
      : Promise.resolve({ posts: [] }),
    tab === 'reports'
      ? apiFetch<{ reports: any[] }>('/reports?limit=20', {}, token).catch(() => ({ reports: [] }))
      : Promise.resolve({ reports: [] }),
    tab === 'all' ? getNews().catch(() => []) : Promise.resolve([]),
  ]);

  const posts = postsData?.posts ?? [];
  const reports = reportsData?.reports ?? [];
  const news2 = (news as any[]) ?? [];

  const feed: Array<{ kind: 'post' | 'news' | 'report'; data: any }> = [];
  if (tab === 'all') {
    let pi = 0, ni = 0;
    while (pi < posts.length || ni < news2.length) {
      for (let k = 0; k < 3 && pi < posts.length; k++) feed.push({ kind: 'post', data: posts[pi++] });
      if (ni < news2.length) feed.push({ kind: 'news', data: news2[ni++] });
    }
  } else if (tab === 'following') {
    posts.forEach(p => feed.push({ kind: 'post', data: p }));
  } else {
    reports.forEach(r => feed.push({ kind: 'report', data: r }));
  }

  const tabs = [
    { key: 'all', label: 'Все посты' },
    { key: 'reports', label: '📋 Отчёты' },
    ...(token ? [{ key: 'following', label: 'Подписки' }] : []),
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl leading-none text-ink">ENDURO WORLD</h1>
            <p className="text-[11px] text-muted mt-0.5 uppercase tracking-wider">Global Enduro Community</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/search" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-line transition-colors text-muted hover:text-ink" title="Поиск">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-4 h-4"><circle cx="8.5" cy="8.5" r="5" strokeWidth="1.7" /><path d="M14 14l3 3" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </Link>
            {token && <Link href="/reports/new" className="btn btn-ghost text-xs">📋 Отчёт</Link>}
            {token ? (
              <Link href="/new" className="btn btn-secondary text-xs">+ Пост</Link>
            ) : (
              <Link href="/login" className="btn btn-primary text-xs">Войти</Link>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-xl mx-auto px-4 flex gap-1 pb-2">
          {tabs.map(t => (
            <Link
              key={t.key}
              href={t.key === 'all' ? '/' : `/?tab=${t.key}`}
              className={'text-xs font-semibold px-3 py-1 rounded-full transition-colors ' +
                (tab === t.key ? 'bg-moss/20 text-moss-strong' : 'text-muted hover:text-ink')}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {feed.length === 0 ? (
          <div className="text-center py-16 text-muted">
            {tab === 'following' ? (
              <><p className="text-lg mb-2">Нет постов от подписок</p><p className="text-sm">Подпишись на других райдеров.</p></>
            ) : tab === 'reports' ? (
              <><p className="text-lg mb-2">Пока нет отчётов</p><p className="text-sm">Будь первым — расскажи о своей поездке.</p>
              {token && <Link href="/reports/new" className="btn btn-primary mt-4 inline-block">Написать отчёт</Link>}</>
            ) : (
              <><p className="text-lg mb-2">Лента пуста</p><p className="text-sm">Поделись своей поездкой.</p></>
            )}
          </div>
        ) : (
          feed.map((item, idx) =>
            item.kind === 'post' ? <PostCard key={'p' + item.data.id} post={item.data} isLoggedIn={!!token} />
            : item.kind === 'report' ? <ReportCard key={'r' + item.data.id} report={item.data} />
            : <NewsCard key={'n' + idx} item={item.data} />
          )
        )}
      </main>

      <Nav active="feed" />
    </div>
  );
}
