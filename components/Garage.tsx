'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';
import { BIKE_MAKES, getMake } from '@/lib/bikes';

type Bike = {
  id: string;
  make: string;
  model: string;
  year: number;
  engine_cc: number;
  notes: string;
};

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

export default function Garage() {
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [adding, setAdding] = useState(false);
  const [selectedMake, setSelectedMake] = useState('');
  const [customMake, setCustomMake] = useState('');
  const [form, setForm] = useState({ model: '', year: String(new Date().getFullYear()), engine_cc: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    apiFetch<{ bikes: Bike[] }>('/garage/', {}, token)
      .then(d => setBikes(d?.bikes ?? []))
      .catch(() => {});
  }, []);

  const makeInfo = getMake(selectedMake);
  const isOther = selectedMake === 'Other';
  const availableModels = makeInfo?.models ?? [];

  async function addBike(e: React.FormEvent) {
    e.preventDefault();
    const make = isOther ? customMake : selectedMake;
    if (!make || !form.model) { setError('Make and model are required'); return; }
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const bike = await apiFetch<Bike>('/garage/', {
        method: 'POST',
        body: JSON.stringify({
          make,
          model: form.model,
          year: parseInt(form.year) || 0,
          engine_cc: parseInt(form.engine_cc) || 0,
          notes: form.notes,
        }),
      }, token);
      setBikes(prev => [bike, ...prev]);
      setSelectedMake('');
      setCustomMake('');
      setForm({ model: '', year: String(new Date().getFullYear()), engine_cc: '', notes: '' });
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
        <button onClick={() => { setAdding(a => !a); setSelectedMake(''); }} className="text-xs text-moss-strong hover:underline">
          {adding ? 'Cancel' : '+ Add bike'}
        </button>
      </div>

      {adding && (
        <form onSubmit={addBike} className="card p-4 mb-3 space-y-3">
          {/* Step 1: pick make */}
          {!selectedMake ? (
            <div>
              <p className="text-xs text-muted mb-2 uppercase tracking-wider">Select brand</p>
              <div className="grid grid-cols-3 gap-2">
                {BIKE_MAKES.map(m => (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => { setSelectedMake(m.name); setForm(f => ({ ...f, model: '' })); }}
                    className="rounded-lg py-2 px-1 text-sm font-bold text-center transition hover:opacity-80"
                    style={{ backgroundColor: m.color, color: m.textColor }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Selected make badge */}
              <div className="flex items-center gap-2">
                <span
                  className="rounded px-3 py-1 text-sm font-bold"
                  style={{ backgroundColor: makeInfo?.color ?? '#4B5563', color: makeInfo?.textColor ?? '#fff' }}
                >
                  {isOther ? 'Custom' : selectedMake}
                </span>
                <button type="button" onClick={() => setSelectedMake('')} className="text-xs text-muted hover:text-ink">
                  Change brand
                </button>
              </div>

              {isOther && (
                <input
                  required
                  placeholder="Brand name"
                  value={customMake}
                  onChange={e => setCustomMake(e.target.value)}
                  className="input text-sm w-full"
                />
              )}

              {/* Model: dropdown if known make, input if Other */}
              {!isOther && availableModels.length > 0 ? (
                <select
                  required
                  value={form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  className="input text-sm w-full"
                >
                  <option value="">Select model</option>
                  {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                  <option value="__custom__">Other / custom model</option>
                </select>
              ) : (
                <input
                  required
                  placeholder="Model"
                  value={form.model === '__custom__' ? '' : form.model}
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  className="input text-sm w-full"
                />
              )}

              {/* If they picked "other model" from dropdown */}
              {form.model === '__custom__' && (
                <input
                  required
                  placeholder="Enter model name"
                  onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                  className="input text-sm w-full"
                />
              )}

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                  className="input text-sm"
                >
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <input
                  type="number"
                  placeholder="Engine cc (optional)"
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
            </div>
          )}
        </form>
      )}

      {bikes.length === 0 && !adding ? (
        <div className="card p-6 text-center text-muted text-sm">
          No bikes yet.{' '}
          <button onClick={() => setAdding(true)} className="text-moss-strong hover:underline">Add your first →</button>
        </div>
      ) : (
        <div className="space-y-2">
          {bikes.map(b => {
            const info = getMake(b.make);
            return (
              <div key={b.id} className="card p-3 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: info?.color ?? '#4B5563', color: info?.textColor ?? '#fff' }}
                >
                  {b.make.slice(0, 3).toUpperCase()}
                </div>
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
            );
          })}
        </div>
      )}
    </section>
  );
}
