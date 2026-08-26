import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  ShieldCheck,
  Building,
  User,
  DollarSign,
  Briefcase,
  Layers,
  ChevronRight,
  Info,
  RefreshCw,
  Edit2,
  Check
} from 'lucide-react';
import { DocumentItem, DocumentAiExtractionResult, ExtractedFieldItem, MasterVerificationData } from '../../types';
import { api } from '../../services/api';

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
  const [activeTab, setActiveTab] = useState<'all' | 'unverified' | 'conflicts'>('all');
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
  const conflicts = fields.filter((f) => f.isConflictWithVerified);
  const unverified = fields.filter((f) => !f.isConflictWithVerified);

  const displayedFields = fields.filter((f) => {
    if (activeTab === 'conflicts') return f.isConflictWithVerified;
    if (activeTab === 'unverified') return !f.isConflictWithVerified;
    return true;
  });

  const toggleFieldSelection = (compositeKey: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [compositeKey]: !prev[compositeKey],
    }));
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

  return (
    <div id="document-ai-review-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">AI Document Intelligence Center</h3>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {extraction.detectedCategory}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {(extraction.confidenceScore * 100).toFixed(0)}% Confidence
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client: <span className="text-slate-200 font-medium">{clientName}</span> ({businessName}) &bull; Source: <span className="text-slate-200 font-medium">{document.title || document.fileName}</span>
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
        <div className="px-5 py-3.5 bg-indigo-950/20 border-b border-indigo-500/20 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-indigo-300">Extraction Summary: </span>
            {extraction.documentSummary || 'Document scanned and parsed according to Maple X underwriting standards.'}
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

        {/* Filter Tabs & Selection Counter */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Extracted Fields ({fields.length})
            </button>
            <button
              onClick={() => setActiveTab('unverified')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                activeTab === 'unverified'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Ready to Pre-Fill ({unverified.length})
            </button>
            {conflicts.length > 0 && (
              <button
                onClick={() => setActiveTab('conflicts')}
                className={`px-3 py-1 rounded-md transition font-medium flex items-center gap-1.5 ${
                  activeTab === 'conflicts'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/40'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Verified Conflicts ({conflicts.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>Selected for pre-fill: <strong className="text-white">{Object.values(selectedFields).filter(Boolean).length}</strong> of {fields.length}</span>
          </div>
        </div>

        {/* Extracted Fields List */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {displayedFields.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No extracted fields in this category.</p>
            </div>
          ) : (
            displayedFields.map((field) => {
              const compKey = `${field.section}_${field.key}`;
              const isSelected = Boolean(selectedFields[compKey]);
              const currentValue = editedValues[compKey] !== undefined ? editedValues[compKey] : field.extractedValue;
              const isEditing = editingKey === compKey;

              return (
                <div
                  key={compKey}
                  className={`p-3.5 rounded-lg border transition ${
                    field.isConflictWithVerified
                      ? 'bg-amber-950/15 border-amber-500/30'
                      : isSelected
                      ? 'bg-slate-800/80 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-900 border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFieldSelection(compKey)}
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            {getSectionIcon(field.section)}
                            <span>{field.section}</span>
                          </div>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-sm font-semibold text-slate-100">{field.label}</span>
                          <span className="px-1.5 py-0.2 text-[10px] font-medium rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {field.pageOrLocation || 'Document'}
                          </span>
                        </div>

                        {/* Value Display or Edit Box */}
                        <div className="mt-1.5 flex items-center gap-3">
                          {isEditing ? (
                            <div className="flex items-center gap-2 w-full max-w-md">
                              <input
                                type="text"
                                value={tempEditValue}
                                onChange={(e) => setTempEditValue(e.target.value)}
                                className="px-2.5 py-1 text-xs bg-slate-950 border border-indigo-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-full"
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
                              <span className="text-base font-bold text-white bg-slate-950/70 px-2.5 py-1 rounded border border-slate-700/60">
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
                          <div className="mt-2 p-2 bg-amber-950/40 border border-amber-500/30 rounded text-xs text-amber-300 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold">Conflict with Current Verified Record:</p>
                              <p className="text-amber-200/90 mt-0.5">
                                Current Verified Value is <strong className="text-white">&ldquo;{String(field.currentVerifiedValue)}&rdquo;</strong>.
                                Canadian/US Underwriting Rule: Pre-filling will NOT overwrite verified status without explicit confirmation.
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
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded text-xs font-semibold flex items-center gap-1 transition"
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
            <span>AI extracted fields are saved as <strong className="text-slate-200">Unverified</strong> until caller phone confirmation.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition"
            >
              Close
            </button>
            <button
              id="prefill-unverified-btn"
              onClick={() => handleApplyToVerification(false)}
              disabled={isApplying || Object.values(selectedFields).filter(Boolean).length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-2 transition"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Pre-Filling...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Pre-Fill Selected as &quot;Unverified&quot;</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
