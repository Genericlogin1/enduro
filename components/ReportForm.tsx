'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadPhoto(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).secure_url as string;
}

export default function ReportForm({ sessions, bikes }: {
  sessions: { id: string; name: string; started_at: string }[];
  bikes: { id: string; make: string; model: string }[];
}) {
  const router = useRouter();
  const coverRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [region, setRegion] = useState('');
  const [ridingDate, setRidingDate] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [trackId, setTrackId] = useState('');
  const [bikeId, setBikeId] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = !!(CLOUD_NAME && UPLOAD_PRESET);

  async function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
    if (!canUpload) { setError('Cloudinary не настроен'); return; }
    setUploadingCover(true);
    try { setCoverUrl(await uploadPhoto(file)); }
    catch { setError('Ошибка загрузки обложки'); setCoverPreview(null); }
    finally { setUploadingCover(false); }
  }

  async function handlePhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPhotoPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    if (!canUpload) { setError('Cloudinary не настроен'); return; }
    setUploadingPhotos(true);
    try {
      const urls = await Promise.all(files.map(uploadPhoto));
      setPhotoUrls(prev => [...prev, ...urls]);
    } catch { setError('Ошибка загрузки фото'); }
    finally { setUploadingPhotos(false); }
  }

  function removePhoto(i: number) {
    setPhotoPreviews(p => p.filter((_, idx) => idx !== i));
    setPhotoUrls(p => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('Введи заголовок'); return; }
    if (uploadingCover || uploadingPhotos) { setError('Подожди, фото ещё загружается...'); return; }
    setError(null); setSubmitting(true);
    try {
      const token = getToken();
      const body2 = {
        title: title.trim(),
        body,
        cover_url: coverUrl,
        photo_urls: photoUrls,
        track_id: trackId || null,
        bike_id: bikeId || null,
        region: region.trim() || null,
        riding_date: ridingDate ? new Date(ridingDate).toISOString() : null,
        difficulty: difficulty || null,
      };
      const rep = await apiFetch<{ id: string }>('/reports', { method: 'POST', body: JSON.stringify(body2) }, token);
      router.push(`/reports/${rep.id}`);
    } catch (e: any) {
      setError(e.message || 'Ошибка при публикации');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {/* Cover */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Обложка</label>
        <div
          onClick={() => coverRef.current?.click()}
          className={'cursor-pointer rounded-xl border-2 border-dashed transition-colors overflow-hidden ' +
            (coverPreview ? 'border-transparent' : 'border-line hover:border-moss/50')}
        >
          {coverPreview ? (
            <div className="relative">
              <img src={coverPreview} alt="" className="w-full max-h-64 object-cover" />
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white text-sm">Загружаю...</span>
                </div>
              )}
              {coverUrl && <div className="absolute top-2 right-2 bg-moss/90 text-white text-xs px-2 py-0.5 rounded-full">✓</div>}
              <button type="button" onClick={ev => { ev.stopPropagation(); setCoverPreview(null); setCoverUrl(null); }}
                className="absolute top-2 left-2 bg-black/60 text-white rounded-full w-6 h-6 text-xs hover:bg-black/80">✕</button>
            </div>
          ) : (
            <div className="py-10 flex flex-col items-center gap-2 text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="M21 15l-5-5L5 21"/>
              </svg>
              <span className="text-sm">Добавить обложку</span>
            </div>
          )}
        </div>
        <input ref={coverRef} type="file" accept="image/*" onChange={handleCover} className="hidden" />
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Заголовок *</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Карпаты за 3 дня: как мы не сломались"
          className="input text-base font-semibold" />
      </div>

      {/* Body */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Текст отчёта</label>
        <textarea value={body} onChange={e => setBody(e.target.value)}
          placeholder="Расскажи о поездке — маршрут, сложности, впечатления..."
          rows={10} className="input resize-y" />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Фото ({photoPreviews.length})</label>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {photoPreviews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-bg-elev-2">
              <img src={src} alt="" className="w-full h-full object-cover" />
              {photoUrls[i] && <div className="absolute top-1 right-1 w-4 h-4 bg-moss rounded-full text-white text-[9px] flex items-center justify-center">✓</div>}
              <button type="button" onClick={() => removePhoto(i)}
                className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs hover:bg-black/80">✕</button>
            </div>
          ))}
          <div onClick={() => photosRef.current?.click()}
            className="aspect-square rounded-lg border-2 border-dashed border-line hover:border-moss/50 flex items-center justify-center cursor-pointer transition-colors">
            <span className="text-muted text-2xl">+</span>
          </div>
        </div>
        {uploadingPhotos && <p className="text-xs text-muted">Загружаю фото...</p>}
        <input ref={photosRef} type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Регион</label>
          <input value={region} onChange={e => setRegion(e.target.value)} placeholder="Карпаты, Алтай, Грузия" className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Дата поездки</label>
          <input type="date" value={ridingDate} onChange={e => setRidingDate(e.target.value)} className="input" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Сложность</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="input">
            <option value="">Не указано</option>
            <option>Easy</option><option>Medium</option><option>Hard</option><option>Expert</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Байк</label>
          <select value={bikeId} onChange={e => setBikeId(e.target.value)} className="input">
            <option value="">Не выбран</option>
            {bikes.map(b => <option key={b.id} value={b.id}>{b.make} {b.model}</option>)}
          </select>
        </div>
      </div>

      {/* GPS Track */}
      {sessions.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">GPS-трек</label>
          <select value={trackId} onChange={e => setTrackId(e.target.value)} className="input">
            <option value="">Без трека</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name || 'Без названия'} — {new Date(s.started_at).toLocaleDateString('ru')}</option>)}
          </select>
        </div>
      )}

      {error && <p className="text-rust-strong text-sm">{error}</p>}

      <button type="submit" disabled={submitting || uploadingCover || uploadingPhotos} className="btn btn-primary w-full py-3 text-base">
        {submitting ? 'Публикую...' : 'Опубликовать отчёт'}
      </button>
    </form>
  );
}
