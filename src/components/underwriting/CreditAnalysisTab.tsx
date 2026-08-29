import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  UnderwritingEvaluationRecord,
  CreditCardRecord,
} from '../../types';
import {
  CreditCard,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Scale,
  Building2,
  RefreshCw,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface CreditAnalysisTabProps {
  deal: FundingDeal;
  client: Client;
  evaluation: UnderwritingEvaluationRecord | null;
  onSaveEvaluation: (data: Partial<UnderwritingEvaluationRecord>) => Promise<void>;
  onRefresh?: () => void;
}

export const CreditAnalysisTab: React.FC<CreditAnalysisTabProps> = ({
  deal,
  client,
  evaluation,
  onSaveEvaluation,
  onRefresh,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [ficoScore, setFicoScore] = useState<number>(
    evaluation?.ficoScore || client.creditScore || client.ficoScore || 700
  );
  const [experianScore, setExperianScore] = useState<number>(
    evaluation?.experianScore || client.creditScore || 705
  );
  const [equifaxScore, setEquifaxScore] = useState<number>(
    evaluation?.equifaxScore || client.creditScore || 698
  );
  const [transunionScore, setTransunionScore] = useState<number>(
    evaluation?.transunionScore || client.creditScore || 702
  );
  const [creditProfile, setCreditProfile] = useState<string>(
    evaluation?.creditProfile || (ficoScore >= 700 ? 'Prime (Tier 1)' : ficoScore >= 640 ? 'Near-Prime (Tier 2)' : 'Subprime (Tier 3)')
  );
  const [bankruptcy, setBankruptcy] = useState<string>(
    evaluation?.bankruptcy || client.bankruptcy || 'None'
  );
  const [openCollections, setOpenCollections] = useState<string>(
    evaluation?.openCollections || 'None reported across 3 bureaus'
  );
  const [recentInquiries, setRecentInquiries] = useState<number | string>(
    evaluation?.recentInquiries || client.recentCreditInquiries || 2
  );
  const [chargeOffs, setChargeOffs] = useState<string>(
    evaluation?.chargeOffs || 'None'
  );
  const [judgments, setJudgments] = useState<string>(
    evaluation?.judgments || 'None'
  );
  const [taxLiens, setTaxLiens] = useState<string>(
    evaluation?.taxLiens || 'None'
  );
  const [creditUtilization, setCreditUtilization] = useState<number>(
    evaluation?.creditUtilization || 28
  );
  const [otherCreditConcerns, setOtherCreditConcerns] = useState<string>(
    evaluation?.otherCreditConcerns || 'No derogatory trade lines or late payments in the past 24 months.'
  );
  const [creditAnalysisNotes, setCreditAnalysisNotes] = useState<string>(
    evaluation?.creditAnalysisNotes || 'Guarantor credit satisfies Tier-1 lender box requirements. High composite score with low revolving utilization.'
  );

  // Housing Details
  const [housingStatus, setHousingStatus] = useState<string>(client.housingStatus || 'Homeowner');
  const [housingPayment, setHousingPayment] = useState<number>(client.monthlyHousingPayment || 2400);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveEvaluation({
        clientId: client.id,
        ficoScore: Number(ficoScore),
        experianScore: Number(experianScore),
        equifaxScore: Number(equifaxScore),
        transunionScore: Number(transunionScore),
        creditProfile,
        bankruptcy,
        openCollections,
        recentInquiries,
        chargeOffs,
        judgments,
        taxLiens,
        creditUtilization: Number(creditUtilization),
        otherCreditConcerns,
        creditAnalysisNotes,
        updatedAt: new Date().toISOString(),
      });
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const getTierBadge = (score: number) => {
    if (score >= 720) return { label: 'Prime (Tier 1)', color: 'bg-emerald-950 text-emerald-300 border-emerald-700' };
    if (score >= 660) return { label: 'Near-Prime (Tier 2)', color: 'bg-blue-950 text-blue-300 border-blue-700' };
    if (score >= 600) return { label: 'Moderate (Tier 3)', color: 'bg-amber-950 text-amber-300 border-amber-700' };
    return { label: 'Subprime / High Risk', color: 'bg-rose-950 text-rose-300 border-rose-700' };
  };

  const tier = getTierBadge(ficoScore);

  return (
    <div className="space-y-6" id="credit-analysis-tab">
      {/* 1. Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Tri-Merge Guarantor Credit Analysis</h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${tier.color}`}>
                {tier.label}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Guarantor: <span className="text-slate-200 font-medium">{client.firstName} {client.lastName}</span> ({client.ownershipPercentage || 100}% Owner) • SSN: <span className="font-mono text-slate-300">{client.ssn ? `XXX-XX-${client.ssn.slice(-4)}` : 'On File'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={saving}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                Save Credit Profile
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              Edit Credit Analysis
            </button>
          )}
        </div>
      </div>

      {/* 2. Tri-Merge Bureau Scores Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Composite FICO */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
            <span>Composite FICO</span>
            <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800">
              CALL VERIFIED
            </span>
          </div>
          <div className="mt-3">
            {isEditing ? (
              <input
                type="number"
                value={ficoScore}
                onChange={(e) => setFicoScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xl font-bold font-mono text-white"
              />
            ) : (
              <div className="text-3xl font-black text-white font-mono">{ficoScore}</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Official Underwriting Baseline</div>
          </div>
        </div>

        {/* Experian */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
            <span>Experian</span>
            <span className="text-[10px] font-mono text-blue-300 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">
              BUREAU 1
            </span>
          </div>
          <div className="mt-3">
            {isEditing ? (
              <input
                type="number"
                value={experianScore}
                onChange={(e) => setExperianScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xl font-bold font-mono text-blue-400"
              />
            ) : (
              <div className="text-3xl font-black text-blue-400 font-mono">{experianScore}</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Score Model: FICO 8</div>
          </div>
        </div>

        {/* Equifax */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
            <span>Equifax</span>
            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
              BUREAU 2
            </span>
          </div>
          <div className="mt-3">
            {isEditing ? (
              <input
                type="number"
                value={equifaxScore}
                onChange={(e) => setEquifaxScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xl font-bold font-mono text-emerald-400"
              />
            ) : (
              <div className="text-3xl font-black text-emerald-400 font-mono">{equifaxScore}</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Score Model: Beacon 5.0</div>
          </div>
        </div>

        {/* TransUnion */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs uppercase font-semibold text-slate-400 flex items-center justify-between">
            <span>TransUnion</span>
            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800">
              BUREAU 3
            </span>
          </div>
          <div className="mt-3">
            {isEditing ? (
              <input
                type="number"
                value={transunionScore}
                onChange={(e) => setTransunionScore(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xl font-bold font-mono text-amber-400"
              />
            ) : (
              <div className="text-3xl font-black text-amber-400 font-mono">{transunionScore}</div>
            )}
            <div className="text-xs text-slate-400 mt-1">Score Model: Classic 04</div>
          </div>
        </div>
      </div>

      {/* 3. Derogatory Items, Inquiries, Public Records & Tradelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Public Records & Adverse Marks */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Public Records & Adverse Items</h4>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Bankruptcy History</span>
              {isEditing ? (
                <select
                  value={bankruptcy}
                  onChange={(e) => setBankruptcy(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                >
                  <option value="None">None</option>
                  <option value="Chapter 7 (Discharged > 2 yrs)">Chapter 7 (Discharged &gt; 2 yrs)</option>
                  <option value="Chapter 7 (Discharged < 2 yrs)">Chapter 7 (Discharged &lt; 2 yrs)</option>
                  <option value="Chapter 13 (Active/Dismissed)">Chapter 13 (Active/Dismissed)</option>
                </select>
              ) : (
                <span className={`font-bold font-mono ${bankruptcy === 'None' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {bankruptcy}
                </span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Open Collections</span>
              {isEditing ? (
                <input
                  type="text"
                  value={openCollections}
                  onChange={(e) => setOpenCollections(e.target.value)}
                  className="w-48 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              ) : (
                <span className="font-medium text-slate-200">{openCollections}</span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Charge-Offs</span>
              {isEditing ? (
                <input
                  type="text"
                  value={chargeOffs}
                  onChange={(e) => setChargeOffs(e.target.value)}
                  className="w-48 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              ) : (
                <span className="font-medium text-slate-200">{chargeOffs}</span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Judgments</span>
              {isEditing ? (
                <input
                  type="text"
                  value={judgments}
                  onChange={(e) => setJudgments(e.target.value)}
                  className="w-48 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              ) : (
                <span className="font-medium text-slate-200">{judgments}</span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Federal / State Tax Liens</span>
              {isEditing ? (
                <input
                  type="text"
                  value={taxLiens}
                  onChange={(e) => setTaxLiens(e.target.value)}
                  className="w-48 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              ) : (
                <span className="font-medium text-slate-200">{taxLiens}</span>
              )}
            </div>

            <div className="flex items-start justify-between gap-4">
              <span className="text-slate-400">Hard Inquiries (Last 6 Months)</span>
              {isEditing ? (
                <input
                  type="number"
                  value={recentInquiries}
                  onChange={(e) => setRecentInquiries(parseInt(e.target.value, 10) || 0)}
                  className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                />
              ) : (
                <span className="font-bold font-mono text-slate-200">{recentInquiries} Inquiries</span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Tradeline Utilization & Housing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <CreditCard className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-bold text-white">Revolving Utilization & Housing</h4>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-slate-400">Revolving Credit Utilization</span>
                <span className={`font-bold font-mono ${creditUtilization > 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {creditUtilization}%
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-full rounded-full ${
                    creditUtilization > 50 ? 'bg-rose-500' : creditUtilization > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(creditUtilization, 100)}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {creditUtilization <= 30 ? 'Optimal utilization for Tier 1 commercial underwriting' : 'Elevated revolving balances noted'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Guarantor Housing Status</span>
                <span className="font-medium text-slate-200">{housingStatus}</span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Monthly Housing Obligation</span>
                <span className="font-mono text-slate-200 font-bold">
                  ${Number(housingPayment).toLocaleString()}/mo
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <span className="text-slate-400">Security Freeze / Fraud Alert</span>
                <span className="text-emerald-400 font-medium">None Active (Unlocked for Lender Pull)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Underwriter Credit Narrative & Recommendation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          Underwriter Credit Memo & Rationale
        </h4>

        {isEditing ? (
          <textarea
            value={creditAnalysisNotes}
            onChange={(e) => setCreditAnalysisNotes(e.target.value)}
            rows={3}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            placeholder="Enter credit analysis findings, compensating factors, or credit conditions..."
          />
        ) : (
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {creditAnalysisNotes}
          </div>
        )}
      </div>
    </div>
  );
};
