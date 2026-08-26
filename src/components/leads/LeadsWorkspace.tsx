import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowRightLeft,
  Calendar,
  Phone,
  Mail,
  Building2,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Lead, PipelineStage } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { LeadModal } from './LeadModal';
import { formatDate } from '../../utils/dateUtils';

interface LeadsWorkspaceProps {
  onOpenNewLeadModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const LeadsWorkspace: React.FC<LeadsWorkspaceProps> = ({
  onOpenNewLeadModal,
  setActiveTab,
}) => {
  const {
    leads,
    deleteLead,
    convertLeadToClient,
    leadSources,
    referralPartners,
    syncGhlNow,
    setSelectedClientId,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [partnerFilter, setPartnerFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingLead, setIsDeletingLead] = useState(false);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchQuery === '' ||
        (lead.firstName + ' ' + lead.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.includes(searchQuery) ||
        lead.ghlContactId?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource = sourceFilter === 'ALL' || lead.leadSource === sourceFilter;
      const matchesPartner = partnerFilter === 'ALL' || lead.referralPartner === partnerFilter;
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;

      return matchesSearch && matchesSource && matchesPartner && matchesStatus;
    });
  }, [leads, searchQuery, sourceFilter, partnerFilter, statusFilter]);

  const handleEdit = (lead: Lead) => {
    setLeadToEdit(lead);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    setLeadToDelete({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    setIsDeletingLead(true);
    try {
      await deleteLead(leadToDelete.id);
      setLeadToDelete(null);
    } catch (err) {
      console.error('Delete lead failed:', err);
    } finally {
      setIsDeletingLead(false);
    }
  };

  const handleConvertToClient = async (lead: Lead) => {
    setConvertingId(lead.id);
    try {
      const res = await convertLeadToClient(lead.id);
      setSelectedClientId(res.client.id);
      setActiveTab('clients');
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-mono">
              CRM & Intake Hub
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Total Leads: {leads.length}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Leads Operations Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize inbound leads, track independent Lead Sources and Referral Partners, and convert qualified files to active Client Master Records.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => syncGhlNow()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
            <span>Sync GHL CRM</span>
          </button>
          <button
            onClick={onOpenNewLeadModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, business, GHL ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Lead Source Filter */}
        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Lead Sources</option>
            {leadSources.map((s) => (
              <option key={s.id} value={s.name}>
                Source: {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Referral Partner Filter */}
        <div>
          <select
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Referral Partners</option>
            {referralPartners.map((p) => (
              <option key={p.id} value={p.name}>
                Partner: {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pipeline Stage Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Pipeline Stages</option>
            <option value="NEW_LEAD">New Lead</option>
            <option value="SALES_CONTACT">Sales Contact</option>
            <option value="APPLICATION_SENT">Application Sent</option>
            <option value="APPLICATION_RECEIVED">Application Received</option>
            <option value="DOCUMENT_REQUEST">Document Request</option>
            <option value="DOCUMENTS_RECEIVED">Documents Received</option>
            <option value="VERIFICATION_PENDING">Verification Pending</option>
            <option value="UNDERWRITING">Underwriting</option>
            <option value="READY_FOR_LENDER">Ready For Lender</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Lead Contact / Business</th>
                <th className="py-3 px-3">Source & Referral Partner</th>
                <th className="py-3 px-3">Assigned Sales Rep</th>
                <th className="py-3 px-3">Est. Amount</th>
                <th className="py-3 px-3">Stage / Status</th>
                <th className="py-3 px-3">GHL Sync</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 text-xs">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {lead.businessName || 'Business Name Pending'}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{lead.email}</span>
                        <span>•</span>
                        <span>{lead.phone}</span>
                        {lead.state && <span>• {lead.state}</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200">{lead.leadSource}</div>
                      {lead.referralPartner ? (
                        <div className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          {lead.referralPartner}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500">Direct Intake</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-slate-300 font-medium">{lead.assignedSalesRep}</span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-200">
                      ${lead.estimatedAmount?.toLocaleString() || '50,000'}
                    </td>

                    <td className="py-3 px-3">
                      <StatusBadge status={lead.status} size="sm" />
                      <div className="text-[10px] text-slate-500 mt-1">
                        App: {lead.applicationStatus}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-1 text-[10px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="font-mono">Synced</span>
                      </div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {lead.ghlContactId || 'ghl_cnt_auto'}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-400 text-[11px] font-mono">
                      {formatDate(lead.createdAt, 'Recent')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Convert to Client File */}
                        <button
                          onClick={() => handleConvertToClient(lead)}
                          disabled={convertingId === lead.id}
                          title="Convert to active Client File & create primary funding deal"
                          className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors shadow-xs active:scale-95 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Convert</span>
                        </button>

                        <button
                          onClick={() => handleEdit(lead)}
                          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Lead"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(lead.id, `${lead.firstName} ${lead.lastName}`)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Delete Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {isEditModalOpen && (
        <LeadModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setLeadToEdit(null);
          }}
          leadToEdit={leadToEdit}
        />
      )}

      {/* Delete Lead Confirm Modal */}
      <ConfirmModal
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Lead: ${leadToDelete?.name || ''}`}
        message={`Are you sure you want to delete lead "${leadToDelete?.name || ''}"? This action cannot be undone.`}
        confirmText="Delete Lead"
        cancelText="Cancel"
        isLoading={isDeletingLead}
        type="danger"
      />
    </div>
  );
};
