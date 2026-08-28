import React, { useState, useEffect } from 'react';
import {
  FundingDeal,
  Client,
  BankStatementAnalysisSummary,
  RiskFlagItem,
  ConflictItem,
  UnderwritingChecklistItem,
  UnderwritingEvaluationRecord,
  SubmissionPackageRecord,
  DocumentItem,
  FundingReadinessSummary,
} from '../../types';
import { ApplicantRiskSummaryTab } from './ApplicantRiskSummaryTab';
import { BankStatementAnalysisTab } from './BankStatementAnalysisTab';
import { RiskFlagsTab } from './RiskFlagsTab';
import { UnderwritingDocumentsTab } from './UnderwritingDocumentsTab';
import { ConflictCenterTab } from './ConflictCenterTab';
import { UnderwritingChecklistTab } from './UnderwritingChecklistTab';
import { SubmissionPackageTab } from './SubmissionPackageTab';
import { ReadyToFundTab } from './ReadyToFundTab';
import {
  generateRiskFlags,
  detectDataConflicts,
  calculateUnderwritingChecklist,
  evaluateFundingReadiness,
} from '../../utils/riskEvaluationEngine';
import {
  Scale,
  ShieldAlert,
  ShieldCheck,
  Building2,
  DollarSign,
  Package,
  CheckSquare,
  GitCompare,
  FolderArchive,
  Banknote,
  Landmark,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ChevronDown,
  UserCheck,
  Layers,
  FileCheck2,
} from 'lucide-react';

interface UnderwritingCommandCenterProps {
  deal: FundingDeal;
  client: Client;
  allDealsForClient?: FundingDeal[];
  allClients?: Client[];
  onSelectDeal?: (deal: FundingDeal) => void;
  onBackToHub?: () => void;
  onDealUpdated?: (updatedDeal: FundingDeal) => void;
  onClientUpdated?: (updatedClient: Client) => void;
  setActiveTab?: (tab: string) => void;
}

export const UnderwritingCommandCenter: React.FC<UnderwritingCommandCenterProps> = ({
  deal: initialDeal,
  client: initialClient,
  allDealsForClient = [],
  onSelectDeal,
  onBackToHub,
  onDealUpdated,
  onClientUpdated,
  setActiveTab,
}) => {
  const [deal, setDeal] = useState<FundingDeal>(initialDeal);
  const [client, setClient] = useState<Client>(initialClient);
  const [activeSubTab, setActiveSubTab] = useState<
    | 'RISK_SUMMARY'
    | 'BANK_ANALYSIS'
    | 'RISK_FLAGS'
    | 'DOCUMENTS'
    | 'CONFLICTS'
    | 'CHECKLIST'
    | 'SUBMISSION'
    | 'READY_TO_FUND'
  >('RISK_SUMMARY');

  const [loading, setLoading] = useState(false);
  const [bankAnalysis, setBankAnalysis] = useState<BankStatementAnalysisSummary>(
    (initialDeal as any).bankAnalysis || {
      totalDeposits: client.monthlyRevenue ? client.monthlyRevenue * 4 : 180000,
      avgDailyBalance: 14500,
      negativeBalanceDays: 0,
      nsfsCount: 0,
      depositVelocity: 'Consistent',
      bankName: client.businessBank || 'Chase Commercial Bank',
      accountHolder: client.businessName,
      statementPeriod: 'Last 4 Months',
      cashFlowConsistency: 'High Consistency',
      financingDebitsTotalMonthly: initialDeal.paymentAmount || 0,
      monthlyBreakdowns: [
        { month: 'Month 1', totalDeposits: 45000, endingBalance: 14200, negativeDays: 0, nsfs: 0, achDebits: 0, notes: 'Verified' },
        { month: 'Month 2', totalDeposits: 48000, endingBalance: 16800, negativeDays: 0, nsfs: 0, achDebits: 0, notes: 'Verified' },
        { month: 'Month 3', totalDeposits: 42000, endingBalance: 12400, negativeDays: 0, nsfs: 0, achDebits: 0, notes: 'Verified' },
        { month: 'Month 4', totalDeposits: 51000, endingBalance: 19500, negativeDays: 0, nsfs: 0, achDebits: 0, notes: 'Verified' },
      ],
      recurringAchObligations: [],
      largeDeposits: [],
      largeWithdrawals: [],
    }
  );

  const [riskFlags, setRiskFlags] = useState<RiskFlagItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [checklist, setChecklist] = useState<UnderwritingChecklistItem[]>([]);
  const [evaluation, setEvaluation] = useState<UnderwritingEvaluationRecord | null>(null);
  const [submissionPackages, setSubmissionPackages] = useState<SubmissionPackageRecord[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);

  // Fetch full state from backend
  const fetchCommandCenterData = async () => {
    setLoading(true);
    try {
      const dealId = deal.id || deal.dealId;
      const res = await fetch(`/api/underwriting/deal/${dealId}/command-center`);
      if (res.ok) {
        const data = await res.json();
        if (data.deal) setDeal(data.deal);
        if (data.client) setClient(data.client);
        if (data.bankAnalysis) setBankAnalysis(data.bankAnalysis);
        if (data.riskFlags) setRiskFlags(data.riskFlags);
        if (data.conflicts) setConflicts(data.conflicts);
        if (data.checklist) setChecklist(data.checklist);
        if (data.evaluation) setEvaluation(data.evaluation);
        if (data.submissionPackages) setSubmissionPackages(data.submissionPackages);
        if (data.documents) setDocuments(data.documents);
      } else {
        // Fallback to local evaluation calculations
        recalculateLocalState();
      }
    } catch (err) {
      console.warn('Could not fetch command center API, using engine:', err);
      recalculateLocalState();
    } finally {
      setLoading(false);
    }
  };

  const recalculateLocalState = () => {
    const flags = generateRiskFlags(deal, client, bankAnalysis, documents);
    const confs = detectDataConflicts(deal, client, documents, undefined, bankAnalysis);
    const checks = calculateUnderwritingChecklist(deal, client, documents, undefined, bankAnalysis, confs, flags);
    setRiskFlags(flags);
    setConflicts(confs);
    setChecklist(checks);
  };

  useEffect(() => {
    setDeal(initialDeal);
    setClient(initialClient);
    fetchCommandCenterData();
  }, [initialDeal.id, initialClient.id]);

  // Readiness Calculation
  const readiness: FundingReadinessSummary = evaluateFundingReadiness(
    deal,
    client,
    documents,
    checklist,
    riskFlags,
    []
  ) as any;

  // Handlers for tab actions
  const handleUpdateBankAnalysis = async (updated: BankStatementAnalysisSummary) => {
    setBankAnalysis(updated);
    try {
      const dealId = deal.id || deal.dealId;
      await fetch(`/api/underwriting/deal/${dealId}/bank-analysis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankAnalysis: updated }),
      });
      fetchCommandCenterData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateRiskFlags = async (flags: RiskFlagItem[], note?: string) => {
    setRiskFlags(flags);
    try {
      const dealId = deal.id || deal.dealId;
      await fetch(`/api/underwriting/deal/${dealId}/risk-flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flags, note }),
      });
      fetchCommandCenterData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveConflict = async (
    fieldKey: string,
    chosenValue: any,
    chosenSource: any,
    notes?: string
  ) => {
    try {
      const dealId = deal.id || deal.dealId;
      const res = await fetch(`/api/underwriting/deal/${dealId}/resolve-conflict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldKey, chosenValue, chosenSource, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.deal) {
          setDeal(data.deal);
          if (onDealUpdated) onDealUpdated(data.deal);
        }
        if (data.client) {
          setClient(data.client);
          if (onClientUpdated) onClientUpdated(data.client);
        }
        fetchCommandCenterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateChecklist = async (updatedChecklist: UnderwritingChecklistItem[]) => {
    setChecklist(updatedChecklist);
    try {
      const dealId = deal.id || deal.dealId;
      await fetch(`/api/underwriting/deal/${dealId}/checklist`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedChecklist }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEvaluation = async (evalData: Partial<UnderwritingEvaluationRecord>) => {
    try {
      const dealId = deal.id || deal.dealId;
      const res = await fetch(`/api/underwriting/deal/${dealId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evalData),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.deal) {
          setDeal(data.deal);
          if (onDealUpdated) onDealUpdated(data.deal);
        }
        fetchCommandCenterData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmissionPackage = async (packageData: any) => {
    const dealId = deal.id || deal.dealId;
    const res = await fetch(`/api/underwriting/deal/${dealId}/submission-package`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(packageData),
    });
    if (!res.ok) throw new Error('Failed to create package');
    const data = await res.json();
    fetchCommandCenterData();
    return data.package;
  };

  const handleUpdatePackageStatus = async (packageId: string, status: string, notes?: string) => {
    const res = await fetch(`/api/underwriting/submission-package/${packageId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes }),
    });
    if (!res.ok) throw new Error('Failed to update package status');
    fetchCommandCenterData();
  };

  const handleMarkReadyToFund = async (override: boolean, justification?: string) => {
    const dealId = deal.id || deal.dealId;
    const res = await fetch(`/api/underwriting/deal/${dealId}/ready-to-fund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bypassCommissionCheck: override, justification }),
    });
    if (!res.ok) {
      const errJson = await res.json();
      throw new Error(errJson.error || 'Failed to mark ready to fund');
    }
    const data = await res.json();
    if (data.deal) {
      setDeal(data.deal);
      if (onDealUpdated) onDealUpdated(data.deal);
    }
    fetchCommandCenterData();
  };

  const handleUploadDocument = async (file: File, category: string) => {
    const dealId = deal.id || deal.dealId;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('clientId', client.id);
    formData.append('dealId', dealId);

    const res = await fetch('/api/documents/upload-stream', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    fetchCommandCenterData();
  };

  const handleTriggerAiScan = async (docId?: string) => {
    // Calls document AI extractor endpoint
    try {
      await fetch(`/api/documents/scan-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, dealId: deal.id, documentId: docId }),
      });
      fetchCommandCenterData();
    } catch (err) {
      console.error(err);
    }
  };

  const activeCriticalCount = riskFlags.filter((f) => f.severity === 'CRITICAL' && f.status === 'ACTIVE').length;
  const activeHighCount = riskFlags.filter((f) => f.severity === 'HIGH' && f.status === 'ACTIVE').length;
  const unresolvedConflictsCount = conflicts.filter((c) => c.status === 'UNRESOLVED').length;

  return (
    <div className="space-y-6 pb-16" id="underwriting-command-center">
      {/* 1. Top Navigation & Deal Context Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          {onBackToHub && (
            <button
              onClick={onBackToHub}
              className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-950 border border-slate-800 transition-colors"
              title="Return to Underwriting Portfolio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                Command Center
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">Deal #{deal.dealId || deal.id}</span>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-400" />
              {client.businessName || `${client.firstName} ${client.lastName}`}
            </h1>
          </div>
        </div>

        {/* Quick Deal Switcher for this Client */}
        <div className="flex items-center gap-3">
          {allDealsForClient.length > 1 && onSelectDeal && (
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Switch Deal:</span>
              <select
                value={deal.id}
                onChange={(e) => {
                  const target = allDealsForClient.find((d) => d.id === e.target.value);
                  if (target) onSelectDeal(target);
                }}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                {allDealsForClient.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                    {d.dealId || d.id} — {d.product} (${(d.approvedAmount || d.fundingAmount || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchCommandCenterData}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Refresh Command Center State"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Command Center Deal Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Funding Product
            </span>
            <span className="text-sm font-bold text-amber-400 mt-1 block truncate">
              {deal.product}
            </span>
            <span className="text-[11px] text-slate-500 font-mono block">
              Position: {deal.position || '1st'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Requested Amount
            </span>
            <span className="text-sm font-bold text-white font-mono mt-1 block">
              ${Number(deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || 50000).toLocaleString()}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono block">
              Factor: {deal.factorRate || '1.24'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Deal Status
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 mt-1 inline-block">
              {deal.status}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Stage: {(deal as any).stage || deal.status || 'Underwriting'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Commission Status
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded border mt-1 inline-block ${
                deal.percentage && deal.percentage > 0
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-rose-950 text-rose-300 border-rose-700'
              }`}
            >
              {deal.percentage && deal.percentage > 0 ? `${deal.percentage}% Entered` : 'Not Configured'}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">
              Fee: {deal.fee ? `$${Number(deal.fee).toLocaleString()}` : '$0'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Assigned Staff / Underwriter
            </span>
            <span className="text-xs font-bold text-slate-200 mt-1 block truncate">
              {deal.assignedStaff || client.assignedStaff || 'Staff Assigned'}
            </span>
            <span className="text-[11px] text-slate-500 block">
              Lender: {deal.lenderName || 'Multiple'}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Readiness Score
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span
                className={`text-sm font-black font-mono ${
                  readiness.isReady ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {readiness.readinessScore}/100
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  readiness.isReady ? 'bg-emerald-950 text-emerald-300' : 'bg-amber-950 text-amber-300'
                }`}
              >
                {readiness.isReady ? 'READY' : 'CONDITIONS'}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 block">
              {readiness.blockingIssuesCount} blocking issues
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1.5 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('RISK_SUMMARY')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'RISK_SUMMARY'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Applicant & Risk Profile
        </button>

        <button
          onClick={() => setActiveSubTab('BANK_ANALYSIS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'BANK_ANALYSIS'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          4-Mo Bank Analysis
        </button>

        <button
          onClick={() => setActiveSubTab('RISK_FLAGS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'RISK_FLAGS'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Risk Flags & Mitigations
          {activeCriticalCount + activeHighCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-900 text-rose-200 ml-1">
              {activeCriticalCount + activeHighCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('DOCUMENTS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'DOCUMENTS'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FolderArchive className="w-3.5 h-3.5" />
          Missing Docs & Vault
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 ml-1">
            {documents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('CONFLICTS')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'CONFLICTS'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          Conflict Center
          {unresolvedConflictsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-900 text-amber-200 ml-1">
              {unresolvedConflictsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('CHECKLIST')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'CHECKLIST'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckSquare className="w-3.5 h-3.5" />
          Checklist & Memo
        </button>

        <button
          onClick={() => setActiveSubTab('SUBMISSION')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'SUBMISSION'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          Submission Package
        </button>

        <button
          onClick={() => setActiveSubTab('READY_TO_FUND')}
          className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'READY_TO_FUND'
              ? 'bg-emerald-500 text-slate-950'
              : 'text-emerald-400 hover:bg-slate-800'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          Ready to Fund (1-Click)
        </button>
      </div>

      {/* 4. Active Tab Content Rendering */}
      <div>
        {activeSubTab === 'RISK_SUMMARY' && (
          <ApplicantRiskSummaryTab
            deal={deal}
            client={client}
            bankAnalysis={bankAnalysis}
            riskFlags={riskFlags}
            conflicts={conflicts}
            onOpenConflictCenter={() => setActiveSubTab('CONFLICTS')}
          />
        )}

        {activeSubTab === 'BANK_ANALYSIS' && (
          <BankStatementAnalysisTab
            deal={deal}
            client={client}
            bankAnalysis={bankAnalysis}
            documents={documents}
            onUpdateBankAnalysis={handleUpdateBankAnalysis}
            onTriggerAiScan={() => handleTriggerAiScan()}
          />
        )}

        {activeSubTab === 'RISK_FLAGS' && (
          <RiskFlagsTab
            deal={deal}
            client={client}
            riskFlags={riskFlags}
            onUpdateRiskFlags={handleUpdateRiskFlags}
          />
        )}

        {activeSubTab === 'DOCUMENTS' && (
          <UnderwritingDocumentsTab
            deal={deal}
            client={client}
            documents={documents}
            onUploadDocument={handleUploadDocument}
            onTriggerAiScan={handleTriggerAiScan}
            onRefreshDocuments={fetchCommandCenterData}
          />
        )}

        {activeSubTab === 'CONFLICTS' && (
          <ConflictCenterTab
            deal={deal}
            client={client}
            conflicts={conflicts}
            onResolveConflict={handleResolveConflict}
          />
        )}

        {activeSubTab === 'CHECKLIST' && (
          <UnderwritingChecklistTab
            deal={deal}
            client={client}
            checklist={checklist}
            evaluation={evaluation}
            onUpdateChecklist={handleUpdateChecklist}
            onSaveEvaluation={handleSaveEvaluation}
          />
        )}

        {activeSubTab === 'SUBMISSION' && (
          <SubmissionPackageTab
            deal={deal}
            client={client}
            documents={documents}
            submissionPackages={submissionPackages}
            bankAnalysis={bankAnalysis}
            evaluation={evaluation}
            onCreatePackage={handleCreateSubmissionPackage}
            onUpdatePackageStatus={handleUpdatePackageStatus}
          />
        )}

        {activeSubTab === 'READY_TO_FUND' && (
          <ReadyToFundTab
            deal={deal}
            client={client}
            readiness={readiness}
            commissions={[]}
            onMarkReadyToFund={handleMarkReadyToFund}
            onNavigateToCommissions={() => setActiveTab && setActiveTab('commissions')}
            onNavigateToConflicts={() => setActiveSubTab('CONFLICTS')}
            onNavigateToRiskFlags={() => setActiveSubTab('RISK_FLAGS')}
          />
        )}
      </div>
    </div>
  );
};
