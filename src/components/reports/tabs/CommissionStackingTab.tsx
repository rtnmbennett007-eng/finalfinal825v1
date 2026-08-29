import React, { useState } from 'react';
import {
  DollarSign,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
  PieChart,
  Search,
  ExternalLink,
  ShieldCheck,
  Filter,
  Wallet,
  Target,
} from 'lucide-react';
import { Client, FundingDeal } from '../../../types';
import { ProductBadge } from '../../common/StatusBadge';
import { calculateDealCommission } from '../../../utils/commissionCalculator';

interface CommissionStackingTabProps {
  filteredDeals: FundingDeal[];
  allDeals: FundingDeal[];
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
  onMarkDealCommissionReceived?: (dealId: string) => Promise<any>;
}

export const CommissionStackingTab: React.FC<CommissionStackingTabProps> = ({
  filteredDeals,
  allDeals,
  clients,
  onSelectClient,
  onMarkDealCommissionReceived,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COLLECTED'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Active Pipeline deals (UNDERWRITING, PRE-APPROVED, PRE-APPROVAL AND APPROVED)
  const isPipelineStatus = (status?: string | null) => {
    if (!status) return false;
    const s = status.toUpperCase().replace(/\s+/g, '_');
    return (
      s === 'UNDERWRITING' ||
      s === 'PRE_APPROVED' ||
      s === 'PRE_APPROVAL' ||
      s === 'PRE_APPROVAL_AND_APPROVED' ||
      s === 'APPROVED'
    );
  };

  // Calculate High-level Commission Metrics from filtered deals
  let predictedCommission = 0;
  let uncollectedCommission = 0;
  let collectedCommission = 0;
  let totalFundedVolume = 0;

  for (const deal of filteredDeals) {
    const calc = calculateDealCommission(deal);
    const totalComm = calc.totalCommission;

    if (isPipelineStatus(deal.status)) {
      predictedCommission += totalComm;
    }

    if (deal.status === 'FUNDED') {
      totalFundedVolume += Number(deal.fundingAmount) || 0;
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

  // Filter deals for ledger
  const activeDeals = filteredDeals.filter((deal) => {
    if (statusFilter !== 'ALL') {
      const isCollected = deal.commissionStatus === 'COLLECTED';
      if (statusFilter === 'COLLECTED' && !isCollected) return false;
      if (statusFilter === 'PENDING' && isCollected) return false;
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchClient = deal.clientName?.toLowerCase().includes(q);
      const matchBusiness = deal.businessName?.toLowerCase().includes(q);
      const matchLender = deal.lenderName?.toLowerCase().includes(q);
      const matchProduct = deal.product?.toLowerCase().includes(q);
      const matchId = deal.id.toLowerCase().includes(q);
      if (!matchClient && !matchBusiness && !matchLender && !matchProduct && !matchId) {
        return false;
      }
    }

    return true;
  });

  // Handle Mark Deal Commission Received
  const handleToggleDealCommission = async (deal: FundingDeal) => {
    if (!onMarkDealCommissionReceived) return;
    setUpdatingId(deal.id);
    try {
      await onMarkDealCommissionReceived(deal.id);
    } catch (err) {
      console.error('Failed to update deal commission status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: COMMISSION PREDICTION */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Commission Prediction</span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-2">
            ${Math.round(predictedCommission).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Active pipeline deals at expected fee %
          </div>
        </div>

        {/* Card 2: TOTAL FUNDED */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Total Funded Capital</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            ${Math.round(totalFundedVolume).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {filteredDeals.filter((d) => d.status === 'FUNDED').length} funded deals
          </div>
        </div>

        {/* Card 3: COMMISSION TO BE COLLECTED */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Commission To Be Collected</span>
            <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-purple-300 mt-2">
            ${Math.round(uncollectedCommission).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Outstanding balance on funded deals
          </div>
        </div>

        {/* Card 4: COMMISSION COLLECTED */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Commission Collected</span>
            <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-teal-300 mt-2">
            ${Math.round(collectedCommission).toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Verified received revenue
          </div>
        </div>
      </div>

      {/* Multi-Product Stacking Architecture */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-blue-900/50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Multi-Product Deal Stacking Performance
            </h2>
          </div>
          <span className="text-xs text-cyan-300 font-mono">
            {stackedDeals.length} of {filteredDeals.length} Deals Stacked ({filteredDeals.length ? Math.round((stackedDeals.length / filteredDeals.length) * 100) : 0}%)
          </span>
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

      {/* Deal-Level Commission & Stacking Ledger */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Filters & Search Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0a1428]">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Deal Commissions & Stacking Ledger ({activeDeals.length})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deal, client, lender..."
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
                <option value="ALL" className="bg-[#0e1c38]">All Commissions</option>
                <option value="PENDING" className="bg-[#0e1c38]">Pending / Uncollected</option>
                <option value="COLLECTED" className="bg-[#0e1c38]">Collected Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-400 border-b border-blue-900/40 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Deal ID & Position</th>
                <th className="py-3 px-4">Client / Business</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Lender</th>
                <th className="py-3 px-4 text-right">Funded Amount</th>
                <th className="py-3 px-4 text-right">Fee Rate (%)</th>
                <th className="py-3 px-4 text-right">Expected Commission</th>
                <th className="py-3 px-4">Commission Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 font-sans">
              {activeDeals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No deals found matching the current criteria.
                  </td>
                </tr>
              ) : (
                activeDeals.map((deal) => {
                  const amt = Number(deal.fundingAmount) || 0;
                  const pct = Number(deal.percentage) || 0;
                  const comm = (amt * pct) / 100;
                  const isCollected = deal.commissionStatus === 'COLLECTED';
                  const isUpdating = updatingId === deal.id;

                  return (
                    <tr key={deal.id} className="hover:bg-blue-950/40 transition-colors">
                      {/* Deal ID & Position */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-300 font-bold">#{deal.id.slice(-6)}</div>
                        <div className="text-[10px] text-slate-400">
                          {deal.isStacked ? (
                            <span className="text-purple-300 font-semibold">Stacked Position</span>
                          ) : (
                            <span className="text-slate-400">Primary (1st)</span>
                          )}
                        </div>
                      </td>

                      {/* Client / Business */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => deal.clientId && onSelectClient && onSelectClient(deal.clientId)}
                          className="font-bold text-slate-100 hover:text-amber-400 cursor-pointer flex items-center gap-1"
                        >
                          <span>{deal.clientName || 'Unknown Client'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </div>
                        <div className="text-[11px] text-slate-400">{deal.businessName || 'Direct Account'}</div>
                      </td>

                      {/* Product */}
                      <td className="py-3 px-4">
                        <ProductBadge product={deal.product} />
                      </td>

                      {/* Lender */}
                      <td className="py-3 px-4 text-slate-300">
                        {deal.lenderName || 'Direct'}
                      </td>

                      {/* Funded Amount */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        ${amt.toLocaleString()}
                      </td>

                      {/* Fee Rate */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {pct.toFixed(2)}%
                      </td>

                      {/* Expected Commission */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-300 text-sm">
                        ${comm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {isCollected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            COLLECTED
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
                        <div className="flex items-center justify-center gap-2">
                          <button
                            disabled={isUpdating}
                            onClick={() => handleToggleDealCommission(deal)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                              isCollected
                                ? 'bg-blue-950 hover:bg-amber-950/60 text-slate-400 border-blue-900 hover:text-amber-300'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-950'
                            }`}
                          >
                            {isUpdating ? 'Saving...' : isCollected ? 'Mark Pending' : 'Mark Collected'}
                          </button>
                          <button
                            onClick={() => deal.clientId && onSelectClient && onSelectClient(deal.clientId)}
                            className="px-2.5 py-1 rounded-lg bg-blue-900/40 hover:bg-blue-800 text-cyan-300 text-[11px] font-semibold border border-blue-800 transition-colors"
                          >
                            Open File
                          </button>
                        </div>
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
