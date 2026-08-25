import React from 'react';
import { PipelineStage, FundingProductType } from '../../types';

interface StatusBadgeProps {
  status?: PipelineStage | string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status = 'APPLICATION_RECEIVED', size = 'md' }) => {
  const safeStatus = (status || 'APPLICATION_RECEIVED').toString();
  const normalized = safeStatus.toUpperCase().replace(/\s+/g, '_');

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (normalized.includes('FUNDED')) {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-xs';
  } else if (normalized.includes('APPROVED')) {
    colorClasses = 'bg-teal-500/10 text-teal-400 border-teal-500/20';
  } else if (normalized.includes('PRE_APPROVED')) {
    colorClasses = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  } else if (normalized.includes('COMMISSION_RECEIVED') || normalized.includes('COLLECTED')) {
    colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-semibold';
  } else if (normalized.includes('COMMISSION_PENDING') || normalized.includes('COMMISSION')) {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  } else if (normalized.includes('UNDERWRITING') || normalized.includes('READY_FOR_LENDER')) {
    colorClasses = 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  } else if (normalized.includes('VERIFICATION_COMPLETE') || normalized === 'VERIFIED') {
    colorClasses = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  } else if (normalized.includes('VERIFICATION') || normalized.includes('PROGRESS')) {
    colorClasses = 'bg-sky-500/10 text-sky-400 border-sky-500/20';
  } else if (normalized.includes('DOCUMENTS_RECEIVED') || normalized.includes('DOCUMENT')) {
    colorClasses = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  } else if (normalized.includes('APPLICATION_RECEIVED') || normalized.includes('APPLICATION')) {
    colorClasses = 'bg-blue-500/10 text-blue-300 border-blue-500/20';
  } else if (normalized.includes('NEW_LEAD') || normalized.includes('LEAD')) {
    colorClasses = 'bg-slate-800 text-blue-400 border-slate-700';
  } else if (normalized.includes('NOT_QUALIFIED') || normalized.includes('DECLINED') || normalized.includes('LOST') || normalized.includes('REJECTED')) {
    colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  // Friendly human-readable label
  const readable = safeStatus
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md border tracking-wide uppercase ${sizeClasses} ${colorClasses}`}
    >
      {readable}
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
