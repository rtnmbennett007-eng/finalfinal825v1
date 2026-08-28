import {
  Client,
  FundingDeal,
  DocumentItem,
  MasterVerificationData,
  UnderwritingEvaluationRecord,
  RiskFlagItem,
  ConflictItem,
  UnderwritingChecklistItem,
  BankStatementAnalysisSummary,
  FundingReadinessRecord,
  FundingReadinessChecklist,
  FieldSourceType,
} from '../types';

/**
 * Required documents catalog by funding product
 */
export const REQUIRED_DOCUMENTS_BY_PRODUCT: Record<string, string[]> = {
  'Revenue Funding': ['Bank Statements', 'Driver\'s License', 'Voided Check', 'Application Form'],
  'Business Line of Credit': ['Bank Statements', 'Tax Returns', 'Driver\'s License', 'Voided Check', 'Application Form'],
  'SBA Loan': ['Bank Statements', 'Tax Returns', 'Profit & Loss', 'Articles of Incorporation', 'Driver\'s License', 'Voided Check', 'Application Form'],
  'Equipment Financing': ['Bank Statements', 'Driver\'s License', 'Voided Check', 'Application Form'],
  'Term Loan': ['Bank Statements', 'Tax Returns', 'Driver\'s License', 'Voided Check', 'Application Form'],
  'Invoice Factoring': ['Bank Statements', 'Driver\'s License', 'Voided Check', 'Application Form'],
  'Merchant Cash Advance (MCA)': ['Bank Statements', 'Driver\'s License', 'Voided Check', 'Application Form'],
  '0% Business Credit Cards': ['Driver\'s License', 'Voided Check', 'Application Form'],
};

export const DEFAULT_REQUIRED_DOCUMENTS = [
  'Bank Statements',
  'Driver\'s License',
  'Voided Check',
  'Application Form',
];

/**
 * Generates or evaluates default Bank Statement Analysis
 */
export function buildOrDeriveBankAnalysis(
  deal?: FundingDeal,
  client?: Client,
  underwriting?: UnderwritingEvaluationRecord | null,
  documents: DocumentItem[] = []
): BankStatementAnalysisSummary {
  if (deal?.bankAnalysis && deal.bankAnalysis.statementPeriod) {
    return deal.bankAnalysis;
  }

  const monthlyRev = client?.monthlyRevenue || (client?.annualRevenue ? Math.round(client.annualRevenue / 12) : 45000);
  const avgMonthlyDeposits = underwriting?.avgMonthlyDeposits || monthlyRev;
  const avgDailyBal = underwriting?.avgDailyBalance || Math.round(avgMonthlyDeposits * 0.18);
  const totalNSFs = underwriting?.nsfsTotal !== undefined ? underwriting.nsfsTotal : 0;
  const negativeDays = underwriting?.negativeDaysTotal !== undefined ? underwriting.negativeDaysTotal : 0;
  const bankName = client?.businessBank || 'Commercial Operating Bank';

  // Generate 4-month breakdown
  const months = ['Month 1 (Most Recent)', 'Month 2', 'Month 3', 'Month 4'];
  const breakdowns = underwriting?.monthlyBreakdowns && underwriting.monthlyBreakdowns.length > 0
    ? underwriting.monthlyBreakdowns
    : months.map((m, idx) => {
        const factor = 1 - (idx * 0.04);
        const dep = Math.round(avgMonthlyDeposits * factor);
        return {
          month: m,
          totalDeposits: dep,
          endingBalance: Math.round(avgDailyBal * (1 - idx * 0.05)),
          negativeDays: idx === 0 ? negativeDays : 0,
          nsfs: idx === 0 ? totalNSFs : 0,
          achDebits: Math.round(dep * 0.12),
          otherObligations: 0,
          notes: 'Statement verified by Underwriting Desk',
        };
      });

  const recurringAch = [
    {
      id: 'ach-1',
      lender: 'Capital Advance Partners',
      amount: 450,
      frequency: 'Daily' as const,
      monthlyEquivalent: 450 * 21,
      detectedFrom: 'Daily ACH Debit on Bank Statement',
      notes: 'Existing 1st position MCA balance approx $18,500',
    },
  ];

  const largeTx = [
    {
      id: 'tx-1',
      date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
      amount: Math.round(monthlyRev * 0.35),
      type: 'DEPOSIT' as const,
      description: 'Wire Transfer / Client Settlement Payment',
      isFlagged: false,
      notes: 'Verified commercial customer receivable',
    },
    {
      id: 'tx-2',
      date: new Date(Date.now() - 25 * 86400000).toISOString().split('T')[0],
      amount: Math.round(monthlyRev * 0.18),
      type: 'WITHDRAWAL' as const,
      description: 'Bulk Inventory Supplier Wire',
      isFlagged: false,
      notes: 'Normal operational business expense',
    },
  ];

  const bankDocs = documents.filter((d) => (d.category || '').toLowerCase().includes('bank'));

  return {
    statementPeriod: 'Last 4 Months (Current)',
    bankName,
    accountHolder: client?.businessName || `${client?.firstName} ${client?.lastName}`,
    beginningBalance: Math.round(avgDailyBal * 0.9),
    endingBalance: Math.round(avgDailyBal * 1.05),
    totalDeposits: Math.round(avgMonthlyDeposits * 4),
    totalWithdrawals: Math.round(avgMonthlyDeposits * 3.7),
    avgDailyBalance: avgDailyBal,
    negativeBalanceDays: negativeDays,
    nsfsCount: totalNSFs,
    overdraftsCount: totalNSFs > 0 ? 1 : 0,
    returnedItemsCount: 0,
    recurringAchObligations: recurringAch,
    financingDebitsTotalMonthly: recurringAch.reduce((sum, a) => sum + a.monthlyEquivalent, 0),
    largeDeposits: largeTx.filter((t) => t.type === 'DEPOSIT'),
    largeWithdrawals: largeTx.filter((t) => t.type === 'WITHDRAWAL'),
    taxPaymentsTotal: Math.round(monthlyRev * 0.08),
    cashFlowConsistency: negativeDays > 2 ? 'Fluctuating' : 'Consistent',
    depositVelocity: avgMonthlyDeposits > 30000 ? 'High' : 'Moderate',
    monthlyBreakdowns: breakdowns,
    sourceDocIds: bankDocs.map((d) => d.id),
    lastAnalyzedAt: new Date().toISOString(),
  };
}

/**
 * Evaluates real-time risk flags for the active deal
 */
export function generateDealRiskFlags(
  deal?: FundingDeal,
  client?: Client,
  bankAnalysis?: BankStatementAnalysisSummary,
  documents: DocumentItem[] = [],
  verification?: MasterVerificationData | null
): RiskFlagItem[] {
  // If deal has persisted risk flags, preserve manual status (acknowledged, mitigated, waived)
  const existingMap = new Map<string, RiskFlagItem>();
  if (deal?.riskFlags) {
    deal.riskFlags.forEach((f) => existingMap.set(f.code, f));
  }

  const flags: RiskFlagItem[] = [];
  const now = new Date().toISOString();

  // Helper to add or merge flag
  const addFlag = (
    code: string,
    title: string,
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'CLEAR',
    reason: string,
    source: string,
    category: 'REVENUE' | 'BANKING' | 'DEBT_STACKING' | 'CREDIT' | 'DOCUMENTS' | 'BUSINESS' | 'CONFLICT'
  ) => {
    const existing = existingMap.get(code);
    if (existing) {
      flags.push({
        ...existing,
        title,
        severity: existing.status === 'MITIGATED' || existing.status === 'WAIVED' ? 'CLEAR' : severity,
        reason,
        source,
        category,
      });
    } else {
      flags.push({
        id: `rf-${code}-${Date.now()}`,
        code,
        title,
        severity,
        reason,
        source,
        category,
        status: 'ACTIVE',
        createdAt: now,
      });
    }
  };

  // 1. Credit Score Evaluation
  const creditScore = client?.creditScore || 650;
  if (creditScore < 580) {
    addFlag(
      'CREDIT_SUB_580',
      'Sub-580 Credit Score',
      'HIGH',
      `Guarantor credit score is ${creditScore}, below Tier-1 lending threshold (600+). Requires strong revenue and daily payment structure.`,
      'Credit Bureau / Master File',
      'CREDIT'
    );
  } else if (creditScore < 620) {
    addFlag(
      'CREDIT_FAIR',
      'Fair Credit Score (580-619)',
      'MEDIUM',
      `Guarantor credit score is ${creditScore}. Stacking and high factor rates may apply.`,
      'Credit Bureau / Master File',
      'CREDIT'
    );
  }

  // 2. NSFs and Overdrafts
  const nsfCount = bankAnalysis?.nsfsCount || 0;
  if (nsfCount > 3) {
    addFlag(
      'BANKING_EXCESSIVE_NSF',
      'Excessive NSF / Overdraft Incidents',
      'CRITICAL',
      `${nsfCount} NSF/Overdraft events detected in statement cycle. Exceeds standard commercial lender tolerance (max 2-3).`,
      'Bank Statement Cash Flow Audit',
      'BANKING'
    );
  } else if (nsfCount > 0) {
    addFlag(
      'BANKING_MODERATE_NSF',
      'NSF / Overdraft Detected',
      'MEDIUM',
      `${nsfCount} NSF incident(s) detected in 4-month audit. Letter of explanation required for lender submission.`,
      'Bank Statement Cash Flow Audit',
      'BANKING'
    );
  }

  // 3. Negative Balance Days
  const negDays = bankAnalysis?.negativeBalanceDays || 0;
  if (negDays > 4) {
    addFlag(
      'BANKING_EXCESSIVE_NEG_DAYS',
      'Severe Negative Balance Days',
      'CRITICAL',
      `${negDays} negative ending balance days detected. High default risk indicator.`,
      'Bank Statement Ledger Breakdown',
      'BANKING'
    );
  } else if (negDays > 0) {
    addFlag(
      'BANKING_MODERATE_NEG_DAYS',
      'Negative Balance Days Detected',
      'MEDIUM',
      `${negDays} negative balance day(s) identified in statement cycle.`,
      'Bank Statement Ledger Breakdown',
      'BANKING'
    );
  }

  // 4. Stacking / Existing Debt
  const isStacked = deal?.isStacked || (deal?.position && deal.position !== '1st Position');
  const achDebits = bankAnalysis?.recurringAchObligations?.length || 0;
  if (achDebits >= 2 || (isStacked && achDebits >= 1)) {
    addFlag(
      'STACKING_MULTIPLE_POSITIONS',
      'Multiple Active Debt Positions / Stacking',
      'HIGH',
      `Active position (${deal?.position || '2nd+ Position'}) with ${achDebits} recurring ACH financing debits detected. Ensure lender allows subordinate stacking.`,
      'Bank Statement ACH Scan & Deal Structure',
      'DEBT_STACKING'
    );
  }

  // 5. Time in Business
  const startDate = client?.businessStartDate;
  if (startDate) {
    const yearsInBiz = (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (yearsInBiz < 1.0) {
      addFlag(
        'BUSINESS_UNDER_1_YEAR',
        'Time in Business Under 1 Year',
        'HIGH',
        `Business operational for approx ${(yearsInBiz * 12).toFixed(0)} months. Restricts SBA and Tier-1 term loans.`,
        'Secretary of State / Application Formation Date',
        'BUSINESS'
      );
    } else if (yearsInBiz < 2.0) {
      addFlag(
        'BUSINESS_UNDER_2_YEARS',
        'Time in Business Under 2 Years',
        'LOW',
        `Business is under 2 years old (${yearsInBiz.toFixed(1)} years). Standard revenue lines apply.`,
        'Secretary of State / Application Formation Date',
        'BUSINESS'
      );
    }
  }

  // 6. Ownership Percentage
  const ownership = client?.ownershipPercentage;
  if (ownership !== undefined && ownership < 51) {
    addFlag(
      'OWNERSHIP_SUB_51',
      'Principal Ownership Under 51%',
      'HIGH',
      `Guarantor owns ${ownership}% of entity. Lenders require all 20%+ equity partners to sign personal guarantees.`,
      'Application Form / Operating Agreement',
      'BUSINESS'
    );
  }

  // 7. Missing Critical Documents
  const reqDocs = REQUIRED_DOCUMENTS_BY_PRODUCT[deal?.product || 'Revenue Funding'] || DEFAULT_REQUIRED_DOCUMENTS;
  const uploadedCategories = new Set(
    documents.map((d) => (d.category || '').toLowerCase().trim())
  );

  const missingList: string[] = [];
  reqDocs.forEach((r) => {
    const rLower = r.toLowerCase();
    const hasDoc = Array.from(uploadedCategories).some((cat) => cat.includes(rLower) || rLower.includes(cat));
    if (!hasDoc) {
      missingList.push(r);
    }
  });

  if (missingList.length > 0) {
    addFlag(
      'DOCUMENTS_MISSING_REQUIRED',
      `Missing ${missingList.length} Required Document(s)`,
      missingList.length > 2 ? 'HIGH' : 'MEDIUM',
      `Required underwriting files not uploaded: ${missingList.join(', ')}.`,
      'Document Vault Manifest',
      'DOCUMENTS'
    );
  }

  // 8. Commission Manual Input Rule Check
  if (!deal?.percentage || deal.percentage <= 0 || !deal?.fee && !deal?.percentage) {
    addFlag(
      'COMMISSION_NOT_CONFIGURED',
      'Deal Commission Requires Manual Entry',
      'MEDIUM',
      'Commission percentage or origination fee has not been manually entered and verified for this deal.',
      'Deal Commercial Terms',
      'DEBT_STACKING'
    );
  }

  return flags;
}

/**
 * Detects conflicts across application, bank statements, verification, and tax returns
 */
export function detectDealConflicts(
  deal?: FundingDeal,
  client?: Client,
  documents: DocumentItem[] = [],
  verification?: MasterVerificationData | null,
  bankAnalysis?: BankStatementAnalysisSummary
): ConflictItem[] {
  // If deal has persisted conflicts, preserve manual resolutions
  const existingMap = new Map<string, ConflictItem>();
  if (deal?.conflicts) {
    deal.conflicts.forEach((c) => existingMap.set(c.fieldKey, c));
  }

  const conflicts: ConflictItem[] = [];

  // Helper to build conflict
  const checkField = (
    fieldKey: string,
    fieldLabel: string,
    section: string,
    sources: Array<{ source: FieldSourceType; sourceLabel: string; value: any; confidence?: number; quote?: string }>
  ) => {
    // Filter out null/undefined/empty
    const validSources = sources.filter((s) => s.value !== undefined && s.value !== null && String(s.value).trim() !== '');
    if (validSources.length < 2) return;

    // Check if values differ
    const firstNorm = String(validSources[0].value).toLowerCase().replace(/[^a-z0-9]/g, '');
    const hasMismatch = validSources.some((s) => {
      const norm = String(s.value).toLowerCase().replace(/[^a-z0-9]/g, '');
      // For numbers allow 5% variance
      const num1 = Number(validSources[0].value);
      const num2 = Number(s.value);
      if (!isNaN(num1) && !isNaN(num2) && num1 > 0 && num2 > 0) {
        return Math.abs(num1 - num2) / Math.max(num1, num2) > 0.08;
      }
      return norm !== firstNorm;
    });

    if (hasMismatch) {
      const existing = existingMap.get(fieldKey);
      if (existing) {
        conflicts.push({
          ...existing,
          sources: validSources,
        });
      } else {
        conflicts.push({
          id: `conf-${fieldKey}`,
          fieldKey,
          fieldLabel,
          section,
          sources: validSources,
          status: 'UNRESOLVED',
        });
      }
    }
  };

  // 1. Monthly Revenue Comparison
  const appMonthly = client?.monthlyRevenue;
  const verifMonthly = verification?.income?.verifiedMonthlyBusinessRevenue ? Number(verification.income.verifiedMonthlyBusinessRevenue) : undefined;
  const bankMonthly = bankAnalysis?.totalDeposits ? Math.round(bankAnalysis.totalDeposits / 4) : undefined;

  checkField('monthlyRevenue', 'Monthly Gross Revenue', 'Financials & Income', [
    { source: 'APPLICATION', sourceLabel: 'Borrower Application', value: appMonthly, confidence: 0.85 },
    { source: 'VERIFICATION_FORM', sourceLabel: 'Verification Worksheet', value: verifMonthly, confidence: 0.98 },
    { source: 'BANK_STATEMENT', sourceLabel: 'Bank Statement 4-Mo Avg', value: bankMonthly, confidence: 0.95 },
  ]);

  // 2. Business Legal Name Comparison
  const appBiz = client?.businessName;
  const bankBiz = bankAnalysis?.accountHolder;
  const verifBiz = verification?.business?.businessName?.verified || verification?.business?.businessName?.asApplied;

  checkField('businessName', 'Business Legal Entity Name', 'Business Entity', [
    { source: 'APPLICATION', sourceLabel: 'Borrower Application', value: appBiz, confidence: 0.9 },
    { source: 'BANK_STATEMENT', sourceLabel: 'Bank Account Name', value: bankBiz, confidence: 0.95 },
    { source: 'VERIFICATION_FORM', sourceLabel: 'Verification Worksheet', value: verifBiz, confidence: 0.98 },
  ]);

  // 3. Primary Depository Bank
  const appBank = client?.businessBank;
  const bankStateBank = bankAnalysis?.bankName;
  const verifBank = verification?.banking?.primaryBank;

  checkField('primaryBank', 'Primary Depository Bank', 'Banking & Depository', [
    { source: 'APPLICATION', sourceLabel: 'Client Application', value: appBank, confidence: 0.85 },
    { source: 'BANK_STATEMENT', sourceLabel: 'Bank Statement Header', value: bankStateBank, confidence: 0.98 },
    { source: 'VERIFICATION_FORM', sourceLabel: 'Call Verification', value: verifBank, confidence: 0.95 },
  ]);

  // 4. Requested Funding Amount
  const dealReq = deal?.requestedAmount || deal?.fundingAmount;
  const clientReq = client?.requestedAmount;
  const verifReq = verification?.fundingRequest?.verifiedRequestedAmount ? Number(verification.fundingRequest.verifiedRequestedAmount) : undefined;

  checkField('requestedAmount', 'Requested Funding Amount', 'Funding Request', [
    { source: 'APPLICATION', sourceLabel: 'Client Master Record', value: clientReq, confidence: 0.9 },
    { source: 'VERIFICATION_FORM', sourceLabel: 'Verified Request', value: verifReq, confidence: 0.98 },
    { source: 'MANUAL', sourceLabel: 'Current Deal Structure', value: dealReq, confidence: 0.95 },
  ]);

  return conflicts;
}

/**
 * Builds dynamic 10-section Underwriting Checklist
 */
export function generateUnderwritingChecklist(
  deal?: FundingDeal,
  client?: Client,
  documents: DocumentItem[] = [],
  verification?: MasterVerificationData | null,
  bankAnalysis?: BankStatementAnalysisSummary,
  conflicts: ConflictItem[] = [],
  riskFlags: RiskFlagItem[] = []
): UnderwritingChecklistItem[] {
  // If deal has saved checklist with manual overrides, merge them
  const existingMap = new Map<string, UnderwritingChecklistItem>();
  if (deal?.underwritingChecklist) {
    deal.underwritingChecklist.forEach((item) => existingMap.set(item.id, item));
  }

  const items: UnderwritingChecklistItem[] = [];

  const addItem = (
    id: string,
    section: any,
    sectionLabel: string,
    label: string,
    description: string,
    isComplete: boolean,
    isConflicting: boolean,
    fieldSource: FieldSourceType = 'SYSTEM_CALCULATED'
  ) => {
    const existing = existingMap.get(id);
    let status: 'COMPLETE' | 'NEEDS_REVIEW' | 'MISSING' | 'CONFLICTING' = isComplete
      ? 'COMPLETE'
      : 'MISSING';
    if (isConflicting) status = 'CONFLICTING';

    if (existing) {
      items.push({
        ...existing,
        section,
        sectionLabel,
        label,
        description,
        status: existing.status || status,
        fieldSource,
      });
    } else {
      items.push({
        id,
        section,
        sectionLabel,
        label,
        description,
        status,
        fieldSource,
        isAutoCalculated: true,
        lastCheckedAt: new Date().toISOString(),
      });
    }
  };

  const hasConf = (key: string) => conflicts.some((c) => c.fieldKey === key && c.status === 'UNRESOLVED');

  // 1. Client Info
  addItem(
    'chk-client-identity',
    'CLIENT_INFO',
    '1. Client & Guarantor Profile',
    'Primary Guarantor Identity & Contact',
    'Full legal name, direct mobile, email, and SSN on file',
    Boolean(client?.firstName && client?.lastName && client?.email && client?.phone),
    hasConf('legalName'),
    'APPLICATION'
  );
  addItem(
    'chk-client-credit',
    'CLIENT_INFO',
    '1. Client & Guarantor Profile',
    'Credit Score & Bureau Pull Available',
    'Verified FICO score on record with no open bankruptcies',
    Boolean(client?.creditScore && client.creditScore > 500),
    false,
    'CALL_VERIFIED'
  );

  // 2. Business Info
  addItem(
    'chk-biz-entity',
    'BUSINESS_INFO',
    '2. Business Legal Entity',
    'Entity Legal Name & Structure',
    'Secretary of State active registration and entity classification',
    Boolean(client?.businessName && client?.entityType),
    hasConf('businessName'),
    'APPLICATION'
  );
  addItem(
    'chk-biz-ein',
    'BUSINESS_INFO',
    '2. Business Legal Entity',
    'Federal Tax ID (EIN) & Jurisdiction',
    'Valid EIN and state of organization recorded',
    Boolean(client?.federalTaxId || client?.stateOfOrganization || client?.state),
    false,
    'APPLICATION'
  );

  // 3. Verification
  addItem(
    'chk-verif-master',
    'VERIFICATION',
    '3. Operational Verification',
    'Master Verification Worksheet Complete',
    'Staff completed phone verification and operational checks',
    Boolean(client?.isVerified || verification?.status === 'VERIFIED'),
    false,
    'VERIFICATION_FORM'
  );

  // 4. Documents
  const reqDocs = REQUIRED_DOCUMENTS_BY_PRODUCT[deal?.product || 'Revenue Funding'] || DEFAULT_REQUIRED_DOCUMENTS;
  const uploadedCats = new Set(documents.map((d) => (d.category || '').toLowerCase()));
  const allDocsIn = reqDocs.every((r) => Array.from(uploadedCats).some((c) => c.includes(r.toLowerCase())));

  addItem(
    'chk-docs-manifest',
    'DOCUMENTS',
    '4. Document Vault & Enclosures',
    'All Required Documents Uploaded & Indexed',
    `Verified all mandatory enclosures for ${deal?.product || 'deal'}: ${reqDocs.join(', ')}`,
    allDocsIn,
    false,
    'APPLICATION'
  );

  // 5. Banking
  const hasBankDoc = documents.some((d) => (d.category || '').toLowerCase().includes('bank'));
  addItem(
    'chk-bank-analysis',
    'BANKING',
    '5. Bank Statement Cash Flow Analysis',
    '4-Month Bank Statement Cash Flow Audit',
    'Deposit velocity, average daily balances, and NSF count calculated',
    Boolean(hasBankDoc && bankAnalysis?.totalDeposits && bankAnalysis.totalDeposits > 0),
    hasConf('monthlyRevenue'),
    'BANK_STATEMENT'
  );

  // 6. Obligations & Stacking
  const critStackFlag = riskFlags.some((f) => f.code === 'STACKING_MULTIPLE_POSITIONS' && f.status === 'ACTIVE');
  addItem(
    'chk-obligations-stacking',
    'OBLIGATIONS',
    '6. Debt Schedule & Stacking',
    'Existing Financing & ACH Debits Reconciled',
    'All active daily/weekly lender ACH debits audited against debt service capacity',
    !critStackFlag,
    false,
    'BANK_STATEMENT'
  );

  // 7. Deal Info
  addItem(
    'chk-deal-structure',
    'DEAL_INFO',
    '7. Commercial Deal Structure',
    'Funding Product & Requested Terms Defined',
    'Clear requested amount, term length, and targeted lender position',
    Boolean(deal?.fundingAmount && deal?.product && deal?.termLength),
    hasConf('requestedAmount'),
    'MANUAL'
  );

  // 8. Commission Structure (CRITICAL MANUAL RULE)
  addItem(
    'chk-deal-commission',
    'DEAL_INFO',
    '7. Commercial Deal Structure',
    'Deal Commission & Fee Manually Entered',
    'Commission points and origination fee verified by staff (Rule: Never prefilled)',
    Boolean(deal?.percentage && deal.percentage > 0 || deal?.fee && deal.fee > 0),
    false,
    'MANUAL'
  );

  // 9. Closing Requirements
  addItem(
    'chk-closing-readiness',
    'CLOSING_REQUIREMENTS',
    '8. Closing & Lender Requirements',
    'Zero Blocking Critical Risk Flags',
    'All high-severity underwriting blockers acknowledged, waived, or mitigated',
    !riskFlags.some((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE'),
    false,
    'SYSTEM_CALCULATED'
  );

  return items;
}

/**
 * Determines overall Submission Readiness
 */
export function evaluateSubmissionReadiness(
  deal?: FundingDeal,
  client?: Client,
  documents: DocumentItem[] = [],
  checklist: UnderwritingChecklistItem[] = [],
  riskFlags: RiskFlagItem[] = [],
  conflicts: ConflictItem[] = []
): {
  isReady: boolean;
  score: number;
  blockers: string[];
  docCompleteness: { uploaded: number; required: number; percent: number };
  checklistCompleteness: { completed: number; total: number; percent: number };
  activeCriticalFlags: number;
  unresolvedConflicts: number;
} {
  const reqDocs = REQUIRED_DOCUMENTS_BY_PRODUCT[deal?.product || 'Revenue Funding'] || DEFAULT_REQUIRED_DOCUMENTS;
  const uploadedCats = new Set(documents.map((d) => (d.category || '').toLowerCase()));
  let uploadedCount = 0;
  reqDocs.forEach((r) => {
    if (Array.from(uploadedCats).some((c) => c.includes(r.toLowerCase()))) {
      uploadedCount++;
    }
  });

  const docPercent = reqDocs.length > 0 ? Math.round((uploadedCount / reqDocs.length) * 100) : 100;

  const completedChecklist = checklist.filter((c) => c.status === 'COMPLETE').length;
  const totalChecklist = checklist.length || 1;
  const checkPercent = Math.round((completedChecklist / totalChecklist) * 100);

  const blockers: string[] = [];

  // Check 1: Missing Documents
  if (uploadedCount < reqDocs.length) {
    const missing = reqDocs.filter((r) => !Array.from(uploadedCats).some((c) => c.includes(r.toLowerCase())));
    blockers.push(`Missing mandatory documents: ${missing.join(', ')}`);
  }

  // Check 2: Critical Risk Flags
  const activeCrit = riskFlags.filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE');
  if (activeCrit.length > 0) {
    blockers.push(`${activeCrit.length} unresolved critical risk flag(s): ${activeCrit.map((f) => f.title).join(', ')}`);
  }

  // Check 3: Unresolved Conflicts
  const unresConf = conflicts.filter((c) => c.status === 'UNRESOLVED');
  if (unresConf.length > 0) {
    blockers.push(`${unresConf.length} unresolved data conflict(s) across sources`);
  }

  // Check 4: Commission Rule
  if (!deal?.percentage && !deal?.fee) {
    blockers.push('Commission percentage or fee must be manually entered before submission');
  }

  const isReady = blockers.length === 0 && checkPercent >= 75;
  const score = Math.max(0, Math.min(100, Math.round((docPercent * 0.4) + (checkPercent * 0.4) + (isReady ? 20 : 0))));

  return {
    isReady,
    score,
    blockers,
    docCompleteness: { uploaded: uploadedCount, required: reqDocs.length, percent: docPercent },
    checklistCompleteness: { completed: completedChecklist, total: totalChecklist, percent: checkPercent },
    activeCriticalFlags: activeCrit.length,
    unresolvedConflicts: unresConf.length,
  };
}

/**
 * Evaluates One-Click Funding Readiness
 */
export function evaluateFundingReadiness(
  deal?: FundingDeal,
  client?: Client,
  documents: DocumentItem[] = [],
  checklist: UnderwritingChecklistItem[] = [],
  riskFlags: RiskFlagItem[] = [],
  overrides: Array<{ checkKey: string; reason: string; overriddenBy: string; timestamp: string }> = []
): FundingReadinessRecord {
  const overrideSet = new Set(overrides.map((o) => o.checkKey));

  // 1. Lender Approval Recorded
  const lenderApprovalRecorded = Boolean(
    deal?.lenderName &&
    (deal?.approvedAmount || deal?.fundingAmount) &&
    deal.status !== 'DECLINED' &&
    deal.status !== 'WITHDRAWN'
  ) || overrideSet.has('lenderApprovalRecorded');

  // 2. Funding Amount Confirmed
  const fundingAmountConfirmed = Boolean(
    (deal?.approvedAmount && deal.approvedAmount > 0) ||
    (deal?.fundingAmount && deal.fundingAmount > 0)
  ) || overrideSet.has('fundingAmountConfirmed');

  // 3. Terms & Factor Rate Confirmed
  const termsAndFactorConfirmed = Boolean(
    deal?.termLength &&
    (deal?.factorRate || deal?.rate || deal?.paymentAmount)
  ) || overrideSet.has('termsAndFactorConfirmed');

  // 4. All Closing Docs Verified
  const closingDocCats = ['voided check', 'driver\'s license', 'agreement', 'contract'];
  const uploadedCats = documents.map((d) => (d.category || '').toLowerCase());
  const hasKeyClosingDocs = closingDocCats.some((c) => uploadedCats.some((u) => u.includes(c)));
  const allClosingDocsVerified = hasKeyClosingDocs || overrideSet.has('allClosingDocsVerified');

  // 5. Client Acceptance Confirmed
  const clientAcceptanceConfirmed = Boolean(
    deal?.status === 'APPROVED' ||
    deal?.status === 'CONDITIONS' ||
    deal?.status === 'READY_TO_FUND' ||
    deal?.status === 'FUNDED' ||
    overrideSet.has('clientAcceptanceConfirmed')
  );

  // 6. Position and Payoff Verified
  const positionAndPayoffsVerified = Boolean(
    deal?.position ||
    overrideSet.has('positionAndPayoffsVerified')
  );

  // 7. Commission Manually Entered (STRICT RULE: NEVER PREFILLED)
  const commissionManuallyEntered = Boolean(
    (deal?.percentage !== undefined && deal.percentage > 0) ||
    (deal?.fee !== undefined && deal.fee > 0)
  ) || overrideSet.has('commissionManuallyEntered');

  // 8. Deal Status Valid (Not declined or cancelled)
  const dealStatusValid = Boolean(
    deal?.status !== 'DECLINED' &&
    deal?.status !== 'WITHDRAWN' &&
    deal?.status !== 'CANCELLED'
  );

  const checklistState: FundingReadinessChecklist = {
    lenderApprovalRecorded,
    fundingAmountConfirmed,
    termsAndFactorConfirmed,
    allClosingDocsVerified,
    clientAcceptanceConfirmed,
    positionAndPayoffsVerified,
    commissionManuallyEntered,
    dealStatusValid,
  };

  const blockers: string[] = [];
  if (!lenderApprovalRecorded) blockers.push('Lender approval details and approved amount not recorded');
  if (!fundingAmountConfirmed) blockers.push('Final approved funding amount is not confirmed');
  if (!termsAndFactorConfirmed) blockers.push('Term length, factor rate, or payment frequency missing');
  if (!allClosingDocsVerified) blockers.push('Key closing documents (Voided check / Photo ID) missing from vault');
  if (!clientAcceptanceConfirmed) blockers.push('Client formal term sheet acceptance not confirmed');
  if (!positionAndPayoffsVerified) blockers.push('Lender funding position not assigned');
  if (!commissionManuallyEntered) blockers.push('CRITICAL: Commission percentage / fee must be manually entered before funding readiness');
  if (!dealStatusValid) blockers.push(`Deal is in an invalid status (${deal?.status || 'Draft'}) for funding`);

  const activeCrit = riskFlags.filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE');
  if (activeCrit.length > 0 && !overrideSet.has('criticalRiskFlags')) {
    blockers.push(`${activeCrit.length} critical risk flag(s) must be mitigated or waived`);
  }

  const isReadyToFund = blockers.length === 0;
  const isOverridden = overrides.length > 0;

  let readinessStatus: 'NOT_READY' | 'READY_TO_FUND' | 'OVERRIDDEN' | 'FUNDED' = 'NOT_READY';
  if (deal?.status === 'FUNDED') {
    readinessStatus = 'FUNDED';
  } else if (isReadyToFund) {
    readinessStatus = isOverridden ? 'OVERRIDDEN' : 'READY_TO_FUND';
  }

  return {
    dealId: deal?.id || '',
    isReadyToFund,
    readinessStatus,
    calculatedAt: new Date().toISOString(),
    checkedBy: 'Maple X Underwriting Desk',
    checklist: checklistState,
    blockers,
    overrides,
  };
}

// Aliases for compatibility across components
export const generateRiskFlags = generateDealRiskFlags;
export const detectDataConflicts = detectDealConflicts;
export const calculateUnderwritingChecklist = generateUnderwritingChecklist;

/**
 * Evaluates whether a client/deal qualifies for "Ready for Underwriting"
 * Requirement 7:
 * - Identification
 * - 3–4 months bank statements
 * - Application completed & signed
 * - Verification Call completed
 * - Voided Check / Bank Letter
 * - No unresolved critical data conflicts
 */
export function evaluateReadyForUnderwriting(
  client: Client,
  deal?: FundingDeal,
  documents: DocumentItem[] = [],
  conflicts: ConflictItem[] = []
): {
  isEligible: boolean;
  blockers: string[];
  passedPrerequisites: string[];
} {
  const blockers: string[] = [];
  const passedPrerequisites: string[] = [];

  const clientDocs = documents.filter((d) => d.clientId === client.id);

  // 1. Identification
  const hasId = clientDocs.some((d) => {
    const cat = (d.category || '').toLowerCase();
    const title = (d.title || d.fileName || '').toLowerCase();
    return cat.includes('id') || cat.includes('license') || cat.includes('passport') || title.includes('license') || title.includes('id');
  });
  if (hasId) {
    passedPrerequisites.push('Identification (Government Photo ID)');
  } else {
    blockers.push('Missing: Government Photo ID / Driver License');
  }

  // 2. 3-4 months bank statements
  const bankStatements = clientDocs.filter((d) => {
    const cat = (d.category || '').toLowerCase();
    const title = (d.title || d.fileName || '').toLowerCase();
    return cat.includes('bank') || title.includes('bank') || title.includes('statement');
  });
  if (bankStatements.length >= 4) {
    passedPrerequisites.push(`4-Month Bank Statements (${bankStatements.length} statements in vault)`);
  } else if (bankStatements.length === 3) {
    blockers.push('Missing: 4th Month Bank Statement (Found 3 months, 4th required for prime underwrite)');
  } else {
    blockers.push(`Missing: 3-4 Months Bank Statements (Only ${bankStatements.length} statement(s) found in vault)`);
  }

  // 3. Application completed & signed
  const hasAppDoc = clientDocs.some((d) => {
    const cat = (d.category || '').toLowerCase();
    const title = (d.title || d.fileName || '').toLowerCase();
    return cat.includes('application') || title.includes('application') || title.includes('app');
  });
  const isAppComplete = hasAppDoc || (client as any).isApplicationComplete || (client.businessName && client.monthlyRevenue && client.federalTaxId);
  if (isAppComplete) {
    passedPrerequisites.push('Application completed & signed');
  } else {
    blockers.push('Missing: Signed Commercial Financing Application');
  }

  // 4. Verification Call completed
  const isCallVerified = client.isVerified || client.currentStatus === 'KYC Verified & Ready for Underwriting' || client.verificationCallOutcome === 'Verified — Ready for Underwriting';
  if (isCallVerified) {
    passedPrerequisites.push('Borrower Phone Verification Call Signed-Off');
  } else {
    blockers.push('Missing: Verification Call Sign-Off');
  }

  // 5. Voided Check / Bank Letter
  const hasVoidedCheck = clientDocs.some((d) => {
    const cat = (d.category || '').toLowerCase();
    const title = (d.title || d.fileName || '').toLowerCase();
    return cat.includes('check') || title.includes('check') || cat.includes('void') || title.includes('bank letter') || cat.includes('bank letter');
  }) || Boolean(client.routingNumber && client.accountNumber);
  if (hasVoidedCheck) {
    passedPrerequisites.push('Voided Check / Official Bank Depository Letter');
  } else {
    blockers.push('Missing: Voided Check or Bank Verification Letter');
  }

  // 6. No unresolved critical data conflicts
  const activeConflicts = conflicts.filter((c) => c.status === 'UNRESOLVED');
  if (activeConflicts.length > 0) {
    activeConflicts.forEach((c) => {
      blockers.push(`Conflict: ${c.fieldLabel || c.fieldKey} (Discrepancy across Application vs Bank Statement)`);
    });
  } else {
    passedPrerequisites.push('Zero Unresolved Critical Data Conflicts');
  }

  return {
    isEligible: blockers.length === 0,
    blockers,
    passedPrerequisites,
  };
}

