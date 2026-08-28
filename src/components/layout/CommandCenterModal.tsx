import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Zap,
  Search,
  X,
  UserPlus,
  FilePlus,
  UploadCloud,
  CheckCircle2,
  FileText,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Briefcase,
  AlertTriangle,
  FolderLock,
  BarChart3,
  Scale,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  PhoneCall,
  Layers,
  Award,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Client, FundingDeal, DocumentItem } from '../../types';

interface CommandCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab: (tab: string) => void;
  onOpenNewClientModal: () => void;
  onOpenNewLeadModal: () => void;
}

export const CommandCenterModal: React.FC<CommandCenterModalProps> = ({
  isOpen,
  onClose,
  setActiveTab,
  onOpenNewClientModal,
  onOpenNewLeadModal,
}) => {
  const { clients, deals, documents, setSelectedClientId } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Search Results Grouping
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      return {
        clients: [],
        businesses: [],
        deals: [],
        documents: [],
        verification: [],
        underwriting: [],
        funding: [],
      };
    }

    const matchedClients: Client[] = [];
    const matchedBusinesses: Client[] = [];
    const matchedDeals: FundingDeal[] = [];
    const matchedDocuments: DocumentItem[] = [];
    const matchedVerification: Client[] = [];
    const matchedUnderwriting: FundingDeal[] = [];
    const matchedFunding: FundingDeal[] = [];

    // Client and Business Matching
    for (const c of clients) {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const bName = (c.businessName || '').toLowerCase();
      const email = (c.email || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      const ein = (c.federalTaxId || '').toLowerCase();
      const staff = (c.assignedStaff || '').toLowerCase();
      const ssnLast4 = (c.ssn || '').slice(-4);

      const isClientMatch =
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        staff.includes(q) ||
        (ssnLast4 && ssnLast4.includes(q));

      const isBusinessMatch =
        bName.includes(q) ||
        ein.includes(q);

      if (isClientMatch) matchedClients.push(c);
      if (isBusinessMatch && !matchedClients.includes(c)) matchedBusinesses.push(c);

      // Verification match (status, verified flag, or name)
      if (
        c.currentStatus.toLowerCase().includes('verif') ||
        c.isVerified ||
        fullName.includes(q)
      ) {
        if (q.includes('verif') || isClientMatch || isBusinessMatch) {
          matchedVerification.push(c);
        }
      }
    }

    // Deal Matching
    for (const d of deals) {
      const dealId = (d.dealId || d.id || '').toLowerCase();
      const clientName = (d.clientName || '').toLowerCase();
      const businessName = (d.businessName || '').toLowerCase();
      const funder = (d.funder || d.lenderName || '').toLowerCase();
      const product = (d.product || '').toLowerCase();
      const staff = (d.assignedStaff || '').toLowerCase();
      const status = (d.status || '').toLowerCase();

      const isDealMatch =
        dealId.includes(q) ||
        clientName.includes(q) ||
        businessName.includes(q) ||
        funder.includes(q) ||
        product.includes(q) ||
        staff.includes(q) ||
        status.includes(q);

      if (isDealMatch) {
        matchedDeals.push(d);
        if (status.includes('underwrit') || q.includes('underwrit')) {
          matchedUnderwriting.push(d);
        }
        if (status.includes('fund') || q.includes('fund') || q.includes('stack')) {
          matchedFunding.push(d);
        }
      }
    }

    // Documents Matching
    for (const doc of documents || []) {
      const title = (doc.title || doc.fileName || '').toLowerCase();
      const category = (doc.category || '').toLowerCase();
      const client = (doc.clientName || '').toLowerCase();

      if (title.includes(q) || category.includes(q) || client.includes(q)) {
        matchedDocuments.push(doc);
      }
    }

    return {
      clients: matchedClients.slice(0, 5),
      businesses: matchedBusinesses.slice(0, 5),
      deals: matchedDeals.slice(0, 5),
      documents: matchedDocuments.slice(0, 5),
      verification: matchedVerification.slice(0, 5),
      underwriting: matchedUnderwriting.slice(0, 5),
      funding: matchedFunding.slice(0, 5),
    };
  }, [searchQuery, clients, deals, documents]);

  const hasAnyResults =
    searchResults.clients.length > 0 ||
    searchResults.businesses.length > 0 ||
    searchResults.deals.length > 0 ||
    searchResults.documents.length > 0 ||
    searchResults.verification.length > 0 ||
    searchResults.underwriting.length > 0 ||
    searchResults.funding.length > 0;

  if (!isOpen) return null;

  const navigateToClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
    onClose();
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-14 px-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div
        className="w-full max-w-4xl bg-[#091326] border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        id="global-command-center-modal"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0d1c3a] via-[#10234a] to-[#0d1c3a] border-b border-blue-900/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-wide text-slate-100 flex items-center gap-2">
                <span>⚡ MAPLE X FINANCIAL COMMAND CENTER</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold">
                  PORTAL CORE
                </span>
              </h2>
              <p className="text-xs text-blue-200/80">
                Quickly create, find, process, verify, underwrite, fund, and report on clients and deals.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-blue-900/50 transition-colors"
            title="Close Command Center (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-[#070e1c] border-b border-blue-900/60">
          <div className="relative">
            <Search className="w-5 h-5 text-amber-400 absolute left-4 top-3.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients, businesses, EINs, deals, documents, funders..."
              className="w-full bg-[#0d1a33] border border-blue-800/80 rounded-xl pl-12 pr-10 py-3 text-sm text-slate-100 placeholder-slate-400 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-all"
              id="command-center-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body: Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
          {/* 1. If Searching: Show Grouped Results */}
          {searchQuery.trim() !== '' ? (
            <div className="space-y-6">
              {!hasAnyResults ? (
                <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-80" />
                  <div className="text-sm font-bold text-slate-200">No matching records found</div>
                  <p className="text-xs text-slate-400 mt-1">
                    No clients, businesses, deals, or documents matched "{searchQuery}".
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Group: CLIENTS */}
                  {searchResults.clients.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black tracking-wider text-amber-400 uppercase flex items-center gap-1.5">
                        <span>CLIENT RECORDS ({searchResults.clients.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.clients.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => navigateToClient(c.id)}
                            className="p-3 bg-slate-900/70 hover:bg-blue-900/40 border border-slate-800 hover:border-amber-400/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 truncate">
                                {c.firstName} {c.lastName}
                              </div>
                              <div className="text-[11px] text-blue-300 truncate">
                                {c.businessName || 'Business Entity'}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Stage: <span className="font-semibold text-slate-200">{c.currentStatus}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 ml-2 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group: BUSINESS */}
                  {searchResults.businesses.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black tracking-wider text-blue-400 uppercase flex items-center gap-1.5">
                        <span>BUSINESS ENTITIES ({searchResults.businesses.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.businesses.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => navigateToClient(c.id)}
                            className="p-3 bg-slate-900/70 hover:bg-blue-900/40 border border-slate-800 hover:border-blue-400/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-100 group-hover:text-blue-300 truncate">
                                {c.businessName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                Owner: {c.firstName} {c.lastName} • EIN: {c.federalTaxId || 'N/A'}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 ml-2 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group: DEALS */}
                  {searchResults.deals.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                        <span>FUNDING DEALS ({searchResults.deals.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.deals.map((d) => (
                          <div
                            key={d.id}
                            onClick={() => {
                              setSelectedClientId(d.clientId);
                              setActiveTab('funding');
                              onClose();
                            }}
                            className="p-3 bg-slate-900/70 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 truncate flex items-center gap-1.5">
                                <span className="font-mono text-amber-400">{d.dealId || d.id}</span>
                                <span>• ${Number(d.fundingAmount || 0).toLocaleString()}</span>
                              </div>
                              <div className="text-[11px] text-slate-300 truncate">
                                {d.businessName || d.clientName} ({d.product})
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Status: <span className="text-emerald-400 font-semibold">{d.status}</span> • Funder: {d.lenderName || d.funder}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 ml-2 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group: DOCUMENTS */}
                  {searchResults.documents.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black tracking-wider text-purple-400 uppercase flex items-center gap-1.5">
                        <span>DOCUMENT VAULT ({searchResults.documents.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.documents.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => {
                              setSelectedClientId(doc.clientId);
                              setActiveTab('documents');
                              onClose();
                            }}
                            className="p-3 bg-slate-900/70 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-100 group-hover:text-purple-300 truncate">
                                {doc.title || doc.fileName}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                Category: {doc.category} • Client: {doc.clientName}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 ml-2 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Group: VERIFICATION */}
                  {searchResults.verification.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-black tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                        <span>VERIFICATION FILES ({searchResults.verification.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {searchResults.verification.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedClientId(c.id);
                              setActiveTab('verification');
                              onClose();
                            }}
                            className="p-3 bg-slate-900/70 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 truncate">
                                {c.firstName} {c.lastName} ({c.businessName})
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Verification Status:{' '}
                                <span className={c.isVerified ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                                  {c.isVerified ? 'VERIFIED' : 'PENDING CALL SCRIPT'}
                                </span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 ml-2 shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 2. Default View: Categorized Quick Action Center */
            <div className="space-y-6">
              {/* Actions Grid */}
              <div>
                <div className="text-[11px] font-black tracking-wider text-amber-400 uppercase mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CORE OPERATIONAL ACTIONS</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {/* Create Client */}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewClientModal();
                    }}
                    className="p-3 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/60 rounded-xl text-left transition-all hover:border-amber-400 group"
                  >
                    <UserPlus className="w-4 h-4 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">CREATE CLIENT</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Start new 360 client file</div>
                  </button>

                  {/* Open Client Master 360 */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('clients')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <Briefcase className="w-4 h-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">OPEN CLIENT MASTER</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Client files & pipeline</div>
                  </button>

                  {/* Search Client */}
                  <button
                    type="button"
                    onClick={() => searchInputRef.current?.focus()}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <Search className="w-4 h-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">SEARCH CLIENT</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Filter by name, EIN, phone</div>
                  </button>

                  {/* Upload Application */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('documents')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <UploadCloud className="w-4 h-4 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">UPLOAD APPLICATION</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Intake signed borrower form</div>
                  </button>

                  {/* Upload Verification Form */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('verification')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">UPLOAD VERIF FORM</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Verification questionnaire</div>
                  </button>

                  {/* Upload Document */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('documents')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <FilePlus className="w-4 h-4 text-cyan-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">UPLOAD DOCUMENT</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">To Secure Document Vault</div>
                  </button>

                  {/* Start Verification */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('verification')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">START VERIFICATION</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Run verification call script</div>
                  </button>

                  {/* Create Funding Deal */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('funding')}
                    className="p-3 bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-emerald-400 group"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">CREATE FUNDING DEAL</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Stack or propose position</div>
                  </button>

                  {/* Open Funding Deal */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('funding')}
                    className="p-3 bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-emerald-400 group"
                  >
                    <Layers className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">OPEN FUNDING DEAL</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Stacking & lender terms</div>
                  </button>

                  {/* Run Document AI */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('documents')}
                    className="p-3 bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-purple-400 group"
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">RUN DOCUMENT AI</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Auto-extract statements & IDs</div>
                  </button>

                  {/* Run Financial Analysis */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('underwriting')}
                    className="p-3 bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-purple-400 group"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">RUN FINANCIAL ANALYSIS</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Bank statements & cash flow</div>
                  </button>

                  {/* Run Underwriting */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('underwriting')}
                    className="p-3 bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-purple-400 group"
                  >
                    <Scale className="w-4 h-4 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">RUN UNDERWRITING</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Command Center workspace</div>
                  </button>

                  {/* Prepare Submission */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('underwriting')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <FileText className="w-4 h-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">PREPARE SUBMISSION</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Assemble package & coversheet</div>
                  </button>

                  {/* Ready For Underwriting */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('underwriting')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">READY FOR UNDERWRITING</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Verify prerequisites & blockers</div>
                  </button>

                  {/* Record Approval */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('funding')}
                    className="p-3 bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-emerald-400 group"
                  >
                    <Award className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">RECORD APPROVAL</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Log lender approval terms</div>
                  </button>

                  {/* Check Funding Readiness */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('funding')}
                    className="p-3 bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-emerald-400 group"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">CHECK FUNDING READINESS</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Pre-closing checklist audit</div>
                  </button>

                  {/* Record Funding */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('funding')}
                    className="p-3 bg-slate-900/80 hover:bg-emerald-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-emerald-400 group"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">RECORD FUNDING</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Close & disburse capital</div>
                  </button>

                  {/* Enter Commission */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('funding')}
                    className="p-3 bg-slate-900/80 hover:bg-amber-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-amber-400 group"
                  >
                    <DollarSign className="w-4 h-4 text-amber-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">ENTER COMMISSION</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Manual split & points entry</div>
                  </button>

                  {/* Generate Report */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('reports')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <BarChart3 className="w-4 h-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">GENERATE REPORT</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Export operational CSV / PDF</div>
                  </button>

                  {/* Open Reports */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('reports')}
                    className="p-3 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-800 rounded-xl text-left transition-all hover:border-blue-400 group"
                  >
                    <TrendingUp className="w-4 h-4 text-blue-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">OPEN REPORTS</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Live funding & commissions</div>
                  </button>

                  {/* Open Document Vault */}
                  <button
                    type="button"
                    onClick={() => navigateToTab('documents')}
                    className="p-3 bg-slate-900/80 hover:bg-purple-950/40 border border-slate-800 rounded-xl text-left transition-all hover:border-purple-400 group"
                  >
                    <FolderLock className="w-4 h-4 text-purple-400 mb-1.5 group-hover:scale-110 transition-transform" />
                    <div className="text-xs font-bold text-slate-100">OPEN DOCUMENT VAULT</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Secure client file repository</div>
                  </button>
                </div>
              </div>

              {/* Recent Clients Quick List */}
              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[11px] font-black tracking-wider text-slate-400 uppercase mb-2 flex items-center justify-between">
                  <span>RECENT ACTIVE CLIENTS ({clients.length})</span>
                  <button
                    type="button"
                    onClick={() => navigateToTab('clients')}
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold text-[10px]"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {clients.slice(0, 6).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigateToClient(c.id)}
                      className="p-2.5 bg-slate-900/60 hover:bg-blue-900/30 border border-slate-800/80 hover:border-amber-400/40 rounded-xl cursor-pointer transition-all"
                    >
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="text-[10px] text-blue-300 truncate">
                        {c.businessName || 'Business Entity'}
                      </div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate">
                        {c.currentStatus}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#070d18] border-t border-blue-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-200 rounded text-[10px] font-mono">ESC</kbd> to exit</span>
            <span>•</span>
            <span>Real-time DB Connection Active</span>
          </div>
          <div className="text-amber-400/80 font-mono font-medium">
            Maple X Operating System
          </div>
        </div>
      </div>
    </div>
  );
};
