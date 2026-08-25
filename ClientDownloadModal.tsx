import React, { useState } from 'react';
import {
  FileText,
  Download,
  X,
  CheckSquare,
  Square,
  Scale,
  Send,
  Building2,
  FileCheck2,
  DollarSign,
  PieChart,
  FolderLock,
  MessageSquare,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  Client,
  FundingDeal,
  CommissionParticipant,
  DocumentItem,
  InternalTask,
  ClientInternalNote,
  TimelineEvent,
  MasterVerificationData,
  UnderwritingEvaluationRecord,
  CreditCardRecord,
  LenderHistoryRecord,
} from '../../types';
import {
  generateClientMasterFilePdf,
  generateUnderwritingReportPdf,
  generateLenderPackagePdf,
  PdfExportOptions,
} from '../../utils/pdfGenerator';

interface ClientDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  deals?: FundingDeal[];
  commissions?: CommissionParticipant[];
  masterVerification?: MasterVerificationData | null;
  underwriting?: UnderwritingEvaluationRecord | null;
  creditCards?: CreditCardRecord[];
  lenderHistory?: LenderHistoryRecord[];
  documents?: DocumentItem[];
  tasks?: InternalTask[];
  internalNotes?: ClientInternalNote[];
  timelineEvents?: TimelineEvent[];
}

export const ClientDownloadModal: React.FC<ClientDownloadModalProps> = ({
  isOpen,
  onClose,
  client,
  deals = [],
  commissions = [],
  masterVerification = null,
  underwriting = null,
  creditCards = [],
  lenderHistory = [],
  documents = [],
  tasks = [],
  internalNotes = [],
  timelineEvents = [],
}) => {
  const [options, setOptions] = useState<PdfExportOptions>({
    includeVerification: true,
    includeUnderwriting: true,
    includeFundingStacking: true,
    includeCommission: true,
    includeDocumentIndex: true,
    includeInternalNotes: true,
    includeAuditTimeline: true,
  });

  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleOption = (key: keyof PdfExportOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDownloadMasterFile = async () => {
    setIsGenerating('master');
    try {
      generateClientMasterFilePdf(
        client,
        {
          deals,
          commissions,
          masterVerification,
          underwriting,
          creditCards,
          lenderHistory,
          documents,
          tasks,
          internalNotes,
          timelineEvents,
        },
        options
      );
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadUnderwritingReport = async () => {
    if (!underwriting) {
      alert('No Underwriting record found for this client.');
      return;
    }
    setIsGenerating('underwriting');
    try {
      generateUnderwritingReportPdf(client, underwriting);
    } catch (err) {
      console.error('Error generating Underwriting PDF:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownloadLenderPackage = async () => {
    if (!underwriting) {
      alert('No Underwriting record found for this client.');
      return;
    }
    setIsGenerating('lender');
    try {
      generateLenderPackagePdf(client, underwriting, documents);
    } catch (err) {
      console.error('Error generating Lender Package PDF:', err);
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b1528] border border-blue-900/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header Gold Glow Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <div className="flex items-center justify-between border-b border-blue-900/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Download Client File & Reports
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate official branded PDF documents for {client.firstName} {client.lastName} ({client.businessName})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main PDF Download Targets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Target 1: Complete Client File */}
          <div className="p-4 rounded-xl bg-[#070d18] border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>Complete File</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">Master 360 File</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Comprehensive client dossier with application, verification, underwriting, stacking, & notes.
              </p>
            </div>

            <button
              onClick={handleDownloadMasterFile}
              disabled={isGenerating === 'master'}
              className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating === 'master' ? 'Generating...' : 'Download Client File'}</span>
            </button>
          </div>

          {/* Target 2: Underwriting Report */}
          <div className="p-4 rounded-xl bg-[#070d18] border border-blue-900/60 hover:border-blue-700 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Underwriting</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">Evaluation Report</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Full underwriter cash flow audit, 4-month bank breakdown, credit metrics, & conditions.
              </p>
            </div>

            <button
              onClick={handleDownloadUnderwritingReport}
              disabled={isGenerating === 'underwriting'}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating === 'underwriting' ? 'Generating...' : 'Download UW Report'}</span>
            </button>
          </div>

          {/* Target 3: Lender Package */}
          <div className="p-4 rounded-xl bg-[#070d18] border border-blue-900/60 hover:border-blue-700 transition-all flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Send className="w-4 h-4" />
                <span>Lender-Ready</span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">Lender Package</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Executive submission memorandum formatted for institutional capital partners.
              </p>
            </div>

            <button
              onClick={handleDownloadLenderPackage}
              disabled={isGenerating === 'lender'}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating === 'lender' ? 'Generating...' : 'Download Package'}</span>
            </button>
          </div>
        </div>

        {/* Section Matrix for Master File Customization */}
        <div className="space-y-3 bg-[#070d18] p-4 rounded-xl border border-blue-900/40">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Customize Master File Inclusions
            </h4>
            <span className="text-[10px] text-amber-400 font-medium">Select sections to bundle</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => toggleOption('includeVerification')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-[#0b1528] border border-blue-900/50 hover:border-amber-500/50 text-left transition-all"
            >
              {options.includeVerification ? (
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200 flex items-center gap-1.5 truncate">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                Include Verification Worksheet
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('includeUnderwriting')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-[#0b1528] border border-blue-900/50 hover:border-amber-500/50 text-left transition-all"
            >
              {options.includeUnderwriting ? (
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200 flex items-center gap-1.5 truncate">
                <Scale className="w-3.5 h-3.5 text-blue-400" />
                Include Underwriting Evaluation
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('includeFundingStacking')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-[#0b1528] border border-blue-900/50 hover:border-amber-500/50 text-left transition-all"
            >
              {options.includeFundingStacking ? (
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200 flex items-center gap-1.5 truncate">
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                Include Funding Deals & Stacking
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('includeCommission')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-[#0b1528] border border-blue-900/50 hover:border-amber-500/50 text-left transition-all"
            >
              {options.includeCommission ? (
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200 flex items-center gap-1.5 truncate">
                <PieChart className="w-3.5 h-3.5 text-blue-400" />
                Include Commission Ledger
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('includeDocumentIndex')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-[#0b1528] border border-blue-900/50 hover:border-amber-500/50 text-left transition-all"
            >
              {options.includeDocumentIndex ? (
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200 flex items-center gap-1.5 truncate">
                <FolderLock className="w-3.5 h-3.5 text-blue-400" />
                Include Document Vault Index
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleOption('includeInternalNotes')}
              className="flex items-center space-x-2 p-2 rounded-lg bg-[#0b1528] border border-blue-900/50 hover:border-amber-500/50 text-left transition-all"
            >
              {options.includeInternalNotes ? (
                <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0" />
              )}
              <span className="text-slate-200 flex items-center gap-1.5 truncate">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                Include Internal Staff Notes
              </span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-blue-900/50 text-xs">
          <span className="text-slate-500 text-[11px]">
            PDF outputs adhere to Maple X Financial brand identity.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
