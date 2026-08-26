/**
 * Central Date Formatting Utilities for Maple X Financial Operations Portal
 * Formats all dates consistently as:
 * month/day/year -> MMM/DD/YYYY (e.g., MAR/10/2022)
 */

const MONTH_NAMES = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
];

/**
 * Formats a date string, timestamp, or Date object into "MMM/DD/YYYY" (e.g., MAR/10/2022).
 * Handles ISO strings, YYYY-MM-DD, UTC timestamps, and Date objects safely without timezone shift.
 */
export function formatDate(
  input: string | number | Date | null | undefined,
  fallback: string = '—'
): string {
  if (!input) return fallback;

  try {
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (!trimmed || trimmed === 'N/A' || trimmed === '—' || trimmed === '-') return fallback;

      // Match ISO date string starting with YYYY-MM-DD or YYYY/MM/DD
      const matchISO = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (matchISO) {
        const year = parseInt(matchISO[1], 10);
        const monthIndex = parseInt(matchISO[2], 10) - 1;
        const day = parseInt(matchISO[3], 10);

        if (monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= 31) {
          const monthStr = MONTH_NAMES[monthIndex];
          const dayStr = String(day).padStart(2, '0');
          return `${monthStr}/${dayStr}/${year}`;
        }
      }

      // Match MM/DD/YYYY or M/D/YYYY
      const matchMDY = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (matchMDY) {
        const monthIndex = parseInt(matchMDY[1], 10) - 1;
        const day = parseInt(matchMDY[2], 10);
        const year = parseInt(matchMDY[3], 10);

        if (monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= 31) {
          const monthStr = MONTH_NAMES[monthIndex];
          const dayStr = String(day).padStart(2, '0');
          return `${monthStr}/${dayStr}/${year}`;
        }
      }

      // Match existing MMM/DD/YYYY (e.g. Mar/10/2022 or MAR/10/2022)
      const matchMMM = trimmed.match(/^([a-zA-Z]{3})\/(\d{1,2})\/(\d{4})$/);
      if (matchMMM) {
        const monthStr = matchMMM[1].toUpperCase();
        const dayStr = String(parseInt(matchMMM[2], 10)).padStart(2, '0');
        const year = matchMMM[3];
        return `${monthStr}/${dayStr}/${year}`;
      }
    }

    const d = new Date(input);
    if (isNaN(d.getTime())) return fallback;

    const monthStr = MONTH_NAMES[d.getMonth()];
    const dayStr = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();

    return `${monthStr}/${dayStr}/${year}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats a date with time as "MMM/DD/YYYY hh:mm A" (e.g., MAR/10/2022 02:30 PM).
 */
export function formatDateTime(
  input: string | number | Date | null | undefined,
  fallback: string = '—'
): string {
  if (!input) return fallback;

  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return fallback;

    const dateFormatted = formatDate(d, fallback);
    if (dateFormatted === fallback) return fallback;

    const timeStr = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return `${dateFormatted} @ ${timeStr}`;
  } catch {
    return fallback;
  }
}

/**
 * Formats time only (e.g., 02:30 PM).
 */
export function formatTime(
  input: string | number | Date | null | undefined,
  fallback: string = '—'
): string {
  if (!input) return fallback;

  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return fallback;

    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return fallback;
  }
}

/**
 * Returns today's date formatted as MMM/DD/YYYY.
 */
export function getTodayFormatted(): string {
  return formatDate(new Date());
}

/**
 * Returns month abbreviation (e.g., 'MAR') given a 0-indexed or 1-indexed month.
 */
export function getMonthAbbr(monthIndex: number): string {
  const idx = monthIndex % 12;
  return MONTH_NAMES[idx] || 'JAN';
}
