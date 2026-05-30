import Nav from '@/components/Nav';

export const dynamic = 'force-dynamic';

export default function ToursPage() {
  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 py-3 border-b border-line">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-2xl leading-none">Events</h1>
          <p className="text-[11px] text-muted mt-0.5">Upcoming group rides & competitions</p>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        <div className="card p-8 text-center text-muted text-sm">
          <div className="text-4xl mb-3">🏁</div>
          <div className="font-semibold text-ink mb-1">Events coming soon</div>
          Post your rides, races, and group adventures. This section is being built out — check back soon.
        </div>
      </main>
      <Nav active="tours" />
    </div>
  );
}
