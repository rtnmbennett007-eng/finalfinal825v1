import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  BankStatementAnalysisSummary,
  DocumentItem,
} from '../../types';
import {
  Landmark,
  TrendingUp,
  AlertOctagon,
  Calendar,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  FileCheck2,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  FileText,
  DollarSign,
  Calculator,
  Building2,
  Plus,
  Scale,
} from 'lucide-react';
import { DocumentAiReviewModal } from '../documents/DocumentAiReviewModal';

interface BankStatementAnalysisTabProps {
  deal: FundingDeal;
  client: Client;
  bankAnalysis: BankStatementAnalysisSummary;
  documents: DocumentItem[];
  onUpdateBankAnalysis: (updated: BankStatementAnalysisSummary) => Promise<void>;
  onTriggerAiScan?: () => void;
}

export const BankStatementAnalysisTab: React.FC<BankStatementAnalysisTabProps> = ({
  deal,
  client,
  bankAnalysis,
  documents,
  onUpdateBankAnalysis,
  onTriggerAiScan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<BankStatementAnalysisSummary>(bankAnalysis);
  const [saving, setSaving] = useState(false);
  const [activeReviewDoc, setActiveReviewDoc] = useState<DocumentItem | null>(null);

  // Financial Documents (P&L, Tax Returns, Balance Sheet) State
  const [showFinancialDocAnalysis, setShowFinancialDocAnalysis] = useState(true);
  const [grossRevenuePnL, setGrossRevenuePnL] = useState<number>(client.annualRevenue || 540000);
  const [cogsPnL, setCogsPnL] = useState<number>(Math.round((client.annualRevenue || 540000) * 0.42));
  const [operatingExpensesPnL, setOperatingExpensesPnL] = useState<number>(Math.round((client.annualRevenue || 540000) * 0.38));
  const [netIncomePnL, setNetIncomePnL] = useState<number>(
    (client.annualRevenue || 540000) - Math.round((client.annualRevenue || 540000) * 0.42) - Math.round((client.annualRevenue || 540000) * 0.38)
  );
  const [depreciationAddBack, setDepreciationAddBack] = useState<number>(18500);
  const [officerCompensation, setOfficerCompensation] = useState<number>(75000);
  const [taxFormType, setTaxFormType] = useState<string>('Form 1120-S (S-Corporation)');
  const [taxYearReviewed, setTaxYearReviewed] = useState<string>('2024 / 2023');

  const bankDocs = documents.filter((d) => (d.category || '').toLowerCase().includes('bank'));
  const financialDocs = documents.filter(
    (d) =>
      (d.category || '').toLowerCase().includes('tax') ||
      (d.category || '').toLowerCase().includes('profit') ||
      (d.category || '').toLowerCase().includes('financial') ||
      (d.category || '').toLowerCase().includes('p&l')
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateBankAnalysis(formData);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleMonthlyChange = (index: number, field: string, value: any) => {
    const updated = [...(formData.monthlyBreakdowns || [])];
    updated[index] = { ...updated[index], [field]: value };
    // Recalculate totals
    const totalDep = updated.reduce((sum, m) => sum + (Number(m.totalDeposits) || 0), 0);
    const totalNsfs = updated.reduce((sum, m) => sum + (Number(m.nsfs) || 0), 0);
    const totalNegDays = updated.reduce((sum, m) => sum + (Number(m.negativeDays) || 0), 0);
    setFormData({
      ...formData,
      monthlyBreakdowns: updated,
      totalDeposits: totalDep,
      nsfsCount: totalNsfs,
      negativeBalanceDays: totalNegDays,
    });
  };

  const adjustedCashFlow = netIncomePnL + depreciationAddBack + Math.round(officerCompensation * 0.5);

  return (
    <div className="space-y-6" id="bank-statement-analysis-tab">
      {/* 1. Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Bank Statement & Financial Document Analysis</h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                {formData.statementPeriod || 'Last 4 Months'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Depository: <span className="text-slate-200 font-medium">{formData.bankName || client.businessBank || 'Operating Bank'}</span> • Account Holder:{' '}
              <span className="text-slate-200 font-medium">{formData.accountHolder || client.businessName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {bankDocs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveReviewDoc(bankDocs[0])}
              className="px-3 py-2 text-xs font-bold rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              View Vision Extraction ({bankDocs.length} Docs)
            </button>
          )}

          {isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                Save Analysis
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Edit Figures
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg. Monthly Deposits</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-emerald-400">
              ${Math.round(formData.totalDeposits / 4).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-mono">
              Total 4-Mo: ${formData.totalDeposits.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg. Daily Balance</span>
            <Landmark className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-blue-400">
              ${formData.avgDailyBalance.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Operating Liquidity Ratio</div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>NSF / Overdraft Events</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold font-mono ${formData.nsfsCount > 0 ? 'text-rose-400' : 'text-slate-100'}`}>
              {formData.nsfsCount} NSFs
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {formData.negativeBalanceDays} Negative Balance Days
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Financing ACH Debits</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold font-mono text-amber-400">
              ${Number(formData.financingDebitsTotalMonthly || 0).toLocaleString()}
              <span className="text-xs font-normal text-slate-400">/mo</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {formData.recurringAchObligations ? formData.recurringAchObligations.length : 0} Active ACH Position(s)
            </div>
          </div>
        </div>
      </div>

      {/* 3. Monthly Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">4-Month Depository Cash Flow Breakdown</h4>
          </div>
          <span className="text-xs text-slate-400">Values extracted via Vision AI & Verified</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Statement Month</th>
                <th className="py-3 px-4">Total Deposits ($)</th>
                <th className="py-3 px-4">Ending Balance ($)</th>
                <th className="py-3 px-4">Negative Days</th>
                <th className="py-3 px-4">NSFs</th>
                <th className="py-3 px-4">Financing ACH ($)</th>
                <th className="py-3 px-4">Underwriting Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {formData.monthlyBreakdowns && formData.monthlyBreakdowns.length > 0 ? (
                formData.monthlyBreakdowns.map((month, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-bold text-white">{month.month}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          value={month.totalDeposits}
                          onChange={(e) => handleMonthlyChange(idx, 'totalDeposits', parseFloat(e.target.value) || 0)}
                          className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        `$${month.totalDeposits.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {isEditing ? (
                        <input
                          type="number"
                          value={month.endingBalance}
                          onChange={(e) => handleMonthlyChange(idx, 'endingBalance', parseFloat(e.target.value) || 0)}
                          className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        `$${month.endingBalance.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={month.negativeDays}
                          onChange={(e) => handleMonthlyChange(idx, 'negativeDays', parseInt(e.target.value, 10) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        <span className={month.negativeDays > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {month.negativeDays}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input
                          type="number"
                          value={month.nsfs}
                          onChange={(e) => handleMonthlyChange(idx, 'nsfs', parseInt(e.target.value, 10) || 0)}
                          className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        <span className={month.nsfs > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {month.nsfs}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-amber-300">
                      {isEditing ? (
                        <input
                          type="number"
                          value={month.achDebits}
                          onChange={(e) => handleMonthlyChange(idx, 'achDebits', parseFloat(e.target.value) || 0)}
                          className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white"
                        />
                      ) : (
                        `$${month.achDebits.toLocaleString()}`
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">
                      {isEditing ? (
                        <input
                          type="text"
                          value={month.notes}
                          onChange={(e) => handleMonthlyChange(idx, 'notes', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-sans text-xs"
                        />
                      ) : (
                        month.notes
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-500 font-sans">
                    No monthly bank statement breakdown available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Financial Document Analysis (P&L, Tax Returns, Add-Backs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Financial Document Analysis (P&L & Tax Returns)</h4>
              <p className="text-xs text-slate-400">
                P&L Statement, Corporate/Personal Tax Returns (Form 1120/1065/1040 Sch C), and EBITDA Add-backs
              </p>
            </div>
          </div>
          {financialDocs.length > 0 && (
            <button
              onClick={() => setActiveReviewDoc(financialDocs[0])}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Review Tax / P&L Doc ({financialDocs.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Gross Annual Revenue (P&L)</span>
            <input
              type="number"
              value={grossRevenuePnL}
              onChange={(e) => setGrossRevenuePnL(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-lg font-bold font-mono text-white"
            />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">COGS / Direct Costs</span>
            <input
              type="number"
              value={cogsPnL}
              onChange={(e) => setCogsPnL(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-lg font-bold font-mono text-slate-200"
            />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Operating Expenses (OpEx)</span>
            <input
              type="number"
              value={operatingExpensesPnL}
              onChange={(e) => setOperatingExpensesPnL(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-lg font-bold font-mono text-slate-200"
            />
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <span className="text-xs text-slate-400 block mb-1">Net Operating Income</span>
            <div className="text-xl font-black font-mono text-emerald-400 mt-2">
              ${(grossRevenuePnL - cogsPnL - operatingExpensesPnL).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tax Return Reconciliation & Add-Backs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Tax Return Entity Form</span>
            <select
              value={taxFormType}
              onChange={(e) => setTaxFormType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
            >
              <option value="Form 1120-S (S-Corporation)">Form 1120-S (S-Corporation)</option>
              <option value="Form 1120 (C-Corporation)">Form 1120 (C-Corporation)</option>
              <option value="Form 1065 (Partnership / LLC)">Form 1065 (Partnership / LLC)</option>
              <option value="Form 1040 Schedule C (Sole Prop)">Form 1040 Schedule C (Sole Prop)</option>
            </select>
            <span className="text-[11px] text-slate-400 block">Years Reviewed: {taxYearReviewed}</span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Depreciation / Non-Cash Add-back ($)</span>
            <input
              type="number"
              value={depreciationAddBack}
              onChange={(e) => setDepreciationAddBack(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[11px] text-slate-400 block">Added back to commercial underwriting cash flow</span>
          </div>

          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-semibold text-slate-300 block">Officer / Owner Compensation ($)</span>
            <input
              type="number"
              value={officerCompensation}
              onChange={(e) => setOfficerCompensation(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
            />
            <span className="text-[11px] text-slate-400 block">Guarantor annual W2/draw distribution</span>
          </div>
        </div>
      </div>

      {/* 5. Recurring ACH Debits & Stacking Positions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Recurring Financing ACH Debits</h4>
            </div>
            <span className="text-xs font-mono text-amber-300 font-bold">
              ${Number(formData.financingDebitsTotalMonthly || 0).toLocaleString()}/mo total
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {formData.recurringAchObligations && formData.recurringAchObligations.length > 0 ? (
              formData.recurringAchObligations.map((ach) => (
                <div
                  key={ach.id}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{ach.lender}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {ach.frequency} Payment • Detected from: {ach.detectedFrom}
                    </span>
                    {ach.notes && <span className="text-[11px] text-amber-400/90 block mt-0.5">{ach.notes}</span>}
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-amber-300 block">
                      ${Number(ach.amount).toLocaleString()} / {ach.frequency}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      ~${Number(ach.monthlyEquivalent).toLocaleString()}/mo
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-slate-500">
                No active competitor MCA or financing ACH debits identified on bank statements.
              </div>
            )}
          </div>
        </div>

        {/* 6. Large Transactions / Irregularity Audit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-bold text-white">Large Transaction Velocity Audit</h4>
            </div>
            <span className="text-xs text-slate-400">&gt; 15% Monthly Volume</span>
          </div>

          <div className="mt-4 space-y-3">
            {[...(formData.largeDeposits || []), ...(formData.largeWithdrawals || [])].map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs mt-0.5 ${
                      tx.type === 'DEPOSIT'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-rose-950 text-rose-400 border border-rose-800'
                    }`}
                  >
                    {tx.type === 'DEPOSIT' ? (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">{tx.description}</span>
                    <span className="text-[11px] text-slate-400 block">{tx.date} • {tx.notes}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs font-bold font-mono ${
                      tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {tx.type === 'DEPOSIT' ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Document Analyzer Modal */}
      {activeReviewDoc && (
        <DocumentAiReviewModal
          isOpen={Boolean(activeReviewDoc)}
          onClose={() => setActiveReviewDoc(null)}
          document={activeReviewDoc}
          availableDocuments={documents}
          onSelectDocument={(doc) => setActiveReviewDoc(doc)}
          clientId={client.id}
          clientName={`${client.firstName} ${client.lastName}`}
          businessName={client.businessName}
          onVerificationUpdated={async () => {
            if (onTriggerAiScan) {
              onTriggerAiScan();
            }
          }}
        />
      )}
    </div>
  );
};
