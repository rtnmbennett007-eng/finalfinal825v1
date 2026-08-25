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
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface DocumentVaultProps {
  setActiveTab: (tab: string) => void;
}

export const DocumentVault: React.FC<DocumentVaultProps> = ({ setActiveTab }) => {
  const { clients, setSelectedClientId } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Gather documents from all clients
  const allDocs = clients.flatMap((c) =>
    (c.documents || []).map((doc: any) => ({
      ...doc,
      clientId: c.id,
      clientName: `${c.firstName} ${c.lastName}`,
      businessName: c.businessName,
    }))
  );

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
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase font-mono">
              Secure Operations Vault
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Total Encrypted Documents: {allDocs.length}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-400" />
            Global Document Vault
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Encrypted client document repository categorized by Driver's License, Bank Statements, Tax Returns, Voided Checks, and Financial Statements.
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
            placeholder="Search documents by client, business, or filename..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          />
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="ALL">All Categories</option>
            <option value="Driver's License">Driver's License</option>
            <option value="Bank Statements">Bank Statements</option>
            <option value="Tax Returns">Tax Returns</option>
            <option value="Voided Check">Voided Check</option>
            <option value="Profit & Loss">Profit & Loss</option>
            <option value="Articles of Incorporation">Articles of Incorporation</option>
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-blue-400 font-semibold uppercase">
                  {doc.category}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono font-bold">
                  {doc.status || 'REVIEWED'}
                </span>
              </div>

              <div className="text-xs font-bold text-slate-100 mt-2">{doc.title}</div>
              <div className="text-[11px] text-blue-400 font-semibold">{doc.clientName} ({doc.businessName})</div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">{doc.fileName} • {doc.fileSize}</div>

              {doc.notes && (
                <div className="text-[11px] text-slate-400 italic mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800/60">
                  "{doc.notes}"
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono">
                {doc.uploadedDate?.split('T')[0]}
              </span>

              <button
                onClick={() => handleOpenClient(doc.clientId)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1"
              >
                <span>Open File</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
