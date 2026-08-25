import { CommissionParticipant, FundingDeal } from '../types';

export interface DashboardMetricsResult {
  activePipeline: number;
  totalFunded: number;
  commissionPrediction: number;
  commissionToBeCollected: number;
  commissionCollected: number;
  
  // Drill-down lists for click-through modal / filtering
  activePipelineDeals: FundingDeal[];
  fundedDeals: FundingDeal[];
  predictiveDeals: FundingDeal[];
  uncollectedFundedDeals: (FundingDeal & { expectedCommission: number; alreadyCollected: number; remainingToCollect: number })[];
  collectedDeals: (FundingDeal & { actualCollectedAmount: number; collectionDate?: string })[];
}

/**
 * Normalizes deal status string for safe comparison
 */
export function normalizeDealStatus(status: string | undefined | null): string {
  if (!status) return '';
  return status.toUpperCase().trim().replace(/[-\s]/g, '_');
}

/**
 * Checks if a funding deal belongs to ACTIVE PIPELINE
 * Active Pipeline = ONLY UNDERWRITING, PRE-APPROVED, PRE-APPROVAL
 */
export function isDealInActivePipeline(deal: FundingDeal): boolean {
  const s = normalizeDealStatus(deal.status);
  return s === 'UNDERWRITING' || s === 'PRE_APPROVED' || s === 'PRE_APPROVAL';
}

/**
 * Checks if a funding deal is FUNDED
 */
export function isDealFunded(deal: FundingDeal): boolean {
  const s = normalizeDealStatus(deal.status);
  return s === 'FUNDED';
}

/**
 * Centralized Calculation Engine for Maple X Financial Dashboard
 * 
 * Metrics:
 * 1. ACTIVE PIPELINE: SUM of Funding Amount for deals in UNDERWRITING, PRE-APPROVED, PRE-APPROVAL
 * 2. TOTAL FUNDED: SUM of Funding Amount for deals in FUNDED status
 * 3. COMMISSION PREDICTION: SUM of (Funding Amount * Commission %) for active pipeline deals ONLY
 * 4. COMMISSION TO BE COLLECTED: SUM of (Expected Commission - Already Collected) for FUNDED deals ONLY
 * 5. COMMISSION COLLECTED: SUM of actual commission received amounts marked Received in Firebase
 */
export function calculateDashboardMetrics(
  deals: FundingDeal[] = [],
  commissions: CommissionParticipant[] = []
): DashboardMetricsResult {
  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeCommissions = Array.isArray(commissions) ? commissions : [];

  // Group commissions by dealId for fast lookup
  const commissionsByDealId: Record<string, CommissionParticipant[]> = {};
  for (const cp of safeCommissions) {
    if (cp.dealId) {
      if (!commissionsByDealId[cp.dealId]) {
        commissionsByDealId[cp.dealId] = [];
      }
      commissionsByDealId[cp.dealId].push(cp);
    }
  }

  // 1. ACTIVE PIPELINE
  const activePipelineDeals: FundingDeal[] = [];
  let activePipeline = 0;

  // 2. TOTAL FUNDED
  const fundedDeals: FundingDeal[] = [];
  let totalFunded = 0;

  // 3. COMMISSION PREDICTION (Active Pipeline Only)
  const predictiveDeals: FundingDeal[] = [];
  let commissionPrediction = 0;

  // 4. COMMISSION TO BE COLLECTED (Funded Deals Only)
  const uncollectedFundedDeals: (FundingDeal & { expectedCommission: number; alreadyCollected: number; remainingToCollect: number })[] = [];
  let commissionToBeCollected = 0;

  // 5. COMMISSION COLLECTED (Actual Received Money)
  const collectedDeals: (FundingDeal & { actualCollectedAmount: number; collectionDate?: string })[] = [];
  let commissionCollected = 0;

  for (const deal of safeDeals) {
    const fundingAmount = Math.max(0, Number(deal.fundingAmount) || 0);
    const percentage = Math.max(0, Number(deal.percentage) || 0);
    const expectedCommission = (fundingAmount * percentage) / 100;

    // Check Active Pipeline
    if (isDealInActivePipeline(deal)) {
      activePipelineDeals.push(deal);
      activePipeline += fundingAmount;

      // Commission Prediction is strictly for Active Pipeline
      const dealPredictedCommission = expectedCommission;
      commissionPrediction += dealPredictedCommission;
      predictiveDeals.push(deal);
    }

    // Check Funded Deals
    if (isDealFunded(deal)) {
      fundedDeals.push(deal);
      totalFunded += fundingAmount;

      // Calculate actual commission already collected for this funded deal
      const dealParticipants = commissionsByDealId[deal.id] || [];
      const receivedParticipants = dealParticipants.filter((p) => p.status === 'RECEIVED');

      let dealCollectedAmount = 0;

      if ((deal as any).commissionReceivedAmount !== undefined && (deal as any).commissionReceivedAmount !== null) {
        dealCollectedAmount = Number((deal as any).commissionReceivedAmount) || 0;
      } else if (receivedParticipants.length > 0) {
        dealCollectedAmount = receivedParticipants.reduce((sum, p) => sum + (Number(p.dollarAmount) || 0), 0);
      } else if (deal.commissionStatus === 'COLLECTED') {
        dealCollectedAmount = expectedCommission;
      }

      const remainingToCollect = Math.max(0, expectedCommission - dealCollectedAmount);

      if (remainingToCollect > 0.01) {
        uncollectedFundedDeals.push({
          ...deal,
          expectedCommission,
          alreadyCollected: dealCollectedAmount,
          remainingToCollect,
        });
        commissionToBeCollected += remainingToCollect;
      }

      if (dealCollectedAmount > 0.01) {
        collectedDeals.push({
          ...deal,
          actualCollectedAmount: dealCollectedAmount,
          collectionDate: deal.commissionReceivedDate || deal.fundingDate,
        });
        commissionCollected += dealCollectedAmount;
      }
    }
  }

  // Also check if there are standalone commission participant records marked RECEIVED for deals not already counted
  // (Defensive check against detached commission rows)
  const countedDealIds = new Set(collectedDeals.map((d) => d.id));
  for (const cp of safeCommissions) {
    if (cp.status === 'RECEIVED' && cp.dealId && !countedDealIds.has(cp.dealId)) {
      const amt = Number(cp.dollarAmount) || 0;
      if (amt > 0) {
        commissionCollected += amt;
      }
    }
  }

  return {
    activePipeline: Math.round(activePipeline),
    totalFunded: Math.round(totalFunded),
    commissionPrediction: Math.round(commissionPrediction),
    commissionToBeCollected: Math.round(commissionToBeCollected),
    commissionCollected: Math.round(commissionCollected),
    activePipelineDeals,
    fundedDeals,
    predictiveDeals,
    uncollectedFundedDeals,
    collectedDeals,
  };
}
