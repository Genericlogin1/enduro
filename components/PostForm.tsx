'use client';

import { useState } from 'react';
import { createPost } from '@/app/actions';

export default function PostForm() {
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
      const fd = new FormData();
      fd.set('content', content);
      fd.set('location', location);
      await createPost(fd);
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
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
