import { CommissionParticipant, FundingDeal } from '../types';
import {
  calculateAggregateFinancials,
  calculateDealFinancials,
  isDealInActivePipeline,
  isDealFunded,
  isDealProposed,
  isDealInactive,
  normalizeDealStatus,
  categorizeDealStatus,
  DealFinancialSummary,
  AggregateFinancialsResult,
} from './dealFinancials';

export {
  calculateDealFinancials,
  isDealInActivePipeline,
  isDealFunded,
  isDealProposed,
  isDealInactive,
  normalizeDealStatus,
  categorizeDealStatus,
};

export type { DealFinancialSummary, AggregateFinancialsResult };

export interface DashboardMetricsResult {
  // Primary Metrics
  activePipeline: number;
  totalFunded: number;
  proposedVolume: number;
  totalPortfolioVolume: number;

  // Commission Metrics
  commissionPrediction: number;
  commissionExpected: number;
  commissionToBeCollected: number;
  commissionCollected: number;

  // Counts
  activePipelineCount: number;
  fundedCount: number;
  proposedCount: number;
  
  // Drill-down lists for click-through modal / filtering
  activePipelineDeals: FundingDeal[];
  fundedDeals: FundingDeal[];
  predictiveDeals: FundingDeal[];
  uncollectedFundedDeals: (FundingDeal & {
    expectedCommission: number;
    alreadyCollected: number;
    remainingToCollect: number;
    auditBreakdown?: DealFinancialSummary['auditBreakdown'];
  })[];
  collectedDeals: (FundingDeal & {
    actualCollectedAmount: number;
    collectionDate?: string;
    auditBreakdown?: DealFinancialSummary['auditBreakdown'];
  })[];
  proposedDeals: FundingDeal[];

  // Detailed Deal Summaries with Full Math Breakdown
  allDealSummaries: DealFinancialSummary[];
}

/**
 * Checks if a funding deal is Pre-Qualified / Pre-Approved
 */
export function isDealPreQualified(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  const s = normalizeDealStatus(deal.status);
  return s.includes('PRE_APPROVED') || s.includes('PRE_APPROVAL') || s.includes('PRE_QUALIFIED');
}

/**
 * Checks if a funding deal is Approved
 */
export function isDealApproved(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  const s = normalizeDealStatus(deal.status);
  return s === 'APPROVED' || s === 'CONDITIONS_MET' || s === 'DOCS_REQUESTED' || s === 'DOCS_RECEIVED';
}

/**
 * Checks if a funding deal is Declined
 */
export function isDealDeclined(deal: Partial<FundingDeal>): boolean {
  if (!deal) return false;
  const s = normalizeDealStatus(deal.status);
  return s === 'DECLINED' || s === 'REJECTED' || s === 'NOT_QUALIFIED';
}

/**
 * Centralized Calculation Engine for Maple X Financial Dashboard
 * 
 * Rules:
 * 1. ACTIVE PIPELINE: SUM of Funding Amount for deals strictly in PRE-APPROVED lifecycle stage
 * 2. TOTAL FUNDED: SUM of Funding Amount for deals in FUNDED status
 * 3. COMMISSION PREDICTION: SUM of (Funding Amount * Commission %) for active pipeline deals ONLY
 * 4. COMMISSION TO BE COLLECTED: SUM of (Expected Commission - Already Collected) for FUNDED deals ONLY
 * 5. COMMISSION COLLECTED: SUM of actual commission received amounts
 */
export function calculateDashboardMetrics(
  deals: FundingDeal[] = [],
  commissions: CommissionParticipant[] = []
): DashboardMetricsResult {
  const aggregate = calculateAggregateFinancials(deals, commissions);

  return {
    activePipeline: aggregate.activePipelineVolume,
    totalFunded: aggregate.totalFundedVolume,
    proposedVolume: aggregate.proposedVolume,
    totalPortfolioVolume: aggregate.totalPortfolioVolume,

    commissionPrediction: aggregate.commissionPrediction,
    commissionExpected: aggregate.commissionExpected,
    commissionToBeCollected: aggregate.commissionToBeCollected,
    commissionCollected: aggregate.commissionCollected,

    activePipelineCount: aggregate.activePipelineCount,
    fundedCount: aggregate.totalFundedCount,
    proposedCount: aggregate.proposedCount,

    activePipelineDeals: aggregate.activePipelineDeals.map((d) => d.deal),
    fundedDeals: aggregate.fundedDeals.map((d) => d.deal),
    predictiveDeals: aggregate.activePipelineDeals.map((d) => d.deal),
    proposedDeals: aggregate.proposedDeals.map((d) => d.deal),

    uncollectedFundedDeals: aggregate.uncollectedFundedDeals.map((d) => ({
      ...d.deal,
      expectedCommission: d.grossCommission,
      alreadyCollected: d.alreadyCollectedCommission,
      remainingToCollect: d.toBeCollectedCommission,
      auditBreakdown: d.auditBreakdown,
    })),

    collectedDeals: aggregate.collectedDeals.map((d) => ({
      ...d.deal,
      actualCollectedAmount: d.alreadyCollectedCommission,
      collectionDate: d.deal.commissionReceivedDate || d.deal.fundingDate,
      auditBreakdown: d.auditBreakdown,
    })),

    allDealSummaries: aggregate.allDealSummaries,
  };
}
