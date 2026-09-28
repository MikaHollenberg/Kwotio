import { TypewriterLoading } from "@/components/dashboard/typewriter-loading";

/** Eigen Suspense-boundary i.p.v. terug te vallen op de gedeelde
 * `/dashboard/loading.tsx` -- zie klanten/loading.tsx voor de reden. Een
 * typewriter-laadtekst i.p.v. een kale skeleton, want de cijfers hier
 * kosten iets meer rekenwerk dan een simpele lijst ophalen. */
export default function StatistiekenLoading() {
  return <TypewriterLoading />;
}
