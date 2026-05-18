'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { key: 'feed', label: 'Feed', icon: '📢', href: '/' },
  { key: 'map', label: 'Map', icon: '🗺️', href: '/map' },
  { key: 'new', label: 'New', icon: '➕', href: '/new' },
  { key: 'tours', label: 'Tours', icon: '🏍️', href: '/tours' },
  { key: 'me', label: 'Me', icon: '👤', href: '/me' },
];

export default function Nav({ active }: { active?: string }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-950/95 backdrop-blur border-t border-zinc-900 z-20">
      <div className="max-w-xl mx-auto grid grid-cols-5">
        {tabs.map(t => {
          const isActive = active === t.key || pathname === t.href || (t.href !== '/' && pathname.startsWith(t.href));
          return (
            <Link
              key={t.key}
              href={t.href}
              className={'flex flex-col items-center py-2 text-xs transition ' + (isActive ? 'text-orange-400' : 'text-zinc-500 hover:text-zinc-300')}
            >
              <span className="text-xl leading-none">{t.icon}</span>
              <span className="mt-1">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
