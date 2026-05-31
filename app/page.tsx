import Link from 'next/link';
import Nav from '@/components/Nav';
import PostCard from '@/components/PostCard';
import ReportCard from '@/components/ReportCard';
import NewsCard from '@/components/NewsCard';
import ActivityCard from '@/components/ActivityCard';
import { getNews } from '@/lib/news';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

// ── Landing page for unauthenticated visitors ──────────────────────────────

function LandingPage() {
  const features = [
    {
      icon: '🗺️',
      title: 'Карта маршрутов',
      desc: 'Тысячи GPS-треков эндуро маршрутов. Фильтруй по сложности, стране, дистанции. Скачивай GPX для Garmin.',
    },
    {
      icon: '📡',
      title: 'Live GPS трекинг',
      desc: 'Запись маршрута прямо с телефона. Работает офлайн — буферизует точки и синхронизирует при появлении связи.',
    },
    {
      icon: '🏕️',
      title: 'Туры и организаторы',
      desc: 'Каталог эндуро туров от проверенных операторов. Бронируй онлайн, общайся напрямую в Telegram/WhatsApp.',
    },
    {
      icon: '⚠️',
      title: 'Spot-карта опасностей',
      desc: 'Краудсорсинговые метки: опасные спуски, грязь, заправки, лагерные места. Добавляй и голосуй.',
    },
    {
      icon: '👥',
      title: 'Сообщество райдеров',
      desc: 'Посты, фото, видео с покатушек. Подписывайся на других райдеров, комментируй, лайкай.',
    },
    {
      icon: '🏍️',
      title: 'Гараж и байки',
      desc: 'Каталог мотоциклов. Добавляй свой байк, смотри что у других райдеров и операторов проката.',
    },
  ];

  const stats = [
    { value: '2 500+', label: 'Маршрутов' },
    { value: '180+', label: 'Туров' },
    { value: '12 000+', label: 'Райдеров' },
    { value: '40+', label: 'Стран' },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'rgb(var(--bg-base))' }}>
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b" style={{ background: 'rgb(var(--bg-base) / 0.9)', backdropFilter: 'blur(16px)', borderColor: 'rgb(var(--border) / 0.4)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgb(var(--accent))' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#080909" strokeWidth="2" className="w-4 h-4">
                <circle cx="10" cy="10" r="7" strokeWidth="1.5"/>
                <path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display text-xl tracking-widest">
              ENDURO<span style={{ color: 'rgb(var(--accent))' }}>.</span>WORLD
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost text-xs py-1.5 px-3">Войти</Link>
            <Link href="/signup" className="btn btn-primary text-xs py-1.5 px-3">Зарегистрироваться</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgb(var(--border) / 0.15) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border) / 0.15) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgb(var(--accent) / 0.12) 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-6 text-xs font-bold uppercase tracking-widest"
            style={{ borderColor: 'rgb(var(--accent) / 0.4)', color: 'rgb(var(--accent))', background: 'rgb(var(--accent) / 0.08)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'rgb(var(--accent))' }} />
            Социальная сеть для эндуро райдеров
          </div>

          <h1 className="font-display text-6xl md:text-8xl leading-none tracking-wider mb-6">
            ТВОЙ ТРЕЙЛ.
            <br />
            <span style={{ color: 'rgb(var(--accent))' }}>ТВОЁ КОМЬЮНИТИ.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'rgb(var(--text-muted))' }}>
            Карта маршрутов, GPS трекинг, туры от операторов и сообщество эндуро райдеров.
            Всё в одном месте.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn btn-primary text-base py-3 px-8">
              Начать бесплатно →
            </Link>
            <Link href="/map" className="btn btn-ghost text-base py-3 px-8">
              Смотреть маршруты
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y" style={{ borderColor: 'rgb(var(--border) / 0.4)', background: 'rgb(var(--bg-elev-1))' }}>
        <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="font-display text-4xl md:text-5xl" style={{ color: 'rgb(var(--accent))' }}>{s.value}</div>
              <div className="text-xs uppercase tracking-widest mt-1" style={{ color: 'rgb(var(--text-muted))' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="font-display text-4xl text-center mb-12">ЧТО ВНУТРИ</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {features.map(f => (
            <div key={f.title} className="card p-5 card-hover transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-display text-xl mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--text-muted))' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For business section */}
      <section className="border-t" style={{ borderColor: 'rgb(var(--border) / 0.4)', background: 'rgb(var(--bg-elev-1))' }}>
        <div className="max-w-5xl mx-auto px-4 py-16 md:flex items-center gap-12">
          <div className="flex-1 mb-8 md:mb-0">
            <div className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-4"
              style={{ background: 'rgb(var(--rust) / 0.15)', color: 'rgb(var(--rust-strong))' }}>
              Для бизнеса
            </div>
            <h2 className="font-display text-4xl leading-tight mb-4">ТВОИ ТУРЫ —<br />ТВОЯ АУДИТОРИЯ</h2>
            <p className="mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
              Размести свои туры бесплатно. Получи страницу с онлайн-бронированием,
              верифицированный профиль и прямой контакт с тысячами райдеров.
            </p>
            <ul className="space-y-2 mb-8">
              {['Страница оператора с галереей туров', 'Кнопки Telegram и WhatsApp для связи', 'Бронирование и заявки онлайн', 'Аналитика просмотров и кликов'].map(item => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <span className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
                    style={{ background: 'rgb(var(--accent))', color: '#080909' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/signup?type=business" className="btn btn-secondary">Создать бизнес-профиль</Link>
          </div>
          <div className="flex-1">
            <div className="card p-6 space-y-4">
              <div className="font-display text-lg">🏕️ Карпаты Эндуро</div>
              <div className="flex gap-2 flex-wrap">
                <span className="chip chip-accent">✓ Верифицирован</span>
                <span className="chip chip-rust">Туроператор</span>
              </div>
              <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>5-дневный тур по Карпатам. Все уровни подготовки. Включает трансфер, питание и сопровождение.</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[['12', 'Туров'], ['320', 'Участников'], ['4.9 ★', 'Рейтинг']].map(([v, l]) => (
                  <div key={l} className="p-2 rounded-lg" style={{ background: 'rgb(var(--bg-base))' }}>
                    <div className="font-bold text-sm">{v}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 py-2 rounded-lg text-center text-xs font-bold text-white" style={{ background: '#229ED9' }}>✈️ Telegram</div>
                <div className="flex-1 py-2 rounded-lg text-center text-xs font-bold text-white" style={{ background: '#25D366' }}>📱 WhatsApp</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* GPS tracking section */}
      <section className="max-w-5xl mx-auto px-4 py-16 md:flex items-center gap-12">
        <div className="flex-1 mb-8 md:mb-0">
          <div className="card p-5 space-y-3" style={{ background: 'rgb(var(--bg-elev-1))' }}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm">Карпаты — Day 3</span>
              <span className="badge-live">LIVE</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[['42.3', 'км'], ['2:18', 'часа'], ['28', 'км/ч']].map(([v, l]) => (
                <div key={l} className="p-2 rounded-lg" style={{ background: 'rgb(var(--bg-base))' }}>
                  <div className="font-display text-2xl" style={{ color: 'rgb(var(--accent))' }}>{v}</div>
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>{l}</div>
                </div>
              ))}
            </div>
            <div className="h-24 rounded-lg flex items-center justify-center text-xs"
              style={{ background: 'rgb(var(--bg-base))', color: 'rgb(var(--text-muted))', border: '1px solid rgb(var(--border))' }}>
              📍 GPS карта в реальном времени
            </div>
            <p className="text-xs text-center" style={{ color: 'rgb(var(--text-muted))' }}>
              Поделись ссылкой с друзьями — они будут видеть тебя live
            </p>
          </div>
        </div>
        <div className="flex-1">
          <div className="inline-block px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider mb-4"
            style={{ background: 'rgb(var(--accent) / 0.1)', color: 'rgb(var(--accent))' }}>
            GPS Трекинг
          </div>
          <h2 className="font-display text-4xl leading-tight mb-4">ЗАПИШЬ МАРШРУТ. ПОДЕЛИСЬ LIVE.</h2>
          <p className="mb-4" style={{ color: 'rgb(var(--text-muted))' }}>
            Включи запись прямо в браузере. Приложение работает offline — накапливает точки
            и синхронизирует как только появится сеть.
          </p>
          <p className="mb-6" style={{ color: 'rgb(var(--text-muted))' }}>
            Поделись ссылкой с друзьями — они увидят твой трек в реальном времени. Скачай GPX для Garmin или Komoot.
          </p>
          <Link href="/gps" className="btn btn-primary">Записать маршрут</Link>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t" style={{ borderColor: 'rgb(var(--border) / 0.4)' }}>
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <h2 className="font-display text-5xl mb-4">ГОТОВ?</h2>
          <p className="mb-8 text-lg" style={{ color: 'rgb(var(--text-muted))' }}>Присоединяйся к тысячам эндуро райдеров. Бесплатно.</p>
          <Link href="/signup" className="btn btn-primary text-lg py-3.5 px-10">
            Создать аккаунт →
          </Link>
          <p className="mt-4 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>Уже есть аккаунт? <Link href="/login" className="underline">Войти</Link></p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8" style={{ borderColor: 'rgb(var(--border) / 0.4)', background: 'rgb(var(--bg-elev-1))' }}>
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-lg tracking-widest">
            ENDURO<span style={{ color: 'rgb(var(--accent))' }}>.</span>WORLD
          </span>
          <div className="flex gap-6 text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
            <Link href="/map" className="hover:text-ink">Карта</Link>
            <Link href="/tours" className="hover:text-ink">Туры</Link>
            <Link href="/signup?type=business" className="hover:text-ink">Для бизнеса</Link>
          </div>
          <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>© 2026 Enduro World</span>
        </div>
      </footer>
    </div>
  );
}

// ── Feed page for authenticated users ─────────────────────────────────────

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const token = await getServerToken();

  // Unauthenticated → show landing
  if (!token) return <LandingPage />;

  const tab = searchParams?.tab === 'following' ? 'following'
    : searchParams?.tab === 'reports' ? 'reports'
    : searchParams?.tab === 'activity' ? 'activity'
    : 'all';

  const [postsData, reportsData, news, activityData] = await Promise.all([
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
    tab === 'activity'
      ? apiFetch<{ items: any[] }>('/activity', {}, token).catch(() => ({ items: [] }))
      : Promise.resolve({ items: [] }),
  ]);

  const posts = postsData?.posts ?? [];
  const reports = reportsData?.reports ?? [];
  const news2 = (news as any[]) ?? [];
  const activityItems = activityData?.items ?? [];

  const feed: Array<{ kind: 'post' | 'news' | 'report' | 'activity'; data: any }> = [];
  if (tab === 'all') {
    let pi = 0, ni = 0;
    while (pi < posts.length || ni < news2.length) {
      for (let k = 0; k < 3 && pi < posts.length; k++) feed.push({ kind: 'post', data: posts[pi++] });
      if (ni < news2.length) feed.push({ kind: 'news', data: news2[ni++] });
    }
  } else if (tab === 'following') {
    posts.forEach(p => feed.push({ kind: 'post', data: p }));
  } else if (tab === 'activity') {
    activityItems.forEach(a => feed.push({ kind: 'activity', data: a }));
  } else {
    reports.forEach(r => feed.push({ kind: 'report', data: r }));
  }

  const tabs = [
    { key: 'all', label: 'Лента' },
    { key: 'activity', label: 'Активность' },
    { key: 'reports', label: 'Отчёты' },
    { key: 'following', label: 'Подписки' },
  ];

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 pt-3.5 pb-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgb(var(--accent))', boxShadow: '0 2px 10px rgb(var(--accent) / 0.35)' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="#080909" strokeWidth="2" className="w-4 h-4">
                <circle cx="10" cy="10" r="7" strokeWidth="1.5"/>
                <path d="M10 6v4l3 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 className="font-display text-2xl leading-none tracking-widest">
              ENDURO<span style={{ color: 'rgb(var(--accent))' }}>.</span>WORLD
            </h1>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link href="/search"
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-muted hover:text-ink"
              style={{ background: 'rgb(var(--bg-elev-2))' }}>
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-4 h-4">
                <circle cx="8.5" cy="8.5" r="5" strokeWidth="1.7" />
                <path d="M14 14l3 3" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </Link>
            <Link href="/new" className="btn btn-primary text-xs py-1.5 px-3">+ Пост</Link>
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 flex gap-0.5 pb-2">
          {tabs.map(t => (
            <Link key={t.key} href={t.key === 'all' ? '/' : `/?tab=${t.key}`}
              className="relative text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              style={tab === t.key
                ? { color: 'rgb(var(--accent))', background: 'rgb(var(--accent) / 0.1)' }
                : { color: 'rgb(var(--text-muted))' }
              }>
              {t.label}
              {tab === t.key && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ background: 'rgb(var(--accent))' }} />
              )}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {feed.length === 0 ? (
          <div className="text-center py-16" style={{ color: 'rgb(var(--text-muted))' }}>
            {tab === 'following' ? (
              <><p className="text-lg mb-2">Нет постов от подписок</p><p className="text-sm">Найди райдеров и подпишись.</p><Link href="/search" className="btn btn-ghost mt-4 inline-block">Найти райдеров</Link></>
            ) : tab === 'reports' ? (
              <><p className="text-lg mb-2">Пока нет отчётов</p><Link href="/reports/new" className="btn btn-primary mt-4 inline-block">Написать отчёт</Link></>
            ) : tab === 'activity' ? (
              <p className="text-lg mb-2">Пока нет активности</p>
            ) : (
              <><p className="text-lg mb-2">Лента пуста</p><Link href="/new" className="btn btn-primary mt-4 inline-block">Создать пост</Link></>
            )}
          </div>
        ) : (
          feed.map((item, idx) =>
            item.kind === 'post' ? <PostCard key={'p' + item.data.id} post={item.data} isLoggedIn={!!token} />
            : item.kind === 'report' ? <ReportCard key={'r' + item.data.id} report={item.data} />
            : item.kind === 'activity' ? <ActivityCard key={'a' + item.data.id} item={item.data} />
            : <NewsCard key={'n' + idx} item={item.data} />
          )
        )}
      </main>
      <Nav active="feed" />
    </div>
  );
}
