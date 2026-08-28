import React, { useState, useMemo } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Building2,
  FolderArchive,
  PhoneCall,
  GitCompare,
  ArrowRight,
  X,
  FileCheck2,
  RefreshCw,
  Sparkles,
  Lock,
  Unlock,
} from 'lucide-react';
import { Client, FundingDeal, DocumentItem, ConflictItem, CanonicalPipelineStage } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { evaluateReadyForUnderwriting, detectDealConflicts } from '../../utils/riskEvaluationEngine';

interface ReadyForUnderwritingModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  deal?: FundingDeal;
  onSuccess?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ReadyForUnderwritingModal: React.FC<ReadyForUnderwritingModalProps> = ({
  isOpen,
  onClose,
  client,
  deal,
  onSuccess,
  onNavigateToTab,
}) => {
  const { currentUser } = useAuth();
  const { documents, updateClient, updateDeal, addToast } = useData();
  const [submitting, setSubmitting] = useState(false);
  const [staffAttribution, setStaffAttribution] = useState(currentUser?.name || client.assignedStaff || 'Dana');
  const [overrideRemarks, setOverrideRemarks] = useState('');
  const [allowOverride, setAllowOverride] = useState(false);

  const clientDocs = useMemo(
    () => documents.filter((d) => d.clientId === client.id),
    [documents, client.id]
  );

  const conflicts = useMemo(
    () => detectDealConflicts(deal, client, clientDocs),
    [deal, client, clientDocs]
  );

  const evaluation = useMemo(
    () => evaluateReadyForUnderwriting(client, deal, clientDocs, conflicts),
    [client, deal, clientDocs, conflicts]
  );

  if (!isOpen) return null;

  const handleAdvanceToUnderwriting = async () => {
    setSubmitting(true);
    try {
      const timestamp = new Date().toISOString();
      const staffName = staffAttribution.trim() || 'Dana';

      // 1. Update Client Record
      const updatedClientData: Partial<Client> = {
        currentStatus: 'Underwriting' as CanonicalPipelineStage,
        isUnderwritten: true,
        readyForUnderwritingAt: timestamp,
        readyForUnderwritingBy: staffName,
      };

      await updateClient(client.id, updatedClientData);

      // 2. If a deal is associated, update Deal Record as well
      if (deal) {
        await updateDeal(deal.id, {
          status: 'Underwriting',
          updatedAt: timestamp,
        });
      }

      addToast(
        'success',
        'Ready for Underwriting Cleared',
        `${client.businessName || client.firstName + ' ' + client.lastName} has been moved to Underwriting. Stacking and Credit modules unlocked.`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      addToast('error', 'Error Advancing Deal', err.message || 'Could not update status to Underwriting.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div
        className="bg-[#0b1528] border border-blue-900/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="ready-for-underwriting-modal"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-mono">
                  Prerequisite Audit
                </span>
                <span className="text-xs text-slate-400">
                  {client.businessName || `${client.firstName} ${client.lastName}`}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                Ready for Underwriting Verification Check
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              evaluation.isEligible
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            {evaluation.isEligible ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="text-sm font-bold text-white">
                {evaluation.isEligible
                  ? 'All Underwriting Prerequisites Satisfied'
                  : `Prerequisite Blockers Detected (${evaluation.blockers.length})`}
              </h4>
              <p className="text-xs opacity-90 mt-0.5">
                {evaluation.isEligible
                  ? 'Borrower verification, required banking statements, identification, and zero data conflicts confirmed. Ready to advance to Underwriting Desk.'
                  : 'Underwriting guidelines require all prerequisites to be verified before advancing to avoid blind rejections from funding sources.'}
              </p>
            </div>
          </div>

          {/* Blockers list (DO NOT fail silently - Requirement 7) */}
          {!evaluation.isEligible && (
            <div className="bg-rose-950/30 border border-rose-800/60 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Blocking Items Preventing Submission:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-200">
                {evaluation.blockers.map((blocker, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-rose-200">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span className="font-semibold">{blocker}</span>
                  </li>
                ))}
              </ul>

              {/* Action shortcuts to clear blockers */}
              <div className="pt-3 border-t border-rose-900/50 flex flex-wrap gap-2">
                {onNavigateToTab && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTab('verification');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700 flex items-center gap-1"
                    >
                      <PhoneCall className="w-3 h-3 text-blue-400" />
                      Open Verification Desk
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToTab('underwriting');
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-900/60 hover:bg-amber-800 text-amber-200 border border-amber-700 flex items-center gap-1"
                    >
                      <GitCompare className="w-3 h-3 text-amber-400" />
                      Resolve Conflicts
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Passed Items */}
          {evaluation.passedPrerequisites.length > 0 && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                Satisfied Prerequisites:
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {evaluation.passedPrerequisites.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Staff Sign-off Attribution */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authorizing Underwriter / Staff Name
              </label>
              <input
                type="text"
                value={staffAttribution}
                onChange={(e) => setStaffAttribution(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
                placeholder="Staff name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Status
              </label>
              <div className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-400 font-bold font-mono">
                Underwriting (Cleared)
              </div>
            </div>
          </div>

          {/* Management Override Checkbox if Blocked */}
          {!evaluation.isEligible && (
            <div className="bg-amber-950/20 border border-amber-900/50 p-3.5 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverride}
                  onChange={(e) => setAllowOverride(e.target.checked)}
                  className="rounded border-amber-500 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-amber-300">
                  Manager Exception Override (Allow advancement with documented conditions)
                </span>
              </label>
              {allowOverride && (
                <input
                  type="text"
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  placeholder="State reason for underwriting exception..."
                  className="w-full bg-slate-900 border border-amber-700/60 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleAdvanceToUnderwriting}
            disabled={(!evaluation.isEligible && !allowOverride) || submitting}
            className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg ${
              evaluation.isEligible || allowOverride
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer shadow-amber-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-50'
            }`}
          >
            {submitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Scale className="w-4 h-4" />
            )}
            <span>CLEAR & ADVANCE TO UNDERWRITING</span>
          </button>
        </div>
      </div>
    </div>
  );
};
