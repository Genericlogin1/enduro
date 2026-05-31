'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

export default function NewRidePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [maxParts, setMaxParts] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !date) {
      setError('Заполни название, место и дату');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const token = getToken();
      await apiFetch('/rides', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          location,
          ride_date: new Date(date).toISOString(),
          max_participants: maxParts ? parseInt(maxParts) : null,
        }),
      }, token);
      router.push('/rides');
    } catch (e: any) {
      setError(e.message || 'Ошибка при создании');
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/90 backdrop-blur border-b border-line">
        <div className="max-w-xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted hover:text-ink transition-colors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M12 4l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 className="font-display text-xl tracking-widest">НОВАЯ ПОКАТУШКА</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">Название *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Карпаты — выходные, жёсткий эндуро"
              className="input"
              maxLength={120}
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">Место *</label>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Карпаты, Закарпатье"
              className="input"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">Дата и время *</label>
            <input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">Описание</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Уровень подготовки, что взять, программа..."
              rows={4}
              className="input resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted block mb-1.5">Макс. участников</label>
            <input
              type="number"
              value={maxParts}
              onChange={e => setMaxParts(e.target.value)}
              placeholder="Без ограничений"
              min={1}
              max={200}
              className="input"
            />
            <p className="text-xs text-muted mt-1">Оставь пустым — мест неограничено</p>
          </div>

          {error && <p className="text-rust-strong text-sm">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full py-3 text-base"
          >
            {submitting ? 'Создаю...' : 'Создать покатушку'}
          </button>
        </form>
      </main>
      
    </div>
  );
}
