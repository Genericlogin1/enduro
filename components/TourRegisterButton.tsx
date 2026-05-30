'use client';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

export default function TourRegisterButton({ tourId, initialRegistered, isFull }: {
  tourId: string; initialRegistered: boolean; isFull: boolean;
}) {
  const [registered, setRegistered] = useState(initialRegistered);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (isFull && !registered) return;
    setPending(true);
    try {
      const res = await apiFetch<{ registered: boolean }>(`/tours/${tourId}/register`, { method: 'POST' }, getToken());
      setRegistered(res.registered);
    } catch (e: any) { alert(e.message); }
    finally { setPending(false); }
  }

  if (registered) {
    return (
      <button onClick={toggle} disabled={pending}
        className="btn btn-ghost w-full py-3 text-base border-rust/50 text-rust-strong hover:bg-rust/10">
        {pending ? '...' : '✓ Записан — отменить?'}
      </button>
    );
  }
  return (
    <button onClick={toggle} disabled={pending || isFull}
      className="btn btn-primary w-full py-3 text-base">
      {pending ? '...' : isFull ? 'Мест нет' : 'Записаться на тур'}
    </button>
  );
}
