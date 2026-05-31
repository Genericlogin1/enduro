import { redirect } from 'next/navigation';
import EditProfileForm from '@/components/EditProfileForm';
import { getServerToken } from '@/lib/serverToken';
import { apiFetch } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function EditProfilePage() {
  const token = await getServerToken();
  if (!token) redirect('/login?next=/me/edit');

  let userId = '';
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    userId = payload.user_id || payload.sub || '';
  } catch {}

  const user = userId
    ? await apiFetch<any>(`/users/${userId}`, {}, token).catch(() => null)
    : null;

  if (!user) redirect('/me');

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur border-b border-line px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <a href="/me" className="text-muted hover:text-ink text-sm">← Назад</a>
          <h1 className="font-display text-xl leading-none">Редактировать профиль</h1>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-5">
        <EditProfileForm user={user} />
      </main>
      
    </div>
  );
}
