/** `template.tsx` (i.p.v. layout.tsx) remount't bij élke navigatie binnen
 * /dashboard/* -- precies wat nodig is voor een zachte fade+verschuiving
 * per paginawissel i.p.v. een harde jump (Kwotio Motion Concepts #15).
 * Geen "use client" nodig: puur CSS-animatie, geen interactiviteit. */
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="kw-page-enter">{children}</div>;
}
