import React, { useState } from 'react';
import {
  X,
  DollarSign,
  Plus,
  Building2,
  User,
  Percent,
  Layers,
  Sparkles,
} from 'lucide-react';
import { FundingDeal, FundingProductType, CANONICAL_DEAL_STATUSES, Client } from '../../types';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { ProductSelect } from '../common/ProductSelect';
import { calculateDealCommission } from '../../utils/commissionCalculator';

interface NewDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultClientId?: string;
  onDealCreated?: (deal: FundingDeal) => void;
}

export const NewDealModal: React.FC<NewDealModalProps> = ({
  isOpen,
  onClose,
  defaultClientId,
  onDealCreated,
}) => {
  const { clients, deals, createDeal, addToast } = useData();
  const { currentUser } = useAuth();

  const selectedClient = clients.find((c) => c.id === defaultClientId) || clients[0];

  const [clientId, setClientId] = useState(defaultClientId || selectedClient?.id || '');
  const [product, setProduct] = useState<FundingProductType>('Revenue Funding');
  const [otherProductType, setOtherProductType] = useState('');
  const [position, setPosition] = useState('1st Position');
  const [requestedAmount, setRequestedAmount] = useState<number | ''>(50000);
  const [approvedAmount, setApprovedAmount] = useState<number | ''>('');
  const [fundedAmount, setFundedAmount] = useState<number | ''>('');
  const [percentage, setPercentage] = useState<number | ''>('');
  const [fee, setFee] = useState<number | ''>('');
  const [factorRate, setFactorRate] = useState('');
  const [termLength, setTermLength] = useState('12 Months');
  const [paymentFrequency, setPaymentFrequency] = useState<'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly'>('Monthly');
  const [status, setStatus] = useState<FundingDeal['status']>('Draft');
  const [funder, setFunder] = useState('Maple Direct Capital');
  const [lenderContact, setLenderContact] = useState('');
  const [assignedRep, setAssignedRep] = useState(currentUser?.name || 'Dana');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentClient = clients.find((c) => c.id === clientId) || selectedClient;
  const existingClientDeals = deals.filter((d) => d.clientId === clientId);
  const isStacked = existingClientDeals.length > 0 || position !== '1st Position';

  const previewCommission = calculateDealCommission({
    fundingAmount: Number(fundedAmount || approvedAmount || requestedAmount || 0),
    percentage: Number(percentage || 0),
    fee: Number(fee || 0),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClient) {
      addToast('error', 'Validation Error', 'Please select a valid client.');
      return;
    }
    const reqAmt = Number(requestedAmount) || 0;
    const appAmt = Number(approvedAmount) || 0;
    const fndAmt = Number(fundedAmount) || 0;
    const finalFundingAmount = fndAmt > 0 ? fndAmt : (appAmt > 0 ? appAmt : reqAmt);

    if (finalFundingAmount <= 0) {
      addToast('error', 'Validation Error', 'Please enter a valid requested, approved, or funded amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newDeal = await createDeal({
        clientId: currentClient.id,
        clientName: `${currentClient.firstName} ${currentClient.lastName}`.trim(),
        businessName: currentClient.businessName || 'Business Entity',
        product,
        otherProductType,
        position,
        isStacked,
        requestedAmount: reqAmt,
        approvedAmount: appAmt,
        fundedAmount: fndAmt,
        fundingAmount: finalFundingAmount,
        percentage: percentage !== '' ? Number(percentage) : undefined,
        fee: fee !== '' ? Number(fee) : undefined,
        factorRate,
        termLength,
        paymentFrequency,
        status,
        funder,
        lenderName: funder,
        lenderContact,
        assignedRep,
        assignedStaff: assignedRep,
        notes,
        createdBy: currentUser?.name || 'Staff',
      });

      addToast(
        'success',
        'Funding Deal Created',
        `Deal position ${newDeal.dealId || newDeal.id} created for ${currentClient.businessName}.`
      );

      if (onDealCreated) onDealCreated(newDeal);
      onClose();
    } catch (err: any) {
      addToast('error', 'Creation Failed', err.message || 'Could not create funding deal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0c1832] border border-blue-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-fadeIn max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Create New Funding Deal</h3>
              <p className="text-xs text-slate-400">
                Creates an independent, first-class deal record with canonical Deal ID
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Client Selector */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Select Client / Business Entity *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-semibold"
              required
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName || `${c.firstName} ${c.lastName}`} ({c.firstName} {c.lastName})
                </option>
              ))}
            </select>
            {existingClientDeals.length > 0 && (
              <p className="text-[11px] text-amber-300/80 mt-1">
                Client already has {existingClientDeals.length} active deal(s). This new deal will be added as a stacked position.
              </p>
            )}
          </div>

          {/* Product & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <ProductSelect
                label="Funding Product Type"
                required
                value={product}
                onChange={(val) => setProduct(val as FundingProductType)}
                otherType={otherProductType}
                onChangeOtherType={setOtherProductType}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Stack Position</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              >
                <option value="1st Position">1st Position (Primary)</option>
                <option value="2nd Position">2nd Position (Stacked)</option>
                <option value="3rd Position">3rd Position (Stacked)</option>
                <option value="4th Position">4th Position (Stacked)</option>
                <option value="5th+ Position">5th+ Position (Deep Stack)</option>
              </select>
            </div>
          </div>

          {/* Amounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Requested Amount ($) *</label>
              <input
                type="number"
                required
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="50,000"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Approved Amount ($)</label>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-cyan-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Funded Amount ($)</label>
              <input
                type="number"
                value={fundedAmount}
                onChange={(e) => setFundedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Optional"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-emerald-400 font-mono font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Rate, Term, Frequency */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Factor / Rate</label>
              <input
                type="text"
                value={factorRate}
                onChange={(e) => setFactorRate(e.target.value)}
                placeholder="e.g. 1.25"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Term Length</label>
              <input
                type="text"
                value={termLength}
                onChange={(e) => setTermLength(e.target.value)}
                placeholder="e.g. 12 Months"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Payment Frequency</label>
              <select
                value={paymentFrequency}
                onChange={(e) => setPaymentFrequency(e.target.value as any)}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Bi-Weekly">Bi-Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-semibold"
              >
                {CANONICAL_DEAL_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Funder & Rep */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Funder / Target Lender</label>
              <input
                type="text"
                value={funder}
                onChange={(e) => setFunder(e.target.value)}
                placeholder="Maple Direct Capital"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Assigned Rep / Staff</label>
              <input
                type="text"
                value={assignedRep}
                onChange={(e) => setAssignedRep(e.target.value)}
                placeholder="Dana"
                className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Commission Details (Optional) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-[#070d18] border border-blue-900/50 rounded-xl">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Commission Rate (%) (Optional)
              </label>
              <input
                type="number"
                step="0.1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Leave blank or enter %"
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2 text-xs text-amber-300 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Origination Fee ($) (Optional)
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Leave blank or enter fee $"
                className="w-full bg-[#0b1528] border border-blue-900/70 rounded-xl p-2 text-xs text-cyan-300 font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Initial Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Initial deal background, lender requirements, or notes..."
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-blue-900/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Deal Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
