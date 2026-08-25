import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Calendar, ShieldCheck, Edit2, Save, X, Lock } from 'lucide-react';
import { Client } from '../../../types';
import { SsnViewer } from '../../common/SsnViewer';
import { useData } from '../../../context/DataContext';

interface ClientInfoTabProps {
  client: Client;
  onRefresh: () => void;
}

export const ClientInfoTab: React.FC<ClientInfoTabProps> = ({ client, onRefresh }) => {
  const { updateClient, addToast } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    email: client.email || '',
    phone: client.phone || '',
    ssn: client.ssn || '',
    dob: client.dob || '',
    address: client.address || '',
    city: client.city || '',
    state: client.state || '',
    zip: client.zip || '',
    creditScore: client.creditScore || 700,
    bankruptcy: client.bankruptcy || 'None',
    foreclosure: client.foreclosure || 'None',
    repossession: client.repossession || 'None',
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateClient(client.id, form);
      addToast('success', 'Personal Information Updated', 'Principal borrower data persisted.');
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
              Principal Identity
            </span>
            <span className="text-xs text-slate-400">Borrower ID: {client.id}</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            Client Personal Information & Identity Vault
          </h2>
          <p className="text-xs text-slate-400">
            Securely stored personal identifiers, residential records, and verified SSN.
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => {
              setForm({
                firstName: client.firstName || '',
                lastName: client.lastName || '',
                email: client.email || '',
                phone: client.phone || '',
                ssn: client.ssn || '',
                dob: client.dob || '',
                address: client.address || '',
                city: client.city || '',
                state: client.state || '',
                zip: client.zip || '',
                creditScore: client.creditScore || 700,
                bankruptcy: client.bankruptcy || 'None',
                foreclosure: client.foreclosure || 'None',
                repossession: client.repossession || 'None',
              });
              setIsEditing(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-blue-800 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Edit2 className="w-4 h-4 text-amber-400" />
            <span>Edit Personal Info</span>
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
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Modify Principal Records</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">First Name</label>
              <input
                type="text"
                value={form.firstName || ''}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Last Name</label>
              <input
                type="text"
                value={form.lastName || ''}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Direct Phone</label>
              <input
                type="text"
                value={form.phone || ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Personal Email</label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
              <input
                type="date"
                value={form.dob || ''}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Street Address</label>
              <input
                type="text"
                value={form.address || ''}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">City</label>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">State</label>
                <input
                  type="text"
                  value={form.state || ''}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Zip</label>
                <input
                  type="text"
                  value={form.zip || ''}
                  onChange={(e) => setForm({ ...form, zip: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none"
                />
              </div>
            </div>
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
              <span>{isSaving ? 'Saving...' : 'Save Personal Details'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Card */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Principal Identity & Security
            </h3>

            <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Full Legal Name:</span>
                <span className="font-semibold text-slate-100">{client.firstName} {client.lastName}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Social Security Number:</span>
                <SsnViewer ssn={client.ssn} clientId={client.id} />
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Date of Birth:</span>
                <span className="font-mono">{client.dob || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Personal FICO Score:</span>
                <span className="font-mono font-bold text-amber-300">{client.creditScore || 700} FICO</span>
              </div>
            </div>
          </div>

          {/* Contact & Residential Card */}
          <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Contact & Residence
            </h3>

            <div className="space-y-3 text-xs text-slate-200 divide-y divide-blue-900/40">
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Direct Phone:</span>
                <span className="font-mono text-slate-100">{client.phone || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Personal Email:</span>
                <span className="text-slate-100">{client.email || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-400">Residential Address:</span>
                <span className="text-right text-slate-100">
                  {client.address ? `${client.address}, ${client.city}, ${client.state} ${client.zip}` : 'Not Provided'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
