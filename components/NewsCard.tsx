import { formatDistanceToNow } from 'date-fns';
import type { NewsItem } from '@/lib/news';

export default function NewsCard({ item }: { item: NewsItem }) {
  const time = formatDistanceToNow(new Date(item.published_at), { addSuffix: true });
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="card card-hover block overflow-hidden">
      <div className="flex">
        {item.image_url && (
          <img src={item.image_url} alt="" className="w-28 h-28 object-cover flex-shrink-0" />
        )}
        <div className="flex-1 p-3 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="chip chip-accent">{item.source}</span>
            <span className="text-[11px] text-muted">{time}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2">{item.title}</h3>
          {item.excerpt && <p className="text-xs text-muted mt-1 line-clamp-2">{item.excerpt}</p>}
        </div>
      </div>
    </a>
  );
}
