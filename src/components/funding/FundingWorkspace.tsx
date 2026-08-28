import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Layers,
  Search,
  Plus,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Filter,
  Trash2,
  LayoutGrid,
  List,
  FolderOpen,
  Copy,
  ExternalLink,
  Edit2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { FundingDeal, FundingProductType, CANONICAL_DEAL_STATUSES } from '../../types';
import { StatusBadge, ProductBadge, DealStatusBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';
import { DealDetailModal } from './DealDetailModal';
import { NewDealModal } from './NewDealModal';
import { DealsKanbanBoard } from './DealsKanbanBoard';
import { formatDate } from '../../utils/dateUtils';
import { calculateDealCommission } from '../../utils/commissionCalculator';

interface FundingWorkspaceProps {
  setActiveTab: (tab: string) => void;
}

export const FundingWorkspace: React.FC<FundingWorkspaceProps> = ({ setActiveTab }) => {
  const {
    deals,
    clients,
    setSelectedClientId,
    deleteDeal,
    duplicateDeal,
    updateDealStatus,
    addToast,
  } = useData();

  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'grouped'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stackedFilter, setStackedFilter] = useState('ALL');

  // Modals
  const [selectedDealForDetail, setSelectedDealForDetail] = useState<FundingDeal | null>(null);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);

  // Metrics
  const totalFundedVolume = deals
    .filter((d) => (d.status || '').toUpperCase() === 'FUNDED')
    .reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  const totalPipelineVolume = deals
    .filter((d) => !['DECLINED', 'CANCELLED', 'INACTIVE'].includes((d.status || '').toUpperCase()))
    .reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  const totalCommissions = deals.reduce((sum, d) => {
    const calc = calculateDealCommission(d);
    return sum + calc.totalCommission;
  }, 0);

  const fundedCount = deals.filter((d) => (d.status || '').toUpperCase() === 'FUNDED').length;

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        deal.clientName?.toLowerCase().includes(q) ||
        deal.businessName?.toLowerCase().includes(q) ||
        deal.lenderName?.toLowerCase().includes(q) ||
        deal.funder?.toLowerCase().includes(q) ||
        deal.dealId?.toLowerCase().includes(q) ||
        deal.id?.toLowerCase().includes(q);

      const matchesProduct = productFilter === 'ALL' || deal.product === productFilter;
      const matchesStatus = statusFilter === 'ALL' || (deal.status || '').toUpperCase() === statusFilter.toUpperCase();
      const matchesStacked =
        stackedFilter === 'ALL' ||
        (stackedFilter === 'STACKED' && deal.isStacked) ||
        (stackedFilter === 'PRIMARY' && !deal.isStacked);

      return matchesSearch && matchesProduct && matchesStatus && matchesStacked;
    });
  }, [deals, searchQuery, productFilter, statusFilter, stackedFilter]);

  // Grouped by client for Stacked View
  const dealsByClient = useMemo(() => {
    const groups: { [clientId: string]: { clientName: string; businessName: string; deals: FundingDeal[] } } = {};
    for (const d of filteredDeals) {
      const cId = d.clientId || 'unknown';
      if (!groups[cId]) {
        groups[cId] = {
          clientName: d.clientName || 'Client',
          businessName: d.businessName || 'Business',
          deals: [],
        };
      }
      groups[cId].deals.push(d);
    }
    return groups;
  }, [filteredDeals]);

  const handleOpenClientFile = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    setIsDeletingDeal(true);
    try {
      await deleteDeal(dealToDelete.id);
      addToast('success', 'Deal Removed', 'The deal position has been removed.');
      setDealToDelete(null);
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete deal');
    } finally {
      setIsDeletingDeal(false);
    }
  };

  const handleQuickAdvance = async (deal: FundingDeal, newStatus: string) => {
    try {
      await updateDealStatus(deal.id, newStatus);
      addToast('success', 'Status Updated', `Deal moved to ${newStatus}`);
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err.message);
    }
  };

  const handleCloneDeal = async (deal: FundingDeal) => {
    try {
      const cloned = await duplicateDeal(deal.id);
      addToast('success', 'Deal Cloned', `Cloned as new stack position ${cloned.dealId || cloned.id}.`);
    } catch (err: any) {
      addToast('error', 'Clone Failed', err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded uppercase font-mono">
              Deal Management System
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Independent Deal Records: {deals.length}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Funding Deals & Multi-Product Stacking Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-lifecycle deal desk: manage individual and stacked positions (Revenue Funding, SBA, Personal Loans, HELOC, HEI, 0% Cards) per client.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center bg-[#070d18] border border-blue-900/60 rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'kanban' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                viewMode === 'grouped' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Client Stacks</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsNewDealOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create Funding Deal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-semibold">Total Funded Volume</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            ${totalFundedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{fundedCount} positions funded</div>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-semibold">Active Pipeline Volume</span>
          <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
            ${totalPipelineVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-400 mt-1">{deals.length} total deal structures</div>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-semibold">Gross Est. Commission Pool</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
            ${Math.round(totalCommissions).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Combined fee & points revenue</div>
        </div>

        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <span className="text-xs text-slate-400 block font-semibold">Avg Position Size</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1 font-mono">
            ${deals.length > 0 ? Math.round(totalPipelineVolume / deals.length).toLocaleString() : '0'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across all capital desks</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deal ID, client, funder..."
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Funding Products</option>
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Deal Stages</option>
            {CANONICAL_DEAL_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={stackedFilter}
            onChange={(e) => setStackedFilter(e.target.value)}
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="ALL">All Positions</option>
            <option value="STACKED">Stacked Deals (2nd+ Pos)</option>
            <option value="PRIMARY">Primary Deals Only</option>
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'kanban' ? (
        <DealsKanbanBoard
          deals={filteredDeals}
          onSelectDeal={(deal) => setSelectedDealForDetail(deal)}
          onAdvanceStatus={handleQuickAdvance}
          onCreateDeal={() => setIsNewDealOpen(true)}
        />
      ) : viewMode === 'grouped' ? (
        /* Client Stacks Grouped View */
        <div className="space-y-4">
          {Object.keys(dealsByClient).length === 0 ? (
            <div className="p-8 text-center bg-[#0b1528] rounded-2xl border border-blue-900/50 text-slate-400">
              No matching deal stacks found.
            </div>
          ) : (
            Object.entries(dealsByClient).map(([clientId, group]) => {
              const clientTotal = group.deals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);
              const clientComm = group.deals.reduce((sum, d) => {
                const calc = calculateDealCommission(d);
                return sum + calc.totalCommission;
              }, 0);

              return (
                <div key={clientId} className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900/40 pb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-100 text-sm">{group.businessName}</h3>
                        <span className="text-xs text-slate-400">({group.clientName})</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/50 text-blue-300 font-bold">
                          {group.deals.length} {group.deals.length === 1 ? 'Position' : 'Stacked Positions'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        Total Stacked: <strong className="text-emerald-400 font-mono">${clientTotal.toLocaleString()}</strong> • Gross Comm: <strong className="text-amber-400 font-mono">${Math.round(clientComm).toLocaleString()}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenClientFile(clientId)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Master 360</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {group.deals.map((deal, idx) => (
                      <div
                        key={deal.id}
                        onClick={() => setSelectedDealForDetail(deal)}
                        className="p-3 bg-[#070d18] border border-blue-900/50 hover:border-amber-400/60 rounded-xl cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-amber-400">
                            {deal.dealId || `DEAL-${idx + 1}`}
                          </span>
                          <DealStatusBadge status={deal.status} />
                        </div>
                        <div className="flex items-center justify-between">
                          <ProductBadge product={deal.product} />
                          <span className="font-mono font-bold text-emerald-400 text-sm">
                            ${Number(deal.fundingAmount || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-blue-900/30">
                          <span className="truncate">{deal.lenderName || 'Lender Desk'}</span>
                          <span className="text-blue-300 font-mono">{deal.position || `${idx + 1}st Pos`}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070d18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-blue-900/60">
                <tr>
                  <th className="py-3 px-4">Deal ID</th>
                  <th className="py-3 px-4">Client / Legal Business</th>
                  <th className="py-3 px-3">Funding Product</th>
                  <th className="py-3 px-3">Position</th>
                  <th className="py-3 px-3">Amount & Fee</th>
                  <th className="py-3 px-3">Commission Points & Total</th>
                  <th className="py-3 px-3">Term</th>
                  <th className="py-3 px-3">Funder & Stage</th>
                  <th className="py-3 px-3">Staff</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/40 font-mono text-[11px]">
                {filteredDeals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500 font-sans">
                      No funding deals match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDeals.map((deal) => {
                    const calc = calculateDealCommission(deal);
                    const amount = Number(deal.fundingAmount || deal.approvedAmount || deal.requestedAmount || 0);

                    return (
                      <tr
                        key={deal.id}
                        className="hover:bg-blue-950/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedDealForDetail(deal)}
                      >
                        <td className="py-3.5 px-4 font-bold text-amber-400">
                          {deal.dealId || deal.id.slice(0, 10)}
                        </td>

                        <td className="py-3.5 px-4 font-sans">
                          <div className="font-bold text-slate-100 text-xs">
                            {deal.businessName || deal.clientName}
                          </div>
                          <div className="text-[11px] text-slate-400">{deal.clientName}</div>
                        </td>

                        <td className="py-3.5 px-3 font-sans">
                          <ProductBadge product={deal.product} />
                        </td>

                        <td className="py-3.5 px-3 font-sans">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800">
                            {deal.position || (deal.isStacked ? 'Stacked' : '1st Pos')}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-bold text-emerald-400 text-xs">
                            ${amount.toLocaleString()}
                          </div>
                          {deal.fee ? (
                            <div className="text-[10px] text-slate-500 font-sans">
                              Fee: ${Number(deal.fee).toLocaleString()}
                            </div>
                          ) : null}
                        </td>

                        <td className="py-3.5 px-3 font-sans">
                          <div className="font-bold text-amber-400 font-mono">
                            {calc.hasCommission ? calc.formattedTotalCommission : '$0'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {deal.percentage || 0}% points
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-slate-300 font-sans">
                          {deal.termLength || '12 Months'}
                        </td>

                        <td className="py-3.5 px-3 font-sans">
                          <DealStatusBadge status={deal.status} />
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate max-w-[120px]">
                            {deal.lenderName || deal.funder || 'Lender Desk'}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-sans text-slate-300">
                          {deal.assignedRep || deal.assignedStaff || 'Dana'}
                        </td>

                        <td className="py-3.5 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDealForDetail(deal)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-900 rounded-lg transition-colors"
                              title="Edit & View Deal"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCloneDeal(deal)}
                              className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-900 rounded-lg transition-colors"
                              title="Clone Deal into Stack Position"
                            >
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setDealToDelete({
                                  id: deal.id,
                                  name: `${deal.dealId || deal.id} - ${deal.lenderName || deal.product}`,
                                })
                              }
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                              title="Delete Deal"
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

      {/* Deal Detail Modal */}
      {selectedDealForDetail && (
        <DealDetailModal
          deal={selectedDealForDetail}
          isOpen={!!selectedDealForDetail}
          onClose={() => setSelectedDealForDetail(null)}
          onNavigateToClient={handleOpenClientFile}
        />
      )}

      {/* New Deal Modal */}
      {isNewDealOpen && (
        <NewDealModal
          isOpen={isNewDealOpen}
          onClose={() => setIsNewDealOpen(false)}
          onDealCreated={(newDeal) => {
            setSelectedDealForDetail(newDeal);
          }}
        />
      )}

      {/* Delete Deal Confirm Modal */}
      <ConfirmModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Funding Deal"
        message={`Are you sure you want to delete the deal position "${dealToDelete?.name || ''}"?\n\nThis will also remove all associated commission distribution splits.`}
        confirmText="Delete Deal"
        cancelText="Cancel"
        isLoading={isDeletingDeal}
        type="danger"
      />
    </div>
  );
};
