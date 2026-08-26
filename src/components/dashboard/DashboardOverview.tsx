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
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { InternalTask, PriorityLevel, TaskStatus } from '../../types';
import { ClientHealthDashboard } from '../clients/tabs/ClientHealthDashboard';
import { Activity } from 'lucide-react';
import { calculateDashboardMetrics } from '../../utils/dashboardMetrics';
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
    deals,
    commissions,
    tasks,
    notifications,
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

  // Task active section tab
  const [taskSection, setTaskSection] = useState<'HIGH' | 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED' | 'ALL'>('HIGH');
  
  // Dashboard view mode
  const [dashboardMode, setDashboardMode] = useState<'OPERATIONS' | 'HEALTH'>('OPERATIONS');

  // Metric Drilldown Modal State
  const [drilldownMetric, setDrilldownMetric] = useState<
    'ACTIVE_PIPELINE' | 'TOTAL_FUNDED' | 'COMMISSION_PREDICTION' | 'COMMISSION_TO_BE_COLLECTED' | 'COMMISSION_COLLECTED' | null
  >(null);
  
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

  // Centralized Dynamic Metrics
  const {
    activePipeline,
    totalFunded,
    commissionPrediction,
    commissionToBeCollected,
    commissionCollected,
    activePipelineDeals,
    fundedDeals,
    predictiveDeals,
    uncollectedFundedDeals,
    collectedDeals,
  } = useMemo(() => calculateDashboardMetrics(deals, commissions), [deals, commissions]);

  // Action Queues
  const verificationQueue = clients.filter(
    (c) => !c.isVerified && (c.currentStatus.includes('VERIFICATION') || c.currentStatus === 'APPLICATION_RECEIVED')
  );

  const underwritingQueue = clients.filter(
    (c) => c.currentStatus === 'UNDERWRITING' || c.currentStatus === 'READY_FOR_LENDER'
  );

  const handleClientClick = (clientId: string, tab: string = 'clients') => {
    setSelectedClientId(clientId);
    setActiveTab(tab);
  };

  // Date classifications
  const todayStr = new Date().toISOString().split('T')[0];

  // Current user's tasks
  const myTasks = tasks.filter((t) => {
    // Show tasks assigned to current user or all if unassigned
    return !t.assignedTo || t.assignedTo === currentUser?.name || t.assignedTo === 'All';
  });

  const highPriorityTasks = myTasks.filter((t) => t.priority === 'High' && t.status !== 'Completed');
  const todayTasks = myTasks.filter((t) => t.dueDate === todayStr && t.status !== 'Completed');
  const overdueTasks = myTasks.filter((t) => t.dueDate < todayStr && t.status !== 'Completed');
  const upcomingTasks = myTasks.filter((t) => t.dueDate > todayStr && t.status !== 'Completed');
  const completedTasks = myTasks.filter((t) => t.status === 'Completed');

  // Filtered task list based on active tab
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
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0e1c38] border border-blue-900/60 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase font-mono tracking-wider">
              Operational Command Center
            </span>
            <span className="text-xs text-blue-400/50">•</span>
            <span className="text-xs text-blue-200/80">Maple X Financial Internal OS</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1.5 flex items-center gap-2">
            <span className="text-amber-400">MAPLE X</span> Financial Operations
          </h1>
          <p className="text-xs text-blue-200/70 mt-0.5">
            Full lifecycle deal tracking from lead intake to multi-participant commission settlement.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-[#070d18] p-1 rounded-xl border border-blue-900/60 text-xs">
            <button
              onClick={() => setDashboardMode('OPERATIONS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dashboardMode === 'OPERATIONS'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Operations & Tasks
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
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-blue-200 rounded-xl text-xs font-semibold border border-blue-800 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add Lead</span>
          </button>
          <button
            onClick={onOpenNewClientModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>Create Client File</span>
          </button>
        </div>
      </div>

      {dashboardMode === 'HEALTH' ? (
        <ClientHealthDashboard setActiveTab={setActiveTab} />
      ) : (
        <>

      {/* Top 5 Primary Metrics Grid (Exact Requirements) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. ACTIVE PIPELINE */}
        <div
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
            <span>{activePipelineDeals.length} active deals</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToReports) {
                  onNavigateToReports({ view: 'overview', stage: 'ACTIVE_PIPELINE', quickPreset: 'ACTIVE_PIPELINE' });
                } else {
                  setDrilldownMetric('ACTIVE_PIPELINE');
                }
              }}
              className="flex items-center gap-0.5 text-[10px] text-cyan-300 font-semibold hover:underline"
            >
              Filter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. TOTAL FUNDED */}
        <div
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
            <span>{fundedDeals.length} deals funded</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToReports) {
                  onNavigateToReports({ view: 'funding', stage: 'FUNDED', quickPreset: 'FUNDED' });
                } else {
                  setDrilldownMetric('TOTAL_FUNDED');
                }
              }}
              className="flex items-center gap-0.5 text-[10px] text-emerald-300 font-semibold hover:underline"
            >
              Filter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 3. COMMISSION PREDICTION */}
        <div
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
            <span>Active pipeline only</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToReports) {
                  onNavigateToReports({ view: 'commission', stage: 'ACTIVE_PIPELINE' });
                } else {
                  setDrilldownMetric('COMMISSION_PREDICTION');
                }
              }}
              className="flex items-center gap-0.5 text-[10px] text-amber-300 font-semibold hover:underline"
            >
              Filter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 4. COMMISSION TO BE COLLECTED */}
        <div
          onClick={() => setDrilldownMetric('COMMISSION_TO_BE_COLLECTED')}
          className="bg-[#0e1c38] border border-blue-900/70 hover:border-purple-500/70 p-4.5 rounded-2xl shadow-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-purple-500/10 group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-purple-300 uppercase">
                Commission to be Collected
              </span>
              <div className="p-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-300 mt-2.5 font-mono tracking-tight group-hover:text-purple-200 transition-colors">
              ${commissionToBeCollected.toLocaleString()}
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-purple-300/90 font-medium">
            <span>{uncollectedFundedDeals.length} pending payouts</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToReports) {
                  onNavigateToReports({ view: 'commission', stage: 'FUNDED', quickPreset: 'UNCOLLECTED_COMMISSION' });
                } else {
                  setDrilldownMetric('COMMISSION_TO_BE_COLLECTED');
                }
              }}
              className="flex items-center gap-0.5 text-[10px] text-purple-300 font-semibold hover:underline"
            >
              Filter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 5. COMMISSION COLLECTED */}
        <div
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
            <span>Actual money received</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onNavigateToReports) {
                  onNavigateToReports({ view: 'commission', stage: 'FUNDED', quickPreset: 'COLLECTED_COMMISSION' });
                } else {
                  setDrilldownMetric('COMMISSION_COLLECTED');
                }
              }}
              className="flex items-center gap-0.5 text-[10px] text-teal-300 font-semibold hover:underline"
            >
              Filter <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REQUIREMENT 3: MY TASKS & NOTIFICATIONS (DEDICATED TO LOGGED IN USER) */}
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
                    MY TASKS & NOTIFICATIONS
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                    {currentUser?.name || 'Dana'}
                  </span>
                </div>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  High-priority tasks always prioritized at the top. Real-time Firebase synchronized.
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
                <Calendar className="w-3.5 h-3.5" />
                <span>UPCOMING</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-950 text-slate-300 font-mono">
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
                <span>ALL TASKS</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-400 font-mono">
                  {myTasks.length}
                </span>
              </button>
            </div>

            {/* Task Item Cards */}
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
                        {/* Title & Client details */}
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

                              {/* Priority Badge */}
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

                              {/* Status Badge */}
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  task.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : task.status === 'In Progress'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                    : task.status === 'Snoozed'
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {task.status}
                              </span>
                            </div>

                            {/* Client / Deal link */}
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

                              {task.dealName && (
                                <span className="text-emerald-400 font-mono text-[11px]">
                                  Deal: {task.dealName}
                                </span>
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
                                <Calendar className="w-3 h-3" />
                                {formatDate(task.dueDate)} {task.dueTime ? `@ ${task.dueTime}` : ''}
                                {isOverdue && ' (OVERDUE)'}
                              </span>

                              {task.reminder && task.reminder !== 'None' && (
                                <>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-amber-300/80 text-[11px] flex items-center gap-1">
                                    <Bell className="w-3 h-3" />
                                    {task.reminder}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Task Description / Notes */}
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

                        {/* Interactive Task Actions */}
                        <div className="flex items-center space-x-1.5 self-end sm:self-center shrink-0">
                          {/* Quick Snooze */}
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

                          {/* Edit Task */}
                          <button
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-slate-300 hover:text-white border border-blue-800/80 transition-colors"
                            title="Edit task"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {/* Delete Task */}
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

        {/* Right Column: User's High Priority Notifications & Action Alerts */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-slate-100">
                  Priority Alerts & Activity
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

      {/* Action Queues Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Queue */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
            <div className="flex items-center space-x-2">
              <FileCheck2 className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Verification Action Queue ({verificationQueue.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('verification')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Open Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-blue-900/40 mt-3">
            {verificationQueue.length > 0 ? (
              verificationQueue.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client.id, 'verification')}
                  className="py-3 flex items-center justify-between hover:bg-blue-900/30 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {client.businessName} • Credit Score: {client.creditScore || 'N/A'}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={client.currentStatus} />
                    <div className="text-[10px] text-slate-400 mt-1">
                      Assigned: {client.assignedStaff}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No clients currently waiting for initial verification.
              </div>
            )}
          </div>
        </div>

        {/* Underwriting Queue */}
        <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md">
          <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
            <div className="flex items-center space-x-2">
              <Scale className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Underwriting & Stacking Queue ({underwritingQueue.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('underwriting')}
              className="text-xs text-purple-300 hover:text-purple-200 font-semibold flex items-center gap-1"
            >
              <span>Open Hub</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-blue-900/40 mt-3">
            {underwritingQueue.length > 0 ? (
              underwritingQueue.slice(0, 5).map((client) => (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client.id, 'underwriting')}
                  className="py-3 flex items-center justify-between hover:bg-blue-900/30 px-2 rounded-xl cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-semibold text-slate-100">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {client.businessName} • Rev: ${client.annualRevenue?.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={client.currentStatus} />
                    <div className="text-[10px] text-purple-300 font-mono mt-1">
                      Ready for submissions
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No files pending active underwriting review.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Funding Deals Pipeline */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between pb-4 border-b border-blue-900/50">
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Active Funding Pipeline
            </h2>
            <p className="text-xs text-blue-200/70">
              Latest deals across 0% Business Cards, Term Loans, SBA, Equipment, and Lines of Credit.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('funding')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>View Full Pipeline</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-blue-900/60 text-slate-400 font-semibold">
                <th className="pb-3">Client</th>
                <th className="pb-3">Product</th>
                <th className="pb-3">Lender</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Points (%)</th>
                <th className="pb-3">Total Fee</th>
                <th className="pb-3">Deal Status</th>
                <th className="pb-3">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/40 text-slate-200">
              {deals.slice(0, 6).map((deal) => {
                const totalFee = (Number(deal.fundingAmount) * Number(deal.percentage)) / 100;
                return (
                  <tr
                    key={deal.id}
                    onClick={() => handleClientClick(deal.clientId, 'clients')}
                    className="hover:bg-blue-900/30 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-semibold text-slate-100">
                      {deal.clientName}
                    </td>
                    <td className="py-3">
                      <ProductBadge product={deal.product} />
                    </td>
                    <td className="py-3 text-slate-300 font-medium">
                      {deal.lenderName || 'Multiple'}
                    </td>
                    <td className="py-3 font-mono font-bold text-slate-100">
                      ${Number(deal.fundingAmount).toLocaleString()}
                    </td>
                    <td className="py-3 font-mono text-amber-400 font-bold">
                      {deal.percentage}%
                    </td>
                    <td className="py-3 font-mono text-emerald-400 font-bold">
                      ${totalFee.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={deal.status} />
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          deal.commissionStatus === 'COLLECTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : deal.commissionStatus === 'DISTRIBUTED'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {deal.commissionStatus || 'PENDING'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
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

                {/* Priority, Status, Reminder */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Priority Level
                    </label>
                    <select
                      value={taskForm.priority || 'High'}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={taskForm.status || 'To Do'}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as any })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="To Do">To Do</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Snoozed">Snoozed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Reminder Alarm
                    </label>
                    <select
                      value={taskForm.reminder || '1 hour before'}
                      onChange={(e) => setTaskForm({ ...taskForm, reminder: e.target.value as any })}
                      className="w-full bg-[#070d18] border border-blue-900 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <option value="15 minutes before">15 minutes before</option>
                      <option value="30 minutes before">30 minutes before</option>
                      <option value="1 hour before">1 hour before</option>
                      <option value="1 day before">1 day before</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Task Description / Action Required
                  </label>
                  <textarea
                    rows={2}
                    value={taskForm.description || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    placeholder="Provide specific instructions or details for this task..."
                    className="w-full bg-[#070d18] border border-blue-900 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Internal Notes / Comments
                  </label>
                  <textarea
                    rows={2}
                    value={taskForm.notes || ''}
                    onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                    placeholder="Add any progress updates, observations, or follow-up notes..."
                    className="w-full bg-[#070d18] border border-blue-900 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-blue-900/60">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md shadow-amber-500/20"
                  >
                    <Save className="w-4 h-4 text-slate-950" />
                    <span>Save Task Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
                    {drilldownMetric === 'TOTAL_FUNDED' && (
                      <>
                        <DollarSign className="w-5 h-5 text-emerald-400" />
                        TOTAL FUNDED — ${totalFunded.toLocaleString()}
                      </>
                    )}
                    {drilldownMetric === 'COMMISSION_PREDICTION' && (
                      <>
                        <Target className="w-5 h-5 text-amber-400" />
                        COMMISSION PREDICTION — ${commissionPrediction.toLocaleString()}
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
                      'Deals strictly in UNDERWRITING, PRE-APPROVED, or PRE-APPROVAL. (Closed, Funded, Lost, or Declined excluded).'}
                    {drilldownMetric === 'TOTAL_FUNDED' &&
                      'All successfully closed deals with status = FUNDED.'}
                    {drilldownMetric === 'COMMISSION_PREDICTION' &&
                      'Calculated strictly from Active Pipeline deals: Funding Amount × Commission %.'}
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
                        No active pipeline deals currently in Underwriting or Pre-Approval.
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
                                  Open 360 File
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
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
                                  Open 360 File
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
                            <th className="pb-2 text-right">Predicted Commission</th>
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
                                    Open 360 File
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
                      <div className="py-12 text-center text-slate-400">
                        All commissions on funded deals have been fully collected! ($0 remaining).
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                            <th className="pb-2">Client / Deal</th>
                            <th className="pb-2 text-right">Funded Amount</th>
                            <th className="pb-2 text-right">Expected Commission</th>
                            <th className="pb-2 text-right">Already Collected</th>
                            <th className="pb-2 text-right">Remaining to Collect</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/40 text-slate-200">
                          {uncollectedFundedDeals.map((deal) => (
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
                              <td className="py-3 text-right font-mono text-slate-300">
                                ${deal.expectedCommission.toLocaleString()} ({deal.percentage}%)
                              </td>
                              <td className="py-3 text-right font-mono text-emerald-400">
                                ${deal.alreadyCollected.toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-purple-300">
                                ${deal.remainingToCollect.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setDrilldownMetric(null);
                                    handleClientClick(deal.clientId, 'clients');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                >
                                  Open 360 File
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {drilldownMetric === 'COMMISSION_COLLECTED' && (
                  <div>
                    {collectedDeals.length === 0 ? (
                      <div className="py-12 text-center text-slate-400">
                        No received commission transactions recorded yet.
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-blue-900/60 text-slate-400 font-semibold text-[11px]">
                            <th className="pb-2">Client / Deal</th>
                            <th className="pb-2">Lender</th>
                            <th className="pb-2">Collection Date</th>
                            <th className="pb-2 text-right">Funded Amount</th>
                            <th className="pb-2 text-right">Actual Received Amount</th>
                            <th className="pb-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/40 text-slate-200">
                          {collectedDeals.map((deal) => (
                            <tr key={deal.id} className="hover:bg-blue-900/20">
                              <td className="py-3">
                                <div className="font-bold text-slate-100">{deal.clientName}</div>
                                <div className="text-[10px] text-slate-400">{deal.product}</div>
                              </td>
                              <td className="py-3 text-slate-300">{deal.lenderName || 'Direct'}</td>
                              <td className="py-3 font-mono text-slate-400">
                                {formatDate(deal.collectionDate, 'Recorded')}
                              </td>
                              <td className="py-3 text-right font-mono text-slate-200">
                                ${Number(deal.fundingAmount).toLocaleString()}
                              </td>
                              <td className="py-3 text-right font-mono font-bold text-teal-300">
                                ${deal.actualCollectedAmount.toLocaleString()}
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => {
                                    setDrilldownMetric(null);
                                    handleClientClick(deal.clientId, 'clients');
                                  }}
                                  className="px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600 text-blue-200 hover:text-white font-semibold text-[11px] transition-colors"
                                >
                                  Open 360 File
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

              {/* Modal Footer */}
              <div className="p-4 bg-[#081124] border-t border-blue-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const metric = drilldownMetric;
                      setDrilldownMetric(null);
                      if (onNavigateToReports) {
                        if (metric === 'ACTIVE_PIPELINE') onNavigateToReports({ view: 'overview', stage: 'ACTIVE_PIPELINE', quickPreset: 'ACTIVE_PIPELINE' });
                        else if (metric === 'TOTAL_FUNDED') onNavigateToReports({ view: 'funding', stage: 'FUNDED', quickPreset: 'FUNDED' });
                        else if (metric === 'COMMISSION_PREDICTION') onNavigateToReports({ view: 'commission', stage: 'ACTIVE_PIPELINE' });
                        else if (metric === 'COMMISSION_TO_BE_COLLECTED') onNavigateToReports({ view: 'commission', stage: 'FUNDED', quickPreset: 'UNCOLLECTED_COMMISSION' });
                        else if (metric === 'COMMISSION_COLLECTED') onNavigateToReports({ view: 'commission', stage: 'FUNDED', quickPreset: 'COLLECTED_COMMISSION' });
                      } else {
                        setActiveTab('reports');
                      }
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-amber-950/40"
                  >
                    <span>Open in Operations Reports</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setDrilldownMetric(null);
                      setActiveTab('funding');
                    }}
                    className="px-4 py-2 bg-blue-900/40 hover:bg-blue-900 text-blue-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Funding Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => setDrilldownMetric(null)}
                  className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Close Audit View
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
