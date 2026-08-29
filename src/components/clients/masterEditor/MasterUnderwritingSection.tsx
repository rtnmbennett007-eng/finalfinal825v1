import React from 'react';
import { Scale, CheckCircle2, DollarSign, ShieldAlert, FileText, Percent } from 'lucide-react';
import { FundingProductType, UnderwritingRecord } from '../../../types';
import { ProductSelect } from '../../common/ProductSelect';

interface MasterUnderwritingSectionProps {
  underwriting: Partial<UnderwritingRecord>;
  onChangeUnderwriting: (updated: Partial<UnderwritingRecord>) => void;
}

export const MasterUnderwritingSection: React.FC<MasterUnderwritingSectionProps> = ({
  underwriting,
  onChangeUnderwriting,
}) => {

  return (
    <div className="space-y-6">
      {/* Underwriting Decision & Offer */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Underwriting Assessment & Decision Engine
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
            {underwriting.decision || 'QUALIFIED'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Underwriting Decision *</label>
            <select
              value={underwriting.decision || 'QUALIFIED'}
              onChange={(e) => onChangeUnderwriting({ ...underwriting, decision: e.target.value as any })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
            >
              <option value="QUALIFIED">QUALIFIED</option>
              <option value="PRE_APPROVED">PRE_APPROVED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="NOT_QUALIFIED">NOT_QUALIFIED</option>
              <option value="ADDITIONAL_INFO_REQUESTED">ADDITIONAL_INFO_REQUESTED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Underwriter Name *</label>
            <input
              type="text"
              value={underwriting.underwriterName || ''}
              onChange={(e) => onChangeUnderwriting({ ...underwriting, underwriterName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Dana Javier"
            />
          </div>

          <div>
            <ProductSelect
              label="Recommended Product"
              value={underwriting.recommendedProduct || 'Business Line of Credit'}
              onChange={(val) => onChangeUnderwriting({ ...underwriting, recommendedProduct: val as FundingProductType })}
              selectClassName="p-2.5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Recommended Capital Amount ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                value={underwriting.recommendedAmount ?? 0}
                onChange={(e) => onChangeUnderwriting({ ...underwriting, recommendedAmount: Number(e.target.value) })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-emerald-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                placeholder="250,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assessed Credit Score</label>
            <input
              type="number"
              value={underwriting.creditScore ?? 700}
              onChange={(e) => onChangeUnderwriting({ ...underwriting, creditScore: Number(e.target.value) })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              min="300"
              max="850"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Existing Debt Notes & Covenants</label>
            <textarea
              rows={2}
              value={underwriting.existingDebtNotes || ''}
              onChange={(e) => onChangeUnderwriting({ ...underwriting, existingDebtNotes: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
              placeholder="Existing bank loans, UCC liens, subordinated positions..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">MCA & Daily Cash Flow Hold Notes</label>
            <textarea
              rows={2}
              value={underwriting.mcaNotes || ''}
              onChange={(e) => onChangeUnderwriting({ ...underwriting, mcaNotes: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
              placeholder="Active MCA positions, daily withholding %, payoff requirements..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};
