import React, { useState } from 'react';
import { Building2, DollarSign, Edit2, Save, X, FileText, MapPin, Calendar, Percent } from 'lucide-react';
import { Client } from '../../../types';
import { useData } from '../../../context/DataContext';
import { formatDate } from '../../../utils/dateUtils';

interface BusinessInfoTabProps {
  client: Client;
  onRefresh: () => void;
}

export const BusinessInfoTab: React.FC<BusinessInfoTabProps> = ({ client, onRefresh }) => {
  const { updateClient, addToast } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({
    businessName: client.businessName || '',
    dba: client.dba || '',
    federalTaxId: client.federalTaxId || '',
    stateOfOrganization: client.stateOfOrganization || '',
    entityType: client.entityType || 'LLC',
    businessStartDate: client.businessStartDate || '',
    annualRevenue: client.annualRevenue || 0,
    monthlyRevenue: client.monthlyRevenue || 0,
    ownershipPercentage: client.ownershipPercentage || 100,
    ownerTitle: client.ownerTitle || 'President & Owner',
    businessAddress: client.businessAddress || '',
    industry: client.industry || '',
    businessDescription: client.businessDescription || '',
    businessPhone: client.businessPhone || '',
    businessEmail: client.businessEmail || '',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateClient(client.id, form);
      addToast('success', 'Business Profile Updated', 'Commercial entity data persisted.');
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
              Entity Profile
            </span>
            <span className="text-xs text-slate-400">EIN: {client.federalTaxId || 'Pending'}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            Business Organization & Entity Records
          </h2>
          <p className="text-xs text-slate-400">
            Corporate structure, formation state, revenue figures, and operational overview.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => {
              setForm({
                businessName: client.businessName || '',
                dba: client.dba || '',
                federalTaxId: client.federalTaxId || '',
                stateOfOrganization: client.stateOfOrganization || '',
                entityType: client.entityType || 'LLC',
                businessStartDate: client.businessStartDate || '',
                annualRevenue: client.annualRevenue || 0,
                monthlyRevenue: client.monthlyRevenue || 0,
                ownershipPercentage: client.ownershipPercentage || 100,
                ownerTitle: client.ownerTitle || 'President & Owner',
                businessAddress: client.businessAddress || '',
                industry: client.industry || '',
                businessDescription: client.businessDescription || '',
                businessPhone: client.businessPhone || '',
                businessEmail: client.businessEmail || '',
              });
              setIsEditing(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-blue-800 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Edit2 className="w-4 h-4 text-amber-400" />
            <span>Edit Business Info</span>
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSave} className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4 text-xs">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Modify Business Entity Records</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Legal Company Name *</label>
              <input
                type="text"
                required
                value={form.businessName || ''}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">DBA / Trade Name</label>
              <input
                type="text"
                value={form.dba || ''}
                onChange={(e) => setForm({ ...form, dba: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Federal Tax ID (EIN)</label>
              <input
                type="text"
                value={form.federalTaxId || ''}
                onChange={(e) => setForm({ ...form, federalTaxId: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">State of Organization</label>
              <input
                type="text"
                value={form.stateOfOrganization || ''}
                onChange={(e) => setForm({ ...form, stateOfOrganization: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Entity Type</label>
              <select
                value={form.entityType || 'LLC'}
                onChange={(e) => setForm({ ...form, entityType: e.target.value as any })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              >
                <option value="LLC">LLC</option>
                <option value="C-Corp">C-Corporation</option>
                <option value="S-Corp">S-Corporation</option>
                <option value="Sole Proprietorship">Sole Proprietorship</option>
                <option value="Partnership">Partnership</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Monthly Gross Revenue ($)</label>
              <input
                type="number"
                value={form.monthlyRevenue !== undefined && form.monthlyRevenue !== null ? form.monthlyRevenue : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setForm({
                    ...form,
                    monthlyRevenue: val,
                    annualRevenue: val !== undefined ? Math.round(val * 12) : undefined,
                  });
                }}
                placeholder="Optional"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Annual Gross Revenue ($)</label>
              <input
                type="number"
                value={form.annualRevenue !== undefined && form.annualRevenue !== null ? form.annualRevenue : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setForm({
                    ...form,
                    annualRevenue: val,
                    monthlyRevenue: val !== undefined ? Math.round(val / 12) : undefined,
                  });
                }}
                placeholder="Optional"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Ownership Stake (%)</label>
              <input
                type="number"
                value={form.ownershipPercentage !== undefined && form.ownershipPercentage !== null ? form.ownershipPercentage : ''}
                onChange={(e) => setForm({ ...form, ownershipPercentage: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                placeholder="e.g. 100"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Business Commercial Address</label>
            <input
              type="text"
              value={form.businessAddress || ''}
              onChange={(e) => setForm({ ...form, businessAddress: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-blue-900 flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Business Details'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Corporate Entity Details */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Legal Structure & Registration
            </h3>

            <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Legal Company Name:</span>
                <span className="font-bold text-slate-100">{client.businessName}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">DBA:</span>
                <span className="text-slate-200">{client.dba || 'None'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Federal Tax ID (EIN):</span>
                <span className="font-mono font-bold text-amber-300">{client.federalTaxId || 'Not Logged'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">State of Organization:</span>
                <span className="font-semibold">{client.stateOfOrganization || client.state || 'IL'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Entity Type:</span>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                  {client.entityType || 'LLC'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Formation Date:</span>
                <span className="font-mono">{formatDate(client.businessStartDate, 'Not Provided')}</span>
              </div>
            </div>
          </div>

          {/* Revenue & Operations */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Cashflow & Operations
            </h3>

            <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Monthly Gross Revenue:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ${Number(client.monthlyRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Annual Gross Revenue:</span>
                <span className="font-mono font-bold text-blue-300">
                  ${Number(client.annualRevenue || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Ownership Stake:</span>
                <span className="font-mono font-bold text-amber-300">{client.ownershipPercentage || 100}%</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Industry:</span>
                <span className="text-slate-200">{client.industry || 'General Commercial'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Business Address:</span>
                <span className="text-right text-slate-200">
                  {client.businessAddress || (client.address ? `${client.address}, ${client.city}, ${client.state}` : 'Not Provided')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
