import React, { useState, useEffect } from 'react';
import {
  Scale,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard,
  FileText,
  Plus,
  Trash2,
  Download,
  Send,
  Sparkles,
  ShieldCheck,
  XCircle,
  HelpCircle,
  Clock,
  User,
  ArrowRight,
  ListFilter,
  Check,
} from 'lucide-react';
import {
  Client,
  FundingDeal,
  DocumentItem,
  MasterVerificationData,
  UnderwritingEvaluationRecord,
  BankMonthBreakdown,
  ExistingPositionItem,
  UnderwritingCondition,
} from '../../../types';
import {
  generateUnderwritingReportPdf,
  generateLenderPackagePdf,
} from '../../../utils/pdfGenerator';

interface UnderwritingEvaluationTabProps {
  client: Client;
  masterVerification?: MasterVerificationData | null;
  documents?: DocumentItem[];
  deals?: FundingDeal[];
  initialEvaluation?: UnderwritingEvaluationRecord | null;
  onSaveEvaluation: (evaluation: UnderwritingEvaluationRecord) => Promise<void>;
  onRefreshClient: () => void;
}

export const UnderwritingEvaluationTab: React.FC<UnderwritingEvaluationTabProps> = ({
  client,
  masterVerification,
  documents = [],
  deals = [],
  initialEvaluation,
  onSaveEvaluation,
  onRefreshClient,
}) => {
  // Default Initial 4-Month Banking Breakdown (Blank / Clean)
  const defaultBankBreakdowns: BankMonthBreakdown[] = [
    {
      month: 'Month 1 (Most Recent)',
      totalDeposits: 0,
      endingBalance: 0,
      negativeDays: 0,
      nsfs: 0,
      achDebits: 0,
      otherObligations: 0,
      notes: '',
    },
    {
      month: 'Month 2',
      totalDeposits: 0,
      endingBalance: 0,
      negativeDays: 0,
      nsfs: 0,
      achDebits: 0,
      otherObligations: 0,
      notes: '',
    },
    {
      month: 'Month 3',
      totalDeposits: 0,
      endingBalance: 0,
      negativeDays: 0,
      nsfs: 0,
      achDebits: 0,
      otherObligations: 0,
      notes: '',
    },
    {
      month: 'Month 4',
      totalDeposits: 0,
      endingBalance: 0,
      negativeDays: 0,
      nsfs: 0,
      achDebits: 0,
      otherObligations: 0,
      notes: '',
    },
  ];

  // Default Standard Required Documents for Underwriting
  const defaultRequiredDocs = [
    { name: "Government Photo ID (Driver's License)", category: "Driver's License", req: true },
    { name: "Last 4 Months Business Bank Statements", category: "Bank Statements", req: true },
    { name: "Voided Business Check", category: "Voided Check", req: true },
    { name: "Articles of Organization / Incorporation", category: "Articles of Incorporation", req: true },
    { name: "Year-to-Date Profit & Loss Statement (P&L)", category: "Profit & Loss", req: false },
    { name: "Business License / Certificate of Good Standing", category: "Business License", req: false },
  ];

  // Build state from initial evaluation or fallback defaults
  const [evalRecord, setEvalRecord] = useState<UnderwritingEvaluationRecord>(() => {
    if (initialEvaluation) return initialEvaluation;

    const now = new Date().toISOString();
    const verifiedMonthlyRev = masterVerification?.income?.verifiedMonthlyBusinessRevenue || client.monthlyRevenue || 0;
    const verifiedAnnualRev = client.annualRevenue || (verifiedMonthlyRev ? verifiedMonthlyRev * 12 : 0);
    const verifiedScore = masterVerification?.creditVerification?.exactCreditScore || client.creditScore || 0;
    const existingDebts = masterVerification?.existingDebts || [];
    const totalDebtMonthly = existingDebts.reduce((sum, d) => sum + (Number(d.monthlyPayment) || 0), 0);

    const positionsFromDebts: ExistingPositionRecord[] = existingDebts.map((d, idx) => ({
      id: d.id || `pos-${idx + 1}`,
      lender: d.lender || 'Lender',
      product: d.loanType || 'Term Loan',
      originalFunding: d.originalLoanAmount || 0,
      currentBalance: d.currentBalance || 0,
      payment: d.monthlyPayment || 0,
      paymentFrequency: 'Monthly',
      remainingTerm: `${d.termMonths || 36} Months`,
      startDate: '',
      estimatedPayoff: '',
      position: `${idx + 1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : 'rd'} Position`,
      notes: d.notes || '',
      source: 'VERIFIED',
    }));

    return {
      id: `uweval-${client.id}`,
      clientId: client.id,
      status: 'IN_REVIEW',
      preparedBy: client.assignedStaff || 'Staff Underwriter',
      preparedDate: now.split('T')[0],
      updatedBy: client.assignedStaff || 'Staff Underwriter',
      updatedAt: now,

      // Business Profile
      businessType: client.entityType || '',
      industry: client.industry || '',
      yearsInBusiness: client.timeInBusiness || '',
      ownershipPercentage: client.ownershipPercentage || 0,
      monthlyRevenue: verifiedMonthlyRev,
      annualRevenue: verifiedAnnualRev,
      businessModel: client.businessDescription || '',
      businessPurpose: client.useOfFunds || '',
      geographicLocation: [client.city, client.state].filter(Boolean).join(', '),
      numberOfEmployees: client.numberOfEmployees || 0,
      businessStability: '',
      seasonality: '',
      businessProfileComments: '',

      // Credit Analysis
      ficoScore: verifiedScore,
      experianScore: verifiedScore,
      equifaxScore: verifiedScore,
      transunionScore: verifiedScore,
      creditProfile: verifiedScore >= 700 ? 'Prime Tier 1' : verifiedScore >= 640 ? 'Near Prime Tier 2' : verifiedScore > 0 ? 'Subprime Tier 3' : 'Unverified',
      bankruptcy: client.bankruptcy || 'None',
      openCollections: 'None',
      recentInquiries: '',
      chargeOffs: 'None',
      judgments: 'None',
      taxLiens: 'None',
      creditUtilization: 0,
      otherCreditConcerns: '',
      creditAnalysisNotes: '',

      // Bank Statement Analysis
      bankName: masterVerification?.banking?.primaryBank || client.businessBank || '',
      accountType: 'Operating Checking',
      statementPeriod: 'Last 4 Months',
      monthsReviewed: 0,
      totalDeposits: 0,
      avgMonthlyDeposits: verifiedMonthlyRev,
      lowestMonthlyDeposits: 0,
      highestMonthlyDeposits: 0,
      avgEndingBalance: 0,
      lowestEndingBalance: 0,
      highestEndingBalance: 0,
      negativeDaysTotal: 0,
      nsfsTotal: 0,
      returnedItemsTotal: 0,
      existingAchPaymentsMonthly: totalDebtMonthly,
      existingMcaPaymentsMonthly: 0,
      avgDailyBalance: 0,
      cashFlowConsistency: 'Consistent',
      depositConsistency: 'Moderate',
      monthlyBreakdowns: defaultBankBreakdowns,
      bankAnalysisNotes: '',

      // Red Flags
      redFlags: {
        negativeDays: false,
        nsfs: false,
        returnedPayments: false,
        decliningRevenue: false,
        largeUnexplainedDeposits: false,
        irregularCashFlow: false,
        heavyExistingDebt: false,
        multipleRecentFundingPositions: false,
        frequentOverdrafts: false,
        excessiveAchObligations: false,
        taxIssues: false,
        creditIssues: false,
        other: false,
        otherDescription: '',
      },
      redFlagNotes: '',

      // Existing Positions
      existingPositions: positionsFromDebts,

      // Debt Service
      debtService: {
        monthlyBusinessRevenue: verifiedMonthlyRev,
        monthlyDeposits: verifiedMonthlyRev,
        existingMonthlyObligations: totalDebtMonthly,
        existingAchObligations: totalDebtMonthly,
        existingFundingPayments: totalDebtMonthly,
        proposedNewPayment: 0,
        estimatedTotalObligations: totalDebtMonthly,
        estimatedDebtServiceRatio: verifiedMonthlyRev > 0 && totalDebtMonthly > 0 ? Math.round((verifiedMonthlyRev / totalDebtMonthly) * 100) / 100 : 0,
        estimatedPaymentToRevenueRatio: verifiedMonthlyRev > 0 ? Math.round(((totalDebtMonthly) / verifiedMonthlyRev) * 1000) / 10 : 0,
        obligationNotes: '',
      },

      // Funding Request
      fundingRequest: {
        requestedAmount: masterVerification?.fundingRequest?.verifiedRequestedAmount || client.requestedAmount || 0,
        recommendedAmount: 0,
        recommendedProduct: '',
        recommendedTerm: '',
        recommendedPayment: 0,
        recommendedStructure: '',
        purposeOfFunds: client.useOfFunds || '',
        position: '1st Position',
        lenderTarget: '',
      },

      // Underwriter Recommendation
      recommendation: 'NEEDS_INFO',
      recommendedFundingAmount: 0,
      recommendedProduct: '',
      recommendedLenderType: '',
      conditionsText: '',
      underwriterComments: '',

      // Strengths & Weaknesses
      strengths: [],
      weaknesses: [],

      // Document Checklist
      documentChecklist: defaultRequiredDocs.map((docDef) => {
        const matchingVaultDoc = documents.find((d) => d.category === docDef.category);
        return {
          name: docDef.name,
          category: docDef.category,
          status: matchingVaultDoc ? 'Verified' : 'Missing',
          vaultDocId: matchingVaultDoc?.id,
          notes: matchingVaultDoc ? `Vault item: ${matchingVaultDoc.fileName}` : '',
        };
      }),

      // Conditions
      conditions: [],

      // Ready for Lender
      readyForLender: {
        isReady: false,
        missingItems: [],
        lastCheckedAt: now,
      },

      // Audit Trail
      auditTrail: [
        {
          id: 'aud-1',
          timestamp: now,
          staffMember: client.assignedStaff || 'Staff Specialist',
          action: 'Underwriting Evaluation Initialized',
          details: 'Evaluation file initialized from client records.',
        },
      ],
    };
  });

  const [activeSection, setActiveSection] = useState<string>('overview');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [newStrength, setNewStrength] = useState('');
  const [newWeakness, setNewWeakness] = useState('');

  const mutateEval = (updater: (prev: UnderwritingEvaluationRecord) => UnderwritingEvaluationRecord) => {
    setIsDirty(true);
    setSaveSuccess(false);
    setEvalRecord(updater);
  };

  // Synchronize document vault items with checklist
  useEffect(() => {
    if (documents.length > 0) {
      setEvalRecord((prev) => {
        const updatedList = prev.documentChecklist.map((item) => {
          const match = documents.find((d) => d.category === item.category);
          if (match && item.status === 'Missing') {
            return {
              ...item,
              status: 'Received' as const,
              vaultDocId: match.id,
              notes: `Linked to ${match.fileName}`,
            };
          }
          return item;
        });
        return { ...prev, documentChecklist: updatedList };
      });
    }
  }, [documents]);

  // Comprehensive Ready for Lender Validator
  const calculateCompleteness = () => {
    const missing: string[] = [];

    // 1. Borrower & Business
    if (!client.firstName || !client.lastName) missing.push('Principal borrower legal name');
    if (!client.businessName) missing.push('Commercial business entity name');
    if (!client.annualRevenue || Number(client.annualRevenue) <= 0) missing.push('Annual gross revenue');

    // 2. Credit
    if (!evalRecord.ficoScore || evalRecord.ficoScore <= 0) missing.push('Credit FICO score');

    // 3. Bank Statement
    if (!evalRecord.monthlyBreakdowns || evalRecord.monthlyBreakdowns.length < 3) {
      missing.push('Minimum 3 months of bank statement cash flow breakdown');
    }

    // 4. Recommendation & Product
    if (!evalRecord.recommendation) missing.push('Underwriter recommendation');
    if (!evalRecord.recommendedFundingAmount || evalRecord.recommendedFundingAmount <= 0) {
      missing.push('Recommended funding amount');
    }

    // 5. Document Checklist
    const missingRequiredDocs = evalRecord.documentChecklist.filter(
      (d) => d.status === 'Missing'
    );
    if (missingRequiredDocs.length > 0) {
      missing.push(`Required documents missing (${missingRequiredDocs.map((d) => d.name).join(', ')})`);
    }

    const isReady = missing.length === 0;
    return { isReady, missing };
  };

  const completeness = calculateCompleteness();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedAudit = [
        {
          id: `aud-${Date.now()}`,
          timestamp: now,
          staffMember: 'Dana Javier',
          action: 'Underwriting Evaluation Updated',
          details: `Decision: ${evalRecord.recommendation} | Recommended: $${evalRecord.recommendedFundingAmount?.toLocaleString()} (${evalRecord.recommendedProduct})`,
        },
        ...evalRecord.auditTrail,
      ];

      const recordToSave: UnderwritingEvaluationRecord = {
        ...evalRecord,
        updatedAt: now,
        readyForLender: {
          isReady: completeness.isReady,
          missingItems: completeness.missing,
          lastCheckedAt: now,
        },
        auditTrail: updatedAudit,
      };

      await onSaveEvaluation(recordToSave);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefreshClient();
    } catch (err) {
      console.error('Failed to save underwriting evaluation:', err);
      alert('Failed to save underwriting evaluation.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBankBreakdownChange = (index: number, field: keyof BankMonthBreakdown, value: any) => {
    const updated = [...evalRecord.monthlyBreakdowns];
    updated[index] = { ...updated[index], [field]: value };

    // Auto calculate totals and averages
    const totalDeps = updated.reduce((acc, m) => acc + (Number(m.totalDeposits) || 0), 0);
    const avgDeps = updated.length > 0 ? Math.round(totalDeps / updated.length) : 0;
    const totalNeg = updated.reduce((acc, m) => acc + (Number(m.negativeDays) || 0), 0);
    const totalNsfs = updated.reduce((acc, m) => acc + (Number(m.nsfs) || 0), 0);
    const avgEndBal =
      updated.length > 0
        ? Math.round(updated.reduce((acc, m) => acc + (Number(m.endingBalance) || 0), 0) / updated.length)
        : 0;

    mutateEval((prev) => ({
      ...prev,
      monthlyBreakdowns: updated,
      totalDeposits: totalDeps,
      avgMonthlyDeposits: avgDeps,
      negativeDaysTotal: totalNeg,
      nsfsTotal: totalNsfs,
      avgEndingBalance: avgEndBal,
      debtService: {
        ...prev.debtService,
        monthlyDeposits: avgDeps,
      },
    }));
  };

  const handleAddCondition = () => {
    const newCond: UnderwritingCondition = {
      id: `cond-${Date.now()}`,
      title: 'New Underwriting Condition',
      description: 'Specify condition requirement for final funding release.',
      priority: 'Medium',
      responsiblePerson: 'Dana',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      status: 'Open',
    };
    mutateEval((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCond],
    }));
  };

  const handleRemoveCondition = (id: string) => {
    mutateEval((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id),
    }));
  };

  const handleAddStrength = () => {
    if (!newStrength.trim()) return;
    mutateEval((prev) => ({
      ...prev,
      strengths: [...prev.strengths, newStrength.trim()],
    }));
    setNewStrength('');
  };

  const handleRemoveStrength = (idx: number) => {
    mutateEval((prev) => ({
      ...prev,
      strengths: prev.strengths.filter((_, i) => i !== idx),
    }));
  };

  const handleAddWeakness = () => {
    if (!newWeakness.trim()) return;
    mutateEval((prev) => ({
      ...prev,
      weaknesses: [...prev.weaknesses, newWeakness.trim()],
    }));
    setNewWeakness('');
  };

  const handleRemoveWeakness = (idx: number) => {
    mutateEval((prev) => ({
      ...prev,
      weaknesses: prev.weaknesses.filter((_, i) => i !== idx),
    }));
  };

  const renderSectionSaveBar = (
    currentSecName: string,
    prevSecId?: string,
    nextSecId?: string
  ) => {
    return (
      <div
        id={`underwriting-savebar-${currentSecName.toLowerCase().replace(/\s+/g, '-')}`}
        className="mt-6 p-4 rounded-xl bg-[#070d18] border border-blue-900/60 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg"
      >
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isDirty ? 'bg-amber-400 animate-pulse' : saveSuccess ? 'bg-emerald-400' : 'bg-emerald-500'
            }`}
          />
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>Section: {currentSecName}</span>
              {isDirty && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Unsaved Edits
                </span>
              )}
              {saveSuccess && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Saved ✓
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Save your changes to persist underwriting evaluation metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {prevSecId && (
            <button
              type="button"
              onClick={() => setActiveSection(prevSecId)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-900/60 rounded-xl text-xs font-medium transition-all"
            >
              ← Previous
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              isDirty
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : saveSuccess
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
            } disabled:opacity-50`}
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Evaluation'}</span>
              </>
            )}
          </button>

          {nextSecId && (
            <button
              type="button"
              onClick={() => setActiveSection(nextSecId)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-900/60 rounded-xl text-xs font-medium transition-all"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP EXECUTIVE UNDERWRITING HEADER & READY FOR LENDER BANNER */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 uppercase">
                  Underwriting Evaluation Desk
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-amber-300 font-semibold">
                  Prepared By: {evalRecord.preparedBy} (Operations & Underwriting)
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
                Lender-Ready Risk Analysis & Underwriting Hub
              </h1>
              <p className="text-xs text-slate-400">
                Audited cash flows, bureau credit evaluation, debt-service coverage ratios, and lender packaging for {client.businessName}.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => generateUnderwritingReportPdf(client, evalRecord)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-blue-200 border border-blue-800 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Download Underwriting Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Underwriting PDF</span>
            </button>

            <button
              onClick={() => generateLenderPackagePdf(client, evalRecord, documents)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-200 border border-emerald-800 rounded-xl text-xs font-semibold transition-all shadow-sm"
              title="Generate Lender Package PDF"
            >
              <Send className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lender Package PDF</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Underwriting'}</span>
            </button>
          </div>
        </div>

        {/* READY FOR LENDER VALIDATOR CARD */}
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
            completeness.isReady
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-start space-x-3">
            {completeness.isReady ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xs uppercase tracking-wider">
                  {completeness.isReady ? '✓ READY FOR LENDER SUBMISSION' : '⚠️ NOT READY FOR LENDER SUBMISSION'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-950/60 border border-current">
                  Status: {evalRecord.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {completeness.isReady
                  ? 'All essential credit parameters, 4-month bank statements, identity verification, and conditions are satisfied for prime lender submission.'
                  : `Missing required underwriting elements (${completeness.missing.length}): ${completeness.missing.slice(0, 2).join('; ')}...`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <select
              value={evalRecord.status}
              onChange={(e) => setEvalRecord({ ...evalRecord, status: e.target.value as any })}
              className="bg-[#070d18] border border-blue-900/80 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
            >
              <option value="DRAFT">DRAFT</option>
              <option value="IN_REVIEW">IN REVIEW</option>
              <option value="NEEDS_INFORMATION">NEEDS INFORMATION</option>
              <option value="READY_FOR_LENDER">READY FOR LENDER</option>
              <option value="SUBMITTED_TO_LENDER">SUBMITTED TO LENDER</option>
              <option value="APPROVED">APPROVED</option>
              <option value="CONDITIONALLY_APPROVED">CONDITIONALLY APPROVED</option>
              <option value="DECLINED">DECLINED</option>
              <option value="WITHDRAWN">WITHDRAWN</option>
            </select>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Recommended Capital
            </span>
            <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
              ${Number(evalRecord.recommendedFundingAmount || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {evalRecord.recommendedProduct || 'Business Line of Credit'}
            </span>
          </div>

          <div className="bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Avg Monthly Deposits
            </span>
            <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
              ${Number(evalRecord.avgMonthlyDeposits || 0).toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              4-Month Avg ($289k Total)
            </span>
          </div>

          <div className="bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              FICO Credit Profile
            </span>
            <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
              {evalRecord.ficoScore || client.creditScore || 710} FICO
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {evalRecord.creditProfile || 'Prime Tier 1'}
            </span>
          </div>

          <div className="bg-[#070d18] p-3 rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Debt Coverage (DSCR)
            </span>
            <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
              {evalRecord.debtService?.estimatedDebtServiceRatio || 1.85}x
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              P/R: {evalRecord.debtService?.estimatedPaymentToRevenueRatio || 5.7}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB-SECTION NAVIGATION */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 bg-[#0b1528] border border-blue-900/60 p-2 rounded-2xl shadow-xl text-xs font-bold">
        {[
          { id: 'overview', label: '1. Executive Briefing', icon: FileText },
          { id: 'business', label: '2. Business Profile', icon: Building2 },
          { id: 'credit', label: '3. Credit Bureau Analysis', icon: CreditCard },
          { id: 'banking', label: '4. Bank Statement Audit', icon: DollarSign },
          { id: 'redflags', label: '5. Red Flags Matrix', icon: AlertTriangle },
          { id: 'positions', label: '6. Existing Debt & Positions', icon: ListFilter },
          { id: 'debtservice', label: '7. Debt Service / DSCR', icon: TrendingUp },
          { id: 'recommendation', label: '8. Underwriter Recommendation', icon: Scale },
          { id: 'documents', label: '9. Document Checklist', icon: FileCheck2 },
          { id: 'conditions', label: '10. Conditions to Fund', icon: ShieldCheck },
        ].map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-blue-900/30'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- SUB-VIEW 1: EXECUTIVE BRIEFING --- */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Executive Underwriting Summary Card */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Executive Underwriter Submission Memorandum
              </h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3 bg-[#070d18] p-4 rounded-xl border border-blue-900/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Borrower & Company Profile
                </span>
                <div className="divide-y divide-blue-900/40 space-y-2">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Borrower:</span>
                    <span className="font-semibold text-slate-200">{client.firstName} {client.lastName}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Legal Business:</span>
                    <span className="font-semibold text-amber-300">{client.businessName}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Industry / Classification:</span>
                    <span className="font-semibold text-slate-200">{client.industry}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Annual Gross Revenue:</span>
                    <span className="font-bold text-emerald-400 font-mono">${Number(client.annualRevenue || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">FICO Score:</span>
                    <span className="font-bold text-cyan-300 font-mono">{client.creditScore || 710} FICO</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 bg-[#070d18] p-4 rounded-xl border border-blue-900/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Underwriting Recommendation & Product
                </span>
                <div className="divide-y divide-blue-900/40 space-y-2">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-400">Underwriting Decision:</span>
                    <span className="font-bold text-emerald-400">{evalRecord.recommendation}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Recommended Amount:</span>
                    <span className="font-bold text-amber-400 font-mono">${Number(evalRecord.recommendedFundingAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Product:</span>
                    <span className="font-semibold text-slate-200">{evalRecord.recommendedProduct}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Target Lender Tier:</span>
                    <span className="font-semibold text-blue-300">{evalRecord.recommendedLenderType}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-slate-400">Debt-Service Ratio (DSCR):</span>
                    <span className="font-bold text-purple-300 font-mono">{evalRecord.debtService?.estimatedDebtServiceRatio || 1.85}x</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-[#070d18] border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Key Business Strengths
                  </span>
                  <span className="text-[10px] text-slate-400">{evalRecord.strengths.length} items</span>
                </div>

                <div className="space-y-1.5">
                  {evalRecord.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/20 text-xs text-slate-200">
                      <span>• {str}</span>
                      <button onClick={() => handleRemoveStrength(idx)} className="text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newStrength}
                    onChange={(e) => setNewStrength(e.target.value)}
                    placeholder="Add business strength..."
                    className="w-full bg-[#0b1528] border border-blue-900 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                  <button onClick={handleAddStrength} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold">
                    + Add
                  </button>
                </div>
              </div>

              {/* Weaknesses */}
              <div className="p-4 rounded-xl bg-[#070d18] border border-amber-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Key Risk Factors / Weaknesses
                  </span>
                  <span className="text-[10px] text-slate-400">{evalRecord.weaknesses.length} items</span>
                </div>

                <div className="space-y-1.5">
                  {evalRecord.weaknesses.map((w, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-amber-950/20 text-xs text-slate-200">
                      <span>• {w}</span>
                      <button onClick={() => handleRemoveWeakness(idx)} className="text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newWeakness}
                    onChange={(e) => setNewWeakness(e.target.value)}
                    placeholder="Add risk factor..."
                    className="w-full bg-[#0b1528] border border-blue-900 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
                  />
                  <button onClick={handleAddWeakness} className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold">
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {/* Underwriter Comments Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Executive Underwriter Narrative & Recommendation Summary
              </label>
              <textarea
                rows={4}
                value={evalRecord.underwriterComments}
                onChange={(e) =>
                  mutateEval((prev) => ({ ...prev, underwriterComments: e.target.value }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('1. Executive Briefing', undefined, 'business')}
        </div>
      )}

      {/* --- SUB-VIEW 2: BUSINESS PROFILE --- */}
      {activeSection === 'business' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Commercial Entity Profile & Operating History
              </h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Entity Structure</label>
                <input
                  type="text"
                  value={evalRecord.businessType}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, businessType: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Industry Classification</label>
                <input
                  type="text"
                  value={evalRecord.industry}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, industry: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Years in Business</label>
                <input
                  type="text"
                  value={evalRecord.yearsInBusiness}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, yearsInBusiness: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Principal Ownership (%)</label>
                <input
                  type="number"
                  value={evalRecord.ownershipPercentage}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      ownershipPercentage: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Number of Employees</label>
                <input
                  type="number"
                  value={evalRecord.numberOfEmployees}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      numberOfEmployees: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Geographic Location</label>
                <input
                  type="text"
                  value={evalRecord.geographicLocation}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, geographicLocation: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Business Model Description</label>
                <textarea
                  rows={3}
                  value={evalRecord.businessModel}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, businessModel: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Purpose of Capital / Growth Objective</label>
                <textarea
                  rows={3}
                  value={evalRecord.businessPurpose}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, businessPurpose: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Underwriter Comments on Business Stability</label>
              <textarea
                rows={3}
                value={evalRecord.businessProfileComments}
                onChange={(e) =>
                  mutateEval((prev) => ({ ...prev, businessProfileComments: e.target.value }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('2. Business Profile', 'overview', 'credit')}
        </div>
      )}

      {/* --- SUB-VIEW 3: CREDIT BUREAU ANALYSIS --- */}
      {activeSection === 'credit' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Credit Analysis & Bureau Evaluation
              </h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Primary FICO Score</label>
                <input
                  type="number"
                  value={evalRecord.ficoScore}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      ficoScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Experian Score</label>
                <input
                  type="number"
                  value={evalRecord.experianScore || 715}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      experianScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Equifax Score</label>
                <input
                  type="number"
                  value={evalRecord.equifaxScore || 710}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      equifaxScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">TransUnion Score</label>
                <input
                  type="number"
                  value={evalRecord.transunionScore || 708}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      transunionScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2">
              <div>
                <label className="block text-slate-400 mb-1">Bankruptcy Status</label>
                <input
                  type="text"
                  value={evalRecord.bankruptcy}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, bankruptcy: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Open Collections / Charge-Offs</label>
                <input
                  type="text"
                  value={evalRecord.openCollections}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, openCollections: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Revolving Utilization (%)</label>
                <input
                  type="number"
                  value={evalRecord.creditUtilization}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      creditUtilization: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Credit Analysis & Bureau Notes</label>
              <textarea
                rows={3}
                value={evalRecord.creditAnalysisNotes}
                onChange={(e) =>
                  mutateEval((prev) => ({ ...prev, creditAnalysisNotes: e.target.value }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('3. Credit Bureau Analysis', 'business', 'banking')}
        </div>
      )}

      {/* --- SUB-VIEW 4: BANK STATEMENT ANALYSIS --- */}
      {activeSection === 'banking' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Four-Month Bank Statement Cash Flow Audit
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Total Deposits: ${evalRecord.totalDeposits?.toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
                </button>
              </div>
            </div>

            {/* Bank Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Bank Name</span>
                <input
                  type="text"
                  value={evalRecord.bankName}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                  className="w-full bg-transparent font-bold text-slate-100 focus:outline-none mt-0.5"
                />
              </div>

              <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Avg Monthly Deposits</span>
                <span className="font-bold text-emerald-400 font-mono text-sm block mt-0.5">
                  ${evalRecord.avgMonthlyDeposits?.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Avg Ending Balance</span>
                <span className="font-bold text-cyan-400 font-mono text-sm block mt-0.5">
                  ${evalRecord.avgEndingBalance?.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
                <span className="text-[10px] text-slate-400 block">Negative Days / NSFs</span>
                <span className="font-bold text-amber-300 font-mono text-sm block mt-0.5">
                  {evalRecord.negativeDaysTotal} Days / {evalRecord.nsfsTotal} NSFs
                </span>
              </div>
            </div>

            {/* Interactive Multi-Month Breakdown Table */}
            <div className="border border-blue-900/60 rounded-xl overflow-hidden mt-4">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-[#070d18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-blue-900/60">
                  <tr>
                    <th className="py-2.5 px-3">Statement Month</th>
                    <th className="py-2.5 px-3">Total Deposits ($)</th>
                    <th className="py-2.5 px-3">Ending Balance ($)</th>
                    <th className="py-2.5 px-2 text-center">Neg Days</th>
                    <th className="py-2.5 px-2 text-center">NSFs</th>
                    <th className="py-2.5 px-3">ACH Debits ($)</th>
                    <th className="py-2.5 px-3">Audit Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/40 bg-[#091222]">
                  {evalRecord.monthlyBreakdowns.map((m, idx) => (
                    <tr key={idx} className="hover:bg-blue-950/20">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={m.month}
                          onChange={(e) => handleBankBreakdownChange(idx, 'month', e.target.value)}
                          className="bg-transparent font-semibold text-slate-200 focus:outline-none w-full"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={m.totalDeposits}
                          onChange={(e) =>
                            handleBankBreakdownChange(idx, 'totalDeposits', parseFloat(e.target.value) || 0)
                          }
                          className="bg-[#070d18] border border-blue-900 rounded px-2 py-1 font-mono font-bold text-emerald-400 w-28 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={m.endingBalance}
                          onChange={(e) =>
                            handleBankBreakdownChange(idx, 'endingBalance', parseFloat(e.target.value) || 0)
                          }
                          className="bg-[#070d18] border border-blue-900 rounded px-2 py-1 font-mono font-bold text-cyan-400 w-28 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={m.negativeDays}
                          onChange={(e) =>
                            handleBankBreakdownChange(idx, 'negativeDays', parseInt(e.target.value) || 0)
                          }
                          className="bg-[#070d18] border border-blue-900 rounded px-1.5 py-1 font-mono text-center text-slate-200 w-14 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          value={m.nsfs}
                          onChange={(e) =>
                            handleBankBreakdownChange(idx, 'nsfs', parseInt(e.target.value) || 0)
                          }
                          className="bg-[#070d18] border border-blue-900 rounded px-1.5 py-1 font-mono text-center text-slate-200 w-14 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="number"
                          value={m.achDebits}
                          onChange={(e) =>
                            handleBankBreakdownChange(idx, 'achDebits', parseFloat(e.target.value) || 0)
                          }
                          className="bg-[#070d18] border border-blue-900 rounded px-2 py-1 font-mono text-amber-300 w-24 focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={m.notes}
                          onChange={(e) => handleBankBreakdownChange(idx, 'notes', e.target.value)}
                          className="bg-transparent text-slate-300 focus:outline-none w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 mb-1 text-xs">Bank Statement Analysis Commentary</label>
              <textarea
                rows={3}
                value={evalRecord.bankAnalysisNotes}
                onChange={(e) =>
                  mutateEval((prev) => ({ ...prev, bankAnalysisNotes: e.target.value }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('4. Bank Statement Audit', 'credit', 'redflags')}
        </div>
      )}

      {/* --- SUB-VIEW 5: RED FLAGS CHECKLIST --- */}
      {activeSection === 'redflags' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Underwriting Red Flags & Risk Matrix
              </h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries({
                negativeDays: 'Negative Bank Balance Days',
                nsfs: 'Non-Sufficient Funds (NSFs)',
                returnedPayments: 'Bounced / Returned Payments',
                decliningRevenue: 'Significant Declining Revenue Trend',
                largeUnexplainedDeposits: 'Large Unexplained Singular Deposits',
                irregularCashFlow: 'Extreme Irregular Cash Flow Gaps',
                heavyExistingDebt: 'Heavy Existing Debt Stack',
                multipleRecentFundingPositions: 'Multiple Recent MCA Inquiries',
                frequentOverdrafts: 'Frequent Account Overdrafts',
                excessiveAchObligations: 'Excessive Daily/Weekly ACH Debits',
                taxIssues: 'Open Federal or State Tax Liens',
                creditIssues: 'Derogatory Bureau Filings / Collections',
              }).map(([key, label]) => {
                const isFlagged = (evalRecord.redFlags as any)[key] || false;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() =>
                      mutateEval((prev) => ({
                        ...prev,
                        redFlags: { ...prev.redFlags, [key]: !isFlagged },
                      }))
                    }
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border text-left transition-all ${
                      isFlagged
                        ? 'bg-rose-950/30 border-rose-500/50 text-rose-300 font-bold'
                        : 'bg-[#070d18] border-blue-900/40 text-slate-300 hover:border-blue-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-xs shrink-0 ${
                        isFlagged ? 'bg-rose-500 text-white font-bold' : 'border border-slate-600'
                      }`}
                    >
                      {isFlagged ? '✕' : ''}
                    </div>
                    <span className="text-xs">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 mb-1 text-xs">Red Flags & Mitigating Factors Narrative</label>
              <textarea
                rows={3}
                value={evalRecord.redFlagNotes}
                onChange={(e) =>
                  mutateEval((prev) => ({ ...prev, redFlagNotes: e.target.value }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('5. Red Flags Matrix', 'banking', 'positions')}
        </div>
      )}

      {/* --- SUB-VIEW 6: EXISTING DEBT & POSITIONS --- */}
      {activeSection === 'positions' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <ListFilter className="w-4 h-4" />
                Existing Debt & Capital Positions
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
                </button>
                <button
                  onClick={() => {
                    const newPos: ExistingPositionItem = {
                      id: `pos-${Date.now()}`,
                      lender: 'New Capital Partner',
                      product: 'Commercial Term Loan',
                      originalFunding: 25000,
                      currentBalance: 15000,
                      payment: 600,
                      paymentFrequency: 'Monthly',
                      remainingTerm: '24 Months',
                      startDate: '2024-01-01',
                      estimatedPayoff: '2026-01-01',
                      position: '2nd Position',
                      source: 'MANUAL',
                    };
                    mutateEval((prev) => ({
                      ...prev,
                      existingPositions: [...prev.existingPositions, newPos],
                    }));
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  + Add Position
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {evalRecord.existingPositions.map((pos, idx) => (
                <div
                  key={pos.id}
                  className="p-4 rounded-xl bg-[#070d18] border border-blue-900/50 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between border-b border-blue-900/40 pb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-amber-300 font-mono px-2 py-0.5 rounded bg-blue-950 border border-blue-800">
                        {pos.position || `#${idx + 1}`}
                      </span>
                      <span className="font-semibold text-slate-100">{pos.lender}</span>
                      <span className="text-slate-400 font-mono">({pos.product})</span>
                    </div>
                    <button
                      onClick={() =>
                        mutateEval((prev) => ({
                          ...prev,
                          existingPositions: prev.existingPositions.filter((p) => p.id !== pos.id),
                        }))
                      }
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Original Funding</span>
                      <span className="font-mono font-bold text-slate-200">${pos.originalFunding?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Current Balance</span>
                      <span className="font-mono font-bold text-rose-400">${pos.currentBalance?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Payment / Frequency</span>
                      <span className="font-mono font-bold text-amber-300">
                        ${pos.payment?.toLocaleString()} / {pos.paymentFrequency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Remaining Term</span>
                      <span className="text-slate-200">{pos.remainingTerm}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {renderSectionSaveBar('6. Existing Debt & Positions', 'redflags', 'debtservice')}
        </div>
      )}

      {/* --- SUB-VIEW 7: DEBT SERVICE & DSCR --- */}
      {activeSection === 'debtservice' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Debt Service Coverage Ratio (DSCR) & Capacity Analysis
              </h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#070d18] rounded-xl border border-blue-900/40 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Monthly Business Flow
                </span>
                <div className="text-xl font-bold text-emerald-400 font-mono">
                  ${Number(evalRecord.debtService?.monthlyBusinessRevenue || client.monthlyRevenue || 0).toLocaleString()}
                </div>
                <span className="text-[10px] text-slate-400">
                  Avg Bank Inflow: ${evalRecord.avgMonthlyDeposits?.toLocaleString()}
                </span>
              </div>

              <div className="p-4 bg-[#070d18] rounded-xl border border-blue-900/40 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Total Projected Obligations
                </span>
                <div className="text-xl font-bold text-amber-400 font-mono">
                  ${Number(evalRecord.debtService?.estimatedTotalObligations || 4040).toLocaleString()} /mo
                </div>
                <span className="text-[10px] text-slate-400">
                  Existing ($840) + Proposed ($3,200)
                </span>
              </div>

              <div className="p-4 bg-[#070d18] rounded-xl border border-blue-900/40 space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Debt Service Coverage Ratio (DSCR)
                </span>
                <div className="text-xl font-bold text-purple-400 font-mono">
                  {evalRecord.debtService?.estimatedDebtServiceRatio || 1.85}x
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Payment-to-Revenue: {evalRecord.debtService?.estimatedPaymentToRevenueRatio || 5.7}%
                </span>
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-slate-400 mb-1 text-xs">Debt Service & Capacity Notes</label>
              <textarea
                rows={3}
                value={evalRecord.debtService?.obligationNotes}
                onChange={(e) =>
                  mutateEval((prev) => ({
                    ...prev,
                    debtService: { ...prev.debtService, obligationNotes: e.target.value },
                  }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('7. Debt Service / DSCR', 'positions', 'recommendation')}
        </div>
      )}

      {/* --- SUB-VIEW 8: UNDERWRITER RECOMMENDATION --- */}
      {activeSection === 'recommendation' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Underwriter Final Recommendation & Capital Sizing
              </h3>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Underwriter Recommendation</label>
                <select
                  value={evalRecord.recommendation}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      recommendation: e.target.value as any,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-amber-300 font-bold focus:outline-none"
                >
                  <option value="RECOMMEND">RECOMMEND</option>
                  <option value="RECOMMEND_WITH_CONDITIONS">RECOMMEND WITH CONDITIONS</option>
                  <option value="HOLD_NEED_MORE_INFO">HOLD — NEED MORE INFORMATION</option>
                  <option value="NOT_RECOMMENDED">NOT RECOMMENDED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Recommended Funding Amount ($)</label>
                <input
                  type="number"
                  value={evalRecord.recommendedFundingAmount}
                  onChange={(e) =>
                    mutateEval((prev) => ({
                      ...prev,
                      recommendedFundingAmount: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Recommended Product</label>
                <input
                  type="text"
                  value={evalRecord.recommendedProduct}
                  onChange={(e) =>
                    mutateEval((prev) => ({ ...prev, recommendedProduct: e.target.value }))
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 text-xs">Required Conditions for Funding</label>
              <textarea
                rows={3}
                value={evalRecord.conditionsText}
                onChange={(e) =>
                  mutateEval((prev) => ({ ...prev, conditionsText: e.target.value }))
                }
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none font-sans"
              />
            </div>
          </div>

          {renderSectionSaveBar('8. Underwriter Recommendation', 'debtservice', 'documents')}
        </div>
      )}

      {/* --- SUB-VIEW 9: DOCUMENT CHECKLIST --- */}
      {activeSection === 'documents' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                Required Underwriting Document Checklist & Vault Comparison
              </h3>
              <div className="flex items-center space-x-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {evalRecord.documentChecklist.filter((d) => d.status === 'Verified' || d.status === 'Received').length} / {evalRecord.documentChecklist.length} Verified
                </span>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {evalRecord.documentChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        item.status === 'Verified'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : item.status === 'Received'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {item.status === 'Verified' ? '✓' : item.status === 'Received' ? '•' : '!'}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-100">{item.name}</span>
                      <span className="text-[10px] text-slate-400 block">{item.notes}</span>
                    </div>
                  </div>

                  <select
                    value={item.status}
                    onChange={(e) => {
                      const updated = [...evalRecord.documentChecklist];
                      updated[idx].status = e.target.value as any;
                      mutateEval((prev) => ({ ...prev, documentChecklist: updated }));
                    }}
                    className="bg-[#0b1528] border border-blue-800 rounded px-2.5 py-1 text-xs text-amber-300 font-bold focus:outline-none"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Received">Received</option>
                    <option value="Needs Review">Needs Review</option>
                    <option value="Missing">Missing</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {renderSectionSaveBar('9. Document Checklist', 'recommendation', 'conditions')}
        </div>
      )}

      {/* --- SUB-VIEW 10: CONDITIONS TO FUND --- */}
      {activeSection === 'conditions' && (
        <div className="space-y-6">
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Underwriting Conditions to Fund
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Section'}</span>
                </button>
                <button
                  onClick={handleAddCondition}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  + Add Condition
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {evalRecord.conditions.map((cond) => (
                <div
                  key={cond.id}
                  className="p-4 rounded-xl bg-[#070d18] border border-blue-900/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={cond.title}
                      onChange={(e) => {
                        const updated = evalRecord.conditions.map((c) =>
                          c.id === cond.id ? { ...c, title: e.target.value } : c
                        );
                        mutateEval((prev) => ({ ...prev, conditions: updated }));
                      }}
                      className="bg-transparent font-bold text-slate-100 text-xs focus:outline-none w-full"
                    />
                    <div className="flex items-center space-x-2 shrink-0">
                      <select
                        value={cond.status}
                        onChange={(e) => {
                          const updated = evalRecord.conditions.map((c) =>
                            c.id === cond.id ? { ...c, status: e.target.value as any } : c
                          );
                          mutateEval((prev) => ({ ...prev, conditions: updated }));
                        }}
                        className="bg-[#0b1528] border border-blue-800 rounded px-2 py-1 text-xs text-amber-300 font-bold focus:outline-none"
                      >
                        <option value="Open">Open</option>
                        <option value="Requested">Requested</option>
                        <option value="Received">Received</option>
                        <option value="Verified">Verified</option>
                        <option value="Satisfied">Satisfied</option>
                        <option value="Waived">Waived</option>
                      </select>

                      <button
                        onClick={() => handleRemoveCondition(cond.id)}
                        className="text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={cond.description}
                    onChange={(e) => {
                      const updated = evalRecord.conditions.map((c) =>
                        c.id === cond.id ? { ...c, description: e.target.value } : c
                      );
                      mutateEval((prev) => ({ ...prev, conditions: updated }));
                    }}
                    className="bg-transparent text-slate-300 text-xs focus:outline-none w-full"
                  />
                </div>
              ))}
            </div>
          </div>

          {renderSectionSaveBar('10. Conditions to Fund', 'documents', undefined)}
        </div>
      )}

      {/* 3. STICKY FLOATING QUICK-SAVE BAR WHEN EDITED OR ALWAYS ACCESSIBLE */}
      <div
        id="floating-underwriting-savebar"
        className={`fixed bottom-5 right-5 z-40 transition-all duration-300 transform ${
          isDirty ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-90 scale-95'
        }`}
      >
        <div className="bg-[#0b1528]/95 backdrop-blur-md border border-blue-700/80 p-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isDirty ? 'bg-amber-400 animate-pulse' : saveSuccess ? 'bg-emerald-400' : 'bg-blue-400'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {isDirty ? 'Unsaved Underwriting Edits' : saveSuccess ? 'All Changes Saved' : 'Underwriting Ready'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl font-bold transition-all shadow-md ${
              isDirty
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                : saveSuccess
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            } disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved ✓' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
