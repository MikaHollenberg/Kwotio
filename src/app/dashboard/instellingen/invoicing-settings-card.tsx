"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUploadField } from "@/components/builder/image-upload-field";
import { updateInvoicingDefaults, updateMollieApiKey, clearMollieApiKey, updateInvoiceExtraLogos } from "./invoicing-actions";

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-60";

export function InvoicingSettingsCard({
  canEdit,
  organizationId,
  initialPrefix,
  initialDueDays,
  initialAutoSend,
  initialReminderEnabled,
  initialVatRateHigh,
  initialVatRateLow,
  initialExtraLogoUrls,
  maskedMollieKey,
  hasBtwOrKvk,
}: {
  canEdit: boolean;
  organizationId: string;
  initialPrefix: string;
  initialDueDays: number;
  initialAutoSend: boolean;
  initialReminderEnabled: boolean;
  initialVatRateHigh: number;
  initialVatRateLow: number;
  initialExtraLogoUrls: string[];
  /** Server-side berekende gemaskeerde weergave (bv. "•••• 4f2a") of `null`
   * -- de echte sleutel bereikt deze client-component nooit. */
  maskedMollieKey: string | null;
  hasBtwOrKvk: boolean;
}) {
  const [prefix, setPrefix] = useState(initialPrefix);
  const [dueDays, setDueDays] = useState(String(initialDueDays));
  const [autoSend, setAutoSend] = useState(initialAutoSend);
  const [reminderEnabled, setReminderEnabled] = useState(initialReminderEnabled);
  const [vatRateHigh, setVatRateHigh] = useState(String(initialVatRateHigh));
  const [vatRateLow, setVatRateLow] = useState(String(initialVatRateLow));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [extraLogos, setExtraLogos] = useState<string[]>([initialExtraLogoUrls[0] ?? "", initialExtraLogoUrls[1] ?? ""]);
  const [logosPending, startLogosTransition] = useTransition();

  function updateExtraLogo(index: 0 | 1, url: string) {
    const next: string[] = [...extraLogos];
    next[index] = url;
    setExtraLogos(next);
    startLogosTransition(() => updateInvoiceExtraLogos(next));
  }

  const [showMollieInput, setShowMollieInput] = useState(false);
  const [mollieKeyInput, setMollieKeyInput] = useState("");
  const [molliePending, startMollieTransition] = useTransition();
  const [mollieError, setMollieError] = useState<string | null>(null);

  function saveDefaults() {
    setSaved(false);
    setError(null);
    startTransition(async () => {
      try {
        await updateInvoicingDefaults({
          invoiceNumberPrefix: prefix,
          invoiceDueDays: Number(dueDays) || 14,
          invoiceAutoSend: autoSend,
          invoiceReminderEnabled: reminderEnabled,
          invoiceVatRateHigh: Number(vatRateHigh) || 21,
          invoiceVatRateLow: Number(vatRateLow) || 9,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  function saveMollieKey() {
    setMollieError(null);
    if (!mollieKeyInput.trim()) {
      setMollieError("Vul een geldige sleutel in.");
      return;
    }
    startMollieTransition(async () => {
      try {
        await updateMollieApiKey(mollieKeyInput.trim());
        setMollieKeyInput("");
        setShowMollieInput(false);
      } catch (err) {
        setMollieError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  function removeMollieKey() {
    startMollieTransition(() => clearMollieApiKey());
  }

  return (
    <Card data-faq-id="settings-facturatie">
      <CardHeader>
        <div>
          <CardTitle>Facturatie</CardTitle>
          <CardDescription>
            Instellingen voor de factuurmodule: nummering, vervaltermijn, automatisch versturen en de
            Mollie-koppeling voor online betalen.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {!hasBtwOrKvk && (
          <p className="rounded-brand-sm bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            Vul bij &quot;Organisatie&quot; hierboven ook je KvK- en btw-nummer in — die zijn wettelijk verplicht op
            elke factuur.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Factuurnummer-voorvoegsel (optioneel)
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
              disabled={!canEdit}
              placeholder="bijv. CB"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Standaard vervaltermijn (dagen)
            <input
              type="number"
              min={1}
              value={dueDays}
              onChange={(e) => setDueDays(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Hoog btw-tarief (%)
            <input
              type="number"
              step="0.01"
              value={vatRateHigh}
              onChange={(e) => setVatRateHigh(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Laag btw-tarief (%)
            <input
              type="number"
              step="0.01"
              value={vatRateLow}
              onChange={(e) => setVatRateLow(e.target.value)}
              disabled={!canEdit}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input type="checkbox" checked={autoSend} onChange={(e) => setAutoSend(e.target.checked)} disabled={!canEdit} />
          Facturen direct automatisch versturen bij aanmaken (anders: pas na handmatige bevestiging)
        </label>

        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input
            type="checkbox"
            checked={reminderEnabled}
            onChange={(e) => setReminderEnabled(e.target.checked)}
            disabled={!canEdit}
          />
          Automatische herinneringsmail bij een verlopen vervaldatum
        </label>

        {canEdit && (
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" size="sm" onClick={saveDefaults} disabled={pending}>
              {pending ? "Bezig…" : "Opslaan"}
            </Button>
            {saved && <span className="text-xs text-teal-700">Opgeslagen</span>}
            {error && <span className="text-xs text-red-600">{error}</span>}
          </div>
        )}

        <div className="border-t border-ink-100 pt-4">
          <p className="text-xs font-semibold text-ink-400">Mollie-koppeling (betaallink op facturen)</p>
          <p className="mt-1 text-xs text-ink-400">
            Elke organisatie koppelt haar eigen Mollie-account. Betalingen komen dan rechtstreeks op jouw eigen
            rekening binnen, niet op die van Kwotio.
          </p>

          {!showMollieInput ? (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-sm text-ink-500">
                {maskedMollieKey ? `API-sleutel: ${maskedMollieKey}` : "Niet ingesteld"}
              </span>
              {canEdit && (
                <>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowMollieInput(true)}>
                    {maskedMollieKey ? "Sleutel vervangen" : "Sleutel instellen"}
                  </Button>
                  {maskedMollieKey && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      disabled={molliePending}
                      onClick={removeMollieKey}
                    >
                      Verwijderen
                    </Button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
                Nieuwe API-sleutel
                <input
                  type="password"
                  value={mollieKeyInput}
                  onChange={(e) => setMollieKeyInput(e.target.value)}
                  placeholder="test_... of live_..."
                  className={inputClass}
                />
              </label>
              <Button type="button" variant="outline" size="sm" onClick={saveMollieKey} disabled={molliePending}>
                {molliePending ? "Bezig…" : "Opslaan"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowMollieInput(false);
                  setMollieKeyInput("");
                }}
              >
                Annuleren
              </Button>
            </div>
          )}
          {mollieError && <p className="mt-1 text-xs text-red-600">{mollieError}</p>}
        </div>

        <div className="border-t border-ink-100 pt-4">
          <p className="text-xs font-semibold text-ink-400">Extra logo&apos;s op de factuur (max. 2)</p>
          <p className="mt-1 text-xs text-ink-400">
            Naast je hoofdlogo — bv. voor een zusterbedrijf of afdeling. Samen met het hoofdlogo komen er zo tot 3
            logo&apos;s op de factuurkop.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {[0, 1].map((index) => (
              <ImageUploadField
                key={index}
                value={extraLogos[index] ?? ""}
                onChange={(url) => canEdit && updateExtraLogo(index as 0 | 1, url)}
                organizationId={organizationId}
                aspect="aspect-[3/1]"
                label={`Logo ${index + 1}`}
                fit="contain"
              />
            ))}
          </div>
          {logosPending && <p className="mt-1 text-xs text-ink-400">Opslaan…</p>}
        </div>
      </CardContent>
    </Card>
  );
}
