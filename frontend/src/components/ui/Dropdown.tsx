'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type DropdownOption<Value extends string> = {
  value: Value;
  label: string;
  description?: string;
  icon?: ReactNode;
};

type DropdownProps<Value extends string> = {
  id: string;
  label: string;
  value: Value;
  options: readonly DropdownOption<Value>[];
  onChange: (value: Value) => void;
  className?: string;
};

export default function Dropdown<Value extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = '',
}: DropdownProps<Value>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  function openAt(index: number) {
    setActiveIndex(Math.max(0, Math.min(index, options.length - 1)));
    setOpen(true);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAt(Math.max(0, options.findIndex((option) => option.value === value)));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(options.length - 1);
    }
  }

  function handleOptionsKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      const nextIndex = (activeIndex + direction + options.length) % options.length;
      setActiveIndex(nextIndex);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setActiveIndex(event.key === 'Home' ? 0 : options.length - 1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <span id={`${id}-label`} className="sr-only">{label}</span>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-labelledby={`${id}-label ${id}-value`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-listbox`}
        onClick={() => (open ? setOpen(false) : openAt(Math.max(0, options.findIndex((option) => option.value === value))))}
        onKeyDown={handleTriggerKeyDown}
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border bg-white px-3.5 text-left text-sm transition focus:outline-none focus:ring-4 ${open ? 'border-nest-coral ring-4 ring-nest-coral/10' : 'border-[#1e1d57]/15 hover:border-[#1e1d57]/35 focus:border-nest-coral focus:ring-nest-coral/10'}`}
      >
        <span id={`${id}-value`} className="min-w-0 flex-1 truncate font-semibold text-nest-ink">{selectedOption?.label ?? 'Choose an option'}</span>
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={`h-4 w-4 shrink-0 text-[#777687] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={`${id}-listbox`}
          role="listbox"
          aria-labelledby={`${id}-label`}
          onKeyDown={handleOptionsKeyDown}
          className="absolute left-0 top-[calc(100%+0.5rem)] z-50 max-h-72 w-full min-w-56 overflow-y-auto rounded-2xl border border-[#1e1d57]/10 bg-white p-1.5 shadow-[0_18px_45px_rgba(30,29,87,0.18)] animate-[pop-in_160ms_ease-out]"
        >
          {options.map((option, index) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value || 'all'}
                ref={(element) => { optionRefs.current[index] = element; }}
                type="button"
                role="option"
                aria-selected={selected}
                tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`flex min-h-12 w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${selected ? 'bg-[#f4f2fb]' : 'hover:bg-[#faf9fc] focus:bg-[#faf9fc]'} focus:outline-none`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-nest-ink">{option.label}</span>
                  {option.description && <span className="mt-0.5 block truncate text-[11px] text-[#777687]">{option.description}</span>}
                </span>
                {selected && <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0 text-nest-coral"><path d="m4.5 10 3.5 3.5 7.5-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
