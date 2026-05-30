'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setSession } from '@/lib/token';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!token;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const data = await apiFetch<{ access_token: string; user: any }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: password }),
      });
      if (data?.access_token) {
        setSession(data.access_token, data.user);
      }
      setDone(true);
      setTimeout(() => router.push('/'), 1500);
    } catch (err: any) {
      setError(err?.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl text-ink">NEW PASSWORD</h1>
          <p className="text-xs text-muted uppercase tracking-wider">Pick something you will remember</p>
        </div>
        {!ready && (
          <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">
            Missing reset token. Please use the link from your email.
          </div>
        )}
        {done && <div className="border border-moss-strong/40 bg-moss/10 text-ink/90 text-sm px-3 py-3 rounded-md text-center">Password updated. Redirecting...</div>}
        {error && <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">{error}</div>}
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
        <button type="submit" disabled={loading || !ready || done} className="btn btn-primary w-full disabled:opacity-60">
          {loading ? 'Saving...' : 'Update password'}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-muted hover:text-moss-strong hover:underline">Request a new link</Link>
          <Link href="/" className="text-muted hover:text-ink hover:underline">Back to feed</Link>
        </div>
      </form>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-muted">Loading...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
