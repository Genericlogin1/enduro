import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReportLikeButton from '@/components/ReportLikeButton';

export const dynamic = 'force-dynamic';

const diffColor: Record<string, string> = {
  Easy: 'text-green-400 bg-green-400/10',
  Medium: 'text-yellow-400 bg-yellow-400/10',
  Hard: 'text-orange-400 bg-orange-400/10',
  Expert: 'text-red-400 bg-red-400/10',
};

export default async function ReportPage({ params }: { params: { id: string } }) {
  const token = await getServerToken();
  const report = await apiFetch<any>(`/reports/${params.id}`, {}, token).catch(() => null);
  if (!report) notFound();

  const author = report.author_name || 'Rider';
  const initials = author.slice(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ru });
  const photos: string[] = report.photo_urls || [];
  const hasPhotos = photos.length > 0;

  return (
    <div className="min-h-screen pb-nav">
      {/* Cover */}
      {report.cover_url && (
        <div className="relative h-72 bg-black">
          <img src={report.cover_url} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-display text-3xl text-white leading-tight drop-shadow-lg">{report.title}</h1>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4">
        {/* Title if no cover */}
        {!report.cover_url && (
          <div className="pt-6 pb-2">
            <h1 className="font-display text-3xl leading-tight">{report.title}</h1>
          </div>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 py-4 border-b border-line">
          <Link href={`/riders/${report.author_id}`}>
            <div className="w-10 h-10 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <Link href={`/riders/${report.author_id}`} className="font-semibold text-sm hover:text-moss-strong">{author}</Link>
            <div className="text-xs text-muted flex items-center gap-2 flex-wrap mt-0.5">
              <span>{timeAgo}</span>
              {report.region && <><span>·</span><span>📍 {report.region}</span></>}
              {report.riding_date && <><span>·</span><span>🗓 {new Date(report.riding_date).toLocaleDateString('ru')}</span></>}
            </div>
          </div>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 py-3">
          {report.difficulty && (
            <span className={`chip font-bold ${diffColor[report.difficulty] || ''}`}>{report.difficulty}</span>
          )}
          {report.bike_name && <span className="chip">🏍 {report.bike_name}</span>}
          {report.distance_km && <span className="chip">📏 {report.distance_km} km</span>}
          {report.duration_min && <span className="chip">⏱ {report.duration_min} мин</span>}
          {report.views_count > 0 && <span className="chip">👁 {report.views_count}</span>}
        </div>

        {/* Body */}
        {report.body && (
          <div className="prose prose-sm max-w-none py-4 text-ink/90 leading-relaxed whitespace-pre-wrap border-b border-line">
            {report.body}
          </div>
        )}

        {/* Photo gallery */}
        {hasPhotos && (
          <div className="py-5 border-b border-line">
            <h2 className="font-display text-lg mb-3">Фото ({photos.length})</h2>
            <div className="grid grid-cols-2 gap-2">
              {photos.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={photos.length === 1 ? 'col-span-2' : ''}>
                  <img src={url} alt="" className="w-full rounded-xl object-cover aspect-video hover:opacity-90 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Like + actions */}
        <div className="flex items-center gap-4 py-4">
          <ReportLikeButton
            reportId={report.id}
            initialLiked={report.liked_by_me}
            initialCount={report.likes_count}
            isLoggedIn={!!token}
          />
          <Link href="/" className="text-xs text-muted hover:text-ink">← В ленту</Link>
        </div>
      </div>

      
    </div>
  );
}
