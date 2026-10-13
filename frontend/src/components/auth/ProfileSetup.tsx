'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { AuthApiError, getCurrentUser, saveProfile } from '@/lib/api/auth';

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'EN';
}

export default function ProfileSetup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function loadProfile() {
      let token = '';
      try {
        token = window.localStorage.getItem('eventnest.accessToken') ?? '';
      } catch {
        // Treat blocked local storage as a signed-out browser.
      }
      if (!token) {
        router.replace('/login');
        return;
      }

      try {
        const user = await getCurrentUser(token, controller.signal);
        if (user.profileComplete) {
          router.replace('/events');
          return;
        }
        if (!active) return;
        setEmail(user.email);
        setUsername(user.username ?? '');
        setMobileNumber(user.mobileNumber ?? '');
        setPhotoUrl(user.photoUrl ?? '');
      } catch (requestError) {
        if (!active || controller.signal.aborted) return;
        if (requestError instanceof AuthApiError && requestError.status === 401) {
          window.localStorage.removeItem('eventnest.accessToken');
          router.replace('/login');
          return;
        }
        setError(requestError instanceof Error ? requestError.message : 'We could not load your profile.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadProfile();
    return () => {
      active = false;
      controller.abort();
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const token = window.localStorage.getItem('eventnest.accessToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      await saveProfile(token, {
        username: username.trim(),
        mobileNumber: mobileNumber.trim(),
        ...(photoUrl.trim() ? { photoUrl: photoUrl.trim() } : {}),
      });
      router.replace('/events');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'We could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#fbfaf8] px-4 py-10 sm:px-8">
      <section className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-[#1e1d57]/10 bg-white shadow-[0_24px_80px_rgba(30,29,87,0.12)]">
        <div className="bg-nest-ink px-6 py-6 text-white sm:px-9 sm:py-8">
          <Link href="/events" className="inline-flex items-center gap-2 text-sm font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15" aria-hidden="true">⌂</span>
            EventNest
          </Link>
          <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-[#ffaaa8]">One quick first step</p>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Make it yours.</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/75">Add a name and mobile number so your EventNest profile is ready. You can add a photo if you like.</p>
        </div>

        {loading ? (
          <div className="space-y-4 px-6 py-8 sm:px-9" aria-label="Loading profile" aria-busy="true">
            <div className="h-4 w-40 animate-pulse rounded bg-[#eeedf4]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#f4f3f7]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#f4f3f7]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#f4f3f7]" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 px-6 py-7 sm:px-9 sm:py-9">
            <div className="flex items-center gap-4 rounded-2xl bg-[#f7f6fb] p-4">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="Profile preview" className="h-14 w-14 rounded-full border-2 border-white object-cover shadow-sm" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white bg-nest-ink text-sm font-bold text-white shadow-sm" aria-hidden="true">{initials(username)}</span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#24233d]">{username.trim() || 'Your name'}</p>
                <p className="mt-0.5 truncate text-xs text-[#777687]">{email}</p>
              </div>
            </div>

            <div>
              <label htmlFor="profile-username" className="mb-2 block text-sm font-semibold text-[#29283f]">Username</label>
              <input
                id="profile-username"
                name="username"
                autoComplete="nickname"
                required
                minLength={2}
                maxLength={40}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="What should we call you?"
                className="h-12 w-full rounded-xl border border-[#1e1d57]/15 px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#9998a5] focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
              />
            </div>

            <div>
              <label htmlFor="profile-mobile" className="mb-2 block text-sm font-semibold text-[#29283f]">Mobile number</label>
              <input
                id="profile-mobile"
                name="mobileNumber"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                required
                minLength={10}
                maxLength={24}
                pattern="[+0-9 ()-]+"
                value={mobileNumber}
                onChange={(event) => setMobileNumber(event.target.value)}
                placeholder="+91 98765 43210"
                className="h-12 w-full rounded-xl border border-[#1e1d57]/15 px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#9998a5] focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
              />
              <p className="mt-1.5 text-xs text-[#858493]">Use 10 to 15 digits; country code is optional.</p>
            </div>

            <div>
              <label htmlFor="profile-photo" className="mb-2 block text-sm font-semibold text-[#29283f]">Profile photo <span className="font-normal text-[#858493]">(optional)</span></label>
              <input
                id="profile-photo"
                name="photoUrl"
                type="url"
                maxLength={2048}
                value={photoUrl}
                onChange={(event) => setPhotoUrl(event.target.value)}
                placeholder="https://example.com/your-photo.jpg"
                className="h-12 w-full rounded-xl border border-[#1e1d57]/15 px-4 text-sm text-[#171717] outline-none transition placeholder:text-[#9998a5] focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
              />
              <p className="mt-1.5 text-xs text-[#858493]">Add a public image link, or leave this blank.</p>
            </div>

            {error && <p role="alert" className="rounded-xl border border-nest-coral/25 bg-nest-coral/5 px-4 py-3 text-sm leading-5 text-[#b91c1c]">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-nest-coral px-5 text-sm font-bold text-white shadow-lg shadow-nest-coral/15 transition hover:bg-[#df0805] disabled:cursor-wait disabled:opacity-70"
            >
              {saving ? 'Saving your profile…' : 'Save profile and continue'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
