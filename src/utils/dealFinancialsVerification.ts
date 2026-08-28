/**
 * Canonical Deal Financials Automated Verification Engine
 * Runs a rigorous verification suite checking all calculation and synchronization rules.
 */

import {
  categorizeDealStatus,
  calculateDealFinancials,
  calculateAggregateFinancials,
  CanonicalDealCategory,
} from './dealFinancials';
import { FundingDeal, CommissionParticipant } from '../types';

export interface VerificationTestResult {
  ruleName: string;
  description: string;
  passed: boolean;
  expected: any;
  actual: any;
  details?: string;
}

export function runDealFinancialsVerificationSuite(): {
  allPassed: boolean;
  results: VerificationTestResult[];
  summaryText: string;
} {
  const results: VerificationTestResult[] = [];

  // Mock Fixtures
  const mockFundedDeal: FundingDeal = {
    id: 'DEAL-1001',
    dealId: 'DEAL-1001',
    clientId: 'CLIENT-1',
    clientName: 'Alpha Logistics Corp',
    businessName: 'Alpha Logistics',
    product: 'Equipment Financing',
    fundingAmount: 45000,
    percentage: 8.0,
    fee: 1000,
    lenderName: 'Lender One',
    termLength: '12 Months',
    assignedStaff: 'Dana',
    status: 'FUNDED',
    commissionStatus: 'COLLECTED',
    commissionReceivedDate: '2026-03-01',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  };

  const mockPreApprovedDeal: FundingDeal = {
    id: 'DEAL-1002',
    dealId: 'DEAL-1002',
    clientId: 'CLIENT-2',
    clientName: 'Beta Construction Inc',
    businessName: 'Beta Construction',
    product: 'Working Capital Line',
    fundingAmount: 50000,
    percentage: 7.5,
    fee: 0,
    lenderName: 'Lender Two',
    termLength: '24 Months',
    assignedStaff: 'Luke',
    status: 'PRE_APPROVED',
    commissionStatus: 'PENDING',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-15T00:00:00.000Z',
  };

  const mockProposedDeal: FundingDeal = {
    id: 'DEAL-1003',
    dealId: 'DEAL-1003',
    clientId: 'CLIENT-3',
    clientName: 'Gamma Retail Group',
    businessName: 'Gamma Retail',
    product: 'Term Loan',
    fundingAmount: 75000,
    percentage: 6.0,
    fee: 500,
    lenderName: 'Lender Three',
    termLength: '36 Months',
    assignedStaff: 'Dana',
    status: 'APPLICATION_RECEIVED',
    commissionStatus: 'PENDING',
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:00:00.000Z',
  };

  const mockDeclinedDeal: FundingDeal = {
    id: 'DEAL-1004',
    dealId: 'DEAL-1004',
    clientId: 'CLIENT-4',
    clientName: 'Delta Transport',
    businessName: 'Delta Transport',
    product: 'SBA 7(a)',
    fundingAmount: 120000,
    percentage: 5.0,
    fee: 0,
    lenderName: 'Lender Four',
    termLength: '60 Months',
    assignedStaff: 'Luke',
    status: 'DECLINED',
    commissionStatus: 'PENDING',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-20T00:00:00.000Z',
  };

  const mockCommissions: CommissionParticipant[] = [
    {
      id: 'COMM-1',
      dealId: 'DEAL-1001',
      name: 'Dana',
      type: 'Internal Staff',
      role: 'Operations Specialist',
      points: 2.0,
      dollarAmount: 900,
      status: 'RECEIVED',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    {
      id: 'COMM-2',
      dealId: 'DEAL-1001',
      name: 'Luke',
      type: 'Internal Staff',
      role: 'Funding Manager',
      points: 4.0,
      dollarAmount: 1800,
      status: 'RECEIVED',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
  ];

  // Test 1: Status categorization
  const catPreApp1 = categorizeDealStatus('PRE_APPROVED');
  const catPreApp2 = categorizeDealStatus('PRE-APPROVED');
  const catPreApp3 = categorizeDealStatus('Pre-Approved');
  const catFunded = categorizeDealStatus('FUNDED');
  const catProposed = categorizeDealStatus('APPLICATION_RECEIVED');
  const catDeclined = categorizeDealStatus('DECLINED');

  const test1Passed =
    catPreApp1 === 'PRE_APPROVED' &&
    catPreApp2 === 'PRE_APPROVED' &&
    catPreApp3 === 'PRE_APPROVED' &&
    catFunded === 'FUNDED' &&
    catProposed === 'PROPOSED' &&
    catDeclined === 'INACTIVE';

  results.push({
    ruleName: 'Lifecycle Stage Normalization',
    description: 'Maps diverse deal status strings to canonical categories (PRE_APPROVED, FUNDED, PROPOSED, INACTIVE).',
    passed: test1Passed,
    expected: 'Exact canonical mapped values',
    actual: { catPreApp1, catFunded, catProposed, catDeclined },
  });

  // Test 2: Deal Financial Breakdown (Math formula and points)
  const dealSummary = calculateDealFinancials(mockFundedDeal, mockCommissions);
  const test2Passed =
    dealSummary.fundingAmount === 45000 &&
    dealSummary.grossCommission === 4600 && // 45,000 * 8% + 1000 = 3600 + 1000
    dealSummary.totalAllocatedPoints === 6.0 &&
    dealSummary.unallocatedPoints === 2.0 &&
    dealSummary.companyRetainedDollars === 1900 &&
    dealSummary.alreadyCollectedCommission === 4600 &&
    dealSummary.toBeCollectedCommission === 0;

  results.push({
    ruleName: 'Gross Commission & Multi-Participant Allocation Math',
    description: 'Calculates deal funding volume, fee & points addition, and participant split retention.',
    passed: test2Passed,
    expected: { gross: 4600, allocatedPoints: 6.0, unallocatedPoints: 2.0, retained: 1900 },
    actual: {
      gross: dealSummary.grossCommission,
      allocatedPoints: dealSummary.totalAllocatedPoints,
      unallocatedPoints: dealSummary.unallocatedPoints,
      retained: dealSummary.companyRetainedDollars,
    },
  });

  // Test 3: Active Pipeline Isolation (Strictly PRE_APPROVED)
  const allDeals = [mockFundedDeal, mockPreApprovedDeal, mockProposedDeal, mockDeclinedDeal];
  const aggregate = calculateAggregateFinancials(allDeals, mockCommissions);

  const test3Passed =
    aggregate.activePipelineVolume === 50000 &&
    aggregate.activePipelineCount === 1 &&
    aggregate.totalFundedVolume === 45000 &&
    aggregate.totalFundedCount === 1 &&
    aggregate.proposedVolume === 75000 &&
    aggregate.proposedCount === 1;

  results.push({
    ruleName: 'Active Pipeline Strict Isolation',
    description: 'Active Pipeline must ONLY contain PRE_APPROVED deals ($50k), separating Funded ($45k) and Proposed ($75k).',
    passed: test3Passed,
    expected: { activePipelineVolume: 50000, activePipelineCount: 1, fundedVolume: 45000, fundedCount: 1 },
    actual: {
      activePipelineVolume: aggregate.activePipelineVolume,
      activePipelineCount: aggregate.activePipelineCount,
      fundedVolume: aggregate.totalFundedVolume,
      fundedCount: aggregate.totalFundedCount,
    },
  });

  // Test 4: Commission Prediction (Pre-Approved Amount * Rate %)
  const test4Passed = aggregate.commissionPrediction === 3750; // 50,000 * 7.5% = 3,750
  results.push({
    ruleName: 'Predictive Commission Calculation',
    description: 'Calculates predicted commission strictly on active pre-approved pipeline ($50k × 7.5% = $3,750).',
    passed: test4Passed,
    expected: 3750,
    actual: aggregate.commissionPrediction,
  });

  // Test 5: Zero Duplication & 100% Record Balance
  const totalCountBalanced =
    aggregate.activePipelineCount +
      aggregate.totalFundedCount +
      aggregate.proposedCount +
      (aggregate.allDealSummaries.filter((d) => d.category === 'INACTIVE').length) ===
    allDeals.length;

  results.push({
    ruleName: 'Zero Record Duplication & Complete Balance',
    description: 'Guarantees every deal record is counted exactly once without duplicates across lifecycle buckets.',
    passed: totalCountBalanced,
    expected: allDeals.length,
    actual: aggregate.allDealSummaries.length,
  });

  const allPassed = results.every((r) => r.passed);
  const summaryText = allPassed
    ? `All ${results.length} canonical financial verification rules passed successfully.`
    : `Verification detected ${results.filter((r) => !r.passed).length} rule failures.`;

  return {
    allPassed,
    results,
    summaryText,
  };
}
