'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EventsNavbar from '@/components/navigation/EventsNavbar';
import { useToast } from '@/components/ui/ToastProvider';
import { AuthApiError, getCurrentUser, type AuthUser } from '@/lib/api/auth';
import { getReminderEvents, saveEventReminder } from '@/lib/api/reminders';
import { getEventCardDesigns, type EventCardDesign } from '@/lib/api/card-design';
import type { CommunityEvent } from '@/lib/api/events';
import { CardStickerOverlay, cardMutedTextClass, cardSurfaceClass } from '@/components/events/PersonalizedCardDesign';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value));
}

function formatPrice(value: string) {
  const rupees = Number(value) / 100;
  if (!Number.isFinite(rupees)) return 'Price unavailable';
  if (rupees === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: rupees % 1 ? 2 : 0 }).format(rupees);
}

export default function WishlistPage() {
  const router = useRouter();
  const toast = useToast();
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [cardDesigns, setCardDesigns] = useState<Record<string, EventCardDesign>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cardDesignError, setCardDesignError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadWishlist() {
      let token = '';
      try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* redirect if storage is unavailable */ }
      if (!token) {
        router.replace('/login');
        return;
      }
      try {
        const user = await getCurrentUser(token, controller.signal);
        if (user.role !== 'member') {
          router.replace('/events');
          return;
        }
        if (active) setAccount(user);
        const savedEvents = await getReminderEvents(token, controller.signal);
        if (!active) return;
        setEvents(savedEvents);
        try {
          const designs = await getEventCardDesigns(savedEvents.map((event) => event.id), token, controller.signal);
          if (active) {
            const byEventId: Record<string, EventCardDesign> = {};
            for (const { eventId, ...design } of designs) byEventId[eventId] = design;
            setCardDesigns(byEventId);
            setCardDesignError('');
          }
        } catch (designError) {
          // Wishlist events remain available if the personalization service is offline.
          if (active && !controller.signal.aborted) {
            setCardDesignError(designError instanceof Error ? designError.message : 'Saved card designs could not be loaded.');
          }
        }
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        if (requestError instanceof AuthApiError && requestError.status === 401) {
          window.localStorage.removeItem('eventnest.accessToken');
          router.replace('/login');
          return;
        }
        setError(requestError instanceof Error ? requestError.message : 'We could not load your wishlist. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadWishlist();
    return () => { active = false; controller.abort(); };
  }, [router]);

  function logout() {
    try { window.localStorage.removeItem('eventnest.accessToken'); } catch { /* clear visible state regardless */ }
    setAccount(null);
    router.replace('/events');
  }

  async function removeFromWishlist(event: CommunityEvent) {
    let token = '';
    try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* handled as a request error */ }
    if (!token || pendingIds.has(event.id)) return;
    setError('');
    setEvents((current) => current.filter((item) => item.id !== event.id));
    setPendingIds((current) => new Set(current).add(event.id));
    try {
      await saveEventReminder(token, event.id, false);
    } catch (requestError) {
      setEvents((current) => [...current, event].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
      toast('error', requestError instanceof Error ? requestError.message : 'We could not remove that event. Please try again.');
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(event.id);
        return next;
      });
    }
  }

  return (
    <div className="min-h-dvh bg-[#fbfaf8] text-[#171717]">
      <EventsNavbar account={account} accountLoading={loading} onLogout={logout} />
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-nest-coral">Your saved plans</p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-nest-ink sm:text-4xl">Wishlist</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#666577]">Events you have saved with Remind me will be kept here.</p>

        {cardDesignError && <div role="status" className="mt-5 rounded-2xl border border-[#1e1d57]/10 bg-white px-4 py-3 text-sm text-[#666577] shadow-sm">Your saved card designs could not be shown. {cardDesignError}</div>}
        {error && <div role="alert" className="mt-6 rounded-2xl border border-nest-coral/20 bg-white px-4 py-3 text-sm text-[#a92622] shadow-sm">{error}</div>}

        {loading ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading wishlist" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />)}
          </div>
        ) : !error && events.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-[#1e1d57]/10 bg-white px-6 py-10 text-center shadow-sm sm:py-14">
            <Image src="/empty-events-calendar.png" alt="An empty calendar with a search icon and paper plane" width={400} height={300} className="mx-auto h-40 w-auto object-contain sm:h-48" />
            <h2 className="mt-4 text-xl font-bold text-nest-ink">Your wishlist is ready for a first pick</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#666577]">Tap Remind me on an event you like, and it will show up here.</p>
            <Link href="/events" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white shadow-md shadow-nest-coral/15 transition hover:bg-[#df0805]">Discover events</Link>
          </section>
        ) : !loading && events.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {events.map((event) => (
              <article key={event.id} className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-[0_8px_32px_rgba(30,29,87,0.055)] ${cardDesigns[event.id] ? cardSurfaceClass(cardDesigns[event.id].theme) : 'border-[#1e1d57]/10 bg-white text-[#171717]'}`}>
                <div className="relative h-48 bg-[#eeedf8]">
                  {/* Event photos are provided by the events API and may be hosted by any event image provider. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={event.imageUrl} alt={event.title} loading="lazy" className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-nest-ink shadow-sm">{event.category}</span>
                  {cardDesigns[event.id] && <CardStickerOverlay stickers={cardDesigns[event.id].stickers} />}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className={`text-xs font-semibold ${cardMutedTextClass(cardDesigns[event.id]?.theme)}`}>{formatDate(event.startsAt)}</p>
                  <h2 className="mt-2 line-clamp-2 text-lg font-bold tracking-[-0.025em]">{event.title}</h2>
                  <p className={`mt-1 text-sm ${cardMutedTextClass(cardDesigns[event.id]?.theme)}`}>{event.city}</p>
                  <p className={`mt-3 line-clamp-2 min-h-10 text-sm leading-5 ${cardMutedTextClass(cardDesigns[event.id]?.theme)}`}>{event.description}</p>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                    <span className={`truncate text-sm font-bold ${cardDesigns[event.id]?.theme === 'sunset' || cardDesigns[event.id]?.theme === 'midnight' ? 'text-white' : 'text-nest-ink'}`}>{formatPrice(event.pricePaise)}</span>
                    <button type="button" onClick={() => void removeFromWishlist(event)} disabled={pendingIds.has(event.id)} className="shrink-0 rounded-xl border border-[#1e1d57]/15 px-3 py-2 text-xs font-bold text-nest-ink transition hover:border-nest-coral hover:text-nest-coral disabled:cursor-wait disabled:opacity-60">
                      {pendingIds.has(event.id) ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
