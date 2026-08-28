import React, { useState } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileCheck2,
  Building2,
  ShieldAlert,
  Package,
  Banknote,
  Send,
  UserCheck,
  Layers,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';
import { UnderwritingCommandCenter } from './UnderwritingCommandCenter';
import { FundingDeal, Client } from '../../types';

interface UnderwritingHubProps {
  setActiveTab: (tab: string) => void;
}

export const UnderwritingHub: React.FC<UnderwritingHubProps> = ({ setActiveTab }) => {
  const { clients, deals, setSelectedClientId, updateDeal, updateClient } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');
  const [selectedDeal, setSelectedDeal] = useState<FundingDeal | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Build deal records with associated client information
  const enrichedDeals = deals.map((deal) => {
    const client = clients.find((c) => c.id === deal.clientId);
    return {
      deal,
      client: client || {
        id: deal.clientId,
        firstName: deal.clientName?.split(' ')[0] || 'Unknown',
        lastName: deal.clientName?.split(' ').slice(1).join(' ') || 'Client',
        businessName: deal.businessName || 'Business Entity',
        monthlyRevenue: 45000,
        annualRevenue: 540000,
        creditScore: 700,
        isVerified: false,
        assignedStaff: deal.assignedStaff || 'Staff',
      } as Client,
    };
  });

  // If there are no deals yet in context, fallback to client records
  const fallbackList = clients.map((c) => ({
    deal: {
      id: `deal-${c.id}`,
      dealId: `DL-${c.id.slice(0, 6).toUpperCase()}`,
      clientId: c.id,
      clientName: `${c.firstName} ${c.lastName}`,
      businessName: c.businessName || 'Business',
      product: c.requestedProduct || 'Revenue Funding',
      fundingAmount: c.requestedAmount || 50000,
      requestedAmount: c.requestedAmount || 50000,
      status: (c.isUnderwritten ? 'Ready to Fund' : 'Underwriting') as any,
      assignedStaff: c.assignedStaff || 'Staff',
      lenderName: 'Direct Lender',
      termLength: '12 Months',
      fee: 0,
      percentage: 10,
      commissionStatus: 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as FundingDeal,
    client: c,
  }));

  const allItems = enrichedDeals.length > 0 ? enrichedDeals : fallbackList;

  const filteredItems = allItems.filter(({ deal, client }) => {
    const matchesSearch =
      searchQuery === '' ||
      (client.firstName + ' ' + client.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.product?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.dealId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.assignedStaff?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision =
      decisionFilter === 'ALL' ||
      (decisionFilter === 'PENDING' && deal.status !== 'Ready to Fund' && deal.status !== 'Funded') ||
      (decisionFilter === 'SUBMISSION' && (deal.status === 'Submitted' || deal.status === 'Underwriting')) ||
      (decisionFilter === 'READY_TO_FUND' && deal.status === 'Ready to Fund') ||
      (decisionFilter === 'FUNDED' && deal.status === 'Funded');

    return matchesSearch && matchesDecision;
  });

  const handleOpenCommandCenter = (deal: FundingDeal, client: Client) => {
    setSelectedDeal(deal);
    setSelectedClient(client);
  };

  const handleBackToPortfolio = () => {
    setSelectedDeal(null);
    setSelectedClient(null);
  };

  // If a deal is currently selected, render the full UnderwritingCommandCenter workstation
  if (selectedDeal && selectedClient) {
    const dealsForThisClient = deals.filter((d) => d.clientId === selectedClient.id);
    return (
      <UnderwritingCommandCenter
        deal={selectedDeal}
        client={selectedClient}
        allDealsForClient={dealsForThisClient.length > 0 ? dealsForThisClient : [selectedDeal]}
        onSelectDeal={(d) => setSelectedDeal(d)}
        onBackToHub={handleBackToPortfolio}
        onDealUpdated={(d) => {
          setSelectedDeal(d);
          updateDeal(d.id, d);
        }}
        onClientUpdated={(c) => {
          setSelectedClient(c);
          updateClient(c.id, c);
        }}
        setActiveTab={setActiveTab}
      />
    );
  }

  // Calculate high-level summary KPIs
  const totalPipelineVolume = allItems.reduce(
    (sum, item) => sum + (item.deal.approvedAmount || item.deal.requestedAmount || item.deal.fundingAmount || 0),
    0
  );
  const readyToFundCount = allItems.filter((i) => i.deal.status === 'Ready to Fund').length;
  const underReviewCount = allItems.filter((i) => i.deal.status === 'Underwriting' || !i.client.isUnderwritten).length;

  return (
    <div className="space-y-6 pb-12" id="underwriting-hub-view">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-mono">
              Underwriting Command Center
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{allItems.length} Active Deal Files</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-400" />
            Underwriting & Risk Evaluation Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            4-Month bank statement cash flow analysis, automated risk mitigation, cross-source conflict reconciliation, lender submission packages, and 1-click ready-to-fund workflows.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs self-start sm:self-auto">
          <button
            onClick={() => setDecisionFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              decisionFilter === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Deals ({allItems.length})
          </button>
          <button
            onClick={() => setDecisionFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              decisionFilter === 'PENDING' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Review Needed ({underReviewCount})
          </button>
          <button
            onClick={() => setDecisionFilter('READY_TO_FUND')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              decisionFilter === 'READY_TO_FUND' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ready to Fund ({readyToFundCount})
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Underwriting Pipeline
          </span>
          <div className="text-2xl font-black text-white mt-2 font-mono">
            ${Number(totalPipelineVolume).toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Across {allItems.length} active deal files</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-amber-400" />
            Active Underwriting
          </span>
          <div className="text-2xl font-black text-amber-400 mt-2 font-mono">
            {underReviewCount} Deals
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Under cash flow & credit review</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Banknote className="w-4 h-4 text-emerald-400" />
            Ready to Fund
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-2 font-mono">
            {readyToFundCount} Deals
          </div>
          <span className="text-xs text-slate-500 mt-1 block">100% verified & commission entered</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <span className="text-xs uppercase font-semibold text-slate-400 flex items-center gap-1.5">
            <Package className="w-4 h-4 text-blue-400" />
            Lender Submissions
          </span>
          <div className="text-2xl font-black text-blue-400 mt-2 font-mono">
            {allItems.filter((i) => i.deal.status === 'Submitted' || (i.deal as any).stage === 'Submission').length} Sent
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Auto cover sheets & ZIP packages</span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Deal ID, client, business entity, product, staff..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50"
        />
      </div>

      {/* 4. Underwriting Deal Portfolio Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Deal ID & Business Entity</th>
                <th className="py-3 px-3">Funding Product & Sizing</th>
                <th className="py-3 px-3">Monthly Deposits & FICO</th>
                <th className="py-3 px-3">Verification & Risk</th>
                <th className="py-3 px-3">Deal Status</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Workstation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filteredItems.length > 0 ? (
                filteredItems.map(({ deal, client }) => (
                  <tr
                    key={deal.id}
                    onClick={() => handleOpenCommandCenter(deal, client)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] bg-slate-950 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded">
                          {deal.dealId || deal.id}
                        </span>
                        <div className="font-bold text-slate-100 text-xs">
                          {client.businessName}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {client.firstName} {client.lastName} ({client.state || 'TX'})
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-mono font-bold text-emerald-400 text-xs">
                        ${Number(deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || 50000).toLocaleString()}
                      </div>
                      <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                        {deal.product}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <div className="text-white font-bold text-xs">
                        ${Number(client.monthlyRevenue || 45000).toLocaleString()} /mo
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        FICO Score: <strong className="text-slate-200">{client.creditScore || 700}</strong>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {client.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800">
                          <AlertTriangle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          deal.status === 'Ready to Fund'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                            : deal.status === 'Funded'
                            ? 'bg-blue-950 text-blue-300 border-blue-700'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {deal.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-slate-200 text-xs">
                      {deal.assignedStaff || client.assignedStaff}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommandCenter(deal, client);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                      >
                        <span>Command Center</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No deals match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
