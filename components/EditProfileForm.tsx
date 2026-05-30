'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';

async function uploadAvatar(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).secure_url as string;
}

const BUSINESS_TYPES: Record<string, string> = {
  tour_operator: 'Туроператор',
  rental: 'Прокат байков',
  shop: 'Мото-магазин',
  school: 'Школа вождения',
  club: 'Мото-клуб',
  other: 'Другое',
};

export default function EditProfileForm({ user }: { user: any }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [accountType, setAccountType] = useState<'personal' | 'business'>(user.account_type || 'personal');
  const [businessName, setBusinessName] = useState(user.business_name || '');
  const [businessType, setBusinessType] = useState(user.business_type || '');
  const [telegram, setTelegram] = useState(user.telegram || '');
  const [whatsapp, setWhatsapp] = useState(user.whatsapp || '');
  const [instagram, setInstagram] = useState(user.instagram || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const url = await uploadAvatar(file);
      setAvatarUrl(url);
    } catch {
      setError('Ошибка загрузки фото');
      setAvatarPreview(avatarUrl);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Введи имя'); return; }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          bio: bio || null,
          account_type: accountType,
          business_name: businessName || null,
          business_type: businessType || null,
          telegram: telegram || null,
          whatsapp: whatsapp || null,
          instagram: instagram || null,
          avatar_url: avatarUrl || null,
        }),
      }, getToken());
      setSaved(true);
      setTimeout(() => {
        router.push('/me');
        router.refresh();
      }, 800);
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  }

  const initials = name.slice(0, 2).toUpperCase() || '??';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div
          onClick={() => fileRef.current?.click()}
          className="relative cursor-pointer group"
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-2 border-line group-hover:opacity-80 transition"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-2xl font-bold border-2 border-line group-hover:border-moss/50 transition">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
            <span className="text-white text-xs font-semibold">{uploading ? '...' : '📷'}</span>
          </div>
        </div>
        <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-moss-strong hover:underline">
          {uploading ? 'Загружаю...' : 'Сменить фото'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
      </div>

      {/* Account type */}
      <div>
        <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Тип профиля</label>
        <div className="grid grid-cols-2 gap-3">
          {(['personal', 'business'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                accountType === t
                  ? t === 'business' ? 'border-rust/70 bg-rust/10' : 'border-moss-strong bg-moss/10'
                  : 'border-line hover:border-moss/30'
              }`}
            >
              <div className="text-2xl mb-0.5">{t === 'personal' ? '🏍' : '🏢'}</div>
              <div className="text-xs font-semibold">{t === 'personal' ? 'Личный' : 'Бизнес'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic info */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Имя *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="input" placeholder="Как тебя зовут" required />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">О себе</label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Расскажи о себе, байке, любимых маршрутах..."
            className="input resize-none"
          />
          <p className="text-[10px] text-muted mt-1 text-right">{bio.length}/300</p>
        </div>
      </div>

      {/* Business fields */}
      {accountType === 'business' && (
        <div className="space-y-3 p-4 rounded-xl border border-rust/20 bg-rust/5">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Данные компании</p>
          <div>
            <label className="block text-xs text-muted mb-1">Название компании</label>
            <input value={businessName} onChange={e => setBusinessName(e.target.value)} className="input" placeholder="Карпаты Эндуро Тур" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Тип бизнеса</label>
            <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="input">
              <option value="">Выбери тип</option>
              {Object.entries(BUSINESS_TYPES).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Social / contacts */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider">Контакты</p>
        <div className="flex gap-2 items-center">
          <span className="text-lg w-7 text-center">✈️</span>
          <input value={telegram} onChange={e => setTelegram(e.target.value)} className="input flex-1" placeholder="@telegram" />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-lg w-7 text-center">📱</span>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className="input flex-1" placeholder="WhatsApp +7..." />
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-lg w-7 text-center">📸</span>
          <input value={instagram} onChange={e => setInstagram(e.target.value)} className="input flex-1" placeholder="@instagram" />
        </div>
      </div>

      {error && <p className="text-rust-strong text-sm">{error}</p>}

      <button
        type="submit"
        disabled={saving || uploading}
        className={`btn w-full py-3 text-base font-semibold ${saved ? 'btn-ghost text-moss-strong' : 'btn-primary'} disabled:opacity-60`}
      >
        {saved ? '✓ Сохранено!' : saving ? 'Сохраняю...' : 'Сохранить профиль'}
      </button>
    </form>
  );
}
