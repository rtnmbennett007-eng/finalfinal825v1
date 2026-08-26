import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  Percent,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { FundingDeal, FundingProductType } from '../../../types';
import { formatDate } from '../../../utils/dateUtils';

interface MasterDealsSectionProps {
  clientId: string;
  clientName: string;
  businessName: string;
  deals: FundingDeal[];
  onChangeDeals: (updatedDeals: FundingDeal[]) => void;
}

const PRODUCTS: FundingProductType[] = [
  'Revenue Funding',
  'Personal Term Loan',
  'HELOC',
  'HEI',
  'Business Term Loan',
  'Business Line of Credit',
  'Equipment Financing',
  '0% Business Credit Cards',
  '0% Business Cards & Lines of Credit',
  'SBA Loan',
  'Other Valid Product',
];

export const MasterDealsSection: React.FC<MasterDealsSectionProps> = ({
  clientId,
  clientName,
  businessName,
  deals,
  onChangeDeals,
}) => {
  const [editingDealId, setEditingDealId] = useState<string | null>(null);

  // Auto-calculated summaries
  const totalFunding = deals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);
  const totalFees = deals.reduce((sum, d) => sum + (Number(d.fee) || 0), 0);
  const totalCommission = deals.reduce((sum, d) => {
    const amt = Number(d.fundingAmount) || 0;
    const pct = Number(d.percentage) || 0;
    const fee = Number(d.fee) || 0;
    return sum + (amt * (pct / 100)) + fee;
  }, 0);

  const handleAddDeal = () => {
    const newDealNumber = deals.length + 1;
    const newDeal: FundingDeal = {
      id: `deal-${Date.now()}`,
      clientId,
      clientName: clientName || 'Client',
      businessName: businessName || 'Business',
      product: 'Business Line of Credit',
      fundingAmount: 50000,
      fee: 1500,
      percentage: 7.0,
      termLength: '12 Months',
      status: 'APPROVED',
      assignedStaff: 'Dana',
      lenderStatus: 'APPROVED',
      lenderName: `Lender Position #${newDealNumber}`,
      lenderContact: 'operations@lender.com',
      fundingDate: new Date().toISOString().split('T')[0],
      commissionStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isStacked: deals.length > 0,
    };

    const updated = [...deals, newDeal];
    onChangeDeals(updated);
    setEditingDealId(newDeal.id);
  };

  const handleUpdateDeal = (id: string, updates: Partial<FundingDeal>) => {
    const updated = deals.map((d) => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d));
    onChangeDeals(updated);
  };

  const handleDeleteDeal = (id: string) => {
    const updated = deals.filter((d) => d.id !== id);
    onChangeDeals(updated);
    if (editingDealId === id) setEditingDealId(null);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Stacked Capital
          </span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            ${totalFunding.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{deals.length} Active Positions</span>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Gross Est. Commission
          </span>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            ${Math.round(totalCommission).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Total Points + Origination</span>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Origination Fees
          </span>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
            ${totalFees.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">Fee pool</span>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Stack Architecture
            </span>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {deals.length > 1 ? `Multi-Stack (${deals.length})` : deals.length === 1 ? 'Single Position' : 'No Deals'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddDeal}
            className="flex items-center space-x-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Deal</span>
          </button>
        </div>
      </div>

      {/* Deals List */}
      <div className="space-y-4">
        {deals.length === 0 ? (
          <div className="bg-[#0b1528] border border-dashed border-blue-900/60 p-8 rounded-2xl text-center">
            <Layers className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-200">No Funding Deals Configured</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create the first funding position or multi-stack deal for this client.
            </p>
            <button
              type="button"
              onClick={handleAddDeal}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" />
              <span>Create Initial Funding Deal</span>
            </button>
          </div>
        ) : (
          deals.map((deal, idx) => {
            const isEditing = editingDealId === deal.id;
            const dealCommission =
              ((Number(deal.fundingAmount) || 0) * (Number(deal.percentage) || 0)) / 100 +
              (Number(deal.fee) || 0);

            return (
              <div
                key={deal.id}
                className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-bold text-slate-100">
                          {deal.lenderName || 'Unnamed Lender'}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800">
                          {deal.product}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Funded: {formatDate(deal.fundingDate, 'Pending')} • Status: {deal.status}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingDealId(isEditing ? null : deal.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition-all ${
                        isEditing
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-950 text-slate-200 border border-blue-800 hover:bg-blue-900'
                      }`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Collapse' : 'Edit Deal'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDeal(deal.id)}
                      className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                      title="Remove Deal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit Form or Quick Preview */}
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Lender / Capital Partner *</label>
                      <input
                        type="text"
                        value={deal.lenderName || ''}
                        onChange={(e) => handleUpdateDeal(deal.id, { lenderName: e.target.value })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-semibold"
                        placeholder="e.g. Apex Commercial Capital"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Funding Product *</label>
                      <select
                        value={deal.product || 'Business Line of Credit'}
                        onChange={(e) => handleUpdateDeal(deal.id, { product: e.target.value as FundingProductType })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      >
                        {PRODUCTS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Funded Capital Amount ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          value={deal.fundingAmount ?? 0}
                          onChange={(e) => handleUpdateDeal(deal.id, { fundingAmount: Number(e.target.value) })}
                          className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-emerald-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={deal.percentage ?? 7}
                          onChange={(e) => handleUpdateDeal(deal.id, { percentage: Number(e.target.value) })}
                          className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pr-7 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                        />
                        <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Origination / Closing Fee ($)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
                        <input
                          type="number"
                          value={deal.fee ?? 0}
                          onChange={(e) => handleUpdateDeal(deal.id, { fee: Number(e.target.value) })}
                          className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-cyan-300 font-mono focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Deal / Funding Status</label>
                      <select
                        value={deal.status || 'APPROVED'}
                        onChange={(e) => handleUpdateDeal(deal.id, { status: e.target.value as any })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      >
                        <option value="PROPOSED">PROPOSED</option>
                        <option value="SUBMITTED">SUBMITTED</option>
                        <option value="PRE_APPROVED">PRE_APPROVED</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="CONDITIONS_MET">CONDITIONS_MET</option>
                        <option value="FUNDED">FUNDED</option>
                        <option value="DECLINED">DECLINED</option>
                        <option value="WITHDRAWN">WITHDRAWN</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Term Length / Amortization</label>
                      <input
                        type="text"
                        value={deal.termLength || '12 Months'}
                        onChange={(e) => handleUpdateDeal(deal.id, { termLength: e.target.value })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        placeholder="e.g. 24 Months / Daily"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Funding Date</label>
                      <input
                        type="date"
                        value={deal.fundingDate || ''}
                        onChange={(e) => handleUpdateDeal(deal.id, { fundingDate: e.target.value })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Commission Status</label>
                      <select
                        value={deal.commissionStatus || 'PENDING'}
                        onChange={(e) => handleUpdateDeal(deal.id, { commissionStatus: e.target.value as any })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="COLLECTED">COLLECTED / RECEIVED</option>
                        <option value="DISTRIBUTED">DISTRIBUTED</option>
                        <option value="PARTIALLY_DISTRIBUTED">PARTIALLY_DISTRIBUTED</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Deal Notes & Conditions</label>
                      <input
                        type="text"
                        value={deal.notes || ''}
                        onChange={(e) => handleUpdateDeal(deal.id, { notes: e.target.value })}
                        className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                        placeholder="Lender approval notes, covenants, daily hold, etc."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Funding Amount</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ${Number(deal.fundingAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Gross Commission</span>
                      <span className="font-mono font-bold text-amber-400">
                        ${Math.round(dealCommission).toLocaleString()} ({deal.percentage || 0}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Term Length</span>
                      <span className="text-slate-200">{deal.termLength || '12 Months'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Commission Status</span>
                      <span className="font-semibold text-cyan-300">{deal.commissionStatus || 'PENDING'}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
