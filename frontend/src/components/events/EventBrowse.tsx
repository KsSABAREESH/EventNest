'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { AuthApiError, favouriteCategories, getCurrentUser, getFavouriteCategories, saveFavouriteCategories, saveProfile, type AuthUser, type FavouriteCategory } from '@/lib/api/auth';
import { getReminderEventIds, saveEventReminder } from '@/lib/api/reminders';
import EventsNavbar from '@/components/navigation/EventsNavbar';
import {
  eventCategories,
  getEvents,
  getMyFeed,
  type CommunityEvent,
  type EventCategory,
  type EventsFilters,
  type EventsPage,
} from '@/lib/api/events';

const initialFilters: EventsFilters = { category: '', city: '', q: '', page: 1, pageSize: 9 };

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function formatEventDate(value: string) {
  const parts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('weekday')}, ${part('day')} ${part('month')}, ${part('hour')}:${part('minute')} ${part('dayPeriod').toUpperCase()}`;
}

function formatPrice(pricePaise: string) {
  const rupees = Number(pricePaise) / 100;
  if (!Number.isFinite(rupees)) return 'Price unavailable';
  if (rupees === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

function EventCard({
  event,
  reminded,
  pending,
  onToggleReminder,
  className = '',
}: {
  event: CommunityEvent;
  reminded: boolean;
  pending: boolean;
  onToggleReminder: (eventId: string) => void;
  className?: string;
}) {
  return (
    <article className={`group flex flex-col overflow-hidden rounded-xl border border-[#1e1d57]/10 bg-white shadow-[0_8px_32px_rgba(30,29,87,0.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(30,29,87,0.12)] sm:rounded-[1.35rem] ${className}`}>
      <div className="relative h-[clamp(10rem,48vw,16rem)] overflow-hidden bg-[#eeedf8] sm:h-52">
        {/* Event images are supplied by the API and may come from arbitrary event hosts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14133d]/55 via-transparent to-black/5" />
        <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-1 text-[10px] font-bold text-nest-ink shadow-sm backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:py-1.5 sm:text-xs">
          {event.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <p className="text-[10px] font-semibold tracking-wide text-[#6e6d82] sm:text-xs">{formatEventDate(event.startsAt)}</p>
        <h2 className="mt-1.5 line-clamp-2 min-h-10 text-sm font-bold leading-5 tracking-[-0.025em] text-[#171717] sm:mt-2 sm:line-clamp-1 sm:min-h-0 sm:text-lg sm:leading-normal">{event.title}</h2>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#666577] sm:mt-2 sm:text-sm">
          <span className="text-nest-coral"><PinIcon /></span>
          <span className="truncate">{event.city}</span>
        </div>
        <p className="mt-2 line-clamp-3 min-h-[54px] text-[11px] leading-[18px] text-[#656473] sm:mt-3 sm:line-clamp-2 sm:min-h-10 sm:text-sm sm:leading-5">{event.description}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3 sm:pt-4">
          <span className="min-w-0 truncate text-xs font-bold text-nest-ink sm:text-sm">{formatPrice(event.pricePaise)}</span>
          <button
            type="button"
            onClick={() => onToggleReminder(event.id)}
            disabled={pending}
            aria-pressed={reminded}
            className={`shrink-0 rounded-lg border px-2 py-2 text-[10px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nest-ink disabled:cursor-wait disabled:opacity-65 sm:rounded-xl sm:px-3 sm:text-xs ${reminded ? 'border-[#1e1d57]/15 bg-[#f1effb] text-nest-ink hover:border-nest-coral/50' : 'border-nest-coral bg-nest-coral text-white shadow-sm shadow-nest-coral/15 hover:bg-[#df0805]'}`}
          >
            {pending ? 'Saving…' : reminded ? '✓ Reminded' : 'Remind me'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function EventBrowse({ myFeedRequested = false }: { myFeedRequested?: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState({ category: '' as EventCategory | '', city: '', q: '' });
  const [filters, setFilters] = useState(initialFilters);
  const [pageByView, setPageByView] = useState({ discover: 1, myFeed: 1 });
  const [result, setResult] = useState<EventsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [accountChecked, setAccountChecked] = useState(false);
  const [profilePromptOpen, setProfilePromptOpen] = useState(false);
  const [profileStep, setProfileStep] = useState<'username' | 'categories'>('username');
  const [profileUsername, setProfileUsername] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<FavouriteCategory[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [remindedEventIds, setRemindedEventIds] = useState<Set<string>>(() => new Set());
  const [pendingReminderIds, setPendingReminderIds] = useState<Set<string>>(() => new Set());
  const [reminderMessage, setReminderMessage] = useState('');
  const viewKey = myFeedRequested ? 'myFeed' : 'discover';
  const activeFilters = { ...filters, page: pageByView[viewKey] };

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadAccount() {
      let token = '';
      try {
        token = window.localStorage.getItem('eventnest.accessToken') ?? '';
      } catch {
        // Continue as a visitor if local storage is blocked.
      }

      if (!token) {
        if (active) setAccountChecked(true);
        return;
      }

      try {
        const user = await getCurrentUser(token, controller.signal);
        if (!active) return;
        setAccount(user);
        if (user.role === 'member') {
          try {
            const ids = await getReminderEventIds(token, controller.signal);
            if (active) setRemindedEventIds(new Set(ids));
          } catch (reminderError) {
            if (active && !controller.signal.aborted) {
              setReminderMessage(reminderError instanceof Error ? reminderError.message : 'We could not load your saved reminders.');
            }
          }
        }
        if (!user.profileComplete) {
          setProfileUsername(user.username ?? '');
          setProfileStep('username');
          setProfilePromptOpen(true);
        } else if (user.role === 'member') {
          const categories = await getFavouriteCategories(token, controller.signal);
          if (!active) return;
          setSelectedCategories(categories);
          if (categories.length === 0) {
            setProfileStep('categories');
            setProfilePromptOpen(true);
          }
        }
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        if (requestError instanceof AuthApiError && requestError.status === 401) {
          window.localStorage.removeItem('eventnest.accessToken');
        }
      } finally {
        if (active) setAccountChecked(true);
      }
    }

    void loadAccount();
    return () => {
      active = false;
      controller.abort();
    };
  }, [router]);

  useEffect(() => {
    if (!accountChecked) return;
    const controller = new AbortController();
    let token = '';
    try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* visitor view */ }
    const myFeed = myFeedRequested && account?.role === 'member' && Boolean(token);
    if (myFeedRequested && !myFeed) router.replace('/events');
    const request = myFeed
      ? getMyFeed(activeFilters, token, controller.signal)
      : getEvents(activeFilters, controller.signal);
    request
      .then((response) => setResult(response))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'We could not load events. Please try again.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [filters, pageByView[viewKey], retry, myFeedRequested, accountChecked, account, router]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setPageByView((current) => ({ ...current, [viewKey]: 1 }));
    setFilters({ ...draft, page: 1, pageSize: initialFilters.pageSize });
  }

  function changePage(page: number) {
    setLoading(true);
    setError('');
    setPageByView((current) => ({ ...current, [viewKey]: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function retryLoading() {
    setLoading(true);
    setError('');
    setRetry((value) => value + 1);
  }

  function logOut() {
    try {
      window.localStorage.removeItem('eventnest.accessToken');
    } catch {
      // Clear the visible signed-in state even if storage is unavailable.
    }
    setAccount(null);
    setRemindedEventIds(new Set());
    router.replace('/events');
  }

  async function saveUsername(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const token = window.localStorage.getItem('eventnest.accessToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      const user = await saveProfile(token, { username: profileUsername.trim() });
      setAccount(user);
      setProfileStep('categories');
      setSelectedCategories([]);
    } catch (requestError) {
      setProfileError(requestError instanceof Error ? requestError.message : 'We could not save your name. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  }

  function toggleFavourite(category: FavouriteCategory) {
    setSelectedCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  }

  async function saveCategories(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileError('');
    setProfileSaving(true);
    try {
      const token = window.localStorage.getItem('eventnest.accessToken');
      if (!token) { router.replace('/login'); return; }
      const saved = await saveFavouriteCategories(token, selectedCategories);
      setSelectedCategories(saved);
      setProfilePromptOpen(false);
      router.replace('/events?my_feed=true');
      setLoading(true);
      setError('');
      setRetry((value) => value + 1);
    } catch (requestError) {
      setProfileError(requestError instanceof Error ? requestError.message : 'We could not save your categories. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function toggleReminder(eventId: string) {
    let token = '';
    try { token = window.localStorage.getItem('eventnest.accessToken') ?? ''; } catch { /* show sign-in message */ }
    if (!token || account?.role !== 'member') {
      setReminderMessage('Log in with a member account to save event reminders.');
      return;
    }
    if (pendingReminderIds.has(eventId)) return;

    const wasReminded = remindedEventIds.has(eventId);
    setReminderMessage('');
    setRemindedEventIds((current) => {
      const next = new Set(current);
      if (wasReminded) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
    setPendingReminderIds((current) => new Set(current).add(eventId));
    try {
      await saveEventReminder(token, eventId, !wasReminded);
    } catch (requestError) {
      setRemindedEventIds((current) => {
        const next = new Set(current);
        if (wasReminded) next.add(eventId);
        else next.delete(eventId);
        return next;
      });
      setReminderMessage(requestError instanceof Error ? requestError.message : 'We could not save your reminder. Please try again.');
    } finally {
      setPendingReminderIds((current) => {
        const next = new Set(current);
        next.delete(eventId);
        return next;
      });
    }
  }

  const totalPages = result?.pagination.totalPages ?? 0;
  const hasFilters = Boolean(filters.category || filters.city || filters.q);
  const isMyFeed = myFeedRequested && Boolean(account);

  return (
    <div className="min-h-dvh w-full min-w-0 overflow-x-clip bg-[#fbfaf8] text-[#171717]">
      <EventsNavbar account={account} accountLoading={!accountChecked} onLogout={logOut} />

      <main id="discover" className="mx-auto w-full min-w-0 max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-10">
        {reminderMessage && (
          <div role="alert" className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-nest-coral/20 bg-white px-4 py-3 text-sm text-[#a92622] shadow-sm">
            <span>{reminderMessage}</span>
            <button type="button" onClick={() => setReminderMessage('')} aria-label="Dismiss message" className="shrink-0 rounded-lg px-2 py-1 font-bold text-[#a92622] hover:bg-nest-coral/10">×</button>
          </div>
        )}
        <section className="relative w-full min-w-0 overflow-hidden rounded-[2rem] bg-[#f1effb] px-5 py-8 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border-[44px] border-white/45" />
          <div className="pointer-events-none absolute -bottom-36 right-[22%] h-72 w-72 rounded-full bg-[#ff0905]/[0.045]" />
          <div className="relative z-10 w-full min-w-0 max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff0905]/15 bg-white/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#d91c18]">
              <span className="h-1.5 w-1.5 rounded-full bg-nest-coral" /> Your city, a little closer
            </p>
            <h1 className="max-w-2xl break-words text-[clamp(2rem,9vw,2.5rem)] font-bold leading-[1.04] tracking-[-0.055em] text-nest-ink sm:text-5xl lg:text-[3.75rem]">
              Find your next <span className="text-nest-coral">good plan.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#5c5b70] sm:text-base sm:leading-7">
              Live music, hands-on workshops, neighborhood food, and more. See what is happening around you.
            </p>
          </div>

          <form onSubmit={applyFilters} className="relative z-10 mt-8 grid w-full min-w-0 gap-3 rounded-2xl border border-white bg-white p-3 shadow-[0_12px_40px_rgba(30,29,87,0.1)] sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(220px,1.4fr)_minmax(160px,0.8fr)_minmax(150px,0.8fr)_auto]">
            <label className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-[#1e1d57]/10 px-3.5 transition focus-within:border-nest-coral focus-within:ring-4 focus-within:ring-nest-coral/10">
              <span className="text-[#737286]"><SearchIcon /></span>
              <span className="sr-only">Search events</span>
              <input
                value={draft.q}
                onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
                maxLength={120}
                placeholder="Search events"
                className="w-full min-w-0 border-0 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9594a2]"
              />
            </label>
            <label className="flex h-12 min-w-0 items-center gap-3 rounded-xl border border-[#1e1d57]/10 px-3.5 transition focus-within:border-nest-coral focus-within:ring-4 focus-within:ring-nest-coral/10">
              <span className="text-nest-coral"><PinIcon /></span>
              <span className="sr-only">City</span>
              <input
                value={draft.city}
                onChange={(event) => setDraft((current) => ({ ...current, city: event.target.value }))}
                maxLength={100}
                placeholder="City"
                className="w-full min-w-0 border-0 bg-transparent text-sm text-[#171717] outline-none placeholder:text-[#9594a2]"
              />
            </label>
            <label className="flex h-12 min-w-0 items-center rounded-xl border border-[#1e1d57]/10 px-3.5 transition focus-within:border-nest-coral focus-within:ring-4 focus-within:ring-nest-coral/10">
              <span className="sr-only">Category</span>
              <select
                value={draft.category}
                onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value as EventCategory | '' }))}
                className="w-full appearance-none border-0 bg-transparent text-sm text-[#565568] outline-none"
              >
                <option value="">All categories</option>
                {eventCategories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <span aria-hidden="true" className="ml-2 text-xs text-[#858493]">⌄</span>
            </label>
            <button type="submit" className="flex h-12 min-w-0 items-center justify-center gap-2 rounded-xl bg-nest-coral px-6 text-sm font-bold text-white shadow-md shadow-nest-coral/15 transition hover:bg-[#df0805] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nest-ink">
              <SearchIcon /> <span>Find events</span>
            </button>
          </form>
        </section>

        <section className="mt-10 sm:mt-12" aria-labelledby="upcoming-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-nest-coral">Make it a day to remember</p>
              <h2 id="upcoming-title" className="mt-1.5 text-2xl font-bold tracking-[-0.04em] text-nest-ink sm:text-[1.8rem]">{isMyFeed ? 'Your upcoming picks' : 'Upcoming near you'}</h2>
            </div>
            {!loading && !error && result && (
              <p className="text-sm font-medium text-[#767584]" aria-live="polite">
                {result.pagination.totalItems} {result.pagination.totalItems === 1 ? 'event' : 'events'}
                {hasFilters ? ' found' : ' to explore'}
              </p>
            )}
          </div>

          {loading && (
            <div className="-mx-5 snap-x snap-mandatory overflow-x-auto scroll-smooth px-0 pb-3 sm:mx-0 sm:snap-none sm:overflow-visible" role="region" tabIndex={0} aria-label="Upcoming events, scroll horizontally to see more">
              <div className="flex w-max gap-3 px-5 sm:grid sm:w-auto sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-3" aria-busy="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="w-[calc(50vw_-_1.75rem)] shrink-0 snap-start overflow-hidden rounded-xl border border-[#1e1d57]/8 bg-white sm:w-auto sm:rounded-[1.35rem]">
                  <div className="h-[clamp(10rem,48vw,16rem)] animate-pulse bg-[#eeedf4] sm:h-52" />
                  <div className="space-y-3 p-3 sm:p-5">
                    <div className="h-3 w-28 animate-pulse rounded bg-[#eeedf4]" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#eeedf4]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#eeedf4]" />
                    <div className="h-10 animate-pulse rounded bg-[#f6f5f8]" />
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-[#ff0905]/20 bg-white px-6 py-12 text-center shadow-sm sm:px-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff0905]/[0.08] text-2xl" aria-hidden="true">☁</div>
              <h3 className="mt-4 text-lg font-bold text-nest-ink">Events are taking a little break</h3>
              <p role="alert" className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#666577]">{error}</p>
              <button onClick={retryLoading} className="mt-5 rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white transition hover:bg-[#df0805]">Try again</button>
            </div>
          )}

          {!loading && !error && result?.data.length === 0 && (
            <div className="rounded-3xl border border-[#1e1d57]/10 bg-white px-6 py-14 text-center shadow-sm sm:px-10">
              <Image src="/empty-events-calendar.png" alt="An empty calendar with a search icon and paper plane" width={400} height={300} className="mx-auto h-40 w-auto object-contain sm:h-48" />
              <h3 className="mt-4 text-lg font-bold text-nest-ink">No events found just yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#666577]">{isMyFeed ? 'There are no upcoming events in your favourite categories yet. Discover all events to find something new.' : 'Try another city or category. There may be something lovely just around the corner.'}</p>
              {isMyFeed && (
                <Link
                  href="/events"
                  onClick={() => {
                    setDraft({ category: '', city: '', q: '' });
                    setFilters(initialFilters);
                    setPageByView((current) => ({ ...current, discover: 1 }));
                  }}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white shadow-md shadow-nest-coral/15 transition hover:bg-[#df0805]"
                >
                  Explore other categories
                </Link>
              )}
            </div>
          )}

          {!loading && !error && result && result.data.length > 0 && (
            <>
              <div className="-mx-5 snap-x snap-mandatory overflow-x-auto scroll-smooth px-0 pb-3 sm:mx-0 sm:snap-none sm:overflow-visible" role="region" tabIndex={0} aria-label="Upcoming events, scroll horizontally to see more">
                <div className="flex w-max gap-3 px-5 sm:grid sm:w-auto sm:grid-cols-2 sm:gap-5 sm:px-0 lg:grid-cols-3">
                {result.data.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    reminded={remindedEventIds.has(event.id)}
                    pending={pendingReminderIds.has(event.id)}
                    onToggleReminder={toggleReminder}
                    className="w-[calc(50vw_-_1.75rem)] shrink-0 snap-start sm:w-auto"
                  />
                ))}
                </div>
              </div>
              {totalPages > 1 && (
                <nav className="mt-9 flex items-center justify-center gap-3" aria-label="Event pages">
                  <button
                    onClick={() => changePage(activeFilters.page - 1)}
                    disabled={activeFilters.page <= 1}
                    className="rounded-xl border border-[#1e1d57]/15 bg-white px-4 py-2.5 text-sm font-semibold text-nest-ink transition hover:border-nest-coral disabled:cursor-not-allowed disabled:opacity-40"
                  >Previous</button>
                  <span className="px-2 text-sm font-medium text-[#666577]" aria-live="polite">Page {activeFilters.page} of {totalPages}</span>
                  <button
                    onClick={() => changePage(activeFilters.page + 1)}
                    disabled={activeFilters.page >= totalPages}
                    className="rounded-xl border border-[#1e1d57]/15 bg-white px-4 py-2.5 text-sm font-semibold text-nest-ink transition hover:border-nest-coral disabled:cursor-not-allowed disabled:opacity-40"
                  >Next</button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="border-t border-[#1e1d57]/8 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs text-[#777687] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <span className="font-semibold text-nest-ink">EventNest <span className="font-normal text-[#92919d]">· Good things happen nearby</span></span>
          <span>Find a little more community in your city.</span>
        </div>
      </footer>

      {profilePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#171638]/45 px-4 py-6 backdrop-blur-[3px]">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-prompt-title"
            aria-describedby="profile-prompt-description"
            className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-[0_28px_90px_rgba(18,17,55,0.3)] sm:p-8"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1effb] text-xl text-nest-ink" aria-hidden="true">✦</span>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-nest-coral">{profileStep === 'username' ? 'Step 1 of 2 · A little introduction' : 'Step 2 of 2 · Personalize your feed'}</p>
            <h2 id="profile-prompt-title" className="mt-1.5 text-2xl font-bold tracking-[-0.04em] text-nest-ink">{profileStep === 'username' ? 'How should we call you?' : 'What do you love?'}</h2>
            <p id="profile-prompt-description" className="mt-2 text-sm leading-6 text-[#696879]">{profileStep === 'username' ? 'Choose the name we’ll show in your EventNest account.' : 'Choose your favourite event categories. Your feed will show upcoming events from these picks.'}</p>
            {profileStep === 'username' ? (
              <form onSubmit={saveUsername} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="eventnest-username" className="mb-2 block text-sm font-semibold text-[#29283f]">Your name</label>
                  <input
                    id="eventnest-username" name="username" autoComplete="nickname" required minLength={2} maxLength={40}
                    value={profileUsername} onChange={(event) => setProfileUsername(event.target.value)} placeholder="e.g. Saba"
                    className="h-12 w-full rounded-xl border border-[#1e1d57]/15 px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#9998a5] focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
                  />
                </div>
                {profileError && <p role="alert" className="rounded-xl border border-nest-coral/25 bg-nest-coral/5 px-3.5 py-3 text-sm leading-5 text-[#b91c1c]">{profileError}</p>}
                <button type="submit" disabled={profileSaving || profileUsername.trim().length < 2} className="flex h-12 w-full items-center justify-center rounded-xl bg-nest-coral px-5 text-sm font-bold text-white shadow-lg shadow-nest-coral/15 transition hover:bg-[#df0805] disabled:cursor-wait disabled:opacity-65">
                  {profileSaving ? 'Saving…' : 'Next'}
                </button>
              </form>
            ) : (
              <form onSubmit={saveCategories} className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-2.5">
                  {favouriteCategories.map((category) => {
                    const selected = selectedCategories.includes(category);
                    return <button key={category} type="button" aria-pressed={selected} onClick={() => toggleFavourite(category)} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${selected ? 'border-nest-coral bg-nest-coral/[0.07] text-[#c71d19]' : 'border-[#1e1d57]/15 bg-white text-[#555466] hover:border-nest-coral/50'}`}>
                      <span aria-hidden="true" className="mr-2">{selected ? '✓' : '+'}</span>{category}
                    </button>;
                  })}
                </div>
                {profileError && <p role="alert" className="rounded-xl border border-nest-coral/25 bg-nest-coral/5 px-3.5 py-3 text-sm leading-5 text-[#b91c1c]">{profileError}</p>}
                <button type="submit" disabled={profileSaving || selectedCategories.length === 0} className="flex h-12 w-full items-center justify-center rounded-xl bg-nest-coral px-5 text-sm font-bold text-white shadow-lg shadow-nest-coral/15 transition hover:bg-[#df0805] disabled:cursor-wait disabled:opacity-65">
                  {profileSaving ? 'Saving…' : 'Save and continue'}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
