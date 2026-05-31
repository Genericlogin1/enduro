'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: fd,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.secure_url as string;
}

export default function PostForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canUpload = !!(CLOUD_NAME && UPLOAD_PRESET);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    if (!canUpload) {
      setError('Photo upload not configured. Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in Vercel.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadToCloudinary(file);
      setMediaUrl(url);
    } catch {
      setError('Не удалось загрузить фото. Попробуй снова.');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !mediaUrl) { setError('Добавь текст или фото'); return; }
    if (uploading) { setError('Подожди, фото ещё загружается...'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const token = getToken();
      await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({
          content,
          location: location.trim() || null,
          media_urls: mediaUrl ? [mediaUrl] : [],
        }),
      }, token);
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Ошибка при публикации');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Photo picker */}
      <div
        onClick={() => fileRef.current?.click()}
        className={
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-colors ' +
          (preview ? 'border-transparent' : 'border-line hover:border-moss/50')
        }
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="" className="w-full max-h-72 object-cover rounded-xl" />
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
                <div className="text-sm text-white font-medium">Загружаю...</div>
              </div>
            )}
            {mediaUrl && (
              <div className="absolute top-2 right-2 bg-moss/90 text-white text-xs px-2 py-0.5 rounded-full">✓ Загружено</div>
            )}
            <button
              type="button"
              onClick={ev => { ev.stopPropagation(); setPreview(null); setMediaUrl(null); if (fileRef.current) fileRef.current.value = ''; }}
              className="absolute top-2 left-2 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/80"
            >✕</button>
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center gap-2 text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
              <rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="text-sm font-medium">Добавить фото</span>
            <span className="text-xs">нажми чтобы выбрать</span>
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      </div>

      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Как прошла покатушка?"
        rows={3}
        className="input resize-none"
      />
      <input
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Карпаты, Алтай, Грузия..."
        className="input"
      />
      {error && <p className="text-rust-strong text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting || uploading}
        className="btn btn-secondary w-full py-3 text-base"
      >
        {submitting ? 'Публикую...' : uploading ? 'Загружаю фото...' : 'Опубликовать'}
      </button>
    </form>
  );
}
