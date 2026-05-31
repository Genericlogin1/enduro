'use client';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';

type ActivityItem = {
  type: 'route' | 'gps' | 'user' | 'ride';
  id: string;
  title: string;
  actor_id: string;
  actor_name: string;
  meta: string;
  created_at: string;
};

const icons: Record<string, string> = {
  route: '🗺️',
  gps: '📡',
  user: '🏍️',
  ride: '👥',
};

const labels: Record<string, string> = {
  route: 'добавил маршрут',
  gps: 'записал трек',
  user: 'присоединился',
  ride: 'организует покатушку',
};

function parseRouteMeta(meta: string) {
  const [diff, dist] = meta.split('|');
  const diffColors: Record<string, string> = {
    Easy: '#4ade80', Medium: '#facc15', Hard: '#f97316', Expert: '#ef4444',
  };
  return { diff, dist: parseFloat(dist || '0'), color: diffColors[diff] || '#888' };
}

export default function ActivityCard({ item }: { item: ActivityItem }) {
  const initials = item.actor_name.slice(0, 2).toUpperCase();
  const time = formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ru });

  return (
    <div className="card px-4 py-3 flex items-start gap-3">
      {/* Avatar */}
      <Link href={`/riders/${item.actor_id}`} className="flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-sm font-bold ring-2 ring-line">
          {initials}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={`/riders/${item.actor_id}`} className="font-semibold text-sm hover:text-moss-strong transition-colors">
            {item.actor_name}
          </Link>
          <span className="text-xs text-muted">{labels[item.type]}</span>
        </div>

        {item.type !== 'user' && (
          <Link
            href={item.type === 'route' ? `/routes/${item.id}` : item.type === 'ride' ? `/rides/${item.id}` : `/gps/sessions/${item.id}`}
            className="flex items-center gap-1.5 mt-1 group"
          >
            <span className="text-base">{icons[item.type]}</span>
            <span className="text-sm font-medium group-hover:text-moss-strong transition-colors truncate">
              {item.title}
            </span>
          </Link>
        )}

        {item.type === 'ride' && item.meta && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
            <span>📍 {item.meta.split('|')[0]}</span>
          </div>
        )}
        {item.type === 'route' && item.meta && (
          <div className="flex items-center gap-2 mt-1.5">
            {(() => {
              const { diff, dist, color } = parseRouteMeta(item.meta);
              return <>
                {diff && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: color + '20', color }}>
                    {diff}
                  </span>
                )}
                {dist > 0 && (
                  <span className="text-[10px] text-muted">{dist} км</span>
                )}
              </>;
            })()}
          </div>
        )}

        <div className="text-[11px] text-muted mt-1">{time}</div>
      </div>

      <div className="flex-shrink-0 text-xl">{icons[item.type]}</div>
    </div>
  );
}
