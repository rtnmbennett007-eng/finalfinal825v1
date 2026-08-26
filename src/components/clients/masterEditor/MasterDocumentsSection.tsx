import React, { useState } from 'react';
import {
  FolderLock,
  Upload,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Download,
  Sparkles,
  RefreshCw,
  Eye,
  FileCheck
} from 'lucide-react';
import { DocumentCategoryType, DocumentItem, MasterVerificationData } from '../../../types';
import { api } from '../../../services/api';
import { DocumentAiReviewModal } from '../../documents/DocumentAiReviewModal';

interface MasterDocumentsSectionProps {
  clientId: string;
  clientName?: string;
  businessName?: string;
  documents: DocumentItem[];
  onChangeDocuments: (updatedDocs: DocumentItem[]) => void;
  onVerificationUpdated?: () => void;
}

const DOCUMENT_CATEGORIES: DocumentCategoryType[] = [
  "Driver's License",
  'Bank Statements',
  'Tax Returns',
  'Voided Check',
  'Profit & Loss',
  'Articles of Incorporation',
  'Business License',
  'Pay Stubs',
  'Other',
];

export const MasterDocumentsSection: React.FC<MasterDocumentsSectionProps> = ({
  clientId,
  clientName = 'Client',
  businessName = 'Business',
  documents,
  onChangeDocuments,
  onVerificationUpdated,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategoryType>("Driver's License");
  const [autoExtractAi, setAutoExtractAi] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeReviewDoc, setActiveReviewDoc] = useState<DocumentItem | null>(null);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsProcessing(true);
    const fileName = `${newTitle.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`;

    try {
      if (autoExtractAi) {
        const result = await api.uploadAndAnalyzeDocument({
          clientId,
          title: newTitle.trim(),
          fileName,
          fileSize: '1.4 MB',
          category: newCategory,
          uploadedBy: 'Dana Javier',
        });

        if (result && result.document) {
          onChangeDocuments([...documents, result.document]);
          setNewTitle('');
          // Automatically prompt the review modal if extraction succeeded
          if (result.document.aiExtraction) {
            setActiveReviewDoc(result.document);
          }
        } else {
          // Fallback manual doc
          const fallbackDoc: DocumentItem = {
            id: `doc-${Date.now()}`,
            clientId,
            category: newCategory,
            title: newTitle.trim(),
            fileName,
            fileSize: '1.4 MB',
            uploadedBy: 'Dana Javier',
            uploadedDate: new Date().toISOString(),
            status: 'RECEIVED',
          };
          onChangeDocuments([...documents, fallbackDoc]);
          setNewTitle('');
        }
      } else {
        const manualDoc: DocumentItem = {
          id: `doc-${Date.now()}`,
          clientId,
          category: newCategory,
          title: newTitle.trim(),
          fileName,
          fileSize: '1.4 MB',
          uploadedBy: 'Dana Javier',
          uploadedDate: new Date().toISOString(),
          status: 'RECEIVED',
        };
        onChangeDocuments([...documents, manualDoc]);
        setNewTitle('');
      }
    } catch (err) {
      console.error('Document upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerAiScan = async (doc: DocumentItem) => {
    setIsProcessing(true);
    try {
      const extraction = await api.analyzeDocument({
        docId: doc.id,
        clientId,
        fileName: doc.fileName,
        categoryHint: doc.category,
      });
      if (extraction) {
        const updatedDocs = documents.map((d) =>
          d.id === doc.id
            ? {
                ...d,
                aiExtraction: extraction,
                category: extraction.detectedCategory || d.category,
              }
            : d
        );
        onChangeDocuments(updatedDocs);
        const updated = updatedDocs.find((d) => d.id === doc.id);
        if (updated) {
          setActiveReviewDoc(updated);
        }
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = (id: string, status: DocumentItem['status']) => {
    const updated = documents.map((d) => (d.id === id ? { ...d, status } : d));
    onChangeDocuments(updated);
  };

  const handleDeleteDoc = (id: string) => {
    onChangeDocuments(documents.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Upload / Add New Document Form */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <Upload className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Upload Document with AI Underwriting Reader
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={autoExtractAi}
                onChange={(e) => setAutoExtractAi(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-indigo-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
              />
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Auto-extract with AI & Pre-Fill Worksheet</span>
            </label>
          </div>
        </div>

        <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. 2024 Business Tax Returns (1120-S), 3 Months Bank Statements"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as DocumentCategoryType)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!newTitle.trim() || isProcessing}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Upload to Vault</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Document List */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <FolderLock className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Client Document Vault ({documents.length} Files)
            </h4>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-slate-400">No documents registered in this client file.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const hasAi = Boolean(doc.aiExtraction);
              const fieldCount = doc.aiExtraction?.extractedFields?.length || 0;

              return (
                <div
                  key={doc.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 gap-3 text-xs"
                >
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-100">{doc.title}</span>
                        {hasAi && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                            <span>AI Parsed ({fieldCount} fields)</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {doc.category} &bull; {doc.fileSize || '1.2 MB'} &bull; Uploaded by {doc.uploadedBy || 'Staff'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 flex-wrap">
                    {hasAi ? (
                      <button
                        type="button"
                        onClick={() => setActiveReviewDoc(doc)}
                        className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Review AI Data</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleTriggerAiScan(doc)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Run AI Scan</span>
                      </button>
                    )}

                    <select
                      value={doc.status || 'RECEIVED'}
                      onChange={(e) => handleUpdateStatus(doc.id, e.target.value as any)}
                      className="bg-[#0b1528] border border-blue-900/60 rounded-lg p-1.5 text-[11px] text-slate-200 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="REVIEWED">REVIEWED / VERIFIED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                      title="Delete Document"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Review Modal */}
      {activeReviewDoc && (
        <DocumentAiReviewModal
          isOpen={Boolean(activeReviewDoc)}
          onClose={() => setActiveReviewDoc(null)}
          document={activeReviewDoc}
          clientId={clientId}
          clientName={clientName}
          businessName={businessName}
          onVerificationUpdated={onVerificationUpdated}
        />
      )}
    </div>
  );
};

