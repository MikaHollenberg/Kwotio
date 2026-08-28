"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

async function uploadToQuoteMedia(file: File, organizationId: string) {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${organizationId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from("quote-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("quote-media").getPublicUrl(path);
  return data.publicUrl;
}

export function ImageUploadField({
  value,
  onChange,
  organizationId,
  aspect = "aspect-video",
  label = "Foto",
  fit = "cover",
}: {
  value: string;
  onChange: (url: string) => void;
  organizationId: string;
  aspect?: string;
  label?: string;
  /** "cover" (vult/snijdt bij, voor foto's) of "contain" (hele afbeelding
   * zichtbaar, ongeacht de aspect-ratio van de box — voor logo's). */
  fit?: "cover" | "contain";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
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
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />

      {value ? (
        <div className={cn("group relative overflow-hidden rounded-brand-sm bg-sand-200", aspect)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className={cn("size-full", fit === "contain" ? "object-contain p-2" : "object-cover")} />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-ink-500/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
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
            "flex flex-col items-center justify-center gap-2 rounded-brand-sm border-2 border-dashed border-ink-200 bg-sand-100 text-ink-400 transition-colors duration-200 ease-brand hover:border-teal-400 hover:text-teal-600 disabled:opacity-60",
            aspect,
          )}
        >
          {uploading ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <ImagePlus className="size-6" />
          )}
          <span className="text-xs font-medium">
            {uploading ? "Bezig met uploaden…" : `${label} uploaden`}
          </span>
        </button>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
