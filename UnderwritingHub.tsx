import React, { useState } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  DollarSign,
  FileCheck2,
  Building2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { StatusBadge, ProductBadge } from '../common/StatusBadge';

interface UnderwritingHubProps {
  setActiveTab: (tab: string) => void;
}

export const UnderwritingHub: React.FC<UnderwritingHubProps> = ({ setActiveTab }) => {
  const { clients, setSelectedClientId } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      searchQuery === '' ||
      (c.firstName + ' ' + c.lastName).toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.requestedProduct?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDecision =
      decisionFilter === 'ALL' ||
      (decisionFilter === 'UNDERWRITTEN' && c.isUnderwritten) ||
      (decisionFilter === 'PENDING' && !c.isUnderwritten);

    return matchesSearch && matchesDecision;
  });

  const handleOpenUnderwriting = (clientId: string) => {
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
              Underwriting & Qualification Desk
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">Total Underwriting Files: {clients.length}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Underwriting & Risk Evaluation Center
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate 4-month bank statement cash flow, credit profile, verified identity/business data, calculate debt service, and approve files for lender submission.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setDecisionFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              decisionFilter === 'ALL' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Files
          </button>
          <button
            onClick={() => setDecisionFilter('PENDING')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              decisionFilter === 'PENDING' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Review Needed ({clients.filter((c) => !c.isUnderwritten).length})
          </button>
          <button
            onClick={() => setDecisionFilter('UNDERWRITTEN')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              decisionFilter === 'UNDERWRITTEN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Qualified / Approved ({clients.filter((c) => c.isUnderwritten).length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client, company, product, credit score..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50"
        />
      </div>

      {/* Underwriting Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Client / Entity</th>
                <th className="py-3 px-3">Requested Product & Amount</th>
                <th className="py-3 px-3">Financials & FICO</th>
                <th className="py-3 px-3">Phone Verification</th>
                <th className="py-3 px-3">Underwriting Assessment</th>
                <th className="py-3 px-3">Assigned Staff</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100 text-xs">
                      {client.firstName} {client.lastName}
                    </div>
                    <div className="text-[11px] text-blue-400 font-semibold mt-0.5">
                      {client.businessName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {client.industry} • {client.state}
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-mono font-bold text-slate-100 text-xs">
                      ${client.requestedAmount?.toLocaleString()}
                    </div>
                    <div className="mt-1">
                      <ProductBadge product={client.requestedProduct} />
                    </div>
                  </td>

                  <td className="py-3.5 px-3 font-mono">
                    <div className="text-emerald-400 font-bold text-xs">
                      ${client.annualRevenue?.toLocaleString()} /yr
                    </div>
                    <div className="text-[11px] text-slate-400">
                      ${client.monthlyRevenue?.toLocaleString()} /mo
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      FICO Score: <strong className="text-slate-300 font-bold">{client.creditScore}</strong>
                    </div>
                  </td>

                  <td className="py-3.5 px-3">
                    {client.isVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" /> Verified ({client.verifiedBy})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        <AlertTriangle className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    {client.isUnderwritten ? (
                      <div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-bold">
                          {client.underwritingDecision || 'QUALIFIED'}
                        </span>
                        <div className="text-[9px] text-slate-500 mt-0.5">
                          Rec: ${client.recommendedAmount?.toLocaleString()} ({client.recommendedProduct})
                        </div>
                      </div>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                        Pending Evaluation
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="text-slate-200 text-xs">{client.assignedStaff}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenUnderwriting(client.id)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-200 rounded-lg text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 ml-auto"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Evaluate File</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
