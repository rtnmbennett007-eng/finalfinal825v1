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
  FileText
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

  const bankDocs = documents.filter((d) => (d.category || '').toLowerCase().includes('bank'));

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
              <h3 className="text-base font-bold text-white">4-Month Bank Statement Cash Flow Analysis</h3>
              <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700">
                {formData.statementPeriod || 'Last 4 Months'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Depository: <span className="text-slate-200 font-medium">{formData.bankName}</span> • Account Holder:{' '}
              <span className="text-slate-200 font-medium">{formData.accountHolder}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            id="open-bank-doc-analyzer-btn"
            onClick={() => {
              const docToReview = bankDocs.find((d) => Boolean(d.aiExtraction)) || bankDocs[0] || documents[0];
              if (docToReview) {
                setActiveReviewDoc(docToReview);
              } else if (onTriggerAiScan) {
                onTriggerAiScan();
              }
            }}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            title="Open Financial Document Analyzer to review extracted bank metrics"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Financial Document Analyzer</span>
          </button>

          {onTriggerAiScan && (
            <button
              onClick={onTriggerAiScan}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border border-purple-700/60 transition-colors flex items-center gap-1.5"
              title="Rescan uploaded bank statements using Google GenAI Document AI pipeline"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI Re-extract
            </button>
          )}

          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5"
                disabled={saving}
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                Save Ledger
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setFormData(bankAnalysis);
                setIsEditing(true);
              }}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              Edit Figures
            </button>
          )}
        </div>
      </div>

      {/* 2. Key Figures Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            4-Mo Total Deposits
          </span>
          <span className="text-lg font-black text-emerald-400 mt-1 block">
            ${Number(formData.totalDeposits || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">
            Avg ${Math.round((formData.totalDeposits || 0) / 4).toLocaleString()}/mo
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Avg Daily Balance
          </span>
          <span className="text-lg font-black text-white mt-1 block">
            ${Number(formData.avgDailyBalance || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">Across 120 days</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            NSFs / Returned
          </span>
          <span
            className={`text-lg font-black mt-1 block ${
              (formData.nsfsCount || 0) > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {formData.nsfsCount || 0} Events
          </span>
          <span className="text-[11px] text-slate-500">
            {(formData.nsfsCount || 0) === 0 ? 'Zero Overdrafts' : 'Needs Letter of Exp'}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Negative Days
          </span>
          <span
            className={`text-lg font-black mt-1 block ${
              (formData.negativeBalanceDays || 0) > 0 ? 'text-amber-400' : 'text-slate-300'
            }`}
          >
            {formData.negativeBalanceDays || 0} Days
          </span>
          <span className="text-[11px] text-slate-500">
            {(formData.negativeBalanceDays || 0) === 0 ? 'Clean Ledger' : 'Below $0.00'}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Monthly ACH Debits
          </span>
          <span className="text-lg font-black text-amber-300 mt-1 block">
            ${Number(formData.financingDebitsTotalMonthly || 0).toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500">
            {formData.recurringAchObligations?.length || 0} Active Lenders
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Deposit Velocity
          </span>
          <span className="text-lg font-black text-blue-400 mt-1 block">
            {formData.depositVelocity || 'Consistent'}
          </span>
          <span className="text-[11px] text-slate-500">
            {formData.cashFlowConsistency || 'Stable'} Flow
          </span>
        </div>
      </div>

      {/* 3. Monthly Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Monthly Statement Ledger</h4>
          </div>
          <span className="text-xs text-slate-400">
            Linked to {bankDocs.length} bank document file(s) in Vault
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Statement Period</th>
                <th className="py-3 px-4">Total Deposits</th>
                <th className="py-3 px-4">Ending Balance</th>
                <th className="py-3 px-4">Negative Days</th>
                <th className="py-3 px-4">NSF / Returned</th>
                <th className="py-3 px-4">Financing ACH</th>
                <th className="py-3 px-4">Underwriting Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {(formData.monthlyBreakdowns || []).map((month, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-medium text-white">{month.month}</td>
                  <td className="py-3 px-4 font-bold text-emerald-400">
                    {isEditing ? (
                      <input
                        type="number"
                        value={month.totalDeposits}
                        onChange={(e) => handleMonthlyChange(idx, 'totalDeposits', parseFloat(e.target.value) || 0)}
                        className="w-28 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400"
                      />
                    ) : (
                      `$${Number(month.totalDeposits).toLocaleString()}`
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-200">
                    {isEditing ? (
                      <input
                        type="number"
                        value={month.endingBalance}
                        onChange={(e) => handleMonthlyChange(idx, 'endingBalance', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      />
                    ) : (
                      `$${Number(month.endingBalance).toLocaleString()}`
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {isEditing ? (
                      <input
                        type="number"
                        value={month.negativeDays}
                        onChange={(e) => handleMonthlyChange(idx, 'negativeDays', parseInt(e.target.value, 10) || 0)}
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-400"
                      />
                    ) : (
                      <span className={month.negativeDays > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
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
                        className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-rose-400"
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
                        className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-amber-300"
                      />
                    ) : (
                      `$${Number(month.achDebits || 0).toLocaleString()}`
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans text-slate-400">
                    {isEditing ? (
                      <input
                        type="text"
                        value={month.notes || ''}
                        onChange={(e) => handleMonthlyChange(idx, 'notes', e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300"
                      />
                    ) : (
                      month.notes || 'Verified by Underwriting'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Recurring ACH Debits & Stacking Positions */}
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

        {/* 5. Large Transactions / Irregularity Audit */}
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
