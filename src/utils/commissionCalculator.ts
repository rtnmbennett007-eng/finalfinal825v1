/**
 * Canonical Commission Calculation Engine for Maple X Financial
 * 
 * Rules:
 * - Never pre-fill commission %, points, partner percentages, commission amount, or closing fee.
 * - If commission % is blank or 0 or undefined, do not return a fake/fabricated amount.
 * - Canonical payout formula:
 *     percentageCommission = (fundingAmount * (percentage || 0)) / 100
 *     totalCommission = percentageCommission + (fee || 0)
 *     participantPayout = fundingAmount * (participantPoints / 100)
 */

import { FundingDeal, CommissionParticipant } from '../types';

export interface DealCommissionCalculation {
  fundingAmount: number;
  percentage?: number;
  fee?: number;
  hasPercentage: boolean;
  hasFee: boolean;
  hasCommission: boolean;
  percentageCommission: number;
  feeCommission: number;
  totalCommission: number;
  formattedTotalCommission: string;
}

export interface ParticipantPayoutCalculation {
  participantId?: string;
  name: string;
  type: string;
  role?: string;
  points: number;
  dollarAmount: number;
  status: CommissionParticipant['status'] | 'APPROVED' | 'PAID' | 'DISPUTED';
}

export interface DealDistributionSummary {
  dealId: string;
  fundingAmount: number;
  dealPercentage?: number;
  dealFee?: number;
  totalDealCommission: number;
  totalAllocatedPoints: number;
  totalAllocatedDollars: number;
  unallocatedPoints: number;
  unallocatedDollars: number;
  companyRetainedNet: number;
  isFullyAllocated: boolean;
  isOverAllocated: boolean;
  participants: ParticipantPayoutCalculation[];
}

/**
 * Calculates the canonical commission figures for a single funding position.
 * Returns 0 and hasPercentage=false if percentage is undefined, null, or empty string.
 */
export function calculateDealCommission(deal: {
  fundingAmount?: number | string | null;
  percentage?: number | string | null;
  fee?: number | string | null;
}): DealCommissionCalculation {
  const fundingAmount = Math.max(0, Number(deal.fundingAmount) || 0);
  
  const rawPct = deal.percentage;
  const hasPercentage = rawPct !== undefined && rawPct !== null && rawPct !== '' && !isNaN(Number(rawPct)) && Number(rawPct) > 0;
  const percentage = hasPercentage ? Number(rawPct) : undefined;
  
  const rawFee = deal.fee;
  const hasFee = rawFee !== undefined && rawFee !== null && rawFee !== '' && !isNaN(Number(rawFee)) && Number(rawFee) > 0;
  const fee = hasFee ? Number(rawFee) : undefined;

  const percentageCommission = hasPercentage ? (fundingAmount * (percentage || 0)) / 100 : 0;
  const feeCommission = hasFee ? (fee || 0) : 0;
  const totalCommission = percentageCommission + feeCommission;
  const hasCommission = hasPercentage || hasFee;

  return {
    fundingAmount,
    percentage,
    fee,
    hasPercentage,
    hasFee,
    hasCommission,
    percentageCommission,
    feeCommission,
    totalCommission,
    formattedTotalCommission: hasCommission ? `$${Math.round(totalCommission).toLocaleString()}` : '$0',
  };
}

/**
 * Calculates a participant's commission payout based on points and deal funding volume.
 */
export function calculateParticipantPayout(
  fundingAmount: number,
  points: number | string
): number {
  const numPoints = Math.max(0, Number(points) || 0);
  const numAmount = Math.max(0, Number(fundingAmount) || 0);
  return (numAmount * numPoints) / 100;
}

/**
 * Calculates the full split breakdown for a deal and its commission participants.
 */
export function calculateDealDistribution(
  deal: FundingDeal,
  participants: CommissionParticipant[] = []
): DealDistributionSummary {
  const calc = calculateDealCommission(deal);
  const dealParticipants = participants.filter((p) => p.dealId === deal.id);

  let totalAllocatedPoints = 0;
  let totalAllocatedDollars = 0;

  const calculatedParticipants: ParticipantPayoutCalculation[] = dealParticipants.map((p) => {
    const points = Number(p.points) || 0;
    const dollarAmount = p.dollarAmount !== undefined && p.dollarAmount !== null && Number(p.dollarAmount) > 0
      ? Number(p.dollarAmount)
      : calculateParticipantPayout(calc.fundingAmount, points);

    totalAllocatedPoints += points;
    totalAllocatedDollars += dollarAmount;

    return {
      participantId: p.id,
      name: p.name,
      type: p.type,
      role: p.role,
      points,
      dollarAmount,
      status: p.status,
    };
  });

  const dealPct = calc.percentage || 0;
  const unallocatedPoints = Math.max(0, Number((dealPct - totalAllocatedPoints).toFixed(4)));
  const unallocatedDollars = Math.max(0, calc.totalCommission - totalAllocatedDollars);
  const companyRetainedNet = unallocatedDollars;
  const isFullyAllocated = unallocatedPoints <= 0.0001;
  const isOverAllocated = totalAllocatedPoints > dealPct + 0.0001;

  return {
    dealId: deal.id,
    fundingAmount: calc.fundingAmount,
    dealPercentage: calc.percentage,
    dealFee: calc.fee,
    totalDealCommission: calc.totalCommission,
    totalAllocatedPoints,
    totalAllocatedDollars,
    unallocatedPoints,
    unallocatedDollars,
    companyRetainedNet,
    isFullyAllocated,
    isOverAllocated,
    participants: calculatedParticipants,
  };
}

/**
 * Aggregates live commission totals across a list of deals with zero double counting.
 */
export function aggregateDealsCommissions(deals: FundingDeal[]) {
  let totalExpectedCommission = 0;
  let totalFundedCommission = 0;
  let totalCollectedCommission = 0;
  let totalPendingCommission = 0;

  for (const deal of deals) {
    const calc = calculateDealCommission(deal);
    if (!calc.hasCommission) continue;

    totalExpectedCommission += calc.totalCommission;

    if (deal.status === 'FUNDED') {
      totalFundedCommission += calc.totalCommission;
      if (deal.commissionStatus === 'COLLECTED') {
        totalCollectedCommission += calc.totalCommission;
      } else {
        totalPendingCommission += calc.totalCommission;
      }
    }
  }

  return {
    totalExpectedCommission,
    totalFundedCommission,
    totalCollectedCommission,
    totalPendingCommission,
  };
}
