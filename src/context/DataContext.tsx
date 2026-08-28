import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppNotification,
  Client,
  ClientInternalNote,
  CommissionDirectoryEntry,
  CommissionParticipant,
  CommissionRule,
  CreditCardRecord,
  DiscordConfig,
  DocumentItem,
  FirebaseClientConfig,
  FundingDeal,
  FundingProductDefinition,
  FundingStrategyRecord,
  GhlConfig,
  InternalTask,
  Lead,
  LeadSourceOption,
  LenderHistoryRecord,
  MasterVerificationData,
  ReferralPartnerOption,
  StaffUser,
  TimelineEvent,
  UserRole,
  ProductionErrorRecord,
} from '../types';
import { firestoreService, sanitizeDoc } from '../services/firestoreService';
import { MASTER_FUNDING_PRODUCTS } from '../data/productCatalog';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { getDb } from '../firebase';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface DataContextType {
  leads: Lead[];
  clients: Client[];
  deals: FundingDeal[];
  commissions: CommissionParticipant[];
  commissionRules: CommissionRule[];
  commissionDirectory: CommissionDirectoryEntry[];
  leadSources: LeadSourceOption[];
  referralPartners: ReferralPartnerOption[];
  products: FundingProductDefinition[];
  ghlConfig: GhlConfig | null;
  tasks: InternalTask[];
  notifications: AppNotification[];
  roles: UserRole[];
  discordConfig: DiscordConfig | null;
  firebaseConfig: FirebaseClientConfig | null;
  timelineEvents: TimelineEvent[];
  documents: DocumentItem[];
  productionErrors: ProductionErrorRecord[];

  selectedClientId: string | null;
  selectedClientData: any | null;
  isLoading: boolean;
  isSaving: boolean;
  toasts: ToastMessage[];

  // General Actions
  setSelectedClientId: (id: string | null) => void;
  refreshAll: () => Promise<void>;
  refreshClientDetail: (clientId: string) => Promise<void>;
  addToast: (type: ToastMessage['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Leads
  createLead: (data: Partial<Lead>) => Promise<Lead>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  convertLeadToClient: (id: string, customData?: Record<string, any>) => Promise<{ client: Client; deal: FundingDeal }>;

  // Clients
  createClient: (data: Partial<Client>) => Promise<Client>;
  updateClient: (id: string, data: Partial<Client>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  auditSsnView: (id: string, staffName: string) => Promise<void>;

  // Deals (Stacking Supported)
  createDeal: (data: Partial<FundingDeal>) => Promise<FundingDeal>;
  updateDeal: (id: string, data: Partial<FundingDeal>) => Promise<FundingDeal>;
  deleteDeal: (id: string) => Promise<void>;
  updateDealStatus: (id: string, status: string, note?: string) => Promise<FundingDeal>;
  duplicateDeal: (id: string, overrides?: Partial<FundingDeal>) => Promise<FundingDeal>;
  addDealActivity: (dealId: string, action: string, notes?: string, field?: string, prevVal?: any, newVal?: any) => Promise<void>;

  // Commissions & Rules
  saveCommissionRule: (rule: Partial<CommissionRule>) => Promise<CommissionRule>;
  deleteCommissionRule: (id: string) => Promise<void>;
  addCommissionParticipant: (dealId: string, data: Partial<CommissionParticipant>) => Promise<CommissionParticipant>;
  updateCommissionParticipant: (id: string, data: Partial<CommissionParticipant>) => Promise<CommissionParticipant>;
  deleteCommissionParticipant: (id: string) => Promise<void>;
  markDealCommissionReceived: (dealId: string) => Promise<void>;
  addCommissionDirectoryEntry: (entry: Partial<CommissionDirectoryEntry>) => Promise<void>;
  deleteCommissionDirectoryEntry: (id: string) => Promise<void>;

  // Tasks
  createTask: (data: Partial<InternalTask>) => Promise<InternalTask>;
  updateTask: (id: string, data: Partial<InternalTask>) => Promise<InternalTask>;
  deleteTask: (id: string) => Promise<void>;
  snoozeTask: (id: string, hours: number) => Promise<InternalTask>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;

  // Funding Strategy
  saveFundingStrategy: (clientId: string, data: Partial<FundingStrategyRecord>) => Promise<FundingStrategyRecord>;

  // Internal Notes
  createClientInternalNote: (clientId: string, note: Partial<ClientInternalNote>) => Promise<ClientInternalNote>;

  // Lender History
  createLenderHistoryRecord: (data: Partial<LenderHistoryRecord>) => Promise<LenderHistoryRecord>;
  updateLenderHistoryRecord: (id: string, data: Partial<LenderHistoryRecord>) => Promise<LenderHistoryRecord>;
  deleteLenderHistoryRecord: (id: string) => Promise<void>;

  // Credit Cards
  createCreditCard: (data: Partial<CreditCardRecord>) => Promise<CreditCardRecord>;
  updateCreditCard: (id: string, data: Partial<CreditCardRecord>) => Promise<CreditCardRecord>;
  deleteCreditCard: (id: string) => Promise<void>;

  // Master Verification
  saveMasterVerification: (clientId: string, data: Partial<MasterVerificationData>) => Promise<MasterVerificationData>;

  // Documents & Storage
  uploadDocumentFile: (file: File, clientId: string, category: DocumentItem['category'], dealId?: string, uploadedBy?: string) => Promise<DocumentItem>;
  updateDocumentStatus: (docId: string, status: string, reviewedBy: string, notes?: string) => Promise<DocumentItem>;
  deleteDocument: (docId: string) => Promise<void>;

  // Roles & Users
  createRole: (data: Partial<UserRole>) => Promise<UserRole>;
  updateRole: (id: string, data: Partial<UserRole>) => Promise<UserRole>;
  createStaffUser: (data: Partial<StaffUser>) => Promise<StaffUser>;
  updateStaffUser: (id: string, data: Partial<StaffUser>) => Promise<StaffUser>;
  deleteStaffUser: (id: string) => Promise<void>;

  // Discord & Firebase
  updateDiscordConfig: (data: Partial<DiscordConfig>) => Promise<void>;
  testDiscordWebhook: (url?: string, extra?: { channelName?: string; botUsername?: string; mentionRole?: string }) => Promise<{ success: boolean; message: string; httpStatus?: number; timestamp?: string }>;
  notifyDiscord: (eventKey: string, eventTitle: string, details: Record<string, any>, options?: { force?: boolean }) => Promise<any>;
  fetchDiscordLogs: () => Promise<any[]>;
  clearDiscordLogs: () => Promise<void>;
  updateFirebaseConfig: (data: Partial<FirebaseClientConfig>) => Promise<void>;

  // GHL
  syncGhlNow: () => Promise<void>;
  updateGhlConfig: (data: Partial<GhlConfig>) => Promise<GhlConfig>;
  testGhlConnection: (data?: Partial<GhlConfig>) => Promise<{ success: boolean; message: string; locationName?: string }>;

  // Settings
  createLeadSource: (name: string) => Promise<void>;
  deleteLeadSource: (id: string) => Promise<void>;
  createReferralPartner: (partner: Partial<ReferralPartnerOption>) => Promise<void>;
  deleteReferralPartner: (id: string) => Promise<void>;

  // Products & Funding Types Catalog
  createProduct: (product: Partial<FundingProductDefinition>) => Promise<FundingProductDefinition>;
  updateProduct: (id: string, data: Partial<FundingProductDefinition>) => Promise<FundingProductDefinition>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductActive: (id: string, active: boolean) => Promise<void>;
  resetProductsToDefault: () => Promise<void>;

  // Migration Runner
  runDbMigration: (force?: boolean) => Promise<{ success: boolean; recordsImported: number; details: string }>;

  // Production Error & Diagnostics Telemetry
  recordProductionError: (data: Partial<ProductionErrorRecord>) => Promise<ProductionErrorRecord>;
  resolveProductionError: (id: string, note?: string, resolvedBy?: string) => Promise<boolean>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser, currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<FundingDeal[]>([]);
  const [commissions, setCommissions] = useState<CommissionParticipant[]>([]);
  const [commissionRules, setCommissionRules] = useState<CommissionRule[]>([]);
  const [commissionDirectory, setCommissionDirectory] = useState<CommissionDirectoryEntry[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSourceOption[]>([]);
  const [referralPartners, setReferralPartners] = useState<ReferralPartnerOption[]>([]);
  const [products, setProducts] = useState<FundingProductDefinition[]>(MASTER_FUNDING_PRODUCTS);
  const [ghlConfig, setGhlConfig] = useState<GhlConfig | null>(null);
  const [tasks, setTasks] = useState<InternalTask[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig | null>(null);
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseClientConfig | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [productionErrors, setProductionErrors] = useState<ProductionErrorRecord[]>([]);

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientData, setSelectedClientData] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Real-time Subscriptions / Data Synchronization
  useEffect(() => {
    // Wait until an authenticated user session exists before opening listeners
    if (!currentUser && !firebaseUser) {
      setIsLoading(false);
      return;
    }

    let unsubs: (() => void)[] = [];

    // Bootstrap/Seed initial data if Firestore is connected
    const db = getDb();
    if (db) {
      firestoreService.seedFirestoreFromDbJson(false).then((res) => {
        if (res.recordsImported > 0) {
          console.log(`Firestore bootstrap seeded ${res.recordsImported} initial records.`);
        }
      }).catch((err) => {
        console.warn('Firestore initial seed note:', err);
      });
    }

    try {
      unsubs.push(firestoreService.subscribeClients((items) => setClients(items)));
      unsubs.push(firestoreService.subscribeDeals((items) => setDeals(items)));
      unsubs.push(firestoreService.subscribeLeads((items) => setLeads(items)));
      unsubs.push(firestoreService.subscribeCommissions((items) => setCommissions(items)));
      unsubs.push(firestoreService.subscribeCommissionRules((items) => setCommissionRules(items)));
      unsubs.push(firestoreService.subscribeCommissionDirectory((items) => setCommissionDirectory(items)));
      unsubs.push(firestoreService.subscribeTasks((items) => setTasks(items)));
      unsubs.push(firestoreService.subscribeNotifications((items) => setNotifications(items)));
      unsubs.push(firestoreService.subscribeRoles((items) => setRoles(items)));
      unsubs.push(firestoreService.subscribeLeadSources((items) => setLeadSources(items)));
      unsubs.push(firestoreService.subscribeReferralPartners((items) => setReferralPartners(items)));
      unsubs.push(firestoreService.subscribeProducts((items) => setProducts(items)));
      unsubs.push(firestoreService.subscribeTimeline(undefined, (items) => setTimelineEvents(items)));
      unsubs.push(firestoreService.subscribeDocuments(undefined, (items) => setDocuments(items)));
      unsubs.push(firestoreService.subscribeProductionErrors((items) => setProductionErrors(items)));

      // Load static settings
      firestoreService.getDiscordConfig().then(setDiscordConfig).catch(() => {});
      firestoreService.getGhlConfig().then(setGhlConfig).catch(() => {});
      api.getFirebaseConfig().then(setFirebaseConfig).catch(() => {});

      setIsLoading(false);
    } catch (err) {
      console.error('Error establishing listeners:', err);
      setIsLoading(false);
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [currentUser, firebaseUser]);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const cfg = await api.getFirebaseConfig();
      setFirebaseConfig(cfg);
      const discord = await firestoreService.getDiscordConfig();
      if (discord) setDiscordConfig(discord);
      const ghl = await firestoreService.getGhlConfig();
      if (ghl) setGhlConfig(ghl);
      addToast('info', 'Synced with Firestore', 'All collections synchronized with Cloud Firestore.');
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const refreshClientDetail = useCallback(async (clientId: string) => {
    try {
      const detail = await firestoreService.getClientDetail(clientId);
      setSelectedClientData(detail);
      if (detail.client) {
        setClients((prev) => prev.map((c) => (c.id === clientId ? detail.client : c)));
      }
    } catch (err) {
      console.error('Failed to load client detail:', err);
    }
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      refreshClientDetail(selectedClientId);
    } else {
      setSelectedClientData(null);
    }
  }, [selectedClientId, refreshClientDetail]);

  // Leads CRUD
  const createLead = async (data: Partial<Lead>): Promise<Lead> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createLead(data);
      addToast('success', 'Lead Created', `Lead for ${created.firstName} ${created.lastName} saved to Firestore.`);
      
      // Dispatch real Discord notification
      notifyDiscord('newLead', 'NEW INBOUND LEAD INGESTED', {
        clientName: `${created.firstName} ${created.lastName}`.trim(),
        businessName: created.businessName,
        amount: created.estimatedAmount,
        product: 'Business Funding',
        leadSource: created.leadSource,
        contactEmail: created.email,
        contactPhone: created.phone,
        assignedUser: created.assignedSalesRep,
      });

      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save lead');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateLead = async (id: string, data: Partial<Lead>): Promise<Lead> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateLead(id, data);
      addToast('success', 'Lead Updated', `Lead record for ${updated.firstName} ${updated.lastName} updated in Firestore.`);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update lead');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLead = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteLead(id);
      addToast('success', 'Lead Deleted', 'Lead removed from Firestore.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete lead');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const convertLeadToClient = async (id: string, customData?: Record<string, any>): Promise<{ client: Client; deal: FundingDeal }> => {
    setIsSaving(true);
    try {
      const result = await firestoreService.convertLeadToClient(id, customData);
      addToast('success', 'Lead Converted', `${result.client.firstName} ${result.client.lastName} converted to Client File & Deal Stack initialized.`);
      setSelectedClientId(result.client.id);

      // Dispatch Discord notification for new client converted
      notifyDiscord('newClient', 'NEW CLIENT ONBOARDED FROM LEAD', {
        clientName: `${result.client.firstName} ${result.client.lastName}`.trim(),
        businessName: result.client.businessName,
        amount: result.deal.fundingAmount,
        product: result.deal.product,
        lender: result.deal.lenderName,
        stage: 'Client Converted',
        assignedUser: result.deal.assignedStaff,
        clientId: result.client.id,
        dealId: result.deal.id,
      });

      return result;
    } catch (err: any) {
      addToast('error', 'Conversion Failed', err.message || 'Failed to convert lead');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Clients CRUD
  const createClient = async (data: Partial<Client>): Promise<Client> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createClient(data);
      addToast('success', 'Client File Created', `Client profile for ${created.firstName} ${created.lastName} saved to Firestore.`);

      // Dispatch Discord notification
      notifyDiscord('newClient', 'NEW CLIENT FILE CREATED', {
        clientName: `${created.firstName} ${created.lastName}`.trim(),
        businessName: created.businessName,
        stage: 'New Client File',
        clientId: created.id,
      });

      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not create client');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateClient = async (id: string, data: Partial<Client>): Promise<Client> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateClient(id, data);
      addToast('success', 'Client Profile Saved', `Client profile for ${updated.firstName} ${updated.lastName} saved to Firestore.`);
      if (selectedClientId === id) {
        refreshClientDetail(id);
      }
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update client');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteClient = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteClient(id);
      addToast('success', 'Client Deleted', 'Client record removed from Firestore.');
      if (selectedClientId === id) {
        setSelectedClientId(null);
      }
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete client');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const auditSsnView = async (id: string, staffName: string): Promise<void> => {
    try {
      await api.auditSsnView(id, staffName);
    } catch (err) {
      console.warn('SSN audit note:', err);
    }
  };

  // Deals CRUD (Stacking Supported)
  const createDeal = async (data: Partial<FundingDeal>): Promise<FundingDeal> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createDeal(data);
      addToast('success', 'Deal Created', `New funding deal for $${created.fundingAmount.toLocaleString()} added to stack.`);
      if (data.clientId && selectedClientId === data.clientId) {
        refreshClientDetail(data.clientId);
      }

      // Check for Pre-Approved or Approved on create
      if (created.status === 'PRE_APPROVED') {
        notifyDiscord('preApprovalReceived', 'PRE-APPROVAL RECEIVED FROM LENDER', {
          clientName: created.clientName,
          businessName: created.businessName,
          lender: created.lenderName,
          amount: created.fundingAmount,
          product: created.product,
          stage: created.status,
          dealId: created.id,
          clientId: created.clientId,
        });
      } else if (created.status === 'APPROVED') {
        notifyDiscord('approvalReceived', 'LENDER APPROVAL RECEIVED', {
          clientName: created.clientName,
          businessName: created.businessName,
          lender: created.lenderName,
          amount: created.fundingAmount,
          product: created.product,
          stage: created.status,
          dealId: created.id,
          clientId: created.clientId,
        });
      } else if (created.status === 'FUNDED') {
        notifyDiscord('dealFunded', 'CLIENT DEAL FUNDED SUCCESSFULLY!', {
          clientName: created.clientName,
          businessName: created.businessName,
          lender: created.lenderName,
          amount: created.fundingAmount,
          product: created.product,
          commissionAmount: (created.fundingAmount * created.percentage) / 100,
          stage: created.status,
          dealId: created.id,
          clientId: created.clientId,
        });
      }

      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not create deal');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateDeal = async (id: string, data: Partial<FundingDeal>): Promise<FundingDeal> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateDeal(id, data);
      addToast('success', 'Deal Saved', `${updated.product} deal updated successfully in Firestore.`);
      if (updated.clientId && selectedClientId === updated.clientId) {
        refreshClientDetail(updated.clientId);
      }

      // Deal status transition notifications
      if (data.status === 'PRE_APPROVED') {
        notifyDiscord('preApprovalReceived', 'PRE-APPROVAL RECEIVED FROM LENDER', {
          clientName: updated.clientName,
          businessName: updated.businessName,
          lender: updated.lenderName,
          amount: updated.fundingAmount,
          product: updated.product,
          stage: updated.status,
          dealId: updated.id,
          clientId: updated.clientId,
        });
      } else if (data.status === 'APPROVED') {
        notifyDiscord('approvalReceived', 'LENDER APPROVAL RECEIVED', {
          clientName: updated.clientName,
          businessName: updated.businessName,
          lender: updated.lenderName,
          amount: updated.fundingAmount,
          product: updated.product,
          stage: updated.status,
          dealId: updated.id,
          clientId: updated.clientId,
        });
      } else if (data.status === 'FUNDED') {
        notifyDiscord('dealFunded', 'CLIENT DEAL FUNDED SUCCESSFULLY!', {
          clientName: updated.clientName,
          businessName: updated.businessName,
          lender: updated.lenderName,
          amount: updated.fundingAmount,
          product: updated.product,
          commissionAmount: (updated.fundingAmount * updated.percentage) / 100,
          stage: updated.status,
          dealId: updated.id,
          clientId: updated.clientId,
        });
      }

      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update deal');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDeal = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteDeal(id);
      addToast('success', 'Deal Deleted', 'Funding deal removed from stack.');
      if (selectedClientId) {
        refreshClientDetail(selectedClientId);
      }
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete deal');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateDealStatus = async (id: string, status: string, note?: string): Promise<FundingDeal> => {
    setIsSaving(true);
    try {
      const deal = deals.find((d) => d.id === id || d.dealId === id);
      const prevStatus = deal?.status || 'Draft';
      const updated = await firestoreService.updateDeal(id, {
        status,
        updatedBy: currentUser?.name || 'Staff',
      });

      if (note || status !== prevStatus) {
        await addDealActivity(
          updated.id,
          'Status Changed',
          note || `Status changed from ${prevStatus} to ${status}`,
          'status',
          prevStatus,
          status
        );
      }

      addToast('success', 'Status Updated', `Deal ${updated.dealId || updated.product} moved to ${status}.`);
      if (updated.clientId && selectedClientId === updated.clientId) {
        refreshClientDetail(updated.clientId);
      }
      return updated;
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err.message || 'Could not update deal status');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const duplicateDeal = async (id: string, overrides: Partial<FundingDeal> = {}): Promise<FundingDeal> => {
    setIsSaving(true);
    try {
      const source = deals.find((d) => d.id === id || d.dealId === id);
      if (!source) throw new Error('Source deal not found to clone');

      const cloned = await firestoreService.createDeal({
        ...source,
        id: undefined,
        dealId: undefined,
        status: overrides.status || 'Draft',
        fundingDate: '',
        approvalDate: '',
        declineDate: '',
        declineReason: '',
        commissionStatus: 'PENDING',
        commissionReceivedDate: '',
        isStacked: true,
        createdBy: currentUser?.name || 'Staff',
        notes: `Cloned from deal ${source.dealId || source.id}. ${overrides.notes || ''}`,
        ...overrides,
      });

      addToast('success', 'Deal Cloned', `Cloned deal ${cloned.dealId || cloned.id} created successfully.`);
      if (cloned.clientId && selectedClientId === cloned.clientId) {
        refreshClientDetail(cloned.clientId);
      }
      return cloned;
    } catch (err: any) {
      addToast('error', 'Clone Failed', err.message || 'Could not clone deal');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addDealActivity = async (
    dealId: string,
    action: string,
    notes?: string,
    field?: string,
    prevVal?: any,
    newVal?: any
  ): Promise<void> => {
    try {
      const deal = deals.find((d) => d.id === dealId || d.dealId === dealId);
      if (!deal) return;

      const newActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        dealId: deal.id,
        timestamp: new Date().toISOString(),
        user: currentUser?.name || 'Staff',
        action,
        field,
        previousValue: prevVal,
        newValue: newVal,
        notes: notes || '',
      };

      const existingActivities = Array.isArray(deal.activityHistory) ? deal.activityHistory : [];
      await firestoreService.updateDeal(deal.id, {
        activityHistory: [newActivity, ...existingActivities],
      });
    } catch (err) {
      console.warn('Failed to add deal activity log:', err);
    }
  };

  // Commissions & Commission Rules by Funding Type
  const saveCommissionRule = async (rule: Partial<CommissionRule>): Promise<CommissionRule> => {
    setIsSaving(true);
    try {
      const saved = await firestoreService.saveCommissionRule(rule);
      addToast('success', 'Commission Rule Saved', `Commission rule for ${saved.loanType} (${saved.defaultRate}%) saved to Firestore.`);
      return saved;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save commission rule');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCommissionRule = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteCommissionRule(id);
      addToast('success', 'Rule Deleted', 'Commission rule removed from Firestore.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete commission rule');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addCommissionParticipant = async (dealId: string, data: Partial<CommissionParticipant>): Promise<CommissionParticipant> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.addCommissionParticipant(dealId, data);
      addToast('success', 'Participant Added', `${created.name} added with ${created.points} points.`);
      if (selectedClientId) refreshClientDetail(selectedClientId);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not add participant');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateCommissionParticipant = async (id: string, data: Partial<CommissionParticipant>): Promise<CommissionParticipant> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateCommissionParticipant(id, data);
      addToast('success', 'Points Updated', `Commission allocation for ${updated.name} updated.`);
      if (selectedClientId) refreshClientDetail(selectedClientId);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update participant');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCommissionParticipant = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteCommissionParticipant(id);
      addToast('success', 'Participant Removed', 'Commission participant removed.');
      if (selectedClientId) refreshClientDetail(selectedClientId);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not remove participant');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const markDealCommissionReceived = async (dealId: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.markCommissionReceived(dealId);
      addToast('success', 'Commission Settled', 'Deal marked as COLLECTED and participants marked as RECEIVED.');
      if (selectedClientId) refreshClientDetail(selectedClientId);
    } catch (err: any) {
      addToast('error', 'Settlement Failed', err.message || 'Could not settle commission');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addCommissionDirectoryEntry = async (entry: Partial<CommissionDirectoryEntry>): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.createCommissionDirectoryEntry(entry);
      addToast('success', 'Directory Entry Added', `${entry.name} saved to Commission Directory.`);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not add directory entry');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCommissionDirectoryEntry = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteCommissionDirectoryEntry(id);
      addToast('success', 'Entry Removed', 'Directory entry removed from Firestore.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete entry');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Tasks CRUD
  const createTask = async (data: Partial<InternalTask>): Promise<InternalTask> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createTask(data);
      addToast('success', 'Task Created', `Task "${created.title}" saved to Firestore.`);

      // Dispatch Discord notification
      const isHighPriority = created.priority === 'High';
      notifyDiscord(isHighPriority ? 'highPriorityTaskCreated' : 'taskAssigned', `TASK CREATED: ${created.title}`, {
        taskTitle: created.title,
        priority: created.priority,
        assignedUser: created.assignedTo,
        dueDate: created.dueDate,
        category: created.category,
        clientName: created.clientName,
        clientId: created.clientId,
      });

      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not create task');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = async (id: string, data: Partial<InternalTask>): Promise<InternalTask> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateTask(id, data);
      addToast('success', 'Task Updated', `Task "${updated.title}" updated in Firestore.`);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update task');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteTask(id);
      addToast('success', 'Task Deleted', 'Task removed from Firestore.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete task');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const snoozeTask = async (id: string, hours: number): Promise<InternalTask> => {
    setIsSaving(true);
    try {
      const snoozed = await firestoreService.snoozeTask(id, hours);
      addToast('info', 'Task Snoozed', `Due time postponed by ${hours} hours.`);
      return snoozed;
    } catch (err: any) {
      addToast('error', 'Snooze Failed', err.message || 'Could not snooze task');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Notifications
  const markNotificationRead = async (id: string): Promise<void> => {
    try {
      await firestoreService.markNotificationRead(id);
    } catch (err) {
      console.warn('Notification mark read note:', err);
    }
  };

  const markAllNotificationsRead = async (userId: string): Promise<void> => {
    try {
      await firestoreService.markAllNotificationsRead(userId);
      addToast('info', 'Notifications Cleared', 'All notifications marked as read.');
    } catch (err) {
      console.warn('Notification mark all note:', err);
    }
  };

  // Funding Strategy
  const saveFundingStrategy = async (clientId: string, data: Partial<FundingStrategyRecord>): Promise<FundingStrategyRecord> => {
    setIsSaving(true);
    try {
      const saved = await firestoreService.saveFundingStrategy(clientId, data);
      addToast('success', 'Funding Strategy Saved', 'Strategy and execution roadmap updated in Firestore.');
      if (selectedClientId === clientId) refreshClientDetail(clientId);
      return saved;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save strategy');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Internal Notes
  const createClientInternalNote = async (clientId: string, note: Partial<ClientInternalNote>): Promise<ClientInternalNote> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createClientInternalNote(clientId, note);
      addToast('success', 'Note Added', 'Internal staff note logged to client record.');
      if (selectedClientId === clientId) refreshClientDetail(clientId);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save note');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Lender History
  const createLenderHistoryRecord = async (data: Partial<LenderHistoryRecord>): Promise<LenderHistoryRecord> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createLenderHistoryRecord(data);
      addToast('success', 'Lender History Saved', `Submission to ${created.lenderName} recorded in Firestore.`);
      if (data.clientId && selectedClientId === data.clientId) refreshClientDetail(data.clientId);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not record lender submission');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateLenderHistoryRecord = async (id: string, data: Partial<LenderHistoryRecord>): Promise<LenderHistoryRecord> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateLenderHistoryRecord(id, data);
      addToast('success', 'Lender Record Updated', `Lender status for ${updated.lenderName} updated.`);
      if (updated.clientId && selectedClientId === updated.clientId) refreshClientDetail(updated.clientId);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update lender record');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLenderHistoryRecord = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteLenderHistoryRecord(id);
      addToast('success', 'Record Deleted', 'Lender history record removed.');
      if (selectedClientId) refreshClientDetail(selectedClientId);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete record');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Credit Cards
  const createCreditCard = async (data: Partial<CreditCardRecord>): Promise<CreditCardRecord> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createCreditCard(data);
      addToast('success', 'Card Added', `${created.issuer} ${created.cardName} saved to stack.`);
      if (data.clientId && selectedClientId === data.clientId) refreshClientDetail(data.clientId);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not add card');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateCreditCard = async (id: string, data: Partial<CreditCardRecord>): Promise<CreditCardRecord> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateCreditCard(id, data);
      addToast('success', 'Card Updated', `${updated.cardName} updated in Firestore.`);
      if (updated.clientId && selectedClientId === updated.clientId) refreshClientDetail(updated.clientId);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update card');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCreditCard = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteCreditCard(id);
      addToast('success', 'Card Removed', 'Credit card removed from stack.');
      if (selectedClientId) refreshClientDetail(selectedClientId);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete card');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Master Verification
  const saveMasterVerification = async (clientId: string, data: Partial<MasterVerificationData>): Promise<MasterVerificationData> => {
    setIsSaving(true);
    try {
      const saved = await firestoreService.saveMasterVerification(clientId, data);
      addToast('success', 'Verification Saved', `Master verification worksheet saved (${saved.status}).`);
      if (selectedClientId === clientId) refreshClientDetail(clientId);

      // Dispatch Discord notification on verification completion or action required
      if (saved.status === 'VERIFIED') {
        notifyDiscord('verificationComplete', 'CLIENT VERIFICATION COMPLETED (KYC APPROVED)', {
          clientName: selectedClientData?.client ? `${selectedClientData.client.firstName} ${selectedClientData.client.lastName}` : 'Client',
          businessName: selectedClientData?.client?.businessName,
          stage: 'KYC Verified & Ready for Underwriting',
          assignedUser: saved.verifiedBy,
          clientId,
        });
      } else if (saved.status === 'ACTION_REQUIRED' || saved.status === 'FAILED' || saved.status === 'UNVERIFIED' || saved.status === 'NEEDS_CORRECTION') {
        notifyDiscord('verificationFailed', 'VERIFICATION ATTENTION REQUIRED', {
          clientName: selectedClientData?.client ? `${selectedClientData.client.firstName} ${selectedClientData.client.lastName}` : 'Client',
          businessName: selectedClientData?.client?.businessName,
          stage: `Verification Status: ${saved.status}`,
          notes: saved.internalNotesRedFlags || saved.callSummary,
          clientId,
        });
      }

      return saved;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save verification');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Documents & Firebase Storage
  const uploadDocumentFile = async (
    file: File,
    clientId: string,
    category: DocumentItem['category'],
    dealId?: string,
    uploadedBy: string = 'Staff'
  ): Promise<DocumentItem> => {
    setIsSaving(true);
    try {
      const docItem = await firestoreService.uploadDocument(file, clientId, category, dealId, uploadedBy);
      addToast('success', 'File Uploaded', `Document "${file.name}" uploaded to Firebase Storage and indexed.`);
      if (selectedClientId === clientId) refreshClientDetail(clientId);

      // Dispatch Discord notification
      notifyDiscord('documentUploaded', 'VAULT DOCUMENT UPLOADED', {
        clientName: selectedClientData?.client ? `${selectedClientData.client.firstName} ${selectedClientData.client.lastName}` : 'Client',
        businessName: selectedClientData?.client?.businessName,
        fileName: file.name,
        category,
        uploadedBy,
        clientId,
        dealId,
      });

      return docItem;
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Could not upload file to Cloud Storage');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateDocumentStatus = async (docId: string, status: string, reviewedBy: string, notes?: string): Promise<DocumentItem> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateDocument(docId, {
        status: status as any,
        reviewedBy,
        reviewedDate: new Date().toISOString(),
        notes,
      });
      addToast('success', 'Document Status Updated', `Status updated to ${status}.`);
      if (selectedClientId) refreshClientDetail(selectedClientId);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update document');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteDocument = async (docId: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteDocument(docId);
      addToast('success', 'Document Deleted', 'File removed from Firebase Storage.');
      if (selectedClientId) refreshClientDetail(selectedClientId);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete document');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Roles & Users
  const createRole = async (data: Partial<UserRole>): Promise<UserRole> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createRole(data);
      addToast('success', 'Role Created', `Role "${created.name}" saved to Firestore.`);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not create role');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateRole = async (id: string, data: Partial<UserRole>): Promise<UserRole> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateRole(id, data);
      addToast('success', 'Role Updated', `Role "${updated.name}" updated in Firestore.`);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update role');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const createStaffUser = async (data: Partial<StaffUser>): Promise<StaffUser> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createStaffUser(data);
      addToast('success', 'Team Member Added', `${created.name} added to staff directory.`);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not add staff member');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateStaffUser = async (id: string, data: Partial<StaffUser>): Promise<StaffUser> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateStaffUser(id, data);
      addToast('success', 'Staff Member Updated', `${updated.name} updated in Firestore.`);
      return updated;
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update staff member');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStaffUser = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteStaffUser(id);
      addToast('success', 'Staff Member Removed', 'Staff user removed from directory.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not remove staff member');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Discord Notification Dispatcher & Management
  const notifyDiscord = async (
    eventKey: string,
    eventTitle: string,
    details: Record<string, any>,
    options?: { force?: boolean }
  ): Promise<any> => {
    try {
      return await api.sendDiscordNotification(eventKey, eventTitle, details, options);
    } catch (err) {
      console.debug('Discord notification dispatch notice:', err);
      return { success: false, message: 'Notice: dispatch failed' };
    }
  };

  const fetchDiscordLogs = async (): Promise<any[]> => {
    return api.getDiscordLogs();
  };

  const clearDiscordLogs = async (): Promise<void> => {
    await api.clearDiscordLogs();
    addToast('info', 'Discord Logs Cleared', 'Notification history log cleared.');
  };

  const updateDiscordConfig = async (data: Partial<DiscordConfig>): Promise<void> => {
    setIsSaving(true);
    try {
      const updated = await api.updateDiscordConfig(data);
      setDiscordConfig(updated);
      addToast('success', 'Discord Settings Saved', 'Webhook configuration synchronized successfully.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save Discord settings');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const testDiscordWebhook = async (
    url?: string,
    extra?: { channelName?: string; botUsername?: string; mentionRole?: string }
  ): Promise<{ success: boolean; message: string; httpStatus?: number; timestamp?: string }> => {
    const res = await api.testDiscordWebhook(url, extra);
    // Refresh discord config to capture last tested timestamp/status
    api.getDiscordConfig().then(setDiscordConfig).catch(() => {});
    return res;
  };

  const updateFirebaseConfig = async (data: Partial<FirebaseClientConfig>): Promise<void> => {
    setIsSaving(true);
    try {
      const updated = await api.updateFirebaseConfig(data);
      setFirebaseConfig(updated);
      addToast('success', 'Firebase Config Saved', `Target Project: ${updated.projectId} (${updated.firestoreDatabaseId || '(default)'})`);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not update Firebase config');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // GHL
  const syncGhlNow = async (): Promise<void> => {
    setIsSaving(true);
    try {
      const res = await api.syncGhlNow();
      addToast('success', 'GHL Synchronized', res.message);
    } catch (err: any) {
      addToast('error', 'GHL Sync Failed', err.message || 'Could not sync with GoHighLevel');
    } finally {
      setIsSaving(false);
    }
  };

  const updateGhlConfig = async (data: Partial<GhlConfig>): Promise<GhlConfig> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateGhlConfig(data);
      setGhlConfig(updated);
      addToast('success', 'GHL Settings Saved', 'GoHighLevel integration config saved.');
      return updated;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save GHL config');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const testGhlConnection = async (data?: Partial<GhlConfig>): Promise<{ success: boolean; message: string; locationName?: string }> => {
    return api.testGhlConnection(data);
  };

  // Settings
  const createLeadSource = async (name: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.createLeadSource(name);
      addToast('success', 'Lead Source Added', `Source "${name}" saved to Firestore.`);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not create lead source');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLeadSource = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteLeadSource(id);
      addToast('success', 'Lead Source Removed', 'Source deleted from Firestore.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete lead source');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const createReferralPartner = async (partner: Partial<ReferralPartnerOption>): Promise<void> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createReferralPartner(partner);
      addToast('success', 'Referral Partner Saved', `${created.name} (${created.company}) saved to Firestore.`);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save referral partner');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteReferralPartner = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteReferralPartner(id);
      addToast('success', 'Partner Removed', 'Referral partner deleted from Firestore.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete referral partner');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Products & Funding Types Catalog
  const createProduct = async (product: Partial<FundingProductDefinition>): Promise<FundingProductDefinition> => {
    setIsSaving(true);
    try {
      const created = await firestoreService.createProduct(product);
      addToast('success', 'Product Created', `Product "${created.name}" created successfully.`);
      return created;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not create product');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProduct = async (id: string, data: Partial<FundingProductDefinition>): Promise<FundingProductDefinition> => {
    setIsSaving(true);
    try {
      const updated = await firestoreService.updateProduct(id, data);
      addToast('success', 'Product Updated', `Product "${updated.name}" updated.`);
      return updated;
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not update product');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async (id: string): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.deleteProduct(id);
      addToast('success', 'Product Deleted', 'Product removed from catalog.');
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete product');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductActive = async (id: string, active: boolean): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.toggleProductActive(id, active);
      addToast('info', 'Status Updated', `Product status set to ${active ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update product status');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const resetProductsToDefault = async (): Promise<void> => {
    setIsSaving(true);
    try {
      await firestoreService.resetProductsToDefault();
      addToast('success', 'Catalog Reset', 'Product catalog reset to standard default offerings.');
    } catch (err: any) {
      addToast('error', 'Reset Failed', err.message || 'Could not reset products');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Migration Runner
  const runDbMigration = async (force: boolean = true): Promise<{ success: boolean; recordsImported: number; details: string }> => {
    setIsSaving(true);
    try {
      const res = await firestoreService.seedFirestoreFromDbJson(force);
      addToast('success', 'Migration Completed', res.details);
      return res;
    } catch (err: any) {
      addToast('error', 'Migration Failed', err.message || 'Could not complete migration');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Production Error & Diagnostics Telemetry
  const recordProductionError = async (data: Partial<ProductionErrorRecord>): Promise<ProductionErrorRecord> => {
    return firestoreService.createProductionError(data);
  };

  const resolveProductionError = async (id: string, note?: string, resolvedBy?: string): Promise<boolean> => {
    try {
      const ok = await firestoreService.resolveProductionError(id, note, resolvedBy || currentUser?.name || 'Staff');
      if (ok) {
        addToast('success', 'Error Resolved', 'Diagnostic record marked as resolved.');
      }
      return ok;
    } catch (err: any) {
      addToast('error', 'Resolution Failed', err.message || 'Could not resolve error');
      return false;
    }
  };

  return (
    <DataContext.Provider
      value={{
        leads,
        clients,
        deals,
        commissions,
        commissionRules,
        commissionDirectory,
        leadSources,
        referralPartners,
        products,
        ghlConfig,
        tasks,
        notifications,
        roles,
        discordConfig,
        firebaseConfig,
        timelineEvents,
        documents,
        productionErrors,

        selectedClientId,
        selectedClientData,
        isLoading,
        isSaving,
        toasts,

        setSelectedClientId,
        refreshAll,
        refreshClientDetail,
        addToast,
        removeToast,

        createLead,
        updateLead,
        deleteLead,
        convertLeadToClient,

        createClient,
        updateClient,
        deleteClient,
        auditSsnView,

        createDeal,
        updateDeal,
        deleteDeal,
        updateDealStatus,
        duplicateDeal,
        addDealActivity,

        saveCommissionRule,
        deleteCommissionRule,
        addCommissionParticipant,
        updateCommissionParticipant,
        deleteCommissionParticipant,
        markDealCommissionReceived,
        addCommissionDirectoryEntry,
        deleteCommissionDirectoryEntry,

        createTask,
        updateTask,
        deleteTask,
        snoozeTask,

        markNotificationRead,
        markAllNotificationsRead,

        saveFundingStrategy,
        createClientInternalNote,

        createLenderHistoryRecord,
        updateLenderHistoryRecord,
        deleteLenderHistoryRecord,

        createCreditCard,
        updateCreditCard,
        deleteCreditCard,

        saveMasterVerification,

        uploadDocumentFile,
        updateDocumentStatus,
        deleteDocument,

        createRole,
        updateRole,
        createStaffUser,
        updateStaffUser,
        deleteStaffUser,

        updateDiscordConfig,
        testDiscordWebhook,
        notifyDiscord,
        fetchDiscordLogs,
        clearDiscordLogs,
        updateFirebaseConfig,

        syncGhlNow,
        updateGhlConfig,
        testGhlConnection,

        createLeadSource,
        deleteLeadSource,
        createReferralPartner,
        deleteReferralPartner,

        createProduct,
        updateProduct,
        deleteProduct,
        toggleProductActive,
        resetProductsToDefault,

        runDbMigration,

        recordProductionError,
        resolveProductionError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
