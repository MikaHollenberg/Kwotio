"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2, Smartphone, Monitor, Link2, Send, Unlink, Copy, Check, Languages } from "lucide-react";
import type { Database, PriceDisplayMode } from "@/lib/types/database";
import type { BlockDraft } from "@/lib/blocks/types";
import { newBlock } from "@/lib/blocks/types";
import {
  saveQuoteMeta,
  saveQuoteBlocksAction,
  deleteQuote,
  sendQuote,
  detachFromTemplate,
  translateQuoteBlocks,
} from "@/app/dashboard/offertes/actions";
import { useAutosave } from "@/hooks/use-autosave";
import { AutosaveIndicator } from "@/components/builder/autosave-indicator";
import { BlockList } from "@/components/builder/block-list";
import { AddBlockMenu } from "@/components/builder/add-block-menu";
import { QuotePreview } from "@/components/preview/quote-preview";
import { Button } from "@/components/ui/button";
import { QuoteStatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CommentsPanel } from "./comments-panel";
import { SignatureInfoCard } from "./signature-info-card";
import { EngagementCard } from "./engagement-card";
import type { QuoteEngagement } from "@/lib/stats/queries";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type Quote = Database["public"]["Tables"]["quotes"]["Row"];
type Client = { id: string; name: string; email: string | null } | null;
type Comment = Database["public"]["Tables"]["comments"]["Row"];
type Signature = Database["public"]["Tables"]["signatures"]["Row"];

export function QuoteEditor({
  quote,
  client,
  initialBlocks,
  initialComments,
  signature,
  engagement,
  organizationId,
}: {
  quote: Quote;
  client: Client;
  initialBlocks: BlockDraft[];
  initialComments: Comment[];
  signature: Signature | null;
  engagement: QuoteEngagement;
  organizationId: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(quote.title);
  const [eventDate, setEventDate] = useState(quote.event_date ?? "");
  const [validUntil, setValidUntil] = useState(quote.valid_until ?? "");
  const [priceDisplay, setPriceDisplay] = useState<PriceDisplayMode>(quote.price_display);
  const [discountAmount, setDiscountAmount] = useState(Number(quote.discount_amount));
  const [blocks, setBlocks] = useState<BlockDraft[]>(initialBlocks);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [hasTemplate, setHasTemplate] = useState(!!quote.template_id);
  const [status, setStatusLocal] = useState(quote.status);
  const [language, setLanguage] = useState(quote.language === "en" ? "en" : "nl");
  const [sending, startSendTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [translating, startTranslateTransition] = useTransition();
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [translateDone, setTranslateDone] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();

  const autosaveStatus = useAutosave(
    { title, eventDate, validUntil, priceDisplay, discountAmount, language, blocks },
    async (value) => {
      await Promise.all([
        saveQuoteMeta(quote.id, {
          title: value.title,
          eventDate: value.eventDate || null,
          validUntil: value.validUntil || null,
          priceDisplay: value.priceDisplay,
          discountAmount: value.discountAmount,
          language: value.language,
        }),
        saveQuoteBlocksAction(quote.id, value.blocks),
      ]);
    },
  );

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/offerte/${quote.share_token}` : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/offertes"
            className="flex size-9 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="font-display text-xl font-semibold text-ink-500 outline-none focus:border-b focus:border-teal-400"
              />
              <QuoteStatusBadge status={status} />
            </div>
            <div className="mt-0.5 flex items-center gap-3">
              <AutosaveIndicator status={autosaveStatus} />
              {client && <span className="text-xs text-ink-400">Klant: {client.name}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await detachFromTemplate(quote.id);
                setHasTemplate(false);
              }}
            >
              <Unlink className="size-4" /> Loskoppelen van template
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={translating}
            title="Vertaalt de huidige inhoud; vertaal opnieuw na wijzigingen."
            onClick={() =>
              startTranslateTransition(async () => {
                setTranslateError(null);
                setTranslateDone(false);
                const result = await translateQuoteBlocks(quote.id);
                if (result.ok) {
                  setTranslateDone(true);
                  setTimeout(() => setTranslateDone(false), 2500);
                } else {
                  setTranslateError(result.error);
                }
              })
            }
          >
            <Languages className="size-4" />
            {translating ? "Bezig met vertalen…" : translateDone ? "Vertaald ✓" : "Vertaal naar Engels"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={sending}
            onClick={() =>
              startSendTransition(async () => {
                await sendQuote(quote.id);
                setStatusLocal("verzonden");
              })
            }
          >
            <Send className="size-4" /> {sending ? "Bezig…" : "Versturen"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 className="size-4" />
          </Button>

          <ConfirmDialog
            open={deleteConfirmOpen}
            title="Offerte verwijderen"
            description={`Weet je zeker dat je de offerte "${title}" wilt verwijderen? Dit kan niet ongedaan gemaakt worden.`}
            confirmLabel="Verwijderen"
            danger
            pending={deletePending}
            onConfirm={() => {
              startDeleteTransition(async () => {
                await deleteQuote(quote.id);
                router.push("/dashboard/offertes");
              });
            }}
            onCancel={() => setDeleteConfirmOpen(false)}
          />
        </div>
      </div>

      {translateError && (
        <div className="rounded-brand-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {translateError}
        </div>
      )}

      {status !== "concept" && (
        <div className="flex items-center gap-2 rounded-brand-sm border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          <Link2 className="size-4 shrink-0" />
          <span className="flex-1 truncate">{shareUrl}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="flex shrink-0 items-center gap-1 rounded-brand-sm bg-white px-2.5 py-1 text-xs font-medium text-teal-700 shadow-sm hover:bg-teal-100"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Gekopieerd" : "Kopieer link"}
          </button>
        </div>
      )}

      {signature && <SignatureInfoCard signature={signature} shareToken={quote.share_token} />}

      <EngagementCard engagement={engagement} blocks={blocks} />

      <CommentsPanel quoteId={quote.id} comments={initialComments} blocks={blocks} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <FieldBox label="Eventdatum">
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full bg-transparent text-sm text-ink-500 outline-none"
          />
        </FieldBox>
        <FieldBox label="Geldig tot">
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full bg-transparent text-sm text-ink-500 outline-none"
          />
        </FieldBox>
        <FieldBox label="Prijzen">
          <div className="flex gap-1 -ml-1 -mt-0.5">
            {(["incl_btw", "excl_btw"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPriceDisplay(mode)}
                className={cn(
                  "rounded-brand-sm px-2 py-1 text-xs font-medium transition-colors duration-200 ease-brand",
                  priceDisplay === mode ? "bg-blue-500 text-white" : "text-ink-400 hover:bg-sand-200",
                )}
              >
                {mode === "incl_btw" ? "Incl. btw" : "Excl. btw"}
              </button>
            ))}
          </div>
        </FieldBox>
        <FieldBox label="Korting (€)">
          <input
            type="number"
            value={discountAmount}
            onChange={(e) => setDiscountAmount(Number(e.target.value))}
            className="w-full bg-transparent text-sm text-ink-500 outline-none"
          />
        </FieldBox>
        <FieldBox label="Taal voor klant">
          <div className="flex gap-1 -ml-1 -mt-0.5">
            {(["nl", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={cn(
                  "rounded-brand-sm px-2 py-1 text-xs font-medium uppercase transition-colors duration-200 ease-brand",
                  language === l ? "bg-blue-500 text-white" : "text-ink-400 hover:bg-sand-200",
                )}
              >
                {l}
              </button>
            ))}
          </div>
        </FieldBox>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="flex flex-col gap-3">
          <BlockList blocks={blocks} onChange={setBlocks} organizationId={organizationId} />
          <AddBlockMenu onAdd={(type) => setBlocks([...blocks, newBlock(type, blocks.length)])} />
        </div>

        <div className="xl:sticky xl:top-6 xl:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-500">Live preview</p>
            <div className="flex gap-1 rounded-brand-sm bg-sand-200 p-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={cn("flex size-7 items-center justify-center rounded-brand-sm", previewMode === "desktop" ? "bg-white shadow-sm" : "text-ink-400")}
              >
                <Monitor className="size-3.5" />
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={cn("flex size-7 items-center justify-center rounded-brand-sm", previewMode === "mobile" ? "bg-white shadow-sm" : "text-ink-400")}
              >
                <Smartphone className="size-3.5" />
              </button>
            </div>
          </div>
          <div className="max-h-[calc(100vh-160px)] overflow-y-auto rounded-brand-lg bg-sand-200 p-4">
            <QuotePreview
              blocks={blocks}
              mode={previewMode}
              meta={{
                title,
                clientName: client?.name ?? "",
                eventDate: eventDate || null,
                currency: quote.currency,
                priceDisplay,
                discountAmount,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-brand-sm border border-ink-200 bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-300">{label}</p>
      {children}
    </div>
  );
}
