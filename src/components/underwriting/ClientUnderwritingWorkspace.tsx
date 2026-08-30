import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  User,
  DollarSign,
  Layers,
  Scale,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  Plus,
  TrendingUp,
  FolderLock,
  PhoneCall,
  Clock,
  Sparkles,
  Edit2,
  Save,
  FileText,
  Briefcase,
  CreditCard,
  Banknote,
  PieChart,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Client, FundingDeal, DocumentItem, ConflictItem, FundingStrategyRecord, formatFundingRange } from '../../types';
import { ClientUnderwritingSummary, DealUnderwritingAnalysis } from '../../utils/underwritingPriorityEngine';
import { formatDate } from '../../utils/dateUtils';
import { useData } from '../../context/DataContext';

interface ClientUnderwritingWorkspaceProps {
  summary: ClientUnderwritingSummary;
  onSelectDeal: (deal: FundingDeal) => void;
  onBackToHub: () => void;
  setActiveTab: (tab: string) => void;
}

export const ClientUnderwritingWorkspace: React.FC<ClientUnderwritingWorkspaceProps> = ({
  summary,
  onSelectDeal,
  onBackToHub,
  setActiveTab,
}) => {
  const { setSelectedClientId, createDeal, saveFundingStrategy, addToast } = useData();
  const { client, deals, rawDeals, strategySummary } = summary;

  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'DEAL_SELECTOR' | 'STRATEGY' | 'CLIENT_PROFILE'>(
    'DEAL_SELECTOR'
  );

  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newDealProduct, setNewDealProduct] = useState('Revenue Funding');
  const [newDealAmount, setNewDealAmount] = useState(25000);
  const [newDealFunder, setNewDealFunder] = useState('Maple Direct Capital');
  const [newDealPosition, setNewDealPosition] = useState(`${rawDeals.length + 1}${rawDeals.length === 0 ? 'st' : rawDeals.length === 1 ? 'nd' : rawDeals.length === 2 ? 'rd' : 'th'} Position`);
  const [isCreatingDeal, setIsCreatingDeal] = useState(false);

  // Quick navigation handlers
  const handleOpenClientMaster = () => {
    setSelectedClientId(client.id);
    setActiveTab('clients');
  };

  const handleOpenVerification = () => {
    setSelectedClientId(client.id);
    setActiveTab('verification');
  };

  const handleOpenDocuments = () => {
    setSelectedClientId(client.id);
    setActiveTab('documents');
  };

  const handleOpenFundingWorkspace = () => {
    setSelectedClientId(client.id);
    setActiveTab('funding');
  };

  const handleOpenReports = () => {
    setSelectedClientId(client.id);
    setActiveTab('reports');
  };

  // Create new stacked deal
  const handleCreateStackedDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingDeal(true);
    try {
      await createDeal({
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        businessName: client.businessName || 'Business Entity',
        product: newDealProduct,
        requestedAmount: Number(newDealAmount),
        fundingAmount: Number(newDealAmount),
        lenderName: newDealFunder,
        position: newDealPosition,
        status: 'Underwriting',
        assignedStaff: client.assignedStaff || 'Dana',
        percentage: 10,
        fee: 0,
        termLength: '12 Months',
        commissionStatus: 'PENDING',
      });
      addToast('success', 'Stacked Deal Added', `New ${newDealPosition} (${newDealProduct}) added to client stack.`);
      setShowAddDealModal(false);
    } catch (err: any) {
      addToast('error', 'Failed to Add Deal', err.message);
    } finally {
      setIsCreatingDeal(false);
    }
  };

  return (
    <div className="space-y-6 pb-16" id="client-underwriting-workspace">
      {/* 1. Top Client Header & Navigation */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <button
              onClick={onBackToHub}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors shrink-0 mt-0.5"
              title="Back to Underwriting Hub Client List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded font-mono shadow-sm">
                  Client Underwriting Workspace
                </span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    summary.overallPriority === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : summary.overallPriority === 'HIGH'
                      ? 'bg-amber-950 text-amber-300 border-amber-700'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  }`}
                >
                  PRIORITY: {summary.overallPriority}
                </span>
                {summary.isStale && (
                  <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded uppercase font-mono">
                    STALE ({summary.daysInactive} days inactive)
                  </span>
                )}
              </div>

              <h1 className="text-2xl font-black text-white mt-1.5 flex items-center gap-2.5">
                <User className="w-6 h-6 text-amber-400" />
                {client.firstName} {client.lastName}
                <span className="text-base font-semibold text-slate-400">({client.businessName})</span>
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                <span>Underwriter: <strong className="text-slate-200">{summary.assignedUnderwriter}</strong></span>
                <span>•</span>
                <span>Next Action: <strong className="text-amber-300">{summary.nextAction}</strong></span>
                <span>•</span>
                <span>Last Activity: <strong className="text-slate-200">{formatDate(summary.lastActivity, 'Recent')}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Cross-Module Navigation Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleOpenClientMaster}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Client Master 360 Record"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>Client Master 360</span>
            </button>

            <button
              onClick={handleOpenVerification}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Verification Hub for this borrower"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verification Hub</span>
            </button>

            <button
              onClick={handleOpenDocuments}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Document Vault"
            >
              <FolderLock className="w-3.5 h-3.5 text-amber-400" />
              <span>Document Vault</span>
            </button>

            <button
              onClick={handleOpenFundingWorkspace}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Funding & Stacking Deals"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Funding Deals</span>
            </button>

            <button
              onClick={handleOpenReports}
              className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Open Operations Reports"
            >
              <PieChart className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reports</span>
            </button>
          </div>
        </div>

        {/* Client-Level Stacking Metric KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Funding Positions
            </span>
            <div className="text-lg font-black text-amber-400 font-mono mt-1">
              {summary.totalDealsCount} Deal{summary.totalDealsCount === 1 ? '' : 's'}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">In current stack</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Requested Range
            </span>
            <div className="text-base font-black text-amber-300 font-mono mt-1 truncate" title={formatFundingRange(summary.requestedFundingMin ?? client.requestedAmountMin, summary.requestedFundingMax ?? client.requestedAmountMax, summary.requestedFundingRange ?? client.requestedAmount)}>
              {formatFundingRange(
                summary.requestedFundingMin ?? client.requestedAmountMin,
                summary.requestedFundingMax ?? client.requestedAmountMax,
                summary.requestedFundingRange ?? client.requestedAmount
              )}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Target range</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Total Approved
            </span>
            <div className="text-lg font-black text-cyan-400 font-mono mt-1">
              ${summary.totalApprovedAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Across all positions</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Total Funded
            </span>
            <div className="text-lg font-black text-emerald-400 font-mono mt-1">
              ${summary.totalFundedAmount.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Disbursed capital</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Monthly Debt Service
            </span>
            <div className="text-lg font-black text-slate-200 font-mono mt-1">
              ${summary.estimatedMonthlyDebtService.toLocaleString()}/mo
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">Total estimated</span>
          </div>

          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Stacking Risk
            </span>
            <span
              className={`text-xs font-black uppercase px-2 py-0.5 rounded border inline-block mt-1 ${
                summary.stackingRiskLevel === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                  : summary.stackingRiskLevel === 'ELEVATED'
                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              }`}
            >
              {summary.stackingRiskLevel} RISK
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Flow: ${Number(client.monthlyRevenue || 45000).toLocaleString()}/mo
            </span>
          </div>
        </div>
      </div>

      {/* 2. Workspace View Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveWorkspaceTab('DEAL_SELECTOR')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeWorkspaceTab === 'DEAL_SELECTOR'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Select Deal to Underwrite ({deals.length})</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('STRATEGY')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeWorkspaceTab === 'STRATEGY'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Funding Strategy & Stack Narrative</span>
          </button>

          <button
            onClick={() => setActiveWorkspaceTab('CLIENT_PROFILE')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeWorkspaceTab === 'CLIENT_PROFILE'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Client Overview & Stacking Risk</span>
          </button>
        </div>

        <button
          onClick={() => setShowAddDealModal(true)}
          className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Stacked Deal</span>
        </button>
      </div>

      {/* 3. TAB 1: STACKED DEAL SELECTOR */}
      {activeWorkspaceTab === 'DEAL_SELECTOR' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Select Stacked Deal to Underwrite
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose an individual funding position below to open the dedicated underwriting command workstation, bank cash flow analysis, and lender submission package.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {deals.length} Active Position{deals.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Deal Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map((d: DealUnderwritingAnalysis, idx: number) => {
              const isFunded = d.status === 'Funded' || d.fundedAmount > 0;
              const isReady = d.isReadyToFund;

              return (
                <div
                  key={d.deal.id}
                  className={`bg-slate-900/70 border rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all hover:border-amber-500/50 hover:bg-slate-900 group ${
                    isReady
                      ? 'border-emerald-500/40 shadow-emerald-500/5'
                      : d.priority === 'CRITICAL'
                      ? 'border-rose-500/40 shadow-rose-500/5'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    {/* Top Tag & Position */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                          {d.position || `Position #${idx + 1}`}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{d.deal.dealId || d.deal.id.slice(0, 8)}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                          d.priority === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-700'
                            : d.priority === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border-amber-700'
                            : 'bg-slate-950 text-slate-300 border-slate-800'
                        }`}
                      >
                        {d.priority}
                      </span>
                    </div>

                    {/* Product & Amount */}
                    <div>
                      <span className="text-xs font-bold text-amber-400 block uppercase tracking-wider">
                        {d.product}
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-2xl font-black text-white font-mono">
                          ${(d.approvedAmount || d.requestedAmount).toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-400">
                          {isFunded ? '(Funded)' : d.status === 'Approved' ? '(Approved)' : '(Requested)'}
                        </span>
                      </div>
                    </div>

                    {/* Deal Metadata Details */}
                    <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 space-y-2 text-xs divide-y divide-slate-800/50">
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Funder / Lender:</span>
                        <span className="font-semibold text-slate-200">{d.funder}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Terms & Payment:</span>
                        <span className="font-mono text-slate-200">
                          {d.termLength} • ${Number(d.payment).toLocaleString()}/mo
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Deal Stage:</span>
                        <span
                          className={`font-semibold text-[11px] px-2 py-0.5 rounded ${
                            d.status === 'Ready to Fund'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : d.status === 'Funded'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Readiness Score:</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold ${
                              d.isReadyToFund ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {d.readinessScore}/100
                          </span>
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                              d.isReadyToFund
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-amber-950 text-amber-300'
                            }`}
                          >
                            {d.isReadyToFund ? 'READY TO FUND' : 'CONDITIONS'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400">Commission:</span>
                        <span
                          className={`font-semibold text-[11px] ${
                            d.commissionConfigured ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {d.commissionConfigured
                            ? `${d.deal.percentage}% Entered`
                            : 'Pending Entry'}
                        </span>
                      </div>
                    </div>

                    {/* Priority Reason / Next Action */}
                    <div className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">Next Action: {d.nextAction}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] truncate" title={d.priorityReason}>
                        Reason: {d.priorityReason}
                      </div>
                    </div>
                  </div>

                  {/* Open Deal Workstation Button */}
                  <div className="mt-5 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => onSelectDeal(d.deal)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                    >
                      <Scale className="w-4 h-4 text-slate-950" />
                      <span>OPEN DEAL UNDERWRITING</span>
                      <ChevronRight className="w-4 h-4 text-slate-950" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: FUNDING STRATEGY PER CLIENT */}
      {activeWorkspaceTab === 'STRATEGY' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Client Funding Strategy & Multi-Tranche Stacking
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete underwriting strategy roadmap, capital fulfillment milestones, and multi-position debt service safeguards.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedClientId(client.id);
                  setActiveTab('clients');
                }}
                className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Edit Full Strategy in Master File</span>
              </button>
            </div>

            {/* Strategy Capital Goal Progress Bar */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 uppercase font-bold tracking-wider">
                  Funding Goal Progress
                </span>
                <span className="font-mono font-bold text-white">
                  ${summary.totalFundedAmount.toLocaleString()} funded of ${(client.requestedAmount || summary.totalRequestedAmount).toLocaleString()} goal ({Math.round((summary.totalFundedAmount / Math.max(1, client.requestedAmount || summary.totalRequestedAmount)) * 100)}%)
                </span>
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((summary.totalFundedAmount / Math.max(1, client.requestedAmount || summary.totalRequestedAmount)) * 100))}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Goal</span>
                  <span className="font-mono font-bold text-white">${Number(client.requestedAmount || summary.totalRequestedAmount).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Approved Capital</span>
                  <span className="font-mono font-bold text-cyan-400">${summary.totalApprovedAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Disbursed Capital</span>
                  <span className="font-mono font-bold text-emerald-400">${summary.totalFundedAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Remaining Need</span>
                  <span className="font-mono font-bold text-amber-400">${summary.remainingCapitalNeed.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 8-Point Comprehensive Funding Strategy Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  1. Why This Deal Exists
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whyThisDealExists}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  2. What This Deal Is Supposed to Accomplish
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whatThisDealAccomplishes}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  3. What Has Already Been Funded
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whatHasAlreadyBeenFunded}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5" />
                  4. What Is Next
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whatIsNext}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  5. What Remains to Be Funded
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whatRemainsToBeFunded}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  6. What Risks the Stack Creates
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whatRisksTheStackCreates}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FolderLock className="w-3.5 h-3.5" />
                  7. What Documents Are Still Needed
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {strategySummary.whatDocumentsAreStillNeeded}
                </p>
              </div>

              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  8. What the Underwriter Needs to Do Next
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-semibold">
                  {strategySummary.whatTheUnderwriterNeedsToDoNext}
                </p>
              </div>
            </div>

            {/* Current Stack Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                Current Active Stack Positions
              </h3>

              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Position</th>
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">Funder / Lender</th>
                      <th className="py-2.5 px-3 font-mono">Amount</th>
                      <th className="py-2.5 px-3 font-mono">Est. Payment</th>
                      <th className="py-2.5 px-3">Stage / Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {deals.map((d: DealUnderwritingAnalysis) => (
                      <tr key={d.deal.id} className="hover:bg-slate-900/40">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">
                          {d.position}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">
                          {d.product}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {d.funder}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-white">
                          ${(d.approvedAmount || d.requestedAmount).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          ${Number(d.payment).toLocaleString()}/mo
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              d.status === 'Funded'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : d.status === 'Ready to Fund'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onSelectDeal(d.deal)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded text-[11px] transition-all cursor-pointer"
                          >
                            Open Deal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: CLIENT PROFILE & STACKING RISK */}
      {activeWorkspaceTab === 'CLIENT_PROFILE' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Borrower Profile Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Guarantor / Borrower Identity
              </h3>

              <div className="space-y-3 text-xs text-slate-200 divide-y divide-slate-800/60">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Borrower Full Name:</span>
                  <span className="font-semibold text-white">{client.firstName} {client.lastName}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Direct Phone:</span>
                  <span className="font-mono">{client.phone || 'Not Provided'}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Personal Email:</span>
                  <span>{client.email || 'Not Provided'}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">FICO Credit Score:</span>
                  <span className="font-mono font-bold text-amber-300">{client.creditScore || 700} FICO</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Verification Status:</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      client.isVerified
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {client.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Residential Address:</span>
                  <span>{client.address || 'N/A'}, {client.city || ''} {client.state || 'TX'} {client.zip || ''}</span>
                </div>
              </div>
            </div>

            {/* Commercial Entity Card */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Commercial Entity Profile
              </h3>

              <div className="space-y-3 text-xs text-slate-200 divide-y divide-slate-800/60">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Legal Business Name:</span>
                  <span className="font-semibold text-white">{client.businessName}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Industry / Sector:</span>
                  <span className="font-semibold">{client.industry || 'Commercial Enterprise'}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Monthly Business Revenue:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    ${Number(client.monthlyRevenue || 45000).toLocaleString()}/mo
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Annual Gross Flow:</span>
                  <span className="font-mono text-slate-300">
                    ${Number(client.annualRevenue || (client.monthlyRevenue ? client.monthlyRevenue * 12 : 540000)).toLocaleString()}/yr
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Ownership Stake:</span>
                  <span className="font-mono font-bold text-amber-300">{client.ownershipPercentage || 100}%</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Primary Bank:</span>
                  <span>{client.businessBank || 'Chase Commercial Bank'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stacking Risk Safeguards Card */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              Stacking Risk & Capacity Assessment
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Aggregate Positions</span>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {summary.totalDealsCount} Tranches
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Total Requested: ${summary.totalRequestedAmount.toLocaleString()}
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Monthly Debt Load</span>
                <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                  ${summary.estimatedMonthlyDebtService.toLocaleString()}/mo
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {((summary.estimatedMonthlyDebtService / Math.max(1, client.monthlyRevenue || 45000)) * 100).toFixed(1)}% of verified monthly flow
                </span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Stacking Risk Level</span>
                <div className="mt-1">
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded border inline-block ${
                      summary.stackingRiskLevel === 'HIGH'
                        ? 'bg-rose-950 text-rose-300 border-rose-700'
                        : summary.stackingRiskLevel === 'ELEVATED'
                        ? 'bg-amber-950 text-amber-300 border-amber-700'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-700'
                    }`}
                  >
                    {summary.stackingRiskLevel} RISK
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {summary.stackingRiskLevel === 'LOW'
                    ? 'Capacity permits additional tranches'
                    : 'Requires senior underwriter sign-off'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Stacked Funding Deal
            </h3>
            <p className="text-xs text-slate-400">
              Create a new stacked funding position for <strong>{client.firstName} {client.lastName}</strong>.
            </p>

            <form onSubmit={handleCreateStackedDeal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Funding Product</label>
                <select
                  value={newDealProduct}
                  onChange={(e) => setNewDealProduct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Revenue Funding">Revenue Funding</option>
                  <option value="Personal Term Loan">Personal Term Loan</option>
                  <option value="Business Line of Credit">Business Line of Credit</option>
                  <option value="SBA Loan">SBA Loan</option>
                  <option value="Equipment Financing">Equipment Financing</option>
                  <option value="Merchant Cash Advance (MCA)">Merchant Cash Advance (MCA)</option>
                  <option value="0% Business Credit Cards">0% Business Credit Cards</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Funding Amount ($)</label>
                <input
                  type="number"
                  value={newDealAmount}
                  onChange={(e) => setNewDealAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  min="1000"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Funder / Lender</label>
                <input
                  type="text"
                  value={newDealFunder}
                  onChange={(e) => setNewDealFunder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Stack Position</label>
                <input
                  type="text"
                  value={newDealPosition}
                  onChange={(e) => setNewDealPosition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingDeal}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {isCreatingDeal ? 'Adding...' : 'Create Stacked Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
