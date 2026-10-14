'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

const items = [
  { href: '/admin', label: 'Overview', icon: '▦' },
  { href: '/admin/events', label: 'Events', icon: '▣' },
  { href: '/admin/users', label: 'Users', icon: '♙' },
];

export default function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [mobileOpen, setMobileOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [busy, setBusy] = useState(false);
  const current = items.find((item) => item.href === pathname) ?? items[0];
  async function logout() { setBusy(true); await fetch('/api/admin/session', { method: 'DELETE' }); router.replace('/admin/login'); router.refresh(); }
  return (
    <div className="min-h-screen bg-[#f7f7fa] text-[#171717]">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col bg-[#1e1d57] px-5 pb-5 pt-6 text-white transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link href="/admin" className="flex items-center gap-3 px-2 text-lg font-extrabold tracking-tight"><img src="/favicon.ico" alt="" className="h-10 w-10 rounded-2xl" />EventNest <span className="ml-auto rounded-md bg-white/10 px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/70">Admin</span></Link>
        <p className="mb-3 mt-11 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-white/40">Workspace</p>
        <nav aria-label="Admin navigation" className="space-y-1">{items.map((item) => { const active = current.href === item.href; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? 'bg-white text-[#1e1d57] shadow-sm' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-base">{item.icon}</span>{item.label}{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#ff0905]" />}</Link>; })}</nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.06] p-4"><p className="text-xs font-semibold">Community first</p><p className="mt-1 text-[11px] leading-5 text-white/55">Keep the local calendar useful, welcoming, and up to date.</p></div>
      </aside>
      {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-[#14133d]/50 lg:hidden" />}
      <div className="min-w-0 lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-[#1e1d57]/[.08] bg-white/95 backdrop-blur">
          <div className="flex h-[68px] items-center justify-between px-4 sm:px-7 lg:px-9">
            <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileOpen(true)} aria-label="Open navigation" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#1e1d57]/10 text-[#1e1d57] lg:hidden"><span className="text-xl">☰</span></button><div className="min-w-0"><div className="flex items-center gap-2 text-[11px] text-[#92919e]"><span>Admin</span><span>/</span><span className="font-semibold text-[#535269]">{current.label}</span></div><p className="mt-0.5 truncate text-sm font-bold text-[#1e1d57]">{current.label}</p></div></div>
            <div className="relative flex items-center gap-2 sm:gap-3"><span className="hidden text-right sm:block"><span className="block text-xs font-semibold text-[#333246]">Administrator</span><span className="block max-w-52 truncate text-[10px] text-[#898897]">{email}</span></span><button aria-label="Admin profile" aria-expanded={profileOpen} onClick={() => setProfileOpen(!profileOpen)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1e1d57] text-sm font-bold text-white">A</button><button aria-label="Open admin menu" onClick={() => setProfileOpen(!profileOpen)} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#1e1d57] hover:bg-[#f3f2fa]"><span className="text-xl">⋮</span></button>
              {profileOpen && <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[#1e1d57]/10 bg-white p-2 shadow-xl"><div className="border-b border-[#1e1d57]/[.08] px-3 py-3"><p className="text-xs font-semibold">Administrator</p><p className="mt-1 truncate text-[11px] text-[#777687]">{email}</p></div><button disabled={busy} onClick={logout} className="mt-1 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#b42320] hover:bg-[#fff0ef]">{busy ? 'Signing out…' : 'Log out'}</button></div>}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-7 sm:py-9 lg:px-9">{children}</main>
      </div>
    </div>
  );
}
