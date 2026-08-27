import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  Percent,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileCheck,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  Briefcase,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Client, FundingDeal, FundingProductType, LenderHistoryRecord } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { StatusBadge, ProductBadge } from '../../common/StatusBadge';
import { ConfirmModal } from '../../common/ConfirmModal';
import { ProductSelect } from '../../common/ProductSelect';
import { formatDate } from '../../../utils/dateUtils';
import { calculateDealCommission } from '../../../utils/commissionCalculator';

interface FundingDealsTabProps {
  client: Client;
  deals?: FundingDeal[];
  lenderHistory?: LenderHistoryRecord[];
  onRefresh: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const FUNDING_PRODUCTS: FundingProductType[] = [
  'Revenue Funding',
  'Personal Term Loan',
  'Business Line of Credit',
  'Business Term Loan',
  '0% Business Credit Cards',
  '0% Business Cards & Lines of Credit',
  'Equipment Financing & Leasing',
  'SBA 7(a) Loan',
  'SBA Express Loan',
  'SBA 504 Loan',
  'HELOC',
  'Home Equity Line of Credit (HELOC)',
  'HEI',
  'Home Equity Investment (HEI)',
  'Accounts Receivable / Invoice Factoring',
  'Merchant Cash Advance (MCA)',
  'Other / Custom Product',
  'Other Valid Product',
];

const DEAL_STATUS_OPTIONS: { value: FundingDeal['status']; label: string; description: string }[] = [
  { value: 'PROPOSED', label: 'Proposed', description: 'Initial deal structure under Maple X review' },
  { value: 'SUBMITTED', label: 'Submitted', description: 'Application & stips sent to lender desk' },
  { value: 'PRE_APPROVED', label: 'Pre-Approved', description: 'Lender issued initial pre-qualification offer' },
  { value: 'APPROVED', label: 'Approved', description: 'Full formal approval issued by lender' },
  { value: 'CONDITIONS_MET', label: 'Conditions Met', description: 'All prior-to-funding stipulations cleared' },
  { value: 'FUNDED', label: 'Funded', description: 'Capital disbursed & active' },
  { value: 'DECLINED', label: 'Declined', description: 'Lender declined this specific position' },
  { value: 'WITHDRAWN', label: 'Withdrawn', description: 'Client or desk chose not to execute' },
];

export const FundingDealsTab: React.FC<FundingDealsTabProps> = ({
  client,
  deals = [],
  lenderHistory = [],
  onRefresh,
  onNavigateToTab,
}) => {
  const { createDeal, updateDeal, deleteDeal, addToast } = useData();
  const { currentUser } = useAuth();

  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeLenderHistory = Array.isArray(lenderHistory) ? lenderHistory : [];

  // View & Filter States
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal States
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [dealToDelete, setDealToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick "Mark as Funded" Modal State
  const [fundingQuickDeal, setFundingQuickDeal] = useState<FundingDeal | null>(null);
  const [quickFundingDate, setQuickFundingDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Form State
  const [dealForm, setDealForm] = useState<Partial<FundingDeal>>({
    product: client.requestedProduct || 'Revenue Funding',
    otherProductType: '',
    fundingAmount: client.requestedAmount || 0,
    fee: undefined,
    percentage: undefined,
    termLength: '12 Months',
    status: 'PROPOSED',
    assignedStaff: client.assignedStaff || currentUser?.name || 'Staff',
    lenderStatus: 'SUBMITTED',
    lenderName: '',
    lenderContact: '',
    fundingDate: '',
    commissionStatus: 'PENDING',
    notes: '',
    isStacked: safeDeals.length > 0,
  });

  // Calculate Aggregated Metrics with Zero Double-Counting
  const requestedAmount = Number(client.requestedAmount) || 0;

  const totalSubmittedVolume = safeLenderHistory
    .filter((h) => h.status === 'Sent' || h.status === 'Under Review' || h.status === 'Pre-Approved' || h.status === 'Approved')
    .reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

  const totalPreQualifiedVolume = safeDeals
    .filter((d) => d.status === 'PRE_APPROVED')
    .reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  const totalApprovedVolume = safeDeals
    .filter((d) => d.status === 'APPROVED' || d.status === 'CONDITIONS_MET')
    .reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  const totalFundedVolume = safeDeals
    .filter((d) => d.status === 'FUNDED')
    .reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

  const totalFundedDealsCount = safeDeals.filter((d) => d.status === 'FUNDED').length;
  const totalApprovedDealsCount = safeDeals.filter((d) => d.status === 'APPROVED' || d.status === 'CONDITIONS_MET').length;

  const totalEstimatedCommission = safeDeals.reduce((sum, d) => {
    const calc = calculateDealCommission(d);
    return sum + calc.totalCommission;
  }, 0);

  const totalFundedCommission = safeDeals
    .filter((d) => d.status === 'FUNDED')
    .reduce((sum, d) => {
      const calc = calculateDealCommission(d);
      return sum + calc.totalCommission;
    }, 0);

  // Available unstacked lender offers from Lender History
  const availableLenderOffers = useMemo(() => {
    return safeLenderHistory.filter(
      (lh) =>
        (lh.status === 'Pre-Approved' || lh.status === 'Approved') &&
        !safeDeals.some(
          (d) =>
            d.lenderName?.toLowerCase().trim() === lh.lenderName?.toLowerCase().trim() &&
            Number(d.fundingAmount) === Number(lh.amount)
        )
    );
  }, [safeLenderHistory, safeDeals]);

  // Filtered Deals
  const filteredDeals = useMemo(() => {
    if (statusFilter === 'ALL') return safeDeals;
    return safeDeals.filter((d) => d.status === statusFilter);
  }, [safeDeals, statusFilter]);

  // Open Modal to Add New Deal
  const handleOpenAddDeal = (preset?: Partial<FundingDeal>) => {
    setEditingDealId(null);
    setDealForm({
      product: preset?.product || client.requestedProduct || 'Revenue Funding',
      otherProductType: preset?.otherProductType || '',
      fundingAmount: preset?.fundingAmount || client.requestedAmount || 0,
      fee: preset?.fee,
      percentage: preset?.percentage,
      termLength: preset?.termLength || '12 Months',
      status: preset?.status || 'PROPOSED',
      assignedStaff: client.assignedStaff || currentUser?.name || 'Staff',
      lenderStatus: preset?.lenderStatus || 'SUBMITTED',
      lenderName: preset?.lenderName || '',
      lenderContact: preset?.lenderContact || '',
      fundingDate: preset?.fundingDate || '',
      commissionStatus: 'PENDING',
      notes: preset?.notes || '',
      isStacked: safeDeals.length > 0,
    });
    setShowDealModal(true);
  };

  // Open Modal to Edit Deal
  const handleOpenEditDeal = (deal: FundingDeal) => {
    setEditingDealId(deal.id);
    setDealForm({
      ...deal,
    });
    setShowDealModal(true);
  };

  // Import from Lender Submission / Offer
  const handleImportLenderOffer = (offer: LenderHistoryRecord) => {
    handleOpenAddDeal({
      lenderName: offer.lenderName,
      product: offer.fundingProduct as FundingProductType,
      fundingAmount: Number(offer.amount) || 50000,
      status: offer.status === 'Approved' ? 'APPROVED' : 'PRE_APPROVED',
      lenderStatus: offer.status === 'Approved' ? 'APPROVED' : 'PRE_APPROVED',
      termLength: offer.terms || '24 Months',
      notes: `Imported from Lender Submission. Conditions: ${offer.conditions || 'None'}. Notes: ${offer.lenderNotes || 'None'}`,
    });
  };

  // Save Deal (Create or Update)
  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealForm.lenderName?.trim()) {
      addToast('error', 'Validation Error', 'Lender Name is required.');
      return;
    }
    if (!dealForm.fundingAmount || Number(dealForm.fundingAmount) <= 0) {
      addToast('error', 'Validation Error', 'Funding Amount must be greater than $0.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingDealId) {
        await updateDeal(editingDealId, {
          ...dealForm,
          fundingAmount: Number(dealForm.fundingAmount),
          fee: Number(dealForm.fee || 0),
          percentage: Number(dealForm.percentage || 0),
        });
        addToast(
          'success',
          'Funding Deal Updated',
          `Tranche with ${dealForm.lenderName} ($${Number(dealForm.fundingAmount).toLocaleString()}) updated successfully.`
        );
      } else {
        await createDeal({
          ...dealForm,
          clientId: client.id,
          clientName: `${client.firstName} ${client.lastName}`,
          businessName: client.businessName,
          fundingAmount: Number(dealForm.fundingAmount),
          fee: Number(dealForm.fee || 0),
          percentage: Number(dealForm.percentage || 0),
          isStacked: safeDeals.length > 0,
        });
        addToast(
          'success',
          'Funding Position Added',
          `New ${dealForm.product} tranche ($${Number(dealForm.fundingAmount).toLocaleString()}) added to client stack.`
        );
      }

      setShowDealModal(false);
      setEditingDealId(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message || 'Could not save deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Status Advance
  const handleQuickAdvanceStatus = async (deal: FundingDeal, newStatus: FundingDeal['status']) => {
    try {
      const updates: Partial<FundingDeal> = { status: newStatus };
      if (newStatus === 'FUNDED' && !deal.fundingDate) {
        updates.fundingDate = new Date().toISOString().split('T')[0];
      }
      await updateDeal(deal.id, updates);
      addToast(
        'success',
        'Deal Status Updated',
        `${deal.lenderName} (${deal.product}) advanced to ${newStatus}.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Status Update Failed', err.message);
    }
  };

  // Confirm Quick Funded Date
  const handleConfirmQuickFunded = async () => {
    if (!fundingQuickDeal) return;
    try {
      await updateDeal(fundingQuickDeal.id, {
        status: 'FUNDED',
        fundingDate: quickFundingDate || new Date().toISOString().split('T')[0],
      });
      addToast(
        'success',
        'Tranche Marked as Funded',
        `Deal with ${fundingQuickDeal.lenderName} marked Funded on ${formatDate(quickFundingDate)}.`
      );
      setFundingQuickDeal(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message);
    }
  };

  // Confirm Delete
  const handleConfirmDeleteDeal = async () => {
    if (!dealToDelete) return;
    try {
      await deleteDeal(dealToDelete.id);
      addToast('success', 'Deal Removed', `Funding position "${dealToDelete.title}" deleted from stack.`);
      setDealToDelete(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Client Funding Request Summary Banner */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-900/50 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                  Client Funding Goal
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-semibold">{client.businessName}</span>
              </div>
              <h2 className="text-base font-bold text-slate-100 mt-0.5">
                Client Request & Multi-Lender Stacking Architecture
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('application')}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 transition-colors flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Client Request in Application</span>
              </button>
            )}
          </div>
        </div>

        {/* Request Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Requested Amount
            </span>
            <span className="font-mono font-bold text-amber-300 text-sm mt-0.5 block">
              ${requestedAmount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Client target</span>
          </div>

          <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Requested Product
            </span>
            <span className="font-semibold text-slate-200 truncate mt-0.5 block" title={client.requestedProduct}>
              {client.requestedProduct || 'Revenue Funding'}
            </span>
            <span className="text-[10px] text-slate-400">Interest</span>
          </div>

          <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Funding Urgency
            </span>
            <span className="font-semibold text-cyan-300 mt-0.5 block">
              {client.fundingUrgency || 'This Week'}
            </span>
            <span className="text-[10px] text-slate-400">Timeline</span>
          </div>

          <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Monthly Revenue
            </span>
            <span className="font-mono font-bold text-slate-100 mt-0.5 block">
              ${Number(client.monthlyRevenue || 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400">Annual: ${Number(client.annualRevenue || 0).toLocaleString()}</span>
          </div>

          <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Credit Score (FICO)
            </span>
            <span className="font-mono font-bold text-emerald-400 mt-0.5 block">
              {client.creditScore || 700} FICO
            </span>
            <span className="text-[10px] text-slate-400">Bankruptcy: {client.bankruptcy || 'None'}</span>
          </div>

          <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Use of Funds
            </span>
            <span className="text-slate-300 truncate mt-0.5 block" title={client.useOfFunds || 'General Working Capital'}>
              {client.useOfFunds || 'General working capital'}
            </span>
            <span className="text-[10px] text-slate-400">Stated purpose</span>
          </div>
        </div>
      </div>

      {/* 2. Funding Stack Key Metrics Aggregation Strip (Zero Double Counting) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Pre-Qualified */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Pre-Qualified
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
              Pre-App
            </span>
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1.5">
            ${totalPreQualifiedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {safeDeals.filter((d) => d.status === 'PRE_APPROVED').length} pre-approved tranches
          </div>
        </div>

        {/* Total Approved */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Approved
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
              Approved
            </span>
          </div>
          <div className="text-xl font-bold text-teal-400 font-mono mt-1.5">
            ${totalApprovedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalApprovedDealsCount} ready to close
          </div>
        </div>

        {/* Total Funded (Disbursed) */}
        <div className="bg-[#0b1528] border border-emerald-900/50 p-4 rounded-2xl shadow-lg bg-gradient-to-b from-emerald-950/20 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
              Total Capital Funded
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
              Active
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5">
            ${totalFundedVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalFundedDealsCount} funded positions in stack
          </div>
        </div>

        {/* Total Gross Commissions */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Gross Est. Commission
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              Points & Fees
            </span>
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1.5">
            ${Math.round(totalEstimatedCommission).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Funded Collected: ${Math.round(totalFundedCommission).toLocaleString()}
          </div>
        </div>

        {/* Stack Structure */}
        <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Stack Positions
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono">
              Total {safeDeals.length}
            </span>
          </div>
          <div className="text-base font-bold text-slate-200 mt-1.5">
            {safeDeals.length > 1
              ? `Multi-Tranche Stack (${safeDeals.length})`
              : safeDeals.length === 1
              ? 'Single Position'
              : 'No Positions'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {safeDeals.filter((d) => d.isStacked).length} stacked secondary positions
          </div>
        </div>
      </div>

      {/* 3. Available Lender Offers Bridge (Import with 1 Click) */}
      {availableLenderOffers.length > 0 && (
        <div className="bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-800/80 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Lender Responses Ready to Stack ({availableLenderOffers.length} Available)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              One-click convert lender approval offers directly into this client's funding stack.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableLenderOffers.map((offer) => (
              <div
                key={offer.id}
                className="bg-[#070d18] border border-blue-900/60 p-3 rounded-xl flex items-center justify-between gap-3 hover:border-blue-700/80 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-slate-100 text-xs truncate">
                      {offer.lenderName}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {offer.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ${Number(offer.amount || 0).toLocaleString()} • {offer.fundingProduct}
                  </div>
                  {offer.terms && (
                    <div className="text-[10px] text-amber-300/90 truncate">Terms: {offer.terms}</div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleImportLenderOffer(offer)}
                  className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-xs"
                  title="Create Funding Deal from this offer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Stack Deal</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Controls & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0b1528] border border-blue-900/60 p-4 rounded-2xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Active Funding Stack ({filteredDeals.length})
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#070d18] border border-blue-900/70 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
            >
              <option value="ALL">All Deal Stages ({safeDeals.length})</option>
              <option value="FUNDED">Funded Only ({safeDeals.filter((d) => d.status === 'FUNDED').length})</option>
              <option value="APPROVED">Approved Only ({safeDeals.filter((d) => d.status === 'APPROVED' || d.status === 'CONDITIONS_MET').length})</option>
              <option value="PRE_APPROVED">Pre-Approved ({safeDeals.filter((d) => d.status === 'PRE_APPROVED').length})</option>
              <option value="SUBMITTED">Submitted ({safeDeals.filter((d) => d.status === 'SUBMITTED').length})</option>
              <option value="PROPOSED">Proposed ({safeDeals.filter((d) => d.status === 'PROPOSED').length})</option>
              <option value="DECLINED">Declined / Withdrawn ({safeDeals.filter((d) => d.status === 'DECLINED' || d.status === 'WITHDRAWN').length})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="bg-[#070d18] border border-blue-900/70 p-0.5 rounded-xl flex items-center text-xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Table
            </button>
          </div>

          {/* Add Deal Button */}
          <button
            type="button"
            onClick={() => handleOpenAddDeal()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Funding Deal</span>
          </button>
        </div>
      </div>

      {/* 5. Funding Deals List (Cards or Table) */}
      {filteredDeals.length === 0 ? (
        <div className="bg-[#0b1528] border border-dashed border-blue-900/60 p-10 rounded-2xl shadow-xl text-center space-y-4">
          <Layers className="w-12 h-12 text-slate-500 mx-auto opacity-70" />
          <h3 className="text-base font-bold text-slate-100">No Funding Deals Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {statusFilter !== 'ALL'
              ? `There are no deals matching the "${statusFilter}" filter.`
              : 'Add the first lender position or multi-tranche deal for this client. You can stack multiple deals from different lenders without overwriting.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => handleOpenAddDeal()}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Create Initial Funding Deal</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredDeals.map((deal, idx) => {
            const dealGrossCommission =
              ((Number(deal.fundingAmount) || 0) * (Number(deal.percentage) || 0)) / 100 +
              (Number(deal.fee) || 0);

            const isFunded = deal.status === 'FUNDED';

            return (
              <div
                key={deal.id}
                className={`bg-[#0b1528] border rounded-2xl p-5 shadow-xl space-y-4 transition-all hover:border-blue-700/80 ${
                  isFunded ? 'border-emerald-700/60 bg-gradient-to-b from-emerald-950/15 to-[#0b1528]' : 'border-blue-900/60'
                }`}
              >
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-3 border-b border-blue-900/50 pb-3">
                  <div className="flex items-start space-x-3 min-w-0">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/30 shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-sm font-bold text-slate-100 truncate">
                          {deal.lenderName || 'Unnamed Lender'}
                        </h4>
                        {deal.isStacked ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase font-bold">
                            Stacked Tranche
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase font-bold">
                            Primary Position
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <ProductBadge product={deal.product} />
                        <span>•</span>
                        <span>Term: <strong className="text-slate-200">{deal.termLength || '12 Months'}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <StatusBadge status={deal.status} />
                  </div>
                </div>

                {/* Financial Details Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Funding Amount</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                      ${Number(deal.fundingAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Points Rate (%)</span>
                    <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">
                      {deal.percentage || 0}%
                    </span>
                    <span className="text-[9px] text-slate-500 block">Fee: ${Number(deal.fee || 0).toLocaleString()}</span>
                  </div>

                  <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Est. Commission</span>
                    <span className="font-mono font-bold text-amber-300 text-sm mt-0.5 block">
                      ${Math.round(dealGrossCommission).toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate block">{deal.commissionStatus || 'PENDING'}</span>
                  </div>

                  <div className="p-2.5 bg-[#070d18] rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Funding Date</span>
                    <span className="font-semibold text-slate-200 text-xs mt-0.5 block">
                      {formatDate(deal.fundingDate, isFunded ? 'Funded' : 'Pending')}
                    </span>
                    <span className="text-[9px] text-slate-500 block">By: {deal.assignedStaff || 'Staff'}</span>
                  </div>
                </div>

                {/* Notes & Stipulations */}
                {deal.notes && (
                  <div className="p-3 bg-[#070d18] rounded-xl border border-blue-900/40 text-xs text-slate-300">
                    <strong className="text-slate-400 uppercase text-[10px] block mb-0.5">Lender Notes & Terms:</strong>
                    {deal.notes}
                  </div>
                )}

                {/* Stage Progress & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-blue-900/40 text-xs">
                  {/* Quick Status Dropdown */}
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Stage:</span>
                    <select
                      value={deal.status}
                      onChange={(e) => handleQuickAdvanceStatus(deal, e.target.value as any)}
                      className="bg-[#070d18] border border-blue-900/70 rounded-lg px-2 py-1 text-xs text-slate-200 focus:border-amber-400 focus:outline-none font-semibold cursor-pointer"
                    >
                      {DEAL_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {!isFunded && (
                      <button
                        type="button"
                        onClick={() => {
                          setFundingQuickDeal(deal);
                          setQuickFundingDate(deal.fundingDate || new Date().toISOString().split('T')[0]);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Funded</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEditDeal(deal)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-blue-800 rounded-lg text-xs font-semibold transition-all flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3 text-amber-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDealToDelete({ id: deal.id, title: `${deal.lenderName} (${deal.product})` })}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                      title="Delete this position"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#070d18] text-slate-400 uppercase text-[10px] tracking-wider border-b border-blue-900/60">
                <tr>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4">Lender / Capital Desk</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Rate & Fee</th>
                  <th className="py-3 px-3">Gross Comm</th>
                  <th className="py-3 px-3">Term</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Funded Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/40 font-mono text-[11px]">
                {filteredDeals.map((deal, idx) => {
                  const dealCalc = calculateDealCommission(deal);
                  const dealGrossComm = dealCalc.totalCommission;

                  return (
                    <tr key={deal.id} className="hover:bg-blue-950/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-bold text-amber-400">#{idx + 1}</span>
                        {deal.isStacked && (
                          <span className="block text-[9px] text-indigo-300 font-sans">Stacked</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-slate-100">
                        {deal.lenderName}
                        <div className="text-[10px] text-slate-400 font-normal">{deal.lenderContact}</div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <ProductBadge product={deal.product} />
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-400">
                        ${Number(deal.fundingAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-amber-300">
                        {deal.percentage || 0}%
                        <div className="text-[9px] text-slate-400 font-sans font-normal">Fee: ${Number(deal.fee || 0).toLocaleString()}</div>
                      </td>
                      <td className="py-3 px-3 font-bold text-amber-400">
                        ${Math.round(dealGrossComm).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300">{deal.termLength || '12 Months'}</td>
                      <td className="py-3 px-3 font-sans">
                        <StatusBadge status={deal.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-300">
                        {formatDate(deal.fundingDate, 'Pending')}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditDeal(deal)}
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-blue-900 rounded-lg transition-colors"
                            title="Edit deal"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDealToDelete({ id: deal.id, title: `${deal.lenderName} (${deal.product})` })}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors"
                            title="Delete deal"
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
      )}

      {/* 6. Add / Edit Deal Modal */}
      {showDealModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-slate-100">
                  {editingDealId ? 'Edit Funding Position' : 'Add New Funding Position / Tranche'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDealModal(false)}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Lender / Capital Partner *
                  </label>
                  <input
                    type="text"
                    required
                    value={dealForm.lenderName || ''}
                    onChange={(e) => setDealForm({ ...dealForm, lenderName: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-semibold"
                    placeholder="e.g., Apex Commercial Partners, Maple Direct Capital"
                  />
                </div>

                <div>
                  <ProductSelect
                    label="Funding Product Type"
                    required
                    value={dealForm.product || 'Revenue Funding'}
                    onChange={(val) => setDealForm({ ...dealForm, product: val as FundingProductType })}
                    otherType={dealForm.otherProductType || ''}
                    onChangeOtherType={(val) => setDealForm({ ...dealForm, otherProductType: val })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Funding Amount ($) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      required
                      min="1"
                      value={dealForm.fundingAmount ?? ''}
                      onChange={(e) => setDealForm({ ...dealForm, fundingAmount: Number(e.target.value) })}
                      className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-emerald-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
                      placeholder="50,000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Commission Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={dealForm.percentage !== undefined && dealForm.percentage !== null ? dealForm.percentage : ''}
                      onChange={(e) => setDealForm({ ...dealForm, percentage: e.target.value === '' ? undefined : Number(e.target.value) })}
                      placeholder="Enter %"
                      className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pr-7 text-xs text-amber-300 font-mono font-bold focus:border-amber-400 focus:outline-none"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Origination / Doc Fee ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">$</span>
                    <input
                      type="number"
                      value={dealForm.fee !== undefined && dealForm.fee !== null ? dealForm.fee : ''}
                      onChange={(e) => setDealForm({ ...dealForm, fee: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 pl-7 text-xs text-cyan-300 font-mono focus:border-amber-400 focus:outline-none"
                      placeholder="Enter fee $"
                    />
                  </div>
                </div>
              </div>

              {/* Commission calculation preview */}
              <div className="p-3 bg-[#070d18] border border-blue-900/50 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 font-sans">Estimated Total Commission for this position:</span>
                <span className="font-bold text-amber-400 text-sm">
                  {(() => {
                    const calc = calculateDealCommission(dealForm);
                    return calc.hasCommission ? calc.formattedTotalCommission : '$0 (Commission % not entered)';
                  })()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Deal Stage / Status
                  </label>
                  <select
                    value={dealForm.status || 'APPROVED'}
                    onChange={(e) => setDealForm({ ...dealForm, status: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    {DEAL_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Term Length / Structure
                  </label>
                  <input
                    type="text"
                    value={dealForm.termLength || '24 Months'}
                    onChange={(e) => setDealForm({ ...dealForm, termLength: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    placeholder="e.g. 24 Months, 36 Months"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Funding Date
                  </label>
                  <input
                    type="date"
                    value={dealForm.fundingDate || ''}
                    onChange={(e) => setDealForm({ ...dealForm, fundingDate: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Lender Contact / Rep Email
                  </label>
                  <input
                    type="text"
                    value={dealForm.lenderContact || ''}
                    onChange={(e) => setDealForm({ ...dealForm, lenderContact: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                    placeholder="underwriting@lender.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Commission Settlement Status
                  </label>
                  <select
                    value={dealForm.commissionStatus || 'PENDING'}
                    onChange={(e) => setDealForm({ ...dealForm, commissionStatus: e.target.value as any })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="COLLECTED">COLLECTED / RECEIVED</option>
                    <option value="DISTRIBUTED">DISTRIBUTED</option>
                    <option value="PARTIALLY_DISTRIBUTED">PARTIALLY_DISTRIBUTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Stack Position Type
                </label>
                <div className="flex items-center space-x-4 pt-1">
                  <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="isStacked"
                      checked={!dealForm.isStacked}
                      onChange={() => setDealForm({ ...dealForm, isStacked: false })}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>Primary Position (Tranche 1)</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-200 cursor-pointer">
                    <input
                      type="radio"
                      name="isStacked"
                      checked={!!dealForm.isStacked}
                      onChange={() => setDealForm({ ...dealForm, isStacked: true })}
                      className="text-amber-500 focus:ring-amber-400"
                    />
                    <span>Stacked Secondary Position (Tranche 2+)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Lender Approval Conditions & Underwriting Notes
                </label>
                <textarea
                  rows={2}
                  value={dealForm.notes || ''}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
                  placeholder="Stipulations, covenants, holdback terms, payoff requirements..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-blue-900">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingDealId ? 'Update Deal Position' : 'Create Deal Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Quick "Mark as Funded" Date Modal */}
      {fundingQuickDeal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-emerald-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center space-x-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-100">Confirm Deal Funded Date</h3>
            </div>
            <p className="text-xs text-slate-300">
              Marking <strong className="text-slate-100">{fundingQuickDeal.lenderName}</strong> (${Number(fundingQuickDeal.fundingAmount).toLocaleString()}) as <strong className="text-emerald-400">FUNDED</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Actual Funding / Capital Disbursement Date
              </label>
              <input
                type="date"
                value={quickFundingDate}
                onChange={(e) => setQuickFundingDate(e.target.value)}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-blue-900">
              <button
                type="button"
                onClick={() => setFundingQuickDeal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickFunded}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                Confirm Funded Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={handleConfirmDeleteDeal}
        title="Delete Funding Position"
        message={`Are you sure you want to delete the deal position "${dealToDelete?.title || ''}"?\n\nThis will remove the tranche and its associated commission splits.`}
        confirmText="Delete Position"
      />
    </div>
  );
};
