'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('error') === 'auth_callback' ? 'Email confirmation failed. Try again.' : null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    const next = params.get('next') || '/';
    router.push(next);
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 card p-6">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl">ENDURO WORLD</h1>
          <p className="text-muted text-sm">Sign in to continue</p>
        </div>
        {error && <div className="chip chip-rust w-full justify-center">{error}</div>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="flex items-center justify-between text-sm pt-1">
          <Link href="/forgot-password" className="text-muted hover:text-ink">
            Forgot password?
          </Link>
          <Link href="/" className="text-muted hover:text-ink">
            ← Back to feed
          </Link>
        </div>
        <div className="divider-trail" />
        <p className="text-center text-sm text-muted">
          No account?{' '}
          <Link href="/signup" className="text-ink underline">
            Sign up
          </Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center">Loading…</main>}>
      <LoginForm />
    </Suspense>
  );
}
