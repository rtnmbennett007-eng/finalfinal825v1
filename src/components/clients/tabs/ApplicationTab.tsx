import React, { useState } from 'react';
import { FileText, DollarSign, Edit2, Save, X, Layers, AlertTriangle, CheckCircle } from 'lucide-react';
import { Client } from '../../../types';
import { useData } from '../../../context/DataContext';
import { ProductSelect } from '../../common/ProductSelect';

interface ApplicationTabProps {
  client: Client;
  onRefresh: () => void;
}

export const ApplicationTab: React.FC<ApplicationTabProps> = ({ client, onRefresh }) => {
  const { updateClient, addToast } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({
    requestedAmount: client.requestedAmount,
    requestedProduct: client.requestedProduct || '0% Business Cards & Lines of Credit',
    useOfFunds: client.useOfFunds || '',
    creditScore: client.creditScore,
    bankruptcy: client.bankruptcy || 'None',
    foreclosure: client.foreclosure || 'None',
    repossession: client.repossession || 'None',
    existingLoans: client.existingLoans || '',
    leadSource: client.leadSource || 'Direct Inbound',
    referralPartner: client.referralPartner || 'Direct',
    assignedStaff: client.assignedStaff || 'Dana',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateClient(client.id, form);
      addToast('success', 'Application Record Updated', 'Loan request and financial profile updated.');
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
              Origination Request
            </span>
            <span className="text-xs text-slate-400">Status: {client.currentStatus}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Funding Application & Financial Requests
          </h2>
          <p className="text-xs text-slate-400">
            Initial loan application details, requested amounts, intended use of funds, and existing debt disclosures.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => {
              setForm({
                requestedAmount: client.requestedAmount,
                requestedProduct: client.requestedProduct || '0% Business Cards & Lines of Credit',
                useOfFunds: client.useOfFunds || '',
                creditScore: client.creditScore,
                bankruptcy: client.bankruptcy || 'None',
                foreclosure: client.foreclosure || 'None',
                repossession: client.repossession || 'None',
                existingLoans: client.existingLoans || '',
                leadSource: client.leadSource || 'Direct Inbound',
                referralPartner: client.referralPartner || 'Direct',
                assignedStaff: client.assignedStaff || 'Dana',
              });
              setIsEditing(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-blue-800 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Edit2 className="w-4 h-4 text-amber-400" />
            <span>Edit Application Details</span>
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
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Modify Application Data</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Requested Funding Amount ($)</label>
              <input
                type="number"
                value={form.requestedAmount !== undefined && form.requestedAmount !== null ? form.requestedAmount : ''}
                onChange={(e) => setForm({ ...form, requestedAmount: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                placeholder="e.g. 150,000"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none font-mono font-bold text-amber-400"
              />
            </div>
            <div>
              <ProductSelect
                label="Target Product Type"
                value={form.requestedProduct || ''}
                onChange={(val) => setForm({ ...form, requestedProduct: val })}
                otherType={form.otherProductType || ''}
                onChangeOtherType={(val) => setForm({ ...form, otherProductType: val })}
                otherDescription={form.otherProductDescription || ''}
                onChangeOtherDescription={(val) => setForm({ ...form, otherProductDescription: val })}
                selectClassName="p-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Intended Use of Funds</label>
            <textarea
              rows={2}
              value={form.useOfFunds || ''}
              onChange={(e) => setForm({ ...form, useOfFunds: e.target.value })}
              placeholder="e.g., Working capital, marketing expansion, inventory, equipment purchase..."
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Bankruptcy History</label>
              <input
                type="text"
                value={form.bankruptcy || 'None'}
                onChange={(e) => setForm({ ...form, bankruptcy: e.target.value as any })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Foreclosure History</label>
              <input
                type="text"
                value={form.foreclosure || 'None'}
                onChange={(e) => setForm({ ...form, foreclosure: e.target.value as any })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Repossession History</label>
              <input
                type="text"
                value={form.repossession || 'None'}
                onChange={(e) => setForm({ ...form, repossession: e.target.value as any })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Existing Business Loans / Open MCAs</label>
            <input
              type="text"
              value={form.existingLoans || ''}
              onChange={(e) => setForm({ ...form, existingLoans: e.target.value })}
              placeholder="e.g., $15,000 balance with Fundbox, $25,000 SBA EIDL loan"
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
              <span>{isSaving ? 'Saving...' : 'Save Application Data'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Requested Details */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Capital Requirements
            </h3>

            <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Target Funding Amount:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">
                  {client.requestedAmount !== undefined && client.requestedAmount !== null ? `$${Number(client.requestedAmount).toLocaleString()}` : 'Not Provided'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Product Preference:</span>
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold">
                  {client.requestedProduct || 'Revenue Funding'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-400 block mb-1">Declared Use of Funds:</span>
                <p className="text-slate-200 bg-[#070d18] p-3 rounded-xl border border-blue-900/50">
                  {client.useOfFunds || 'Not Disclosed'}
                </p>
              </div>
            </div>
          </div>

          {/* Underwriting Background */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4" /> Credit & Liability History
            </h3>

            <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Reported FICO Score:</span>
                <span className="font-mono font-bold text-slate-100">
                  {client.creditScore ? `${client.creditScore}` : 'Not Provided'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Prior Bankruptcies:</span>
                <span className="font-semibold text-slate-200">{client.bankruptcy || 'None'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Foreclosures / Judgments:</span>
                <span className="font-semibold text-slate-200">{client.foreclosure || 'None'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Existing Loans / Open Positions:</span>
                <span className="text-slate-200">{client.existingLoans || 'None Disclosed'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
