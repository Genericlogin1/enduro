'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

interface Props {
  tourId: string;
  tourTitle: string;
  price?: number;
  currency?: string;
}

export default function TourBookingForm({ tourId, tourTitle, price, currency = '₽' }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    seats: '1',
    desired_date: '',
    message: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Укажи имя и email'); return; }
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      await apiFetch(`/tours/${tourId}/book`, {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          seats: parseInt(form.seats) || 1,
          desired_date: form.desired_date,
          message: form.message,
        }),
      }, token);
      setSent(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки');
    }
    setSaving(false);
  }

  if (sent) {
    return (
      <div className="card p-6 text-center space-y-3">
        <div className="text-4xl">✅</div>
        <h3 className="font-display text-xl">Заявка отправлена!</h3>
        <p className="text-sm" style={{ color: 'rgb(var(--text-muted))' }}>
          Организатор свяжется с тобой в ближайшее время по email или телефону.
        </p>
        <button onClick={() => { setSent(false); setOpen(false); }} className="btn btn-ghost text-xs">
          Закрыть
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="space-y-2">
        {price && (
          <div className="text-center mb-3">
            <span className="font-display text-3xl" style={{ color: 'rgb(var(--accent))' }}>
              от {price.toLocaleString('ru')} {currency}
            </span>
            <span className="text-xs ml-1" style={{ color: 'rgb(var(--text-muted))' }}>/ человек</span>
          </div>
        )}
        <button
          onClick={() => setOpen(true)}
          className="btn btn-primary w-full py-3 text-sm"
        >
          🏕️ Оставить заявку
        </button>
        <p className="text-xs text-center" style={{ color: 'rgb(var(--text-muted))' }}>
          Бесплатно · Организатор ответит в течение 24 часов
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card p-4 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg">Заявка на тур</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-muted hover:text-ink text-xs">✕</button>
      </div>

      <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
        «{tourTitle}»
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Имя *</label>
          <input value={form.name} onChange={set('name')} placeholder="Иван" className="input text-sm" required />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Email *</label>
          <input type="email" value={form.email} onChange={set('email')} placeholder="ivan@mail.ru" className="input text-sm" required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Телефон</label>
          <input value={form.phone} onChange={set('phone')} placeholder="+7 999 123 45 67" className="input text-sm" />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Мест</label>
          <select value={form.seats} onChange={set('seats')} className="input text-sm">
            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Желаемые даты</label>
        <input value={form.desired_date} onChange={set('desired_date')} placeholder="например: июль 2026" className="input text-sm" />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgb(var(--text-muted))' }}>Сообщение организатору</label>
        <textarea value={form.message} onChange={set('message')}
          placeholder="Уровень подготовки, вопросы..."
          rows={2} className="input text-sm resize-none" />
      </div>

      {error && <p className="text-xs" style={{ color: 'rgb(var(--rust-strong))' }}>{error}</p>}

      <button type="submit" disabled={saving} className="btn btn-primary w-full disabled:opacity-50">
        {saving ? 'Отправляю...' : 'Отправить заявку'}
      </button>
      <p className="text-[10px] text-center" style={{ color: 'rgb(var(--text-muted))' }}>
        Нажимая кнопку, ты соглашаешься на обработку данных
      </p>
    </form>
  );
}
