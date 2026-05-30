'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => {
  const paths: Record<string, JSX.Element> = {
    feed: <path d="M4 5h12M4 10h12M4 15h8" strokeWidth="1.8" strokeLinecap="round" />,
    map: <path d="M3 5l5-2 5 2 5-2v14l-5 2-5-2-5 2V5zm5 0v14m5-12v14" strokeWidth="1.6" strokeLinejoin="round" />,
    new: <path d="M10 4v12M4 10h12" strokeWidth="2" strokeLinecap="round" />,
    gps: <><circle cx="10" cy="10" r="3" strokeWidth="1.6" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2" strokeWidth="1.6" strokeLinecap="round" /><path d="M5 5l1.5 1.5M13.5 13.5L15 15M15 5l-1.5 1.5M6.5 13.5L5 15" strokeWidth="1.4" strokeLinecap="round" /></>,
    me: <path d="M10 10a3 3 0 100-6 3 3 0 000 6zm-6 7a6 6 0 0112 0" strokeWidth="1.6" strokeLinecap="round" />,
  };
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className}>{paths[name]}</svg>;
};

const tabs = [
  { key: 'feed', label: 'Feed', href: '/' },
  { key: 'map', label: 'Map', href: '/map' },
  { key: 'new', label: 'New', href: '/new' },
  { key: 'gps', label: 'GPS', href: '/gps' },
  { key: 'me', label: 'Me', href: '/me' },
];

export default function Nav({ active }: { active?: string }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-base/95 backdrop-blur border-t border-line z-20">
      <div className="max-w-xl mx-auto relative">
        <div className="absolute right-3 -top-10">
          <ThemeToggle />
        </div>
        <div className="grid grid-cols-5">
        {tabs.map(t => {
          const isActive = active === t.key || pathname === t.href || (t.href !== '/' && pathname.startsWith(t.href));
          const isNew = t.key === 'new';
          return (
            <Link
              key={t.key}
              href={t.href}
              className={'flex flex-col items-center py-2.5 text-[11px] font-medium transition ' + (isActive ? 'text-moss-strong' : 'text-muted hover:text-ink')}
            >
              <span className={isNew ? 'inline-flex items-center justify-center w-10 h-10 rounded-full bg-rust text-white -mt-4 shadow-lg ring-4 ring-base' : 'inline-flex items-center justify-center w-6 h-6'}>
                <Icon name={t.key} className="w-5 h-5" />
              </span>
              <span className={isNew ? 'mt-0.5' : 'mt-1'}>{t.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
