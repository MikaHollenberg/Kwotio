"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { cn, formatCurrency } from "@/lib/utils";
import type { InvoiceVatRateType } from "@/lib/types/database";
import {
  createCatalogItem,
  updateCatalogItem,
  archiveCatalogItem,
  unarchiveCatalogItem,
  deleteCatalogItem,
  type CatalogItemFields,
} from "./actions";

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  unit_price: number;
  vat_rate_type: InvoiceVatRateType;
  vat_rate_custom: number | null;
  archived_at: string | null;
};

const inputClass =
  "h-10 rounded-brand-sm border border-ink-200 bg-white px-3 text-sm text-ink-500 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";

const VAT_TYPE_LABELS: Record<InvoiceVatRateType, string> = {
  hoog: "Hoog",
  laag: "Laag",
  nul: "0%",
  aangepast: "Anders",
};

function ItemFormModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: CatalogItem;
  onClose: () => void;
  onSubmit: (fields: CatalogItemFields) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [unitPrice, setUnitPrice] = useState(String(initial?.unit_price ?? 0));
  const [vatRateType, setVatRateType] = useState<InvoiceVatRateType>(initial?.vat_rate_type ?? "hoog");
  const [vatRateCustom, setVatRateCustom] = useState(String(initial?.vat_rate_custom ?? 21));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Vul een naam in.");
      return;
    }
    startTransition(async () => {
      try {
        await onSubmit({
          name,
          description,
          unitPrice: Number(unitPrice) || 0,
          vatRateType,
          vatRateCustom: vatRateType === "aangepast" ? Number(vatRateCustom) || 0 : null,
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Opslaan mislukt.");
      }
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-500/50 p-4" onClick={() => !pending && onClose()}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-brand-lg bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-500">
            {initial ? "Artikel bewerken" : "Nieuw artikel"}
          </h2>
          <button onClick={onClose} disabled={pending} className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Naam
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="bijv. Drankarrangement 4 uur" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Omschrijving (optioneel)
            <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink-400">
            Stukprijs excl. btw
            <input type="number" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className={inputClass} />
          </label>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-400">Btw-tarief</span>
            <div className="flex gap-1.5">
              {(Object.keys(VAT_TYPE_LABELS) as InvoiceVatRateType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVatRateType(type)}
                  className={cn(
                    "flex-1 rounded-brand-sm border px-2 py-1.5 text-xs font-semibold transition-colors duration-200 ease-brand",
                    vatRateType === type ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400 hover:border-ink-300",
                  )}
                >
                  {VAT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
            {vatRateType === "aangepast" && (
              <input
                type="number"
                step="0.01"
                value={vatRateCustom}
                onChange={(e) => setVatRateCustom(e.target.value)}
                className={inputClass}
                placeholder="Eigen percentage"
              />
            )}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Annuleren
          </Button>
          <Button variant="primary" size="sm" onClick={submit} disabled={pending}>
            {pending ? "Bezig…" : "Opslaan"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function CatalogItemsTable({ items, canEdit }: { items: CatalogItem[]; canEdit: boolean }) {
  const [showArchived, setShowArchived] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<CatalogItem | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [, startArchiveTransition] = useTransition();

  const visible = items.filter((i) => (showArchived ? i.archived_at : !i.archived_at));

  function vatLabel(item: CatalogItem) {
    if (item.vat_rate_type === "aangepast") return `${item.vat_rate_custom ?? 0}%`;
    return VAT_TYPE_LABELS[item.vat_rate_type];
  }

  return (
    <Card data-faq-id="catalog-items-card">
      <CardHeader>
        <div>
          <CardTitle>Factuurartikelen</CardTitle>
          <p className="mt-1 text-sm text-ink-400">Veelgebruikte regels opslaan en hergebruiken op facturen.</p>
        </div>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
            data-faq-id="new-catalog-item-button"
          >
            <Plus className="mr-1.5 size-4" />
            Nieuw artikel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              !showArchived ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
            )}
          >
            Actief
          </button>
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold",
              showArchived ? "border-teal-500 bg-teal-500 text-white" : "border-ink-200 text-ink-400",
            )}
          >
            Archief
          </button>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-ink-400">{showArchived ? "Geen gearchiveerde artikelen." : "Nog geen artikelen."}</p>
        ) : (
          <div className="flex flex-col divide-y divide-ink-50">
            {visible.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium text-ink-500">{item.name}</span>
                  {item.description && <span className="text-ink-400">{item.description}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-ink-400">{vatLabel(item)}</span>
                  <span className="font-medium text-ink-500">{formatCurrency(item.unit_price)}</span>
                  {canEdit && (
                    <div className="flex items-center gap-1">
                      {!showArchived && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(item);
                            setFormOpen(true);
                          }}
                          className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          startArchiveTransition(() =>
                            showArchived ? unarchiveCatalogItem(item.id) : archiveCatalogItem(item.id),
                          )
                        }
                        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-sand-200"
                      >
                        {showArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="flex size-8 items-center justify-center rounded-brand-sm text-ink-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {formOpen && (
        <ItemFormModal
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSubmit={(fields) => (editing ? updateCatalogItem(editing.id, fields) : createCatalogItem(fields))}
        />
      )}

      <ConfirmDialog
        open={deleteTarget != null}
        title="Artikel verwijderen?"
        description={deleteTarget ? `"${deleteTarget.name}" wordt definitief verwijderd.` : undefined}
        confirmLabel="Verwijderen"
        danger
        pending={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          startDeleteTransition(async () => {
            await deleteCatalogItem(deleteTarget.id);
            setDeleteTarget(null);
          });
        }}
      />
    </Card>
  );
}
