import React, { useState } from 'react';
import { FundingDeal, Client, ConflictItem, FieldSourceType } from '../../types';
import {
  AlertTriangle,
  CheckCircle2,
  GitCompare,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Edit3,
} from 'lucide-react';

interface ConflictCenterTabProps {
  deal: FundingDeal;
  client: Client;
  conflicts: ConflictItem[];
  onResolveConflict: (
    fieldKey: string,
    chosenValue: any,
    chosenSource: FieldSourceType,
    notes?: string
  ) => Promise<void>;
}

export const ConflictCenterTab: React.FC<ConflictCenterTabProps> = ({
  deal,
  client,
  conflicts,
  onResolveConflict,
}) => {
  const [resolvingKey, setResolvingKey] = useState<string | null>(null);
  const [customOverrideKey, setCustomOverrideKey] = useState<string | null>(null);
  const [customValue, setCustomValue] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const unresolved = conflicts.filter((c) => c.status === 'UNRESOLVED');
  const resolved = conflicts.filter((c) => c.status === 'RESOLVED');

  const handleAdoptSource = async (
    fieldKey: string,
    val: any,
    source: FieldSourceType,
    sourceLabel: string
  ) => {
    setResolvingKey(fieldKey);
    setLoading(true);
    try {
      await onResolveConflict(
        fieldKey,
        val,
        source,
        `Adopted ${sourceLabel} value ($${typeof val === 'number' ? Number(val).toLocaleString() : val})`
      );
    } finally {
      setResolvingKey(null);
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (fieldKey: string) => {
    if (!customValue.trim()) return;
    setLoading(true);
    try {
      await onResolveConflict(
        fieldKey,
        customValue.trim(),
        'MANUAL',
        resolutionNotes.trim() || 'Manual underwriter reconciliation'
      );
      setCustomOverrideKey(null);
      setCustomValue('');
      setResolutionNotes('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="conflict-center-tab">
      {/* 1. Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Underwriting Conflict & Reconciliation Center</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side mismatch comparison between Borrower Applications, Bank Statements, and Phone Verifications
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border ${
              unresolved.length > 0
                ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
            }`}
          >
            {unresolved.length > 0 ? `${unresolved.length} Unresolved Conflict(s)` : 'All Conflicts Reconciled'}
          </span>
        </div>
      </div>

      {/* 2. Unresolved Conflicts List */}
      <div className="space-y-4">
        {unresolved.length > 0 ? (
          unresolved.map((conflict) => (
            <div
              key={conflict.id || conflict.fieldKey}
              className="bg-slate-900 border border-amber-800/60 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    {conflict.section}
                  </span>
                  <span className="text-slate-600">•</span>
                  <h4 className="text-sm font-bold text-white">{conflict.fieldLabel}</h4>
                </div>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  Field Key: {conflict.fieldKey}
                </span>
              </div>

              <div className="p-5 space-y-4">
                <div className="text-xs text-slate-400">
                  Multiple conflicting data points were extracted for this field. Select which source to adopt as the canonical truth or enter a manual override.
                </div>

                {/* Sources comparison grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {conflict.sources.map((src, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                            {src.sourceLabel || src.source}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {src.confidence ? `${Math.round(src.confidence * 100)}% Conf` : 'Logged'}
                          </span>
                        </div>
                        <div className="mt-2 text-base font-bold text-white">
                          {typeof src.value === 'number'
                            ? `$${Number(src.value).toLocaleString()}`
                            : String(src.value)}
                        </div>
                        {src.quote && (
                          <div className="text-[11px] text-slate-500 mt-1 truncate" title={src.quote}>
                            &ldquo;{src.quote}&rdquo;
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAdoptSource(conflict.fieldKey, src.value, src.source, src.sourceLabel)}
                        disabled={loading}
                        className="w-full py-1.5 px-3 text-xs font-semibold rounded bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        {resolvingKey === conflict.fieldKey ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Adopt This Value
                      </button>
                    </div>
                  ))}

                  {/* Manual Override Card */}
                  <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Custom Underwriter Override
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Input a verified custom value with staff justification.
                      </p>
                    </div>

                    {customOverrideKey === conflict.fieldKey ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={customValue}
                          onChange={(e) => setCustomValue(e.target.value)}
                          placeholder="Reconciled value..."
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                        />
                        <input
                          type="text"
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Justification note..."
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                        />
                        <div className="flex items-center gap-1.5 pt-1">
                          <button
                            onClick={() => setCustomOverrideKey(null)}
                            className="flex-1 py-1 text-xs rounded bg-slate-800 text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleCustomSubmit(conflict.fieldKey)}
                            className="flex-1 py-1 text-xs font-bold rounded bg-amber-500 text-slate-950"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setCustomOverrideKey(conflict.fieldKey);
                          setCustomValue('');
                          setResolutionNotes('');
                        }}
                        className="w-full py-1.5 px-3 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="w-3 h-3" />
                        Enter Custom Value
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">Zero Data Conflicts Detected</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              All application numbers, phone verification records, and bank statements match within acceptable underwriting tolerances.
            </p>
          </div>
        )}
      </div>

      {/* 3. Resolved Audit History */}
      {resolved.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">
            Reconciliation & Provenance Audit History ({resolved.length})
          </h4>
          <div className="space-y-2.5">
            {resolved.map((res) => (
              <div
                key={res.id || res.fieldKey}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white mr-2">{res.fieldLabel}</span>
                  <span className="text-slate-400">
                    Reconciled to: <strong className="text-emerald-400 font-mono">{String(res.resolvedValue)}</strong>
                  </span>
                </div>
                <div className="text-slate-400 text-right">
                  <span className="text-slate-300">By {res.resolvedBy || 'Staff'}</span>
                  {res.resolutionNotes && (
                    <span className="text-slate-500 block text-[11px]">{res.resolutionNotes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
