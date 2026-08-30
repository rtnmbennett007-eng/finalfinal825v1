import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Mail,
  DollarSign,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  ListTodo,
  Layers,
  Sparkles,
  GripVertical,
  Loader2,
} from 'lucide-react';
import {
  Client,
  FundingDeal,
  InternalTask,
  CANONICAL_PIPELINE_STAGES,
  CanonicalPipelineStage,
  normalizePipelineStage,
  PipelineStage,
  formatFundingRange,
} from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useData } from '../../context/DataContext';

interface ClientsKanbanViewProps {
  clients: Client[];
  deals: FundingDeal[];
  tasks: InternalTask[];
  onSelectClient: (clientId: string) => void;
  statusFilter?: string;
}

interface DragState {
  clientId: string;
  sourceStage: CanonicalPipelineStage;
}

const STAGE_THEMES: Record<
  CanonicalPipelineStage,
  {
    border: string;
    bgHeader: string;
    badgeBg: string;
    badgeText: string;
    accent: string;
    dot: string;
  }
> = {
  'No Set – Follow Up': {
    border: 'border-slate-800',
    bgHeader: 'bg-slate-900/90',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-300',
    accent: 'text-slate-400',
    dot: 'bg-slate-400',
  },
  'Application Received': {
    border: 'border-sky-900/50',
    bgHeader: 'bg-sky-950/40',
    badgeBg: 'bg-sky-900/50',
    badgeText: 'text-sky-300',
    accent: 'text-sky-400',
    dot: 'bg-sky-400',
  },
  'Credit Pulled': {
    border: 'border-indigo-900/50',
    bgHeader: 'bg-indigo-950/40',
    badgeBg: 'bg-indigo-900/50',
    badgeText: 'text-indigo-300',
    accent: 'text-indigo-400',
    dot: 'bg-indigo-400',
  },
  'Documents Pending': {
    border: 'border-amber-900/60',
    bgHeader: 'bg-amber-950/50',
    badgeBg: 'bg-amber-900/60',
    badgeText: 'text-amber-200',
    accent: 'text-amber-400',
    dot: 'bg-amber-400',
  },
  'Documents Received': {
    border: 'border-teal-900/50',
    bgHeader: 'bg-teal-950/40',
    badgeBg: 'bg-teal-900/50',
    badgeText: 'text-teal-300',
    accent: 'text-teal-400',
    dot: 'bg-teal-400',
  },
  'Pre-Approved': {
    border: 'border-cyan-900/50',
    bgHeader: 'bg-cyan-950/40',
    badgeBg: 'bg-cyan-900/50',
    badgeText: 'text-cyan-300',
    accent: 'text-cyan-400',
    dot: 'bg-cyan-400',
  },
  'Verification Call': {
    border: 'border-blue-900/60',
    bgHeader: 'bg-blue-950/50',
    badgeBg: 'bg-blue-900/60',
    badgeText: 'text-blue-200',
    accent: 'text-blue-400',
    dot: 'bg-blue-400',
  },
  'KYC Verified & Ready for Underwriting': {
    border: 'border-emerald-900/60',
    bgHeader: 'bg-emerald-950/50',
    badgeBg: 'bg-emerald-900/60',
    badgeText: 'text-emerald-200',
    accent: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  'Underwriting': {
    border: 'border-purple-900/60',
    bgHeader: 'bg-purple-950/50',
    badgeBg: 'bg-purple-900/60',
    badgeText: 'text-purple-200',
    accent: 'text-purple-400',
    dot: 'bg-purple-400',
  },
  'Ready for Lender / Stacking': {
    border: 'border-violet-900/60',
    bgHeader: 'bg-violet-950/50',
    badgeBg: 'bg-violet-900/60',
    badgeText: 'text-violet-200',
    accent: 'text-violet-400',
    dot: 'bg-violet-400',
  },
  'Submitted': {
    border: 'border-blue-800/60',
    bgHeader: 'bg-blue-950/40',
    badgeBg: 'bg-blue-800/60',
    badgeText: 'text-blue-100',
    accent: 'text-blue-300',
    dot: 'bg-blue-300',
  },
  'Approved': {
    border: 'border-emerald-800/70',
    bgHeader: 'bg-emerald-950/50',
    badgeBg: 'bg-emerald-800/60',
    badgeText: 'text-emerald-200',
    accent: 'text-emerald-400',
    dot: 'bg-emerald-400',
  },
  'Pre-Closing Checklist': {
    border: 'border-yellow-900/60',
    bgHeader: 'bg-yellow-950/40',
    badgeBg: 'bg-yellow-900/60',
    badgeText: 'text-yellow-200',
    accent: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  'Closing Docs Signed': {
    border: 'border-emerald-900/70',
    bgHeader: 'bg-emerald-950/60',
    badgeBg: 'bg-emerald-900/70',
    badgeText: 'text-emerald-100',
    accent: 'text-emerald-300',
    dot: 'bg-emerald-300',
  },
  'Ready to Fund': {
    border: 'border-lime-900/70',
    bgHeader: 'bg-lime-950/50',
    badgeBg: 'bg-lime-900/60',
    badgeText: 'text-lime-200',
    accent: 'text-lime-400',
    dot: 'bg-lime-400',
  },
  'Funded': {
    border: 'border-emerald-800/80',
    bgHeader: 'bg-emerald-950/70',
    badgeBg: 'bg-emerald-700/80',
    badgeText: 'text-white',
    accent: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
  'Commission Pending': {
    border: 'border-amber-800/70',
    bgHeader: 'bg-amber-950/40',
    badgeBg: 'bg-amber-800/60',
    badgeText: 'text-amber-100',
    accent: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  'Commission Received': {
    border: 'border-emerald-700/80',
    bgHeader: 'bg-emerald-900/40',
    badgeBg: 'bg-emerald-800/60',
    badgeText: 'text-emerald-100',
    accent: 'text-emerald-300',
    dot: 'bg-emerald-300',
  },
  'Not Qualified': {
    border: 'border-rose-950/60',
    bgHeader: 'bg-rose-950/40',
    badgeBg: 'bg-rose-900/40',
    badgeText: 'text-rose-300',
    accent: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  'Declined': {
    border: 'border-rose-900/70',
    bgHeader: 'bg-rose-950/50',
    badgeBg: 'bg-rose-900/60',
    badgeText: 'text-rose-200',
    accent: 'text-rose-400',
    dot: 'bg-rose-400',
  },
  'Withdrawn': {
    border: 'border-slate-800',
    bgHeader: 'bg-slate-900/80',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-400',
    accent: 'text-slate-500',
    dot: 'bg-slate-500',
  },
  'Lost': {
    border: 'border-slate-900',
    bgHeader: 'bg-slate-950/60',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-slate-500',
    accent: 'text-slate-500',
    dot: 'bg-slate-600',
  },
};

export const ClientsKanbanView: React.FC<ClientsKanbanViewProps> = ({
  clients,
  deals,
  tasks,
  onSelectClient,
  statusFilter = 'ALL',
}) => {
  const { updateClient, addToast } = useData();

  const [draggedItem, setDraggedItem] = useState<DragState | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CanonicalPipelineStage | null>(null);
  const [savingClientIds, setSavingClientIds] = useState<Record<string, boolean>>({});
  // Optimistic stage overrides: clientId -> CanonicalPipelineStage
  const [optimisticStages, setOptimisticStages] = useState<Record<string, CanonicalPipelineStage>>({});

  // Group clients by canonical pipeline stage
  const columnsData = React.useMemo(() => {
    const stageMap = {} as Record<CanonicalPipelineStage, Client[]>;
    CANONICAL_PIPELINE_STAGES.forEach((st) => {
      stageMap[st] = [];
    });

    clients.forEach((client) => {
      const activeStage = optimisticStages[client.id] || normalizePipelineStage(client.currentStatus);
      if (stageMap[activeStage]) {
        stageMap[activeStage].push(client);
      } else {
        stageMap['No Set – Follow Up'].push(client);
      }
    });

    return stageMap;
  }, [clients, optimisticStages]);

  const handleDragStart = (e: React.DragEvent, client: Client, stage: CanonicalPipelineStage) => {
    e.dataTransfer.setData('text/plain', client.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItem({ clientId: client.id, sourceStage: stage });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stage: CanonicalPipelineStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stage: CanonicalPipelineStage) => {
    e.preventDefault();
    if (dragOverStage === stage) {
      setDragOverStage(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStage: CanonicalPipelineStage) => {
    e.preventDefault();
    setDragOverStage(null);

    const clientId = e.dataTransfer.getData('text/plain') || draggedItem?.clientId;
    if (!clientId) return;

    const client = clients.find((c) => c.id === clientId);
    if (!client) return;

    const prevStage = optimisticStages[clientId] || normalizePipelineStage(client.currentStatus);
    if (prevStage === targetStage) return;

    // Apply optimistic update immediately
    setOptimisticStages((prev) => ({ ...prev, [clientId]: targetStage }));
    setSavingClientIds((prev) => ({ ...prev, [clientId]: true }));

    try {
      await updateClient(clientId, {
        currentStatus: targetStage as PipelineStage,
      });

      addToast(
        'success',
        'Pipeline Stage Updated',
        `${client.firstName} ${client.lastName} moved to "${targetStage}".`
      );
    } catch (err: any) {
      // Revert optimistic stage on error
      setOptimisticStages((prev) => {
        const next = { ...prev };
        delete next[clientId];
        return next;
      });

      addToast(
        'error',
        'Stage Update Failed',
        err?.message || 'Could not persist pipeline stage change to database.'
      );
    } finally {
      setSavingClientIds((prev) => {
        const next = { ...prev };
        delete next[clientId];
        return next;
      });
      setDraggedItem(null);
    }
  };

  const handleMoveStage = async (client: Client, targetStage: CanonicalPipelineStage) => {
    const prevStage = optimisticStages[client.id] || normalizePipelineStage(client.currentStatus);
    if (prevStage === targetStage) return;

    setOptimisticStages((prev) => ({ ...prev, [client.id]: targetStage }));
    setSavingClientIds((prev) => ({ ...prev, [client.id]: true }));

    try {
      await updateClient(client.id, {
        currentStatus: targetStage as PipelineStage,
      });
      addToast(
        'success',
        'Pipeline Stage Updated',
        `${client.firstName} ${client.lastName} moved to "${targetStage}".`
      );
    } catch (err: any) {
      setOptimisticStages((prev) => {
        const next = { ...prev };
        delete next[client.id];
        return next;
      });
      addToast(
        'error',
        'Stage Update Failed',
        err?.message || 'Could not persist pipeline stage change.'
      );
    } finally {
      setSavingClientIds((prev) => {
        const next = { ...prev };
        delete next[client.id];
        return next;
      });
    }
  };

  // Helper to format date
  const formatActivityDate = (dateStr?: string) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="w-full">
      {/* Board Scroll Container */}
      <div className="overflow-x-auto pb-6 pt-1 custom-scrollbar">
        <div className="flex gap-4 min-w-max items-start">
          {CANONICAL_PIPELINE_STAGES.map((stageName, index) => {
            const stageClients = columnsData[stageName] || [];
            const theme = STAGE_THEMES[stageName] || STAGE_THEMES['No Set – Follow Up'];
            const isDragTarget = dragOverStage === stageName;
            const isFilterMatch = statusFilter === 'ALL' || statusFilter === stageName;

            // Total stage active volume
            const stageTotalVolume = stageClients.reduce((sum, client) => {
              const clientDeals = deals.filter((d) => d.clientId === client.id);
              const vol = clientDeals.reduce((dSum, d) => dSum + Number(d.fundingAmount || 0), 0);
              return sum + vol;
            }, 0);

            return (
              <div
                key={stageName}
                onDragOver={(e) => handleDragOver(e, stageName)}
                onDragLeave={(e) => handleDragLeave(e, stageName)}
                onDrop={(e) => handleDrop(e, stageName)}
                className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all duration-200 ${
                  theme.border
                } ${
                  isDragTarget
                    ? 'ring-2 ring-blue-400/80 bg-blue-950/30 border-blue-400 scale-[1.01]'
                    : isFilterMatch
                    ? 'bg-slate-900/60'
                    : 'bg-slate-900/30 opacity-70'
                }`}
              >
                {/* Column Header */}
                <div
                  className={`p-3.5 border-b rounded-t-2xl flex items-center justify-between ${
                    theme.border
                  } ${theme.bgHeader}`}
                >
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${theme.dot}`} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">
                          #{index + 1}
                        </span>
                        <h3 className="text-xs font-bold text-slate-100 tracking-wide">
                          {stageName}
                        </h3>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        ${stageTotalVolume.toLocaleString()} Vol
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold border border-slate-700 ${theme.badgeBg} ${theme.badgeText}`}
                  >
                    {stageClients.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="p-2.5 space-y-2.5 min-h-[500px] max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar flex flex-col">
                  {stageClients.length === 0 ? (
                    <div
                      className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center text-[11px] transition-colors ${
                        isDragTarget
                          ? 'border-blue-400/60 bg-blue-500/10 text-blue-300'
                          : 'border-slate-800/80 text-slate-600'
                      }`}
                    >
                      <Layers className="w-5 h-5 mb-1.5 opacity-40" />
                      <span>Drop clients here</span>
                    </div>
                  ) : (
                    stageClients.map((client) => {
                      const clientDeals = deals.filter((d) => d.clientId === client.id);
                      const totalVolume = clientDeals.reduce(
                        (sum, d) => sum + Number(d.fundingAmount || 0),
                        0
                      );

                      // Find next upcoming task
                      const clientTasks = tasks.filter(
                        (t) => t.clientId === client.id && t.status !== 'Completed'
                      );
                      const nextTask = clientTasks[0];

                      const isSaving = savingClientIds[client.id];
                      const isBeingDragged = draggedItem?.clientId === client.id;

                      return (
                        <div
                          key={client.id}
                          draggable={!isSaving}
                          onDragStart={(e) => handleDragStart(e, client, stageName)}
                          onDragEnd={handleDragEnd}
                          onClick={() => onSelectClient(client.id)}
                          className={`bg-[#0b1528] border border-slate-800/90 hover:border-blue-500/50 rounded-xl p-3.5 shadow-md hover:shadow-lg transition-all duration-150 cursor-grab active:cursor-grabbing group relative ${
                            isBeingDragged ? 'opacity-40 scale-95 border-dashed border-blue-400' : ''
                          } ${isSaving ? 'pointer-events-none ring-1 ring-blue-500' : ''}`}
                        >
                          {/* Saving Overlay */}
                          {isSaving && (
                            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs rounded-xl flex items-center justify-center gap-2 z-10 text-xs font-semibold text-blue-300">
                              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              <span>Saving stage...</span>
                            </div>
                          )}

                          {/* Card Header: Client Name & Drag Handle */}
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate flex items-center gap-1.5">
                                <span>
                                  {client.firstName} {client.lastName}
                                </span>
                              </h4>
                              <div className="text-[11px] font-semibold text-blue-400 truncate mt-0.5">
                                {client.businessName || 'Business Entity'}
                              </div>
                            </div>
                            <div className="text-slate-600 group-hover:text-slate-400 p-0.5">
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Contact & Deal Overview */}
                          <div className="mt-2 space-y-1 text-[10px]">
                            {/* Product & Requested Target Range */}
                            <div className="flex items-center justify-between gap-1 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                              <span className="text-amber-400 font-semibold truncate max-w-[120px]">
                                {client.requestedProduct || clientDeals[0]?.product || 'Revenue Funding'}
                              </span>
                              <span className="font-mono font-semibold text-blue-300 text-[10px]">
                                {formatFundingRange(
                                  client.requestedFundingMin ?? client.requestedAmountMin,
                                  client.requestedFundingMax ?? client.requestedAmountMax,
                                  client.requestedFundingRange ?? client.requestedAmount
                                )}
                              </span>
                            </div>

                            {client.email && (
                              <div className="flex items-center gap-1.5 truncate text-slate-400">
                                <Mail className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-1.5 truncate text-slate-400">
                                <Phone className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Metrics Grid: Revenue & Active Funding */}
                          <div className="mt-2 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-mono">
                                Annual Rev
                              </span>
                              <span className="font-mono font-bold text-emerald-400">
                                {client.annualRevenue
                                  ? `$${Number(client.annualRevenue).toLocaleString()}`
                                  : '$0'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block text-[9px] uppercase font-mono">
                                Active Deals ({clientDeals.length})
                              </span>
                              <span className="font-mono font-bold text-slate-200">
                                ${totalVolume.toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Verification & Staff */}
                          <div className="mt-2 flex items-center justify-between gap-1 text-[10px] pt-2 border-t border-slate-800/60">
                            {client.isVerified ? (
                              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                <AlertCircle className="w-2.5 h-2.5 text-amber-400" />
                                Pending Call
                              </span>
                            )}

                            <span className="text-slate-400 font-medium truncate">
                              Staff: <strong className="text-slate-200">{client.assignedStaff || 'Dana'}</strong>
                            </span>
                          </div>

                          {/* Next Task & Date Added */}
                          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
                            <span className="flex items-center gap-1 truncate max-w-[130px]" title={nextTask?.title || 'No pending tasks'}>
                              <ListTodo className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                              <span className="truncate">
                                {nextTask ? nextTask.title : 'No pending task'}
                              </span>
                            </span>

                            <span className="flex items-center gap-1 flex-shrink-0" title={`Added: ${new Date(client.createdAt).toLocaleDateString()}`}>
                              <Clock className="w-2.5 h-2.5" />
                              <span>Added {new Date(client.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>

                          {/* Move Stage Selector & Open 360 File */}
                          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={client.currentStatus}
                              onChange={(e) => handleMoveStage(client, e.target.value as CanonicalPipelineStage)}
                              className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 text-[10px] rounded px-1.5 py-1 focus:outline-none focus:border-blue-500 font-medium truncate"
                              title="Move stage"
                            >
                              {CANONICAL_PIPELINE_STAGES.map((st) => (
                                <option key={st} value={st}>
                                  Move to: {st}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectClient(client.id);
                              }}
                              className="py-1 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold transition-all flex items-center gap-1 shrink-0"
                            >
                              <span>360</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
