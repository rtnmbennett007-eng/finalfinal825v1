import React from 'react';
import { FileText, DollarSign, CreditCard, Home, ShieldAlert, AlertCircle } from 'lucide-react';
import { Client, FundingProductType } from '../../../types';

interface MasterApplicationSectionProps {
  form: Partial<Client>;
  onChange: (updates: Partial<Client>) => void;
}

const FUNDING_PRODUCTS: FundingProductType[] = [
  'Revenue Funding',
  'Personal Term Loan',
  'HELOC',
  'HEI',
  'Business Term Loan',
  'Business Line of Credit',
  'Equipment Financing',
  '0% Business Credit Cards',
  '0% Business Cards & Lines of Credit',
  'SBA Loan',
  'Other Valid Product',
];

export const MasterApplicationSection: React.FC<MasterApplicationSectionProps> = ({
  form,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Funding Request Details */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Funding Request & Capital Requirements
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Requested Funding Amount ($) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                value={form.requestedAmount ?? 0}
                onChange={(e) => onChange({ requestedAmount: Number(e.target.value) })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                placeholder="250,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Requested Funding Product *</label>
            <select
              value={form.requestedProduct || 'Business Line of Credit'}
              onChange={(e) => onChange({ requestedProduct: e.target.value as FundingProductType })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              {FUNDING_PRODUCTS.map((prod) => (
                <option key={prod} value={prod}>
                  {prod}
                </option>
              ))}
            </select>
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
