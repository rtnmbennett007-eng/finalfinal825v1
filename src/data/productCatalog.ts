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

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Business / Commercial Funding',
  'Credit / Card Funding',
  'Personal Funding',
  'Real Estate & Property Funding',
  'Specialty & Alternative Financing',
  'Other / Custom',
];

export const MASTER_FUNDING_PRODUCTS: FundingProductDefinition[] = [
  // 1. BUSINESS / COMMERCIAL FUNDING (16 products)
  {
    id: 'revenue_funding',
    name: 'Revenue Funding',
    category: 'Business / Commercial Funding',
    description: 'Working capital advance structured against gross monthly business revenue deposits and cash flows.',
    typicalTerm: '6 - 24 Months',
    defaultCommissionRate: 6.9,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 1,
    requiredFields: ['monthlyRevenue', 'averageDailyBalance', 'bankDepositCount'],
  },
  {
    id: 'business_line_of_credit',
    name: 'Business Line of Credit',
    category: 'Business / Commercial Funding',
    description: 'Revolving commercial credit line providing continuous liquidity, draw-as-needed flexibility, and interest only on utilized capital.',
    typicalTerm: '12 - 36 Months Revolving',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 995,
    isActive: true,
    sortOrder: 2,
    requiredFields: ['monthlyRevenue', 'timeInBusiness', 'creditScore'],
  },
  {
    id: 'business_term_loan',
    name: 'Business Term Loan',
    category: 'Business / Commercial Funding',
    description: 'Fixed-rate commercial term financing with scheduled monthly or bi-weekly principal & interest amortizations.',
    typicalTerm: '12 - 60 Months',
    defaultCommissionRate: 5.5,
    defaultBaseFee: 1295,
    isActive: true,
    sortOrder: 3,
    requiredFields: ['annualRevenue', 'netOperatingIncome', 'timeInBusiness'],
  },
  {
    id: 'sba_7a_loan',
    name: 'SBA 7(a) Loan',
    category: 'Business / Commercial Funding',
    description: 'Government-guaranteed Small Business Administration loan for working capital, business acquisitions, partner buyouts, and debt refinancing.',
    typicalTerm: '10 - 25 Years',
    defaultCommissionRate: 3.5,
    defaultBaseFee: 2495,
    isActive: true,
    sortOrder: 4,
    requiredFields: ['taxReturns2Years', 'pnlStatement', 'balanceSheet', 'personalFinancialStatement'],
  },
  {
    id: 'sba_504_loan',
    name: 'SBA 504 Loan',
    category: 'Business / Commercial Funding',
    description: 'Long-term, fixed-rate financing for major fixed assets such as owner-occupied commercial real estate, heavy equipment, and facilities.',
    typicalTerm: '10 - 25 Years',
    defaultCommissionRate: 3.0,
    defaultBaseFee: 2995,
    isActive: true,
    sortOrder: 5,
    requiredFields: ['propertyAppraisal', 'projectBudget', 'taxReturns3Years'],
  },
  {
    id: 'sba_express_loan',
    name: 'SBA Express Loan',
    category: 'Business / Commercial Funding',
    description: 'Fast-tracked SBA loan structure with expedited 36-hour underwriting turnaround for up to $500,000 in capital.',
    typicalTerm: '5 - 10 Years',
    defaultCommissionRate: 3.5,
    defaultBaseFee: 1995,
    isActive: true,
    sortOrder: 6,
    requiredFields: ['creditScore', 'annualRevenue', 'taxReturns1Year'],
  },
  {
    id: 'equipment_financing',
    name: 'Equipment Financing & Leasing',
    category: 'Business / Commercial Funding',
    description: 'Dedicated capital facility to purchase, lease, or upgrade commercial machinery, medical devices, construction vehicles, and technology.',
    typicalTerm: '24 - 84 Months',
    defaultCommissionRate: 5.0,
    defaultBaseFee: 795,
    isActive: true,
    sortOrder: 7,
    requiredFields: ['equipmentInvoice', 'vendorQuote', 'timeInBusiness'],
  },
  {
    id: 'invoice_factoring',
    name: 'Accounts Receivable / Invoice Factoring',
    category: 'Business / Commercial Funding',
    description: 'Immediate cash advances secured by outstanding B2B/B2G accounts receivable invoices, unlocking capital trapped in 30-90 day net terms.',
    typicalTerm: 'Revolving / Per Invoice Batch',
    defaultCommissionRate: 4.0,
    defaultBaseFee: 895,
    isActive: true,
    sortOrder: 8,
    requiredFields: ['accountsReceivableAging', 'debtorCreditworthiness', 'invoiceSample'],
  },
  {
    id: 'merchant_cash_advance',
    name: 'Merchant Cash Advance (MCA)',
    category: 'Business / Commercial Funding',
    description: 'Capital purchased against future credit card and merchant processing receipts, repaid through daily percentage batch holdbacks.',
    typicalTerm: '3 - 12 Months',
    defaultCommissionRate: 7.5,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 9,
    requiredFields: ['merchantStatements4Months', 'creditScore', 'dailyCardVolume'],
  },
  {
    id: 'po_financing',
    name: 'Purchase Order (PO) Financing',
    category: 'Business / Commercial Funding',
    description: 'Funding directed to manufacturers/suppliers to fulfill verified, firm purchase orders for goods that exceed current working capital.',
    typicalTerm: '30 - 90 Days',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 1195,
    isActive: true,
    sortOrder: 10,
    requiredFields: ['verifiedPurchaseOrder', 'supplierContract', 'grossMarginPct'],
  },
  {
    id: 'inventory_financing',
    name: 'Inventory Financing',
    category: 'Business / Commercial Funding',
    description: 'Asset-backed revolving or term lines collateralized by raw materials, warehouse inventory, and finished commercial goods.',
    typicalTerm: '6 - 24 Months',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 1295,
    isActive: true,
    sortOrder: 11,
    requiredFields: ['inventoryAppraisal', 'warehouseAudit', 'turnoverRate'],
  },
  {
    id: 'asset_based_lending',
    name: 'Asset-Based Lending (ABL)',
    category: 'Business / Commercial Funding',
    description: 'Senior secured commercial credit lines structured against a blend of inventory, receivables, equipment, and company assets.',
    typicalTerm: '24 - 48 Months',
    defaultCommissionRate: 4.0,
    defaultBaseFee: 1995,
    isActive: true,
    sortOrder: 12,
    requiredFields: ['borrowingBaseCertificate', 'annualRevenue', 'assetAudit'],
  },
  {
    id: 'commercial_working_capital',
    name: 'Commercial Working Capital',
    category: 'Business / Commercial Funding',
    description: 'Flexible short-to-medium term liquidity injection designed to cover day-to-day payroll, inventory replenishment, and operational expenses.',
    typicalTerm: '6 - 18 Months',
    defaultCommissionRate: 6.0,
    defaultBaseFee: 1295,
    isActive: true,
    sortOrder: 13,
    requiredFields: ['monthlyRevenue', 'operatingExpenses', 'bankStatements4Months'],
  },
  {
    id: 'franchise_financing',
    name: 'Franchise Financing',
    category: 'Business / Commercial Funding',
    description: 'Tailored funding programs for franchise fee acquisition, remodeling, multi-unit expansion, and territory rollouts.',
    typicalTerm: '36 - 84 Months',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 14,
    requiredFields: ['fddDocument', 'franchiseAgreement', 'personalNetWorth'],
  },
  {
    id: 'medical_practice_financing',
    name: 'Medical / Practice Financing',
    category: 'Business / Commercial Funding',
    description: 'Specialized low-rate commercial solutions for physicians, dental practices, chiropractors, veterinary, and healthcare centers.',
    typicalTerm: '36 - 120 Months',
    defaultCommissionRate: 4.0,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 15,
    requiredFields: ['practiceLicense', 'providerNumbers', 'historicalCollections'],
  },
  {
    id: 'contract_financing',
    name: 'Contract Financing',
    category: 'Business / Commercial Funding',
    description: 'Financing against signed government or corporate contracts to cover upfront mobilization, labor, and materials.',
    typicalTerm: '6 - 24 Months',
    defaultCommissionRate: 5.0,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 16,
    requiredFields: ['executedContract', 'milestoneSchedule', 'contractorTrackRecord'],
  },

  // 2. CREDIT / CARD FUNDING (6 products)
  {
    id: 'zero_pct_business_credit_cards',
    name: '0% Business Credit Cards',
    category: 'Credit / Card Funding',
    description: 'Strategic multi-bank unsecured business credit card stack offering 0% introductory APR for 9 to 24 months with zero personal credit reporting.',
    typicalTerm: '12 - 24 Months 0% APR',
    defaultCommissionRate: 10.0,
    defaultBaseFee: 995,
    isActive: true,
    sortOrder: 17,
    requiredFields: ['guarantorFicoScore', 'primaryBankRelationship', 'recentInquiries'],
  },
  {
    id: 'zero_pct_business_cards_lines',
    name: '0% Business Cards & Lines of Credit',
    category: 'Credit / Card Funding',
    description: 'Hybrid funding program blending 0% promotional APR business revolving credit cards with low-interest unsecured business credit lines.',
    typicalTerm: '12 - 24 Months Hybrid',
    defaultCommissionRate: 9.0,
    defaultBaseFee: 1195,
    isActive: true,
    sortOrder: 18,
    requiredFields: ['guarantorFicoScore', 'timeInBusiness', 'creditUtilization'],
  },
  {
    id: 'zero_pct_personal_credit_cards',
    name: '0% Personal Credit Cards',
    category: 'Credit / Card Funding',
    description: 'Sequenced personal credit card funding stack targeting tier-1 financial institutions with 0% intro interest promotions.',
    typicalTerm: '12 - 21 Months 0% APR',
    defaultCommissionRate: 8.0,
    defaultBaseFee: 795,
    isActive: true,
    sortOrder: 19,
    requiredFields: ['personalFicoScore', 'debtToIncomeRatio', 'householdIncome'],
  },
  {
    id: 'corporate_credit_lines',
    name: 'Corporate Credit Lines',
    category: 'Credit / Card Funding',
    description: 'High-limit commercial credit accounts linked to corporate EIN with enhanced purchasing power and specialized expense management.',
    typicalTerm: 'Revolving',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 995,
    isActive: true,
    sortOrder: 20,
    requiredFields: ['dunsNumber', 'paydexScore', 'corporateRevenue'],
  },
  {
    id: 'secured_business_credit_card',
    name: 'Secured Business Credit Card',
    category: 'Credit / Card Funding',
    description: 'Deposit-collateralized business credit facility designed to establish primary tier-1 tradelines and build prime commercial credit ratings.',
    typicalTerm: 'Revolving (Collateral Backed)',
    defaultCommissionRate: 5.0,
    defaultBaseFee: 495,
    isActive: true,
    sortOrder: 21,
    requiredFields: ['collateralDepositAmount', 'einVerification'],
  },
  {
    id: 'business_credit_builder',
    name: 'Business Credit Builder Facility',
    category: 'Credit / Card Funding',
    description: 'Dedicated trade vendor and reporting tier sequence to elevate Paydex (D&B), Experian Commercial, and Equifax Business ratings.',
    typicalTerm: '6 - 12 Months Program',
    defaultCommissionRate: 8.0,
    defaultBaseFee: 895,
    isActive: true,
    sortOrder: 22,
    requiredFields: ['commercialCreditProfile', 'businessEntitySetup'],
  },

  // 3. PERSONAL FUNDING (6 products)
  {
    id: 'personal_term_loan',
    name: 'Personal Term Loan',
    category: 'Personal Funding',
    description: 'Unsecured fixed-rate personal term loan with structured monthly principal and interest payments and no collateral requirements.',
    typicalTerm: '24 - 84 Months',
    defaultCommissionRate: 7.5,
    defaultBaseFee: 995,
    isActive: true,
    sortOrder: 23,
    requiredFields: ['personalIncome', 'ficoScore', 'w2OrTaxReturn'],
  },
  {
    id: 'personal_line_of_credit',
    name: 'Personal Line of Credit (PLOC)',
    category: 'Personal Funding',
    description: 'Unsecured revolving personal credit facility offering on-demand cash access with interest charged solely on drawn balances.',
    typicalTerm: '12 - 60 Months Revolving',
    defaultCommissionRate: 6.0,
    defaultBaseFee: 795,
    isActive: true,
    sortOrder: 24,
    requiredFields: ['personalIncome', 'ficoScore', 'bankingRelationship'],
  },
  {
    id: 'debt_consolidation_loan',
    name: 'Debt Consolidation Loan',
    category: 'Personal Funding',
    description: 'Streamlined loan package that pays off high-interest credit cards and miscellaneous debt into a single lower-interest monthly payment.',
    typicalTerm: '24 - 60 Months',
    defaultCommissionRate: 6.5,
    defaultBaseFee: 895,
    isActive: true,
    sortOrder: 25,
    requiredFields: ['currentDebtsList', 'payoffStatements', 'ficoScore'],
  },
  {
    id: 'personal_installment_loan',
    name: 'Personal Installment Loan',
    category: 'Personal Funding',
    description: 'Direct-to-consumer installment loan for emergency capital, medical expenditures, home improvements, or major purchases.',
    typicalTerm: '12 - 48 Months',
    defaultCommissionRate: 7.0,
    defaultBaseFee: 695,
    isActive: true,
    sortOrder: 26,
    requiredFields: ['proofOfEmployment', 'bankStatements2Months', 'ficoScore'],
  },
  {
    id: 'peer_to_peer_loan',
    name: 'Peer-to-Peer (P2P) Personal Loan',
    category: 'Personal Funding',
    description: 'Direct marketplace loan syndicated across accredited institutional and retail investors at fixed competitive rates.',
    typicalTerm: '36 - 60 Months',
    defaultCommissionRate: 6.0,
    defaultBaseFee: 795,
    isActive: true,
    sortOrder: 27,
    requiredFields: ['annualIncome', 'ficoScore', 'dtiRatio'],
  },
  {
    id: 'signature_unsecured_loan',
    name: 'Signature / Unsecured Personal Loan',
    category: 'Personal Funding',
    description: 'High-FICO signature loan backed purely by the creditworthiness and signature of the borrower with rapid disbursement.',
    typicalTerm: '24 - 60 Months',
    defaultCommissionRate: 6.5,
    defaultBaseFee: 895,
    isActive: true,
    sortOrder: 28,
    requiredFields: ['primeFicoScore', 'verifiedIncome', 'governmentPhotoId'],
  },

  // 4. REAL ESTATE & PROPERTY FUNDING (8 products)
  {
    id: 'heloc',
    name: 'Home Equity Line of Credit (HELOC)',
    category: 'Real Estate & Property Funding',
    description: 'Revolving line of credit secured by residential property equity, featuring draw periods and flexible interest-only repayment options.',
    typicalTerm: '10-Year Draw / 20-Year Repay',
    defaultCommissionRate: 3.5,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 29,
    requiredFields: ['propertyAddress', 'estimatedHomeValue', 'currentMortgageBalance', 'cltvRatio'],
  },
  {
    id: 'hei',
    name: 'Home Equity Investment (HEI)',
    category: 'Real Estate & Property Funding',
    description: 'Debt-free equity sharing agreement where homeowners receive immediate lump-sum cash in exchange for a share of future property value.',
    typicalTerm: '10 - 30 Years (No Monthly Payment)',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 1795,
    isActive: true,
    sortOrder: 30,
    requiredFields: ['propertyAddress', 'homeEquityAmount', 'ownerOccupiedStatus'],
  },
  {
    id: 'fix_and_flip_bridge',
    name: 'Fix and Flip Bridge Loan',
    category: 'Real Estate & Property Funding',
    description: 'Short-term asset-based bridge loan covering up to 90% of purchase price and 100% of rehabilitation/construction budget for real estate investors.',
    typicalTerm: '6 - 18 Months',
    defaultCommissionRate: 3.5,
    defaultBaseFee: 1995,
    isActive: true,
    sortOrder: 31,
    requiredFields: ['purchasePrice', 'rehabBudget', 'afterRepairValue', 'investorExperience'],
  },
  {
    id: 'dscr_rental_loan',
    name: 'DSCR Rental Property Loan',
    category: 'Real Estate & Property Funding',
    description: 'Long-term investment property mortgage qualified purely based on the rental property cash flow / Debt Service Coverage Ratio (no personal income needed).',
    typicalTerm: '30-Year Fixed / ARM',
    defaultCommissionRate: 3.0,
    defaultBaseFee: 2195,
    isActive: true,
    sortOrder: 32,
    requiredFields: ['leaseAgreement', 'marketRentAppraisal', 'monthlyPititAmount', 'dscrRatio'],
  },
  {
    id: 'commercial_real_estate_mortgage',
    name: 'Commercial Real Estate (CRE) Mortgage',
    category: 'Real Estate & Property Funding',
    description: 'Permanent mortgage financing for owner-occupied or investor commercial buildings, warehouses, retail centers, and industrial facilities.',
    typicalTerm: '10 - 25 Years Amortization',
    defaultCommissionRate: 2.5,
    defaultBaseFee: 2995,
    isActive: true,
    sortOrder: 33,
    requiredFields: ['rentRoll', 'creOperatingStatements', 'propertyAppraisal'],
  },
  {
    id: 'ground_up_construction',
    name: 'Ground-Up Construction Loan',
    category: 'Real Estate & Property Funding',
    description: 'Construction loan structure with milestone-based draw schedules for residential developments, spec homes, and commercial ground-up projects.',
    typicalTerm: '12 - 24 Months Construction',
    defaultCommissionRate: 3.0,
    defaultBaseFee: 2995,
    isActive: true,
    sortOrder: 34,
    requiredFields: ['architecturalPlans', 'builderTrackRecord', 'itemizedCostBreakdown'],
  },
  {
    id: 'cash_out_commercial_refi',
    name: 'Cash-Out Commercial Refinance',
    category: 'Real Estate & Property Funding',
    description: 'Refinancing an existing commercial mortgage with higher loan proceeds to extract cash equity for company expansion or portfolio growth.',
    typicalTerm: '10 - 20 Years',
    defaultCommissionRate: 2.5,
    defaultBaseFee: 2495,
    isActive: true,
    sortOrder: 35,
    requiredFields: ['currentMortgageStatement', 'trailing12Income', 'propertyValuation'],
  },
  {
    id: 'hard_money_real_estate',
    name: 'Hard Money Real Estate Loan',
    category: 'Real Estate & Property Funding',
    description: 'Fast-closing private money loans secured by real property for opportunistic acquisitions, time-sensitive foreclosures, and distressed assets.',
    typicalTerm: '6 - 24 Months',
    defaultCommissionRate: 4.0,
    defaultBaseFee: 1995,
    isActive: true,
    sortOrder: 36,
    requiredFields: ['propertyAddress', 'liquidationValue', 'clearExitStrategy'],
  },

  // 5. SPECIALTY & ALTERNATIVE FINANCING (5 products)
  {
    id: 'microloans_sba',
    name: 'Microloans (Community Development / SBA)',
    category: 'Specialty & Alternative Financing',
    description: 'Targeted micro-credit facilities up to $50,000 designed for early-stage entrepreneurs, underserved markets, and non-traditional businesses.',
    typicalTerm: '12 - 72 Months',
    defaultCommissionRate: 4.5,
    defaultBaseFee: 495,
    isActive: true,
    sortOrder: 37,
    requiredFields: ['businessPlan', 'useOfFundsBreakdown', 'creditHistory'],
  },
  {
    id: 'startup_capital_seed',
    name: 'Startup Capital / Seed Program',
    category: 'Specialty & Alternative Financing',
    description: 'Custom-tailored funding stacks utilizing guarantor credit strength and projected financials for businesses under 2 years old.',
    typicalTerm: '12 - 48 Months',
    defaultCommissionRate: 8.0,
    defaultBaseFee: 1295,
    isActive: true,
    sortOrder: 38,
    requiredFields: ['executiveSummary', 'financialProjections', 'guarantorCredit'],
  },
  {
    id: 'mezzanine_financing',
    name: 'Mezzanine Financing',
    category: 'Specialty & Alternative Financing',
    description: 'Subordinated debt structure incorporating equity conversion features or warrants, filling the gap between senior debt and pure equity.',
    typicalTerm: '3 - 7 Years',
    defaultCommissionRate: 3.5,
    defaultBaseFee: 3495,
    isActive: true,
    sortOrder: 39,
    requiredFields: ['ebitdaHistorical', 'auditFinancialStatements', 'growthStrategy'],
  },
  {
    id: 'venture_debt',
    name: 'Venture Debt',
    category: 'Specialty & Alternative Financing',
    description: 'Growth debt for venture-backed startups and scale-ups with institutional VC backing to extend cash runway between equity rounds.',
    typicalTerm: '24 - 48 Months',
    defaultCommissionRate: 3.5,
    defaultBaseFee: 3495,
    isActive: true,
    sortOrder: 40,
    requiredFields: ['capTable', 'institutionalInvestorsList', 'monthlyCashBurnRate'],
  },
  {
    id: 'grant_matching_facility',
    name: 'Government / Grant Matching Facility',
    category: 'Specialty & Alternative Financing',
    description: 'Co-funding and matching loan facilities designed to complement state, federal SBIR/STTR, or municipal economic development grants.',
    typicalTerm: '12 - 60 Months',
    defaultCommissionRate: 4.0,
    defaultBaseFee: 1495,
    isActive: true,
    sortOrder: 41,
    requiredFields: ['grantAwardLetter', 'matchingRequirements', 'milestoneReport'],
  },

  // 6. OTHER / CUSTOM (1 product)
  {
    id: 'other',
    name: 'Other / Custom Product',
    category: 'Other / Custom',
    description: 'Custom or bespoke funding facility. Requires entering specific product type details and description.',
    typicalTerm: 'Custom Terms',
    defaultCommissionRate: 5.0,
    defaultBaseFee: 995,
    isActive: true,
    sortOrder: 42,
    requiredFields: ['otherProductType', 'otherProductDescription'],
  },
];

// Helper: Normalize lookup key
function normalizeKey(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Returns product definition matching ID or Name (handles legacy strings and partial matching)
 */
export function getProductByIdOrName(
  idOrName: string,
  customProducts?: FundingProductDefinition[]
): FundingProductDefinition | undefined {
  if (!idOrName) return undefined;
  const list = customProducts && customProducts.length > 0 ? customProducts : MASTER_FUNDING_PRODUCTS;
  const key = normalizeKey(idOrName);

  // Exact ID match
  const matchId = list.find((p) => p.id === idOrName);
  if (matchId) return matchId;

  // Exact Name match
  const matchName = list.find((p) => p.name.toLowerCase() === idOrName.toLowerCase());
  if (matchName) return matchName;

  // Normalized key match
  const matchKey = list.find(
    (p) => normalizeKey(p.id) === key || normalizeKey(p.name) === key
  );
  if (matchKey) return matchKey;

  // Legacy mappings
  if (key.includes('revenue') || key.includes('mca') || key.includes('workingcapital')) {
    return list.find((p) => p.id === 'revenue_funding');
  }
  if (key.includes('0pct') || key.includes('0') || key.includes('zeropercent') || key.includes('card')) {
    return list.find((p) => p.id === 'zero_pct_business_credit_cards');
  }
  if (key.includes('personal') && (key.includes('term') || key.includes('loan'))) {
    return list.find((p) => p.id === 'personal_term_loan');
  }
  if (key.includes('businessline') || key.includes('bloc') || key.includes('lineofcredit')) {
    return list.find((p) => p.id === 'business_line_of_credit');
  }
  if (key.includes('businessterm')) {
    return list.find((p) => p.id === 'business_term_loan');
  }
  if (key.includes('equipment')) {
    return list.find((p) => p.id === 'equipment_financing');
  }
  if (key.includes('sba')) {
    return list.find((p) => p.id === 'sba_7a_loan');
  }
  if (key.includes('heloc')) {
    return list.find((p) => p.id === 'heloc');
  }
  if (key.includes('hei')) {
    return list.find((p) => p.id === 'hei');
  }
  if (key.includes('dscr')) {
    return list.find((p) => p.id === 'dscr_rental_loan');
  }
  if (key.includes('other')) {
    return list.find((p) => p.id === 'other');
  }

  return undefined;
}

/**
 * Returns formatted product display name with custom details when 'Other'
 */
export function formatProductDisplayName(
  productNameOrId: string,
  otherType?: string,
  customProducts?: FundingProductDefinition[]
): string {
  if (!productNameOrId) return 'Not Specified';

  const def = getProductByIdOrName(productNameOrId, customProducts);
  const isOther =
    productNameOrId === 'other' ||
    productNameOrId === 'Other' ||
    productNameOrId === 'Other / Custom Product' ||
    productNameOrId === 'Other Valid Product' ||
    def?.id === 'other';

  if (isOther) {
    if (otherType && otherType.trim()) {
      return `Other (${otherType.trim()})`;
    }
    return 'Other / Custom Product';
  }

  return def?.name || productNameOrId;
}

/**
 * Returns whether the product is 'Other'
 */
export function isOtherProduct(idOrName: string): boolean {
  if (!idOrName) return false;
  const key = normalizeKey(idOrName);
  return (
    key === 'other' ||
    key === 'othercustomproduct' ||
    key === 'othervalidproduct' ||
    key.startsWith('other')
  );
}

/**
 * Returns products grouped by category
 */
export function getProductsGroupedByCategory(
  customProducts?: FundingProductDefinition[]
): Record<ProductCategory, FundingProductDefinition[]> {
  const list = customProducts && customProducts.length > 0 ? customProducts : MASTER_FUNDING_PRODUCTS;
  const grouped: Record<ProductCategory, FundingProductDefinition[]> = {
    'Business / Commercial Funding': [],
    'Credit / Card Funding': [],
    'Personal Funding': [],
    'Real Estate & Property Funding': [],
    'Specialty & Alternative Financing': [],
    'Other / Custom': [],
  };

  for (const product of list) {
    if (grouped[product.category]) {
      grouped[product.category].push(product);
    } else {
      grouped['Other / Custom'].push(product);
    }
  }

  return grouped;
}
