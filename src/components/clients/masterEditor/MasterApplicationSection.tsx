import React, { useState } from 'react';
import { FileText, DollarSign, CreditCard, Home, ShieldAlert, AlertCircle } from 'lucide-react';
import { Client, FundingProductType } from '../../../types';
import { ProductSelect } from '../../common/ProductSelect';
import { formatFundingRange, validateFundingRange } from '../../../utils/fundingUtils';

interface MasterApplicationSectionProps {
  form: Partial<Client>;
  onChange: (updates: Partial<Client>) => void;
}

export const MasterApplicationSection: React.FC<MasterApplicationSectionProps> = ({
  form,
  onChange,
}) => {
  const [rangeError, setRangeError] = useState<string | null>(null);

  const handleMinChange = (val?: number) => {
    const nextMin = val;
    const nextMax = form.requestedAmountMax ?? form.requestedAmount;
    if (nextMin !== undefined && nextMax !== undefined) {
      const v = validateFundingRange(nextMin, nextMax);
      setRangeError(v.isValid ? null : v.error || 'Invalid range');
    } else {
      setRangeError(null);
    }
    const formatted = formatFundingRange(nextMin, nextMax);
    onChange({
      requestedAmountMin: nextMin,
      requestedFundingMin: nextMin,
      requestedFundingMax: nextMax,
      requestedFundingRange: formatted !== 'Not Available' ? formatted : undefined,
      requestedAmount: nextMax ?? nextMin ?? 0,
    });
  };

  const handleMaxChange = (val?: number) => {
    const nextMax = val;
    const nextMin = form.requestedFundingMin ?? form.requestedAmountMin ?? form.requestedAmount;
    if (nextMin !== undefined && nextMax !== undefined) {
      const v = validateFundingRange(nextMin, nextMax);
      setRangeError(v.isValid ? null : v.error || 'Invalid range');
    } else {
      setRangeError(null);
    }
    const formatted = formatFundingRange(nextMin, nextMax);
    onChange({
      requestedAmountMax: nextMax,
      requestedFundingMin: nextMin,
      requestedFundingMax: nextMax,
      requestedFundingRange: formatted !== 'Not Available' ? formatted : undefined,
      requestedAmount: nextMax ?? nextMin ?? 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Funding Request Details */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Funding Request & Capital Requirements
            </h3>
          </div>
          {(form.requestedAmountMin !== undefined || form.requestedAmountMax !== undefined || form.requestedAmount !== undefined) && (
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-xs font-mono text-blue-300">
              <span className="text-slate-400">Funding Range:</span>
              <strong className="text-amber-300 font-bold">
                {formatFundingRange(form.requestedAmountMin, form.requestedAmountMax, form.requestedAmount)}
              </strong>
            </div>
          )}
        </div>

        {rangeError && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
            <span>{rangeError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Minimum Requested ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                min="0"
                value={form.requestedAmountMin !== undefined ? form.requestedAmountMin : (form.requestedAmount ?? '')}
                onChange={(e) => handleMinChange(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                placeholder="50,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Maximum Requested ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                min="0"
                value={form.requestedAmountMax !== undefined ? form.requestedAmountMax : (form.requestedAmount ?? '')}
                onChange={(e) => handleMaxChange(e.target.value === '' ? undefined : Number(e.target.value))}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                placeholder="100,000"
              />
            </div>
          </div>

          <div>
            <ProductSelect
              label="Requested Funding Product"
              required
              value={form.requestedProduct || 'Business Line of Credit'}
              onChange={(val) => onChange({ requestedProduct: val as FundingProductType })}
              otherType={form.otherProductType || ''}
              onChangeOtherType={(val) => onChange({ otherProductType: val })}
              otherDescription={form.otherProductDescription || ''}
              onChangeOtherDescription={(val) => onChange({ otherProductDescription: val })}
              selectClassName="p-2.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Funding Urgency</label>
            <select
              value={form.fundingUrgency || 'This Week'}
              onChange={(e) => onChange({ fundingUrgency: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="Immediately">⚡ Immediately (Within 24-48 Hours)</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month (Standard)</option>
              <option value="Flexible">Flexible / Planning Ahead</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Purpose of Funds / Use of Proceeds</label>
          <textarea
            rows={2}
            value={form.useOfFunds || ''}
            onChange={(e) => onChange({ useOfFunds: e.target.value })}
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
            placeholder="e.g. Purchase automated packaging inventory and fund high-volume medical equipment distribution."
          />
        </div>
      </div>

      {/* Credit Profile & Borrower Financials */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <CreditCard className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Credit Standing, Personal Income & Liabilities
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Personal Credit Score (FICO)</label>
            <input
              type="number"
              value={form.creditScore ?? 700}
              onChange={(e) => onChange({ creditScore: Number(e.target.value), ficoScore: Number(e.target.value) })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono font-bold focus:border-amber-400 focus:outline-none"
              min="300"
              max="850"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Personal Annual Income ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                value={form.personalAnnualIncome ?? 0}
                onChange={(e) => onChange({ personalAnnualIncome: Number(e.target.value) })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                placeholder="150,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Housing Status</label>
            <select
              value={form.housingStatus || 'Homeowner'}
              onChange={(e) => onChange({ housingStatus: e.target.value as any })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="Homeowner">Homeowner</option>
              <option value="Renter">Renter</option>
              <option value="Other">Other / Living with Family</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Mortgage / Rent ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                value={form.monthlyHousingPayment ?? 0}
                onChange={(e) => onChange({ monthlyHousingPayment: Number(e.target.value) })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                placeholder="2,500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bankruptcy History</label>
            <select
              value={form.bankruptcy || 'None'}
              onChange={(e) => onChange({ bankruptcy: e.target.value as any })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="None">None</option>
              <option value="Chapter 7">Chapter 7</option>
              <option value="Chapter 13">Chapter 13</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Foreclosure / Repossession</label>
            <select
              value={form.foreclosure || 'None'}
              onChange={(e) => onChange({ foreclosure: e.target.value as any, repossession: e.target.value as any })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="None">None</option>
              <option value="Yes">Yes</option>
              <option value="Within 3 Years">Within 3 Years</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Existing Loans / Notes Payable</label>
            <input
              type="text"
              value={form.existingLoans || ''}
              onChange={(e) => onChange({ existingLoans: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. $45,000 Term Loan @ Chase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Existing MCA Positions / Advances</label>
            <input
              type="text"
              value={form.existingMcas || ''}
              onChange={(e) => onChange({ existingMcas: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. 1 Active MCA Position ($18k balance)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
