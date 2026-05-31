import { notFound } from 'next/navigation';
import Link from 'next/link';
import StarRating from '@/components/StarRating';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const route = await apiFetch<any>(`/routes/${params.id}`).catch(() => null);
  if (!route) return { title: 'Маршрут не найден' };
  const desc = [route.country, route.difficulty, route.distance_km ? `${route.distance_km} км` : null]
    .filter(Boolean).join(' · ');
  const title = `${route.name} | Enduro World`;
  const description = route.description
    ? `${route.description.slice(0, 155)}…`
    : `Эндуро маршрут: ${route.name}. ${desc}`;
  const url = `https://enduro-world.vercel.app/routes/${params.id}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: 'Enduro World',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
    alternates: { canonical: url },
  };
}

const diffColors: Record<string, string> = {
  Easy: '#4ade80', Medium: '#facc15', Hard: '#f97316', Expert: '#ef4444',
};

export default async function RouteDetailPage({ params }: { params: { id: string } }) {
  const token = await getServerToken();
  const route = await apiFetch<any>(`/routes/${params.id}`, {}, token).catch(() => null);
  if (!route) notFound();

  const author = route.author_name || 'Rider';
  const initials = author.slice(0, 2).toUpperCase();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: route.name,
    description: route.description || `Эндуро маршрут ${route.name}`,
    location: { '@type': 'Place', name: route.country || 'Unknown' },
    sport: 'Enduro Motorcycle',
  };

  return (
    <div className="min-h-screen pb-nav">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <header className="px-4 py-4 border-b border-line">
        <div className="max-w-xl mx-auto">
          <Link href="/map" className="text-xs text-muted hover:text-ink mb-3 inline-block">← Все маршруты</Link>
          <h1 className="font-display text-3xl leading-tight">{route.name}</h1>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-4 space-y-4">
        {/* Author */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/riders/${route.author_id}`}>
              <div className="w-9 h-9 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-sm font-bold">{initials}</div>
            </Link>
            <Link href={`/riders/${route.author_id}`} className="font-semibold text-sm hover:text-moss-strong">{author}</Link>
          </div>
          {/* Rating */}
          <StarRating
            routeId={route.id}
            avgRating={route.avg_rating ?? 0}
            ratingCount={route.rating_count ?? 0}
            myRating={route.my_rating ?? 0}
            isLoggedIn={!!token}
          />
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          {route.distance_km != null && (
            <div className="card p-3 text-center">
              <div className="font-display text-xl">{route.distance_km}</div>
              <div className="text-[10px] text-muted uppercase tracking-wider">км</div>
            </div>
          )}
          {route.difficulty && (
            <div className="card p-3 text-center">
              <div className="font-bold text-sm" style={{ color: diffColors[route.difficulty] }}>
                {route.difficulty}
              </div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Сложность</div>
            </div>
          )}
          {route.country && (
            <div className="card p-3 text-center">
              <div className="font-semibold text-sm truncate">{route.country}</div>
              <div className="text-[10px] text-muted uppercase tracking-wider">Регион</div>
            </div>
          )}
        </div>

        {/* Description */}
        {route.description && (
          <div className="card p-4">
            <h2 className="font-display text-lg mb-2">Описание</h2>
            <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap">{route.description}</p>
          </div>
        )}

        {/* Map link */}
        <div className="card p-4">
          <h2 className="font-display text-lg mb-2">Карта</h2>
          <Link href="/map" className="btn btn-ghost w-full text-sm">
            Открыть на карте →
          </Link>
        </div>

        <div className="text-xs text-muted">
          Добавлен {new Date(route.created_at).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      
    </div>
  );
}
