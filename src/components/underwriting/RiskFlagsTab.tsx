import React, { useState } from 'react';
import { FundingDeal, Client, RiskFlagItem } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Filter,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface RiskFlagsTabProps {
  deal: FundingDeal;
  client: Client;
  riskFlags: RiskFlagItem[];
  onUpdateRiskFlags: (flags: RiskFlagItem[], note?: string) => Promise<void>;
}

export const RiskFlagsTab: React.FC<RiskFlagsTabProps> = ({
  deal,
  client,
  riskFlags,
  onUpdateRiskFlags,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'MITIGATED'>('ALL');
  const [selectedFlag, setSelectedFlag] = useState<RiskFlagItem | null>(null);
  const [mitigationNote, setMitigationNote] = useState('');
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'MITIGATE' | 'WAIVE' | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredFlags = riskFlags.filter((f) => {
    if (selectedFilter === 'ACTIVE') return f.status === 'ACTIVE';
    if (selectedFilter === 'CRITICAL') return f.severity === 'CRITICAL' && f.status === 'ACTIVE';
    if (selectedFilter === 'MITIGATED') return f.status === 'MITIGATED' || f.status === 'WAIVED';
    return true;
  });

  const handleAction = async (type: 'ACKNOWLEDGE' | 'MITIGATE' | 'WAIVE') => {
    if (!selectedFlag) return;
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const updatedFlags = riskFlags.map((f) => {
        if (f.id === selectedFlag.id || f.code === selectedFlag.code) {
          if (type === 'ACKNOWLEDGE') {
            return {
              ...f,
              status: 'ACKNOWLEDGED' as const,
              acknowledgedBy: 'Staff Underwriter',
              acknowledgedAt: now,
            };
          } else if (type === 'MITIGATE') {
            return {
              ...f,
              status: 'MITIGATED' as const,
              mitigationNotes: mitigationNote || 'Mitigated with supporting financial evidence.',
              mitigatedBy: 'Staff Underwriter',
              mitigatedAt: now,
            };
          } else if (type === 'WAIVE') {
            return {
              ...f,
              status: 'WAIVED' as const,
              mitigationNotes: mitigationNote || 'Waived per Underwriting Team Lead authorization.',
              mitigatedBy: 'Team Lead',
              mitigatedAt: now,
            };
          }
        }
        return f;
      });

      const auditNote = `${type} on flag "${selectedFlag.title}". Reason: ${mitigationNote || 'Reviewed'}`;
      await onUpdateRiskFlags(updatedFlags, auditNote);
      setSelectedFlag(null);
      setActionType(null);
      setMitigationNote('');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (severity: string, status: string) => {
    if (status === 'MITIGATED' || status === 'WAIVED') {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          {status}
        </span>
      );
    }
    if (status === 'ACKNOWLEDGED') {
      return (
        <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-950/80 text-blue-300 border border-blue-700 flex items-center gap-1">
          <Info className="w-3 h-3" />
          ACKNOWLEDGED
        </span>
      );
    }
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-950/90 text-rose-300 border border-rose-700 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            CRITICAL BLOCKER
          </span>
        );
      case 'HIGH':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-950/90 text-amber-300 border border-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-yellow-950/80 text-yellow-300 border border-yellow-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
            <Info className="w-3 h-3" />
            LOW / INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="risk-flags-tab">
      {/* 1. Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-bold text-white">Underwriting Risk Flags & Mitigations</h3>
            <p className="text-xs text-slate-400">
              Evaluates real-time criteria across banking, credit, debt stacking, and business filings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 self-stretch sm:self-auto">
          {(['ALL', 'ACTIVE', 'CRITICAL', 'MITIGATED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                selectedFilter === filter
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Flags Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredFlags.length > 0 ? (
          filteredFlags.map((flag) => (
            <div
              key={flag.id || flag.code}
              className={`rounded-xl border p-5 transition-all ${
                flag.status === 'MITIGATED' || flag.status === 'WAIVED'
                  ? 'bg-slate-900/60 border-slate-800 opacity-80'
                  : flag.severity === 'CRITICAL'
                  ? 'bg-rose-950/20 border-rose-800/80 shadow-sm'
                  : flag.severity === 'HIGH'
                  ? 'bg-amber-950/20 border-amber-800/80 shadow-sm'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs text-slate-400 font-bold bg-slate-950 px-2 py-1 rounded border border-slate-800">
                    {flag.code}
                  </div>
                  <h4 className="text-sm font-bold text-white tracking-wide">{flag.title}</h4>
                </div>
                <div>{getSeverityBadge(flag.severity, flag.status)}</div>
              </div>

              <div className="mt-3 text-xs text-slate-300 leading-relaxed">{flag.reason}</div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>
                    Evidence Source: <strong className="text-slate-200">{flag.source}</strong>
                  </span>
                  <span>
                    Category: <strong className="text-slate-200">{flag.category}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {flag.status === 'ACTIVE' ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedFlag(flag);
                          setActionType('ACKNOWLEDGE');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFlag(flag);
                          setActionType('MITIGATE');
                        }}
                        className="px-3 py-1 text-xs font-semibold rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 transition-colors"
                      >
                        Mitigate
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFlag(flag);
                          setActionType('WAIVE');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/50 transition-colors"
                      >
                        Waive
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-medium">
                      {flag.status} by {flag.mitigatedBy || flag.acknowledgedBy || 'Staff'} •{' '}
                      {flag.mitigationNotes || 'Documented in underwriting notes'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-white">No Matching Risk Flags</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are currently zero risk flags matching the selected filter ({selectedFilter}).
            </p>
          </div>
        )}
      </div>

      {/* 3. Action / Mitigation Modal */}
      {selectedFlag && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-bold text-white">
                  {actionType === 'ACKNOWLEDGE'
                    ? 'Acknowledge Risk Flag'
                    : actionType === 'MITIGATE'
                    ? 'Document Flag Mitigation'
                    : 'Waive Underwriting Flag'}
                </h4>
              </div>
              <button
                onClick={() => {
                  setSelectedFlag(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-white">{selectedFlag.title}</span>
              <p className="text-xs text-slate-400">{selectedFlag.reason}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Staff Mitigation Notes / Justification
              </label>
              <textarea
                value={mitigationNote}
                onChange={(e) => setMitigationNote(e.target.value)}
                placeholder="e.g. Compensating factor: borrower has 3 years of strong deposits and high ending balances..."
                className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  setSelectedFlag(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(actionType)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950"
                disabled={loading}
              >
                {loading ? 'Saving...' : `Confirm ${actionType}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
