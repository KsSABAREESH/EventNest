'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { AuthUser } from '@/lib/api/auth';

function BrandMark() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/favicon.ico" alt="" aria-hidden="true" width={40} height={40} className="h-10 w-10 shrink-0 rounded-2xl object-cover ring-1 ring-white/15" />
  );
}

export default function EventsNavbar({
  account,
  accountLoading = false,
  onLogout,
}: {
  account: AuthUser | null;
  accountLoading?: boolean;
  onLogout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && !profileOpen) return;
    function closeOnOutsideClick(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (menuOpen && !menuRef.current?.contains(event.target)) setMenuOpen(false);
      if (profileOpen && !profileRef.current?.contains(event.target)) setProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen, profileOpen]);

  function logout() {
    setMenuOpen(false);
    setProfileOpen(false);
    onLogout();
  }

  return (
    <header className="sticky top-0 z-30 bg-nest-ink text-white shadow-[0_6px_24px_rgba(30,29,87,0.16)]">
      <nav className="mx-auto flex h-[68px] w-full min-w-0 max-w-7xl items-center justify-between gap-2 px-3 sm:h-[72px] sm:gap-4 sm:px-8 lg:px-10" aria-label="Main navigation">
        <Link href="/events" aria-label="EventNest home" className="flex shrink-0 items-center gap-2 text-base font-bold tracking-tight sm:gap-3 sm:text-lg">
          <BrandMark />
          <span className="hidden min-[380px]:inline">EventNest</span>
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-5">
          <Link href="/events" className="hidden shrink-0 whitespace-nowrap text-[11px] font-semibold text-white/85 transition hover:text-white sm:block sm:text-sm">Discover</Link>
          {account?.role === 'member' && (
            <Link href="/events?my_feed=true" className="hidden shrink-0 whitespace-nowrap text-[11px] font-semibold text-white/85 transition hover:text-white sm:block sm:text-sm">
              <span className="sm:hidden">Feed</span><span className="hidden sm:inline">My Feed</span>
            </Link>
          )}

          {!accountLoading && account && (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                aria-label="Profile"
                aria-expanded={profileOpen}
                aria-controls="profile-menu"
                onClick={() => { setProfileOpen((open) => !open); setMenuOpen(false); }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                  <circle cx="12" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M5.5 20c.6-3.4 3-5.2 6.5-5.2s5.9 1.8 6.5 5.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
              {profileOpen && (
                <div id="profile-menu" className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#1e1d57]/10 bg-white p-4 text-nest-ink shadow-[0_18px_50px_rgba(20,19,61,0.22)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#777687]">Signed in as</p>
                  <p className="mt-2 truncate text-sm font-bold">{account.username || 'EventNest member'}</p>
                  <p className="mt-1 truncate text-xs text-[#777687]">{account.email}</p>
                </div>
              )}
            </div>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="account-menu"
              onClick={() => { setMenuOpen((open) => !open); setProfileOpen(false); }}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            {menuOpen && (
              <div id="account-menu" className="absolute right-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#1e1d57]/10 bg-white p-2 text-nest-ink shadow-[0_18px_50px_rgba(20,19,61,0.22)]">
                <div className="sm:hidden">
                  <Link href="/events" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#f1effb]">Discover</Link>
                  {account?.role === 'member' && <Link href="/events?my_feed=true" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#f1effb]">My Feed</Link>}
                  <div className="my-1 border-t border-[#1e1d57]/10" />
                </div>
                {accountLoading ? (
                  <p className="px-4 py-3 text-sm text-[#777687]" aria-live="polite">Loading account…</p>
                ) : account ? (
                  <>
                    <button type="button" disabled aria-disabled="true" title="Bookings are not available yet" className="block w-full cursor-not-allowed rounded-xl px-4 py-3 text-left text-sm font-medium text-[#9998a5]">My bookings</button>
                    <Link href="/preferences" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#f1effb]">My preferences</Link>
                    <Link href="/wishlist" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#f1effb]">Wishlist</Link>
                    <div className="my-1 border-t border-[#1e1d57]/10" />
                    <button type="button" onClick={logout} className="block w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-[#b42320] transition hover:bg-[#fff1f0]">Log out</button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#f1effb]">Log in</Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} className="block rounded-xl px-4 py-3 text-sm font-bold text-nest-coral transition hover:bg-[#fff1f0]">Join free</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
