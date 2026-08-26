import React from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Calendar,
  Building2,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Client, CommissionParticipant, FundingDeal, Lead } from '../../../types';
import {
  exportCommissionsToCsv,
  exportDealsToCsv,
  exportMasterOperationsToCsv,
} from '../../../utils/reportExport';
import { formatDateTime } from '../../../utils/dateUtils';

interface ExportPrintTabProps {
  filteredDeals: FundingDeal[];
  allDeals: FundingDeal[];
  clients: Client[];
  leads: Lead[];
  commissions: CommissionParticipant[];
  activeFiltersSummary: string;
  activePipelineValue: number;
  totalFundedValue: number;
  expectedCommissionTotal: number;
  currentUser?: any;
}

export const ExportPrintTab: React.FC<ExportPrintTabProps> = ({
  filteredDeals,
  allDeals,
  clients,
  leads,
  commissions,
  activeFiltersSummary,
  activePipelineValue,
  totalFundedValue,
  expectedCommissionTotal,
  currentUser,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const totalCollectedCommission = filteredDeals
    .filter((d) => d.commissionStatus === 'COLLECTED')
    .reduce((sum, d) => sum + ((Number(d.fundingAmount) || 0) * (Number(d.percentage) || 0)) / 100, 0);

  const totalPendingCommission = filteredDeals
    .filter((d) => d.status === 'FUNDED' && d.commissionStatus !== 'COLLECTED')
    .reduce((sum, d) => sum + ((Number(d.fundingAmount) || 0) * (Number(d.percentage) || 0)) / 100, 0);

  return (
    <div className="space-y-8">
      {/* CSV / Excel Export Cards Bar */}
      <div className="bg-[#0e1c38] border border-blue-900/60 rounded-2xl p-5 shadow-xl print:hidden">
        <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Download className="w-4 h-4 text-cyan-400" />
              Direct Data Export & Downloads (CSV / Excel)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export real-time synchronized operational data to standard spreadsheet formats.
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Option 1 */}
          <div className="bg-[#091224] p-4 rounded-xl border border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Filtered Deals Report</h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {filteredDeals.length} active matching deals
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              Exports all deal records matching current filters including product, fees, rates, and lenders.
            </p>
            <button
              onClick={() => exportDealsToCsv(filteredDeals, 'Maple_X_Filtered_Deals_Report')}
              className="w-full py-2 px-3 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-cyan-300 text-xs font-bold transition-all border border-blue-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Deals CSV</span>
            </button>
          </div>

          {/* Option 2 */}
          <div className="bg-[#091224] p-4 rounded-xl border border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Commission & Stacking Ledger</h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {commissions.length} participant lines
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              Detailed participant breakdown with point allocations, dollar amounts, status, and received dates.
            </p>
            <button
              onClick={() => exportCommissionsToCsv(commissions, allDeals, 'Maple_X_Commission_Ledger')}
              className="w-full py-2 px-3 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-amber-300 text-xs font-bold transition-all border border-blue-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Commission CSV</span>
            </button>
          </div>

          {/* Option 3 */}
          <div className="bg-[#091224] p-4 rounded-xl border border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-100">Master Operations Dataset</h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {clients.length} clients + {leads.length} leads
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 line-clamp-2">
              Complete organizational export combining client master records, lead conversions, and volume totals.
            </p>
            <button
              onClick={() => exportMasterOperationsToCsv(clients, allDeals, leads, 'Maple_X_Master_Operations')}
              className="w-full py-2 px-3 rounded-lg bg-blue-900/60 hover:bg-blue-800 text-emerald-300 text-xs font-bold transition-all border border-blue-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Master CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Formatted Printable Executive Audit Report View */}
      <div className="bg-[#0a1428] border border-blue-900/70 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-100 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-900/50 print:border-black">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-amber-400 print:text-black">
              Maple X Financial • Executive Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 print:text-black mt-1">
              OPERATIONS & FUNDING PERFORMANCE REPORT
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-700 mt-1">
              Official executive financial audit and deal pipeline settlement report.
            </p>
          </div>

          <div className="text-right text-xs font-mono space-y-1">
            <div className="text-slate-300 print:text-black">
              Generated: <strong>{formatDateTime(new Date())}</strong>
            </div>
            <div className="text-slate-400 print:text-gray-600">
              Generated By: <strong>{currentUser?.name || 'Authorized Staff'}</strong>
            </div>
            <div className="text-cyan-400 print:text-black text-[11px]">
              Filters: {activeFiltersSummary || 'All Available Records'}
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics Block */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#0e1c38] border border-blue-900/60 p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] text-blue-300 print:text-black uppercase font-bold tracking-wider">
              Total Funded Capital
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 print:text-black mt-1">
              ${totalFundedValue.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#0e1c38] border border-blue-900/60 p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] text-blue-300 print:text-black uppercase font-bold tracking-wider">
              Active Pipeline Volume
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 print:text-black mt-1">
              ${activePipelineValue.toLocaleString()}
            </div>
          </div>

          <div className="bg-[#0e1c38] border border-blue-900/60 p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] text-blue-300 print:text-black uppercase font-bold tracking-wider">
              Commission Collected
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400 print:text-black mt-1">
              ${Math.round(totalCollectedCommission).toLocaleString()}
            </div>
          </div>

          <div className="bg-[#0e1c38] border border-blue-900/60 p-4 rounded-xl print:border-gray-300 print:bg-gray-50">
            <div className="text-[10px] text-blue-300 print:text-black uppercase font-bold tracking-wider">
              Pending Commission
            </div>
            <div className="text-xl font-bold font-mono text-amber-400 print:text-black mt-1">
              ${Math.round(totalPendingCommission).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Printable Deals Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black">
            Funding Deals Breakdown ({filteredDeals.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-blue-900/50 print:border-black">
              <thead className="bg-[#070e20] text-slate-400 border-b border-blue-900/50 uppercase font-mono text-[10px] print:bg-gray-100 print:text-black print:border-black">
                <tr>
                  <th className="py-2 px-3">Deal ID</th>
                  <th className="py-2 px-3">Client & Business</th>
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3 text-right">Amount ($)</th>
                  <th className="py-2 px-3 text-right">Rate (%)</th>
                  <th className="py-2 px-3 text-right">Commission ($)</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Lender</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30 print:divide-gray-300">
                {filteredDeals.map((deal) => {
                  const amt = Number(deal.fundingAmount) || 0;
                  const pct = Number(deal.percentage) || 0;
                  const comm = (amt * pct) / 100;
                  return (
                    <tr key={deal.id} className="print:text-black">
                      <td className="py-2 px-3 font-mono">#{deal.id.slice(-6)}</td>
                      <td className="py-2 px-3 font-semibold">
                        {deal.clientName} <span className="text-slate-400 print:text-gray-600 font-normal">({deal.businessName})</span>
                      </td>
                      <td className="py-2 px-3">{deal.product}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">${amt.toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono">{pct.toFixed(2)}%</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">${comm.toLocaleString()}</td>
                      <td className="py-2 px-3 uppercase font-mono text-[10px]">{deal.status}</td>
                      <td className="py-2 px-3">{deal.lenderName || 'Maple Direct Capital'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Executive Signatures Block */}
        <div className="pt-8 border-t border-blue-900/50 print:border-black grid grid-cols-2 sm:grid-cols-3 gap-6">
          <div>
            <div className="border-b border-slate-600 print:border-black pb-8"></div>
            <div className="text-[11px] text-slate-400 print:text-black font-semibold mt-1">
              Director of Operations & Funding
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Dana Javier</div>
          </div>

          <div>
            <div className="border-b border-slate-600 print:border-black pb-8"></div>
            <div className="text-[11px] text-slate-400 print:text-black font-semibold mt-1">
              Underwriting & Stacking Director
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Luke Cowan</div>
          </div>

          <div>
            <div className="border-b border-slate-600 print:border-black pb-8"></div>
            <div className="text-[11px] text-slate-400 print:text-black font-semibold mt-1">
              Executive Principal
            </div>
            <div className="text-[10px] text-slate-500 font-mono">Robert / Steve</div>
          </div>
        </div>
      </div>
    </div>
  );
};
