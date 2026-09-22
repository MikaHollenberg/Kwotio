import { Check, TriangleAlert, Info, Ban, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function Swatch({ hex, label }: { hex: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-14 rounded-brand-sm border border-ink-200/40" style={{ backgroundColor: hex }} />
      <div className="text-xs font-medium text-ink-400">{label}</div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">{children}</CardContent>
    </Card>
  );
}

export default function StijlgidsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Hoofdaccount</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Stijlgids</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-400">
          Het designsysteem voor het Kwotio-platform zelf — hoofdaccount en marketingsite. Geldt niet voor de
          klant-facing offertepagina&apos;s: die blijven de huisstijl van de eigen organisatie tonen (zie{" "}
          <code className="rounded bg-sand-200 px-1 py-0.5 text-xs">resolveAccentColor()</code>).
        </p>
      </div>

      <Section
        title="Typografie"
        description="Bricolage Grotesque voor koppen, Manrope voor body — al overal in de app geïntegreerd (incl. de factuur-PDF's). Schaal ×1.25."
      >
        <div className="flex flex-col gap-3">
          <div className="font-display text-[49px] font-bold leading-[1.1] tracking-tight text-ink-500">Aa 49</div>
          <div className="font-display text-[39px] font-bold leading-[1.15] tracking-tight text-ink-500">Aa 39</div>
          <div className="font-display text-[31px] font-semibold leading-[1.2] text-ink-500">Aa 31</div>
          <div className="font-display text-[25px] font-semibold leading-[1.25] text-ink-500">Aa 25</div>
          <div className="font-display text-xl font-semibold text-ink-500">Aa 20 — koppen (Bricolage Grotesque)</div>
          <div className="text-base text-ink-500">Aa 16 — body-tekst (Manrope, line-height 1.6)</div>
          <div className="text-sm text-ink-400">Aa 14 — secundaire tekst</div>
          <div className="text-xs text-ink-400">Aa 12 — labels/metadata</div>
        </div>
      </Section>

      <Section
        title="Kleur — Kwotio-goud"
        description="Accent, nooit een groot vlak. Uitgebouwd vanaf het bestaande merkteken-goud (#B87F2A)."
      >
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
          <Swatch hex="#fbf3e7" label="50" />
          <Swatch hex="#f5e2c4" label="100" />
          <Swatch hex="#ebc98d" label="200" />
          <Swatch hex="#dead5c" label="300" />
          <Swatch hex="#cc9640" label="400" />
          <Swatch hex="#b87f2a" label="500" />
          <Swatch hex="#9c6820" label="600" />
          <Swatch hex="#7d5119" label="700" />
          <Swatch hex="#5e3d14" label="800" />
          <Swatch hex="#402a0e" label="900" />
        </div>
      </Section>

      <Section title="Kleur — cream & inkt" description="Bestaande zand- en inkt-schaal, hergebruikt als neutralen.">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Cream (zand)</p>
          <div className="grid grid-cols-5 gap-3">
            <Swatch hex="#ffffff" label="50" />
            <Swatch hex="#fbf6ec" label="100" />
            <Swatch hex="#f3ebda" label="200" />
            <Swatch hex="#e9dcc2" label="300" />
            <Swatch hex="#dcc9a3" label="400" />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Inkt</p>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-9">
            <Swatch hex="#eef1f2" label="50" />
            <Swatch hex="#d7dde0" label="100" />
            <Swatch hex="#aab6bc" label="200" />
            <Swatch hex="#7c8f97" label="300" />
            <Swatch hex="#46626e" label="400" />
            <Swatch hex="#1e2e38" label="500" />
            <Swatch hex="#1a2830" label="600" />
            <Swatch hex="#14232b" label="700" />
            <Swatch hex="#0c161b" label="800" />
          </div>
        </div>
      </Section>

      <Section
        title="Semantische kleuren"
        description="Bewust andere schalen dan het goud-accent en de organisatie-huisstijlkleuren, zodat status nooit als merk aanvoelt."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Badge tone="green">
            <Check className="size-3.5" /> Succes
          </Badge>
          <Badge tone="amber">
            <TriangleAlert className="size-3.5" /> Waarschuwing
          </Badge>
          <Badge tone="red">
            <Ban className="size-3.5" /> Fout
          </Badge>
          <Badge tone="sky">
            <Info className="size-3.5" /> Info
          </Badge>
        </div>
      </Section>

      <Section
        title="Vorm, ruimte & motion"
        description="Hergebruikt van het bestaande systeem — geen parallel systeem nodig."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Radius</p>
            <div className="flex items-end gap-3">
              <div className="size-14 rounded-brand-sm bg-gold-200" />
              <div className="size-14 rounded-brand bg-gold-300" />
              <div className="size-14 rounded-brand-lg bg-gold-400" />
            </div>
            <p className="text-xs text-ink-400">brand-sm (16) · brand (20) · brand-lg (24)</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Ruimte</p>
            <p className="text-xs text-ink-400">Tailwinds standaardschaal (4px-stappen) — geen eigen grid nodig.</p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Motion</p>
            <p className="text-xs text-ink-400">
              150–300ms, één curve: <code className="rounded bg-sand-200 px-1 py-0.5">ease-brand</code>{" "}
              (cubic-bezier(0.22, 1, 0.36, 1)) — altijd functioneel, nooit decoratief.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Knoppen" description="Primair (goud) · secundair (outline) · tertiair (ghost).">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="gold">
            <Sparkles className="size-4" /> Primair
          </Button>
          <Button variant="outline">Secundair</Button>
          <Button variant="ghost">Tertiair</Button>
          <Button variant="gold" disabled>
            Uitgeschakeld
          </Button>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Kaarttitel</CardTitle>
              <CardDescription>Korte, ondersteunende omschrijving.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-400">Inhoud van de kaart.</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-gold-300">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge tone="gold">Aanbevolen</Badge>
              </div>
              <CardTitle>Uitgelichte kaart</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-400">2px goud-rand voor nadruk — de enige uitzondering op de 1px-regel.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Forminputs">
        <div className="flex max-w-sm flex-col gap-1.5">
          <label htmlFor="stijlgids-input" className="text-sm font-medium text-ink-500">
            E-mailadres
          </label>
          <Input id="stijlgids-input" type="email" placeholder="jij@jouwemail.nl" />
        </div>
      </Section>
    </div>
  );
}
