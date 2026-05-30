'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => {
  const paths: Record<string, JSX.Element> = {
    feed: <path d="M4 5h12M4 10h12M4 15h8" strokeWidth="1.8" strokeLinecap="round" />,
    map: <path d="M3 5l5-2 5 2 5-2v14l-5 2-5-2-5 2V5zm5 0v14m5-12v14" strokeWidth="1.6" strokeLinejoin="round" />,
    new: <path d="M10 4v12M4 10h12" strokeWidth="2" strokeLinecap="round" />,
    tours: <><path d="M10 2l2 5h5l-4 3 1.5 5L10 13l-4.5 2L7 10 3 7h5z" strokeWidth="1.5" strokeLinejoin="round" /></>,
    search: <><circle cx="8.5" cy="8.5" r="5" strokeWidth="1.7" /><path d="M14 14l3 3" strokeWidth="1.7" strokeLinecap="round" /></>,
    me: <path d="M10 10a3 3 0 100-6 3 3 0 000 6zm-6 7a6 6 0 0112 0" strokeWidth="1.6" strokeLinecap="round" />,
  };
  return <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className}>{paths[name]}</svg>;
};

const tabs = [
  { key: 'feed', label: 'Feed', href: '/' },
  { key: 'map', label: 'Map', href: '/map' },
  { key: 'new', label: 'New', href: '/new' },
  { key: 'tours', label: 'Туры', href: '/tours' },
  { key: 'search', label: 'Поиск', href: '/search' },
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
        <div className="grid grid-cols-6">
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
