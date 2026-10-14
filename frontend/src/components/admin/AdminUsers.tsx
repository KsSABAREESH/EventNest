'use client';

import { useCallback, useEffect, useState } from 'react';

type AdminUserSummary = { id: string; email: string; username: string | null; role: 'member'; createdAt: string };
type AdminUsersPageData = { data: AdminUserSummary[]; pagination: { page: number; pageSize: number; totalItems: number; totalPages: number } };
type AdminUserDetail = AdminUserSummary & { updatedAt: string; favouriteCategories: string[] };

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function AdminUsers() {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(1); const [result, setResult] = useState<AdminUsersPageData | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [selected, setSelected] = useState<AdminUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false); const [detailError, setDetailError] = useState('');

  const loadUsers = useCallback(async (signal: AbortSignal) => {
    setLoading(true); setError('');
    try {
      const query = new URLSearchParams({ page: String(page), pageSize: '12' }); if (search.trim()) query.set('search', search.trim());
      const response = await fetch(`/api/admin/users?${query}`, { cache: 'no-store', signal }); const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? 'Could not load user accounts.');
      setResult(body as AdminUsersPageData);
    } catch (reason) { if (!(reason instanceof Error && reason.name === 'AbortError')) setError(reason instanceof Error ? reason.message : 'Could not load user accounts.'); }
    finally { if (!signal.aborted) setLoading(false); }
  }, [page, search]);

  useEffect(() => { const controller = new AbortController(); const timer = window.setTimeout(() => void loadUsers(controller.signal), search ? 250 : 0); return () => { window.clearTimeout(timer); controller.abort(); }; }, [loadUsers, search]);

  async function showDetails(user: AdminUserSummary) {
    setSelected(null); setDetailError(''); setDetailLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { cache: 'no-store' }); const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? 'Could not load user details.');
      setSelected(body.data as AdminUserDetail);
    } catch (reason) { setDetailError(reason instanceof Error ? reason.message : 'Could not load user details.'); }
    finally { setDetailLoading(false); }
  }

  return <div>
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.17em] text-[#ff0905]">Community accounts</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1e1d57]">Manage users</h1><p className="mt-2 text-sm text-[#777687]">View account details and the categories each member follows.</p></div><div className="rounded-xl border border-[#1e1d57]/[.08] bg-white px-4 py-2.5"><p className="text-[10px] font-bold uppercase tracking-wider text-[#92919e]">Member accounts</p><p className="mt-0.5 text-lg font-extrabold text-[#1e1d57]">{result?.pagination.totalItems ?? (loading ? '—' : '0')}</p></div></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-[#f2cbc8] bg-[#fff0ef] px-4 py-3 text-sm text-[#b42320]">{error}</p>}
    <section className="mt-7 overflow-hidden rounded-2xl border border-[#1e1d57]/[.08] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#1e1d57]/[.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"><div><h2 className="text-sm font-bold text-[#1e1d57]">User accounts</h2><p className="mt-1 text-xs text-[#898897]">Select a member to view their profile and interests.</p></div><label className="relative block"><span className="sr-only">Search users</span><svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#92919e]"><circle cx="10.8" cy="10.8" r="6.5" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email" className="h-10 w-full rounded-xl border border-[#1e1d57]/15 pl-9 pr-3 text-sm outline-none focus:border-[#ff0905] focus:ring-4 focus:ring-[#ff0905]/10 sm:w-64"/></label></div>
      {loading && !result ? <div className="space-y-3 p-5"><div className="h-14 animate-pulse rounded-xl bg-[#f4f3f8]"/><div className="h-14 animate-pulse rounded-xl bg-[#f4f3f8]"/><p className="text-center text-xs text-[#898897]">Loading user accounts…</p></div> : result?.data.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[620px] text-left"><thead className="bg-[#fafafd] text-[10px] font-bold uppercase tracking-[.12em] text-[#92919e]"><tr><th className="px-5 py-3">Member</th><th className="px-4 py-3">Account email</th><th className="px-4 py-3">Joined</th><th className="px-5 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-[#1e1d57]/[.07]">{result.data.map((user) => <tr key={user.id} className="cursor-pointer transition hover:bg-[#fcfcfe]" onClick={() => void showDetails(user)}><td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar name={user.username || user.email}/><span className="min-w-0"><span className="block truncate text-sm font-bold text-[#25243a]">{user.username || 'Profile not completed'}</span><span className="mt-1 block text-xs text-[#898897]">Member account</span></span></div></td><td className="px-4 py-4 text-sm text-[#555468]">{user.email}</td><td className="px-4 py-4 text-xs text-[#555468]">{dateLabel(user.createdAt)}</td><td className="px-5 py-4 text-right"><button onClick={(event) => { event.stopPropagation(); void showDetails(user); }} className="rounded-lg border border-[#1e1d57]/15 px-3 py-2 text-xs font-semibold text-[#1e1d57] hover:bg-[#f4f3fa]">View details →</button></td></tr>)}</tbody></table></div>
        <div className="divide-y divide-[#1e1d57]/[.07] md:hidden">{result.data.map((user) => <button key={user.id} onClick={() => void showDetails(user)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-[#fcfcfe]"><Avatar name={user.username || user.email}/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-[#25243a]">{user.username || 'Profile not completed'}</span><span className="mt-1 block truncate text-xs text-[#777687]">{user.email}</span><span className="mt-1 block text-[11px] text-[#92919e]">Joined {dateLabel(user.createdAt)}</span></span><span aria-hidden="true" className="text-[#92919e]">→</span></button>)}</div>
      </> : loading ? <div className="p-8 text-center text-sm text-[#898897]">Updating user list…</div> : error ? <div className="px-5 py-14 text-center"><h3 className="text-base font-bold text-[#1e1d57]">User accounts could not be loaded</h3><p className="mt-1 text-sm text-[#898897]">Check the auth service and try again.</p><button onClick={() => void loadUsers(new AbortController().signal)} className="mt-4 rounded-lg border border-[#1e1d57]/15 px-4 py-2 text-xs font-bold text-[#1e1d57] hover:bg-[#f4f3fa]">Try again</button></div> : <div className="px-5 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1effb] text-xl text-[#1e1d57]">♙</span><h3 className="mt-4 text-base font-bold text-[#1e1d57]">No users found</h3><p className="mt-1 text-sm text-[#898897]">{search ? 'Try another name or email address.' : 'Member accounts will appear here after signup.'}</p></div>}
      {result && result.pagination.totalPages > 1 && <div className="flex items-center justify-between border-t border-[#1e1d57]/[.08] px-4 py-3 sm:px-5"><button disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-2 text-xs font-semibold text-[#1e1d57] disabled:opacity-40">← Previous</button><span className="text-xs font-medium text-[#777687]">Page {result.pagination.page} of {result.pagination.totalPages}</span><button disabled={page >= result.pagination.totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#1e1d57]/15 px-3 py-2 text-xs font-semibold text-[#1e1d57] disabled:opacity-40">Next →</button></div>}
    </section>

    {(detailLoading || detailError || selected) && <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSelected(null); setDetailError(''); setDetailLoading(false); } }} className="fixed inset-0 z-[60] flex items-end justify-center bg-[#14133d]/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"><section role="dialog" aria-modal="true" aria-labelledby="user-detail-title" className="w-full max-w-lg rounded-t-[24px] bg-white p-5 shadow-2xl sm:rounded-[24px] sm:p-7"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-[#ff0905]">Member profile</p><h2 id="user-detail-title" className="mt-1 text-xl font-extrabold text-[#1e1d57]">User details</h2></div><button onClick={() => { setSelected(null); setDetailError(''); setDetailLoading(false); }} aria-label="Close user details" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f3f8] text-lg text-[#555468]">×</button></div>
        {detailLoading && <div className="py-10 text-center text-sm text-[#777687]">Loading user and favourite categories…</div>}
        {detailError && <p role="alert" className="mt-5 rounded-xl bg-[#fff0ef] px-4 py-3 text-sm text-[#b42320]">{detailError}</p>}
        {selected && <><div className="mt-6 flex items-center gap-4 rounded-2xl bg-[#f7f6fb] p-4"><Avatar name={selected.username || selected.email} large/><div className="min-w-0"><p className="truncate text-base font-bold text-[#1e1d57]">{selected.username || 'Profile not completed'}</p><p className="mt-1 truncate text-sm text-[#777687]">{selected.email}</p></div></div><dl className="mt-5 grid grid-cols-2 gap-3"><DetailItem label="Account type" value="Member"/><DetailItem label="Joined" value={dateLabel(selected.createdAt)}/><DetailItem label="Profile" value={selected.username ? 'Complete' : 'Incomplete'}/><DetailItem label="Last updated" value={dateLabel(selected.updatedAt)}/></dl><div className="mt-5 rounded-2xl border border-[#1e1d57]/[.08] p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-[#1e1d57]">Favourite categories</h3><p className="mt-1 text-xs text-[#898897]">Interests selected by this member</p></div><span className="rounded-full bg-[#f1effb] px-2.5 py-1 text-[10px] font-bold text-[#1e1d57]">{selected.favouriteCategories.length}</span></div>{selected.favouriteCategories.length ? <div className="mt-3 flex flex-wrap gap-2">{selected.favouriteCategories.map((category) => <span key={category} className="rounded-full border border-[#1e1d57]/10 bg-[#faf9fd] px-3 py-1.5 text-xs font-semibold text-[#403f59]">{category}</span>)}</div> : <p className="mt-3 rounded-xl bg-[#faf9fd] px-3 py-3 text-xs text-[#777687]">No favourite categories selected yet.</p>}</div></>}
      </section></div>}
  </div>;
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'U';
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#e9e7f7] font-bold text-[#1e1d57] ${large ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-xs'}`}>{initials}</span>;
}

function DetailItem({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#1e1d57]/[.07] px-3.5 py-3"><dt className="text-[10px] font-bold uppercase tracking-wide text-[#92919e]">{label}</dt><dd className="mt-1 text-xs font-semibold text-[#333246]">{value}</dd></div>; }
