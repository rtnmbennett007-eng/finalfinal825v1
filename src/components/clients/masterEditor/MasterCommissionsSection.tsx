import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  Users,
  DollarSign,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CommissionParticipant, CommissionParticipantType, FundingDeal } from '../../../types';

interface MasterCommissionsSectionProps {
  deals: FundingDeal[];
  commissions: CommissionParticipant[];
  onChangeCommissions: (updatedCommissions: CommissionParticipant[]) => void;
}

const PARTICIPANT_TYPES: CommissionParticipantType[] = [
  'Internal Staff',
  'Referral Partner',
  'Broker Partner',
  'Business Partner',
  'Outside Partner',
  'Other',
];

export const MasterCommissionsSection: React.FC<MasterCommissionsSectionProps> = ({
  deals,
  commissions,
  onChangeCommissions,
}) => {
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id || '');
  const activeDeal = deals.find((d) => d.id === selectedDealId) || deals[0] || null;

  const dealCommissions = commissions.filter((c) => c.dealId === activeDeal?.id);
  const dealFunding = Number(activeDeal?.fundingAmount) || 0;
  const dealPercentage = Number(activeDeal?.percentage) || 0;
  const dealFee = Number(activeDeal?.fee) || 0;
  const grossCommission = dealFunding * (dealPercentage / 100) + dealFee;

  const allocatedPoints = dealCommissions.reduce((sum, c) => sum + (Number(c.points) || 0), 0);
  const allocatedDollars = dealCommissions.reduce((sum, c) => sum + (Number(c.dollarAmount) || 0), 0);
  const houseRetainedPoints = Math.max(0, dealPercentage - allocatedPoints);
  const houseRetainedDollars = Math.max(0, grossCommission - allocatedDollars);

  const handleAddParticipant = () => {
    if (!activeDeal) return;
    const newPart: CommissionParticipant = {
      id: `comm-${Date.now()}`,
      dealId: activeDeal.id,
      name: '',
      type: 'Internal Staff',
      role: 'Sales Representative',
      points: 0,
      dollarAmount: 0,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onChangeCommissions([...commissions, newPart]);
  };

  const handleUpdateParticipant = (id: string, updates: Partial<CommissionParticipant>) => {
    const updated = commissions.map((c) => {
      if (c.id !== id) return c;
      const merged = { ...c, ...updates, updatedAt: new Date().toISOString() };
      if (updates.points !== undefined && activeDeal) {
        merged.dollarAmount = (dealFunding * Number(updates.points)) / 100;
      }
      return merged;
    });
    onChangeCommissions(updated);
  };

  const handleDeleteParticipant = (id: string) => {
    onChangeCommissions(commissions.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Deal Selector if multiple deals */}
      {deals.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <span className="text-xs font-semibold text-slate-400">Select Deal:</span>
          {deals.map((d, idx) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDealId(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                (activeDeal?.id === d.id)
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-[#0b1528] text-slate-300 border border-blue-900/60 hover:border-blue-800'
              }`}
            >
              Position #{idx + 1}: {d.lenderName || d.product} (${Number(d.fundingAmount || 0).toLocaleString()})
            </button>
          ))}
        </div>
      )}

      {/* Commission Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Gross Deal Revenue
          </span>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            ${Math.round(grossCommission).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">
            {dealPercentage}% Points + ${dealFee.toLocaleString()} Fee
          </span>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Allocated to Splits
          </span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            ${Math.round(allocatedDollars).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{allocatedPoints.toFixed(2)}% Total Points</span>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            House / Firm Retained
          </span>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
            ${Math.round(houseRetainedDollars).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-400">{houseRetainedPoints.toFixed(2)}% Retained</span>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Participants
            </span>
            <div className="text-sm font-bold text-slate-200 mt-1">
              {dealCommissions.length} Split Recipient{dealCommissions.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddParticipant}
            className="flex items-center space-x-1 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Split</span>
          </button>
        </div>
      </div>

      {/* Participants Table */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Commission Split Allocation Table
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            For {activeDeal?.lenderName || 'Active Position'} (${dealFunding.toLocaleString()})
          </span>
        </div>

        {dealCommissions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">No custom commission splits configured for this deal position.</p>
            <button
              type="button"
              onClick={handleAddParticipant}
              className="mt-2 text-xs text-amber-400 hover:text-amber-300 font-bold underline"
            >
              + Add first split participant
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dealCommissions.map((part) => (
              <div
                key={part.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-[#070d18] p-3 rounded-xl border border-blue-900/40 items-center text-xs"
              >
                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Name / Beneficiary</label>
                  <input
                    type="text"
                    value={part.name || ''}
                    onChange={(e) => handleUpdateParticipant(part.id, { name: e.target.value })}
                    className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    placeholder="Participant Name"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Partner Type</label>
                  <select
                    value={part.type || 'Internal Staff'}
                    onChange={(e) => handleUpdateParticipant(part.id, { type: e.target.value as any })}
                    className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-1.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    {PARTICIPANT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Points (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={part.points ?? 0}
                    onChange={(e) => handleUpdateParticipant(part.id, { points: Number(e.target.value) })}
                    className="w-full bg-[#0b1528] border border-blue-900/60 rounded-lg p-1.5 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Amount ($)</label>
                  <div className="font-mono font-bold text-emerald-400 p-1.5">
                    ${Math.round(part.dollarAmount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <select
                    value={part.status || 'PENDING'}
                    onChange={(e) => handleUpdateParticipant(part.id, { status: e.target.value as any })}
                    className="bg-[#0b1528] border border-blue-900/60 rounded-lg p-1.5 text-[11px] text-cyan-300 font-semibold focus:border-amber-400 focus:outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="DISTRIBUTED">DISTRIBUTED</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleDeleteParticipant(part.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
