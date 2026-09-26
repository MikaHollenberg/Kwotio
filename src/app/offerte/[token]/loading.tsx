/** Skeleton i.p.v. een kale witte pagina terwijl de offerte-data binnenkomt
 * -- zelfde `.kw-skeleton`-patroon als het dashboard, hier gevormd naar de
 * kop/blokken-lay-out van de echte klantpagina. */
export default function PublicQuoteLoading() {
  return (
    <div className="min-h-screen bg-sand-100 pb-28">
      <header className="sticky top-0 z-10 border-b border-ink-200/40 bg-sand-100/90 px-4 py-3 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="kw-skeleton h-8 w-32 rounded-brand-sm" />
          <div className="kw-skeleton h-6 w-24 rounded-full" />
        </div>
      </header>

      <main className="mx-auto mt-6 flex max-w-3xl flex-col gap-6 px-4 sm:px-0">
        <div className="flex items-start justify-between gap-4 rounded-brand-lg border border-ink-100 bg-white p-5">
          <div className="flex flex-1 flex-col gap-2">
            <div className="kw-skeleton h-3 w-20 rounded-full" />
            <div className="kw-skeleton h-6 w-48 rounded-brand-sm" />
            <div className="kw-skeleton h-3.5 w-32 rounded-full" />
          </div>
          <div className="kw-skeleton size-12 shrink-0 rounded-brand-sm" />
        </div>

        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-brand-lg border border-ink-100 bg-white p-5">
            <div className="kw-skeleton h-4 w-40 rounded-full" />
            <div className="kw-skeleton h-3.5 w-full rounded-full" />
            <div className="kw-skeleton h-3.5 w-4/5 rounded-full" />
            <div className="kw-skeleton mt-2 aspect-video w-full rounded-brand-sm" />
          </div>
        ))}
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-ink-100 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="kw-skeleton h-3 w-24 rounded-full" />
            <div className="kw-skeleton h-6 w-28 rounded-brand-sm" />
          </div>
          <div className="kw-skeleton h-11 w-36 rounded-brand-sm" />
        </div>
      </div>
    </div>
  );
}
