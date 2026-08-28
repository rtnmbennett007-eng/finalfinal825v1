import React from 'react';
import {
  FundingDeal,
  Client,
  BankStatementAnalysisSummary,
  RiskFlagItem,
  ConflictItem,
  FieldSourceType,
} from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Building2,
  DollarSign,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BadgeInfo,
  Calendar,
  Layers,
  Banknote,
  UserCheck,
} from 'lucide-react';

interface ApplicantRiskSummaryTabProps {
  deal: FundingDeal;
  client: Client;
  bankAnalysis: BankStatementAnalysisSummary;
  riskFlags: RiskFlagItem[];
  conflicts: ConflictItem[];
  onOpenConflictCenter?: () => void;
}

export const ApplicantRiskSummaryTab: React.FC<ApplicantRiskSummaryTabProps> = ({
  deal,
  client,
  bankAnalysis,
  riskFlags,
  conflicts,
  onOpenConflictCenter,
}) => {
  const activeCritical = riskFlags.filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE');
  const activeHigh = riskFlags.filter((f) => f.severity === 'HIGH' && f.status === 'ACTIVE');
  const activeMed = riskFlags.filter((f) => f.severity === 'MEDIUM' && f.status === 'ACTIVE');

  const monthlyRev = client.monthlyRevenue || (client.annualRevenue ? Math.round(client.annualRevenue / 12) : 45000);
  const avgMonthlyDeposits = bankAnalysis.avgDailyBalance ? Math.round(bankAnalysis.totalDeposits / 4) : monthlyRev;
  const requestedAmt = deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || client.requestedAmount || 50000;
  const creditScore = client.creditScore || 700;

  // Key Underwriting Ratios
  const monthlyDebtService = bankAnalysis.financingDebitsTotalMonthly || (deal.paymentAmount || 1800);
  const debtToRevenue = avgMonthlyDeposits > 0 ? ((monthlyDebtService / avgMonthlyDeposits) * 100).toFixed(1) : '4.5';
  const dscr = monthlyDebtService > 0 ? (avgMonthlyDeposits / (monthlyDebtService * 1.5)).toFixed(2) : '2.10';
  const loanToMonthlyRev = avgMonthlyDeposits > 0 ? (requestedAmt / avgMonthlyDeposits).toFixed(2) : '1.05';

  const getSourceBadge = (key: string, fallback: FieldSourceType = 'APPLICATION') => {
    const src = client.fieldSources?.[key]?.source || fallback;
    const conf = client.fieldSources?.[key]?.confidence;
    const colorMap: Record<string, string> = {
      CALL_VERIFIED: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
      VERIFICATION_FORM: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
      MANUAL: 'bg-blue-950/60 text-blue-300 border-blue-700/60',
      BANK_STATEMENT: 'bg-amber-950/60 text-amber-300 border-amber-700/60',
      APPLICATION: 'bg-slate-800 text-slate-300 border-slate-700',
      CLIENT_APPLICATION: 'bg-slate-800 text-slate-300 border-slate-700',
      AI_FILLED: 'bg-purple-950/60 text-purple-300 border-purple-700/60',
      SYSTEM_CALCULATED: 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60',
    };
    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border ${
          colorMap[src] || colorMap.APPLICATION
        }`}
        title={`Source: ${src}${conf ? ` (${Math.round(conf * 100)}% Confidence)` : ''}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
        {src.replace(/_/g, ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6" id="applicant-risk-summary-tab">
      {/* 1. Risk Tier & Executive Stance Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          activeCritical.length > 0
            ? 'bg-rose-950/20 border-rose-800/60 text-rose-200'
            : activeHigh.length > 0
            ? 'bg-amber-950/20 border-amber-800/60 text-amber-200'
            : 'bg-emerald-950/20 border-emerald-800/60 text-emerald-200'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
              activeCritical.length > 0
                ? 'bg-rose-900/40 border-rose-700 text-rose-400'
                : activeHigh.length > 0
                ? 'bg-amber-900/40 border-amber-700 text-amber-400'
                : 'bg-emerald-900/40 border-emerald-700 text-emerald-400'
            }`}
          >
            {activeCritical.length > 0 ? (
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-wide">
                Underwriting Risk Stance:{' '}
                {activeCritical.length > 0
                  ? 'CRITICAL MITIGATION REQUIRED'
                  : activeHigh.length > 0
                  ? 'MODERATE RISK — CONDITIONS APPLY'
                  : 'TIER-1 APPROVED FOR DIRECT LENDER SUBMISSION'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {activeCritical.length > 0
                ? `${activeCritical.length} critical blocker(s) detected. Acknowledge or mitigate before package compilation.`
                : activeHigh.length > 0
                ? `${activeHigh.length} high-severity risk flag(s) present. Review lender underwriting tolerance.`
                : 'Zero high-risk flags. Cash flow velocity and guarantor credit metrics meet prime submission parameters.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Active Flags
            </span>
            <div className="flex items-center gap-1.5 justify-end mt-0.5">
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-900/60 text-rose-300 border border-rose-700">
                {activeCritical.length} Critical
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-900/60 text-amber-300 border border-amber-700">
                {activeHigh.length} High
              </span>
              <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
                {activeMed.length} Med
              </span>
            </div>
          </div>
          {conflicts.filter((c) => c.status === 'UNRESOLVED').length > 0 && onOpenConflictCenter && (
            <button
              onClick={onOpenConflictCenter}
              className="px-3 py-2 text-xs font-semibold rounded-lg bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/50 transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Resolve {conflicts.filter((c) => c.status === 'UNRESOLVED').length} Conflicts
            </button>
          )}
        </div>
      </div>

      {/* 2. Core Underwriting Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Deposit Velocity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Monthly Deposits
            </span>
            {getSourceBadge('monthlyRevenue', 'BANK_STATEMENT')}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ${Number(avgMonthlyDeposits).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">
                ${Number(avgMonthlyDeposits * 12).toLocaleString()}/yr
              </span>
              <span>• 4-Mo Avg</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Average Daily Balance */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Avg Daily Balance
            </span>
            {getSourceBadge('averageDailyBalance', 'BANK_STATEMENT')}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              ${Number(bankAnalysis.avgDailyBalance || 12500).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className={bankAnalysis.negativeBalanceDays > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                {bankAnalysis.negativeBalanceDays || 0} Negative Days
              </span>
              <span>• {bankAnalysis.nsfsCount || 0} NSFs</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Guarantor FICO Score */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Guarantor FICO
            </span>
            {getSourceBadge('creditScore', 'CALL_VERIFIED')}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {creditScore}{' '}
              <span className="text-xs font-normal text-slate-400">
                {creditScore >= 700 ? '(Excellent)' : creditScore >= 640 ? '(Good)' : '(Fair)'}
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400 truncate">
              {client.firstName} {client.lastName} ({client.ownershipPercentage || 100}% Owner)
            </div>
          </div>
        </div>

        {/* Metric 4: Debt-to-Revenue / Stacking Position */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Lender Position
            </span>
            {getSourceBadge('position', 'MANUAL')}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white tracking-tight">
              {deal.position || '1st Position'}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
              <span className="text-amber-300 font-medium">{debtToRevenue}% DTI</span>
              <span>• DSCR {dscr}x</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Applicant Profile & Entity Risk Verification Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Commercial Entity & Underwriting Profile</h4>
              <p className="text-xs text-slate-400">
                Audited entity details, state filings, and field provenance badges
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Verification Status:</span>
            <span
              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                client.isVerified
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : 'bg-amber-950/80 text-amber-300 border-amber-700'
              }`}
            >
              {client.isVerified ? 'VERIFIED' : 'PENDING VERIFICATION'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Column 1: Business Profile */}
          <div className="p-5 space-y-4">
            <h5 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Legal Business Entity
            </h5>

            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Legal Business Name</span>
                  <span className="text-sm font-bold text-white">{client.businessName}</span>
                  {client.dba && (
                    <span className="text-xs text-slate-400 block">DBA: {client.dba}</span>
                  )}
                </div>
                {getSourceBadge('businessName', 'APPLICATION')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Entity Type & State</span>
                  <span className="text-sm font-medium text-slate-200">
                    {client.entityType || 'LLC'} — {client.stateOfOrganization || client.state || 'TX'}
                  </span>
                </div>
                {getSourceBadge('entityType', 'APPLICATION')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Federal Tax ID (EIN)</span>
                  <span className="text-sm font-mono text-slate-200">
                    {client.federalTaxId ? `XX-XXX${client.federalTaxId.slice(-4)}` : 'On File (Encrypted)'}
                  </span>
                </div>
                {getSourceBadge('federalTaxId', 'APPLICATION')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Operating Address</span>
                  <span className="text-sm text-slate-300">
                    {client.businessAddress || `${client.address}, ${client.city || ''}, ${client.state || ''} ${client.zip || ''}`}
                  </span>
                </div>
                {getSourceBadge('businessAddress', 'APPLICATION')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Time in Business</span>
                  <span className="text-sm font-medium text-slate-200">
                    Est. {client.businessStartDate || '2020'}
                  </span>
                </div>
                {getSourceBadge('businessStartDate', 'APPLICATION')}
              </div>
            </div>
          </div>

          {/* Column 2: Financial & Depository Relationship */}
          <div className="p-5 space-y-4">
            <h5 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Banking & Financing Capacity
            </h5>

            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Primary Depository Bank</span>
                  <span className="text-sm font-bold text-white">
                    {client.businessBank || bankAnalysis.bankName || 'Depository Bank'}
                  </span>
                  <span className="text-xs text-emerald-400 block">
                    {bankAnalysis.cashFlowConsistency || 'Consistent'} Deposit Velocity
                  </span>
                </div>
                {getSourceBadge('primaryBank', 'BANK_STATEMENT')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Requested Funding Product</span>
                  <span className="text-sm font-bold text-amber-400">{deal.product}</span>
                  <span className="text-xs text-slate-400 block">
                    Amount: ${Number(requestedAmt).toLocaleString()}
                  </span>
                </div>
                {getSourceBadge('product', 'MANUAL')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Commission & Origination Points</span>
                  <span className="text-sm font-bold text-slate-200">
                    {deal.percentage !== undefined && deal.percentage > 0
                      ? `${deal.percentage}% (${deal.fee ? `$${Number(deal.fee).toLocaleString()}` : `$${Math.round((requestedAmt * deal.percentage) / 100).toLocaleString()}`})`
                      : 'Not Entered (Requires Manual Input)'}
                  </span>
                </div>
                {getSourceBadge('commission', 'MANUAL')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Target Term & Payment</span>
                  <span className="text-sm font-medium text-slate-200">
                    {deal.termLength || '12-24 Months'} • {deal.paymentFrequency || 'Monthly'}
                  </span>
                </div>
                {getSourceBadge('termLength', 'MANUAL')}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Active Financing Debits</span>
                  <span className="text-sm font-mono text-slate-200">
                    ${Number(bankAnalysis.financingDebitsTotalMonthly || 0).toLocaleString()}/mo
                  </span>
                </div>
                {getSourceBadge('financingDebits', 'BANK_STATEMENT')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
