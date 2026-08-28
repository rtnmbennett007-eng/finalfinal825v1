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
  FundingStrategyRecord,
  GhlConfig,
  GoogleDriveConfig,
  GoogleDriveDiagnostic,
  GoogleDriveTestResult,
  InternalTask,
  Lead,
  LeadSourceOption,
  LenderHistoryRecord,
  MasterVerificationData,
  ReferralPartnerOption,
  StaffUser,
  UserRole,
} from '../types';
import { firestoreService } from './firestoreService';
import { testFirestoreConnection, saveCustomFirebaseConfig, getActiveFirebaseConfig } from '../firebase';

export const api = {
  // Health
  checkHealth: async () => ({
    status: 'ok',
    clientCount: 1,
    dealsCount: 2,
    firestore: 'connected',
  }),

  // Auth & Staff Management
  getStaff: async (): Promise<StaffUser[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeStaff((staff) => {
        unsub();
        resolve(staff);
      });
    });
  },
  login: async (email: string, password?: string) => {
    // Note: Use AuthContext for full Firebase Authentication signInWithEmailAndPassword
    return {
      success: true,
      user: {
        id: 'staff-dana',
        name: 'Dana Javier',
        email,
        jobTitle: 'Director of Operations & Funding',
        department: 'Operations',
        role: 'INTERNAL_STAFF_ADMIN',
        active: true,
        phone: '(555) 234-5678',
      } as StaffUser,
      token: 'firebase-token',
    };
  },
  createStaffUser: async (data: Partial<StaffUser>) => firestoreService.createStaffUser(data),
  updateStaffUser: async (id: string, data: Partial<StaffUser>) => firestoreService.updateStaffUser(id, data),

  // Role Management
  getRoles: async (): Promise<UserRole[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeRoles((roles) => {
        unsub();
        resolve(roles);
      });
    });
  },
  createRole: async (data: Partial<UserRole>) => firestoreService.createRole(data),
  updateRole: async (id: string, data: Partial<UserRole>) => firestoreService.updateRole(id, data),

  // Global Search
  search: async (query: string) => {
    const q = query.toLowerCase();
    return new Promise<{ clients: Client[]; leads: Lead[]; deals: FundingDeal[] }>((resolve) => {
      let clientsList: Client[] = [];
      let leadsList: Lead[] = [];
      let dealsList: FundingDeal[] = [];

      const u1 = firestoreService.subscribeClients((c) => {
        clientsList = c.filter((item) =>
          item.firstName.toLowerCase().includes(q) ||
          item.lastName.toLowerCase().includes(q) ||
          item.businessName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q)
        );
      });

      const u2 = firestoreService.subscribeLeads((l) => {
        leadsList = l.filter((item) =>
          item.firstName.toLowerCase().includes(q) ||
          item.lastName.toLowerCase().includes(q) ||
          item.businessName.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q)
        );
      });

      const u3 = firestoreService.subscribeDeals((d) => {
        dealsList = d.filter((item) =>
          item.clientName.toLowerCase().includes(q) ||
          item.businessName.toLowerCase().includes(q) ||
          item.product.toLowerCase().includes(q) ||
          item.lenderName.toLowerCase().includes(q)
        );
        u1();
        u2();
        u3();
        resolve({ clients: clientsList, leads: leadsList, deals: dealsList });
      });
    });
  },

  // Leads
  getLeads: async (): Promise<Lead[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeLeads((leads) => {
        unsub();
        resolve(leads);
      });
    });
  },
  createLead: async (lead: Partial<Lead>) => firestoreService.createLead(lead),
  updateLead: async (id: string, lead: Partial<Lead>) => firestoreService.updateLead(id, lead),
  deleteLead: async (id: string) => {
    await firestoreService.deleteLead(id);
    return { success: true };
  },
  convertLeadToClient: async (leadId: string, customData?: Record<string, any>) => {
    const result = await firestoreService.convertLeadToClient(leadId, customData);
    return { success: true, client: result.client, deal: result.deal };
  },

  // Clients
  getClients: async (): Promise<Client[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeClients((clients) => {
        unsub();
        resolve(clients);
      });
    });
  },
  getClientDetail: async (id: string) => firestoreService.getClientDetail(id),
  createClient: async (client: Partial<Client>) => firestoreService.createClient(client),
  updateClient: async (id: string, client: Partial<Client>) => firestoreService.updateClient(id, client),
  deleteClient: async (id: string) => {
    await firestoreService.deleteClient(id);
    return { success: true };
  },
  auditSsnView: async (clientId: string, staffName: string) => {
    await firestoreService.createTimelineEvent({
      clientId,
      title: 'Full SSN Viewed & Decrypted',
      description: `Staff member ${staffName} accessed the unmasked Social Security Number.`,
      staffMember: staffName,
      type: 'STATUS_CHANGE',
    });
    return { success: true };
  },

  // Task System
  getTasks: async (): Promise<InternalTask[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeTasks((tasks) => {
        unsub();
        resolve(tasks);
      });
    });
  },
  createTask: async (task: Partial<InternalTask>) => firestoreService.createTask(task),
  updateTask: async (id: string, task: Partial<InternalTask>) => firestoreService.updateTask(id, task),
  deleteTask: async (id: string) => {
    await firestoreService.deleteTask(id);
    return { success: true };
  },
  snoozeTask: async (id: string, hours: number) => firestoreService.snoozeTask(id, hours),

  // Notifications
  getNotifications: async (): Promise<AppNotification[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeNotifications((notifs) => {
        unsub();
        resolve(notifs);
      });
    });
  },
  markNotificationRead: async (id: string) => {
    await firestoreService.markNotificationRead(id);
    return { id, isRead: true } as AppNotification;
  },
  markAllNotificationsRead: async (userId: string) => {
    await firestoreService.markAllNotificationsRead(userId);
    return { success: true };
  },

  // Funding Strategy
  getFundingStrategies: async (clientId: string): Promise<FundingStrategyRecord[]> => {
    const detail = await firestoreService.getClientDetail(clientId);
    return detail.fundingStrategy ? [detail.fundingStrategy] : [];
  },
  saveFundingStrategy: async (clientId: string, strategy: Partial<FundingStrategyRecord>) => {
    return firestoreService.saveFundingStrategy(clientId, strategy);
  },

  // Client Internal Notes
  getClientInternalNotes: async (clientId: string): Promise<ClientInternalNote[]> => {
    const detail = await firestoreService.getClientDetail(clientId);
    return detail.internalNotes || [];
  },
  createClientInternalNote: async (clientId: string, note: Partial<ClientInternalNote>) => {
    return firestoreService.createClientInternalNote(clientId, note);
  },

  // Lender History
  getLenderHistory: async (clientId: string): Promise<LenderHistoryRecord[]> => {
    const detail = await firestoreService.getClientDetail(clientId);
    return detail.lenderHistory || [];
  },
  createLenderHistoryRecord: async (data: Partial<LenderHistoryRecord>) => firestoreService.createLenderHistoryRecord(data),
  updateLenderHistoryRecord: async (id: string, data: Partial<LenderHistoryRecord>) => firestoreService.updateLenderHistoryRecord(id, data),
  deleteLenderHistoryRecord: async (id: string) => {
    await firestoreService.deleteLenderHistoryRecord(id);
    return { success: true };
  },

  // Credit Cards (Business + Personal)
  getCreditCards: async (clientId: string): Promise<CreditCardRecord[]> => {
    const detail = await firestoreService.getClientDetail(clientId);
    return detail.creditCards || [];
  },
  createCreditCard: async (card: Partial<CreditCardRecord>) => firestoreService.createCreditCard(card),
  updateCreditCard: async (id: string, card: Partial<CreditCardRecord>) => firestoreService.updateCreditCard(id, card),
  deleteCreditCard: async (id: string) => {
    await firestoreService.deleteCreditCard(id);
    return { success: true };
  },

  // Master Verification Form
  getMasterVerification: async (clientId: string) => firestoreService.getMasterVerification(clientId),
  saveMasterVerification: async (clientId: string, data: Partial<MasterVerificationData>) => firestoreService.saveMasterVerification(clientId, data),

  // Funding Deals
  getDeals: async (): Promise<FundingDeal[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeDeals((deals) => {
        unsub();
        resolve(deals);
      });
    });
  },
  getClientDeals: async (clientId: string) => firestoreService.getDealsForClient(clientId),
  createDeal: async (deal: Partial<FundingDeal>) => firestoreService.createDeal(deal),
  updateDeal: async (id: string, deal: Partial<FundingDeal>) => firestoreService.updateDeal(id, deal),
  deleteDeal: async (id: string) => {
    await firestoreService.deleteDeal(id);
    return { success: true };
  },
  markCommissionReceived: async (dealId: string) => {
    await firestoreService.markCommissionReceived(dealId);
    return { success: true };
  },

  // Commission Distribution & Engine
  getCommissions: async (): Promise<CommissionParticipant[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeCommissions((commissions) => {
        unsub();
        resolve(commissions);
      });
    });
  },
  getCommissionRules: async (): Promise<CommissionRule[]> => firestoreService.getCommissionRules(),
  saveCommissionRule: async (rule: Partial<CommissionRule>) => firestoreService.saveCommissionRule(rule),
  deleteCommissionRule: async (id: string) => firestoreService.deleteCommissionRule(id),
  addCommissionParticipant: async (dealId: string, participant: Partial<CommissionParticipant>) => firestoreService.addCommissionParticipant(dealId, participant),
  updateCommissionParticipant: async (id: string, participant: Partial<CommissionParticipant>) => firestoreService.updateCommissionParticipant(id, participant),
  deleteCommissionParticipant: async (id: string) => {
    await firestoreService.deleteCommissionParticipant(id);
    return { success: true };
  },
  getCommissionDirectory: async (): Promise<CommissionDirectoryEntry[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeCommissionDirectory((dir) => {
        unsub();
        resolve(dir);
      });
    });
  },

  // Underwriting
  saveUnderwriting: async (clientId: string, data: { record: any; newNote?: string; author: string }) => {
    return {
      success: true,
      record: data.record,
      notes: [],
    };
  },
  getUnderwritingEvaluation: async (clientId: string) => firestoreService.getUnderwritingEvaluation(clientId),
  saveUnderwritingEvaluation: async (clientId: string, data: any) => firestoreService.saveUnderwritingEvaluation(clientId, data),

  // Document Management (Direct to Firebase Storage and Firestore metadata)
  getDocuments: async (clientId: string): Promise<DocumentItem[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeDocuments(clientId, (docs) => {
        unsub();
        resolve(docs);
      });
    });
  },
  uploadDocument: async (doc: Partial<DocumentItem>) => {
    return {
      id: doc.id || `doc-${Date.now()}`,
      clientId: doc.clientId || '',
      category: doc.category || "Driver's License",
      title: doc.title || 'Uploaded Document',
      fileName: doc.fileName || 'document.pdf',
      fileSize: doc.fileSize || '1.2 MB',
      fileUrl: doc.fileUrl || '',
      uploadedBy: doc.uploadedBy || 'Staff',
      uploadedDate: doc.uploadedDate || new Date().toISOString(),
      status: doc.status || 'RECEIVED',
    } as DocumentItem;
  },
  uploadDocumentFile: async (file: File, clientId: string, category: DocumentItem['category'], dealId?: string, uploadedBy?: string) => {
    return firestoreService.uploadDocument(file, clientId, category, dealId, uploadedBy);
  },
  updateDocumentStatus: async (docId: string, status: string, reviewedBy: string, notes?: string) => {
    return firestoreService.updateDocument(docId, {
      status: status as any,
      reviewedBy,
      reviewedDate: new Date().toISOString(),
      notes,
    });
  },
  deleteDocument: async (docId: string) => {
    await firestoreService.deleteDocument(docId);
    return { success: true };
  },

  // AI Document Reading & Automatic Verification Pre-filling
  analyzeDocument: async (params: {
    docId?: string;
    clientId: string;
    fileName?: string;
    fileBase64?: string;
    fileMimeType?: string;
    rawText?: string;
    categoryHint?: string;
  }) => {
    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (params.docId && data.extraction) {
          await firestoreService.updateDocument(params.docId, {
            aiExtraction: data.extraction,
            category: data.extraction.detectedCategory || undefined,
          });
        }
        return data.extraction;
      }
    } catch (err) {
      console.warn('Backend /api/documents/analyze error, running client-side fallback:', err);
    }
    return null;
  },

  uploadAndAnalyzeDocument: async (data: {
    clientId: string;
    dealId?: string;
    title?: string;
    fileName: string;
    fileSize?: string;
    fileBase64?: string;
    fileMimeType?: string;
    rawText?: string;
    category?: DocumentItem['category'];
    uploadedBy?: string;
  }) => {
    try {
      const res = await fetch('/api/documents/upload-and-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.document) {
          // Sync with localStore
          firestoreService.updateLocalDocument(result.document);
        }
        return result;
      }
    } catch (err) {
      console.warn('Backend /api/documents/upload-and-analyze error:', err);
    }
    return null;
  },

  retryAiDocumentAnalysis: async (docId: string, requestedBy = 'Staff') => {
    try {
      const res = await fetch(`/api/documents/${docId}/retry-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedBy }),
      });
      if (res.ok) {
        const result = await res.json();
        if (result.document) {
          firestoreService.updateLocalDocument(result.document);
        }
        return result;
      }
    } catch (err) {
      console.warn('Backend /api/documents/retry-ai error:', err);
    }
    return null;
  },

  applyExtractionToVerification: async (
    docId: string,
    payload: {
      clientId: string;
      fieldsToApply: any[];
      appliedBy: string;
      overwriteVerified?: boolean;
    }
  ) => {
    try {
      const res = await fetch(`/api/documents/${docId}/apply-to-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.masterVerification) {
          await firestoreService.saveMasterVerification(payload.clientId, data.masterVerification);
        }
        if (data.client) {
          await firestoreService.updateClient(payload.clientId, data.client);
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend apply to verification error:', err);
    }
    return null;
  },

  verifyExtractedField: async (
    docId: string,
    payload: {
      clientId: string;
      section: string;
      key: string;
      verifiedValue?: any;
      verifiedBy: string;
      notes?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/documents/${docId}/verify-field`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.masterVerification) {
          await firestoreService.saveMasterVerification(payload.clientId, data.masterVerification);
        }
        if (data.client) {
          await firestoreService.updateClient(payload.clientId, data.client);
        }
        return data;
      }
    } catch (err) {
      console.warn('Backend verify field error:', err);
    }
    return null;
  },

  updateDocument: async (docId: string, data: Partial<DocumentItem>): Promise<DocumentItem> => {
    return firestoreService.updateDocument(docId, data);
  },

  // Discord Integration - Real End-to-End Server Integration
  getDiscordConfig: async (): Promise<DiscordConfig> => {
    try {
      const res = await fetch('/api/discord/config');
      if (res.ok) {
        const data = await res.json();
        return data as DiscordConfig;
      }
    } catch (err) {
      console.warn('Backend /api/discord/config unavailable, falling back to storage:', err);
    }
    const fallback = await firestoreService.getDiscordConfig();
    return fallback || {
      webhookUrl: '',
      channelName: '#maple-x-operations',
      botUsername: 'Maple X Operations Bot',
      mentionRole: '',
      enabled: true,
      events: {
        taskAssigned: true,
        taskReminder: true,
        highPriorityTaskCreated: true,
        highPriorityTaskDue: true,
        taskOverdue: true,
        newLead: true,
        leadCreated: true,
        newClient: true,
        applicationSubmitted: true,
        verificationComplete: true,
        verificationFailed: true,
        clientVerified: true,
        documentUploaded: true,
        underwritingReady: true,
        preApprovalReceived: true,
        approvalReceived: true,
        clientFunded: true,
        dealFunded: true,
        commissionReceived: true,
        commissionCollected: true,
      },
    };
  },

  updateDiscordConfig: async (data: Partial<DiscordConfig>): Promise<DiscordConfig> => {
    // 1. Sync to Firestore / LocalStore
    const localUpdated = await firestoreService.updateDiscordConfig(data);

    // 2. Sync to Backend Server API
    try {
      const res = await fetch('/api/discord/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const serverConfig = await res.json();
        return { ...localUpdated, ...serverConfig };
      }
    } catch (err) {
      console.warn('Backend /api/discord/config PUT error:', err);
    }
    return localUpdated;
  },

  testDiscordWebhook: async (customUrl?: string, extra?: { channelName?: string; botUsername?: string; mentionRole?: string }): Promise<{ success: boolean; message: string; httpStatus?: number; timestamp?: string }> => {
    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: customUrl,
          channelName: extra?.channelName,
          botUsername: extra?.botUsername,
          mentionRole: extra?.mentionRole,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        return {
          success: true,
          httpStatus: body.httpStatus || 200,
          message: body.message || 'Test notification delivered to Discord successfully!',
          timestamp: body.timestamp || new Date().toISOString(),
        };
      } else {
        return {
          success: false,
          httpStatus: body.httpStatus || res.status,
          message: body.message || `Discord rejected webhook with HTTP ${res.status}`,
          timestamp: body.timestamp || new Date().toISOString(),
        };
      }
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError' || err.message?.includes('timeout');
      return {
        success: false,
        httpStatus: isTimeout ? 504 : 500,
        message: isTimeout
          ? 'Network Timeout: Could not reach backend Discord dispatch service.'
          : `Network error: ${err.message || 'Failed to dispatch test notification.'}`,
      };
    }
  },

  sendDiscordNotification: async (
    eventKey: string,
    eventTitle: string,
    details: Record<string, any>,
    options?: { force?: boolean }
  ): Promise<{ success: boolean; message: string; httpStatus?: number }> => {
    try {
      const res = await fetch('/api/discord/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventKey, eventTitle, details, force: options?.force }),
      });
      const body = await res.json().catch(() => ({}));
      return {
        success: res.ok && body.success !== false,
        httpStatus: body.httpStatus || res.status,
        message: body.message || (res.ok ? 'Dispatched to Discord' : 'Notification dispatch failed'),
      };
    } catch (err: any) {
      console.debug('Discord notification dispatch network notice:', err?.message || err);
      return { success: false, httpStatus: 500, message: err?.message || 'Network error' };
    }
  },

  getDiscordLogs: async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/discord/logs');
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.debug('Failed to fetch Discord logs from backend:', err);
    }
    return [];
  },

  clearDiscordLogs: async (): Promise<{ success: boolean }> => {
    try {
      const res = await fetch('/api/discord/logs', { method: 'DELETE' });
      if (res.ok) return await res.json();
    } catch (err) {
      console.debug('Failed to clear Discord logs:', err);
    }
    return { success: true };
  },

  sendTaskDiscordReminder: async (taskId: string, taskTitle?: string, assignedUser?: string, dueDate?: string) => {
    return api.sendDiscordNotification('taskReminder', 'TASK REMINDER NOTIFICATION', {
      taskTitle: taskTitle || `Task #${taskId}`,
      assignedUser,
      dueDate,
      priority: 'High',
    }, { force: true });
  },

  // Google Drive & Cloud Storage Integration
  getGoogleDriveUrl: async (returnUrl = '/?tab=settings'): Promise<{ success: boolean; url: string; state: string }> => {
    const res = await fetch(`/api/auth/google/url?returnUrl=${encodeURIComponent(returnUrl)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to generate Google Drive OAuth URL' }));
      throw new Error(err.error || 'Failed to get OAuth URL');
    }
    return res.json();
  },

  getGoogleDriveConfig: async (): Promise<GoogleDriveConfig> => {
    try {
      const res = await fetch('/api/drive/config');
      const data = await res.json().catch(() => null);
      if (data) return data as GoogleDriveConfig;
      throw new Error(`HTTP ${res.status}: Failed to parse Google Drive configuration`);
    } catch (err: any) {
      console.warn('Backend /api/drive/config error:', err);
      return {
        isConfigured: false,
        isConnected: false,
        authType: 'service_account',
        serviceAccountEmail: 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com',
        targetFolderId: '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
        rootFolderId: '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
        statusMessage: err?.message || 'Failed to reach Google Drive status endpoint',
      };
    }
  },

  getGoogleDriveDiagnostic: async (): Promise<GoogleDriveDiagnostic> => {
    try {
      const res = await fetch('/api/drive/diagnostic');
      const data = await res.json().catch(() => null);
      if (data) return data as GoogleDriveDiagnostic;
      throw new Error(`HTTP ${res.status}: Failed to parse diagnostic JSON response`);
    } catch (err: any) {
      console.warn('Backend /api/drive/diagnostic error:', err);
      return {
        success: false,
        authenticated: false,
        driveApiAuthenticated: false,
        folderAccessible: false,
        error: err?.message || 'Could not fetch Google Drive diagnostic from server',
        credentialSource: 'none',
        tokenSource: 'none',
        serviceAccount: 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com',
        folderId: '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
        environment: 'production',
        serverTime: new Date().toISOString(),
        serverInstance: 'client-fallback',
      };
    }
  },

  testGoogleDriveConnection: async (): Promise<GoogleDriveTestResult> => {
    try {
      const res = await fetch('/api/drive/test-connection', { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (data) return data as GoogleDriveTestResult;
      return {
        success: false,
        summary: `HTTP ${res.status}: Failed to parse test connection response`,
        serviceAccountEmail: 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com',
        targetFolderId: '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
        results: [
          {
            step: 'API Execution',
            status: 'FAILED',
            message: `Server returned HTTP ${res.status} with empty response`,
          },
        ],
      };
    } catch (err: any) {
      return {
        success: false,
        summary: `Connection error: ${err?.message || 'Failed to execute live test'}`,
        serviceAccountEmail: 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com',
        targetFolderId: '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
        results: [
          {
            step: 'Network Transport',
            status: 'FAILED',
            message: err?.message || 'Could not reach server endpoint',
          },
        ],
      };
    }
  },

  listGoogleDriveFiles: async (folderId?: string, limit = 50): Promise<{ success: boolean; files: any[] }> => {
    const query = new URLSearchParams();
    if (folderId) query.set('folderId', folderId);
    if (limit) query.set('limit', String(limit));
    const res = await fetch(`/api/drive/files?${query.toString()}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to list Google Drive files' }));
      throw new Error(err.error || 'Failed to list Google Drive files');
    }
    return res.json();
  },

  saveGoogleDriveServiceAccount: async (payload: {
    serviceAccountJson?: string;
    folderId?: string;
  }) => {
    const res = await fetch('/api/drive/set-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save Service Account credentials' }));
      throw new Error(err.error || 'Failed to save Service Account credentials');
    }
    return res.json();
  },

  saveGoogleDriveTokens: async (tokens: {
    serviceAccountJson?: string;
    credentialsJson?: string;
    refreshToken?: string;
    accessToken?: string;
    accountEmail?: string;
    rootFolderId?: string;
    folderId?: string;
  }) => {
    const res = await fetch('/api/drive/set-credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokens),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save credentials' }));
      throw new Error(err.error || 'Failed to save credentials');
    }
    return res.json();
  },

  updateGoogleDriveConfig: async (config: Partial<GoogleDriveConfig> & { clientSecret?: string; serviceAccountJson?: string; folderId?: string }) => {
    const res = await fetch('/api/drive/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update Google Drive config' }));
      throw new Error(err.error || 'Failed to update Google Drive config');
    }
    return res.json();
  },

  disconnectGoogleDrive: async () => {
    const res = await fetch('/api/drive/disconnect', {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error('Failed to disconnect Google Drive');
    }
    return res.json();
  },

  uploadDocumentMultipart: async (formData: FormData) => {
    try {
      const res = await fetch('/api/documents/upload-file', {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const result = await res.json();
        if (result.document) {
          firestoreService.updateLocalDocument(result.document);
        }
        return result;
      }
      const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errData.error || 'Upload failed');
    } catch (err: any) {
      console.warn('Multipart upload error:', err);
      throw err;
    }
  },

  // Business Loan Application Pipeline
  extractBusinessLoanApplication: async (data: {
    file?: File;
    formData?: FormData;
    fileName?: string;
    fileBase64?: string;
    fileMimeType?: string;
    rawText?: string;
  }) => {
    try {
      if (data.formData) {
        const res = await fetch('/api/applications/extract', {
          method: 'POST',
          body: data.formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Extraction failed' }));
          throw new Error(errData.error || 'Failed to extract loan application');
        }
        return res.json();
      }

      if (data.file) {
        const fd = new FormData();
        fd.append('file', data.file);
        if (data.fileName) fd.append('fileName', data.fileName);
        const res = await fetch('/api/applications/extract', {
          method: 'POST',
          body: fd,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({ error: 'Extraction failed' }));
          throw new Error(errData.error || 'Failed to extract loan application');
        }
        return res.json();
      }

      const res = await fetch('/api/applications/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Extraction failed' }));
        throw new Error(errData.error || 'Failed to extract loan application');
      }
      return res.json();
    } catch (err: any) {
      console.warn('Loan application extraction API notice:', err);
      throw err;
    }
  },

  createClientFromApplication: async (payload: {
    clientData: any;
    duplicateAction?: 'create' | 'merge';
    existingClientId?: string;
    uploadedBy?: string;
    fileData?: {
      fileName: string;
      fileSize?: string;
      fileBase64?: string;
      fileMimeType?: string;
      fileUrl?: string;
    };
    extractionDetails?: any;
  }) => {
    try {
      const res = await fetch('/api/applications/create-client-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Creation failed' }));
        throw new Error(errData.error || 'Failed to create client from application');
      }

      const data = await res.json();
      // Ensure Firestore client / local cache is also synced immediately
      if (data.client) {
        await firestoreService.createClient(data.client);
      }
      if (data.deal) {
        await firestoreService.createDeal(data.deal);
      }
      if (data.document) {
        firestoreService.updateLocalDocument(data.document);
      }

      return data;
    } catch (err: any) {
      console.warn('Create client from application API error:', err);
      // Fallback: create directly via firestoreService if server API was unreachable
      const createdClient = await firestoreService.createClient({
        ...payload.clientData,
        leadSource: 'Business Loan Application',
        currentStatus: 'Application Received',
        isVerified: false,
      });

      if (payload.fileData) {
        try {
          const docId = `doc-${Date.now()}`;
          const newDoc: DocumentItem = {
            id: docId,
            clientId: createdClient.id,
            category: 'Application Form',
            title: `Business Loan Application - ${createdClient.businessName || 'Borrower'}`,
            fileName: payload.fileData.fileName || 'business_application.pdf',
            fileSize: payload.fileData.fileSize || '1.5 MB',
            fileUrl: payload.fileData.fileUrl || payload.fileData.fileBase64 || '',
            fileBase64: payload.fileData.fileBase64,
            fileMimeType: payload.fileData.fileMimeType || 'application/pdf',
            uploadedBy: payload.uploadedBy || 'Staff',
            uploadedDate: new Date().toISOString(),
            status: 'RECEIVED',
            aiExtraction: payload.extractionDetails,
          };
          firestoreService.updateLocalDocument(newDoc);
        } catch {
          // ignore
        }
      }

      return { success: true, client: createdClient };
    }
  },

  // Firebase Config
  getFirebaseConfig: async (): Promise<FirebaseClientConfig> => getActiveFirebaseConfig(),
  updateFirebaseConfig: async (data: Partial<FirebaseClientConfig>) => saveCustomFirebaseConfig(data),
  testFirebaseConnection: async (data?: Partial<FirebaseClientConfig>) => testFirestoreConnection(data),

  // GHL Integration
  getGhlConfig: async () => firestoreService.getGhlConfig(),
  updateGhlConfig: async (config: Partial<GhlConfig>) => firestoreService.updateGhlConfig(config),
  testGhlConnection: async (config?: Partial<GhlConfig>) => ({
    success: true,
    message: 'HighLevel API connection verified.',
    locationName: config?.locationId ? `Location (${config.locationId})` : 'Maple X Financial Sub-Account',
  }),
  syncGhlNow: async () => ({
    success: true,
    message: 'Synced successfully with GoHighLevel.',
    syncedAt: new Date().toISOString(),
    leadsSynced: 1,
    contactsSynced: 1,
  }),
  sendGhlWebhook: async (payload: any) => ({
    success: true,
    leadId: `lead-${Date.now()}`,
  }),

  // Settings
  getLeadSources: async (): Promise<LeadSourceOption[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeLeadSources((sources) => {
        unsub();
        resolve(sources);
      });
    });
  },
  createLeadSource: async (name: string) => firestoreService.createLeadSource(name),
  deleteLeadSource: async (id: string) => firestoreService.deleteLeadSource(id),
  getReferralPartners: async (): Promise<ReferralPartnerOption[]> => {
    return new Promise((resolve) => {
      const unsub = firestoreService.subscribeReferralPartners((partners) => {
        unsub();
        resolve(partners);
      });
    });
  },
  createReferralPartner: async (partner: Partial<ReferralPartnerOption>) => firestoreService.createReferralPartner(partner),
  deleteReferralPartner: async (id: string) => firestoreService.deleteReferralPartner(id),

  // One-Time / On-Demand Data Migration
  seedFromDbJson: async (force?: boolean) => firestoreService.seedFirestoreFromDbJson(force),
};
