/** Prullenbak-bewaartermijn voor zachtverwijderde offertes/klanten (zie
 * migratie 0082) -- gedeeld tussen beide prullenbak-pagina's en de
 * dagelijkse opruim-cronjob. */
export const TRASH_RETENTION_DAYS = 30;

export function daysUntilPurge(deletedAt: string): number {
  const deletedAtMs = new Date(deletedAt).getTime();
  const elapsedDays = Math.floor((Date.now() - deletedAtMs) / 86_400_000);
  return Math.max(0, TRASH_RETENTION_DAYS - elapsedDays);
}
