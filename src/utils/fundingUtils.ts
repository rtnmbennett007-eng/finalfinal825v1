/**
 * Canonical Funding Range Utilities for Maple X Financial Portal
 */

export interface FundingRange {
  min?: number | null;
  max?: number | null;
  originalText?: string;
}

/**
 * Formats a funding range for display across all portal views.
 * Examples:
 * - min: 50000, max: 100000 => "$50,000 – $100,000"
 * - min: 50000, max: 50000  => "$50,000"
 * - min: 50000, max: null   => "At least $50,000"
 * - min: null,  max: 100000 => "Up to $100,000"
 * - fallback / legacy single value => "$50,000"
 */
export function formatFundingRange(
  min?: number | null,
  max?: number | null,
  fallback?: number | null
): string {
  // Normalize undefined / NaN
  const cleanMin = typeof min === 'number' && !isNaN(min) && min >= 0 ? min : null;
  const cleanMax = typeof max === 'number' && !isNaN(max) && max >= 0 ? max : null;
  const cleanFallback = typeof fallback === 'number' && !isNaN(fallback) && fallback >= 0 ? fallback : null;

  if (cleanMin !== null && cleanMax !== null) {
    if (cleanMin === cleanMax) {
      return `$${cleanMin.toLocaleString()}`;
    }
    const low = Math.min(cleanMin, cleanMax);
    const high = Math.max(cleanMin, cleanMax);
    return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
  }

  if (cleanMin !== null && cleanMax === null) {
    return `At least $${cleanMin.toLocaleString()}`;
  }

  if (cleanMin === null && cleanMax !== null) {
    return `Up to $${cleanMax.toLocaleString()}`;
  }

  if (cleanFallback !== null && cleanFallback > 0) {
    return `$${cleanFallback.toLocaleString()}`;
  }

  return 'Not Specified';
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
 * Resolves canonical min/max from any record (Client, Deal, Lead, etc.)
 * Handles backward compatibility with single requestedAmount fields.
 */
export function getCanonicalFundingRange(record?: {
  requestedAmountMin?: number | null;
  requestedAmountMax?: number | null;
  requestedAmount?: number | null;
  estimatedAmount?: number | null;
  fundingAmount?: number | null;
} | null): { min: number; max: number; isRange: boolean; formatted: string } {
  if (!record) {
    return { min: 0, max: 0, isRange: false, formatted: '$0' };
  }

  const min = record.requestedAmountMin ?? (record.requestedAmount ?? record.estimatedAmount ?? 0);
  const max = record.requestedAmountMax ?? (record.requestedAmount ?? record.estimatedAmount ?? min);

  const cleanMin = Math.max(0, Number(min) || 0);
  const cleanMax = Math.max(0, Number(max) || cleanMin);

  return {
    min: cleanMin,
    max: cleanMax,
    isRange: cleanMin !== cleanMax && cleanMin > 0 && cleanMax > 0,
    formatted: formatFundingRange(cleanMin, cleanMax),
  };
}

/**
 * Helper to parse text representations of funding ranges.
 * Supports:
 * "$50,000 to $100,000", "$50K-$100K", "50,000 - 100,000",
 * "Between $50,000 and $100,000", "Looking for 50k to 100k",
 * "up to $100,000", "at least $50,000", "$75,000"
 */
export function parseFundingRangeText(input: string): {
  min: number | null;
  max: number | null;
  originalText: string;
} {
  const originalText = String(input || '').trim();
  if (!originalText) {
    return { min: null, max: null, originalText };
  }

  // Normalize "50k", "$50K", "50m", etc.
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
    return { min: null, max: val, originalText };
  }

  // Check "at least X" or "min X"
  const atLeastMatch = text.match(/(?:at\s*least|min(?:imum)?|greater\s*than|over)\s*[:]?\s*(\d+)/i);
  if (atLeastMatch) {
    const val = parseInt(atLeastMatch[1], 10);
    return { min: val, max: null, originalText };
  }

  // Check Range: X to Y, X - Y, between X and Y
  const rangeMatch = text.match(/(?:between\s+)?(\d+)\s*(?:-|–|—|to|and)\s*(\d+)/i);
  if (rangeMatch) {
    const v1 = parseInt(rangeMatch[1], 10);
    const v2 = parseInt(rangeMatch[2], 10);
    const min = Math.min(v1, v2);
    const max = Math.max(v1, v2);
    return { min, max, originalText };
  }

  // Check Single amount: "$75,000" or "75000"
  const singleMatch = text.match(/(\d+)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { min: val, max: val, originalText };
  }

  return { min: null, max: null, originalText };
}
