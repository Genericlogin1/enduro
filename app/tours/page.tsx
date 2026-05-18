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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <header className="px-4 py-3 border-b border-zinc-900">
        <h1 className="text-lg font-bold">Tours</h1>
        <p className="text-xs text-zinc-500">Upcoming group rides</p>
      </header>
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        {!tours || tours.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-5xl mb-2">🏍️</div>
            <p>No tours announced yet.</p>
          </div>
        ) : (
          tours.map((t: any) => (
            <article key={t.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold">{t.title}</h3>
                <span className="text-xs text-orange-400 whitespace-nowrap">{format(new Date(t.starts_at), 'MMM d')}</span>
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {t.country && t.country + ' · '}{t.location}
              </div>
              {t.description && <p className="text-sm text-zinc-300 mt-2">{t.description}</p>}
              <div className="text-xs text-zinc-600 mt-2">
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
