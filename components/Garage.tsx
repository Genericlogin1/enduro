'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

type Bike = {
  id: string;
  make: string;
  model: string;
  year: number;
  engine_cc: number;
  notes: string;
};

export default function Garage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ make: '', model: '', year: '', engine_cc: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiFetch<{ bikes: Bike[] }>('/garage/', {}, token)
      .then(d => setBikes(d?.bikes ?? []))
      .catch(() => {});
  }, []);

  async function addBike(e: React.FormEvent) {
    e.preventDefault();
    if (!form.make || !form.model) { setError('Make and model are required'); return; }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const bike = await apiFetch<Bike>('/garage/', {
        method: 'POST',
        body: JSON.stringify({
          make: form.make,
          model: form.model,
          year: parseInt(form.year) || 0,
          engine_cc: parseInt(form.engine_cc) || 0,
          notes: form.notes,
        }),
      }, token);
      setBikes(prev => [bike, ...prev]);
      setForm({ make: '', model: '', year: '', engine_cc: '', notes: '' });
      setAdding(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add bike');
    }
    setSaving(false);
  }

  async function deleteBike(id: string) {
    const token = getToken();
    if (!token) return;
    setBikes(prev => prev.filter(b => b.id !== id));
    await apiFetch(`/garage/${id}`, { method: 'DELETE' }, token).catch(() => {});
  }

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="font-display text-xl">Garage <span className="text-muted text-base">({bikes.length})</span></h2>
        <button onClick={() => setAdding(a => !a)} className="text-xs text-moss-strong hover:underline">
          {adding ? 'Cancel' : '+ Add bike'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addBike} className="card p-4 mb-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              required
              placeholder="Make (e.g. KTM)"
              value={form.make}
              onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
              className="input text-sm"
            />
            <input
              required
              placeholder="Model (e.g. EXC 300)"
              value={form.model}
              onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              className="input text-sm"
            />
            <input
              type="number"
              placeholder="Year"
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              className="input text-sm"
            />
            <input
              type="number"
              placeholder="Engine cc"
              value={form.engine_cc}
              onChange={e => setForm(f => ({ ...f, engine_cc: e.target.value }))}
              className="input text-sm"
            />
          </div>
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="input text-sm w-full"
          />
          {error && <p className="text-xs text-rust-strong">{error}</p>}
          <button type="submit" disabled={saving} className="btn btn-primary w-full disabled:opacity-50">
            {saving ? 'Saving...' : 'Add to garage'}
          </button>
        </form>
      )}

      {bikes.length === 0 && !adding ? (
        <div className="card p-6 text-center text-muted text-sm">
          No bikes yet.{' '}
          <button onClick={() => setAdding(true)} className="text-moss-strong hover:underline">Add your first →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {bikes.map(b => (
            <div key={b.id} className="card p-3 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">
                  {b.year > 0 && `${b.year} `}{b.make} {b.model}
                  {b.engine_cc > 0 && <span className="text-muted font-normal"> · {b.engine_cc}cc</span>}
                </div>
                {b.notes && <div className="text-xs text-muted mt-0.5 truncate">{b.notes}</div>}
              </div>
              <button
                onClick={() => deleteBike(b.id)}
                className="text-muted hover:text-rust-strong text-xs shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
