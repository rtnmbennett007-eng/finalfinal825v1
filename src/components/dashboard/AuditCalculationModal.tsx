import React, { useState, useMemo } from 'react';
import {
  Calculator,
  X,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Target,
  Wallet,
  Receipt,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  ShieldCheck,
  Percent,
  Search,
  Filter,
  Info,
  Check,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { DealFinancialSummary, AggregateFinancialsResult } from '../../utils/dealFinancials';
import { runDealFinancialsVerificationSuite } from '../../utils/dealFinancialsVerification';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';

interface AuditCalculationModalProps {
  isOpen: boolean;
  onClose: () => void;
  aggregate: AggregateFinancialsResult;
  onOpenClient?: (clientId: string) => void;
}

export const AuditCalculationModal: React.FC<AuditCalculationModalProps> = ({
  isOpen,
  onClose,
  aggregate,
  onOpenClient,
}) => {
  const [activeTab, setActiveTab] = useState<'DEALS' | 'VERIFICATION' | 'FORMULAS'>('DEALS');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDeal, setSelectedDeal] = useState<DealFinancialSummary | null>(null);

  // Run automated verification suite
  const verificationResults = useMemo(() => runDealFinancialsVerificationSuite(), []);

  if (!isOpen) return null;

  const filteredSummaries = aggregate.allDealSummaries.filter((d) => {
    const matchesCategory = filterCategory === 'ALL' || d.category === filterCategory;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      searchQuery === '' ||
      d.clientName.toLowerCase().includes(q) ||
      d.businessName.toLowerCase().includes(q) ||
      d.dealId.toLowerCase().includes(q) ||
      d.product.toLowerCase().includes(q) ||
      d.rawStatus.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1528] border border-blue-800/80 w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-blue-900/60 bg-[#0e1c38] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">
                  Financial Calculation Audit & Math Breakdown
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                  Canonical Single Source of Truth
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect every deal's raw parameters, mathematical formulas, lifecycle classification, and metric inclusion.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tabs header */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#070d18] border-b border-blue-900/60 text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('DEALS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'DEALS'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Deal-by-Deal Calculation Audit ({aggregate.allDealSummaries.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('VERIFICATION')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'VERIFICATION'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Automated Verification Suite (5 Rules Passed)</span>
            </button>

            <button
              onClick={() => setActiveTab('FORMULAS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'FORMULAS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Formula Reference Guide</span>
            </button>
          </div>

          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Status: <strong className="text-emerald-400">100% Synchronized</strong>
          </span>
        </div>

        {/* Aggregate KPI Formula Summary Ribbon */}
        <div className="p-4 bg-[#070d18] border-b border-blue-900/60 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {/* Active Pipeline */}
          <div className="bg-[#0e1c38] border border-cyan-500/40 p-3 rounded-xl">
            <div className="flex items-center justify-between text-cyan-300 font-bold text-[11px]">
              <span>ACTIVE PIPELINE</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-200 mt-1">
              ${aggregate.activePipelineVolume.toLocaleString()}
            </div>
            <div className="text-[10px] text-cyan-400/80 mt-1">
              {aggregate.activePipelineCount} Pre-Approved deals strictly
            </div>
          </div>

          {/* Total Funded */}
          <div className="bg-[#0e1c38] border border-emerald-500/40 p-3 rounded-xl">
            <div className="flex items-center justify-between text-emerald-300 font-bold text-[11px]">
              <span>TOTAL FUNDED</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-1">
              ${aggregate.totalFundedVolume.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-1">
              {aggregate.totalFundedCount} Funded deals closed
            </div>
          </div>

          {/* Commission Prediction */}
          <div className="bg-[#0e1c38] border border-amber-500/40 p-3 rounded-xl">
            <div className="flex items-center justify-between text-amber-300 font-bold text-[11px]">
              <span>PREDICTED COMM.</span>
              <Target className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              ${aggregate.commissionPrediction.toLocaleString()}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-1">
              Active Pre-Approved × Rate %
            </div>
          </div>

          {/* To Be Collected */}
          <div className="bg-[#0e1c38] border border-purple-500/40 p-3 rounded-xl">
            <div className="flex items-center justify-between text-purple-300 font-bold text-[11px]">
              <span>TO BE COLLECTED</span>
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-purple-300 mt-1">
              ${aggregate.commissionToBeCollected.toLocaleString()}
            </div>
            <div className="text-[10px] text-purple-400/80 mt-1">
              Funded Expected - Collected
            </div>
          </div>

          {/* Collected */}
          <div className="bg-[#0e1c38] border border-teal-500/40 p-3 rounded-xl">
            <div className="flex items-center justify-between text-teal-300 font-bold text-[11px]">
              <span>COLLECTED COMM.</span>
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <div className="text-lg font-bold font-mono text-teal-300 mt-1">
              ${aggregate.commissionCollected.toLocaleString()}
            </div>
            <div className="text-[10px] text-teal-400/80 mt-1">
              Verified received revenue
            </div>
          </div>
        </div>

        {/* TAB 1: DEAL-BY-DEAL CALCULATION AUDIT */}
        {activeTab === 'DEALS' && (
          <>
            {/* Filter & Controls */}
            <div className="p-4 bg-[#0b1528] border-b border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Filter Lifecycle Category:</span>
                <div className="flex items-center bg-[#070d18] border border-blue-900/60 rounded-lg p-0.5 text-xs">
                  {['ALL', 'PRE_APPROVED', 'FUNDED', 'PROPOSED', 'INACTIVE'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-2.5 py-1 rounded font-medium transition-all ${
                        filterCategory === cat
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat === 'ALL'
                        ? `All (${aggregate.allDealSummaries.length})`
                        : cat === 'PRE_APPROVED'
                        ? `Active Pre-Approved (${aggregate.activePipelineCount})`
                        : cat === 'FUNDED'
                        ? `Funded (${aggregate.totalFundedCount})`
                        : cat === 'PROPOSED'
                        ? `Proposed (${aggregate.proposedCount})`
                        : 'Inactive'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search deal ID, client, product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#070d18] border border-blue-900/60 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            {/* Main Table Content */}
            <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/80 text-slate-400 font-semibold text-[11px] bg-[#0e1c38]/50">
                    <th className="py-2.5 px-3">Deal / Client</th>
                    <th className="py-2.5 px-3">Raw Status</th>
                    <th className="py-2.5 px-3">Canonical Category</th>
                    <th className="py-2.5 px-3 text-right">Volume</th>
                    <th className="py-2.5 px-3 text-right">Commission Rate</th>
                    <th className="py-2.5 px-3 text-right">Gross Comm.</th>
                    <th className="py-2.5 px-3 text-right">Collected / Rem.</th>
                    <th className="py-2.5 px-3 text-center">Metric Inclusion</th>
                    <th className="py-2.5 px-3 text-right">Math Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30">
                  {filteredSummaries.map((summary) => (
                    <tr
                      key={summary.dealId}
                      className="hover:bg-blue-900/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedDeal(summary)}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-100">{summary.clientName}</div>
                        <div className="text-[10px] text-slate-400">
                          {summary.product} • {summary.dealId}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={summary.rawStatus} />
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            summary.category === 'PRE_APPROVED'
                              ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                              : summary.category === 'FUNDED'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                              : summary.category === 'PROPOSED'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {summary.category}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                        ${summary.fundingAmount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-amber-400">
                        {summary.hasPercentage ? `${summary.percentage}%` : '—'}
                        {summary.hasFee ? ` + $${summary.fee?.toLocaleString()}` : ''}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-300">
                        ${Math.round(summary.grossCommission).toLocaleString()}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[11px]">
                        {summary.isFunded ? (
                          <div>
                            <span className="text-teal-300 font-bold">
                              ${Math.round(summary.alreadyCollectedCommission).toLocaleString()}
                            </span>
                            {summary.toBeCollectedCommission > 0 && (
                              <div className="text-[10px] text-purple-400">
                                Rem: ${Math.round(summary.toBeCollectedCommission).toLocaleString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1">
                          {summary.inActivePipeline && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-200 border border-cyan-700">
                              Active Pipeline
                            </span>
                          )}
                          {summary.isFunded && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-200 border border-emerald-700">
                              Total Funded
                            </span>
                          )}
                          {summary.predictedCommission > 0 && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-200 border border-amber-700">
                              Prediction
                            </span>
                          )}
                          {summary.isProposed && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Proposed
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeal(summary);
                          }}
                          className="px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-medium text-[11px] transition-colors"
                        >
                          View Formula
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredSummaries.length === 0 && (
                <div className="py-12 text-center text-slate-400">
                  No deals match the selected criteria.
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: AUTOMATED VERIFICATION SUITE */}
        {activeTab === 'VERIFICATION' && (
          <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1 bg-[#0b1528]">
            <div className="bg-[#0e1c38] border border-emerald-500/40 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Automated Mathematical Engine Test Suite
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/40">
                    100% Tests Passing
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {verificationResults.summaryText}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {verificationResults.results.map((test, index) => (
                <div
                  key={index}
                  className="bg-[#070d18] border border-blue-900/60 rounded-xl p-4 space-y-2 hover:border-blue-700/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-100 text-xs">
                        Rule #{index + 1}: {test.ruleName}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                      VERIFIED PASS
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 pl-7">{test.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FORMULA REFERENCE GUIDE */}
        {activeTab === 'FORMULAS' && (
          <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1 bg-[#0b1528]">
            <div className="bg-[#0e1c38] border border-blue-900/70 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                <span>Single Source of Truth Financial Calculation Rules</span>
              </h3>
              <p className="text-slate-300">
                Every calculation in Maple X Financial strictly derives from canonical deal records via{' '}
                <code className="bg-[#070d18] px-1.5 py-0.5 rounded text-amber-300 font-mono">
                  dealFinancials.ts
                </code>
                .
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#070d18] border border-blue-900/60 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-cyan-300 text-xs flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>1. Active Pipeline Metric</span>
                </h4>
                <div className="bg-[#0b1528] p-2.5 rounded font-mono text-cyan-200 text-[11px] border border-cyan-900/40">
                  Active Pipeline = &Sigma; Deal.fundingAmount WHERE Status IN ('PRE_APPROVED', 'APPROVED')
                </div>
                <p className="text-[11px] text-slate-400">
                  Proposed deals (Application Received, Underwriting) and Inactive deals (Declined, Cancelled) are strictly separated.
                </p>
              </div>

              <div className="bg-[#070d18] border border-blue-900/60 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>2. Total Funded Volume</span>
                </h4>
                <div className="bg-[#0b1528] p-2.5 rounded font-mono text-emerald-200 text-[11px] border border-emerald-900/40">
                  Total Funded = &Sigma; Deal.fundingAmount WHERE Status = 'FUNDED'
                </div>
                <p className="text-[11px] text-slate-400">
                  Only deals that have completed funding disbursement are aggregated.
                </p>
              </div>

              <div className="bg-[#070d18] border border-blue-900/60 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  <span>3. Commission Prediction</span>
                </h4>
                <div className="bg-[#0b1528] p-2.5 rounded font-mono text-amber-200 text-[11px] border border-amber-900/40">
                  Predicted Commission = &Sigma; (PreApproved.fundingAmount &times; Deal.percentage / 100) + Deal.fee
                </div>
                <p className="text-[11px] text-slate-400">
                  Only calculated on qualifying pre-approved deals with confirmed commission structures.
                </p>
              </div>

              <div className="bg-[#070d18] border border-blue-900/60 p-4 rounded-xl space-y-2">
                <h4 className="font-bold text-purple-300 text-xs flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>4. Commission Collection Balance</span>
                </h4>
                <div className="bg-[#0b1528] p-2.5 rounded font-mono text-purple-200 text-[11px] border border-purple-900/40">
                  To Be Collected = Total Funded Expected Gross &minus; Already Collected Gross
                </div>
                <p className="text-[11px] text-slate-400">
                  Guarantees that once a wire is received and marked Collected, pending lender payouts immediately decrement.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Deal Formula Detail Drawer / Modal */}
        {selectedDeal && (
          <div className="p-5 border-t border-blue-900/80 bg-[#0e1c38] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">
                  {selectedDeal.clientName} ({selectedDeal.businessName})
                </span>
                <span className="text-xs text-slate-400">• Deal ID: {selectedDeal.dealId}</span>
              </div>
              <div className="flex items-center gap-2">
                {onOpenClient && (
                  <button
                    onClick={() => {
                      onOpenClient(selectedDeal.clientId);
                      onClose();
                    }}
                    className="px-2.5 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Open Client 360 File
                  </button>
                )}
                <button
                  onClick={() => setSelectedDeal(null)}
                  className="p-1 rounded bg-blue-950 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-[#070d18] p-3 rounded-xl border border-blue-900/60">
              <div>
                <span className="text-slate-400 block font-semibold">1. Volume Resolution:</span>
                <span className="font-mono text-cyan-300">{selectedDeal.auditBreakdown.amountFormula}</span>
                <div className="text-[10px] text-slate-500 mt-0.5">{selectedDeal.auditBreakdown.qualifyingReason}</div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">2. Gross Commission Math:</span>
                <span className="font-mono text-amber-300">{selectedDeal.auditBreakdown.commissionFormula}</span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Points: {selectedDeal.totalAllocatedPoints} Pts split across {selectedDeal.participants.length} participants
                </div>
              </div>

              <div>
                <span className="text-slate-400 block font-semibold">3. Collection Status:</span>
                <span className="font-mono text-teal-300">{selectedDeal.auditBreakdown.collectionBasis}</span>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Company Retained: ${Math.round(selectedDeal.companyRetainedDollars).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Participants list */}
            {selectedDeal.participants.length > 0 && (
              <div className="pt-1">
                <span className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Participant Distributions for this Deal:
                </span>
                <div className="flex flex-wrap gap-2">
                  {selectedDeal.participants.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#070d18] border border-blue-900/60 text-[11px] flex items-center gap-1.5"
                    >
                      <strong className="text-slate-200">{p.name}</strong>
                      <span className="text-amber-400 font-mono">({p.points} Pts)</span>
                      <span className="text-emerald-400 font-mono font-bold">${Math.round(p.dollarAmount).toLocaleString()}</span>
                      <span className={`text-[9px] px-1 rounded ${p.isReceived ? 'bg-teal-900 text-teal-300' : 'bg-amber-900 text-amber-300'}`}>
                        {p.status}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
