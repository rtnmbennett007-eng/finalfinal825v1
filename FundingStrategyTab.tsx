import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  User,
  Calendar,
  ListTodo,
  CheckSquare,
  Square,
  History,
  Tag,
  FileCheck,
  Building2,
  Layers,
  Edit2,
  ExternalLink,
  X,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Client, FundingStrategyRecord, InternalTask, PriorityLevel } from '../../../types';
import { api } from '../../../services/api';
import { useData } from '../../../context/DataContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { useAuth } from '../../../context/AuthContext';

interface FundingStrategyTabProps {
  client: Client;
  strategies?: FundingStrategyRecord[];
  onStrategyUpdated: () => void;
  onNavigateToTasks?: () => void;
}

export interface NextStepItem {
  id: string;
  text: string;
  assignedTo: string;
  dueDate: string;
  priority: PriorityLevel;
  status: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled';
  isConvertedToTask?: boolean;
  taskId?: string;
  fundingStrategyId?: string;
}

export const FundingStrategyTab: React.FC<FundingStrategyTabProps> = ({
  client,
  strategies = [],
  onStrategyUpdated,
  onNavigateToTasks,
}) => {
  const { addToast, createTask, deleteTask, refreshAll } = useData();
  const { currentUser, staffList } = useAuth();

  const safeStrategies = Array.isArray(strategies) ? strategies : [];
  const activeStrategy = safeStrategies.find((s) => s?.isActive) || safeStrategies[0] || null;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNewStrategyModal, setShowNewStrategyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<FundingStrategyRecord>>({
    currentSituation:
      activeStrategy?.currentSituation ||
      `Client generates $${(client.monthlyRevenue || 75000).toLocaleString()}/mo ($${(client.annualRevenue || 900000).toLocaleString()}/yr) with credit score ${client.creditScore || 710}. Seeking $${(client.requestedAmount || 75000).toLocaleString()} for ${client.useOfFunds || 'expansion capital & equipment financing'}.`,
    strategy:
      activeStrategy?.strategy ||
      'Execute multi-tranche funding stack: Fast-track Revenue Funding (Tranche 1) for immediate working capital within 48 hours, followed by prime Personal/Business Term Loan (Tranche 2) with single-digit APR.',
    productsToPursue:
      activeStrategy?.productsToPursue || 'Revenue Funding, Personal Term Loan, Business Line of Credit',
    problemsToSolve:
      activeStrategy?.problemsToSolve || 'Maintain low monthly debt-service ratio while securing maximum total aggregate funding without triggering excessive bureau inquiries.',
    missingDocuments:
      activeStrategy?.missingDocuments || '4 Months recent business checking bank statements, 2025 W2 / Tax Returns, government-issued photo ID.',
    creditIssues:
      activeStrategy?.creditIssues || 'Ensure all 3 credit bureaus remain unlocked and credit card utilization remains below 20% across all revolving tradelines.',
    lenderStrategy:
      activeStrategy?.lenderStrategy || 'Direct tier-1 routing to Maple Direct Capital & Apex Commercial Partners.',
    assignedTo: activeStrategy?.assignedTo || client.assignedStaff || currentUser?.name || 'Dana',
    priority: activeStrategy?.priority || 'High',
    nextReviewDate:
      activeStrategy?.nextReviewDate ||
      new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0],
    strategyStatus: activeStrategy?.strategyStatus || 'Active',
    strategyNotes: activeStrategy?.strategyNotes || '',
  });

  // Sync state if activeStrategy changes
  useEffect(() => {
    if (activeStrategy) {
      setFormData({
        currentSituation: activeStrategy.currentSituation || '',
        strategy: activeStrategy.strategy || '',
        productsToPursue: activeStrategy.productsToPursue || '',
        problemsToSolve: activeStrategy.problemsToSolve || '',
        missingDocuments: activeStrategy.missingDocuments || '',
        creditIssues: activeStrategy.creditIssues || '',
        lenderStrategy: activeStrategy.lenderStrategy || '',
        assignedTo: activeStrategy.assignedTo || client.assignedStaff || 'Dana',
        priority: activeStrategy.priority || 'High',
        nextReviewDate: activeStrategy.nextReviewDate || new Date().toISOString().split('T')[0],
        strategyStatus: activeStrategy.strategyStatus || 'Active',
        strategyNotes: activeStrategy.strategyNotes || '',
      });
      setNextStepsList(parseNextSteps(activeStrategy.nextSteps || ''));
    }
  }, [activeStrategy?.id, activeStrategy?.updatedAt]);

  // Next Steps parsed list helper
  const parseNextSteps = (raw: string): NextStepItem[] => {
    if (!raw) return [];
    try {
      if (raw.startsWith('[') && raw.endsWith(']')) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any, idx: number) => ({
            id: item.id || `step-${idx}-${Date.now()}`,
            text: item.text || item.action || '',
            assignedTo: item.assignedTo || client.assignedStaff || 'Dana',
            dueDate: item.dueDate || new Date(Date.now() + 3600000 * 24 * (idx + 2)).toISOString().split('T')[0],
            priority: item.priority || 'High',
            status: item.status || 'To Do',
            isConvertedToTask: !!item.isConvertedToTask,
            taskId: item.taskId,
            fundingStrategyId: activeStrategy?.id,
          }));
        }
      }
    } catch {
      // Fallback parse by newlines
    }

    return raw
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line, idx) => {
        const cleaned = line.replace(/^[\d+.-]\s*/, '').trim();
        return {
          id: `step-${idx}-${Date.now()}`,
          text: cleaned,
          assignedTo: client.assignedStaff || 'Dana',
          dueDate: new Date(Date.now() + 3600000 * 24 * (idx + 2)).toISOString().split('T')[0],
          priority: 'High' as PriorityLevel,
          status: 'To Do' as const,
          fundingStrategyId: activeStrategy?.id,
        };
      });
  };

  const [nextStepsList, setNextStepsList] = useState<NextStepItem[]>(() => {
    return parseNextSteps(activeStrategy?.nextSteps || '');
  });

  const [newStepText, setNewStepText] = useState('');
  const [newStepAssignee, setNewStepAssignee] = useState(client.assignedStaff || 'Dana');
  const [newStepPriority, setNewStepPriority] = useState<PriorityLevel>('High');
  const [newStepDueDate, setNewStepDueDate] = useState(
    new Date(Date.now() + 3600000 * 24 * 3).toISOString().split('T')[0]
  );

  // Add Step
  const handleAddNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepText.trim()) return;

    const newStep: NextStepItem = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: newStepText.trim(),
      assignedTo: newStepAssignee,
      dueDate: newStepDueDate,
      priority: newStepPriority,
      status: 'To Do',
      fundingStrategyId: activeStrategy?.id,
    };

    setNextStepsList((prev) => [...prev, newStep]);
    setNewStepText('');
  };

  // Toggle Step Status
  const handleToggleStepStatus = async (stepId: string) => {
    const updated = nextStepsList.map((step) => {
      if (step.id === stepId) {
        const nextStatus =
          step.status === 'Completed'
            ? 'To Do'
            : step.status === 'To Do'
            ? 'In Progress'
            : step.status === 'In Progress'
            ? 'Completed'
            : 'To Do';
        return { ...step, status: nextStatus as any };
      }
      return step;
    });

    setNextStepsList(updated);

    // If active strategy exists, auto-persist Next Steps updates
    try {
      const targetStep = updated.find((s) => s.id === stepId);
      await api.saveFundingStrategy(client.id, {
        ...formData,
        nextSteps: JSON.stringify(updated),
      });

      // If step has a linked task, update task status as well
      if (targetStep?.taskId) {
        await api.updateTask(targetStep.taskId, {
          status: targetStep.status === 'Completed' ? 'Completed' : 'In Progress',
        });
      }

      await refreshAll();
      onStrategyUpdated();
    } catch (err) {
      console.error('Failed to sync step toggle:', err);
    }
  };

  // Update Step Status directly
  const handleSetStepStatus = async (stepId: string, status: 'To Do' | 'In Progress' | 'Completed' | 'Cancelled') => {
    const updated = nextStepsList.map((step) =>
      step.id === stepId ? { ...step, status } : step
    );
    setNextStepsList(updated);

    try {
      const targetStep = updated.find((s) => s.id === stepId);
      await api.saveFundingStrategy(client.id, {
        ...formData,
        nextSteps: JSON.stringify(updated),
      });

      if (targetStep?.taskId) {
        await api.updateTask(targetStep.taskId, {
          status: status === 'Completed' ? 'Completed' : status === 'In Progress' ? 'In Progress' : 'To Do',
        });
      }

      await refreshAll();
      onStrategyUpdated();
    } catch (err) {
      console.error('Failed to update step status:', err);
    }
  };

  // Remove Step
  const handleRemoveStep = (stepId: string) => {
    setNextStepsList((prev) => prev.filter((s) => s.id !== stepId));
  };

  // Convert Next Step to Task
  const handleConvertToTask = async (step: NextStepItem) => {
    try {
      const created = await createTask({
        title: `[Strategy Action] ${step.text} - ${client.firstName} ${client.lastName}`,
        description: `Action step from Funding Strategy for ${client.businessName}.\nClient ID: ${client.id}\nFunding Strategy ID: ${activeStrategy?.id || 'primary'}\nNext Step ID: ${step.id}`,
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        assignedTo: step.assignedTo,
        dueDate: step.dueDate,
        dueTime: '17:00',
        priority: step.priority || formData.priority || 'High',
        status: step.status === 'Completed' ? 'Completed' : 'To Do',
        reminder: '1 hour before',
        notes: `Funding Strategy Action Item for ${client.businessName}`,
      });

      const updated = nextStepsList.map((s) =>
        s.id === step.id ? { ...s, isConvertedToTask: true, taskId: created.id } : s
      );
      setNextStepsList(updated);

      await api.saveFundingStrategy(client.id, {
        ...formData,
        nextSteps: JSON.stringify(updated),
      });

      addToast(
        'success',
        'Task Created from Strategy',
        `Action step assigned to ${step.assignedTo} and logged to My Tasks dashboard.`
      );
      await refreshAll();
      onStrategyUpdated();
    } catch (err: any) {
      addToast('error', 'Task Creation Failed', err.message || 'Could not convert step to task.');
    }
  };

  // Save Strategy
  const handleSaveStrategy = async () => {
    setIsSaving(true);
    try {
      const rawStepsString = JSON.stringify(nextStepsList);

      const payload: Partial<FundingStrategyRecord> = {
        ...formData,
        nextSteps: rawStepsString,
        createdBy: currentUser?.name || 'Staff',
      };

      await api.saveFundingStrategy(client.id, payload);

      addToast(
        'success',
        'Funding Strategy Saved',
        `Active strategy for ${client.firstName} ${client.lastName} saved and synced across all views.`
      );

      setIsEditing(false);
      await refreshAll();
      onStrategyUpdated();
    } catch (err: any) {
      addToast('error', 'Failed to Save Strategy', err.message || 'Error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Strategy
  const handleDeleteStrategy = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteStrategy = async () => {
    setIsSaving(true);
    try {
      await api.saveFundingStrategy(client.id, {
        currentSituation: '',
        strategy: '',
        productsToPursue: '',
        problemsToSolve: '',
        missingDocuments: '',
        creditIssues: '',
        lenderStrategy: '',
        nextSteps: '[]',
        strategyNotes: '',
        strategyStatus: 'Archived',
      });
      addToast('info', 'Strategy Reset', 'Funding strategy record has been cleared.');
      setNextStepsList([]);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      await refreshAll();
      onStrategyUpdated();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete strategy.');
    } finally {
      setIsSaving(false);
    }
  };

  // Create New Fresh Strategy
  const handleCreateNewStrategy = async () => {
    setFormData({
      currentSituation: `Client generates $${(client.monthlyRevenue || 75000).toLocaleString()}/mo with credit score ${client.creditScore || 710}. Seeking $${(client.requestedAmount || 75000).toLocaleString()}.`,
      strategy: 'New multi-stage funding stack tailored to client credit and cashflow profile.',
      productsToPursue: 'Revenue Funding, Personal Term Loan, Business Line of Credit',
      problemsToSolve: 'Optimize tier-1 approval amounts while preserving credit profile.',
      missingDocuments: 'Recent bank statements, ID, voided check.',
      creditIssues: 'Maintain low revolving card balances.',
      lenderStrategy: 'Maple Direct Capital, Apex Commercial Partners.',
      assignedTo: currentUser?.name || 'Dana',
      priority: 'High',
      nextReviewDate: new Date(Date.now() + 3600000 * 24 * 7).toISOString().split('T')[0],
      strategyStatus: 'Active',
      strategyNotes: '',
    });
    setNextStepsList([
      {
        id: `step-1-${Date.now()}`,
        text: 'Conduct detailed underwriting intake call & verify monthly bank deposits',
        assignedTo: client.assignedStaff || 'Dana',
        dueDate: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
        priority: 'High',
        status: 'To Do',
      },
      {
        id: `step-2-${Date.now()}`,
        text: 'Request 4 months full checking statements and driver license',
        assignedTo: client.assignedStaff || 'Dana',
        dueDate: new Date(Date.now() + 3600000 * 24 * 3).toISOString().split('T')[0],
        priority: 'High',
        status: 'To Do',
      },
    ]);
    setIsEditing(true);
    setShowNewStrategyModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Active Strategy Summary */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                {formData.strategyStatus || 'Active'} Strategy
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  formData.priority === 'High'
                    ? 'bg-red-500/15 text-red-300 border border-red-500/30'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}
              >
                {formData.priority} Priority
              </span>
              <span className="text-xs text-slate-400">
                Strategist: <strong className="text-slate-200">{formData.assignedTo}</strong>
              </span>
              <span>•</span>
              <span className="text-xs text-slate-400">
                Next Review: <strong className="text-amber-300 font-mono">{formData.nextReviewDate}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Client Funding Blueprint & Execution Strategy
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Canonical funding strategy record. All changes synchronize across the Client Master 360, Overview, Tasks, Timeline, and Lender submissions.
            </p>
          </div>
        </div>

        {/* Buttons: + ADD STRATEGY, EDIT, SAVE, SAVE CHANGES, DELETE */}
        <div className="flex items-center space-x-2 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={handleCreateNewStrategy}
            className="flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            title="Create a new strategy blueprint"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Strategy</span>
          </button>

          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStrategy}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Strategy</span>
              </button>

              <button
                onClick={handleDeleteStrategy}
                disabled={isSaving}
                className="p-2 bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 border border-blue-900/60 hover:border-red-500/40 rounded-xl text-xs transition-all"
                title="Delete Funding Strategy"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Core Strategy & Next Steps Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Comprehensive Strategy Blueprint */}
        <div className="lg:col-span-2 space-y-6">
          {/* Situation & Core Strategy Box */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              1. Current Situation & Core Funding Strategy
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Client Financial Situation & Cashflow Summary
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.currentSituation}
                    onChange={(e) => setFormData({ ...formData, currentSituation: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    placeholder="Describe revenue stability, credit score, current debt service, and capital goals..."
                  />
                ) : (
                  <div className="p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200 leading-relaxed font-sans">
                    {formData.currentSituation || 'No situation summary logged.'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Funding Strategy & Stacking Architecture
                </label>
                {isEditing ? (
                  <textarea
                    rows={3}
                    value={formData.strategy}
                    onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 font-sans"
                    placeholder="Describe the multi-step strategy, products to pursue, and staging order..."
                  />
                ) : (
                  <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-100 leading-relaxed font-sans font-medium">
                    {formData.strategy || 'No target strategy logged.'}
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-blue-900/40">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Products to Pursue
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.productsToPursue}
                    onChange={(e) => setFormData({ ...formData, productsToPursue: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Revenue Funding, Personal Term Loan, HELOC"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-amber-300 font-medium font-mono">
                    {formData.productsToPursue || 'None specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Lenders & Routing Strategy
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.lenderStrategy}
                    onChange={(e) => setFormData({ ...formData, lenderStrategy: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Direct submission to Maple Direct Capital & Apex"
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200">
                    {formData.lenderStrategy || 'None specified'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Problems to Solve / Underwriting Hurdles
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.problemsToSolve}
                    onChange={(e) => setFormData({ ...formData, problemsToSolve: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Existing SBA loan balance, debt coverage ratio..."
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200">
                    {formData.problemsToSolve || 'None'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Credit Issues & Optimization Required
                </label>
                {isEditing ? (
                  <textarea
                    rows={2}
                    value={formData.creditIssues}
                    onChange={(e) => setFormData({ ...formData, creditIssues: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. Credit bureau freeze, utilization optimization..."
                  />
                ) : (
                  <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200">
                    {formData.creditIssues || 'None'}
                  </div>
                )}
              </div>
            </div>

            {/* Missing Documents Box */}
            <div className="pt-2 border-t border-blue-900/40">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Missing Documents & Pre-Requisites Tracker
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.missingDocuments}
                  onChange={(e) => setFormData({ ...formData, missingDocuments: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. 4 Months Chase Bank Statements, 2025 W2, Voided Check"
                />
              ) : (
                <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200">
                  {formData.missingDocuments || 'All documents complete.'}
                </div>
              )}
            </div>

            {/* Administration & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-blue-900/40">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Strategist</label>
                {isEditing ? (
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:outline-none"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200 font-semibold">
                    {formData.assignedTo}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
                {isEditing ? (
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                ) : (
                  <div className="p-2 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200">
                    {formData.priority}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Next Review Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={formData.nextReviewDate}
                    onChange={(e) => setFormData({ ...formData, nextReviewDate: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                ) : (
                  <div className="p-2 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-200 font-mono">
                    {formData.nextReviewDate}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Strategy Status</label>
                {isEditing ? (
                  <select
                    value={formData.strategyStatus}
                    onChange={(e) => setFormData({ ...formData, strategyStatus: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2 text-xs text-slate-100 focus:outline-none font-bold text-amber-300"
                  >
                    <option value="Active">Active</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                ) : (
                  <div className="p-2 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-amber-300 font-bold">
                    {formData.strategyStatus}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Strategy Notes</label>
              {isEditing ? (
                <textarea
                  rows={2}
                  value={formData.strategyNotes}
                  onChange={(e) => setFormData({ ...formData, strategyNotes: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none"
                  placeholder="Additional operational notes or underwriter instructions..."
                />
              ) : (
                <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-300">
                  {formData.strategyNotes || 'No additional notes.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Next Steps Engine & Task Conversion */}
        <div className="space-y-6">
          {/* Next Steps Card */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo className="w-4 h-4" />
                Next Steps & Actions
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                {nextStepsList.filter((s) => s.status === 'Completed').length} / {nextStepsList.length} Done
              </span>
            </div>

            <p className="text-[11px] text-slate-400">
              Specific action steps to execute this strategy. Click checkbox to toggle status or click{' '}
              <strong className="text-amber-300">Convert to Task</strong> to assign to staff dashboard.
            </p>

            {/* List of Next Steps */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {nextStepsList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 bg-[#070d18] border border-blue-900/40 rounded-xl">
                  No next steps logged yet. Add your first action item below.
                </div>
              ) : (
                nextStepsList.map((step) => {
                  const isDone = step.status === 'Completed';
                  const inProg = step.status === 'In Progress';
                  const isCancelled = step.status === 'Cancelled';

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-800/40 opacity-80'
                          : isCancelled
                          ? 'bg-red-950/20 border-red-800/40 opacity-60'
                          : inProg
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-[#070d18] border-blue-900/50 hover:border-blue-700/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleToggleStepStatus(step.id)}
                          className="mt-0.5 text-slate-400 hover:text-amber-400 transition-colors shrink-0"
                          title="Click to toggle status"
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs font-medium ${
                              isDone ? 'line-through text-slate-400' : isCancelled ? 'line-through text-red-400' : 'text-slate-100'
                            }`}
                          >
                            {step.text}
                          </p>

                          <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-2 flex-wrap gap-y-1">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-blue-400" />
                              {step.assignedTo}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Due: {step.dueDate}
                            </span>
                            <span>•</span>
                            <span
                              className={`font-mono px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                step.priority === 'High'
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'bg-blue-500/20 text-blue-300'
                              }`}
                            >
                              {step.priority}
                            </span>
                            <span>•</span>
                            <select
                              value={step.status}
                              onChange={(e) => handleSetStepStatus(step.id, e.target.value as any)}
                              className="bg-[#070d18] border border-blue-800 rounded px-1.5 py-0.5 text-[9px] text-slate-300"
                            >
                              <option value="To Do">To Do</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveStep(step.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          title="Delete step"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Convert to Task Button */}
                      <div className="mt-2 pt-2 border-t border-blue-900/40 flex items-center justify-between">
                        {step.isConvertedToTask ? (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Synced with Dashboard Tasks
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConvertToTask(step)}
                            className="flex items-center space-x-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg border border-amber-500/30 transition-all"
                          >
                            <span>Convert to Task</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        <button
                          onClick={() => handleToggleStepStatus(step.id)}
                          className="text-[10px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          {isDone ? 'Mark To Do' : 'Mark Done'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Next Step Form */}
            <form onSubmit={handleAddNextStep} className="pt-3 border-t border-blue-900/60 space-y-2.5">
              <div className="text-xs font-bold text-slate-200">+ Add Action Step</div>
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="e.g. Call client for voided check & utility bill..."
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Assignee</label>
                  <select
                    value={newStepAssignee}
                    onChange={(e) => setNewStepAssignee(e.target.value)}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-1.5 text-xs text-slate-100 focus:outline-none"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Priority</label>
                  <select
                    value={newStepPriority}
                    onChange={(e) => setNewStepPriority(e.target.value as any)}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-1.5 text-xs text-slate-100 focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Due Date</label>
                  <input
                    type="date"
                    value={newStepDueDate}
                    onChange={(e) => setNewStepDueDate(e.target.value)}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-1.5 text-xs text-slate-100 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step to Strategy</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Strategy Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDeleteStrategy}
        title="Reset Funding Strategy"
        message="Are you sure you want to delete and reset this client's active Funding Strategy notes and action plans?"
        confirmText="Reset Strategy"
        cancelText="Cancel"
        isLoading={isSaving}
        type="danger"
      />
    </div>
  );
};
