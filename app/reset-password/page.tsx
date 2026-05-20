'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait until Supabase has the recovery session loaded (it does so automatically when the user lands here from the email link via /auth/callback).
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setReady(true);
      else setError('This reset link is invalid or has expired. Request a new one.');
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/'), 1500);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 card p-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl">NEW PASSWORD</h1>
          <p className="text-muted text-sm">Pick something you will remember this time.</p>
        </div>

        {done && (
          <div className="chip chip-accent w-full justify-center">Password updated. Redirecting…</div>
        )}
        {error && (
          <div className="chip chip-rust w-full justify-center">{error}</div>
        )}

        <input
          type="password"
          required
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          disabled={!ready || done}
        />
        <input
          type="password"
          required
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input"
          disabled={!ready || done}
        />
        <button type="submit" disabled={loading || !ready || done} className="btn btn-primary w-full">
          {loading ? 'Saving…' : 'Update password'}
        </button>
        <div className="flex items-center justify-between text-sm pt-1">
          <Link href="/forgot-password" className="text-muted hover:text-ink">Request a new link</Link>
          <Link href="/" className="text-muted hover:text-ink">Back to feed</Link>
        </div>
      </form>
    </main>
  );
}
