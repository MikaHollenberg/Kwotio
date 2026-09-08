/**
 * Comprimeert een geüpload rasterbestand client-side vóór het de opslag
 * ingaat (schaalt terug tot een redelijke maximale afmeting, her-encodeert
 * als WebP — behoudt transparantie, dus ook geschikt voor logo's). SVG's
 * en niet-afbeeldingsbestanden blijven ongewijzigd (een SVG herschalen zou
 * 'm rasteriseren en de schaalbaarheid juist wegnemen). Valt terug op het
 * originele bestand als comprimeren om wat voor reden dan ook niet lukt of
 * geen winst oplevert.
 */
const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 0.82;

export async function compressImageFile(file: File): Promise<File> {
  if (file.type === "image/svg+xml" || !file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], newName, { type: "image/webp" });
  } catch {
    return file;
  }
}
