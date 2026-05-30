'use client';

import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/token';

export default function SignOutButton() {
  const router = useRouter();

  function handleSignOut() {
    clearSession();
    router.push('/');
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="text-xs text-muted hover:text-rust underline">
      Sign out
    </button>
  );
}
