"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { uploadOrganizationLogo, updateOrganizationLogo } from "../actions";

export function OrganizationLogoUploader({
  organizationId,
  field,
  label,
  aspectClassName,
  initialLogoUrl,
}: {
  organizationId: string;
  field: "horizontal" | "square";
  label: string;
  aspectClassName: string;
  initialLogoUrl: string | null;
}) {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const url = await uploadOrganizationLogo(organizationId, field, formData);
      setLogoUrl(url);
    } catch {
      setError("Upload mislukt. Probeer het opnieuw.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-ink-400">{label}</span>
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

      {logoUrl ? (
        <div className={`group relative flex items-center justify-center overflow-hidden rounded-brand-sm bg-sand-200 ${aspectClassName}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="" className="max-h-full max-w-full object-contain p-3" />
          <button
            type="button"
            onClick={() => {
              setLogoUrl(null);
              void updateOrganizationLogo(organizationId, field, "");
            }}
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
          className={`flex flex-col items-center justify-center gap-2 rounded-brand-sm border-2 border-dashed border-ink-200 bg-sand-100 text-ink-400 transition-colors duration-200 ease-brand hover:border-teal-400 hover:text-teal-600 disabled:opacity-60 ${aspectClassName}`}
        >
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span className="text-xs font-medium">{uploading ? "Bezig met uploaden…" : "Logo uploaden"}</span>
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
