'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file); fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).secure_url as string;
}

export default function TourForm() {
  const router = useRouter();
  const coverRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [price, setPrice] = useState('');
  const [spots, setSpots] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [telegram, setTelegram] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    if (!CLOUD_NAME) { setError('Cloudinary не настроен'); return; }
    setUploading(true);
    try { setCoverUrl(await uploadPhoto(file)); }
    catch { setError('Ошибка загрузки'); setCoverPreview(null); }
    finally { setUploading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Введи название'); return; }
    if (uploading) { setError('Подожди, фото загружается...'); return; }
    setError(null); setSubmitting(true);
    try {
      const tour = await apiFetch<{ id: string }>('/tours', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(), description,
          cover_url: coverUrl,
          region: region || null, country: country || null,
          start_date: startDate ? new Date(startDate).toISOString() : null,
          end_date: endDate ? new Date(endDate).toISOString() : null,
          price_usd: price ? parseFloat(price) : null,
          spots_total: spots ? parseInt(spots) : null,
          difficulty: difficulty || null,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          website_url: website || null,
          telegram: telegram || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
        }),
      }, getToken());
      router.push(`/tours/${tour.id}`);
    } catch (e: any) {
      setError(e.message || 'Ошибка');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Cover */}
      <div onClick={() => coverRef.current?.click()}
        className={'cursor-pointer rounded-xl border-2 border-dashed overflow-hidden transition-colors ' +
          (coverPreview ? 'border-transparent' : 'border-line hover:border-moss/50')}>
        {coverPreview ? (
          <div className="relative">
            <img src={coverPreview} alt="" className="w-full max-h-56 object-cover" />
            {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm">Загружаю...</div>}
            {coverUrl && <div className="absolute top-2 right-2 bg-moss/90 text-white text-xs px-2 py-0.5 rounded-full">✓</div>}
          </div>
        ) : (
          <div className="py-10 flex flex-col items-center gap-2 text-muted">
            <span className="text-3xl">🏔️</span>
            <span className="text-sm">Добавить обложку тура</span>
          </div>
        )}
        <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Название *</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Карпатский эндуро: 5 дней" className="input text-base font-semibold" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Описание</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Маршрут, программа, что включено, снаряжение..." rows={6} className="input resize-y" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Регион</label>
          <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Карпаты" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Страна</label>
          <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Украина" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Начало</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Конец</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Цена ($)</label>
          <input type="number" min="0" value={price} onChange={e => setPrice(e.target.value)} placeholder="500" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Мест</label>
          <input type="number" min="1" value={spots} onChange={e => setSpots(e.target.value)} placeholder="10" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Сложность</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input">
            <option value="">Любая</option><option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option>
          </select>
        </div>
      </div>

      <div className="border-t border-line pt-4 space-y-3">
        <h3 className="font-semibold text-sm">Контакты</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Email</label>
            <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="tour@example.com" className="input" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Телефон</label>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+7 999 123 45 67" className="input" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Сайт</label>
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://..." className="input" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Telegram</label>
          <input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="@username" className="input" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">WhatsApp</label>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+7 999 123 45 67" className="input" />
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Instagram</label>
          <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@handle" className="input" />
        </div>
      </div>

      {error && <p className="text-rust-strong text-sm">{error}</p>}
      <button type="submit" disabled={submitting || uploading} className="btn btn-primary w-full py-3 text-base">
        {submitting ? 'Публикую...' : 'Опубликовать тур'}
      </button>
    </form>
  );
}
