'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = window.location.origin + '/auth/callback?next=/reset-password';
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 card p-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl">RESET PASSWORD</h1>
          <p className="text-muted text-sm">
            We will email you a secure link to set a new password.
          </p>
        </div>

        {sent ? (
          <div className="space-y-3 text-center">
            <div className="chip chip-accent w-full justify-center">
              Check your inbox — reset link sent.
            </div>
            <p className="text-sm text-muted">
              Did not get it? Look in spam, or try again in a minute.
            </p>
            <Link href="/login" className="btn btn-ghost w-full">Back to sign in</Link>
          </div>
        ) : (
          <>
            {error && <div className="chip chip-rust w-full justify-center">{error}</div>}
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="flex items-center justify-between text-sm pt-1">
              <Link href="/login" className="text-muted hover:text-ink">← Sign in</Link>
              <Link href="/" className="text-muted hover:text-ink">Back to feed</Link>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
