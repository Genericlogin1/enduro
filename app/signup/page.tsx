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
      router.push('/check-email');
    } else {
      router.push('/');
      router.refresh();
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
          minLength={3}
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
          placeholder="Username"
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
          placeholder="Password (min 6)"
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
