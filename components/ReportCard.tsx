import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const diffColor: Record<string, string> = {
  Easy: '#4ade80', Medium: '#facc15', Hard: '#f97316', Expert: '#ef4444',
};

export default function ReportCard({ report }: { report: any }) {
  const author = report.author_name || 'Rider';
  const initials = author.slice(0, 2).toUpperCase();
  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: ru });
  const preview = report.body?.slice(0, 180);

  return (
    <Link href={`/reports/${report.id}`} className="card block card-hover overflow-hidden">
      {/* Cover */}
      {report.cover_url && (
        <div className="relative">
          <img src={report.cover_url} alt="" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {/* Author overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
              {initials}
            </div>
            <div className="bg-black/50 backdrop-blur rounded-full px-2 py-0.5 text-white text-xs font-semibold">{author}</div>
          </div>
          {/* Chips on image */}
          <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
            {report.difficulty && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: `${diffColor[report.difficulty]}cc` }}>
                {report.difficulty}
              </span>
            )}
            {report.region && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 backdrop-blur text-white/90">
                📍 {report.region}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Author if no cover */}
        {!report.cover_url && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div>
              <div className="text-sm font-semibold">{author}</div>
              <div className="text-xs text-muted">{timeAgo}</div>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="font-display text-xl leading-tight mb-1">{report.title}</h3>

        {/* Time if has cover */}
        {report.cover_url && (
          <div className="text-xs text-muted mb-2">{timeAgo}</div>
        )}

        {/* Preview text */}
        {preview && (
          <p className="text-sm text-ink/70 line-clamp-2 leading-relaxed mb-3">{preview}{report.body?.length > 180 ? '...' : ''}</p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-muted">
          {report.likes_count > 0 && <span>❤️ {report.likes_count}</span>}
          {report.views_count > 0 && <span>👁 {report.views_count}</span>}
          {report.bike_name && <span>🏍 {report.bike_name}</span>}
          {report.distance_km && <span>📏 {report.distance_km} km</span>}
          <span className="ml-auto text-moss-strong font-medium text-xs">Читать →</span>
        </div>
      </div>
    </Link>
  );
}
