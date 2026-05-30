'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/token';
import { useRouter } from 'next/navigation';

export default function FollowButton({ targetId }: { targetId: string }) {
  const router = useRouter();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const me = getStoredUser();

  useEffect(() => {
    const token = getToken();
    if (!token || !me) return;
    apiFetch<{ is_following: boolean }>(`/users/${targetId}/is-following`, {}, token)
      .then(d => setFollowing(d.is_following))
      .catch(() => setFollowing(false));
  }, [targetId]);

  if (!me || me.id === targetId) return null;

  async function toggle() {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    setLoading(true);
    try {
      if (following) {
        await apiFetch(`/users/${targetId}/follow`, { method: 'DELETE' }, token);
        setFollowing(false);
      } else {
        await apiFetch(`/users/${targetId}/follow`, { method: 'POST' }, token);
        setFollowing(true);
      }
    } catch {}
    setLoading(false);
  }

  if (following === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`btn text-sm px-5 py-1.5 disabled:opacity-50 transition-all ${
        following ? 'btn-ghost border-moss/40' : 'btn-primary'
      }`}
    >
      {loading ? '...' : following ? 'Following' : 'Follow'}
    </button>
  );
}
