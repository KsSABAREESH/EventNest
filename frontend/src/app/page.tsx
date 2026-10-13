export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-neutral-950">
      <header className="bg-nest-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <a className="text-xl font-bold tracking-tight" href="/">EventNest</a>
          <span className="rounded-full border border-white/25 px-3 py-1 text-xs text-white/80">
            Community events
          </span>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-nest-coral">
          Your city, together
        </p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
          Good plans are closer than you think.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-600">
          EventNest is getting ready to bring local music, workshops, food, sports, and family
          events together in one place.
        </p>
        <div className="mt-9 inline-flex rounded-xl bg-nest-coral px-5 py-3 text-sm font-semibold text-white">
          Coming soon
        </div>
      </section>
    </main>
  );
}
