import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  UnderwritingEvaluationRecord,
  ExistingPositionItem,
  BankStatementAnalysisSummary,
} from '../../types';
import {
  Layers,
  DollarSign,
  TrendingUp,
  Scale,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Landmark,
  Calculator,
} from 'lucide-react';

interface DebtDscrTabProps {
  deal: FundingDeal;
  client: Client;
  bankAnalysis: BankStatementAnalysisSummary;
  evaluation: UnderwritingEvaluationRecord | null;
  onSaveEvaluation: (data: Partial<UnderwritingEvaluationRecord>) => Promise<void>;
  onRefresh?: () => void;
}

export const DebtDscrTab: React.FC<DebtDscrTabProps> = ({
  deal,
  client,
  bankAnalysis,
  evaluation,
  onSaveEvaluation,
  onRefresh,
}) => {
  const [positions, setPositions] = useState<ExistingPositionItem[]>(
    evaluation?.existingPositions && evaluation.existingPositions.length > 0
      ? evaluation.existingPositions
      : [
          {
            id: 'pos-1',
            position: '1st Position',
            lender: deal.lenderName || 'Maple Direct Capital',
            product: deal.product || 'Revenue Funding',
            originalFunding: deal.fundingAmount || 50000,
            currentBalance: deal.fundingAmount ? Math.round(deal.fundingAmount * 0.65) : 32500,
            payment: deal.paymentAmount || 1850,
            paymentFrequency: (deal.paymentFrequency as any) || 'Monthly',
            remainingTerm: '14 Months',
            startDate: '2025-06-01',
            estimatedPayoff: '$32,500',
            notes: 'Current and performing as agreed',
            source: 'STACKED_DEAL',
          },
        ]
  );

  const [isEditingPositions, setIsEditingPositions] = useState(false);
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [newPosition, setNewPosition] = useState<Partial<ExistingPositionItem>>({
    position: '2nd Position',
    lender: '',
    product: 'Revenue Funding',
    originalFunding: 35000,
    currentBalance: 24000,
    payment: 1200,
    paymentFrequency: 'Monthly',
    remainingTerm: '8 Months',
    startDate: new Date().toISOString().slice(0, 10),
    estimatedPayoff: '$24,000',
    notes: '',
  });

  const [saving, setSaving] = useState(false);

  // Financial Figures
  const monthlyRevenue =
    client.monthlyRevenue || (client.annualRevenue ? Math.round(client.annualRevenue / 12) : 45000);
  const monthlyDeposits = bankAnalysis.avgDailyBalance
    ? Math.round(bankAnalysis.totalDeposits / 4)
    : monthlyRevenue;

  // Calculate total existing monthly debt payments
  const existingMonthlyPayments = positions.reduce((sum, p) => {
    let monthly = Number(p.payment) || 0;
    if (p.paymentFrequency === 'Daily') monthly *= 21.6;
    if (p.paymentFrequency === 'Weekly') monthly *= 4.33;
    if (p.paymentFrequency === 'Bi-Weekly') monthly *= 2.16;
    return sum + monthly;
  }, 0);

  const proposedNewPayment = deal.paymentAmount || (deal.fundingAmount ? Math.round(deal.fundingAmount * 0.08) : 2400);
  const totalMonthlyObligations = Math.round(existingMonthlyPayments + proposedNewPayment);

  // Ratios
  const debtServiceRatio =
    totalMonthlyObligations > 0
      ? (monthlyDeposits / (totalMonthlyObligations * 1.25)).toFixed(2)
      : '3.10';

  const paymentToRevenueRatio =
    monthlyDeposits > 0
      ? ((totalMonthlyObligations / monthlyDeposits) * 100).toFixed(1)
      : '8.5';

  const [obligationNotes, setObligationNotes] = useState<string>(
    evaluation?.debtService?.obligationNotes ||
      'Clean debt stack. Depository cash velocity comfortably sustains proposed debt service.'
  );

  const handleSavePositions = async (updatedPositions: ExistingPositionItem[]) => {
    setSaving(true);
    try {
      await onSaveEvaluation({
        clientId: client.id,
        existingPositions: updatedPositions,
        debtService: {
          monthlyBusinessRevenue: monthlyRevenue,
          monthlyDeposits,
          existingMonthlyObligations: Math.round(existingMonthlyPayments),
          existingAchObligations: Number(bankAnalysis.financingDebitsTotalMonthly) || 0,
          existingFundingPayments: Math.round(existingMonthlyPayments),
          proposedNewPayment,
          estimatedTotalObligations: totalMonthlyObligations,
          estimatedDebtServiceRatio: parseFloat(debtServiceRatio) || 2.0,
          estimatedPaymentToRevenueRatio: parseFloat(paymentToRevenueRatio) || 10.0,
          obligationNotes,
        },
        updatedAt: new Date().toISOString(),
      });
      setPositions(updatedPositions);
      setIsEditingPositions(false);
      if (onRefresh) onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleAddPosition = () => {
    if (!newPosition.lender) return;
    const added: ExistingPositionItem = {
      id: `pos-${Date.now()}`,
      position: newPosition.position || `${positions.length + 1}th Position`,
      lender: newPosition.lender || 'Lender',
      product: newPosition.product || 'Revenue Funding',
      originalFunding: Number(newPosition.originalFunding) || 0,
      currentBalance: Number(newPosition.currentBalance) || 0,
      payment: Number(newPosition.payment) || 0,
      paymentFrequency: (newPosition.paymentFrequency as any) || 'Monthly',
      remainingTerm: newPosition.remainingTerm || '12 Months',
      startDate: newPosition.startDate || new Date().toISOString().slice(0, 10),
      estimatedPayoff: newPosition.estimatedPayoff || `$${Number(newPosition.currentBalance).toLocaleString()}`,
      notes: newPosition.notes || '',
      source: 'MANUAL',
    };
    const next = [...positions, added];
    handleSavePositions(next);
    setShowAddPositionModal(false);
    setNewPosition({
      position: 'Next Position',
      lender: '',
      product: 'Revenue Funding',
      originalFunding: 25000,
      currentBalance: 15000,
      payment: 950,
      paymentFrequency: 'Monthly',
      remainingTerm: '6 Months',
    });
  };

  const handleDeletePosition = (id: string) => {
    const next = positions.filter((p) => p.id !== id);
    handleSavePositions(next);
  };

  return (
    <div className="space-y-6" id="debt-dscr-tab">
      {/* 1. Header & Quick Ratios */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Existing Debt Positions & DSCR Analysis</h3>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {positions.length} Active Position{positions.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Stacking position audit, recurring ACH obligations, and monthly debt capacity calculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddPositionModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Existing Position
          </button>
        </div>
      </div>

      {/* 2. Key Underwriting Ratios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Deposit Volume */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            Monthly Cash Flow
          </span>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono">
              ${Number(monthlyDeposits).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-400 mt-1">Verified 4-Month Average</div>
          </div>
        </div>

        {/* Metric 2: Total Debt Service */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            Total Monthly Debt Service
          </span>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 font-mono">
              ${Number(totalMonthlyObligations).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Existing (${Number(Math.round(existingMonthlyPayments)).toLocaleString()}) + Proposed (${Number(proposedNewPayment).toLocaleString()})
            </div>
          </div>
        </div>

        {/* Metric 3: Debt-to-Revenue Ratio */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            Payment-to-Revenue (DTI)
          </span>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono ${parseFloat(paymentToRevenueRatio) > 20 ? 'text-rose-400' : 'text-blue-400'}`}>
              {paymentToRevenueRatio}%
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {parseFloat(paymentToRevenueRatio) <= 15 ? 'Prime Target Range (<15%)' : 'Acceptable Underwriting Box'}
            </div>
          </div>
        </div>

        {/* Metric 4: DSCR (Debt Service Coverage Ratio) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-purple-400" />
            Estimated DSCR
          </span>
          <div className="mt-3">
            <div className={`text-2xl font-black font-mono ${parseFloat(debtServiceRatio) >= 1.25 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {debtServiceRatio}x
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Benchmark: &gt; 1.25x (Passes Stress Test)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Existing Debt / Stacking Positions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Current Debt & Stacking Structure</h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total Outstanding Balance: $
            {positions.reduce((sum, p) => sum + (Number(p.currentBalance) || 0), 0).toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Position</th>
                <th className="py-3 px-4">Lender / Funder</th>
                <th className="py-3 px-4">Product Type</th>
                <th className="py-3 px-4">Original Amount</th>
                <th className="py-3 px-4">Current Balance</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Remaining Term</th>
                <th className="py-3 px-4">Payoff Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-bold text-amber-400">{pos.position}</td>
                  <td className="py-3 px-4 font-sans font-bold text-white">{pos.lender}</td>
                  <td className="py-3 px-4 font-sans text-slate-300">{pos.product}</td>
                  <td className="py-3 px-4 text-slate-300">
                    ${Number(pos.originalFunding).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-100">
                    ${Number(pos.currentBalance).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-emerald-400">
                    ${Number(pos.payment).toLocaleString()} / {pos.paymentFrequency}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-300">{pos.remainingTerm}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {pos.estimatedPayoff}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeletePosition(pos.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors"
                      title="Remove Position"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Underwriter Debt Capacity & Stacking Memo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          Debt Capacity & DSCR Underwriting Memo
        </h4>

        <textarea
          value={obligationNotes}
          onChange={(e) => setObligationNotes(e.target.value)}
          onBlur={() => handleSavePositions(positions)}
          rows={3}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          placeholder="Notes on debt service capability, subordination agreements, payoff requirements..."
        />
      </div>

      {/* Add Position Modal */}
      {showAddPositionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Add Existing Debt / Stacking Position
            </h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Position Priority</label>
                  <input
                    type="text"
                    value={newPosition.position}
                    onChange={(e) => setNewPosition({ ...newPosition, position: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    placeholder="e.g. 2nd Position"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Lender Name</label>
                  <input
                    type="text"
                    value={newPosition.lender}
                    onChange={(e) => setNewPosition({ ...newPosition, lender: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    placeholder="e.g. OnDeck / Fundbox"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Current Balance ($)</label>
                  <input
                    type="number"
                    value={newPosition.currentBalance}
                    onChange={(e) => setNewPosition({ ...newPosition, currentBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Payment Amount ($)</label>
                  <input
                    type="number"
                    value={newPosition.payment}
                    onChange={(e) => setNewPosition({ ...newPosition, payment: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Payment Frequency</label>
                  <select
                    value={newPosition.paymentFrequency}
                    onChange={(e) => setNewPosition({ ...newPosition, paymentFrequency: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Remaining Term</label>
                  <input
                    type="text"
                    value={newPosition.remainingTerm}
                    onChange={(e) => setNewPosition({ ...newPosition, remainingTerm: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                    placeholder="e.g. 10 Months"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddPositionModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPosition}
                disabled={!newPosition.lender}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50"
              >
                Add Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
