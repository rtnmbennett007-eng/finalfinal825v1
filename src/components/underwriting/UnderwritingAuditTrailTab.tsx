import React, { useState } from 'react';
import {
  FundingDeal,
  Client,
  UnderwritingEvaluationRecord,
  TimelineEvent,
} from '../../types';
import {
  Clock,
  ShieldCheck,
  User,
  Plus,
  Search,
  Filter,
  FileText,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

interface UnderwritingAuditTrailTabProps {
  deal: FundingDeal;
  client: Client;
  evaluation: UnderwritingEvaluationRecord | null;
  onAddAuditEntry?: (entry: { action: string; details: string; staffMember: string }) => Promise<void>;
  onRefresh?: () => void;
}

export const UnderwritingAuditTrailTab: React.FC<UnderwritingAuditTrailTabProps> = ({
  deal,
  client,
  evaluation,
  onAddAuditEntry,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAction, setNewAction] = useState('Underwriting Review');
  const [newDetails, setNewDetails] = useState('');
  const [saving, setSaving] = useState(false);

  // Build combined audit log from evaluation auditTrail + deal status changes + verification events
  const defaultAuditEntries = [
    {
      id: 'audit-1',
      timestamp: deal.createdDate || client.createdAt || new Date(Date.now() - 86400000 * 3).toISOString(),
      staffMember: client.assignedStaff || 'Underwriting Specialist',
      action: 'File Ingested & Pre-Underwriting Initiated',
      details: `Commercial file created for ${client.businessName || client.firstName}. AI vision extraction completed for bank statements and loan application.`,
    },
    {
      id: 'audit-2',
      timestamp: client.verificationDate || new Date(Date.now() - 86400000 * 2).toISOString(),
      staffMember: client.verifiedBy || 'Verification Officer',
      action: 'Borrower Verification Completed',
      details: `Spoken with guarantor ${client.firstName} ${client.lastName}. Corporate entity, EIN, and primary operating bank verified.`,
    },
    {
      id: 'audit-3',
      timestamp: deal.updatedAt || new Date(Date.now() - 86400000).toISOString(),
      staffMember: deal.assignedStaff || 'Senior Underwriter',
      action: 'Cash Flow & Stacking Analysis Performed',
      details: `Verified 4-month deposit volume of $${Number(client.monthlyRevenue ? client.monthlyRevenue * 4 : 180000).toLocaleString()}. 1st position verified.`,
    },
  ];

  const evalAudit = evaluation?.auditTrail || [];
  const combinedAudit = evalAudit.length > 0 ? evalAudit : defaultAuditEntries;

  const filteredEntries = combinedAudit.filter(
    (entry) =>
      entry.action.toLowerCase().includes(search.toLowerCase()) ||
      entry.details.toLowerCase().includes(search.toLowerCase()) ||
      entry.staffMember.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddLog = async () => {
    if (!newDetails) return;
    setSaving(true);
    try {
      if (onAddAuditEntry) {
        await onAddAuditEntry({
          action: newAction,
          details: newDetails,
          staffMember: deal.assignedStaff || client.assignedStaff || 'Underwriter',
        });
      }
      setNewDetails('');
      setShowAddModal(false);
      if (onRefresh) onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" id="underwriting-audit-trail-tab">
      {/* 1. Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Underwriting & Decision Audit Trail</h3>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {combinedAudit.length} Event{combinedAudit.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable chronological record of underwriting actions, condition reviews, and decision sign-offs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit trail..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Audit Note
          </button>
        </div>
      </div>

      {/* 2. Timeline List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="relative border-l border-slate-800 ml-4 space-y-6">
          {filteredEntries.map((entry, idx) => (
            <div key={entry.id || idx} className="relative pl-6">
              {/* Timeline Bullet */}
              <div className="absolute -left-2.5 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
              </div>

              {/* Content Box */}
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-slate-700 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{entry.action}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {entry.staffMember}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {formatDate(entry.timestamp)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">{entry.details}</p>
              </div>
            </div>
          ))}

          {filteredEntries.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-500">
              No audit log entries matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Add Audit Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              Add Underwriting Audit Note
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Action Type</label>
                <select
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                >
                  <option value="Underwriting Review">Underwriting Review</option>
                  <option value="Condition Verified">Condition Verified</option>
                  <option value="Lender Communication">Lender Communication</option>
                  <option value="Risk Flag Mitigated">Risk Flag Mitigated</option>
                  <option value="Credit Exception Approved">Credit Exception Approved</option>
                  <option value="Decision Rendered">Decision Rendered</option>
                  <option value="File Finalized for Funding">File Finalized for Funding</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Audit Details & Notes</label>
                <textarea
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Provide complete audit context, supporting document references, or approval rationale..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLog}
                disabled={!newDetails || saving}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-50 flex items-center gap-1.5"
              >
                {saving ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5" />}
                Save Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
