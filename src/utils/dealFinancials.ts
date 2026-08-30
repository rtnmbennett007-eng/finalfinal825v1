import { FundingDeal, CommissionParticipant, CanonicalDealStatus, Client } from '../types';
import { getCanonicalFundingRange } from './fundingUtils';

export type CanonicalDealCategory =
  | 'PROPOSED'       // Initial lead / draft / application stage
  | 'PRE_APPROVED'   // Qualified / Pre-Approved / Approved in Underwriting (Active Pipeline)
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
  fundingAmount: number;     // Canonical resolved financial amount (Approved for Pre-Approved, Funded for Funded)
  approvedAmount: number;    // Approved funding amount
  fundedAmount: number;      // Actual funded disbursement
  
  // Requested Target Range (Client goal context - NEVER SUMMED into pipeline metrics)
  requestedFundingMin: number | null;
  requestedFundingMax: number | null;
  requestedFundingRange: string;

  // Category flags
  inActivePipeline: boolean; // Strictly (Lifecycle == UNDERWRITING) AND (Stage == PRE-APPROVED or APPROVED)
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
  predictedCommission: number;        // grossCommission if inActivePipeline, else 0
  fundedCommission: number;           // grossCommission if isFunded, else 0
  alreadyCollectedCommission: number; // Actual collected
  toBeCollectedCommission: number;    // Remaining on funded deals

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
  activePipelineVolume: number; // Sum of Approved Amounts for deals in Underwriting + Pre-Approved/Approved
  activePipelineCount: number;  // Number of qualifying deals
  totalFundedVolume: number;    // Sum of Funded Amounts for Funded deals
  totalFundedCount: number;     // Number of funded deals
  proposedVolume: number;
  proposedCount: number;
  totalPortfolioVolume: number;

  // Commission Metrics
  commissionPrediction: number;     // On Active Pipeline (Pre-Approved / Approved) deals ONLY
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
 * Normalizes any deal status or lifecycle string to upper snake case for robust matching.
 */
export function normalizeDealStatus(status?: string | null): string {
  if (!status) return '';
  return status.toUpperCase().trim().replace(/[-\s/]+/g, '_');
}

/**
 * Checks if a deal belongs to the ACTIVE PIPELINE according to strict portal rules:
 * Rule 1: Lifecycle Status MUST be UNDERWRITING
 * Rule 2: Funding Stage MUST be PRE-APPROVED OR APPROVED
 *
 * Excludes: LEADS, QUALIFIED, APPLICATION, DOCUMENT SENT, DOCS PENDING, NO SET,
 * APPOINTMENT SET, NO SHOW, SHOWED, CREDIT REPAIR, NOT INTERESTED, DQC,
 * UNDERWRITING without PRE-APPROVED or APPROVED, FUNDED, COMMISSION RECEIVED, LOST,
 * DECLINED, WITHDRAWN, CANCELLED.
 */
export function isDealInActivePipeline(
  deal: Partial<FundingDeal>,
  clientOrClients?: Partial<Client> | Record<string, Client> | Client[]
): boolean {
  if (!deal) return false;

  const rawStatus = normalizeDealStatus(deal.status || deal.fundingStage || deal.lenderStatus);

  // Exclude terminal / non-pipeline stages immediately
  if (
    rawStatus === 'FUNDED' ||
    rawStatus.includes('CLOSED') ||
    rawStatus.includes('PAID_OFF') ||
    rawStatus.includes('DECLINED') ||
    rawStatus.includes('REJECTED') ||
    rawStatus.includes('LOST') ||
    rawStatus.includes('WITHDRAWN') ||
    rawStatus.includes('CANCELLED') ||
    rawStatus.includes('CANCELED') ||
    rawStatus.includes('NOT_QUALIFIED') ||
    rawStatus.includes('EXPIRED') ||
    rawStatus.includes('ARCHIVED') ||
    rawStatus.includes('NOT_INTERESTED') ||
    rawStatus.includes('CREDIT_REPAIR')
  ) {
    return false;
  }

  // Check Funding Stage condition: Pre-Approved OR Approved
  const isStagePreApprovedOrApproved =
    rawStatus === 'PRE_APPROVED' ||
    rawStatus === 'APPROVED' ||
    rawStatus.includes('PRE_APPROVED') ||
    rawStatus.includes('PRE_APPROVAL') ||
    rawStatus.includes('PRE_QUALIFIED') ||
    rawStatus.includes('CLEAR_TO_CLOSE') ||
    rawStatus.includes('CLOSING_DOCS') ||
    rawStatus.includes('READY_TO_FUND') ||
    (rawStatus.includes('APPROVED') && !rawStatus.includes('NOT_APPROVED'));

  if (!isStagePreApprovedOrApproved) {
    return false;
  }

  // Check Lifecycle Status condition: Underwriting
  let lifecycle = normalizeDealStatus(deal.lifecycleStatus || deal.underwritingStatus);

  // Look up client lifecycle status if available
  if (!lifecycle && clientOrClients) {
    if (Array.isArray(clientOrClients)) {
      const foundClient = clientOrClients.find((c) => c.id === deal.clientId);
      if (foundClient) {
        lifecycle = normalizeDealStatus(foundClient.currentStatus);
      }
    } else if (typeof clientOrClients === 'object' && (clientOrClients as any)[deal.clientId || '']) {
      const foundClient = (clientOrClients as any)[deal.clientId || ''];
      lifecycle = normalizeDealStatus(foundClient.currentStatus);
    } else if ((clientOrClients as Client).id === deal.clientId || (clientOrClients as Client).currentStatus) {
      lifecycle = normalizeDealStatus((clientOrClients as Client).currentStatus);
    }
  }

  // If lifecycle is not explicitly set to something conflicting (like LEAD or CLOSED),
  // default to UNDERWRITING for in-flight pre-approved deals
  if (!lifecycle) {
    lifecycle = 'UNDERWRITING';
  }

  const isLifecycleUnderwriting =
    lifecycle.includes('UNDERWRITING') ||
    lifecycle.includes('READY_FOR_LENDER') ||
    lifecycle.includes('KYC_VERIFIED') ||
    lifecycle.includes('IN_REVIEW') ||
    lifecycle.includes('STACKING') ||
    lifecycle === 'QUALIFIED';

  return isStagePreApprovedOrApproved && isLifecycleUnderwriting;
}

/**
 * Checks if a deal is FUNDED.
 */
export function isDealFunded(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  const norm = normalizeDealStatus(deal.status || deal.fundingStage || deal.lenderStatus);
  return (
    norm === 'FUNDED' ||
    norm.includes('CLOSED') ||
    norm.includes('PAID_OFF') ||
    norm.includes('COMMISSION_PENDING') ||
    norm.includes('COMMISSION_RECEIVED')
  );
}

/**
 * Checks if a deal is Inactive / Closed-Lost / Declined / Cancelled.
 */
export function isDealInactive(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  const norm = normalizeDealStatus(deal.status || deal.fundingStage || deal.lenderStatus);
  return (
    norm.includes('DECLINED') ||
    norm.includes('REJECTED') ||
    norm.includes('NOT_QUALIFIED') ||
    norm.includes('LOST') ||
    norm.includes('WITHDRAWN') ||
    norm.includes('CANCELLED') ||
    norm.includes('CANCELED') ||
    norm.includes('EXPIRED') ||
    norm.includes('ARCHIVED') ||
    norm.includes('NOT_INTERESTED')
  );
}

/**
 * Checks if a deal is PROPOSED / Draft.
 */
export function isDealProposed(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  return !isDealFunded(deal) && !isDealInActivePipeline(deal) && !isDealInactive(deal);
}

/**
 * Categorizes deal into one of 4 canonical financial lifecycle stages:
 * - PRE_APPROVED (Active Pipeline: Underwriting + Pre-Approved/Approved)
 * - FUNDED (Funded, Closed, Paid Off)
 * - INACTIVE (Declined, Rejected, Withdrawn, Lost, Cancelled)
 * - PROPOSED (Draft, Submitted, Application Received)
 */
export function categorizeDealStatus(status?: string | null, deal?: Partial<FundingDeal>): CanonicalDealCategory {
  if (deal && isDealFunded(deal)) return 'FUNDED';
  if (deal && isDealInactive(deal)) return 'INACTIVE';
  if (deal && isDealInActivePipeline(deal)) return 'PRE_APPROVED';

  const norm = normalizeDealStatus(status);
  if (!norm) return 'PROPOSED';

  if (
    norm.includes('DECLINED') ||
    norm.includes('REJECTED') ||
    norm.includes('NOT_QUALIFIED') ||
    norm.includes('LOST') ||
    norm.includes('WITHDRAWN') ||
    norm.includes('CANCELLED') ||
    norm.includes('CANCELED') ||
    norm.includes('EXPIRED')
  ) {
    return 'INACTIVE';
  }

  if (
    norm === 'FUNDED' ||
    norm.includes('CLOSED') ||
    norm.includes('PAID_OFF') ||
    norm.includes('COMMISSION_PENDING') ||
    norm.includes('COMMISSION_RECEIVED')
  ) {
    return 'FUNDED';
  }

  if (
    norm.includes('PRE_APPROVED') ||
    norm.includes('PRE_APPROVAL') ||
    norm.includes('APPROVED') ||
    norm.includes('CLEAR_TO_CLOSE') ||
    norm.includes('READY_TO_FUND')
  ) {
    return 'PRE_APPROVED';
  }

  return 'PROPOSED';
}

/**
 * Resolves the Active Pipeline value for a deal.
 * RULE: MUST use the approvedAmount from the deal record.
 * NEVER use requested funding ranges, min, max, or midpoint.
 */
export function resolveActivePipelineDealAmount(deal: Partial<FundingDeal>): number {
  if (!deal) return 0;
  if (!isDealInActivePipeline(deal)) return 0;

  // Use explicit approvedAmount if available
  const approvedAmt = Number(deal.approvedAmount);
  if (!isNaN(approvedAmt) && approvedAmt > 0) {
    return approvedAmt;
  }

  // Fallback to fundingAmount on the deal if approvedAmount is not yet separated
  const fundingAmt = Number(deal.fundingAmount);
  if (!isNaN(fundingAmt) && fundingAmt > 0) {
    return fundingAmt;
  }

  return 0;
}

/**
 * Resolves canonical financial amount for calculation:
 * - Funded deals: uses actual funded amount
 * - Active Pipeline deals: uses approved amount
 * - Proposed / Draft deals: uses proposed amount
 * NEVER uses requested funding range.
 */
export function resolveDealFundingAmount(deal: Partial<FundingDeal>): number {
  if (!deal) return 0;
  if (isDealFunded(deal)) {
    return Math.max(0, Number(deal.fundedAmount ?? deal.fundingAmount ?? 0) || 0);
  }
  if (isDealInActivePipeline(deal)) {
    return resolveActivePipelineDealAmount(deal);
  }
  // Proposed / Draft deal amount
  return Math.max(0, Number(deal.approvedAmount ?? deal.fundingAmount ?? 0) || 0);
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

  // Category determination
  const inActivePipeline = isDealInActivePipeline(deal);
  const isFunded = isDealFunded(deal);
  const isInactive = isDealInactive(deal);
  const isProposed = !inActivePipeline && !isFunded && !isInactive;

  const category: CanonicalDealCategory = isFunded
    ? 'FUNDED'
    : inActivePipeline
    ? 'PRE_APPROVED'
    : isInactive
    ? 'INACTIVE'
    : 'PROPOSED';

  const lenderName = deal.lenderName || deal.funder || 'Lender Desk';
  const position = deal.position || (deal.isStacked ? 'Stacked' : '1st Position');
  const isStacked = Boolean(deal.isStacked);

  // Financial Amounts
  const fundingAmount = resolveDealFundingAmount(deal);
  const approvedAmount = Math.max(0, Number(deal.approvedAmount) || 0);
  const fundedAmount = Math.max(0, Number(deal.fundedAmount) || 0);

  // Requested Funding Target Range (For reference only - never added to pipeline totals)
  const rangeInfo = getCanonicalFundingRange(deal);

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
    const dollarAmount =
      p.dollarAmount !== undefined && p.dollarAmount !== null && Number(p.dollarAmount) > 0
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
    if (
      (deal as any).commissionReceivedAmount !== undefined &&
      (deal as any).commissionReceivedAmount !== null &&
      !isNaN(Number((deal as any).commissionReceivedAmount))
    ) {
      alreadyCollectedCommission = Math.max(0, Number((deal as any).commissionReceivedAmount) || 0);
    } else if (
      (deal.commissionStatus as string) === 'COLLECTED' ||
      (deal.commissionStatus as string) === 'DISTRIBUTED' ||
      (deal.commissionStatus as string) === 'PAID' ||
      (deal.commissionStatus as string) === 'RECEIVED'
    ) {
      alreadyCollectedCommission = grossCommission;
    } else if (receivedParticipantsDollars > 0) {
      alreadyCollectedCommission = receivedParticipantsDollars;
    }
  }

  // Formula: Remaining Commission = max(Expected Commission - Already Collected, 0)
  let toBeCollectedCommission = 0;
  if (isFunded) {
    if (
      (deal.commissionStatus as string) === 'COLLECTED' ||
      (deal.commissionStatus as string) === 'DISTRIBUTED' ||
      (deal.commissionStatus as string) === 'PAID' ||
      (deal.commissionStatus as string) === 'RECEIVED'
    ) {
      toBeCollectedCommission = 0;
    } else {
      const rawRemaining = grossCommission - alreadyCollectedCommission;
      toBeCollectedCommission = rawRemaining > 0.99 ? rawRemaining : 0;
    }
  }

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
    ? `Approved Pre-Approval Amount: $${fundingAmount.toLocaleString()} (Status: ${rawStatus})`
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
    ? 'Qualifies for Active Pipeline and Commission Prediction (Lifecycle: Underwriting, Stage: Pre-Approved/Approved)'
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
    approvedAmount,
    fundedAmount,
    requestedFundingMin: rangeInfo.min,
    requestedFundingMax: rangeInfo.max,
    requestedFundingRange: rangeInfo.range,
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
 * NEVER sums requested funding ranges.
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

    // 1. ACTIVE PIPELINE (Strictly Pre-Approved / Approved Underwriting deals)
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
