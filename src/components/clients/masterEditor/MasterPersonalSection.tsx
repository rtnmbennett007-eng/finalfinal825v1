import React from 'react';
import { User, Phone, Mail, MapPin, Calendar, ShieldCheck, CreditCard } from 'lucide-react';
import { Client } from '../../../types';

interface MasterPersonalSectionProps {
  form: Partial<Client>;
  onChange: (updates: Partial<Client>) => void;
}

export const MasterPersonalSection: React.FC<MasterPersonalSectionProps> = ({ form, onChange }) => {
  return (
    <div className="space-y-6">
      {/* Principal Name & Legal Identifiers */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <User className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Principal Identity & Legal Names
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
            <input
              type="text"
              value={form.firstName || ''}
              onChange={(e) => onChange({ firstName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Elena"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Middle Name</label>
            <input
              type="text"
              value={form.middleName || ''}
              onChange={(e) => onChange({ middleName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Marie"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
            <input
              type="text"
              value={form.lastName || ''}
              onChange={(e) => onChange({ lastName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Rostova"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Legal Name</label>
            <input
              type="text"
              value={form.fullLegalName || `${form.firstName || ''} ${form.lastName || ''}`.trim()}
              onChange={(e) => onChange({ fullLegalName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="Complete legal name as on Driver's License"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Preferred Name / Alias</label>
            <input
              type="text"
              value={form.preferredName || ''}
              onChange={(e) => onChange({ preferredName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="Preferred name or nickname"
            />
          </div>
        </div>
      </div>

      {/* Contact Information & Channels */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <Phone className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Contact Numbers & Email Addresses
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Phone *</label>
            <input
              type="text"
              value={form.phone || ''}
              onChange={(e) => onChange({ phone: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="(312) 555-0188"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alternate Phone / Mobile</label>
            <input
              type="text"
              value={form.altPhone || ''}
              onChange={(e) => onChange({ altPhone: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="(312) 555-0199"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Email *</label>
            <input
              type="email"
              value={form.email || ''}
              onChange={(e) => onChange({ email: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="elena@rostovamedtech.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Alternate / Personal Email</label>
            <input
              type="email"
              value={form.altEmail || ''}
              onChange={(e) => onChange({ altEmail: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="elena.personal@gmail.com"
            />
          </div>
        </div>
      </div>

      {/* Sensitive Personal Identifiers (DOB, SSN, DL, Citizenship) */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Government Identifiers, DOB & Driver's License
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Date of Birth (DOB)</label>
            <input
              type="date"
              value={form.dob || ''}
              onChange={(e) => onChange({ dob: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Social Security Number (SSN)</label>
            <input
              type="text"
              value={form.ssn || ''}
              onChange={(e) => onChange({ ssn: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="XXX-XX-4412"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Citizenship / Residency Status</label>
            <select
              value={form.citizenship || 'US Citizen'}
              onChange={(e) => onChange({ citizenship: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="US Citizen">US Citizen</option>
              <option value="Permanent Resident (Green Card)">Permanent Resident (Green Card)</option>
              <option value="Visa Holder">Visa Holder</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Driver's License Number</label>
            <input
              type="text"
              value={form.driversLicenseNumber || ''}
              onChange={(e) => onChange({ driversLicenseNumber: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="DL Number"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">DL Issuing State</label>
            <input
              type="text"
              value={form.driversLicenseState || form.state || ''}
              onChange={(e) => onChange({ driversLicenseState: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none uppercase"
              placeholder="IL"
              maxLength={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">DL Expiration Date</label>
            <input
              type="date"
              value={form.driversLicenseExp || ''}
              onChange={(e) => onChange({ driversLicenseExp: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Residential & Mailing Address */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <MapPin className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Residential & Mailing Addresses
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Street Address *</label>
            <input
              type="text"
              value={form.address || ''}
              onChange={(e) => onChange({ address: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="120 S Riverside Plaza, Suite 1500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => onChange({ city: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="Chicago"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">State</label>
              <input
                type="text"
                value={form.state || ''}
                onChange={(e) => onChange({ state: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none uppercase"
                placeholder="IL"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">ZIP Code</label>
              <input
                type="text"
                value={form.zip || ''}
                onChange={(e) => onChange({ zip: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="60606"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-blue-900/30">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300">Mailing Address (If Different from Residential)</label>
            <button
              type="button"
              onClick={() => onChange({
                mailingAddress: form.address,
                mailingCity: form.city,
                mailingState: form.state,
                mailingZip: form.zip,
              })}
              className="text-[10px] text-amber-400 hover:text-amber-300 underline"
            >
              Same as Residential
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <input
                type="text"
                value={form.mailingAddress || ''}
                onChange={(e) => onChange({ mailingAddress: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="Mailing Street Address"
              />
            </div>
            <div>
              <input
                type="text"
                value={form.mailingCity || ''}
                onChange={(e) => onChange({ mailingCity: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="City"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.mailingState || ''}
                onChange={(e) => onChange({ mailingState: e.target.value })}
                className="w-16 bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none uppercase"
                placeholder="State"
                maxLength={2}
              />
              <input
                type="text"
                value={form.mailingZip || ''}
                onChange={(e) => onChange({ mailingZip: e.target.value })}
                className="flex-1 bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                placeholder="ZIP"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
