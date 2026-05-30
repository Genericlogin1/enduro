'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

export default function PostForm() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) { setError('Add some text'); return; }
    setError(null);
    setSubmitting(true);
    try {
      const token = getToken();
      await apiFetch('/posts', {
        method: 'POST',
        body: JSON.stringify({ content, location: location.trim() || null, media_urls: [] }),
      }, token);
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Failed to post');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="What's the ride?"
        rows={4}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
      />
      <input
        value={location}
        onChange={e => setLocation(e.target.value)}
        placeholder="Location (e.g. Carpathians, Ukraine)"
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-500"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3"
      >
        {submitting ? 'Posting...' : 'Publish'}
      </button>
    </form>
  );
}
