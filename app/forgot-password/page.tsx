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
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">RESET PASSWORD</h1>
        <p className="text-center text-zinc-400 text-sm">We will email you a secure link to set a new password.</p>
        {sent ? (
          <div className="space-y-3 text-center">
            <div className="bg-emerald-900/30 border border-emerald-700 text-emerald-200 text-sm px-3 py-2 rounded">
              Check your inbox — reset link sent.
            </div>
            <p className="text-sm text-zinc-400">Did not get it? Look in spam, or try again in a minute.</p>
            <Link href="/login" className="inline-block w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium py-2 rounded">Back to sign in</Link>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded">{error}</div>}
            <input type="email" required placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 focus:outline-none focus:border-orange-500" />
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2 rounded">
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div className="flex items-center justify-between text-sm">
              <Link href="/login" className="text-zinc-400 hover:underline">← Sign in</Link>
              <Link href="/" className="text-zinc-400 hover:underline">Back to feed</Link>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
