'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: any) {
      // Always show success to avoid email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl text-ink">RESET PASSWORD</h1>
          <p className="text-xs text-muted uppercase tracking-wider">We will email you a secure link</p>
        </div>
        {sent ? (
          <div className="space-y-3 text-center">
            <div className="border border-moss-strong/40 bg-moss/10 text-ink/90 text-sm px-3 py-3 rounded-md">
              If that email is registered, a reset link is on its way.
            </div>
            <p className="text-sm text-muted">Did not get it? Check spam, or try again in a minute.</p>
            <Link href="/login" className="btn btn-ghost w-full">Back to sign in</Link>
          </div>
        ) : (
          <>
            {error && <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">{error}</div>}
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <Link href="/login" className="text-muted hover:text-moss-strong hover:underline">← Sign in</Link>
              <Link href="/" className="text-muted hover:text-ink hover:underline">Back to feed</Link>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
