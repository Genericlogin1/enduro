'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

export default function ReportLikeButton({ reportId, initialLiked, initialCount, isLoggedIn }: {
  reportId: string;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function handleLike() {
    if (!isLoggedIn || pending) return;
    const token = getToken();
    if (!token) return;
    const next = !liked;
    setLiked(next);
    setCount(c => c + (next ? 1 : -1));
    setPending(true);
    try {
      await apiFetch(`/reports/${reportId}/like`, { method: 'POST' }, token);
    } catch {
      setLiked(!next);
      setCount(c => c + (next ? -1 : 1));
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={pending || !isLoggedIn}
      className={'flex items-center gap-1.5 text-sm font-medium transition-all ' +
        (liked ? 'text-rust-strong scale-105' : 'text-muted hover:text-rust-strong')}
    >
      <svg viewBox="0 0 24 24" fill={liked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="w-6 h-6">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
      <span className="text-base">{count > 0 ? count : ''} {count > 0 ? 'лайков' : 'Нравится'}</span>
    </button>
  );
}
