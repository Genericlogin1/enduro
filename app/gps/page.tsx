import Nav from '@/components/Nav';
import GpsTracker from '@/components/GpsTracker';

export const dynamic = 'force-dynamic';

export default function GpsPage() {
  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur border-b border-line px-4 py-3">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-2xl leading-none">GPS Track</h1>
          <p className="text-[11px] text-muted mt-0.5">Record your ride</p>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-4">
        <GpsTracker />
      </main>
      <Nav active="gps" />
    </div>
  );
}
