/**
 * Canonical Funding Range Utilities for Maple X Financial Portal
 *
 * Directives:
 * - Requested Funding is the client's target funding range ($min - $max).
 * - It is strictly separated from Approved Amount, Funded Amount, Active Pipeline Value, and Commission.
 * - It must NEVER be summed into an aggregate total.
 */

export interface FundingRange {
  min?: number | null;
  max?: number | null;
  range?: string;
  originalText?: string;
}

export const FUNDING_RANGE_PRESETS = [
  { id: 'ALL', label: 'All Ranges', min: null, max: null },
  { id: 'UNDER_50K', label: 'Under $50,000', min: 0, max: 50000 },
  { id: '50K_100K', label: '$50,000 - $100,000', min: 50000, max: 100000 },
  { id: '100K_250K', label: '$100,000 - $250,000', min: 100000, max: 250000 },
  { id: '250K_500K', label: '$250,000 - $500,000', min: 250000, max: 500000 },
  { id: 'OVER_500K', label: 'Over $500,000', min: 500000, max: null },
] as const;

/**
 * Formats a funding range for display across all portal views.
 * Examples:
 * - min: 50000, max: 100000 => "$50,000 - $100,000"
 * - min: 50000, max: 50000  => "$50,000 - $50,000"
 * - min: 50000, max: null   => "At least $50,000"
 * - min: null,  max: 100000 => "Up to $100,000"
 * - neither => "Not Available"
 */
export function formatFundingRange(
  min?: number | null,
  max?: number | null,
  fallback?: number | null | string
): string {
  // Normalize undefined / NaN
  const cleanMin = typeof min === 'number' && !isNaN(min) && min > 0 ? min : null;
  const cleanMax = typeof max === 'number' && !isNaN(max) && max > 0 ? max : null;

  if (cleanMin !== null && cleanMax !== null) {
    if (cleanMin === cleanMax) {
      return `$${cleanMin.toLocaleString()} - $${cleanMax.toLocaleString()}`;
    }
    const low = Math.min(cleanMin, cleanMax);
    const high = Math.max(cleanMin, cleanMax);
    return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
  }

  if (cleanMin !== null && cleanMax === null) {
    return `At least $${cleanMin.toLocaleString()}`;
  }

  if (cleanMin === null && cleanMax !== null) {
    return `Up to $${cleanMax.toLocaleString()}`;
  }

  if (typeof fallback === 'number' && !isNaN(fallback) && fallback > 0) {
    return `$${fallback.toLocaleString()} - $${fallback.toLocaleString()}`;
  }

  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }

  return 'Not Available';
}

/**
 * Validates a funding range. Returns an error message or null if valid.
 */
export function validateFundingRange(
  min?: number | null,
  max?: number | null
): { isValid: boolean; error?: string } {
  if (min !== undefined && min !== null && min < 0) {
    return { isValid: false, error: 'Minimum requested funding cannot be negative.' };
  }
  if (max !== undefined && max !== null && max < 0) {
    return { isValid: false, error: 'Maximum requested funding cannot be negative.' };
  }
  if (
    min !== undefined &&
    min !== null &&
    max !== undefined &&
    max !== null &&
    min > max
  ) {
    return {
      isValid: false,
      error: 'Minimum requested funding cannot be greater than maximum requested funding.',
    };
  }
  return { isValid: true };
}

/**
 * Resolves canonical min/max/range from any record (Client, Deal, Lead, etc.)
 * Handles backward compatibility with single requestedAmount fields safely without inventing ranges.
 */
export function getCanonicalFundingRange(record?: {
  requestedFundingMin?: number | null;
  requestedFundingMax?: number | null;
  requestedFundingRange?: string | null;
  requestedAmountMin?: number | null;
  requestedAmountMax?: number | null;
  requestedAmount?: number | null;
  estimatedAmount?: number | null;
  fundingAmount?: number | null;
  originalRequestedFundingText?: string | null;
} | null): {
  min: number | null;
  max: number | null;
  range: string;
  isRange: boolean;
  formatted: string;
} {
  if (!record) {
    return { min: null, max: null, range: '', isRange: false, formatted: 'Not Available' };
  }

  // 1. Check explicit structured range fields
  let min: number | null = null;
  let max: number | null = null;

  if (typeof record.requestedFundingMin === 'number' && !isNaN(record.requestedFundingMin) && record.requestedFundingMin > 0) {
    min = record.requestedFundingMin;
  } else if (typeof record.requestedAmountMin === 'number' && !isNaN(record.requestedAmountMin) && record.requestedAmountMin > 0) {
    min = record.requestedAmountMin;
  }

  if (typeof record.requestedFundingMax === 'number' && !isNaN(record.requestedFundingMax) && record.requestedFundingMax > 0) {
    max = record.requestedFundingMax;
  } else if (typeof record.requestedAmountMax === 'number' && !isNaN(record.requestedAmountMax) && record.requestedAmountMax > 0) {
    max = record.requestedAmountMax;
  }

  // 2. If range string provided, attempt to parse if min or max missing
  if ((min === null || max === null) && (record.requestedFundingRange || record.originalRequestedFundingText)) {
    const textToParse = record.requestedFundingRange || record.originalRequestedFundingText || '';
    const parsed = parseFundingRangeText(textToParse);
    if (min === null && parsed.min !== null) min = parsed.min;
    if (max === null && parsed.max !== null) max = parsed.max;
  }

  // 3. Fallback to legacy single amount if min and max are not set
  if (min === null && max === null) {
    const single = record.requestedAmount ?? record.estimatedAmount;
    if (typeof single === 'number' && !isNaN(single) && single > 0) {
      min = single;
      max = single;
    }
  }

  const formatted = formatFundingRange(min, max, record.requestedFundingRange || record.originalRequestedFundingText);
  const isRange = min !== null && max !== null && min !== max;

  return {
    min,
    max,
    range: formatted !== 'Not Available' ? formatted : '',
    isRange,
    formatted,
  };
}

/**
 * Helper to parse text representations of funding ranges.
 * Supports:
 * "$50,000 - $100,000", "$50k - $100k", "$50,000 to $100,000",
 * "between $50k and $100k", "at least $50,000", "up to $100,000", "$75,000"
 */
export function parseFundingRangeText(input: string): {
  min: number | null;
  max: number | null;
  range: string;
  originalText: string;
} {
  const originalText = String(input || '').trim();
  if (!originalText) {
    return { min: null, max: null, range: '', originalText };
  }

  // Expand "50k", "$50K", "1.5m", etc.
  const expandK = (str: string) => {
    return str
      .replace(/\$?\s*(\d+(?:\.\d+)?)\s*k\b/gi, (_, n) => String(Math.round(parseFloat(n) * 1000)))
      .replace(/\$?\s*(\d+(?:\.\d+)?)\s*m\b/gi, (_, n) => String(Math.round(parseFloat(n) * 1000000)))
      .replace(/[$,]/g, '');
  };

  const text = expandK(originalText.toLowerCase());

  // Check "up to X" or "max X"
  const upToMatch = text.match(/(?:up\s*to|max(?:imum)?|less\s*than|under)\s*[:]?\s*(\d+)/i);
  if (upToMatch) {
    const val = parseInt(upToMatch[1], 10);
    return { min: null, max: val, range: `Up to $${val.toLocaleString()}`, originalText };
  }

  // Check "at least X" or "min X"
  const atLeastMatch = text.match(/(?:at\s*least|min(?:imum)?|greater\s*than|over)\s*[:]?\s*(\d+)/i);
  if (atLeastMatch) {
    const val = parseInt(atLeastMatch[1], 10);
    return { min: val, max: null, range: `At least $${val.toLocaleString()}`, originalText };
  }

  // Check Range: X to Y, X - Y, between X and Y
  const rangeMatch = text.match(/(?:between\s+)?(\d+)\s*(?:-|–|—|to|and)\s*(\d+)/i);
  if (rangeMatch) {
    const v1 = parseInt(rangeMatch[1], 10);
    const v2 = parseInt(rangeMatch[2], 10);
    const min = Math.min(v1, v2);
    const max = Math.max(v1, v2);
    return {
      min,
      max,
      range: `$${min.toLocaleString()} - $${max.toLocaleString()}`,
      originalText,
    };
  }

  // Check Single amount: "$75,000" or "75000"
  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return {
      min: val,
      max: val,
      range: `$${val.toLocaleString()} - $${val.toLocaleString()}`,
      originalText,
    };
  }

  return { min: null, max: null, range: '', originalText };
}

/**
 * Checks whether a client/deal's requested funding range overlaps with a filter range.
 */
export function matchesFundingRangeFilter(
  record?: any,
  filterMin?: number | null,
  filterMax?: number | null
): boolean {
  if (filterMin === null && filterMax === null) {
    return true; // No filter active
  }
  const { min, max } = getCanonicalFundingRange(record);
  if (min === null && max === null) {
    return false; // No requested amount specified on record
  }

  const recMin = min ?? max ?? 0;
  const recMax = max ?? min ?? 0;

  if (filterMin !== null && filterMin !== undefined && filterMax !== null && filterMax !== undefined) {
    // Overlap check
    return recMax >= filterMin && recMin <= filterMax;
  }
  if (filterMin !== null && filterMin !== undefined) {
    return recMax >= filterMin;
  }
  if (filterMax !== null && filterMax !== undefined) {
    return recMin <= filterMax;
  }
  return true;
}
