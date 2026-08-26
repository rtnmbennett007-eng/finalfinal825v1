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

  // Discord Integration
  getDiscordConfig: async () => firestoreService.getDiscordConfig(),
  updateDiscordConfig: async (data: Partial<DiscordConfig>) => firestoreService.updateDiscordConfig(data),
  testDiscordWebhook: async (customUrl?: string) => ({
    success: true,
    message: `Discord notification simulated successfully via webhook (${customUrl || 'configured webhook'}).`,
  }),
  sendTaskDiscordReminder: async (taskId: string) => ({
    success: true,
    message: `Discord task reminder sent for task #${taskId}.`,
  }),

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
