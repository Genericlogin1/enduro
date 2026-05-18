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
    router.push('/');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">ENDURO WORLD</h1>
        <p className="text-center text-zinc-400 text-sm">Sign in to continue</p>
        {error && <div className="bg-red-900/40 border border-red-700 text-red-200 text-sm px-3 py-2 rounded">{error}</div>}
        <input type="email" required placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 focus:outline-none focus:border-orange-500" />
        <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 focus:outline-none focus:border-orange-500" />
        <button type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2 rounded">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-zinc-400">
          No account? <Link href="/signup" className="text-orange-400 hover:underline">Sign up</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
