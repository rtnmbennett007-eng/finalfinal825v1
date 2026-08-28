import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Calendar,
  Building2,
  User,
  Percent,
  Clock,
  Layers,
  FileText,
  Copy,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  History,
  TrendingUp,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { FundingDeal, CANONICAL_DEAL_STATUSES, FundingProductType } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { DealStatusBadge, ProductBadge } from '../common/StatusBadge';
import { ProductSelect } from '../common/ProductSelect';
import { formatDate } from '../../utils/dateUtils';
import { calculateDealCommission } from '../../utils/commissionCalculator';

interface DealDetailModalProps {
  deal: FundingDeal;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToClient?: (clientId: string) => void;
}

export const DealDetailModal: React.FC<DealDetailModalProps> = ({
  deal,
  isOpen,
  onClose,
  onNavigateToClient,
}) => {
  const { updateDeal, deleteDeal, duplicateDeal, updateDealStatus, addDealActivity, commissions, addToast } = useData();
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'financials' | 'status_timeline' | 'activity' | 'commissions'>('financials');
  const [formData, setFormData] = useState<Partial<FundingDeal>>({ ...deal });
  const [isSaving, setIsSaving] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [newActivityNote, setNewActivityNote] = useState('');
  const [statusChangeNote, setStatusChangeNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(deal.status || 'Draft');

  if (!isOpen) return null;

  const dealCommissions = commissions.filter((c) => c.dealId === deal.id || c.dealId === deal.dealId);
  const calc = calculateDealCommission(formData);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDeal(deal.id, {
        ...formData,
        requestedAmount: Number(formData.requestedAmount || 0),
        approvedAmount: Number(formData.approvedAmount || 0),
        fundedAmount: Number(formData.fundedAmount || 0),
        fundingAmount: Number(formData.fundingAmount || formData.fundedAmount || formData.approvedAmount || formData.requestedAmount || 0),
        fee: Number(formData.fee || 0),
        percentage: Number(formData.percentage || 0),
        commissionPoints: Number(formData.commissionPoints || formData.percentage || 0),
        commissionTotal: Number(formData.commissionTotal || calc.totalCommission),
        updatedBy: currentUser?.name || 'Staff',
      });
      addToast('success', 'Deal Updated', `Deal ${deal.dealId || deal.id} saved successfully.`);
      onClose();
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save deal changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    setIsCloning(true);
    try {
      const cloned = await duplicateDeal(deal.id, {
        notes: `Cloned position from ${deal.dealId || deal.id}`,
      });
      addToast('success', 'Deal Cloned', `Cloned as new deal ${cloned.dealId || cloned.id}.`);
      onClose();
    } catch (err: any) {
      addToast('error', 'Clone Failed', err.message || 'Could not clone deal');
    } finally {
      setIsCloning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (selectedStatus === deal.status && !statusChangeNote.trim()) return;
    setIsSaving(true);
    try {
      await updateDealStatus(deal.id, selectedStatus, statusChangeNote || undefined);
      setFormData((prev) => ({ ...prev, status: selectedStatus }));
      setStatusChangeNote('');
      addToast('success', 'Status Updated', `Deal status changed to ${selectedStatus}`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNoteActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityNote.trim()) return;
    try {
      await addDealActivity(deal.id, 'Note Added', newActivityNote.trim());
      setNewActivityNote('');
      addToast('success', 'Activity Logged', 'Note added to deal history.');
    } catch (err: any) {
      addToast('error', 'Log Failed', err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn max-h-[92vh] flex flex-col">
        {/* Header Strip */}
        <div className="flex items-start justify-between border-b border-blue-900/60 pb-4 shrink-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-2.5 flex-wrap">
              <span className="font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded text-xs">
                {deal.dealId || deal.id}
              </span>
              <DealStatusBadge status={deal.status} />
              {deal.isStacked ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold uppercase">
                  {deal.position || 'Stacked Tranche'}
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                  {deal.position || '1st Position'}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 truncate">
              <span>{deal.businessName || deal.clientName || 'Funding Deal'}</span>
              <span className="text-xs text-slate-400 font-normal">({deal.clientName})</span>
            </h2>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {onNavigateToClient && deal.clientId && (
              <button
                type="button"
                onClick={() => {
                  onNavigateToClient(deal.clientId);
                  onClose();
                }}
                className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Client File 360</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isCloning}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Clone this deal to create a new independent stack position"
            >
              <Copy className="w-3.5 h-3.5 text-amber-400" />
              <span>Clone Deal</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-2 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'financials'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            Financials & Terms
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('status_timeline')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'status_timeline'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            Stage & Milestone Dates
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'activity'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity History ({deal.activityHistory?.length || 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('commissions')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'commissions'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-blue-950/40'
            }`}
          >
            Commission Splits ({dealCommissions.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {activeTab === 'financials' && (
            <form onSubmit={handleSave} className="space-y-4">
              {/* Core Financial Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#070d18] border border-blue-900/60 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Requested Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.requestedAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono font-bold text-slate-100 text-sm focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/60 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Approved Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.approvedAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, approvedAmount: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono font-bold text-cyan-400 text-sm focus:outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/60 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">
                    Funded / Disbursed Amount ($)
                  </label>
                  <input
                    type="number"
                    value={formData.fundedAmount ?? formData.fundingAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, fundedAmount: Number(e.target.value), fundingAmount: Number(e.target.value) })}
                    className="w-full bg-transparent font-mono font-bold text-emerald-400 text-sm focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Product & Structure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <ProductSelect
                    label="Funding Product"
                    required
                    value={formData.product || 'Revenue Funding'}
                    onChange={(val) => setFormData({ ...formData, product: val as FundingProductType })}
                    otherType={formData.otherProductType || ''}
                    onChangeOtherType={(val) => setFormData({ ...formData, otherProductType: val })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stack Position</label>
                  <select
                    value={formData.position || '1st Position'}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value, isStacked: e.target.value !== '1st Position' })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="1st Position">1st Position (Primary)</option>
                    <option value="2nd Position">2nd Position (Stacked)</option>
                    <option value="3rd Position">3rd Position (Stacked)</option>
                    <option value="4th Position">4th Position (Stacked)</option>
                    <option value="5th+ Position">5th+ Position (Deep Stack)</option>
                  </select>
                </div>
              </div>

              {/* Rate, Term, Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Factor / Int. Rate</label>
                  <input
                    type="text"
                    value={formData.factorRate || formData.rate || ''}
                    onChange={(e) => setFormData({ ...formData, factorRate: e.target.value, rate: e.target.value })}
                    placeholder="e.g. 1.28 or 9.5%"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Term Length</label>
                  <input
                    type="text"
                    value={formData.termLength || formData.term || '12 Months'}
                    onChange={(e) => setFormData({ ...formData, termLength: e.target.value, term: e.target.value })}
                    placeholder="e.g. 12 Months"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Frequency</label>
                  <select
                    value={formData.paymentFrequency || 'Monthly'}
                    onChange={(e) => setFormData({ ...formData, paymentFrequency: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Bi-Weekly">Bi-Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Amount ($)</label>
                  <input
                    type="number"
                    value={formData.paymentAmount ?? ''}
                    onChange={(e) => setFormData({ ...formData, paymentAmount: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-emerald-400 focus:border-amber-400 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Lender & Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Funder / Lender Name</label>
                  <input
                    type="text"
                    value={formData.funder || formData.lenderName || ''}
                    onChange={(e) => setFormData({ ...formData, funder: e.target.value, lenderName: e.target.value })}
                    placeholder="Maple Direct Capital"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lender Rep / Contact</label>
                  <input
                    type="text"
                    value={formData.lenderContact || ''}
                    onChange={(e) => setFormData({ ...formData, lenderContact: e.target.value })}
                    placeholder="desk@lender.com"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assigned Rep / Staff</label>
                  <input
                    type="text"
                    value={formData.assignedRep || formData.assignedStaff || ''}
                    onChange={(e) => setFormData({ ...formData, assignedRep: e.target.value, assignedStaff: e.target.value })}
                    placeholder="Dana"
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Commission preview calculation */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#070d18] border border-blue-900/50 rounded-xl">
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Commission Points (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.percentage !== undefined && formData.percentage !== null ? formData.percentage : ''}
                    onChange={(e) => setFormData({ ...formData, percentage: Number(e.target.value), commissionPoints: Number(e.target.value) })}
                    placeholder="e.g. 7.0"
                    className="w-full bg-transparent font-mono font-bold text-amber-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Origination Fee ($)</label>
                  <input
                    type="number"
                    value={formData.fee !== undefined && formData.fee !== null ? formData.fee : ''}
                    onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
                    placeholder="e.g. 995"
                    className="w-full bg-transparent font-mono font-bold text-cyan-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Est. Total Commission</span>
                  <span className="font-mono font-bold text-amber-400 text-sm block">
                    {calc.hasCommission ? calc.formattedTotalCommission : '$0.00'}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deal Notes & Stipulations</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Lender covenants, stips, requirements..."
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-blue-900/50">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Financials'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'status_timeline' && (
            <div className="space-y-5">
              {/* Quick Status Advance Box */}
              <div className="p-4 bg-[#070d18] border border-blue-900/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Update Deal Stage
                  </h4>
                  <span className="text-[10px] text-slate-400">
                    Independent of Client Pipeline Stage
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Target Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full bg-[#0b1528] border border-blue-900/80 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-semibold"
                    >
                      {CANONICAL_DEAL_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Status Change Note (Audit Trail)</label>
                    <input
                      type="text"
                      value={statusChangeNote}
                      onChange={(e) => setStatusChangeNote(e.target.value)}
                      placeholder="e.g., Lender approved under conditions..."
                      className="w-full bg-[#0b1528] border border-blue-900/80 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleStatusUpdate}
                    disabled={isSaving || (selectedStatus === deal.status && !statusChangeNote.trim())}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Apply Stage Transition</span>
                  </button>
                </div>
              </div>

              {/* Milestone Dates Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Submission Date</label>
                  <input
                    type="date"
                    value={formData.submissionDate || formData.submittedDate || ''}
                    onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value, submittedDate: e.target.value })}
                    className="w-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Approval Date</label>
                  <input
                    type="date"
                    value={formData.approvalDate || ''}
                    onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                    className="w-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Funding Date</label>
                  <input
                    type="date"
                    value={formData.fundingDate || ''}
                    onChange={(e) => setFormData({ ...formData, fundingDate: e.target.value })}
                    className="w-full bg-transparent text-emerald-400 font-mono text-xs focus:outline-none font-bold"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Decline Date</label>
                  <input
                    type="date"
                    value={formData.declineDate || ''}
                    onChange={(e) => setFormData({ ...formData, declineDate: e.target.value })}
                    className="w-full bg-transparent text-rose-400 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl sm:col-span-2">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Decline Reason</label>
                  <input
                    type="text"
                    value={formData.declineReason || ''}
                    onChange={(e) => setFormData({ ...formData, declineReason: e.target.value })}
                    placeholder="e.g. Restricted industry, credit below cutoff"
                    className="w-full bg-transparent text-slate-200 text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Payoff Date</label>
                  <input
                    type="date"
                    value={formData.payoffDate || ''}
                    onChange={(e) => setFormData({ ...formData, payoffDate: e.target.value })}
                    className="w-full bg-transparent text-slate-100 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Renewal Date</label>
                  <input
                    type="date"
                    value={formData.renewalDate || ''}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="w-full bg-transparent text-cyan-400 font-mono text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
                  <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Renewal Status</label>
                  <select
                    value={formData.renewalStatus || 'Eligible'}
                    onChange={(e) => setFormData({ ...formData, renewalStatus: e.target.value })}
                    className="w-full bg-transparent text-slate-100 text-xs focus:outline-none"
                  >
                    <option value="Eligible">Eligible</option>
                    <option value="In Discussion">In Discussion</option>
                    <option value="Executed">Executed</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Save Milestone Dates
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Add Activity Form */}
              <form onSubmit={handleAddNoteActivity} className="p-3.5 bg-[#070d18] border border-blue-900/60 rounded-xl space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  Log Deal Activity / Underwriting Note
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newActivityNote}
                    onChange={(e) => setNewActivityNote(e.target.value)}
                    placeholder="Log update, call with funder, stipulation receipt..."
                    className="flex-1 bg-[#0b1528] border border-blue-900/80 rounded-xl p-2 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newActivityNote.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Log</span>
                  </button>
                </div>
              </form>

              {/* Timeline Items */}
              <div className="space-y-2.5">
                {(!deal.activityHistory || deal.activityHistory.length === 0) ? (
                  <div className="p-6 text-center text-slate-500 bg-[#070d18] rounded-xl border border-blue-900/30">
                    No historical activity recorded yet.
                  </div>
                ) : (
                  deal.activityHistory.map((act) => (
                    <div
                      key={act.id}
                      className="p-3 bg-[#070d18] border border-blue-900/40 rounded-xl flex items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-200 text-xs">{act.action}</span>
                          {act.newValue && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {act.newValue}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">• by {act.user}</span>
                        </div>
                        {act.notes && <p className="text-xs text-slate-300">{act.notes}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'commissions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#070d18] border border-blue-900/60 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Gross Commission Pool</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    {calc.hasCommission ? calc.formattedTotalCommission : '$0.00'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Settlement Status</span>
                  <span className="text-xs font-bold text-cyan-300 font-mono">
                    {formData.commissionStatus || 'PENDING'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Commission Points</span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {formData.percentage || 0}%
                  </span>
                </div>
              </div>

              {dealCommissions.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-[#070d18] rounded-xl border border-blue-900/30 space-y-1">
                  <p className="font-semibold text-slate-300">No Commission Splits Configured Yet</p>
                  <p className="text-[11px] text-slate-500">
                    Commissions can be distributed in the Commissions Workspace when ready.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dealCommissions.map((cp) => (
                    <div
                      key={cp.id}
                      className="p-3 bg-[#070d18] border border-blue-900/40 rounded-xl flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{cp.name}</div>
                        <div className="text-[10px] text-slate-400">{cp.role} ({cp.type})</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-400 font-mono">
                          ${Number(cp.dollarAmount || 0).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{cp.points}% points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
