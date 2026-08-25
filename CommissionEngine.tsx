import React, { useState } from 'react';
import {
  PieChart,
  DollarSign,
  Users,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  Building2,
  TrendingUp,
  Settings2,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { CommissionParticipant, CommissionDirectoryEntry, CommissionRule } from '../../types';

interface CommissionEngineProps {
  setActiveTab: (tab: string) => void;
}

export const CommissionEngine: React.FC<CommissionEngineProps> = ({ setActiveTab }) => {
  const {
    deals,
    commissions,
    commissionDirectory,
    commissionRules,
    saveCommissionRule,
    deleteCommissionRule,
    addCommissionDirectoryEntry,
    deleteCommissionDirectoryEntry,
    setSelectedClientId,
    markDealCommissionReceived,
    isSaving,
    addToast,
  } = useData();

  const [activeSubTab, setActiveSubTab] = useState<'OVERVIEW' | 'DIRECTORY' | 'RULES' | 'DEALS'>('OVERVIEW');
  const [showAddDirModal, setShowAddDirModal] = useState(false);
  const [newDirForm, setNewDirForm] = useState<Partial<CommissionDirectoryEntry>>({
    name: '',
    type: 'Internal Staff',
    role: 'Operations & Funding',
    company: '',
    defaultPoints: 1.0,
    email: '',
    phone: '',
  });

  // Commission Rule Modal & Editing
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Partial<CommissionRule> | null>(null);

  // Calculate Metrics
  const totalFundedVolume = deals
    .filter((d) => d.status === 'FUNDED')
    .reduce((sum, d) => sum + Number(d.fundingAmount), 0);

  const totalCommissionGenerated = deals
    .filter((d) => d.status === 'FUNDED')
    .reduce((sum, d) => sum + (Number(d.fundingAmount) * Number(d.percentage)) / 100, 0);

  const totalCommissionCollected = deals
    .filter((d) => d.status === 'FUNDED' && d.commissionStatus === 'COLLECTED')
    .reduce((sum, d) => sum + (Number(d.fundingAmount) * Number(d.percentage)) / 100, 0);

  const totalCommissionPending = totalCommissionGenerated - totalCommissionCollected;

  // Breakdown by Participant Name
  const participantSummary: Record<string, { pointsSum: number; dollarsSum: number; type: string; count: number }> = {};
  for (const p of commissions) {
    if (!participantSummary[p.name]) {
      participantSummary[p.name] = { pointsSum: 0, dollarsSum: 0, type: p.type, count: 0 };
    }
    participantSummary[p.name].pointsSum += Number(p.points);
    participantSummary[p.name].dollarsSum += Number(p.dollarAmount);
    participantSummary[p.name].count += 1;
  }

  // Unallocated points check
  const unallocatedDeals = deals.map((d) => {
    const pList = commissions.filter((cp) => cp.dealId === d.id);
    const allocatedPoints = pList.reduce((sum, p) => sum + Number(p.points), 0);
    const unallocated = Number((d.percentage - allocatedPoints).toFixed(3));
    return { deal: d, allocatedPoints, unallocated, pList };
  }).filter((item) => item.unallocated > 0.001);

  const handleAddDirectoryEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDirForm.name) return;
    await addCommissionDirectoryEntry({
      ...newDirForm,
      defaultPoints: Number(newDirForm.defaultPoints || 1.0),
    });
    setShowAddDirModal(false);
    setNewDirForm({
      name: '',
      type: 'Internal Staff',
      role: 'Operations & Funding',
      company: '',
      defaultPoints: 1.0,
      email: '',
      phone: '',
    });
  };

  const handleOpenClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule || !editingRule.loanType) return;
    try {
      await saveCommissionRule(editingRule);
      setShowRuleModal(false);
      setEditingRule(null);
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Could not save rule');
    }
  };

  const handleAddNewRule = () => {
    setEditingRule({
      loanType: '',
      defaultRate: 10.0,
      description: '',
      defaultSplits: [
        { name: 'Dana', type: 'Internal Staff', points: 1.0, role: 'Operations & Processing' },
        { name: 'Luke', type: 'Internal Staff', points: 2.0, role: 'Senior Underwriting' },
        { name: 'Steve', type: 'Internal Staff', points: 3.5, role: 'Sales Strategy' },
        { name: 'Robert', type: 'Internal Staff', points: 3.5, role: 'Principal / Executive' },
      ],
      active: true,
    });
    setShowRuleModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-mono">
              Cloud Firestore Commission Engine
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Strictly Internal / Live Cloud Persistence</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            Commission & Points Allocation Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configurable percentage-point splitting, loan-type default rules, and multi-participant payout tracking across all internal staff and partners.
          </p>
        </div>

        {/* Subtabs */}
        <div className="flex flex-wrap rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'OVERVIEW' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Summary & Balances
          </button>
          <button
            onClick={() => setActiveSubTab('RULES')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'RULES' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Commission Rules ({commissionRules.length})
          </button>
          <button
            onClick={() => setActiveSubTab('DIRECTORY')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'DIRECTORY' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Directory ({commissionDirectory.length})
          </button>
          <button
            onClick={() => setActiveSubTab('DEALS')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeSubTab === 'DEALS' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deals Matrix ({deals.length})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">Total Commission Generated</span>
          <div className="text-2xl font-bold text-blue-400 mt-2 font-mono">
            ${totalCommissionGenerated.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">From ${totalFundedVolume.toLocaleString()} total funded volume</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">Total Commission Collected</span>
          <div className="text-2xl font-bold text-emerald-400 mt-2 font-mono">
            ${totalCommissionCollected.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Funds received from lenders</span>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs font-semibold text-slate-400 block">Pending Lender Payouts</span>
          <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
            ${totalCommissionPending.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Awaiting wire / lender disbursement</span>
        </div>
      </div>

      {/* OVERVIEW SUBTAB */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Unallocated Deals Warning */}
          {unallocatedDeals.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>{unallocatedDeals.length} Deals Have Unallocated Commission Points</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                The full gross commission percentage has not been 100% split across participants for the following active deals:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {unallocatedDeals.map(({ deal, unallocated, allocatedPoints }) => (
                  <div
                    key={deal.id}
                    className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between text-xs cursor-pointer hover:border-amber-400 transition-colors"
                    onClick={() => handleOpenClient(deal.clientId)}
                  >
                    <div>
                      <strong className="text-slate-100 block">{deal.clientName} — {deal.product}</strong>
                      <span className="text-slate-400">Total: {deal.percentage}% | Split: {allocatedPoints.toFixed(2)}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-mono font-bold block">{unallocated}% Unallocated</span>
                      <span className="text-[10px] text-slate-500">Click to Open File</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participant Earnings Table */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              Participant Cumulative Balance & Point Summaries
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">Participant Name</th>
                    <th className="pb-3 font-semibold">Type</th>
                    <th className="pb-3 font-semibold">Deals Count</th>
                    <th className="pb-3 font-semibold">Total Points (Pts)</th>
                    <th className="pb-3 font-semibold text-right">Cumulative Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {Object.entries(participantSummary).map(([name, data]) => (
                    <tr key={name} className="hover:bg-slate-800/20">
                      <td className="py-3 font-bold text-slate-100">{name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          data.type === 'Internal Staff' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {data.type}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 font-mono">{data.count} deals</td>
                      <td className="py-3 text-amber-400 font-mono font-bold">{data.pointsSum.toFixed(2)} pts</td>
                      <td className="py-3 text-emerald-400 font-mono font-bold text-right">${data.dollarsSum.toLocaleString()}</td>
                    </tr>
                  ))}
                  {Object.keys(participantSummary).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        No commission allocations recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RULES SUBTAB */}
      {activeSubTab === 'RULES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-amber-400" />
                Configurable Commission Rules by Loan / Funding Type
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Set default commission rates and participant point splits applied when new funding deals are created.
              </p>
            </div>
            <button
              onClick={handleAddNewRule}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Loan Type Rule</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {commissionRules.map((rule) => {
              const totalSplits = (rule.defaultSplits || []).reduce((sum, s) => sum + Number(s.points || 0), 0);
              return (
                <div key={rule.id} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{rule.loanType}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {rule.defaultRate}% Default Rate
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{rule.description || 'Configured formula for deal creation.'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setEditingRule(rule);
                          setShowRuleModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        title="Edit Rule"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCommissionRule(rule.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Default Participant Splits */}
                  <div className="space-y-1.5 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                      Default Team Split Allocations ({totalSplits} pts)
                    </span>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {(rule.defaultSplits || []).map((split, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-800">
                          <div>
                            <span className="font-semibold text-slate-200 block">{split.name}</span>
                            <span className="text-[10px] text-slate-500">{split.role}</span>
                          </div>
                          <span className="font-mono text-amber-400 font-bold">{split.points}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DIRECTORY SUBTAB */}
      {activeSubTab === 'DIRECTORY' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Commission Directory & Recurring Split Entities
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Directory of staff members, brokers, referral partners, and partners eligible for deal commission splits.
              </p>
            </div>
            <button
              onClick={() => setShowAddDirModal(true)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Directory Entry</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {commissionDirectory.map((entry) => (
              <div key={entry.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-2 relative group hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{entry.name}</h3>
                    <span className="text-[10px] text-slate-400 block">{entry.role}</span>
                  </div>
                  <button
                    onClick={() => deleteCommissionDirectoryEntry(entry.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Default Points:</span>
                  <span className="font-mono text-amber-400 font-bold">{entry.defaultPoints}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DEALS MATRIX SUBTAB */}
      {activeSubTab === 'DEALS' && (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            Active Deals Commission Allocation Matrix
          </h2>

          <div className="space-y-3">
            {deals.map((deal) => {
              const pList = commissions.filter((cp) => cp.dealId === deal.id);
              const allocatedPoints = pList.reduce((sum, p) => sum + Number(p.points), 0);
              const unallocated = Number((deal.percentage - allocatedPoints).toFixed(3));
              const totalGross = (Number(deal.fundingAmount) * Number(deal.percentage)) / 100;

              return (
                <div key={deal.id} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{deal.clientName}</span>
                        <span className="text-slate-500">•</span>
                        <span className="text-slate-300 font-semibold">{deal.product}</span>
                        <span className="text-xs text-slate-500">({deal.lenderName})</span>
                      </div>
                      <span className="text-xs text-slate-400">
                        Funded: <strong className="text-slate-200 font-mono">${deal.fundingAmount.toLocaleString()}</strong> | Rate: <strong className="text-amber-400 font-mono">{deal.percentage}%</strong> | Gross Fee: <strong className="text-emerald-400 font-mono">${totalGross.toLocaleString()}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {deal.commissionStatus !== 'COLLECTED' && (
                        <button
                          onClick={() => markDealCommissionReceived(deal.id)}
                          className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 font-bold text-xs rounded-xl transition-all"
                        >
                          Mark as Collected
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenClient(deal.clientId)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
                      >
                        Open Client File
                      </button>
                    </div>
                  </div>

                  {/* Participant Chips */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                    {pList.map((p) => (
                      <div key={p.id} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                        <strong className="text-slate-200">{p.name}:</strong>
                        <span className="text-amber-400 font-mono">{p.points}%</span>
                        <span className="text-emerald-400 font-mono">(${p.dollarAmount.toLocaleString()})</span>
                      </div>
                    ))}
                    {pList.length === 0 && (
                      <span className="text-xs text-slate-500 italic">No split participants added yet.</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit / Add Rule Modal */}
      {showRuleModal && editingRule && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1c38] border border-blue-900 rounded-2xl p-6 text-slate-100 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-amber-400" />
              {editingRule.id ? 'Edit Commission Rule' : 'Add Commission Rule for Loan Type'}
            </h3>

            <form onSubmit={handleSaveRule} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Loan / Funding Product Type</label>
                <input
                  type="text"
                  required
                  value={editingRule.loanType || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, loanType: e.target.value })}
                  placeholder="e.g. SBA 7(a) Loan / Revenue Funding"
                  className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Default Gross Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingRule.defaultRate || 10.0}
                    onChange={(e) => setEditingRule({ ...editingRule, defaultRate: Number(e.target.value) })}
                    className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Status</label>
                  <select
                    value={editingRule.active ? 'true' : 'false'}
                    onChange={(e) => setEditingRule({ ...editingRule, active: e.target.value === 'true' })}
                    className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="true">Active Rule</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Description & Guidelines</label>
                <input
                  type="text"
                  value={editingRule.description || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  placeholder="Standard deal split for this funding category"
                  className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-blue-900">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 transition-colors shadow-md disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSaving ? 'Saving to Firestore...' : 'SAVE COMMISSION RULE'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Directory Modal */}
      {showAddDirModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1c38] border border-blue-900 rounded-2xl p-6 text-slate-100 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100">Add Entry to Commission Directory</h3>
            <form onSubmit={handleAddDirectoryEntry} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newDirForm.name}
                  onChange={(e) => setNewDirForm({ ...newDirForm, name: e.target.value })}
                  placeholder="e.g. Dana / Capital Partner"
                  className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Type</label>
                  <select
                    value={newDirForm.type}
                    onChange={(e) => setNewDirForm({ ...newDirForm, type: e.target.value as any })}
                    className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs text-slate-300 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Internal Staff">Internal Staff</option>
                    <option value="Referral Partner">Referral Partner</option>
                    <option value="Broker Partner">Broker Partner</option>
                    <option value="Business Partner">Business Partner</option>
                    <option value="Outside Partner">Outside Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Default Points %</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newDirForm.defaultPoints}
                    onChange={(e) => setNewDirForm({ ...newDirForm, defaultPoints: Number(e.target.value) })}
                    className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">Role Description</label>
                <input
                  type="text"
                  value={newDirForm.role}
                  onChange={(e) => setNewDirForm({ ...newDirForm, role: e.target.value })}
                  placeholder="e.g. Sales Origination & Closer"
                  className="w-full bg-[#060c1a] border border-blue-900 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-blue-900">
                <button
                  type="button"
                  onClick={() => setShowAddDirModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-colors shadow-md disabled:opacity-50"
                >
                  Save to Directory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
