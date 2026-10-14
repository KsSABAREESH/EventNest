'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import EventsNavbar from '@/components/navigation/EventsNavbar';
import Dropdown, { type DropdownOption } from '@/components/ui/Dropdown';
import { useToast } from '@/components/ui/ToastProvider';
import { AuthApiError, getCurrentUser, getFavouriteCategories, type AuthUser, type FavouriteCategory } from '@/lib/api/auth';
import { eventCategories, getEvents, getMyFeed, type CommunityEvent, type EventCategory, type EventsPage } from '@/lib/api/events';
import {
  cardStickers,
  cardThemes,
  getEventCardDesign,
  getEventCardDesigns,
  saveEventCardDesign,
  type CardSticker,
  type CardTheme,
  type EventCardDesign,
} from '@/lib/api/card-design';
import { CardStickerOverlay, cardMutedTextClass, cardSurfaceClass } from '@/components/events/PersonalizedCardDesign';

const stickerDetails: Record<CardSticker, { emoji: string; label: string }> = {
  sparkles: { emoji: '✨', label: 'Sparkles' },
  'music-notes': { emoji: '🎵', label: 'Music notes' },
  confetti: { emoji: '🎊', label: 'Confetti' },
  heart: { emoji: '💛', label: 'Heart' },
  star: { emoji: '⭐', label: 'Star' },
};

const themeDetails: Record<CardTheme, { label: string; description: string; cardClass: string; swatchClass: string }> = {
  paper: {
    label: 'Soft paper',
    description: 'Warm and simple',
    cardClass: 'bg-[#fffaf2] text-[#25234f]',
    swatchClass: 'bg-gradient-to-br from-[#fffaf2] to-[#f1e5d8]',
  },
  sunset: {
    label: 'Sunset glow',
    description: 'A little more color',
    cardClass: 'bg-gradient-to-br from-[#ff7d61] via-[#ef5860] to-[#703a7c] text-white',
    swatchClass: 'bg-gradient-to-br from-[#ff9b69] via-[#fa5c5b] to-[#75427d]',
  },
  midnight: {
    label: 'Midnight',
    description: 'After-dark energy',
    cardClass: 'bg-gradient-to-br from-[#252463] via-[#292157] to-[#11122d] text-white',
    swatchClass: 'bg-gradient-to-br from-[#51448e] to-[#171633]',
  },
};

const defaultDesign: EventCardDesign = { theme: 'paper', stickers: [] };

const categorySymbols: Record<EventCategory, string> = {
  Music: '♫',
  Workshop: '✂',
  Food: '♨',
  Sports: '⚽',
  Kids: '✿',
};

const categoryFilterOptions: DropdownOption<EventCategory | ''>[] = [
  { value: '', label: 'All my interests', description: 'Events from your favourite categories', icon: <span aria-hidden="true" className="text-base">✦</span> },
  ...eventCategories.map((category) => ({
    value: category,
    label: category,
    description: `Browse all upcoming ${category.toLowerCase()} events`,
    icon: <span aria-hidden="true" className="text-sm">{categorySymbols[category]}</span>,
  })),
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value));
}

function CardPreview({ event, design }: { event: CommunityEvent; design: EventCardDesign }) {
  return (
    <div className={`relative isolate flex min-h-72 flex-col overflow-hidden rounded-[1.7rem] p-5 shadow-[0_24px_55px_rgba(30,29,87,0.18)] transition-all duration-500 sm:min-h-[340px] sm:p-7 ${themeDetails[design.theme].cardClass}`}>
      <div className="absolute inset-0 -z-10 opacity-25 transition-opacity duration-500">
        {/* Event imagery gives the designer a realistic preview of the saved card. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.imageUrl} alt="" aria-hidden="true" className="h-full w-full object-cover mix-blend-soft-light" />
      </div>
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur sm:text-xs">{event.category}</span>
        <span className="text-xs font-semibold opacity-80">EVENTNEST · {event.city}</span>
      </div>
      <div className="mt-auto pt-16">
        <div className="mb-4 flex min-h-11 flex-wrap items-center gap-2" aria-label="Card stickers">
          {design.stickers.map((sticker, index) => (
            <span key={`${sticker}-${index}`} className="flex h-11 w-11 animate-[pop-in_240ms_ease-out] items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-sm backdrop-blur transition-transform duration-300 hover:rotate-6 hover:scale-110" aria-label={stickerDetails[sticker].label}>
              {stickerDetails[sticker].emoji}
            </span>
          ))}
          {design.stickers.length === 0 && <span className="text-xs font-medium opacity-75"></span>}
        </div>
        <p className="text-xs font-semibold opacity-80">{formatDate(event.startsAt)}</p>
        <h2 className="mt-2 max-w-lg text-2xl font-extrabold leading-tight tracking-[-0.04em] sm:text-3xl">{event.title}</h2>
        <div className="mt-4 flex items-center justify-between border-t border-current/20 pt-3 text-sm font-semibold">
          <span>{event.city}</span><span>Make it a day to remember</span>
        </div>
      </div>
    </div>
  );
}

export default function PersonalizePage() {
  const router = useRouter();
  const toast = useToast();
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [favouriteCategories, setFavouriteCategories] = useState<FavouriteCategory[]>([]);
  const [favouritesLoaded, setFavouritesLoaded] = useState(false);
  const [eventsPage, setEventsPage] = useState<EventsPage['pagination'] | null>(null);
  const [cardDesigns, setCardDesigns] = useState<Record<string, EventCardDesign>>({});
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);
  const [design, setDesign] = useState<EventCardDesign>(defaultDesign);
  const [savedDesign, setSavedDesign] = useState<EventCardDesign>(defaultDesign);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [designLoading, setDesignLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [designListError, setDesignListError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState<EventCategory | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<EventCategory | ''>('');
  const [page, setPage] = useState(1);
  const [mobileStep, setMobileStep] = useState<'events' | 'designer'>('events');
  const eventCarouselRef = useRef<HTMLDivElement>(null);
  const [canScrollEventsLeft, setCanScrollEventsLeft] = useState(false);
  const [canScrollEventsRight, setCanScrollEventsRight] = useState(false);

  const updateEventCarouselControls = useCallback(() => {
    const carousel = eventCarouselRef.current;
    if (!carousel) return;
    const maxScrollLeft = carousel.scrollWidth - carousel.clientWidth;
    setCanScrollEventsLeft(carousel.scrollLeft > 2);
    setCanScrollEventsRight(maxScrollLeft - carousel.scrollLeft > 2);
  }, []);

  function scrollEventsByCard(direction: -1 | 1) {
    const carousel = eventCarouselRef.current;
    const card = carousel?.querySelector<HTMLElement>('[data-event-card]');
    if (!carousel || !card) return;
    const row = card.parentElement;
    const gap = row ? Number.parseFloat(window.getComputedStyle(row).columnGap) || 0 : 0;
    carousel.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: 'smooth' });
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function loadPage() {
      let token = '';
      try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* redirect below */ }
      if (!token) { router.replace('/login'); return; }
      setLoading(true);
      setError('');
      setFavouritesLoaded(false);
      try {
        const user = await getCurrentUser(token, controller.signal);
        if (user.role !== 'member') { router.replace('/events'); return; }
        const categories = await getFavouriteCategories(token, controller.signal);
        if (!active) return;
        setAccount(user);
        setFavouriteCategories(categories);
        setFavouritesLoaded(true);
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        setEventsLoading(false);
        if (requestError instanceof AuthApiError && requestError.status === 401) {
          window.localStorage.removeItem('eventnest.accessToken');
          router.replace('/login');
          return;
        }
        setError(requestError instanceof Error ? requestError.message : 'We could not load events to personalize.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadPage();
    return () => { active = false; controller.abort(); };
  }, [router, refresh]);

  useEffect(() => {
    if (!account || !favouritesLoaded) return;
    if (favouriteCategories.length === 0 && !activeCategory) {
      setEvents([]);
      setEventsPage(null);
      setEventsLoading(false);
      return;
    }
    const controller = new AbortController();
    let active = true;
    let token = '';
    try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* route to login below */ }
    if (!token) {
      router.replace('/login');
      return () => controller.abort();
    }
    setEventsLoading(true);
    setError('');
    const filters = { category: activeCategory, city: '', q: searchQuery, page, pageSize: 9 };
    const eventRequest = activeCategory
      ? getEvents(filters, controller.signal)
      : getMyFeed(filters, token, controller.signal);
    eventRequest
      .then((result) => {
        if (!active) return;
        setEvents(result.data);
        setEventsPage(result.pagination);
      })
      .catch((requestError) => {
        if (!active || controller.signal.aborted) return;
        setEvents([]);
        setEventsPage(null);
        setError(requestError instanceof Error ? requestError.message : 'We could not load events.');
      })
      .finally(() => { if (active) setEventsLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [account, favouritesLoaded, favouriteCategories, activeCategory, searchQuery, page, refresh, router]);

  useEffect(() => {
    if (events.length === 0 || account?.role !== 'member') {
      setCardDesigns({});
      return;
    }
    const controller = new AbortController();
    let active = true;
    let token = '';
    try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* picker can still show default themes */ }
    if (!token) return () => controller.abort();
    setDesignListError('');
    getEventCardDesigns(events.map((event) => event.id), token, controller.signal)
      .then((designs) => {
        if (!active) return;
        const byEventId: Record<string, EventCardDesign> = {};
        for (const { eventId, ...saved } of designs) byEventId[eventId] = saved;
        setCardDesigns(byEventId);
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted) {
          setDesignListError(requestError instanceof Error ? requestError.message : 'Saved card designs could not be loaded.');
        }
      });
    return () => { active = false; controller.abort(); };
  }, [events, account]);

  useEffect(() => {
    const carousel = eventCarouselRef.current;
    if (!carousel) return;
    updateEventCarouselControls();
    const observer = new ResizeObserver(updateEventCarouselControls);
    observer.observe(carousel);
    if (carousel.firstElementChild) observer.observe(carousel.firstElementChild);
    return () => observer.disconnect();
  }, [events, eventsLoading, updateEventCarouselControls]);

  useEffect(() => {
    if (!selectedEvent) return;
    const controller = new AbortController();
    let active = true;
    async function loadDesign() {
      setDesignLoading(true);
      setError('');
      try {
        const token = window.localStorage.getItem('eventnest.accessToken') ?? '';
        const next = await getEventCardDesign(selectedEvent!.id, token, controller.signal);
        if (active) { setDesign(next); setSavedDesign(next); }
      } catch (requestError) {
        if (active && !controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : 'We could not load this design.');
      } finally {
        if (active) setDesignLoading(false);
      }
    }
    void loadDesign();
    return () => { active = false; controller.abort(); };
  }, [selectedEvent]);

  const isDirty = useMemo(() => JSON.stringify(design) !== JSON.stringify(savedDesign), [design, savedDesign]);
  const logout = useCallback(() => {
    try { window.localStorage.removeItem('eventnest.accessToken'); } catch { /* clear local account state */ }
    setAccount(null);
    router.replace('/events');
  }, [router]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchQuery(searchDraft.trim());
    setActiveCategory(categoryDraft);
    setPage(1);
    setSelectedEvent(null);
    setMobileStep('events');
    setError('');
  }

  function resetSearch() {
    setSearchDraft('');
    setCategoryDraft('');
    setSearchQuery('');
    setActiveCategory('');
    setPage(1);
    setSelectedEvent(null);
    setMobileStep('events');
    setError('');
  }

  function continueToDesigner() {
    if (!selectedEvent) return;
    setMobileStep('designer');
  }

  function backToEvents() {
    setMobileStep('events');
  }

  function toggleSticker(sticker: CardSticker) {
    setError('');
    setDesign((current) => current.stickers.includes(sticker)
      ? { ...current, stickers: current.stickers.filter((item) => item !== sticker) }
      : current.stickers.length < 3 ? { ...current, stickers: [...current.stickers, sticker] } : current);
  }

  async function saveDesign() {
    if (!selectedEvent || !isDirty || saving) return;
    setSaving(true);
    setError('');
    try {
      const token = window.localStorage.getItem('eventnest.accessToken') ?? '';
      if (!token) { router.replace('/login'); return; }
      const saved = await saveEventCardDesign(selectedEvent.id, token, design);
      setDesign(saved);
      setSavedDesign(saved);
      setCardDesigns((current) => ({ ...current, [selectedEvent.id]: saved }));
      toast('success', 'Your card design is saved for this event.');
    } catch (requestError) {
      toast('error', requestError instanceof Error ? requestError.message : 'We could not save your design. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fbfaf8] text-[#171717]">
      <EventsNavbar account={account} accountLoading={loading} onLogout={logout} />
      <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-9 sm:px-8 sm:pt-12 lg:px-10">
        <Link href="/events" className="text-sm font-semibold text-nest-ink transition hover:text-nest-coral">&larr; Home</Link>
        <div className="mt-6 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-nest-coral">Make the moment yours</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-nest-ink sm:text-5xl">Personalize your event card</h1>
          <p className="mt-3 text-sm leading-6 text-[#666577] sm:text-base">Choose an upcoming event, set a mood, and add a few little details.</p>
        </div>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" aria-label="Loading preferences" aria-busy="true">
            {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-56 animate-pulse rounded-2xl bg-white shadow-sm" />)}
          </div>
        ) : error && !favouritesLoaded ? (
          <section role="alert" className="mt-8 rounded-3xl border border-nest-coral/20 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-nest-ink">We couldn’t load your interests</p>
            <p className="mt-2 text-sm text-[#666577]">{error}</p>
            <button type="button" onClick={() => setRefresh((value) => value + 1)} className="mt-5 rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white">Try again</button>
          </section>
        ) : favouritesLoaded ? (
          <div id="personalize-steps" className="relative mt-8 overflow-hidden lg:overflow-visible">
            <div className="relative w-full lg:grid lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-10">
            <section aria-labelledby="event-picker-title" className={`w-full min-w-0 pr-3 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] lg:static lg:w-auto lg:translate-x-0 lg:pr-0 ${mobileStep === 'events' ? 'relative translate-x-0' : 'absolute left-0 top-0 -translate-x-full'}`}>
              <form onSubmit={submitSearch} className="mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-[#1e1d57]/10 bg-white p-3 shadow-sm sm:mb-6 sm:flex sm:items-center sm:gap-3 sm:p-4">
                <label className="sr-only" htmlFor="personalize-search">Search event name or city</label>
                <input id="personalize-search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search event or city" className="col-span-2 min-h-11 w-full rounded-xl border border-[#1e1d57]/15 bg-white px-3 text-sm text-nest-ink outline-none placeholder:text-[#8b8999] focus:border-nest-coral focus:ring-2 focus:ring-nest-coral/10 sm:flex-1" />
                <Dropdown
                  id="personalize-category"
                  label="Filter events by category"
                  value={categoryDraft}
                  options={categoryFilterOptions}
                  onChange={setCategoryDraft}
                  className="col-span-2 sm:w-48"
                />
                <button type="submit" className="min-h-11 w-full rounded-xl bg-nest-coral px-4 text-sm font-bold text-white transition hover:bg-[#df0805] sm:w-auto">Search</button>
                <button type="button" onClick={resetSearch} className="min-h-11 w-full rounded-xl px-3 text-sm font-semibold text-nest-ink hover:bg-[#f5f4fa] sm:w-auto">Reset</button>
              </form>
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#777687]">Step 1</p>
                  <h2 id="event-picker-title" className="mt-1 text-xl font-bold tracking-tight text-nest-ink">Pick an event</h2>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-[#777687]">{eventsPage?.totalItems ?? 0} matching</span>
                  <div className="flex gap-1.5 sm:hidden" aria-label="Scroll through events">
                    <button type="button" aria-label="Show previous event" disabled={!canScrollEventsLeft} onClick={() => scrollEventsByCard(-1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e1d57]/15 bg-white text-nest-ink shadow-sm transition hover:border-nest-coral hover:text-nest-coral disabled:cursor-not-allowed disabled:opacity-35">
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m12.5 4.5-5.5 5.5 5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                    <button type="button" aria-label="Show next event" disabled={!canScrollEventsRight} onClick={() => scrollEventsByCard(1)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e1d57]/15 bg-white text-nest-ink shadow-sm transition hover:border-nest-coral hover:text-nest-coral disabled:cursor-not-allowed disabled:opacity-35">
                      <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m7.5 4.5 5.5 5.5-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  </div>
                </div>
              </div>
              {error && !selectedEvent && <p role="alert" className="mb-4 rounded-xl border border-nest-coral/20 bg-[#fff8f7] px-4 py-3 text-sm text-[#a92622]">{error}</p>}
              {designListError && <p role="status" className="mb-3 rounded-xl border border-[#1e1d57]/10 bg-white px-3 py-2 text-xs text-[#666577]">Existing card styles could not be loaded. {designListError}</p>}
              {eventsLoading ? (
                <div className="-mx-5 snap-x snap-mandatory overflow-x-auto scroll-smooth px-5 pb-3 sm:mx-0 sm:snap-none sm:overflow-visible sm:px-0" aria-label="Loading favourite events" aria-busy="true">
                  <div className="flex w-max gap-3 sm:grid sm:w-auto sm:grid-cols-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-56 w-[calc(50vw_-_1.75rem)] shrink-0 snap-start animate-pulse rounded-2xl bg-white shadow-sm sm:w-auto" />)}
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div className="rounded-2xl border border-[#1e1d57]/10 bg-white p-6 text-center">
                  <p className="font-bold text-nest-ink">{searchQuery || activeCategory ? 'No matching events' : 'No upcoming events in your interests'}</p>
                  <p className="mt-2 text-sm leading-5 text-[#666577]">{searchQuery || activeCategory ? 'Try another name, city, or category.' : 'New events in your favourite categories will show up here.'}</p>
                  {(searchQuery || activeCategory) && <button type="button" onClick={resetSearch} className="mt-4 text-sm font-bold text-nest-coral">Clear filters</button>}
                </div>
              ) : (
              <>
              <div ref={eventCarouselRef} onScroll={updateEventCarouselControls} className="-mx-5 snap-x snap-mandatory overflow-x-auto scroll-smooth px-5 pb-3 sm:mx-0 sm:snap-none sm:overflow-visible sm:px-0" role="region" tabIndex={0} aria-label="Favourite events, scroll horizontally to see more">
              <div className="flex w-max gap-3 sm:grid sm:w-auto sm:grid-cols-3 sm:gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {events.map((event) => {
                  const isSelected = selectedEvent?.id === event.id;
                  const pickerDesign = isSelected && !designLoading ? design : cardDesigns[event.id] ?? defaultDesign;
                  return (
                  <button key={event.id} data-event-card type="button" onClick={() => { setSelectedEvent(event); setDesign(defaultDesign); setSavedDesign(defaultDesign); setDesignLoading(true); setError(''); }} aria-pressed={isSelected} className={`group w-[calc(50vw_-_1.75rem)] min-w-0 shrink-0 snap-start overflow-hidden rounded-2xl border text-left shadow-[0_6px_24px_rgba(30,29,87,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:w-auto sm:shrink ${cardSurfaceClass(pickerDesign.theme)} ${isSelected ? 'border-nest-coral ring-2 ring-nest-coral/15' : ''}`}>
                    <div className="relative h-28 overflow-hidden bg-[#eeedf8] sm:h-32">
                      {/* Event photos are served by the event service. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={event.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-nest-ink shadow-sm">{event.category}</span>
                      <CardStickerOverlay stickers={pickerDesign.stickers} />
                    </div>
                    <span className="block p-3">
                      <span className="block line-clamp-2 min-h-10 text-xs font-bold leading-5 sm:text-sm">{event.title}</span>
                      <span className={`mt-1 block truncate text-[10px] sm:text-xs ${cardMutedTextClass(pickerDesign.theme)}`}>{event.city} · {formatDate(event.startsAt)}</span>
                    </span>
                  </button>
                  );
                })}
              </div>
              </div>
              {eventsPage && eventsPage.totalPages > 1 && <nav aria-label="Event pages" className="mt-5 flex items-center justify-between gap-3">
                <button type="button" disabled={page <= 1 || eventsLoading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-xl border border-[#1e1d57]/15 px-4 py-2 text-sm font-semibold text-nest-ink disabled:opacity-40">Previous</button>
                <span className="text-xs text-[#777687]">Page {eventsPage.page} of {eventsPage.totalPages}</span>
                <button type="button" disabled={page >= eventsPage.totalPages || eventsLoading} onClick={() => setPage((value) => Math.min(eventsPage.totalPages, value + 1))} className="rounded-xl border border-[#1e1d57]/15 px-4 py-2 text-sm font-semibold text-nest-ink disabled:opacity-40">Next</button>
              </nav>}
              <button type="button" onClick={continueToDesigner} disabled={!selectedEvent} className="mt-5 min-h-12 w-full rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white transition hover:bg-[#df0805] disabled:cursor-not-allowed disabled:opacity-45 lg:hidden">{selectedEvent ? 'Next: Design this card' : 'Select an event to continue'}</button>
              </>
              )}
            </section>

            <section aria-labelledby={selectedEvent ? 'designer-title' : undefined} aria-label={!selectedEvent ? 'Event card designer illustration' : undefined} className={`w-full min-w-0 rounded-3xl border border-[#1e1d57]/10 bg-white p-4 shadow-[0_14px_40px_rgba(30,29,87,0.06)] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:p-6 lg:static lg:w-auto lg:translate-x-0 ${mobileStep === 'designer' ? 'relative translate-x-0' : 'absolute left-0 top-0 translate-x-full'}`}>
              <button type="button" onClick={backToEvents} className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-nest-ink hover:bg-[#f5f4fa] lg:hidden"><span aria-hidden="true">&larr;</span> Back</button>
              {selectedEvent && <div className="mb-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#777687]">Step 2</p>
                <h2 id="designer-title" className="mt-1 text-xl font-bold tracking-tight text-nest-ink">Build your card</h2>
              </div>}
              {!selectedEvent ? (
                <div className="flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#faf8fd] px-3 py-5 text-center sm:min-h-[340px] sm:px-6">
                  <Image
                    src="/pastel-event-theme-customizer.png"
                    alt="Illustration of a person choosing colors and decorations for an event card"
                    width={1536}
                    height={1024}
                    priority
                    className="h-56 w-full object-contain sm:h-72"
                  />
                  <p className="mt-2 text-base font-bold text-nest-ink">Make your event card your own</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-[#777687]">Pick an event to choose its theme and add stickers.</p>
                </div>
              ) : designLoading ? (
                <div className="h-72 animate-pulse rounded-[1.7rem] bg-[#f1effb]" aria-label="Loading saved design" aria-busy="true" />
              ) : (
                <>
                  <CardPreview event={selectedEvent} design={design} />
                  {error && <p role="alert" className="mt-4 rounded-xl border border-nest-coral/20 bg-[#fff8f7] px-4 py-3 text-sm text-[#a92622]">{error}</p>}

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-nest-ink">Choose a background</h3>
                      <span className="text-[10px] text-[#777687]">3 themes</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
                      {cardThemes.map((theme) => (
                        <button key={theme} type="button" aria-pressed={design.theme === theme} onClick={() => setDesign((current) => ({ ...current, theme }))} className={`min-w-0 rounded-xl border p-2 text-left transition ${design.theme === theme ? 'border-nest-coral bg-[#fff7f5] ring-2 ring-nest-coral/10' : 'border-[#1e1d57]/10 hover:border-[#1e1d57]/30'}`}>
                          <span className={`block h-12 rounded-lg ${themeDetails[theme].swatchClass}`} />
                          <span className="mt-2 block truncate text-[10px] font-bold text-nest-ink sm:text-xs">{themeDetails[theme].label}</span>
                          <span className="mt-0.5 block truncate text-[9px] text-[#777687] sm:text-[10px]">{themeDetails[theme].description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-bold text-nest-ink">Add stickers</h3>
                      <span className="text-[10px] text-[#777687]">{design.stickers.length} of 3 selected</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cardStickers.map((sticker) => {
                        const selected = design.stickers.includes(sticker);
                        const full = design.stickers.length >= 3 && !selected;
                        return (
                          <button key={sticker} type="button" aria-pressed={selected} aria-label={`${selected ? 'Remove' : 'Add'} ${stickerDetails[sticker].label}`} title={stickerDetails[sticker].label} disabled={full} onClick={() => toggleSticker(sticker)} className={`flex h-12 min-w-12 items-center justify-center rounded-xl border px-3 text-2xl transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 ${selected ? 'border-nest-coral bg-[#fff1ef] shadow-sm' : 'border-[#1e1d57]/10 bg-white hover:border-nest-coral/50'}`}>
                            {stickerDetails[sticker].emoji}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[10px] text-[#777687]">Tap a selected sticker again to remove it. Add up to three.</p>
                  </div>

                  <button type="button" onClick={() => void saveDesign()} disabled={!isDirty || saving} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white shadow-md shadow-nest-coral/15 transition hover:bg-[#df0805] disabled:cursor-not-allowed disabled:opacity-50">
                    {saving ? 'Saving your card…' : isDirty ? 'Save design' : 'Design saved'}
                  </button>
                </>
              )}
            </section>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
