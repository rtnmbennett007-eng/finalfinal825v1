import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Building2,
  PieChart,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  Clock,
  ChevronRight,
  ExternalLink,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { Client, FundingDeal, PipelineStage } from '../../../types';
import { StatusBadge, ProductBadge } from '../../common/StatusBadge';

interface PipelineReportTabProps {
  filteredDeals: FundingDeal[];
  clients: Client[];
  onSelectClient?: (clientId: string) => void;
  activePipelineValue: number;
  totalFundedValue: number;
  expectedCommissionTotal: number;
}

export const PipelineReportTab: React.FC<PipelineReportTabProps> = ({
  filteredDeals,
  clients,
  onSelectClient,
  activePipelineValue,
  totalFundedValue,
  expectedCommissionTotal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'client' | 'commission'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Group deals by status
  const dealsByStage: Record<string, { count: number; volume: number; expectedCommission: number }> = {};
  for (const deal of filteredDeals) {
    const st = deal.status || 'PROPOSED';
    if (!dealsByStage[st]) {
      dealsByStage[st] = { count: 0, volume: 0, expectedCommission: 0 };
    }
    const amt = Number(deal.fundingAmount) || 0;
    const comm = (amt * (Number(deal.percentage) || 0)) / 100;
    dealsByStage[st].count += 1;
    dealsByStage[st].volume += amt;
    dealsByStage[st].expectedCommission += comm;
  }

  // Product distribution
  const volumeByProduct: Record<string, { count: number; volume: number }> = {};
  for (const deal of filteredDeals) {
    const prod = deal.product || 'Revenue Funding';
    if (!volumeByProduct[prod]) {
      volumeByProduct[prod] = { count: 0, volume: 0 };
    }
    volumeByProduct[prod].count += 1;
    volumeByProduct[prod].volume += Number(deal.fundingAmount) || 0;
  }

  // Search and sort deals
  const displayedDeals = filteredDeals
    .filter((d) => {
      const q = searchTerm.toLowerCase();
      return (
        d.clientName?.toLowerCase().includes(q) ||
        d.businessName?.toLowerCase().includes(q) ||
        d.product?.toLowerCase().includes(q) ||
        d.lenderName?.toLowerCase().includes(q) ||
        d.assignedStaff?.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'amount') {
        comparison = (Number(a.fundingAmount) || 0) - (Number(b.fundingAmount) || 0);
      } else if (sortBy === 'date') {
        comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      } else if (sortBy === 'client') {
        comparison = (a.clientName || '').localeCompare(b.clientName || '');
      } else if (sortBy === 'commission') {
        const commA = ((Number(a.fundingAmount) || 0) * (Number(a.percentage) || 0)) / 100;
        const commB = ((Number(b.fundingAmount) || 0) * (Number(b.percentage) || 0)) / 100;
        comparison = commA - commB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const avgDealSize =
    filteredDeals.length > 0
      ? Math.round(filteredDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0) / filteredDeals.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* High-Level Executive Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>FILTERED PIPELINE DEALS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
            {filteredDeals.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across active filtering parameters
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>AVERAGE TICKET SIZE</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${avgDealSize.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mean capital request per deal
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>TOTAL EXPECTED COMMISSION</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            ${Math.round(expectedCommissionTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Gross potential commission yield
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>PIPELINE TOTAL CAPITAL</span>
            <PieChart className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2 font-mono">
            ${Math.round(filteredDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0)).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total active & historical volume
          </div>
        </div>
      </div>

      {/* Visual Funnel & Product Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deal Volume by Pipeline Stage */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-blue-900/50">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Pipeline Stage Volume & Deal Distribution
          </h3>

          <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {Object.keys(dealsByStage).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">No deals in current filter range.</div>
            ) : (
              Object.entries(dealsByStage).map(([stage, data]) => {
                const totalVol = filteredDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0) || 1;
                const pct = Math.round((data.volume / totalVol) * 100);
                return (
                  <div key={stage} className="space-y-1 bg-[#091224] p-2.5 rounded-xl border border-blue-900/40">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={stage} />
                        <span className="text-[11px] text-slate-400 font-mono font-semibold">
                          ({data.count} {data.count === 1 ? 'deal' : 'deals'})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-slate-200 text-xs">
                          ${data.volume.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-blue-300/70 ml-1 font-mono">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#050a14] rounded-full h-1.5 overflow-hidden border border-blue-950 mt-1">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product Mix Distribution */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-5 shadow-lg">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-blue-900/50">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Capital Distribution by Funding Product
          </h3>

          <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {Object.keys(volumeByProduct).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">No product data in current filter.</div>
            ) : (
              Object.entries(volumeByProduct).map(([product, data]) => {
                const totalVol = filteredDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0) || 1;
                const pct = Math.round((data.volume / totalVol) * 100);
                return (
                  <div key={product} className="space-y-1 bg-[#091224] p-2.5 rounded-xl border border-blue-900/40">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ProductBadge product={product} />
                        <span className="text-[11px] text-slate-400 font-mono font-semibold">
                          ({data.count} {data.count === 1 ? 'deal' : 'deals'})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          ${data.volume.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-blue-300/70 ml-1 font-mono">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#050a14] rounded-full h-1.5 overflow-hidden border border-blue-950 mt-1">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Comprehensive Pipeline Deals Data Table */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a1428]">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Pipeline Deals Ledger ({displayedDeals.length})
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              Live Synchronized
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deals, clients, reps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-[#050b17] border border-blue-900/70 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-1 bg-[#050b17] border border-blue-900/70 rounded-xl px-2.5 py-1 text-xs">
              <ArrowUpDown className="w-3 h-3 text-slate-400 mr-1" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort deals by"
                className="bg-transparent text-slate-200 text-xs focus:outline-hidden cursor-pointer"
              >
                <option value="date" className="bg-[#0e1c38]">Sort: Date</option>
                <option value="amount" className="bg-[#0e1c38]">Sort: Funding Amount</option>
                <option value="client" className="bg-[#0e1c38]">Sort: Client Name</option>
                <option value="commission" className="bg-[#0e1c38]">Sort: Commission</option>
              </select>
              <button
                onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                className="text-slate-400 hover:text-cyan-400 text-[10px] font-mono px-1"
                title="Toggle order"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-400 border-b border-blue-900/40 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Deal ID / Position</th>
                <th className="py-3 px-4">Client & Business</th>
                <th className="py-3 px-4">Funding Product</th>
                <th className="py-3 px-4 text-right">Funding Amount</th>
                <th className="py-3 px-4 text-right">Commission Rate</th>
                <th className="py-3 px-4 text-right">Expected Commission</th>
                <th className="py-3 px-4">Lender / Source</th>
                <th className="py-3 px-4">Deal Stage</th>
                <th className="py-3 px-4">Assigned Staff</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 font-sans">
              {displayedDeals.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                    No funding deals match the selected criteria.
                  </td>
                </tr>
              ) : (
                displayedDeals.map((deal) => {
                  const amt = Number(deal.fundingAmount) || 0;
                  const pct = Number(deal.percentage) || 0;
                  const expComm = (amt * pct) / 100;

                  return (
                    <tr
                      key={deal.id}
                      className="hover:bg-blue-950/40 transition-colors group"
                    >
                      {/* Deal ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <span>#{deal.id.slice(-6)}</span>
                          {deal.isStacked && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono">
                              STACK
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Client & Business */}
                      <td className="py-3.5 px-4">
                        <div
                          onClick={() => deal.clientId && onSelectClient && onSelectClient(deal.clientId)}
                          className="font-bold text-slate-100 hover:text-amber-400 cursor-pointer flex items-center gap-1 group-hover:underline"
                        >
                          <span>{deal.clientName || 'Unnamed Client'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                          {deal.businessName || 'No business specified'}
                        </div>
                      </td>

                      {/* Product */}
                      <td className="py-3.5 px-4">
                        <ProductBadge product={deal.product} />
                      </td>

                      {/* Funding Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                        ${amt.toLocaleString()}
                      </td>

                      {/* Commission Rate */}
                      <td className="py-3.5 px-4 text-right font-mono text-cyan-400 font-semibold">
                        {pct.toFixed(2)}%
                      </td>

                      {/* Expected Commission */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                        ${expComm.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Lender */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {deal.lenderName || 'Maple Direct Capital'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={deal.status} />
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-950 border border-blue-900 text-blue-200">
                          {deal.assignedStaff || 'Dana'}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => deal.clientId && onSelectClient && onSelectClient(deal.clientId)}
                          className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-amber-500 hover:text-slate-950 text-blue-200 text-[11px] font-bold transition-all"
                        >
                          View 360°
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
