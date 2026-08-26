import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  Users,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Client, FundingDeal, Lead } from '../../../types';
import { StatusBadge, ProductBadge } from '../../common/StatusBadge';

interface MonthlyPerformanceTabProps {
  deals: FundingDeal[];
  clients: Client[];
  leads: Lead[];
  onSelectClient?: (clientId: string) => void;
}

export const MonthlyPerformanceTab: React.FC<MonthlyPerformanceTabProps> = ({
  deals,
  clients,
  leads,
  onSelectClient,
}) => {
  // Generate list of available months from actual deal & client creation dates
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include current and recent months
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      set.add(key);
    }
    // Add any dates from deals
    for (const deal of deals) {
      if (deal.fundingDate) {
        set.add(deal.fundingDate.slice(0, 7));
      }
      if (deal.createdAt) {
        set.add(deal.createdAt.slice(0, 7));
      }
    }
    return Array.from(set).sort().reverse();
  }, [deals]);

  const [selectedMonth, setSelectedMonth] = useState<string>(availableMonths[0] || '2026-08');

  // Compute selected month and prior month dates
  const [selectedYear, selectedMonthNum] = selectedMonth.split('-').map(Number);
  const priorMonthNum = selectedMonthNum === 1 ? 12 : selectedMonthNum - 1;
  const priorYear = selectedMonthNum === 1 ? selectedYear - 1 : selectedYear;
  const priorMonthKey = `${priorYear}-${String(priorMonthNum).padStart(2, '0')}`;

  // Month Format label (e.g., "August 2026")
  const monthName = new Date(selectedYear, selectedMonthNum - 1, 1).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });
  const priorMonthName = new Date(priorYear, priorMonthNum - 1, 1).toLocaleString('default', {
    month: 'short',
    year: 'numeric',
  });

  // Calculate Metrics for Selected Month
  const currentMonthDeals = deals.filter((d) => {
    const date = d.fundingDate || d.createdAt;
    return date && date.startsWith(selectedMonth);
  });
  const currentFundedDeals = currentMonthDeals.filter((d) => d.status === 'FUNDED');
  const currentFundedVolume = currentFundedDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);
  const currentCommissionCollected = currentFundedDeals
    .filter((d) => d.commissionStatus === 'COLLECTED')
    .reduce((sum, d) => sum + ((Number(d.fundingAmount) || 0) * (Number(d.percentage) || 0)) / 100, 0);

  // Calculate Metrics for Prior Month
  const priorMonthDeals = deals.filter((d) => {
    const date = d.fundingDate || d.createdAt;
    return date && date.startsWith(priorMonthKey);
  });
  const priorFundedDeals = priorMonthDeals.filter((d) => d.status === 'FUNDED');
  const priorFundedVolume = priorFundedDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);
  const priorCommissionCollected = priorFundedDeals
    .filter((d) => d.commissionStatus === 'COLLECTED')
    .reduce((sum, d) => sum + ((Number(d.fundingAmount) || 0) * (Number(d.percentage) || 0)) / 100, 0);

  // Calculate Percentage Changes
  const calculateChange = (current: number, prior: number) => {
    if (prior === 0) return current > 0 ? '+100%' : '0%';
    const pct = ((current - prior) / prior) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const volumeGrowth = calculateChange(currentFundedVolume, priorFundedVolume);
  const commissionGrowth = calculateChange(currentCommissionCollected, priorCommissionCollected);
  const dealsGrowth = calculateChange(currentFundedDeals.length, priorFundedDeals.length);

  // Monthly Rep Performance
  const monthlyReps: Record<string, { fundedVolume: number; count: number; commission: number }> = {};
  for (const deal of currentFundedDeals) {
    const rep = deal.assignedStaff || 'Dana';
    if (!monthlyReps[rep]) {
      monthlyReps[rep] = { fundedVolume: 0, count: 0, commission: 0 };
    }
    const amt = Number(deal.fundingAmount) || 0;
    const comm = (amt * (Number(deal.percentage) || 0)) / 100;
    monthlyReps[rep].fundedVolume += amt;
    monthlyReps[rep].count += 1;
    monthlyReps[rep].commission += comm;
  }

  // Monthly Lenders
  const monthlyLenders: Record<string, { fundedVolume: number; count: number }> = {};
  for (const deal of currentFundedDeals) {
    const lender = deal.lenderName || 'Maple Direct Capital';
    if (!monthlyLenders[lender]) {
      monthlyLenders[lender] = { fundedVolume: 0, count: 0 };
    }
    monthlyLenders[lender].fundedVolume += Number(deal.fundingAmount) || 0;
    monthlyLenders[lender].count += 1;
  }

  return (
    <div className="space-y-6">
      {/* Month Selector Bar */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">{monthName} Operations Performance</h2>
            <p className="text-xs text-slate-400">
              Month-over-month comparisons against {priorMonthName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Select Month:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-[#050b17] border border-blue-900/80 rounded-xl text-xs font-mono font-bold text-cyan-300 focus:outline-hidden focus:border-cyan-500"
          >
            {availableMonths.map((m) => {
              const [y, mo] = m.split('-').map(Number);
              const label = new Date(y, mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
              return (
                <option key={m} value={m} className="bg-[#0e1c38] text-slate-200">
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Month-over-Month (MoM) Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Funded Capital */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>MONTHLY FUNDED VOLUME</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${currentFundedVolume.toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1">
            <span
              className={`font-mono font-bold ${
                volumeGrowth.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {volumeGrowth}
            </span>
            <span className="text-slate-500">vs {priorMonthName}</span>
          </div>
        </div>

        {/* Commission Collected */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>COMMISSION COLLECTED</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            ${Math.round(currentCommissionCollected).toLocaleString()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1">
            <span
              className={`font-mono font-bold ${
                commissionGrowth.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {commissionGrowth}
            </span>
            <span className="text-slate-500">vs {priorMonthName}</span>
          </div>
        </div>

        {/* Deals Closed */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>DEALS FUNDED & CLOSED</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300 mt-2 font-mono">
            {currentFundedDeals.length}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-1">
            <span
              className={`font-mono font-bold ${
                dealsGrowth.startsWith('+') ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {dealsGrowth}
            </span>
            <span className="text-slate-500">vs {priorMonthName}</span>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="bg-[#0e1c38] border border-blue-900/60 p-4.5 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-blue-300/80 font-medium">
            <span>AVERAGE DEAL TICKET</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 mt-2 font-mono">
            ${currentFundedDeals.length ? Math.round(currentFundedVolume / currentFundedDeals.length).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mean capital per funded position
          </div>
        </div>
      </div>

      {/* Grid: Top Sales Reps of the Month & Top Lenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Reps */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-blue-900/50">
            <Users className="w-4 h-4 text-amber-400" />
            Top Originators of {monthName}
          </h3>

          <div className="mt-4 space-y-3">
            {Object.keys(monthlyReps).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No deals closed in {monthName}.
              </div>
            ) : (
              Object.entries(monthlyReps).map(([rep, data]) => (
                <div key={rep} className="bg-[#091224] p-3 rounded-xl border border-blue-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-xs font-mono">
                      {rep.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{rep}</div>
                      <div className="text-[11px] text-slate-400">{data.count} funded deals</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-emerald-400 text-xs">
                      ${data.fundedVolume.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono">
                      ${Math.round(data.commission).toLocaleString()} comm.
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Lenders */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-5 shadow-xl">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-blue-900/50">
            <Building className="w-4 h-4 text-cyan-400" />
            Lender Distribution in {monthName}
          </h3>

          <div className="mt-4 space-y-3">
            {Object.keys(monthlyLenders).length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No lender settlements recorded for {monthName}.
              </div>
            ) : (
              Object.entries(monthlyLenders).map(([lender, data]) => (
                <div key={lender} className="bg-[#091224] p-3 rounded-xl border border-blue-900/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-900/40 text-cyan-400 border border-blue-800 flex items-center justify-center font-bold text-xs font-mono">
                      {lender.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-xs">{lender}</div>
                      <div className="text-[11px] text-slate-400">{data.count} funded tranches</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-100 text-xs">
                    ${data.fundedVolume.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Monthly Deals Table */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-blue-900/50 flex items-center justify-between bg-[#0a1428]">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            All Deal Activity in {monthName} ({currentMonthDeals.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070e20] text-slate-400 border-b border-blue-900/40 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Deal ID</th>
                <th className="py-3 px-4">Client & Business</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4 text-right">Amount ($)</th>
                <th className="py-3 px-4 text-right">Commission Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Lender</th>
                <th className="py-3 px-4">Assigned Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30 font-sans">
              {currentMonthDeals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No active or funded deals recorded in {monthName}.
                  </td>
                </tr>
              ) : (
                currentMonthDeals.map((deal) => (
                  <tr key={deal.id} className="hover:bg-blue-950/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      #{deal.id.slice(-6)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-100">
                      <div
                        onClick={() => deal.clientId && onSelectClient && onSelectClient(deal.clientId)}
                        className="hover:text-amber-400 cursor-pointer flex items-center gap-1"
                      >
                        <span>{deal.clientName || 'Client'}</span>
                        <ExternalLink className="w-3 h-3 text-slate-500" />
                      </div>
                      <div className="text-[11px] text-slate-400 font-normal">{deal.businessName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <ProductBadge product={deal.product} />
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ${Number(deal.fundingAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-cyan-400 font-semibold">
                      {Number(deal.percentage || 0).toFixed(2)}%
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {deal.lenderName || 'Maple Direct Capital'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {deal.assignedStaff || 'Dana'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
