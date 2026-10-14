'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type ToastKind = 'success' | 'error';
type ToastItem = { id: number; kind: ToastKind; message: string };
type ToastContextValue = { toast: (kind: ToastKind, message: string) => void };
type ToastTimer = { handle?: ReturnType<typeof setTimeout>; startedAt: number; remaining: number };

const ToastContext = createContext<ToastContextValue | null>(null);
let nextToastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ToastTimer>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer?.handle) clearTimeout(timer.handle);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = ++nextToastId;
    setItems((current) => [...current, { id, kind, message }]);
    const timer: ToastTimer = { handle: setTimeout(() => dismiss(id), 5000), startedAt: Date.now(), remaining: 5000 };
    timers.current.set(id, timer);
  }, [dismiss]);

  const pauseToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (!timer?.handle) return;
    clearTimeout(timer.handle);
    timer.remaining = Math.max(0, timer.remaining - (Date.now() - timer.startedAt));
    timers.current.set(id, { ...timer, handle: undefined });
  }, []);

  const resumeToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (!timer || timer.handle) return;
    const resumed: ToastTimer = {
      ...timer,
      startedAt: Date.now(),
      handle: setTimeout(() => dismiss(id), timer.remaining),
    };
    timers.current.set(id, resumed);
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach((timer) => { if (timer.handle) clearTimeout(timer.handle); });
    timers.current.clear();
  }, []);

  const contextValue = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {items.length > 0 && createPortal(
        <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[min(24rem,calc(100vw-1.5rem))] flex-col gap-2.5 sm:right-5 sm:top-5" aria-label="Notifications">
          {items.map((item) => (
            <article key={item.id} role={item.kind === 'error' ? 'alert' : 'status'} onMouseEnter={() => pauseToast(item.id)} onMouseLeave={() => resumeToast(item.id)} className="group pointer-events-auto relative flex min-h-[5.5rem] animate-[toast-enter_220ms_ease-out_both] items-center gap-3.5 overflow-hidden rounded-xl border border-[#1e1d57]/10 bg-white px-4 py-5 pr-12 shadow-[0_12px_32px_rgba(30,29,87,.16)]">
              <span aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.kind === 'success' ? 'bg-[#e8f7ed] text-[#27804d]' : 'bg-[#fff0ef] text-[#d92d27]'}`}>
                {item.kind === 'success' ? (
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="m6.5 12.5 3.6 3.6 7.5-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="m8 8 8 8m0-8-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                )}
              </span>
              <p className={`min-w-0 flex-1 text-sm font-semibold leading-5 ${item.kind === 'success' ? 'text-[#226b42]' : 'text-[#a92622]'}`}>{item.message}</p>
              <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-lg leading-none text-[#777687] hover:bg-[#f4f3f8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e1d57]">×</button>
              <span aria-hidden="true" className={`absolute inset-x-0 bottom-0 h-1 origin-left animate-[toast-countdown_5s_linear_forwards] group-hover:[animation-play-state:paused] ${item.kind === 'success' ? 'bg-[#32a267]' : 'bg-[#ff0905]'}`} />
            </article>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider.');
  return context.toast;
}
