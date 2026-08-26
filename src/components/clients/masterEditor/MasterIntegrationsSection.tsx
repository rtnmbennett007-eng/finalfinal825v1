import React, { useState } from 'react';
import { Share2, MessageSquare, RefreshCw, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Client } from '../../../types';
import { useData } from '../../../context/DataContext';
import { formatDateTime } from '../../../utils/dateUtils';

interface MasterIntegrationsSectionProps {
  form: Partial<Client>;
  onChange: (updates: Partial<Client>) => void;
}

export const MasterIntegrationsSection: React.FC<MasterIntegrationsSectionProps> = ({
  form,
  onChange,
}) => {
  const { addToast } = useData();
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);

  const handleTestDiscord = () => {
    setIsTestingDiscord(true);
    setTimeout(() => {
      setIsTestingDiscord(false);
      addToast('success', 'Discord Notification Dispatched', 'Test webhook sent for this client master record.');
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* GoHighLevel Integration Identifiers */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <Share2 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              GoHighLevel (GHL) Sync & External Identifiers
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
            {form.ghlContactId ? 'GHL Linked' : 'Not Linked'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GHL Contact ID</label>
            <input
              type="text"
              value={form.ghlContactId || ''}
              onChange={(e) => onChange({ ghlContactId: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="e.g. ghl_cnt_8829103"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GHL Opportunity ID</label>
            <input
              type="text"
              value={form.ghlOpportunityId || ''}
              onChange={(e) => onChange({ ghlOpportunityId: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="e.g. ghl_opp_991823"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GHL Location ID</label>
            <input
              type="text"
              value={form.ghlLocationId || ''}
              onChange={(e) => onChange({ ghlLocationId: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="GHL Location ID"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">GHL Pipeline ID</label>
            <input
              type="text"
              value={form.ghlPipelineId || ''}
              onChange={(e) => onChange({ ghlPipelineId: e.target.value })}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              placeholder="GHL Pipeline ID"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Last GHL Synchronization</label>
            <input
              type="text"
              readOnly
              value={formatDateTime(form.ghlLastSync, 'Never synced')}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-400 font-mono cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Discord Notification Settings */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-5 rounded-2xl shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Discord Webhook Channel Alerts
            </h3>
          </div>
          <button
            type="button"
            onClick={handleTestDiscord}
            disabled={isTestingDiscord}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingDiscord ? 'animate-spin' : ''}`} />
            <span>{isTestingDiscord ? 'Testing Webhook...' : 'Test Discord Alert'}</span>
          </button>
        </div>

        <div className="flex items-center space-x-3 p-3 rounded-xl bg-[#070d18] border border-blue-900/40">
          <input
            type="checkbox"
            id="discordAlerts"
            checked={form.discordAlertsEnabled !== false}
            onChange={(e) => onChange({ discordAlertsEnabled: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-blue-900 focus:ring-0"
          />
          <label htmlFor="discordAlerts" className="text-xs font-semibold text-slate-200 cursor-pointer">
            Broadcast real-time status changes, approvals, and funding milestones to team Discord channel
          </label>
        </div>
      </div>
    </div>
  );
};
