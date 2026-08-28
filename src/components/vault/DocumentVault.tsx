import React, { useState } from 'react';
import {
  FolderLock,
  Search,
  FileText,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Download,
  Sparkles,
  ExternalLink,
  Eye,
  Cloud,
  FileCheck2,
  AlertTriangle,
  User,
  ShieldAlert,
  HelpCircle,
  Scale,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateUtils';
import { DocumentItem } from '../../types';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';
import { DocumentAiReviewModal } from '../documents/DocumentAiReviewModal';

interface DocumentVaultProps {
  setActiveTab: (tab: string) => void;
}

interface ConflictSummaryInfo {
  count: number;
  fields: Array<{
    label: string;
    section: string;
    extractedValue: string | number | boolean;
    conflictingValue: string | number | boolean;
    conflictingDocTitle?: string;
    reason: string;
  }>;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ setActiveTab }) => {
  const { clients, documents, setSelectedClientId } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [conflictOnlyFilter, setConflictOnlyFilter] = useState(false);
  const [activeViewingDoc, setActiveViewingDoc] = useState<DocumentItem | null>(null);
  const [activeAiReviewDoc, setActiveAiReviewDoc] = useState<DocumentItem | null>(null);

  // Build indexed map of clients for quick lookup
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // Helper to compute cross-document and verified-record conflicts for any document
  const getDocumentConflictSummary = (targetDoc: DocumentItem): ConflictSummaryInfo | null => {
    const conflicts: ConflictSummaryInfo['fields'] = [];
    const extraction = targetDoc.aiExtraction;

    if (!extraction || !extraction.extractedFields || extraction.extractedFields.length === 0) {
      return null;
    }

    // 1. Direct conflicts flagged during extraction (against verified canonical values)
    extraction.extractedFields.forEach((f) => {
      if (f.isConflictWithVerified && f.currentVerifiedValue !== undefined) {
        conflicts.push({
          label: f.label || f.key,
          section: f.section,
          extractedValue: f.extractedValue,
          conflictingValue: f.currentVerifiedValue,
          reason: `Discrepancy with verified record: "${String(f.currentVerifiedValue)}" vs extracted "${String(f.extractedValue)}"`,
        });
      }
    });

    // 2. Cross-document comparison across other documents of the same client
    const otherClientDocs = (documents || []).filter(
      (d) => d.clientId === targetDoc.clientId && d.id !== targetDoc.id && d.aiExtraction?.extractedFields
    );

    extraction.extractedFields.forEach((targetField) => {
      if (!targetField.extractedValue || String(targetField.extractedValue).trim() === '') return;
      const targetValStr = String(targetField.extractedValue).trim().toLowerCase();

      // Look for the same field key & section in other uploaded documents for this client
      otherClientDocs.forEach((otherDoc) => {
        const matchingOtherField = otherDoc.aiExtraction?.extractedFields.find(
          (of) =>
            of.key === targetField.key &&
            of.section === targetField.section &&
            of.extractedValue !== undefined &&
            String(of.extractedValue).trim() !== ''
        );

        if (matchingOtherField) {
          const otherValStr = String(matchingOtherField.extractedValue).trim().toLowerCase();
          // If values disagree significantly (case-insensitive string mismatch)
          if (targetValStr !== otherValStr) {
            // Avoid duplicate conflict entries for same field
            const alreadyAdded = conflicts.some((c) => c.label === (targetField.label || targetField.key));
            if (!alreadyAdded) {
              conflicts.push({
                label: targetField.label || targetField.key,
                section: targetField.section,
                extractedValue: targetField.extractedValue,
                conflictingValue: matchingOtherField.extractedValue,
                conflictingDocTitle: otherDoc.title || otherDoc.fileName,
                reason: `Differs from "${otherDoc.title || otherDoc.fileName}": "${String(matchingOtherField.extractedValue)}" vs "${String(targetField.extractedValue)}"`,
              });
            }
          }
        }
      });
    });

    if (conflicts.length === 0) return null;

    return {
      count: conflicts.length,
      fields: conflicts,
    };
  };

  // Merge documents with client profile data and conflict intelligence
  const allDocs = (documents || []).map((doc) => {
    const matchedClient = clientMap.get(doc.clientId);
    const conflictInfo = getDocumentConflictSummary(doc);
    return {
      ...doc,
      clientName: doc.clientName || (matchedClient ? `${matchedClient.firstName} ${matchedClient.lastName}`.trim() : 'General Client File'),
      businessName: doc.businessName || matchedClient?.businessName || 'Maple X Direct Deal',
      clientStatus: matchedClient?.currentStatus || 'No Set – Follow Up',
      conflictInfo,
      hasConflict: Boolean(conflictInfo && conflictInfo.count > 0),
    };
  });

  const totalConflictDocsCount = allDocs.filter((d) => d.hasConflict).length;

  const filteredDocs = allDocs.filter((doc) => {
    const matchesSearch =
      searchQuery === '' ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.hasConflict && 'conflict detected'.includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchesConflictOnly = !conflictOnlyFilter || doc.hasConflict;

    return matchesSearch && matchesCategory && matchesConflictOnly;
  });

  const handleOpenClient = (clientId: string) => {
    if (!clientId) return;
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  const handleViewOrDownload = (doc: DocumentItem) => {
    if (doc.driveWebViewLink) {
      window.open(doc.driveWebViewLink, '_blank', 'noopener,noreferrer');
    } else if (doc.driveFileId) {
      window.open(`/api/drive/file/${doc.driveFileId}/view`, '_blank', 'noopener,noreferrer');
    } else if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    } else {
      setActiveViewingDoc(doc);
    }
  };

  const aiAnalyzedCount = allDocs.filter((d) => Boolean(d.aiExtraction || (d as any).ocrExtraction)).length;
  const driveSyncedCount = allDocs.filter((d) => Boolean(d.storageProvider === 'google_drive' || d.driveFileId)).length;

  return (
    <div className="space-y-6 pb-12" id="document-vault-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-mono">
              Secure Operations Vault
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300 font-semibold">Total Documents: {allDocs.length}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Cloud className="w-3 h-3" />
              {driveSyncedCount} in Google Drive
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {aiAnalyzedCount} AI Analyzed
            </span>
            {totalConflictDocsCount > 0 && (
              <>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-rose-400 font-bold flex items-center gap-1 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/40">
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                  {totalConflictDocsCount} with Conflicts
                </span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-400" />
            Global Document Vault & Underwriting Repository
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted client document repository with automated AI cross-document discrepancy and conflict detection.
          </p>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="open-vault-doc-analyzer-btn"
            onClick={() => {
              const doc = allDocs.find((d) => Boolean(d.aiExtraction)) || allDocs[0];
              if (doc) {
                setActiveAiReviewDoc(doc);
              }
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            title="Open Financial Document Analyzer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>⚡ Financial Document Analyzer</span>
          </button>

          {totalConflictDocsCount > 0 && (
            <button
              onClick={() => setConflictOnlyFilter(!conflictOnlyFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                conflictOnlyFilter
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                  : 'bg-rose-950/30 text-rose-300 border-rose-500/40 hover:bg-rose-900/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{conflictOnlyFilter ? 'Showing Conflicts Only' : `Filter Conflicts (${totalConflictDocsCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by client, business, category, or filename..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Categories ({allDocs.length})</option>
            <option value="Driver's License">Driver's License</option>
            <option value="Bank Statements">Bank Statements</option>
            <option value="Tax Returns">Tax Returns</option>
            <option value="Voided Check">Voided Check</option>
            <option value="Profit & Loss">Profit & Loss</option>
            <option value="Articles of Incorporation">Articles of Incorporation</option>
            <option value="Debt Schedule">Debt Schedule</option>
            <option value="Credit Report">Credit Report</option>
            <option value="Closing Document">Closing Document</option>
            <option value="Other">Other / Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Conflict Filter Banner when Active */}
      {conflictOnlyFilter && (
        <div className="p-3 bg-rose-950/30 border border-rose-500/40 rounded-xl flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Showing <strong>{filteredDocs.length}</strong> document(s) with extracted data conflicts against verified canonical records or other client documents.
            </span>
          </div>
          <button
            onClick={() => setConflictOnlyFilter(false)}
            className="text-[11px] underline hover:text-white font-medium ml-2"
          >
            Show All Documents
          </button>
        </div>
      )}

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
          <FolderLock className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No documents found matching your criteria</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {conflictOnlyFilter
              ? 'No documents currently have conflicting data.'
              : allDocs.length === 0
              ? 'No documents have been uploaded yet. Upload documents from any Client File or via the Document Upload Modal.'
              : 'Try clearing your search or selecting a different category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const hasDriveLink = Boolean(doc.storageProvider === 'google_drive' || doc.driveFileId);
            const hasAi = Boolean(doc.aiExtraction);
            const hasConflict = Boolean(doc.hasConflict);
            const conflictInfo = doc.conflictInfo;

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl space-y-3 flex flex-col justify-between transition-all border relative group ${
                  hasConflict
                    ? 'bg-gradient-to-b from-rose-950/20 to-slate-900/80 border-rose-500/50 shadow-md shadow-rose-950/20 hover:border-rose-400'
                    : hasAi
                    ? 'bg-slate-900/60 border-indigo-900/40 hover:border-indigo-600/60'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Conflict Detected Tag with Rich Summary Tooltip */}
                      {hasConflict && conflictInfo && (
                        <div className="relative group/tooltip">
                          <button
                            onClick={() => setActiveAiReviewDoc(doc)}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1 hover:bg-rose-500/30 transition-all cursor-pointer shadow-xs animate-pulse"
                            title="Click to review conflicting extracted values"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                            <span>Conflict Detected ({conflictInfo.count})</span>
                          </button>

                          {/* Interactive Summary Tooltip */}
                          <div className="absolute right-0 top-full mt-1.5 z-40 w-72 p-3 bg-slate-950 border border-rose-500/50 rounded-xl shadow-2xl text-xs text-slate-200 hidden group-hover/tooltip:block pointer-events-none transition-all">
                            <div className="flex items-center gap-1.5 font-bold text-rose-300 border-b border-rose-500/30 pb-1.5 mb-2">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                              <span>Extracted Data Discrepancies ({conflictInfo.count})</span>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {conflictInfo.fields.slice(0, 4).map((f, i) => (
                                <div key={i} className="p-1.5 bg-slate-900/90 rounded border border-rose-500/20 text-[11px]">
                                  <div className="font-semibold text-white flex items-center justify-between">
                                    <span>{f.label}</span>
                                    <span className="text-[9px] uppercase text-rose-400 font-mono">Mismatch</span>
                                  </div>
                                  <div className="mt-1 text-slate-300">
                                    <span className="text-slate-400">This Doc: </span>
                                    <strong className="text-rose-300 font-mono">&ldquo;{String(f.extractedValue)}&rdquo;</strong>
                                  </div>
                                  <div className="text-slate-300">
                                    <span className="text-slate-400">Target / Other: </span>
                                    <strong className="text-emerald-300 font-mono">&ldquo;{String(f.conflictingValue)}&rdquo;</strong>
                                  </div>
                                </div>
                              ))}
                              {conflictInfo.fields.length > 4 && (
                                <div className="text-[10px] text-slate-400 text-center italic">
                                  +{conflictInfo.fields.length - 4} more conflict item(s)...
                                </div>
                              )}
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-indigo-300 font-medium text-center">
                              Click &ldquo;AI Data&rdquo; or &ldquo;Conflict Detected&rdquo; to review &amp; resolve.
                            </div>
                          </div>
                        </div>
                      )}

                      {hasDriveLink && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center gap-0.5">
                          <Cloud className="w-2.5 h-2.5" />
                          Drive
                        </span>
                      )}
                      {hasAi && (
                        <button
                          onClick={() => setActiveAiReviewDoc(doc)}
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 transition-colors ${
                            hasConflict
                              ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30'
                          }`}
                          title="View AI Extraction Details"
                        >
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                          <span>AI Data</span>
                        </button>
                      )}
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono font-bold">
                        {doc.status || 'RECEIVED'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-slate-100 mt-2.5 leading-snug line-clamp-2">
                    {doc.title || doc.fileName}
                  </div>
                  <div className="text-xs text-blue-400 font-medium mt-1 flex items-center gap-1.5">
                    <User className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.clientName}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 truncate">{doc.businessName}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">
                    {doc.fileName} • {doc.fileSize || 'Standard'}
                  </div>

                  {/* Conflict summary inline banner */}
                  {hasConflict && conflictInfo && (
                    <div className="mt-2.5 p-2 bg-rose-950/30 border border-rose-500/30 rounded-lg text-[11px] text-rose-200 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-semibold text-rose-100">Discrepancy Detected: </span>
                        {conflictInfo.fields[0]?.label} differs from verified record or other documents.
                        {conflictInfo.count > 1 && ` (+${conflictInfo.count - 1} more)`}
                      </div>
                    </div>
                  )}

                  {doc.notes && !hasConflict && (
                    <div className="text-[11px] text-slate-300 italic mt-2 p-2 bg-slate-950/80 rounded-lg border border-slate-800/60">
                      "{doc.notes}"
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {formatDate(doc.uploadedDate, 'Recent')}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleViewOrDownload(doc)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 hover:text-white"
                      title="Open Document in Google Drive / Viewer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleOpenClient(doc.clientId)}
                      className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-xs font-medium transition-colors border border-blue-500/30 flex items-center gap-1"
                      title="Open Client File"
                    >
                      <span>Open File</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {activeViewingDoc && (
        <DocumentViewerModal
          isOpen={Boolean(activeViewingDoc)}
          onClose={() => setActiveViewingDoc(null)}
          document={activeViewingDoc}
          onOpenReviewModal={(d) => setActiveAiReviewDoc(d)}
          onDocumentUpdated={() => {}}
        />
      )}

      {activeAiReviewDoc && (
        <DocumentAiReviewModal
          isOpen={Boolean(activeAiReviewDoc)}
          onClose={() => setActiveAiReviewDoc(null)}
          document={activeAiReviewDoc}
          clientId={activeAiReviewDoc.clientId}
          clientName={activeAiReviewDoc.clientName || 'Client'}
          businessName={activeAiReviewDoc.businessName || ''}
          onVerificationUpdated={() => {}}
        />
      )}
    </div>
  );
};

