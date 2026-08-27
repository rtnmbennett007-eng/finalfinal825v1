import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Client, FundingProductType, CANONICAL_PIPELINE_STAGES, PipelineStage } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Plus } from 'lucide-react';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated?: (newClient: Client) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
}) => {
  const { staffList, currentUser } = useAuth();
  const { leadSources, referralPartners, createClient, isSaving, addToast } = useData();

  const [formData, setFormData] = useState<Partial<Client>>({
    firstName: '',
    lastName: '',
    businessName: '',
    ssn: '',
    dob: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    federalTaxId: '',
    annualRevenue: undefined,
    monthlyRevenue: undefined,
    personalAnnualIncome: undefined,
    personalMonthlyIncome: undefined,
    businessStartDate: '',
    ownershipPercentage: undefined,
    stateOfIncorporation: '',
    industry: '',
    leadSource: 'Direct',
    referralPartner: '',
    assignedSalesRep: currentUser?.name || 'Steve',
    assignedStaff: 'Dana',
    requestedAmount: undefined,
    requestedProduct: 'Revenue Funding',
    useOfFunds: '',
    creditScore: undefined,
    isVerified: false,
    isUnderwritten: false,
    currentStatus: 'No Set – Follow Up',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.businessName || !formData.email) {
      addToast('error', 'Missing Required Fields', 'Please fill out first name, last name, business name, and email.');
      return;
    }

    const payload: Partial<Client> = {
      ...formData,
    };
    if (payload.annualRevenue !== undefined && payload.monthlyRevenue === undefined) {
      payload.monthlyRevenue = Math.round(payload.annualRevenue / 12);
    } else if (payload.monthlyRevenue !== undefined && payload.annualRevenue === undefined) {
      payload.annualRevenue = Math.round(payload.monthlyRevenue * 12);
    }
    if (payload.personalAnnualIncome !== undefined && payload.personalMonthlyIncome === undefined) {
      payload.personalMonthlyIncome = Math.round(payload.personalAnnualIncome / 12);
    } else if (payload.personalMonthlyIncome !== undefined && payload.personalAnnualIncome === undefined) {
      payload.personalAnnualIncome = Math.round(payload.personalMonthlyIncome * 12);
    }

    const created = await createClient(payload);
    onClose();
    if (onClientCreated && created) {
      onClientCreated(created);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Client Master File"
      subtitle="Creates a permanent 360 Client File in database and initializes primary funding deal structure."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Personal Details */}
        <div>
          <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
            1. Personal & Identity Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="e.g. Michael"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="e.g. Vance"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Social Security Number (SSN)</label>
              <input
                type="text"
                value={formData.ssn}
                onChange={(e) => setFormData({ ...formData, ssn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="123-45-6789"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="michael@company.com"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="(555) 000-0000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-3">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="100 Main Street, Suite 400"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">City & State</label>
              <input
                type="text"
                value={`${formData.city || ''}${formData.city ? ', ' : ''}${formData.state || ''}`}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="Houston, TX"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Zip Code</label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="77001"
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="pt-3 border-t border-slate-800">
          <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
            2. Business Entity Information
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Legal Business Name *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="e.g. Vance Logistics LLC"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Federal Tax ID (EIN)</label>
              <input
                type="text"
                value={formData.federalTaxId}
                onChange={(e) => setFormData({ ...formData, federalTaxId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="84-9876543"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Annual Gross Revenue ($)</label>
              <input
                type="number"
                value={formData.annualRevenue !== undefined ? formData.annualRevenue : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                  setFormData({
                    ...formData,
                    annualRevenue: val,
                    monthlyRevenue: val !== undefined ? Math.round(val / 12) : undefined,
                  });
                }}
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Monthly Gross Revenue ($)</label>
              <input
                type="number"
                value={formData.monthlyRevenue !== undefined ? formData.monthlyRevenue : ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : Number(e.target.value);
                  setFormData({
                    ...formData,
                    monthlyRevenue: val,
                    annualRevenue: val !== undefined ? Math.round(val * 12) : undefined,
                  });
                }}
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Credit Score (FICO)</label>
              <input
                type="number"
                value={formData.creditScore !== undefined ? formData.creditScore : ''}
                onChange={(e) => setFormData({ ...formData, creditScore: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
          </div>
        </div>

        {/* Deal Request & CRM Attribution */}
        <div className="pt-3 border-t border-slate-800">
          <h4 className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
            3. Deal Request & CRM Attribution
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Initial Requested Amount ($)</label>
              <input
                type="number"
                value={formData.requestedAmount !== undefined ? formData.requestedAmount : ''}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="Optional"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Requested Product</label>
              <select
                value={formData.requestedProduct}
                onChange={(e) => setFormData({ ...formData, requestedProduct: e.target.value as FundingProductType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              >
                <option value="Revenue Funding">Revenue Funding</option>
                <option value="Personal Term Loan">Personal Term Loan</option>
                <option value="HELOC">HELOC</option>
                <option value="HEI">HEI</option>
                <option value="Business Term Loan">Business Term Loan</option>
                <option value="Business Line of Credit">Business Line of Credit</option>
                <option value="Equipment Financing">Equipment Financing</option>
                <option value="0% Business Credit Cards">0% Business Credit Cards</option>
                <option value="SBA Loan">SBA Loan</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Assigned Operations Staff</label>
              <select
                value={formData.assignedStaff || 'Dana'}
                onChange={(e) => setFormData({ ...formData, assignedStaff: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.jobTitle})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Initial Pipeline Stage</label>
              <select
                value={formData.currentStatus || 'No Set – Follow Up'}
                onChange={(e) => setFormData({ ...formData, currentStatus: e.target.value as PipelineStage })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-semibold text-sky-400"
              >
                {CANONICAL_PIPELINE_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Lead Source</label>
              <select
                value={formData.leadSource || 'Partner'}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              >
                {leadSources.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Referral Partner (Independent)</label>
              <select
                value={formData.referralPartner || ''}
                onChange={(e) => setFormData({ ...formData, referralPartner: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              >
                <option value="">-- None / Direct --</option>
                {referralPartners.map((p) => (
                  <option key={p.id} value={p.name}>{p.name} ({p.company || 'Partner'})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Create & Open Client File</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
