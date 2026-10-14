'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminEvent, AdminEventPage } from './admin-types';
import { formatPrice } from './admin-types';

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function addMonths(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date);
}

function eventTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function AdminCalendar() {
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const todayKey = useMemo(() => dateKey(new Date()), []);
  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, AdminEvent[]>();
    for (const event of events) {
      const key = dateKey(new Date(event.startsAt));
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }
    return grouped;
  }, [events]);

  useEffect(() => {
    const controller = new AbortController();
    async function loadEvents() {
      setLoading(true); setError('');
      try {
        const firstResponse = await fetch('/api/admin/events?status=all&page=1&pageSize=50', { cache: 'no-store', signal: controller.signal });
        const firstPage = await firstResponse.json() as AdminEventPage & { message?: string };
        if (!firstResponse.ok) throw new Error(firstPage.message ?? 'Could not load calendar events.');
        const remainingPages = Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) => index + 2);
        const otherPages = await Promise.all(remainingPages.map(async (page) => {
          const response = await fetch(`/api/admin/events?status=all&page=${page}&pageSize=50`, { cache: 'no-store', signal: controller.signal });
          const result = await response.json() as AdminEventPage & { message?: string };
          if (!response.ok) throw new Error(result.message ?? 'Could not load calendar events.');
          return result.data;
        }));
        setEvents([...firstPage.data, ...otherPages.flat()]);
      } catch (reason) {
        if (!(reason instanceof Error && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'Could not load calendar events.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadEvents();
    return () => controller.abort();
  }, []);

  return (
    <section className="relative mt-8 rounded-2xl border border-[#1e1d57]/[.08] bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e1d57]/[.08] px-4 py-4 sm:px-5">
        <div><h2 className="font-bold text-[#1e1d57]">Event calendar</h2><p className="mt-1 text-xs text-[#898897]">See what’s happening across your community.</p></div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, -1))} aria-label="Show previous month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e1d57]/15 text-lg text-[#1e1d57] transition hover:bg-[#f4f3fa]">‹</button>
          <span className="min-w-28 text-center text-xs font-semibold text-[#555468] sm:min-w-32">{monthLabel(visibleMonth)}<span className="hidden lg:inline"> – {monthLabel(addMonths(visibleMonth, 1))}</span></span>
          <button type="button" onClick={() => setVisibleMonth((month) => addMonths(month, 1))} aria-label="Show next month" className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1e1d57]/15 text-lg text-[#1e1d57] transition hover:bg-[#f4f3fa]">›</button>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#1e1d57]/[.06] px-4 py-3 sm:px-5">
        <span className="flex items-center gap-2 text-[11px] text-[#777687]"><i className="h-2 w-2 rounded-full bg-[#ff0905]"/>Today</span>
        <span className="flex items-center gap-2 text-[11px] text-[#777687]"><i className="h-2 w-2 rounded-full bg-[#32a267]"/>Active event</span>
        <span className="flex items-center gap-2 text-[11px] text-[#777687]"><i className="h-2 w-2 rounded-full bg-[#aaa9b4]"/>Inactive event</span>
      </div>
      {error ? <div role="alert" className="p-8 text-center"><p className="text-sm font-semibold text-[#1e1d57]">Calendar unavailable</p><p className="mt-1 text-xs text-[#898897]">{error}</p></div> : loading ? <div className="grid gap-5 p-4 lg:grid-cols-2 lg:p-5"><MonthSkeleton/><div className="hidden lg:block"><MonthSkeleton/></div></div> : <div className="grid gap-5 p-3 sm:p-5 lg:grid-cols-2">{[visibleMonth, addMonths(visibleMonth, 1)].map((month, index) => <MonthGrid key={`${month.getFullYear()}-${month.getMonth()}`} month={month} todayKey={todayKey} eventsByDate={eventsByDate} hideOnSmall={index === 1}/>)}</div>}
      {!loading && !error && events.length === 0 && <p className="border-t border-[#1e1d57]/[.06] px-4 py-3 text-center text-xs text-[#898897]">No events yet. Add an event and it will appear on the calendar.</p>}
    </section>
  );
}

function MonthGrid({ month, todayKey, eventsByDate, hideOnSmall }: { month: Date; todayKey: string; eventsByDate: Map<string, AdminEvent[]>; hideOnSmall: boolean }) {
  const firstDayOffset = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const dates: Array<Date | null> = [...Array.from({ length: firstDayOffset }, () => null), ...Array.from({ length: daysInMonth }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index + 1))];

  return <div className={hideOnSmall ? 'hidden lg:block' : ''}>
    <h3 className="mb-3 text-center text-sm font-bold text-[#1e1d57] lg:hidden">{monthLabel(month)}</h3>
    <div className="grid grid-cols-7 border-l border-t border-[#e9e8f0]">
      {weekdayNames.map((day) => <div key={day} className="border-b border-r border-[#e9e8f0] bg-[#fafafd] py-2 text-center text-[9px] font-bold uppercase tracking-wide text-[#92919e] sm:text-[10px]">{day}</div>)}
      {dates.map((date, index) => {
        if (!date) return <div key={`empty-${index}`} aria-hidden="true" className="min-h-[76px] border-b border-r border-[#e9e8f0] bg-[#fcfcfe] sm:min-h-[92px]"/>;
        const key = dateKey(date); const dateEvents = eventsByDate.get(key) ?? []; const isToday = key === todayKey;
        const tooltipId = `calendar-events-${key}`;
        const tooltipAlignment = date.getDay() > 2 ? 'right-0' : 'left-0';
        return <div key={key} tabIndex={dateEvents.length ? 0 : undefined} aria-label={`${date.toLocaleDateString('en-IN')}${dateEvents.length ? `, ${dateEvents.length} events` : ''}`} aria-describedby={dateEvents.length ? tooltipId : undefined} className={`group relative min-w-0 border-b border-r border-[#e9e8f0] p-1 sm:min-h-[92px] sm:p-1.5 ${isToday ? 'bg-[#fff8f7]' : 'bg-white'} ${dateEvents.length ? 'focus:z-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff0905] hover:z-30 focus-within:z-30' : ''}`}>
          <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold sm:mb-1 sm:h-6 sm:w-6 sm:text-[11px] ${isToday ? 'bg-[#ff0905] font-extrabold text-white' : 'text-[#626174]'}`}>{date.getDate()}</span>
          {dateEvents.slice(0, 2).map((event, eventIndex) => <div key={event.id} className="relative mt-0.5 overflow-hidden rounded-md bg-[#f1effb]">
            <img src={event.imageUrl} alt={event.title} className={`h-6 w-full object-cover sm:h-7 ${event.isActive ? '' : 'grayscale opacity-60'}`} />
            <span className={`absolute bottom-0.5 left-0.5 h-1.5 w-1.5 rounded-full ring-1 ring-white ${event.isActive ? 'bg-[#32a267]' : 'bg-[#aaa9b4]'}`} />
            {eventIndex === 1 && dateEvents.length > 2 && <span className="absolute bottom-0.5 right-0.5 rounded bg-black/60 px-1 text-[8px] font-bold text-white">+{dateEvents.length - 2}</span>}
          </div>)}
          {dateEvents.length > 0 && <div id={tooltipId} role="tooltip" className={`invisible absolute ${tooltipAlignment} top-full z-50 mt-2 w-56 max-w-[calc(100vw-3rem)] rounded-xl border border-white/10 bg-[#1e1d57] p-3 text-white opacity-0 shadow-[0_14px_34px_rgba(24,23,67,.28)] transition duration-150 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100`}>
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[.14em] text-white/55">{date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
            <div className="space-y-2.5">{dateEvents.map((event) => <div key={event.id} className="border-t border-white/10 pt-2 first:border-0 first:pt-0"><p className="line-clamp-2 text-[11px] font-bold leading-4">{event.title}</p><div className="mt-1 flex items-center justify-between gap-2 text-[10px]"><span className="text-white/65">{eventTime(event.startsAt)}</span><span className="shrink-0 font-semibold text-white">{formatPrice(event.pricePaise)}</span></div></div>)}</div>
          </div>}
        </div>;
      })}
    </div>
  </div>;
}

function MonthSkeleton() {
  return <div className="animate-pulse"><div className="mx-auto mb-3 h-4 w-28 rounded bg-[#f1effb]"/><div className="grid grid-cols-7 gap-px bg-[#e9e8f0]">{Array.from({ length: 35 }, (_, index) => <div key={index} className="h-[76px] bg-[#fafafd] sm:h-[92px]"/>)}</div></div>;
}
