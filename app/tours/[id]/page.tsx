import { notFound } from 'next/navigation';
import Link from 'next/link';
import Nav from '@/components/Nav';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import TourRegisterButton from '@/components/TourRegisterButton';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const tour = await apiFetch<any>(`/tours/${params.id}`).catch(() => null);
  if (!tour) return { title: 'Тур не найден' };
  return {
    title: `${tour.title} | Enduro World`,
    description: tour.description?.slice(0, 160) || `Эндуро тур: ${tour.title}`,
    openGraph: { images: tour.cover_url ? [tour.cover_url] : [] },
  };
}

export default async function TourPage({ params }: { params: { id: string } }) {
  const token = await getServerToken();
  const tour = await apiFetch<any>(`/tours/${params.id}`, {}, token).catch(() => null);
  if (!tour) notFound();

  const organizer = tour.business_name || tour.organizer_name || 'Организатор';
  const initials = organizer.slice(0, 2).toUpperCase();
  const isFull = tour.spots_left === 0;

  return (
    <div className="min-h-screen pb-24">
      {/* Cover */}
      {tour.cover_url && (
        <div className="relative h-64 bg-black">
          <img src={tour.cover_url} alt="" className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="font-display text-3xl text-white leading-tight">{tour.title}</h1>
          </div>
          {tour.is_verified && (
            <div className="absolute top-4 right-4 bg-moss/90 text-white text-xs font-bold px-3 py-1 rounded-full">✓ Верифицированный организатор</div>
          )}
        </div>
      )}

      <div className="max-w-xl mx-auto px-4">
        {!tour.cover_url && (
          <div className="pt-6 pb-2">
            <h1 className="font-display text-3xl">{tour.title}</h1>
            {tour.is_verified && <span className="text-xs text-moss-strong font-bold">✓ Верифицированный организатор</span>}
          </div>
        )}

        {/* Organizer */}
        <div className="flex items-center gap-3 py-4 border-b border-line">
          <Link href={`/riders/${tour.organizer_id}`}>
            <div className="w-10 h-10 rounded-full bg-moss/20 text-moss-strong flex items-center justify-center font-bold">{initials}</div>
          </Link>
          <div>
            <Link href={`/riders/${tour.organizer_id}`} className="font-semibold text-sm hover:text-moss-strong">
              {organizer}
            </Link>
            {tour.is_verified && <div className="text-[10px] text-moss-strong font-bold">✓ Верифицировано</div>}
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-3 py-4 border-b border-line">
          {tour.start_date && (
            <div className="card p-3 text-center">
              <div className="text-xs text-muted mb-1">Начало</div>
              <div className="font-semibold text-sm">{new Date(tour.start_date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          )}
          {tour.end_date && (
            <div className="card p-3 text-center">
              <div className="text-xs text-muted mb-1">Конец</div>
              <div className="font-semibold text-sm">{new Date(tour.end_date).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
          )}
          {tour.price_usd != null && (
            <div className="card p-3 text-center">
              <div className="text-xs text-muted mb-1">Цена</div>
              <div className="font-semibold text-sm text-moss-strong">${tour.price_usd}</div>
            </div>
          )}
          {tour.spots_left != null && (
            <div className={`card p-3 text-center ${isFull ? 'border-rust/50' : ''}`}>
              <div className="text-xs text-muted mb-1">Мест</div>
              <div className={`font-semibold text-sm ${isFull ? 'text-rust-strong' : ''}`}>
                {isFull ? 'Мест нет' : `${tour.spots_left} из ${tour.spots_total}`}
              </div>
            </div>
          )}
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2 py-3 border-b border-line">
          {tour.region && <span className="chip">📍 {tour.region}</span>}
          {tour.country && <span className="chip">🌍 {tour.country}</span>}
          {tour.difficulty && <span className="chip">{tour.difficulty}</span>}
          {tour.regs_count > 0 && <span className="chip">👥 {tour.regs_count} записались</span>}
        </div>

        {/* Description */}
        {tour.description && (
          <div className="py-4 border-b border-line">
            <h2 className="font-display text-lg mb-2">О туре</h2>
            <p className="text-sm text-ink/90 leading-relaxed whitespace-pre-wrap">{tour.description}</p>
          </div>
        )}

        {/* Contact */}
        {(tour.contact_email || tour.contact_phone || tour.website_url) && (
          <div className="py-4 border-b border-line space-y-2">
            <h2 className="font-display text-lg mb-2">Контакты</h2>
            {tour.contact_email && <a href={`mailto:${tour.contact_email}`} className="flex items-center gap-2 text-sm text-moss-strong hover:underline">✉️ {tour.contact_email}</a>}
            {tour.contact_phone && <a href={`tel:${tour.contact_phone}`} className="flex items-center gap-2 text-sm text-moss-strong hover:underline">📞 {tour.contact_phone}</a>}
            {tour.website_url && <a href={tour.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-moss-strong hover:underline">🌐 {tour.website_url}</a>}
          </div>
        )}

        {/* Register button */}
        <div className="py-5">
          {token ? (
            <TourRegisterButton
              tourId={tour.id}
              initialRegistered={tour.registered_by_me}
              isFull={isFull}
            />
          ) : (
            <Link href={`/login?next=/tours/${tour.id}`} className="btn btn-primary w-full py-3 text-base">
              Войди чтобы записаться
            </Link>
          )}
          <p className="text-xs text-muted text-center mt-2">
            {tour.regs_count > 0 ? `${tour.regs_count} человек уже записались` : 'Будь первым!'}
          </p>
        </div>
      </div>
      <Nav />
    </div>
  );
}
