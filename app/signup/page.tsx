'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { setSession } from '@/lib/token';

type AccountType = 'personal' | 'business';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [telegram, setTelegram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ access_token: string; user: any }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({
            email, password, name,
            account_type: accountType,
            business_name: businessName || undefined,
            business_type: businessType || undefined,
            telegram: telegram || undefined,
          }),
        },
      );
      setSession(data.access_token, data.user);
      router.push('/');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="card p-7 w-full max-w-sm space-y-4">
        <div className="text-center space-y-1">
          <h1 className="font-display text-3xl text-ink">ENDURO WORLD</h1>
          <p className="text-xs text-muted uppercase tracking-wider">
            {step === 1 ? 'Создать аккаунт' : 'Тип профиля'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-moss-strong' : 'bg-line'}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-moss-strong' : 'bg-line'}`} />
        </div>

        {step === 1 && (
          <>
            <input
              type="text" required minLength={2} maxLength={50}
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Имя или nickname" className="input"
            />
            <input
              type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Email" className="input"
            />
            <input
              type="password" required minLength={6}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Пароль (мин. 6 символов)" className="input"
            />
            <button type="submit" className="btn btn-primary w-full">
              Далее →
            </button>
          </>
        )}

        {step === 2 && (
          <>
            {/* Account type selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType('personal')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  accountType === 'personal'
                    ? 'border-moss-strong bg-moss/10'
                    : 'border-line hover:border-moss/40'
                }`}
              >
                <div className="text-3xl mb-1">🏍</div>
                <div className="font-semibold text-sm">Личный</div>
                <div className="text-[10px] text-muted mt-0.5">Райдер / энтузиаст</div>
              </button>
              <button
                type="button"
                onClick={() => setAccountType('business')}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  accountType === 'business'
                    ? 'border-rust border-opacity-80 bg-rust/10'
                    : 'border-line hover:border-rust/40'
                }`}
              >
                <div className="text-3xl mb-1">🏢</div>
                <div className="font-semibold text-sm">Бизнес</div>
                <div className="text-[10px] text-muted mt-0.5">Туры / прокат / магазин</div>
              </button>
            </div>

            {accountType === 'business' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Название компании *
                  </label>
                  <input
                    required={accountType === 'business'}
                    value={businessName} onChange={e => setBusinessName(e.target.value)}
                    placeholder="Карпаты Эндуро Тур" className="input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Тип бизнеса
                  </label>
                  <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="input">
                    <option value="">Выбери тип</option>
                    <option value="tour_operator">Туроператор</option>
                    <option value="rental">Прокат байков</option>
                    <option value="shop">Мото-магазин</option>
                    <option value="school">Школа вождения</option>
                    <option value="club">Мото-клуб</option>
                    <option value="other">Другое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1">
                    Telegram
                  </label>
                  <input
                    value={telegram} onChange={e => setTelegram(e.target.value)}
                    placeholder="@username" className="input"
                  />
                </div>
              </div>
            )}

            {error && <p className="text-rust-strong text-sm">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button" onClick={() => setStep(1)}
                className="btn btn-ghost flex-1"
              >
                ← Назад
              </button>
              <button
                type="submit" disabled={loading}
                className="btn btn-primary flex-1 disabled:opacity-60"
              >
                {loading ? 'Создаю...' : 'Создать'}
              </button>
            </div>
          </>
        )}

        {step === 1 && (
          <p className="text-center text-sm text-muted">
            Уже есть аккаунт? <Link href="/login" className="text-moss-strong hover:underline">Войти</Link>
          </p>
        )}
      </form>
    </main>
  );
}
