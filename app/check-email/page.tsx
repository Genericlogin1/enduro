import Link from 'next/link';

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 px-4">
      <div className="max-w-sm text-center space-y-4">
        <div className="text-6xl">📬</div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-zinc-400">
          We sent a confirmation link to{' '}
          <span className="text-orange-400">{email || 'your email'}</span>.
          Click it to activate your account.
        </p>
        <p className="text-zinc-500 text-sm">After confirming, you will be signed in automatically.</p>
        <Link href="/login" className="inline-block text-orange-400 hover:underline">Back to sign in</Link>
      </div>
    </main>
  );
}
