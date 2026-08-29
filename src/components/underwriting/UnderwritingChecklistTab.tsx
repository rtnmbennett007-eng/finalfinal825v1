import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  UnderwritingChecklistItem,
  UnderwritingEvaluationRecord,
  UnderwritingCondition,
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
  Plus,
  Trash2,
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Building2,
  UserCheck,
} from 'lucide-react';
import { ProductSelect } from '../common/ProductSelect';


interface UnderwritingChecklistTabProps {
  deal: FundingDeal;
  client: Client;
  checklist: UnderwritingChecklistItem[];
  evaluation: UnderwritingEvaluationRecord | null;
  onUpdateChecklist: (updatedChecklist: UnderwritingChecklistItem[]) => Promise<void>;
  onSaveEvaluation: (evaluationData: Partial<UnderwritingEvaluationRecord>) => Promise<void>;
  onRefresh?: () => void;
}

export const UnderwritingChecklistTab: React.FC<UnderwritingChecklistTabProps> = ({
  deal,
  client,
  checklist,
  evaluation,
  onUpdateChecklist,
  onSaveEvaluation,
  onRefresh,
}) => {
  const [items, setItems] = useState<UnderwritingChecklistItem[]>(checklist);
  const [decision, setDecision] = useState<string>(
    evaluation?.recommendation || (deal.underwritingStatus === 'APPROVED' ? 'RECOMMEND' : 'RECOMMEND_WITH_CONDITIONS')
  );
  const [recAmount, setRecAmount] = useState<number>(
    evaluation?.recommendedFundingAmount || deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || 50000
  );
  const [recProduct, setRecProduct] = useState<string>(
    evaluation?.recommendedProduct || deal.product || 'Revenue Funding'
  );
  const [factorRate, setFactorRate] = useState<string>(
    deal.factorRate ? String(deal.factorRate) : (deal.rate !== undefined ? String(deal.rate) : '1.24')
  );
  const [termMonths, setTermMonths] = useState<string>(deal.termLength || '12 Months');
  const [targetLender, setTargetLender] = useState<string>(deal.lenderName || 'Maple Direct Capital');
  const [existingDebtNotes, setExistingDebtNotes] = useState<string>(
    evaluation?.debtService?.obligationNotes || '1st Position. Clean depository relationship.'
  );
  const [underwriterNotes, setUnderwriterNotes] = useState<string>(
    evaluation?.underwriterComments || deal.notes || 'Strong candidate. Verified monthly deposit volume meets prime criteria.'
  );

  // Conditions Management
  const [conditions, setConditions] = useState<UnderwritingCondition[]>(
    evaluation?.conditions && evaluation.conditions.length > 0
      ? evaluation.conditions
      : [
          {
            id: 'cond-1',
            title: 'Prior-to-Funding Voided Check & Decision Logic',
            description: 'Provide original bank voided check or certified bank verification letter matching operating checking account.',
            priority: 'High',
            responsiblePerson: 'Borrower / Account Manager',
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10),
            status: 'Received',
            notes: 'Received via portal upload and verified with routing check.',
          },
          {
            id: 'cond-2',
            title: 'Driver License Color Scan Confirmation',
            description: 'Clear, unexpired government-issued photo ID for principal guarantor.',
            priority: 'High',
            responsiblePerson: 'Guarantor',
            dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            status: 'Satisfied',
            notes: 'Verified against DMV records.',
          },
        ]
  );

  // Strengths & Weaknesses
  const [strengths, setStrengths] = useState<string[]>(
    evaluation?.strengths || [
      'Strong monthly cash flow exceeding $40,000/month',
      'Consistent positive ending bank balances across all 4 statements',
      'High composite guarantor FICO score (>700)',
      'Clean debt stack with no aggressive daily MCA stacking',
    ]
  );
  const [newStrength, setNewStrength] = useState('');

  const [weaknesses, setWeaknesses] = useState<string[]>(
    evaluation?.weaknesses || [
      'Slight seasonal fluctuation noted in winter quarter',
      'Single minor NSF fee 3 months ago (mitigated by immediate recovery)',
    ]
  );
  const [newWeakness, setNewWeakness] = useState('');

  // Modals & UI state
  const [showAddConditionModal, setShowAddConditionModal] = useState(false);
  const [newCondition, setNewCondition] = useState<Partial<UnderwritingCondition>>({
    title: '',
    description: '',
    priority: 'Medium',
    responsiblePerson: 'Borrower / Underwriter',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
    status: 'Open',
    notes: '',
  });

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
        conditions,
        strengths,
        weaknesses,
        updatedAt: new Date().toISOString(),
      });
      if (onRefresh) onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleAddCondition = () => {
    if (!newCondition.title) return;
    const added: UnderwritingCondition = {
      id: `cond-${Date.now()}`,
      title: newCondition.title,
      description: newCondition.description || '',
      priority: (newCondition.priority as any) || 'Medium',
      responsiblePerson: newCondition.responsiblePerson || 'Borrower',
      dueDate: newCondition.dueDate || new Date().toISOString().slice(0, 10),
      status: (newCondition.status as any) || 'Open',
      notes: newCondition.notes || '',
    };
    const next = [...conditions, added];
    setConditions(next);
    setShowAddConditionModal(false);
    setNewCondition({
      title: '',
      description: '',
      priority: 'Medium',
      responsiblePerson: 'Borrower / Underwriter',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
      status: 'Open',
      notes: '',
    });
  };

  const handleConditionStatusChange = (id: string, newStatus: UnderwritingCondition['status']) => {
    const next = conditions.map((c) => (c.id === id ? { ...c, status: newStatus } : c));
    setConditions(next);
  };

  const handleDeleteCondition = (id: string) => {
    const next = conditions.filter((c) => c.id !== id);
    setConditions(next);
  };

  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    setStrengths([...strengths, newStrength.trim()]);
    setNewStrength('');
  };

  const handleRemoveStrength = (idx: number) => {
    setStrengths(strengths.filter((_, i) => i !== idx));
  };

  const handleAddWeakness = () => {
    if (!newWeakness.trim()) return;
    setWeaknesses([...weaknesses, newWeakness.trim()]);
    setNewWeakness('');
  };

  const handleRemoveWeakness = (idx: number) => {
    setWeaknesses(weaknesses.filter((_, i) => i !== idx));
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
              <h3 className="text-base font-bold text-white">Underwriting Readiness Checklist & Memo</h3>
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
          Save Checklist & Decision
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

      {/* 3. Underwriting Conditions Table (Prior-to-Submission & Prior-to-Funding) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Underwriting Conditions (PTD & PTF)</h4>
          </div>
          <button
            onClick={() => setShowAddConditionModal(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            Add Condition
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Condition Title & Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Responsible</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {conditions.map((cond) => (
                <tr key={cond.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 max-w-sm">
                    <div className="font-bold text-white">{cond.title}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">{cond.description}</div>
                    {cond.notes && <div className="text-amber-400/90 text-[11px] mt-1 italic">Note: {cond.notes}</div>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cond.priority === 'High'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : cond.priority === 'Medium'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {cond.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{cond.responsiblePerson}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{cond.dueDate}</td>
                  <td className="py-3 px-4">
                    <select
                      value={cond.status}
                      onChange={(e) => handleConditionStatusChange(cond.id, e.target.value as any)}
                      className={`px-2 py-1 rounded text-xs font-bold border ${
                        cond.status === 'Satisfied'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                          : cond.status === 'Received'
                          ? 'bg-blue-950 text-blue-300 border-blue-700'
                          : cond.status === 'Waived'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-amber-950 text-amber-300 border-amber-700'
                      }`}
                    >
                      <option value="Open">Open</option>
                      <option value="Requested">Requested</option>
                      <option value="Received">Received</option>
                      <option value="Satisfied">Satisfied</option>
                      <option value="Waived">Waived</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleDeleteCondition(cond.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/40 transition-colors"
                      title="Remove Condition"
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

      {/* 4. Strengths & Weaknesses (Compensating Factors) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Deal Strengths & Positive Highlights</h4>
          </div>

          <div className="space-y-2">
            {strengths.map((str, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-200">
                <span>• {str}</span>
                <button
                  onClick={() => handleRemoveStrength(idx)}
                  className="text-emerald-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newStrength}
                onChange={(e) => setNewStrength(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStrength()}
                placeholder="Add positive underwriting factor..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
              />
              <button
                onClick={handleAddStrength}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Weaknesses & Mitigations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <ThumbsDown className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Risk Areas & Mitigating Factors</h4>
          </div>

          <div className="space-y-2">
            {weaknesses.map((wk, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-950/20 border border-amber-900/40 text-xs text-amber-200">
                <span>• {wk}</span>
                <button
                  onClick={() => handleRemoveWeakness(idx)}
                  className="text-amber-500 hover:text-rose-400 transition-colors p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newWeakness}
                onChange={(e) => setNewWeakness(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWeakness()}
                placeholder="Add risk factor and mitigation..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500"
              />
              <button
                onClick={handleAddWeakness}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Underwriting Decision & Recommendation Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Scale className="w-5 h-5 text-amber-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Final Underwriting Recommendation & Decision</h4>
            <p className="text-xs text-slate-400">
              Approved sizing parameters, factor rates, and commercial credit memorandum
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Underwriting Recommendation</label>
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
            >
              <option value="RECOMMEND">RECOMMEND (Lender Ready)</option>
              <option value="RECOMMEND_WITH_CONDITIONS">RECOMMEND WITH CONDITIONS</option>
              <option value="HOLD_NEED_MORE_INFO">HOLD / NEED MORE INFO</option>
              <option value="NOT_RECOMMENDED">NOT RECOMMENDED / DECLINE</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Approved / Rec Amount ($)</label>
            <input
              type="number"
              value={recAmount}
              onChange={(e) => setRecAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <ProductSelect
              label="Recommended Product"
              value={recProduct}
              onChange={(val) => setRecProduct(val)}
              selectClassName="px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Lender / Funder</label>
            <input
              type="text"
              value={targetLender}
              onChange={(e) => setTargetLender(e.target.value)}
              placeholder="e.g. Maple Direct / OnDeck"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Debt Stacking & Subordination Notes
            </label>
            <textarea
              value={existingDebtNotes}
              onChange={(e) => setExistingDebtNotes(e.target.value)}
              placeholder="Detail any existing daily/weekly ACH positions..."
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Comprehensive Underwriting Memo
            </label>
            <textarea
              value={underwriterNotes}
              onChange={(e) => setUnderwriterNotes(e.target.value)}
              placeholder="Credit memo summary printed on lender cover sheet..."
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Add Condition Modal */}
      {showAddConditionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Add Underwriting Condition
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Condition Title</label>
                <input
                  type="text"
                  value={newCondition.title}
                  onChange={(e) => setNewCondition({ ...newCondition, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  placeholder="e.g. Prior-to-Funding Landlord Verification"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description / Prerequisite Details</label>
                <textarea
                  value={newCondition.description}
                  onChange={(e) => setNewCondition({ ...newCondition, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-white"
                  placeholder="Explain exactly what document or confirmation is required..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Priority</label>
                  <select
                    value={newCondition.priority}
                    onChange={(e) => setNewCondition({ ...newCondition, priority: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="High">High (PTF Blocker)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Responsible Party</label>
                  <input
                    type="text"
                    value={newCondition.responsiblePerson}
                    onChange={(e) => setNewCondition({ ...newCondition, responsiblePerson: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddConditionModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCondition}
                disabled={!newCondition.title}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50"
              >
                Add Condition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
