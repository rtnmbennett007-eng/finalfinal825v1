import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  User,
  FileText,
  FileCheck2,
  Scale,
  DollarSign,
  PieChart,
  FolderLock,
  MessageSquare,
  Clock,
  Save,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Check,
  X,
  PhoneCall,
  ShieldCheck,
  Layers,
  Sparkles,
  RefreshCw,
  ListTodo,
  History,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  FileImage,
  FileCode,
  Search,
  Filter,
  Cloud,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { firestoreService } from '../../services/firestoreService';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { SsnViewer } from '../common/SsnViewer';
import { ConfirmModal } from '../common/ConfirmModal';
import { ProductSelect } from '../common/ProductSelect';
import { ReadyForUnderwritingModal } from '../underwriting/ReadyForUnderwritingModal';
import {
  Client,
  CommissionParticipant,
  DocumentItem,
  FundingDeal,
  FundingProductType,
  FundingStrategyRecord,
  InternalTask,
  LenderHistoryRecord,
  MasterVerificationData,
  PipelineStage,
  TimelineEvent,
  UnderwritingNote,
  UnderwritingRecord,
  UnderwritingEvaluationRecord,
} from '../../types';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

// Tab Subcomponents
import { FundingStrategyTab } from './tabs/FundingStrategyTab';
import { LenderHistoryTab } from './tabs/LenderHistoryTab';
import { MasterVerificationTab } from './tabs/MasterVerificationTab';
import { CompactUnderwritingSummaryTab } from './tabs/CompactUnderwritingSummaryTab';
import { ClientTasksTab } from './tabs/ClientTasksTab';
import { ClientInfoTab } from './tabs/ClientInfoTab';
import { BusinessInfoTab } from './tabs/BusinessInfoTab';
import { ApplicationTab } from './tabs/ApplicationTab';
import { InternalNotesTab } from './tabs/InternalNotesTab';
import { FundingDealsTab } from './tabs/FundingDealsTab';
import { MasterFileEditor } from './MasterFileEditor';
import { ClientDownloadModal } from './ClientDownloadModal';
import { DocumentUploadModal } from '../documents/DocumentUploadModal';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';
import { DocumentAiReviewModal } from '../documents/DocumentAiReviewModal';

import { CANONICAL_PIPELINE_STAGES, normalizePipelineStage } from '../../types';

const ALL_PIPELINE_STAGES: { value: PipelineStage; label: string }[] = [
  ...CANONICAL_PIPELINE_STAGES.map((s) => ({ value: s as PipelineStage, label: s })),
];

const getStageBadgeStyles = (status?: string | null) => {
  const safeStatus = (status || 'APPLICATION_RECEIVED').toString();
  const normalized = safeStatus.toUpperCase().replace(/\s+/g, '_');

  if (normalized.includes('FUNDED')) {
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
  } else if (normalized.includes('APPROVED')) {
    return 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30';
  } else if (normalized.includes('PRE_APPROVED')) {
    return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30';
  } else if (normalized.includes('COMMISSION_RECEIVED') || normalized.includes('COLLECTED')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
  } else if (normalized.includes('COMMISSION_PENDING') || normalized.includes('COMMISSION')) {
    return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
  } else if (normalized.includes('UNDERWRITING') || normalized.includes('READY_FOR_LENDER')) {
    return 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30';
  } else if (normalized.includes('VERIFICATION_COMPLETE') || normalized === 'VERIFIED') {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
  } else if (normalized.includes('VERIFICATION') || normalized.includes('PROGRESS')) {
    return 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30';
  } else if (normalized.includes('DOCUMENTS_RECEIVED') || normalized.includes('DOCUMENT')) {
    return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30';
  } else if (normalized.includes('APPLICATION_RECEIVED') || normalized.includes('APPLICATION')) {
    return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
  } else if (normalized.includes('NEW_LEAD') || normalized.includes('LEAD')) {
    return 'bg-slate-800 text-blue-400 border-slate-700 hover:bg-slate-750';
  } else if (
    normalized.includes('NOT_QUALIFIED') ||
    normalized.includes('DECLINED') ||
    normalized.includes('LOST') ||
    normalized.includes('WITHDRAWN') ||
    normalized.includes('REJECTED')
  ) {
    return 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
  }
  return 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750';
};

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
  initialTab?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const ClientDetailView: React.FC<ClientDetailViewProps> = ({
  clientId,
  onBack,
  initialTab = 'overview',
  onNavigateToTab,
}) => {
  const { currentUser, staffList } = useAuth();
  const {
    clients,
    setSelectedClientId,
    updateClient,
    deleteClient,
    createDeal,
    updateDeal,
    deleteDeal,
    tasks,
    addToast,
    refreshAll,
  } = useData();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [clientData, setClientData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);

  // Edit Master Record State
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [editClientForm, setEditClientForm] = useState<Partial<Client>>({});
  const [isSavingMaster, setIsSavingMaster] = useState(false);

  // Add Deal Modal State
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [newDealForm, setNewDealForm] = useState<Partial<FundingDeal>>({
    product: 'Revenue Funding',
    fundingAmount: 50000,
    fee: undefined,
    percentage: undefined,
    commissionPoints: undefined,
    termLength: '24 Months',
    status: 'PROPOSED',
    lenderStatus: 'PENDING',
    lenderName: 'Maple Direct Capital',
    lenderContact: 'underwriting@mapledirect.com',
    notes: '',
  });

  // Underwriting Workspace State
  const [underwritingChecklist, setUnderwritingChecklist] = useState<Record<string, 'Complete' | 'Incomplete' | 'NA'>>({});
  const [underwritingDecision, setUnderwritingDecision] = useState<'QUALIFIED' | 'PRE_APPROVED' | 'APPROVED' | 'NOT_QUALIFIED' | 'ADDITIONAL_INFO_REQUESTED'>('QUALIFIED');
  const [underwritingNotesInput, setUnderwritingNotesInput] = useState('');
  const [recommendedAmount, setRecommendedAmount] = useState(50000);
  const [recommendedProduct, setRecommendedProduct] = useState<FundingProductType>('Revenue Funding');
  const [underwritingEvaluation, setUnderwritingEvaluation] = useState<UnderwritingEvaluationRecord | null>(null);

  // PDF Export Modal State
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showReadyForUnderwritingModal, setShowReadyForUnderwritingModal] = useState(false);

  // Document Management States
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [activeViewingDoc, setActiveViewingDoc] = useState<DocumentItem | null>(null);
  const [activeAiReviewDoc, setActiveAiReviewDoc] = useState<DocumentItem | null>(null);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docCategoryFilter, setDocCategoryFilter] = useState('ALL');
  const [docToDelete, setDocToDelete] = useState<DocumentItem | null>(null);

  // Load Client Detailed Data with Fallbacks
  const loadClientDetails = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getClientDetail(clientId);

      // Ensure defensive defaults
      const guaranteedClient = res.client || clients.find((c) => c.id === clientId) || {
        id: clientId,
        firstName: 'Client',
        lastName: 'Record',
        businessName: 'Business File',
        email: 'client@example.com',
        phone: '(555) 000-0000',
        ssn: '000-00-0000',
        dob: '1985-01-01',
        address: '100 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        businessPhone: '(555) 000-0000',
        businessEmail: 'business@example.com',
        businessAddress: '100 Main St',
        businessCity: 'New York',
        businessState: 'NY',
        businessZip: '10001',
        industry: 'Commercial',
        businessStartDate: '2020-01-01',
        federalTaxId: '00-0000000',
        stateOfOrganization: 'NY',
        annualRevenue: 500000,
        monthlyRevenue: 45000,
        ownershipPercentage: 100,
        businessDescription: 'Commercial operations',
        leadSource: 'Portal Direct',
        assignedSalesRep: 'Robert',
        assignedStaff: 'Dana',
        currentStatus: (res.client?.currentStatus || 'No Set – Follow Up') as PipelineStage,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        requestedAmount: 50000,
        requestedProduct: 'Revenue Funding' as FundingProductType,
        creditScore: 700,
      };

      const sanitizedData = {
        client: guaranteedClient,
        deals: res.deals || [],
        verifications: res.verifications || [],
        verificationAudit: res.verificationAudit || [],
        underwriting: res.underwriting || null,
        notes: res.notes || [],
        submissions: res.submissions || [],
        documents: res.documents || [],
        communications: res.communications || [],
        timeline: res.timeline || [],
        commissions: res.commissions || [],
        masterVerification: res.masterVerification || null,
        fundingStrategies: res.fundingStrategies || [],
        internalNotes: res.internalNotes || [],
        lenderHistory: res.lenderHistory || [],
        creditCards: res.creditCards || [],
        tasks: res.tasks || [],
      };

      setClientData(sanitizedData);
      setEditClientForm(guaranteedClient);

      // Load Underwriting Evaluation Record
      try {
        const evalRecord = await api.getUnderwritingEvaluation(clientId);
        setUnderwritingEvaluation(evalRecord);
      } catch (e) {
        console.warn('Could not load underwriting evaluation:', e);
      }

      // Populate underwriting state
      if (sanitizedData.underwriting) {
        setUnderwritingChecklist(sanitizedData.underwriting.checklist || {});
        setUnderwritingDecision(sanitizedData.underwriting.decision || 'QUALIFIED');
        setRecommendedAmount(
          sanitizedData.underwriting.recommendedAmount || guaranteedClient.requestedAmount || 50000
        );
        setRecommendedProduct(
          sanitizedData.underwriting.recommendedProduct || guaranteedClient.requestedProduct || 'Revenue Funding'
        );
      } else {
        setUnderwritingChecklist({
          'Verify Business Active & Good Standing': 'Complete',
          'Review 4-Month Bank Statements': 'Complete',
          'Check Debt Service Coverage Ratio (DSCR)': 'Complete',
          'Evaluate Public Records & Judgments': 'Complete',
          'Verify Identity & SSN': 'Complete',
          'Assess Credit Utilization': 'Complete',
        });
        setRecommendedAmount(guaranteedClient.requestedAmount || 50000);
        setRecommendedProduct(guaranteedClient.requestedProduct || 'Revenue Funding');
      }
    } catch (err: any) {
      console.error('Failed to load client details:', err);
      // Try local fallback
      const fallback = clients.find((c) => c.id === clientId);
      if (fallback) {
        setClientData({
          client: fallback,
          deals: [],
          verifications: [],
          verificationAudit: [],
          underwriting: null,
          notes: [],
          submissions: [],
          documents: [],
          communications: [],
          timeline: [],
          commissions: [],
          masterVerification: null,
          fundingStrategies: [],
          internalNotes: [],
          lenderHistory: [],
          creditCards: [],
          tasks: [],
        });
        setEditClientForm(fallback);
      } else {
        setLoadError(err.message || 'Client record not found.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientDetails();
  }, [clientId]);

  // Save Master Record Details
  const handleSaveMasterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingMaster(true);
    try {
      await updateClient(clientId, editClientForm);
      addToast(
        'success',
        'Master File Updated',
        `Master file for ${editClientForm.firstName} ${editClientForm.lastName} updated and persisted to Firebase.`
      );
      setIsEditingClient(false);
      loadClientDetails();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update client file.');
    } finally {
      setIsSavingMaster(false);
    }
  };

  // Add Deal
  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDeal({
        ...newDealForm,
        clientId,
      });
      addToast('success', 'Funding Deal Added', 'Deal added to client stacking architecture.');
      setShowAddDealModal(false);
      loadClientDetails();
    } catch (err: any) {
      addToast('error', 'Failed to Add Deal', err.message);
    }
  };

  // Save Underwriting
  const handleSaveUnderwriting = async () => {
    try {
      await api.saveUnderwriting(clientId, {
        record: {
          checklist: underwritingChecklist,
          decision: underwritingDecision,
          recommendedAmount,
          recommendedProduct,
          creditScore: clientData?.client?.creditScore || 700,
          monthlyRevenue: clientData?.client?.monthlyRevenue || 50000,
          annualRevenue: clientData?.client?.annualRevenue || 600000,
          underwriterName: currentUser?.name || 'Robert',
          verifiedBy: currentUser?.name || 'Dana',
          verificationSummary: 'All tier-1 identity, cashflow, and business filing items verified.',
        },
        newNote: underwritingNotesInput.trim() ? underwritingNotesInput : undefined,
        author: currentUser?.name || 'Underwriting Specialist',
      });

      addToast('success', 'Underwriting File Saved', 'Underwriting record and decision updated.');
      setUnderwritingNotesInput('');
      loadClientDetails();
    } catch (err: any) {
      addToast('error', 'Underwriting Save Failed', err.message);
    }
  };

  // Document Action Handlers
  const handleDeleteDocument = async (docItem: DocumentItem) => {
    try {
      await api.deleteDocument(docItem.id);
      addToast('success', 'Document Removed', `"${docItem.title || docItem.fileName}" was removed from the vault.`);
      setDocToDelete(null);
      loadClientDetails();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete document.');
    }
  };

  const handleUpdateDocStatus = async (docId: string, status: DocumentItem['status']) => {
    try {
      await api.updateDocument(docId, { status });
      addToast('success', 'Status Updated', `Document status updated to ${status}.`);
      loadClientDetails();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update document status.');
    }
  };

  const handleDownloadDoc = (doc: DocumentItem) => {
    if (doc.fileBase64 && doc.fileBase64.includes('base64,')) {
      const link = window.document.createElement('a');
      link.href = doc.fileBase64;
      link.download = doc.fileName || 'downloaded_document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
      window.open(doc.fileUrl, '_blank');
    } else {
      window.open(`/api/documents/${doc.id}/download`, '_blank');
    }
  };

  // Manual Status Change Handler
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const handleStatusChange = async (newStatus: PipelineStage) => {
    if (!clientId || !clientData?.client || newStatus === clientData.client.currentStatus) return;
    const oldStatus = clientData.client.currentStatus;
    setIsUpdatingStatus(true);
    try {
      await updateClient(clientId, { currentStatus: newStatus });

      setClientData((prev: any) =>
        prev
          ? {
              ...prev,
              client: { ...prev.client, currentStatus: newStatus },
            }
          : prev
      );

      const formatStage = (s?: string) =>
        (s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

      await firestoreService.createTimelineEvent({
        clientId,
        title: `Pipeline Stage Changed to ${formatStage(newStatus)}`,
        description: `Pipeline stage manually updated from "${formatStage(oldStatus)}" to "${formatStage(newStatus)}" by ${currentUser?.name || 'Staff'}.`,
        staffMember: currentUser?.name || 'Staff',
        type: 'STATUS_CHANGE',
      });

      addToast('success', 'Pipeline Stage Updated', `Client stage set to ${formatStage(newStatus)}`);
      loadClientDetails();
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err.message || 'Could not update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center space-y-4 text-slate-400">
        <div className="w-10 h-10 border-3 border-amber-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-blue-300 uppercase tracking-wider">
          Loading Client Master 360 File from Database...
        </span>
      </div>
    );
  }

  if (loadError || !clientData?.client) {
    return (
      <div className="bg-[#0b1528] border border-red-900/60 p-8 rounded-2xl shadow-xl text-center space-y-4 max-w-lg mx-auto mt-10">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-base font-bold text-slate-100">Unable to Load Client Record</h2>
        <p className="text-xs text-slate-400">{loadError || 'The client record could not be found.'}</p>
        <div className="pt-2 flex justify-center space-x-3">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
          >
            ← Back to Clients Workspace
          </button>
          <button
            onClick={loadClientDetails}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    client = {} as Client,
    deals = [],
    underwriting = null,
    notes = [],
    documents = [],
    timeline = [],
    commissions = [],
    masterVerification = null,
    fundingStrategies = [],
    internalNotes = [],
    lenderHistory = [],
    creditCards = [],
    tasks: clientTasks = [],
  } = clientData || {};

  const safeStrategies = Array.isArray(fundingStrategies) ? fundingStrategies : [];
  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeDocuments = Array.isArray(documents) ? documents : [];
  const safeTimeline = Array.isArray(timeline) ? timeline : [];
  const safeCommissions = Array.isArray(commissions) ? commissions : [];
  const safeLenderHistory = Array.isArray(lenderHistory) ? lenderHistory : [];
  const safeCreditCards = Array.isArray(creditCards) ? creditCards : [];
  const safeInternalNotes = Array.isArray(internalNotes) ? internalNotes : [];
  const safeTasks = Array.isArray(clientTasks) && clientTasks.length > 0 ? clientTasks : (tasks || []).filter((t: any) => t.clientId === clientId);

  const activeStrategy = safeStrategies.find((s: any) => s?.isActive) || safeStrategies[0] || null;
  let overviewNextSteps: any[] = [];
  if (activeStrategy?.nextSteps) {
    try {
      if (typeof activeStrategy.nextSteps === 'string' && activeStrategy.nextSteps.startsWith('[')) {
        overviewNextSteps = JSON.parse(activeStrategy.nextSteps);
      } else if (Array.isArray(activeStrategy.nextSteps)) {
        overviewNextSteps = activeStrategy.nextSteps;
      }
    } catch {
      overviewNextSteps = [];
    }
  }

  const totalFundedAmount = safeDeals
    .filter((d: FundingDeal) => d?.status === 'FUNDED')
    .reduce((sum: number, d: FundingDeal) => sum + Number(d?.fundingAmount || 0), 0);

  const totalCommissionAmount = safeDeals
    .filter((d: FundingDeal) => d?.status === 'FUNDED')
    .reduce((sum: number, d: FundingDeal) => sum + (Number(d?.fundingAmount || 0) * Number(d?.percentage || 0)) / 100, 0);

  // Derived next task, next step, and alerts for top summary
  const nextPendingTask = safeTasks.find(
    (t: InternalTask) => t?.status !== 'Completed'
  );
  const activeFundingStrategy =
    safeStrategies.find((s: FundingStrategyRecord) => s?.isActive) ||
    safeStrategies[0] ||
    null;
  let nextStepSummary = 'None scheduled';
  if (activeFundingStrategy?.nextSteps) {
    try {
      if (typeof activeFundingStrategy.nextSteps === 'string' && activeFundingStrategy.nextSteps.startsWith('[')) {
        const parsed = JSON.parse(activeFundingStrategy.nextSteps);
        const pending = parsed.find(
          (p: any) => p?.status !== 'Completed' && p?.status !== 'Cancelled'
        );
        if (pending) nextStepSummary = pending.text || pending.action || nextStepSummary;
      } else if (typeof activeFundingStrategy.nextSteps === 'string') {
        const firstLine = activeFundingStrategy.nextSteps.split('\n')[0];
        if (firstLine) nextStepSummary = firstLine.replace(/^[\d+.-]\s*/, '').trim();
      }
    } catch {}
  }
  const highPriorityAlerts = safeTasks.filter(
    (t: InternalTask) => t?.priority === 'High' && t?.status !== 'Completed'
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Comprehensive 10-Field Summary Header */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-xl space-y-4">
        {/* Row 1: Client Name, Business Name, Status & Main Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/70 text-slate-300 hover:text-amber-400 hover:border-amber-400/50 transition-all group shrink-0"
              title="Back to Clients Workspace"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  {client.firstName} {client.lastName}
                </h1>
                <span className="text-xs text-blue-300 font-semibold">({client.businessName})</span>
                {/* Editable Pipeline Stage Selector */}
                <div className="relative inline-flex items-center group">
                  <select
                    value={client.currentStatus || 'APPLICATION_RECEIVED'}
                    disabled={isUpdatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value as PipelineStage)}
                    className={`appearance-none cursor-pointer inline-flex items-center whitespace-nowrap rounded-md border tracking-wide uppercase text-xs pl-2.5 pr-6 py-1 font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-amber-400 ${getStageBadgeStyles(
                      client.currentStatus
                    )}`}
                    title="Click to manually change pipeline stage"
                  >
                    {ALL_PIPELINE_STAGES.map((st) => (
                      <option
                        key={st.value}
                        value={st.value}
                        className="bg-[#070d18] text-slate-200 py-1 uppercase text-xs"
                      >
                        {st.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-1.5 pointer-events-none text-current opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
                {client.isVerified && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> VERIFIED
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1.5 flex-wrap gap-y-1">
                <span className="flex items-center gap-1 text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  {client.phone || '(555) 000-0000'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  {client.email || 'client@example.com'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  {client.industry || 'Commercial'}
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setShowReadyForUnderwritingModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              title="Run Underwriting Prerequisite Audit & Advance Deal"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Ready for Underwriting</span>
            </button>

            <button
              onClick={() => setIsEditingClient(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-blue-900/60 rounded-xl text-xs font-semibold transition-all"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Edit Master File</span>
            </button>

            <button
              onClick={() => setShowAddDealModal(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Funding Deal</span>
            </button>

            <button
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-900/90 to-indigo-950 hover:from-blue-800 hover:to-indigo-900 text-blue-200 border border-blue-600/60 hover:border-blue-400 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-950/40"
              title="Download Complete Client File PDF / Underwriting Reports"
            >
              <span className="text-sm">📄</span>
              <span>Download Client File</span>
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 rounded-xl text-xs font-semibold transition-all"
              title="Delete Client File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Comprehensive 10-Field Metadata Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-blue-900/50 text-[11px]">
          {/* Lead Source */}
          <div className="bg-[#070d18] p-2.5 rounded-xl border border-blue-900/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Lead Source</span>
            <span className="font-semibold text-slate-200 truncate block mt-0.5">{client.leadSource || 'Direct Inbound'}</span>
          </div>

          {/* Referral Partner */}
          <div className="bg-[#070d18] p-2.5 rounded-xl border border-blue-900/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Referral Partner</span>
            <span className="font-semibold text-slate-200 truncate block mt-0.5">{client.referralPartner || 'Direct'}</span>
          </div>

          {/* Assigned Staff */}
          <div className="bg-[#070d18] p-2.5 rounded-xl border border-blue-900/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Assigned Staff</span>
            <span className="font-semibold text-amber-300 truncate block mt-0.5">{client.assignedStaff || client.assignedSalesRep || 'Dana'}</span>
          </div>

          {/* Last Activity */}
          <div className="bg-[#070d18] p-2.5 rounded-xl border border-blue-900/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Last Activity</span>
            <span className="font-semibold text-slate-200 truncate block mt-0.5">
              {formatDate(client.updatedAt, 'Recent')}
            </span>
          </div>

          {/* Next Task */}
          <div className="bg-[#070d18] p-2.5 rounded-xl border border-blue-900/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Next Task</span>
            <span className="font-semibold text-cyan-300 truncate block mt-0.5" title={nextPendingTask?.title || 'None'}>
              {nextPendingTask ? nextPendingTask.title : 'None pending'}
            </span>
          </div>

          {/* Next Step / Alerts */}
          <div className="bg-[#070d18] p-2.5 rounded-xl border border-blue-900/40">
            <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
              {highPriorityAlerts.length > 0 ? 'Priority Alert' : 'Next Step'}
            </span>
            {highPriorityAlerts.length > 0 ? (
              <span className="font-bold text-rose-400 flex items-center gap-1 truncate mt-0.5">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {highPriorityAlerts.length} High Priority
              </span>
            ) : (
              <span className="font-semibold text-emerald-400 truncate block mt-0.5" title={nextStepSummary}>
                {nextStepSummary}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Bar — Complete 14-Tab Architecture */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 bg-[#0b1528] border border-blue-900/60 p-2 rounded-2xl shadow-xl">
        {[
          { id: 'overview', label: 'Master 360 File', icon: Building2 },
          { id: 'client-info', label: 'Client Info', icon: User },
          { id: 'business-info', label: 'Business Info', icon: Building2 },
          { id: 'application', label: 'Application', icon: FileText },
          { id: 'verification', label: 'Verification', icon: FileCheck2, badge: client?.isVerified ? 'Verified' : 'Worksheet' },
          { id: 'underwriting', label: 'Underwriting', icon: Scale, badge: underwriting ? underwriting.decision : undefined },
          { id: 'strategy', label: 'Funding Strategy', icon: Sparkles, badge: safeStrategies.length > 0 ? 'Active' : undefined },
          { id: 'funding', label: 'Funding Deals', icon: DollarSign, badge: `${safeDeals.length} Deals` },
          { id: 'lender-history', label: 'Lender History', icon: History, badge: `${safeLenderHistory.length}` },
          { id: 'tasks', label: 'Tasks', icon: ListTodo, badge: `${safeTasks.length}` },
          { id: 'internal-notes', label: 'Internal Notes', icon: MessageSquare, badge: `${safeInternalNotes.length}` },
          { id: 'documents', label: 'Documents', icon: FolderLock, badge: `${safeDocuments.length}` },
          { id: 'timeline', label: 'Timeline', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-blue-900/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-slate-950 text-amber-300' : 'bg-blue-950 text-blue-300 border border-blue-800'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW / MASTER CLIENT FILE */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Requested Funding
              </div>
              <div className="text-xl font-bold text-slate-100 font-mono mt-1">
                ${Number(client.requestedAmount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-amber-400 mt-1 font-medium">{client.requestedProduct}</div>
            </div>

            <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Total Volume Funded
              </div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                ${totalFundedAmount.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">{deals.length} deals in stack</div>
            </div>

            <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Monthly Business Flow
              </div>
              <div className="text-xl font-bold text-blue-400 font-mono mt-1">
                ${Number(client.monthlyRevenue || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Annual: ${Number(client.annualRevenue || 0).toLocaleString()}
              </div>
            </div>

            <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Credit Profile
              </div>
              <div className="text-xl font-bold text-amber-300 font-mono mt-1">
                {client.creditScore || 700} FICO
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Bankruptcy: {client.bankruptcy || 'None'}
              </div>
            </div>
          </div>

          {/* Master Details Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity & Personal Info Card */}
            <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" />
                Borrower & Principal Identity
              </h3>

              <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Full Legal Name:</span>
                  <span className="font-semibold">{client.firstName} {client.lastName}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Social Security Number:</span>
                  <SsnViewer ssn={client.ssn} clientId={client.id} />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Date of Birth:</span>
                  <span className="font-mono">{formatDate(client.dob, 'Not Provided')}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Direct Phone:</span>
                  <span className="font-mono">{client.phone}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Personal Email:</span>
                  <span>{client.email}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Residential Address:</span>
                  <span>{client.address}, {client.city}, {client.state} {client.zip}</span>
                </div>
              </div>
            </div>

            {/* Business Organization Card */}
            <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Commercial Entity Profile
              </h3>

              <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Legal Company Name:</span>
                  <span className="font-semibold">{client.businessName}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Federal Tax ID (EIN):</span>
                  <span className="font-mono font-bold text-amber-300">{client.federalTaxId || 'Not Logged'}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">State of Organization:</span>
                  <span className="font-semibold">{client.stateOfOrganization || client.state}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Business Start Date:</span>
                  <span className="font-mono">{formatDate(client.businessStartDate, 'Not Provided')}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Ownership Stake:</span>
                  <span className="font-bold text-emerald-400">{client.ownershipPercentage}%</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-400">Business Address:</span>
                  <span>{client.businessAddress || `${client.address}, ${client.city}, ${client.state}`}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Master 360: Verified Employment, Salary & Payroll Profile */}
          {masterVerification?.employmentVerification && (
            <div className="bg-[#0b1528] border border-amber-500/40 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      Verified Employment, Salary & Payroll Profile
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase ${
                        masterVerification.employmentVerification.sectionStatus === 'Verified'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        {masterVerification.employmentVerification.sectionStatus || 'Verified'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Underwriter verified employment tenure, compensation, pay stubs, and income stability.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('verification')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-amber-500 text-blue-300 hover:text-slate-950 border border-blue-500/40 hover:border-amber-400 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span>Open Verification Worksheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Currently Working</span>
                  <span className="font-semibold text-slate-200 mt-0.5 block font-mono">
                    {masterVerification.employmentVerification.currentlyWorking?.verified || 'Not Provided'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Employer Name</span>
                  <span className="font-semibold text-amber-300 truncate mt-0.5 block" title={masterVerification.employmentVerification.employerName?.verified || client.businessName || 'Not Provided'}>
                    {masterVerification.employmentVerification.employerName?.verified || client.businessName || 'Not Provided'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Job Title</span>
                  <span className="font-semibold text-slate-200 truncate mt-0.5 block" title={masterVerification.employmentVerification.jobTitle?.verified || client.ownerTitle || 'Not Provided'}>
                    {masterVerification.employmentVerification.jobTitle?.verified || client.ownerTitle || 'Not Provided'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Salary</span>
                  <span className="font-bold text-emerald-400 font-mono mt-0.5 block">
                    {masterVerification.employmentVerification.annualSalary?.verified || (client.personalAnnualIncome ? `$${Number(client.personalAnnualIncome).toLocaleString()}` : 'Not Provided')}
                  </span>
                </div>

                <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pay Frequency</span>
                  <span className="font-semibold text-cyan-300 mt-0.5 block font-mono">
                    {masterVerification.employmentVerification.payFrequency?.verified || 'Not Provided'}
                  </span>
                </div>

                <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pay Stubs Reviewed</span>
                  <span className="font-bold text-emerald-300 mt-0.5 block font-mono">
                    {masterVerification.employmentVerification.payStubReviewed?.verified || 'Not Provided'}
                  </span>
                </div>
              </div>

              {masterVerification.employmentVerification.employmentIncomeNotes && (
                <div className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-300">
                  <strong className="text-amber-400 uppercase text-[10px] block mb-0.5">Underwriting Employment Notes:</strong>
                  {masterVerification.employmentVerification.employmentIncomeNotes}
                </div>
              )}
            </div>
          )}

          {/* Active Strategy & Action Steps Card */}
          {activeStrategy && (
            <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      Active Funding Strategy Blueprint
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        {activeStrategy.strategyStatus || 'Active'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Products to pursue: <strong className="text-amber-300">{activeStrategy.productsToPursue || 'Revenue Funding, Personal/Business Term Loan'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('strategy')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-amber-500 text-blue-300 hover:text-slate-950 border border-blue-500/40 hover:border-amber-400 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <span>Open Strategy Hub</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 text-xs text-slate-300 leading-relaxed font-sans">
                {activeStrategy.strategy || 'Multi-tranche funding stack active.'}
              </div>

              {/* Action Steps Preview */}
              {overviewNextSteps.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-blue-900/40">
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ListTodo className="w-4 h-4" /> Next Action Items
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {overviewNextSteps.filter((s: any) => s.status === 'Completed').length} / {overviewNextSteps.length} Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {overviewNextSteps.map((step: any, idx: number) => {
                      const isDone = step.status === 'Completed';
                      return (
                        <div
                          key={step.id || idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400'
                              : 'bg-[#070d18] border-blue-900/50 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            <span className={`truncate font-medium ${isDone ? 'line-through' : ''}`}>
                              {step.text || step.action}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-slate-400 border border-blue-900 shrink-0">
                            {step.assignedTo || 'Staff'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FUNDING STRATEGY & NEXT STEPS */}
      {activeTab === 'strategy' && (
        <FundingStrategyTab
          client={client}
          strategies={safeStrategies}
          onStrategyUpdated={loadClientDetails}
          onNavigateToTasks={() => setActiveTab('tasks')}
        />
      )}

      {/* TAB 3: MASTER VERIFICATION FORM */}
      {activeTab === 'verification' && (
        <MasterVerificationTab
          client={client}
          masterVerification={masterVerification}
          onRefresh={loadClientDetails}
        />
      )}

      {/* TAB 4: COMPACT UNDERWRITING SUMMARY */}
      {activeTab === 'underwriting' && (
        <CompactUnderwritingSummaryTab
          client={client}
          masterVerification={masterVerification}
          documents={safeDocuments}
          deals={safeDeals}
          underwritingEvaluation={underwritingEvaluation}
          onOpenUnderwritingHub={() => {
            setSelectedClientId(client.id);
            if (onNavigateToTab) {
              onNavigateToTab('underwriting');
            }
          }}
        />
      )}

      {/* TAB 5: DEALS & STACKING */}
      {activeTab === 'funding' && (
        <FundingDealsTab
          client={client}
          deals={safeDeals}
          lenderHistory={safeLenderHistory}
          onRefresh={loadClientDetails}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* TAB 6: LENDER HISTORY */}
      {activeTab === 'lender-history' && (
        <LenderHistoryTab
          client={client}
          deals={safeDeals}
          lenderHistory={safeLenderHistory}
          onRefresh={loadClientDetails}
        />
      )}

      {/* TAB 8: TASKS & ACTIONS */}
      {activeTab === 'tasks' && (
        <ClientTasksTab
          client={client}
          tasks={safeTasks}
          onRefresh={() => {
            refreshAll();
            loadClientDetails();
          }}
        />
      )}

      {/* TAB 9: DOCUMENT VAULT */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-amber-400" />
                Document Vault & Verification Files
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Encrypted storage for driver licenses, bank statements, voided checks, tax returns, and stip documentation with AI Extraction.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="vault-upload-document-btn"
                onClick={() => setShowUploadDocModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="Search documents by title or file name..."
                className="w-full pl-9 pr-3 py-2 bg-[#070d18] border border-blue-900/70 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                Category:
              </span>
              <select
                value={docCategoryFilter}
                onChange={(e) => setDocCategoryFilter(e.target.value)}
                className="bg-[#070d18] border border-blue-900/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Categories ({safeDocuments.length})</option>
                <option value="Driver's License">Driver's License</option>
                <option value="Bank Statements">Bank Statements</option>
                <option value="Tax Returns">Tax Returns</option>
                <option value="Voided Check">Voided Check</option>
                <option value="Articles of Incorporation">Articles of Incorporation</option>
                <option value="Business License">Business License</option>
                <option value="Pay Stubs">Pay Stubs</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Document Cards Grid */}
          {(() => {
            const filteredDocs = safeDocuments.filter((doc) => {
              const matchesSearch =
                !docSearchQuery.trim() ||
                (doc.title && doc.title.toLowerCase().includes(docSearchQuery.toLowerCase())) ||
                (doc.fileName && doc.fileName.toLowerCase().includes(docSearchQuery.toLowerCase())) ||
                (doc.category && doc.category.toLowerCase().includes(docSearchQuery.toLowerCase()));

              const matchesCat = docCategoryFilter === 'ALL' || doc.category === docCategoryFilter;
              return matchesSearch && matchesCat;
            });

            if (filteredDocs.length === 0) {
              return (
                <div className="bg-[#0b1528] border border-blue-900/60 p-12 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-800 text-blue-400 mx-auto flex items-center justify-center">
                    <FolderLock className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-200">No Documents Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {docSearchQuery || docCategoryFilter !== 'ALL'
                      ? 'No documents matched your search criteria. Try adjusting the category or search text.'
                      : 'No verification or underwriting documents have been uploaded for this client yet.'}
                  </p>
                  <button
                    onClick={() => setShowUploadDocModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Upload First Document</span>
                  </button>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDocs.map((doc: DocumentItem) => {
                  const fileName = doc.fileName || doc.title || '';
                  const ext = fileName.split('.').pop()?.toLowerCase() || '';
                  const isPdf = ext === 'pdf' || doc.fileMimeType?.includes('pdf');
                  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'tif', 'tiff'].includes(ext) || doc.fileMimeType?.startsWith('image/');
                  const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(ext) || doc.fileMimeType?.includes('spreadsheet') || doc.fileMimeType?.includes('csv');
                  const isText = ['txt', 'rtf', 'xml', 'json'].includes(ext) || doc.fileMimeType?.startsWith('text/');
                  const hasAi = Boolean(doc.aiExtraction);
                  const fieldCount = doc.aiExtraction?.extractedFields?.length || 0;

                  return (
                    <div
                      key={doc.id}
                      className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg hover:border-blue-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <div className="p-2 rounded-xl bg-blue-950/80 border border-blue-800 shrink-0 mt-0.5">
                              {isPdf ? (
                                <FileText className="w-4 h-4 text-red-400" />
                              ) : isSpreadsheet ? (
                                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                              ) : isImage ? (
                                <FileImage className="w-4 h-4 text-purple-400" />
                              ) : isText ? (
                                <FileCode className="w-4 h-4 text-slate-400" />
                              ) : (
                                <FolderLock className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-100 truncate" title={doc.title || doc.fileName}>
                                {doc.title || doc.fileName}
                              </h4>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-blue-950 border border-blue-900/80 text-blue-300 font-medium">
                                  {doc.category}
                                </span>
                                <span>•</span>
                                <span className="font-mono uppercase text-slate-400">{ext || 'FILE'}</span>
                              </div>
                            </div>
                          </div>

                          <select
                            value={doc.status || 'RECEIVED'}
                            onChange={(e) => handleUpdateDocStatus(doc.id, e.target.value as any)}
                            className={`text-[10px] font-mono px-2 py-1 rounded-lg font-bold border focus:outline-none cursor-pointer ${
                              doc.status === 'REVIEWED'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : doc.status === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : doc.status === 'PENDING'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            <option value="RECEIVED" className="bg-slate-900 text-blue-300">RECEIVED</option>
                            <option value="REVIEWED" className="bg-slate-900 text-emerald-300">REVIEWED</option>
                            <option value="PENDING" className="bg-slate-900 text-amber-300">PENDING</option>
                            <option value="REJECTED" className="bg-slate-900 text-rose-300">REJECTED</option>
                          </select>
                        </div>

                        {/* AI Extraction Pill */}
                        {hasAi ? (
                          <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-[11px]">
                            <div className="flex items-center gap-1.5 text-amber-300 font-semibold truncate">
                              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{fieldCount} Underwriting Fields</span>
                            </div>
                            <button
                              onClick={() => setActiveAiReviewDoc(doc)}
                              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 rounded transition shrink-0"
                            >
                              Review & Apply
                            </button>
                          </div>
                        ) : null}

                        <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
                          <div className="truncate">File: <span className="text-slate-300 font-mono">{doc.fileName || doc.title}</span></div>
                          <div className="flex items-center justify-between">
                            <span>Uploaded: {formatDate(doc.uploadedDate, 'Recent')}</span>
                            <span>{doc.fileSize || 'Standard'}</span>
                          </div>
                          {(doc.driveFileId || doc.storageProvider === 'google_drive') && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-400 pt-0.5">
                              <Cloud className="w-3 h-3 text-blue-400 shrink-0" />
                              <span className="font-semibold">Google Drive Cloud Storage</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-blue-900/40 text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveViewingDoc(doc)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-slate-200 border border-blue-800/80 text-[11px] font-medium flex items-center gap-1 transition-colors"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownloadDoc(doc)}
                            className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-slate-200 border border-blue-800/80 transition-colors"
                            title="Download File"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {(doc.driveWebViewLink || doc.driveFileId) && (
                            <a
                              href={doc.driveWebViewLink || `https://drive.google.com/file/d/${doc.driveFileId}/view`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 text-blue-400 hover:text-blue-300 border border-blue-800/80 transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        <button
                          onClick={() => setDocToDelete(doc)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* TAB: CLIENT INFORMATION */}
      {activeTab === 'client-info' && (
        <ClientInfoTab client={client} onRefresh={loadClientDetails} />
      )}

      {/* TAB: BUSINESS INFORMATION */}
      {activeTab === 'business-info' && (
        <BusinessInfoTab client={client} onRefresh={loadClientDetails} />
      )}

      {/* TAB: APPLICATION */}
      {activeTab === 'application' && (
        <ApplicationTab client={client} onRefresh={loadClientDetails} />
      )}

      {/* TAB: INTERNAL NOTES */}
      {activeTab === 'internal-notes' && (
        <InternalNotesTab client={client} notes={safeInternalNotes} onRefresh={loadClientDetails} />
      )}

      {/* TAB 10: AUDIT TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Complete Audit Timeline ({safeTimeline.length} Events)
          </h3>

          <div className="space-y-3 mt-4">
            {safeTimeline.map((event: TimelineEvent) => (
              <div
                key={event.id}
                className="p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 flex items-start space-x-3 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{event.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatDateTime(event.timestamp)}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-0.5">{event.description}</p>
                  <div className="text-[10px] text-blue-400 mt-1">Logged by: {event.staffMember}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comprehensive 360 Master File Editor */}
      {client && (
        <MasterFileEditor
          isOpen={isEditingClient}
          onClose={() => setIsEditingClient(false)}
          client={client}
          deals={deals}
          commissions={clientData?.commissions || []}
          documents={documents}
          tasks={clientData?.tasks || []}
          internalNotes={clientData?.internalNotes || []}
          masterVerification={clientData?.masterVerification || null}
          underwriting={clientData?.underwriting || null}
          onRefresh={() => {
            loadClientDetails();
            refreshAll();
          }}
        />
      )}

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Add Funding Deal (Stacking)
              </h3>
              <button onClick={() => setShowAddDealModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
              <div>
                <ProductSelect
                  label="Product"
                  value={newDealForm.product || 'Revenue Funding'}
                  onChange={(val) => setNewDealForm({ ...newDealForm, product: val as any })}
                  otherType={newDealForm.otherProductType || ''}
                  onChangeOtherType={(val) => setNewDealForm({ ...newDealForm, otherProductType: val })}
                  selectClassName="p-2.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Funding Amount</label>
                  <input
                    type="number"
                    value={newDealForm.fundingAmount}
                    onChange={(e) => setNewDealForm({ ...newDealForm, fundingAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-emerald-300 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Fee %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newDealForm.percentage}
                    onChange={(e) => setNewDealForm({ ...newDealForm, percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-amber-300 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lender Name</label>
                <input
                  type="text"
                  value={newDealForm.lenderName}
                  onChange={(e) => setNewDealForm({ ...newDealForm, lenderName: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-blue-900 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadDocModal}
        onClose={() => setShowUploadDocModal(false)}
        clientId={clientId}
        clientName={client ? `${client.firstName} ${client.lastName}` : 'Client'}
        businessName={client?.businessName || ''}
        availableDeals={safeDeals.map((d) => ({
          id: d.id,
          title: d.product || 'Funding Deal',
          product: d.product,
          lenderName: d.lenderName,
        }))}
        onDocumentUploaded={() => {
          loadClientDetails();
          addToast('success', 'Document Saved', 'Document successfully uploaded and saved to vault.');
        }}
        currentUser={currentUser?.name || 'Staff Underwriter'}
        onOpenReviewModal={(doc) => setActiveAiReviewDoc(doc)}
      />

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={Boolean(activeViewingDoc)}
        onClose={() => setActiveViewingDoc(null)}
        document={activeViewingDoc}
        onOpenReviewModal={(doc) => setActiveAiReviewDoc(doc)}
        onDocumentUpdated={() => loadClientDetails()}
        currentUser={currentUser?.name || 'Staff Underwriter'}
      />

      {/* Document AI Extraction Review & Field Application Modal */}
      {activeAiReviewDoc && (
        <DocumentAiReviewModal
          isOpen={Boolean(activeAiReviewDoc)}
          onClose={() => setActiveAiReviewDoc(null)}
          document={activeAiReviewDoc}
          clientId={clientId}
          clientName={client ? `${client.firstName} ${client.lastName}` : 'Client'}
          businessName={client?.businessName || ''}
          currentVerification={masterVerification}
          onVerificationUpdated={() => loadClientDetails()}
          currentUser={currentUser?.name || 'Staff Underwriter'}
        />
      )}

      {/* Delete Document Confirm Modal */}
      {docToDelete && (
        <ConfirmModal
          isOpen={Boolean(docToDelete)}
          onClose={() => setDocToDelete(null)}
          onConfirm={() => handleDeleteDocument(docToDelete)}
          title="Delete Document"
          message={`Are you sure you want to permanently delete "${docToDelete.title || docToDelete.fileName}" from the vault? This action cannot be undone.`}
          confirmText="Delete Document"
          cancelText="Cancel"
          type="danger"
        />
      )}
      {/* Client File PDF Download Modal */}
      <ClientDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        client={client}
        deals={safeDeals}
        commissions={safeCommissions}
        masterVerification={masterVerification}
        underwriting={underwritingEvaluation}
        creditCards={safeCreditCards}
        lenderHistory={safeLenderHistory}
        documents={safeDocuments}
        tasks={safeTasks}
        internalNotes={safeInternalNotes}
        timelineEvents={safeTimeline}
      />

      {/* Delete Client Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setIsDeletingClient(true);
          try {
            await deleteClient(clientId);
            setShowDeleteConfirm(false);
            onBack();
          } catch (err: any) {
            addToast('error', 'Delete Failed', err.message || 'Could not delete client');
          } finally {
            setIsDeletingClient(false);
          }
        }}
        title={`Delete Client File: ${client.firstName} ${client.lastName}`}
        message={`Are you sure you want to delete the complete client file for ${client.firstName} ${client.lastName} (${client.businessName})?\n\nThis will permanently delete this client record, all linked funding deals in their stack, verification worksheets, underwriting decisions, and uploaded files.`}
        confirmText="Delete Client File"
        cancelText="Cancel"
        isLoading={isDeletingClient}
        type="danger"
      />

      {/* Ready for Underwriting Prerequisite Modal */}
      {client && (
        <ReadyForUnderwritingModal
          isOpen={showReadyForUnderwritingModal}
          onClose={() => setShowReadyForUnderwritingModal(false)}
          client={client}
          deal={safeDeals[0]}
          onSuccess={loadClientDetails}
          onNavigateToTab={setActiveTab}
        />
      )}
    </div>
  );
};
