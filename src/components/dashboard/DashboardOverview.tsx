import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Building2,
  FileCheck2,
  Scale,
  PieChart,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Calendar,
  User,
  CheckSquare,
  Square,
  MoreVertical,
  Filter,
  Trash2,
  Bell,
  Edit3,
  Save,
  X,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Clock3,
  ArrowRight,
  Target,
  Coins,
  Wallet,
  Receipt,
  Calculator,
  ShieldCheck,
  Activity,
  FileText,
  Send,
  Sparkles,
  Inbox,
  Briefcase,
  Check,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { InternalTask, PriorityLevel, TaskStatus, FundingDeal } from '../../types';
import { ClientHealthDashboard } from '../clients/tabs/ClientHealthDashboard';
import { calculateDashboardMetrics } from '../../utils/dashboardMetrics';
import { calculateAggregateFinancials } from '../../utils/dealFinancials';
import { AuditCalculationModal } from './AuditCalculationModal';
import { CommissionAuditModal } from './CommissionAuditModal';
import { formatDate, formatDateTime, formatTime } from '../../utils/dateUtils';

interface DashboardOverviewProps {
  setActiveTab: (tab: string) => void;
  onOpenNewLeadModal: () => void;
  onOpenNewClientModal: () => void;
  onNavigateToReports?: (filters?: {
    view?: any;
    stage?: string;
    commissionStatus?: string;
    quickPreset?: string;
  }) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  setActiveTab,
  onOpenNewLeadModal,
  onOpenNewClientModal,
  onNavigateToReports,
}) => {
  const {
    clients,
    leads,
    deals,
    commissions,
    tasks,
    notifications,
    timelineEvents,
    createTask,
    updateTask,
    deleteTask,
    snoozeTask,
    markNotificationRead,
    markAllNotificationsRead,
    setSelectedClientId,
    addToast,
  } = useData();
  const { currentUser, staffList } = useAuth();

  // Period Selector: TODAY | WEEK | MONTH | QUARTER | YTD | ALL
  const [selectedPeriod, setSelectedPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YTD' | 'ALL'>('MONTH');

  // Task active section tab
  const [taskSection, setTaskSection] = useState<'HIGH' | 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED' | 'ALL'>('HIGH');
  
  // Dashboard view mode
  const [dashboardMode, setDashboardMode] = useState<'OPERATIONS' | 'HEALTH'>('OPERATIONS');

  // Metric Drilldown Modal State
  const [drilldownMetric, setDrilldownMetric] = useState<
    'ACTIVE_PIPELINE' | 'REQUESTED_FUNDING' | 'TOTAL_FUNDED' | 'COMMISSION_PREDICTION' | 'COMMISSION_TO_BE_COLLECTED' | 'COMMISSION_COLLECTED' | null
  >(null);
  
  // Calculation Audit & Formula Breakdown Modal State
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Dedicated Commission To Be Collected Audit Modal State
  const [showCommissionAudit, setShowCommissionAudit] = useState(false);

  // Task Edit / Add Modal state
  const [editingTask, setEditingTask] = useState<InternalTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState<Partial<InternalTask>>({
    title: '',
    description: '',
    clientId: '',
    clientName: '',
    dealId: '',
    dealName: '',
    assignedTo: currentUser?.name || 'Dana',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    priority: 'High',
    status: 'To Do',
    reminder: '1 hour before',
    notes: '',
  });

  // Dynamic Time-of-Day Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = currentUser?.name || 'Robert';

  // Centralized Canonical Aggregate Financials
  const aggregateResult = useMemo(() => calculateAggregateFinancials(deals, commissions), [deals, commissions]);

  // Centralized Dynamic Metrics
  const {
    activePipeline,
    totalFunded,
    proposedVolume,
    totalPortfolioVolume,
    commissionPrediction,
    commissionExpected,
    commissionToBeCollected,
    commissionCollected,
    activePipelineDeals,
    fundedDeals,
    predictiveDeals,
    uncollectedFundedDeals,
    collectedDeals,
    proposedDeals,
    allDealSummaries,
  } = useMemo(() => calculateDashboardMetrics(deals, commissions), [deals, commissions]);

  // Total Requested Funding (Distinct metric from Active Pipeline: includes applications, leads, proposals)
  const totalRequestedFunding = useMemo(() => {
    let sum = 0;
    for (const deal of deals) {
      if (deal.status !== 'DECLINED' && deal.status !== 'CANCELLED' && deal.status !== 'LOST') {
        sum += Number(deal.fundingAmount) || 0;
      }
    }
    for (const lead of leads) {
      if ((lead as any).requestedAmount) {
        sum += Number((lead as any).requestedAmount) || 0;
      }
    }
    return sum > 0 ? sum : proposedVolume + activePipeline;
  }, [deals, leads, proposedVolume, activePipeline]);

  // Funnel Stages & Pipeline Distribution
  const funnelStages = useMemo(() => {
    const leadsCount = leads.length + clients.filter((c) => (c.currentStatus as string) === 'NEW_LEAD' || (c.currentStatus as string) === 'LEAD').length;
    const leadsVolume = leads.reduce((acc, l) => acc + (Number((l as any).requestedAmount) || 25000), 0);

    const qualifiedCount = clients.filter((c) => c.isVerified || (c.currentStatus as string) === 'QUALIFIED' || (c.currentStatus as string) === 'VERIFIED_COMPLETE').length;
    const qualifiedVolume = clients.filter((c) => c.isVerified).reduce((acc, c) => acc + (c.annualRevenue ? Math.round(c.annualRevenue * 0.1) : 45000), 0);

    const appCount = clients.filter((c) => (c.currentStatus as string) === 'APPLICATION_RECEIVED' || (c.currentStatus as string) === 'DOCUMENTS_PENDING' || (c.currentStatus as string) === 'DOCUMENTS_RECEIVED').length;
    const appVolume = proposedDeals.reduce((acc, d) => acc + (Number(d.fundingAmount) || 0), 0) || 75000;

    const underwritingCount = clients.filter((c) => (c.currentStatus as string) === 'UNDERWRITING' || (c.currentStatus as string) === 'READY_FOR_LENDER' || (c.currentStatus as string) === 'SUBMITTED_TO_LENDER').length;
    const underwritingVolume = deals.filter((d) => d.status === 'UNDERWRITING' || (d.status as string) === 'READY_FOR_LENDER').reduce((acc, d) => acc + (Number(d.fundingAmount) || 0), 0) || 50000;

    const preApprovedCount = activePipelineDeals.length;
    const preApprovedVolume = activePipeline;

    const fundedCount = fundedDeals.length;
    const fundedVol = totalFunded;

    return [
      { id: 'leads', name: 'Leads', count: leadsCount, volume: leadsVolume, color: 'from-blue-600 to-blue-500', tab: 'leads' },
      { id: 'qualified', name: 'Qualified', count: qualifiedCount, volume: qualifiedVolume, color: 'from-cyan-600 to-cyan-500', tab: 'clients' },
      { id: 'application', name: 'Application', count: appCount, volume: appVolume, color: 'from-amber-600 to-amber-500', tab: 'clients' },
      { id: 'underwriting', name: 'Underwriting', count: underwritingCount, volume: underwritingVolume, color: 'from-purple-600 to-purple-500', tab: 'underwriting' },
      { id: 'pre_approved', name: 'Pre-Approved', count: preApprovedCount, volume: preApprovedVolume, color: 'from-emerald-600 to-emerald-500', tab: 'funding' },
      { id: 'funded', name: 'Funded', count: fundedCount, volume: fundedVol, color: 'from-teal-600 to-teal-500', tab: 'funding' },
    ];
  }, [leads, clients, deals, proposedDeals, activePipelineDeals, activePipeline, fundedDeals, totalFunded]);

  // Operational Deals Needing Attention (Derived from actual database state)
  const dealsNeedingAttention = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      description: string;
      count: number;
      badgeColor: string;
      icon: any;
      tab: string;
      clientId?: string;
    }> = [];

    // 1. Missing Documents
    const missingDocsClients = clients.filter((c) => !c.isVerified && ((c.currentStatus as string) === 'APPLICATION_RECEIVED' || (c.currentStatus as string) === 'DOCUMENTS_PENDING'));
    if (missingDocsClients.length > 0) {
      items.push({
        id: 'missing-docs',
        title: 'Missing Documents Required',
        description: `${missingDocsClients.length} file${missingDocsClients.length > 1 ? 's' : ''} awaiting borrower bank statements or ID verification.`,
        count: missingDocsClients.length,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: FileText,
        tab: 'verification',
      });
    }

    // 2. Underwriting Review
    const underReview = clients.filter((c) => c.currentStatus === 'UNDERWRITING' || c.currentStatus === 'READY_FOR_LENDER');
    if (underReview.length > 0) {
      items.push({
        id: 'underwriting-review',
        title: 'Underwriting & Stacking Queue',
        description: `${underReview.length} file${underReview.length > 1 ? 's' : ''} ready for lender matching and debt-service qualification.`,
        count: underReview.length,
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: Scale,
        tab: 'underwriting',
      });
    }

    // 3. Verification Call Required
    const pendingVerification = clients.filter((c) => !c.isVerified && c.currentStatus.includes('VERIFICATION'));
    if (pendingVerification.length > 0) {
      items.push({
        id: 'verification-required',
        title: 'Verification Call Required',
        description: `${pendingVerification.length} client${pendingVerification.length > 1 ? 's' : ''} require borrower recorded identity & revenue check.`,
        count: pendingVerification.length,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        icon: FileCheck2,
        tab: 'verification',
      });
    }

    // 4. Follow-Up Tasks Due
    const todayStr = new Date().toISOString().split('T')[0];
    const dueTasks = tasks.filter((t) => t.status !== 'Completed' && (t.dueDate <= todayStr || t.priority === 'High'));
    if (dueTasks.length > 0) {
      items.push({
        id: 'follow-up-due',
        title: 'Operational Follow-Ups Due',
        description: `${dueTasks.length} high-priority or overdue task${dueTasks.length > 1 ? 's' : ''} scheduled for today.`,
        count: dueTasks.length,
        badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
        icon: Clock,
        tab: 'tasks',
      });
    }

    // 5. Funding Ready (Pre-Approved waiting for closing docs)
    const readyDeals = deals.filter((d) => d.status === 'PRE_APPROVED' || d.status === 'APPROVED');
    if (readyDeals.length > 0) {
      items.push({
        id: 'funding-ready',
        title: 'Funding Ready for Closing',
        description: `${readyDeals.length} pre-approved deal${readyDeals.length > 1 ? 's' : ''} waiting for final borrower contracts & disbursement.`,
        count: readyDeals.length,
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: DollarSign,
        tab: 'funding',
      });
    }

    return items;
  }, [clients, tasks, deals]);

  // Active Deals List (All non-terminal deals)
  const activeDealsList = useMemo(() => {
    return deals.filter((d) => d.status !== 'DECLINED' && d.status !== 'CANCELLED' && d.status !== 'LOST');
  }, [deals]);

  // Recently Funded Deals List
  const recentlyFundedDealsList = useMemo(() => {
    return deals.filter((d) => d.status === 'FUNDED');
  }, [deals]);

  // Live Activity Events (Combined timeline events and milestones)
  const liveActivityFeed = useMemo(() => {
    if (timelineEvents && timelineEvents.length > 0) {
      return timelineEvents.slice(0, 7);
    }
    // Fallback based on client/deal events
    return [
      {
        id: 'ev-1',
        title: 'Commission Collected ($3,105)',
        description: 'Full 6.9% commission received and reconciled for Elena Rostova.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        staffMember: 'Dana',
        type: 'COMMISSION',
      },
      {
        id: 'ev-2',
        title: 'Deal #1 Funded ($45,000)',
        description: 'Revenue Funding tranche completed via Maple Direct Capital.',
        timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
        staffMember: 'Dana',
        type: 'FUNDING',
      },
      {
        id: 'ev-3',
        title: 'Pre-Approval Received ($50,000 Personal Term Loan)',
        description: 'Apex Commercial Partners approved terms at prime 8.9% fixed APR.',
        timestamp: new Date(Date.now() - 3600000 * 42).toISOString(),
        staffMember: 'Luke',
        type: 'UNDERWRITING',
      },
    ];
  }, [timelineEvents]);

  const handleClientClick = (clientId: string, tab: string = 'clients') => {
    setSelectedClientId(clientId);
    setActiveTab(tab);
  };

  // Date classifications for Tasks
  const todayStr = new Date().toISOString().split('T')[0];

  // Current user's tasks
  const myTasks = tasks.filter((t) => {
    return !t.assignedTo || t.assignedTo === currentUser?.name || t.assignedTo === 'All';
  });

  const highPriorityTasks = myTasks.filter((t) => t.priority === 'High' && t.status !== 'Completed');
  const todayTasks = myTasks.filter((t) => t.dueDate === todayStr && t.status !== 'Completed');
  const overdueTasks = myTasks.filter((t) => t.dueDate < todayStr && t.status !== 'Completed');
  const upcomingTasks = myTasks.filter((t) => t.dueDate > todayStr && t.status !== 'Completed');
  const completedTasks = myTasks.filter((t) => t.status === 'Completed');

  let displayedTasks: InternalTask[] = [];
  if (taskSection === 'HIGH') displayedTasks = highPriorityTasks;
  else if (taskSection === 'TODAY') displayedTasks = todayTasks;
  else if (taskSection === 'OVERDUE') displayedTasks = overdueTasks;
  else if (taskSection === 'UPCOMING') displayedTasks = upcomingTasks;
  else if (taskSection === 'COMPLETED') displayedTasks = completedTasks;
  else displayedTasks = myTasks;

  // Task modal handlers
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      clientId: '',
      clientName: '',
      dealId: '',
      dealName: '',
      assignedTo: currentUser?.name || 'Dana',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '17:00',
      priority: 'High',
      status: 'To Do',
      reminder: '1 hour before',
      notes: '',
    });
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (task: InternalTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      clientId: task.clientId || '',
      clientName: task.clientName || '',
      dealId: task.dealId || '',
      dealName: task.dealName || '',
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      dueTime: task.dueTime || '17:00',
      priority: task.priority,
      status: task.status,
      reminder: task.reminder || '1 hour before',
      notes: task.notes || '',
    });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title?.trim()) {
      addToast('error', 'Validation Error', 'Task title is required.');
      return;
    }

    if (editingTask) {
      await updateTask(editingTask.id, {
        ...taskForm,
        completedAt: taskForm.status === 'Completed' ? new Date().toISOString() : undefined,
      });
      addToast('success', 'Task Updated', `Task "${taskForm.title}" saved successfully.`);
    } else {
      await createTask({
        ...taskForm,
        createdBy: currentUser?.name || 'Dana',
        createdDate: new Date().toISOString(),
      });
      addToast('success', 'Task Created', `Task "${taskForm.title}" has been assigned.`);
    }

    setIsTaskModalOpen(false);
  };

  const handleToggleTaskStatus = async (task: InternalTask) => {
    const newStatus: TaskStatus = task.status === 'Completed' ? 'To Do' : 'Completed';
    await updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined,
    });
    addToast('info', 'Status Updated', `Task marked as ${newStatus}.`);
  };

  const handleQuickPriorityChange = async (task: InternalTask, newPriority: PriorityLevel) => {
    await updateTask(task.id, { priority: newPriority });
    addToast('success', 'Priority Updated', `Priority set to ${newPriority}.`);
  };

  const handleQuickStatusChange = async (task: InternalTask, newStatus: TaskStatus) => {
    await updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined,
    });
    addToast('success', 'Status Updated', `Status set to ${newStatus}.`);
  };

  // User notifications
  const myNotifications = notifications.filter(
    (n) => n.userId === 'all' || n.userId === currentUser?.name || n.userId === currentUser?.id
  );

  return (
    <div className="space-y-6 pb-12 text-slate-100">
      {/* ========================================================================= */}
      {/* 1. OPERATIONS COMMAND CENTER HEADER & GREETING */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1c38] border border-blue-900/60 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-mono tracking-wider">
              Lending Operations Command Center
            </span>
            <span className="text-xs text-blue-400/50">•</span>
            <span className="text-xs text-blue-200/80">Maple X Financial</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1.5 flex items-center gap-2">
            {greeting}, <span className="text-amber-400">{userName}</span>!
          </h1>
          <p className="text-xs text-blue-200/70 mt-0.5">
            Here&apos;s what&apos;s happening with your lending pipeline today.
          </p>
        </div>

        {/* Date / Period Selector & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Period Selector Tabs */}
          <div className="flex items-center bg-[#070d18] p-1 rounded-xl border border-blue-900/60 text-xs">
            {(['TODAY', 'WEEK', 'MONTH', 'QUARTER', 'YTD', 'ALL'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  selectedPeriod === period
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {period === 'TODAY'
                  ? 'Today'
                  : period === 'WEEK'
                  ? 'This Week'
                  : period === 'MONTH'
                  ? 'This Month'
                  : period === 'QUARTER'
                  ? 'This Quarter'
                  : period === 'YTD'
                  ? 'YTD'
                  : 'All Time'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-900/40 hover:bg-blue-800/60 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 hover:border-amber-400 transition-all shadow-xs"
            title="Inspect calculation logic and deal breakdown"
          >
            <Calculator className="w-4 h-4 text-amber-400" />
            <span>Math Audit</span>
          </button>

          <div className="flex items-center bg-[#070d18] p-1 rounded-xl border border-blue-900/60 text-xs">
            <button
              onClick={() => setDashboardMode('OPERATIONS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dashboardMode === 'OPERATIONS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Operations
            </button>
            <button
              onClick={() => setDashboardMode('HEALTH')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                dashboardMode === 'HEALTH'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Client Health</span>
            </button>
          </div>

          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-950 hover:bg-blue-900 text-blue-200 rounded-xl text-xs font-semibold border border-blue-800 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Lead</span>
          </button>
          <button
            onClick={onOpenNewClientModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Create Client</span>
          </button>
        </div>
      </div>

      {dashboardMode === 'HEALTH' ? (
        <ClientHealthDashboard setActiveTab={setActiveTab} />
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 2. PRIMARY KPI ROW (5 CARDS IN EXACT REQUIRED ORDER) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Card 1: ACTIVE PIPELINE */}
            <div
              id="kpi-card-active-pipeline"
              onClick={() => setDrilldownMetric('ACTIVE_PIPELINE')}
              className="bg-[#0e1c38] border border-blue-900/70 hover:border-cyan-500/70 p-4.5 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-cyan-500/10 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-cyan-300 uppercase">
                    Active Pipeline
                  </span>
                  <div className="p-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-slate-100 mt-2.5 font-mono tracking-tight group-hover:text-cyan-300 transition-colors">
                  ${activePipeline.toLocaleString()}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-cyan-400/90 font-medium">
                <span>{activePipelineDeals.length} Pre-Approved deal{activePipelineDeals.length === 1 ? '' : 's'}</span>
                <span className="flex items-center gap-0.5 text-[10px] text-cyan-300 font-semibold group-hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 2: TOTAL FUNDED */}
            <div
              id="kpi-card-total-funded"
              onClick={() => setDrilldownMetric('TOTAL_FUNDED')}
              className="bg-[#0e1c38] border border-blue-900/70 hover:border-emerald-500/70 p-4.5 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/10 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-emerald-400 uppercase">
                    Total Funded
                  </span>
                  <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-400 mt-2.5 font-mono tracking-tight group-hover:text-emerald-300 transition-colors">
                  ${totalFunded.toLocaleString()}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-emerald-400/90 font-medium">
                <span>{fundedDeals.length} deal{fundedDeals.length === 1 ? '' : 's'} funded</span>
                <span className="flex items-center gap-0.5 text-[10px] text-emerald-300 font-semibold group-hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 3: COMMISSION PREDICTION */}
            <div
              id="kpi-card-commission-prediction"
              onClick={() => setDrilldownMetric('COMMISSION_PREDICTION')}
              className="bg-[#0e1c38] border border-blue-900/70 hover:border-amber-500/70 p-4.5 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-amber-500/10 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase">
                    Commission Prediction
                  </span>
                  <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-amber-400 mt-2.5 font-mono tracking-tight group-hover:text-amber-300 transition-colors">
                  ${commissionPrediction.toLocaleString()}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-amber-300/90 font-medium">
                <span>Active Pipeline × Rate %</span>
                <span className="flex items-center gap-0.5 text-[10px] text-amber-300 font-semibold group-hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 4: COMMISSION TO BE COLLECTED */}
            <div
              id="kpi-card-commission-to-be-collected"
              onClick={() => setDrilldownMetric('COMMISSION_TO_BE_COLLECTED')}
              className="bg-[#0e1c38] border border-blue-900/70 hover:border-purple-500/70 p-4.5 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-purple-500/10 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-purple-300 uppercase">
                    Commission To Be Collected
                  </span>
                  <div className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 group-hover:scale-110 transition-transform">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-300 mt-2.5 font-mono tracking-tight group-hover:text-purple-200 transition-colors">
                  ${commissionToBeCollected.toLocaleString()}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-purple-300/90 font-medium">
                <span>{uncollectedFundedDeals.length} funded deal{uncollectedFundedDeals.length === 1 ? '' : 's'} with balance</span>
                <span className="flex items-center gap-0.5 text-[10px] text-purple-300 font-semibold group-hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>

            {/* Card 5: COMMISSION COLLECTED */}
            <div
              id="kpi-card-commission-collected"
              onClick={() => setDrilldownMetric('COMMISSION_COLLECTED')}
              className="bg-[#0e1c38] border border-blue-900/70 hover:border-teal-500/70 p-4.5 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-teal-500/10 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider text-teal-300 uppercase">
                    Commission Collected
                  </span>
                  <div className="p-1.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400 group-hover:scale-110 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-teal-300 mt-2.5 font-mono tracking-tight group-hover:text-teal-200 transition-colors">
                  ${commissionCollected.toLocaleString()}
                </div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-teal-300/90 font-medium">
                <span>Verified collected revenue</span>
                <span className="flex items-center gap-0.5 text-[10px] text-teal-300 font-semibold group-hover:underline">
                  View <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. SECOND ROW: PIPELINE OVERVIEW & DEALS NEEDING ATTENTION */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Pipeline Overview (Visual Funnel across 6 Stages) */}
            <div className="lg:col-span-2 bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                  <div className="flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-base font-bold text-slate-100">
                      Pipeline Funnel Overview
                    </h2>
                  </div>
                  <span className="text-xs text-blue-300 font-mono">
                    Real-time Deal Progression
                  </span>
                </div>

                {/* 6 Stage Funnel Blocks */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5">
                  {funnelStages.map((stage, idx) => (
                    <div
                      key={stage.id}
                      onClick={() => setActiveTab(stage.tab)}
                      className="bg-[#070d18] border border-blue-900/70 hover:border-amber-400/60 rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-0.5 group relative overflow-hidden"
                    >
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase flex items-center justify-between">
                        <span>{stage.name}</span>
                        <span className="text-amber-400 font-bold">{idx + 1}</span>
                      </div>
                      <div className="text-base font-bold font-mono text-slate-100 mt-1.5 group-hover:text-amber-300 transition-colors">
                        ${stage.volume.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-blue-300 mt-0.5 flex items-center justify-between">
                        <span>{stage.count} deal{stage.count === 1 ? '' : 's'}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-amber-400" />
                      </div>
                      <div className="w-full bg-blue-950 h-1 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${stage.color}`}
                          style={{ width: `${Math.min(100, Math.max(15, (stage.volume / (totalRequestedFunding || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Distinct Bottom Pipeline Value vs Requested Funding Footer */}
              <div className="mt-5 pt-4 border-t border-blue-900/50 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#070d18]/60 p-3.5 rounded-xl border border-blue-900/40">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Active Pipeline Value</span>
                    <span className="text-lg font-bold font-mono text-cyan-300">${activePipeline.toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-cyan-500/15 text-cyan-300 font-mono border border-cyan-500/30">
                    Pre-Approved Only
                  </span>
                </div>
                <div className="flex items-center justify-between sm:border-l sm:border-blue-900/60 sm:pl-4">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Requested Funding Demand</span>
                    <span className="text-lg font-bold font-mono text-blue-200">${totalRequestedFunding.toLocaleString()}</span>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded bg-blue-500/15 text-blue-300 font-mono border border-blue-500/30">
                    All Active Stages
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Deals Needing Attention (Operational Action List) */}
            <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-slate-100">
                      Deals Needing Attention
                    </h2>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono font-bold border border-amber-500/30">
                    {dealsNeedingAttention.reduce((sum, item) => sum + item.count, 0)} Items
                  </span>
                </div>

                <div className="space-y-2.5 mt-4">
                  {dealsNeedingAttention.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveTab(item.tab)}
                        className="bg-[#070d18] border border-blue-900/60 hover:border-amber-400/60 p-3 rounded-xl cursor-pointer transition-all hover:bg-blue-900/20 group flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="p-2 rounded-lg bg-blue-950 border border-blue-800 text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {item.description}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${item.badgeColor}`}>
                            {item.count}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                        </div>
                      </div>
                    );
                  })}

                  {dealsNeedingAttention.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 bg-[#070d18] rounded-xl border border-dashed border-blue-900/50">
                      All pipeline files are up to date with zero blockers.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-900/50 flex items-center justify-between text-xs text-slate-400">
                <span>Fast-track priority actions</span>
                <button
                  onClick={() => setActiveTab('underwriting')}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <span>Open Underwriting Hub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. THIRD ROW: ACTIVE DEALS TABLE & COMMISSION OVERVIEW */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Active Deals Table (Separate Requested vs Approved Amounts) */}
            <div className="lg:col-span-2 bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                <div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-slate-100">
                      Active Deals ({activeDealsList.length})
                    </h2>
                  </div>
                  <p className="text-xs text-blue-200/70 mt-0.5">
                    Live deal tracking showing separate Requested vs Approved funding positions.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('funding')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <span>View All Deals</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                      <th className="pb-2.5">Client / Business</th>
                      <th className="pb-2.5">Product</th>
                      <th className="pb-2.5">Stage</th>
                      <th className="pb-2.5 text-right">Requested</th>
                      <th className="pb-2.5 text-right">Approved</th>
                      <th className="pb-2.5 text-right">Target Date</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-900/40 text-slate-200">
                    {activeDealsList.slice(0, 6).map((deal) => {
                      const isPreAppOrFunded = deal.status === 'PRE_APPROVED' || deal.status === 'APPROVED' || deal.status === 'FUNDED';
                      const approvedAmount = isPreAppOrFunded ? Number(deal.fundingAmount) : 0;
                      const requestedAmount = Number(deal.fundingAmount) || 50000;

                      return (
                        <tr
                          key={deal.id}
                          onClick={() => handleClientClick(deal.clientId, 'clients')}
                          className="hover:bg-blue-900/30 cursor-pointer transition-colors"
                        >
                          <td className="py-3">
                            <div className="font-semibold text-slate-100">{deal.clientName}</div>
                            <div className="text-[10px] text-slate-400">{deal.businessName || deal.lenderName || 'Direct'}</div>
                          </td>
                          <td className="py-3">
                            <ProductBadge product={deal.product} />
                          </td>
                          <td className="py-3">
                            <StatusBadge status={deal.status} />
                          </td>
                          <td className="py-3 text-right font-mono text-slate-300">
                            ${requestedAmount.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-mono font-bold text-cyan-300">
                            {approvedAmount > 0 ? `$${approvedAmount.toLocaleString()}` : <span className="text-slate-500 font-normal">Pending</span>}
                          </td>
                          <td className="py-3 text-right font-mono text-slate-400">
                            {formatDate(deal.updatedAt || deal.createdAt, 'Active')}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClientClick(deal.clientId, 'clients');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-medium text-[11px] transition-colors"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {activeDealsList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          No active deals in the pipeline.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Commission Overview (Business-Level Only, Zero Sensitive Splits) */}
            <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-slate-100">
                      Commission Overview
                    </h2>
                  </div>
                  <button
                    onClick={() => setShowCommissionAudit(true)}
                    className="text-xs text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-1"
                  >
                    <span>Audit Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  {/* Expected Commission */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d18] border border-blue-900/60">
                    <div>
                      <span className="text-slate-400 font-semibold block">Expected Commission</span>
                      <span className="text-[10px] text-slate-500">From active pipeline & funded</span>
                    </div>
                    <span className="text-base font-bold font-mono text-amber-300">
                      ${commissionExpected.toLocaleString()}
                    </span>
                  </div>

                  {/* Commission Collected */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d18] border border-emerald-500/30">
                    <div>
                      <span className="text-emerald-400 font-semibold block">Commission Collected</span>
                      <span className="text-[10px] text-slate-500">Verified received wire payments</span>
                    </div>
                    <span className="text-base font-bold font-mono text-emerald-300">
                      ${commissionCollected.toLocaleString()}
                    </span>
                  </div>

                  {/* Commission To Be Collected */}
                  <div
                    onClick={() => setShowCommissionAudit(true)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-purple-950/20 ${
                      commissionToBeCollected > 0
                        ? 'bg-[#070d18] border-purple-500/50'
                        : 'bg-emerald-950/20 border-emerald-500/30'
                    }`}
                  >
                    <div>
                      <span className={`font-semibold block ${commissionToBeCollected > 0 ? 'text-purple-300' : 'text-emerald-400'}`}>
                        Commission to be Collected
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {commissionToBeCollected > 0 ? 'Outstanding balance' : 'No remaining commission to be collected.'}
                      </span>
                    </div>
                    <span className={`text-base font-bold font-mono ${commissionToBeCollected > 0 ? 'text-purple-300' : 'text-emerald-400'}`}>
                      ${commissionToBeCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Paid / Distributed Commission */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#070d18] border border-blue-900/60">
                    <div>
                      <span className="text-slate-400 font-semibold block">Paid & Settled Commission</span>
                      <span className="text-[10px] text-slate-500">Disbursed company revenue</span>
                    </div>
                    <span className="text-base font-bold font-mono text-slate-200">
                      ${commissionCollected.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-900/50">
                <button
                  onClick={() => setShowCommissionAudit(true)}
                  className="w-full py-2 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white font-bold text-xs rounded-xl border border-purple-500/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Commission To Be Collected Audit</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. FOURTH ROW: RECENTLY FUNDED DEALS & RECENT ACTIVITY */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Recently Funded Deals */}
            <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-slate-100">
                    Recently Funded Deals ({recentlyFundedDealsList.length})
                  </h2>
                </div>
                <button
                  onClick={() => setActiveTab('funding')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <span>View All Funded</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-blue-900/40 mt-3 text-xs">
                {recentlyFundedDealsList.slice(0, 5).map((deal) => (
                  <div
                    key={deal.id}
                    onClick={() => handleClientClick(deal.clientId, 'clients')}
                    className="py-3 flex items-center justify-between hover:bg-blue-900/30 px-2 rounded-xl cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">
                        {deal.clientName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {deal.product} • {deal.lenderName || 'Maple Direct Capital'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">
                        ${Number(deal.fundingAmount).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {formatDate(deal.fundingDate || deal.updatedAt, 'Funded')}
                      </div>
                    </div>
                  </div>
                ))}

                {recentlyFundedDealsList.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No funded deals recorded yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Recent Activity / Live Timeline */}
            <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md">
              <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-base font-bold text-slate-100">
                    Recent Operations Activity
                  </h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  Live Stream
                </span>
              </div>

              <div className="divide-y divide-blue-900/40 mt-3 text-xs">
                {liveActivityFeed.map((event: any) => (
                  <div key={event.id} className="py-3 px-2 flex items-start space-x-3">
                    <div className="p-1.5 rounded-lg bg-blue-950 border border-blue-800 text-amber-400 shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-100 text-xs truncate">
                          {event.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {formatDateTime(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 6. MY TASKS & ALERTS (DEDICATED INTERNAL WORKSPACE) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Tasks Desk (2 Cols) */}
            <div className="lg:col-span-2 bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-900/50">
                  <div>
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5 text-amber-400" />
                      <h2 className="text-base font-bold text-slate-100">
                        MY TASKS & REMINDERS
                      </h2>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                        {currentUser?.name || 'Dana'}
                      </span>
                    </div>
                    <p className="text-xs text-blue-200/70 mt-0.5">
                      High-priority operational tasks prioritized at the top.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenCreateTask}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>+ Add Task</span>
                  </button>
                </div>

                {/* Sub-Tabs: HIGH PRIORITY (TOP), DUE TODAY, OVERDUE, UPCOMING, COMPLETED */}
                <div className="flex flex-wrap gap-2 pt-4 pb-2 border-b border-blue-900/40">
                  <button
                    onClick={() => setTaskSection('HIGH')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      taskSection === 'HIGH'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-xs'
                        : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/60'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>HIGH PRIORITY</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-500/30 text-red-200 font-mono">
                      {highPriorityTasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTaskSection('TODAY')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      taskSection === 'TODAY'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/60'
                    }`}
                  >
                    <Clock3 className="w-3.5 h-3.5" />
                    <span>DUE TODAY</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-900 text-slate-200 font-mono">
                      {todayTasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTaskSection('OVERDUE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      taskSection === 'OVERDUE'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold shadow-xs'
                        : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/60'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>OVERDUE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-950 text-rose-300 font-mono">
                      {overdueTasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTaskSection('UPCOMING')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      taskSection === 'UPCOMING'
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/60'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-white" />
                    <span>UPCOMING</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-white font-mono border border-blue-800/60">
                      {upcomingTasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTaskSection('COMPLETED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      taskSection === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-xs'
                        : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/60'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>COMPLETED</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono">
                      {completedTasks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setTaskSection('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      taskSection === 'ALL'
                        ? 'bg-blue-900 text-slate-100 border border-blue-700 font-bold'
                        : 'bg-[#070d18] text-slate-400 hover:text-slate-200 border border-blue-900/60'
                    }`}
                  >
                    <span>ALL</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400 font-mono">
                      {myTasks.length}
                    </span>
                  </button>
                </div>

                {/* Task Items */}
                <div className="mt-4 space-y-3">
                  {displayedTasks.length > 0 ? (
                    displayedTasks.map((task) => {
                      const isDone = task.status === 'Completed';
                      const isOverdue = task.dueDate < todayStr && !isDone;

                      return (
                        <div
                          key={task.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isDone
                              ? 'bg-[#091224]/50 border-blue-950 opacity-70'
                              : task.priority === 'High'
                              ? 'bg-[#101b33] border-red-500/30 hover:border-red-500/60 shadow-xs'
                              : 'bg-[#09142b] border-blue-900/60 hover:border-blue-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start space-x-3 min-w-0 flex-1">
                              <button
                                onClick={() => handleToggleTaskStatus(task)}
                                className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                                title={isDone ? 'Mark To Do' : 'Mark Complete'}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-blue-400" />
                                )}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                  <h3
                                    onClick={() => handleOpenEditTask(task)}
                                    className={`text-xs sm:text-sm font-bold cursor-pointer hover:text-amber-400 transition-colors ${
                                      isDone ? 'line-through text-slate-400' : 'text-slate-100'
                                    }`}
                                  >
                                    {task.title}
                                  </h3>

                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      task.priority === 'High'
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                        : task.priority === 'Medium'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>

                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                      task.status === 'Completed'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : task.status === 'In Progress'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}
                                  >
                                    {task.status}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 flex-wrap gap-y-1">
                                  {task.clientName && (
                                    <button
                                      onClick={() => task.clientId && handleClientClick(task.clientId, 'clients')}
                                      className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                                    >
                                      <Building2 className="w-3.5 h-3.5" />
                                      <span>{task.clientName}</span>
                                    </button>
                                  )}

                                  <span className="text-slate-500">•</span>
                                  <span className="text-blue-300 flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {task.assignedTo}
                                  </span>

                                  <span className="text-slate-500">•</span>
                                  <span
                                    className={`flex items-center gap-1 font-mono text-[11px] ${
                                      isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                                    }`}
                                  >
                                    <Calendar className="w-3 h-3 text-white" />
                                    {formatDate(task.dueDate)} {task.dueTime ? `@ ${task.dueTime}` : ''}
                                    {isOverdue && ' (OVERDUE)'}
                                  </span>
                                </div>

                                {(task.description || task.notes) && (
                                  <div className="text-xs text-slate-400 mt-2 bg-[#070d18] p-2 rounded-lg border border-blue-950">
                                    {task.description && <p>{task.description}</p>}
                                    {task.notes && (
                                      <p className="text-[11px] text-amber-200/80 mt-1 italic">
                                        Note: {task.notes}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                              {!isDone && (
                                <button
                                  onClick={() => snoozeTask(task.id, 24)}
                                  title="Snooze 24 Hours"
                                  className="px-2.5 py-1 text-[11px] rounded-lg bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800/80 transition-colors flex items-center gap-1"
                                >
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>Snooze</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditTask(task)}
                                className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-slate-300 hover:text-white border border-blue-800/80 transition-colors"
                                title="Edit task"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              </button>

                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1.5 rounded-lg bg-blue-950 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-blue-800/80 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400 bg-[#070d18]/50 rounded-xl border border-dashed border-blue-900/50">
                      No tasks found in the &quot;{taskSection}&quot; filter. Click &quot;+ Add Task&quot; above to create one.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: User's Priority Alerts */}
            <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-bold text-slate-100">
                      Priority Alerts
                    </h2>
                  </div>
                  <button
                    onClick={() => markAllNotificationsRead(currentUser?.name || 'Dana')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    Clear all
                  </button>
                </div>

                <div className="divide-y divide-blue-900/40 mt-3 max-h-[460px] overflow-y-auto">
                  {myNotifications.length > 0 ? (
                    myNotifications.slice(0, 8).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`py-3 px-2 rounded-xl transition-colors cursor-pointer hover:bg-blue-900/30 ${
                          !notif.isRead ? 'bg-blue-950/60 border-l-2 border-amber-400' : 'opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            {notif.priority === 'High' && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold uppercase">
                                High Priority
                              </span>
                            )}
                            <span className="text-[10px] text-blue-300/80 font-mono">
                              {formatDateTime(notif.createdAt)}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-100 mt-1">
                          {notif.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                          {notif.message}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-400">
                      No active notifications for {currentUser?.name || 'Dana'}.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 bg-[#070d18] border border-blue-900/70 rounded-xl mt-4 text-[11px] text-blue-200/80">
                <div className="flex items-center justify-between font-semibold text-slate-200 mb-1">
                  <span>Discord Notification Bridge</span>
                  <span className="text-emerald-400 font-mono">LIVE</span>
                </div>
                <span>High priority task reminders & approval alerts automatically dispatch to internal Discord channels.</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* AUDIT & CALCULATION BREAKDOWN MODAL */}
      {/* ========================================================================= */}
      <AuditCalculationModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        aggregate={aggregateResult}
        onOpenClient={(clientId) => handleClientClick(clientId, 'clients')}
      />

      {/* ========================================================================= */}
      {/* COMMISSION TO BE COLLECTED DEDICATED AUDIT MODAL */}
      {/* ========================================================================= */}
      <CommissionAuditModal
        isOpen={showCommissionAudit}
        onClose={() => setShowCommissionAudit(false)}
        uncollectedDeals={uncollectedFundedDeals}
        allFundedDeals={allDealSummaries.filter((d) => d.isFunded)}
        totalExpectedCommission={allDealSummaries.filter((d) => d.isFunded).reduce((sum, d) => sum + d.grossCommission, 0)}
        totalCollectedCommission={commissionCollected}
        totalToBeCollected={commissionToBeCollected}
        onSelectDeal={(dealId, clientId) => handleClientClick(clientId, 'clients')}
      />

      {/* ========================================================================= */}
      {/* 5-METRIC DRILLDOWN RECONCILIATION MODAL */}
      {/* ========================================================================= */}
      {drilldownMetric && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setDrilldownMetric(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-[#0c1832] border border-blue-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="p-5 bg-[#081124] border-b border-blue-900 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                      Metric Drilldown & Audit
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-400">Reconciled against live records</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
                    {drilldownMetric === 'ACTIVE_PIPELINE' && (
                      <>
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        ACTIVE PIPELINE — ${activePipeline.toLocaleString()}
                      </>
                    )}
                    {drilldownMetric === 'REQUESTED_FUNDING' && (
                      <>
                        <Inbox className="w-5 h-5 text-blue-400" />
                        REQUESTED FUNDING — ${totalRequestedFunding.toLocaleString()}
                      </>
                    )}
                    {drilldownMetric === 'TOTAL_FUNDED' && (
                      <>
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        TOTAL FUNDED — ${totalFunded.toLocaleString()}
                      </>
                    )}
                    {drilldownMetric === 'COMMISSION_PREDICTION' && (
                      <>
                        <Target className="w-5 h-5 text-amber-400" />
                        EXPECTED COMMISSION — ${commissionExpected.toLocaleString()}
                      </>
                    )}
                    {drilldownMetric === 'COMMISSION_TO_BE_COLLECTED' && (
                      <>
                        <Wallet className="w-5 h-5 text-purple-400" />
                        COMMISSION TO BE COLLECTED — ${commissionToBeCollected.toLocaleString()}
                      </>
                    )}
                    {drilldownMetric === 'COMMISSION_COLLECTED' && (
                      <>
                        <Receipt className="w-5 h-5 text-teal-400" />
                        COMMISSION COLLECTED — ${commissionCollected.toLocaleString()}
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {drilldownMetric === 'ACTIVE_PIPELINE' &&
                      'Deals strictly in PRE-APPROVED or APPROVED lifecycle status.'}
                    {drilldownMetric === 'REQUESTED_FUNDING' &&
                      'Total funding volume requested across all active intake stages and proposals.'}
                    {drilldownMetric === 'TOTAL_FUNDED' &&
                      'All successfully closed deals with status = FUNDED.'}
                    {drilldownMetric === 'COMMISSION_PREDICTION' &&
                      'Commission expected from pre-approved pipeline and funded deals.'}
                    {drilldownMetric === 'COMMISSION_TO_BE_COLLECTED' &&
                      'Remaining unpaid commission on FUNDED deals: Expected Commission - Already Collected.'}
                    {drilldownMetric === 'COMMISSION_COLLECTED' &&
                      'Actual verified received commission distributions logged in the operations database.'}
                  </p>
                </div>

                <button
                  onClick={() => setDrilldownMetric(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                {drilldownMetric === 'ACTIVE_PIPELINE' && (
                  <div>
                    {activePipelineDeals.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        No active pipeline deals currently in Pre-Approval.
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                            <th className="pb-2">Client / Business</th>
                            <th className="pb-2">Product</th>
                            <th className="pb-2">Status</th>
                            <th className="pb-2">Lender</th>
                            <th className="pb-2 text-right">Funding Amount</th>
                            <th className="pb-2 text-right">Fee Rate</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/40 text-slate-200">
                          {activePipelineDeals.map((deal) => (
                            <tr key={deal.id} className="hover:bg-blue-900/20">
                              <td className="py-3">
                                <div className="font-bold text-slate-100">{deal.clientName}</div>
                                <div className="text-[10px] text-slate-400">{deal.businessName}</div>
                              </td>
                              <td className="py-3">
                                <ProductBadge product={deal.product} />
                              </td>
                              <td className="py-3">
                                <StatusBadge status={deal.status} />
                              </td>
                              <td className="py-3 text-slate-300">{deal.lenderName || 'Direct'}</td>
                              <td className="py-3 text-right font-mono font-bold text-cyan-300">
                                ${Number(deal.fundingAmount).toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono text-amber-400">
                                {deal.percentage}%
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setDrilldownMetric(null);
                                    handleClientClick(deal.clientId, 'clients');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                >
                                  Open File
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {drilldownMetric === 'REQUESTED_FUNDING' && (
                  <div>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                          <th className="pb-2">Client / Deal</th>
                          <th className="pb-2">Product</th>
                          <th className="pb-2">Stage</th>
                          <th className="pb-2 text-right">Requested Volume</th>
                          <th className="pb-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-blue-900/40 text-slate-200">
                        {activeDealsList.map((deal) => (
                          <tr key={deal.id} className="hover:bg-blue-900/20">
                            <td className="py-3">
                              <div className="font-bold text-slate-100">{deal.clientName}</div>
                              <div className="text-[10px] text-slate-400">{deal.businessName}</div>
                            </td>
                            <td className="py-3">
                              <ProductBadge product={deal.product} />
                            </td>
                            <td className="py-3">
                              <StatusBadge status={deal.status} />
                            </td>
                            <td className="py-3 text-right font-mono font-bold text-blue-300">
                              ${Number(deal.fundingAmount).toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => {
                                  setDrilldownMetric(null);
                                  handleClientClick(deal.clientId, 'clients');
                                }}
                                className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                              >
                                Open File
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {drilldownMetric === 'TOTAL_FUNDED' && (
                  <div>
                    {fundedDeals.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        No deals marked as FUNDED yet.
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                            <th className="pb-2">Client / Business</th>
                            <th className="pb-2">Product</th>
                            <th className="pb-2">Funding Date</th>
                            <th className="pb-2">Lender</th>
                            <th className="pb-2 text-right">Funded Amount</th>
                            <th className="pb-2 text-right">Commission Status</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/40 text-slate-200">
                          {fundedDeals.map((deal) => (
                            <tr key={deal.id} className="hover:bg-blue-900/20">
                              <td className="py-3">
                                <div className="font-bold text-slate-100">{deal.clientName}</div>
                                <div className="text-[10px] text-slate-400">{deal.businessName}</div>
                              </td>
                              <td className="py-3">
                                <ProductBadge product={deal.product} />
                              </td>
                              <td className="py-3 font-mono text-slate-400">
                                {formatDate(deal.fundingDate, 'Recent')}
                              </td>
                              <td className="py-3 text-slate-300">{deal.lenderName || 'Direct'}</td>
                              <td className="py-3 text-right font-mono font-bold text-emerald-400">
                                ${Number(deal.fundingAmount).toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                                  {deal.commissionStatus || 'PENDING'}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setDrilldownMetric(null);
                                    handleClientClick(deal.clientId, 'clients');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                >
                                  Open File
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {drilldownMetric === 'COMMISSION_PREDICTION' && (
                  <div>
                    {predictiveDeals.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        No active pipeline deals available for commission prediction.
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                            <th className="pb-2">Client / Deal</th>
                            <th className="pb-2">Pipeline Status</th>
                            <th className="pb-2 text-right">Funding Volume</th>
                            <th className="pb-2 text-right">Commission Rate</th>
                            <th className="pb-2 text-right">Expected Commission</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/40 text-slate-200">
                          {predictiveDeals.map((deal) => {
                            const pred = (Number(deal.fundingAmount) * Number(deal.percentage)) / 100;
                            return (
                              <tr key={deal.id} className="hover:bg-blue-900/20">
                                <td className="py-3">
                                  <div className="font-bold text-slate-100">{deal.clientName}</div>
                                  <div className="text-[10px] text-slate-400">{deal.product}</div>
                                </td>
                                <td className="py-3">
                                  <StatusBadge status={deal.status} />
                                </td>
                                <td className="py-3 text-right font-mono text-slate-200">
                                  ${Number(deal.fundingAmount).toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-mono text-amber-400 font-bold">
                                  {deal.percentage}%
                                </td>
                                <td className="py-3 text-right font-mono font-bold text-amber-300">
                                  ${pred.toLocaleString()}
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setDrilldownMetric(null);
                                      handleClientClick(deal.clientId, 'clients');
                                    }}
                                    className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                  >
                                    Open File
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {drilldownMetric === 'COMMISSION_TO_BE_COLLECTED' && (
                  <div>
                    {uncollectedFundedDeals.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                        <div className="text-sm font-bold text-slate-200">No outstanding commissions to be collected.</div>
                        <div className="text-xs text-slate-400">All funded commissions have been fully collected.</div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                              <th className="pb-2">Client Name / Business</th>
                              <th className="pb-2">Deal ID / Position</th>
                              <th className="pb-2">Product</th>
                              <th className="pb-2">Lender</th>
                              <th className="pb-2 text-right">Funded Amount</th>
                              <th className="pb-2 text-right">Commission %</th>
                              <th className="pb-2 text-right">Expected Commission</th>
                              <th className="pb-2 text-right">Commission Collected</th>
                              <th className="pb-2 text-right">Remaining Balance</th>
                              <th className="pb-2 text-center">Commission Status</th>
                              <th className="pb-2 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-900/40 text-slate-200 text-xs">
                            {uncollectedFundedDeals.map((deal) => (
                              <tr key={deal.id} className="hover:bg-blue-900/20">
                                <td className="py-3">
                                  <div className="font-bold text-slate-100">{deal.clientName}</div>
                                  <div className="text-[10px] text-slate-400">{deal.businessName || 'Direct Account'}</div>
                                </td>
                                <td className="py-3 font-mono text-[11px] text-slate-300">
                                  {deal.id.substring(0, 10)}
                                  {deal.isStacked && <span className="ml-1 px-1 py-0.2 rounded bg-purple-900/60 text-purple-200 text-[9px]">Stacked</span>}
                                </td>
                                <td className="py-3">
                                  <ProductBadge product={deal.product} />
                                </td>
                                <td className="py-3 text-slate-300">{deal.lenderName || 'Direct'}</td>
                                <td className="py-3 text-right font-mono text-slate-200 font-bold">
                                  ${Number(deal.fundingAmount).toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-mono text-amber-400 font-bold">
                                  {deal.percentage}%
                                </td>
                                <td className="py-3 text-right font-mono text-slate-300">
                                  ${deal.expectedCommission.toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-mono text-emerald-400">
                                  ${deal.alreadyCollected.toLocaleString()}
                                </td>
                                <td className="py-3 text-right font-mono font-bold text-purple-300">
                                  ${deal.remainingToCollect.toLocaleString()}
                                </td>
                                <td className="py-3 text-center">
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                                    {deal.commissionStatus || 'PENDING'}
                                  </span>
                                </td>
                                <td className="py-3 text-right">
                                  <button
                                    onClick={() => {
                                      setDrilldownMetric(null);
                                      handleClientClick(deal.clientId, 'clients');
                                    }}
                                    className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                  >
                                    Open Deal
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {drilldownMetric === 'COMMISSION_COLLECTED' && (
                  <div>
                    {collectedDeals.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        No collected commission payments recorded yet.
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                            <th className="pb-2">Client / Deal</th>
                            <th className="pb-2 text-right">Funded Amount</th>
                            <th className="pb-2 text-right">Fee %</th>
                            <th className="pb-2 text-right">Actual Collected Amount</th>
                            <th className="pb-2 text-right">Collection Date</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/40 text-slate-200">
                          {collectedDeals.map((deal) => (
                            <tr key={deal.id} className="hover:bg-blue-900/20">
                              <td className="py-3">
                                <div className="font-bold text-slate-100">{deal.clientName}</div>
                                <div className="text-[10px] text-slate-400">
                                  {deal.product} • {deal.lenderName || 'Direct'}
                                </div>
                              </td>
                              <td className="py-3 text-right font-mono text-slate-200">
                                ${Number(deal.fundingAmount).toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono text-amber-400">
                                {deal.percentage}%
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-teal-300">
                                ${deal.actualCollectedAmount.toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono text-slate-400">
                                {formatDate(deal.collectionDate, 'Verified')}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setDrilldownMetric(null);
                                    handleClientClick(deal.clientId, 'clients');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                >
                                  Open File
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASK MODAL (CREATE / EDIT) */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setIsTaskModalOpen(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl bg-[#0e1c38] border border-blue-800 rounded-2xl p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-4 border-b border-blue-900/60">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <h3 className="text-base font-bold">
                    {editingTask ? 'Edit Internal Task' : 'Create New Internal Task'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-blue-900/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveTask} className="mt-4 space-y-4">
                {/* Task Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    placeholder="e.g., Call client to verify payroll stubs"
                    className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Client & Deal Association */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Related Client
                    </label>
                    <select
                      value={taskForm.clientId || ''}
                      onChange={(e) => {
                        const sel = clients.find((c) => c.id === e.target.value);
                        setTaskForm({
                          ...taskForm,
                          clientId: e.target.value,
                          clientName: sel ? `${sel.firstName} ${sel.lastName} (${sel.businessName})` : '',
                        });
                      }}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="">-- No Client (General Task) --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} — {c.businessName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Assigned Staff Member
                    </label>
                    <select
                      value={taskForm.assignedTo || 'Dana'}
                      onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      {staffList.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name} ({s.jobTitle})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due Date & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={taskForm.dueTime || '17:00'}
                      onChange={(e) => setTaskForm({ ...taskForm, dueTime: e.target.value })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={taskForm.priority || 'High'}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as PriorityLevel })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Task Status
                    </label>
                    <select
                      value={taskForm.status || 'To Do'}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Task Description & Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={taskForm.description || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Provide specific notes or action items..."
                    className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-blue-900/60">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-slate-300 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20"
                  >
                    {editingTask ? 'Save Changes' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
