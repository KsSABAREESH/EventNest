'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { submitCredentials } from '@/lib/api/auth';
import { useToast } from '@/components/ui/ToastProvider';

type AuthPanelProps = { mode: 'login' | 'signup'; signupSuccess?: boolean };

function NestMark() {
  return (
    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-nest-ink text-white shadow-sm shadow-nest-ink/20" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
        <path d="M4.5 10.25 12 4l7.5 6.25v8.5a1.25 1.25 0 0 1-1.25 1.25H5.75A1.25 1.25 0 0 1 4.5 18.75v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M9 20v-5.25A1.75 1.75 0 0 1 10.75 13h2.5A1.75 1.75 0 0 1 15 14.75V20" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m8.25 8.75 1 .1m6.5-.1-1 .1" stroke="#ff0905" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 3 21 21M10.6 10.7a2 2 0 0 0 2.7 2.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c5.3 0 8.5 5.1 9 6-.2.4-1.3 2.1-3.3 3.6M6.2 6.2C4.1 7.7 2.9 9.8 3 11c.5.9 3.7 8 9 8 1 0 2-.2 2.8-.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function AuthPanel({ mode, signupSuccess = false }: AuthPanelProps) {
  const router = useRouter();
  const toast = useToast();
  const isSignup = mode === 'signup';
  const signupToastShown = useRef(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (signupSuccess && !isSignup && !signupToastShown.current) {
      signupToastShown.current = true;
      toast('success', 'Your account was created. Log in with your new email and password to continue.');
    }
  }, [isSignup, signupSuccess, toast]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSignup && password !== confirmPassword) {
      toast('error', 'Those passwords do not match yet.');
      return;
    }

    setBusy(true);
    try {
      const result = await submitCredentials(mode, { email: email.trim(), password });
      if (isSignup) {
        try {
          window.localStorage.removeItem('eventnest.accessToken');
        } catch {
          // The user still needs to sign in manually if storage is unavailable.
        }
        router.replace('/login?registered=true');
        return;
      }
      try {
        window.localStorage.setItem('eventnest.accessToken', result.accessToken);
      } catch {
        // Keep the successful API response visible if this browser blocks local storage.
      }
      toast('success', 'Welcome back. You are signed in.');
      setPassword('');
      setConfirmPassword('');
      router.replace('/events?my_feed=true');
    } catch (error) {
      toast('error', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh bg-white lg:grid-cols-2">
      <section className="relative aspect-[3/2] h-auto overflow-hidden bg-nest-ink lg:sticky lg:top-0 lg:aspect-auto lg:h-dvh" aria-label="Discover local events">
        <Image
          src="/discover-local-events-hero.png"
          alt="A colorful illustration of someone exploring music, food, sports, and community events on a phone."
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 50vw"
          className="object-cover"
          style={{ objectPosition: 'left top' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e1d57]/75 via-transparent to-[#1e1d57]/10" />
        <Link href="/login" className="absolute left-6 top-5 hidden items-center gap-2.5 rounded-full border border-white/25 bg-white/90 py-1.5 pl-1.5 pr-4 text-sm font-bold tracking-tight text-nest-ink shadow-lg shadow-black/10 backdrop-blur sm:left-9 sm:top-8 lg:flex">
          <NestMark />
          EventNest
        </Link>
        <div className="absolute bottom-5 left-6 hidden max-w-sm text-white sm:bottom-8 sm:left-9 lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Good things happen nearby</p>
          <p className="mt-2 text-2xl font-semibold leading-tight">Find your people.<br />Make a night of it.</p>
        </div>
      </section>

      <section className="flex min-h-[calc(100dvh-230px)] items-center justify-center px-6 py-10 sm:min-h-[calc(100dvh-300px)] sm:px-10 sm:py-14 lg:min-h-dvh lg:px-12 xl:px-20">
        <div className="w-full max-w-[440px]">
          <div className="mb-10 flex items-center justify-between gap-4 lg:mb-14">
            <Link href="/login" className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-nest-ink lg:hidden">
              <NestMark /> EventNest
            </Link>
            <p className="ml-auto text-sm text-neutral-600">
              {isSignup ? 'Already a member?' : 'New to EventNest?'}{' '}
              <Link href={isSignup ? '/login' : '/signup'} className="font-semibold text-nest-ink underline decoration-nest-coral decoration-2 underline-offset-4 transition hover:text-nest-coral">
                {isSignup ? 'Log in' : 'Sign up'}
              </Link>
            </p>
          </div>

          <div className="mb-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-nest-coral">Your city, together</p>
            <h1 className="text-[2rem] font-bold tracking-[-0.045em] text-nest-ink sm:text-[2.5rem]">
              {isSignup ? 'Make room for more.' : 'Good to see you.'}
            </h1>
            <p className="mt-3 max-w-sm text-[15px] leading-6 text-neutral-600">
              {isSignup
                ? 'Create an account and start finding the little moments that make a city feel like yours.'
                : 'Sign in to find your next favorite night out, new skill, or neighborhood spot.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-neutral-800">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-[#ff0905]/25 bg-white px-4 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-[#ff0905]/55 focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-800">Password</label>
                {!isSignup && <span className="text-xs text-neutral-500">Keep it safe and sound</span>}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  className="h-12 w-full rounded-xl border border-[#ff0905]/25 bg-white px-4 pr-12 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-[#ff0905]/55 focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-neutral-500 transition hover:text-nest-ink focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-nest-ink"
                >
                  <EyeIcon visible={passwordVisible} />
                </button>
              </div>
            </div>

            {isSignup && (
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-semibold text-neutral-800">Confirm password</label>
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type={passwordVisible ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Enter your password again"
                  className="h-12 w-full rounded-xl border border-[#ff0905]/25 bg-white px-4 text-[15px] text-neutral-950 outline-none transition placeholder:text-neutral-400 hover:border-[#ff0905]/55 focus:border-nest-coral focus:ring-4 focus:ring-nest-coral/10"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nest-coral px-5 text-sm font-bold text-white shadow-lg shadow-nest-coral/15 transition hover:bg-[#df0805] hover:shadow-xl hover:shadow-nest-coral/20 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-nest-ink disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? (isSignup ? 'Creating your account…' : 'Signing you in…') : (isSignup ? 'Create account' : 'Log in')}
              {!busy && <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">→</span>}
            </button>
          </form>

          <p className="mt-7 text-center text-xs leading-5 text-neutral-500">
            {isSignup ? 'By creating an account, you agree to use EventNest kindly and respectfully.' : 'Your next good plan is just around the corner.'}
          </p>
          <p className="mt-12 text-center text-xs text-neutral-400">© {new Date().getFullYear()} EventNest · Made for the moments that bring us together</p>
        </div>
      </section>
    </main>
  );
}
