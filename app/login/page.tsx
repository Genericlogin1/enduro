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
      const data = await apiFetch<{ access_token: string; user: { id: string; name: string; email: string } }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      setSession(data.access_token, data.user);
      router.push(params.get('next') || '/');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse 100% 60% at 50% 0%, rgb(var(--accent) / 0.06) 0%, transparent 60%)' }}>
      <form onSubmit={handleSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center space-y-2 pb-1">
          {/* Logo mark */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'rgb(var(--accent))', boxShadow: '0 4px 20px rgb(var(--accent) / 0.4)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#080909" strokeWidth="2.2" className="w-6 h-6">
                <circle cx="12" cy="12" r="9" strokeWidth="1.8"/>
                <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <h1 className="font-display text-4xl leading-none" style={{ color: 'rgb(var(--text-primary))' }}>
            ENDURO<span style={{ color: 'rgb(var(--accent))' }}>.</span>WORLD
          </h1>
          <p className="text-[11px] text-muted uppercase tracking-widest">Войди чтобы продолжить</p>
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
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
        />
        <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-60">
          {loading ? 'Входим...' : 'Войти'}
        </button>
        <div className="flex items-center justify-between text-sm">
          <Link href="/" className="text-muted hover:text-ink hover:underline">На главную</Link>
          <Link href="/forgot-password" className="text-muted hover:text-moss-strong hover:underline">Забыл пароль?</Link>
        </div>
        <p className="text-center text-sm text-muted">
          Нет аккаунта? <Link href="/signup" className="text-moss-strong hover:underline">Зарегистрироваться</Link>
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
