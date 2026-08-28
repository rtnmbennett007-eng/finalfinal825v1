import React, { useState, useEffect } from 'react';
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
  Scale,
  ShieldAlert,
  Upload,
  ChevronDown
} from 'lucide-react';
import {
  DocumentItem,
  ExtractedFieldItem,
  MasterVerificationData,
  DocumentClassificationType
} from '../../types';
import { api } from '../../services/api';

interface DocumentAiReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem;
  availableDocuments?: DocumentItem[];
  onSelectDocument?: (doc: DocumentItem) => void;
  clientId: string;
  clientName: string;
  businessName: string;
  currentVerification?: MasterVerificationData | null;
  onVerificationUpdated?: () => void;
  onClientUpdated?: (client: any) => void;
  currentUser?: string;
}

export const DocumentAiReviewModal: React.FC<DocumentAiReviewModalProps> = ({
  isOpen,
  onClose,
  document: initialDocument,
  availableDocuments = [],
  onSelectDocument,
  clientId,
  clientName,
  businessName,
  currentVerification,
  onVerificationUpdated,
  onClientUpdated,
  currentUser = 'Staff Underwriter',
}) => {
  const [currentDoc, setCurrentDoc] = useState<DocumentItem>(initialDocument);
  const [isApplying, setIsApplying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>({});
  const [acceptedFields, setAcceptedFields] = useState<Record<string, boolean>>({});
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempEditValue, setTempEditValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'high_confidence' | 'needs_review' | 'conflicts'>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    setCurrentDoc(initialDocument);
  }, [initialDocument]);

  const extraction = currentDoc?.aiExtraction;

  // Initialize selected fields
  useEffect(() => {
    if (extraction?.extractedFields) {
      const initialSel: Record<string, boolean> = {};
      extraction.extractedFields.forEach((f) => {
        initialSel[`${f.section}_${f.key}`] = !f.isConflictWithVerified;
      });
      setSelectedFields(initialSel);
    }
  }, [extraction]);

  if (!isOpen || !currentDoc) return null;

  const fields = extraction?.extractedFields || [];
  const highConfidenceFields = fields.filter((f) => (f.confidence || 0) >= 0.90);
  const needsReviewFields = fields.filter((f) => (f.confidence || 0) < 0.90);
  const conflictFields = fields.filter((f) => f.isConflictWithVerified);

  const classificationType = extraction?.classificationType || 'OTHER';

  const displayedFields = fields.filter((f) => {
    if (activeTab === 'high_confidence') return (f.confidence || 0) >= 0.90;
    if (activeTab === 'needs_review') return (f.confidence || 0) < 0.90;
    if (activeTab === 'conflicts') return Boolean(f.isConflictWithVerified);
    return true;
  });

  const getConfidenceMeta = (confidence?: number) => {
    const score = confidence !== undefined ? confidence : 0.85;
    const pct = Math.round(score * 100);
    if (pct >= 90) {
      return {
        pct,
        tier: 'HIGH',
        colorBadge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        dot: 'bg-emerald-400',
        label: 'High (>=90%)',
      };
    }
    if (pct >= 70) {
      return {
        pct,
        tier: 'MEDIUM',
        colorBadge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        dot: 'bg-amber-400',
        label: 'Amber (70-89%)',
      };
    }
    return {
      pct,
      tier: 'LOW',
      colorBadge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      dot: 'bg-rose-400',
      label: 'Red (<70%)',
    };
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
      updated[`${f.section}_${f.key}`] = (f.confidence || 0) >= 0.90 && !f.isConflictWithVerified;
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

  // Accept a SINGLE field to Master File
  const handleAcceptSingleFieldToMaster = async (field: ExtractedFieldItem) => {
    const compKey = `${field.section}_${field.key}`;
    const finalVal = editedValues[compKey] !== undefined ? editedValues[compKey] : field.extractedValue;

    // Strict rule: Extracted values must NOT overwrite Call Verified values
    if (field.isConflictWithVerified) {
      setConflictWarning(
        `CONFLICT PROTECTED: Field "${field.label}" has a Call-Verified canonical value ("${String(
          field.currentVerifiedValue
        )}"). Underwriting policy strictly forbids overwriting Call-Verified values with unverified AI extractions.`
      );
      setTimeout(() => setConflictWarning(null), 6000);
      return;
    }

    try {
      const fieldPayload = {
        key: field.key,
        label: field.label,
        section: field.section,
        value: finalVal,
        confidence: field.confidence || 0.95,
        quote: field.sourceQuote,
        sourceType: field.sourceType || 'AI_FILLED',
      };

      const res = await api.applyExtractionToVerification(currentDoc.id, {
        clientId,
        fieldsToApply: [fieldPayload],
        appliedBy: currentUser,
        overwriteVerified: false,
      });

      if (res && res.success) {
        setAcceptedFields((prev) => ({ ...prev, [compKey]: true }));
        setSuccessMessage(`Accepted "${field.label}" to Master File successfully.`);
        if (onVerificationUpdated) onVerificationUpdated();
        if (onClientUpdated && res.client) onClientUpdated(res.client);
        setTimeout(() => setSuccessMessage(null), 3500);
      }
    } catch (err) {
      console.error('Error accepting field to master file:', err);
    }
  };

  // Batch Accept ALL High-Confidence Fields (>=90%)
  const handleAcceptAllHighConfidenceFields = async () => {
    setIsApplying(true);
    setSuccessMessage(null);
    setConflictWarning(null);

    try {
      const highConfToApply = fields
        .filter((f) => (f.confidence || 0) >= 0.90 && !f.isConflictWithVerified)
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
            sourceType: f.sourceType || 'AI_FILLED',
          };
        });

      if (highConfToApply.length === 0) {
        setConflictWarning('No eligible high-confidence (>=90%) fields to accept (or all conflict with Call Verified data).');
        setTimeout(() => setConflictWarning(null), 4000);
        setIsApplying(false);
        return;
      }

      const res = await api.applyExtractionToVerification(currentDoc.id, {
        clientId,
        fieldsToApply: highConfToApply,
        appliedBy: currentUser,
        overwriteVerified: false,
      });

      if (res && res.success) {
        const newlyAccepted: Record<string, boolean> = { ...acceptedFields };
        highConfToApply.forEach((item) => {
          newlyAccepted[`${item.section}_${item.key}`] = true;
        });
        setAcceptedFields(newlyAccepted);

        let msg = `Accepted ${res.appliedCount} High-Confidence (>=90%) fields to Master File.`;
        if (res.skippedVerifiedCount > 0) {
          msg += ` Preserved ${res.skippedVerifiedCount} Call-Verified records without overwrite.`;
        }
        setSuccessMessage(msg);
        if (onVerificationUpdated) onVerificationUpdated();
        if (onClientUpdated && res.client) onClientUpdated(res.client);
        setTimeout(() => setSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error batch accepting high confidence fields:', err);
    } finally {
      setIsApplying(false);
    }
  };

  // Re-run or run AI scan
  const handleTriggerAiScan = async () => {
    setIsAnalyzing(true);
    setSuccessMessage(null);
    try {
      const res = await api.analyzeDocument({
        docId: currentDoc.id,
        clientId,
        fileName: currentDoc.fileName || currentDoc.title,
        categoryHint: currentDoc.category,
      });

      if (res && res.extractedFields) {
        setCurrentDoc({
          ...currentDoc,
          aiExtraction: res,
        });
        setSuccessMessage('AI Extraction complete! Extracted fields refreshed with confidence ratings.');
        if (onVerificationUpdated) onVerificationUpdated();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Error analyzing document:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'identity':
        return <User className="w-3.5 h-3.5 text-sky-400" />;
      case 'business':
        return <Building className="w-3.5 h-3.5 text-amber-400" />;
      case 'income':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'employment':
      case 'employmentVerification':
        return <Briefcase className="w-3.5 h-3.5 text-indigo-400" />;
      case 'banking':
        return <Layers className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <FileText className="w-3.5 h-3.5 text-slate-400" />;
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
  const eligibleHighConfCount = highConfidenceFields.filter((f) => !f.isConflictWithVerified).length;

  return (
    <div id="financial-document-analyzer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* 1. Header with Document Selection & Actions */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-wide">Financial Document Analyzer</h3>
                <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${classBadge.color}`}>
                  {classBadge.label}
                </span>
                {extraction && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    {Math.round((extraction.confidenceScore || 0.9) * 100)}% Match
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Client: <span className="text-slate-200 font-semibold">{clientName}</span> ({businessName}) &bull; Active File:{' '}
                <span className="text-amber-300 font-mono font-medium">{currentDoc.fileName || currentDoc.title}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            {/* Accept All High-Confidence Button in Header */}
            <button
              id="accept-all-high-confidence-header-btn"
              onClick={handleAcceptAllHighConfidenceFields}
              disabled={isApplying || eligibleHighConfCount === 0}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              title="Accept all fields with >=90% confidence that do not conflict with Call-Verified values"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Accept All High-Confidence ({eligibleHighConfCount})</span>
            </button>

            <button
              onClick={handleTriggerAiScan}
              disabled={isAnalyzing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-purple-300 border border-purple-500/40 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Re-run Document AI Extraction pipeline"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing...' : 'Re-run AI'}</span>
            </button>

            <button
              id="close-document-analyzer-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Close Analyzer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Document Selection Bar (Bank Statement, Tax Return, P&L, Voided Check) */}
        {availableDocuments.length > 1 && (
          <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              Select Document:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {availableDocuments.map((doc) => {
                const isSelected = doc.id === currentDoc.id;
                return (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setCurrentDoc(doc);
                      if (onSelectDocument) onSelectDocument(doc);
                    }}
                    className={`px-3 py-1 text-xs rounded-lg font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span className="truncate max-w-[160px]">{doc.title || doc.fileName}</span>
                    {doc.aiExtraction && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-emerald-400'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Underwriting Rules & Notifications */}
        <div className="px-5 py-2 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Underwriting Standard:</strong> Extracted values must NOT overwrite Call-Verified records. Any discrepancy is flagged as an active conflict for underwriter review.
            </span>
          </div>
        </div>

        {/* Dynamic Alerts */}
        {successMessage && (
          <div className="px-5 py-2.5 bg-emerald-950/60 border-b border-emerald-500/40 flex items-center justify-between text-xs text-emerald-300 animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
          </div>
        )}

        {conflictWarning && (
          <div className="px-5 py-2.5 bg-rose-950/80 border-b border-rose-500/50 flex items-center justify-between text-xs text-rose-200 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{conflictWarning}</span>
            </div>
          </div>
        )}

        {/* 4. Filter Toolbar & Confidence Tiers */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Extracted Fields ({fields.length})
            </button>
            <button
              onClick={() => setActiveTab('high_confidence')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'high_confidence'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-emerald-950/30 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Green &gt;=90% ({highConfidenceFields.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('needs_review')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                activeTab === 'needs_review'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-amber-950/30 text-amber-300 border border-amber-500/30 hover:bg-amber-900/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Amber &lt;90% ({needsReviewFields.length})</span>
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
                <span>Conflicts ({conflictFields.length})</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectHighConfidenceOnly}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition font-medium"
            >
              Select &gt;=90%
            </button>
            <button
              onClick={handleSelectAll}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition font-medium"
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              className="text-[11px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded transition font-medium"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 5. Extracted Fields List (Showing all required fields) */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 bg-slate-900/95">
          {!extraction ? (
            <div className="text-center py-16 text-slate-400">
              <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
              <h4 className="text-base font-bold text-slate-200">No AI Extraction Available Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Click &quot;Run AI Extraction&quot; to parse this document and extract financial indicators with confidence scoring.
              </p>
              <button
                onClick={handleTriggerAiScan}
                disabled={isAnalyzing}
                className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition"
              >
                {isAnalyzing ? 'Extracting Data...' : 'Run AI Extraction Now'}
              </button>
            </div>
          ) : displayedFields.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText className="w-10 h-10 mx-auto text-slate-600 mb-2" />
              <p>No extracted fields match this filter tab.</p>
            </div>
          ) : (
            displayedFields.map((field) => {
              const compKey = `${field.section}_${field.key}`;
              const isSelected = Boolean(selectedFields[compKey]);
              const isAccepted = Boolean(acceptedFields[compKey]);
              const currentValue = editedValues[compKey] !== undefined ? editedValues[compKey] : field.extractedValue;
              const isEditing = editingKey === compKey;
              const confMeta = getConfidenceMeta(field.confidence);
              const sourceDocName = field.sourceDocTitle || currentDoc.fileName || currentDoc.title || 'Document';
              const pageNumber = field.pageOrLocation || 'Page 1';

              return (
                <div
                  key={compKey}
                  className={`p-4 rounded-xl border transition-all ${
                    field.isConflictWithVerified
                      ? 'bg-rose-950/20 border-rose-500/50 shadow-sm'
                      : isAccepted
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm'
                      : isSelected
                      ? 'bg-slate-800/90 border-indigo-500/40 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-85'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: Checkbox + Field Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setSelectedFields((prev) => ({
                            ...prev,
                            [compKey]: !prev[compKey],
                          }))
                        }
                        className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-800 cursor-pointer shrink-0"
                      />

                      <div className="flex-1 min-w-0">
                        {/* Title Bar & Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                            {getSectionIcon(field.section)}
                            <span>{field.section}</span>
                          </div>
                          <span className="text-slate-600">&bull;</span>
                          <span className="text-sm font-bold text-slate-100">{field.label}</span>

                          {/* Confidence Indicator: Green >=90%, Amber 70-89%, Red <70% */}
                          <span
                            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border flex items-center gap-1.5 ${confMeta.colorBadge}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${confMeta.dot}`} />
                            <span>{confMeta.pct}% Confidence ({confMeta.label})</span>
                          </span>

                          {/* Source Document File Name */}
                          <span className="px-2 py-0.5 text-[10px] font-mono text-slate-300 bg-slate-800 rounded border border-slate-700">
                            Source: {sourceDocName}
                          </span>

                          {/* Page Number */}
                          <span className="px-2 py-0.5 text-[10px] text-indigo-300 bg-indigo-950/50 border border-indigo-800/40 rounded">
                            {pageNumber}
                          </span>
                        </div>

                        {/* Extracted Value Display or Edit Box */}
                        <div className="mt-2.5 flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-semibold text-slate-400">Extracted Value:</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={tempEditValue}
                                onChange={(e) => setTempEditValue(e.target.value)}
                                className="px-2.5 py-1 text-xs bg-slate-950 border border-indigo-500 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-400 w-48"
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
                              <span className="text-sm font-bold text-white bg-slate-950 px-3 py-1 rounded-lg border border-slate-700/80 font-mono">
                                {typeof currentValue === 'number'
                                  ? field.key.toLowerCase().includes('revenue') ||
                                    field.key.toLowerCase().includes('deposit') ||
                                    field.key.toLowerCase().includes('balance') ||
                                    field.key.toLowerCase().includes('amount') ||
                                    field.key.toLowerCase().includes('debit')
                                    ? `$${currentValue.toLocaleString()}`
                                    : currentValue.toLocaleString()
                                  : String(currentValue)}
                              </span>
                              <button
                                onClick={() => handleStartEdit(field)}
                                className="p-1 text-slate-400 hover:text-indigo-300 transition"
                                title="Edit extracted value before accepting"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {field.sourceQuote && (
                            <span className="text-[11px] text-slate-400 italic max-w-sm truncate" title={field.sourceQuote}>
                              &ldquo;{field.sourceQuote}&rdquo;
                            </span>
                          )}
                        </div>

                        {/* Conflict Warning */}
                        {field.isConflictWithVerified && (
                          <div className="mt-2.5 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-rose-300">Conflict with Call-Verified Master Record:</p>
                              <p className="text-rose-200/90 mt-0.5">
                                Current Call-Verified value is <strong className="text-white font-mono">&ldquo;{String(field.currentVerifiedValue)}&rdquo;</strong>.
                                Canadian & US Underwriting Rule: AI extractions are flagged as conflicts and cannot overwrite Call-Verified status.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: "Accept to Master File" Button */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center mt-2 lg:mt-0">
                      <button
                        id={`accept-master-${compKey}`}
                        onClick={() => handleAcceptSingleFieldToMaster(field)}
                        disabled={field.isConflictWithVerified}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                          isAccepted
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                            : field.isConflictWithVerified
                            ? 'bg-rose-950/30 text-rose-400 border border-rose-800/40 opacity-60 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
                        }`}
                        title={
                          field.isConflictWithVerified
                            ? 'Blocked: Call-Verified record exists'
                            : 'Accept this extracted field into the Master File'
                        }
                      >
                        {isAccepted ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Accepted to Master</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                            <span>Accept to Master File</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 6. Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Values accepted to Master File update Canonical Client data and Verification Worksheet with source audit stamps.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition"
            >
              Close
            </button>
            <button
              id="accept-all-high-confidence-footer-btn"
              onClick={handleAcceptAllHighConfidenceFields}
              disabled={isApplying || eligibleHighConfCount === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition cursor-pointer"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Accepting Fields...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept All High-Confidence Fields ({eligibleHighConfCount})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
