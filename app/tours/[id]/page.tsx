import { notFound } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { getServerToken } from '@/lib/serverToken';
import TourRegisterButton from '@/components/TourRegisterButton';
import TourBookingForm from '@/components/TourBookingForm';

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
    <div className="min-h-screen pb-nav">
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
        {(tour.contact_email || tour.contact_phone || tour.website_url || tour.telegram || tour.whatsapp || tour.instagram) && (
          <div className="py-4 border-b border-line space-y-3">
            <h2 className="font-display text-lg mb-2">Контакты</h2>
            {/* Messenger buttons */}
            {(tour.telegram || tour.whatsapp) && (
              <div className="flex gap-2 flex-wrap">
                {tour.telegram && (
                  <a
                    href={`https://t.me/${tour.telegram.replace('@','')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
                    style={{ background: '#229ED9' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.23 13.4l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.918.159z"/></svg>
                    Telegram
                  </a>
                )}
                {tour.whatsapp && (
                  <a
                    href={`https://wa.me/${tour.whatsapp.replace(/\D/g,'')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white"
                    style={{ background: '#25D366' }}
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                )}
              </div>
            )}
            {/* Text contacts */}
            <div className="space-y-1.5">
              {tour.contact_email && <a href={`mailto:${tour.contact_email}`} className="flex items-center gap-2 text-sm text-moss-strong hover:underline">✉️ {tour.contact_email}</a>}
              {tour.contact_phone && <a href={`tel:${tour.contact_phone}`} className="flex items-center gap-2 text-sm text-moss-strong hover:underline">📞 {tour.contact_phone}</a>}
              {tour.website_url && <a href={tour.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-moss-strong hover:underline">🌐 {tour.website_url}</a>}
              {tour.instagram && <a href={`https://instagram.com/${tour.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-moss-strong hover:underline">📸 {tour.instagram}</a>}
            </div>
          </div>
        )}

        {/* Booking form — доступна всем, авторизация не нужна */}
        <div className="py-2">
          <TourBookingForm
            tourId={tour.id}
            tourTitle={tour.title}
            price={tour.price}
            currency={tour.currency || '₽'}
          />
          {tour.regs_count > 0 && (
            <p className="text-xs text-center mt-2" style={{ color: 'rgb(var(--text-muted))' }}>
              {tour.regs_count} человек уже интересуются
            </p>
          )}
        </div>
      </div>
      
    </div>
  );
}
