import React, { useState } from 'react';
import {
  DollarSign,
  Building2,
  User,
  Clock,
  Layers,
  ChevronRight,
  MoreVertical,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { FundingDeal, CANONICAL_DEAL_STATUSES, CanonicalDealStatus, normalizeDealStatus } from '../../types';
import { ProductBadge, DealStatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/dateUtils';

interface DealsKanbanBoardProps {
  deals: FundingDeal[];
  onSelectDeal: (deal: FundingDeal) => void;
  onAdvanceStatus: (deal: FundingDeal, newStatus: string) => void;
  onCreateDeal?: () => void;
}

// Major columns for Kanban flow matching CanonicalDealStatus
const KANBAN_COLUMNS: { title: string; statuses: CanonicalDealStatus[]; color: string }[] = [
  {
    title: 'Draft & Intake',
    statuses: ['Draft'],
    color: 'border-slate-700 bg-slate-900/30',
  },
  {
    title: 'Submitted & Desk',
    statuses: ['Submitted'],
    color: 'border-amber-900/60 bg-amber-950/20',
  },
  {
    title: 'Underwriting & Stips',
    statuses: ['Underwriting', 'Conditions'],
    color: 'border-blue-900/60 bg-blue-950/20',
  },
  {
    title: 'Approved',
    statuses: ['Approved'],
    color: 'border-cyan-900/60 bg-cyan-950/20',
  },
  {
    title: 'Funded & Active',
    statuses: ['Funded', 'Paid Off', 'Renewed'],
    color: 'border-emerald-900/60 bg-emerald-950/20',
  },
  {
    title: 'Declined / Lost',
    statuses: ['Declined', 'Lost', 'Cancelled'],
    color: 'border-rose-950/60 bg-rose-950/10',
  },
];

export const DealsKanbanBoard: React.FC<DealsKanbanBoardProps> = ({
  deals,
  onSelectDeal,
  onAdvanceStatus,
  onCreateDeal,
}) => {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-[1200px] items-start">
        {KANBAN_COLUMNS.map((col) => {
          const colDeals = deals.filter((d) => col.statuses.includes(normalizeDealStatus(d.status)));
          const colVolume = colDeals.reduce((sum, d) => sum + (Number(d.fundingAmount) || 0), 0);

          return (
            <div
              key={col.title}
              className={`flex-1 min-w-[240px] max-w-[300px] rounded-2xl border ${col.color} p-3 flex flex-col max-h-[78vh]`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-2.5 mb-3 shrink-0">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{col.title}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-blue-900/60 text-blue-300">
                      {colDeals.length}
                    </span>
                  </h4>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                    ${colVolume.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Deal Cards Container */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1">
                {colDeals.length === 0 ? (
                  <div className="p-4 text-center text-slate-600 text-xs border border-dashed border-blue-900/40 rounded-xl">
                    No deals in this stage
                  </div>
                ) : (
                  colDeals.map((deal) => {
                    const amount = Number(deal.fundingAmount || deal.approvedAmount || deal.requestedAmount || 0);

                    return (
                      <div
                        key={deal.id}
                        onClick={() => onSelectDeal(deal)}
                        className="p-3 bg-[#0b1528] hover:bg-[#0f1d38] border border-blue-900/60 hover:border-amber-500/50 rounded-xl transition-all shadow-md cursor-pointer space-y-2 group"
                      >
                        {/* Top: Deal ID & Product */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono font-bold text-amber-400">
                            {deal.dealId || deal.id.slice(0, 10)}
                          </span>
                          <ProductBadge product={deal.product} />
                        </div>

                        {/* Middle: Business & Client */}
                        <div>
                          <h5 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors truncate">
                            {deal.businessName || deal.clientName}
                          </h5>
                          <p className="text-[11px] text-slate-400 truncate">{deal.clientName}</p>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="flex items-center justify-between pt-1 border-t border-blue-900/40">
                          <span className="font-mono font-bold text-emerald-400 text-xs">
                            ${amount.toLocaleString()}
                          </span>
                          <DealStatusBadge status={deal.status} />
                        </div>

                        {/* Funder & Position */}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans">
                          <span className="truncate max-w-[110px]">{deal.lenderName || deal.funder || 'Lender Desk'}</span>
                          <span className="font-mono text-blue-300">{deal.position || '1st Pos'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
