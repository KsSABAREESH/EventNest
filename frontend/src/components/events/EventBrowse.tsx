'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';
import {
  eventCategories,
  getEvents,
  type CommunityEvent,
  type EventCategory,
  type EventsFilters,
  type EventsPage,
} from '@/lib/api/events';

const initialFilters: EventsFilters = { category: '', city: '', q: '', page: 1, pageSize: 9 };

function BrandMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4.5 10.25 12 4l7.5 6.25v8.5a1.25 1.25 0 0 1-1.25 1.25H5.75A1.25 1.25 0 0 1 4.5 18.75v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20v-5.25A1.75 1.75 0 0 1 10.75 13h2.5A1.75 1.75 0 0 1 15 14.75V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m8.25 8.75 1 .1m6.5-.1-1 .1" stroke="#ff0905" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

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

function EventCard({ event }: { event: CommunityEvent }) {
  return (
    <article className="group overflow-hidden rounded-[1.35rem] border border-[#1e1d57]/10 bg-white shadow-[0_8px_32px_rgba(30,29,87,0.055)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(30,29,87,0.12)]">
      <div className="relative h-52 overflow-hidden bg-[#eeedf8]">
        {/* Event images are supplied by the API and may come from arbitrary event hosts. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.imageUrl}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14133d]/55 via-transparent to-black/5" />
        <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-nest-ink shadow-sm backdrop-blur">
          {event.category}
        </span>
        <span className="absolute bottom-4 right-4 rounded-xl bg-white px-3 py-2 text-sm font-bold text-nest-ink shadow-lg">
          {formatPrice(event.pricePaise)}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold tracking-wide text-[#6e6d82]">{formatEventDate(event.startsAt)}</p>
        <h2 className="mt-2 line-clamp-1 text-lg font-bold tracking-[-0.025em] text-[#171717]">{event.title}</h2>
        <div className="mt-2 flex items-center gap-1.5 text-sm text-[#666577]">
          <span className="text-nest-coral"><PinIcon /></span>
          <span>{event.city}</span>
        </div>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-[#656473]">{event.description}</p>
      </div>
    </article>
  );
}

export default function EventBrowse() {
  const [draft, setDraft] = useState({ category: '' as EventCategory | '', city: '', q: '' });
  const [filters, setFilters] = useState(initialFilters);
  const [result, setResult] = useState<EventsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getEvents(filters, controller.signal)
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
  }, [filters, retry]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setFilters({ ...draft, page: 1, pageSize: initialFilters.pageSize });
  }

  function clearFilters() {
    setLoading(true);
    setError('');
    setDraft({ category: '', city: '', q: '' });
    setFilters(initialFilters);
  }

  function changePage(page: number) {
    setLoading(true);
    setError('');
    setFilters((current) => ({ ...current, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function retryLoading() {
    setLoading(true);
    setError('');
    setRetry((value) => value + 1);
  }

  const totalPages = result?.pagination.totalPages ?? 0;
  const hasFilters = Boolean(filters.category || filters.city || filters.q);

  return (
    <div className="min-h-dvh bg-[#fbfaf8] text-[#171717]">
      <header className="sticky top-0 z-20 bg-nest-ink text-white shadow-[0_6px_24px_rgba(30,29,87,0.16)]">
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10" aria-label="Main navigation">
          <Link href="/events" className="flex items-center gap-3 text-base font-bold tracking-tight sm:text-lg">
            <BrandMark />
            <span>EventNest</span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-5">
            <a href="#discover" className="hidden text-sm font-semibold text-white/85 transition hover:text-white sm:inline">Discover</a>
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white sm:px-4">Log in</Link>
            <Link href="/signup" className="rounded-full bg-nest-coral px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-black/10 transition hover:bg-[#df0805] sm:px-5">Join free</Link>
          </div>
        </nav>
      </header>

      <main id="discover" className="mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:px-10">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#f1effb] px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border-[44px] border-white/45" />
          <div className="pointer-events-none absolute -bottom-36 right-[22%] h-72 w-72 rounded-full bg-[#ff0905]/[0.045]" />
          <div className="relative z-10 max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff0905]/15 bg-white/70 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#d91c18]">
              <span className="h-1.5 w-1.5 rounded-full bg-nest-coral" /> Your city, a little closer
            </p>
            <h1 className="max-w-2xl text-[2.5rem] font-bold leading-[1.04] tracking-[-0.055em] text-nest-ink sm:text-5xl lg:text-[3.75rem]">
              Find your next <span className="text-nest-coral">good plan.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-[#5c5b70] sm:text-base sm:leading-7">
              Live music, hands-on workshops, neighborhood food, and more. See what is happening around you.
            </p>
          </div>

          <form onSubmit={applyFilters} className="relative z-10 mt-8 grid gap-3 rounded-2xl border border-white bg-white p-3 shadow-[0_12px_40px_rgba(30,29,87,0.1)] sm:grid-cols-2 sm:p-4 lg:grid-cols-[minmax(220px,1.4fr)_minmax(160px,0.8fr)_minmax(150px,0.8fr)_auto]">
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
            <label className="flex h-12 items-center gap-3 rounded-xl border border-[#1e1d57]/10 px-3.5 transition focus-within:border-nest-coral focus-within:ring-4 focus-within:ring-nest-coral/10">
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
            <label className="flex h-12 items-center rounded-xl border border-[#1e1d57]/10 px-3.5 transition focus-within:border-nest-coral focus-within:ring-4 focus-within:ring-nest-coral/10">
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
            <button type="submit" className="flex h-12 items-center justify-center gap-2 rounded-xl bg-nest-coral px-6 text-sm font-bold text-white shadow-md shadow-nest-coral/15 transition hover:bg-[#df0805] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nest-ink">
              <SearchIcon /> <span>Find events</span>
            </button>
          </form>
        </section>

        <section className="mt-10 sm:mt-12" aria-labelledby="upcoming-title">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-nest-coral">Make it a day to remember</p>
              <h2 id="upcoming-title" className="mt-1.5 text-2xl font-bold tracking-[-0.04em] text-nest-ink sm:text-[1.8rem]">Upcoming near you</h2>
            </div>
            {!loading && !error && result && (
              <p className="text-sm font-medium text-[#767584]" aria-live="polite">
                {result.pagination.totalItems} {result.pagination.totalItems === 1 ? 'event' : 'events'}
                {hasFilters ? ' found' : ' to explore'}
              </p>
            )}
          </div>

          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading events" aria-busy="true">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="overflow-hidden rounded-[1.35rem] border border-[#1e1d57]/8 bg-white">
                  <div className="h-52 animate-pulse bg-[#eeedf4]" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-28 animate-pulse rounded bg-[#eeedf4]" />
                    <div className="h-5 w-3/4 animate-pulse rounded bg-[#eeedf4]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#eeedf4]" />
                    <div className="h-10 animate-pulse rounded bg-[#f6f5f8]" />
                  </div>
                </div>
              ))}
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
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1effb] text-2xl" aria-hidden="true">✦</div>
              <h3 className="mt-4 text-lg font-bold text-nest-ink">No events found just yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#666577]">Try another city or category. There may be something lovely just around the corner.</p>
              {hasFilters && <button onClick={clearFilters} className="mt-5 text-sm font-bold text-nest-coral underline underline-offset-4">Clear filters</button>}
            </div>
          )}

          {!loading && !error && result && result.data.length > 0 && (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {result.data.map((event) => <EventCard key={event.id} event={event} />)}
              </div>
              {totalPages > 1 && (
                <nav className="mt-9 flex items-center justify-center gap-3" aria-label="Event pages">
                  <button
                    onClick={() => changePage(filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="rounded-xl border border-[#1e1d57]/15 bg-white px-4 py-2.5 text-sm font-semibold text-nest-ink transition hover:border-nest-coral disabled:cursor-not-allowed disabled:opacity-40"
                  >Previous</button>
                  <span className="px-2 text-sm font-medium text-[#666577]" aria-live="polite">Page {filters.page} of {totalPages}</span>
                  <button
                    onClick={() => changePage(filters.page + 1)}
                    disabled={filters.page >= totalPages}
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
    </div>
  );
}
