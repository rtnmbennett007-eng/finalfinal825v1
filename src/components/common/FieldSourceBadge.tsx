import React from 'react';
import { FieldSourceType, FieldSourceMetadata } from '../../types';
import { SOURCE_DISPLAY_CONFIG } from '../../utils/sourceTracker';
import { ShieldCheck, UserCheck, FileCheck, FileText, Sparkles, Download, Calculator, AlertTriangle } from 'lucide-react';

interface FieldSourceBadgeProps {
  source?: FieldSourceType;
  metadata?: FieldSourceMetadata;
  showConflict?: boolean;
  className?: string;
  compact?: boolean;
}

export const FieldSourceBadge: React.FC<FieldSourceBadgeProps> = ({
  source = 'NOT_ENTERED',
  metadata,
  showConflict = true,
  className = '',
  compact = false,
}) => {
  const effectiveSource = metadata?.source || source;
  const config = SOURCE_DISPLAY_CONFIG[effectiveSource] || SOURCE_DISPLAY_CONFIG.NOT_ENTERED;

  const renderIcon = (iconName: string) => {
    const iconClass = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className={`${iconClass} text-emerald-400`} />;
      case 'UserCheck':
        return <UserCheck className={`${iconClass} text-blue-400`} />;
      case 'FileCheck':
        return <FileCheck className={`${iconClass} text-teal-400`} />;
      case 'FileText':
        return <FileText className={`${iconClass} text-indigo-400`} />;
      case 'Sparkles':
        return <Sparkles className={`${iconClass} text-purple-400`} />;
      case 'Download':
        return <Download className={`${iconClass} text-slate-400`} />;
      case 'Calculator':
        return <Calculator className={`${iconClass} text-cyan-400`} />;
      default:
        return null;
    }
  };

  const hasConflict = showConflict && metadata?.conflictWith;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        title={metadata?.sourceDocumentName ? `Source: ${config.label} (${metadata.sourceDocumentName})` : `Source: ${config.label}`}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${config.badgeBg} ${config.badgeText} ${config.borderColor} transition-all`}
      >
        {renderIcon(config.icon)}
        <span>{compact ? config.shortLabel : config.label}</span>
      </span>

      {hasConflict && (
        <span
          title={`Conflict Detected: ${metadata.conflictWith?.source} reports "${metadata.conflictWith?.value}" (${metadata.conflictWith?.documentName || 'Other Document'})`}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/60 animate-pulse"
        >
          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
          <span>Conflict: {String(metadata.conflictWith?.value).slice(0, 15)}</span>
        </span>
      )}
    </div>
  );
};
