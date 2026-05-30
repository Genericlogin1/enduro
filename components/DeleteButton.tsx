'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { getToken } from '@/lib/token';

export default function DeleteButton({
  path,
  label = 'Удалить',
  confirm = 'Удалить? Это действие нельзя отменить.',
  className = '',
  onDeleted,
}: {
  path: string;
  label?: string;
  confirm?: string;
  className?: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(confirm)) return;
    setPending(true);
    try {
      await apiFetch(path, { method: 'DELETE' }, getToken());
      if (onDeleted) onDeleted();
      else router.refresh();
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления');
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className={'text-xs text-muted hover:text-rust-strong transition-colors disabled:opacity-40 ' + className}
    >
      {pending ? '...' : label}
    </button>
  );
}
