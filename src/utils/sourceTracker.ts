import { FieldSourceMetadata, FieldSourceType, DataHistoryEntry, Client } from '../types';

/**
 * Priority Hierarchy for Source Merging:
 * CALL_VERIFIED (6) > MANUAL (5) > VERIFICATION_FORM (4) > CLIENT_APPLICATION (3) > AI_FILLED (2) > IMPORTED (1) > SYSTEM_CALCULATED (1) > NOT_ENTERED (0)
 */
export const SOURCE_PRIORITIES: Record<FieldSourceType, number> = {
  CALL_VERIFIED: 60,
  MANUAL: 50,
  VERIFICATION_FORM: 40,
  CLIENT_APPLICATION: 30,
  AI_FILLED: 20,
  IMPORTED: 10,
  SYSTEM_CALCULATED: 10,
  NOT_ENTERED: 0,
};

export const SOURCE_DISPLAY_CONFIG: Record<
  FieldSourceType,
  { label: string; shortLabel: string; badgeBg: string; badgeText: string; borderColor: string; icon: string }
> = {
  CALL_VERIFIED: {
    label: 'Call Verified',
    shortLabel: 'CALL VERIFIED',
    badgeBg: 'bg-emerald-950/60',
    badgeText: 'text-emerald-300',
    borderColor: 'border-emerald-500/50',
    icon: 'ShieldCheck',
  },
  MANUAL: {
    label: 'Manual Entry',
    shortLabel: 'MANUAL',
    badgeBg: 'bg-blue-950/60',
    badgeText: 'text-blue-300',
    borderColor: 'border-blue-500/50',
    icon: 'UserCheck',
  },
  VERIFICATION_FORM: {
    label: 'Verification Form',
    shortLabel: 'VERIF FORM',
    badgeBg: 'bg-teal-950/60',
    badgeText: 'text-teal-300',
    borderColor: 'border-teal-500/50',
    icon: 'FileCheck',
  },
  CLIENT_APPLICATION: {
    label: 'Client Application',
    shortLabel: 'APP FORM',
    badgeBg: 'bg-indigo-950/60',
    badgeText: 'text-indigo-300',
    borderColor: 'border-indigo-500/50',
    icon: 'FileText',
  },
  AI_FILLED: {
    label: 'AI Filled',
    shortLabel: 'AI FILLED',
    badgeBg: 'bg-purple-950/60',
    badgeText: 'text-purple-300',
    borderColor: 'border-purple-500/50',
    icon: 'Sparkles',
  },
  IMPORTED: {
    label: 'Imported',
    shortLabel: 'IMPORTED',
    badgeBg: 'bg-slate-800/80',
    badgeText: 'text-slate-300',
    borderColor: 'border-slate-600',
    icon: 'Download',
  },
  SYSTEM_CALCULATED: {
    label: 'System Calculated',
    shortLabel: 'SYSTEM',
    badgeBg: 'bg-cyan-950/60',
    badgeText: 'text-cyan-300',
    borderColor: 'border-cyan-500/50',
    icon: 'Calculator',
  },
  NOT_ENTERED: {
    label: 'Not Entered',
    shortLabel: 'EMPTY',
    badgeBg: 'bg-slate-900/60',
    badgeText: 'text-slate-500',
    borderColor: 'border-slate-800',
    icon: 'Circle',
  },
};

/**
 * Merges an incoming field update with existing metadata according to source priority rules.
 * Never silently overwrites a higher-priority source (e.g. CALL_VERIFIED) with a lower-priority one (e.g. AI).
 */
export function mergeFieldSource(
  existingMeta: FieldSourceMetadata | undefined,
  incomingMeta: FieldSourceMetadata
): { finalMeta: FieldSourceMetadata; wasOverridden: boolean; conflictDetected: boolean } {
  if (!existingMeta || existingMeta.source === 'NOT_ENTERED') {
    return {
      finalMeta: incomingMeta,
      wasOverridden: true,
      conflictDetected: false,
    };
  }

  const existingPriority = SOURCE_PRIORITIES[existingMeta.source] || 0;
  const incomingPriority = SOURCE_PRIORITIES[incomingMeta.source] || 0;

  const valuesDiffer =
    String(existingMeta.value).trim().toLowerCase() !==
    String(incomingMeta.value).trim().toLowerCase();

  // If existing is CALL_VERIFIED or higher priority than incoming:
  if (existingPriority > incomingPriority) {
    return {
      finalMeta: {
        ...existingMeta,
        conflictWith: valuesDiffer
          ? {
              value: incomingMeta.value,
              source: incomingMeta.source,
              documentName: incomingMeta.sourceDocumentName,
            }
          : existingMeta.conflictWith,
      },
      wasOverridden: false,
      conflictDetected: valuesDiffer,
    };
  }

  // Incoming has higher or equal priority:
  return {
    finalMeta: {
      ...incomingMeta,
      conflictWith: valuesDiffer && existingPriority >= 30
        ? {
            value: existingMeta.value,
            source: existingMeta.source,
            documentName: existingMeta.sourceDocumentName,
          }
        : undefined,
    },
    wasOverridden: true,
    conflictDetected: valuesDiffer,
  };
}

/**
 * Creates a DataHistoryEntry audit record
 */
export function createDataHistoryEntry(params: {
  field: string;
  previousValue: any;
  newValue: any;
  source: FieldSourceType;
  changedBy?: string;
  documentName?: string;
}): DataHistoryEntry {
  return {
    field: params.field,
    previousValue: params.previousValue,
    newValue: params.newValue,
    source: params.source,
    changedAt: new Date().toISOString(),
    changedBy: params.changedBy || 'System / Underwriting',
    documentName: params.documentName,
  };
}
