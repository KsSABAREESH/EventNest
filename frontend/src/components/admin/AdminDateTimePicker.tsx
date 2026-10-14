'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function monthStart(date: Date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function monthTitle(date: Date) { return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(date); }
function dateKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function displayDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Choose date & time';
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(date);
}

export default function AdminDateTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const [positioned, setPositioned] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [hour, setHour] = useState(6);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const [visibleMonth, setVisibleMonth] = useState(() => monthStart(new Date()));

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function positionPanel() {
      const anchor = rootRef.current?.getBoundingClientRect();
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const gap = 6;
      const margin = 12;
      const panelHeight = Math.min(panel.offsetHeight, window.innerHeight - margin * 2);
      const below = window.innerHeight - anchor.bottom - gap;
      const top = below >= Math.min(panelHeight, 360) || anchor.top < panelHeight + gap
        ? anchor.bottom + gap
        : Math.max(margin, anchor.top - panelHeight - gap);
      const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - panel.offsetWidth - margin));
      setPanelPosition({ top, left });
      setPositioned(true);
    }
    positionPanel();
    window.addEventListener('resize', positionPanel);
    window.addEventListener('scroll', positionPanel, true);
    return () => {
      window.removeEventListener('resize', positionPanel);
      window.removeEventListener('scroll', positionPanel, true);
    };
  }, [open]);

  function openPicker() {
    setPositioned(false);
    const current = value ? new Date(value) : new Date();
    const validCurrent = Number.isNaN(current.getTime()) ? new Date() : current;
    const hour24 = validCurrent.getHours();
    setSelectedDate(dateKey(validCurrent));
    setVisibleMonth(monthStart(validCurrent));
    setHour(hour24 % 12 || 12);
    setMinute(validCurrent.getMinutes());
    setPeriod(hour24 >= 12 ? 'PM' : 'AM');
    setOpen(true);
  }

  function saveSelection() {
    const hour24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    onChange(`${selectedDate}T${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    setOpen(false);
  }

  const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
  const dayCount = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const today = dateKey(new Date());

  return (
    <div ref={rootRef} className="relative mt-1.5">
      <div className={`flex min-h-12 w-full items-center gap-3 rounded-xl border bg-white px-3.5 text-left ${open ? 'border-[#ff0905]' : 'border-[#1e1d57]/15'}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f4f2fb] text-[#1e1d57]"><CalendarIcon /></span>
        <span className="min-w-0 flex-1"><span className="block text-[9px] font-bold uppercase tracking-[.12em] text-[#92919e]">Event date & time</span><span className={`mt-0.5 block truncate text-sm font-semibold ${value ? 'text-[#25243a]' : 'text-[#92919e]'}`}>{displayDateTime(value)}</span></span>
        <button type="button" onClick={open ? () => setOpen(false) : openPicker} aria-label={open ? 'Close date and time dropdown' : 'Open date and time dropdown'} aria-haspopup="dialog" aria-expanded={open} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#777687] hover:bg-[#f4f2fb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff0905]"><ChevronIcon open={open}/></button>
      </div>

      {open && createPortal(
        <div ref={panelRef} role="dialog" aria-label="Choose event date and time" style={{ top: panelPosition.top, left: panelPosition.left, visibility: positioned ? 'visible' : 'hidden' }} className="fixed z-[81] max-h-[min(80vh,32rem)] w-[min(35rem,calc(100vw-1.5rem))] overflow-y-auto rounded-xl border border-[#1e1d57]/15 bg-white p-3.5 shadow-[0_8px_24px_rgba(30,29,87,.14)]">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(7rem,.8fr)] gap-4">
            <section className="min-w-0">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#ff0905]">Choose a date</p><h3 className="mt-1 text-sm font-bold text-[#1e1d57]">{monthTitle(visibleMonth)}</h3></div><div className="flex gap-1.5"><button type="button" aria-label="Previous month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1d57]/10 text-lg text-[#1e1d57] hover:bg-[#f4f2fb]">&lt;</button><button type="button" aria-label="Next month" onClick={() => setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1e1d57]/10 text-lg text-[#1e1d57] hover:bg-[#f4f2fb]">&gt;</button></div></div>
              <div className="mt-4 grid grid-cols-7 gap-1">{weekdays.map((day) => <span key={day} className="py-1 text-center text-[9px] font-bold uppercase text-[#a09fac]">{day}</span>)}{Array.from({ length: firstWeekday }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: dayCount }, (_, index) => {
                const dayDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1);
                const key = dateKey(dayDate); const isSelected = key === selectedDate; const isToday = key === today;
                return <button key={key} type="button" onClick={() => setSelectedDate(key)} aria-pressed={isSelected} className={`relative flex h-9 items-center justify-center rounded-lg text-xs font-semibold ${isSelected ? 'bg-[#1e1d57] text-white shadow-sm' : isToday ? 'bg-[#fff0ef] text-[#ff0905] ring-1 ring-[#ff0905]/20' : 'text-[#454458] hover:bg-[#f4f2fb]'}`}>{index + 1}{isToday && !isSelected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#ff0905]"/>}</button>;
              })}</div>
            </section>
            <section className="border-l border-[#1e1d57]/[.08] pl-3"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#ff0905]">Start time</p><p className="mt-1 text-[10px] leading-4 text-[#898897]">Set the local event time</p><span className="mt-3 inline-block rounded-lg bg-[#f4f2fb] px-2 py-1.5 text-xs font-bold text-[#1e1d57]">{String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')} {period}</span>
              <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-1"><TimeStepper label="Hour" value={hour} min={1} max={12} onChange={setHour}/><span className="pb-2 text-sm font-bold text-[#aaa9b4]">:</span><TimeStepper label="Minute" value={minute} min={0} max={59} onChange={setMinute}/></div>
              <div className="mt-2 flex gap-1"><PeriodButton value="AM" selected={period === 'AM'} onClick={() => setPeriod('AM')}/><PeriodButton value="PM" selected={period === 'PM'} onClick={() => setPeriod('PM')}/></div>
            </section>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#1e1d57]/[.08] pt-3"><p className="text-[10px] text-[#898897]">{selectedDate ? new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${selectedDate}T12:00:00`)) : 'Select a date'}</p><button type="button" onClick={saveSelection} disabled={!selectedDate} className="h-9 rounded-lg bg-[#ff0905] px-4 text-xs font-bold text-white hover:bg-[#e80703] disabled:cursor-not-allowed disabled:opacity-50">Apply date & time</button></div>
        </div>,        document.body,
      )}
    </div>
  );
}

function TimeStepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  return <div className="min-w-0"><span className="mb-1 block text-center text-[9px] font-semibold text-[#898897]">{label}</span><div className="flex h-10 items-center justify-between rounded-lg border border-[#1e1d57]/10 bg-[#fafafd] px-1"><button type="button" aria-label={`Decrease ${label.toLowerCase()}`} onClick={() => onChange(value <= min ? max : value - 1)} className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-[#555468] hover:bg-white">−</button><span aria-live="polite" className="text-sm font-bold tabular-nums text-[#1e1d57]">{String(value).padStart(2, '0')}</span><button type="button" aria-label={`Increase ${label.toLowerCase()}`} onClick={() => onChange(value >= max ? min : value + 1)} className="flex h-7 w-7 items-center justify-center rounded-md text-lg text-[#555468] hover:bg-white">+</button></div></div>;
}

function PeriodButton({ value, selected, onClick }: { value: 'AM' | 'PM'; selected: boolean; onClick: () => void }) { return <button type="button" onClick={onClick} aria-pressed={selected} className={`h-[19px] rounded px-1.5 text-[9px] font-bold ${selected ? 'bg-[#1e1d57] text-white' : 'bg-[#f4f2fb] text-[#777687] hover:bg-[#e9e7f7]'}`}>{value}</button>; }
function CalendarIcon() { return <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="3" stroke="currentColor" strokeWidth="1.7"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>; }
function ChevronIcon({ open }: { open: boolean }) { return <svg viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-[#777687] ${open ? 'rotate-180' : ''}`} aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
