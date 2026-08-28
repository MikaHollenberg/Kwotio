"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

async function uploadToQuoteMedia(file: File, organizationId: string) {
  const supabase = createClient();
  const path = `${organizationId}/${crypto.randomUUID()}.pdf`;

  const { error } = await supabase.storage.from("quote-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: "application/pdf",
  });
  if (error) throw error;

  const { data } = supabase.storage.from("quote-media").getPublicUrl(path);
  return data.publicUrl;
}

function fileNameFromUrl(url: string) {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.split("/").pop() ?? "document.pdf";
  } catch {
    return "document.pdf";
  }
}

export function PdfUploadField({
  value,
  onChange,
  organizationId,
  label = "PDF",
}: {
  value: string;
  onChange: (url: string) => void;
  organizationId: string;
  label?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (file.type !== "application/pdf") {
      setError("Alleen PDF-bestanden zijn toegestaan.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Bestand is te groot (max. 10 MB).");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadToQuoteMedia(file, organizationId);
      onChange(url);
    } catch {
      setError("Upload mislukt. Probeer het opnieuw.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-brand-sm border border-ink-200 bg-white px-3.5 py-3">
          <FileText className="size-5 shrink-0 text-teal-600" />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-medium text-ink-500 underline decoration-ink-200 hover:text-teal-700"
          >
            {fileNameFromUrl(value)}
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="shrink-0 text-xs font-semibold text-teal-600 hover:text-teal-700 disabled:opacity-60"
          >
            Vervangen
          </button>
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-sand-200 hover:text-ink-500"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            "flex items-center justify-center gap-2 rounded-brand-sm border-2 border-dashed border-ink-200 bg-sand-100 px-4 py-4 text-ink-400 transition-colors duration-200 ease-brand hover:border-teal-400 hover:text-teal-600 disabled:opacity-60",
          )}
        >
          {uploading ? <Loader2 className="size-5 animate-spin" /> : <Upload className="size-5" />}
          <span className="text-xs font-medium">{uploading ? "Bezig met uploaden…" : `${label} uploaden`}</span>
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
