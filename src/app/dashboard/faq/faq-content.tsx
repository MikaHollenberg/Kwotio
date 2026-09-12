"use client";

import { useState } from "react";
import {
  ChevronDown,
  PlayCircle,
  Lock,
  AlertTriangle,
  Copy,
  Repeat,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFaqWalkthrough, type FaqStep, type FaqWalkthroughPlan } from "@/components/dashboard/faq-walkthrough";
import { createDemoQuoteForFaq, deleteQuote } from "@/app/dashboard/offertes/actions";
import { createDemoTemplateForFaq, deleteTemplateFromList } from "@/app/dashboard/templates/actions";
import { createDemoRequestForFaq, deleteQuoteRequest } from "@/app/dashboard/aanvragen/actions";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  /** Aanwezig = deze vraag heeft een "Laat zien"-stappenplan. Een functie
   * mag eerst iets aanmaken (bijv. een tijdelijke voorbeeldofferte) voordat
   * de stappen zelf bekend zijn -- zie FaqWalkthroughProvider. */
  walkthrough?: FaqStep[] | (() => Promise<FaqWalkthroughPlan>);
  /** Stappenplan leidt naar Instellingen -- alleen voor Eigenaar/Admin. */
  adminOnly?: boolean;
};

type FaqCategory = { title: string; items: FaqItem[] };

// ---------------------------------------------------------------------------
// Stappenplannen die eerst een tijdelijke voorbeeldofferte/-template/
// -aanvraag aanmaken, zodat er écht iets te spotlighten valt (i.p.v. een
// lege lijst) -- worden na afloop (Klaar/Sluiten) weer automatisch
// opgeruimd, zie FaqWalkthroughProvider's `cleanup`.
// ---------------------------------------------------------------------------

async function newQuoteWalkthrough(): Promise<FaqWalkthroughPlan> {
  const quoteId = await createDemoQuoteForFaq();
  return {
    steps: [
      {
        href: "/dashboard/offertes",
        selector: '[data-faq-id="new-quote-button"]',
        title: "Nieuwe offerte",
        description: "Klik hier om een nieuwe offerte te starten.",
      },
      {
        href: "/dashboard/offertes/nieuw",
        selector: '[data-faq-id="new-quote-form"]',
        title: "Titel, klant en template",
        description:
          "Kies hier een template (de blokken staan dan al klaar) of laat 'm leeg om vanaf nul te beginnen. Klik daarna op 'Offerte aanmaken' om naar de editor te gaan.",
      },
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-header-card"]',
        title: "Kop van de offerte",
        description:
          "Organisatie- en klantgegevens, wie de offerte behandelt, eventdatum en prijsweergave (incl./excl. btw, totaal/per persoon) -- dit staat automatisch bovenaan elke offerte.",
      },
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-block-list"]',
        title: "De inhoud: blokken",
        description:
          "De offerte bestaat uit blokken die je hier ziet. Klik een blok open om 'm te bewerken, versleep 'm om de volgorde te wijzigen, of verwijder 'm.",
      },
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-add-block-button"]',
        title: "Blok toevoegen",
        description:
          "Kies hier een bloktype (tekst, pakketten & prijzen, foto's, tijdlijn, etc.) of een eigen opgeslagen blok-template om snel te starten.",
      },
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-preview-panel"]',
        title: "Live preview",
        description: "Rechts zie je meteen hoe de offerte er voor de klant uitziet, ook op mobiel.",
      },
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-send-button"]',
        title: "Offerte aanmaken / versturen",
        description: "Klaar met bewerken? Klik hier om de offerte te versturen naar de klant.",
      },
    ],
    cleanup: () => deleteQuote(quoteId),
  };
}

async function sendQuoteWalkthrough(): Promise<FaqWalkthroughPlan> {
  const quoteId = await createDemoQuoteForFaq({ sent: true });
  return {
    steps: [
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-share-bar"]',
        title: "De deelbalk",
        description:
          "Zodra een offerte niet meer een concept is (zoals deze), verschijnt bovenin de editor deze balk met de deelbare link, plus knoppen om die te kopiëren of direct via WhatsApp te versturen.",
      },
    ],
    cleanup: () => deleteQuote(quoteId),
  };
}

async function duplicateQuoteWalkthrough(): Promise<FaqWalkthroughPlan> {
  const quoteId = await createDemoQuoteForFaq();
  return {
    steps: [
      {
        href: "/dashboard/offertes",
        selector: `[data-faq-id="duplicate-quote-button-${quoteId}"]`,
        title: "Dupliceren",
        description:
          "Elke offerte heeft in de actiekolom dit kopieer-icoontje naast bewerken en verwijderen. Klik erop voor een nieuwe conceptversie met dezelfde inhoud, maar zonder klantkoppeling.",
      },
    ],
    cleanup: () => deleteQuote(quoteId),
  };
}

async function quoteViewedWalkthrough(): Promise<FaqWalkthroughPlan> {
  const quoteId = await createDemoQuoteForFaq();
  return {
    steps: [
      {
        href: `/dashboard/offertes/${quoteId}`,
        selector: '[data-faq-id="quote-engagement-card"]',
        title: "Activiteit",
        description:
          "Deze kaart toont of en wanneer de klant de offerte voor het laatst bekeken heeft, welke secties, en of er al reacties zijn.",
      },
    ],
    cleanup: () => deleteQuote(quoteId),
  };
}

async function newTemplateWalkthrough(): Promise<FaqWalkthroughPlan> {
  const templateId = await createDemoTemplateForFaq();
  return {
    steps: [
      {
        href: "/dashboard/templates",
        selector: '[data-faq-id="new-template-button"]',
        title: "Nieuw template",
        description: "Klik hier om een nieuw template te starten.",
      },
      {
        href: `/dashboard/templates/${templateId}`,
        selector: '[data-faq-id="template-block-list"]',
        title: "De inhoud: blokken",
        description: "Precies zoals bij een offerte bouw je de template op met blokken die je kan bewerken en verslepen.",
      },
      {
        href: `/dashboard/templates/${templateId}`,
        selector: '[data-faq-id="template-add-block-button"]',
        title: "Blok toevoegen",
        description: "Kies hier een bloktype -- eenmaal goed ingevuld, gebruik je 'm steeds opnieuw vanuit dit template.",
      },
      {
        href: `/dashboard/templates/${templateId}`,
        selector: '[data-faq-id="template-preview-panel"]',
        title: "Live preview",
        description: "Zie meteen hoe elke offerte die van dit template gebruikmaakt, eruit gaat zien.",
      },
    ],
    cleanup: () => deleteTemplateFromList(templateId),
  };
}

async function publicTemplateWalkthrough(): Promise<FaqWalkthroughPlan> {
  const templateId = await createDemoTemplateForFaq();
  return {
    steps: [
      {
        href: `/dashboard/templates/${templateId}`,
        selector: '[data-faq-id="template-public-toggle"]',
        title: "Publiek zichtbaar",
        description:
          "Zet deze schakelaar aan om de template te tonen op je publieke offertepagina, waar bezoekers 'm zonder in te loggen kunnen bekijken en een aanvraag kunnen indienen.",
      },
    ],
    cleanup: () => deleteTemplateFromList(templateId),
  };
}

async function convertRequestWalkthrough(): Promise<FaqWalkthroughPlan> {
  const requestId = await createDemoRequestForFaq();
  return {
    steps: [
      {
        href: `/dashboard/aanvragen/${requestId}`,
        selector: '[data-faq-id="convert-request-button"]',
        title: "Omzetten naar offerte",
        description:
          "Klik hier en er wordt automatisch een nieuwe conceptofferte aangemaakt met de gegevens van deze aanvraag.",
      },
    ],
    cleanup: () => deleteQuoteRequest(requestId),
  };
}

const CATEGORIES: FaqCategory[] = [
  {
    title: "Aan de slag",
    items: [
      {
        id: "restart-tour",
        question: "Hoe start ik de rondleiding door de app opnieuw?",
        answer:
          "Boven in beeld staat een knop 'Rondleiding' -- die start altijd opnieuw dezelfde stap-voor-stap rondleiding langs alle pagina's, ook als je 'm al eerder hebt gezien of overgeslagen.",
        walkthrough: [
          {
            selector: '[data-faq-id="restart-tour-button"]',
            title: "Rondleiding",
            description: "Klik hier om de rondleiding opnieuw te starten, wanneer je maar wilt.",
          },
        ],
      },
      {
        id: "roles",
        question: "Wat is het verschil tussen de rollen (Eigenaar, Admin, Teamlid, Alleen-lezen)?",
        answer: "roles-table",
      },
    ],
  },
  {
    title: "Offertes",
    items: [
      {
        id: "new-quote",
        question: "Hoe maak ik een nieuwe offerte, en hoe vul ik de inhoud in?",
        answer:
          "Ga naar Offertes en klik op 'Nieuwe offerte'. Kies een template (dan staan de blokken al klaar) of begin leeg. Daarna kom je in de editor: kop, blokken (tekst, pakketten & prijzen, foto's, etc.), een live preview, en tot slot de knop om te versturen.",
        walkthrough: newQuoteWalkthrough,
      },
      {
        id: "send-quote",
        question: "Hoe verstuur ik een offerte naar een klant (link of WhatsApp)?",
        answer:
          "Open de offerte in de editor. Zodra 'm niet meer een concept is, verschijnt bovenaan een balk met de deelbare link, plus knoppen om die te kopiëren of direct via WhatsApp te versturen.",
        walkthrough: sendQuoteWalkthrough,
      },
      {
        id: "duplicate-quote",
        question: "Hoe dupliceer ik een bestaande offerte?",
        answer:
          "In de offertes-lijst staat naast elke offerte een kopieer-icoontje (naast bewerken en verwijderen). Dat maakt een nieuwe conceptversie met dezelfde inhoud, maar zonder klantkoppeling -- handig voor een vergelijkbare nieuwe klant.",
        walkthrough: duplicateQuoteWalkthrough,
      },
      {
        id: "quote-viewed",
        question: "Hoe zie ik of een klant mijn offerte al bekeken heeft?",
        answer:
          "Open de offerte -- de kaart 'Activiteit' toont of en wanneer de klant 'm voor het laatst bekeken heeft, plus alle andere gebeurtenissen (reacties, ondertekening, etc.).",
        walkthrough: quoteViewedWalkthrough,
      },
    ],
  },
  {
    title: "Templates",
    items: [
      {
        id: "new-template",
        question: "Hoe maak ik een template, en hoe vul ik de inhoud in?",
        answer:
          "Ga naar Templates en klik op 'Nieuw template'. Bouw 'm op met blokken -- precies zoals een offerte, maar herbruikbaar voor toekomstige klanten, met een eigen live preview.",
        walkthrough: newTemplateWalkthrough,
      },
      {
        id: "public-template",
        question: "Hoe zet ik een template publiek zichtbaar, zodat klanten 'm kunnen aanvragen?",
        answer:
          "Open een template en vink bovenin de editor 'Publiek zichtbaar' aan. De template verschijnt dan op je publieke offertepagina, waar bezoekers 'm kunnen bekijken en een aanvraag kunnen indienen.",
        walkthrough: publicTemplateWalkthrough,
      },
    ],
  },
  {
    title: "Offerte-aanvragen",
    items: [
      {
        id: "convert-request",
        question: "Hoe zet ik een offerte-aanvraag om in een echte offerte?",
        answer:
          "Open de aanvraag bij Offerte-aanvragen en klik op 'Omzetten naar offerte' -- de klantgegevens en het gekozen template worden automatisch overgenomen in een nieuwe conceptofferte.",
        walkthrough: convertRequestWalkthrough,
      },
      {
        id: "request-icons",
        question: "Wat betekenen de gekleurde icoontjes bij een aanvraag?",
        answer: "request-icons-explainer",
      },
    ],
  },
  {
    title: "Instellingen",
    items: [
      {
        id: "company-info",
        question: "Hoe stel ik mijn bedrijfsgegevens, logo's en publieke link in?",
        answer:
          "Ga naar Instellingen -- bovenaan vind je de kaart 'Organisatie' met bedrijfsgegevens, logo's en je publieke offertepagina (inclusief downloadbare QR-code).",
        adminOnly: true,
        walkthrough: [
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-organisatie"]',
            title: "Organisatie",
            description: "Bedrijfsgegevens, adres, contactgegevens en huisstijlkleuren stel je hier in.",
          },
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-logo-upload"]',
            title: "Logo's",
            description:
              "Upload een horizontaal logo (voor de menubalk) en/of een vierkant logo (voor offertes/PDF's).",
          },
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-public-link"]',
            title: "Publieke offertepagina",
            description:
              "Hier stel je je eigen link in en kan je een QR-code downloaden om te printen of te delen.",
          },
        ],
      },
      {
        id: "invite-member",
        question: "Hoe nodig ik een teamlid uit?",
        answer:
          "Ga naar Instellingen -- bij 'Team & rechten' vul je een e-mailadres en een rol in en klik je op uitnodigen.",
        adminOnly: true,
        walkthrough: [
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-team"]',
            title: "Team & rechten",
            description: "Hier zie je alle teamleden en kan je hun rol wijzigen of ze verwijderen.",
          },
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-invite-form"]',
            title: "Nieuw teamlid uitnodigen",
            description: "Vul een e-mailadres en een rol in en klik op 'Uitnodigen'.",
          },
        ],
      },
      {
        id: "email-automation",
        question: "Hoe werkt e-mailautomatisering (herinneringen, review-aanvraag, terugboek-herinnering)?",
        answer:
          "Ga naar Instellingen -- bij 'E-mailautomatisering' maak je regels: op welk moment (bijv. dagen na verzenden zonder reactie) welke e-mail automatisch naar de klant gaat.",
        adminOnly: true,
        walkthrough: [
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-email-automatisering"]',
            title: "E-mailautomatisering",
            description: "Hier beheer je automatische klant-e-mails: wanneer ze verstuurd worden en wat erin staat.",
          },
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-new-email-rule-button"]',
            title: "Nieuwe e-mail-regel",
            description:
              "Klik op 'Nieuwe e-mail' om een regel te maken: kies het triggermoment (bijv. dagen na verzenden zonder reactie, of dagen na de evenementdatum voor een review-aanvraag), het aantal dagen, en schrijf je eigen onderwerp/inhoud.",
          },
        ],
      },
      {
        id: "closed-dates",
        question: "Hoe stel ik gesloten dagen in?",
        answer:
          "Ga naar Instellingen -- bij 'Gesloten dagen' voeg je data toe waarop je dicht bent. Klanten kunnen die datum dan niet meer kiezen op de publieke aanvraagpagina.",
        adminOnly: true,
        walkthrough: [
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-gesloten-dagen"]',
            title: "Gesloten dagen",
            description: "Hier zie je alle ingestelde gesloten dagen, elk met een verwijderknop.",
          },
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-closed-dates-form"]',
            title: "Datum toevoegen",
            description: "Kies een datum, geef optioneel een reden op (bijv. 'Kerstvakantie') en klik op 'Toevoegen'.",
          },
        ],
      },
      {
        id: "export-data",
        question: "Hoe exporteer ik al mijn gegevens?",
        answer:
          "Ga naar Instellingen -- bij 'Data exporteren' download je je klanten, offertes en templates als CSV-bestand.",
        adminOnly: true,
        walkthrough: [
          {
            href: "/dashboard/instellingen",
            selector: '[data-faq-id="settings-data-exporteren"]',
            title: "Data exporteren",
            description: "Download hier al je klant-, offerte- en templategegevens als CSV.",
          },
        ],
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        id: "forgot-password",
        question: "Ik ben mijn wachtwoord vergeten, wat nu?",
        answer: "forgot-password-answer",
      },
    ],
  },
];

function RolesTable() {
  const rows = [
    { role: "Eigenaar / Admin", access: "Alles, inclusief Instellingen en Statistieken" },
    { role: "Teamlid", access: "Offertes, klanten, aanvragen en templates -- geen Instellingen of Statistieken" },
    { role: "Alleen-lezen", access: "Kan overal alleen kijken, nergens wijzigen" },
  ];
  return (
    <div className="overflow-x-auto rounded-brand-sm border border-ink-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-sand-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
            <th className="px-4 py-2">Rol</th>
            <th className="px-4 py-2">Kan</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.role} className="border-b border-ink-50 last:border-0">
              <td className="px-4 py-2 font-medium text-ink-500">{r.role}</td>
              <td className="px-4 py-2 text-ink-400">{r.access}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestIconsExplainer() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="size-4 shrink-0 text-orange-500" />
        <span>Oranje driehoekje: deze aanvraag staat al langer dan 48 uur niet opgepakt.</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Copy className="size-4 shrink-0 text-indigo-500" />
        <span>Paars kopieer-icoon: mogelijk een dubbele aanvraag -- hetzelfde e-mailadres diende kort na elkaar 2x in.</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Repeat className="size-4 shrink-0 text-teal-600" />
        <span>Op het aanvraag-detailscherm: een terugkerende-klant-melding als dit e-mailadres al eerder aanvroeg of boekte.</span>
      </div>
    </div>
  );
}

function AnswerBody({ item }: { item: FaqItem }) {
  if (item.answer === "roles-table") return <RolesTable />;
  if (item.answer === "request-icons-explainer") return <RequestIconsExplainer />;
  if (item.answer === "forgot-password-answer") {
    return (
      <p>
        Klik op het inlogscherm op &quot;Wachtwoord vergeten?&quot; en vul je e-mailadres in -- je ontvangt dan een
        link om een nieuw wachtwoord in te stellen. Kom je er niet uit, vraag dan je eigenaar/admin om een nieuwe
        uitnodiging te sturen via Instellingen → Team &amp; rechten.
      </p>
    );
  }
  return <p>{item.answer}</p>;
}

function FaqRow({ item, canManageOrg }: { item: FaqItem; canManageOrg: boolean }) {
  const [open, setOpen] = useState(false);
  const { start, preparing } = useFaqWalkthrough();
  const locked = item.adminOnly && !canManageOrg;

  return (
    <div className="border-b border-ink-50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
      >
        <span className="text-sm font-medium text-ink-500">{item.question}</span>
        <ChevronDown className={cn("size-4 shrink-0 text-ink-300 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 pb-4 text-sm text-ink-400">
          <AnswerBody item={item} />
          {item.walkthrough && (
            <div>
              <Button
                variant="outline"
                size="sm"
                disabled={locked || preparing}
                onClick={() => item.walkthrough && start(item.walkthrough)}
              >
                {locked ? <Lock className="size-3.5" /> : <PlayCircle className="size-3.5" />}
                {locked ? "Alleen voor Eigenaar/Admin" : preparing ? "Bezig…" : "Laat zien"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FaqContent({ canManageOrg }: { canManageOrg: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-400">Veelgestelde vragen</p>
        <h2 className="font-display text-2xl font-semibold text-ink-500">Help &amp; FAQ</h2>
        <p className="mt-1 text-sm text-ink-400">
          Klik een vraag open. Staat er een &quot;Laat zien&quot;-knop bij, dan loopt Kwotio de stappen live met je
          door, net als de rondleiding -- inclusief het écht doorlopen van een offerte/template waar nodig.
        </p>
      </div>

      {CATEGORIES.map((category) => (
        <Card key={category.title}>
          <CardHeader>
            <CardTitle>{category.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-ink-50 pt-0">
            {category.items.map((item) => (
              <FaqRow key={item.id} item={item} canManageOrg={canManageOrg} />
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
