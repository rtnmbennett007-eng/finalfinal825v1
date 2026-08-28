import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  UnderwritingChecklistItem,
  UnderwritingEvaluationRecord,
} from '../../types';
import {
  CheckSquare,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  FileCheck2,
  RefreshCw,
  Scale,
  DollarSign,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';

interface UnderwritingChecklistTabProps {
  deal: FundingDeal;
  client: Client;
  checklist: UnderwritingChecklistItem[];
  evaluation: UnderwritingEvaluationRecord | null;
  onUpdateChecklist: (updatedChecklist: UnderwritingChecklistItem[]) => Promise<void>;
  onSaveEvaluation: (evaluationData: Partial<UnderwritingEvaluationRecord>) => Promise<void>;
}

export const UnderwritingChecklistTab: React.FC<UnderwritingChecklistTabProps> = ({
  deal,
  client,
  checklist,
  evaluation,
  onUpdateChecklist,
  onSaveEvaluation,
}) => {
  const [items, setItems] = useState<UnderwritingChecklistItem[]>(checklist);
  const [decision, setDecision] = useState<string>(evaluation?.recommendation || 'RECOMMEND');
  const [recAmount, setRecAmount] = useState<number>(
    evaluation?.recommendedFundingAmount || deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || 50000
  );
  const [recProduct, setRecProduct] = useState<string>(evaluation?.recommendedProduct || deal.product || 'Revenue Funding');
  const [factorRate, setFactorRate] = useState<string>(
    deal.factorRate ? String(deal.factorRate) : (deal.rate !== undefined ? String(deal.rate) : '1.24')
  );
  const [termMonths, setTermMonths] = useState<number>(12);
  const [existingDebtNotes, setExistingDebtNotes] = useState<string>(
    evaluation?.debtService?.obligationNotes || '1st Position. Clean depository relationship.'
  );
  const [underwriterNotes, setUnderwriterNotes] = useState<string>(
    evaluation?.underwriterComments || deal.notes || 'Strong candidate. Verified monthly deposit volume meets prime criteria.'
  );
  const [saving, setSaving] = useState(false);

  const completedCount = items.filter((i) => i.status === 'COMPLETE').length;
  const totalCount = items.length || 1;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const handleStatusToggle = (id: string, newStatus: 'COMPLETE' | 'NEEDS_REVIEW' | 'MISSING' | 'CONFLICTING') => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: newStatus,
          lastCheckedAt: new Date().toISOString(),
          isAutoCalculated: false,
        };
      }
      return item;
    });
    setItems(updated);
    onUpdateChecklist(updated);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await onUpdateChecklist(items);
      await onSaveEvaluation({
        clientId: client.id,
        recommendation: decision as any,
        recommendedFundingAmount: Number(recAmount),
        recommendedProduct: recProduct as any,
        underwriterComments: underwriterNotes,
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusButton = (
    item: UnderwritingChecklistItem,
    targetStatus: 'COMPLETE' | 'NEEDS_REVIEW' | 'MISSING' | 'CONFLICTING',
    label: string,
    activeColor: string
  ) => {
    const isActive = item.status === targetStatus;
    return (
      <button
        onClick={() => handleStatusToggle(item.id, targetStatus)}
        className={`px-2 py-1 text-[11px] font-semibold rounded transition-colors ${
          isActive
            ? `${activeColor} font-bold shadow-sm`
            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6" id="underwriting-checklist-tab">
      {/* 1. Progress & Score Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Underwriting Readiness Checklist</h3>
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                {progressPercent}% Complete ({completedCount}/{totalCount})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive 10-checkpoint audit covering guarantor identity, business filings, cash flows, and closing prerequisites
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 self-stretch md:self-auto justify-center"
        >
          {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
          Save Checklist & Evaluation
        </button>
      </div>

      {/* 2. Interactive Checklist Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-800">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`p-4 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                item.status === 'COMPLETE'
                  ? 'bg-slate-900/40'
                  : item.status === 'CONFLICTING'
                  ? 'bg-rose-950/20'
                  : 'bg-slate-850/60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mt-0.5 flex-shrink-0 font-bold ${
                    item.status === 'COMPLETE'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-700'
                      : item.status === 'CONFLICTING'
                      ? 'bg-rose-950 text-rose-400 border border-rose-700'
                      : item.status === 'NEEDS_REVIEW'
                      ? 'bg-amber-950 text-amber-400 border border-amber-700'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.status === 'COMPLETE' ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {item.sectionLabel}
                    </span>
                    <span className="text-slate-600">•</span>
                    <h4 className="text-xs font-bold text-white">{item.label}</h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                </div>
              </div>

              {/* Status Selector Pills */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                {getStatusButton(item, 'COMPLETE', 'Complete', 'bg-emerald-600 text-white')}
                {getStatusButton(item, 'NEEDS_REVIEW', 'Needs Review', 'bg-amber-600 text-white')}
                {getStatusButton(item, 'CONFLICTING', 'Conflict', 'bg-rose-600 text-white')}
                {getStatusButton(item, 'MISSING', 'Missing', 'bg-slate-700 text-slate-200')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Underwriting Evaluation Worksheet Form */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Scale className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Underwriting Decision & Credit Memorandum</h4>
            <p className="text-xs text-slate-400">
              Staff credit recommendation, approved sizing parameters, and deal conditions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Underwriting Decision</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="APPROVED">APPROVED (Lender Ready)</option>
              <option value="QUALIFIED">QUALIFIED (Meets Criteria)</option>
              <option value="NEEDS_DOCS">CONDITIONS / NEEDS DOCS</option>
              <option value="DECLINED">DECLINED</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Recommended Amount ($)</label>
            <input
              type="number"
              value={recAmount}
              onChange={(e) => setRecAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Funding Product</label>
            <select
              value={recProduct}
              onChange={(e) => setRecProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="Revenue Funding">Revenue Funding</option>
              <option value="Business Line of Credit">Business Line of Credit</option>
              <option value="SBA Loan">SBA Loan</option>
              <option value="Equipment Financing">Equipment Financing</option>
              <option value="Term Loan">Term Loan</option>
              <option value="Merchant Cash Advance (MCA)">Merchant Cash Advance (MCA)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Estimated Factor / Rate</label>
            <input
              type="text"
              value={factorRate}
              onChange={(e) => setFactorRate(e.target.value)}
              placeholder="e.g. 1.24 or 8.5%"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Stacking & Debt Position Notes
            </label>
            <textarea
              value={existingDebtNotes}
              onChange={(e) => setExistingDebtNotes(e.target.value)}
              placeholder="Detail any existing daily/weekly ACH positions..."
              className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Underwriting Memorandum / Lender Notes
            </label>
            <textarea
              value={underwriterNotes}
              onChange={(e) => setUnderwriterNotes(e.target.value)}
              placeholder="Credit memo summary printed on lender cover sheet..."
              className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
