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
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { FundingDeal, FundingProductType } from '../../types';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { ConfirmModal } from '../common/ConfirmModal';

interface FundingWorkspaceProps {
  setActiveTab: (tab: string) => void;
}

export const FundingWorkspace: React.FC<FundingWorkspaceProps> = ({ setActiveTab }) => {
  const { deals, clients, setSelectedClientId, deleteDeal, markDealCommissionReceived } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [stackedFilter, setStackedFilter] = useState('ALL');

  // Metrics
  const totalFundedVolume = deals
    .filter((d) => d.status === 'FUNDED')
    .reduce((sum, d) => sum + Number(d.fundingAmount), 0);

  const totalPipelineVolume = deals.reduce((sum, d) => sum + Number(d.fundingAmount), 0);

  const totalCommissions = deals.reduce(
    (sum, d) => sum + (Number(d.fundingAmount) * Number(d.percentage)) / 100,
    0
  );

  const [dealToDelete, setDealToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingDeal, setIsDeletingDeal] = useState(false);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const matchesSearch =
        searchQuery === '' ||
        deal.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.lenderName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProduct = productFilter === 'ALL' || deal.product === productFilter;
      const matchesStatus = statusFilter === 'ALL' || deal.status === statusFilter;
      const matchesStacked =
        stackedFilter === 'ALL' ||
        (stackedFilter === 'STACKED' && deal.isStacked) ||
        (stackedFilter === 'PRIMARY' && !deal.isStacked);

      return matchesSearch && matchesProduct && matchesStatus && matchesStacked;
    });
  }, [deals, searchQuery, productFilter, statusFilter, stackedFilter]);

  const handleOpenClientFile = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  const handleDeleteDeal = (dealId: string, dealName: string) => {
    setDealToDelete({ id: dealId, name: dealName });
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    setIsDeletingDeal(true);
    try {
      await deleteDeal(dealToDelete.id);
      setDealToDelete(null);
    } catch (err) {
      console.error('Delete deal failed:', err);
    } finally {
      setIsDeletingDeal(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-mono">
              Deal Stacking & Funding Capital Desk
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Total Positions: {deals.length}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-400" />
            Funding Deals & Multi-Product Stacking Registry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage individual and multi-tranche stacked funding positions (Revenue Funding, Personal Loans, HELOC, HEI, Term Loans, 0% Cards) per client.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block font-medium">Total Funded Volume</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${totalFundedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Capital active and disbursed</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block font-medium">Total Pipeline Deal Value</span>
          <div className="text-2xl font-bold text-slate-100 mt-2 font-mono">
            ${totalPipelineVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-400 mt-1">{deals.length} total deal structures</div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
          <span className="text-xs text-slate-400 block font-medium">Total Commission Value</span>
          <div className="text-2xl font-bold text-blue-400 mt-2 font-mono">
            ${totalCommissions.toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-400/80 mt-1">Combined fee & percentage points</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, clients, lenders..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Deal Stages</option>
            <option value="PROPOSED">Proposed</option>
            <option value="PRE_APPROVED">Pre-Approved</option>
            <option value="APPROVED">Approved</option>
            <option value="FUNDED">Funded</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>

        <div>
          <select
            value={stackedFilter}
            onChange={(e) => setStackedFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Positions</option>
            <option value="STACKED">Stacked Deals Only</option>
            <option value="PRIMARY">Primary Deals Only</option>
          </select>
        </div>
      </div>

      {/* Deals Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Client / Legal Business</th>
                <th className="py-3 px-3">Funding Product</th>
                <th className="py-3 px-3">Amount & Fee</th>
                <th className="py-3 px-3">Commission % Rate & Total</th>
                <th className="py-3 px-3">Term Length</th>
                <th className="py-3 px-3">Lender & Deal Status</th>
                <th className="py-3 px-3">Staff</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
              {filteredDeals.map((deal) => {
                const totalCommission = (deal.fundingAmount * deal.percentage) / 100;

                return (
                  <tr key={deal.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-sans">
                      <div className="font-bold text-slate-100 text-xs">
                        {deal.clientName}
                      </div>
                      <div className="text-[11px] text-slate-400">{deal.businessName}</div>
                      {deal.isStacked && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase font-mono">
                          Stacked Deal
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <ProductBadge product={deal.product} />
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-100 text-xs">
                        ${deal.fundingAmount.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">
                        Fee: ${deal.fee.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-blue-400">{deal.percentage}%</div>
                      <div className="text-[10px] text-slate-400 font-sans font-medium">
                        ${totalCommission.toLocaleString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-slate-400 font-sans">
                      {deal.termLength}
                    </td>

                    <td className="py-3.5 px-3">
                      <StatusBadge status={deal.status} size="sm" />
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        {deal.lenderName}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-sans text-slate-300">
                      {deal.assignedStaff}
                    </td>

                    <td className="py-3.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenClientFile(deal.clientId)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-blue-300 rounded-lg text-xs font-semibold transition-colors border border-slate-700"
                        >
                          View File
                        </button>
                        <button
                          onClick={() => handleDeleteDeal(deal.id, `${deal.clientName} - ${deal.product}`)}
                          className="p-1 text-slate-600 hover:text-rose-400"
                          title="Delete Deal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
