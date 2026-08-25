import React from 'react';
import { Building2, DollarSign, Globe, Landmark, MapPin, Percent, Users, ShieldCheck } from 'lucide-react';
import { Client } from '../../../types';

interface MasterBusinessSectionProps {
  form: Partial<Client>;
  onChange: (updates: Partial<Client>) => void;
}

export const MasterBusinessSection: React.FC<MasterBusinessSectionProps> = ({ form, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Corporate Entity Details */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <Building2 className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Commercial Entity & Formation Data
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Legal Business Name *</label>
            <input
              type="text"
              value={form.businessName || ''}
              onChange={(e) => onChange({ businessName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-semibold"
              placeholder="e.g. Rostova MedTech Dynamics LLC"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">DBA (Doing Business As)</label>
            <input
              type="text"
              value={form.dba || ''}
              onChange={(e) => onChange({ dba: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="Trade name if different"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Federal Tax ID / EIN *</label>
            <input
              type="text"
              value={form.federalTaxId || ''}
              onChange={(e) => onChange({ federalTaxId: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="XX-XXXXXXX"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Entity Structure</label>
            <select
              value={form.entityType || 'LLC'}
              onChange={(e) => onChange({ entityType: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="LLC">Limited Liability Company (LLC)</option>
              <option value="S-Corporation">S-Corporation</option>
              <option value="C-Corporation">C-Corporation</option>
              <option value="Sole Proprietorship">Sole Proprietorship</option>
              <option value="General Partnership">General Partnership</option>
              <option value="Limited Partnership">Limited Partnership</option>
              <option value="Non-Profit">Non-Profit / 501(c)(3)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">State of Organization</label>
            <input
              type="text"
              value={form.stateOfOrganization || ''}
              onChange={(e) => onChange({ stateOfOrganization: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none uppercase"
              placeholder="IL"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Date Established</label>
            <input
              type="date"
              value={form.businessStartDate || ''}
              onChange={(e) => onChange({ businessStartDate: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Ownership Percentage (%)</label>
            <div className="relative">
              <input
                type="number"
                value={form.ownershipPercentage ?? 100}
                onChange={(e) => onChange({ ownershipPercentage: Number(e.target.value) })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 pr-8 focus:border-amber-400 focus:outline-none"
                min="0"
                max="100"
              />
              <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Owner Title / Role</label>
            <input
              type="text"
              value={form.ownerTitle || 'President & Owner'}
              onChange={(e) => onChange({ ownerTitle: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Managing Member / CEO"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Number of Employees</label>
            <input
              type="number"
              value={form.employeesCount || 1}
              onChange={(e) => onChange({ employeesCount: Number(e.target.value) })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Industry / Sector *</label>
            <input
              type="text"
              value={form.industry || ''}
              onChange={(e) => onChange({ industry: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Medical Device Distribution & Logistics"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Website URL</label>
            <input
              type="text"
              value={form.website || ''}
              onChange={(e) => onChange({ website: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="https://www.company.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Business Description & Core Activities</label>
          <textarea
            rows={2}
            value={form.businessDescription || ''}
            onChange={(e) => onChange({ businessDescription: e.target.value })}
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
            placeholder="Overview of business operations, client base, revenue model, and target growth..."
          />
        </div>
      </div>

      {/* Commercial Location & Contact */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <MapPin className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Commercial Location & Physical Presence
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Business Phone *</label>
            <input
              type="text"
              value={form.businessPhone || ''}
              onChange={(e) => onChange({ businessPhone: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="(312) 555-0190"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Business Email *</label>
            <input
              type="email"
              value={form.businessEmail || ''}
              onChange={(e) => onChange({ businessEmail: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="contact@company.com"
            />
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Business Street Address *</label>
            <input
              type="text"
              value={form.businessAddress || ''}
              onChange={(e) => onChange({ businessAddress: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="Commercial Headquarters Address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business City</label>
              <input
                type="text"
                value={form.businessCity || ''}
                onChange={(e) => onChange({ businessCity: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business State</label>
              <input
                type="text"
                value={form.businessState || ''}
                onChange={(e) => onChange({ businessState: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none uppercase"
                placeholder="IL"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business ZIP</label>
              <input
                type="text"
                value={form.businessZip || ''}
                onChange={(e) => onChange({ businessZip: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="ZIP"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Financials & Banking Channels */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <Landmark className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Commercial Revenue, Cash Flow & Banking
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Annual Gross Revenue ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                value={form.annualRevenue ?? 0}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onChange({
                    annualRevenue: val,
                    monthlyRevenue: Math.round(val / 12),
                  });
                }}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none font-bold"
                placeholder="1,200,000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Monthly Gross Revenue ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
              <input
                type="number"
                value={form.monthlyRevenue ?? 0}
                onChange={(e) => onChange({ monthlyRevenue: Number(e.target.value) })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
                placeholder="100,000"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Business Bank</label>
            <input
              type="text"
              value={form.businessBank || ''}
              onChange={(e) => onChange({ businessBank: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. JPMorgan Chase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Business Checking Account #</label>
            <input
              type="text"
              value={form.businessCheckingAccount || ''}
              onChange={(e) => onChange({ businessCheckingAccount: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="Checking Account Number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bank Routing Number</label>
            <input
              type="text"
              value={form.businessRoutingNumber || ''}
              onChange={(e) => onChange({ businessRoutingNumber: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="9-Digit Routing Number"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
