'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert', 'extreme'];

export default function MapSearch({ initial }: { initial: { q?: string; country?: string; difficulty?: string; min?: string; max?: string } }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initial.q || '');
  const [country, setCountry] = useState(initial.country || '');
  const [difficulty, setDifficulty] = useState(initial.difficulty || '');
  const [min, setMin] = useState(initial.min || '');
  const [max, setMax] = useState(initial.max || '');
  const [open, setOpen] = useState(false);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (country.trim()) p.set('country', country.trim());
    if (difficulty) p.set('difficulty', difficulty);
    if (min) p.set('min', min);
    if (max) p.set('max', max);
    const qs = p.toString();
    router.push('/map' + (qs ? '?' + qs : ''));
  }

  function reset() {
    setQ(''); setCountry(''); setDifficulty(''); setMin(''); setMax('');
    router.push('/map');
  }

  return (
    <div className="px-4 py-3 border-b border-line bg-base/95 backdrop-blur sticky top-0 z-10">
      <form onSubmit={apply} className="flex gap-2 max-w-xl mx-auto">
        <input
          className="input flex-1"
          placeholder="Поиск маршрутов по названию или описанию"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Найти</button>
        <button type="button" onClick={() => setOpen(o => !o)} className="btn btn-ghost" aria-label="Фильтры">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeWidth="1.8" strokeLinecap="round" d="M3 5h14M5 10h10M8 15h4"/></svg>
        </button>
      </form>
      {open && (
        <div className="max-w-xl mx-auto mt-3 grid grid-cols-2 gap-2">
          <input className="input" placeholder="Страна / регион" value={country} onChange={e => setCountry(e.target.value)} />
          <select className="input" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
            <option value="">Любая сложность</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <input className="input" type="number" min="0" placeholder="От км" value={min} onChange={e => setMin(e.target.value)} />
          <input className="input" type="number" min="0" placeholder="До км" value={max} onChange={e => setMax(e.target.value)} />
          <button type="button" onClick={() => apply()} className="btn btn-primary col-span-1">Применить</button>
          <button type="button" onClick={reset} className="btn btn-ghost col-span-1">Сбросить</button>
        </div>
      )}
    </div>
  );
}
