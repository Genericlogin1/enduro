'use client';

type Props = {
  year: number;
  thisYearRides: number;
  totalRoutes: number;
  totalPosts: number;
  topRegions: string[];
  userName: string;
};

export default function SeasonCard({ year, thisYearRides, totalRoutes, totalPosts, topRegions, userName }: Props) {
  const isEmpty = thisYearRides === 0 && totalRoutes === 0 && totalPosts === 0;
  if (isEmpty) return null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden select-none"
      style={{
        background: '#08090A',
        border: '1px solid rgba(190,255,46,0.2)',
        boxShadow: '0 0 40px -10px rgba(190,255,46,0.15), 0 0 0 1px rgba(190,255,46,0.06)',
      }}
    >
      {/* Grain texture */}
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Glow blobs */}
      <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(190,255,46,0.12) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-12 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,94,28,0.08) 0%, transparent 70%)' }} />

      {/* Watermark year */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <span
          className="font-display leading-none whitespace-nowrap"
          style={{
            fontSize: 'clamp(80px, 22vw, 140px)',
            color: 'rgba(190,255,46,0.04)',
            letterSpacing: '0.05em',
            userSelect: 'none',
          }}
        >
          {year}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 px-5 pt-5 pb-0">

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5" style={{ color: 'rgba(190,255,46,0.6)' }}>
              Сезон
            </div>
            <div className="font-display text-5xl leading-none" style={{ color: '#BEFF2E', letterSpacing: '0.04em' }}>
              {year}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-sm tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
              ENDURO<span style={{ color: 'rgba(190,255,46,0.4)' }}>.</span>WORLD
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {userName}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-0 mb-5">
          {[
            { value: thisYearRides, label: thisYearRides === 1 ? 'поездка' : thisYearRides < 5 ? 'поездки' : 'поездок', icon: '📡' },
            { value: totalRoutes,   label: totalRoutes === 1 ? 'маршрут' : totalRoutes < 5 ? 'маршрута' : 'маршрутов', icon: '🗺️' },
            { value: totalPosts,    label: totalPosts === 1 ? 'пост' : totalPosts < 5 ? 'поста' : 'постов', icon: '📸' },
          ].map((s, i) => (
            <div key={i} className={`text-center ${i > 0 ? 'border-l' : ''}`}
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="font-display leading-none mb-1"
                style={{ fontSize: s.value >= 100 ? '3rem' : '3.75rem', color: '#BEFF2E', textShadow: '0 0 30px rgba(190,255,46,0.4)' }}>
                {s.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Regions */}
        {topRegions.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {topRegions.map(r => (
              <span key={r}
                className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(190,255,46,0.08)',
                  color: 'rgba(190,255,46,0.75)',
                  border: '1px solid rgba(190,255,46,0.15)',
                }}>
                📍 {r}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mountains SVG */}
      <div className="w-full" style={{ marginBottom: '-2px' }}>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="w-full" style={{ height: '48px', display: 'block' }}>
          {/* Back range */}
          <polygon
            points="0,60 30,30 60,45 100,18 140,38 180,22 220,40 260,15 300,35 340,20 380,32 400,25 400,60"
            fill="rgba(190,255,46,0.04)"
          />
          {/* Front range */}
          <polygon
            points="0,60 20,48 50,38 80,50 110,32 150,48 180,38 210,52 240,36 280,50 310,40 350,52 380,42 400,48 400,60"
            fill="rgba(190,255,46,0.07)"
          />
          {/* Foreground */}
          <polygon
            points="0,60 40,55 80,58 120,52 160,57 200,54 240,58 280,53 320,57 360,55 400,58 400,60"
            fill="rgba(190,255,46,0.04)"
          />
        </svg>
      </div>
    </div>
  );
}
