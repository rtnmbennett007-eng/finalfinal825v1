import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Clock,
  Filter,
  Layers,
  ExternalLink,
  AlertTriangle,
  Building2,
  DollarSign,
  Eye,
  RefreshCw,
  FileText,
  Check,
  X,
  ChevronRight,
  ListTodo,
  Calendar,
  User,
  Phone,
  Mail,
  Scale,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Client, PipelineStage, formatFundingRange } from '../../types';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

interface VerificationHubProps {
  setActiveTab: (tab: string) => void;
}

type VerificationFilterType = 'ALL' | 'NEEDS_CALL' | 'IN_PROGRESS' | 'FLAGGED' | 'VERIFIED';

export const VerificationHub: React.FC<VerificationHubProps> = ({ setActiveTab }) => {
  const { clients, setSelectedClientId, setSelectedClientTab, navigateToClientVerification, deals, refreshAll } = useData();
  const { currentUser, staffList } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationFilterType>('NEEDS_CALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [previewClient, setPreviewClient] = useState<Client | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Statistics calculation across dataset
  const stats = useMemo(() => {
    const total = clients.length;
    const verified = clients.filter((c) => c.isVerified).length;
    const needsCall = clients.filter((c) => !c.isVerified && c.currentStatus !== 'Lost' && c.currentStatus !== 'Not Qualified').length;
    const flagged = clients.filter((c) => !c.isVerified && (c.verificationSummary?.toLowerCase().includes('discrepancy') || c.verificationSummary?.toLowerCase().includes('conflict') || c.verificationSummary?.toLowerCase().includes('flag'))).length;
    const inProgress = clients.filter((c) => !c.isVerified && c.verificationSummary && !c.isVerified).length;

    return {
      total,
      verified,
      needsCall,
      flagged,
      inProgress,
    };
  }, [clients]);

  // Filtered clients list
  const filteredList = useMemo(() => {
    return clients.filter((c) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
        (c.businessName || '').toLowerCase().includes(query) ||
        (c.phone || '').includes(query) ||
        (c.email || '').toLowerCase().includes(query) ||
        (c.federalTaxId || '').includes(query) ||
        (c.id || '').toLowerCase().includes(query);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'NEEDS_CALL') {
        matchesStatus = !c.isVerified;
      } else if (statusFilter === 'VERIFIED') {
        matchesStatus = Boolean(c.isVerified);
      } else if (statusFilter === 'IN_PROGRESS') {
        matchesStatus = !c.isVerified && Boolean(c.verificationDate || c.verificationSummary);
      } else if (statusFilter === 'FLAGGED') {
        matchesStatus = !c.isVerified && Boolean(c.verificationSummary?.toLowerCase().includes('flag') || c.verificationSummary?.toLowerCase().includes('discrepancy'));
      }

      // Staff filter
      const matchesStaff = staffFilter === 'ALL' || c.assignedStaff === staffFilter;

      // Product filter
      const matchesProduct = productFilter === 'ALL' || c.requestedProduct === productFilter;

      return matchesSearch && matchesStatus && matchesStaff && matchesProduct;
    });
  }, [clients, searchQuery, statusFilter, staffFilter, productFilter]);

  // Launch the canonical Client Master 360 Verification workspace
  const handleLaunchVerificationWorkspace = (clientId: string) => {
    navigateToClientVerification(clientId);
    setActiveTab('clients');
  };

  // Launch Client Master 360 Overview
  const handleLaunchClientOverview = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedClientTab('overview');
    setActiveTab('clients');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Context Announcement */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 lg:p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full uppercase font-mono tracking-wider">
                Verification Monitoring & Queue Center
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-mono">
                Canonical Workspace: <strong className="text-blue-300">Client Master 360</strong>
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-100 mt-1.5 flex items-center gap-2.5">
              <FileCheck2 className="w-6 h-6 text-blue-400" />
              Verification Queue & Audit Operations
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Centralized monitoring desk for verification queue prioritization, call completion rates, and file audits. Select any record to execute live phone scripts, AI document cross-checks, and sign-offs directly inside the canonical Client Master 360 workspace.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-900/60 rounded-xl text-xs font-semibold transition"
              title="Refresh queue"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Queue'}</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStatusFilter('NEEDS_CALL')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'NEEDS_CALL'
                ? 'bg-amber-500/15 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                : 'bg-[#070e22] border-blue-900/40 hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Needs Call</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{stats.needsCall}</div>
            <span className="text-[10px] text-slate-400">Pending telephone verification</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_PROGRESS')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'IN_PROGRESS'
                ? 'bg-blue-500/15 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                : 'bg-[#070e22] border-blue-900/40 hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">In Progress</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{stats.inProgress}</div>
            <span className="text-[10px] text-slate-400">Active / partial worksheets</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('VERIFIED')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'VERIFIED'
                ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                : 'bg-[#070e22] border-blue-900/40 hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Fully Verified</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{stats.verified}</div>
            <span className="text-[10px] text-slate-400">Signed off & ready for UW</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-500/15 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                : 'bg-[#070e22] border-blue-900/40 hover:border-blue-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Total Pipeline</span>
              <Layers className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">{stats.total}</div>
            <span className="text-[10px] text-slate-400">All client records in system</span>
          </button>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search queue by client name, business, phone, email, EIN, or ID..."
            className="w-full bg-[#070e22] border border-blue-900/50 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-xl bg-[#070e22] p-1 border border-blue-900/50 text-xs">
            <button
              onClick={() => setStatusFilter('NEEDS_CALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === 'NEEDS_CALL' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Needs Call ({stats.needsCall})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === 'IN_PROGRESS' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === 'VERIFIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verified ({stats.verified})
            </button>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-slate-100 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({stats.total})
            </button>
          </div>

          {/* Staff Filter */}
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-[#070e22] border border-blue-900/50 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Staff / Verifiers</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex rounded-xl bg-[#070e22] p-1 border border-blue-900/50 text-xs shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Table View"
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Card Grid View"
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* Main Queue Content */}
      {filteredList.length === 0 ? (
        <div className="bg-[#0b1528] border border-blue-900/60 p-16 rounded-2xl text-center space-y-3">
          <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No verification files found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No client records match your search or active filter criteria. Clear filters or search for another file.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
              setStaffFilter('ALL');
              setProductFilter('ALL');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-900/50 bg-[#070e22]/80 text-slate-400 uppercase font-mono text-[10px]">
                  <th className="py-3 px-4 font-semibold">Client / Business</th>
                  <th className="py-3 px-4 font-semibold">Contact & Location</th>
                  <th className="py-3 px-4 font-semibold">Pipeline Stage & Product</th>
                  <th className="py-3 px-4 font-semibold">Verification Status</th>
                  <th className="py-3 px-4 font-semibold">Verifier / Last Log</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30">
                {filteredList.map((client) => {
                  const clientDeals = deals.filter((d) => d.clientId === client.id);
                  const activeDeal = clientDeals[0];

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-blue-950/20 transition-colors group cursor-pointer"
                      onClick={() => handleLaunchVerificationWorkspace(client.id)}
                    >
                      {/* Client / Business */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                          <span>{client.firstName} {client.lastName}</span>
                        </div>
                        <div className="text-[11px] text-blue-400 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span>{client.businessName || 'Business Name Pending'}</span>
                        </div>
                        {client.federalTaxId && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            EIN: {client.federalTaxId}
                          </div>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-300 font-mono text-[11px] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{client.phone || 'No phone'}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[180px] flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{client.email || 'No email'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {client.city || client.state ? `${client.city ? client.city + ', ' : ''}${client.state || ''}` : 'Location N/A'}
                        </div>
                      </td>

                      {/* Pipeline Stage & Product */}
                      <td className="py-3.5 px-4 space-y-1">
                        <StatusBadge status={client.currentStatus} />
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <ProductBadge product={client.requestedProduct || 'Revenue Funding'} />
                          <span className="text-[10px] font-mono text-amber-300 font-bold">
                            {formatFundingRange(
                              client.requestedFundingMin ?? client.requestedAmountMin,
                              client.requestedFundingMax ?? client.requestedAmountMax,
                              client.requestedFundingRange ?? client.requestedAmount
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {client.isVerified ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Verified & Signed Off</span>
                            </span>
                            {client.verificationDate && (
                              <div className="text-[10px] text-slate-400 font-mono">
                                Date: {formatDate(client.verificationDate)}
                              </div>
                            )}
                          </div>
                        ) : client.verificationSummary ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-bold">
                              <Clock className="w-3.5 h-3.5 text-blue-400" />
                              <span>In Progress / Needs Follow-up</span>
                            </span>
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px] italic">
                              "{client.verificationSummary}"
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                              <span>Needs Verification Call</span>
                            </span>
                            <div className="text-[10px] text-slate-500">
                              Ready for opening script
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Verifier / Specialist */}
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="text-slate-200 text-[11px] font-medium flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{client.verifiedBy || client.assignedStaff || 'Unassigned'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Updated: {formatDate(client.updatedAt || client.createdAt)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setPreviewClient(client)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 rounded-lg transition"
                            title="Quick Snapshot"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleLaunchVerificationWorkspace(client.id)}
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer whitespace-nowrap"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                            <span>{client.isVerified ? 'Open Verification' : 'Start Verification'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((client) => {
            return (
              <div
                key={client.id}
                className="bg-[#0b1528] border border-blue-900/60 hover:border-blue-600/60 p-5 rounded-2xl space-y-4 transition-all flex flex-col justify-between shadow-lg group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">
                      Stage: {client.currentStatus}
                    </span>
                    {client.isVerified ? (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" /> Needs Phone Call
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                      {client.firstName} {client.lastName}
                    </h3>
                    <div className="text-xs text-blue-400 font-semibold mt-0.5">
                      {client.businessName || 'Business Name Pending'}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 bg-[#070e22] p-3 rounded-xl border border-blue-900/40">
                    <div className="flex items-center justify-between">
                      <span>Phone:</span>
                      <strong className="text-slate-200 font-mono">{client.phone || 'N/A'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Product:</span>
                      <strong className="text-blue-300">{client.requestedProduct || 'Revenue Funding'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Requested:</span>
                      <strong className="text-amber-300 font-mono text-xs">
                        {formatFundingRange(
                          client.requestedFundingMin ?? client.requestedAmountMin,
                          client.requestedFundingMax ?? client.requestedAmountMax,
                          client.requestedFundingRange ?? client.requestedAmount
                        )}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Revenue:</span>
                      <strong className="text-slate-200 font-mono">
                        ${client.annualRevenue ? client.annualRevenue.toLocaleString() : '0'}
                      </strong>
                    </div>
                  </div>

                  {client.verificationSummary && (
                    <div className="text-[11px] text-slate-400 italic p-2.5 rounded-lg bg-[#070e22] border border-blue-900/30 leading-relaxed">
                      "{client.verificationSummary}"
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-blue-900/40 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    Assigned: {client.assignedStaff || 'Unassigned'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleLaunchVerificationWorkspace(client.id)}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{client.isVerified ? 'Open Worksheet' : 'Start Call'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK PREVIEW SNAPSHOT MODAL */}
      {previewClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-blue-900/50 flex items-center justify-between bg-[#070e22]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Verification File: {previewClient.firstName} {previewClient.lastName}
                  </h3>
                  <p className="text-[11px] text-slate-400">{previewClient.businessName}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewClient(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-[#070e22] p-3.5 rounded-xl border border-blue-900/40">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Current Status</span>
                  <div className="font-bold text-slate-200 mt-0.5">{previewClient.currentStatus}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Verification Status</span>
                  <div className="mt-0.5">
                    {previewClient.isVerified ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Needs Call
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Direct Phone</span>
                  <div className="font-bold text-slate-200 mt-0.5">{previewClient.phone || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">Email Address</span>
                  <div className="font-bold text-slate-200 mt-0.5">{previewClient.email || 'N/A'}</div>
                </div>
              </div>

              {previewClient.verificationSummary && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Verification Specialist Call Summary
                  </span>
                  <div className="p-3 bg-[#070e22] border border-blue-900/40 rounded-xl text-slate-300 leading-relaxed italic">
                    "{previewClient.verificationSummary}"
                  </div>
                </div>
              )}

              <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
                  Canonical Workspace Directive
                </span>
                <p className="text-[11px] text-slate-400">
                  All 16 verification sections (Identity, Business, Revenue, Bank Statements, Debts, and Final Sign-Off) execute seamlessly within the canonical Client Master 360 file.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-blue-900/50 bg-[#070e22] flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  handleLaunchClientOverview(previewClient.id);
                  setPreviewClient(null);
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                View 360 Overview
              </button>

              <button
                type="button"
                onClick={() => {
                  handleLaunchVerificationWorkspace(previewClient.id);
                  setPreviewClient(null);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-blue-600/20"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Launch Full Verification Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
