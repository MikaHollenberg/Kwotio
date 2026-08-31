/**
 * Lichtgewicht i18n voor de klant-facing offertepagina (sectie 3.10).
 * Vertaalt alleen de UI-chrome (knoppen, labels, formulieren) — vrije tekst
 * die het bureau zelf in blokken schrijft (pakketbeschrijvingen, voorwaarden)
 * wordt niet automatisch vertaald.
 */

export type Lang = "nl" | "en";

const dict = {
  status_verzonden: { nl: "Verzonden", en: "Sent" },
  status_bekeken: { nl: "Bekeken", en: "Viewed" },
  status_in_overleg: { nl: "In overleg", en: "In discussion" },
  status_geaccepteerd: { nl: "Geaccepteerd", en: "Accepted" },
  status_verlopen: { nl: "Verlopen", en: "Expired" },
  status_geweigerd: { nl: "Geweigerd", en: "Declined" },
  expired_banner: {
    nl: "De geldigheidsdatum van deze offerte is verstreken. Neem contact op voor een actuele versie.",
    en: "This quote's validity date has passed. Please get in touch for an up-to-date version.",
  },

  price_incl_btw: { nl: "incl. btw", en: "incl. VAT" },
  price_excl_btw: { nl: "excl. btw", en: "excl. VAT" },
  total_label: { nl: "Totaal", en: "Total" },
  extra_options: { nl: "Extra opties", en: "Extra options" },
  per_item: { nl: "/ stuk", en: "/ item" },
  most_chosen: { nl: "Meest gekozen", en: "Most popular" },
  no_photos: { nl: "Nog geen foto's toegevoegd.", en: "No photos added yet." },
  packages_pdf_attachment: { nl: "Download bijlage (PDF)", en: "Download attachment (PDF)" },
  packages_pdf_attachment_named: { nl: "Download {name} (PDF)", en: "Download {name} (PDF)" },
  choose_up_to_packages: { nl: "Kies maximaal {count} pakketten", en: "Choose up to {count} packages" },

  accept_and_sign: { nl: "Akkoord & ondertekenen", en: "Approve & sign" },
  sign_coming_note: {
    nl: "Digitaal ondertekenen komt er zeer binnenkort aan — laat gerust alvast een reactie achter.",
    en: "Digital signing is coming very soon — feel free to leave a comment in the meantime.",
  },
  download_certificate: { nl: "Certificaat", en: "Certificate" },
  download_certificate_pdf: { nl: "Download certificaat (PDF)", en: "Download certificate (PDF)" },
  download_quote_pdf: { nl: "Offerte (PDF)", en: "Quote (PDF)" },

  ask_question: { nl: "Vraag stellen over dit onderdeel", en: "Ask a question about this section" },
  comment_count: { nl: "reactie", en: "comment" },
  comments_count: { nl: "reacties", en: "comments" },
  close: { nl: "Sluiten", en: "Close" },
  your_name: { nl: "Jouw naam", en: "Your name" },
  comment_placeholder: { nl: "Stel je vraag of laat een reactie achter…", en: "Ask your question or leave a comment…" },
  agency_name: { nl: "Feest aan het Water", en: "Feest aan het Water" },

  sign_modal_title: { nl: "Akkoord & ondertekenen", en: "Approve & sign" },
  full_name: { nl: "Volledige naam", en: "Full name" },
  email_address: { nl: "E-mailadres", en: "Email address" },
  sign_here: { nl: "Teken hier je handtekening", en: "Sign here" },
  redo: { nl: "Opnieuw", en: "Redo" },
  agree_prefix: { nl: "Ik ga akkoord met deze offerte en met de", en: "I agree to this quote and to the" },
  terms_link: { nl: "algemene voorwaarden", en: "terms and conditions" },
  agree_suffix: {
    nl: "van {org}, en bevestig dat ik bevoegd ben deze te ondertekenen.",
    en: "of {org}, and confirm that I am authorised to sign this.",
  },
  /** Gebruikt i.p.v. agree_prefix + terms_link + agree_suffix zolang de
   * organisatie nog geen eigen algemene voorwaarden heeft geüpload — dan
   * wordt de voorwaarden-verwijzing volledig weggelaten (zie
   * app/src/lib/legal.ts). */
  agree_no_terms: {
    nl: "Ik ga akkoord met deze offerte en bevestig dat ik bevoegd ben deze te ondertekenen.",
    en: "I agree to this quote and confirm that I am authorised to sign this.",
  },
  confirm_and_sign: { nl: "Bevestig & onderteken", en: "Confirm & sign" },
  signing_in_progress: { nl: "Bezig met ondertekenen…", en: "Signing…" },
  audit_note: {
    nl: "We leggen tijdstempel, IP-adres en documentkenmerk vast als juridisch bewijs (eIDAS SES).",
    en: "We record a timestamp, IP address and document fingerprint as legal evidence (eIDAS SES).",
  },
  sign_error_generic: { nl: "Teken je handtekening voordat je bevestigt.", en: "Please sign before confirming." },
  headcount_label: { nl: "Aantal personen", en: "Number of people" },
  headcount_placeholder: { nl: "bijv. 45", en: "e.g. 45" },

  request_changes: { nl: "Wijziging aanvragen", en: "Request changes" },
  request_changes_intro: {
    nl: "Laat weten wat je aangepast wilt hebben — het bureau neemt hierover contact met je op.",
    en: "Let us know what you'd like changed — the agency will get in touch with you about it.",
  },
  request_changes_placeholder: { nl: "Wat wil je aangepast hebben?", en: "What would you like changed?" },
  request_changes_submit: { nl: "Versturen", en: "Send" },
  request_changes_sending: { nl: "Bezig met versturen…", en: "Sending…" },
  request_changes_sent_title: { nl: "Verstuurd", en: "Sent" },
  request_changes_sent_body: {
    nl: "Je wijzigingsverzoek is verstuurd. Het bureau neemt contact met je op.",
    en: "Your change request has been sent. The agency will get in touch with you.",
  },
  decline_quote: { nl: "Afwijzen", en: "Decline" },
  decline_confirm_title: { nl: "Offerte afwijzen?", en: "Decline this quote?" },
  decline_confirm_description: {
    nl: "Weet je zeker dat je deze offerte wilt afwijzen? Het bureau wordt hiervan op de hoogte gesteld.",
    en: "Are you sure you want to decline this quote? The agency will be notified.",
  },
  decline_confirm_button: { nl: "Ja, afwijzen", en: "Yes, decline" },
  declined_banner: {
    nl: "Je hebt deze offerte afgewezen. Neem contact op als je van gedachten bent veranderd.",
    en: "You've declined this quote. Get in touch if you've changed your mind.",
  },

  thank_you: { nl: "Bedankt", en: "Thank you" },
  celebration_body: {
    nl: "Je offerte is ondertekend en bevestigd. Je ontvangt een e-mail met het ondertekeningscertificaat.",
    en: "Your quote has been signed and confirmed. You'll receive an email with the signing certificate.",
  },
  back_to_quote: { nl: "Terug naar de offerte", en: "Back to the quote" },

  footer_terms_prefix: { nl: "Op deze offerte zijn de", en: "This quote is subject to the" },
  footer_terms_suffix: {
    nl: "van {org} van toepassing.",
    en: "of {org}.",
  },
  privacy_link: { nl: "Privacybeleid", en: "Privacy policy" },

  access_gate_title: { nl: "Deze offerte is beveiligd", en: "This quote is protected" },
  access_gate_subtitle: {
    nl: "Voer de toegangscode in die je hebt ontvangen.",
    en: "Enter the access code you received.",
  },
  access_code_placeholder: { nl: "Toegangscode", en: "Access code" },
  access_code_error: { nl: "Onjuiste code, probeer het opnieuw.", en: "Incorrect code, please try again." },
  view_quote: { nl: "Bekijk offerte", en: "View quote" },
  busy: { nl: "Bezig…", en: "Loading…" },
} as const;

export type TranslationKey = keyof typeof dict;

export function t(key: TranslationKey, lang: Lang, vars?: Record<string, string>): string {
  let str = dict[key][lang] as string;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      str = str.replaceAll(`{${name}}`, value);
    }
  }
  return str;
}
