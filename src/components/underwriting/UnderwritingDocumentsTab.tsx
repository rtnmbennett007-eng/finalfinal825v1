import React, { useState, useRef } from 'react';
import { FundingDeal, Client, DocumentItem, DocumentClassificationType } from '../../types';
import { REQUIRED_DOCUMENTS_BY_PRODUCT, DEFAULT_REQUIRED_DOCUMENTS } from '../../utils/riskEvaluationEngine';
import {
  FolderArchive,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Download,
  Sparkles,
  RefreshCw,
  Plus,
  Eye,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';

interface UnderwritingDocumentsTabProps {
  deal: FundingDeal;
  client: Client;
  documents: DocumentItem[];
  onUploadDocument: (file: File, category: string) => Promise<void>;
  onTriggerAiScan?: (docId: string) => Promise<void>;
  onRefreshDocuments?: () => Promise<void>;
}

export const UnderwritingDocumentsTab: React.FC<UnderwritingDocumentsTabProps> = ({
  deal,
  client,
  documents,
  onUploadDocument,
  onTriggerAiScan,
  onRefreshDocuments,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Bank Statements');
  const [uploading, setUploading] = useState(false);
  const [scanningDocId, setScanningDocId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const requiredCategories = REQUIRED_DOCUMENTS_BY_PRODUCT[deal.product] || DEFAULT_REQUIRED_DOCUMENTS;

  const uploadedCategoriesSet = new Set(
    documents.map((d) => (d.category || '').toLowerCase().trim())
  );

  const missingCategories = requiredCategories.filter((req) => {
    const reqLower = req.toLowerCase();
    return !Array.from(uploadedCategoriesSet).some((cat) => cat.includes(reqLower) || reqLower.includes(cat));
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      await onUploadDocument(file, selectedCategory);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploading(true);
    try {
      await onUploadDocument(file, selectedCategory);
    } finally {
      setUploading(false);
    }
  };

  const handleScan = async (docId: string) => {
    if (!onTriggerAiScan) return;
    setScanningDocId(docId);
    try {
      await onTriggerAiScan(docId);
    } finally {
      setScanningDocId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            VERIFIED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-950/80 text-rose-300 border border-rose-700 flex items-center gap-1">
            REJECTED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-950/80 text-amber-300 border border-amber-700 flex items-center gap-1">
            UNDER REVIEW
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
            PENDING REVIEW
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="underwriting-documents-tab">
      {/* 1. Missing Documents Alert Banner (if any) */}
      {missingCategories.length > 0 ? (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/60 text-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-white">
                Missing {missingCategories.length} Mandatory Document(s) for {deal.product}
              </h4>
              <p className="text-xs text-amber-300/90 mt-0.5">
                The following files are required for lender submission:{' '}
                <strong className="text-white">{missingCategories.join(', ')}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (missingCategories[0]) setSelectedCategory(missingCategories[0]);
              fileInputRef.current?.click();
            }}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors whitespace-nowrap"
          >
            Upload {missingCategories[0] || 'Document'}
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/60 text-emerald-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h4 className="text-sm font-bold text-white">100% Required Document Enclosures Present</h4>
              <p className="text-xs text-emerald-300/80 mt-0.5">
                All mandatory files for {deal.product} are uploaded and indexed in the Vault.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700">
            {documents.length} Files Ready
          </span>
        </div>
      )}

      {/* 2. Drag & Drop Upload Vault Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragOver
            ? 'border-amber-500 bg-amber-500/10'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.csv,.xlsx"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400">
            {uploading ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
          </div>

          <div>
            <h4 className="text-sm font-bold text-white">
              Upload Underwriting File to Deal Vault
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Drag & drop any PDF, image, or scan. Files stream directly to the client's dedicated Google Drive folder with AI indexing.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Target Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {requiredCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Articles of Incorporation">Articles of Incorporation</option>
                <option value="Profit & Loss">Profit & Loss</option>
                <option value="Business License">Business License</option>
                <option value="Other">Other Underwriting Doc</option>
              </select>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
            >
              {uploading ? 'Streaming to Drive...' : 'Browse Computer'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Document Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Underwriting Document Manifest</h4>
              <p className="text-xs text-slate-400">
                Live files indexed for Deal {deal.dealId || deal.id} ({client.businessName})
              </p>
            </div>
          </div>
          {onRefreshDocuments && (
            <button
              onClick={onRefreshDocuments}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Refresh Vault Manifest"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Document Title / File</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Storage Provider</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-white block truncate max-w-xs">
                            {doc.title || doc.fileName}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {doc.fileSize || 'Standard file'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                        {doc.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{doc.uploadedDate || 'Recent'}</td>
                    <td className="py-3 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        <span>{doc.storageProvider || 'Google Drive Vault'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(doc.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onTriggerAiScan && (
                          <button
                            onClick={() => handleScan(doc.id)}
                            disabled={scanningDocId === doc.id}
                            className="p-1.5 text-purple-300 hover:text-purple-100 hover:bg-purple-950/60 rounded border border-purple-800/60 transition-colors"
                            title="Analyze Document with Google GenAI"
                          >
                            {scanningDocId === doc.id ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        {(doc.driveWebViewLink || doc.fileUrl) && (
                          <a
                            href={doc.driveWebViewLink || doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded border border-slate-700 transition-colors"
                            title="Open / View File in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No documents uploaded yet. Drag & drop statements, licenses, or checks above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
