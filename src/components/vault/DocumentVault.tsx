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
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { formatDate } from '../../utils/dateUtils';
import { DocumentItem } from '../../types';
import { DocumentViewerModal } from '../documents/DocumentViewerModal';
import { DocumentAiReviewModal } from '../documents/DocumentAiReviewModal';

interface DocumentVaultProps {
  setActiveTab: (tab: string) => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ setActiveTab }) => {
  const { clients, documents, setSelectedClientId } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeViewingDoc, setActiveViewingDoc] = useState<DocumentItem | null>(null);
  const [activeAiReviewDoc, setActiveAiReviewDoc] = useState<DocumentItem | null>(null);

  // Build indexed map of clients for quick lookup
  const clientMap = new Map(clients.map((c) => [c.id, c]));

  // Merge documents with client profile data
  const allDocs = (documents || []).map((doc) => {
    const matchedClient = clientMap.get(doc.clientId);
    return {
      ...doc,
      clientName: doc.clientName || (matchedClient ? `${matchedClient.firstName} ${matchedClient.lastName}`.trim() : 'General Client File'),
      businessName: doc.businessName || matchedClient?.businessName || 'Maple X Direct Deal',
      clientStatus: matchedClient?.currentStatus || 'No Set – Follow Up',
    };
  });

  const filteredDocs = allDocs.filter((doc) => {
    const matchesSearch =
      searchQuery === '' ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;

    return matchesSearch && matchesCategory;
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
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-2 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-400" />
            Global Document Vault & Underwriting Repository
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted client document repository synchronized with Google Drive service account storage.
          </p>
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

      {/* Document Grid */}
      {filteredDocs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl space-y-3">
          <FolderLock className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="text-sm font-semibold text-slate-300">No documents found matching your criteria</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {allDocs.length === 0
              ? 'No documents have been uploaded yet. Upload documents from any Client File or via the Document Upload Modal.'
              : 'Try clearing your search or selecting a different category filter.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const hasDriveLink = Boolean(doc.storageProvider === 'google_drive' || doc.driveFileId);
            const hasAi = Boolean(doc.aiExtraction);

            return (
              <div
                key={doc.id}
                className={`p-4 rounded-xl space-y-3 flex flex-col justify-between transition-all border ${
                  hasAi
                    ? 'bg-slate-900/60 border-indigo-900/40 hover:border-indigo-600/60'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold uppercase tracking-wider">
                      {doc.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {hasDriveLink && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold flex items-center gap-0.5">
                          <Cloud className="w-2.5 h-2.5" />
                          Drive
                        </span>
                      )}
                      {hasAi && (
                        <button
                          onClick={() => setActiveAiReviewDoc(doc)}
                          className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold flex items-center gap-1 hover:bg-indigo-500/30 transition-colors"
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

                  {doc.notes && (
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
