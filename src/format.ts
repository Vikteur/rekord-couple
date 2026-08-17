export function formatDuration(seconds: number | null): string {
  if (seconds == null) return '?:??';
  const rounded = Math.round(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

/** "2027-06-14" → "14 June 2027". Nothing the couple sees shows an ISO date. */
export function formatWeddingDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return iso;
  const month = parsed.toLocaleString('en-GB', { month: 'long' });
  return `${parsed.getDate()} ${month} ${parsed.getFullYear()}`;
}
