import React, { useState } from 'react';
import { FolderLock, Upload, Trash2, CheckCircle2, Clock, AlertTriangle, FileText, Download } from 'lucide-react';
import { DocumentCategoryType, DocumentItem } from '../../../types';

interface MasterDocumentsSectionProps {
  clientId: string;
  documents: DocumentItem[];
  onChangeDocuments: (updatedDocs: DocumentItem[]) => void;
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
  documents,
  onChangeDocuments,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<DocumentCategoryType>("Driver's License");

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      clientId,
      category: newCategory,
      title: newTitle.trim(),
      fileName: `${newTitle.trim().toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSize: '1.4 MB',
      uploadedBy: 'Dana Javier',
      uploadedDate: new Date().toISOString(),
      status: 'RECEIVED',
    };

    onChangeDocuments([...documents, newDoc]);
    setNewTitle('');
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
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <Upload className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Register Document to Client Vault
          </h3>
        </div>

        <form onSubmit={handleAddDocument} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title *</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. 2024 Business Tax Returns (1120-S)"
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
              disabled={!newTitle.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Add to Vault</span>
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
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-[#070d18] border border-blue-900/40 gap-3 text-xs"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-200 block">{doc.title}</span>
                    <span className="text-[10px] text-slate-400">
                      {doc.category} • {doc.fileSize || '1.2 MB'} • Uploaded by {doc.uploadedBy || 'Staff'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
