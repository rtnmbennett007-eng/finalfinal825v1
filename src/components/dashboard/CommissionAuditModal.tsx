import React, { useState } from 'react';
import {
  Wallet,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Receipt,
  FileCheck2,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/dateUtils';
import { DealFinancialSummary } from '../../utils/dealFinancials';

interface CommissionAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  uncollectedDeals: Array<any>;
  allFundedDeals: DealFinancialSummary[];
  totalExpectedCommission: number;
  totalCollectedCommission: number;
  totalToBeCollected: number;
  onSelectDeal?: (dealId: string, clientId: string) => void;
}

export const CommissionAuditModal: React.FC<CommissionAuditModalProps> = ({
  isOpen,
  onClose,
  uncollectedDeals,
  allFundedDeals,
  totalExpectedCommission,
  totalCollectedCommission,
  totalToBeCollected,
  onSelectDeal,
}) => {
  const [filterMode, setFilterMode] = useState<'OUTSTANDING' | 'ALL_FUNDED'>('OUTSTANDING');

  if (!isOpen) return null;

  const dealsToDisplay =
    filterMode === 'OUTSTANDING'
      ? allFundedDeals.filter((d) => d.toBeCollectedCommission > 0.01)
      : allFundedDeals;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-in fade-in duration-200">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-5xl bg-[#0c1832] border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-200">
          {/* Modal Header */}
          <div className="p-5 bg-[#081124] border-b border-blue-900/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                    Commission Audit View
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-400">Reconciliation & Live Balance Ledger</span>
                </div>
                <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
                  COMMISSION TO BE COLLECTED AUDIT
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="p-4 bg-[#070d18] border-b border-blue-900/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Total Expected Commission */}
            <div className="bg-[#0e1c38] border border-blue-900/60 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                <span>TOTAL EXPECTED COMM.</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold font-mono text-slate-100 mt-1">
                ${totalExpectedCommission.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                From {allFundedDeals.length} funded deals
              </div>
            </div>

            {/* Total Collected */}
            <div className="bg-[#0e1c38] border border-emerald-500/30 p-3 rounded-xl">
              <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                <span>COMMISSION COLLECTED</span>
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
                ${totalCollectedCommission.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                Verified received payments
              </div>
            </div>

            {/* Total To Be Collected */}
            <div
              className={`p-3 rounded-xl border ${
                totalToBeCollected > 0
                  ? 'bg-[#0e1c38] border-purple-500/50'
                  : 'bg-emerald-950/20 border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between font-semibold text-[11px]">
                <span className={totalToBeCollected > 0 ? 'text-purple-300' : 'text-emerald-400'}>
                  TO BE COLLECTED
                </span>
                {totalToBeCollected > 0 ? (
                  <AlertCircle className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  totalToBeCollected > 0 ? 'text-purple-300' : 'text-emerald-300'
                }`}
              >
                ${totalToBeCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] mt-0.5 text-slate-400">
                {totalToBeCollected > 0 ? 'Outstanding balance' : 'Zero remaining balance'}
              </div>
            </div>

            {/* Outstanding Deals Count */}
            <div className="bg-[#0e1c38] border border-blue-900/60 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
                <span>DEALS WITH BALANCE</span>
                <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
                {allFundedDeals.filter((d) => d.toBeCollectedCommission > 0.01).length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Formula: max(Expected - Collected, 0)
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-2.5 bg-[#0b1528] border-b border-blue-900/40 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFilterMode('OUTSTANDING')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterMode === 'OUTSTANDING'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Deals With Outstanding Balance ({allFundedDeals.filter((d) => d.toBeCollectedCommission > 0.01).length})
              </button>
              <button
                onClick={() => setFilterMode('ALL_FUNDED')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  filterMode === 'ALL_FUNDED'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All Funded Deals Reconciliation ({allFundedDeals.length})
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-mono">
              Audit Rule: <strong className="text-emerald-400">Strict Legitimate Balances Only</strong>
            </span>
          </div>

          {/* Modal Body / Table */}
          <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
            {dealsToDisplay.length === 0 ? (
              <div className="py-12 px-4 text-center bg-[#070d18]/60 border border-dashed border-blue-900/60 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-100">$0.00</h4>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    No remaining commission to be collected.
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    All funded commission obligations are fully reconciled. No outstanding balances, duplicate allocations, or phantom amounts exist.
                  </p>
                </div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px] bg-[#0e1c38]/40">
                    <th className="py-2.5 px-3">Client / Business</th>
                    <th className="py-2.5 px-3">Funding Product</th>
                    <th className="py-2.5 px-3 text-right">Funded Amount</th>
                    <th className="py-2.5 px-3 text-right">Rate / Fee</th>
                    <th className="py-2.5 px-3 text-right">Expected Comm.</th>
                    <th className="py-2.5 px-3 text-right">Already Collected</th>
                    <th className="py-2.5 px-3 text-right">Remaining Balance</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/40 text-slate-200">
                  {dealsToDisplay.map((summary) => (
                    <tr
                      key={summary.dealId}
                      className="hover:bg-blue-900/20 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100">{summary.clientName}</div>
                        <div className="text-[10px] text-slate-400">
                          {summary.businessName} • {summary.dealId}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <ProductBadge product={summary.product} />
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        ${summary.fundingAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {summary.hasPercentage ? `${summary.percentage}%` : '—'}
                        {summary.hasFee ? ` + $${summary.fee?.toLocaleString()}` : ''}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-200">
                        ${Math.round(summary.grossCommission).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">
                        ${Math.round(summary.alreadyCollectedCommission).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            summary.toBeCollectedCommission > 0
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'text-emerald-400'
                          }`}
                        >
                          ${Math.round(summary.toBeCollectedCommission).toLocaleString()}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            summary.deal.commissionStatus === 'COLLECTED' || summary.toBeCollectedCommission <= 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {summary.deal.commissionStatus || (summary.toBeCollectedCommission <= 0 ? 'COLLECTED' : 'PENDING')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer note */}
          <div className="p-4 bg-[#081124] border-t border-blue-900/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Reconciled: Total Remaining = max(&Sigma; Expected &minus; &Sigma; Collected, $0.00). No phantom records.
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-slate-100 font-semibold transition-colors"
            >
              Close Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
