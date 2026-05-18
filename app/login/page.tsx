'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
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
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">ENDURO WORLD</h1>
          <p className="text-zinc-400 text-sm">Global Enduro Community</p>
        </div>
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
        />
        <input
          type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-center text-sm text-zinc-400">
          No account? <Link href="/signup" className="text-orange-400 hover:underline">Sign up</Link>
        </p>
      </form>
    </main>
  );
}
