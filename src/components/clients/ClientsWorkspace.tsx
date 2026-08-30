import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  DollarSign,
  Scale,
  Trash2,
  Edit2,
  Filter,
  LayoutList,
  Kanban,
  Layers,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Client, PipelineStage, CANONICAL_PIPELINE_STAGES, normalizePipelineStage } from '../../types';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { SsnViewer } from '../common/SsnViewer';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { ConfirmModal } from '../common/ConfirmModal';
import { ClientDetailView } from './ClientDetailView';
import { NewClientModal } from './NewClientModal';
import { ClientsKanbanView } from './ClientsKanbanView';
import { UploadApplicationModal } from './UploadApplicationModal';
import { FileText } from 'lucide-react';

interface ClientsWorkspaceProps {
  onOpenNewClientModal: () => void;
  isNewClientModalOpen: boolean;
  setIsNewClientModalOpen: (open: boolean) => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ClientsWorkspace: React.FC<ClientsWorkspaceProps> = ({
  onOpenNewClientModal,
  isNewClientModalOpen,
  setIsNewClientModalOpen,
  onNavigateToTab,
}) => {
  const {
    clients,
    deals,
    tasks,
    selectedClientId,
    setSelectedClientId,
    selectedClientTab,
    setSelectedClientTab,
    deleteClient,
    leadSources,
    referralPartners,
  } = useData();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [isUploadAppModalOpen, setIsUploadAppModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        searchQuery === '' ||
        (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery) ||
        c.federalTaxId?.includes(searchQuery);

      const canonicalStage = normalizePipelineStage(c.currentStatus);
      const matchesStatus =
        statusFilter === 'ALL' ||
        c.currentStatus === statusFilter ||
        canonicalStage === statusFilter;

      const matchesSource = sourceFilter === 'ALL' || c.leadSource === sourceFilter;
      const matchesVerif =
        verificationFilter === 'ALL' ||
        (verificationFilter === 'VERIFIED' && c.isVerified) ||
        (verificationFilter === 'PENDING' && !c.isVerified);

      return matchesSearch && matchesStatus && matchesSource && matchesVerif;
    });
  }, [clients, searchQuery, statusFilter, sourceFilter, verificationFilter]);

  // If a client is selected, show the comprehensive 360 Client File
  if (selectedClientId) {
    return (
      <ErrorBoundary
        fallbackTitle="Error Loading Client 360 File"
        onReset={() => {
          setSelectedClientId(null);
          setSelectedClientTab(null);
        }}
      >
        <ClientDetailView
          clientId={selectedClientId}
          initialTab={selectedClientTab || 'overview'}
          onBack={() => {
            setSelectedClientId(null);
            setSelectedClientTab(null);
          }}
          onNavigateToTab={onNavigateToTab}
        />
      </ErrorBoundary>
    );
  }

  const handleDeleteClient = (c: Client, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientToDelete(c);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClient(clientToDelete.id);
      setClientToDelete(null);
    } catch (err) {
      console.error('Failed to delete client:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Workspace Header & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-mono">
              Client Master 360
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Total Client Files: {clients.length}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            Client Directory & Operational Records
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Access complete 360-degree client files: Personal Identity, SSN Vault, Business Entity, Underwriting, Deals Stacking, and Commission distributions.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Pipeline / Kanban View</span>
            </button>
          </div>

          <button
            onClick={() => setIsUploadAppModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 border border-emerald-500/30"
          >
            <FileText className="w-4 h-4" />
            <span>📄 Upload Business Loan Application</span>
          </button>

          <button
            onClick={onOpenNewClientModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Client File</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, company, EIN, SSN..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-medium"
          >
            <option value="ALL">All Pipeline Stages ({filteredClients.length})</option>
            {CANONICAL_PIPELINE_STAGES.map((st, i) => (
              <option key={st} value={st}>
                {i + 1}. {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Verification States</option>
            <option value="VERIFIED">Verified Files Only</option>
            <option value="PENDING">Pending Verification</option>
          </select>
        </div>

        <div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Sources & Partners</option>
            {leadSources.map((s) => (
              <option key={s.id} value={s.name}>Source: {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional View: List View vs Pipeline / Kanban View */}
      {viewMode === 'kanban' ? (
        <ClientsKanbanView
          clients={filteredClients}
          deals={deals}
          tasks={tasks}
          onSelectClient={setSelectedClientId}
          statusFilter={statusFilter}
        />
      ) : (
        /* Clients Master Table */
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Client Name & Business</th>
                  <th className="py-3 px-3">Revenue & Tax ID</th>
                  <th className="py-3 px-3">SSN Vault</th>
                  <th className="py-3 px-3">Verification</th>
                  <th className="py-3 px-3">Active Deals & Volume</th>
                  <th className="py-3 px-3">Pipeline Stage</th>
                  <th className="py-3 px-3">Staff Assignment</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No client files found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const clientDeals = deals.filter((d) => d.clientId === client.id);
                    const totalVolume = clientDeals.reduce((sum, d) => sum + Number(d.fundingAmount), 0);

                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                            <span>{client.firstName} {client.lastName}</span>
                          </div>
                          <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
                            {client.businessName}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>{client.email}</span>
                            <span>•</span>
                            <span>{client.phone}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-emerald-400 font-mono text-xs">
                            ${client.annualRevenue?.toLocaleString()} /yr
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            EIN: {client.federalTaxId || 'Pending'}
                          </div>
                          <div className="text-[9px] text-slate-500">
                            {client.stateOfIncorporation} • {client.ownershipPercentage}% Owner
                          </div>
                        </td>

                        <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <SsnViewer ssn={client.ssn} clientId={client.id} />
                        </td>

                        <td className="py-3.5 px-3">
                          {client.isVerified ? (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-blue-400" /> Verified
                              </span>
                              <div className="text-[9px] text-slate-500 mt-0.5">by {client.verifiedBy}</div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              <AlertCircle className="w-3 h-3 text-amber-400" /> Pending Call
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-100 font-mono text-xs">
                            ${totalVolume.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {clientDeals.length} {clientDeals.length === 1 ? 'Deal' : 'Deals Stacked'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <StatusBadge status={client.currentStatus} size="sm" />
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="text-slate-200 font-medium text-xs">{client.assignedStaff}</div>
                          <div className="text-[10px] text-slate-500">Sales: {client.assignedSalesRep}</div>
                        </td>

                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedClientId(client.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-1"
                            >
                              <span>Open 360 File</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            <button
                              onClick={(e) => handleDeleteClient(client, e)}
                              className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                              title="Delete Client File"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Client Modal */}
      {isNewClientModalOpen && (
        <NewClientModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={(created) => setSelectedClientId(created.id)}
        />
      )}

      {/* Upload Business Loan Application Modal */}
      {isUploadAppModalOpen && (
        <UploadApplicationModal
          isOpen={isUploadAppModalOpen}
          onClose={() => setIsUploadAppModalOpen(false)}
          onClientCreated={(created) => setSelectedClientId(created.id)}
        />
      )}

      {/* Delete Client Confirm Modal */}
      <ConfirmModal
        isOpen={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={`Delete Client: ${clientToDelete?.firstName || ''} ${clientToDelete?.lastName || ''}`}
        message={`Are you sure you want to permanently delete the complete client file for ${clientToDelete?.firstName || ''} ${clientToDelete?.lastName || ''} (${clientToDelete?.businessName || 'Business'})?\n\nThis will permanently delete their 360 profile, all associated stacked deals, underwriting records, documents, tasks, and Master Verification worksheets.`}
        confirmText="Delete Client File"
        cancelText="Keep Client"
        isLoading={isDeleting}
        type="danger"
      />
    </div>
  );
};
