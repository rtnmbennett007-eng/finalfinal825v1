import React, { useState, useEffect, useMemo } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileCheck2,
  Building2,
  ShieldAlert,
  Package,
  Banknote,
  Send,
  UserCheck,
  Layers,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Filter,
  RefreshCw,
  FolderLock,
  PhoneCall,
  Sparkles,
  ExternalLink,
  Tag,
  AlertCircle,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { UnderwritingCommandCenter } from './UnderwritingCommandCenter';
import { ClientUnderwritingWorkspace } from './ClientUnderwritingWorkspace';
import { FundingDeal, Client, DocumentItem, ConflictItem } from '../../types';
import {
  analyzeClientUnderwriting,
  ClientUnderwritingSummary,
  DealUnderwritingAnalysis,
  PriorityLevel,
  UnderwritingQueueCategory,
} from '../../utils/underwritingPriorityEngine';
import { formatDate } from '../../utils/dateUtils';

interface UnderwritingHubProps {
  setActiveTab: (tab: string) => void;
}

export const UnderwritingHub: React.FC<UnderwritingHubProps> = ({ setActiveTab }) => {
  const {
    clients = [],
    deals = [],
    documents = [],
    selectedClientId,
    setSelectedClientId,
    updateDeal,
    updateClient,
    refreshAll,
    isLoading,
  } = useData();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQueue, setActiveQueue] = useState<UnderwritingQueueCategory>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | PriorityLevel>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [funderFilter, setFunderFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Expanded client row IDs in table view
  const [expandedClientIds, setExpandedClientIds] = useState<Set<string>>(new Set());

  // Active Client & Deal selection
  const [selectedClientSummary, setSelectedClientSummary] = useState<ClientUnderwritingSummary | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<FundingDeal | null>(null);

  // Analyze all clients and group all deals under their respective clients
  const clientSummaries: ClientUnderwritingSummary[] = useMemo(() => {
    if (!clients || clients.length === 0) return [];

    return clients.map((client) => {
      const clientDeals = deals.filter((d) => d.clientId === client.id);
      const clientDocs = documents.filter((d) => d.clientId === client.id);
      return analyzeClientUnderwriting(client, clientDeals, clientDocs, []);
    });
  }, [clients, deals, documents]);

  // Handle selectedClientId from DataContext if user navigated from Client Master 360 or other tabs
  useEffect(() => {
    if (selectedClientId && !selectedClientSummary && clientSummaries.length > 0) {
      const target = clientSummaries.find((s) => s.client.id === selectedClientId);
      if (target) {
        setSelectedClientSummary(target);
      }
    }
  }, [selectedClientId, clientSummaries]);

  // Dynamic filter options derived from real data
  const availableFunders = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (d.lenderName) set.add(d.lenderName);
    });
    return Array.from(set);
  }, [deals]);

  const availableProducts = useMemo(() => {
    const set = new Set<string>();
    deals.forEach((d) => {
      if (d.product) set.add(d.product);
    });
    return Array.from(set);
  }, [deals]);

  const availableStaff = useMemo(() => {
    const set = new Set<string>();
    clients.forEach((c) => {
      if (c.assignedStaff) set.add(c.assignedStaff);
    });
    deals.forEach((d) => {
      if (d.assignedStaff) set.add(d.assignedStaff);
    });
    return Array.from(set);
  }, [clients, deals]);

  // Toggle expand for a client in the table
  const toggleExpandClient = (clientId: string) => {
    setExpandedClientIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  // Filter client summaries according to queue, search, and dropdown filters
  const filteredSummaries = useMemo(() => {
    return clientSummaries.filter((summary) => {
      const { client, deals: clientDeals, overallPriority, overallUnderwritingStatus, assignedUnderwriter } = summary;

      // 1. Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const clientNameMatch = `${client.firstName} ${client.lastName}`.toLowerCase().includes(q);
        const businessMatch = (client.businessName || '').toLowerCase().includes(q);
        const emailMatch = (client.email || '').toLowerCase().includes(q);
        const dealMatch = clientDeals.some(
          (d) =>
            (d.deal.dealId || '').toLowerCase().includes(q) ||
            (d.product || '').toLowerCase().includes(q) ||
            (d.funder || '').toLowerCase().includes(q) ||
            (d.deal.assignedStaff || '').toLowerCase().includes(q)
        );
        const staffMatch = (assignedUnderwriter || '').toLowerCase().includes(q);

        if (!clientNameMatch && !businessMatch && !emailMatch && !dealMatch && !staffMatch) {
          return false;
        }
      }

      // 2. Queue filter
      if (activeQueue !== 'ALL') {
        if (activeQueue === 'NEEDS_ATTENTION' && overallPriority !== 'CRITICAL' && overallPriority !== 'HIGH') {
          return false;
        }
        if (activeQueue === 'UP_NEXT' && !summary.hasReadyForUnderwritingDeal && overallUnderwritingStatus !== 'IN_REVIEW') {
          return false;
        }
        if (activeQueue === 'IN_REVIEW' && overallUnderwritingStatus !== 'UNDERWRITING_IN_PROGRESS') {
          return false;
        }
        if (activeQueue === 'WAITING_CLIENT' && summary.waitingState !== 'WAITING_CLIENT') {
          return false;
        }
        if (activeQueue === 'WAITING_DOCS' && summary.waitingState !== 'WAITING_DOCS') {
          return false;
        }
        if (activeQueue === 'WAITING_FUNDER' && summary.waitingState !== 'WAITING_FUNDER') {
          return false;
        }
        if (activeQueue === 'WAITING_VERIFICATION' && summary.waitingState !== 'WAITING_VERIFICATION') {
          return false;
        }
        if (activeQueue === 'WAITING_CONDITIONS' && summary.waitingState !== 'WAITING_CONDITIONS') {
          return false;
        }
        if (activeQueue === 'READY_FOR_UNDERWRITING' && !summary.hasReadyForUnderwritingDeal) {
          return false;
        }
        if (activeQueue === 'APPROVED_NOT_FUNDED' && !summary.hasApprovedNotFundedDeal) {
          return false;
        }
        if (activeQueue === 'READY_TO_FUND' && !summary.hasReadyToFundDeal) {
          return false;
        }
        if (activeQueue === 'FUNDED' && !summary.hasFundedDeal) {
          return false;
        }
        if (activeQueue === 'COMPLETED' && !clientDeals.every((d) => d.status === 'Funded' || d.status === 'Closed')) {
          return false;
        }
      }

      // 3. Priority filter
      if (priorityFilter !== 'ALL' && overallPriority !== priorityFilter) {
        return false;
      }

      // 4. Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'READY_FOR_UNDERWRITING' && !summary.hasReadyForUnderwritingDeal) return false;
        if (statusFilter === 'APPROVED' && !summary.hasApprovedNotFundedDeal) return false;
        if (statusFilter === 'READY_TO_FUND' && !summary.hasReadyToFundDeal) return false;
        if (statusFilter === 'FUNDED' && !summary.hasFundedDeal) return false;
        if (statusFilter === 'IN_REVIEW' && overallUnderwritingStatus !== 'UNDERWRITING_IN_PROGRESS') return false;
      }

      // 5. Funder filter
      if (funderFilter !== 'ALL' && !clientDeals.some((d) => d.funder === funderFilter)) {
        return false;
      }

      // 6. Product filter
      if (productFilter !== 'ALL' && !clientDeals.some((d) => d.product === productFilter)) {
        return false;
      }

      // 7. Staff filter
      if (staffFilter !== 'ALL' && assignedUnderwriter !== staffFilter && !clientDeals.some((d) => d.deal.assignedStaff === staffFilter)) {
        return false;
      }

      return true;
    });
  }, [clientSummaries, searchQuery, activeQueue, priorityFilter, statusFilter, funderFilter, productFilter, staffFilter]);

  // Dashboard KPI Counters
  const dashboardCounters = useMemo(() => {
    const clientsNeedingAttention = clientSummaries.filter((s) => s.overallPriority === 'CRITICAL' || s.overallPriority === 'HIGH').length;
    const dealsNeedingAttention = clientSummaries.flatMap((s) => s.deals).filter((d) => d.priority === 'CRITICAL' || d.priority === 'HIGH').length;
    const underwritingInProgress = clientSummaries.filter((s) => s.overallUnderwritingStatus === 'UNDERWRITING_IN_PROGRESS').length;
    const readyForUnderwriting = clientSummaries.filter((s) => s.hasReadyForUnderwritingDeal).length;
    const approvedNotFunded = clientSummaries.filter((s) => s.hasApprovedNotFundedDeal).length;
    const readyToFund = clientSummaries.filter((s) => s.hasReadyToFundDeal).length;
    const funded = clientSummaries.filter((s) => s.hasFundedDeal).length;
    const waitingOnClient = clientSummaries.filter((s) => s.waitingState === 'WAITING_CLIENT').length;
    const waitingOnDocs = clientSummaries.filter((s) => s.waitingState === 'WAITING_DOCS').length;
    const criticalIssues = clientSummaries.filter((s) => s.overallPriority === 'CRITICAL').length;
    const totalPipelineRequested = clientSummaries.reduce((sum, s) => sum + s.totalRequestedAmount, 0);

    return {
      clientsNeedingAttention,
      dealsNeedingAttention,
      underwritingInProgress,
      readyForUnderwriting,
      approvedNotFunded,
      readyToFund,
      funded,
      waitingOnClient,
      waitingOnDocs,
      criticalIssues,
      totalPipelineRequested,
    };
  }, [clientSummaries]);

  // Open Client Workspace
  const handleOpenClientWorkspace = (summary: ClientUnderwritingSummary) => {
    setSelectedClientSummary(summary);
    setSelectedDeal(null);
    setSelectedClientId(summary.client.id);
  };

  // Open specific deal workstation
  const handleOpenDealWorkstation = (deal: FundingDeal, client: Client) => {
    const summary = clientSummaries.find((s) => s.client.id === client.id);
    if (summary) {
      setSelectedClientSummary(summary);
    }
    setSelectedDeal(deal);
    setSelectedClientId(client.id);
  };

  // Return to Client Underwriting Workspace from deal workstation
  const handleBackToClientWorkspace = () => {
    setSelectedDeal(null);
  };

  // Return to All Clients Hub
  const handleBackToAllClientsHub = () => {
    setSelectedDeal(null);
    setSelectedClientSummary(null);
    setSelectedClientId(null);
  };

  // ----------------------------------------------------
  // RENDER LEVEL 3: SELECTED DEAL UNDERWRITING WORKSTATION
  // ----------------------------------------------------
  if (selectedDeal && selectedClientSummary) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between text-xs bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={handleBackToAllClientsHub}
              className="hover:text-white font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Underwriting Hub
            </button>
            <span>/</span>
            <button
              onClick={handleBackToClientWorkspace}
              className="hover:text-white font-semibold text-amber-400 transition-colors cursor-pointer"
            >
              {selectedClientSummary.client.firstName} {selectedClientSummary.client.lastName} ({selectedClientSummary.client.businessName})
            </button>
            <span>/</span>
            <span className="text-slate-200 font-mono font-bold">
              Deal #{selectedDeal.dealId || selectedDeal.id.slice(0, 8)} ({selectedDeal.product})
            </span>
          </div>

          <button
            onClick={handleBackToClientWorkspace}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Client Workspace</span>
          </button>
        </div>

        <UnderwritingCommandCenter
          deal={selectedDeal}
          client={selectedClientSummary.client}
          allDealsForClient={selectedClientSummary.rawDeals}
          onSelectDeal={(d) => setSelectedDeal(d)}
          onBackToHub={handleBackToClientWorkspace}
          onDealUpdated={(d) => {
            setSelectedDeal(d);
            updateDeal(d.id, d);
          }}
          onClientUpdated={(c) => {
            updateClient(c.id, c);
          }}
          setActiveTab={setActiveTab}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER LEVEL 2: CLIENT UNDERWRITING WORKSPACE
  // ----------------------------------------------------
  if (selectedClientSummary) {
    return (
      <div className="space-y-4">
        {/* Breadcrumb Bar */}
        <div className="flex items-center justify-between text-xs bg-slate-900/80 border border-slate-800 px-4 py-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-slate-400">
            <button
              onClick={handleBackToAllClientsHub}
              className="hover:text-white font-semibold text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>All Clients Underwriting Hub</span>
            </button>
            <span>/</span>
            <span className="text-amber-400 font-bold">
              {selectedClientSummary.client.firstName} {selectedClientSummary.client.lastName} ({selectedClientSummary.client.businessName})
            </span>
          </div>

          <span className="text-slate-400 font-mono">
            {selectedClientSummary.totalDealsCount} Stacked Position{selectedClientSummary.totalDealsCount === 1 ? '' : 's'}
          </span>
        </div>

        <ClientUnderwritingWorkspace
          summary={selectedClientSummary}
          onSelectDeal={(deal) => setSelectedDeal(deal)}
          onBackToHub={handleBackToAllClientsHub}
          setActiveTab={setActiveTab}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER LEVEL 1: CLIENT-FIRST UNDERWRITING COMMAND CENTER
  // ----------------------------------------------------
  return (
    <div className="space-y-6 pb-16" id="client-first-underwriting-hub">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-[#0e1e38] to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded font-mono shadow-sm">
              Client-First Underwriting Command Center
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-mono font-bold">
              {clientSummaries.length} Borrowers Grouped
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400 font-mono">
              ${dashboardCounters.totalPipelineRequested.toLocaleString()} Pipeline
            </span>
          </div>

          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-amber-400" />
            Underwriting & Stacking Command Center
          </h1>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Borrower-centric underwriting desk grouping all stacked funding positions per client. Perform 4-month bank cash flow analysis, automated risk mitigation, conflict resolution, closing condition verification, and 1-click ready-to-fund releases.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refreshAll()}
            className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors"
            title="Refresh All Underwriting Records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'TABLE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'CARDS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Dashboard Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => setActiveQueue('NEEDS_ATTENTION')}
          className={`bg-slate-900/80 border p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 ${
            activeQueue === 'NEEDS_ATTENTION' ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-800'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Needs Attention</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </span>
          <div className="text-xl font-black text-rose-400 font-mono mt-1">
            {dashboardCounters.clientsNeedingAttention}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {dashboardCounters.dealsNeedingAttention} deals with blockers
          </span>
        </div>

        <div
          onClick={() => setActiveQueue('READY_FOR_UNDERWRITING')}
          className={`bg-slate-900/80 border p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 ${
            activeQueue === 'READY_FOR_UNDERWRITING' ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-800'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Ready to Underwrite</span>
            <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
          </span>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">
            {dashboardCounters.readyForUnderwriting}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Pre-checks complete</span>
        </div>

        <div
          onClick={() => setActiveQueue('IN_REVIEW')}
          className={`bg-slate-900/80 border p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 ${
            activeQueue === 'IN_REVIEW' ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-800'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>In Review</span>
            <Clock className="w-3.5 h-3.5 text-blue-400" />
          </span>
          <div className="text-xl font-black text-blue-400 font-mono mt-1">
            {dashboardCounters.underwritingInProgress}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Active analysis</span>
        </div>

        <div
          onClick={() => setActiveQueue('APPROVED_NOT_FUNDED')}
          className={`bg-slate-900/80 border p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 ${
            activeQueue === 'APPROVED_NOT_FUNDED' ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-800'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Approved (Not Funded)</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          </span>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">
            {dashboardCounters.approvedNotFunded}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Awaiting closing stips</span>
        </div>

        <div
          onClick={() => setActiveQueue('READY_TO_FUND')}
          className={`bg-slate-900/80 border p-3.5 rounded-xl cursor-pointer transition-all hover:bg-slate-800/80 ${
            activeQueue === 'READY_TO_FUND' ? 'border-amber-500 shadow-md shadow-amber-500/10' : 'border-slate-800'
          }`}
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
            <span>Ready to Fund</span>
            <Banknote className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {dashboardCounters.readyToFund}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">100% ready for wire</span>
        </div>
      </div>

      {/* 3. Underwriting Queue Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto text-xs">
        <button
          onClick={() => setActiveQueue('ALL')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Borrowers ({clientSummaries.length})
        </button>

        <button
          onClick={() => setActiveQueue('NEEDS_ATTENTION')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeQueue === 'NEEDS_ATTENTION' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Needs Attention ({dashboardCounters.clientsNeedingAttention})
        </button>

        <button
          onClick={() => setActiveQueue('READY_FOR_UNDERWRITING')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'READY_FOR_UNDERWRITING' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Ready for Underwriting ({dashboardCounters.readyForUnderwriting})
        </button>

        <button
          onClick={() => setActiveQueue('IN_REVIEW')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'IN_REVIEW' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          In Review ({dashboardCounters.underwritingInProgress})
        </button>

        <button
          onClick={() => setActiveQueue('WAITING_DOCS')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'WAITING_DOCS' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Waiting on Docs ({dashboardCounters.waitingOnDocs})
        </button>

        <button
          onClick={() => setActiveQueue('WAITING_CLIENT')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'WAITING_CLIENT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Waiting on Client ({dashboardCounters.waitingOnClient})
        </button>

        <button
          onClick={() => setActiveQueue('APPROVED_NOT_FUNDED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'APPROVED_NOT_FUNDED' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Approved (Not Funded) ({dashboardCounters.approvedNotFunded})
        </button>

        <button
          onClick={() => setActiveQueue('READY_TO_FUND')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap text-emerald-400 ${
            activeQueue === 'READY_TO_FUND' ? 'bg-emerald-500 text-slate-950' : 'hover:text-emerald-300'
          }`}
        >
          Ready to Fund ({dashboardCounters.readyToFund})
        </button>

        <button
          onClick={() => setActiveQueue('FUNDED')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeQueue === 'FUNDED' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
          }`}
        >
          Funded ({dashboardCounters.funded})
        </button>
      </div>

      {/* 4. Search & Multi-Filter Control Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Main Client Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Client Name (e.g. Susanne), Business Name, Deal ID, Product, Lender, Underwriter..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Quick Clear Button if filters active */}
          {(searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL' || funderFilter !== 'ALL' || productFilter !== 'ALL' || staffFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPriorityFilter('ALL');
                setStatusFilter('ALL');
                setFunderFilter('ALL');
                setProductFilter('ALL');
                setStaffFilter('ALL');
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Secondary Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Underwriting Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY_FOR_UNDERWRITING">Ready for Underwriting</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="APPROVED">Approved</option>
              <option value="READY_TO_FUND">Ready to Fund</option>
              <option value="FUNDED">Funded</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Funding Product</label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Products</option>
              {availableProducts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Funder / Lender</label>
            <select
              value={funderFilter}
              onChange={(e) => setFunderFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Funders</option>
              {availableFunders.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Assigned Underwriter</label>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Staff</option>
              {availableStaff.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. CLIENT-FIRST MAIN PORTFOLIO (Table or Card View) */}
      {viewMode === 'TABLE' ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Borrower & Commercial Entity</th>
                  <th className="py-3.5 px-3 font-mono">Stacked Deals</th>
                  <th className="py-3.5 px-3 font-mono">Total Volume</th>
                  <th className="py-3.5 px-3">Underwriting Status</th>
                  <th className="py-3.5 px-3">Priority</th>
                  <th className="py-3.5 px-3">Next Action</th>
                  <th className="py-3.5 px-3">Underwriter</th>
                  <th className="py-3.5 px-3">Last Activity</th>
                  <th className="py-3.5 px-4 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-sans">
                {filteredSummaries.length > 0 ? (
                  filteredSummaries.map((summary) => {
                    const { client, deals: clientDeals } = summary;
                    const isExpanded = expandedClientIds.has(client.id);

                    return (
                      <React.Fragment key={client.id}>
                        <tr
                          onClick={() => handleOpenClientWorkspace(summary)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          {/* Column 1: Client & Business Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExpandClient(client.id);
                                }}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                title={isExpanded ? 'Collapse stacked deals' : 'Expand stacked deals'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>

                              <div>
                                <div className="text-sm font-black text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  {client.firstName} {client.lastName}
                                </div>
                                <div className="text-[11px] font-semibold text-slate-300 mt-0.5 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-500" />
                                  {client.businessName}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Stacked Deals count & expand badge */}
                          <td className="py-3.5 px-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandClient(client.id);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950 text-slate-200 border border-slate-800 text-[11px] font-mono font-bold hover:border-amber-500/50"
                            >
                              <Layers className="w-3 h-3 text-amber-400" />
                              {summary.totalDealsCount} Deal{summary.totalDealsCount === 1 ? '' : 's'}
                            </button>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {summary.stackingRiskLevel} Risk Stack
                            </span>
                          </td>

                          {/* Column 3: Volume metrics */}
                          <td className="py-3.5 px-3 font-mono">
                            <div className="text-xs font-black text-white">
                              ${summary.totalRequestedAmount.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-emerald-400 mt-0.5">
                              ${summary.totalFundedAmount.toLocaleString()} funded
                            </div>
                          </td>

                          {/* Column 4: Underwriting Status */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                summary.hasReadyToFundDeal
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                                  : summary.hasApprovedNotFundedDeal
                                  ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                                  : summary.hasReadyForUnderwritingDeal
                                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                                  : 'bg-slate-950 text-slate-300 border-slate-800'
                              }`}
                            >
                              {summary.overallUnderwritingStatus.replace(/_/g, ' ')}
                            </span>
                          </td>

                          {/* Column 5: Priority */}
                          <td className="py-3.5 px-3">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                                summary.overallPriority === 'CRITICAL'
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : summary.overallPriority === 'HIGH'
                                  ? 'bg-amber-950 text-amber-300 border-amber-700'
                                  : 'bg-slate-950 text-slate-400 border-slate-800'
                              }`}
                              title={summary.primaryPriorityReason}
                            >
                              {summary.overallPriority}
                            </span>
                          </td>

                          {/* Column 6: Next Action */}
                          <td className="py-3.5 px-3 max-w-[200px]">
                            <div className="text-[11px] font-semibold text-amber-300 truncate" title={summary.nextAction}>
                              {summary.nextAction}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate" title={summary.primaryPriorityReason}>
                              {summary.primaryPriorityReason}
                            </div>
                          </td>

                          {/* Column 7: Underwriter */}
                          <td className="py-3.5 px-3 text-slate-200 text-xs">
                            {summary.assignedUnderwriter}
                          </td>

                          {/* Column 8: Last Activity & Stale Badge */}
                          <td className="py-3.5 px-3">
                            <div className="text-[11px] text-slate-300">
                              {formatDate(summary.lastActivity, 'Recent')}
                            </div>
                            {summary.isStale && (
                              <span className="text-[9px] font-bold text-rose-400 uppercase font-mono block">
                                STALE ({summary.daysInactive}d)
                              </span>
                            )}
                          </td>

                          {/* Column 9: Open Workspace Button */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenClientWorkspace(summary);
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                            >
                              <span>Open Workspace</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>

                        {/* Inline Stacked Deals Expansion Row */}
                        {isExpanded && (
                          <tr className="bg-slate-950/90 border-b border-slate-800">
                            <td colSpan={9} className="p-4 pl-12">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Layers className="w-3.5 h-3.5" />
                                    Stacked Funding Deals for {client.firstName} {client.lastName}
                                  </span>
                                  <span className="text-slate-400 font-mono">
                                    Total Stack: ${summary.totalRequestedAmount.toLocaleString()} requested • ${summary.estimatedMonthlyDebtService.toLocaleString()}/mo debt load
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {clientDeals.map((d: DealUnderwritingAnalysis, dIdx: number) => (
                                    <div
                                      key={d.deal.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDealWorkstation(d.deal, client);
                                      }}
                                      className="bg-slate-900 border border-slate-800 hover:border-amber-500/60 p-3.5 rounded-xl transition-all cursor-pointer space-y-2 group/deal"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                                          {d.position || `Position #${dIdx + 1}`}
                                        </span>
                                        <span className="text-xs font-mono text-slate-400">
                                          #{d.deal.dealId || d.deal.id.slice(0, 6)}
                                        </span>
                                      </div>

                                      <div>
                                        <span className="text-xs font-bold text-amber-300 block">
                                          {d.product}
                                        </span>
                                        <div className="text-base font-black text-white font-mono mt-0.5">
                                          ${(d.approvedAmount || d.requestedAmount).toLocaleString()}
                                        </div>
                                      </div>

                                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                                        <span>Lender: <strong className="text-slate-200">{d.funder}</strong></span>
                                        <span className="font-mono text-emerald-400">Score: {d.readinessScore}/100</span>
                                      </div>

                                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                                        <span className="text-slate-400">Stage: {d.status}</span>
                                        <span className="text-amber-400 font-bold group-hover/deal:translate-x-0.5 transition-transform flex items-center gap-1">
                                          Open Deal <ChevronRight className="w-3 h-3" />
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No borrowers match the current search or queue criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSummaries.map((summary) => {
            const { client, deals: clientDeals } = summary;

            return (
              <div
                key={client.id}
                onClick={() => handleOpenClientWorkspace(summary)}
                className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all cursor-pointer group"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
                        {summary.totalDealsCount} Stacked Deal{summary.totalDealsCount === 1 ? '' : 's'}
                      </span>
                      <h3 className="text-base font-black text-white mt-1.5 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        <User className="w-4 h-4 text-amber-400" />
                        {client.firstName} {client.lastName}
                      </h3>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        {client.businessName}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                        summary.overallPriority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border-rose-700'
                          : summary.overallPriority === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border-amber-700'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {summary.overallPriority}
                    </span>
                  </div>

                  {/* Volume Summary */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Requested</span>
                      <span className="font-bold text-white text-sm">${summary.totalRequestedAmount.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Funded</span>
                      <span className="font-bold text-emerald-400 text-sm">${summary.totalFundedAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Next Action & Priority Reason */}
                  <div className="space-y-1.5 text-xs">
                    <div className="text-amber-300 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Next: {summary.nextAction}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">
                      Reason: {summary.primaryPriorityReason}
                    </div>
                  </div>

                  {/* Stacked Deal Previews */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Active Positions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {clientDeals.slice(0, 3).map((d: DealUnderwritingAnalysis) => (
                        <span
                          key={d.deal.id}
                          className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono"
                        >
                          {d.position} ({d.product})
                        </span>
                      ))}
                      {clientDeals.length > 3 && (
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-400 text-[10px]">
                          +{clientDeals.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    Underwriter: <strong className="text-slate-200">{summary.assignedUnderwriter}</strong>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenClientWorkspace(summary);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1"
                  >
                    <span>Open Workspace</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
