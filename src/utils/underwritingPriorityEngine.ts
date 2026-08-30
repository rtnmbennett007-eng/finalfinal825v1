import { Client, FundingDeal, DocumentItem, ConflictItem, RiskFlagItem, MasterVerificationData } from '../types';
import { evaluateFundingReadiness, evaluateReadyForUnderwriting, generateDealRiskFlags, detectDealConflicts } from './riskEvaluationEngine';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type UnderwritingQueueCategory =
  | 'ALL'
  | 'NEEDS_ATTENTION'
  | 'UP_NEXT'
  | 'IN_REVIEW'
  | 'WAITING_CLIENT'
  | 'WAITING_DOCS'
  | 'WAITING_FUNDER'
  | 'WAITING_VERIFICATION'
  | 'WAITING_CONDITIONS'
  | 'READY_FOR_UNDERWRITING'
  | 'UNDERWRITING_IN_PROGRESS'
  | 'APPROVED_NOT_FUNDED'
  | 'READY_TO_FUND'
  | 'FUNDED'
  | 'COMPLETED';

export interface DealUnderwritingAnalysis {
  deal: FundingDeal;
  position: string;
  requestedAmount: number;
  approvedAmount: number;
  fundedAmount: number;
  product: string;
  funder: string;
  termLength: string;
  payment: number;
  status: string;
  stage: string;
  underwritingStatus: string;
  verificationStatus: string;
  documentStatus: string;
  readinessScore: number;
  isReadyToFund: boolean;
  isReadyForUnderwriting: boolean;
  priority: PriorityLevel;
  priorityReason: string;
  nextAction: string;
  lastActivity: string;
  isStale: boolean;
  daysInactive: number;
  commissionConfigured: boolean;
}

export interface ClientUnderwritingSummary {
  client: Client;
  deals: DealUnderwritingAnalysis[];
  rawDeals: FundingDeal[];
  totalDealsCount: number;
  totalRequestedAmount: number;
  totalApprovedAmount: number;
  totalFundedAmount: number;
  remainingCapitalNeed: number;
  overallUnderwritingStatus: string;
  overallPriority: PriorityLevel;
  primaryPriorityReason: string;
  nextAction: string;
  lastActivity: string;
  isStale: boolean;
  daysInactive: number;
  assignedUnderwriter: string;
  missingDocumentsCount: number;
  missingRequiredDocs: string[];
  unresolvedConflictsCount: number;
  activeCriticalRiskCount: number;
  estimatedMonthlyDebtService: number;
  stackingRiskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  waitingState: 'NONE' | 'WAITING_CLIENT' | 'WAITING_DOCS' | 'WAITING_FUNDER' | 'WAITING_VERIFICATION' | 'WAITING_CONDITIONS';
  hasReadyToFundDeal: boolean;
  hasReadyForUnderwritingDeal: boolean;
  hasApprovedNotFundedDeal: boolean;
  hasFundedDeal: boolean;
  strategySummary: {
    whyThisDealExists: string;
    whatThisDealAccomplishes: string;
    whatHasAlreadyBeenFunded: string;
    whatIsNext: string;
    whatRemainsToBeFunded: string;
    whatRisksTheStackCreates: string;
    whatDocumentsAreStillNeeded: string;
    whatTheUnderwriterNeedsToDoNext: string;
  };
}

/**
 * Calculates how many days have elapsed since a given date
 */
export function getDaysSince(dateString?: string): number {
  if (!dateString) return 0;
  const time = new Date(dateString).getTime();
  if (isNaN(time)) return 0;
  const diff = Date.now() - time;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Analyzes a single deal for underwriting status, priority, and next action
 */
export function analyzeDealUnderwriting(
  deal: FundingDeal,
  client: Client,
  documents: DocumentItem[] = [],
  conflicts: ConflictItem[] = []
): DealUnderwritingAnalysis {
  const clientDocs = documents.filter((d) => d.clientId === client.id);
  const dealDocs = clientDocs.filter((d) => !d.dealId || d.dealId === deal.id);

  // Evaluate flags & readiness
  const riskFlags: RiskFlagItem[] = generateDealRiskFlags(deal, client, undefined, dealDocs);
  const detectedConflicts: ConflictItem[] = conflicts.length > 0 ? conflicts : detectDealConflicts(deal, client, dealDocs);
  const readyForUnderwritingResult = evaluateReadyForUnderwriting(client, deal, clientDocs, detectedConflicts);
  const readinessResult = evaluateFundingReadiness(deal, client, dealDocs, undefined, riskFlags, []);

  const activeCritical = riskFlags.filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE');
  const activeHigh = riskFlags.filter((f) => f.severity === 'HIGH' && f.status === 'ACTIVE');
  const unresolvedConflicts = detectedConflicts.filter((c) => c.status === 'UNRESOLVED');

  const requestedAmount = deal.requestedAmount || deal.fundingAmount || client.requestedAmount || 50000;
  const approvedAmount = deal.approvedAmount || (deal.status === 'Approved' || deal.status === 'Ready to Fund' || deal.status === 'Funded' ? requestedAmount : 0);
  const isFunded = deal.status === 'Funded' || deal.status === 'Closed' || deal.status === 'Commission Received';
  const fundedAmount = isFunded ? (deal.fundingAmount || approvedAmount || requestedAmount) : 0;

  const lastUpdated = deal.updatedAt || deal.createdAt || client.updatedAt || client.createdAt || new Date().toISOString();
  const daysInactive = getDaysSince(lastUpdated);
  const isStale = daysInactive >= 7 && !isFunded;

  const commissionConfigured = Boolean(deal.percentage && deal.percentage > 0);

  // Calculate Verification Status
  let verificationStatus = 'UNVERIFIED';
  if (client.isVerified || client.currentStatus === 'KYC Verified & Ready for Underwriting') {
    verificationStatus = 'VERIFIED';
  } else if (client.verificationCallOutcome) {
    verificationStatus = 'IN_PROGRESS';
  }

  // Calculate Document Status
  const bankStatementsCount = clientDocs.filter((d) => {
    const cat = (d.category || '').toLowerCase();
    const title = (d.title || d.fileName || '').toLowerCase();
    return cat.includes('bank') || title.includes('bank') || title.includes('statement');
  }).length;

  let documentStatus = 'COMPLETE';
  if (bankStatementsCount < 3) {
    documentStatus = 'MISSING_STATEMENTS';
  } else if (!clientDocs.some((d) => (d.category || '').toLowerCase().includes('id') || (d.category || '').toLowerCase().includes('license'))) {
    documentStatus = 'MISSING_ID';
  } else if (!clientDocs.some((d) => (d.category || '').toLowerCase().includes('void') || (d.category || '').toLowerCase().includes('check'))) {
    documentStatus = 'MISSING_VOIDED_CHECK';
  }

  // Calculate Priority & Reason
  let priority: PriorityLevel = 'MEDIUM';
  let priorityReason = 'Standard underwriting queue';

  if (activeCritical.length > 0) {
    priority = 'CRITICAL';
    priorityReason = `${activeCritical.length} critical risk flag(s) requiring immediate underwriter waiver/mitigation`;
  } else if (unresolvedConflicts.length > 0) {
    priority = 'CRITICAL';
    priorityReason = `Unresolved data conflict on ${unresolvedConflicts[0].fieldLabel || unresolvedConflicts[0].fieldKey}`;
  } else if (deal.status === 'Approved' && !commissionConfigured) {
    priority = 'HIGH';
    priorityReason = 'Approved deal waiting for manual commission points entry';
  } else if (deal.status === 'Approved' && !readinessResult.isReady) {
    priority = 'HIGH';
    priorityReason = `Approved deal waiting on ${readinessResult.blockingIssuesCount} closing condition(s)`;
  } else if (readinessResult.isReady && deal.status !== 'Funded') {
    priority = 'CRITICAL';
    priorityReason = '100% Ready to Fund — Awaiting wire / closing release';
  } else if (readyForUnderwritingResult.isEligible && (deal.status === 'Underwriting' || deal.status === 'Application Received' || deal.status === 'New Lead')) {
    priority = 'HIGH';
    priorityReason = 'Ready for Underwriting — All pre-checks satisfied';
  } else if (readyForUnderwritingResult.blockers.length > 0 && (deal.status === 'Underwriting' || deal.status === 'Draft')) {
    priority = 'HIGH';
    priorityReason = readyForUnderwritingResult.blockers[0];
  } else if (isStale) {
    priority = 'HIGH';
    priorityReason = `Stale underwriting activity (${daysInactive} days without update)`;
  } else if (isFunded) {
    priority = 'LOW';
    priorityReason = 'Deal successfully funded & active';
  }

  // Calculate Next Action
  let nextAction = 'Review Underwriting File';
  if (!client.isVerified) {
    nextAction = 'Complete Verification Call';
  } else if (documentStatus === 'MISSING_STATEMENTS') {
    nextAction = `Request Missing Bank Statements (${bankStatementsCount}/4 in vault)`;
  } else if (documentStatus === 'MISSING_ID') {
    nextAction = 'Upload Borrower Photo ID';
  } else if (documentStatus === 'MISSING_VOIDED_CHECK') {
    nextAction = 'Obtain Voided Business Check / Bank Letter';
  } else if (unresolvedConflicts.length > 0) {
    nextAction = `Resolve Conflict on ${unresolvedConflicts[0].fieldLabel || unresolvedConflicts[0].fieldKey}`;
  } else if (activeCritical.length > 0) {
    nextAction = 'Mitigate / Waive Critical Risk Flags';
  } else if (readyForUnderwritingResult.isEligible && deal.status !== 'Approved' && deal.status !== 'Ready to Fund' && deal.status !== 'Funded') {
    nextAction = 'Perform Cash Flow & Credit Underwrite';
  } else if (deal.status === 'Approved' && !commissionConfigured) {
    nextAction = 'Enter Mandatory Commission Points & Fee';
  } else if (deal.status === 'Approved' && !readinessResult.isReady) {
    nextAction = 'Satisfy Outstanding Closing Stipulations';
  } else if (readinessResult.isReady && deal.status !== 'Funded') {
    nextAction = 'Execute Ready to Fund Release';
  } else if (isFunded) {
    nextAction = 'No Action Required (Position Funded)';
  }

  return {
    deal,
    position: deal.position || '1st Position',
    requestedAmount,
    approvedAmount,
    fundedAmount,
    product: deal.product || 'Revenue Funding',
    funder: deal.lenderName || 'Maple Direct Capital',
    termLength: deal.termLength || '12 Months',
    payment: deal.paymentAmount || Math.round(requestedAmount * 0.09),
    status: deal.status || 'Underwriting',
    stage: (deal as any).stage || deal.status || 'Underwriting',
    underwritingStatus: deal.underwritingStatus || (deal.status === 'Ready to Fund' ? 'READY_TO_FUND' : deal.status === 'Approved' ? 'APPROVED' : deal.status === 'Funded' ? 'FUNDED' : 'IN_REVIEW'),
    verificationStatus,
    documentStatus,
    readinessScore: readinessResult.readinessScore,
    isReadyToFund: readinessResult.isReady,
    isReadyForUnderwriting: readyForUnderwritingResult.isEligible,
    priority,
    priorityReason,
    nextAction,
    lastActivity: lastUpdated,
    isStale,
    daysInactive,
    commissionConfigured,
  };
}

/**
 * Aggregates all client deals and produces a comprehensive Client Underwriting Summary
 */
export function analyzeClientUnderwriting(
  client: Client,
  clientDeals: FundingDeal[],
  documents: DocumentItem[] = [],
  conflicts: ConflictItem[] = [],
  masterVerification?: MasterVerificationData | null
): ClientUnderwritingSummary {
  const clientDocs = documents.filter((d) => d.clientId === client.id);

  // If no deals exist, create fallback deal representation
  const rawDeals = clientDeals.length > 0
    ? clientDeals
    : [
        {
          id: `deal-${client.id}`,
          dealId: `DL-${client.id.slice(0, 6).toUpperCase()}`,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          businessName: client.businessName || 'Commercial Entity',
          product: client.requestedProduct || 'Revenue Funding',
          requestedAmount: client.requestedAmount || 50000,
          fundingAmount: client.requestedAmount || 50000,
          approvedAmount: client.recommendedAmount || client.requestedAmount || 50000,
          status: (client.isUnderwritten ? 'Ready to Fund' : 'Underwriting') as any,
          assignedStaff: client.assignedStaff || 'Dana',
          lenderName: 'Direct Commercial Partner',
          position: '1st Position',
          termLength: '12 Months',
          fee: 0,
          percentage: 10,
          commissionStatus: 'PENDING',
          createdAt: client.createdAt || new Date().toISOString(),
          updatedAt: client.updatedAt || new Date().toISOString(),
        } as FundingDeal,
      ];

  const analyzedDeals = rawDeals.map((d) => analyzeDealUnderwriting(d, client, clientDocs, conflicts));

  // Compute Totals
  const totalDealsCount = analyzedDeals.length;
  const totalRequestedAmount = analyzedDeals.reduce((sum, d) => sum + d.requestedAmount, 0);
  const totalApprovedAmount = analyzedDeals.reduce((sum, d) => sum + d.approvedAmount, 0);
  const totalFundedAmount = analyzedDeals.reduce((sum, d) => sum + d.fundedAmount, 0);
  const remainingCapitalNeed = Math.max(0, (client.requestedAmount || totalRequestedAmount) - totalFundedAmount);

  // Estimated Monthly Debt Service
  const estimatedMonthlyDebtService = analyzedDeals.reduce((sum, d) => sum + (d.payment || 0), 0);

  // Calculate Stacking Risk
  const monthlyRevenue = client.monthlyRevenue || (client.annualRevenue ? Math.round(client.annualRevenue / 12) : 45000);
  const debtToRevenueRatio = monthlyRevenue > 0 ? estimatedMonthlyDebtService / monthlyRevenue : 0;

  let stackingRiskLevel: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' = 'LOW';
  if (totalDealsCount >= 4 || debtToRevenueRatio > 0.35) {
    stackingRiskLevel = 'HIGH';
  } else if (totalDealsCount === 3 || debtToRevenueRatio > 0.25) {
    stackingRiskLevel = 'ELEVATED';
  } else if (totalDealsCount === 2 || debtToRevenueRatio > 0.15) {
    stackingRiskLevel = 'MODERATE';
  }

  // Missing Documents
  const missingRequiredDocs: string[] = [];
  const bankStatements = clientDocs.filter((d) => (d.category || '').toLowerCase().includes('bank') || (d.title || '').toLowerCase().includes('statement'));
  if (bankStatements.length < 3) {
    missingRequiredDocs.push(`${3 - bankStatements.length} more month(s) of Bank Statements`);
  }
  if (!clientDocs.some((d) => (d.category || '').toLowerCase().includes('id') || (d.category || '').toLowerCase().includes('license'))) {
    missingRequiredDocs.push('Government Photo ID');
  }
  if (!clientDocs.some((d) => (d.category || '').toLowerCase().includes('void') || (d.category || '').toLowerCase().includes('check'))) {
    missingRequiredDocs.push('Voided Business Check / Bank Letter');
  }
  const missingDocumentsCount = missingRequiredDocs.length;

  // Unresolved Conflicts & Critical Risks
  const activeConflicts = conflicts.filter((c) => c.status === 'UNRESOLVED');
  const allCriticalFlags = analyzedDeals.flatMap((d) => generateDealRiskFlags(d.deal, client, undefined, clientDocs)).filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE');

  // Calculate Overall Priority
  const hasCritical = analyzedDeals.some((d) => d.priority === 'CRITICAL') || activeConflicts.length > 0 || allCriticalFlags.length > 0;
  const hasHigh = analyzedDeals.some((d) => d.priority === 'HIGH') || missingDocumentsCount > 0 || !client.isVerified;
  const hasMedium = analyzedDeals.some((d) => d.priority === 'MEDIUM');

  let overallPriority: PriorityLevel = 'LOW';
  if (hasCritical) overallPriority = 'CRITICAL';
  else if (hasHigh) overallPriority = 'HIGH';
  else if (hasMedium) overallPriority = 'MEDIUM';

  // Primary Priority Reason
  let primaryPriorityReason = 'Standard client file';
  if (allCriticalFlags.length > 0) {
    primaryPriorityReason = `${allCriticalFlags.length} critical risk flag(s) active on deal stack`;
  } else if (activeConflicts.length > 0) {
    primaryPriorityReason = `Unresolved conflict on ${activeConflicts[0].fieldLabel || activeConflicts[0].fieldKey}`;
  } else if (!client.isVerified) {
    primaryPriorityReason = 'Borrower verification call incomplete';
  } else if (missingDocumentsCount > 0) {
    primaryPriorityReason = `${missingDocumentsCount} required document(s) missing from vault`;
  } else {
    const priorityDeal = analyzedDeals.find((d) => d.priority === overallPriority) || analyzedDeals[0];
    if (priorityDeal) primaryPriorityReason = priorityDeal.priorityReason;
  }

  // Next Action
  let nextAction = 'Review Client Underwriting File';
  if (!client.isVerified) {
    nextAction = 'Complete Borrower Verification Call';
  } else if (missingDocumentsCount > 0) {
    nextAction = `Request Missing Documents (${missingRequiredDocs[0]})`;
  } else if (activeConflicts.length > 0) {
    nextAction = `Resolve Conflict on ${activeConflicts[0].fieldLabel || activeConflicts[0].fieldKey}`;
  } else {
    const actionDeal = analyzedDeals.find((d) => d.nextAction !== 'No Action Required (Position Funded)') || analyzedDeals[0];
    if (actionDeal) nextAction = actionDeal.nextAction;
  }

  // Determine Waiting State
  let waitingState: 'NONE' | 'WAITING_CLIENT' | 'WAITING_DOCS' | 'WAITING_FUNDER' | 'WAITING_VERIFICATION' | 'WAITING_CONDITIONS' = 'NONE';
  if (missingDocumentsCount > 0) {
    waitingState = 'WAITING_DOCS';
  } else if (!client.isVerified) {
    waitingState = 'WAITING_VERIFICATION';
  } else if (analyzedDeals.some((d) => d.status === 'Submitted' || d.stage === 'Submission')) {
    waitingState = 'WAITING_FUNDER';
  } else if (analyzedDeals.some((d) => d.status === 'Approved' && !d.isReadyToFund)) {
    waitingState = 'WAITING_CONDITIONS';
  } else if (
    client.currentStatus === 'NEW_LEAD' ||
    client.currentStatus === 'APPLICATION_RECEIVED' ||
    String(client.currentStatus) === 'New Lead' ||
    String(client.currentStatus) === 'Application Received'
  ) {
    waitingState = 'WAITING_CLIENT';
  }

  // Deal Stage Flags
  const hasReadyToFundDeal = analyzedDeals.some((d) => d.isReadyToFund && d.status !== 'Funded');
  const hasReadyForUnderwritingDeal = analyzedDeals.some((d) => d.isReadyForUnderwriting && d.status !== 'Approved' && d.status !== 'Ready to Fund' && d.status !== 'Funded');
  const hasApprovedNotFundedDeal = analyzedDeals.some((d) => (d.status === 'Approved' || d.underwritingStatus === 'APPROVED') && d.status !== 'Funded');
  const hasFundedDeal = analyzedDeals.some((d) => d.status === 'Funded' || d.fundedAmount > 0);

  // Overall Underwriting Status
  let overallUnderwritingStatus = 'UNDERWRITING_IN_PROGRESS';
  if (hasReadyToFundDeal) overallUnderwritingStatus = 'READY_TO_FUND';
  else if (hasApprovedNotFundedDeal) overallUnderwritingStatus = 'APPROVED_NOT_FUNDED';
  else if (hasReadyForUnderwritingDeal) overallUnderwritingStatus = 'READY_FOR_UNDERWRITING';
  else if (waitingState === 'WAITING_DOCS') overallUnderwritingStatus = 'WAITING_ON_DOCUMENTS';
  else if (waitingState === 'WAITING_VERIFICATION') overallUnderwritingStatus = 'WAITING_ON_VERIFICATION';
  else if (hasFundedDeal && analyzedDeals.every((d) => d.status === 'Funded')) overallUnderwritingStatus = 'FULLY_FUNDED';
  else if (hasFundedDeal) overallUnderwritingStatus = 'PARTIALLY_FUNDED';

  // Last Activity & Inactivity
  const mostRecentTimestamp = analyzedDeals.reduce((latest, d) => {
    const t = new Date(d.lastActivity).getTime();
    return t > latest ? t : latest;
  }, new Date(client.updatedAt || client.createdAt || Date.now()).getTime());

  const lastActivity = new Date(mostRecentTimestamp).toISOString();
  const daysInactive = getDaysSince(lastActivity);
  const isStale = daysInactive >= 7 && !analyzedDeals.every((d) => d.status === 'Funded');

  // Strategy Narrative Construction
  const fundedDeals = analyzedDeals.filter((d) => d.status === 'Funded' || d.fundedAmount > 0);
  const pendingDeals = analyzedDeals.filter((d) => d.status !== 'Funded');

  const strategySummary = {
    whyThisDealExists: `Client is seeking $${(client.requestedAmount || totalRequestedAmount).toLocaleString()} for ${client.useOfFunds || 'working capital expansion, payroll optimization, and inventory purchasing'} supporting ${client.businessName || 'the commercial enterprise'}.`,
    whatThisDealAccomplishes: `Establishes a structured multi-position capital stack across ${totalDealsCount} tranches to minimize blended factor rate and ensure debt service stays well within historical cash flow capacity of $${monthlyRevenue.toLocaleString()}/mo.`,
    whatHasAlreadyBeenFunded: fundedDeals.length > 0
      ? `$${totalFundedAmount.toLocaleString()} funded across ${fundedDeals.length} position(s): ${fundedDeals.map((d) => `${d.position} (${d.product} - $${d.fundedAmount.toLocaleString()})`).join(', ')}.`
      : 'No funding tranches have funded yet. Stack is in active underwriting and approval stages.',
    whatIsNext: pendingDeals.length > 0
      ? `Process ${pendingDeals[0].position} (${pendingDeals[0].product}) through ${pendingDeals[0].nextAction}.`
      : 'All current positions funded. Monitor borrower performance for future line expansions.',
    whatRemainsToBeFunded: remainingCapitalNeed > 0
      ? `$${remainingCapitalNeed.toLocaleString()} in remaining target capital needed to fulfill client's $${(client.requestedAmount || totalRequestedAmount).toLocaleString()} capital goal.`
      : '$0 remaining — Client funding goal 100% fulfilled.',
    whatRisksTheStackCreates: stackingRiskLevel === 'HIGH' || stackingRiskLevel === 'ELEVATED'
      ? `Elevated debt service risk ($${estimatedMonthlyDebtService.toLocaleString()}/mo across ${totalDealsCount} positions, representing ${(debtToRevenueRatio * 100).toFixed(1)}% of monthly revenue). Requires strict monitoring of daily bank balances.`
      : `Low stacking risk ($${estimatedMonthlyDebtService.toLocaleString()}/mo debt service represents ${(debtToRevenueRatio * 100).toFixed(1)}% of $${monthlyRevenue.toLocaleString()}/mo revenue).`,
    whatDocumentsAreStillNeeded: missingDocumentsCount > 0
      ? `Missing ${missingDocumentsCount} document(s): ${missingRequiredDocs.join(', ')}.`
      : 'All core tier-1 verification documents (Bank statements, ID, Voided Check) are present in Document Vault.',
    whatTheUnderwriterNeedsToDoNext: nextAction,
  };

  return {
    client,
    deals: analyzedDeals,
    rawDeals,
    totalDealsCount,
    totalRequestedAmount,
    totalApprovedAmount,
    totalFundedAmount,
    remainingCapitalNeed,
    overallUnderwritingStatus,
    overallPriority,
    primaryPriorityReason,
    nextAction,
    lastActivity,
    isStale,
    daysInactive,
    assignedUnderwriter: client.assignedStaff || (rawDeals[0] && rawDeals[0].assignedStaff) || 'Dana Javier',
    missingDocumentsCount,
    missingRequiredDocs,
    unresolvedConflictsCount: activeConflicts.length,
    activeCriticalRiskCount: allCriticalFlags.length,
    estimatedMonthlyDebtService,
    stackingRiskLevel,
    waitingState,
    hasReadyToFundDeal,
    hasReadyForUnderwritingDeal,
    hasApprovedNotFundedDeal,
    hasFundedDeal,
    strategySummary,
  };
}
