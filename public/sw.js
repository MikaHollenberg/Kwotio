// Minimale service worker: cachet de app-shell zodat Chrome/Android de
// installatie-prompt aanbiedt en het dashboard ook bij een wisselvallige
// verbinding snel opstart. Andere origins (Supabase, Mollie, etc.) raakt dit
// sowieso nooit — de same-origin-check hieronder sluit dat uit. Wordt alleen
// geregistreerd binnen het ingelogde dashboard (zie install-app-banner.tsx),
// dus dit draait nooit voor een klant op de publieke offertepagina.
const CACHE_VERSION = 'kwotio-v3'
const CORE_ASSETS = ['/dashboard', '/manifest.json', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {
        // Eén ontbrekend/niet-bereikbaar asset (bv. nog niet ingelogd op het
        // moment van installeren) mag de install niet laten falen.
      }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return

  // Navigatie (dashboard-routes): probeer eerst het net, val bij een
  // mislukte fetch (offline) terug op de gecachte dashboard-shell. Voorkomt
  // ook dat een oude, gecachete pagina ooit een verouderde JS-bundel blijft
  // serveren zolang de gebruiker online is.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/dashboard')))
    return
  }

  // Alleen écht content-hashed statische bestanden (/_next/static/...) en de
  // expliciete CORE_ASSETS-lijst cachen. Next.js' eigen interne client-side-
  // navigatie (het ophalen van een RSC-payload zodra je naar een nog niet
  // bezochte route navigeert) loopt via de KALE route-URL zelf, niet via een
  // gehashte bestandsnaam -- die hoort dus niet bij de eerdere aanname
  // hieronder ("een gewijzigd bestand krijgt sowieso een nieuwe URL"). Zonder
  // deze uitsluiting serveerde de stale-while-revalidate-strategie na een
  // nieuwe deploy soms een verouderde RSC-payload terug aan een tabblad dat
  // van vóór die deploy dateert -- de router raakte daardoor in de war en
  // Next.js herstelde zich met een volledige pagina-herlaad, wat live
  // gemeld en gereproduceerd is als "de rondleiding verdwijnt zomaar
  // midden in een stap". RSC-/route-fetches gaan nu altijd gewoon naar het
  // netwerk, geen caching.
  const url = new URL(request.url)
  const isHashedStaticAsset = url.pathname.startsWith('/_next/static/')
  const isCoreAsset = CORE_ASSETS.includes(url.pathname)
  if (!isHashedStaticAsset && !isCoreAsset) return

  // Stale-while-revalidate voor wat overblijft (alléén de twee categorieën
  // hierboven): toon direct wat er in de cache staat (snel, werkt offline),
  // ververs de cache op de achtergrond zodat een volgend bezoek de nieuwste
  // versie heeft.
  event.respondWith(
    caches.match(request).then((cached) => {
      const netwerkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const kopie = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, kopie))
          }
          return response
        })
        .catch(() => cached)
      return cached || netwerkFetch
    }),
  )
})
