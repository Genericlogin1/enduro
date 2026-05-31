'use client';
import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

type Ride = {
  id: string;
  organizer_id: string;
  organizer_name: string;
  title: string;
  description: string;
  location: string;
  ride_date: string;
  route_id: string | null;
  max_participants: number | null;
  status: string;
  participant_count: number;
  is_joined: boolean;
};

export default function RideCard({ ride, isLoggedIn }: { ride: Ride; isLoggedIn: boolean }) {
  const [joined, setJoined] = useState(ride.is_joined);
  const [count, setCount] = useState(ride.participant_count);
  const [loading, setLoading] = useState(false);

  const date = new Date(ride.ride_date);
  const dateStr = format(date, 'd MMMM yyyy', { locale: ru });
  const isPast = date < new Date();
  const isFull = ride.max_participants !== null && count >= ride.max_participants;

  async function handleJoinLeave() {
    if (!isLoggedIn || loading) return;
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const action = joined ? 'leave' : 'join';
      await apiFetch(`/rides/${ride.id}/${action}`, { method: 'POST' }, token);
      setJoined(!joined);
      setCount(c => c + (joined ? -1 : 1));
    } catch (e: any) {
      alert(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
              isPast ? 'bg-muted/20 text-muted' :
              isFull ? 'bg-rust/10 text-rust-strong' :
              'bg-moss/10 text-moss-strong'
            }`}>
              {isPast ? 'Прошло' : isFull ? 'Мест нет' : 'Открыта'}
            </span>
            <span className="text-xs text-muted">{dateStr}</span>
          </div>

          <Link href={`/rides/${ride.id}`} className="font-bold text-base hover:text-moss-strong transition-colors block truncate">
            {ride.title}
          </Link>

          <div className="flex items-center gap-1 mt-1 text-xs text-muted">
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 flex-shrink-0">
              <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6c0-2.5-2-4.5-4.5-4.5z"/>
              <circle cx="8" cy="6" r="1.5" fill="currentColor"/>
            </svg>
            <span className="truncate">{ride.location}</span>
          </div>

          {ride.description && (
            <p className="text-xs text-muted mt-1.5 line-clamp-2">{ride.description}</p>
          )}
        </div>

        {/* Participants count */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
            style={{ background: 'rgb(var(--bg-elev-2))' }}>
            {count}
          </div>
          <span className="text-[9px] text-muted mt-0.5">едут</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-line">
        <Link href={`/riders/${ride.organizer_id}`} className="text-xs text-muted hover:text-ink transition-colors">
          {ride.organizer_name}
        </Link>

        <div className="flex items-center gap-2">
          {ride.route_id && (
            <Link href={`/routes/${ride.route_id}`}
              className="text-xs text-muted hover:text-moss-strong transition-colors flex items-center gap-1">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                <path d="M2 12C2 12 4 10 6 8s4-2 6-4" strokeLinecap="round"/>
              </svg>
              Маршрут
            </Link>
          )}
          {isLoggedIn && !isPast && (
            <button
              onClick={handleJoinLeave}
              disabled={loading || (!joined && isFull)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 ${
                joined
                  ? 'bg-rust/10 text-rust-strong hover:bg-rust/20'
                  : 'btn btn-primary py-1.5 px-3 text-xs'
              }`}
            >
              {loading ? '...' : joined ? 'Выйти' : 'Еду с вами!'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
