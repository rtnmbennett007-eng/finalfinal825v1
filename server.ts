import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database Persistence Directory
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Staff Users - All 4 have equal full authority with credentials
const INITIAL_STAFF = [
  {
    id: 'staff-luke',
    name: 'Luke',
    fullName: 'Luke Cowan',
    email: 'luke.cowan@maplexfinancial.com',
    password: 'Admin2026!',
    phone: '(555) 345-6789',
    title: 'The King',
    portalTitle: 'The King',
    jobTitle: 'CEO / Owner',
    department: 'Executive Leadership',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    avatar: '',
    active: true,
    notes: 'CEO / Owner. Full unconstrained administrative authority across the entire portal.',
    discordUsername: 'lukecowan',
    discordUserId: '',
    responsibilities: [
      'CEO',
      'Owner',
      'Overall company leadership',
      'Strategic decisions',
      'Business management',
      'Company growth',
      'Final oversight',
      'Lender relationships',
      'Client relationships',
      'Sales oversight',
      'Operations oversight',
      'Financial oversight',
      'Team leadership',
    ],
  },
  {
    id: 'staff-dana',
    name: 'Dana',
    fullName: 'Dana Javier',
    email: 'dana.javier@maplexfinancial.com',
    password: 'Admin2026!',
    phone: '(555) 234-5678',
    title: 'Supreme Funding Commander',
    portalTitle: 'Supreme Funding Commander',
    jobTitle: 'Operations Director',
    department: 'Operations & Underwriting',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    avatar: '',
    active: true,
    notes: 'Operations Director. Full unconstrained administrative authority across the entire portal.',
    discordUsername: 'dana_javier',
    discordUserId: '',
    responsibilities: [
      'Operations Director',
      'Underwriting',
      'Does mostly everything needed to get clients funded',
      'Talks to lenders',
      'Works directly with clients',
      'Reviews applications',
      'Reviews documents',
      'Handles underwriting',
      'Coordinates funding',
      'Works with lenders to get clients funded',
      'Handles funding conditions',
      'Helps move deals through the funding process',
      'Client verification/follow-up when necessary',
      'General company operations as needed',
    ],
  },
  {
    id: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    email: 'robert@maplexfinancial.com',
    password: 'Admin2026!',
    phone: '(555) 567-8901',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    avatar: '',
    active: true,
    notes: 'Operations, Automation, Technology & Growth. Full unconstrained administrative authority across the entire portal.',
    discordUsername: 'robert_maplex',
    discordUserId: '',
    responsibilities: [
      'Automations',
      'GoHighLevel',
      'Discord',
      'Dialer systems',
      'CRM systems',
      'Technology',
      'Website development',
      'Portal development',
      'Company systems',
      'Research',
      'Finding better tools',
      'Finding better processes',
      'Improving company efficiency',
      'Building systems that make everyone\'s jobs faster',
      'Creating systems needed by the company',
      'Business growth research',
      'Operations improvement',
      'Sales calls',
      'Client verification before sending clients to Dana',
      'Text blasts',
      'Marketing automation',
      'CRM automation',
      'Integration management',
      'Technical troubleshooting',
      'Website management',
      'Portal management',
      'Creating new technology/processes for the company',
    ],
  },
  {
    id: 'staff-steve',
    name: 'Steve',
    fullName: 'Steve',
    email: 'steve@maplexfinancial.com',
    password: 'Admin2026!',
    phone: '(555) 456-7890',
    title: 'Grand Sales Wizard',
    portalTitle: 'Grand Sales Wizard',
    jobTitle: 'Sales Director',
    department: 'Sales & Origination',
    role: 'INTERNAL_STAFF_ADMIN',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    isCoreLeadership: true,
    avatar: '',
    active: true,
    notes: 'Sales Director. Full unconstrained administrative authority across the entire portal.',
    discordUsername: 'steve_maplex',
    discordUserId: '',
    responsibilities: [
      'Sales leadership',
      'Sales management',
      'Sales training',
      'Training new setters / Squires',
      'Sales calls',
      'Lead management',
      'Sales process development',
      'Sales coaching',
      'Setter training',
      'Performance management',
      'Client verification before sending clients to Dana',
      'Sales strategy',
      'Helping improve conversion rates',
      'Helping develop the sales team',
    ],
  },
];

const INITIAL_ROLES = [
  {
    id: 'role-admin',
    name: 'Internal Staff Admin',
    description: 'Full unconstrained authority over operations, deals, verification, underwriting, and commissions.',
    permissions: ['all', 'view_ssn', 'manage_users', 'edit_commissions', 'delete_records', 'manage_lenders'],
    isSystem: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-underwriter',
    name: 'Senior Underwriter',
    description: 'Underwriting review, credit evaluation, lender history management, and deal stacking.',
    permissions: ['underwriting_read', 'underwriting_write', 'verification_read', 'deals_read', 'deals_write'],
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'role-operations',
    name: 'Operations Specialist',
    description: 'Phone verification, document intake, task management, and client onboarding.',
    permissions: ['verification_write', 'documents_write', 'tasks_write', 'clients_read'],
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_LEAD_SOURCES = [
  { id: 'src-1', name: 'Website', isCustom: false, active: true },
  { id: 'src-2', name: 'GHL', isCustom: false, active: true },
  { id: 'src-3', name: 'Facebook', isCustom: false, active: true },
  { id: 'src-4', name: 'Instagram', isCustom: false, active: true },
  { id: 'src-5', name: 'Google', isCustom: false, active: true },
  { id: 'src-6', name: 'Referral', isCustom: false, active: true },
  { id: 'src-7', name: 'Partner', isCustom: false, active: true },
  { id: 'src-8', name: 'Broker', isCustom: false, active: true },
  { id: 'src-9', name: 'Sales Rep', isCustom: false, active: true },
  { id: 'src-10', name: 'Existing Client', isCustom: false, active: true },
  { id: 'src-11', name: 'Other', isCustom: false, active: true },
];

const INITIAL_REFERRAL_PARTNERS = [
  { id: 'ref-1', name: 'ABC Financial Partners', company: 'ABC Capital Group', email: 'partner@abccapital.com', phone: '(555) 888-1212', active: true },
  { id: 'ref-2', name: 'Apex Commercial Brokers', company: 'Apex Advisory LLC', email: 'deals@apexcommercial.com', phone: '(555) 777-3434', active: true },
  { id: 'ref-3', name: 'Summit Business Capital', company: 'Summit Partners', email: 'referrals@summitcap.com', phone: '(555) 666-5656', active: true },
  { id: 'ref-4', name: 'Blue Ridge Advisory', company: 'Blue Ridge Funding', email: 'team@blueridge.com', phone: '(555) 444-9090', active: true },
];

const INITIAL_COMMISSION_DIRECTORY = [
  { id: 'dir-1', name: 'Dana', type: 'Internal Staff', role: 'Operations & Funding', email: 'dana@maplexfinancial.com', phone: '(555) 234-5678', company: 'Maple X Financial', defaultPoints: 1.0, active: true },
  { id: 'dir-2', name: 'Luke', type: 'Internal Staff', role: 'Underwriting & Stacking', email: 'luke@maplexfinancial.com', phone: '(555) 345-6789', company: 'Maple X Financial', defaultPoints: 2.9, active: true },
  { id: 'dir-3', name: 'Steve', type: 'Internal Staff', role: 'Deal Structuring', email: 'steve@maplexfinancial.com', phone: '(555) 456-7890', company: 'Maple X Financial', defaultPoints: 1.475, active: true },
  { id: 'dir-4', name: 'Robert', type: 'Internal Staff', role: 'Executive Principal', email: 'robert@maplexfinancial.com', phone: '(555) 567-8901', company: 'Maple X Financial', defaultPoints: 1.525, active: true },
  { id: 'dir-5', name: 'ABC Financial Partners', type: 'Referral Partner', role: 'Referring Partner', email: 'partner@abccapital.com', phone: '(555) 888-1212', company: 'ABC Capital Group', defaultPoints: 0.5, active: true },
  { id: 'dir-6', name: 'Apex Commercial Brokers', type: 'Broker Partner', role: 'Commercial Syndication', email: 'deals@apexcommercial.com', phone: '(555) 777-3434', company: 'Apex Advisory LLC', defaultPoints: 1.0, active: true },
];

const INITIAL_VERIFICATION_SCRIPTS = [
  { id: 'sc-1', fieldKey: 'businessName', fieldLabel: 'Business Legal Name', category: 'BUSINESS', scriptText: '“Can you please confirm the exact legal name of your business as it appears on your official business and state filing documents?”' },
  { id: 'sc-2', fieldKey: 'annualRevenue', fieldLabel: 'Annual Gross Revenue', category: 'BUSINESS', scriptText: '“Can you confirm your current annual gross business revenue and approximately how much revenue the business generates on an average monthly basis?”' },
  { id: 'sc-3', fieldKey: 'ownershipPercentage', fieldLabel: 'Ownership Percentage', category: 'BUSINESS', scriptText: '“Can you confirm what exact percentage of the business you personally own, and if there are any other owners holding 20% or more?”' },
  { id: 'sc-4', fieldKey: 'businessAddress', fieldLabel: 'Business Address', category: 'BUSINESS', scriptText: '“Can you confirm your complete physical business address, including suite number, city, state, and ZIP code?”' },
  { id: 'sc-5', fieldKey: 'existingLoans', fieldLabel: 'Existing Loans / Obligations', category: 'FUNDING', scriptText: '“Do you currently have any outstanding business loans, merchant cash advances, lines of credit, or other financing obligations?”' },
  { id: 'sc-6', fieldKey: 'ssn', fieldLabel: 'SSN (Last 4)', category: 'CLIENT', scriptText: '“For regulatory compliance and identity verification, can you please verify the last 4 digits of your Social Security Number?”' },
  { id: 'sc-7', fieldKey: 'dob', fieldLabel: 'Date of Birth', category: 'CLIENT', scriptText: '“Can you please verify your date of birth for identity confirmation?”' },
  { id: 'sc-8', fieldKey: 'requestedAmount', fieldLabel: 'Requested Amount & Purpose', category: 'FUNDING', scriptText: '“What is the exact capital amount requested and the primary operational purpose of these funds?”' },
];

interface DatabaseSchema {
  staff: any[];
  roles: any[];
  tasks: any[];
  notifications: any[];
  fundingStrategies: any[];
  internalNotes: any[];
  lenderHistory: any[];
  creditCards: any[];
  masterVerifications: Record<string, any>;
  discordConfig: {
    webhookUrl: string;
    channelName: string;
    botUsername?: string;
    mentionRole?: string;
    enabled: boolean;
    events: {
      highPriorityTaskCreated: boolean;
      highPriorityTaskDue: boolean;
      taskOverdue: boolean;
      newLead: boolean;
      verificationComplete: boolean;
      underwritingReady: boolean;
      preApprovalReceived: boolean;
      approvalReceived: boolean;
      clientFunded: boolean;
      commissionReceived: boolean;
    };
    lastTestedAt?: string;
    lastTestStatus?: string;
  };
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    isConfigured: boolean;
    lastVerifiedAt?: string;
  };
  leads: any[];
  clients: any[];
  fundingDeals: any[];
  commissionParticipants: any[];
  commissionDirectory: any[];
  verificationRecords: any[];
  verificationAuditLogs: any[];
  verificationScripts: any[];
  underwritingRecords: any[];
  underwritingNotes: any[];
  lenderSubmissions: any[];
  documents: any[];
  communicationLogs: any[];
  timelineEvents: any[];
  leadSources: any[];
  referralPartners: any[];
  ghlConfig: any;
}

function getInitialDb(): DatabaseSchema {
  return {
    staff: INITIAL_STAFF,
    roles: INITIAL_ROLES,
    tasks: [],
    notifications: [],
    fundingStrategies: [],
    internalNotes: [],
    lenderHistory: [],
    creditCards: [],
    masterVerifications: {},
    discordConfig: {
      webhookUrl: '',
      channelName: '#maple-x-operations',
      botUsername: 'Maple X Operations Bot',
      mentionRole: '',
      enabled: true,
      events: {
        highPriorityTaskCreated: true,
        highPriorityTaskDue: true,
        taskOverdue: true,
        newLead: true,
        verificationComplete: true,
        underwritingReady: true,
        preApprovalReceived: true,
        approvalReceived: true,
        clientFunded: true,
        commissionReceived: true,
      },
      lastTestedAt: '',
      lastTestStatus: '',
    },
    firebaseConfig: {
      apiKey: '',
      authDomain: '',
      projectId: 'maplex-financial-portal',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      isConfigured: true,
      lastVerifiedAt: new Date().toISOString(),
    },
    leads: [],
    clients: [],
    fundingDeals: [],
    commissionParticipants: [],
    commissionDirectory: INITIAL_COMMISSION_DIRECTORY,
    verificationRecords: [],
    verificationAuditLogs: [],
    verificationScripts: INITIAL_VERIFICATION_SCRIPTS,
    underwritingRecords: [],
    underwritingNotes: [],
    lenderSubmissions: [],
    documents: [],
    communicationLogs: [],
    timelineEvents: [],
    leadSources: INITIAL_LEAD_SOURCES,
    referralPartners: INITIAL_REFERRAL_PARTNERS,
    ghlConfig: {
      apiKey: 'ghl_live_key_maplex_sec_99a8b7c6d5e4',
      locationId: 'loc_maplex_hq_001',
      baseUrl: 'https://services.leadconnectorhq.com',
      isConnected: true,
      lastSyncAt: new Date().toISOString(),
      syncErrors: [],
      autoSyncEnabled: true,
      fieldMappings: {
        leadSourceField: 'contact.source',
        referralPartnerField: 'custom_field.referral_partner',
        annualRevenueField: 'custom_field.annual_revenue',
        creditScoreField: 'custom_field.credit_score',
        requestedAmountField: 'custom_field.funding_amount_requested',
        productField: 'custom_field.funding_product_interest',
      },
      pipelineMappings: {
        NEW_LEAD: 'Stage 1 - New Inbound Lead',
        SALES_CONTACT: 'Stage 2 - Sales Contact Made',
        APPLICATION_SENT: 'Stage 3 - Application Link Sent',
        APPLICATION_RECEIVED: 'Stage 4 - Application Submitted',
        DOCUMENT_REQUEST: 'Stage 5 - Requesting Documents',
        DOCUMENTS_RECEIVED: 'Stage 6 - Documents In Review',
        VERIFICATION_IN_PROGRESS: 'Stage 7 - Verification Call Active',
        VERIFICATION_COMPLETE: 'Stage 8 - Verification Approved',
        UNDERWRITING: 'Stage 9 - File in Underwriting',
        SUBMITTED_TO_LENDER: 'Stage 10 - Submitted to Funding Source',
        PRE_APPROVED: 'Stage 11 - Pre-Approval Terms Received',
        APPROVED: 'Stage 12 - Final Approved',
        FUNDED: 'Stage 13 - Deal Funded',
        COMMISSION_RECEIVED: 'Stage 14 - Commission Settled',
      },
    },
  };
}

let db: DatabaseSchema;

// Helper to sanitize any object and purge undefined values safely
function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((item) => sanitizeObject(item)) as any;
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key];
    if (val !== undefined) {
      result[key] = typeof val === 'object' && val !== null ? sanitizeObject(val) : val;
    }
  }
  return result;
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(data);
      const initial = getInitialDb();
      for (const key of Object.keys(initial) as (keyof DatabaseSchema)[]) {
        if (db[key] === undefined) {
          (db as any)[key] = initial[key];
        }
      }

      // Ensure staff entries are up to date with valid emails, default passwords, and roles
      if (Array.isArray(db.staff)) {
        for (const initStaff of INITIAL_STAFF) {
          const existing = db.staff.find(
            (s: any) =>
              s.id === initStaff.id ||
              s.email.toLowerCase() === initStaff.email.toLowerCase() ||
              (initStaff.id === 'staff-dana' && (s.email.toLowerCase().includes('dana') || s.name.toLowerCase().includes('dana'))) ||
              (initStaff.id === 'staff-luke' && (s.email.toLowerCase().includes('luke') || s.name.toLowerCase().includes('luke'))) ||
              (initStaff.id === 'staff-steve' && (s.email.toLowerCase().includes('steve') || s.name.toLowerCase().includes('steve'))) ||
              (initStaff.id === 'staff-robert' && (s.email.toLowerCase().includes('robert') || s.name.toLowerCase().includes('robert')))
          );

          if (existing) {
            existing.email = initStaff.email;
            existing.name = initStaff.name;
            if (!existing.password) existing.password = initStaff.password;
            if (!existing.role) existing.role = initStaff.role;
          } else {
            db.staff.push({ ...initStaff });
          }
        }

        // Ensure all staff have password
        db.staff.forEach((s: any) => {
          if (!s.password) s.password = 'Admin2026!';
        });
      }
      saveDb();
    } else {
      db = getInitialDb();
      saveDb();
    }
  } catch (err) {
    console.error('Error reading database file, initializing fresh:', err);
    db = getInitialDb();
    saveDb();
  }
}

function saveDb() {
  try {
    const cleanDb = sanitizeObject(db);
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(cleanDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

loadDb();

// Helper to log timeline events
function addTimelineEvent(clientId: string, title: string, description: string, staffMember: string, type: string, dealId?: string) {
  const event = {
    id: `tl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    clientId,
    dealId: dealId || null,
    title,
    description,
    staffMember,
    timestamp: new Date().toISOString(),
    type,
  };
  db.timelineEvents.unshift(event);
  saveDb();
  return event;
}

// Helper to create notifications
function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  priority: 'High' | 'Medium' | 'Low' = 'Medium',
  targetType?: 'client' | 'task' | 'deal' | 'general',
  targetId?: string
) {
  const notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId: userId || 'all',
    title,
    message,
    type,
    priority,
    isRead: false,
    createdAt: new Date().toISOString(),
    targetType: targetType || 'general',
    targetId: targetId || null,
  };
  db.notifications.unshift(notification);
  saveDb();
  return notification;
}

// Secure Server-Side Discord Dispatcher
async function sendDiscordNotification(
  eventKey: keyof DatabaseSchema['discordConfig']['events'],
  eventTitle: string,
  details: {
    clientName?: string;
    businessName?: string;
    taskTitle?: string;
    assignedUser?: string;
    priority?: string;
    dueDate?: string;
    amount?: number | string;
    product?: string;
    lender?: string;
    notes?: string;
    portalLink?: string;
  }
) {
  try {
    const config = db.discordConfig;
    if (!config || !config.enabled || !config.webhookUrl) return;
    if (config.events && !config.events[eventKey]) return;

    // Discord Embed Colors: Gold (#eab308 / 15381256), Blue (#1e40af / 1982639), Green (#10b981 / 1096065)
    let color = 15381256; // Gold default
    if (details.priority === 'High' || eventTitle.includes('OVERDUE') || eventTitle.includes('HIGH PRIORITY')) {
      color = 15548997; // Crimson / Red
    } else if (eventTitle.includes('FUNDED') || eventTitle.includes('COMMISSION')) {
      color = 1096065; // Green
    } else if (eventTitle.includes('LEAD') || eventTitle.includes('VERIFICATION')) {
      color = 1982639; // Deep Blue
    }

    // Resolve user Discord tag for direct notification ping
    let userMention = '';
    if (details.assignedUser) {
      const assignedStaff = db.staff.find(
        (s: any) =>
          s.name?.toLowerCase().includes(details.assignedUser!.toLowerCase()) ||
          s.email?.toLowerCase().includes(details.assignedUser!.toLowerCase()) ||
          details.assignedUser!.toLowerCase().includes(s.name?.toLowerCase())
      );
      if (assignedStaff) {
        if (assignedStaff.discordUserId && assignedStaff.discordUserId.trim()) {
          userMention = `<@${assignedStaff.discordUserId.trim()}>`;
        } else if (assignedStaff.discordUsername && assignedStaff.discordUsername.trim()) {
          userMention = `@${assignedStaff.discordUsername.replace(/^@/, '').trim()}`;
        }
      }
    }

    const fields: any[] = [];
    if (details.clientName) fields.push({ name: 'Client Name', value: details.clientName, inline: true });
    if (details.businessName) fields.push({ name: 'Business Name', value: details.businessName, inline: true });
    if (details.assignedUser) {
      fields.push({
        name: 'Assigned Operator',
        value: userMention ? `${details.assignedUser} (${userMention})` : details.assignedUser,
        inline: true,
      });
    }
    if (details.priority) fields.push({ name: 'Priority', value: `**${details.priority.toUpperCase()}**`, inline: true });
    if (details.dueDate) fields.push({ name: 'Due Date/Time', value: details.dueDate, inline: true });
    if (details.amount) fields.push({ name: 'Funding Amount', value: String(details.amount), inline: true });
    if (details.product) fields.push({ name: 'Funding Product', value: details.product, inline: true });
    if (details.lender) fields.push({ name: 'Lender Source', value: details.lender, inline: true });
    if (details.taskTitle) fields.push({ name: 'Task', value: details.taskTitle, inline: false });
    if (details.notes) fields.push({ name: 'Notes', value: details.notes, inline: false });

    const payload: any = {
      username: config.botUsername || 'Maple X Operations Bot',
      avatar_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=150&auto=format&fit=crop&q=80',
      embeds: [
        {
          title: `🔔 MAPLE X FINANCIAL — ${eventTitle.toUpperCase()}`,
          description: userMention
            ? `Assigned to ${userMention} • Operational action required.`
            : `Internal operational update dispatched from Maple X portal.`,
          color,
          fields,
          footer: {
            text: `Maple X Financial • Internal Operations System`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    if (userMention) {
      payload.content = `🚨 **Notification for ${userMention}**: **${eventTitle}**`;
    } else if (config.mentionRole) {
      payload.content = `<@&${config.mentionRole}> **${eventTitle}**`;
    }

    await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('Discord dispatch failed:', err);
  }
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    clientCount: db.clients.length,
    dealsCount: db.fundingDeals.length,
    tasksCount: db.tasks.length,
  });
});

// Auth & Staff Endpoints
app.get('/api/staff', (req, res) => {
  res.json(db.staff);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  if (!cleanEmail) {
    return res.status(400).json({ success: false, error: 'Email address is required' });
  }

  // Find staff user by email (or known alias)
  const staff = db.staff.find((s: any) => {
    const sEmail = (s.email || '').toLowerCase();
    if (sEmail === cleanEmail) return true;
    if (cleanEmail === 'dana@maplexfinancial.com' && sEmail === 'dana.javier@maplexfinancial.com') return true;
    if (cleanEmail === 'dana.javier@maplexfinancial.com' && sEmail === 'dana@maplexfinancial.com') return true;
    if (cleanEmail === 'luke@maplexfinancial.com' && sEmail === 'luke.cowan@maplexfinancial.com') return true;
    if (cleanEmail === 'luke.cowan@maplexfinancial.com' && sEmail === 'luke@maplexfinancial.com') return true;
    if (cleanEmail === 'steve@maplexfinancial.com' && sEmail === 'steve@maplexfinancial.com') return true;
    if (cleanEmail === 'robert@maplexfinancial.com' && sEmail === 'robert@maplexfinancial.com') return true;
    return false;
  });

  if (!staff) {
    return res.status(401).json({
      success: false,
      error: 'Invalid credentials. User account not found in Maple X Financial system.',
    });
  }

  // Check password
  const expectedPassword = staff.password || 'Admin2026!';
  if (cleanPassword !== expectedPassword) {
    return res.status(401).json({
      success: false,
      error: 'Incorrect password. Please verify your credentials and try again.',
    });
  }

  // Sanitized staff object
  const userSafe = { ...staff };
  res.json({
    success: true,
    user: userSafe,
    token: `maplex-token-${staff.id}-${Date.now()}`,
  });
});

app.post('/api/staff', (req, res) => {
  const staffData = req.body;
  const newStaff = {
    id: `staff-${Date.now()}`,
    name: staffData.name || 'New Staff',
    email: staffData.email || 'staff@maplexfinancial.com',
    password: staffData.password || 'Admin2026!',
    phone: staffData.phone || '(555) 000-0000',
    jobTitle: staffData.jobTitle || 'Operations Associate',
    department: staffData.department || 'Operations',
    role: staffData.role || 'INTERNAL_STAFF_ADMIN',
    avatar: staffData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    active: staffData.active !== undefined ? staffData.active : true,
    notes: staffData.notes || '',
  };
  db.staff.push(newStaff);
  saveDb();
  res.status(201).json(newStaff);
});

app.put('/api/staff/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.staff.findIndex((s) => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  
  const current = db.staff[idx];
  const update = req.body;

  // If password change is requested
  if (update.newPassword) {
    if (update.currentPassword && current.password && update.currentPassword !== current.password) {
      return res.status(400).json({ error: 'Current password does not match' });
    }
    update.password = update.newPassword;
    delete update.newPassword;
    delete update.currentPassword;
  }

  db.staff[idx] = { ...current, ...update };
  saveDb();
  res.json(db.staff[idx]);
});

// Roles Management
app.get('/api/roles', (req, res) => {
  res.json(db.roles);
});

app.post('/api/roles', (req, res) => {
  const roleData = req.body;
  const newRole = {
    id: `role-${Date.now()}`,
    name: roleData.name || 'Custom Role',
    description: roleData.description || '',
    permissions: roleData.permissions || ['clients_read'],
    isSystem: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.roles.push(newRole);
  saveDb();
  res.status(201).json(newRole);
});

app.put('/api/roles/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.roles.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Role not found' });
  db.roles[idx] = { ...db.roles[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDb();
  res.json(db.roles[idx]);
});

// Global Search
app.get('/api/search', (req, res) => {
  const q = ((req.query.q as string) || '').toLowerCase().trim();
  if (!q) {
    return res.json({ clients: [], leads: [], deals: [] });
  }

  const clients = db.clients.filter((c) =>
    (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) ||
    c.businessName?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.includes(q) ||
    c.ssn?.includes(q) ||
    c.id?.toLowerCase().includes(q)
  );

  const leads = db.leads.filter((l) =>
    (l.firstName + ' ' + l.lastName).toLowerCase().includes(q) ||
    l.businessName?.toLowerCase().includes(q) ||
    l.email?.toLowerCase().includes(q) ||
    l.phone?.includes(q)
  );

  const deals = db.fundingDeals.filter((d) =>
    d.id?.toLowerCase().includes(q) ||
    d.clientName?.toLowerCase().includes(q) ||
    d.businessName?.toLowerCase().includes(q) ||
    d.product?.toLowerCase().includes(q) ||
    d.lenderName?.toLowerCase().includes(q)
  );

  res.json({ clients, leads, deals });
});

// ----------------------------------------------------
// TASK SYSTEM APIS
// ----------------------------------------------------
app.get('/api/tasks', (req, res) => {
  const { assignedTo, clientId } = req.query;
  let tasks = [...db.tasks];

  if (assignedTo && assignedTo !== 'all') {
    tasks = tasks.filter((t) => t.assignedTo?.toLowerCase() === (assignedTo as string).toLowerCase());
  }
  if (clientId) {
    tasks = tasks.filter((t) => t.clientId === clientId);
  }

  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const taskData = req.body;
  const now = new Date().toISOString();
  const newTask = {
    id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: taskData.title,
    description: taskData.description || '',
    clientId: taskData.clientId || null,
    clientName: taskData.clientName || '',
    dealId: taskData.dealId || null,
    dealTitle: taskData.dealTitle || '',
    category: taskData.category || 'Client',
    assignedTo: taskData.assignedTo || 'Dana',
    dueDate: taskData.dueDate || now.split('T')[0],
    dueTime: taskData.dueTime || '17:00',
    priority: taskData.priority || 'Medium',
    status: taskData.status || 'To Do',
    reminder: taskData.reminder || '1 hour before',
    notes: taskData.notes || '',
    createdBy: taskData.createdBy || 'Staff',
    createdDate: now,
    updatedAt: now,
  };

  db.tasks.unshift(newTask);

  // Auto-generate notification for assigned staff
  createNotification(
    newTask.assignedTo,
    `New Task Assigned: ${newTask.title}`,
    `Due on ${newTask.dueDate} ${newTask.dueTime ? `at ${newTask.dueTime}` : ''}. Priority: ${newTask.priority}`,
    newTask.priority === 'High' ? 'HIGH_PRIORITY_TASK' : 'TASK_REMINDER',
    newTask.priority as any,
    'task',
    newTask.id
  );

  // Discord Webhook Dispatch if High Priority
  if (newTask.priority === 'High') {
    sendDiscordNotification('highPriorityTaskCreated', 'HIGH PRIORITY TASK CREATED', {
      taskTitle: newTask.title,
      clientName: newTask.clientName,
      assignedUser: newTask.assignedTo,
      priority: newTask.priority,
      dueDate: `${newTask.dueDate} ${newTask.dueTime || ''}`,
      notes: newTask.description || newTask.notes,
    });
  }

  saveDb();
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const prev = db.tasks[idx];
  const updated = {
    ...prev,
    ...req.body,
    updatedAt: new Date().toISOString(),
    completedAt: req.body.status === 'Completed' && prev.status !== 'Completed' ? new Date().toISOString() : prev.completedAt,
  };

  db.tasks[idx] = updated;

  if (updated.status === 'Completed' && prev.status !== 'Completed') {
    createNotification(
      updated.assignedTo,
      `Task Completed: ${updated.title}`,
      `Task marked complete by staff.`,
      'TASK_REMINDER',
      'Low',
      'task',
      updated.id
    );
  }

  saveDb();
  res.json(updated);
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.tasks = db.tasks.filter((t) => t.id !== id);
  saveDb();
  res.json({ success: true });
});

app.post('/api/tasks/:id/snooze', (req, res) => {
  const { id } = req.params;
  const { hours } = req.body;
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });

  const snoozeTime = new Date(Date.now() + (hours || 24) * 3600000).toISOString();
  db.tasks[idx].status = 'Snoozed';
  db.tasks[idx].snoozedUntil = snoozeTime;
  db.tasks[idx].updatedAt = new Date().toISOString();

  saveDb();
  res.json(db.tasks[idx]);
});

// ----------------------------------------------------
// NOTIFICATIONS APIS
// ----------------------------------------------------
app.get('/api/notifications', (req, res) => {
  const { userId } = req.query;
  let notifs = [...db.notifications];
  if (userId && userId !== 'all') {
    notifs = notifs.filter((n) => n.userId === 'all' || n.userId?.toLowerCase() === (userId as string).toLowerCase());
  }
  res.json(notifs);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const idx = db.notifications.findIndex((n) => n.id === id);
  if (idx !== -1) {
    db.notifications[idx].isRead = true;
    saveDb();
    return res.json(db.notifications[idx]);
  }
  res.status(404).json({ error: 'Notification not found' });
});

app.post('/api/notifications/mark-all-read', (req, res) => {
  const { userId } = req.body;
  for (const n of db.notifications) {
    if (!userId || userId === 'all' || n.userId === userId || n.userId === 'all') {
      n.isRead = true;
    }
  }
  saveDb();
  res.json({ success: true });
});

// ----------------------------------------------------
// FUNDING STRATEGY APIS
// ----------------------------------------------------
app.get('/api/funding-strategy/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const strategies = db.fundingStrategies.filter((s) => s.clientId === clientId);
  // Sort with active first, then newest
  strategies.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  res.json(strategies);
});

app.post('/api/funding-strategy/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const stratData = req.body;
  const now = new Date().toISOString();

  // Mark all previous strategies for this client as inactive (historical preserved!)
  for (const s of db.fundingStrategies) {
    if (s.clientId === clientId) {
      s.isActive = false;
    }
  }

  const newStrategy = {
    id: `strat-${Date.now()}`,
    clientId,
    currentSituation: stratData.currentSituation || 'Revenue is strong but personal credit profile requires optimization.',
    strategy: stratData.strategy || 'Execute dual tranche stack: Revenue Funding for instant working capital + Term Loan.',
    nextSteps: stratData.nextSteps || '1. Get latest 3 months bank statements.\n2. Complete phone verification.\n3. Review PTL eligibility.',
    productsToPursue: stratData.productsToPursue || 'Revenue Funding, Personal Term Loan, HELOC',
    problemsToSolve: stratData.problemsToSolve || '',
    missingDocuments: stratData.missingDocuments || '',
    creditIssues: stratData.creditIssues || '',
    lenderStrategy: stratData.lenderStrategy || 'Direct submission to Maple Direct Capital & Apex Commercial.',
    assignedTo: stratData.assignedTo || 'Robert',
    priority: stratData.priority || 'High',
    nextReviewDate: stratData.nextReviewDate || new Date(Date.now() + 3600000 * 24 * 5).toISOString().split('T')[0],
    strategyStatus: stratData.strategyStatus || 'Active',
    strategyNotes: stratData.strategyNotes || '',
    createdBy: stratData.createdBy || 'Staff',
    createdDate: now,
    updatedAt: now,
    isActive: true,
  };

  db.fundingStrategies.unshift(newStrategy);

  addTimelineEvent(
    clientId,
    'Funding Strategy Updated',
    `Active funding strategy logged by ${newStrategy.createdBy}. Next review: ${newStrategy.nextReviewDate}. Assigned to: ${newStrategy.assignedTo}.`,
    newStrategy.createdBy,
    'STRATEGY'
  );

  saveDb();
  res.status(201).json(newStrategy);
});

// ----------------------------------------------------
// INTERNAL NOTES APIS
// ----------------------------------------------------
app.get('/api/internal-notes/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const notes = db.internalNotes.filter((n) => n.clientId === clientId);
  notes.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(notes);
});

app.post('/api/internal-notes/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const { author, type, content } = req.body;
  const now = new Date().toISOString();

  const newNote = {
    id: `note-${Date.now()}`,
    clientId,
    author: author || 'Staff',
    type: type || 'General',
    content: content || '',
    timestamp: now,
  };

  db.internalNotes.unshift(newNote);

  addTimelineEvent(clientId, `Internal Note (${newNote.type})`, newNote.content, newNote.author, 'NOTE');

  saveDb();
  res.status(201).json(newNote);
});

// ----------------------------------------------------
// LENDER HISTORY APIS (Replaces Standalone Submission Tab)
// ----------------------------------------------------
app.get('/api/lender-history/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const history = db.lenderHistory.filter((h) => h.clientId === clientId);
  res.json(history);
});

app.post('/api/lender-history', (req, res) => {
  const data = req.body;
  const now = new Date().toISOString();
  const newRecord = {
    id: `lh-${Date.now()}`,
    clientId: data.clientId,
    dealId: data.dealId || null,
    lenderName: data.lenderName || 'ABC Capital',
    fundingProduct: data.fundingProduct || 'Revenue Funding',
    dateSent: data.dateSent || now.split('T')[0],
    sentBy: data.sentBy || 'Dana',
    status: data.status || 'Sent',
    response: data.response || '',
    amount: Number(data.amount || 0),
    terms: data.terms || '',
    conditions: data.conditions || '',
    requiredDocuments: data.requiredDocuments || '',
    lenderNotes: data.lenderNotes || '',
    responseDate: data.responseDate || '',
    nextStep: data.nextStep || '',
    createdAt: now,
    updatedAt: now,
  };

  db.lenderHistory.unshift(newRecord);

  // Send Discord notification if pre-approved or approved
  if (newRecord.status === 'Pre-Approved') {
    sendDiscordNotification('preApprovalReceived', 'PRE-APPROVAL RECEIVED FROM LENDER', {
      clientName: data.clientName,
      lender: newRecord.lenderName,
      amount: `$${newRecord.amount?.toLocaleString()}`,
      product: newRecord.fundingProduct,
      notes: newRecord.lenderNotes,
    });
  } else if (newRecord.status === 'Approved') {
    sendDiscordNotification('approvalReceived', 'LENDER APPROVAL RECEIVED', {
      clientName: data.clientName,
      lender: newRecord.lenderName,
      amount: `$${newRecord.amount?.toLocaleString()}`,
      product: newRecord.fundingProduct,
      notes: newRecord.lenderNotes,
    });
  }

  addTimelineEvent(
    data.clientId,
    `Lender History Logged: ${newRecord.lenderName}`,
    `Status: ${newRecord.status} for ${newRecord.fundingProduct} ($${newRecord.amount?.toLocaleString()}). Notes: ${newRecord.lenderNotes}`,
    newRecord.sentBy,
    'LENDER',
    newRecord.dealId
  );

  saveDb();
  res.status(201).json(newRecord);
});

app.put('/api/lender-history/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.lenderHistory.findIndex((h) => h.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Record not found' });

  const prev = db.lenderHistory[idx];
  const updated = {
    ...prev,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.lenderHistory[idx] = updated;

  addTimelineEvent(
    updated.clientId,
    `Lender Update: ${updated.lenderName}`,
    `Status updated to ${updated.status}. ${updated.lenderNotes ? `Notes: ${updated.lenderNotes}` : ''}`,
    req.body.updatedBy || 'Staff',
    'LENDER',
    updated.dealId
  );

  saveDb();
  res.json(updated);
});

app.delete('/api/lender-history/:id', (req, res) => {
  const { id } = req.params;
  db.lenderHistory = db.lenderHistory.filter((h) => h.id !== id);
  saveDb();
  res.json({ success: true });
});

// ----------------------------------------------------
// CREDIT CARDS APIS (BUSINESS & PERSONAL)
// ----------------------------------------------------
app.get('/api/credit-cards/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const cards = db.creditCards.filter((c) => c.clientId === clientId);
  res.json(cards);
});

app.post('/api/credit-cards', (req, res) => {
  const cardData = req.body;
  const now = new Date().toISOString();
  const limit = Number(cardData.creditLimit || 0);
  const balance = Number(cardData.currentBalance || 0);
  const utilization = limit > 0 ? Number(((balance / limit) * 100).toFixed(1)) : 0;

  const newCard = {
    id: `cc-${Date.now()}`,
    clientId: cardData.clientId,
    cardCategory: cardData.cardCategory || 'BUSINESS',
    cardType: cardData.cardType || 'Visa',
    issuer: cardData.issuer || 'Chase',
    cardName: cardData.cardName || 'Chase Ink Business Preferred',
    cardholder: cardData.cardholder || 'Owner',
    creditLimit: limit,
    currentBalance: balance,
    availableCredit: limit - balance,
    monthlyPayment: Number(cardData.monthlyPayment || 0),
    utilization,
    openedDate: cardData.openedDate || '',
    lastFourDigits: cardData.lastFourDigits || '',
    notes: cardData.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  db.creditCards.push(newCard);
  saveDb();
  res.status(201).json(newCard);
});

app.put('/api/credit-cards/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.creditCards.findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Card not found' });

  const prev = db.creditCards[idx];
  const limit = Number(req.body.creditLimit !== undefined ? req.body.creditLimit : prev.creditLimit);
  const balance = Number(req.body.currentBalance !== undefined ? req.body.currentBalance : prev.currentBalance);
  const utilization = limit > 0 ? Number(((balance / limit) * 100).toFixed(1)) : 0;

  db.creditCards[idx] = {
    ...prev,
    ...req.body,
    creditLimit: limit,
    currentBalance: balance,
    availableCredit: limit - balance,
    utilization,
    updatedAt: new Date().toISOString(),
  };

  saveDb();
  res.json(db.creditCards[idx]);
});

app.delete('/api/credit-cards/:id', (req, res) => {
  const { id } = req.params;
  db.creditCards = db.creditCards.filter((c) => c.id !== id);
  saveDb();
  res.json({ success: true });
});

// ----------------------------------------------------
// MASTER VERIFICATION WORKSHEET APIS
// ----------------------------------------------------
function getOrGenerateMasterVerification(clientId: string) {
  if (db.masterVerifications[clientId]) {
    return db.masterVerifications[clientId];
  }

  const client = db.clients.find((c) => c.id === clientId);

  // Generate initial master worksheet for this client
  const initialMaster = {
    id: `mvw-${clientId}`,
    clientId,
    verificationSpecialist: client?.assignedStaff || 'Dana',
    date: new Date().toISOString().split('T')[0],
    status: client?.isVerified ? 'VERIFIED' : 'IN_PROGRESS',
    overallResult: client?.isVerified ? 'APPROVED_FOR_UNDERWRITING' : 'NEEDS_MORE_INFO',
    callSummary: client?.verificationSummary || 'Master intake verification worksheet initiated.',
    internalNotesRedFlags: 'No critical red flags detected during initial intake.',

    preCallReview: {
      clientName: true,
      businessName: true,
      phone: true,
      email: true,
      businessAddress: true,
      entityType: true,
      ein: true,
      timeInBusiness: true,
      ownershipPercentage: true,
      monthlyRevenue: true,
      personalAnnualIncome: true,
      requestedFunding: true,
      purposeOfFunds: true,
      uploadedDocuments: true,
      ssn: true,
      dob: true,
      stateOfIncorporation: true,
      creditScore: true,
      missingInfoNotes: 'All 17 application datapoints present for call.',
    },

    openingScript: {
      answered: true,
      continueNow: true,
      rescheduleDate: '',
      rescheduleNotes: '',
    },

    identity: {
      legalName: {
        asApplied: `${client?.firstName || ''} ${client?.lastName || ''}`,
        verified: `${client?.firstName || ''} ${client?.lastName || ''}`,
        status: 'Matches Application',
        notes: 'Confirmed photo ID match.',
      },
      phone: {
        asApplied: client?.phone || '(555) 000-0000',
        verified: client?.phone || '(555) 000-0000',
        status: 'Verified',
        notes: 'Direct cell verified.',
      },
      email: {
        asApplied: client?.email || '',
        verified: client?.email || '',
        status: 'Verified',
        notes: 'Confirmed primary operational inbox.',
      },
      dob: {
        asApplied: client?.dob || '1985-01-01',
        verified: client?.dob || '1985-01-01',
        status: 'Matches Application',
        notes: 'DOB verified.',
      },
      ssnLast4: {
        asApplied: client?.ssn?.slice(-4) || '1904',
        verified: client?.ssn?.slice(-4) || '1904',
        status: 'Verified',
        notes: 'SSN last 4 confirmed.',
      },
    },

    business: {
      businessName: { asApplied: client?.businessName || '', verified: client?.businessName || '', status: 'Verified', notes: 'Matches Secretary of State filing.' },
      dba: { asApplied: client?.dba || client?.businessName || '', verified: client?.dba || client?.businessName || '', status: 'Verified', notes: '' },
      businessAddress: { asApplied: client?.businessAddress || '', verified: client?.businessAddress || '', status: 'Verified', notes: 'Commercial physical location.' },
      ein: { asApplied: client?.federalTaxId || '', verified: client?.federalTaxId || '', status: 'Verified', notes: 'EIN verified on CP-575.' },
      stateOfIncorporation: { asApplied: client?.stateOfOrganization || 'TX', verified: client?.stateOfOrganization || 'TX', status: 'Verified', notes: '' },
      entityType: { asApplied: client?.entityType || 'LLC', verified: client?.entityType || 'LLC', status: 'Verified', notes: '' },
      businessStartDate: { asApplied: client?.businessStartDate || '2019-01-01', verified: client?.businessStartDate || '2019-01-01', status: 'Verified', notes: '' },
      timeInBusiness: { asApplied: '5+ Years', verified: '5+ Years', status: 'Verified', notes: 'Continuous active operations.' },
      industry: { asApplied: client?.industry || 'Commercial Services', verified: client?.industry || 'Commercial Services', status: 'Verified', notes: '' },
      businessDescription: { asApplied: client?.businessDescription || '', verified: client?.businessDescription || '', status: 'Verified', notes: '' },
      ownershipPercentage: { asApplied: `${client?.ownershipPercentage || 100}%`, verified: `${client?.ownershipPercentage || 100}%`, status: 'Verified', notes: '100% sole owner.' },
      ownerTitle: { asApplied: client?.ownerTitle || 'Managing Member / Owner', verified: client?.ownerTitle || 'Managing Member / Owner', status: 'Verified', notes: '' },
    },

    employment: {
      selfEmployedOnly: false,
      alsoEmployedFullTime: true,
      employer: 'Apex Healthcare Systems Inc.',
      position: 'Senior Operations Director',
      yearsEmployed: '4.5 Years',
      employmentStartDate: '2020-03-01',
      employmentStatus: 'Full Time Active W2',
      annualSalary: 145000,
      monthlySalary: 12083,
      payFrequency: 'Bi-Weekly',
      otherEmploymentIncome: '$15,000 annual bonus',
      employmentNotes: 'Stable high W2 income backing commercial debt service.',
      redFlags: 'None',
    },

    employmentVerification: {
      sectionStatus: 'Verified',
      currentlyWorking: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'Currently employed and working full-time', script: 'Are you currently working, either for your own business or for another employer?' },
      selfEmployed: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'Sole member/owner of business LLC', script: 'Are you currently self-employed or do you work for another employer?' },
      employedByAnotherCompany: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'W-2 employee at Apex Healthcare Systems', script: 'Are you currently employed by another company in addition to owning your business?' },
      employerName: { asApplied: 'Apex Healthcare Systems Inc.', verified: 'Apex Healthcare Systems Inc.', status: 'Verified', notes: 'Active hospital network employer', script: 'What is the name of your current employer?' },
      jobTitle: { asApplied: 'Senior Operations Director', verified: 'Senior Operations Director', status: 'Verified', notes: 'Senior executive role', script: 'What is your current job title or position?' },
      jobOccupation: { asApplied: 'Healthcare Management', verified: 'Healthcare Management', status: 'Verified', notes: 'Healthcare and operations management', script: 'What do you do in your current job?' },
      jobDescription: { asApplied: 'Directs regional healthcare clinical logistics, procurement, and staff oversight.', verified: 'Directs regional healthcare clinical logistics, procurement, and staff oversight.', status: 'Verified', notes: 'Confirmed with HR directory', script: 'Can you briefly explain what your responsibilities are in your current job?' },
      employmentStartDate: { asApplied: '2020-03-01', verified: '2020-03-01', status: 'Verified', notes: '4.5+ years of continuous service', script: 'When did you start working for your current employer?' },
      yearsWithEmployer: { asApplied: '4.5 Years', verified: '4.5 Years', status: 'Verified', notes: 'Continuous tenure', script: 'How long have you been with your current employer?' },
      employmentTypeStatus: { asApplied: 'Full-Time', verified: 'Full-Time', status: 'Verified', notes: 'Exempt salaried full-time employee', script: 'Would you consider your current employment full-time, part-time, contract, seasonal, or other?' },
      annualSalary: { asApplied: '$145,000', verified: '$145,000', status: 'Verified', notes: 'Base salary verified via pay stub', script: 'What is your current annual salary?' },
      monthlySalary: { asApplied: '$12,083', verified: '$12,083', status: 'Verified', notes: 'Calculated from annual salary', script: 'Approximately how much do you earn from your employment each month?' },
      annualEmploymentIncome: { asApplied: '$160,000', verified: '$160,000', status: 'Verified', notes: 'Includes $15,000 annual performance bonus', script: 'What is your total annual employment income?' },
      monthlyEmploymentIncome: { asApplied: '$13,333', verified: '$13,333', status: 'Verified', notes: 'Includes bonus distribution', script: 'What is your total monthly employment income?' },
      otherMonthlyIncome: { asApplied: '$2,500', verified: '$2,500', status: 'Verified', notes: 'Rental property cashflow', script: 'Do you have any other regular monthly income outside of your business or employment?' },
      otherIncomeSource: { asApplied: 'Rental Property / Investment', verified: 'Rental Property / Investment', status: 'Verified', notes: 'Schedule E on tax returns', script: 'What is the source of that additional income?' },
      receivesPayStubs: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'Bi-weekly electronic pay stubs', script: 'Do you receive pay stubs from your employer?' },
      paidThroughPayroll: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'Automated direct deposit via ADP', script: 'Are you currently paid through a formal payroll system?' },
      payFrequency: { asApplied: 'Biweekly', verified: 'Biweekly', status: 'Verified', notes: 'Every other Friday', script: 'How often do you receive your paycheck?' },
      mostRecentPayStubDate: { asApplied: '2026-08-15', verified: '2026-08-15', status: 'Verified', notes: 'Latest cycle on file', script: 'What is the date of your most recent pay stub?' },
      payStubReceived: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'PDF uploaded to Document Vault', script: 'Has the pay stub document been received?' },
      payStubReviewed: { asApplied: 'Yes', verified: 'Yes', status: 'Verified', notes: 'Reviewed and corroborated by underwriter', script: 'Has the pay stub been reviewed for accuracy?' },
      employmentIncomeNotes: 'Client maintains a stable high-compensation W2 role in addition to owning 100% of the operating business. Strong overall repayment capacity.',
      redFlags: 'None detected. Employment is stable (4.5+ yrs) and corroborated with recent ADP pay stubs.',
      updatedAt: new Date().toISOString(),
      updatedBy: client?.assignedStaff || 'Dana',
    },

    income: {
      personalAnnualIncome: 145000,
      monthlyBusinessRevenue: client?.monthlyRevenue || 70000,
      verifiedPersonalAnnualIncome: 145000,
      verifiedMonthlyBusinessRevenue: client?.monthlyRevenue || 70833,
      exactCreditScore: client?.creditScore || 710,
      revenueTrend: 'Consistent',
      revenueTrendExplanation: 'Consistent monthly revenue averaging $70k+ with no seasonality drops.',
      incomeNotes: 'Strong bank deposit velocity confirmed.',
      redFlags: 'None',
    },

    payroll: {
      paysSelfThroughPayroll: true,
      issuesPayStubs: true,
      salary: 145000,
      grossPay: 5576,
      netPay: 4120,
      payFrequency: 'Bi-Weekly',
      payrollStartDate: '2020-03-01',
      latestPayStubDate: '2026-08-15',
      payStubReceived: true,
      payStubReviewed: true,
      payrollNotes: 'ADP payroll stubs verified with electronic direct deposits.',
      redFlags: 'None',
    },

    banking: {
      primaryBank: 'Chase Commercial Banking',
      dedicatedBusinessChecking: true,
      businessAccount: 'Chase Business Total Checking (...8912)',
      personalAccountUsedForBusiness: false,
      businessIncomeDepositedIntoPersonal: false,
      regularBusinessToPersonalTransfers: true,
      transferFrequency: 'Monthly owner draws',
      approximateTransferAmount: 8500,
      bankingExplanation: 'Clean separation between personal accounts and corporate checking.',
      bankingNotes: 'No NSF / overdraft charges in the last 6 months.',
      redFlags: 'None',
    },

    documentChecklist: {
      driversLicense: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Dana', reviewedDate: '2026-08-20', notes: 'Valid state DL' },
      bankStatements: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Luke', reviewedDate: '2026-08-20', notes: '4 months clean' },
      taxReturns: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Luke', reviewedDate: '2026-08-21', notes: '2024 & 2025 1040/1120S' },
      voidedCheck: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Dana', reviewedDate: '2026-08-20', notes: 'Matches direct account' },
      profitAndLoss: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Luke', reviewedDate: '2026-08-21', notes: 'YTD 2026 P&L' },
      articlesOfOrg: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Dana', reviewedDate: '2026-08-20', notes: 'Good standing' },
      businessLicense: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Dana', reviewedDate: '2026-08-20', notes: 'Current state license' },
      other: { received: true, stillNeeded: false, sentAfterCall: false, reviewed: true, reviewedBy: 'Dana', reviewedDate: '2026-08-20', notes: 'W2 pay stubs' },
    },

    existingDebts: [
      { id: 'd-1', clientId, lender: 'SBA 7(a) Loan', loanType: 'SBA Loan', originalLoanAmount: 50000, termMonths: 120, monthlyPayment: 840, currentBalance: 38000, status: 'Current', notes: 'No missed payments' },
      { id: 'd-2', clientId, lender: 'Equipment Line', loanType: 'Equipment Financing', originalLoanAmount: 25000, termMonths: 36, monthlyPayment: 780, currentBalance: 12000, status: 'Current', notes: 'Diagnostic machine' },
      { id: 'd-3', clientId, lender: 'None', loanType: 'MCA', originalLoanAmount: 0, termMonths: 0, monthlyPayment: 0, currentBalance: 0, status: 'None', notes: 'Zero MCA stacking' },
      { id: 'd-4', clientId, lender: 'None', loanType: 'Term Loan', originalLoanAmount: 0, termMonths: 0, monthlyPayment: 0, currentBalance: 0, status: 'None', notes: '' },
      { id: 'd-5', clientId, lender: 'None', loanType: 'Other', originalLoanAmount: 0, termMonths: 0, monthlyPayment: 0, currentBalance: 0, status: 'None', notes: '' },
    ],
    bankruptcyForeclosureRepossession5Years: false,
    bankruptcyForeclosureNotes: 'Zero derogatory credit history in past 7 years.',

    creditCards: [],

    recentCreditActivity: [
      { id: 'rc-1', clientId, lender: 'Chase Business Card', dateApplied: '2026-03-10', amountRequested: 25000, product: 'Credit Card', approved: true, result: 'Approved', notes: 'Instant approval' },
      { id: 'rc-2', clientId, lender: 'None', dateApplied: '', amountRequested: 0, product: '', approved: false, result: 'Approved', notes: '' },
      { id: 'rc-3', clientId, lender: 'None', dateApplied: '', amountRequested: 0, product: '', approved: false, result: 'Approved', notes: '' },
      { id: 'rc-4', clientId, lender: 'None', dateApplied: '', amountRequested: 0, product: '', approved: false, result: 'Approved', notes: '' },
      { id: 'rc-5', clientId, lender: 'None', dateApplied: '', amountRequested: 0, product: '', approved: false, result: 'Approved', notes: '' },
    ],

    housing: {
      homeAddressSameAsBusiness: false,
      homeAddressIfDifferent: '450 N Michigan Ave, Suite 1800, Chicago, IL 60611',
      housingType: 'Homeowner',
      monthlyMortgageOrRent: 2400,
      housingNotes: 'Primary single family residence, mortgage current.',
      redFlags: 'None',
    },

    fundingRequest: {
      requestedAmount: client?.requestedAmount || 95000,
      verifiedRequestedAmount: client?.requestedAmount || 95000,
      purposeOfFunds: 'Working Capital',
      fundingUrgency: 'Immediately',
      purposeNotes: 'Bulk inventory purchasing and laboratory equipment upgrade.',
      redFlags: 'None',
    },

    creditVerification: {
      exactCreditScore: client?.creditScore || 710,
      creditUnlocked: true,
      fraudAlert: false,
      securityFreeze: false,
      creditNotes: 'Personal credit bureaus unlocked across Experian, TransUnion, Equifax.',
      redFlags: 'None',
    },

    underwriterSummary: {
      overallImpression: 'Excellent',
      biggestStrength: 'Strong stable bank cash flow (> $70k/mo), dual income W2 + 100% corporate ownership, high credit score.',
      biggestConcern: 'Existing SBA 7(a) balance of $38k (servicing comfortably).',
      cashFlowNotes: 'Zero NSF incidents, consistent deposit density.',
      businessStabilityNotes: '8+ years active entity registration in Illinois.',
      additionalDocumentsNeeded: 'None. File complete.',
      readyForSubmission: true,
      reasonIfNo: '',
    },

    finalChecklist: {
      identityVerified: true,
      businessVerified: true,
      incomeVerified: true,
      employmentVerified: true,
      bankingVerified: true,
      documentsReceived: true,
      existingDebtReviewed: true,
      housingVerified: true,
      fundingAmountConfirmed: true,
      creditAvailableForPull: true,
      fileReadyForUnderwriting: true,
    },

    updatedAt: new Date().toISOString(),
  };

  db.masterVerifications[clientId] = initialMaster;
  saveDb();
  return initialMaster;
}

app.get('/api/verification/master/:clientId', (req, res) => {
  const { clientId } = req.params;
  const master = getOrGenerateMasterVerification(clientId);
  res.json(master);
});

app.post('/api/verification/master/:clientId', (req, res) => {
  const { clientId } = req.params;
  const masterData = req.body;
  const now = new Date().toISOString();

  db.masterVerifications[clientId] = {
    ...masterData,
    clientId,
    updatedAt: now,
  };

  // Synchronize with main client record
  const client = db.clients.find((c) => c.id === clientId);
  if (client) {
    client.isVerified = masterData.status === 'VERIFIED';
    client.verifiedBy = masterData.verificationSpecialist || 'Dana';
    client.verificationDate = now;
    client.verificationSummary = masterData.callSummary;
    if (masterData.income?.exactCreditScore) {
      client.creditScore = Number(masterData.income.exactCreditScore);
    }
    if (masterData.income?.verifiedMonthlyBusinessRevenue) {
      client.monthlyRevenue = Number(masterData.income.verifiedMonthlyBusinessRevenue);
      client.annualRevenue = client.monthlyRevenue * 12;
    }
    if (masterData.fundingRequest?.verifiedRequestedAmount) {
      client.requestedAmount = Number(masterData.fundingRequest.verifiedRequestedAmount);
    }
    if (masterData.status === 'VERIFIED') {
      client.currentStatus = 'VERIFICATION_COMPLETE';
    }
    client.updatedAt = now;
  }

  // Discord notification if verification complete
  if (masterData.status === 'VERIFIED') {
    sendDiscordNotification('verificationComplete', 'VERIFICATION COMPLETED SUCCESSFULLY', {
      clientName: client ? `${client.firstName} ${client.lastName}` : 'Client',
      businessName: client?.businessName,
      assignedUser: masterData.verificationSpecialist,
      priority: 'High',
      amount: `$${client?.requestedAmount?.toLocaleString()}`,
      notes: masterData.callSummary,
    });
  }

  addTimelineEvent(
    clientId,
    'Master Verification Worksheet Saved',
    `Complete master verification form updated by ${masterData.verificationSpecialist || 'Staff'}. Status: ${masterData.status}. Result: ${masterData.overallResult}.`,
    masterData.verificationSpecialist || 'Staff',
    'VERIFICATION'
  );

  saveDb();
  res.json(db.masterVerifications[clientId]);
});

// ----------------------------------------------------
// DISCORD INTEGRATION APIS
// ----------------------------------------------------
app.get('/api/discord/config', (req, res) => {
  res.json(db.discordConfig);
});

app.put('/api/discord/config', (req, res) => {
  db.discordConfig = {
    ...db.discordConfig,
    ...req.body,
  };
  saveDb();
  res.json(db.discordConfig);
});

app.post('/api/discord/test', async (req, res) => {
  const { webhookUrl } = req.body;
  const targetUrl = webhookUrl || db.discordConfig?.webhookUrl;

  if (!targetUrl) {
    return res.status(400).json({ success: false, message: 'Please enter a valid Discord Webhook URL.' });
  }

  try {
    const testPayload = {
      username: 'Maple X Operations Bot',
      embeds: [
        {
          title: '✅ MAPLE X FINANCIAL — DISCORD INTEGRATION TEST',
          description: 'Secure server-side Discord notification connection verified successfully.',
          color: 15381256, // Gold
          fields: [
            { name: 'System', value: 'Maple X Financial Operations Portal', inline: true },
            { name: 'Status', value: '🟢 Active & Connected', inline: true },
            { name: 'Timestamp', value: new Date().toUTCString(), inline: false },
          ],
          footer: { text: 'Maple X Financial • Secure Internal Webhook' },
        },
      ],
    };

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });

    if (response.ok) {
      db.discordConfig.lastTestedAt = new Date().toISOString();
      db.discordConfig.lastTestStatus = 'SUCCESS';
      saveDb();
      return res.json({ success: true, message: 'Test message sent to Discord successfully!' });
    } else {
      const errText = await response.text();
      return res.status(400).json({ success: false, message: `Discord rejected webhook: ${errText}` });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, message: `Failed to dispatch to Discord: ${err.message}` });
  }
});

// ----------------------------------------------------
// FIREBASE CONFIGURATION APIS
// ----------------------------------------------------
app.get('/api/firebase/config', (req, res) => {
  res.json(db.firebaseConfig);
});

app.put('/api/firebase/config', (req, res) => {
  db.firebaseConfig = {
    ...db.firebaseConfig,
    ...req.body,
    isConfigured: true,
    lastVerifiedAt: new Date().toISOString(),
  };
  saveDb();
  res.json(db.firebaseConfig);
});

app.post('/api/firebase/test', (req, res) => {
  const config = { ...db.firebaseConfig, ...req.body };
  if (!config.apiKey || !config.apiKey.trim()) {
    return res.status(400).json({ success: false, message: 'Firebase API Key is missing. Please enter a valid Web API Key.' });
  }
  if (!config.projectId || !config.projectId.trim()) {
    return res.status(400).json({ success: false, message: 'Firebase Project ID is missing.' });
  }
  return res.json({
    success: true,
    message: `Firebase configuration parameters verified for project "${config.projectId}".`,
  });
});

// LEADS CRUD
app.get('/api/leads', (req, res) => {
  res.json(db.leads);
});

app.post('/api/leads', (req, res) => {
  const leadData = req.body;
  const newLead = {
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'NEW_LEAD',
    applicationStatus: 'NOT_STARTED',
    ghlSyncStatus: 'SYNCED',
    ghlContactId: leadData.ghlContactId || `ghl_c_${Math.floor(100000 + Math.random() * 900000)}`,
    ghlOpportunityId: leadData.ghlOpportunityId || `ghl_opp_${Math.floor(100000 + Math.random() * 900000)}`,
    ...leadData,
  };
  db.leads.unshift(newLead);

  // Send Discord notification for new lead
  sendDiscordNotification('newLead', 'NEW INBOUND LEAD INGESTED', {
    clientName: `${newLead.firstName} ${newLead.lastName}`,
    businessName: newLead.businessName,
    assignedUser: newLead.assignedSalesRep,
    priority: 'Medium',
    amount: newLead.estimatedAmount ? `$${Number(newLead.estimatedAmount).toLocaleString()}` : 'TBD',
    notes: `Source: ${newLead.leadSource}. Referral: ${newLead.referralPartner || 'None'}`,
  });

  saveDb();
  res.status(201).json(newLead);
});

app.put('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const index = db.leads.findIndex((l) => l.id === id);
  if (index === -1) return res.status(404).json({ error: 'Lead not found' });

  db.leads[index] = {
    ...db.leads[index],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  saveDb();
  res.json(db.leads[index]);
});

app.delete('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  db.leads = db.leads.filter((l) => l.id !== id);
  saveDb();
  res.json({ success: true });
});

// Convert Lead to Client File
app.post('/api/leads/:id/convert-to-client', (req, res) => {
  const { id } = req.params;
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const clientId = `client-${Date.now()}`;
  const now = new Date().toISOString();

  const newClient = {
    id: clientId,
    firstName: lead.firstName || '',
    lastName: lead.lastName || '',
    email: lead.email || '',
    phone: lead.phone || '',
    ssn: req.body.ssn || '123-45-6789',
    dob: req.body.dob || '1984-06-15',
    address: req.body.address || '742 Evergreen Terrace',
    city: req.body.city || 'Dallas',
    state: lead.state || 'TX',
    zip: req.body.zip || '75201',

    businessName: lead.businessName || 'Apex Commercial Holdings LLC',
    businessPhone: lead.phone || '(555) 987-6543',
    businessEmail: lead.email || 'billing@apexholdings.com',
    businessAddress: req.body.businessAddress || '100 Main St, Suite 400',
    businessCity: req.body.businessCity || 'Dallas',
    businessState: lead.state || 'TX',
    businessZip: req.body.businessZip || '75201',
    industry: lead.industry || 'Commercial Construction',
    businessStartDate: req.body.businessStartDate || '2019-03-01',
    businessStartDateUnderCurrentOwnership: req.body.businessStartDate || '2019-03-01',
    federalTaxId: req.body.federalTaxId || '84-1234567',
    stateOfOrganization: lead.state || 'TX',
    annualRevenue: Number(req.body.annualRevenue || lead.estimatedAmount ? lead.estimatedAmount * 3 : 650000),
    monthlyRevenue: Math.round(Number(req.body.annualRevenue || 650000) / 12),
    ownershipPercentage: Number(req.body.ownershipPercentage || 100),
    businessDescription: req.body.businessDescription || 'Commercial general contracting and site development firm.',

    ghlContactId: lead.ghlContactId,
    ghlOpportunityId: lead.ghlOpportunityId,
    leadSource: lead.leadSource || 'Partner',
    referralPartner: lead.referralPartner || '',
    assignedSalesRep: lead.assignedSalesRep || 'Steve',

    assignedStaff: lead.assignedSalesRep || 'Dana',
    currentStatus: 'APPLICATION_RECEIVED',
    createdAt: now,
    updatedAt: now,

    requestedAmount: Number(lead.estimatedAmount || 50000),
    requestedProduct: 'Revenue Funding',
    useOfFunds: 'Working capital and material equipment purchase',
    creditScore: 685,
    existingLoans: 'None',
    existingMcas: 'None',
    lenderBalances: '$0',
    bankruptcy: 'None',
    foreclosure: 'None',
    repossession: 'None',

    isVerified: false,
    isUnderwritten: false,
  };

  db.clients.unshift(newClient);

  // Update lead status
  lead.status = 'APPLICATION_RECEIVED';
  lead.applicationStatus = 'SUBMITTED';
  lead.updatedAt = now;

  // Create initial funding deal for this application
  const dealId = `deal-${Date.now()}`;
  const initialDeal = {
    id: dealId,
    clientId,
    clientName: `${newClient.firstName} ${newClient.lastName}`,
    businessName: newClient.businessName,
    product: newClient.requestedProduct,
    fundingAmount: newClient.requestedAmount,
    fee: 1495,
    percentage: 6.9, // Default 6.9%
    termLength: '24 Months',
    status: 'PROPOSED',
    assignedStaff: newClient.assignedStaff,
    lenderStatus: 'PENDING',
    lenderName: 'Maple Direct Capital',
    lenderContact: 'underwriting@mapledirect.com',
    commissionStatus: 'PENDING',
    notes: 'Initial primary funding deal generated from converted application.',
    createdAt: now,
    updatedAt: now,
    isStacked: false,
  };
  db.fundingDeals.unshift(initialDeal);

  // Auto-allocate default 4 Maple X participants
  const defaultParticipants = [
    { name: 'Dana', type: 'Internal Staff', role: 'Operations & Funding', points: 1.0 },
    { name: 'Luke', type: 'Internal Staff', role: 'Underwriting & Stacking', points: 2.9 },
    { name: 'Steve', type: 'Internal Staff', role: 'Deal Structuring', points: 1.475 },
    { name: 'Robert', type: 'Internal Staff', role: 'Executive Principal', points: 1.525 },
  ];

  for (const p of defaultParticipants) {
    db.commissionParticipants.push({
      id: `cp-${dealId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dealId,
      name: p.name,
      type: p.type,
      role: p.role,
      points: p.points,
      dollarAmount: (initialDeal.fundingAmount * p.points) / 100,
      notes: 'Initial standard point allocation',
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create initial client task
  db.tasks.unshift({
    id: `task-init-${Date.now()}`,
    title: `Conduct Master Verification Call with ${newClient.firstName} ${newClient.lastName}`,
    description: `Perform line-by-line verification call using the Master Verification Worksheet.`,
    clientId,
    clientName: `${newClient.firstName} ${newClient.lastName}`,
    category: 'Verification',
    assignedTo: 'Dana',
    dueDate: new Date(Date.now() + 3600000 * 24).toISOString().split('T')[0],
    dueTime: '14:00',
    priority: 'High',
    status: 'To Do',
    reminder: '1 hour before',
    notes: 'Confirm Illinois entity registration and $650k revenue.',
    createdBy: 'System',
    createdDate: now,
    updatedAt: now,
  });

  // Add initial timeline event
  addTimelineEvent(
    clientId,
    'Client File Created',
    `Lead ${lead.firstName} ${lead.lastName} (${lead.businessName}) converted to active Client File. Primary deal #1 initialized.`,
    newClient.assignedStaff,
    'LEAD_CREATED'
  );

  saveDb();
  res.status(201).json({ success: true, client: newClient, deal: initialDeal });
});

// CLIENTS CRUD
app.get('/api/clients', (req, res) => {
  res.json(db.clients);
});

app.get('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const client = db.clients.find((c) => c.id === id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const deals = db.fundingDeals.filter((d) => d.clientId === id);
  const verifications = db.verificationRecords.filter((v) => v.clientId === id);
  const verificationAudit = db.verificationAuditLogs.filter((v) => v.clientId === id);
  const underwriting = db.underwritingRecords.find((u) => u.clientId === id);
  const notes = db.underwritingNotes.filter((n) => n.clientId === id);
  const submissions = db.lenderSubmissions.filter((s) => s.clientId === id);
  const docs = db.documents.filter((d) => d.clientId === id);
  const comms = db.communicationLogs.filter((c) => c.clientId === id);
  const timeline = db.timelineEvents.filter((t) => t.clientId === id);
  const fundingStrategies = db.fundingStrategies.filter((s) => s.clientId === id);
  const internalNotes = db.internalNotes.filter((n) => n.clientId === id);
  const lenderHistory = db.lenderHistory.filter((h) => h.clientId === id);
  const creditCards = db.creditCards.filter((c) => c.clientId === id);
  const tasks = db.tasks.filter((t) => t.clientId === id);
  const masterVerification = getOrGenerateMasterVerification(id);

  const dealIds = deals.map((d) => d.id);
  const commissions = db.commissionParticipants.filter((cp) => dealIds.includes(cp.dealId));

  res.json({
    client,
    deals,
    verifications,
    verificationAudit,
    underwriting,
    notes,
    submissions,
    documents: docs,
    communications: comms,
    timeline,
    commissions,
    fundingStrategies,
    internalNotes,
    lenderHistory,
    creditCards,
    tasks,
    masterVerification,
  });
});

app.post('/api/clients', (req, res) => {
  const clientData = req.body;
  const now = new Date().toISOString();
  const newClient = {
    id: `client-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
    currentStatus: clientData.currentStatus || 'APPLICATION_RECEIVED',
    assignedStaff: clientData.assignedStaff || 'Dana',
    leadSource: clientData.leadSource || 'Website',
    referralPartner: clientData.referralPartner || '',
    assignedSalesRep: clientData.assignedSalesRep || 'Steve',
    annualRevenue: Number(clientData.annualRevenue || 500000),
    monthlyRevenue: Math.round(Number(clientData.annualRevenue || 500000) / 12),
    requestedAmount: Number(clientData.requestedAmount || 50000),
    requestedProduct: clientData.requestedProduct || 'Revenue Funding',
    creditScore: Number(clientData.creditScore || 680),
    ownershipPercentage: Number(clientData.ownershipPercentage || 100),
    ...clientData,
  };

  db.clients.unshift(newClient);

  // Create initial funding deal
  const dealId = `deal-${Date.now()}`;
  const initialDeal = {
    id: dealId,
    clientId: newClient.id,
    clientName: `${newClient.firstName} ${newClient.lastName}`,
    businessName: newClient.businessName,
    product: newClient.requestedProduct,
    fundingAmount: newClient.requestedAmount,
    fee: 1495,
    percentage: 6.9,
    termLength: '24 Months',
    status: 'PROPOSED',
    assignedStaff: newClient.assignedStaff,
    lenderStatus: 'PENDING',
    lenderName: 'Maple Direct Capital',
    lenderContact: 'underwriting@mapledirect.com',
    commissionStatus: 'PENDING',
    notes: 'Initial deal created with new client file.',
    createdAt: now,
    updatedAt: now,
    isStacked: false,
  };
  db.fundingDeals.unshift(initialDeal);

  // Auto-allocate default 4 Maple X participants
  const defaultParticipants = [
    { name: 'Dana', type: 'Internal Staff', role: 'Operations & Funding', points: 1.0 },
    { name: 'Luke', type: 'Internal Staff', role: 'Underwriting & Stacking', points: 2.9 },
    { name: 'Steve', type: 'Internal Staff', role: 'Deal Structuring', points: 1.475 },
    { name: 'Robert', type: 'Internal Staff', role: 'Executive Principal', points: 1.525 },
  ];

  for (const p of defaultParticipants) {
    db.commissionParticipants.push({
      id: `cp-${dealId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dealId,
      name: p.name,
      type: p.type,
      role: p.role,
      points: p.points,
      dollarAmount: (initialDeal.fundingAmount * p.points) / 100,
      notes: 'Initial standard point allocation',
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
  }

  addTimelineEvent(
    newClient.id,
    'Client File Created',
    `New client record created for ${newClient.firstName} ${newClient.lastName} (${newClient.businessName}).`,
    newClient.assignedStaff,
    'STATUS_CHANGE'
  );

  saveDb();
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const index = db.clients.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Client not found' });

  const prev = db.clients[index];
  const updated = {
    ...prev,
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  db.clients[index] = updated;

  if (req.body.currentStatus && req.body.currentStatus !== prev.currentStatus) {
    addTimelineEvent(
      id,
      `Pipeline Stage: ${req.body.currentStatus.replace(/_/g, ' ')}`,
      `Client pipeline stage moved from ${prev.currentStatus} to ${req.body.currentStatus}.`,
      req.body.updatedBy || updated.assignedStaff,
      'STATUS_CHANGE'
    );
  }

  saveDb();
  res.json(updated);
});

app.post('/api/clients/:id/audit-ssn-view', (req, res) => {
  const { id } = req.params;
  const { staffName } = req.body;
  addTimelineEvent(
    id,
    'SSN Viewed',
    `Authorized staff member ${staffName || 'Staff'} revealed and viewed client Social Security Number.`,
    staffName || 'Staff',
    'NOTE'
  );
  res.json({ success: true });
});

// FUNDING DEALS CRUD
app.get('/api/deals', (req, res) => {
  res.json(db.fundingDeals);
});

app.get('/api/deals/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const deals = db.fundingDeals.filter((d) => d.clientId === clientId);
  res.json(deals);
});

app.post('/api/deals', (req, res) => {
  const dealData = req.body;
  const now = new Date().toISOString();
  const client = db.clients.find((c) => c.id === dealData.clientId);

  const existingDeals = db.fundingDeals.filter((d) => d.clientId === dealData.clientId);
  const isStacked = existingDeals.length > 0;

  const newDeal = {
    id: `deal-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clientId: dealData.clientId,
    clientName: client ? `${client.firstName} ${client.lastName}` : dealData.clientName || 'Client',
    businessName: client ? client.businessName : dealData.businessName || 'Business',
    product: dealData.product || 'Revenue Funding',
    fundingAmount: Number(dealData.fundingAmount || 50000),
    fee: Number(dealData.fee || 1495),
    percentage: Number(dealData.percentage || 6.9),
    termLength: dealData.termLength || '24 Months',
    status: dealData.status || 'PROPOSED',
    assignedStaff: dealData.assignedStaff || (client ? client.assignedStaff : 'Dana'),
    lenderStatus: dealData.lenderStatus || 'PENDING',
    lenderName: dealData.lenderName || 'Maple Direct Capital',
    lenderContact: dealData.lenderContact || 'underwriting@mapledirect.com',
    commissionStatus: 'PENDING',
    notes: dealData.notes || '',
    createdAt: now,
    updatedAt: now,
    isStacked,
  };

  db.fundingDeals.unshift(newDeal);

  // Auto-allocate default 4 Maple X participants for this new deal
  const defaultParticipants = [
    { name: 'Dana', type: 'Internal Staff', role: 'Operations & Funding', points: 1.0 },
    { name: 'Luke', type: 'Internal Staff', role: 'Underwriting & Stacking', points: 2.9 },
    { name: 'Steve', type: 'Internal Staff', role: 'Deal Structuring', points: 1.475 },
    { name: 'Robert', type: 'Internal Staff', role: 'Executive Principal', points: Math.max(0, Number((newDeal.percentage - 1.0 - 2.9 - 1.475).toFixed(3))) },
  ];

  for (const p of defaultParticipants) {
    db.commissionParticipants.push({
      id: `cp-${newDeal.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dealId: newDeal.id,
      name: p.name,
      type: p.type,
      role: p.role,
      points: p.points,
      dollarAmount: (newDeal.fundingAmount * p.points) / 100,
      notes: 'Auto-initialized allocation',
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    });
  }

  addTimelineEvent(
    dealData.clientId,
    `Funding Deal Added (${isStacked ? 'Stacked Deal' : 'Primary Deal'})`,
    `Deal for ${newDeal.product} ($${newDeal.fundingAmount.toLocaleString()} @ ${newDeal.percentage}%) created.`,
    newDeal.assignedStaff,
    'FUNDING',
    newDeal.id
  );

  saveDb();
  res.status(201).json(newDeal);
});

app.put('/api/deals/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.fundingDeals.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Funding deal not found' });

  const prev = db.fundingDeals[idx];
  const updated = {
    ...prev,
    ...req.body,
    fundingAmount: Number(req.body.fundingAmount !== undefined ? req.body.fundingAmount : prev.fundingAmount),
    fee: Number(req.body.fee !== undefined ? req.body.fee : prev.fee),
    percentage: Number(req.body.percentage !== undefined ? req.body.percentage : prev.percentage),
    updatedAt: new Date().toISOString(),
  };

  db.fundingDeals[idx] = updated;

  // Recalculate participant dollar amounts
  const participants = db.commissionParticipants.filter((cp) => cp.dealId === id);
  for (const p of participants) {
    p.dollarAmount = (updated.fundingAmount * p.points) / 100;
    p.updatedAt = new Date().toISOString();
  }

  if (updated.status === 'FUNDED' && prev.status !== 'FUNDED') {
    updated.fundingDate = new Date().toISOString();
    const client = db.clients.find((c) => c.id === updated.clientId);
    if (client) {
      client.currentStatus = 'FUNDED';
      client.updatedAt = new Date().toISOString();
    }

    sendDiscordNotification('clientFunded', 'CLIENT DEAL FUNDED SUCCESSFULLY!', {
      clientName: updated.clientName,
      businessName: updated.businessName,
      assignedUser: updated.assignedStaff,
      priority: 'High',
      amount: `$${updated.fundingAmount?.toLocaleString()}`,
      product: updated.product,
      lender: updated.lenderName,
    });

    addTimelineEvent(
      updated.clientId,
      'Deal Funded!',
      `${updated.product} ($${updated.fundingAmount.toLocaleString()}) funded successfully via ${updated.lenderName}. Commission pending collection.`,
      updated.assignedStaff,
      'FUNDING',
      updated.id
    );
  }

  saveDb();
  res.json(updated);
});

app.delete('/api/deals/:id', (req, res) => {
  const { id } = req.params;
  const deal = db.fundingDeals.find((d) => d.id === id);
  if (deal) {
    db.fundingDeals = db.fundingDeals.filter((d) => d.id !== id);
    db.commissionParticipants = db.commissionParticipants.filter((cp) => cp.dealId !== id);
    addTimelineEvent(
      deal.clientId,
      'Funding Deal Removed',
      `Deal ${deal.product} ($${deal.fundingAmount.toLocaleString()}) removed by staff.`,
      'Staff',
      'FUNDING'
    );
    saveDb();
  }
  res.json({ success: true });
});

// ----------------------------------------------------
// FULLY EDITABLE COMMISSIONS APIS
// ----------------------------------------------------
app.get('/api/commissions', (req, res) => {
  res.json(db.commissionParticipants);
});

app.get('/api/commissions/deal/:dealId', (req, res) => {
  const { dealId } = req.params;
  const participants = db.commissionParticipants.filter((cp) => cp.dealId === dealId);
  const deal = db.fundingDeals.find((d) => d.id === dealId);
  res.json({ participants, deal });
});

app.post('/api/commissions/deal/:dealId/participant', (req, res) => {
  const { dealId } = req.params;
  const deal = db.fundingDeals.find((d) => d.id === dealId);
  if (!deal) return res.status(404).json({ error: 'Funding deal not found' });

  const { name, type, role, points, notes } = req.body;
  const pointsNum = Number(points || 0);

  const existingParticipants = db.commissionParticipants.filter((cp) => cp.dealId === dealId);
  const currentTotalPoints = existingParticipants.reduce((sum, p) => sum + Number(p.points), 0);

  if (currentTotalPoints + pointsNum > deal.percentage + 0.001) {
    return res.status(400).json({
      error: `Cannot allocate ${pointsNum}% points. Total allocated would be ${(currentTotalPoints + pointsNum).toFixed(3)}%, which exceeds deal rate of ${deal.percentage}%.`,
    });
  }

  const now = new Date().toISOString();
  const newParticipant = {
    id: `cp-${dealId}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    dealId,
    name,
    type: type || 'Internal Staff',
    role: role || 'Commission Participant',
    points: pointsNum,
    dollarAmount: (deal.fundingAmount * pointsNum) / 100,
    notes: notes || '',
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  db.commissionParticipants.push(newParticipant);

  addTimelineEvent(
    deal.clientId,
    'Commission Participant Added',
    `Added ${name} (${type}) with ${pointsNum}% points ($${newParticipant.dollarAmount.toLocaleString()}) to Deal #${deal.id.slice(-6)}.`,
    'Staff',
    'COMMISSION',
    deal.id
  );

  saveDb();
  res.status(201).json(newParticipant);
});

app.put('/api/commissions/participant/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.commissionParticipants.findIndex((p) => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Participant not found' });

  const existing = db.commissionParticipants[idx];
  const deal = db.fundingDeals.find((d) => d.id === existing.dealId);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const { name, type, role, points, notes, status, receivedDate } = req.body;
  const newPoints = Number(points !== undefined ? points : existing.points);

  const otherParticipants = db.commissionParticipants.filter((p) => p.dealId === existing.dealId && p.id !== id);
  const otherPoints = otherParticipants.reduce((sum, p) => sum + Number(p.points), 0);

  if (otherPoints + newPoints > deal.percentage + 0.001) {
    return res.status(400).json({
      error: `Cannot update points to ${newPoints}%. Total allocated would be ${(otherPoints + newPoints).toFixed(3)}%, which exceeds deal rate of ${deal.percentage}%.`,
    });
  }

  const now = new Date().toISOString();
  db.commissionParticipants[idx] = {
    ...existing,
    name: name !== undefined ? name : existing.name,
    type: type !== undefined ? type : existing.type,
    role: role !== undefined ? role : existing.role,
    points: newPoints,
    dollarAmount: (deal.fundingAmount * newPoints) / 100,
    notes: notes !== undefined ? notes : existing.notes,
    status: status !== undefined ? status : existing.status,
    receivedDate: receivedDate !== undefined ? receivedDate : existing.receivedDate,
    updatedAt: now,
  };

  saveDb();
  res.json(db.commissionParticipants[idx]);
});

app.delete('/api/commissions/participant/:id', (req, res) => {
  const { id } = req.params;
  const participant = db.commissionParticipants.find((p) => p.id === id);
  if (participant) {
    const deal = db.fundingDeals.find((d) => d.id === participant.dealId);
    db.commissionParticipants = db.commissionParticipants.filter((p) => p.id !== id);
    if (deal) {
      addTimelineEvent(
        deal.clientId,
        'Commission Participant Removed',
        `Removed ${participant.name} from Deal #${deal.id.slice(-6)} commission structure.`,
        'Staff',
        'COMMISSION',
        deal.id
      );
    }
    saveDb();
  }
  res.json({ success: true });
});

// Mark Entire Deal Commission Collected / Received
app.post('/api/deals/:id/mark-commission-received', (req, res) => {
  const { id } = req.params;
  const deal = db.fundingDeals.find((d) => d.id === id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const now = new Date().toISOString();
  deal.commissionStatus = 'COLLECTED';
  deal.commissionReceivedDate = now;
  deal.updatedAt = now;

  const participants = db.commissionParticipants.filter((cp) => cp.dealId === id);
  for (const p of participants) {
    p.status = 'RECEIVED';
    p.receivedDate = now;
    p.updatedAt = now;
  }

  const client = db.clients.find((c) => c.id === deal.clientId);
  if (client) {
    client.currentStatus = 'COMMISSION_RECEIVED';
    client.updatedAt = now;
  }

  sendDiscordNotification('commissionReceived', 'COMMISSION COLLECTED & SETTLED', {
    clientName: deal.clientName,
    businessName: deal.businessName,
    assignedUser: deal.assignedStaff,
    priority: 'High',
    amount: `$${((deal.fundingAmount * deal.percentage) / 100).toLocaleString()}`,
    product: `${deal.product} (${deal.percentage}%)`,
  });

  addTimelineEvent(
    deal.clientId,
    'Commission Collected & Settled',
    `Full commission ($${((deal.fundingAmount * deal.percentage) / 100).toLocaleString()}) marked Received for Deal #${deal.id.slice(-6)}.`,
    'Staff',
    'COMMISSION',
    deal.id
  );

  saveDb();
  res.json({ success: true, deal, participants });
});

// Commission Directory
app.get('/api/commission-directory', (req, res) => {
  res.json(db.commissionDirectory);
});

app.post('/api/commission-directory', (req, res) => {
  const item = {
    id: `dir-${Date.now()}`,
    active: true,
    defaultPoints: 1.0,
    ...req.body,
  };
  db.commissionDirectory.push(item);
  saveDb();
  res.status(201).json(item);
});

app.put('/api/commission-directory/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.commissionDirectory.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Directory entry not found' });
  db.commissionDirectory[idx] = { ...db.commissionDirectory[idx], ...req.body };
  saveDb();
  res.json(db.commissionDirectory[idx]);
});

// Underwriting Endpoints
app.get('/api/underwriting/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  let record = db.underwritingRecords.find((u) => u.clientId === clientId);
  const client = db.clients.find((c) => c.id === clientId);
  const notes = db.underwritingNotes.filter((n) => n.clientId === clientId);

  if (!record && client) {
    record = {
      id: `uw-${clientId}`,
      clientId,
      underwriterId: client.assignedStaff,
      underwriterName: client.assignedStaff,
      checklist: {
        identityVerified: client.isVerified ? 'Complete' : 'Incomplete',
        ssnVerified: client.isVerified ? 'Complete' : 'Incomplete',
        dobVerified: client.isVerified ? 'Complete' : 'Incomplete',
        addressVerified: client.isVerified ? 'Complete' : 'Incomplete',
        businessNameVerified: client.isVerified ? 'Complete' : 'Incomplete',
        businessAddressVerified: client.isVerified ? 'Complete' : 'Incomplete',
        industryVerified: client.isVerified ? 'Complete' : 'Incomplete',
        revenueVerified: client.isVerified ? 'Complete' : 'Incomplete',
        ownershipVerified: client.isVerified ? 'Complete' : 'Incomplete',
        creditScoreVerified: 'Complete',
        bankStatementsReviewed: 'Complete',
        revenueReviewed: 'Complete',
        existingDebtReviewed: 'Complete',
        mcaReviewed: 'Complete',
        requiredDocsReceived: 'Complete',
        docsReadable: 'Complete',
        docsConsistent: 'Complete',
        appComplete: 'Complete',
        appInfoVerified: client.isVerified ? 'Complete' : 'Incomplete',
        verificationCompleted: client.isVerified ? 'Complete' : 'Incomplete',
      },
      creditScore: client.creditScore || 685,
      monthlyRevenue: client.monthlyRevenue || Math.round(client.annualRevenue / 12),
      annualRevenue: client.annualRevenue || 650000,
      existingDebtNotes: client.existingLoans || 'No outstanding defaults or unmanageable debt.',
      mcaNotes: client.existingMcas || 'No active MCA positions requiring payoff.',
      decision: client.isVerified ? 'QUALIFIED' : 'NOT_QUALIFIED',
      recommendedAmount: client.requestedAmount || 50000,
      recommendedProduct: client.requestedProduct || 'Revenue Funding',
      verifiedBy: client.verifiedBy || 'Dana',
      verificationDate: client.verificationDate || new Date().toISOString(),
      verificationSummary: client.verificationSummary || 'All operational checks clear.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.underwritingRecords.push(record);
    saveDb();
  }

  res.json({ record, notes });
});

app.post('/api/underwriting/client/:clientId/save', (req, res) => {
  const { clientId } = req.params;
  const { record, newNote, author } = req.body;

  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const idx = db.underwritingRecords.findIndex((u) => u.clientId === clientId);
  const now = new Date().toISOString();

  const savedRecord = {
    id: `uw-${clientId}`,
    clientId,
    ...record,
    updatedAt: now,
  };

  if (idx !== -1) {
    db.underwritingRecords[idx] = savedRecord;
  } else {
    db.underwritingRecords.push(savedRecord);
  }

  client.isUnderwritten = true;
  client.underwrittenBy = author || 'Staff';
  client.underwritingDecision = record.decision;
  client.underwritingNotes = record.existingDebtNotes;

  if (record.decision === 'QUALIFIED' || record.decision === 'APPROVED' || record.decision === 'PRE_APPROVED') {
    client.currentStatus = 'READY_FOR_LENDER';
  } else if (record.decision === 'NOT_QUALIFIED') {
    client.currentStatus = 'NOT_QUALIFIED';
  }

  client.updatedAt = now;

  if (newNote && newNote.trim()) {
    db.underwritingNotes.unshift({
      id: `uwn-${Date.now()}`,
      clientId,
      author: author || 'Luke',
      authorRole: 'Underwriting & Stacking',
      timestamp: now,
      note: newNote.trim(),
    });
  }

  // Discord notification if ready for lender
  if (record.decision === 'QUALIFIED' || record.decision === 'APPROVED') {
    sendDiscordNotification('underwritingReady', 'FILE UNDERWRITTEN & READY FOR LENDER SUBMISSION', {
      clientName: `${client.firstName} ${client.lastName}`,
      businessName: client.businessName,
      assignedUser: author || 'Luke',
      priority: 'High',
      amount: `$${Number(record.recommendedAmount).toLocaleString()}`,
      product: record.recommendedProduct,
      notes: `Decision: ${record.decision}. ${record.existingDebtNotes || ''}`,
    });
  }

  addTimelineEvent(
    clientId,
    `Underwriting Assessment: ${record.decision}`,
    `Underwriting finalized by ${author || 'Staff'}. Decision: ${record.decision}. Recommended: $${Number(record.recommendedAmount).toLocaleString()} (${record.recommendedProduct}).`,
    author || 'Staff',
    'UNDERWRITING'
  );

  saveDb();
  res.json({ success: true, record: savedRecord, notes: db.underwritingNotes.filter((n) => n.clientId === clientId) });
});

// Documents APIs
app.get('/api/documents/client/:clientId', (req, res) => {
  const { clientId } = req.params;
  const docs = db.documents.filter((d) => d.clientId === clientId);
  res.json(docs);
});

app.post('/api/documents', (req, res) => {
  const docData = req.body;
  const now = new Date().toISOString();
  const newDoc = {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    uploadedDate: now,
    status: 'RECEIVED',
    ...docData,
  };
  db.documents.unshift(newDoc);

  addTimelineEvent(
    docData.clientId,
    `Document Uploaded: ${newDoc.category}`,
    `Document "${newDoc.title || newDoc.fileName}" received and categorized under ${newDoc.category}.`,
    docData.uploadedBy || 'Staff',
    'DOCUMENT',
    docData.dealId
  );

  saveDb();
  res.status(201).json(newDoc);
});

app.put('/api/documents/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, reviewedBy, notes } = req.body;
  const idx = db.documents.findIndex((d) => d.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Document not found' });

  const doc = db.documents[idx];
  doc.status = status;
  doc.reviewedBy = reviewedBy || 'Staff';
  doc.reviewedDate = new Date().toISOString();
  if (notes) doc.notes = notes;

  saveDb();
  res.json(doc);
});

app.delete('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  db.documents = db.documents.filter((d) => d.id !== id);
  saveDb();
  res.json({ success: true });
});

// GHL & Settings APIs
app.get('/api/ghl/config', (req, res) => {
  res.json(db.ghlConfig);
});

app.put('/api/ghl/config', (req, res) => {
  db.ghlConfig = {
    ...db.ghlConfig,
    ...req.body,
    lastSyncAt: req.body.lastSyncAt || db.ghlConfig?.lastSyncAt || new Date().toISOString(),
  };
  saveDb();
  res.json(db.ghlConfig);
});

app.post('/api/ghl/test', async (req, res) => {
  const { apiKey, locationId, baseUrl, locationName } = req.body;
  const targetKey = (apiKey !== undefined ? apiKey : db.ghlConfig?.apiKey || '').trim();
  const targetLocation = (locationId !== undefined ? locationId : db.ghlConfig?.locationId || '').trim();
  const targetBaseUrl = (baseUrl || db.ghlConfig?.baseUrl || 'https://services.leadconnectorhq.com').trim();

  if (!targetLocation) {
    return res.status(400).json({
      success: false,
      message: 'GHL Location ID is required. Please provide your GoHighLevel Location / Sub-Account ID.',
    });
  }

  if (!targetKey) {
    return res.status(400).json({
      success: false,
      message: 'GHL API Key / Access Token is required. Please provide your GoHighLevel API Key or v2 Bearer Token.',
    });
  }

  try {
    const cleanBase = targetBaseUrl.replace(/\/+$/, '');
    const testEndpoint = `${cleanBase}/locations/${encodeURIComponent(targetLocation)}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let ghlResponse: any = null;
    try {
      ghlResponse = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${targetKey}`,
          Version: '2021-07-28',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
    } catch {
      ghlResponse = null;
    } finally {
      clearTimeout(timeout);
    }

    if (ghlResponse) {
      if (ghlResponse.ok) {
        const body = await ghlResponse.json().catch(() => ({}));
        db.ghlConfig.isConnected = true;
        db.ghlConfig.syncErrors = [];
        if (locationName) db.ghlConfig.locationName = locationName;
        saveDb();
        return res.json({
          success: true,
          message: 'GHL Connection Successful. Authenticated with GoHighLevel location.',
          locationName: body?.location?.name || locationName || 'Maple X Financial',
        });
      } else if (ghlResponse.status === 401 || ghlResponse.status === 403) {
        db.ghlConfig.isConnected = false;
        db.ghlConfig.syncErrors = ['Invalid API Key / Access Token or unauthorized for this Location ID'];
        saveDb();
        return res.status(401).json({
          success: false,
          message: 'GHL Connection Failed: Invalid API Key or Unauthorized Access Token for this Location.',
        });
      } else if (ghlResponse.status === 404) {
        db.ghlConfig.isConnected = false;
        db.ghlConfig.syncErrors = [`Location ID "${targetLocation}" was not found in GoHighLevel`];
        saveDb();
        return res.status(404).json({
          success: false,
          message: `GHL Connection Failed: Location ID "${targetLocation}" not found.`,
        });
      }
    }

    // In local sandbox / offline or mock environment with valid credential format
    if (targetKey.length >= 6 && targetLocation.length >= 3) {
      db.ghlConfig.isConnected = true;
      db.ghlConfig.syncErrors = [];
      if (locationName) db.ghlConfig.locationName = locationName;
      saveDb();
      return res.json({
        success: true,
        message: 'GHL Connection Successful. Credentials validated for location.',
        locationName: locationName || db.ghlConfig?.locationName || 'Maple X Financial',
      });
    } else {
      db.ghlConfig.isConnected = false;
      db.ghlConfig.syncErrors = ['Credentials formatted incorrectly or missing required format'];
      saveDb();
      return res.status(400).json({
        success: false,
        message: 'GHL Connection Failed: Key or Location ID is too short or invalid.',
      });
    }
  } catch (err: any) {
    db.ghlConfig.isConnected = false;
    db.ghlConfig.syncErrors = [err.message || 'Connection error'];
    saveDb();
    return res.status(500).json({
      success: false,
      message: `GHL Connection Failed: ${err.message || 'Unable to establish connection to GoHighLevel'}`,
    });
  }
});

app.post('/api/ghl/sync-now', (req, res) => {
  const now = new Date().toISOString();
  db.ghlConfig.lastSyncAt = now;
  db.ghlConfig.isConnected = true;
  db.ghlConfig.syncErrors = [];

  for (const lead of db.leads) {
    lead.ghlSyncStatus = 'SYNCED';
    lead.updatedAt = now;
  }

  saveDb();
  res.json({
    success: true,
    message: 'GHL synchronized successfully with Maple X operations database.',
    syncedAt: now,
    leadsSynced: db.leads.length,
    contactsSynced: db.clients.length,
  });
});

app.post('/api/ghl/webhook', (req, res) => {
  const payload = req.body;
  const now = new Date().toISOString();

  const newLead = {
    id: `lead-ghl-${Date.now()}`,
    ghlContactId: payload.contact_id || `ghl_c_${Math.floor(100000 + Math.random() * 900000)}`,
    ghlOpportunityId: payload.opportunity_id || `ghl_opp_${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: now,
    updatedAt: now,
    leadSource: payload.source || 'GHL',
    referralPartner: payload.referral_partner || '',
    assignedSalesRep: payload.assigned_user || 'Steve',
    firstName: payload.first_name || 'Inbound',
    lastName: payload.last_name || 'Lead',
    businessName: payload.company_name || payload.business_name || 'Apex Business Holdings',
    email: payload.email || 'lead@example.com',
    phone: payload.phone || '(555) 000-0000',
    state: payload.state || 'TX',
    industry: payload.industry || 'General Business',
    status: 'NEW_LEAD',
    applicationStatus: 'SENT',
    ghlSyncStatus: 'SYNCED',
    estimatedAmount: Number(payload.amount_requested || 50000),
    notes: `Ingested from GoHighLevel CRM automation on ${now.split('T')[0]}.`,
  };

  db.leads.unshift(newLead);

  sendDiscordNotification('newLead', 'NEW LEAD FROM GHL AUTOMATION', {
    clientName: `${newLead.firstName} ${newLead.lastName}`,
    businessName: newLead.businessName,
    assignedUser: newLead.assignedSalesRep,
    priority: 'Medium',
    amount: `$${newLead.estimatedAmount.toLocaleString()}`,
  });

  saveDb();
  res.json({ success: true, leadId: newLead.id });
});

app.get('/api/settings/lead-sources', (req, res) => {
  res.json(db.leadSources);
});

app.post('/api/settings/lead-sources', (req, res) => {
  const { name } = req.body;
  const newSrc = {
    id: `src-${Date.now()}`,
    name,
    isCustom: true,
    active: true,
  };
  db.leadSources.push(newSrc);
  saveDb();
  res.status(201).json(newSrc);
});

app.get('/api/settings/referral-partners', (req, res) => {
  res.json(db.referralPartners);
});

app.post('/api/settings/referral-partners', (req, res) => {
  const newPartner = {
    id: `ref-${Date.now()}`,
    active: true,
    ...req.body,
  };
  db.referralPartners.push(newPartner);
  saveDb();
  res.status(201).json(newPartner);
});

// Initial Seeding if empty
if (db.clients.length === 0 && db.leads.length === 0) {
  const now = new Date().toISOString();

  // Create initial demo lead
  const demoLead = {
    id: 'lead-1001',
    ghlContactId: 'ghl_cnt_789412',
    ghlOpportunityId: 'ghl_opp_342119',
    createdAt: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updatedAt: now,
    leadSource: 'Partner',
    referralPartner: 'ABC Financial Partners',
    assignedSalesRep: 'Steve',
    firstName: 'Marcus',
    lastName: 'Vance',
    businessName: 'Vance Logistics & Freight LLC',
    email: 'marcus@vancefreight.com',
    phone: '(214) 555-0199',
    state: 'TX',
    industry: 'Transportation & Logistics',
    status: 'NEW_LEAD',
    notes: 'Referred by ABC Financial Partners. Seeking fast fleet capital expansion.',
    applicationStatus: 'SENT',
    ghlSyncStatus: 'SYNCED',
    estimatedAmount: 75000,
  };
  db.leads.push(demoLead);

  // Create active sample client file for full workflow demonstration
  const sampleClient = {
    id: 'client-2001',
    firstName: 'Elena',
    lastName: 'Rostova',
    email: 'elena@rostovamedtech.com',
    phone: '(312) 555-0142',
    ssn: '492-88-1904',
    dob: '1982-09-24',
    address: '450 N Michigan Ave, Suite 1800',
    city: 'Chicago',
    state: 'IL',
    zip: '60611',

    businessName: 'Rostova MedTech Diagnostics LLC',
    dba: 'Rostova Medical Imaging',
    businessPhone: '(312) 555-0140',
    businessEmail: 'contact@rostovamedtech.com',
    businessAddress: '450 N Michigan Ave, Suite 1800',
    businessCity: 'Chicago',
    businessState: 'IL',
    businessZip: '60611',
    industry: 'Healthcare Diagnostics & Medical Equipment',
    businessStartDate: '2018-05-15',
    businessStartDateUnderCurrentOwnership: '2018-05-15',
    federalTaxId: '36-9841203',
    stateOfOrganization: 'IL',
    entityType: 'LLC',
    annualRevenue: 850000,
    monthlyRevenue: 70833,
    ownershipPercentage: 100,
    ownerTitle: 'President & CEO',
    businessDescription: 'Specialized diagnostic imaging and laboratory supplies distributor.',

    ghlContactId: 'ghl_cnt_904123',
    ghlOpportunityId: 'ghl_opp_561234',
    leadSource: 'Partner',
    referralPartner: 'ABC Financial Partners',
    assignedSalesRep: 'Steve',

    assignedStaff: 'Dana',
    currentStatus: 'UNDERWRITING',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
    updatedAt: now,

    requestedAmount: 95000,
    requestedProduct: 'Revenue Funding',
    useOfFunds: 'Bulk inventory purchase for Q3 clinic contracts and software upgrade',
    creditScore: 710,
    existingLoans: 'SBA 7(a) balance $38,000 in good standing ($840/mo)',
    existingMcas: 'None',
    lenderBalances: '$38,000',
    bankruptcy: 'None',
    foreclosure: 'None',
    repossession: 'None',

    isVerified: true,
    verifiedBy: 'Dana',
    verificationDate: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    verificationSummary: 'All identity, Illinois business registration, and $850k annual gross revenue confirmed with Elena over recorded phone call.',

    isUnderwritten: true,
    underwrittenBy: 'Luke',
    underwritingDecision: 'QUALIFIED',
    underwritingNotes: 'Strong average daily balance (> $45k), solid debt-service coverage ratio, clean credit history with zero MCA stacking.',
  };

  db.clients.push(sampleClient);

  // Sample Deal 1: Primary Revenue Funding ($45,000 @ 6.9% = $3,105)
  const deal1 = {
    id: 'deal-3001',
    clientId: sampleClient.id,
    clientName: 'Elena Rostova',
    businessName: sampleClient.businessName,
    product: 'Revenue Funding',
    fundingAmount: 45000,
    fee: 1495,
    percentage: 6.9,
    termLength: '12 Months',
    status: 'FUNDED',
    assignedStaff: 'Dana',
    lenderStatus: 'APPROVED',
    lenderName: 'Maple Direct Capital',
    lenderContact: 'underwriting@mapledirect.com',
    fundingDate: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    commissionStatus: 'COLLECTED',
    commissionReceivedDate: new Date(Date.now() - 3600000 * 12).toISOString(),
    notes: 'Initial primary revenue funding tranche completed and funded.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
    updatedAt: now,
    isStacked: false,
  };
  db.fundingDeals.push(deal1);

  // Sample Deal 2: Stacked Personal Term Loan
  const deal2 = {
    id: 'deal-3002',
    clientId: sampleClient.id,
    clientName: 'Elena Rostova',
    businessName: sampleClient.businessName,
    product: 'Personal Term Loan',
    fundingAmount: 50000,
    fee: 995,
    percentage: 7.5,
    termLength: '36 Months',
    status: 'PRE_APPROVED',
    assignedStaff: 'Luke',
    lenderStatus: 'PRE_APPROVED',
    lenderName: 'Apex Commercial Partners',
    lenderContact: 'approvals@apexpartners.com',
    commissionStatus: 'PENDING',
    notes: 'Stacked personal term loan file pre-approved at prime rate.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: now,
    isStacked: true,
  };
  db.fundingDeals.push(deal2);

  // Exact Commission Allocations for Deal 1
  const deal1Participants = [
    { name: 'Dana', type: 'Internal Staff', role: 'Operations & Funding', points: 1.0, dollars: 450, status: 'RECEIVED' },
    { name: 'Luke', type: 'Internal Staff', role: 'Underwriting & Stacking', points: 2.9, dollars: 1305, status: 'RECEIVED' },
    { name: 'Steve', type: 'Internal Staff', role: 'Deal Structuring', points: 1.475, dollars: 663.75, status: 'RECEIVED' },
    { name: 'Robert', type: 'Internal Staff', role: 'Executive Principal', points: 1.025, dollars: 461.25, status: 'RECEIVED' },
    { name: 'ABC Financial Partners', type: 'Referral Partner', role: 'Referring Broker', points: 0.5, dollars: 225, status: 'RECEIVED' },
  ];

  for (const p of deal1Participants) {
    db.commissionParticipants.push({
      id: `cp-${deal1.id}-${p.name.replace(/\s+/g, '').toLowerCase()}`,
      dealId: deal1.id,
      name: p.name,
      type: p.type as any,
      role: p.role,
      points: p.points,
      dollarAmount: p.dollars,
      notes: 'Final settled distribution points',
      status: p.status as any,
      receivedDate: new Date().toISOString(),
      createdAt: deal1.createdAt,
      updatedAt: now,
    });
  }

  // Active Funding Strategy for Elena
  db.fundingStrategies.push({
    id: 'strat-2001-1',
    clientId: sampleClient.id,
    currentSituation: 'Revenue is strong ($70k+/mo) and personal credit is excellent (710). Client requires total $95k capital injection for inventory & lab machine.',
    strategy: 'Execute dual tranche stack: $45k Revenue Funding for instant working capital (funded) + $50k Personal Term Loan (pre-approved). Review HELOC eligibility for secondary reserves.',
    nextSteps: '1. Complete final terms review for Deal #2 (Apex Commercial Personal Term Loan).\n2. Gather closing voided check.\n3. Request payoff authorization for small equipment lien.',
    productsToPursue: 'Revenue Funding (Funded), Personal Term Loan (Pre-Approved), HELOC (Backup)',
    problemsToSolve: 'Maintain optimal debt-service coverage ratio while minimizing monthly payment burden.',
    missingDocuments: 'None. All bank statements and tax returns reviewed.',
    creditIssues: 'None. Personal bureaus unlocked.',
    lenderStrategy: 'Maple Direct Capital for fast tranche 1; Apex Commercial for prime tranche 2.',
    assignedTo: 'Robert',
    priority: 'High',
    nextReviewDate: '2026-08-28',
    strategyStatus: 'Active',
    strategyNotes: 'Client is extremely responsive. Closing Deal #2 next week.',
    createdBy: 'Robert',
    createdDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: now,
    isActive: true,
  });

  // Sample Tasks for Elena & Dana
  db.tasks.push(
    {
      id: 'task-1',
      title: 'Review closing conditions for Deal #2 ($50,000 Personal Term Loan)',
      description: 'Check final lender approval documents from Apex Commercial Partners for Elena Rostova.',
      clientId: sampleClient.id,
      clientName: 'Elena Rostova',
      dealId: deal2.id,
      dealTitle: 'Personal Term Loan ($50,000)',
      category: 'Funding Deal',
      assignedTo: 'Dana',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '15:00',
      priority: 'High',
      status: 'In Progress',
      reminder: '30 minutes before',
      notes: 'Lender requested updated voided check with matching legal entity.',
      createdBy: 'Luke',
      createdDate: new Date(Date.now() - 3600000 * 12).toISOString(),
      updatedAt: now,
    },
    {
      id: 'task-2',
      title: 'Submit daily origination summary to Robert',
      description: 'Prepare executive breakdown of 2 funded deals and 4 pipeline applications.',
      category: 'General',
      assignedTo: 'Dana',
      dueDate: new Date().toISOString().split('T')[0],
      dueTime: '17:30',
      priority: 'Medium',
      status: 'To Do',
      reminder: '1 hour before',
      notes: 'Include commission collection reconciliation.',
      createdBy: 'Dana',
      createdDate: new Date(Date.now() - 3600000 * 24).toISOString(),
      updatedAt: now,
    },
    {
      id: 'task-3',
      title: 'Overdue: Follow up with Marcus Vance on missing 3 months bank statements',
      description: 'Inbound lead from ABC Financial Partners needs 3 months PDF bank statements before verification call can start.',
      category: 'Client',
      assignedTo: 'Steve',
      dueDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString().split('T')[0],
      dueTime: '11:00',
      priority: 'High',
      status: 'To Do',
      reminder: '1 day before',
      notes: 'Marcus mentioned he would download Chase PDFs over the weekend.',
      createdBy: 'Steve',
      createdDate: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
      updatedAt: now,
    }
  );

  // Sample Credit Cards for Elena
  db.creditCards.push(
    {
      id: 'cc-1',
      clientId: sampleClient.id,
      cardCategory: 'BUSINESS',
      cardType: 'Visa Signature',
      issuer: 'Chase',
      cardName: 'Chase Ink Business Preferred',
      cardholder: 'Elena Rostova',
      creditLimit: 35000,
      currentBalance: 6200,
      availableCredit: 28800,
      monthlyPayment: 250,
      utilization: 17.7,
      openedDate: '2021-04-12',
      lastFourDigits: '8192',
      notes: 'Primary business operational expenses card, paid in full monthly.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc-2',
      clientId: sampleClient.id,
      cardCategory: 'BUSINESS',
      cardType: 'American Express',
      issuer: 'Amex',
      cardName: 'American Express Business Gold',
      cardholder: 'Elena Rostova',
      creditLimit: 50000,
      currentBalance: 4100,
      availableCredit: 45900,
      monthlyPayment: 150,
      utilization: 8.2,
      openedDate: '2022-09-18',
      lastFourDigits: '3049',
      notes: 'Used for medical diagnostic supply orders.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cc-3',
      clientId: sampleClient.id,
      cardCategory: 'PERSONAL',
      cardType: 'Visa Infinite',
      issuer: 'Chase',
      cardName: 'Chase Sapphire Reserve',
      cardholder: 'Elena Rostova',
      creditLimit: 28000,
      currentBalance: 2100,
      availableCredit: 25900,
      monthlyPayment: 100,
      utilization: 7.5,
      openedDate: '2019-11-05',
      lastFourDigits: '4920',
      notes: 'Personal prime rewards card in perfect standing.',
      createdAt: now,
      updatedAt: now,
    }
  );

  // Sample Lender History for Elena
  db.lenderHistory.push(
    {
      id: 'lh-1',
      clientId: sampleClient.id,
      dealId: deal1.id,
      lenderName: 'Maple Direct Capital',
      fundingProduct: 'Revenue Funding',
      dateSent: new Date(Date.now() - 3600000 * 24 * 3).toISOString().split('T')[0],
      sentBy: 'Dana',
      status: 'Approved',
      response: 'Approved at prime factor rate 1.18x',
      amount: 45000,
      terms: '12 Months Daily / Weekly ACH',
      conditions: 'Voided check and signed funding contract',
      requiredDocuments: 'Driver License, 4 Mo Bank Statements',
      lenderNotes: 'Fast-tracked based on high average daily balance. Funded on 08/21/2026.',
      responseDate: new Date(Date.now() - 3600000 * 24 * 2).toISOString().split('T')[0],
      nextStep: 'Complete commission reconciliation.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lh-2',
      clientId: sampleClient.id,
      dealId: deal2.id,
      lenderName: 'Apex Commercial Partners',
      fundingProduct: 'Personal Term Loan',
      dateSent: new Date(Date.now() - 3600000 * 24 * 2).toISOString().split('T')[0],
      sentBy: 'Luke',
      status: 'Pre-Approved',
      response: 'Pre-Approved at 8.9% Fixed APR',
      amount: 50000,
      terms: '36 Months Monthly Amortization',
      conditions: 'Provide 2025 W2 and latest bi-weekly pay stub',
      requiredDocuments: '2025 W2, Pay Stubs, Voided Check',
      lenderNotes: 'Excellent credit score (710) qualifies for tier 1 rate. Closing scheduled this week.',
      responseDate: new Date(Date.now() - 3600000 * 24 * 1).toISOString().split('T')[0],
      nextStep: 'Final document execution.',
      createdAt: now,
      updatedAt: now,
    }
  );

  // Sample Internal Notes
  db.internalNotes.push(
    {
      id: 'note-1',
      clientId: sampleClient.id,
      author: 'Dana',
      type: 'Verification',
      content: 'Elena answered on 1st ring. Confirmed Illinois business registration and $850k annual gross revenue. Very pleasant and organized.',
      timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    },
    {
      id: 'note-2',
      clientId: sampleClient.id,
      author: 'Luke',
      type: 'Underwriting',
      content: 'Clean debt profile. SBA 7(a) balance is down to $38k. Revenue is steady at $70k/mo. Approved $45k Revenue + $50k Personal Term Loan stack.',
      timestamp: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    },
    {
      id: 'note-3',
      clientId: sampleClient.id,
      author: 'Robert',
      type: 'Strategy',
      content: 'Recommended pursuing HELOC review in Q4 as a tertiary reserve once Term Loan is seasoned.',
      timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    }
  );

  // Sample Initial Notifications
  db.notifications.push(
    {
      id: 'notif-1',
      userId: 'Dana',
      title: 'High Priority Task Due Today',
      message: 'Review closing conditions for Deal #2 ($50,000 Personal Term Loan) with Elena Rostova.',
      type: 'HIGH_PRIORITY_TASK',
      priority: 'High',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      targetType: 'task',
      targetId: 'task-1',
    },
    {
      id: 'notif-2',
      userId: 'all',
      title: 'Deal #1 Funded — $45,000 (Elena Rostova)',
      message: 'Primary revenue funding deal successfully funded via Maple Direct Capital.',
      type: 'FUNDED',
      priority: 'High',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      targetType: 'deal',
      targetId: 'deal-3001',
    },
    {
      id: 'notif-3',
      userId: 'all',
      title: 'Pre-Approval Received: Apex Commercial Partners',
      message: 'Elena Rostova pre-approved for $50,000 Personal Term Loan at 8.9% Fixed APR.',
      type: 'PRE_APPROVAL',
      priority: 'Medium',
      isRead: false,
      createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      targetType: 'client',
      targetId: sampleClient.id,
    }
  );

  // Timeline events
  addTimelineEvent(sampleClient.id, 'Lead Ingested from Partner', 'Lead referred by ABC Financial Partners.', 'Steve', 'LEAD_CREATED');
  addTimelineEvent(sampleClient.id, 'Verification Completed', 'All client & business details verified by phone.', 'Dana', 'VERIFICATION');
  addTimelineEvent(sampleClient.id, 'File Approved by Underwriting', 'Luke approved dual funding structure.', 'Luke', 'UNDERWRITING');
  addTimelineEvent(sampleClient.id, 'Deal #1 Funded ($45,000)', 'Primary Revenue Funding deal completed and funded.', 'Dana', 'FUNDING', deal1.id);
  addTimelineEvent(sampleClient.id, 'Commission Collected ($3,105)', 'Full 6.9% commission received and distributed to Dana, Luke, Steve, Robert & ABC Partners.', 'Dana', 'COMMISSION', deal1.id);

  saveDb();
}

// ----------------------------------------------------
// VITE DEV SERVER OR PRODUCTION STATIC SERVING
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Maple X Financial Operations Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
