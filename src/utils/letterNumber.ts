/**
 * Utility to format and parse quotation letter numbers.
 * Synchronizes sequence number, 2-digit month, and 4-digit year.
 */

export function formatLetterNumber(
  seq: number,
  dateStr: string,
  format?: string
): string {
  const formattedSeq = String(Math.max(1, Number(seq) || 1)).padStart(3, '0');

  let month = '10';
  let year = '2026';

  if (dateStr && dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length >= 3) {
      year = parts[0];
      month = parts[1].padStart(2, '0');
    }
  } else {
    const now = new Date();
    month = String(now.getMonth() + 1).padStart(2, '0');
    year = String(now.getFullYear());
  }

  const template = format && format.trim() ? format.trim() : '{seq}/{month}/MTA/{year}';
  return template
    .replace(/{seq}/g, formattedSeq)
    .replace(/{month}/g, month)
    .replace(/{year}/g, year);
}

export function extractSequenceNumber(letterNumber: string): number | null {
  if (!letterNumber) return null;
  const match = letterNumber.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}
