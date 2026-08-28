import { FundingDeal, CommissionParticipant, CanonicalDealStatus } from '../types';

export type CanonicalDealCategory =
  | 'PROPOSED'       // Initial lead / draft / application stage
  | 'PRE_APPROVED'   // Qualified / Pre-Approved / Approved / Stacking / Ready to Fund (Active Pipeline)
  | 'FUNDED'         // Closed / Funded / Active Capital / Paid Off
  | 'INACTIVE';      // Declined / Rejected / Withdrawn / Lost / Cancelled

export interface ParticipantFinancialSummary {
  participantId?: string;
  name: string;
  type: string;
  role?: string;
  points: number;
  dollarAmount: number;
  status: CommissionParticipant['status'] | 'APPROVED' | 'PAID' | 'DISPUTED';
  isReceived: boolean;
}

export interface DealFinancialSummary {
  dealId: string;
  clientId: string;
  clientName: string;
  businessName: string;
  product: string;
  rawStatus: string;
  normalizedStatus: string;
  category: CanonicalDealCategory;
  lenderName: string;
  position: string;
  isStacked: boolean;

  // Amounts
  fundingAmount: number;
  requestedAmount: number;
  approvedAmount: number;
  fundedAmount: number;

  // Category flags
  inActivePipeline: boolean; // Strictly PRE-APPROVED & Not Funded / Not Inactive
  isFunded: boolean;
  isProposed: boolean;
  isInactive: boolean;

  // Commission inputs
  percentage?: number;
  fee?: number;
  hasPercentage: boolean;
  hasFee: boolean;
  hasCommission: boolean;

  // Commission outputs
  percentageCommission: number;
  feeCommission: number;
  grossCommission: number;

  // Metric-specific commissions
  predictedCommission: number;       // grossCommission if inActivePipeline, else 0
  fundedCommission: number;          // grossCommission if isFunded, else 0
  alreadyCollectedCommission: number; // Actual collected
  toBeCollectedCommission: number;   // Remaining on funded deals

  // Participant Distribution
  totalAllocatedPoints: number;
  totalAllocatedDollars: number;
  unallocatedPoints: number;
  unallocatedDollars: number;
  companyRetainedDollars: number;
  isFullyAllocated: boolean;
  isOverAllocated: boolean;
  participants: ParticipantFinancialSummary[];

  // Original Reference
  deal: FundingDeal;

  // Audit Breakdown
  auditBreakdown: {
    amountFormula: string;
    commissionFormula: string;
    collectionBasis: string;
    qualifyingReason: string;
  };
}

export interface AggregateFinancialsResult {
  // Primary Metrics
  activePipelineVolume: number;
  activePipelineCount: number;
  totalFundedVolume: number;
  totalFundedCount: number;
  proposedVolume: number;
  proposedCount: number;
  totalPortfolioVolume: number;

  // Commission Metrics
  commissionPrediction: number;     // On Active Pipeline (Pre-Approved) deals ONLY
  commissionExpected: number;       // Total expected across all deals with commission
  commissionToBeCollected: number; // On Funded deals with remaining balance
  commissionCollected: number;     // Actual money received/collected

  // Lists for Inspection & Drilldown
  activePipelineDeals: DealFinancialSummary[];
  fundedDeals: DealFinancialSummary[];
  proposedDeals: DealFinancialSummary[];
  uncollectedFundedDeals: DealFinancialSummary[];
  collectedDeals: DealFinancialSummary[];
  allDealSummaries: DealFinancialSummary[];
}

/**
 * Normalizes any deal status string to upper snake case for robust matching.
 */
export function normalizeDealStatus(status?: string | null): string {
  if (!status) return '';
  return status.toUpperCase().trim().replace(/[-\s/]+/g, '_');
}

/**
 * Categorizes deal into one of 4 canonical financial lifecycle stages:
 * - PROPOSED (Draft, Submitted, New Application)
 * - PRE_APPROVED (Pre-Approved, Underwriting, Approved, Conditions, Stacking, Ready to Fund)
 * - FUNDED (Funded, Closed, Paid Off, Renewed)
 * - INACTIVE (Declined, Rejected, Withdrawn, Lost, Cancelled, Not Qualified)
 */
export function categorizeDealStatus(status?: string | null): CanonicalDealCategory {
  const norm = normalizeDealStatus(status);
  if (!norm) return 'PROPOSED';

  // 1. INACTIVE
  if (
    norm.includes('DECLINED') ||
    norm.includes('REJECTED') ||
    norm.includes('NOT_QUALIFIED') ||
    norm.includes('LOST') ||
    norm.includes('WITHDRAWN') ||
    norm.includes('CANCELLED') ||
    norm.includes('CANCELED') ||
    norm.includes('EXPIRED') ||
    norm.includes('ARCHIVED') ||
    norm.includes('DQ')
  ) {
    return 'INACTIVE';
  }

  // 2. FUNDED
  if (
    norm === 'FUNDED' ||
    norm.includes('CLOSED') ||
    norm.includes('PAID_OFF') ||
    norm.includes('RENEWED') ||
    norm.includes('COMMISSION_PENDING') ||
    norm.includes('COMMISSION_RECEIVED')
  ) {
    return 'FUNDED';
  }

  // 3. PRE-APPROVED (Active Pipeline)
  if (
    norm.includes('PRE_APPROVED') ||
    norm.includes('PRE_APPROVAL') ||
    norm.includes('PRE_QUALIFIED') ||
    norm.includes('APPROVED') ||
    norm.includes('CONDITIONS') ||
    norm.includes('STIPS') ||
    norm.includes('READY_TO_FUND') ||
    norm.includes('CLEAR_TO_CLOSE') ||
    norm.includes('CLOSING_DOCS') ||
    norm.includes('PRE_CLOSING') ||
    norm.includes('READY_FOR_LENDER') ||
    norm.includes('STACKING') ||
    norm.includes('UNDERWRITING') ||
    norm.includes('IN_REVIEW') ||
    norm.includes('KYC_VERIFIED') ||
    norm.includes('VERIFICATION_CALL')
  ) {
    return 'PRE_APPROVED';
  }

  // 4. PROPOSED (Draft / Initial Intake)
  return 'PROPOSED';
}

/**
 * Checks if a deal belongs to the ACTIVE PIPELINE.
 * Active Pipeline STRICTLY includes Pre-Approved deals moving toward funding.
 */
export function isDealInActivePipeline(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  return categorizeDealStatus(deal.status) === 'PRE_APPROVED';
}

/**
 * Checks if a deal is FUNDED.
 */
export function isDealFunded(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  return categorizeDealStatus(deal.status) === 'FUNDED';
}

/**
 * Checks if a deal is PROPOSED / Draft.
 */
export function isDealProposed(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  return categorizeDealStatus(deal.status) === 'PROPOSED';
}

/**
 * Checks if a deal is Inactive / Closed-Lost.
 */
export function isDealInactive(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  return categorizeDealStatus(deal.status) === 'INACTIVE';
}

/**
 * Resolves the canonical funding volume of a deal based on status priority.
 */
export function resolveDealFundingAmount(deal: Partial<FundingDeal>): number {
  if (!deal) return 0;
  const category = categorizeDealStatus(deal.status);

  if (category === 'FUNDED') {
    return Math.max(0, Number(deal.fundedAmount ?? deal.fundingAmount ?? 0) || 0);
  }
  if (category === 'PRE_APPROVED') {
    return Math.max(0, Number(deal.approvedAmount ?? deal.fundingAmount ?? deal.requestedAmount ?? 0) || 0);
  }
  // Proposed / Inactive fallback
  return Math.max(0, Number(deal.fundingAmount ?? deal.requestedAmount ?? deal.approvedAmount ?? 0) || 0);
}

/**
 * Master calculation function for a single deal and its participant splits.
 * Single source of truth across Dashboard, Client 360, Funding Desk, Underwriting, and Reports.
 */
export function calculateDealFinancials(
  deal: FundingDeal,
  participants: CommissionParticipant[] = []
): DealFinancialSummary {
  const dealId = deal.id || deal.dealId || 'UNKNOWN_DEAL';
  const clientId = deal.clientId || '';
  const clientName = deal.clientName || 'Unknown Client';
  const businessName = deal.businessName || clientName;
  const product = deal.product || 'Funding Product';
  const rawStatus = deal.status || 'Draft';
  const normalizedStatus = normalizeDealStatus(rawStatus);
  const category = categorizeDealStatus(rawStatus);
  const lenderName = deal.lenderName || deal.funder || 'Lender Desk';
  const position = deal.position || (deal.isStacked ? 'Stacked' : '1st Position');
  const isStacked = Boolean(deal.isStacked);

  // Amounts
  const fundingAmount = resolveDealFundingAmount(deal);
  const requestedAmount = Math.max(0, Number(deal.requestedAmount) || 0);
  const approvedAmount = Math.max(0, Number(deal.approvedAmount) || 0);
  const fundedAmount = Math.max(0, Number(deal.fundedAmount) || 0);

  // Stage flags
  const inActivePipeline = category === 'PRE_APPROVED';
  const isFunded = category === 'FUNDED';
  const isProposed = category === 'PROPOSED';
  const isInactive = category === 'INACTIVE';

  // Commission Inputs (No fake defaults)
  const rawPct = deal.percentage;
  const hasPercentage =
    rawPct !== undefined &&
    rawPct !== null &&
    String(rawPct).trim() !== '' &&
    !isNaN(Number(rawPct)) &&
    Number(rawPct) > 0;
  const percentage = hasPercentage ? Number(rawPct) : undefined;

  const rawFee = deal.fee;
  const hasFee =
    rawFee !== undefined &&
    rawFee !== null &&
    String(rawFee).trim() !== '' &&
    !isNaN(Number(rawFee)) &&
    Number(rawFee) > 0;
  const fee = hasFee ? Number(rawFee) : undefined;

  const percentageCommission = hasPercentage ? (fundingAmount * (percentage || 0)) / 100 : 0;
  const feeCommission = hasFee ? (fee || 0) : 0;
  const grossCommission = percentageCommission + feeCommission;
  const hasCommission = hasPercentage || hasFee;

  // Metric-specific calculations
  const predictedCommission = inActivePipeline ? grossCommission : 0;
  const fundedCommission = isFunded ? grossCommission : 0;

  // Distribution & Participants
  const dealParticipants = participants.filter((p) => p.dealId === deal.id || p.dealId === deal.dealId);

  let totalAllocatedPoints = 0;
  let totalAllocatedDollars = 0;
  let receivedParticipantsDollars = 0;

  const participantSummaries: ParticipantFinancialSummary[] = dealParticipants.map((p) => {
    const points = Math.max(0, Number(p.points) || 0);
    const dollarAmount = p.dollarAmount !== undefined && p.dollarAmount !== null && Number(p.dollarAmount) > 0
      ? Number(p.dollarAmount)
      : (fundingAmount * points) / 100;

    totalAllocatedPoints += points;
    totalAllocatedDollars += dollarAmount;

    const isReceived = p.status === 'RECEIVED';
    if (isReceived) {
      receivedParticipantsDollars += dollarAmount;
    }

    return {
      participantId: p.id,
      name: p.name,
      type: p.type,
      role: p.role,
      points,
      dollarAmount,
      status: p.status,
      isReceived,
    };
  });

  // Calculate actual collected commission
  let alreadyCollectedCommission = 0;
  if (isFunded) {
    if ((deal as any).commissionReceivedAmount !== undefined && (deal as any).commissionReceivedAmount !== null) {
      alreadyCollectedCommission = Math.max(0, Number((deal as any).commissionReceivedAmount) || 0);
    } else if (deal.commissionStatus === 'COLLECTED') {
      alreadyCollectedCommission = grossCommission;
    } else if (receivedParticipantsDollars > 0) {
      alreadyCollectedCommission = receivedParticipantsDollars;
    }
  }

  const toBeCollectedCommission = isFunded ? Math.max(0, grossCommission - alreadyCollectedCommission) : 0;

  // Participant allocation balance
  const dealPct = percentage || 0;
  const unallocatedPoints = Math.max(0, Number((dealPct - totalAllocatedPoints).toFixed(4)));
  const unallocatedDollars = Math.max(0, grossCommission - totalAllocatedDollars);
  const companyRetainedDollars = unallocatedDollars;
  const isFullyAllocated = unallocatedPoints <= 0.0001;
  const isOverAllocated = totalAllocatedPoints > dealPct + 0.0001;

  // Audit formula notes
  const amountFormula = isFunded
    ? `Funded Amount: $${fundingAmount.toLocaleString()} (Status: ${rawStatus})`
    : inActivePipeline
    ? `Pre-Approved Volume: $${fundingAmount.toLocaleString()} (Status: ${rawStatus})`
    : `Proposed/Draft: $${fundingAmount.toLocaleString()} (Status: ${rawStatus})`;

  const commissionFormula = hasPercentage
    ? `$${fundingAmount.toLocaleString()} × ${percentage}%${hasFee ? ` + $${fee?.toLocaleString()} fee` : ''} = $${Math.round(grossCommission).toLocaleString()}`
    : hasFee
    ? `Flat Fee: $${fee?.toLocaleString()}`
    : 'No commission rate entered ($0)';

  const collectionBasis = isFunded
    ? `Collected: $${alreadyCollectedCommission.toLocaleString()} | Remaining: $${toBeCollectedCommission.toLocaleString()} (Status: ${deal.commissionStatus || 'PENDING'})`
    : 'Not Funded — Commission not yet collectible';

  const qualifyingReason = inActivePipeline
    ? 'Qualifies for Active Pipeline and Commission Prediction (Pre-Approved)'
    : isFunded
    ? 'Qualifies for Total Funded and Commission Collection (Funded)'
    : isProposed
    ? 'Classified as Proposed / Lead Intake (Pending Pre-Approval)'
    : 'Inactive Deal (Declined / Withdrawn / Lost)';

  return {
    dealId,
    clientId,
    clientName,
    businessName,
    product,
    rawStatus,
    normalizedStatus,
    category,
    lenderName,
    position,
    isStacked,
    fundingAmount,
    requestedAmount,
    approvedAmount,
    fundedAmount,
    inActivePipeline,
    isFunded,
    isProposed,
    isInactive,
    percentage,
    fee,
    hasPercentage,
    hasFee,
    hasCommission,
    percentageCommission,
    feeCommission,
    grossCommission,
    predictedCommission,
    fundedCommission,
    alreadyCollectedCommission,
    toBeCollectedCommission,
    totalAllocatedPoints,
    totalAllocatedDollars,
    unallocatedPoints,
    unallocatedDollars,
    companyRetainedDollars,
    isFullyAllocated,
    isOverAllocated,
    participants: participantSummaries,
    deal,
    auditBreakdown: {
      amountFormula,
      commissionFormula,
      collectionBasis,
      qualifyingReason,
    },
  };
}

/**
 * Master aggregation engine that processes all deals with zero duplicate counting.
 */
export function calculateAggregateFinancials(
  deals: FundingDeal[] = [],
  commissions: CommissionParticipant[] = []
): AggregateFinancialsResult {
  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeCommissions = Array.isArray(commissions) ? commissions : [];

  let activePipelineVolume = 0;
  let totalFundedVolume = 0;
  let proposedVolume = 0;
  let totalPortfolioVolume = 0;

  let commissionPrediction = 0;
  let commissionExpected = 0;
  let commissionToBeCollected = 0;
  let commissionCollected = 0;

  const activePipelineDeals: DealFinancialSummary[] = [];
  const fundedDeals: DealFinancialSummary[] = [];
  const proposedDeals: DealFinancialSummary[] = [];
  const uncollectedFundedDeals: DealFinancialSummary[] = [];
  const collectedDeals: DealFinancialSummary[] = [];
  const allDealSummaries: DealFinancialSummary[] = [];

  // Prevent duplicate counting by tracking processed deal IDs
  const seenDealIds = new Set<string>();

  for (const deal of safeDeals) {
    if (!deal) continue;
    const uniqueKey = deal.id || deal.dealId || JSON.stringify(deal);
    if (seenDealIds.has(uniqueKey)) continue;
    seenDealIds.add(uniqueKey);

    const summary = calculateDealFinancials(deal, safeCommissions);
    allDealSummaries.push(summary);

    totalPortfolioVolume += summary.fundingAmount;
    commissionExpected += summary.grossCommission;

    // 1. ACTIVE PIPELINE (Strictly Pre-Approved deals)
    if (summary.inActivePipeline) {
      activePipelineDeals.push(summary);
      activePipelineVolume += summary.fundingAmount;
      commissionPrediction += summary.predictedCommission;
    }

    // 2. TOTAL FUNDED (Strictly Funded deals)
    if (summary.isFunded) {
      fundedDeals.push(summary);
      totalFundedVolume += summary.fundingAmount;

      if (summary.toBeCollectedCommission > 0.01) {
        uncollectedFundedDeals.push(summary);
        commissionToBeCollected += summary.toBeCollectedCommission;
      }

      if (summary.alreadyCollectedCommission > 0.01) {
        collectedDeals.push(summary);
        commissionCollected += summary.alreadyCollectedCommission;
      }
    }

    // 3. PROPOSED (Draft / Lead stage deals)
    if (summary.isProposed) {
      proposedDeals.push(summary);
      proposedVolume += summary.fundingAmount;
    }
  }

  // Defensive: check for any detached commission records marked RECEIVED
  for (const cp of safeCommissions) {
    if (cp.status === 'RECEIVED' && cp.dealId && !seenDealIds.has(cp.dealId)) {
      const amt = Number(cp.dollarAmount) || 0;
      if (amt > 0) {
        commissionCollected += amt;
      }
    }
  }

  return {
    activePipelineVolume: Math.round(activePipelineVolume),
    activePipelineCount: activePipelineDeals.length,
    totalFundedVolume: Math.round(totalFundedVolume),
    totalFundedCount: fundedDeals.length,
    proposedVolume: Math.round(proposedVolume),
    proposedCount: proposedDeals.length,
    totalPortfolioVolume: Math.round(totalPortfolioVolume),

    commissionPrediction: Math.round(commissionPrediction),
    commissionExpected: Math.round(commissionExpected),
    commissionToBeCollected: Math.round(commissionToBeCollected),
    commissionCollected: Math.round(commissionCollected),

    activePipelineDeals,
    fundedDeals,
    proposedDeals,
    uncollectedFundedDeals,
    collectedDeals,
    allDealSummaries,
  };
}
