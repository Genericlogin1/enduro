import Nav from '@/components/Nav';
import { createClient } from '@/lib/supabase/server';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function ToursPage() {
  const supabase = await createClient();
  const { data: tours } = await supabase
    .from('tours')
    .select('id, title, description, starts_at, ends_at, location, country, profiles:profiles!tours_organizer_id_fkey(username, display_name)')
    .order('starts_at', { ascending: true })
    .limit(50);

  return (
    <div className="min-h-screen pb-24">
      <header className="px-4 py-3 border-b border-line">
        <div className="max-w-xl mx-auto">
          <h1 className="font-display text-2xl leading-none">Tours</h1>
          <p className="text-[11px] text-muted mt-0.5">Upcoming group rides</p>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {!tours || tours.length === 0 ? (
          <div className="card p-8 text-center text-muted text-sm">
            No tours announced yet. Be the first to organize a group ride.
          </div>
        ) : (
          tours.map((t: any) => (
            <article key={t.id} className="card p-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold">{t.title}</h3>
                <span className="chip chip-rust whitespace-nowrap">{format(new Date(t.starts_at), 'MMM d')}</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {t.country && t.country + ' · '}{t.location}
              </div>
              {t.description && <p className="text-sm text-ink/80 mt-2 whitespace-pre-wrap">{t.description}</p>}
              <div className="text-xs text-muted mt-2">
                by {t.profiles?.display_name || t.profiles?.username || 'organizer'}
              </div>
            </article>
          ))
        )}
      </main>
      <Nav active="tours" />
    </div>
  );
}
