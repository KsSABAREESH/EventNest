'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ReactNode } from 'react';
import type { AdminCategory, AdminEvent, AdminEventPage } from './admin-types';
import { categories, formatDate, formatPrice } from './admin-types';
import Dropdown, { type DropdownOption } from '@/components/ui/Dropdown';
import AdminDateTimePicker from './AdminDateTimePicker';
import { useToast } from '@/components/ui/ToastProvider';

type Status = 'all' | 'active' | 'inactive';
const statusOptions: DropdownOption<Status>[] = [
  { value: 'all', label: 'All events', description: 'Show every event', icon: <StatusDot tone="navy" /> },
  { value: 'active', label: 'Active', description: 'Visible to visitors', icon: <StatusDot tone="green" /> },
  { value: 'inactive', label: 'Inactive', description: 'Hidden from visitors', icon: <StatusDot tone="gray" /> },
];
type FormState = { title: string; category: AdminCategory; city: string; startsAt: string; price: string; description: string; imageUrl: string };
const blankForm: FormState = { title: '', category: 'Music', city: '', startsAt: '', price: '', description: '', imageUrl: '' };
function localDateInput(value: string) { const date = new Date(value); return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); }
function toPaise(value: string) { const [whole, fraction = ''] = value.trim().split('.'); return (BigInt(whole || '0') * BigInt(100) + BigInt((fraction + '00').slice(0, 2))).toString(); }

export default function AdminEvents() {
  const toast = useToast();
  const [status, setStatus] = useState<Status>('all'); const [query, setQuery] = useState(''); const [page, setPage] = useState(1);
  const [result, setResult] = useState<AdminEventPage | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [editing, setEditing] = useState<AdminEvent | null | false>(false); const [form, setForm] = useState<FormState>(blankForm); const [saving, setSaving] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ status, page: String(page), pageSize: '10' }); if (query.trim()) params.set('q', query.trim());
      const response = await fetch(`/api/admin/events?${params}`, { cache: 'no-store', signal }); const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? 'Could not load events.');
      setResult(body as AdminEventPage);
    } catch (reason) { if (!(reason instanceof Error && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'Could not load events.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [page, query, status]);

  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(() => void load(controller.signal), query ? 250 : 0); return () => { window.clearTimeout(timer); controller.abort(); }; }, [load, query]);
  function startCreate() { setEditing(null); setForm(blankForm); setError(''); }
  function startEdit(event: AdminEvent) { setEditing(event); setForm({ title: event.title, category: event.category, city: event.city, startsAt: localDateInput(event.startsAt), price: (Number(BigInt(event.pricePaise)) / 100).toFixed(2), description: event.description, imageUrl: event.imageUrl }); setError(''); }
  function closeForm() { setEditing(false); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    if (!form.startsAt) { toast('error', 'Choose an event date and time.'); return; }
    setSaving(true);
    try {
      const payload = { title: form.title.trim(), category: form.category, city: form.city.trim(), startsAt: new Date(form.startsAt).toISOString(), pricePaise: toPaise(form.price), description: form.description.trim(), imageUrl: form.imageUrl.trim(), ...(editing === null ? { isActive: true } : {}) };
      const response = await fetch(editing ? `/api/admin/events/${editing.id}` : '/api/admin/events', { method: editing ? 'PATCH' : 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.message ?? 'Could not save event.');
      setEditing(false); toast('success', editing ? 'Event details updated.' : 'Event added to your board.'); await load();
    } catch (reason) { toast('error', reason instanceof Error ? reason.message : 'Could not save event.'); }
    finally { setSaving(false); }
  }

  async function toggleStatus(event: AdminEvent) {
    try {
      const response = await fetch(`/api/admin/events/${event.id}/status`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isActive: !event.isActive }) }); const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message ?? 'Could not change event status.'); toast('success', `${event.title} is now ${event.isActive ? 'inactive' : 'active'}.`); await load();
    } catch (reason) { toast('error', reason instanceof Error ? reason.message : 'Could not change event status.'); }
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#ff0905]">Community calendar</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1e1d57]">Manage events</h1><p className="mt-2 text-sm text-[#777687]">Add, update, and control which events appear to visitors.</p></div><button onClick={startCreate} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff0905] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(255,9,5,.17)] hover:bg-[#e80703]"><span>＋</span>Add event</button></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-[#f2cbc8] bg-[#fff0ef] px-4 py-3 text-sm text-[#b42320]">{error}</p>}
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#1e1d57]/[.08] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#1e1d57]/[.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-bold text-[#1e1d57]">All events <span className="ml-1 font-medium text-[#92919e]">{result ? `(${result.pagination.totalItems})` : ''}</span></h2><p className="mt-1 text-xs text-[#898897]">Search by event name, city, or description.</p></div><div className="flex flex-col gap-2 min-[460px]:flex-row"><label className="sr-only" htmlFor="admin-event-search">Search events</label><input id="admin-event-search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search events…" className="h-10 min-w-0 rounded-xl border border-[#1e1d57]/15 px-3 text-sm outline-none focus:border-[#ff0905] focus:ring-4 focus:ring-[#ff0905]/10 min-[460px]:w-56"/><Dropdown id="event-status" label="Filter events by status" value={status} options={statusOptions} onChange={(value) => { setStatus(value); setPage(1); }} className="w-full min-[460px]:w-48" /></div></div>
      {loading && !result ? <div className="space-y-3 p-5"><div className="h-16 animate-pulse rounded-xl bg-[#f4f3f8]"/><div className="h-16 animate-pulse rounded-xl bg-[#f4f3f8]"/><p className="text-center text-xs text-[#898897]">Loading events…</p></div> : result?.data.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[780px] text-left"><thead className="bg-[#fafafd] text-[10px] font-bold uppercase tracking-[.12em] text-[#92919e]"><tr><th className="px-5 py-3">Event</th><th className="px-4 py-3">Date & time</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-[#1e1d57]/[.07]">{result.data.map((event) => <tr key={event.id} className="hover:bg-[#fcfcfe]"><td className="px-5 py-4"><div className="flex items-center gap-3"><img src={event.imageUrl} alt="" className="h-12 w-14 rounded-lg bg-[#f1effb] object-cover"/><span className="min-w-0"><span className="block max-w-72 truncate text-sm font-bold text-[#25243a]">{event.title}</span><span className="mt-1 block text-xs text-[#898897]">{event.category} · {event.city}</span></span></div></td><td className="px-4 py-4 text-xs text-[#555468]">{formatDate(event.startsAt)}</td><td className="px-4 py-4 text-sm font-semibold text-[#1e1d57]">{formatPrice(event.pricePaise)}</td><td className="px-4 py-4"><StatusBadge active={event.isActive}/></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => startEdit(event)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-2 text-xs font-semibold text-[#1e1d57] hover:bg-[#f4f3fa]">Edit</button><button onClick={() => void toggleStatus(event)} className={`rounded-lg px-3 py-2 text-xs font-semibold ${event.isActive ? 'bg-[#fff0ef] text-[#b42320] hover:bg-[#ffe5e3]' : 'bg-[#edfaf2] text-[#267647] hover:bg-[#e1f5e8]'}`}>{event.isActive ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-[#1e1d57]/[.07] md:hidden">{result.data.map((event) => <article key={event.id} className="flex gap-3 p-4"><img src={event.imageUrl} alt="" className="h-[76px] w-[82px] shrink-0 rounded-xl bg-[#f1effb] object-cover"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="line-clamp-2 text-sm font-bold text-[#25243a]">{event.title}</p><StatusBadge active={event.isActive}/></div><p className="mt-1 truncate text-xs text-[#898897]">{event.category} · {event.city}</p><p className="mt-1 text-xs text-[#555468]">{formatDate(event.startsAt)} · <b>{formatPrice(event.pricePaise)}</b></p><div className="mt-2 flex gap-2"><button onClick={() => startEdit(event)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-1.5 text-xs font-semibold text-[#1e1d57]">Edit</button><button onClick={() => void toggleStatus(event)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-1.5 text-xs font-semibold text-[#555468]">{event.isActive ? 'Deactivate' : 'Activate'}</button></div></div></article>)}</div>
      </> : loading ? <div className="p-8 text-center text-sm text-[#898897]">Updating event list…</div> : <div className="px-5 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1effb] text-xl text-[#1e1d57]">▣</span><h3 className="mt-4 text-base font-bold text-[#1e1d57]">No events found</h3><p className="mt-1 text-sm text-[#898897]">{query ? 'Try a different search or clear the search field.' : 'Add an event to get your community calendar started.'}</p>{!query && <button onClick={startCreate} className="mt-4 text-sm font-bold text-[#ff0905]">＋ Add your first event</button>}</div>}
      {result && result.pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-[#1e1d57]/[.08] px-4 py-3 sm:px-5"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-2 text-xs font-semibold text-[#1e1d57] disabled:opacity-40">← Previous</button><span className="text-xs font-medium text-[#777687]">Page {result.pagination.page} of {result.pagination.totalPages}</span><button disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-2 text-xs font-semibold text-[#1e1d57] disabled:opacity-40">Next →</button></div>}
    </section>
    {editing !== false && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }} className="fixed inset-0 z-[60] flex items-end justify-center bg-[#14133d]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"><section role="dialog" aria-modal="true" aria-labelledby="event-form-title" className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-[24px] bg-white p-5 shadow-2xl sm:rounded-[24px] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#ff0905]">Event details</p><h2 id="event-form-title" className="mt-1 text-xl font-extrabold text-[#1e1d57]">{editing ? 'Edit event' : 'Add an event'}</h2><p className="mt-1 text-xs text-[#898897]">Fields marked required are shown to visitors on the event card.</p></div><button onClick={closeForm} aria-label="Close form" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f3f8] text-lg text-[#555468]">×</button></div>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Event title" required><input required minLength={3} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Sunset Rooftop Sessions" className={inputClass}/></Field><Field label="Category" required><select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as AdminCategory })} className={inputClass}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="City" required><input required maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Coimbatore" className={inputClass}/></Field><Field label="Date and time" required><AdminDateTimePicker value={form.startsAt} onChange={(startsAt) => setForm({ ...form, startsAt })}/></Field><Field label="Price (₹)" required><input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="499" className={inputClass}/></Field><Field label="Event image URL" required><input required type="url" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://…" className={inputClass}/></Field><Field label="Description" required wide><textarea required minLength={1} maxLength={5000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What can visitors look forward to?" className={`${inputClass} h-auto py-3`}/></Field>
        <div className="flex flex-col-reverse gap-2 border-t border-[#1e1d57]/[.08] pt-4 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={closeForm} className="h-11 rounded-xl border border-[#1e1d57]/15 px-5 text-sm font-semibold text-[#555468]">Cancel</button><button disabled={saving} className="h-11 rounded-xl bg-[#ff0905] px-5 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create event'}</button></div>
      </form></section></div>}
  </div>;
}

const inputClass = 'mt-1.5 h-11 w-full rounded-xl border border-[#1e1d57]/15 bg-white px-3.5 text-sm text-[#29283d] outline-none transition placeholder:text-[#aaa9b4] focus:border-[#ff0905] focus:ring-4 focus:ring-[#ff0905]/10';
function Field({ label, required, wide, children }: { label: string; required?: boolean; wide?: boolean; children: ReactNode }) { return <label className={`block text-xs font-semibold text-[#555468] ${wide ? 'sm:col-span-2' : ''}`}>{label}{required && <span className="ml-1 text-[#ff0905]">*</span>}{children}</label>; }
function StatusBadge({ active }: { active: boolean }) { return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? 'bg-[#edfaf2] text-[#267647]' : 'bg-[#f0eff3] text-[#777687]'}`}><span className={`mr-1.5 mt-[3px] h-1.5 w-1.5 rounded-full ${active ? 'bg-[#32a267]' : 'bg-[#9998a5]'}`}/>{active ? 'Active' : 'Inactive'}</span>; }
function StatusDot({ tone }: { tone: 'navy' | 'green' | 'gray' }) { const colors = { navy: 'bg-[#1e1d57]', green: 'bg-[#32a267]', gray: 'bg-[#aaa9b4]' }; return <span className={`h-2.5 w-2.5 rounded-full ${colors[tone]}`} />; }
