import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  DocumentItem,
  SubmissionPackageRecord,
  BankStatementAnalysisSummary,
  UnderwritingEvaluationRecord,
} from '../../types';
import {
  downloadDealSubmissionCoverSheetPdf,
  downloadSubmissionPackageZip,
} from '../../utils/pdfGenerator';
import {
  Package,
  Send,
  Download,
  FileText,
  Building2,
  FolderArchive,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RefreshCw,
  Eye,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { ProductSelect } from '../common/ProductSelect';


interface SubmissionPackageTabProps {
  deal: FundingDeal;
  client: Client;
  documents: DocumentItem[];
  submissionPackages: SubmissionPackageRecord[];
  bankAnalysis: BankStatementAnalysisSummary;
  evaluation: UnderwritingEvaluationRecord | null;
  onCreatePackage: (packageData: any) => Promise<SubmissionPackageRecord>;
  onUpdatePackageStatus: (packageId: string, status: string, notes?: string) => Promise<void>;
}

export const SubmissionPackageTab: React.FC<SubmissionPackageTabProps> = ({
  deal,
  client,
  documents,
  submissionPackages,
  bankAnalysis,
  evaluation,
  onCreatePackage,
  onUpdatePackageStatus,
}) => {
  const [lenderName, setLenderName] = useState<string>(deal.lenderName || 'Direct Commercial Lender Network');
  const [lenderEmail, setLenderEmail] = useState<string>('');
  const [lenderProduct, setLenderProduct] = useState<string>(deal.product || 'Revenue Funding');
  const [targetAmount, setTargetAmount] = useState<number>(
    deal.approvedAmount || deal.requestedAmount || deal.fundingAmount || client.requestedAmount || 50000
  );
  const [targetTerm, setTargetTerm] = useState<string>(deal.termLength || '12-24 Months');
  const [targetFactor, setTargetFactor] = useState<string>(
    deal.factorRate ? String(deal.factorRate) : (deal.rate !== undefined ? String(deal.rate) : '1.24')
  );
  const [submissionNotes, setSubmissionNotes] = useState<string>(
    deal.notes || 'Borrower demonstrates strong consistent deposit velocity, clean bank balances, and stable business trajectory.'
  );
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>(documents.map((d) => d.id));
  const [creating, setCreating] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState<SubmissionPackageRecord | null>(null);
  const [newStatus, setNewStatus] = useState<string>('SUBMITTED');
  const [statusNote, setStatusNote] = useState<string>('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const toggleDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleCreatePackage = async () => {
    setCreating(true);
    try {
      await onCreatePackage({
        lenderName,
        lenderContactEmail: lenderEmail,
        lenderProduct,
        submissionType: 'EMAIL',
        submissionNotes,
        includedDocIds: selectedDocIds,
        targetAmount,
        targetTerm,
        targetFactorRate: targetFactor,
        createdBy: deal.assignedStaff || 'Staff Underwriter',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadCoverSheet = () => {
    downloadDealSubmissionCoverSheetPdf(deal, client, {
      documents: documents.filter((d) => selectedDocIds.includes(d.id)),
      bankAnalysis,
      underwriting: evaluation,
      notes: submissionNotes,
    });
  };

  const handleDownloadZip = async (pkg?: SubmissionPackageRecord) => {
    setDownloadingZip(true);
    try {
      await downloadSubmissionPackageZip(
        deal,
        client,
        documents.filter((d) => (pkg ? pkg.includedDocIds.includes(d.id) : selectedDocIds.includes(d.id))),
        {
          lenderName: pkg?.lenderName || lenderName,
          underwriterNotes: pkg?.underwriterNotes || submissionNotes,
        }
      );
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!showStatusModal) return;
    setUpdatingStatus(true);
    try {
      await onUpdatePackageStatus(showStatusModal.id, newStatus, statusNote);
      setShowStatusModal(null);
      setStatusNote('');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-950 text-emerald-300 border border-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            APPROVED
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-blue-950 text-blue-300 border border-blue-700 flex items-center gap-1">
            <Send className="w-3 h-3" />
            SUBMITTED
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-amber-950 text-amber-300 border border-amber-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            UNDER REVIEW
          </span>
        );
      case 'CONDITIONS':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-yellow-950 text-yellow-300 border border-yellow-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            CONDITIONS
          </span>
        );
      case 'DECLINED':
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-950 text-rose-300 border border-rose-700">
            DECLINED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
            PREPARED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="submission-package-tab">
      {/* 1. Package Builder Workstation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Automated Lender Submission Package Generator</h3>
              <p className="text-xs text-slate-400">
                Compiles multi-page executive cover sheet, banking ledgers, and verified attachments into a unified submission file
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadCoverSheet}
              className="flex-1 sm:flex-initial px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Cover Sheet PDF
            </button>
            <button
              onClick={() => handleDownloadZip()}
              disabled={downloadingZip}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center justify-center gap-1.5"
            >
              {downloadingZip ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download Package (.ZIP)
            </button>
          </div>
        </div>

        {/* Builder Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Lender Name</label>
            <input
              type="text"
              value={lenderName}
              onChange={(e) => setLenderName(e.target.value)}
              placeholder="e.g. Forward Financing, Kapitus, OnDeck..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Lender Desk / Rep Email</label>
            <input
              type="email"
              value={lenderEmail}
              onChange={(e) => setLenderEmail(e.target.value)}
              placeholder="submissions@lender.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Funding Amount ($)</label>
            <input
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <ProductSelect
              label="Target Product"
              value={lenderProduct}
              onChange={(val) => setLenderProduct(val)}
              selectClassName="px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Term Length</label>
            <input
              type="text"
              value={targetTerm}
              onChange={(e) => setTargetTerm(e.target.value)}
              placeholder="e.g. 12-24 Months"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Target Factor / Rate</label>
            <input
              type="text"
              value={targetFactor}
              onChange={(e) => setTargetFactor(e.target.value)}
              placeholder="e.g. 1.24"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Document Enclosures Multi-Selector */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-slate-300 block mb-2">
            Select Document Attachments to Include in Package ({selectedDocIds.length}/{documents.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {documents.map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="truncate">{doc.title || doc.fileName}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 ml-2">
                    {doc.category || 'Doc'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Underwriter Submission Commentary */}
        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1.5">
            Underwriting Memorandum / Submission Commentary
          </label>
          <textarea
            value={submissionNotes}
            onChange={(e) => setSubmissionNotes(e.target.value)}
            className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={handleCreatePackage}
            disabled={creating}
            className="px-5 py-2.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center gap-2"
          >
            {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Assemble & Prepare Submission Package
          </button>
        </div>
      </div>

      {/* 2. Submission Packages Audit & Lifecycle History */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderArchive className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-white">Submission History & Active Lender Lifecycles</h4>
              <p className="text-xs text-slate-400">
                Tracked submission packages compiled for Deal {deal.dealId || deal.id}
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold rounded bg-slate-800 text-slate-300 border border-slate-700">
            {submissionPackages.length} Package(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Package #</th>
                <th className="py-3 px-4">Target Lender</th>
                <th className="py-3 px-4">Amount / Terms</th>
                <th className="py-3 px-4">Enclosed Docs</th>
                <th className="py-3 px-4">Prepared</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {submissionPackages.length > 0 ? (
                submissionPackages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{pkg.packageNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      <div>{pkg.lenderName}</div>
                      {pkg.lenderContactEmail && (
                        <div className="text-[11px] text-slate-500">{pkg.lenderContactEmail}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-emerald-400">${Number(pkg.targetAmount).toLocaleString()}</div>
                      <div className="text-[11px] text-slate-400">{pkg.targetTerm} • {pkg.targetFactorRate}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {pkg.includedDocIds?.length || 0} Files
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      <div>{pkg.preparedDate?.split('T')[0] || 'Recent'}</div>
                      <div className="text-[11px] text-slate-500">{pkg.preparedBy}</div>
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(pkg.status)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setShowStatusModal(pkg);
                            setNewStatus(pkg.status);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                        >
                          Update Status
                        </button>
                        <button
                          onClick={() => handleDownloadZip(pkg)}
                          className="p-1.5 text-amber-300 hover:text-amber-100 hover:bg-amber-950/60 rounded border border-amber-800/60 transition-colors"
                          title="Download Package ZIP"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {pkg.drivePackageUrl && (
                          <a
                            href={pkg.drivePackageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded border border-slate-700 transition-colors"
                            title="Open Google Drive Submission Folder"
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
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No submission packages prepared yet. Use the generator above to create your first package.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">
                Update Status for {showStatusModal.packageNumber}
              </h4>
              <button
                onClick={() => setShowStatusModal(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Lifecycle Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-bold"
              >
                <option value="PREPARED">PREPARED (Internal Ready)</option>
                <option value="SUBMITTED">SUBMITTED (Sent to Lender)</option>
                <option value="UNDER_REVIEW">UNDER REVIEW (Lender Reviewing)</option>
                <option value="APPROVED">APPROVED (Term Sheet Issued)</option>
                <option value="CONDITIONS">CONDITIONS / STIPS</option>
                <option value="DECLINED">DECLINED</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Status Update Commentary / Conditions
              </label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Detail lender decision, approved terms, or required stipulations..."
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowStatusModal(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                disabled={updatingStatus}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveStatus}
                disabled={updatingStatus}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                {updatingStatus ? 'Updating...' : 'Save Lifecycle Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
