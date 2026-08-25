import React, { useState } from 'react';
import {
  DollarSign,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { Client, CommissionParticipant, FundingDeal } from '../../../types';
import { ProductBadge } from '../../common/StatusBadge';

interface CommissionStackingTabProps {
  filteredDeals: FundingDeal[];
  allDeals: FundingDeal[];
  commissions: CommissionParticipant[];
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
  onUpdateCommissionParticipant?: (id: string, data: Partial<CommissionParticipant>) => Promise<any>;
  onMarkDealCommissionReceived?: (dealId: string) => Promise<any>;
}

export const CommissionStackingTab: React.FC<CommissionStackingTabProps> = ({
  filteredDeals,
  allDeals,
  commissions,
  clients,
  onSelectClient,
  onUpdateCommissionParticipant,
  onMarkDealCommissionReceived,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INTERNAL' | 'PARTNER'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Map deals for fast lookup
  const dealMap = new Map(allDeals.map((d) => [d.id, d]));
  const filteredDealIds = new Set(filteredDeals.map((d) => d.id));

  // Filter commissions to match active deal filters + search + sub-filters
  const activeCommissions = commissions.filter((cp) => {
    // Must belong to filtered deals if deal filters are active
    if (filteredDeals.length > 0 && !filteredDealIds.has(cp.dealId)) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      const isReceived = cp.status === 'RECEIVED';
      if (statusFilter === 'RECEIVED' && !isReceived) return false;
      if (statusFilter === 'PENDING' && isReceived) return false;
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      const isInternal = cp.type === 'Internal Staff';
      if (typeFilter === 'INTERNAL' && !isInternal) return false;
      if (typeFilter === 'PARTNER' && isInternal) return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const deal = dealMap.get(cp.dealId);
      const matchName = cp.name.toLowerCase().includes(q);
      const matchRole = cp.role?.toLowerCase().includes(q);
      const matchClient = deal?.clientName?.toLowerCase().includes(q);
      const matchBusiness = deal?.businessName?.toLowerCase().includes(q);
      const matchDealId = cp.dealId.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchClient && !matchBusiness && !matchDealId) {
        return false;
      }
    }

    return true;
  });

  // Calculate High-level Commission Metrics from filtered deals
  let predictedCommission = 0;
  let uncollectedCommission = 0;
  let collectedCommission = 0;

  for (const deal of filteredDeals) {
    const amt = Number(deal.fundingAmount) || 0;
    const pct = Number(deal.percentage) || 0;
    const totalComm = (amt * pct) / 100;

    predictedCommission += totalComm;
    if (deal.status === 'FUNDED') {
      if (deal.commissionStatus === 'COLLECTED') {
        collectedCommission += totalComm;
      } else {
        uncollectedCommission += totalComm;
      }
    }
  }

  // Multi-Product Stacking Statistics
  const stackedDeals = filteredDeals.filter((d) => d.isStacked);
  const primaryDeals = filteredDeals.filter((d) => !d.isStacked);
  const stackedVolume = stackedDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);
  const primaryVolume = primaryDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  // Group commissions by participant name
  const participantSummary: Record<
    string,
    { name: string; type: string; totalPoints: number; totalDollars: number; receivedDollars: number; count: number }
  > = {};

  for (const cp of activeCommissions) {
    if (!participantSummary[cp.name]) {
      participantSummary[cp.name] = {
        name: cp.name,
        type: cp.type || 'Internal Staff',
        totalPoints: 0,
        totalDollars: 0,
        receivedDollars: 0,
        count: 0,
      };
    }
    const dollars = Number(cp.dollarAmount) || 0;
    participantSummary[cp.name].count += 1;
    participantSummary[cp.name].totalPoints += Number(cp.points) || 0;
    participantSummary[cp.name].totalDollars += dollars;
    if (cp.status === 'RECEIVED') {
      participantSummary[cp.name].receivedDollars += dollars;
    }
  }

  // Handle Mark Received
  const handleToggleReceived = async (cp: CommissionParticipant) => {
    if (!onUpdateCommissionParticipant) return;
    setUpdatingId(cp.id);
    try {
      const newStatus = cp.status === 'RECEIVED' ? 'PENDING' : 'RECEIVED';
      const receivedDate = newStatus === 'RECEIVED' ? new Date().toISOString() : undefined;
      await onUpdateCommissionParticipant(cp.id, {
        status: newStatus,
        receivedDate,
      });
    } catch (err) {
      console.error('Failed to update participant commission status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>COMMISSION PREDICTED</span>
            <Sparkles className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400 mt-2 font-mono">
            ${Math.round(predictedCommission).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total potential commission across pipeline
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>TO BE COLLECTED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            ${Math.round(uncollectedCommission).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Funded deals awaiting lender payout
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>COMMISSION COLLECTED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${Math.round(collectedCommission).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Realized cash settled to treasury
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>STACKED POSITIONS VOLUME</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2 font-mono">
            ${Math.round(stackedVolume).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stackedDeals.length} stacked multi-tranche positions
          </div>
        </div>
      </div>

      {/* Multi-Product Stacking Architecture Showcase */}
      <div className="bg-gradient-to-br from-[#0c1933] to-[#081124] border border-purple-900/50 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-900/40">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Maple X Multi-Product Stacking Model Performance
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive breakdown of Primary 1st Positions vs Multi-Product Stacked 2nd & 3rd Tranches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-200 font-mono font-bold">
              {Math.round((stackedVolume / (primaryVolume + stackedVolume || 1)) * 100)}% Stacked Capital Share
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-[#060c1a] border border-blue-900/50 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-300 font-bold uppercase tracking-wider">Primary (1st Position Deals)</span>
              <span className="font-mono font-bold text-slate-100 text-sm">${primaryVolume.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Deal Count: <strong>{primaryDeals.length}</strong></span>
              <span>Avg Tranche: <strong>${primaryDeals.length ? Math.round(primaryVolume / primaryDeals.length).toLocaleString() : 0}</strong></span>
            </div>
          </div>

          <div className="bg-[#060c1a] border border-purple-900/50 p-4 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-300 font-bold uppercase tracking-wider">Stacked (2nd & 3rd Positions)</span>
              <span className="font-mono font-bold text-purple-300 text-sm">${stackedVolume.toLocaleString()}</span>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Stacked Deals: <strong>{stackedDeals.length}</strong></span>
              <span>Avg Stack Size: <strong>${stackedDeals.length ? Math.round(stackedVolume / stackedDeals.length).toLocaleString() : 0}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Participant Allocation Summary Cards */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-blue-900/50 flex items-center justify-between bg-[#0a1428]">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Participant Commission Distribution Summary
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {Object.keys(participantSummary).length} Participants Active
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.values(participantSummary).map((part) => {
            const isInternal = part.type === 'Internal Staff';
            return (
              <div
                key={part.name}
                className="bg-[#091224] p-4 rounded-xl border border-blue-900/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                        isInternal
                          ? 'bg-blue-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {part.name.charAt(0)}
                    </div>
                    <span>{part.name}</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      isInternal
                        ? 'bg-blue-950 text-blue-300 border border-blue-800'
                        : 'bg-purple-950 text-purple-300 border border-purple-800'
                    }`}
                  >
                    {part.type}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xs text-slate-400">Total Allocation:</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    ${Math.round(part.totalDollars).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-blue-900/30">
                  <span>Collected: <strong className="text-emerald-400 font-mono">${Math.round(part.receivedDollars).toLocaleString()}</strong></span>
                  <span>Deals: <strong>{part.count}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Participant Allocation Ledger Table */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Filters & Search Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0a1428]">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Detailed Commission Participant Ledger ({activeCommissions.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search participant, client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#050b17] border border-blue-900/70 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-[#050b17] border border-blue-900/70 rounded-xl px-2.5 py-1 text-xs">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter commission status"
                className="bg-transparent text-slate-200 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="ALL" className="bg-[#0e1c38]">All Statuses</option>
                <option value="PENDING" className="bg-[#0e1c38]">Pending Only</option>
                <option value="RECEIVED" className="bg-[#0e1c38]">Received Only</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-1 bg-[#050b17] border border-blue-900/70 rounded-xl px-2.5 py-1 text-xs">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                aria-label="Filter participant type"
                className="bg-transparent text-slate-200 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="ALL" className="bg-[#0e1c38]">All Roles</option>
                <option value="INTERNAL" className="bg-[#0e1c38]">Internal Staff</option>
                <option value="PARTNER" className="bg-[#0e1c38]">Referral Partner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-400 border-b border-blue-900/40 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Participant & Role</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Deal ID & Client</th>
                <th className="py-3 px-4 text-right">Deal Capital</th>
                <th className="py-3 px-4 text-right">Points (%)</th>
                <th className="py-3 px-4 text-right">Commission ($)</th>
                <th className="py-3 px-4">Settlement Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 font-sans">
              {activeCommissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No commission allocations found matching the current criteria.
                  </td>
                </tr>
              ) : (
                activeCommissions.map((cp) => {
                  const deal = dealMap.get(cp.dealId);
                  const isReceived = cp.status === 'RECEIVED';
                  const isUpdating = updatingId === cp.id;

                  return (
                    <tr key={cp.id} className="hover:bg-blue-950/40 transition-colors">
                      {/* Participant */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{cp.name}</div>
                        <div className="text-[11px] text-slate-400">{cp.role || 'Participant'}</div>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                            cp.type === 'Internal Staff'
                              ? 'bg-blue-950 text-cyan-300 border border-blue-800'
                              : 'bg-purple-950 text-purple-300 border border-purple-800'
                          }`}
                        >
                          {cp.type || 'Internal Staff'}
                        </span>
                      </td>

                      {/* Deal & Client */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => deal?.clientId && onSelectClient && onSelectClient(deal.clientId)}
                          className="font-semibold text-slate-200 hover:text-amber-400 cursor-pointer flex items-center gap-1"
                        >
                          <span>{deal?.clientName || 'Unknown Client'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Deal #{cp.dealId.slice(-6)}
                        </div>
                      </td>

                      {/* Deal Funding Amount */}
                      <td className="py-3 px-4 text-right font-mono text-slate-200">
                        ${Number(deal?.fundingAmount || 0).toLocaleString()}
                      </td>

                      {/* Points */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                        {Number(cp.points || 0).toFixed(3)}%
                      </td>

                      {/* Commission Dollar Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400 text-sm">
                        ${Number(cp.dollarAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            RECEIVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
                            <Clock className="w-3 h-3 text-amber-400" />
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          disabled={isUpdating}
                          onClick={() => handleToggleReceived(cp)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            isReceived
                              ? 'bg-blue-950 hover:bg-amber-950/60 text-slate-400 border-blue-900 hover:text-amber-300'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-950'
                          }`}
                        >
                          {isUpdating ? 'Saving...' : isReceived ? 'Revert to Pending' : 'Mark Received'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
