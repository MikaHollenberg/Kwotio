// Platform- en install-status-detectie voor de PWA-installatiebanner.
// Geen enkele browser geeft dit rechtstreeks door, dus dit blijft altijd een
// combinatie van user-agent-sniffing en de display-mode media query.
export function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isAppleMobiel = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ geeft zich in de user-agent uit voor een Mac, maar heeft
  // (anders dan een echte Mac) meerdere touch-points.
  const isIpadAlsMac = ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return isAppleMobiel || isIpadAlsMac;
}

// Andere iOS-apps met een ingebouwde browser draaien onder de motorkap ook op
// Safari's engine, maar "Zet op beginscherm" werkt daar niet vanuit hun eigen
// deelmenu — vandaar dit onderscheid, puur op basis van hun eigen
// user-agent-token. Kom je een nieuwe in-app-browser tegen die hier niet in
// staat (checken via whatismybrowser.com/detect/what-is-my-user-agent/ op
// het toestel zelf): gewoon het token toevoegen aan deze regex.
// - crios / fxios / edgios / opios: Chrome / Firefox / Edge / Opera op iOS
// - gsa: de Google-app (lijkt qua UI op Chrome, is het niet — "GSA" in de UA)
// - fban / fbav / instagram / linkedinapp: ingebouwde browsers van social apps
// - duckduckgo / mercury: overige bekende iOS-browser-apps
export function isIosSafari(): boolean {
  if (!isIos()) return false;
  const ua = window.navigator.userAgent;
  return !/crios|fxios|edgios|opios|gsa|mercury|duckduckgo|fban|fbav|instagram|linkedinapp/i.test(ua);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}
