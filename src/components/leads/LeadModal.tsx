import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Lead, PipelineStage } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Plus, ArrowRightLeft } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadToEdit?: Lead | null;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, leadToEdit }) => {
  const { staffList } = useAuth();
  const { leadSources, referralPartners, createLead, updateLead, createLeadSource, isSaving, addToast } = useData();

  const [formData, setFormData] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    businessName: '',
    email: '',
    phone: '',
    state: 'TX',
    industry: 'Commercial & Industrial Services',
    leadSource: 'Partner',
    referralPartner: 'ABC Financial Partners',
    assignedSalesRep: 'Steve',
    status: 'NEW_LEAD',
    applicationStatus: 'SENT',
    ghlSyncStatus: 'SYNCED',
    estimatedAmount: 50000,
    notes: '',
    lastContact: new Date().toISOString().split('T')[0],
    nextFollowUp: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    ghlContactId: '',
    ghlOpportunityId: '',
  });

  const [newCustomSource, setNewCustomSource] = useState('');
  const [showAddSource, setShowAddSource] = useState(false);

  useEffect(() => {
    if (leadToEdit) {
      setFormData(leadToEdit);
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        businessName: '',
        email: '',
        phone: '',
        state: 'TX',
        industry: 'Commercial Contracting',
        leadSource: 'Partner',
        referralPartner: referralPartners[0]?.name || '',
        assignedSalesRep: staffList[0]?.name || 'Steve',
        status: 'NEW_LEAD',
        applicationStatus: 'SENT',
        ghlSyncStatus: 'SYNCED',
        estimatedAmount: 50000,
        notes: '',
        lastContact: new Date().toISOString().split('T')[0],
        nextFollowUp: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        ghlContactId: `ghl_c_${Math.floor(100000 + Math.random() * 900000)}`,
        ghlOpportunityId: `ghl_opp_${Math.floor(100000 + Math.random() * 900000)}`,
      });
    }
  }, [leadToEdit, isOpen, staffList, referralPartners]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      addToast('error', 'Missing Required Fields', 'Please provide first name, last name, and email.');
      return;
    }

    if (leadToEdit) {
      await updateLead(leadToEdit.id, formData);
    } else {
      await createLead(formData);
    }
    onClose();
  };

  const handleAddSource = async () => {
    if (!newCustomSource.trim()) return;
    await createLeadSource(newCustomSource.trim());
    setFormData((prev) => ({ ...prev, leadSource: newCustomSource.trim() }));
    setNewCustomSource('');
    setShowAddSource(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={leadToEdit ? `Edit Lead: ${leadToEdit.firstName} ${leadToEdit.lastName}` : 'Add New Inbound Lead'}
      subtitle="Ingest or manually register a new funding opportunity into Maple X operations & GHL CRM."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              First Name *
            </label>
            <input
              type="text"
              required
              value={formData.firstName || ''}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. John"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Last Name *
            </label>
            <input
              type="text"
              required
              value={formData.lastName || ''}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. Smith"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Business Legal Name
            </label>
            <input
              type="text"
              value={formData.businessName || ''}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. Smith Commercial Enterprises LLC"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              placeholder="(555) 000-0000"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              State / Region
            </label>
            <input
              type="text"
              value={formData.state || ''}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              placeholder="e.g. TX, FL, CA"
            />
          </div>
        </div>

        {/* Lead Source & Referral Partner (Independent Tracking) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wide">
                Lead Source
              </label>
              <button
                type="button"
                onClick={() => setShowAddSource(!showAddSource)}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            </div>
            {showAddSource ? (
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={newCustomSource}
                  onChange={(e) => setNewCustomSource(e.target.value)}
                  placeholder="New Source Name"
                  className="w-full bg-slate-950 border border-blue-500 rounded-lg px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddSource}
                  className="px-2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  Add
                </button>
              </div>
            ) : (
              <select
                value={formData.leadSource || 'Partner'}
                onChange={(e) => setFormData({ ...formData, leadSource: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
              >
                {leadSources.map((src) => (
                  <option key={src.id} value={src.name}>
                    {src.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Referral Partner (Independent)
            </label>
            <select
              value={formData.referralPartner || ''}
              onChange={(e) => setFormData({ ...formData, referralPartner: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="">-- None / Direct --</option>
              {referralPartners.map((ref) => (
                <option key={ref.id} value={ref.name}>
                  {ref.name} ({ref.company || 'Partner'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Assigned Sales Rep
            </label>
            <select
              value={formData.assignedSalesRep || 'Steve'}
              onChange={(e) => setFormData({ ...formData, assignedSalesRep: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            >
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.name}>
                  {staff.name} ({staff.jobTitle})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Pipeline Stage
            </label>
            <select
              value={formData.status || 'NEW_LEAD'}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PipelineStage })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="NEW_LEAD">NEW LEAD</option>
              <option value="SALES_CONTACT">SALES CONTACT</option>
              <option value="APPLICATION_SENT">APPLICATION SENT</option>
              <option value="APPLICATION_RECEIVED">APPLICATION RECEIVED</option>
              <option value="DOCUMENT_REQUEST">DOCUMENT REQUEST</option>
              <option value="DOCUMENTS_RECEIVED">DOCUMENTS RECEIVED</option>
              <option value="VERIFICATION_PENDING">VERIFICATION PENDING</option>
              <option value="VERIFICATION_COMPLETE">VERIFICATION COMPLETE</option>
              <option value="UNDERWRITING">UNDERWRITING</option>
              <option value="READY_FOR_LENDER">READY FOR LENDER</option>
              <option value="NOT_QUALIFIED">NOT QUALIFIED</option>
              <option value="DECLINED">DECLINED</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Estimated Funding Requested ($)
            </label>
            <input
              type="number"
              value={formData.estimatedAmount || 50000}
              onChange={(e) => setFormData({ ...formData, estimatedAmount: Number(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
              Application Link Status (GHL)
            </label>
            <select
              value={formData.applicationStatus || 'SENT'}
              onChange={(e) => setFormData({ ...formData, applicationStatus: e.target.value as any })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            >
              <option value="NOT_STARTED">NOT STARTED</option>
              <option value="SENT">SENT TO CLIENT</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="SUBMITTED">SUBMITTED</option>
            </select>
          </div>
        </div>

        {/* CRM GHL IDs & Auto-Sync Notice */}
        <div className="space-y-2 pt-2 border-t border-slate-800 bg-slate-950/40 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-semibold">
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>GoHighLevel CRM Direct Sync</span>
            </div>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
              Auto-Push Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Saving or modifying this lead will automatically push and sync contact details to your configured GoHighLevel CRM pipeline.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-1">
                GHL Contact ID
              </label>
              <input
                type="text"
                value={formData.ghlContactId || ''}
                onChange={(e) => setFormData({ ...formData, ghlContactId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="e.g. ghl_cnt_12345 (Auto-generated if empty)"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wide mb-1">
                GHL Opportunity ID
              </label>
              <input
                type="text"
                value={formData.ghlOpportunityId || ''}
                onChange={(e) => setFormData({ ...formData, ghlOpportunityId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
                placeholder="e.g. ghl_opp_98765 (Auto-assigned)"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wide mb-1">
            Lead Notes & Intake Context
          </label>
          <textarea
            rows={3}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
            placeholder="Intake notes, business model, capital purpose, partner remarks..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
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
            className="flex items-center space-x-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{leadToEdit ? 'Save Changes' : 'Add & Save Lead'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
