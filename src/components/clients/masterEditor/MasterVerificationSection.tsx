import React from 'react';
import { FileCheck2, CheckCircle2, AlertTriangle, ShieldCheck, CheckSquare, Square } from 'lucide-react';
import { MasterVerificationData } from '../../../types';

interface MasterVerificationSectionProps {
  verificationData: Partial<MasterVerificationData>;
  onChangeVerification: (updated: Partial<MasterVerificationData>) => void;
}

export const MasterVerificationSection: React.FC<MasterVerificationSectionProps> = ({
  verificationData,
  onChangeVerification,
}) => {
  const checklist = verificationData.finalChecklist || {
    identityVerified: false,
    businessVerified: false,
    incomeVerified: false,
    employmentVerified: false,
    bankingVerified: false,
    documentsReceived: false,
    existingDebtReviewed: false,
    housingVerified: false,
    fundingAmountConfirmed: false,
    creditAvailableForPull: false,
    fileReadyForUnderwriting: false,
  };

  const toggleChecklist = (key: keyof typeof checklist) => {
    const updatedChecklist = { ...checklist, [key]: !checklist[key] };
    const allChecked = Object.values(updatedChecklist).every(Boolean);
    onChangeVerification({
      ...verificationData,
      finalChecklist: updatedChecklist,
      status: allChecked ? 'VERIFIED' : (verificationData.status || 'IN_PROGRESS'),
    });
  };

  const checklistItems: { key: keyof typeof checklist; label: string }[] = [
    { key: 'identityVerified', label: '1. Primary Borrower Identity & SSN Verified' },
    { key: 'businessVerified', label: '2. Commercial Entity, EIN & Good Standing Confirmed' },
    { key: 'incomeVerified', label: '3. Stated Revenue & Monthly Bank Deposits Cross-Checked' },
    { key: 'employmentVerified', label: '4. Employment, Ownership & Payroll Records Confirmed' },
    { key: 'bankingVerified', label: '5. Primary Checking Account & Operating Balance Verified' },
    { key: 'documentsReceived', label: '6. Required Underwriting Documents Vault Complete' },
    { key: 'existingDebtReviewed', label: '7. Existing MCA Balances & Debt Obligations Assessed' },
    { key: 'housingVerified', label: '8. Residential Address & Monthly Housing Expense Verified' },
    { key: 'fundingAmountConfirmed', label: '9. Requested Capital Amount & Target Product Aligned' },
    { key: 'creditAvailableForPull', label: '10. Credit Unlocked / Ready for Soft/Hard Inquiries' },
    { key: 'fileReadyForUnderwriting', label: '11. File Formally Cleared for Underwriting Review' },
  ];

  return (
    <div className="space-y-6">
      {/* Verification Status & Specialist */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Verification Hub Master Status
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
            {verificationData.status || 'PENDING'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Status *</label>
            <select
              value={verificationData.status || 'PENDING'}
              onChange={(e) => onChangeVerification({ ...verificationData, status: e.target.value as any })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-bold"
            >
              <option value="PENDING">PENDING</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="NEEDS_CORRECTION">NEEDS_CORRECTION</option>
              <option value="UNVERIFIED">UNVERIFIED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Specialist / Staff</label>
            <input
              type="text"
              value={verificationData.verificationSpecialist || ''}
              onChange={(e) => onChangeVerification({ ...verificationData, verificationSpecialist: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Dana Javier"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Date</label>
            <input
              type="date"
              value={verificationData.date || new Date().toISOString().split('T')[0]}
              onChange={(e) => onChangeVerification({ ...verificationData, date: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Verification Call Summary & Findings</label>
          <textarea
            rows={2}
            value={verificationData.callSummary || ''}
            onChange={(e) => onChangeVerification({ ...verificationData, callSummary: e.target.value })}
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
            placeholder="Key findings from verification interview, owner confirmation, bank statements review..."
          />
        </div>
      </div>

      {/* 11-Point Verification Checklist */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              11-Point Operational Verification Checklist
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              const allTrue = {
                identityVerified: true,
                businessVerified: true,
                incomeVerified: true,
                employmentVerified: true,
                bankingVerified: true,
                documentsReceived: true,
                existingDebtReviewed: true,
                housingVerified: true,
                fundingAmountConfirmed: true,
                creditAvailableForPull: true,
                fileReadyForUnderwriting: true,
              };
              onChangeVerification({
                ...verificationData,
                finalChecklist: allTrue,
                status: 'VERIFIED',
              });
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-bold underline"
          >
            Mark All Verified
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {checklistItems.map((item) => {
            const isChecked = !!checklist[item.key];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleChecklist(item.key)}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all ${
                  isChecked
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#070d18] border-blue-900/40 text-slate-300 hover:border-blue-700'
                }`}
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
