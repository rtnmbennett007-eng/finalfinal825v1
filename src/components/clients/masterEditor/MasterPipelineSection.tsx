import React from 'react';
import { Layers, UserCheck, Share2, AlertTriangle, Tag, Calendar, Clock, Bell } from 'lucide-react';
import { Client, PipelineStage, StaffUser, CANONICAL_PIPELINE_STAGES } from '../../../types';

interface MasterPipelineSectionProps {
  form: Partial<Client>;
  staffList: StaffUser[];
  onChange: (updates: Partial<Client>) => void;
}

const ALL_PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  ...CANONICAL_PIPELINE_STAGES.map((stage) => ({
    id: stage as PipelineStage,
    label: stage,
  })),
];

export const MasterPipelineSection: React.FC<MasterPipelineSectionProps> = ({
  form,
  staffList,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Pipeline Stage Control */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Pipeline Stage & Operations Workflow
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
            {form.currentStatus || 'No Set – Follow Up'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Pipeline Stage *</label>
            <select
              value={form.currentStatus || 'No Set – Follow Up'}
              onChange={(e) => onChange({ currentStatus: e.target.value as PipelineStage })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-amber-300 font-bold focus:border-amber-400 focus:outline-none"
            >
              {ALL_PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level</label>
            <select
              value={form.priority || 'High'}
              onChange={(e) => onChange({ priority: e.target.value as any })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="Urgent">🔥 Urgent Priority</option>
              <option value="High">⭐ High Priority</option>
              <option value="Medium">⚡ Medium Priority</option>
              <option value="Low">Standard Priority</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Assignments */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <UserCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Internal Staff & Account Assignment
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Operations Lead / Assigned Staff *</label>
            <input
              type="text"
              value={form.assignedStaff || ''}
              onChange={(e) => onChange({ assignedStaff: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Dana"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Sales Representative *</label>
            <input
              type="text"
              value={form.assignedSalesRep || ''}
              onChange={(e) => onChange({ assignedSalesRep: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Dana"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Dedicated Account Manager</label>
            <input
              type="text"
              value={form.accountManager || form.assignedStaff || ''}
              onChange={(e) => onChange({ accountManager: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Dana"
            />
          </div>
        </div>
      </div>

      {/* Sourcing & Referral Partner Attribution */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <Share2 className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Lead Origin & Referral Partner Attribution
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Lead Source *</label>
            <select
              value={form.leadSource || 'Direct Inbound'}
              onChange={(e) => onChange({ leadSource: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            >
              <option value="Direct Inbound">Direct Inbound / Organic</option>
              <option value="Referral Partner">Referral Partner</option>
              <option value="Broker Network">Broker Network</option>
              <option value="GoHighLevel Inbound">GoHighLevel Inbound Form</option>
              <option value="Paid Media / Google Ads">Paid Media / Google Ads</option>
              <option value="Paid Media / Meta Ads">Paid Media / Meta Ads</option>
              <option value="Cold Outreach">Cold Outreach</option>
              <option value="Live Event / Networking">Live Event / Networking</option>
              <option value="Existing Client Referral">Existing Client Referral</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Referral Partner Organization</label>
            <input
              type="text"
              value={form.referralPartner || ''}
              onChange={(e) => onChange({ referralPartner: e.target.value, referralPartnerCompany: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Apex Strategic Partners / Direct"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Contact Name</label>
            <input
              type="text"
              value={form.referralPartnerName || ''}
              onChange={(e) => onChange({ referralPartnerName: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="Partner Rep Name"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Email</label>
            <input
              type="email"
              value={form.referralPartnerEmail || ''}
              onChange={(e) => onChange({ referralPartnerEmail: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="partner@network.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Partner Phone</label>
            <input
              type="text"
              value={form.referralPartnerPhone || ''}
              onChange={(e) => onChange({ referralPartnerPhone: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Follow-Up & Operations Alerts */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center space-x-2 border-b border-blue-900/40 pb-3">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Critical Alerts & Next Follow-Up Schedule
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Next Follow-Up Date</label>
            <input
              type="date"
              value={form.nextFollowUpDate || ''}
              onChange={(e) => onChange({ nextFollowUpDate: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Follow-Up Time</label>
            <input
              type="time"
              value={form.nextFollowUpTime || '10:00'}
              onChange={(e) => onChange({ nextFollowUpTime: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Next Action Summary</label>
            <input
              type="text"
              value={form.nextTaskSummary || ''}
              onChange={(e) => onChange({ nextTaskSummary: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              placeholder="e.g. Collect signed term sheet"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-rose-300 mb-1">Priority Attention Banner / Alert Notes</label>
          <input
            type="text"
            value={form.importantAlerts || ''}
            onChange={(e) => onChange({ importantAlerts: e.target.value })}
            className="w-full bg-[#070d18] border border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-200 focus:border-rose-400 focus:outline-none"
            placeholder="e.g. Urgent: Time-sensitive closing window for second position lender"
          />
        </div>
      </div>
    </div>
  );
};
