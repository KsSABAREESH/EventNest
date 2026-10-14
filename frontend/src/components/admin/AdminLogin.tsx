'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

export default function AdminLogin() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message ?? 'Could not sign in. Check the admin credentials.');
      toast('success', 'You are signed in to the admin dashboard.'); router.replace('/admin'); router.refresh();
    } catch (reason) { toast('error', reason instanceof Error ? reason.message : 'Could not sign in. Try again.'); }
    finally { setBusy(false); }
  }

  return (
    <main className="grid min-h-screen bg-[#f6f5fb] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <section className="relative hidden overflow-hidden bg-[#1e1d57] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-28 top-24 h-96 w-96 rounded-full border border-white/10" /><div className="absolute -right-8 top-44 h-64 w-64 rounded-full border border-white/10" />
        <Link href="/events" className="relative flex items-center gap-3 text-xl font-extrabold"><img src="/favicon.ico" alt="" className="h-11 w-11 rounded-2xl" />EventNest</Link>
        <div className="relative max-w-xl pb-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-[#ffaaa7]">EventNest administration</p><h1 className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-tight">Make every local event feel <span className="text-[#ff7772]">closer.</span></h1><p className="mt-6 max-w-md text-base leading-7 text-white/70">Manage the gatherings, workshops, and moments that bring your community together.</p></div>
        <p className="relative text-xs text-white/50">A calmer way to keep the community calendar moving.</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-[28px] border border-[#1e1d57]/[.08] bg-white p-7 shadow-[0_24px_80px_rgba(30,29,87,.08)] sm:p-10">
          <Link href="/events" className="text-sm font-semibold text-[#777687] hover:text-[#1e1d57]">← Back to EventNest</Link>
          <div className="mt-9"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0ef] text-[#ff0905]"><svg viewBox="0 0 24 24" fill="none" className="h-6 w-6"><path d="M12 3 5 6v5c0 4.7 2.9 8 7 10 4.1-2 7-5.3 7-10V6l-7-3Z" stroke="currentColor" strokeWidth="1.8"/><path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></span><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[#ff0905]">Admin access</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1e1d57]">Welcome back</h2><p className="mt-2 text-sm leading-6 text-[#777687]">Sign in with your administrator credentials to manage events.</p></div>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-semibold text-[#24233a]">Email address<input required autoComplete="username" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#1e1d57]/15 px-4 font-normal outline-none transition focus:border-[#ff0905] focus:ring-4 focus:ring-[#ff0905]/10" placeholder="admin@example.com" /></label>
            <label className="block text-sm font-semibold text-[#24233a]">Password<input required autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-[#1e1d57]/15 px-4 font-normal outline-none transition focus:border-[#ff0905] focus:ring-4 focus:ring-[#ff0905]/10" placeholder="Enter your password" /></label>
            <button disabled={busy} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#ff0905] text-sm font-bold text-white shadow-[0_8px_18px_rgba(255,9,5,.2)] transition hover:bg-[#e80703] disabled:cursor-wait disabled:opacity-70">{busy ? 'Signing in…' : 'Sign in to dashboard'}{!busy && <span aria-hidden="true">→</span>}</button>
          </form>
          <p className="mt-6 text-center text-xs leading-5 text-[#8a8998]">Administrator access is restricted to authorized EventNest staff.</p>
        </div>
      </section>
    </main>
  );
}
