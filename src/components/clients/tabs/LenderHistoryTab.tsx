import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  FileCheck2,
  DollarSign,
  Calendar,
  User,
  ArrowRight,
  ExternalLink,
  X,
  FileText,
} from 'lucide-react';
import { Client, FundingDeal, FundingProductType, LenderHistoryRecord, LenderHistoryStatus } from '../../../types';
import { api } from '../../../services/api';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmModal } from '../../common/ConfirmModal';
import { formatDate } from '../../../utils/dateUtils';

interface LenderHistoryTabProps {
  client: Client;
  deals?: FundingDeal[];
  lenderHistory?: LenderHistoryRecord[];
  onRefresh: () => void;
}

export const LenderHistoryTab: React.FC<LenderHistoryTabProps> = ({
  client,
  deals = [],
  lenderHistory = [],
  onRefresh,
}) => {
  const { addToast } = useData();
  const { currentUser, staffList } = useAuth();

  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeHistory = Array.isArray(lenderHistory) ? lenderHistory : [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<LenderHistoryRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingRecord, setIsDeletingRecord] = useState(false);

  // New Submission Form
  const [submissionForm, setSubmissionForm] = useState<Partial<LenderHistoryRecord>>({
    lenderName: 'Maple Direct Capital',
    fundingProduct: 'Revenue Funding',
    dateSent: new Date().toISOString().split('T')[0],
    sentBy: currentUser?.name || 'Dana',
    status: 'Sent',
    amount: client.requestedAmount || 50000,
    terms: '24 Months',
    conditions: 'Provide 4 months bank statements and photo ID.',
    requiredDocuments: 'Bank Statements, Driver License, Voided Check',
    lenderNotes: 'Direct tier-1 submission via portal API.',
    nextStep: 'Follow up with underwriter in 24 hours.',
  });

  // Response Update Form
  const [responseForm, setResponseForm] = useState<Partial<LenderHistoryRecord>>({
    status: 'Pre-Approved',
    amount: 50000,
    terms: '24 Months',
    conditions: 'Provide final invoice / voided check',
    requiredDocuments: 'Voided check, landlord verification',
    lenderNotes: 'Pre-approved. Terms subject to final bank verification.',
    responseDate: new Date().toISOString().split('T')[0],
    nextStep: 'Send approval terms to client for contract execution.',
  });

  // Handle Add Submission
  const handleAddSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createLenderHistoryRecord({
        ...submissionForm,
        clientId: client.id,
      });

      addToast(
        'success',
        'Lender Submission Logged',
        `Submission to ${submissionForm.lenderName} recorded and logged to client history.`
      );

      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Failed to Log Submission', err.message || 'Error occurred.');
    }
  };

  // Handle Update Response
  const handleUpdateResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      await api.updateLenderHistoryRecord(selectedRecord.id, {
        ...responseForm,
        response: responseForm.status,
      });

      addToast(
        'success',
        'Lender Response Updated',
        `Status for ${selectedRecord.lenderName} updated to ${responseForm.status}.`
      );

      setShowResponseModal(false);
      setSelectedRecord(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Error occurred.');
    }
  };

  // Handle Delete Record
  const handleDeleteRecord = (id: string, lenderName: string) => {
    setRecordToDelete({ id, name: lenderName });
  };

  const handleConfirmDeleteRecord = async () => {
    if (!recordToDelete) return;
    setIsDeletingRecord(true);
    try {
      await api.deleteLenderHistoryRecord(recordToDelete.id);
      addToast('success', 'Record Deleted', `Submission to ${recordToDelete.name} removed.`);
      setRecordToDelete(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Could not delete record.');
    } finally {
      setIsDeletingRecord(false);
    }
  };

  const getStatusBadge = (status: LenderHistoryStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Pre-Approved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Under Review':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'Sent':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'More Information Requested':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Declined':
      case 'Not Qualified':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold uppercase">
                Lender Submissions & Decision History
              </span>
              <span className="text-xs text-slate-400">
                Total Submissions: <strong className="text-slate-200">{lenderHistory.length}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Direct Lender Transmission & Response Hub
            </h2>
            <p className="text-xs text-slate-400">
              Track multi-lender submissions, underwriter feedback, approval amounts, stip conditions,
              and execution next steps.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Lender Submission</span>
        </button>
      </div>

      {/* Lender History Cards List */}
      <div className="space-y-4">
        {lenderHistory.length === 0 ? (
          <div className="bg-[#0b1528] border border-blue-900/60 p-8 rounded-2xl shadow-xl text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-500 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-slate-100">No Lender Submissions Logged Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click "Log New Lender Submission" to track submissions to institutional lenders, SBA
              partners, and revenue-based underwriters.
            </p>
          </div>
        ) : (
          lenderHistory.map((record) => (
            <div
              key={record.id}
              className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-xl space-y-4 hover:border-blue-700/60 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-blue-900/60 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-800 text-blue-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-slate-100">{record.lenderName}</h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${getStatusBadge(
                          record.status
                        )}`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center space-x-3 mt-0.5">
                      <span>Product: <strong className="text-amber-300">{record.fundingProduct}</strong></span>
                      <span>•</span>
                      <span>Sent Date: {formatDate(record.dateSent)}</span>
                      <span>•</span>
                      <span>Sent By: {record.sentBy}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setResponseForm({
                        status: record.status || 'Pre-Approved',
                        amount: record.amount || 50000,
                        terms: record.terms || '24 Months',
                        conditions: record.conditions || '',
                        requiredDocuments: record.requiredDocuments || '',
                        lenderNotes: record.lenderNotes || '',
                        responseDate: record.responseDate || new Date().toISOString().split('T')[0],
                        nextStep: record.nextStep || '',
                      });
                      setShowResponseModal(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Update Response & Terms</span>
                  </button>

                  <button
                    onClick={() => handleDeleteRecord(record.id, record.lenderName)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Approved / Target Amount</div>
                  <div className="text-sm font-bold text-slate-100 font-mono mt-0.5">
                    ${Number(record.amount || 0).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Terms & Duration</div>
                  <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
                    {record.terms || 'Under Review'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Response Date</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {formatDate(record.responseDate, 'Pending')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#070d18] border border-blue-900/40">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Next Action Step</div>
                  <div className="text-xs font-semibold text-blue-300 truncate mt-0.5" title={record.nextStep}>
                    {record.nextStep || 'Follow up with desk'}
                  </div>
                </div>
              </div>

              {/* Conditions & Notes */}
              {(record.conditions || record.requiredDocuments || record.lenderNotes) && (
                <div className="p-3.5 rounded-xl bg-[#070d18] border border-blue-900/40 space-y-2 text-xs">
                  {record.conditions && (
                    <div className="text-slate-200">
                      <strong className="text-amber-400">Approval Conditions / Stips:</strong>{' '}
                      {record.conditions}
                    </div>
                  )}
                  {record.requiredDocuments && (
                    <div className="text-slate-300">
                      <strong className="text-blue-400">Required Documents:</strong>{' '}
                      {record.requiredDocuments}
                    </div>
                  )}
                  {record.lenderNotes && (
                    <div className="text-slate-400">
                      <strong className="text-slate-300">Underwriter Notes:</strong>{' '}
                      {record.lenderNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Submission Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Log Lender Submission
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmission} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Lender / Underwriting Partner</label>
                <input
                  type="text"
                  required
                  value={submissionForm.lenderName}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, lenderName: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Maple Direct Capital, Apex Commercial, OnDeck"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Funding Product</label>
                  <select
                    value={submissionForm.fundingProduct}
                    onChange={(e) =>
                      setSubmissionForm({ ...submissionForm, fundingProduct: e.target.value as any })
                    }
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Revenue Funding">Revenue Funding</option>
                    <option value="Personal Term Loan">Personal Term Loan</option>
                    <option value="Business Term Loan">Business Term Loan</option>
                    <option value="Business Line of Credit">Business Line of Credit</option>
                    <option value="Equipment Financing">Equipment Financing</option>
                    <option value="HELOC">HELOC</option>
                    <option value="SBA Loan">SBA Loan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Amount Requested</label>
                  <input
                    type="number"
                    value={submissionForm.amount}
                    onChange={(e) =>
                      setSubmissionForm({ ...submissionForm, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date Sent</label>
                  <input
                    type="date"
                    value={submissionForm.dateSent}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, dateSent: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Sent By (Staff)</label>
                  <select
                    value={submissionForm.sentBy}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, sentBy: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Initial Status</label>
                <select
                  value={submissionForm.status}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, status: e.target.value as any })
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Sent">Sent</option>
                  <option value="Under Review">Under Review</option>
                  <option value="More Information Requested">More Information Requested</option>
                  <option value="Pre-Approved">Pre-Approved</option>
                  <option value="Approved">Approved</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Required Documents / Stips</label>
                <input
                  type="text"
                  value={submissionForm.requiredDocuments}
                  onChange={(e) =>
                    setSubmissionForm({ ...submissionForm, requiredDocuments: e.target.value })
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. 4 Months Bank Statements, Driver License, Voided Check"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Submission Notes</label>
                <textarea
                  rows={2}
                  value={submissionForm.lenderNotes}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, lenderNotes: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="Notes on transmission or special underwriting circumstances..."
                />
              </div>

              <div className="pt-3 border-t border-blue-900 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold transition-all shadow-md shadow-amber-500/20"
                >
                  Log Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Response Modal */}
      {showResponseModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                Update Lender Decision: {selectedRecord.lenderName}
              </h3>
              <button onClick={() => setShowResponseModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateResponse} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Decision / Response Status</label>
                <select
                  value={responseForm.status}
                  onChange={(e) =>
                    setResponseForm({ ...responseForm, status: e.target.value as any })
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Under Review">Under Review</option>
                  <option value="More Information Requested">More Information Requested</option>
                  <option value="Pre-Approved">Pre-Approved</option>
                  <option value="Approved">Approved</option>
                  <option value="Not Qualified">Not Qualified</option>
                  <option value="Declined">Declined</option>
                  <option value="Withdrawn">Withdrawn</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Approved Amount</label>
                  <input
                    type="number"
                    value={responseForm.amount}
                    onChange={(e) =>
                      setResponseForm({ ...responseForm, amount: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-emerald-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Terms / Duration</label>
                  <input
                    type="text"
                    value={responseForm.terms}
                    onChange={(e) => setResponseForm({ ...responseForm, terms: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                    placeholder="e.g. 24 Months @ 7.5%"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Closing Conditions & Stips</label>
                <textarea
                  rows={2}
                  value={responseForm.conditions}
                  onChange={(e) => setResponseForm({ ...responseForm, conditions: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Landlord verification, zero NSF in last 30 days..."
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Next Action Step</label>
                <input
                  type="text"
                  value={responseForm.nextStep}
                  onChange={(e) => setResponseForm({ ...responseForm, nextStep: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Send pre-approval terms to client for contract execution"
                />
              </div>

              <div className="pt-3 border-t border-blue-900 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  Save Decision & Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Submission Record Confirm Modal */}
      <ConfirmModal
        isOpen={!!recordToDelete}
        onClose={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDeleteRecord}
        title="Delete Submission Record"
        message={`Are you sure you want to remove the submission record for ${recordToDelete?.name || 'this lender'}?`}
        confirmText="Remove Record"
        cancelText="Cancel"
        isLoading={isDeletingRecord}
        type="danger"
      />
    </div>
  );
};
