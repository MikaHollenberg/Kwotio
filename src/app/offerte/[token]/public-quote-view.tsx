"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import type { BlockDraft } from "@/lib/blocks/types";
import type { Selections } from "@/lib/blocks/pricing";
import type { QuoteStatus } from "@/lib/types/database";
import { useQuoteSelections } from "@/hooks/use-quote-selections";
import { calculateTotal } from "@/lib/blocks/pricing";
import { cn } from "@/lib/utils";
import { AnimatedPrice } from "@/components/preview/animated-price";
import { BlockPreview, type QuoteMeta } from "@/components/preview/quote-preview";
import { WaveDivider } from "@/components/brand/wave-divider";
import { StatusBar } from "@/components/preview/status-bar";
import { CommentThread, type CommentItem } from "@/components/preview/comment-thread";
import { Logo } from "@/components/brand/logo";
import { KwotioMark } from "@/components/brand/kwotio-mark";
import { Button } from "@/components/ui/button";
import { SignModal } from "@/components/signature/sign-modal";
import { SuccessCelebration } from "@/components/signature/success-celebration";
import { ALGEMENE_VOORWAARDEN_URL, PRIVACYBELEID_URL } from "@/lib/legal";
import { LanguageProvider, useTranslation } from "@/lib/i18n/language-context";
import type { Lang } from "@/lib/i18n/translations";
import { trackView, trackSectionView, updateSelection, submitComment } from "./actions";

export function PublicQuoteView(props: {
  token: string;
  blocks: BlockDraft[];
  meta: QuoteMeta;
  status: QuoteStatus;
  initialSelections?: Selections;
  commentsByBlock: Record<string, CommentItem[]>;
  isExpired: boolean;
  initialLang: Lang;
  logoUrl?: string | null;
}) {
  return (
    <LanguageProvider initialLang={props.initialLang}>
      <PublicQuoteViewInner {...props} />
    </LanguageProvider>
  );
}

function LanguageToggle() {
  const { lang, setLang } = useTranslation();
  return (
    <div className="flex gap-1 rounded-brand-sm bg-sand-200 p-1">
      {(["nl", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={cn(
            "rounded-brand-sm px-2 py-1 text-xs font-semibold uppercase transition-colors duration-200 ease-brand",
            lang === l ? "bg-white text-ink-500 shadow-sm" : "text-ink-400",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function PublicQuoteViewInner({
  token,
  blocks,
  meta,
  status,
  initialSelections,
  commentsByBlock,
  isExpired,
  logoUrl,
}: {
  token: string;
  blocks: BlockDraft[];
  meta: QuoteMeta;
  status: QuoteStatus;
  initialSelections?: Selections;
  commentsByBlock: Record<string, CommentItem[]>;
  isExpired: boolean;
  logoUrl?: string | null;
}) {
  const { t } = useTranslation();
  const { packagesContent, selections, setSelections, subtotal } = useQuoteSelections(
    blocks,
    initialSelections,
  );
  const total = calculateTotal({ subtotal, discountAmount: meta.discountAmount });
  const sorted = [...blocks].sort((a, b) => a.position - b.position);

  const [comments, setComments] = useState(commentsByBlock);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [showSignModal, setShowSignModal] = useState(false);
  const [celebration, setCelebration] = useState<{ signerName: string } | null>(null);
  const skipFirstSave = useRef(true);
  const isSigned = currentStatus === "geaccepteerd";

  useEffect(() => {
    void trackView(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isSigned) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }
    const timeout = setTimeout(() => {
      void updateSelection(token, selections.packageId, selections.addonQuantities);
    }, 600);
    return () => clearTimeout(timeout);
  }, [token, selections, isSigned]);

  const selectedPackageName = packagesContent?.packages.find((p) => p.id === selections.packageId)?.name ?? null;
  const certificateHref = `/offerte/${token}/certificaat`;
  const pdfHref = `/offerte/${token}/pdf`;

  return (
    <div className="min-h-screen bg-sand-100 pb-28">
      <header className="sticky top-0 z-10 border-b border-ink-200/40 bg-sand-100/90 px-4 py-3 backdrop-blur-sm sm:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            {logoUrl ? <Logo height={24} logoUrl={logoUrl} /> : <KwotioMark size={24} />}
            <div className="sm:hidden">
              <LanguageToggle />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBar status={currentStatus} />
            <div className="hidden sm:block">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </header>

      {isExpired && !isSigned && (
        <div className="mx-auto mt-4 max-w-3xl px-4 sm:px-0">
          <div className="rounded-brand-sm bg-yellow-100 px-4 py-2.5 text-sm text-yellow-800">
            {t("expired_banner")}
          </div>
        </div>
      )}

      <main className="mx-auto mt-6 max-w-3xl px-0">
        <div className="overflow-hidden bg-white shadow-sm sm:rounded-brand-lg">
          {sorted.map((block, i) => (
            <BlockSection
              key={block.id}
              token={token}
              block={block}
              meta={meta}
              selections={selections}
              onSelectionsChange={isSigned ? () => {} : setSelections}
              showDivider={i > 0}
              comments={comments[block.id] ?? []}
              onCommentAdded={(comment) =>
                setComments((prev) => ({ ...prev, [block.id]: [...(prev[block.id] ?? []), comment] }))
              }
            />
          ))}
        </div>

        <p className="px-4 py-6 text-center text-xs text-ink-400 sm:px-0">
          {t("footer_terms_prefix")}{" "}
          <a
            href={ALGEMENE_VOORWAARDEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-600 underline hover:text-teal-700"
          >
            {t("terms_link")}
          </a>{" "}
          {t("footer_terms_suffix")}
          {" · "}
          <a
            href={PRIVACYBELEID_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-teal-600 underline hover:text-teal-700"
          >
            {t("privacy_link")}
          </a>
        </p>
      </main>

      {packagesContent && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-ink-100 bg-white/95 px-4 py-4 backdrop-blur-sm sm:px-8">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-ink-400">
                {t("total_label")} ({t(meta.priceDisplay === "incl_btw" ? "price_incl_btw" : "price_excl_btw")})
              </p>
              <p className="font-display text-xl font-semibold text-ink-500">
                <AnimatedPrice amount={total} currency={meta.currency} />
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={pdfHref}
                className="flex items-center gap-2 rounded-brand-sm border border-ink-200 px-3 py-2.5 text-sm font-semibold text-ink-500 hover:bg-sand-200"
              >
                <Download className="size-4" />
                <span className="hidden sm:inline">{t("download_quote_pdf")}</span>
              </a>
              {isSigned ? (
                <a
                  href={certificateHref}
                  className="flex items-center gap-2 rounded-brand-sm bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-100"
                >
                  <Download className="size-4" /> {t("download_certificate")}
                </a>
              ) : isExpired ? (
                <Button disabled title="Deze offerte is verlopen — neem contact op voor een actuele versie">
                  Verlopen
                </Button>
              ) : (
                <Button onClick={() => setShowSignModal(true)}>{t("accept_and_sign")}</Button>
              )}
            </div>
          </div>
        </div>
      )}

      <SignModal
        open={showSignModal}
        onClose={() => setShowSignModal(false)}
        onSigned={(signerName) => {
          setShowSignModal(false);
          setCurrentStatus("geaccepteerd");
          setCelebration({ signerName });
        }}
        token={token}
        quoteTitle={meta.title}
        selectedPackageName={selectedPackageName}
        total={total}
        currency={meta.currency}
        priceDisplay={meta.priceDisplay}
        selections={selections}
      />

      {celebration && (
        <SuccessCelebration
          signerName={celebration.signerName}
          certificateHref={certificateHref}
          onClose={() => setCelebration(null)}
        />
      )}
    </div>
  );
}

function BlockSection({
  token,
  block,
  meta,
  selections,
  onSelectionsChange,
  showDivider,
  comments,
  onCommentAdded,
}: {
  token: string;
  block: BlockDraft;
  meta: QuoteMeta;
  selections: Selections;
  onSelectionsChange: (s: Selections) => void;
  showDivider: boolean;
  comments: CommentItem[];
  onCommentAdded: (comment: CommentItem) => void;
}) {
  const hasTracked = useRef(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      onViewportEnter={() => {
        if (hasTracked.current) return;
        hasTracked.current = true;
        void trackSectionView(token, block.id);
      }}
    >
      {showDivider && (
        <div className="px-6">
          <WaveDivider className="text-blue-200" />
        </div>
      )}
      <BlockPreview block={block} meta={meta} selections={selections} onSelectionsChange={onSelectionsChange} />
      {block.type !== "cover" && (
        <div className={cn("px-6 pb-8", block.type === "signature" && "pb-10")}>
          <CommentThread
            comments={comments}
            onSubmit={async (input) => {
              await submitComment(token, { blockId: block.id, ...input });
              onCommentAdded({
                id: crypto.randomUUID(),
                authorType: "client",
                authorName: input.authorName,
                body: input.body,
                createdAt: new Date().toISOString(),
              });
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
