import { redirect } from 'next/navigation';
import TourForm from '@/components/TourForm';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function NewTourPage() {
  const token = await getServerToken();
  if (!token) redirect('/login?next=/tours/new');
  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur border-b border-line px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl leading-none">Новый тур</h1>
          <p className="text-[11px] text-muted mt-0.5">Организуй эндуро-путешествие для сообщества</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5">
        <TourForm />
      </main>
      
    </div>
  );
}
