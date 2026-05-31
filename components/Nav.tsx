'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => {
  const paths: Record<string, JSX.Element> = {
    feed: <path d="M3 5h14M3 10h14M3 15h9" strokeWidth="1.8" strokeLinecap="round" />,
    map: <path d="M3 5l5-2 5 2 5-2v14l-5 2-5-2-5 2V5zm5 0v14m5-12v14" strokeWidth="1.6" strokeLinejoin="round" />,
    new: <path d="M10 3v14M3 10h14" strokeWidth="2.2" strokeLinecap="round" />,
    gps: <><circle cx="10" cy="10" r="2.8" strokeWidth="1.8" /><path d="M10 2v2M10 16v2M2 10h2M16 10h2" strokeWidth="1.6" strokeLinecap="round" /></>,
    tours: <path d="M10 2.5l2.2 5h5.3l-4.3 3.1 1.7 5.2L10 13.2l-4.9 2.6 1.7-5.2L2.5 7.5h5.3z" strokeWidth="1.5" strokeLinejoin="round" />,
    rides: <><path d="M3 13c0-2.5 1.5-4.5 4-5.5M17 13c0-2.5-1.5-4.5-4-5.5" strokeWidth="1.7" strokeLinecap="round" /><circle cx="10" cy="14" r="2" strokeWidth="1.7" /><path d="M8 8V5.5M12 8V5.5" strokeWidth="1.7" strokeLinecap="round" /></>,
    me: <path d="M10 10a3 3 0 100-6 3 3 0 000 6zm-6 7a6 6 0 0112 0" strokeWidth="1.7" strokeLinecap="round" />,
  };
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" className={className}>
      {paths[name]}
    </svg>
  );
};

const tabs = [
  { key: 'feed',  label: 'Feed',  href: '/' },
  { key: 'map',   label: 'Map',   href: '/map' },
  { key: 'new',   label: '',      href: '/new' },
  { key: 'gps',   label: 'GPS',   href: '/gps' },
  { key: 'rides', label: 'Поехали', href: '/rides' },
  { key: 'me',    label: 'Me',    href: '/me' },
];

export default function Nav({ active }: { active?: string }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-20" style={{ background: 'rgb(var(--bg-base) / 0.94)', backdropFilter: 'blur(20px) saturate(160%)', borderTop: '1px solid rgb(var(--border) / 0.45)' }}>
      <div className="max-w-xl mx-auto relative">
        {/* Theme toggle */}
        <div className="absolute right-3 -top-10">
          <ThemeToggle />
        </div>

        <div className="grid grid-cols-6 px-1">
          {tabs.map(t => {
            const isActive = active === t.key
              || pathname === t.href
              || (t.href !== '/' && pathname.startsWith(t.href));
            const isNew = t.key === 'new';

            if (isNew) {
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  className="flex flex-col items-center justify-center py-2"
                >
                  <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl -mt-5 shadow-lg transition-transform active:scale-90"
                    style={{
                      background: 'rgb(var(--rust))',
                      boxShadow: '0 4px 16px -2px rgb(var(--rust) / 0.5), 0 0 0 3px rgb(var(--bg-base))',
                    }}>
                    <Icon name="new" className="w-5 h-5 text-white" />
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={t.key}
                href={t.href}
                className="flex flex-col items-center py-2.5 gap-1 transition-all relative"
              >
                {/* Active indicator pill */}
                {isActive && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 rounded-b-full"
                    style={{
                      width: 20,
                      height: 2.5,
                      background: 'rgb(var(--accent))',
                      boxShadow: '0 2px 8px rgb(var(--accent) / 0.6)',
                    }}
                  />
                )}
                <span
                  className="inline-flex items-center justify-center w-6 h-6 transition-all"
                  style={{ color: isActive ? 'rgb(var(--accent))' : 'rgb(var(--text-muted))' }}
                >
                  <Icon name={t.key} className="w-5 h-5" />
                </span>
                <span
                  className="text-[10px] font-semibold tracking-wide transition-all"
                  style={{
                    color: isActive ? 'rgb(var(--accent-strong))' : 'rgb(var(--text-muted))',
                    letterSpacing: isActive ? '.06em' : '.03em',
                  }}
                >
                  {t.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
