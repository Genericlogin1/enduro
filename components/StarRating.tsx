'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

type Props = {
  routeId: string;
  avgRating: number;
  ratingCount: number;
  myRating: number;
  isLoggedIn: boolean;
};

export default function StarRating({ routeId, avgRating, ratingCount, myRating, isLoggedIn }: Props) {
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(myRating);
  const [avg, setAvg] = useState(avgRating);
  const [count, setCount] = useState(ratingCount);
  const [saving, setSaving] = useState(false);

  async function handleRate(rating: number) {
    if (!isLoggedIn || saving) return;
    setSaving(true);
    const prev = selected;
    setSelected(rating);
    try {
      await apiFetch(`/routes/${routeId}/rate`, {
        method: 'POST',
        body: JSON.stringify({ rating }),
      }, getToken());
      // Update avg optimistically
      if (prev === 0) {
        setAvg(r => (r * count + rating) / (count + 1));
        setCount(c => c + 1);
      } else {
        setAvg(r => (r * count - prev + rating) / count);
      }
    } catch {
      setSelected(prev);
    } finally {
      setSaving(false);
    }
  }

  const display = hover || selected || avg;

  return (
    <div className="flex items-center gap-3">
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => {
          const filled = star <= (hover || selected || Math.round(avg));
          return (
            <button
              key={star}
              type="button"
              disabled={!isLoggedIn || saving}
              onClick={() => handleRate(star)}
              onMouseEnter={() => isLoggedIn && setHover(star)}
              onMouseLeave={() => setHover(0)}
              className={`transition-all ${isLoggedIn ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
            >
              <svg viewBox="0 0 20 20" className="w-5 h-5" fill={filled ? 'rgb(var(--accent))' : 'none'} stroke={filled ? 'rgb(var(--accent))' : 'currentColor'} strokeWidth="1.5">
                <path d="M10 2l2.4 5.4 5.6.5-4.2 3.9 1.3 5.7L10 14.8l-5.1 2.7 1.3-5.7L2 7.9l5.6-.5z" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Score */}
      <div className="flex items-center gap-1.5 text-sm">
        {avg > 0 ? (
          <>
            <span className="font-bold" style={{ color: 'rgb(var(--accent))' }}>
              {avg.toFixed(1)}
            </span>
            <span className="text-muted">({count} {count === 1 ? 'оценка' : count < 5 ? 'оценки' : 'оценок'})</span>
          </>
        ) : (
          <span className="text-muted text-xs">
            {isLoggedIn ? 'Оцени первым' : 'Нет оценок'}
          </span>
        )}
      </div>
    </div>
  );
}
