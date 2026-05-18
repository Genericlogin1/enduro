'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const origin = window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: { username, display_name: username },
      },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.user && !data.session) {
      router.push('/check-email?email=' + encodeURIComponent(email));
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">ENDURO WORLD</h1>
          <p className="text-zinc-400 text-sm">Join the community</p>
        </div>
        <input
          type="text" required minLength={3} maxLength={20} value={username}
          onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          placeholder="Username"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
        />
        <input
          type="email" required value={email} onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
        />
        <input
          type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Password (min 6)"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 outline-none focus:border-orange-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit" disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3 transition"
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>
        <p className="text-center text-sm text-zinc-400">
          Have an account? <Link href="/login" className="text-orange-400 hover:underline">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
