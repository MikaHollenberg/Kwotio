import type { Metadata } from "next";
import Link from "next/link";
import { KwotioLogo } from "@/components/brand/kwotio-logo";

export const metadata: Metadata = { title: "Privacybeleid" };

// Concept — nog door de organisatie (en desgewenst een jurist) na te laten
// lopen voordat dit als definitief privacybeleid wordt gecommuniceerd. Geen
// juridisch advies.
//
// Dit is één centrale, platform-brede pagina (gelinkt vanaf de publieke
// offertepagina en het dashboard van élke organisatie op Kwotio) — daarom
// bewust generiek gehouden ("de organisatie", "Kwotio") i.p.v. toegespitst op
// één specifieke klant van het platform.
export default function PrivacybeleidPage() {
  return (
    <div className="min-h-screen bg-sand-100 px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/" className="inline-block">
          <KwotioLogo height={32} />
        </Link>

        <h1 className="mt-8 font-display text-3xl font-semibold text-ink-500">Privacybeleid</h1>
        <p className="mt-2 text-sm text-ink-400">Laatst bijgewerkt: 27 augustus 2026</p>

        <div className="prose prose-sm mt-8 max-w-none text-ink-500 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-500 [&_h2]:mt-8 [&_h2]:mb-2 [&_p]:text-ink-400 [&_li]:text-ink-400 [&_a]:text-teal-600 [&_a]:font-medium">
          <p>
            Kwotio is het platform waarmee de organisatie waarvan je een offerte hebt ontvangen
            (&ldquo;de organisatie&rdquo;) offertes opstelt, verstuurt en digitaal laat
            ondertekenen. Hierbij worden persoonsgegevens verwerkt. Dit beleid legt uit welke
            gegevens dat zijn, waarom ze verwerkt worden, en welke rechten je hebt.
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
            voeren, om contact te onderhouden over een lopende aanvraag, en om aan wettelijke
            administratie- en boekhoudverplichtingen te voldoen.
          </p>

          <h2>Grondslag</h2>
          <p>
            De verwerking is nodig voor de uitvoering van de overeenkomst (of de stappen die
            daaraan voorafgaan, zoals het opstellen van een offerte), of berust op een
            gerechtvaardigd belang (bijvoorbeeld het versturen van een herinnering over een
            openstaande offerte).
          </p>

          <h2>Hoe lang we gegevens bewaren</h2>
          <p>
            Offerte- en klantgegevens worden bewaard zolang dat nodig is voor de hierboven
            genoemde doeleinden, en in elk geval zo lang als de wettelijke bewaartermijn voor de
            fiscale/boekhoudkundige administratie van de organisatie dat vereist.
          </p>

          <h2>Wie heeft toegang</h2>
          <p>
            Alleen medewerkers van de organisatie met een eigen account in dit portaal hebben
            toegang, uitsluitend tot gegevens binnen hun eigen organisatie — nooit tot gegevens van
            een andere organisatie op het platform. Daarnaast maakt Kwotio, als aanbieder van dit
            platform, gebruik van de volgende verwerkers, met wie een verwerkersovereenkomst is
            (of wordt) afgesloten:
          </p>
          <ul>
            <li><strong>Supabase</strong> — hosting van de database, opslag van bestanden en inlogbeheer;</li>
            <li><strong>Resend</strong> — verzending van e-mailnotificaties.</li>
          </ul>

          <h2>Jouw rechten</h2>
          <p>
            Je hebt het recht op inzage, correctie en verwijdering van je persoonsgegevens, en het
            recht om bezwaar te maken tegen bepaalde verwerkingen. Neem hiervoor contact op met de
            organisatie waarvan je de offerte hebt ontvangen.
          </p>

          <h2>Beveiliging</h2>
          <p>
            Persoonsgegevens worden onder meer beschermd met toegangsbeveiliging per organisatie
            (Row Level Security), niet-te-raden beveiligde offertelinks, en beperkte, uitsluitend
            server-side toegang tot gevoelige gegevens.
          </p>

          <h2>Contact en klachten</h2>
          <p>
            Vragen over dit privacybeleid of over hoe er met je gegevens wordt omgegaan? Neem
            contact op met de organisatie waarvan je de offerte hebt ontvangen. Ben je het niet
            eens met hoe je klacht is afgehandeld, dan kun je een klacht indienen bij de Autoriteit
            Persoonsgegevens.
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
