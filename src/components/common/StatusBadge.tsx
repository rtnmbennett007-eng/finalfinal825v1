import React from 'react';
import { PipelineStage, FundingProductType, normalizePipelineStage, CanonicalDealStatus, normalizeDealStatus } from '../../types';

interface StatusBadgeProps {
  status?: PipelineStage | string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'No Set – Follow Up', size = 'md' }) => {
  const safeStatus = (status || 'No Set – Follow Up').toString();
  const canonical = normalizePipelineStage(safeStatus);
  const normalized = safeStatus.toUpperCase().replace(/\s+/g, '_');

  let colorClasses = 'bg-slate-800/90 text-slate-300 border-slate-700/80';

  switch (canonical) {
    case 'No Set – Follow Up':
      colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';
      break;
    case 'Application Received':
      colorClasses = 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-medium';
      break;
    case 'Credit Pulled':
      colorClasses = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      break;
    case 'Documents Pending':
      colorClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium';
      break;
    case 'Documents Received':
      colorClasses = 'bg-teal-500/15 text-teal-300 border-teal-500/30 font-medium';
      break;
    case 'Pre-Approved':
      colorClasses = 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30 font-semibold';
      break;
    case 'Verification Call':
      colorClasses = 'bg-sky-500/15 text-sky-400 border-sky-500/30 font-semibold';
      break;
    case 'KYC Verified & Ready for Underwriting':
      colorClasses = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold';
      break;
    case 'Underwriting':
      colorClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold';
      break;
    case 'Ready for Lender / Stacking':
      colorClasses = 'bg-violet-500/15 text-violet-300 border-violet-500/30 font-semibold';
      break;
    case 'Submitted':
      colorClasses = 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-medium';
      break;
    case 'Approved':
      colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold';
      break;
    case 'Pre-Closing Checklist':
      colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
      break;
    case 'Closing Docs Signed':
      colorClasses = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
      break;
    case 'Ready to Fund':
      colorClasses = 'bg-emerald-500/25 text-emerald-200 border-emerald-500/50 font-black';
      break;
    case 'Funded':
      colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold';
      break;
    case 'Commission Pending':
      colorClasses = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      break;
    case 'Commission Received':
      colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
      break;
    case 'Not Qualified':
    case 'Declined':
    case 'Withdrawn':
    case 'Lost':
      colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      break;
    default:
      if (normalized.includes('FUNDED')) {
        colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 font-bold';
      } else if (normalized.includes('UNDERWRITING')) {
        colorClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold';
      } else if (normalized.includes('COMMISSION')) {
        colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
      }
      break;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md border tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      {safeStatus}
    </span>
  );
};

interface DealStatusBadgeProps {
  status?: CanonicalDealStatus | string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const DealStatusBadge: React.FC<DealStatusBadgeProps> = ({ status = 'Draft', size = 'md' }) => {
  const canonical = normalizeDealStatus(status);

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/80';

  switch (canonical) {
    case 'Draft':
      colorClasses = 'bg-slate-800/90 text-slate-300 border-slate-700';
      break;
    case 'Submitted':
      colorClasses = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
      break;
    case 'Underwriting':
      colorClasses = 'bg-purple-500/15 text-purple-300 border-purple-500/30 font-semibold';
      break;
    case 'Approved':
      colorClasses = 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-semibold';
      break;
    case 'Conditions':
      colorClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-medium';
      break;
    case 'Funded':
      colorClasses = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold';
      break;
    case 'Paid Off':
      colorClasses = 'bg-teal-500/15 text-teal-300 border-teal-500/30 font-medium';
      break;
    case 'Renewed':
      colorClasses = 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold';
      break;
    case 'Declined':
      colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      break;
    case 'Lost':
      colorClasses = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      break;
    case 'Cancelled':
      colorClasses = 'bg-slate-800/50 text-slate-400 border-slate-800';
      break;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.75 font-medium',
    lg: 'text-sm px-3 py-1 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md border tracking-wide font-medium ${sizeClasses} ${colorClasses}`}
    >
      {canonical}
    </span>
  );
};

export const ProductBadge: React.FC<{ product?: FundingProductType | string | null }> = ({ product = 'Revenue Funding' }) => {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800/80 text-blue-300 border border-blue-500/20 whitespace-nowrap">
      {product || 'Revenue Funding'}
    </span>
  );
};
