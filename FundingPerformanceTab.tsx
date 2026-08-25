import React from 'react';
import {
  Award,
  Building,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Client, FundingDeal, Lead } from '../../../types';
import { ProductBadge } from '../../common/StatusBadge';

interface FundingPerformanceTabProps {
  filteredDeals: FundingDeal[];
  allDeals: FundingDeal[];
  clients: Client[];
  leads: Lead[];
}

export const FundingPerformanceTab: React.FC<FundingPerformanceTabProps> = ({
  filteredDeals,
  allDeals,
  clients,
  leads,
}) => {
  // 1. Overall Funding Funnel Calculations
  const totalFundedDeals = filteredDeals.filter((d) => d.status === 'FUNDED');
  const totalApprovedDeals = filteredDeals.filter(
    (d) => d.status === 'APPROVED' || d.status === 'PRE_APPROVED' || d.status === 'FUNDED'
  );
  const totalFundedVolume = totalFundedDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);
  const totalRequestedVolume = filteredDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  const approvalRate =
    filteredDeals.length > 0 ? Math.round((totalApprovedDeals.length / filteredDeals.length) * 100) : 0;
  const fundedConversionRate =
    filteredDeals.length > 0 ? Math.round((totalFundedDeals.length / filteredDeals.length) * 100) : 0;

  // 2. Lender Performance Aggregation
  const lenderStats: Record<
    string,
    { submittedCount: number; fundedCount: number; totalFundedVolume: number; totalCommission: number }
  > = {};

  for (const deal of filteredDeals) {
    const lender = deal.lenderName || 'Maple Direct Capital';
    if (!lenderStats[lender]) {
      lenderStats[lender] = { submittedCount: 0, fundedCount: 0, totalFundedVolume: 0, totalCommission: 0 };
    }
    lenderStats[lender].submittedCount += 1;
    if (deal.status === 'FUNDED') {
      const amt = Number(deal.fundingAmount) || 0;
      const comm = (amt * (Number(deal.percentage) || 0)) / 100;
      lenderStats[lender].fundedCount += 1;
      lenderStats[lender].totalFundedVolume += amt;
      lenderStats[lender].totalCommission += comm;
    }
  }

  // 3. Product Performance Aggregation
  const productStats: Record<
    string,
    { count: number; fundedCount: number; fundedVolume: number; totalVolume: number }
  > = {};

  for (const deal of filteredDeals) {
    const prod = deal.product || 'Revenue Funding';
    if (!productStats[prod]) {
      productStats[prod] = { count: 0, fundedCount: 0, fundedVolume: 0, totalVolume: 0 };
    }
    const amt = Number(deal.fundingAmount) || 0;
    productStats[prod].count += 1;
    productStats[prod].totalVolume += amt;
    if (deal.status === 'FUNDED') {
      productStats[prod].fundedCount += 1;
      productStats[prod].fundedVolume += amt;
    }
  }

  // 4. Sales Rep / Originator Performance Aggregation
  const repStats: Record<
    string,
    { assignedDeals: number; fundedDeals: number; fundedVolume: number; totalCommission: number }
  > = {};

  for (const deal of filteredDeals) {
    const rep = deal.assignedStaff || 'Dana';
    if (!repStats[rep]) {
      repStats[rep] = { assignedDeals: 0, fundedDeals: 0, fundedVolume: 0, totalCommission: 0 };
    }
    repStats[rep].assignedDeals += 1;
    if (deal.status === 'FUNDED') {
      const amt = Number(deal.fundingAmount) || 0;
      const comm = (amt * (Number(deal.percentage) || 0)) / 100;
      repStats[rep].fundedDeals += 1;
      repStats[rep].fundedVolume += amt;
      repStats[rep].totalCommission += comm;
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Performance Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>TOTAL FUNDED CAPITAL</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${totalFundedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalFundedDeals.length} deals successfully settled
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>APPROVAL RATE</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2 font-mono">
            {approvalRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalApprovedDeals.length} of {filteredDeals.length} deals approved
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>FUNDING CONVERSION</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            {fundedConversionRate}%
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Deals moved to full settlement
          </div>
        </div>

        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>TOTAL CAPITAL SOUGHT</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2 font-mono">
            ${totalRequestedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {filteredDeals.length} underwriting files
          </div>
        </div>
      </div>

      {/* Lender Performance Table */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-blue-900/50 flex items-center justify-between bg-[#0a1428]">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Lender Syndicate Performance & Volume
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {Object.keys(lenderStats).length} Lenders Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-400 border-b border-blue-900/40 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Lender Partner</th>
                <th className="py-3 px-4 text-center">Deals Submitted</th>
                <th className="py-3 px-4 text-center">Deals Funded</th>
                <th className="py-3 px-4 text-center">Lender Approval %</th>
                <th className="py-3 px-4 text-right">Funded Volume ($)</th>
                <th className="py-3 px-4 text-right">Commission Generated ($)</th>
                <th className="py-3 px-4 text-right">Avg Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 font-sans">
              {Object.entries(lenderStats).map(([lender, stats]) => {
                const lenderAppPct =
                  stats.submittedCount > 0 ? Math.round((stats.fundedCount / stats.submittedCount) * 100) : 0;
                const avgTicket = stats.fundedCount > 0 ? Math.round(stats.totalFundedVolume / stats.fundedCount) : 0;

                return (
                  <tr key={lender} className="hover:bg-blue-950/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-100 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-900/40 border border-blue-800 flex items-center justify-center text-cyan-400 font-mono text-xs">
                        {lender.charAt(0)}
                      </div>
                      <span>{lender}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300 font-semibold">
                      {stats.submittedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-bold">
                      {stats.fundedCount}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-cyan-300">
                      <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-800 text-[11px]">
                        {lenderAppPct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-100">
                      ${stats.totalFundedVolume.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-400">
                      ${stats.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      ${avgTicket.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid: Product Mix & Sales Rep Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Mix Breakdown */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-blue-900/50 flex items-center justify-between bg-[#0a1428]">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Product Volume Breakdown
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            {Object.entries(productStats).map(([product, stats]) => {
              const totalFundedSum = totalFundedVolume || 1;
              const sharePct = Math.round((stats.fundedVolume / totalFundedSum) * 100);

              return (
                <div key={product} className="bg-[#091224] p-3.5 rounded-xl border border-blue-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <ProductBadge product={product} />
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${stats.fundedVolume.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1 font-mono">
                        ({stats.fundedCount} funded)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-blue-900/30">
                    <span>Total Submissions: {stats.count}</span>
                    <span>Portfolio Share: <strong className="text-cyan-300">{sharePct}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales Rep / Originator Leaderboard */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-blue-900/50 flex items-center justify-between bg-[#0a1428]">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Originator & Underwriter Production
              </h2>
            </div>
          </div>

          <div className="p-4 space-y-3.5">
            {Object.entries(repStats).map(([rep, stats]) => {
              return (
                <div key={rep} className="bg-[#091224] p-3.5 rounded-xl border border-blue-900/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold font-mono text-[10px]">
                        {rep.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-100">{rep}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ${stats.fundedVolume.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-1 font-mono">
                        ({stats.fundedDeals} closed)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-blue-900/30">
                    <span>Assigned Files: {stats.assignedDeals}</span>
                    <span>Commission Yield: <strong className="text-amber-400 font-mono">${stats.totalCommission.toLocaleString()}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
