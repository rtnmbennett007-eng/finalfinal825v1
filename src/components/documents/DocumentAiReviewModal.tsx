import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldCheck,
  Building,
  User,
  DollarSign,
  Briefcase,
  Layers,
  Info,
  RefreshCw,
  Edit2,
  Check,
  Filter,
  CheckSquare,
  Square,
  Scale,
  ShieldAlert
} from 'lucide-react';
import { DocumentItem, DocumentAiExtractionResult, ExtractedFieldItem, MasterVerificationData, DocumentClassificationType } from '../../types';
import { api } from '../../services/api';
import { SOURCE_DISPLAY_CONFIG } from '../../utils/sourceTracker';

interface DocumentAiReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  clientId: string;
  clientName: string;
  businessName: string;
  currentVerification?: MasterVerificationData | null;
  onVerificationUpdated?: () => void;
  currentUser?: string;
}

export const DocumentAiReviewModal: React.FC<DocumentAiReviewModalProps> = ({
  isOpen,
  onClose,
  document,
  clientId,
  clientName,
  businessName,
  currentVerification,
  onVerificationUpdated,
  currentUser = 'Staff Underwriter',
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'high_confidence' | 'needs_review' | 'conflicts'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const extraction = document.aiExtraction;

  // Initialize selected fields
  React.useEffect(() => {
    if (extraction?.extractedFields) {
      const initial: Record<string, boolean> = {};
      extraction.extractedFields.forEach((f) => {
        // By default, select fields that do not have a hard conflict with a verified field
        initial[`${f.section}_${f.key}`] = !f.isConflictWithVerified;
      });
      setSelectedFields(initial);
    }
  }, [extraction]);

  if (!isOpen || !extraction) return null;

  const fields = extraction.extractedFields || [];
  const highConfidenceFields = fields.filter((f) => (f.confidence || 0) >= 0.85);
  const needsReviewFields = fields.filter((f) => (f.confidence || 0) < 0.85);
  const conflictFields = fields.filter((f) => f.isConflictWithVerified);

  const classificationType = extraction.classificationType || 'OTHER';

  const displayedFields = fields.filter((f) => {
    if (activeTab === 'high_confidence') return (f.confidence || 0) >= 0.85;
    if (activeTab === 'needs_review') return (f.confidence || 0) < 0.85;
    if (activeTab === 'conflicts') return Boolean(f.isConflictWithVerified);
    return true;
  });

  const toggleFieldSelection = (compositeKey: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [compositeKey]: !prev[compositeKey],
    }));
  };

  const handleSelectAll = () => {
    const updated: Record<string, boolean> = {};
    fields.forEach((f) => {
      updated[`${f.section}_${f.key}`] = true;
    });
    setSelectedFields(updated);
  };

  const handleSelectHighConfidenceOnly = () => {
    const updated: Record<string, boolean> = {};
    fields.forEach((f) => {
      updated[`${f.section}_${f.key}`] = (f.confidence || 0) >= 0.85 && !f.isConflictWithVerified;
    });
    setSelectedFields(updated);
  };

  const handleDeselectAll = () => {
    setSelectedFields({});
  };

  const handleStartEdit = (f: ExtractedFieldItem) => {
    const compKey = `${f.section}_${f.key}`;
    setEditingKey(compKey);
    setTempEditValue(String(editedValues[compKey] !== undefined ? editedValues[compKey] : f.extractedValue));
  };

  const handleSaveEdit = (f: ExtractedFieldItem) => {
    const compKey = `${f.section}_${f.key}`;
    setEditedValues((prev) => ({
      ...prev,
      [compKey]: tempEditValue,
    }));
    setEditingKey(null);
  };

  const handleApplyToVerification = async (overwriteVerified = false) => {
    setIsApplying(true);
    setSuccessMessage(null);

    try {
      const fieldsToApply = fields
        .filter((f) => selectedFields[`${f.section}_${f.key}`])
        .map((f) => {
          const compKey = `${f.section}_${f.key}`;
          const finalVal = editedValues[compKey] !== undefined ? editedValues[compKey] : f.extractedValue;
          return {
            key: f.key,
            label: f.label,
            section: f.section,
            value: finalVal,
            confidence: f.confidence,
            quote: f.sourceQuote,
            sourceType: f.sourceType || (classificationType === 'APPLICATION_FORM' ? 'CLIENT_APPLICATION' : classificationType === 'VERIFICATION_FORM' ? 'VERIFICATION_FORM' : 'AI_FILLED'),
          };
        });

      const res = await api.applyExtractionToVerification(document.id, {
        clientId,
        fieldsToApply,
        appliedBy: currentUser,
        overwriteVerified,
      });

      if (res && res.success) {
        setSuccessMessage(`Successfully pre-filled ${res.appliedCount} unverified fields into Verification worksheet!`);
        if (onVerificationUpdated) onVerificationUpdated();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 4000);
      }
    } catch (err) {
      console.error('Error applying fields to verification:', err);
    } finally {
      setIsApplying(false);
    }
  };

  const handleVerifySingleField = async (f: ExtractedFieldItem) => {
    const compKey = `${f.section}_${f.key}`;
    const finalVal = editedValues[compKey] !== undefined ? editedValues[compKey] : f.extractedValue;

    try {
      const res = await api.verifyExtractedField(document.id, {
        clientId,
        section: f.section,
        key: f.key,
        verifiedValue: finalVal,
        verifiedBy: currentUser,
        notes: `Verified by ${currentUser} via AI document extraction review (${document.title})`,
      });

      if (res && res.success) {
        setSuccessMessage(`Field "${f.label}" marked as strictly Verified!`);
        if (onVerificationUpdated) onVerificationUpdated();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error verifying field:', err);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'identity':
        return <User className="w-4 h-4 text-sky-400" />;
      case 'business':
        return <Building className="w-4 h-4 text-amber-400" />;
      case 'income':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'employment':
      case 'employmentVerification':
        return <Briefcase className="w-4 h-4 text-indigo-400" />;
      case 'banking':
        return <Layers className="w-4 h-4 text-teal-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const getClassificationBadge = (type: DocumentClassificationType | string) => {
    switch (type) {
      case 'APPLICATION_FORM':
        return { label: 'Application Form', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'VERIFICATION_FORM':
        return { label: 'Verification Form', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'BANK_STATEMENT':
        return { label: 'Bank Statement', color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
      case 'DRIVERS_LICENSE':
        return { label: "Driver's License / ID", color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'TAX_RETURN':
        return { label: 'Tax Return (1040/1120)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'VOIDED_CHECK':
        return { label: 'Voided Check', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      case 'PROFIT_LOSS':
        return { label: 'Profit & Loss (P&L)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
      case 'ARTICLES_OF_INCORPORATION':
        return { label: 'Articles of Incorporation', color: 'bg-violet-500/20 text-violet-300 border-violet-500/40' };
      case 'BUSINESS_LICENSE':
        return { label: 'Business License', color: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
      default:
        return { label: type || 'Underwriting Document', color: 'bg-slate-500/20 text-slate-300 border-slate-500/40' };
    }
  };

  const classBadge = getClassificationBadge(classificationType);

  return (
    <div id="document-ai-review-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-wide">AI Document Intelligence & Verification Review</h3>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${classBadge.color}`}>
                  {classBadge.label}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {Math.round((extraction.confidenceScore || 0.9) * 100)}% Overall Confidence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Client: <span className="text-slate-200 font-medium">{clientName}</span> ({businessName}) &bull; File: <span className="text-slate-200 font-medium">{document.title || document.fileName}</span>
              </p>
            </div>
          </div>
          <button
            id="close-ai-review-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Summary Banner */}
        <div className="px-5 py-3 bg-indigo-950/20 border-b border-indigo-500/20 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-slate-300 leading-relaxed">
              <span className="font-semibold text-indigo-300">Classification & Summary: </span>
              {extraction.documentSummary || 'Document classified and fields extracted with field-level confidence scoring.'}
            </div>
          </div>
        </div>

        {/* Underwriting Verification Guard Banner */}
        <div className="px-5 py-2 bg-amber-950/30 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span><strong>Underwriting Rule:</strong> AI Filled and Application data do NOT automatically equal &quot;Call Verified&quot;. Values are pre-filled as Unverified for phone/document audit.</span>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="px-5 py-3 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Confidence & Filter Toolbar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Fields ({fields.length})
            </button>
            <button
              onClick={() => setActiveTab('high_confidence')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'high_confidence'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/30'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              High Confidence ({highConfidenceFields.length})
            </button>
            <button
              onClick={() => setActiveTab('needs_review')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'needs_review'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-amber-950/30 text-amber-300 border border-amber-500/30 hover:bg-amber-900/30'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs Review ({needsReviewFields.length})
            </button>
            {conflictFields.length > 0 && (
              <button
                onClick={() => setActiveTab('conflicts')}
                className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                  activeTab === 'conflicts'
                    ? 'bg-rose-600 text-white shadow'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/40 hover:bg-rose-900/40'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                Conflicts with Verified ({conflictFields.length})
              </button>
            )}
          </div>

          {/* Quick Selection Helpers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectHighConfidenceOnly}
              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition font-medium"
            >
              Select High Confidence
            </button>
            <button
              onClick={handleSelectAll}
              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition font-medium"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Extracted Fields List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {displayedFields.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No extracted fields in this view.</p>
            </div>
          ) : (
            displayedFields.map((field) => {
              const compKey = `${field.section}_${field.key}`;
              const isSelected = Boolean(selectedFields[compKey]);
              const currentValue = editedValues[compKey] !== undefined ? editedValues[compKey] : field.extractedValue;
              const isEditing = editingKey === compKey;
              const confPct = Math.round((field.confidence || 0.85) * 100);
              const isHighConfidence = confPct >= 85;

              return (
                <div
                  key={compKey}
                  className={`p-3.5 rounded-xl border transition-all ${
                    field.isConflictWithVerified
                      ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                      : isSelected
                      ? 'bg-slate-800/80 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFieldSelection(compKey)}
                        className="mt-1.5 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        {/* Title Bar with Section, Confidence & Source Type */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            {getSectionIcon(field.section)}
                            <span>{field.section}</span>
                          </div>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-sm font-semibold text-slate-100">{field.label}</span>
                          
                          {/* Confidence Badge */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              isHighConfidence
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {confPct}% Confidence ({isHighConfidence ? 'High' : 'Needs Review'})
                          </span>

                          {/* Source Badge */}
                          {field.sourceType && (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                              Source: {field.sourceType}
                            </span>
                          )}

                          {field.pageOrLocation && (
                            <span className="px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-800/50 rounded">
                              {field.pageOrLocation}
                            </span>
                          )}
                        </div>

                        {/* Value Display or Edit Box */}
                        <div className="mt-2 flex items-center gap-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full max-w-md">
                              <input
                                type="text"
                                value={tempEditValue}
                                onChange={(e) => setTempEditValue(e.target.value)}
                                className="px-2.5 py-1 text-xs bg-slate-950 border border-indigo-500 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
                              />
                              <button
                                onClick={() => handleSaveEdit(field)}
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition"
                                title="Save Value"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition"
                                title="Cancel"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700/60 font-mono">
                                {typeof currentValue === 'number'
                                  ? `$${currentValue.toLocaleString()}`
                                  : String(currentValue)}
                              </span>
                              <button
                                onClick={() => handleStartEdit(field)}
                                className="p-1 text-slate-400 hover:text-indigo-300 transition"
                                title="Edit extracted value"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {field.sourceQuote && (
                            <span className="text-[11px] text-slate-400 italic truncate max-w-xs" title={field.sourceQuote}>
                              &ldquo;{field.sourceQuote}&rdquo;
                            </span>
                          )}
                        </div>

                        {/* Conflict Warning or Current Status */}
                        {field.isConflictWithVerified && (
                          <div className="mt-2.5 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-rose-200">Conflict with Current Verified / Canonical Record:</p>
                              <p className="text-rose-200/90 mt-0.5">
                                Current value is <strong className="text-white font-mono">&ldquo;{String(field.currentVerifiedValue)}&rdquo;</strong>.
                                Canadian & US Underwriting Rule: Pre-filling will NOT overwrite verified status without explicit underwriter override.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Single Field Direct Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleVerifySingleField(field)}
                        className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs"
                        title="Review and mark as verified now"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirm & Verify</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Selected items will be pre-filled as <strong className="text-slate-200 font-semibold">Unverified</strong> with source tracking.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
            >
              Close
            </button>
            <button
              id="prefill-unverified-btn"
              onClick={() => handleApplyToVerification(false)}
              disabled={isApplying || Object.values(selectedFields).filter(Boolean).length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Pre-Fill...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pre-Fill Selected ({Object.values(selectedFields).filter(Boolean).length}) as &quot;Unverified&quot;</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
