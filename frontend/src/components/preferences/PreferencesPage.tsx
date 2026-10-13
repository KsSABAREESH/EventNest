'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import EventsNavbar from '@/components/navigation/EventsNavbar';
import { AuthApiError, favouriteCategories, getCurrentUser, getFavouriteCategories, saveFavouriteCategories, type AuthUser, type FavouriteCategory } from '@/lib/api/auth';

export default function PreferencesPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [selected, setSelected] = useState<FavouriteCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadPreferences() {
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
        const categories = await getFavouriteCategories(token, controller.signal);
        if (!active) return;
        setSelected(categories);
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        if (requestError instanceof AuthApiError && requestError.status === 401) {
          window.localStorage.removeItem('eventnest.accessToken');
          router.replace('/login');
          return;
        }
        setError(requestError instanceof Error ? requestError.message : 'We could not load your preferences. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPreferences();
    return () => { active = false; controller.abort(); };
  }, [router]);

  function logout() {
    try { window.localStorage.removeItem('eventnest.accessToken'); } catch { /* clear visible state regardless */ }
    setAccount(null);
    router.replace('/events');
  }

  function toggleCategory(category: FavouriteCategory) {
    setSelected((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
    setNotice('');
  }

  async function savePreferences() {
    if (!account || selected.length === 0) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const token = window.localStorage.getItem('eventnest.accessToken');
      if (!token) { router.replace('/login'); return; }
      const saved = await saveFavouriteCategories(token, selected);
      setSelected(saved);
      setNotice('Your preferences have been saved.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#fbfaf8] text-[#171717]">
      <EventsNavbar account={account} accountLoading={loading} onLogout={logout} />
      <main className="mx-auto w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14">
        <Link href="/events" className="text-sm font-semibold text-nest-ink hover:text-nest-coral">← Back to events</Link>
        <section className="mt-5 rounded-3xl border border-[#1e1d57]/10 bg-white p-6 shadow-[0_12px_40px_rgba(30,29,87,0.06)] sm:p-9">
          <div className="grid items-center gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.9fr)] lg:gap-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-nest-coral">Your EventNest feed</p>
              <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em] text-nest-ink">My preferences</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#666577]">Choose the event categories you enjoy. Your My Feed page will use these choices.</p>
            </div>
            <div className="overflow-hidden rounded-2xl bg-[#fff8f4]">
              <Image
                src="/pastel-interest-selection.png"
                alt="A person choosing interests such as music, food, fitness, art, and family activities"
                width={1536}
                height={1024}
                priority
                className="h-44 w-full object-contain sm:h-60 lg:h-64"
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Loading preferences" aria-busy="true">
              {favouriteCategories.map((category) => <div key={category} className="h-14 animate-pulse rounded-xl bg-[#f1effb]" />)}
            </div>
          ) : error && !account ? (
            <div role="alert" className="mt-6 rounded-xl border border-nest-coral/20 bg-[#fff8f7] p-4 text-sm text-[#a92622]">{error}</div>
          ) : (
            <>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {favouriteCategories.map((category) => {
                  const checked = selected.includes(category);
                  return (
                    <button key={category} type="button" aria-pressed={checked} onClick={() => toggleCategory(category)} className={`flex min-h-14 items-center justify-between rounded-xl border px-4 text-left text-sm font-semibold transition ${checked ? 'border-nest-coral bg-nest-coral/[0.07] text-[#bd211d]' : 'border-[#1e1d57]/15 bg-white text-[#555466] hover:border-nest-coral/50'}`}>
                      <span>{category}</span><span aria-hidden="true" className="text-base">{checked ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
              {error && <p role="alert" className="mt-4 rounded-xl border border-nest-coral/20 bg-[#fff8f7] px-4 py-3 text-sm text-[#a92622]">{error}</p>}
              {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
              <button type="button" onClick={savePreferences} disabled={saving || selected.length === 0} className="mt-6 flex min-h-12 w-full items-center justify-center rounded-xl bg-nest-coral px-5 py-3 text-sm font-bold text-white shadow-md shadow-nest-coral/15 transition hover:bg-[#df0805] disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto">
                {saving ? 'Saving…' : 'Save preferences'}
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
