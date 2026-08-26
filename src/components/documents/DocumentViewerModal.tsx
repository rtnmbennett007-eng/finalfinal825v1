import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  File as FileIcon,
  Sparkles,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { DocumentItem } from '../../types';
import { api } from '../../services/api';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onOpenReviewModal?: (doc: DocumentItem) => void;
  onDocumentUpdated?: (doc: DocumentItem) => void;
  currentUser?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  onOpenReviewModal,
  onDocumentUpdated,
  currentUser = 'Staff Underwriter',
}) => {
  const [isRetryingAi, setIsRetryingAi] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  if (!isOpen || !doc) return null;

  const fileName = doc.fileName || doc.title || 'document';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isPdf = ext === 'pdf' || doc.fileMimeType?.includes('pdf');
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'tif', 'tiff'].includes(ext) || doc.fileMimeType?.startsWith('image/');
  const isSpreadsheet = ['xls', 'xlsx', 'csv'].includes(ext) || doc.fileMimeType?.includes('spreadsheet') || doc.fileMimeType?.includes('csv');
  const isText = ['txt', 'rtf', 'xml', 'json'].includes(ext) || doc.fileMimeType?.startsWith('text/');

  const fileDataSrc = doc.fileBase64 || doc.fileUrl || (doc.driveFileId ? `/api/drive/file/${doc.driveFileId}/view` : '');

  const handleDownload = () => {
    if (doc.driveFileId) {
      window.open(`/api/drive/file/${doc.driveFileId}/download`, '_blank');
      return;
    }
    if (doc.fileBase64 && doc.fileBase64.includes('base64,')) {
      const link = window.document.createElement('a');
      link.href = doc.fileBase64;
      link.download = doc.fileName || 'downloaded_document';
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
      window.open(doc.fileUrl, '_blank');
    } else {
      // Trigger backend download endpoint
      window.open(`/api/documents/${doc.id}/download`, '_blank');
    }
  };

  const handleRetryAi = async () => {
    setIsRetryingAi(true);
    setRetryMessage(null);
    try {
      const res = await api.retryAiDocumentAnalysis(doc.id, currentUser);
      if (res && res.document) {
        if (onDocumentUpdated) onDocumentUpdated(res.document);
        setRetryMessage(`Successfully extracted ${res.extraction?.extractedFields?.length || 0} fields with AI!`);
      } else {
        setRetryMessage('AI analysis retried, document status updated.');
      }
    } catch (err: any) {
      setRetryMessage(err.message || 'Retry failed');
    } finally {
      setIsRetryingAi(false);
      setTimeout(() => setRetryMessage(null), 4000);
    }
  };

  const getFileIcon = () => {
    if (isPdf) return <FileText className="w-6 h-6 text-red-400" />;
    if (isSpreadsheet) return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    if (isImage) return <FileImage className="w-6 h-6 text-purple-400" />;
    if (isText) return <FileCode className="w-6 h-6 text-slate-400" />;
    return <FileIcon className="w-6 h-6 text-amber-400" />;
  };

  return (
    <div
      id="document-viewer-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        id="document-viewer-modal-card"
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/95 shrink-0">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
              {getFileIcon()}
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white truncate max-w-md">
                  {doc.title || doc.fileName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700 shrink-0">
                  {doc.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {doc.fileName} • {doc.fileSize} • Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {(doc.driveWebViewLink || doc.driveFileId) && (
              <a
                id="open-drive-modal-btn"
                href={doc.driveWebViewLink || `https://drive.google.com/file/d/${doc.driveFileId}/view`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-800 transition-colors"
                title="Open in Google Drive"
              >
                <ExternalLink className="w-4 h-4 text-blue-400" />
                Google Drive
              </a>
            )}
            <button
              id="download-doc-btn"
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              Download
            </button>
            <button
              id="close-viewer-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status / AI Intelligence Banner */}
        {doc.aiExtraction ? (
          <div className="px-6 py-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">AI Extracted {doc.aiExtraction.extractedFields?.length || 0} Underwriting Points</span>
                <span className="text-[11px] text-slate-400 ml-2">({doc.aiExtraction.detectedCategory} • {(doc.aiExtraction.confidenceScore * 100).toFixed(0)}% confidence)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenReviewModal && (
                <button
                  id="viewer-review-ai-btn"
                  onClick={() => {
                    onClose();
                    onOpenReviewModal(doc);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                >
                  Review AI Fields
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span>Standard Document Archive Record</span>
            <button
              id="viewer-trigger-ai-btn"
              onClick={handleRetryAi}
              disabled={isRetryingAi}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-medium flex items-center gap-1.5 border border-amber-500/30 transition-colors disabled:opacity-50"
            >
              {isRetryingAi ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Run AI Scan
                </>
              )}
            </button>
          </div>
        )}

        {/* Retry Message Alert */}
        {retryMessage && (
          <div className="px-6 py-2 bg-emerald-500/10 border-b border-emerald-500/20 text-xs text-emerald-300 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {retryMessage}
          </div>
        )}

        {/* Main Document Content Canvas */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/60 min-h-[400px] flex flex-col items-center justify-center">
          {isPdf && fileDataSrc ? (
            <iframe
              src={fileDataSrc}
              title={doc.title}
              className="w-full h-[580px] rounded-xl border border-slate-800 bg-white"
            />
          ) : isImage && fileDataSrc ? (
            <div className="w-full flex items-center justify-center p-4 bg-slate-900 rounded-xl border border-slate-800">
              <img
                src={fileDataSrc}
                alt={doc.title}
                className="max-h-[540px] max-w-full rounded-lg object-contain shadow-md"
              />
            </div>
          ) : isSpreadsheet ? (
            <div className="w-full max-w-2xl p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{doc.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Spreadsheet format: <span className="font-mono text-emerald-400 uppercase">.{ext}</span> ({doc.fileSize})
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                  Spreadsheet files are safely archived and indexed for underwriting intelligence. Download the file to view full workbook cells or formulas.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-md shadow-emerald-500/20"
                >
                  <Download className="w-4 h-4" />
                  Download Spreadsheet
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-2xl p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{doc.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Document archive: <span className="font-mono text-blue-400 uppercase">.{ext}</span> ({doc.fileSize})
                </p>
                <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                  This document format is safely stored in the encrypted client vault. Download to view in native application.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-md shadow-amber-500/20"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Maple X Document Vault Archive</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
