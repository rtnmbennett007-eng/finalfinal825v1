import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  FundingReadinessSummary,
  CommissionItem,
} from '../../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  DollarSign,
  Banknote,
  Send,
  Lock,
  Unlock,
  FileCheck,
  Sparkles,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react';

interface ReadyToFundTabProps {
  deal: FundingDeal;
  client: Client;
  readiness: FundingReadinessSummary;
  commissions: CommissionItem[];
  onMarkReadyToFund: (override: boolean, justification?: string) => Promise<void>;
  onNavigateToCommissions?: () => void;
  onNavigateToConflicts?: () => void;
  onNavigateToRiskFlags?: () => void;
}

export const ReadyToFundTab: React.FC<ReadyToFundTabProps> = ({
  deal,
  client,
  readiness,
  commissions,
  onMarkReadyToFund,
  onNavigateToCommissions,
  onNavigateToConflicts,
  onNavigateToRiskFlags,
}) => {
  const [overrideAuthorized, setOverrideAuthorized] = useState(false);
  const [justification, setJustification] = useState('');
  const [executing, setExecuting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasCommission =
    (deal.percentage !== undefined && deal.percentage > 0) ||
    (deal.fee !== undefined && deal.fee > 0) ||
    commissions.some((c) => (c.percentage && c.percentage > 0) || (c.amount && c.amount > 0));

  const canExecute = readiness.isReady || overrideAuthorized;

  const handleExecute = async () => {
    setExecuting(true);
    setErrorMessage(null);
    try {
      await onMarkReadyToFund(overrideAuthorized, justification);
      setShowConfirmModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to mark deal as Ready to Fund.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6" id="ready-to-fund-tab">
      {/* 1. Readiness Stance Banner */}
      <div
        className={`p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
          readiness.isReady
            ? 'bg-emerald-950/30 border-emerald-700 text-emerald-200'
            : 'bg-amber-950/30 border-amber-700 text-amber-200'
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border flex-shrink-0 ${
              readiness.isReady
                ? 'bg-emerald-900/60 border-emerald-600 text-emerald-300'
                : 'bg-amber-900/60 border-amber-600 text-amber-300'
            }`}
          >
            {readiness.isReady ? (
              <ShieldCheck className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white tracking-wide">
                Funding Readiness Score: {readiness.readinessScore}/100
              </h3>
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                  readiness.isReady
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    : 'bg-amber-950 text-amber-300 border-amber-700'
                }`}
              >
                {readiness.isReady ? 'READY TO FUND' : 'CONDITIONS PENDING'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {readiness.isReady
                ? 'All mandatory underwriting prerequisites, identity audits, bank statement ledgers, and manual commission configurations are verified.'
                : 'Certain blocking conditions or unconfigured commission terms require resolution before moving this deal to final closing.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {deal.status === 'Ready to Fund' || deal.status === 'Funded' ? (
            <div className="px-4 py-2.5 rounded-lg bg-emerald-900/50 border border-emerald-600 text-emerald-200 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Deal is currently in {deal.status.toUpperCase()} status
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!canExecute || executing}
              className={`px-6 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 ${
                canExecute
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-emerald-950/50'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              {executing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
              Mark Ready to Fund
            </button>
          )}
        </div>
      </div>

      {/* 2. Mandatory Commission Rule Card */}
      <div
        className={`p-5 rounded-xl border ${
          hasCommission
            ? 'bg-slate-900 border-slate-800'
            : 'bg-rose-950/20 border-rose-800/80 shadow-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center border mt-0.5 ${
                hasCommission
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400'
                  : 'bg-rose-950 border-rose-700 text-rose-400 animate-pulse'
              }`}
            >
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Prerequisite: Manual Commission & Fee Configuration
                </h4>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                    hasCommission
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                      : 'bg-rose-950 text-rose-300 border-rose-700'
                  }`}
                >
                  {hasCommission ? 'CONFIGURED' : 'ACTION REQUIRED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                By strict protocol, commission percentages and origination fees cannot be auto-filled or guessed. A staff underwriter must manually enter the agreed points before closing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasCommission ? (
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Configured Commission</span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {deal.percentage}% ({deal.fee ? `$${Number(deal.fee).toLocaleString()}` : 'Calculated on funding'})
                </span>
              </div>
            ) : (
              onNavigateToCommissions && (
                <button
                  onClick={onNavigateToCommissions}
                  className="px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  Configure Commission
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 3. 8-Point Detailed Checklist Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">8-Point Pre-Funding Verification Matrix</h4>
              <p className="text-xs text-slate-400">
                Audited validation rules evaluated across all system modules
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {readiness.readinessScore >= 80 ? 'Grade: A' : readiness.readinessScore >= 60 ? 'Grade: B' : 'Grade: C'}
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {readiness.checklist.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                item.isPassing ? 'bg-slate-900/30' : 'bg-slate-850/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.isPassing ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : item.isBlocking ? (
                    <XCircle className="w-5 h-5 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="text-xs font-bold text-white">{item.label}</h5>
                    <span
                      className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        item.isPassing
                          ? 'bg-emerald-950 text-emerald-300'
                          : item.isBlocking
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {item.isPassing ? 'PASSED' : item.isBlocking ? 'BLOCKING' : 'WARNING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>

              {!item.isPassing && (
                <div className="self-end sm:self-auto">
                  {item.label.includes('Conflict') && onNavigateToConflicts && (
                    <button
                      onClick={onNavigateToConflicts}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-600/30 text-amber-300 border border-amber-500/50 hover:bg-amber-600/40 transition-colors"
                    >
                      Reconcile Conflicts
                    </button>
                  )}
                  {item.label.includes('Risk') && onNavigateToRiskFlags && (
                    <button
                      onClick={onNavigateToRiskFlags}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600/30 text-rose-300 border border-rose-500/50 hover:bg-rose-600/40 transition-colors"
                    >
                      Mitigate Flags
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Manager Override Section (if blocking conditions exist) */}
      {!readiness.isReady && (
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Underwriting Authority Override</h4>
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-300 font-semibold">
              <input
                type="checkbox"
                checked={overrideAuthorized}
                onChange={(e) => setOverrideAuthorized(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500"
              />
              Authorize Override as Team Lead
            </label>
          </div>

          {overrideAuthorized && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block">
                Required Override Justification Log
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Document executive reason for overriding pending conditions..."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>
      )}

      {/* 5. Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                <h4 className="text-base font-bold text-white">
                  Confirm Ready to Fund Execution
                </h4>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Borrower:</span>
                <span className="text-white font-bold">{client.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Deal ID:</span>
                <span className="text-white font-mono">{deal.dealId || deal.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Funding Product:</span>
                <span className="text-amber-400 font-bold">{deal.product}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved Amount:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  ${Number(deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || 50000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Commission Rate:</span>
                <span className="text-white font-mono font-bold">{deal.percentage || 0}%</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded bg-rose-950 border border-rose-800 text-rose-200 text-xs">
                {errorMessage}
              </div>
            )}

            <p className="text-xs text-slate-300">
              Marking this deal as <strong>Ready to Fund</strong> updates the deal status, notifies the funding operations desk, and prepares the final closing document packet.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                disabled={executing}
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={executing}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
              >
                {executing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Confirm & Mark Ready to Fund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
