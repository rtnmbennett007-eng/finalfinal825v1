import React, { useState } from 'react';
import {
  PieChart,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  DollarSign,
  User,
  Building2,
  Clock,
  AlertTriangle,
  Users,
  Percent,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Client, CommissionParticipant, FundingDeal } from '../../../types';
import { useData } from '../../../context/DataContext';
import { useAuth } from '../../../context/AuthContext';
import { ConfirmModal } from '../../common/ConfirmModal';

interface CommissionDistributionTabProps {
  client: Client;
  deals?: FundingDeal[];
  commissions?: CommissionParticipant[];
  onRefresh: () => void;
}

export const CommissionDistributionTab: React.FC<CommissionDistributionTabProps> = ({
  client,
  deals = [],
  commissions = [],
  onRefresh,
}) => {
  const {
    addCommissionParticipant,
    updateCommissionParticipant,
    deleteCommissionParticipant,
    markDealCommissionReceived,
    commissionDirectory,
    addToast,
  } = useData();
  const { currentUser, staffList } = useAuth();

  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeCommissions = Array.isArray(commissions) ? commissions : [];

  // Selected Deal
  const [selectedDealId, setSelectedDealId] = useState<string>(safeDeals[0]?.id || '');
  const activeDeal = safeDeals.find((d) => d?.id === selectedDealId) || safeDeals[0] || null;

  // Editing Points state: map of participantId -> points
  const [editingPoints, setEditingPoints] = useState<Record<string, number>>({});
  const [isSavingPoints, setIsSavingPoints] = useState<Record<string, boolean>>({});

  // Add Participant Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingParticipant, setIsDeletingParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState<Partial<CommissionParticipant>>({
    name: 'Dana',
    type: 'Internal Staff',
    role: 'Operations & Funding Specialist',
    points: 1.0,
    notes: '',
    status: 'PENDING',
  });

  // Deal Participants
  const dealParticipants = activeDeal
    ? commissions.filter((c) => c.dealId === activeDeal.id)
    : [];

  const totalPointsAllocated = dealParticipants.reduce((sum, p) => sum + Number(p.points), 0);
  const totalDollarAllocated = dealParticipants.reduce((sum, p) => sum + Number(p.dollarAmount), 0);

  const dealTotalCommissionGross = activeDeal
    ? (Number(activeDeal.fundingAmount) * Number(activeDeal.percentage)) / 100
    : 0;

  // Edit Points Handlers
  const handleStartEditPoints = (participant: CommissionParticipant) => {
    setEditingPoints((prev) => ({ ...prev, [participant.id]: participant.points }));
  };

  const handleSavePoints = async (participant: CommissionParticipant) => {
    const updatedPointValue = editingPoints[participant.id];
    if (updatedPointValue === undefined || isNaN(updatedPointValue)) return;

    setIsSavingPoints((prev) => ({ ...prev, [participant.id]: true }));
    try {
      await updateCommissionParticipant(participant.id, {
        points: Number(updatedPointValue),
      });

      addToast(
        'success',
        'Points Updated',
        `${participant.name}'s points updated to ${updatedPointValue} pts ($${(
          (Number(activeDeal?.fundingAmount || 0) * Number(updatedPointValue)) /
          100
        ).toLocaleString()}).`
      );

      // Clear edit state
      setEditingPoints((prev) => {
        const next = { ...prev };
        delete next[participant.id];
        return next;
      });

      onRefresh();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Failed to update points.');
    } finally {
      setIsSavingPoints((prev) => ({ ...prev, [participant.id]: false }));
    }
  };

  // Delete Participant Handler
  const handleDeleteParticipant = (participantId: string, name: string) => {
    setParticipantToDelete({ id: participantId, name });
  };

  const handleConfirmDeleteParticipant = async () => {
    if (!participantToDelete) return;
    setIsDeletingParticipant(true);
    try {
      await deleteCommissionParticipant(participantToDelete.id);
      addToast('success', 'Participant Removed', `${participantToDelete.name} has been removed from commission distribution.`);
      setParticipantToDelete(null);
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Delete Failed', err.message || 'Failed to delete participant.');
    } finally {
      setIsDeletingParticipant(false);
    }
  };

  // Add Participant Handler
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeal) return;

    try {
      await addCommissionParticipant(activeDeal.id, {
        ...newParticipant,
        points: Number(newParticipant.points || 1.0),
      });

      addToast(
        'success',
        'Participant Added',
        `${newParticipant.name} has been added to Deal #${activeDeal.id.slice(-6)} commission structure.`
      );

      setShowAddModal(false);
      setNewParticipant({
        name: 'Dana',
        type: 'Internal Staff',
        role: 'Operations & Funding Specialist',
        points: 1.0,
        notes: '',
        status: 'PENDING',
      });

      onRefresh();
    } catch (err: any) {
      addToast('error', 'Addition Failed', err.message || 'Could not add participant.');
    }
  };

  // Mark Deal Commission Collected
  const handleMarkCollected = async () => {
    if (!activeDeal) return;
    try {
      await markDealCommissionReceived(activeDeal.id);
      addToast(
        'success',
        'Commission Marked Collected',
        `Deal #${activeDeal.id.slice(-6)} commission collected and all participant statuses updated to RECEIVED.`
      );
      onRefresh();
    } catch (err: any) {
      addToast('error', 'Update Failed', err.message || 'Could not update deal status.');
    }
  };

  if (!activeDeal && deals.length === 0) {
    return (
      <div className="bg-[#0b1528] border border-blue-900/60 p-8 rounded-2xl shadow-xl text-center space-y-3">
        <PieChart className="w-10 h-10 text-amber-400 mx-auto opacity-60" />
        <h3 className="text-base font-bold text-slate-100">No Funding Deals for Commission Split</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Create or propose a funding deal first in the Funding & Stacking tab to configure commission
          point distributions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Deal Selector */}
      <div className="bg-[#0b1528] border border-blue-900/60 p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-4">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <PieChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                Commission Structure & Points Distribution
              </span>
              {activeDeal?.commissionStatus === 'COLLECTED' ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> COLLECTED
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-bold">
                  PENDING COLLECTION
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-slate-100 mt-1">
              Internal & Broker Commission Splits
            </h2>
            <p className="text-xs text-slate-400">
              Edit points live with instant recalculation. Add or remove originators, underwriters,
              closers, and referral partners.
            </p>
          </div>
        </div>

        {/* Deal Selector Dropdown */}
        <div className="flex items-center space-x-3 shrink-0">
          <label className="text-xs text-slate-400 font-semibold">Active Deal:</label>
          <select
            value={selectedDealId}
            onChange={(e) => setSelectedDealId(e.target.value)}
            className="bg-[#070d18] border border-blue-900/70 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
          >
            {deals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.product} - ${Number(d.fundingAmount).toLocaleString()} ({d.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deal Financial Overview Cards */}
      {activeDeal && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-xl shadow-lg">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Deal Funding Volume
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono mt-1">
              ${Number(activeDeal.fundingAmount).toLocaleString()}
            </div>
            <div className="text-[10px] text-blue-300 mt-1">{activeDeal.product}</div>
          </div>

          <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-xl shadow-lg">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Fee Percentage Rate
            </div>
            <div className="text-xl font-bold text-amber-400 font-mono mt-1">
              {activeDeal.percentage}%
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Origination Fee: ${dealTotalCommissionGross.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-xl shadow-lg">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
              Total Points Distributed
            </div>
            <div className="text-xl font-bold text-blue-400 font-mono mt-1">
              {totalPointsAllocated.toFixed(2)} pts
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Payout Total: ${totalDollarAllocated.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#0b1528] border border-blue-900/60 p-4 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Collection Status
              </div>
              <div className="text-sm font-bold text-slate-100 mt-1">
                {activeDeal.commissionStatus === 'COLLECTED' ? 'Collected' : 'Pending Receipt'}
              </div>
            </div>
            {activeDeal.commissionStatus !== 'COLLECTED' && (
              <button
                onClick={handleMarkCollected}
                className="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
              >
                Mark Commission Received
              </button>
            )}
          </div>
        </div>
      )}

      {/* Participants Table */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-blue-900/80 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Deal Participant Splits ({dealParticipants.length} Participants)
            </h3>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Participant to Deal</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-[#070d18] border-b border-blue-900/60 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4">Dollar Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/40">
              {dealParticipants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No participants added to this deal yet. Click "Add Participant to Deal" above.
                  </td>
                </tr>
              ) : (
                dealParticipants.map((p) => {
                  const isEditingThis = editingPoints[p.id] !== undefined;
                  const currentPointValue = isEditingThis ? editingPoints[p.id] : p.points;
                  const currentDollarValue = activeDeal
                    ? (Number(activeDeal.fundingAmount) * Number(currentPointValue)) / 100
                    : p.dollarAmount;

                  return (
                    <tr key={p.id} className="hover:bg-blue-900/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                          {p.name}
                        </div>
                        {p.notes && <div className="text-[10px] text-slate-400 mt-0.5">{p.notes}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            p.type === 'Internal Staff'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          }`}
                        >
                          {p.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">{p.role}</td>

                      {/* Points Column - Inline Editable */}
                      <td className="py-3.5 px-4">
                        {isEditingThis ? (
                          <div className="flex items-center space-x-1.5">
                            <input
                              type="number"
                              step="0.1"
                              min="0"
                              max="20"
                              value={currentPointValue}
                              onChange={(e) =>
                                setEditingPoints((prev) => ({
                                  ...prev,
                                  [p.id]: parseFloat(e.target.value) || 0,
                                }))
                              }
                              className="w-16 bg-[#070d18] border border-amber-400 rounded-lg px-2 py-1 text-xs font-bold text-amber-300 focus:outline-none"
                              autoFocus
                            />
                            <span className="text-xs text-slate-400 font-mono">pts</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {Number(p.points).toFixed(2)} pts
                            </span>
                            <button
                              onClick={() => handleStartEditPoints(p)}
                              className="text-slate-400 hover:text-amber-400 transition-colors p-1"
                              title="Edit points"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Dollar Amount Column */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">
                        ${Number(currentDollarValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            p.status === 'DISTRIBUTED' || p.status === 'RECEIVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isEditingThis ? (
                            <>
                              <button
                                onClick={() => handleSavePoints(p)}
                                disabled={isSavingPoints[p.id]}
                                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() =>
                                  setEditingPoints((prev) => {
                                    const next = { ...prev };
                                    delete next[p.id];
                                    return next;
                                  })
                                }
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleDeleteParticipant(p.id, p.name)}
                              className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-950/40"
                              title="Delete participant"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Participant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-blue-900 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Add Commission Participant
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Participant Type</label>
                <select
                  value={newParticipant.type}
                  onChange={(e) =>
                    setNewParticipant({ ...newParticipant, type: e.target.value as any })
                  }
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Internal Staff">Internal Staff</option>
                  <option value="Referral Partner">Referral Partner / Broker</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Participant Name</label>
                {newParticipant.type === 'Internal Staff' ? (
                  <select
                    value={newParticipant.name}
                    onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {staffList.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.department})
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={newParticipant.name}
                    onChange={(e) => {
                      const selected = commissionDirectory.find((c) => c.name === e.target.value);
                      setNewParticipant({
                        ...newParticipant,
                        name: e.target.value,
                        role: selected?.role || 'Referral Broker',
                        points: selected?.defaultPoints || 1.0,
                      });
                    }}
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  >
                    {commissionDirectory.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.type}) - Default {c.defaultPoints} pts
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Role / Capacity</label>
                <input
                  type="text"
                  value={newParticipant.role}
                  onChange={(e) => setNewParticipant({ ...newParticipant, role: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Originator, Underwriter, Closer, Referring Affiliate"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Points (Points %)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="20"
                    value={newParticipant.points}
                    onChange={(e) =>
                      setNewParticipant({
                        ...newParticipant,
                        points: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-amber-300 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Payout</label>
                  <div className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-emerald-400 font-bold font-mono">
                    ${(
                      (Number(activeDeal?.fundingAmount || 0) * Number(newParticipant.points || 0)) /
                      100
                    ).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Internal Notes</label>
                <input
                  type="text"
                  value={newParticipant.notes}
                  onChange={(e) => setNewParticipant({ ...newParticipant, notes: e.target.value })}
                  className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-slate-100 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. Split agreed on Jan 15"
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
                  Add Participant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Split Participant Confirm Modal */}
      <ConfirmModal
        isOpen={!!participantToDelete}
        onClose={() => setParticipantToDelete(null)}
        onConfirm={handleConfirmDeleteParticipant}
        title="Remove Commission Participant"
        message={`Are you sure you want to remove ${participantToDelete?.name || 'this participant'} from this deal's commission distribution?`}
        confirmText="Remove Participant"
        cancelText="Cancel"
        isLoading={isDeletingParticipant}
        type="danger"
      />
    </div>
  );
};
