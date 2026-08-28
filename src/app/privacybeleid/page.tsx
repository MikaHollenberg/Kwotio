import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Privacybeleid" };

// Concept — nog door de organisatie (en desgewenst een jurist) na te laten
// lopen voordat dit als definitief privacybeleid wordt gecommuniceerd. Geen
// juridisch advies.
export default function PrivacybeleidPage() {
  return (
    <div className="min-h-screen bg-sand-100 px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-block">
          <Logo variant="horizontaal" height={28} />
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-ink-500">Privacybeleid</h1>
        <p className="mt-2 text-sm text-ink-400">Laatst bijgewerkt: 27 augustus 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-ink-500 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-500 [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-ink-400 [&_li]:text-ink-400 [&_a]:text-teal-600 [&_a]:font-medium">
          <p>
            Caribbean Bar Uitgeest / Feest aan het Water (&ldquo;wij&rdquo;) gebruikt dit offerteportaal om
            offertes op te stellen, te versturen en digitaal te laten ondertekenen. Hierbij
            verwerken wij persoonsgegevens. Dit beleid legt uit welke gegevens dat zijn, waarom we
            ze verwerken en welke rechten je hebt.
          </p>

          <h2>Welke gegevens verzamelen we</h2>
          <ul>
            <li>Naam, e-mailadres, telefoonnummer en (indien relevant) adres van de klant/aanvrager;</li>
            <li>Inhoud van reacties die op een offerte worden achtergelaten;</li>
            <li>
              Bij het digitaal ondertekenen van een offerte: naam, e-mailadres, een afbeelding van
              de handtekening, IP-adres, browser/apparaatgegevens en tijdstip — dit vormt het
              wettelijk bewijs van de ondertekening (eIDAS-verordening);
            </li>
            <li>Technische gegevens zoals IP-adres bij het bekijken van een offerte, voor beveiliging en misbruikpreventie.</li>
          </ul>

          <h2>Waarom we deze gegevens verwerken</h2>
          <p>
            Om een offerte op te stellen, te versturen, op te volgen en (na ondertekening) uit te
            voeren, om contact te onderhouden over een lopende aanvraag, en om onze wettelijke
            administratie- en boekhoudverplichtingen na te komen.
          </p>

          <h2>Grondslag</h2>
          <p>
            De verwerking is nodig voor de uitvoering van de overeenkomst (of de stappen die
            daaraan voorafgaan, zoals het opstellen van een offerte), of berust op ons
            gerechtvaardigd belang (bijvoorbeeld het versturen van een herinnering over een
            openstaande offerte).
          </p>

          <h2>Hoe lang we gegevens bewaren</h2>
          <p>
            We bewaren offerte- en klantgegevens zolang dat nodig is voor de hierboven genoemde
            doeleinden, en in elk geval zo lang als de wettelijke bewaartermijn voor onze
            fiscale/boekhoudkundige administratie dat vereist.
          </p>

          <h2>Wie heeft toegang</h2>
          <p>
            Alleen medewerkers van Caribbean Bar Uitgeest met een eigen account in dit portaal
            hebben toegang, uitsluitend tot gegevens binnen onze eigen organisatie. Daarnaast
            maken we gebruik van de volgende verwerkers, met wie een verwerkersovereenkomst is
            (of wordt) afgesloten:
          </p>
          <ul>
            <li><strong>Supabase</strong> — hosting van de database, opslag van bestanden en inlogbeheer;</li>
            <li><strong>Resend</strong> — verzending van e-mailnotificaties.</li>
          </ul>

          <h2>Jouw rechten</h2>
          <p>
            Je hebt het recht op inzage, correctie en verwijdering van je persoonsgegevens, en het
            recht om bezwaar te maken tegen bepaalde verwerkingen. Neem hiervoor contact met ons op
            via onderstaand adres.
          </p>

          <h2>Beveiliging</h2>
          <p>
            We beschermen persoonsgegevens onder meer met toegangsbeveiliging per organisatie
            (Row Level Security), niet-te-raden beveiligde offertelinks, en beperkte, uitsluitend
            server-side toegang tot gevoelige gegevens.
          </p>

          <h2>Contact en klachten</h2>
          <p>
            Vragen over dit privacybeleid of over hoe we met je gegevens omgaan? Neem contact met
            ons op. Ben je het niet eens met hoe we je klacht hebben afgehandeld, dan kun je een
            klacht indienen bij de Autoriteit Persoonsgegevens.
          </p>

          <p>
            Op offertes zijn daarnaast de algemene voorwaarden van de organisatie die de offerte
            heeft opgesteld van toepassing, zoals vermeld op de offerte zelf.
          </p>
        </div>
      </div>
    </div>
  );
}
