/** Skeleton i.p.v. een kale witte pagina terwijl de organisatie-/
 * aanvraagpagina-data binnenkomt -- zelfde `.kw-skeleton`-patroon als het
 * dashboard, hier gevormd naar de kop/templates-lay-out van de echte
 * publieke aanvraagpagina. */
export default function PublicOrgPageLoading() {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-sand-100">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="kw-skeleton size-14 shrink-0 rounded-brand-sm" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="kw-skeleton h-6 w-48 rounded-brand-sm" />
            <div className="kw-skeleton h-3.5 w-32 rounded-full" />
          </div>
        </div>

        <div className="kw-skeleton h-10 w-full max-w-xs rounded-brand-sm" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3 rounded-brand-lg border border-ink-100 bg-white p-4">
              <div className="kw-skeleton aspect-video w-full rounded-brand-sm" />
              <div className="kw-skeleton h-4 w-2/3 rounded-full" />
              <div className="kw-skeleton h-3.5 w-full rounded-full" />
              <div className="kw-skeleton h-3.5 w-4/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
