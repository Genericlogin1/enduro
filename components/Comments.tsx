'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

type Comment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export default function Comments({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<{ comments: Comment[] }>(`/posts/${postId}/comments?limit=50`);
      setComments(data?.comments ?? []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const token = getToken();
      if (!token) return;
      const c = await apiFetch<Comment>(`/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: text.trim() }),
      }, token);
      if (c) setComments(prev => [...prev, c]);
      setText('');
    } catch {}
    setSubmitting(false);
  }

  const count = comments.length;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-muted hover:text-ink transition-colors"
      >
        {open ? 'Hide comments' : `${count > 0 ? count : ''} ${count === 1 ? 'comment' : 'comments'}`.trim() || 'Comments'}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-xs text-muted">Loading...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted">No comments yet. Be the first.</p>
          ) : (
            <ul className="space-y-2">
              {comments.map(c => (
                <li key={c.id} className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5">
                    {(c.author_name || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-semibold">{c.author_name || 'Rider'}</span>
                    <p className="text-xs text-ink/80 mt-0.5">{c.content}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {getToken() && (
            <form onSubmit={submit} className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Add a comment..."
                className="input text-xs py-1.5 flex-1"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                className="btn btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
              >
                Post
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
