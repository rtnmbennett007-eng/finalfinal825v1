export type InternalRole = 'INTERNAL_STAFF_ADMIN' | 'UNDERWRITER' | 'OPERATIONS' | 'STRATEGIST' | 'CUSTOM' | string;

export type FieldSourceType =
  | 'CALL_VERIFIED'
  | 'MANUAL'
  | 'VERIFICATION_FORM'
  | 'CLIENT_APPLICATION'
  | 'APPLICATION'
  | 'BANK_STATEMENT'
  | 'AI_FILLED'
  | 'IMPORTED'
  | 'SYSTEM_CALCULATED'
  | 'NOT_ENTERED'
  | 'UNKNOWN';

export type DocumentClassificationType =
  | 'APPLICATION_FORM'
  | 'VERIFICATION_FORM'
  | 'BANK_STATEMENT'
  | 'CREDIT_CARD_STATEMENT'
  | 'MERCHANT_STATEMENT'
  | 'PROFIT_LOSS'
  | 'BALANCE_SHEET'
  | 'TAX_RETURN'
  | 'DRIVERS_LICENSE'
  | 'VOIDED_CHECK'
  | 'ARTICLES_OF_INCORPORATION'
  | 'BUSINESS_LICENSE'
  | 'UNDERWRITING_DOCUMENT'
  | 'OTHER_FINANCIAL'
  | 'OTHER';

export interface FieldSourceMetadata {
  value: any;
  source: FieldSourceType;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  sourceType?: string;
  updatedAt?: string;
  updatedBy?: string;
  confidence?: number;
  verificationStatus?: 'UNVERIFIED' | 'VERIFIED' | 'CALL_VERIFIED' | 'CONFLICT' | 'REJECTED';
  verified?: boolean;
  conflictWith?: {
    value: any;
    source: FieldSourceType;
    documentName?: string;
  };
}

export interface DataHistoryEntry {
  field: string;
  previousValue: any;
  newValue: any;
  source: FieldSourceType;
  changedAt: string;
  changedBy: string;
  documentName?: string;
}

export type PermissionGroupType =
  | 'FULL ACCESS'
  | 'Full Administrative Authority'
  | 'Executive Leadership'
  | 'Operations & Verification'
  | 'Underwriting Committee'
  | 'Sales & Origination'
  | 'Setter / Intake'
  | 'Squire / Associate'
  | string;

export interface TeamMember {
  id: string;
  teamMemberId?: string;
  name: string;
  fullName?: string;
  title: string; // Portal Title (e.g. 'The King', 'Supreme Funding Commander', 'Hand of the King', 'Grand Sales Wizard')
  portalTitle?: string; // Alias for title
  role: string; // Company Role (e.g. 'CEO / Owner', 'Underwriter / Funding Operations', etc.)
  jobTitle?: string; // Alias for role
  department: string;
  responsibilities: string[];
  permissionGroup: PermissionGroupType;
  status: 'ACTIVE' | 'INACTIVE';
  email: string;
  phone: string;
  avatar?: string;
  discordUsername?: string;
  discordUserId?: string;
  bio?: string;
  joinedDate?: string;
  isCoreLeadership?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const CORE_LEADERSHIP_MEMBERS: TeamMember[] = [
  {
    id: 'staff-luke',
    teamMemberId: 'staff-luke',
    name: 'Luke',
    fullName: 'Luke Cowan',
    title: 'The King',
    portalTitle: 'The King',
    role: 'CEO / Owner',
    jobTitle: 'CEO / Owner',
    department: 'Executive Leadership',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    email: 'luke.cowan@maplexfinancial.com',
    phone: '(555) 345-6789',
    avatar: '',
    discordUsername: 'lukecowan',
    isCoreLeadership: true,
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
    notes: 'Core Leadership — Full unrestricted access across all portal modules.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
  },
  {
    id: 'staff-dana',
    teamMemberId: 'staff-dana',
    name: 'Dana',
    fullName: 'Dana Javier',
    title: 'Supreme Funding Commander',
    portalTitle: 'Supreme Funding Commander',
    role: 'Operations Director',
    jobTitle: 'Operations Director',
    department: 'Operations & Underwriting',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    email: 'dana.javier@maplexfinancial.com',
    phone: '(555) 234-5678',
    avatar: '',
    discordUsername: 'dana_javier',
    isCoreLeadership: true,
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
    notes: 'Core Leadership — Full unrestricted access across all portal modules.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
  },
  {
    id: 'staff-robert',
    teamMemberId: 'staff-robert',
    name: 'Robert',
    fullName: 'Robert Bennett',
    title: 'Hand of the King',
    portalTitle: 'Hand of the King',
    role: 'Operations / Automation / Technology / Growth',
    jobTitle: 'Operations / Automation / Technology / Growth',
    department: 'Operations & Technology',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    email: 'robert@maplexfinancial.com',
    phone: '(555) 567-8901',
    avatar: '',
    discordUsername: 'robert_maplex',
    isCoreLeadership: true,
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
    notes: 'Core Leadership — Full unrestricted access across all portal modules.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
  },
  {
    id: 'staff-steve',
    teamMemberId: 'staff-steve',
    name: 'Steve',
    fullName: 'Steve',
    title: 'Grand Sales Wizard',
    portalTitle: 'Grand Sales Wizard',
    role: 'Sales Director',
    jobTitle: 'Sales Director',
    department: 'Sales & Origination',
    permissionGroup: 'FULL ACCESS',
    status: 'ACTIVE',
    email: 'steve@maplexfinancial.com',
    phone: '(555) 456-7890',
    avatar: '',
    discordUsername: 'steve_maplex',
    isCoreLeadership: true,
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
    notes: 'Core Leadership — Full unrestricted access across all portal modules.',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-25T12:00:00.000Z',
  },
];

export interface StaffUser {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  password?: string;
  phone: string;
  title?: string; // Portal Title (e.g. 'The King', 'Supreme Funding Commander', 'Hand of the King', 'Grand Sales Wizard')
  portalTitle?: string;
  jobTitle: string; // Company Role
  department: string;
  role: InternalRole;
  responsibilities?: string[];
  permissionGroup?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  isCoreLeadership?: boolean;
  avatar?: string;
  active: boolean;
  notes?: string;
  roleId?: string;
  discordUsername?: string;
  discordUserId?: string;
  joinedDate?: string;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const CANONICAL_PIPELINE_STAGES = [
  'No Set – Follow Up',
  'Application Received',
  'Credit Pulled',
  'Documents Pending',
  'Documents Received',
  'Pre-Approved',
  'Verification Call',
  'KYC Verified & Ready for Underwriting',
  'Underwriting',
  'Ready for Lender / Stacking',
  'Submitted',
  'Approved',
  'Pre-Closing Checklist',
  'Closing Docs Signed',
  'Ready to Fund',
  'Funded',
  'Commission Pending',
  'Commission Received',
  'Not Qualified',
  'Declined',
  'Withdrawn',
  'Lost',
] as const;

export type CanonicalPipelineStage = typeof CANONICAL_PIPELINE_STAGES[number];

export function normalizePipelineStage(stage?: string | null): CanonicalPipelineStage {
  if (!stage) return 'No Set – Follow Up';
  const trimmed = stage.trim();

  // Exact canonical match
  if ((CANONICAL_PIPELINE_STAGES as readonly string[]).includes(trimmed)) {
    return trimmed as CanonicalPipelineStage;
  }

  const upper = trimmed.toUpperCase().replace(/[_\s-]+/g, ' ');

  if (upper.includes('NO SET') || upper.includes('NEW LEAD') || upper.includes('SALES CONTACT')) return 'No Set – Follow Up';
  if (upper.includes('APP RECEIVED') || upper.includes('APPLICATION RECEIVED') || upper.includes('APPLICATION SUBMITTED')) return 'Application Received';
  if (upper.includes('CREDIT PULLED') || upper.includes('CREDIT REPORT') || upper.includes('CREDIT CHECK')) return 'Credit Pulled';
  if (upper.includes('DOCS PENDING') || upper.includes('DOCUMENTS PENDING') || upper.includes('PENDING DOCS') || upper.includes('DOC REQUEST')) return 'Documents Pending';
  if (upper.includes('DOCS RECEIVED') || upper.includes('DOCUMENTS RECEIVED') || upper.includes('DOCS IN')) return 'Documents Received';
  if (upper.includes('PRE APPROVED') || upper.includes('PRE APPROVAL')) return 'Pre-Approved';
  if (upper.includes('VERIFICATION CALL') || upper.includes('CALL VERIFICATION') || upper.includes('VERIF CALL') || upper.includes('IN VERIFICATION')) return 'Verification Call';
  if (upper.includes('KYC') || upper.includes('READY FOR UNDERWRITING') || upper.includes('VERIFIED READY')) return 'KYC Verified & Ready for Underwriting';
  if (upper.includes('READY FOR LENDER') || upper.includes('STACKING') || upper.includes('LENDER STACK')) return 'Ready for Lender / Stacking';
  if (upper.includes('SUBMITTED TO LENDER') || upper.includes('SUBMITTED')) return 'Submitted';
  if (upper.includes('PRE CLOSING') || upper.includes('CLOSING CHECKLIST')) return 'Pre-Closing Checklist';
  if (upper.includes('CLOSING DOCS') || upper.includes('DOCS SIGNED') || upper.includes('CONTRACT SIGNED')) return 'Closing Docs Signed';
  if (upper.includes('READY TO FUND') || upper.includes('CLEAR TO CLOSE')) return 'Ready to Fund';
  if (upper.includes('COMMISSION PENDING') || upper.includes('UNCOLLECTED COMMISSION')) return 'Commission Pending';
  if (upper.includes('COMMISSION RECEIVED') || upper.includes('COMMISSION COLLECTED') || upper.includes('PAID COMMISSION')) return 'Commission Received';
  if (upper.includes('NOT QUALIFIED') || upper.includes('DQ') || upper.includes('DISQUALIFIED')) return 'Not Qualified';
  if (upper.includes('DECLINED') || upper.includes('REJECTED')) return 'Declined';
  if (upper.includes('WITHDRAWN') || upper.includes('CANCELLED')) return 'Withdrawn';
  if (upper.includes('LOST') || upper.includes('NOT INTERESTED') || upper.includes('NO SHOW')) return 'Lost';
  if (upper.includes('UNDERWRITING') || upper.includes('IN REVIEW')) return 'Underwriting';
  if (upper.includes('FUNDED')) return 'Funded';
  if (upper.includes('APPROVED')) return 'Approved';

  return 'No Set – Follow Up';
}

export type PipelineStage =
  | CanonicalPipelineStage
  | 'NEW_LEAD'
  | 'SALES_CONTACT'
  | 'APPLICATION_SENT'
  | 'APPLICATION_RECEIVED'
  | 'DOCUMENT_REQUEST'
  | 'DOCUMENTS_PENDING'
  | 'DOCUMENTS_RECEIVED'
  | 'VERIFICATION_PENDING'
  | 'VERIFICATION_IN_PROGRESS'
  | 'VERIFICATION_COMPLETE'
  | 'UNDERWRITING'
  | 'READY_FOR_LENDER'
  | 'SUBMITTED_TO_LENDER'
  | 'PRE_APPROVED'
  | 'APPROVED'
  | 'CONDITIONS_DOCUMENTS'
  | 'FUNDED'
  | 'COMMISSION_PENDING'
  | 'COMMISSION_RECEIVED'
  | 'NOT_QUALIFIED'
  | 'DECLINED'
  | 'LOST'
  | 'WITHDRAWN';

export const CANONICAL_DEAL_STATUSES = [
  'Draft',
  'Submitted',
  'Underwriting',
  'Approved',
  'Conditions',
  'Funded',
  'Paid Off',
  'Renewed',
  'Declined',
  'Lost',
  'Cancelled',
] as const;

export type CanonicalDealStatus = typeof CANONICAL_DEAL_STATUSES[number];

export function normalizeDealStatus(status?: string | null): CanonicalDealStatus {
  if (!status) return 'Draft';
  const trimmed = status.trim();

  // Exact canonical match
  if ((CANONICAL_DEAL_STATUSES as readonly string[]).includes(trimmed)) {
    return trimmed as CanonicalDealStatus;
  }

  const upper = trimmed.toUpperCase().replace(/[_\s-]+/g, ' ');

  if (upper.includes('DRAFT') || upper.includes('PROPOSED') || upper.includes('INITIAL')) return 'Draft';
  if (upper.includes('SUBMITTED') || upper.includes('SENT TO LENDER')) return 'Submitted';
  if (upper.includes('UNDERWRITING') || upper.includes('IN REVIEW') || upper.includes('PRE APPROVED') || upper.includes('PRE_APPROVED')) return 'Underwriting';
  if (upper.includes('APPROVED')) return 'Approved';
  if (upper.includes('CONDITIONS') || upper.includes('STIPS') || upper.includes('DOCS PENDING')) return 'Conditions';
  if (upper.includes('FUNDED') || upper.includes('CLOSED')) return 'Funded';
  if (upper.includes('PAID OFF') || upper.includes('PAID_OFF') || upper.includes('SETTLED')) return 'Paid Off';
  if (upper.includes('RENEWED') || upper.includes('RENEWAL')) return 'Renewed';
  if (upper.includes('DECLINED') || upper.includes('REJECTED') || upper.includes('NOT QUALIFIED')) return 'Declined';
  if (upper.includes('LOST') || upper.includes('WITHDRAWN')) return 'Lost';
  if (upper.includes('CANCELLED') || upper.includes('CANCELED')) return 'Cancelled';

  return 'Draft';
}

export interface DealActivityItem {
  id: string;
  dealId: string;
  timestamp: string;
  user: string;
  action: string;
  field?: string;
  previousValue?: any;
  newValue?: any;
  notes?: string;
}

export type ProductCategory =
  | 'Business / Commercial Funding'
  | 'Credit / Card Funding'
  | 'Personal Funding'
  | 'Real Estate & Property Funding'
  | 'Specialty & Alternative Financing'
  | 'Other / Custom';

export interface FundingProductDefinition {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  typicalTerm: string;
  defaultCommissionRate: number;
  defaultBaseFee: number;
  isActive: boolean;
  sortOrder: number;
  isCustom?: boolean;
  requiredFields?: string[];
}

export type FundingProductType =
  | 'Revenue Funding'
  | 'Business Line of Credit'
  | 'Business Term Loan'
  | 'SBA 7(a) Loan'
  | 'SBA 504 Loan'
  | 'SBA Express Loan'
  | 'Equipment Financing & Leasing'
  | 'Accounts Receivable / Invoice Factoring'
  | 'Merchant Cash Advance (MCA)'
  | 'Purchase Order (PO) Financing'
  | 'Inventory Financing'
  | 'Asset-Based Lending (ABL)'
  | 'Commercial Working Capital'
  | 'Franchise Financing'
  | 'Medical / Practice Financing'
  | 'Contract Financing'
  | '0% Business Credit Cards'
  | '0% Business Cards & Lines of Credit'
  | '0% Personal Credit Cards'
  | 'Corporate Credit Lines'
  | 'Secured Business Credit Card'
  | 'Business Credit Builder Facility'
  | 'Personal Term Loan'
  | 'Personal Line of Credit (PLOC)'
  | 'Debt Consolidation Loan'
  | 'Personal Installment Loan'
  | 'Peer-to-Peer (P2P) Personal Loan'
  | 'Signature / Unsecured Personal Loan'
  | 'HELOC'
  | 'Home Equity Line of Credit (HELOC)'
  | 'HEI'
  | 'Home Equity Investment (HEI)'
  | 'Fix and Flip Bridge Loan'
  | 'DSCR Rental Property Loan'
  | 'Commercial Real Estate (CRE) Mortgage'
  | 'Ground-Up Construction Loan'
  | 'Cash-Out Commercial Refinance'
  | 'Hard Money Real Estate Loan'
  | 'Microloans (Community Development / SBA)'
  | 'Startup Capital / Seed Program'
  | 'Mezzanine Financing'
  | 'Venture Debt'
  | 'Government / Grant Matching Facility'
  | 'Other / Custom Product'
  | 'Other Valid Product'
  | string;

export type VerificationStatusType =
  | 'Matches Application'
  | 'Client Corrected It'
  | 'Verified'
  | 'Unverified'
  | 'Needs Correction'
  | 'PENDING';

export interface Lead {
  id: string;
  ghlContactId?: string;
  ghlOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
  leadSource: string;
  referralPartner?: string;
  assignedSalesRep: string;
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
  state: string;
  industry: string;
  status: PipelineStage;
  notes?: string;
  lastContact?: string;
  nextFollowUp?: string;
  applicationStatus: 'NOT_STARTED' | 'SENT' | 'IN_PROGRESS' | 'SUBMITTED' | 'REVIEWED';
  ghlSyncStatus: 'SYNCED' | 'PENDING' | 'FAILED' | 'NOT_CONNECTED';
  estimatedAmount?: number;
  requestedAmountMin?: number;
  requestedAmountMax?: number;
  requestedFundingMin?: number;
  requestedFundingMax?: number;
  requestedFundingRange?: string;
  originalRequestedFundingText?: string;
}

export interface Client {
  id: string;
  // Identity & Personal
  firstName: string;
  middleName?: string;
  lastName: string;
  fullLegalName?: string;
  preferredName?: string;
  email: string;
  altEmail?: string;
  phone: string;
  altPhone?: string;
  ssn: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  mailingAddress?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZip?: string;
  driversLicenseNumber?: string;
  driversLicenseState?: string;
  driversLicenseExp?: string;
  maritalStatus?: string;
  citizenship?: string;

  // Business & Entity
  businessName: string;
  dba?: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  industry: string;
  businessStartDate: string;
  businessStartDateUnderCurrentOwnership?: string;
  timeInBusiness?: string;
  federalTaxId: string;
  stateOfOrganization: string;
  entityType?: string;
  annualRevenue: number;
  monthlyRevenue?: number;
  businessFlowMonthly?: number;
  businessFlowAnnual?: number;
  ownershipPercentage: number;
  ownerTitle?: string;
  employeesCount?: number;
  numberOfEmployees?: number;
  website?: string;
  businessDescription: string;
  businessBank?: string;
  businessCheckingAccount?: string;
  businessRoutingNumber?: string;
  personalBank?: string;
  businessLicenseNumber?: string;

  // CRM & Lead Sourcing
  ghlContactId?: string;
  ghlOpportunityId?: string;
  ghlPipelineId?: string;
  ghlStageId?: string;
  ghlLocationId?: string;
  ghlLastSync?: string;
  leadSource: string;
  referralPartner?: string;
  referralPartnerName?: string;
  referralPartnerCompany?: string;
  referralPartnerEmail?: string;
  referralPartnerPhone?: string;
  assignedSalesRep: string;
  accountManager?: string;
  tags?: string[];
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';

  // Operations & Staff Assignment
  assignedStaff: string;
  currentStatus: PipelineStage;
  createdAt: string;
  updatedAt: string;
  lastActivityDate?: string;
  nextTaskSummary?: string;
  nextFollowUpDate?: string;
  nextFollowUpTime?: string;
  importantAlerts?: string;
  internalNotesText?: string;
  discordAlertsEnabled?: boolean;
  discordWebhookOverride?: string;

  // Financial request & Underwriting Profile details
  requestedAmount: number;
  requestedAmountMin?: number;
  requestedAmountMax?: number;
  requestedFundingMin?: number;
  requestedFundingMax?: number;
  requestedFundingRange?: string;
  originalRequestedFundingText?: string;
  requestedProduct: FundingProductType;
  otherProductType?: string;
  otherProductDescription?: string;
  fundingUrgency?: string;
  applicationDate?: string;
  applicationStatus?: string;
  applicationNotes?: string;
  personalAnnualIncome?: number;
  personalMonthlyIncome?: number;
  useOfFunds?: string;
  creditScore: number;
  ficoScore?: number;
  bankruptcy?: 'None' | 'Chapter 7' | 'Chapter 13' | 'Dismissed';
  bankruptcyYear?: string;
  bankruptcyDetails?: string;
  foreclosure?: 'None' | 'Yes' | 'Within 3 Years';
  foreclosureDetails?: string;
  repossession?: 'None' | 'Yes' | 'Within 3 Years';
  housingStatus?: 'Homeowner' | 'Renter' | 'Other';
  monthlyHousingPayment?: number;
  existingLoans?: string;
  existingMcas?: string;
  lenderBalances?: string;
  recentCreditInquiries?: string;
  creditCardsSummary?: string;

  // Verification summaries
  isVerified?: boolean;
  verifiedBy?: string;
  verificationDate?: string;
  verificationSummary?: string;
  verificationCallDate?: string;
  verificationCallTime?: string;
  borrowerSpokenWith?: string;
  verificationCallOutcome?: string;
  verificationCallNotes?: string;
  verificationNotes?: string;
  verifiedAt?: string;
  readyForUnderwritingAt?: string;
  readyForUnderwritingBy?: string;
  fieldVerifications?: Record<string, any>;
  avgDailyBalance?: number;
  existingDebt?: number;
  positionRequested?: string;
  routingNumber?: string;
  accountNumber?: string;

  // Underwriting summaries
  isUnderwritten?: boolean;
  underwrittenBy?: string;
  underwritingDecision?: 'QUALIFIED' | 'PRE_APPROVED' | 'APPROVED' | 'NOT_QUALIFIED' | 'NEEDS_DOCS' | 'ADDITIONAL_INFO_REQUESTED';
  underwritingNotes?: string;
  stateOfIncorporation?: string;
  documents?: DocumentItem[];
  recommendedAmount?: number;
  recommendedProduct?: FundingProductType;
  otherRecommendedProductType?: string;
  otherRecommendedProductDescription?: string;

  // Field-Level Source Tracking & Audit History
  fieldSources?: Record<string, FieldSourceMetadata>;
  dataHistory?: DataHistoryEntry[];
}

export interface RiskFlagItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAR';
  code: string;
  title: string;
  reason: string;
  source: string;
  category: 'REVENUE' | 'BANKING' | 'DEBT_STACKING' | 'CREDIT' | 'DOCUMENTS' | 'BUSINESS' | 'CONFLICT' | string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'MITIGATED' | 'WAIVED';
  mitigationNotes?: string;
  mitigatedBy?: string;
  mitigatedAt?: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  createdAt: string;
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ConflictSourceValue {
  source: FieldSourceType;
  sourceLabel: string;
  value: any;
  confidence?: number;
  quote?: string;
  docId?: string;
  updatedAt?: string;
}

export interface ConflictItem {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  section: string;
  sources: ConflictSourceValue[];
  resolvedValue?: any;
  resolvedSource?: FieldSourceType;
  resolvedBy?: string;
  resolutionNote?: string;
  resolutionNotes?: string;
  status: 'UNRESOLVED' | 'RESOLVED' | 'DISMISSED' | 'WAIVED';
  resolvedAt?: string;
}

export type UnderwritingChecklistSection =
  | 'CLIENT_INFO'
  | 'BUSINESS_INFO'
  | 'VERIFICATION'
  | 'DOCUMENTS'
  | 'BANKING'
  | 'FUNDING'
  | 'OBLIGATIONS'
  | 'UNDERWRITING'
  | 'DEAL_INFO'
  | 'CLOSING_REQUIREMENTS'
  | string;

export interface UnderwritingChecklistItem {
  id: string;
  section: UnderwritingChecklistSection;
  sectionLabel: string;
  label: string;
  description?: string;
  status: 'COMPLETE' | 'NEEDS_REVIEW' | 'MISSING' | 'CONFLICTING';
  notes?: string;
  lastCheckedAt?: string;
  completedBy?: string;
  fieldSource?: FieldSourceType;
  isAutoCalculated?: boolean;
}

export interface RecurringAchObligation {
  id: string;
  lender: string;
  amount: number;
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  monthlyEquivalent: number;
  detectedFrom?: string;
  notes?: string;
}

export interface LargeTransactionItem {
  id: string;
  date: string;
  amount: number;
  type: 'DEPOSIT' | 'WITHDRAWAL';
  description: string;
  isFlagged?: boolean;
  notes?: string;
}

export interface DepositClassificationItem {
  id: string;
  date?: string;
  description: string;
  amount: number;
  category: 'REVENUE' | 'TRANSFER' | 'LOAN_ADVANCE' | 'OWNER_CONTRIBUTION' | 'REFUND' | 'ONE_TIME_TRANSFER' | 'OTHER_NON_REVENUE';
  isRevenue: boolean;
  confidence: number;
  requiresReview: boolean;
  notes?: string;
}

export interface ObligationBreakdownItem {
  id: string;
  lenderName: string;
  obligationType: 'ACH_DEBIT' | 'MCA_PAYMENT' | 'TERM_LOAN' | 'EQUIPMENT_FINANCING' | 'CREDIT_CARD' | 'OTHER';
  paymentAmount: number;
  frequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  occurrencesCount: number;
  monthlyEquivalent: number;
  detectedFrom?: string;
  isVerified?: boolean;
  notes?: string;
}

export interface ManualFieldCorrectionAudit {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  originalAiValue: any;
  updatedValue: any;
  updatedBy: string;
  updatedAt: string;
  reason?: string;
}

export interface FinancialAnalysisHistoryItem {
  id: string;
  analyzedAt: string;
  analyzedBy: string;
  docId: string;
  docTitle: string;
  docCategory: string;
  statementPeriod?: string;
  summaryMetrics: {
    totalDeposits: number;
    revenueDeposits: number;
    nonRevenueDeposits: number;
    avgDailyBalance: number;
    nsfsCount: number;
    negativeDaysCount: number;
    monthlyObligations: number;
  };
  manualEditsCount: number;
  manualEdits?: ManualFieldCorrectionAudit[];
  status: 'DRAFT' | 'REVIEWED' | 'FINALIZED';
  notes?: string;
}

export interface BankStatementAnalysisSummary {
  statementPeriod: string;
  bankName: string;
  accountHolder: string;
  accountType?: 'Business Checking' | 'Operating Account' | 'Personal Checking' | 'Money Market' | 'Other' | string;
  accountLastFour?: string;
  beginningBalance: number;
  endingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  avgDailyBalance: number;
  lowestBalance?: number;
  highestBalance?: number;
  negativeBalanceDays: number;
  nsfsCount: number;
  overdraftsCount: number;
  nsfFeesTotal?: number;
  overdraftFeesTotal?: number;
  returnedItemsCount: number;

  // Revenue vs Non-Revenue Breakdown
  revenueDepositsTotal?: number;
  nonRevenueDepositsTotal?: number;
  uncertainDepositsCount?: number;
  depositClassifications?: DepositClassificationItem[];

  // Detailed Obligations
  recurringAchObligations: RecurringAchObligation[];
  detailedObligations?: ObligationBreakdownItem[];
  financingDebitsTotalMonthly: number;

  // Velocity and Transaction Categories
  largeDeposits: LargeTransactionItem[];
  largeWithdrawals: LargeTransactionItem[];
  taxPaymentsTotal: number;
  payrollTotal?: number;
  rentMortgageTotal?: number;
  wireTransfersTotal?: number;
  p2pTransfersTotal?: number; // Zelle/Venmo/PayPal
  merchantProcessingDepositsTotal?: number;
  internalTransfersTotal?: number;

  // Formatted Underwriting Summary
  underwritingOverviewSummary?: {
    accountOverview: string;
    cashFlowSummary: string;
    riskIndicators: string;
    existingObligations: string;
    overallRecommendation?: string;
  };

  // Confidence & Correction Auditing
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW'; // >=90% = HIGH, 70-89% = MEDIUM, <70% = LOW
  confidenceScore?: number;
  manualCorrections?: ManualFieldCorrectionAudit[];
  analysisHistory?: FinancialAnalysisHistoryItem[];

  cashFlowConsistency: 'Consistent' | 'Fluctuating' | 'Seasonal' | 'Declining' | 'Rapidly Growing' | string;
  depositVelocity: 'High' | 'Moderate' | 'Low' | string;
  monthlyBreakdowns: BankMonthBreakdown[];
  sourceDocIds?: string[];
  lastAnalyzedAt?: string;
  lastAnalyzedBy?: string;
}

export type SubmissionStatusType =
  | 'NOT_PREPARED'
  | 'PREPARED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'CONDITIONS'
  | 'DECLINED'
  | 'CANCELLED'
  | 'WITHDRAWN'
  | 'FUNDED'
  | string;

export interface SubmissionPackageRecord {
  id: string;
  packageNumber: string; // e.g. "PKG-DEAL-000101-1"
  dealId: string;
  clientId: string;
  clientName: string;
  businessName: string;
  product: FundingProductType;
  requestedAmount: number;
  requestedAmountMin?: number;
  requestedAmountMax?: number;
  requestedFundingMin?: number;
  requestedFundingMax?: number;
  requestedFundingRange?: string;
  originalRequestedFundingText?: string;
  lenderName: string;
  lenderContact?: string;
  lenderContactEmail?: string;
  lenderProduct?: string;
  targetAmount?: number;
  targetTerm?: string;
  targetFactorRate?: string;
  submissionType?: 'EMAIL' | 'PORTAL' | 'API' | 'MANUAL' | string;
  preparedDate: string;
  preparedBy: string;
  submittedDate?: string;
  submittedBy?: string;
  submittedAt?: string;
  status: SubmissionStatusType;
  includedDocumentIds?: string[];
  includedDocIds?: string[];
  driveFolderId?: string;
  driveFolderName?: string;
  driveFolderUrl?: string;
  drivePackageUrl?: string;
  coverSheetPdfUrl?: string;
  summaryNotesPdfUrl?: string;
  packageZipUrl?: string;
  underwriterNotes?: string;
  submissionNotes?: string;
  conditionsNotes?: string;
  createdAt: string;
  updatedAt: string;
  statusTimeline?: Array<{
    status: string;
    timestamp: string;
    updatedBy: string;
    notes?: string;
  }>;
}

export interface FundingReadinessChecklistItem {
  key: string;
  label: string;
  description: string;
  isPassing: boolean;
  isBlocking: boolean;
  category: string;
}

export interface FundingReadinessSummary {
  isReady: boolean;
  isReadyToFund?: boolean;
  readinessScore: number; // 0 - 100
  checklist: FundingReadinessChecklistItem[];
  checklistState?: FundingReadinessChecklist;
  blockingIssuesCount: number;
  warningsCount: number;
  commissionConfigured: boolean;
  dealId?: string;
  readinessStatus?: 'NOT_READY' | 'READY_TO_FUND' | 'OVERRIDDEN' | 'FUNDED';
  calculatedAt?: string;
  checkedBy?: string;
  blockers?: string[];
  overrides?: ReadinessOverrideItem[];
  markedReadyAt?: string;
  markedReadyBy?: string;
  notes?: string;
}

export interface CommissionItem {
  id?: string;
  dealId?: string;
  clientId?: string;
  percentage?: number;
  amount?: number;
  fee?: number;
  status?: string;
}

export interface FundingReadinessChecklist {
  lenderApprovalRecorded: boolean;
  fundingAmountConfirmed: boolean;
  termsAndFactorConfirmed: boolean;
  allClosingDocsVerified: boolean;
  clientAcceptanceConfirmed: boolean;
  positionAndPayoffsVerified: boolean;
  commissionManuallyEntered: boolean; // NEVER PREFILLED
  dealStatusValid: boolean;
}

export interface ReadinessOverrideItem {
  checkKey: keyof FundingReadinessChecklist | string;
  reason: string;
  overriddenBy: string;
  timestamp: string;
}

export interface FundingReadinessRecord {
  dealId: string;
  isReadyToFund: boolean;
  readinessStatus: 'NOT_READY' | 'READY_TO_FUND' | 'OVERRIDDEN' | 'FUNDED';
  calculatedAt: string;
  checkedBy: string;
  checklist: FundingReadinessChecklist;
  blockers: string[];
  overrides?: ReadinessOverrideItem[];
  markedReadyAt?: string;
  markedReadyBy?: string;
  notes?: string;
}

export interface FundingDeal {
  id: string;
  dealId?: string; // Canonical display ID (e.g. DEAL-000101)
  clientId: string;
  clientName: string;
  businessName: string;
  applicationId?: string;
  product: FundingProductType;
  otherProductType?: string;
  otherProductDescription?: string;
  
  // Independent amounts
  requestedAmount?: number;
  requestedAmountMin?: number;
  requestedAmountMax?: number;
  requestedFundingMin?: number;
  requestedFundingMax?: number;
  requestedFundingRange?: string;
  originalRequestedFundingText?: string;
  approvedAmount?: number;
  fundedAmount?: number;
  fundingAmount: number; // Backward compatibility / primary amount

  // Stage and lifecycle metadata
  lifecycleStatus?: string; // e.g. "UNDERWRITING", "KYC_VERIFIED", "LEAD"
  fundingStage?: string;    // e.g. "PRE_APPROVED", "APPROVED", "FUNDED"

  // Funder / Lender details
  lenderName: string;
  funder?: string;
  lenderStatus?: string;
  lenderContact?: string;
  submissionDate?: string;
  submittedDate?: string;
  approvalDate?: string;
  declineDate?: string;
  declineReason?: string;

  // Terms & Position
  factorRate?: number | string;
  rate?: number | string;
  term?: string;
  termLength: string; // e.g. "12 Months"
  paymentAmount?: number;
  paymentFrequency?: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Other' | string;
  position?: string; // e.g. "1st Position", "2nd Position", "3rd Position"
  isStacked?: boolean;

  // Status (Canonical Deal Status)
  status: CanonicalDealStatus | 'PROPOSED' | 'SUBMITTED' | 'PRE_APPROVED' | 'APPROVED' | 'CONDITIONS_MET' | 'FUNDED' | 'DECLINED' | 'WITHDRAWN' | 'UNDERWRITING' | string;

  // Underwriting & Submission Hub State
  underwritingStatus?: 'PENDING_REVIEW' | 'IN_REVIEW' | 'READY_FOR_SUBMISSION' | 'SUBMITTED' | 'APPROVED' | 'CONDITIONS' | 'DECLINED' | string;
  submissionStatus?: SubmissionStatusType;
  submissionPackageId?: string;
  submissionPackages?: SubmissionPackageRecord[];
  fundingReadiness?: FundingReadinessRecord;
  riskFlags?: RiskFlagItem[];
  conflicts?: ConflictItem[];
  bankAnalysis?: BankStatementAnalysisSummary;
  underwritingChecklist?: UnderwritingChecklistItem[];
  underwriterAssigned?: string;

  // Dates & Milestones
  createdDate?: string;
  startDate?: string;
  fundingDate?: string;
  payoffDate?: string;
  payoffAmount?: number;
  renewalDate?: string;
  renewalStatus?: string;
  cancelledDate?: string;

  // Commission & Fees (CRITICAL: NEVER PREFILLED; MUST BE ENTERED MANUALLY)
  fee: number; // Origination / closing fee $
  percentage: number; // Commission percentage (e.g., 6.9%)
  commissionPoints?: number;
  commissionTotal?: number;
  commissionStatus: 'PENDING' | 'COLLECTED' | 'DISTRIBUTED' | 'PARTIALLY_DISTRIBUTED';
  commissionReceivedDate?: string;
  commissionManuallyEntered?: boolean;

  // Rep & Referral
  assignedStaff: string;
  assignedRep?: string;
  broker?: string;
  referralPartner?: string;
  referralPartnerSplit?: number;

  // Notes & Documents
  notes?: string;
  internalNotes?: string;
  documents?: DocumentItem[];
  activityHistory?: DealActivityItem[];

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export type CommissionParticipantType =
  | 'Internal Staff'
  | 'Referral Partner'
  | 'Broker Partner'
  | 'Business Partner'
  | 'Outside Partner'
  | 'Other';

export interface CommissionParticipant {
  id: string;
  dealId: string;
  participantDirectoryId?: string;
  name: string;
  type: CommissionParticipantType;
  role: string;
  points: number; // Points in percentage, e.g. 1.475 for 1.475%
  dollarAmount: number; // Computed: fundingAmount * (points / 100)
  notes?: string;
  status: 'PENDING' | 'RECEIVED' | 'DISTRIBUTED';
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionDirectoryEntry {
  id: string;
  name: string;
  type: CommissionParticipantType;
  role: string;
  email: string;
  phone: string;
  company?: string;
  defaultPoints?: number;
  notes?: string;
  active: boolean;
}

// ----------------------------------------------------
// TASK SYSTEM
// ----------------------------------------------------
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type PriorityLevel = TaskPriority;
export type TaskStatus = 'To Do' | 'In Progress' | 'Completed' | 'Snoozed';
export type TaskReminder = '15 minutes before' | '30 minutes before' | '1 hour before' | '1 day before' | 'Custom' | 'None';
export type TaskCategory =
  | 'Client'
  | 'Application'
  | 'Verification'
  | 'Underwriting'
  | 'Funding Deal'
  | 'Lender'
  | 'Commission'
  | 'Funding Strategy'
  | 'General';

export interface InternalTask {
  id: string;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  dealId?: string;
  dealTitle?: string;
  dealName?: string;
  category?: TaskCategory;
  assignedTo: string; // Staff member name or id
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  priority: TaskPriority;
  status: TaskStatus;
  reminder: TaskReminder;
  notes?: string;
  createdBy: string;
  createdDate: string;
  updatedAt: string;
  snoozedUntil?: string;
  completedAt?: string;
}

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------
export type NotificationType =
  | 'TASK_REMINDER'
  | 'TASK_DUE'
  | 'HIGH_PRIORITY_TASK'
  | 'TASK_OVERDUE'
  | 'NEW_LEAD'
  | 'VERIFICATION_COMPLETE'
  | 'UNDERWRITING_READY'
  | 'PRE_APPROVAL'
  | 'APPROVAL'
  | 'FUNDED'
  | 'COMMISSION_RECEIVED'
  | 'SYSTEM_ALERT';

export interface AppNotification {
  id: string;
  userId: string; // Target user or 'all'
  title: string;
  message: string;
  type: NotificationType;
  priority: TaskPriority;
  isRead: boolean;
  createdAt: string;
  targetType?: 'client' | 'task' | 'deal' | 'general';
  targetId?: string;
}

// ----------------------------------------------------
// FUNDING STRATEGY (ACTIVE & HISTORICAL)
// ----------------------------------------------------
export interface FundingStrategyRecord {
  id: string;
  clientId: string;
  currentSituation: string;
  strategy: string;
  nextSteps: string;
  productsToPursue?: string;
  problemsToSolve?: string;
  missingDocuments?: string;
  creditIssues?: string;
  lenderStrategy?: string;
  assignedTo: string;
  priority: TaskPriority;
  nextReviewDate: string;
  strategyStatus: 'Active' | 'Under Review' | 'Completed' | 'Archived';
  strategyNotes?: string;
  createdBy: string;
  createdDate: string;
  updatedAt: string;
  isActive: boolean;
}

// ----------------------------------------------------
// INTERNAL NOTES
// ----------------------------------------------------
export type InternalNoteCategory =
  | 'General'
  | 'Sales'
  | 'Verification'
  | 'Underwriting'
  | 'Lender'
  | 'Funding'
  | 'Commission'
  | 'Strategy'
  | 'Task';

export interface ClientInternalNote {
  id: string;
  clientId: string;
  author: string;
  type?: InternalNoteCategory;
  category?: string;
  content: string;
  isPinned?: boolean;
  createdAt?: string;
  timestamp?: string;
}

// ----------------------------------------------------
// LENDER HISTORY
// ----------------------------------------------------
export type LenderHistoryStatus =
  | 'Not Sent'
  | 'Sent'
  | 'Under Review'
  | 'More Information Requested'
  | 'Pre-Approved'
  | 'Approved'
  | 'Not Qualified'
  | 'Declined'
  | 'Withdrawn';

export interface LenderHistoryRecord {
  id: string;
  clientId: string;
  dealId?: string;
  lenderName: string;
  fundingProduct: FundingProductType;
  dateSent: string;
  sentBy: string;
  status: LenderHistoryStatus;
  response?: string;
  amount?: number;
  terms?: string;
  conditions?: string;
  requiredDocuments?: string;
  lenderNotes?: string;
  responseDate?: string;
  nextStep?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// CREDIT CARDS (BUSINESS & PERSONAL)
// ----------------------------------------------------
export interface CreditCardRecord {
  id: string;
  clientId: string;
  cardCategory: 'BUSINESS' | 'PERSONAL';
  cardType?: string; // Visa, Mastercard, Amex, Discover
  issuer: string; // Chase, Amex, Capital One, Citi, etc.
  cardName: string; // e.g., Chase Ink, Amex Business Gold, Sapphire
  cardholder: string;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  monthlyPayment: number;
  utilization: number; // percentage
  openedDate?: string;
  lastFourDigits?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------
// EXISTING DEBT
// ----------------------------------------------------
export interface ExistingDebtRecord {
  id: string;
  clientId: string;
  lender: string;
  loanType: 'MCA' | 'SBA Loan' | 'Business Line of Credit' | 'Equipment Financing' | 'Term Loan' | 'Other';
  originalLoanAmount: number;
  termMonths: number;
  monthlyPayment: number;
  currentBalance: number;
  status: string;
  notes?: string;
}

// ----------------------------------------------------
// RECENT CREDIT ACTIVITY
// ----------------------------------------------------
export interface RecentCreditActivityRecord {
  id: string;
  clientId: string;
  lender: string;
  dateApplied: string;
  amountRequested: number;
  product: string;
  approved: boolean;
  result: 'Approved' | 'Not Approved';
  notes?: string;
}

// ----------------------------------------------------
// MASTER VERIFICATION WORKSHEET
// ----------------------------------------------------
export interface MasterVerificationField {
  asApplied: string;
  verified: string;
  status: VerificationStatusType;
  notes: string;
  script?: string;
  extracted?: {
    value: string;
    sourceDocTitle: string;
    docId?: string;
    confidence: number;
    extractedAt: string;
    quote?: string;
    sourceQuote?: string;
    isConflict?: boolean;
  };
}

export interface EmploymentSalaryPayrollVerification {
  sectionStatus: 'Pending' | 'In Progress' | 'Verified' | 'Needs Correction' | 'Unverified';

  // Group 1: Employment Status
  currentlyWorking: MasterVerificationField;
  selfEmployed: MasterVerificationField;
  employedByAnotherCompany: MasterVerificationField;

  // Group 2: If Currently Working / Details
  employerName: MasterVerificationField;
  jobTitle: MasterVerificationField;
  jobOccupation: MasterVerificationField;
  jobDescription: MasterVerificationField;
  employmentStartDate: MasterVerificationField;
  yearsWithEmployer: MasterVerificationField;
  employmentTypeStatus: MasterVerificationField; // Full-Time | Part-Time | Contract | Seasonal | Other

  // Group 3: Employment Income
  annualSalary: MasterVerificationField;
  monthlySalary: MasterVerificationField;
  annualEmploymentIncome: MasterVerificationField;
  monthlyEmploymentIncome: MasterVerificationField;
  otherMonthlyIncome: MasterVerificationField;
  otherIncomeSource: MasterVerificationField;

  // Group 4: Pay Stub & Payroll
  receivesPayStubs: MasterVerificationField;
  paidThroughPayroll: MasterVerificationField;
  payFrequency: MasterVerificationField;
  mostRecentPayStubDate: MasterVerificationField;
  payStubReceived: MasterVerificationField;
  payStubReviewed: MasterVerificationField;

  // Group 5 & 6: Notes & Red Flags
  employmentIncomeNotes: string;
  redFlags: string;

  updatedAt?: string;
  updatedBy?: string;
}

export interface MasterVerificationData {
  id: string;
  clientId: string;
  verificationSpecialist: string;
  date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'COMPLETE' | 'UNVERIFIED' | 'NEEDS_CORRECTION' | string;
  overallResult: 'APPROVED_FOR_UNDERWRITING' | 'NEEDS_MORE_INFO' | 'HIGH_RISK_DECLINED' | 'PENDING_DOCS';
  callSummary: string;
  internalNotesRedFlags: string;
  verifiedBy?: string;
  verifiedAt?: string;

  // Pre-Call Review Checklist (17 items)
  preCallReview: {
    clientName: boolean;
    businessName: boolean;
    phone: boolean;
    email: boolean;
    businessAddress: boolean;
    entityType: boolean;
    ein: boolean;
    timeInBusiness: boolean;
    ownershipPercentage: boolean;
    monthlyRevenue: boolean;
    personalAnnualIncome: boolean;
    requestedFunding: boolean;
    purposeOfFunds: boolean;
    uploadedDocuments: boolean;
    ssn: boolean;
    dob: boolean;
    stateOfIncorporation: boolean;
    creditScore: boolean;
    missingInfoNotes: string;
  };

  // Opening Script
  openingScript: {
    answered: boolean;
    continueNow: boolean; // Yes continue / No reschedule
    rescheduleDate?: string;
    rescheduleNotes?: string;
  };

  // Identity Verification
  identity: {
    legalName: MasterVerificationField;
    phone: MasterVerificationField;
    email: MasterVerificationField;
    dob: MasterVerificationField;
    ssnLast4: MasterVerificationField;
  };

  // Business Verification
  business: {
    businessName: MasterVerificationField;
    dba: MasterVerificationField;
    businessAddress: MasterVerificationField;
    ein: MasterVerificationField;
    stateOfIncorporation: MasterVerificationField;
    entityType: MasterVerificationField;
    businessStartDate: MasterVerificationField;
    timeInBusiness: MasterVerificationField;
    industry: MasterVerificationField;
    businessDescription: MasterVerificationField;
    ownershipPercentage: MasterVerificationField;
    ownerTitle: MasterVerificationField;
  };

  // Employment
  employment: {
    selfEmployedOnly: boolean;
    alsoEmployedFullTime: boolean;
    employer: string;
    position: string;
    yearsEmployed: string;
    employmentStartDate: string;
    employmentStatus: string;
    annualSalary: number;
    monthlySalary: number;
    payFrequency: string;
    otherEmploymentIncome: string;
    employmentNotes: string;
    redFlags: string;
  };

  // Dedicated Employment, Salary & Payroll Verification Section
  employmentVerification?: EmploymentSalaryPayrollVerification;

  // Income Verification
  income: {
    personalAnnualIncome: number;
    monthlyBusinessRevenue: number;
    verifiedPersonalAnnualIncome: number;
    verifiedMonthlyBusinessRevenue: number;
    exactCreditScore: number; // MUST BE EXACT NUMERIC SCORE
    revenueTrend: 'Consistent' | 'Increased' | 'Decreased';
    revenueTrendExplanation: string;
    incomeNotes: string;
    redFlags: string;
  };

  // Payroll / Pay Stub
  payroll: {
    paysSelfThroughPayroll: boolean;
    issuesPayStubs: boolean;
    salary: number;
    grossPay: number;
    netPay: number;
    payFrequency: string;
    payrollStartDate: string;
    latestPayStubDate: string;
    payStubReceived: boolean;
    payStubReviewed: boolean;
    payrollNotes: string;
    redFlags: string;
  };

  // Banking
  banking: {
    primaryBank: string;
    dedicatedBusinessChecking: boolean;
    businessAccount: string;
    personalAccountUsedForBusiness: boolean;
    businessIncomeDepositedIntoPersonal: boolean;
    regularBusinessToPersonalTransfers: boolean;
    transferFrequency: string;
    approximateTransferAmount: number;
    bankingExplanation: string;
    bankingNotes: string;
    redFlags: string;
  };

  // Documents Checklist (8 categories)
  documentChecklist: Record<
    string,
    {
      received: boolean;
      stillNeeded: boolean;
      sentAfterCall: boolean;
      reviewed: boolean;
      reviewedBy?: string;
      reviewedDate?: string;
      notes?: string;
    }
  >;

  // Existing Debt (at least 5 records)
  existingDebts: ExistingDebtRecord[];
  bankruptcyForeclosureRepossession5Years: boolean;
  bankruptcyForeclosureNotes?: string;

  // Credit Cards (Business + Personal)
  creditCards: CreditCardRecord[];

  // Recent Credit Activity (5 records)
  recentCreditActivity: RecentCreditActivityRecord[];

  // Housing
  housing: {
    homeAddressSameAsBusiness: boolean;
    homeAddressIfDifferent: string;
    housingType: 'Homeowner' | 'Renter' | 'Other';
    monthlyMortgageOrRent: number;
    housingNotes: string;
    redFlags: string;
  };

  // Funding Request
  fundingRequest: {
    requestedAmount: number;
    verifiedRequestedAmount: number;
    purposeOfFunds:
      | 'Working Capital'
      | 'Equipment Purchase'
      | 'Payroll'
      | 'Expansion / Growth'
      | 'Debt Consolidation / Refinance'
      | 'Inventory'
      | 'Marketing'
      | 'Other';
    fundingUrgency: 'Immediately' | 'This Week' | 'This Month';
    purposeNotes: string;
    redFlags: string;
  };

  // Credit Verification
  creditVerification: {
    exactCreditScore: number;
    creditUnlocked: boolean;
    fraudAlert: boolean;
    securityFreeze: boolean;
    creditNotes: string;
    redFlags: string;
  };

  // Final Underwriter Summary
  underwriterSummary: {
    overallImpression: 'Excellent' | 'Good' | 'Fair' | 'Needs More Info' | 'High Risk';
    biggestStrength: string;
    biggestConcern: string;
    cashFlowNotes: string;
    businessStabilityNotes: string;
    additionalDocumentsNeeded: string;
    readyForSubmission: boolean;
    reasonIfNo: string;
  };

  // Final 11 Verification Checkboxes
  finalChecklist: {
    identityVerified: boolean;
    businessVerified: boolean;
    incomeVerified: boolean;
    employmentVerified: boolean;
    bankingVerified: boolean;
    documentsReceived: boolean;
    existingDebtReviewed: boolean;
    housingVerified: boolean;
    fundingAmountConfirmed: boolean;
    creditAvailableForPull: boolean;
    fileReadyForUnderwriting: boolean;
  };

  updatedAt: string;
}

// ----------------------------------------------------
// DISCORD & FIREBASE CONFIG
// ----------------------------------------------------
export interface DiscordEventConfig {
  taskAssigned?: boolean;
  taskReminder?: boolean;
  highPriorityTaskCreated?: boolean;
  highPriorityTaskDue?: boolean;
  taskOverdue?: boolean;
  newLead?: boolean;
  leadCreated?: boolean;
  newClient?: boolean;
  applicationSubmitted?: boolean;
  verificationComplete?: boolean;
  verificationFailed?: boolean;
  clientVerified?: boolean;
  documentUploaded?: boolean;
  underwritingReady?: boolean;
  preApprovalReceived?: boolean;
  approvalReceived?: boolean;
  clientFunded?: boolean;
  dealFunded?: boolean;
  commissionReceived?: boolean;
  commissionCollected?: boolean;
}

export interface DiscordLogEntry {
  id: string;
  eventKey: string;
  eventTitle: string;
  clientName?: string;
  businessName?: string;
  dealId?: string;
  taskId?: string;
  timestamp: string;
  status: 'DELIVERED' | 'FAILED' | 'SKIPPED' | 'RATE_LIMITED';
  httpStatus?: number;
  errorReason?: string;
  summary?: string;
}

export interface DiscordConfig {
  webhookUrl: string;
  maskedWebhookUrl?: string;
  hasEnvWebhook?: boolean;
  channelName?: string;
  botUsername?: string;
  mentionRole?: string;
  enabled: boolean;
  events: DiscordEventConfig;
  lastTestedAt?: string;
  lastTestStatus?: 'SUCCESS' | 'FAILED';
  lastTestMessage?: string;
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  firestoreDatabaseId?: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  isConfigured: boolean;
  lastVerifiedAt?: string;
  status?: 'CONNECTED' | 'ERROR' | 'IDLE';
  errorMessage?: string;
}

export interface VerificationFieldRecord {
  id: string;
  clientId: string;
  fieldKey: string;
  fieldLabel: string;
  category: 'CLIENT' | 'BUSINESS' | 'FUNDING';
  originalValue: string;
  verifiedValue: string;
  status: VerificationStatusType;
  notes?: string;
  scriptText?: string;
  updatedBy: string;
  updatedAt: string;
}

export interface VerificationScript {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  scriptText: string;
  category: 'CLIENT' | 'BUSINESS' | 'FUNDING';
}

export interface VerificationAuditLog {
  id: string;
  clientId: string;
  verifier: string;
  timestamp: string;
  field: string;
  previousValue: string;
  newValue: string;
  status: VerificationStatusType;
  actionResult?: 'SUCCESS' | 'FAILED' | 'SAVED' | string;
  notes?: string;
}

export interface UnderwritingCondition {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  responsiblePerson: string;
  dueDate: string;
  status: 'Open' | 'Requested' | 'Received' | 'Verified' | 'Satisfied' | 'Waived';
  notes?: string;
}

export interface BankMonthBreakdown {
  month: string;
  totalDeposits: number;
  endingBalance: number;
  negativeDays: number;
  nsfs: number;
  achDebits: number;
  otherObligations: number;
  notes: string;
}

export interface ExistingPositionItem {
  id: string;
  lender: string;
  product: string;
  originalFunding: number;
  currentBalance: number;
  payment: number;
  paymentFrequency: 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly';
  remainingTerm: string;
  startDate: string;
  estimatedPayoff: string;
  position: string; // '1st Position', '2nd Position', etc.
  notes?: string;
  source?: 'STACKED_DEAL' | 'MANUAL' | 'VERIFIED';
}

export interface UnderwritingEvaluationRecord {
  id: string;
  clientId: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'NEEDS_INFORMATION' | 'READY_FOR_LENDER' | 'SUBMITTED_TO_LENDER' | 'APPROVED' | 'CONDITIONALLY_APPROVED' | 'DECLINED' | 'WITHDRAWN';
  preparedBy: string;
  preparedDate: string;
  updatedBy: string;
  updatedAt: string;

  // 1. Business Profile
  businessType: string;
  industry: string;
  yearsInBusiness: string | number;
  ownershipPercentage: number;
  monthlyRevenue: number;
  annualRevenue: number;
  businessModel: string;
  businessPurpose: string;
  geographicLocation: string;
  numberOfEmployees: number;
  businessStability: string;
  seasonality: string;
  businessProfileComments: string;

  // 2. Credit Analysis
  ficoScore: number;
  experianScore?: number;
  equifaxScore?: number;
  transunionScore?: number;
  creditProfile: string;
  bankruptcy: string;
  openCollections: string;
  recentInquiries: number | string;
  chargeOffs: string;
  judgments: string;
  taxLiens: string;
  creditUtilization: number;
  otherCreditConcerns: string;
  creditAnalysisNotes: string;

  // 3. Bank Statement Analysis
  bankName: string;
  accountType: string;
  statementPeriod: string;
  monthsReviewed: number;
  totalDeposits: number;
  avgMonthlyDeposits: number;
  lowestMonthlyDeposits: number;
  highestMonthlyDeposits: number;
  avgEndingBalance: number;
  lowestEndingBalance: number;
  highestEndingBalance: number;
  negativeDaysTotal: number;
  nsfsTotal: number;
  returnedItemsTotal: number;
  existingAchPaymentsMonthly: number;
  existingMcaPaymentsMonthly: number;
  avgDailyBalance: number;
  cashFlowConsistency: 'Consistent' | 'Fluctuating' | 'Seasonal' | 'Declining' | 'Rapidly Growing';
  depositConsistency: 'High' | 'Moderate' | 'Low';
  monthlyBreakdowns: BankMonthBreakdown[];
  bankAnalysisNotes: string;

  // 4. Red Flags Checklist
  redFlags: {
    negativeDays: boolean;
    nsfs: boolean;
    returnedPayments: boolean;
    decliningRevenue: boolean;
    largeUnexplainedDeposits: boolean;
    irregularCashFlow: boolean;
    heavyExistingDebt: boolean;
    multipleRecentFundingPositions: boolean;
    frequentOverdrafts: boolean;
    excessiveAchObligations: boolean;
    taxIssues: boolean;
    creditIssues: boolean;
    other: boolean;
    otherDescription?: string;
  };
  redFlagNotes: string;

  // 5. Existing Debt / Funding Positions
  existingPositions: ExistingPositionItem[];

  // 6. Debt Service & Obligation Analysis
  debtService: {
    monthlyBusinessRevenue: number;
    monthlyDeposits: number;
    existingMonthlyObligations: number;
    existingAchObligations: number;
    existingFundingPayments: number;
    proposedNewPayment: number;
    estimatedTotalObligations: number;
    estimatedDebtServiceRatio: number; // DSCR e.g. 1.85
    estimatedPaymentToRevenueRatio: number; // % e.g. 12.5%
    obligationNotes: string;
  };

  // 7. Funding Request Analysis
  fundingRequest: {
    requestedAmount: number;
    recommendedAmount: number;
    recommendedProduct: FundingProductType;
    recommendedTerm: string;
    recommendedPayment: number;
    recommendedStructure: string;
    purposeOfFunds: string;
    position: string;
    lenderTarget: string;
  };

  // 8. Underwriter Recommendation
  recommendation: 'RECOMMEND' | 'RECOMMEND_WITH_CONDITIONS' | 'HOLD_NEED_MORE_INFO' | 'NEEDS_INFO' | 'NOT_RECOMMENDED';
  recommendedFundingAmount: number;
  recommendedProduct: FundingProductType;
  recommendedLenderType: string;
  conditionsText: string;
  underwriterComments: string;

  // 9. Strengths & Weaknesses
  strengths: string[];
  weaknesses: string[];

  // 10. Document Checklist
  documentChecklist: Array<{
    name: string;
    category: string;
    status: 'Received' | 'Missing' | 'Needs Review' | 'Expired' | 'Verified';
    notes?: string;
    vaultDocId?: string;
  }>;

  // 11. Conditions to Fund
  conditions: UnderwritingCondition[];

  // 12. Ready For Lender State
  readyForLender: {
    isReady: boolean;
    missingItems: string[];
    lastCheckedAt: string;
  };

  // Audit Trail
  auditTrail: Array<{
    id: string;
    timestamp: string;
    staffMember: string;
    action: string;
    details: string;
  }>;
}

export interface UnderwritingRecord {
  id: string;
  clientId: string;
  underwriterId: string;
  underwriterName: string;
  checklist: Record<string, 'Complete' | 'Incomplete' | 'NA'>;
  creditScore: number;
  monthlyRevenue: number;
  annualRevenue: number;
  existingDebtNotes: string;
  mcaNotes: string;
  decision: 'QUALIFIED' | 'PRE_APPROVED' | 'APPROVED' | 'NOT_QUALIFIED' | 'ADDITIONAL_INFO_REQUESTED';
  decisionDate?: string;
  recommendedAmount: number;
  recommendedProduct: FundingProductType;
  verifiedBy: string;
  verificationDate: string;
  verificationSummary: string;
  createdAt: string;
  updatedAt: string;
  evaluation?: UnderwritingEvaluationRecord;
}

export interface UnderwritingNote {
  id: string;
  clientId: string;
  author: string;
  authorRole: string;
  timestamp: string;
  note: string;
}

export interface LenderSubmission {
  id: string;
  clientId: string;
  dealId: string;
  lenderName: string;
  lenderContact: string;
  submissionDate: string;
  submittedBy: string;
  product: FundingProductType;
  amountRequested: number;
  documentsSubmitted: string[];
  submissionNotes?: string;
  submissionStatus: 'SUBMITTED' | 'UNDER_REVIEW' | 'PRE_APPROVED' | 'APPROVED' | 'NOT_QUALIFIED' | 'INFO_REQUESTED';
  response?: LenderResponse;
}

export interface LenderResponse {
  type: 'PRE_APPROVED' | 'APPROVED' | 'NOT_QUALIFIED' | 'INFO_REQUESTED';
  responseDate: string;
  decisionBy?: string;
  lenderNotes?: string;
  approvedAmount?: number;
  product?: FundingProductType;
  terms?: string;
  fee?: number;
  requiredDocuments?: string[];
  conditions?: string[];
  notQualifiedReason?: string;
}

export interface ReadinessAuditRecord {
  id: string;
  evaluatedAt: string;
  evaluatedBy: string;
  isEligible: boolean;
  result: 'READY' | 'NOT_READY';
  passedPrerequisites: string[];
  blockers: string[];
  warnings: string[];
  missingDocuments: string[];
  conflictsSummary: string[];
  requiredActions: string[];
  notes?: string;
}

export type DocumentCategoryType =
  | 'Application Form'
  | 'Completed Application'
  | 'Verification Form'
  | 'Completed Verification'
  | "Driver's License"
  | 'Bank Statement'
  | 'Bank Statements'
  | 'Tax Return'
  | 'Tax Returns'
  | 'Profit & Loss'
  | 'Voided Check'
  | 'Business License'
  | 'Articles of Incorporation'
  | 'Underwriting Document'
  | 'Business Credit Card Statement'
  | 'Loan Statement'
  | 'MCA Statement'
  | 'Pay Stubs'
  | 'Other Financial Document'
  | 'Other'
  | string;

export interface ExtractedFieldItem {
  key: string;
  label: string;
  section: 'identity' | 'business' | 'employment' | 'employmentVerification' | 'income' | 'payroll' | 'banking' | 'debts' | 'housing' | 'fundingRequest' | 'credit' | 'documentChecklist' | 'other';
  extractedValue: string | number | boolean;
  confidence: number; // e.g. 0.95
  sourceQuote?: string; // verbatim snippet from the document
  pageOrLocation?: string; // e.g. "Page 1, Box 1a" or "Header block"
  sourceType?: FieldSourceType;
  sourceDocTitle?: string;
  currentVerifiedValue?: string | number | boolean;
  currentAppliedValue?: string | number | boolean;
  isConflictWithVerified?: boolean;
  isAppliedToVerification?: boolean;
  status: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED' | 'OVERRIDDEN';
  userOverrideValue?: string | number | boolean;
}

export interface DocumentAiExtractionResult {
  id: string;
  docId: string;
  clientId: string;
  detectedCategory: DocumentCategoryType;
  classificationType?: DocumentClassificationType;
  confidenceScore: number; // 0.0 - 1.0
  documentSummary: string;
  extractedDate: string;
  extractedFields: ExtractedFieldItem[];
  highConfidenceCount?: number;
  needsReviewCount?: number;
  modelUsed?: string;
  hasConflicts?: boolean;
  status: 'PENDING_REVIEW' | 'APPLIED_UNVERIFIED' | 'VERIFIED' | 'DISMISSED';
}

export interface DocumentItem {
  id: string;
  clientId: string;
  clientName?: string;
  businessName?: string;
  clientStatus?: string;
  dealId?: string;
  category: DocumentCategoryType;
  title: string;
  fileName: string;
  fileSize: string;
  fileUrl?: string;
  fileBase64?: string;
  fileMimeType?: string;
  uploadedBy: string;
  uploadedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  status: 'PENDING' | 'RECEIVED' | 'REVIEWED' | 'REJECTED';
  notes?: string;
  aiExtraction?: DocumentAiExtractionResult;
  // Google Drive Cloud Storage Metadata
  storageProvider?: 'google_drive' | 'local' | 'firestore';
  driveFileId?: string;
  driveFolderId?: string;
  driveParentPath?: string;
  driveWebViewLink?: string;
  driveWebContentLink?: string;
  driveThumbnailLink?: string;
  driveAccountEmail?: string;
}

export interface GoogleDriveConfig {
  authType?: 'service_account' | 'oauth2';
  serviceAccountEmail?: string;
  projectId?: string;
  targetFolderId?: string;
  targetFolderName?: string;
  folderAccessible?: boolean;
  serviceAccountConfigured?: boolean;
  folderIdConfigured?: boolean;
  clientId?: string;
  hasClientSecret?: boolean;
  clientIdConfigured?: boolean;
  clientSecretConfigured?: boolean;
  redirectUriConfigured?: boolean;
  rootFolderConfigured?: boolean;
  accountEmailConfigured?: boolean;
  hasRefreshToken?: boolean;
  tokenSource?: 'environment_variable' | 'persistent_storage' | 'oauth_exchange' | 'runtime_memory' | 'direct_input' | 'GOOGLE_SERVICE_ACCOUNT_JSON' | null;
  credentialSource?: string;
  hasServiceAccountJson?: boolean;
  hasPrivateKey?: boolean;
  hasClientEmail?: boolean;
  isConfigured: boolean;
  isConnected: boolean;
  authorizedAccount?: string;
  accountEmail?: string;
  accountName?: string;
  dedicatedAccountEmail?: string;
  rootFolderId: string; // 1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm
  rootFolderName?: string;
  lastConnectedAt?: string;
  tokenExpiresAt?: string;
  statusMessage?: string;
  redirectUri?: string;
  candidateRedirectUris?: string[];
  storageUsage?: {
    usedBytes?: number;
    totalBytes?: number;
  };
}

export interface GoogleDriveDiagnostic {
  success?: boolean;
  authenticated?: boolean;
  driveApiAuthenticated?: boolean;
  folderAccessible?: boolean;
  error?: string;
  authType?: string;
  credentialSource?: string;
  hasServiceAccountJson?: boolean;
  jsonParsed?: boolean;
  hasClientEmail?: boolean;
  hasPrivateKey?: boolean;
  serviceAccountConfigured?: boolean;
  serviceAccountEmail?: string;
  serviceAccount?: string;
  projectId?: string;
  folderIdConfigured?: boolean;
  folderId?: string;
  folderName?: string;
  targetFolderId?: string;
  clientIdConfigured?: boolean;
  clientSecretConfigured?: boolean;
  redirectUriConfigured?: boolean;
  rootFolderConfigured?: boolean;
  accountEmailConfigured?: boolean;
  hasRefreshToken?: boolean;
  hasAccessToken?: boolean;
  tokenSource?: string | null;
  isVercel?: boolean;
  environment: string;
  serverTime: string;
  serverInstance: string;
  candidateRedirectUris?: string[];
  activeRedirectUri?: string;
}

export interface GoogleDriveTestStep {
  step: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  message: string;
  details?: any;
}

export interface GoogleDriveTestResult {
  success: boolean;
  summary: string;
  serviceAccountEmail?: string;
  targetFolderId?: string;
  targetFolderName?: string;
  authenticatedEmail?: string;
  rootFolderId?: string;
  tokenSource?: string;
  results: GoogleDriveTestStep[];
}


export interface CommunicationLogItem {
  id: string;
  clientId: string;
  type:
    | 'Sales Call'
    | 'Verification Call'
    | 'Underwriting Call'
    | 'Document Request'
    | 'Client Update'
    | 'Approval Call'
    | 'Funding Call'
    | 'Other';
  staffMember: string;
  date: string;
  time: string;
  summary: string;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  clientId: string;
  dealId?: string;
  title: string;
  description: string;
  staffMember: string;
  timestamp: string;
  type: 'STATUS_CHANGE' | 'VERIFICATION' | 'UNDERWRITING' | 'LENDER' | 'FUNDING' | 'COMMISSION' | 'DOCUMENT' | 'NOTE' | 'GHL' | 'TASK' | 'STRATEGY';
}

export interface GhlConfig {
  apiKey: string;
  locationId: string;
  locationName?: string;
  baseUrl: string;
  isConnected: boolean;
  lastSyncAt: string;
  lastSyncTime?: string;
  syncErrors: string[];
  autoSyncEnabled: boolean;
  fieldMappings: {
    leadSourceField: string;
    referralPartnerField: string;
    annualRevenueField: string;
    creditScoreField: string;
    requestedAmountField: string;
    productField: string;
  };
  pipelineMappings: Record<string, string>;
}

export interface LeadSourceOption {
  id: string;
  name: string;
  isCustom: boolean;
  active: boolean;
}

export interface ReferralPartnerOption {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  active: boolean;
  defaultCommissionPoints?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'staff' | 'client' | string;
  name: string;
  fullName?: string;
  title?: string;
  portalTitle?: string;
  responsibilities?: string[];
  permissionGroup?: string;
  clientId?: string;
  staffId?: string;
  phone?: string;
  avatar?: string;
  jobTitle?: string;
  department?: string;
  discordUsername?: string;
  discordUserId?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRule {
  id: string;
  loanType: string;
  name?: string;
  defaultRate: number;
  baseFee?: number;
  description?: string;
  defaultPoints?: number;
  defaultSplits?: Array<{
    name: string;
    type: string;
    points: number;
    role?: string;
  }>;
  splits?: {
    role: string;
    targetName: string;
    points: number;
    notes?: string;
  }[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// PRODUCTION ERROR & DIAGNOSTICS TYPES
// ==========================================

export type ErrorStage =
  | 'REQUEST'
  | 'FILE_UPLOAD'
  | 'FILE_PARSE'
  | 'DOCUMENT_CLASSIFICATION'
  | 'AI_AUTH'
  | 'AI_MODEL'
  | 'AI_EXTRACTION'
  | 'VALIDATION'
  | 'CLIENT_MATCH'
  | 'DATABASE'
  | 'GOOGLE_DRIVE'
  | 'PERSISTENCE'
  | 'UNKNOWN';

export type ErrorSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ProcessingTraceStep {
  stepNumber: number;
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED';
  timestamp: string;
  durationMs?: number;
  details?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface ProductionErrorRecord {
  id: string;
  timestamp: string;
  module: string;
  endpoint: string;
  method: string;
  httpStatus: number;
  stage: ErrorStage;
  errorCode: string;
  message: string;
  requestId: string;
  severity: ErrorSeverity;
  userId?: string;
  userName?: string;
  clientId?: string;
  clientName?: string;
  dealId?: string;
  documentId?: string;
  documentName?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  aiModel?: string;
  environment: 'production' | 'development';
  retryCount?: number;
  isResolved: boolean;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  context?: Record<string, any>;
  payload?: any;
  processingTrace?: ProcessingTraceStep[];
}

export interface LiveSystemStatusItem {
  key: string;
  label: string;
  status: 'GREEN' | 'YELLOW' | 'RED';
  endpoint: string;
  latencyMs?: number;
  message: string;
  lastChecked: string;
  details?: Record<string, any>;
}

export interface LiveSystemStatus {
  api: 'GREEN' | 'YELLOW' | 'RED';
  googleDrive: 'GREEN' | 'YELLOW' | 'RED';
  geminiAi: 'GREEN' | 'YELLOW' | 'RED';
  applications: 'GREEN' | 'YELLOW' | 'RED';
  documents: 'GREEN' | 'YELLOW' | 'RED';
  database: 'GREEN' | 'YELLOW' | 'RED';
  authentication: 'GREEN' | 'YELLOW' | 'RED';
  ghl: 'GREEN' | 'YELLOW' | 'RED';
  reports: 'GREEN' | 'YELLOW' | 'RED';
  lastCheckTime: string;
  items: LiveSystemStatusItem[];
}

export interface FullDiagnosticReport {
  overall: 'PASS' | 'WARN' | 'FAIL';
  timestamp: string;
  environment: string;
  totalDurationMs: number;
  steps: Array<{
    name: string;
    module: string;
    status: 'PASS' | 'WARN' | 'FAIL';
    latencyMs: number;
    message: string;
    endpoint?: string;
    details?: any;
    error?: {
      code: string;
      message: string;
    };
  }>;
}

/**
 * Formats a min/max requested funding range into a standard display string
 * e.g. "$50,000 - $100,000" or "$50,000+" or fallback
 */
export function formatFundingRange(
  min?: number | null,
  max?: number | null,
  fallback?: string | number | null
): string {
  const numMin = typeof min === 'number' && !isNaN(min) && min > 0 ? min : null;
  const numMax = typeof max === 'number' && !isNaN(max) && max > 0 ? max : null;

  if (numMin !== null && numMax !== null) {
    if (numMin === numMax) return `$${numMin.toLocaleString()}`;
    return `$${numMin.toLocaleString()} - $${numMax.toLocaleString()}`;
  }
  if (numMin !== null) {
    return `$${numMin.toLocaleString()}+`;
  }
  if (numMax !== null) {
    return `Up to $${numMax.toLocaleString()}`;
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }
  if (typeof fallback === 'number' && !isNaN(fallback) && fallback > 0) {
    return `$${fallback.toLocaleString()}`;
  }
  return '$50,000 - $100,000';
}
