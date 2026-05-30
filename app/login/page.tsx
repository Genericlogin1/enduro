'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setSession } from '@/lib/token';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ token: string; user: { id: string; name: string; email: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      setSession(data.token, data.user);
      router.push(params.get('next') || '/');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl text-ink">ENDURO WORLD</h1>
          <p className="text-xs text-muted uppercase tracking-wider">Sign in to continue</p>
        </div>
        {error && <div className="text-sm text-rust-strong border border-rust/40 bg-rust/10 rounded-md px-3 py-2">{error}</div>}
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
        <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/" className="text-muted hover:text-ink hover:underline">Back to feed</Link>
        </div>
        <p className="text-center text-sm text-muted">
          No account? <Link href="/signup" className="text-moss-strong hover:underline">Sign up</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center text-muted">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
