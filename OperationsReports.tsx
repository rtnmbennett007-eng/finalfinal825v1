import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Calendar,
  Layers,
  FileSpreadsheet,
  Printer,
  Filter,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Building,
  Users,
  Search,
  ShieldCheck,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { calculateDashboardMetrics } from '../../utils/dashboardMetrics';
import { Client, CommissionParticipant, FundingDeal, Lead, PipelineStage } from '../../types';

// Tab Subcomponents
import { PipelineReportTab } from './tabs/PipelineReportTab';
import { FundingPerformanceTab } from './tabs/FundingPerformanceTab';
import { CommissionStackingTab } from './tabs/CommissionStackingTab';
import { MonthlyPerformanceTab } from './tabs/MonthlyPerformanceTab';
import { ExportPrintTab } from './tabs/ExportPrintTab';

export type ReportTab = 'overview' | 'funding' | 'commission' | 'monthly' | 'export';

interface OperationsReportsProps {
  initialFilters?: {
    view?: ReportTab;
    stage?: string;
    commissionStatus?: string;
    quickPreset?: string;
  } | null;
  onSelectClient?: (clientId: string) => void;
}

export const OperationsReports: React.FC<OperationsReportsProps> = ({
  initialFilters,
  onSelectClient,
}) => {
  const {
    deals,
    clients,
    leads,
    commissions,
    updateCommissionParticipant,
    markDealCommissionReceived,
  } = useData();
  const { currentUser } = useAuth();

  // Active Tab State
  const [activeTab, setActiveTab] = useState<ReportTab>(initialFilters?.view || 'overview');

  // Filter States
  const [datePreset, setDatePreset] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedRep, setSelectedRep] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedLender, setSelectedLender] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>(initialFilters?.stage || 'all');
  const [quickPreset, setQuickPreset] = useState<string>(initialFilters?.quickPreset || 'ALL');

  // Sync initialFilters if they change
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.view) setActiveTab(initialFilters.view);
      if (initialFilters.stage) setSelectedStage(initialFilters.stage);
      if (initialFilters.quickPreset) setQuickPreset(initialFilters.quickPreset);
    }
  }, [initialFilters]);

  // Handle Quick Presets
  const applyQuickPreset = (preset: string) => {
    setQuickPreset(preset);
    if (preset === 'ALL') {
      setSelectedStage('all');
      setSelectedClient('all');
      setSelectedRep('all');
      setSelectedProduct('all');
      setSelectedLender('all');
    } else if (preset === 'ACTIVE_PIPELINE') {
      setSelectedStage('ACTIVE_PIPELINE');
    } else if (preset === 'FUNDED') {
      setSelectedStage('FUNDED');
    } else if (preset === 'UNCOLLECTED_COMMISSION') {
      setSelectedStage('FUNDED');
      setActiveTab('commission');
    } else if (preset === 'COLLECTED_COMMISSION') {
      setSelectedStage('FUNDED');
      setActiveTab('commission');
    } else if (preset === 'STACKED_ONLY') {
      setSelectedStage('all');
      setActiveTab('commission');
    }
  };

  const handleResetFilters = () => {
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedClient('all');
    setSelectedRep('all');
    setSelectedProduct('all');
    setSelectedLender('all');
    setSelectedStage('all');
    setQuickPreset('ALL');
  };

  // Distinct Filter Option Lists
  const distinctReps = useMemo(() => {
    const set = new Set<string>(['Dana', 'Steve', 'Luke', 'Robert']);
    deals.forEach((d) => d.assignedStaff && set.add(d.assignedStaff));
    clients.forEach((c) => c.assignedStaff && set.add(c.assignedStaff));
    return Array.from(set).sort();
  }, [deals, clients]);

  const distinctLenders = useMemo(() => {
    const set = new Set<string>(['Maple Direct Capital', 'Apex Commercial Funding', 'BlueVine', 'OnDeck']);
    deals.forEach((d) => d.lenderName && set.add(d.lenderName));
    return Array.from(set).sort();
  }, [deals]);

  const distinctProducts = useMemo(() => {
    const set = new Set<string>([
      'Revenue Funding',
      'Personal Term Loan',
      'Business Line of Credit',
      'HELOC',
      'Equipment Financing',
      'SBA 7(a) Loan',
    ]);
    deals.forEach((d) => d.product && set.add(d.product));
    return Array.from(set).sort();
  }, [deals]);

  // Date Filtering Helper
  const isWithinDateRange = (dateStr?: string) => {
    if (!dateStr) return true;
    if (datePreset === 'all') return true;

    const itemDate = new Date(dateStr);
    const now = new Date();

    if (datePreset === 'today') {
      return itemDate.toDateString() === now.toDateString();
    }
    if (datePreset === 'this_week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= oneWeekAgo && itemDate <= now;
    }
    if (datePreset === 'this_month') {
      return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
    }
    if (datePreset === 'last_month') {
      const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
      const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      return itemDate.getFullYear() === year && itemDate.getMonth() === lastMonth;
    }
    if (datePreset === 'this_year') {
      return itemDate.getFullYear() === now.getFullYear();
    }
    if (datePreset === 'custom') {
      if (customStartDate && itemDate < new Date(customStartDate)) return false;
      if (customEndDate && itemDate > new Date(customEndDate + 'T23:59:59')) return false;
      return true;
    }
    return true;
  };

  // Primary Filtered Deals Engine
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      // 1. Date Filter
      const dealDate = deal.fundingDate || deal.createdAt;
      if (!isWithinDateRange(dealDate)) return false;

      // 2. Client Filter
      if (selectedClient !== 'all' && deal.clientId !== selectedClient) {
        return false;
      }

      // 3. Rep Filter
      if (selectedRep !== 'all' && deal.assignedStaff !== selectedRep) {
        return false;
      }

      // 4. Product Filter
      if (selectedProduct !== 'all' && deal.product !== selectedProduct) {
        return false;
      }

      // 5. Lender Filter
      if (selectedLender !== 'all' && deal.lenderName !== selectedLender) {
        return false;
      }

      // 6. Quick Presets
      if (quickPreset === 'STACKED_ONLY' && !deal.isStacked) {
        return false;
      }
      if (quickPreset === 'UNCOLLECTED_COMMISSION') {
        if (deal.status !== 'FUNDED' || deal.commissionStatus === 'COLLECTED') return false;
      }
      if (quickPreset === 'COLLECTED_COMMISSION') {
        if (deal.status !== 'FUNDED' || deal.commissionStatus !== 'COLLECTED') return false;
      }

      // 7. Stage Filter
      if (selectedStage === 'ACTIVE_PIPELINE') {
        if (
          deal.status === 'FUNDED' ||
          deal.status === 'DECLINED' ||
          deal.status === 'WITHDRAWN'
        ) {
          return false;
        }
      } else if (selectedStage !== 'all' && deal.status !== selectedStage) {
        return false;
      }

      return true;
    });
  }, [
    deals,
    datePreset,
    customStartDate,
    customEndDate,
    selectedClient,
    selectedRep,
    selectedProduct,
    selectedLender,
    selectedStage,
    quickPreset,
  ]);

  // Overall Global System Metrics (Single Source of Truth)
  const systemMetrics = useMemo(() => {
    return calculateDashboardMetrics(deals, commissions);
  }, [deals, commissions]);

  // Metrics calculated for the currently active filtered set
  const filteredMetrics = useMemo(() => {
    let activePipeline = 0;
    let totalFunded = 0;
    let expectedCommission = 0;
    let uncollectedCommission = 0;
    let collectedCommission = 0;

    for (const d of filteredDeals) {
      const amt = Number(d.fundingAmount) || 0;
      const pct = Number(d.percentage) || 0;
      const comm = (amt * pct) / 100;

      expectedCommission += comm;

      if (d.status === 'FUNDED') {
        totalFunded += amt;
        if (d.commissionStatus === 'COLLECTED') {
          collectedCommission += comm;
        } else {
          uncollectedCommission += comm;
        }
      } else if (
        d.status !== 'DECLINED' &&
        d.status !== 'WITHDRAWN'
      ) {
        activePipeline += amt;
      }
    }

    return {
      activePipeline,
      totalFunded,
      expectedCommission,
      uncollectedCommission,
      collectedCommission,
    };
  }, [filteredDeals]);

  // Summary String for Active Filters
  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (datePreset !== 'all') parts.push(`Date: ${datePreset.replace('_', ' ')}`);
    if (selectedClient !== 'all') {
      const c = clients.find((item) => item.id === selectedClient);
      parts.push(`Client: ${c ? `${c.firstName} ${c.lastName}` : selectedClient}`);
    }
    if (selectedRep !== 'all') parts.push(`Rep: ${selectedRep}`);
    if (selectedProduct !== 'all') parts.push(`Product: ${selectedProduct}`);
    if (selectedLender !== 'all') parts.push(`Lender: ${selectedLender}`);
    if (selectedStage !== 'all') parts.push(`Stage: ${selectedStage}`);
    if (quickPreset !== 'ALL') parts.push(`Preset: ${quickPreset}`);
    return parts.length > 0 ? parts.join(' • ') : 'All Real Data (No Filters)';
  }, [datePreset, selectedClient, selectedRep, selectedProduct, selectedLender, selectedStage, quickPreset, clients]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1c38] border border-blue-900/60 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-tight">
                Operations Reports & Revenue Analytics
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                100% SYNCHRONIZED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              One Single Source of Truth • Real-time pipeline, multi-product stacking, funding performance & commissions.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveTab('export')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-900/50 hover:bg-blue-800/70 text-cyan-300 border border-blue-800 text-xs font-bold transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Center</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('export');
              setTimeout(() => window.print(), 200);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Exact Match with Dashboard Overview for Consistency) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Active Pipeline */}
        <div
          onClick={() => {
            applyQuickPreset('ACTIVE_PIPELINE');
            setActiveTab('overview');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickPreset === 'ACTIVE_PIPELINE'
              ? 'bg-[#13264c] border-cyan-400 shadow-lg shadow-cyan-950/40'
              : 'bg-[#0e1c38] border-blue-900/60 hover:border-cyan-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-blue-300/80 font-bold uppercase tracking-wider">
            <span>ACTIVE PIPELINE</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300 mt-2">
            ${filteredMetrics.activePipeline.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>Filter Active Deals</span>
            <ChevronRight className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* 2. Total Funded */}
        <div
          onClick={() => {
            applyQuickPreset('FUNDED');
            setActiveTab('funding');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickPreset === 'FUNDED'
              ? 'bg-[#13264c] border-emerald-400 shadow-lg shadow-emerald-950/40'
              : 'bg-[#0e1c38] border-blue-900/60 hover:border-emerald-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-blue-300/80 font-bold uppercase tracking-wider">
            <span>TOTAL FUNDED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-2">
            ${filteredMetrics.totalFunded.toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>View Funded</span>
            <ChevronRight className="w-3 h-3 text-emerald-400" />
          </div>
        </div>

        {/* 3. Commission Prediction */}
        <div
          onClick={() => {
            setActiveTab('commission');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'commission'
              ? 'bg-[#13264c] border-purple-400 shadow-lg shadow-purple-950/40'
              : 'bg-[#0e1c38] border-blue-900/60 hover:border-purple-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-blue-300/80 font-bold uppercase tracking-wider">
            <span>COMMISSION PREDICTION</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300 mt-2">
            ${Math.round(filteredMetrics.expectedCommission).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>Predicted Gross</span>
            <ChevronRight className="w-3 h-3 text-purple-400" />
          </div>
        </div>

        {/* 4. Commission to be Collected */}
        <div
          onClick={() => {
            applyQuickPreset('UNCOLLECTED_COMMISSION');
            setActiveTab('commission');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickPreset === 'UNCOLLECTED_COMMISSION'
              ? 'bg-[#13264c] border-amber-400 shadow-lg shadow-amber-950/40'
              : 'bg-[#0e1c38] border-blue-900/60 hover:border-amber-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-blue-300/80 font-bold uppercase tracking-wider">
            <span>TO BE COLLECTED</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-2">
            ${Math.round(filteredMetrics.uncollectedCommission).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>Awaiting Payout</span>
            <ChevronRight className="w-3 h-3 text-amber-400" />
          </div>
        </div>

        {/* 5. Commission Collected */}
        <div
          onClick={() => {
            applyQuickPreset('COLLECTED_COMMISSION');
            setActiveTab('commission');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            quickPreset === 'COLLECTED_COMMISSION'
              ? 'bg-[#13264c] border-teal-400 shadow-lg shadow-teal-950/40'
              : 'bg-[#0e1c38] border-blue-900/60 hover:border-teal-500/50'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] text-blue-300/80 font-bold uppercase tracking-wider">
            <span>COMMISSION COLLECTED</span>
            <DollarSign className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-300 mt-2">
            ${Math.round(filteredMetrics.collectedCommission).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
            <span>Settled to Treasury</span>
            <ChevronRight className="w-3 h-3 text-teal-400" />
          </div>
        </div>
      </div>

      {/* Global Filter & Preset Controls Bar */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        {/* Quick Filter Preset Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-blue-900/40">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-cyan-400" /> Quick Presets:
            </span>
            {[
              { id: 'ALL', label: 'All Deals' },
              { id: 'ACTIVE_PIPELINE', label: 'Active Pipeline' },
              { id: 'FUNDED', label: 'Funded Only' },
              { id: 'UNCOLLECTED_COMMISSION', label: 'Uncollected Commission' },
              { id: 'COLLECTED_COMMISSION', label: 'Collected Commission' },
              { id: 'STACKED_ONLY', label: 'Stacked Deals Only' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyQuickPreset(p.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  quickPreset === p.id
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950 border border-blue-400'
                    : 'bg-[#070e20] text-slate-300 hover:text-white border border-blue-900/60 hover:bg-blue-900/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 border border-transparent hover:border-amber-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        </div>

        {/* Detailed Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Date Range */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Date Range
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#070e20] border border-blue-900/70 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="last_month">Last Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Date Range...</option>
            </select>
          </div>

          {/* 2. Client Select */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Client File
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#070e20] border border-blue-900/70 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 truncate"
            >
              <option value="all">All Clients ({clients.length})</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.businessName})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Salesperson / Rep */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Sales Rep / Staff
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#070e20] border border-blue-900/70 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Staff ({distinctReps.length})</option>
              {distinctReps.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Funding Product */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Funding Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#070e20] border border-blue-900/70 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 truncate"
            >
              <option value="all">All Products</option>
              {distinctProducts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Lender Source */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Lender Partner
            </label>
            <select
              value={selectedLender}
              onChange={(e) => setSelectedLender(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#070e20] border border-blue-900/70 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 truncate"
            >
              <option value="all">All Lenders</option>
              {distinctLenders.map((len) => (
                <option key={len} value={len}>
                  {len}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Deal Stage / Status */}
          <div>
            <label className="block text-[10px] uppercase font-mono text-slate-400 mb-1">
              Deal Stage / Status
            </label>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#070e20] border border-blue-900/70 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
            >
              <option value="all">All Stages</option>
              <option value="ACTIVE_PIPELINE">Active Pipeline (In-Flight)</option>
              <option value="PROPOSED">Proposed</option>
              <option value="SUBMITTED">Submitted to Lender</option>
              <option value="PRE_APPROVED">Pre-Approved</option>
              <option value="APPROVED">Approved</option>
              <option value="FUNDED">Funded & Settled</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (if datePreset === 'custom') */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-blue-900/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Start Date:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1 bg-[#070e20] border border-blue-900/70 rounded-lg text-xs text-slate-200 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">End Date:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1 bg-[#070e20] border border-blue-900/70 rounded-lg text-xs text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Report View Tabs */}
      <div className="flex border-b border-blue-900/60 space-x-2 overflow-x-auto">
        {[
          { id: 'overview' as ReportTab, label: 'Executive Overview & Pipeline', icon: Layers },
          { id: 'funding' as ReportTab, label: 'Funding Performance', icon: TrendingUp },
          { id: 'commission' as ReportTab, label: 'Commission & Stacking', icon: DollarSign },
          { id: 'monthly' as ReportTab, label: 'Monthly Performance (MoM)', icon: Calendar },
          { id: 'export' as ReportTab, label: 'Export & Print Center', icon: Printer },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-amber-400 text-amber-400 bg-blue-950/40 rounded-t-xl'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-blue-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active Tab Content */}
      <div className="mt-4">
        {activeTab === 'overview' && (
          <PipelineReportTab
            filteredDeals={filteredDeals}
            clients={clients}
            onSelectClient={onSelectClient}
            activePipelineValue={filteredMetrics.activePipeline}
            totalFundedValue={filteredMetrics.totalFunded}
            expectedCommissionTotal={filteredMetrics.expectedCommission}
          />
        )}

        {activeTab === 'funding' && (
          <FundingPerformanceTab
            filteredDeals={filteredDeals}
            allDeals={deals}
            clients={clients}
            leads={leads}
          />
        )}

        {activeTab === 'commission' && (
          <CommissionStackingTab
            filteredDeals={filteredDeals}
            allDeals={deals}
            commissions={commissions}
            clients={clients}
            onSelectClient={onSelectClient}
            onUpdateCommissionParticipant={updateCommissionParticipant}
            onMarkDealCommissionReceived={markDealCommissionReceived}
          />
        )}

        {activeTab === 'monthly' && (
          <MonthlyPerformanceTab
            deals={deals}
            clients={clients}
            leads={leads}
            onSelectClient={onSelectClient}
          />
        )}

        {activeTab === 'export' && (
          <ExportPrintTab
            filteredDeals={filteredDeals}
            allDeals={deals}
            clients={clients}
            leads={leads}
            commissions={commissions}
            activeFiltersSummary={activeFiltersSummary}
            activePipelineValue={filteredMetrics.activePipeline}
            totalFundedValue={filteredMetrics.totalFunded}
            expectedCommissionTotal={filteredMetrics.expectedCommission}
            currentUser={currentUser}
          />
        )}
      </div>
    </div>
  );
};
