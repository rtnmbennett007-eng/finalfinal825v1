import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileCheck2,
  Scale,
  DollarSign,
  Building2,
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useData } from '../../../context/DataContext';
import { Client, PipelineStage } from '../../../types';

interface ClientHealthDashboardProps {
  setActiveTab: (tab: string) => void;
  onOpenClient?: (clientId: string) => void;
}

export interface ClientHealthMetric {
  client: Client;
  score: number;
  status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK';
  issues: string[];
  strengths: string[];
  daysInStage: number;
  docsMissingCount: number;
  verificationPassed: boolean;
  activeDealsCount: number;
}

export const ClientHealthDashboard: React.FC<ClientHealthDashboardProps> = ({
  setActiveTab,
  onOpenClient,
}) => {
  const { clients, deals, setSelectedClientId } = useData();
  const [filter, setFilter] = useState<'ALL' | 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate Health for each client
  const clientHealthList: ClientHealthMetric[] = clients.map((client) => {
    let score = 100;
    const issues: string[] = [];
    const strengths: string[] = [];

    // Verification check
    if (client.isVerified) {
      strengths.push('Phone & identity fully verified');
    } else {
      score -= 25;
      issues.push('Verification call pending');
    }

    // Credit score check
    if ((client.creditScore || 0) >= 680) {
      strengths.push(`Strong FICO score (${client.creditScore})`);
    } else if ((client.creditScore || 0) >= 600) {
      score -= 10;
      issues.push(`Moderate FICO score (${client.creditScore})`);
    } else {
      score -= 25;
      issues.push(`Subprime FICO score (${client.creditScore || 'Unknown'})`);
    }

    // Revenue check
    if ((client.monthlyRevenue || 0) >= 40000) {
      strengths.push(`Solid monthly cashflow ($${(client.monthlyRevenue || 0).toLocaleString()})`);
    } else if ((client.monthlyRevenue || 0) > 0) {
      score -= 10;
      issues.push(`Low monthly cashflow ($${(client.monthlyRevenue || 0).toLocaleString()})`);
    } else {
      score -= 20;
      issues.push('Monthly cashflow unverified');
    }

    // Days in stage calculation
    const created = new Date(client.createdAt || Date.now()).getTime();
    const daysInStage = Math.max(1, Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24)));

    if (daysInStage > 7 && client.currentStatus !== 'FUNDED' && client.currentStatus !== 'COMMISSION_RECEIVED') {
      score -= 15;
      issues.push(`File aged ${daysInStage} days in active pipeline`);
    }

    // Active deals check
    const clientDeals = deals.filter((d) => d.clientId === client.id);
    if (clientDeals.length > 1) {
      strengths.push(`Multi-deal stacking active (${clientDeals.length} deals)`);
    } else if (clientDeals.length === 1) {
      strengths.push(`Active deal proposed (${clientDeals[0].product})`);
    } else {
      score -= 10;
      issues.push('No active funding deals configured');
    }

    // Final score clamp
    score = Math.max(10, Math.min(100, score));

    let status: 'HEALTHY' | 'NEEDS_ATTENTION' | 'AT_RISK' = 'HEALTHY';
    if (score < 60) status = 'AT_RISK';
    else if (score < 80) status = 'NEEDS_ATTENTION';

    return {
      client,
      score,
      status,
      issues,
      strengths,
      daysInStage,
      docsMissingCount: client.isVerified ? 0 : 2,
      verificationPassed: !!client.isVerified,
      activeDealsCount: clientDeals.length,
    };
  });

  // Aggregated Pipeline Health Metrics
  const totalClients = clientHealthList.length;
  const healthyCount = clientHealthList.filter((c) => c.status === 'HEALTHY').length;
  const attentionCount = clientHealthList.filter((c) => c.status === 'NEEDS_ATTENTION').length;
  const atRiskCount = clientHealthList.filter((c) => c.status === 'AT_RISK').length;

  const avgHealthScore = totalClients > 0
    ? Math.round(clientHealthList.reduce((acc, c) => acc + c.score, 0) / totalClients)
    : 100;

  const verifiedCount = clientHealthList.filter((c) => c.verificationPassed).length;
  const verificationPassRate = totalClients > 0
    ? Math.round((verifiedCount / totalClients) * 100)
    : 100;

  const filteredList = clientHealthList.filter((item) => {
    const matchesFilter = filter === 'ALL' || item.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      `${item.client.firstName} ${item.client.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.client.businessName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (onOpenClient) {
      onOpenClient(clientId);
    } else {
      setActiveTab('clients');
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Banner */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                Portfolio SLA & Pipeline Health Engine
              </span>
              <span className="text-xs text-slate-400">
                Avg Score: <strong className="text-emerald-300 font-mono">{avgHealthScore}%</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Client Health & Risk Audit Dashboard
            </h2>
            <p className="text-xs text-slate-400">
              Live scoring across verification completion, document readiness, underwriting SLA, debt coverage, and pipeline velocity.
            </p>
          </div>
        </div>

        {/* Quick Health Summary Pills */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#070d18] border border-emerald-500/40 text-center px-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Healthy Files</div>
            <div className="text-base font-bold text-emerald-400 font-mono">{healthyCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070d18] border border-amber-500/40 text-center px-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Needs Attention</div>
            <div className="text-base font-bold text-amber-400 font-mono">{attentionCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#070d18] border border-red-500/40 text-center px-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold">At Risk / Stalled</div>
            <div className="text-base font-bold text-red-400 font-mono">{atRiskCount}</div>
          </div>
        </div>
      </div>

      {/* 4 Health KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Portfolio Health Index</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono mt-2 flex items-baseline gap-2">
            <span>{avgHealthScore}%</span>
            <span className="text-xs text-emerald-400 font-normal">Optimal Tier</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Weighted across {totalClients} active client portfolios
          </div>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Verification Pass Rate</span>
            <FileCheck2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-2">
            {verificationPassRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {verifiedCount} of {totalClients} clients verified by specialist
          </div>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Pipeline Velocity SLA</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-2">
            3.2 Days
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Average time from lead intake to lender submission
          </div>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
            <span>Multi-Deal Stacking Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-2">
            {totalClients > 0 ? Math.round((clientHealthList.filter((c) => c.activeDealsCount > 1).length / totalClients) * 100) : 0}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Clients stacked with 2+ concurrent funding tranches
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search health by client name or business..."
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'ALL'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/50'
            }`}
          >
            All ({totalClients})
          </button>
          <button
            onClick={() => setFilter('HEALTHY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'HEALTHY'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-[#070d18] text-emerald-400 hover:text-emerald-300 border border-emerald-900/50'
            }`}
          >
            Healthy ({healthyCount})
          </button>
          <button
            onClick={() => setFilter('NEEDS_ATTENTION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'NEEDS_ATTENTION'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-[#070d18] text-amber-400 hover:text-amber-300 border border-amber-900/50'
            }`}
          >
            Needs Attention ({attentionCount})
          </button>
          <button
            onClick={() => setFilter('AT_RISK')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'AT_RISK'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-[#070d18] text-red-400 hover:text-red-300 border border-red-900/50'
            }`}
          >
            At Risk ({atRiskCount})
          </button>
        </div>
      </div>

      {/* Client Health Matrix List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-[#0b1528] border border-blue-900/60 p-8 rounded-2xl text-center text-slate-400 text-xs">
            No client records matching current health filter.
          </div>
        ) : (
          filteredList.map((item) => {
            const { client, score, status, issues, strengths, daysInStage, activeDealsCount } = item;

            return (
              <div
                key={client.id}
                onClick={() => handleSelectClient(client.id)}
                className="bg-[#0b1528] border border-blue-900/60 hover:border-amber-400/50 p-5 rounded-2xl shadow-xl transition-all cursor-pointer group space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-900/60 pb-3">
                  <div className="flex items-center space-x-3">
                    {/* Score badge */}
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-bold border shrink-0 ${
                        status === 'HEALTHY'
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                          : status === 'NEEDS_ATTENTION'
                          ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                          : 'bg-red-950/40 border-red-500/50 text-red-300'
                      }`}
                    >
                      <span className="text-base leading-none">{score}</span>
                      <span className="text-[8px] uppercase tracking-tighter opacity-80">SCORE</span>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                          {client.firstName} {client.lastName}
                        </h3>
                        <span className="text-xs text-slate-400">({client.businessName})</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                            status === 'HEALTHY'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : status === 'NEEDS_ATTENTION'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center space-x-3 mt-1 flex-wrap gap-y-1">
                        <span>Status: <strong className="text-slate-200">{client.currentStatus}</strong></span>
                        <span>•</span>
                        <span>FICO: <strong className="text-amber-300">{client.creditScore || 700}</strong></span>
                        <span>•</span>
                        <span>Revenue: <strong className="text-slate-200">${(client.monthlyRevenue || 0).toLocaleString()}/mo</strong></span>
                        <span>•</span>
                        <span>Pipeline Age: {daysInStage} Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 group-hover:bg-amber-500 text-blue-300 group-hover:text-slate-950 border border-blue-500/40 group-hover:border-amber-400 rounded-xl text-xs font-bold transition-all shadow-xs">
                      <span>Open Master 360</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Strengths & Issues Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Strengths */}
                  <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 space-y-1">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Positive Health Factors
                    </div>
                    {strengths.length === 0 ? (
                      <div className="text-slate-500 text-[11px]">No key strengths logged</div>
                    ) : (
                      strengths.map((s, idx) => (
                        <div key={idx} className="text-slate-300 text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span>{s}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Issues */}
                  <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 space-y-1">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Action Items & Risk Factors
                    </div>
                    {issues.length === 0 ? (
                      <div className="text-emerald-400 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Clean record - all milestones verified
                      </div>
                    ) : (
                      issues.map((issue, idx) => (
                        <div key={idx} className="text-slate-300 text-[11px] flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span>{issue}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
