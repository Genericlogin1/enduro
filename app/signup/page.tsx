'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setSession } from '@/lib/token';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ token: string; user: { id: string; name: string; email: string } }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify({ email, password, name }) },
      );
      setSession(data.token, data.user);
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl text-ink">ENDURO WORLD</h1>
          <p className="text-xs text-muted uppercase tracking-wider">Join the community</p>
        </div>
        <input
          type="text"
          required
          minLength={2}
          maxLength={50}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="input"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 chars)"
          className="input"
        />
        {error && <p className="text-rust-strong text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full disabled:opacity-60"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-muted">
          Have an account? <Link href="/login" className="text-moss-strong hover:underline">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
