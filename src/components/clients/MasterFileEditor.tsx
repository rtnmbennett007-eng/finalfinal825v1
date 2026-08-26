import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  User,
  Building2,
  Layers,
  DollarSign,
  FileCheck2,
  Scale,
  PieChart,
  FolderLock,
  ListTodo,
  Share2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import {
  Client,
  CommissionParticipant,
  DocumentItem,
  FundingDeal,
  InternalTask,
  ClientInternalNote,
  MasterVerificationData,
  UnderwritingRecord,
  StaffUser,
} from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { firestoreService } from '../../services/firestoreService';
import { MasterPersonalSection } from './masterEditor/MasterPersonalSection';
import { MasterBusinessSection } from './masterEditor/MasterBusinessSection';
import { MasterPipelineSection } from './masterEditor/MasterPipelineSection';
import { MasterApplicationSection } from './masterEditor/MasterApplicationSection';
import { MasterVerificationSection } from './masterEditor/MasterVerificationSection';
import { MasterUnderwritingSection } from './masterEditor/MasterUnderwritingSection';
import { MasterDealsSection } from './masterEditor/MasterDealsSection';
import { MasterCommissionsSection } from './masterEditor/MasterCommissionsSection';
import { MasterDocumentsSection } from './masterEditor/MasterDocumentsSection';
import { MasterTasksNotesSection } from './masterEditor/MasterTasksNotesSection';
import { MasterIntegrationsSection } from './masterEditor/MasterIntegrationsSection';

interface MasterFileEditorProps {
  client: Client;
  deals?: FundingDeal[];
  commissions?: CommissionParticipant[];
  documents?: DocumentItem[];
  tasks?: InternalTask[];
  internalNotes?: ClientInternalNote[];
  masterVerification?: MasterVerificationData | null;
  underwriting?: UnderwritingRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

type MasterTabType =
  | 'personal'
  | 'business'
  | 'pipeline'
  | 'application'
  | 'verification'
  | 'underwriting'
  | 'deals'
  | 'commissions'
  | 'documents'
  | 'tasks_notes'
  | 'integrations';

export const MasterFileEditor: React.FC<MasterFileEditorProps> = ({
  client,
  deals = [],
  commissions = [],
  documents = [],
  tasks = [],
  internalNotes = [],
  masterVerification = null,
  underwriting = null,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const { updateClient, createDeal, updateDeal, addToast } = useData();
  const { currentUser, staffList } = useAuth();

  const [activeTab, setActiveTab] = useState<MasterTabType>('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Form States for all subsystems
  const [clientForm, setClientForm] = useState<Partial<Client>>({});
  const [dealsList, setDealsList] = useState<FundingDeal[]>([]);
  const [commissionsList, setCommissionsList] = useState<CommissionParticipant[]>([]);
  const [documentsList, setDocumentsList] = useState<DocumentItem[]>([]);
  const [tasksList, setTasksList] = useState<InternalTask[]>([]);
  const [notesList, setNotesList] = useState<ClientInternalNote[]>([]);
  const [verificationForm, setVerificationForm] = useState<Partial<MasterVerificationData>>({});
  const [underwritingForm, setUnderwritingForm] = useState<Partial<UnderwritingRecord>>({});

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && client) {
      setClientForm({ ...client });
      setDealsList(Array.isArray(deals) ? [...deals] : []);
      setCommissionsList(Array.isArray(commissions) ? [...commissions] : []);
      setDocumentsList(Array.isArray(documents) ? [...documents] : []);
      setTasksList(Array.isArray(tasks) ? [...tasks] : []);
      setNotesList(Array.isArray(internalNotes) ? [...internalNotes] : []);
      setVerificationForm(
        masterVerification
          ? { ...masterVerification }
          : {
              clientId: client.id,
              status: client.isVerified ? 'VERIFIED' : 'PENDING',
              verificationSpecialist: client.verifiedBy || 'Dana Javier',
              date: client.verificationDate || new Date().toISOString().split('T')[0],
              callSummary: client.verificationSummary || '',
            }
      );
      setUnderwritingForm(
        underwriting
          ? { ...underwriting }
          : {
              clientId: client.id,
              decision: (client.underwritingDecision as any) || 'QUALIFIED',
              underwriterName: client.underwrittenBy || 'Dana Javier',
              recommendedAmount: client.recommendedAmount || client.requestedAmount || 0,
              recommendedProduct: client.recommendedProduct || client.requestedProduct || 'Business Line of Credit',
              creditScore: client.creditScore || 700,
            }
      );
      setIsDirty(false);
    }
  }, [isOpen, client]);

  if (!isOpen) return null;

  const handleClientChange = (updates: Partial<Client>) => {
    setClientForm((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleDealsChange = (updated: FundingDeal[]) => {
    setDealsList(updated);
    setIsDirty(true);
  };

  const handleCommissionsChange = (updated: CommissionParticipant[]) => {
    setCommissionsList(updated);
    setIsDirty(true);
  };

  const handleDocumentsChange = (updated: DocumentItem[]) => {
    setDocumentsList(updated);
    setIsDirty(true);
  };

  const handleTasksChange = (updated: InternalTask[]) => {
    setTasksList(updated);
    setIsDirty(true);
  };

  const handleNotesChange = (updated: ClientInternalNote[]) => {
    setNotesList(updated);
    setIsDirty(true);
  };

  const handleVerificationChange = (updated: Partial<MasterVerificationData>) => {
    setVerificationForm(updated);
    setIsDirty(true);
  };

  const handleUnderwritingChange = (updated: Partial<UnderwritingRecord>) => {
    setUnderwritingForm(updated);
    setIsDirty(true);
  };

  // Master Global Save Orchestrator
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Update Core Client Record
      const clientPayload: Partial<Client> = {
        ...clientForm,
        isVerified: verificationForm.status === 'VERIFIED',
        verifiedBy: verificationForm.verificationSpecialist || clientForm.assignedStaff,
        verificationDate: verificationForm.date,
        verificationSummary: verificationForm.callSummary,
        underwritingDecision: (underwritingForm.decision as any) || clientForm.underwritingDecision,
        underwrittenBy: underwritingForm.underwriterName || clientForm.assignedStaff,
        recommendedAmount: underwritingForm.recommendedAmount,
        recommendedProduct: underwritingForm.recommendedProduct,
        updatedAt: new Date().toISOString(),
      };
      await updateClient(client.id, clientPayload);

      // 2. Persist Funding Deals (all stacked positions)
      for (const deal of dealsList) {
        const existing = deals.find((d) => d.id === deal.id);
        if (existing) {
          await updateDeal(deal.id, deal);
        } else {
          await createDeal(deal);
        }
      }

      // 3. Save Master Verification if present
      if (verificationForm && Object.keys(verificationForm).length > 0) {
        await firestoreService.saveMasterVerification(client.id, verificationForm);
      }

      // 4. Save Underwriting Record
      if (underwritingForm && Object.keys(underwritingForm).length > 0) {
        await firestoreService.saveUnderwritingRecord(client.id, underwritingForm);
      }

      // 5. Create Audit Event in Timeline
      await firestoreService.createTimelineEvent({
        clientId: client.id,
        title: 'Master Client File Updated & Synchronized',
        description: `Full master record synchronized by ${currentUser?.name || 'Staff'}. All subsystem data propagated.`,
        staffMember: currentUser?.name || 'Staff Admin',
        type: 'STATUS_CHANGE',
      });

      addToast(
        'success',
        'Master File Synchronized',
        'All client modules, deals, verification, underwriting & CRM data have been updated.'
      );

      setIsDirty(false);
      onRefresh();
      onClose();
    } catch (err: any) {
      console.error('Master File Save Error:', err);
      addToast('error', 'Synchronization Failed', err.message || 'Failed to save master record.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const tabsConfig = [
    { id: 'personal', label: 'Personal & Contact', icon: User },
    { id: 'business', label: 'Business & Entity', icon: Building2 },
    { id: 'pipeline', label: 'Pipeline & Staff', icon: Layers },
    { id: 'application', label: 'Application & Finances', icon: DollarSign },
    { id: 'verification', label: 'Verification Record', icon: FileCheck2, badge: verificationForm.status || 'PENDING' },
    { id: 'underwriting', label: 'Underwriting Decision', icon: Scale, badge: underwritingForm.decision },
    { id: 'deals', label: 'Funding Deals & Stacking', icon: DollarSign, badge: `${dealsList.length} Deals` },
    { id: 'commissions', label: 'Commission Splits', icon: PieChart },
    { id: 'documents', label: 'Document Vault', icon: FolderLock, badge: `${documentsList.length}` },
    { id: 'tasks_notes', label: 'Tasks & Notes', icon: ListTodo, badge: `${tasksList.length}` },
    { id: 'integrations', label: 'Integrations (GHL/Discord)', icon: Share2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#070d18] border border-blue-900/80 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-[#0b1528] border-b border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  Master File Editor 360
                </span>
                {isDirty && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    Unsaved Changes
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-0.5">
                {clientForm.firstName || client.firstName} {clientForm.lastName || client.lastName}
                <span className="text-slate-400 text-sm font-normal ml-2">
                  • {clientForm.businessName || client.businessName}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isDirty
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/50'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
              }`}
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Synchronizing Everything...' : 'Save Master File (Global Sync)'}</span>
            </button>

            <button
              type="button"
              onClick={handleCloseAttempt}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-blue-900/60 transition-all"
              title="Close Master File"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center space-x-1 overflow-x-auto p-2 bg-[#08101e] border-b border-blue-900/40 shrink-0">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as MasterTabType)}
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

        {/* Tab Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'personal' && (
            <MasterPersonalSection form={clientForm} onChange={handleClientChange} />
          )}

          {activeTab === 'business' && (
            <MasterBusinessSection form={clientForm} onChange={handleClientChange} />
          )}

          {activeTab === 'pipeline' && (
            <MasterPipelineSection
              form={clientForm}
              staffList={staffList}
              onChange={handleClientChange}
            />
          )}

          {activeTab === 'application' && (
            <MasterApplicationSection form={clientForm} onChange={handleClientChange} />
          )}

          {activeTab === 'verification' && (
            <MasterVerificationSection
              verificationData={verificationForm}
              onChangeVerification={handleVerificationChange}
            />
          )}

          {activeTab === 'underwriting' && (
            <MasterUnderwritingSection
              underwriting={underwritingForm}
              onChangeUnderwriting={handleUnderwritingChange}
            />
          )}

          {activeTab === 'deals' && (
            <MasterDealsSection
              clientId={client.id}
              clientName={`${clientForm.firstName || client.firstName} ${clientForm.lastName || client.lastName}`}
              businessName={clientForm.businessName || client.businessName}
              deals={dealsList}
              onChangeDeals={handleDealsChange}
            />
          )}

          {activeTab === 'commissions' && (
            <MasterCommissionsSection
              deals={dealsList}
              commissions={commissionsList}
              onChangeCommissions={handleCommissionsChange}
            />
          )}

          {activeTab === 'documents' && (
            <MasterDocumentsSection
              clientId={client.id}
              clientName={`${clientForm.firstName || client.firstName} ${clientForm.lastName || client.lastName}`}
              businessName={clientForm.businessName || client.businessName}
              documents={documentsList}
              onChangeDocuments={handleDocumentsChange}
              onVerificationUpdated={() => {
                api.getMasterVerification(client.id).then((mv) => {
                  if (mv) setVerificationForm(mv);
                });
              }}
            />
          )}

          {activeTab === 'tasks_notes' && (
            <MasterTasksNotesSection
              clientId={client.id}
              clientName={`${clientForm.firstName || client.firstName} ${clientForm.lastName || client.lastName}`}
              tasks={tasksList}
              notes={notesList}
              onChangeTasks={handleTasksChange}
              onChangeNotes={handleNotesChange}
            />
          )}

          {activeTab === 'integrations' && (
            <MasterIntegrationsSection form={clientForm} onChange={handleClientChange} />
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="p-4 bg-[#0b1528] border-t border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              Real-time Global Sync Active • Updates write directly to Maple X Financial Master Database
            </span>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-center">
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold border border-blue-900/50 transition-all"
            >
              Cancel / Close
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center space-x-2 px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/25"
            >
              <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              <span>{isSaving ? 'Synchronizing...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Discard Changes Warning Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-[#0b1528] border border-rose-900/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-100">Discard Unsaved Changes?</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  You have modified master fields that have not yet been synchronized.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-semibold border border-blue-900/60"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
