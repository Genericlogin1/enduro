import { redirect } from 'next/navigation';
import ReportForm from '@/components/ReportForm';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';

export const dynamic = 'force-dynamic';

export default async function NewReportPage() {
  const token = await getServerToken();
  if (!token) redirect('/login?next=/reports/new');

  const [sessionsData, bikesData] = await Promise.all([
    apiFetch<{ sessions: any[] }>('/tracking/sessions?limit=50', {}, token).catch(() => ({ sessions: [] })),
    apiFetch<{ bikes: any[] }>('/garage/', {}, token).catch(() => ({ bikes: [] })),
  ]);

  return (
    <div className="min-h-screen pb-nav">
      <header className="sticky top-0 z-10 bg-base/95 backdrop-blur border-b border-line px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-2xl leading-none">Новый отчёт</h1>
          <p className="text-[11px] text-muted mt-0.5">Поделись поездкой с сообществом</p>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5">
        <ReportForm
          sessions={sessionsData?.sessions ?? []}
          bikes={bikesData?.bikes ?? []}
        />
      </main>
      
    </div>
  );
}
