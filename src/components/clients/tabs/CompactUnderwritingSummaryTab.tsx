import React from 'react';
import {
  Scale,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  UserCheck,
  Layers,
  FileText,
  Clock,
  TrendingUp,
  FileCheck2,
  Lock,
} from 'lucide-react';
import {
  Client,
  FundingDeal,
  DocumentItem,
  MasterVerificationData,
  UnderwritingEvaluationRecord,
  RiskFlagItem,
} from '../../../types';
import { generateRiskFlags, evaluateFundingReadiness } from '../../../utils/riskEvaluationEngine';

interface CompactUnderwritingSummaryTabProps {
  client: Client;
  masterVerification?: MasterVerificationData | null;
  documents?: DocumentItem[];
  deals?: FundingDeal[];
  underwritingEvaluation?: UnderwritingEvaluationRecord | null;
  onOpenUnderwritingHub: () => void;
}

export const CompactUnderwritingSummaryTab: React.FC<CompactUnderwritingSummaryTabProps> = ({
  client,
  masterVerification,
  documents = [],
  deals = [],
  underwritingEvaluation,
  onOpenUnderwritingHub,
}) => {
  // Primary active deal for this client
  const primaryDeal = deals[0] || ({
    id: `deal-${client.id}`,
    dealId: `DL-${client.id.slice(0, 6).toUpperCase()}`,
    clientId: client.id,
    clientName: `${client.firstName} ${client.lastName}`,
    businessName: client.businessName || 'Business Entity',
    product: client.requestedProduct || 'Revenue Funding',
    requestedAmount: client.requestedAmount || 50000,
    approvedAmount: client.recommendedAmount || client.requestedAmount || 50000,
    fundingAmount: client.requestedAmount || 50000,
    status: (client.isUnderwritten ? 'Ready to Fund' : 'Underwriting') as any,
    assignedStaff: client.assignedStaff || 'Dana Javier',
    lenderName: 'Direct Lender',
    factorRate: 1.24,
    termLength: '12 Months',
    fee: 0,
    percentage: 10,
    commissionStatus: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as FundingDeal);

  // Evaluate risk flags & readiness
  const riskFlags: RiskFlagItem[] = generateRiskFlags(primaryDeal, client, undefined, documents);
  const readiness = evaluateFundingReadiness(primaryDeal, client, documents, undefined, riskFlags, []);

  const activeCritical = riskFlags.filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE');
  const activeHigh = riskFlags.filter((f) => f.severity === 'HIGH' && f.status === 'ACTIVE');

  // Status & Decision values
  const underwritingStatus =
    primaryDeal.underwritingStatus ||
    underwritingEvaluation?.status ||
    (client.isUnderwritten ? 'APPROVED' : client.isVerified ? 'IN_REVIEW' : 'PENDING_VERIFICATION');

  const decision =
    underwritingEvaluation?.recommendation ||
    client.underwritingDecision ||
    (primaryDeal.status === 'Approved' || primaryDeal.status === 'Ready to Fund'
      ? 'APPROVED'
      : primaryDeal.status === 'Declined'
      ? 'DECLINED'
      : 'QUALIFIED');

  const underwriterName =
    underwritingEvaluation?.preparedBy ||
    client.underwrittenBy ||
    client.assignedStaff ||
    'Dana Javier (Supreme Funding Commander)';

  const recommendedAmount =
    underwritingEvaluation?.recommendedFundingAmount ||
    underwritingEvaluation?.fundingRequest?.recommendedAmount ||
    client.recommendedAmount ||
    primaryDeal.approvedAmount ||
    primaryDeal.requestedAmount ||
    client.requestedAmount ||
    50000;

  const recommendedProduct =
    underwritingEvaluation?.recommendedProduct ||
    client.recommendedProduct ||
    primaryDeal.product ||
    'Revenue Funding';

  const riskLevel =
    activeCritical.length > 0
      ? 'CRITICAL_RISK'
      : activeHigh.length > 0
      ? 'MODERATE_RISK'
      : 'LOW_RISK_TIER_1';

  // Calculate missing items
  const missingItems: string[] = [];
  if (!client.isVerified) missingItems.push('Verification Call with Borrower pending');
  if (documents.filter((d) => d.category === 'Bank Statements').length < 3) {
    missingItems.push('3+ Months of Business Bank Statements');
  }
  if (!documents.some((d) => d.category === "Driver's License")) {
    missingItems.push("Guarantor Government Photo ID (Driver's License)");
  }
  if (!documents.some((d) => d.category === 'Voided Check')) {
    missingItems.push('Voided Business Check / Bank Verification Letter');
  }
  if (!primaryDeal.percentage || primaryDeal.percentage <= 0) {
    missingItems.push('Mandatory Commission Points not configured');
  }

  return (
    <div className="space-y-6" id="compact-underwriting-summary-tab">
      {/* 1. Primary Notice Banner with OPEN UNDERWRITING HUB Action */}
      <div className="bg-gradient-to-r from-[#0b1b36] via-[#0e2347] to-[#0b1b36] border-2 border-amber-500/40 p-6 rounded-2xl shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-lg shadow-amber-500/10">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full font-mono shadow-sm">
                Canonical Underwriting Desk
              </span>
              <span className="text-xs text-slate-400 font-mono">Deal #{primaryDeal.dealId || primaryDeal.id}</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
              Underwriting Summary & Evaluation Briefing
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Full multi-month bank statement analytics, automated risk mitigation, conflict resolution, loan sizing parameters, and lender packages are managed exclusively in the <strong>Underwriting Hub</strong>.
            </p>
          </div>
        </div>

        <button
          id="btn-open-underwriting-hub"
          onClick={onOpenUnderwritingHub}
          className="w-full lg:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2.5 shrink-0 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Scale className="w-4 h-4 text-slate-950" />
          <span>OPEN UNDERWRITING HUB</span>
          <ExternalLink className="w-4 h-4 text-slate-950" />
        </button>
      </div>

      {/* 2. Key Underwriting Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Underwriting Status & Decision */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileCheck2 className="w-3.5 h-3.5 text-amber-400" />
              Underwriting Status
            </span>
            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                underwritingStatus === 'APPROVED' || underwritingStatus === 'READY_FOR_LENDER'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : underwritingStatus === 'DECLINED'
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
              }`}
            >
              {underwritingStatus.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="mt-3">
            <span className="text-xs text-slate-400 block">Formal Decision:</span>
            <div className="text-xl font-black text-white mt-0.5 font-sans">
              {decision.replace(/_/g, ' ')}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Stage: {primaryDeal.status}
            </span>
          </div>
        </div>

        {/* Card 2: Readiness Score */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Readiness Score
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                readiness.isReady
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
              }`}
            >
              {readiness.isReady ? 'READY TO FUND' : 'CONDITIONS'}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {readiness.readinessScore}
              </span>
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {readiness.blockingIssuesCount === 0
                ? 'All closing milestones verified'
                : `${readiness.blockingIssuesCount} condition(s) pending`}
            </span>
          </div>
        </div>

        {/* Card 3: Risk Level */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Risk Level
            </span>
            <span
              className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                riskLevel === 'LOW_RISK_TIER_1'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : riskLevel === 'MODERATE_RISK'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                  : 'bg-rose-950/80 text-rose-300 border-rose-700'
              }`}
            >
              {riskLevel === 'LOW_RISK_TIER_1' ? 'TIER 1 LOW' : riskLevel === 'MODERATE_RISK' ? 'MODERATE' : 'CRITICAL'}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-sm font-black text-white">
              {riskFlags.length === 0
                ? 'Zero Risk Flags'
                : `${riskFlags.length} Flag(s) Audited`}
            </div>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <span className="text-rose-400 font-bold">{activeCritical.length} Critical</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">{activeHigh.length} High</span>
            </div>
          </div>
        </div>

        {/* Card 4: Recommended Amount & Underwriter */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Recommended Size
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {recommendedProduct}
            </span>
          </div>

          <div className="mt-3">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              ${Number(recommendedAmount).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block truncate" title={underwriterName}>
              Underwriter: <strong className="text-slate-200">{underwriterName.split(' ')[0]}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Detailed Underwriting Profile Summary Table */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-blue-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Underwriting Evaluation & Sizing Profile
              </h3>
              <p className="text-xs text-slate-400">
                Core audited underwriting metrics synchronized across Maple X modules
              </p>
            </div>
          </div>

          <button
            onClick={onOpenUnderwritingHub}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <span>Edit in Full Hub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-blue-900/40">
          {/* Left Column: Financial & Entity Profile */}
          <div className="p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Entity & Cash Flow Verification
            </h4>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d18] border border-blue-900/30">
                <span className="text-slate-400">Legal Business Name</span>
                <span className="font-bold text-slate-100">{client.businessName || 'N/A'}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d18] border border-blue-900/30">
                <span className="text-slate-400">Monthly Revenue Velocity</span>
                <span className="font-bold text-emerald-400 font-mono">
                  ${Number(client.monthlyRevenue || (client.annualRevenue ? Math.round(client.annualRevenue / 12) : 0)).toLocaleString()} / mo
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d18] border border-blue-900/30">
                <span className="text-slate-400">Guarantor Credit Score</span>
                <span className="font-bold text-white font-mono">
                  {client.creditScore ? `${client.creditScore} FICO` : '700 (Unverified)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#070d18] border border-blue-900/30">
                <span className="text-slate-400">Stacking Position</span>
                <span className="font-bold text-amber-300 font-mono">
                  {primaryDeal.position || '1st Position'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Missing Items & Conditions */}
          <div className="p-5 space-y-4">
            <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
              <span>Missing Items & Prerequisites</span>
              <span className="text-[10px] font-mono text-slate-400 font-normal">
                {missingItems.length === 0 ? 'All Clear' : `${missingItems.length} Missing`}
              </span>
            </h4>

            {missingItems.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Zero missing items. Deal satisfies all Tier-1 submission prerequisites.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {missingItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#070d18] border border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
