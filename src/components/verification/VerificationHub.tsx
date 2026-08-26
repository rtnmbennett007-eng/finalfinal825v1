import React, { useState } from 'react';
import {
  FileCheck2,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge } from '../common/StatusBadge';

interface VerificationHubProps {
  setActiveTab: (tab: string) => void;
}

export const VerificationHub: React.FC<VerificationHubProps> = ({ setActiveTab }) => {
  const { clients, setSelectedClientId } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('PENDING');

  const verificationList = clients.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery);

    if (filter === 'PENDING') return matchesSearch && !c.isVerified;
    if (filter === 'VERIFIED') return matchesSearch && c.isVerified;
    return matchesSearch;
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
              Verification Call Desk
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              Pending: {clients.filter((c) => !c.isVerified).length} | Verified: {clients.filter((c) => c.isVerified).length}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-blue-400" />
            Verification Call Operations
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conduct field-by-field live phone verification with client. Verifier corrections synchronize automatically across the master client record, underwriting file, and deals.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'PENDING' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Needs Call ({clients.filter((c) => !c.isVerified).length})
            </button>
            <button
              onClick={() => setFilter('VERIFIED')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'VERIFIED' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verified ({clients.filter((c) => c.isVerified).length})
            </button>
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                filter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name, business, or phone number..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {/* Verification Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {verificationList.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
            No verification files found matching selection.
          </div>
        ) : (
          verificationList.map((client) => (
            <div
              key={client.id}
              className="bg-slate-900/40 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl space-y-3 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">
                    Stage: {client.currentStatus}
                  </span>
                  {client.isVerified ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-blue-400" /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> Needs Phone Call
                    </span>
                  )}
                </div>

                <div className="mt-2">
                  <h3 className="text-sm font-bold text-slate-100">
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="text-xs text-blue-400 font-semibold mt-0.5">
                    {client.businessName}
                  </div>
                </div>

                <div className="space-y-1.5 mt-3 text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span>Phone:</span>
                    <strong className="text-slate-200">{client.phone}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Email:</span>
                    <strong className="text-slate-200">{client.email}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Revenue:</span>
                    <strong className="text-emerald-400 font-mono">${client.annualRevenue?.toLocaleString()}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Requested:</span>
                    <strong className="text-slate-100 font-mono">${client.requestedAmount?.toLocaleString()}</strong>
                  </div>
                </div>

                {client.isVerified && client.verificationSummary && (
                  <div className="text-[11px] text-slate-400 italic mt-2 p-2 rounded bg-slate-950 border border-slate-800/60">
                    "{client.verificationSummary}"
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  Assigned: {client.assignedStaff}
                </span>

                <button
                  onClick={() => handleOpenClient(client.id)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Open Call Script</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
