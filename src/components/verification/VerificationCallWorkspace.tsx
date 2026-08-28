import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShieldCheck,
  Building2,
  DollarSign,
  User,
  MapPin,
  Calendar,
  Lock,
  Unlock,
  Save,
  ArrowLeft,
  Briefcase,
  Layers,
  Sparkles,
  FileText,
  FileCheck2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Client, DocumentItem, CanonicalPipelineStage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface FieldVerificationState {
  status: 'VERIFIED' | 'CHANGED' | 'UNABLE_TO_VERIFY' | 'PENDING';
  currentValue: any;
  correctedValue?: any;
  notes?: string;
  source: 'Application' | 'Call Verified' | 'Bank Statement' | 'Manual';
}

interface VerificationCallWorkspaceProps {
  client: Client;
  onBack: () => void;
  onClientUpdated?: (updated: Client) => void;
  onNavigateToClient360?: (clientId: string) => void;
}

export const VerificationCallWorkspace: React.FC<VerificationCallWorkspaceProps> = ({
  client,
  onBack,
  onClientUpdated,
  onNavigateToClient360,
}) => {
  const { currentUser } = useAuth();
  const { updateClient, documents, addToast } = useData();

  // Client Documents for prerequisites check
  const clientDocs = useMemo(
    () => documents.filter((d) => d.clientId === client.id),
    [documents, client.id]
  );

  const hasGovtId = useMemo(
    () =>
      clientDocs.some((d) => {
        const cat = (d.category || '').toLowerCase();
        const title = (d.title || d.fileName || '').toLowerCase();
        return cat.includes('id') || cat.includes('license') || title.includes('id') || title.includes('license') || title.includes('passport');
      }),
    [clientDocs]
  );

  const bankStatementCount = useMemo(
    () =>
      clientDocs.filter((d) => {
        const cat = (d.category || '').toLowerCase();
        const title = (d.title || d.fileName || '').toLowerCase();
        return cat.includes('bank') || title.includes('bank') || title.includes('statement');
      }).length,
    [clientDocs]
  );

  // Verification Metadata
  const isAlreadySignedOff = !!client.isVerified && client.currentStatus === 'KYC Verified & Ready for Underwriting';
  const [isLocked, setIsLocked] = useState(isAlreadySignedOff);
  const [isSaving, setIsSaving] = useState(false);

  // Call Details State
  const [callDate, setCallDate] = useState<string>(
    client.verificationCallDate || new Date().toISOString().split('T')[0]
  );
  const [callTime, setCallTime] = useState<string>(
    client.verificationCallTime || new Date().toTimeString().slice(0, 5)
  );
  const [repName, setRepName] = useState<string>(
    client.verifiedBy || client.assignedStaff || currentUser?.name || 'Dana'
  );
  const [borrowerSpokenWith, setBorrowerSpokenWith] = useState<string>(
    client.borrowerSpokenWith || `${client.firstName} ${client.lastName}`
  );
  const [callOutcome, setCallOutcome] = useState<
    | 'Verified — Ready for Underwriting'
    | 'Needs Follow-up'
    | 'Discrepancy Detected'
    | 'Borrower Unreachable'
    | 'Declined by Borrower'
  >(
    (client.verificationCallOutcome as any) ||
      (client.isVerified ? 'Verified — Ready for Underwriting' : 'Needs Follow-up')
  );
  const [callNotes, setCallNotes] = useState<string>(
    client.verificationCallNotes || client.verificationNotes || ''
  );

  // Field-by-Field Verification Checklist
  const [fields, setFields] = useState<Record<string, FieldVerificationState>>(() => {
    const existing = client.fieldVerifications || {};
    return {
      legalName: {
        status: existing.legalName?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.businessName || '',
        correctedValue: existing.legalName?.correctedValue || '',
        notes: existing.legalName?.notes || '',
        source: existing.legalName?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      dba: {
        status: existing.dba?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.dba || client.businessName || '',
        correctedValue: existing.dba?.correctedValue || '',
        notes: existing.dba?.notes || '',
        source: existing.dba?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      entityType: {
        status: existing.entityType?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.entityType || 'LLC',
        correctedValue: existing.entityType?.correctedValue || '',
        notes: existing.entityType?.notes || '',
        source: existing.entityType?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      ownershipPercentage: {
        status: existing.ownershipPercentage?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.ownershipPercentage || 100,
        correctedValue: existing.ownershipPercentage?.correctedValue || '',
        notes: existing.ownershipPercentage?.notes || '',
        source: existing.ownershipPercentage?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      ssnLast4: {
        status: existing.ssnLast4?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.ssn ? client.ssn.slice(-4) : '••••',
        correctedValue: existing.ssnLast4?.correctedValue || '',
        notes: existing.ssnLast4?.notes || '',
        source: existing.ssnLast4?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      federalTaxId: {
        status: existing.federalTaxId?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.federalTaxId || '',
        correctedValue: existing.federalTaxId?.correctedValue || '',
        notes: existing.federalTaxId?.notes || '',
        source: existing.federalTaxId?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      businessAddress: {
        status: existing.businessAddress?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: `${client.businessAddress || ''}, ${client.businessCity || ''} ${client.businessState || ''} ${client.businessZip || ''}`.trim().replace(/^,|,$/g, ''),
        correctedValue: existing.businessAddress?.correctedValue || '',
        notes: existing.businessAddress?.notes || '',
        source: existing.businessAddress?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      annualRevenue: {
        status: existing.annualRevenue?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.annualRevenue ? `$${Number(client.annualRevenue).toLocaleString()}` : '$0',
        correctedValue: existing.annualRevenue?.correctedValue || '',
        notes: existing.annualRevenue?.notes || '',
        source: existing.annualRevenue?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      monthlyRevenue: {
        status: existing.monthlyRevenue?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.monthlyRevenue ? `$${Number(client.monthlyRevenue).toLocaleString()}` : '$0',
        correctedValue: existing.monthlyRevenue?.correctedValue || '',
        notes: existing.monthlyRevenue?.notes || '',
        source: existing.monthlyRevenue?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      averageDailyBalance: {
        status: existing.averageDailyBalance?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.avgDailyBalance ? `$${Number(client.avgDailyBalance).toLocaleString()}` : '$15,000',
        correctedValue: existing.averageDailyBalance?.correctedValue || '',
        notes: existing.averageDailyBalance?.notes || '',
        source: existing.averageDailyBalance?.source || (client.isVerified ? 'Call Verified' : 'Bank Statement'),
      },
      existingAdvances: {
        status: existing.existingAdvances?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.existingDebt || 'None Reported',
        correctedValue: existing.existingAdvances?.correctedValue || '',
        notes: existing.existingAdvances?.notes || '',
        source: existing.existingAdvances?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      positionRequested: {
        status: existing.positionRequested?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.positionRequested || '1st Position',
        correctedValue: existing.positionRequested?.correctedValue || '',
        notes: existing.positionRequested?.notes || '',
        source: existing.positionRequested?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
      useOfFunds: {
        status: existing.useOfFunds?.status || (client.isVerified ? 'VERIFIED' : 'PENDING'),
        currentValue: client.useOfFunds || 'Working Capital / Expansion',
        correctedValue: existing.useOfFunds?.correctedValue || '',
        notes: existing.useOfFunds?.notes || '',
        source: existing.useOfFunds?.source || (client.isVerified ? 'Call Verified' : 'Application'),
      },
    };
  });

  const handleFieldStatusChange = (
    key: string,
    newStatus: 'VERIFIED' | 'CHANGED' | 'UNABLE_TO_VERIFY'
  ) => {
    if (isLocked) return;
    setFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: newStatus,
        source: 'Call Verified',
      },
    }));
  };

  const handleFieldCorrection = (key: string, val: string) => {
    if (isLocked) return;
    setFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        correctedValue: val,
        status: 'CHANGED',
        source: 'Call Verified',
      },
    }));
  };

  const handleFieldNotesChange = (key: string, val: string) => {
    if (isLocked) return;
    setFields((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        notes: val,
      },
    }));
  };

  // Field Script Questions Mapping
  const FIELD_QUESTIONS: Record<string, { label: string; script: string }> = {
    legalName: {
      label: 'Business Legal Name',
      script: 'Can you please confirm the exact legal entity name as registered with your Secretary of State?',
    },
    dba: {
      label: 'DBA (Doing Business As)',
      script: 'Do you operate under any trade names, DBAs, or store signage different from your legal name?',
    },
    entityType: {
      label: 'Entity Structure',
      script: 'Is the business organized as an LLC, S-Corp, C-Corp, or Sole Proprietorship?',
    },
    ownershipPercentage: {
      label: 'Ownership Percentage',
      script: 'What exact percentage of the business do you personally own? Are there any other partners with 20% or more?',
    },
    ssnLast4: {
      label: 'SSN (Last 4 Digits)',
      script: 'For identity verification and KYC, could you please state the last 4 digits of your Social Security Number?',
    },
    federalTaxId: {
      label: 'Federal Tax ID (EIN)',
      script: 'Could you confirm your Federal Tax ID / Employer Identification Number (EIN)?',
    },
    businessAddress: {
      label: 'Operating Business Address',
      script: 'What is the physical commercial operating address where you conduct day-to-day business operations?',
    },
    annualRevenue: {
      label: 'Annual Gross Revenue',
      script: 'What was your total gross revenue for the last full tax year, and what are you pacing for this year?',
    },
    monthlyRevenue: {
      label: 'Average Monthly Revenue',
      script: 'Over the last 3 to 4 months, what is your typical monthly gross deposit volume?',
    },
    averageDailyBalance: {
      label: 'Average Daily Balance',
      script: 'What is your typical end-of-day checking account balance throughout the month?',
    },
    existingAdvances: {
      label: 'Existing Advances / MCA Balances',
      script: 'Do you currently have any active MCAs, business loans, or daily/weekly ACH debits running against your account?',
    },
    positionRequested: {
      label: 'Funding Position Requested',
      script: 'Are you seeking a 1st position funding, or looking to refinance / take a 2nd position?',
    },
    useOfFunds: {
      label: 'Specific Use of Funds',
      script: 'How do you intend to deploy this funding? (e.g. inventory purchasing, equipment, payroll, marketing)?',
    },
  };

  // Missing Prerequisite Evaluation for Sign-off
  const missingItems: string[] = useMemo(() => {
    const list: string[] = [];

    // Document Prerequisites
    if (!hasGovtId) {
      list.push('Government ID (Driver License / Passport)');
    }
    if (bankStatementCount < 3) {
      list.push(`Bank Statements (Requires min. 3-4 months; found ${bankStatementCount})`);
    }

    // Critical Field Verifications
    if (fields.legalName.status === 'PENDING' || fields.legalName.status === 'UNABLE_TO_VERIFY') {
      list.push('Field Verification: Business Legal Name');
    }
    if (fields.federalTaxId.status === 'PENDING' || fields.federalTaxId.status === 'UNABLE_TO_VERIFY') {
      list.push('Field Verification: Federal Tax ID (EIN)');
    }
    if (fields.ssnLast4.status === 'PENDING' || fields.ssnLast4.status === 'UNABLE_TO_VERIFY') {
      list.push('Field Verification: SSN (Last 4)');
    }
    if (fields.ownershipPercentage.status === 'PENDING' || fields.ownershipPercentage.status === 'UNABLE_TO_VERIFY') {
      list.push('Field Verification: Ownership Percentage');
    }
    if (fields.annualRevenue.status === 'PENDING' || fields.annualRevenue.status === 'UNABLE_TO_VERIFY') {
      list.push('Field Verification: Annual Revenue');
    }
    if (fields.monthlyRevenue.status === 'PENDING' || fields.monthlyRevenue.status === 'UNABLE_TO_VERIFY') {
      list.push('Field Verification: Monthly Revenue');
    }

    // Call Outcome Check
    if (callOutcome !== 'Verified — Ready for Underwriting') {
      list.push(`Call Outcome Must Be 'Verified — Ready for Underwriting' (Current: ${callOutcome})`);
    }

    return list;
  }, [hasGovtId, bankStatementCount, fields, callOutcome]);

  const canSignOff = missingItems.length === 0;

  // Handle Save In-Progress Draft
  const handleSaveProgress = async () => {
    setIsSaving(true);
    try {
      const updatedClient: Partial<Client> = {
        verificationCallDate: callDate,
        verificationCallTime: callTime,
        verifiedBy: repName,
        borrowerSpokenWith,
        verificationCallOutcome: callOutcome,
        verificationCallNotes: callNotes,
        fieldVerifications: fields,
      };

      // Apply any corrected values back to client master fields
      if (fields.legalName.status === 'CHANGED' && fields.legalName.correctedValue) {
        updatedClient.businessName = fields.legalName.correctedValue;
      }
      if (fields.dba.status === 'CHANGED' && fields.dba.correctedValue) {
        updatedClient.dba = fields.dba.correctedValue;
      }
      if (fields.federalTaxId.status === 'CHANGED' && fields.federalTaxId.correctedValue) {
        updatedClient.federalTaxId = fields.federalTaxId.correctedValue;
      }
      if (fields.ownershipPercentage.status === 'CHANGED' && fields.ownershipPercentage.correctedValue) {
        updatedClient.ownershipPercentage = Number(fields.ownershipPercentage.correctedValue);
      }

      await updateClient(client.id, updatedClient);
      addToast('success', 'Verification Saved', 'Verification call progress saved successfully.');
      if (onClientUpdated) {
        onClientUpdated({ ...client, ...updatedClient });
      }
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save verification progress.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Final Sign-off
  const handleFinalSignOff = async () => {
    if (!canSignOff) {
      addToast('error', 'Cannot Sign Off', 'Please resolve all missing verification items before final sign-off.');
      return;
    }

    setIsSaving(true);
    try {
      const timestamp = new Date().toISOString();
      const updatedClient: Partial<Client> = {
        isVerified: true,
        currentStatus: 'KYC Verified & Ready for Underwriting' as CanonicalPipelineStage,
        verifiedBy: repName || currentUser?.name || 'Dana',
        verifiedAt: timestamp,
        verificationCallDate: callDate,
        verificationCallTime: callTime,
        borrowerSpokenWith,
        verificationCallOutcome: 'Verified — Ready for Underwriting',
        verificationCallNotes: callNotes,
        fieldVerifications: fields,
        isUnderwritten: true,
      };

      // Sync corrections
      if (fields.legalName.status === 'CHANGED' && fields.legalName.correctedValue) {
        updatedClient.businessName = fields.legalName.correctedValue;
      }
      if (fields.dba.status === 'CHANGED' && fields.dba.correctedValue) {
        updatedClient.dba = fields.dba.correctedValue;
      }
      if (fields.federalTaxId.status === 'CHANGED' && fields.federalTaxId.correctedValue) {
        updatedClient.federalTaxId = fields.federalTaxId.correctedValue;
      }
      if (fields.ownershipPercentage.status === 'CHANGED' && fields.ownershipPercentage.correctedValue) {
        updatedClient.ownershipPercentage = Number(fields.ownershipPercentage.correctedValue);
      }

      await updateClient(client.id, updatedClient);
      setIsLocked(true);
      addToast(
        'success',
        'Verification Sign-Off Complete',
        `Client ${client.firstName} ${client.lastName} is formally KYC Verified & moved to 'KYC Verified & Ready for Underwriting'.`
      );
      if (onClientUpdated) {
        onClientUpdated({ ...client, ...updatedClient });
      }
    } catch (err: any) {
      addToast('error', 'Sign-Off Error', err.message || 'Could not complete verification sign-off.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16" id="verification-call-workspace">
      {/* 1. Header & Navigation */}
      <div className="bg-[#091326] border border-blue-900/80 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
            title="Back to Verification List"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded font-mono">
                LIVE CALL WORKSPACE
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-300">
                Borrower: <strong className="text-white">{client.firstName} {client.lastName}</strong>
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-amber-400 font-bold">
                {client.businessName || 'Business Entity'}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              Borrower Verification Script & Field-by-Field Audit
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {onNavigateToClient360 && (
            <button
              onClick={() => onNavigateToClient360(client.id)}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-blue-400" />
              <span>Open 360 File</span>
            </button>
          )}

          {isLocked ? (
            <button
              onClick={() => setIsLocked(false)}
              className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/40 transition-all flex items-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock to Edit</span>
            </button>
          ) : (
            <button
              onClick={handleSaveProgress}
              disabled={isSaving}
              className="px-3.5 py-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 text-xs font-bold rounded-xl border border-blue-700 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Verification Status & Call Metadata */}
      <div className="bg-[#0b1528] border border-blue-900/60 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Call Log & Session Metadata
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isLocked && (
              <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                VERIFICATION LOCKED & SIGNED OFF
              </span>
            )}
            <span className="text-xs font-mono font-bold text-slate-400">
              Stage: <strong className="text-amber-400">{client.currentStatus}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Call Date</label>
            <input
              type="date"
              disabled={isLocked}
              value={callDate}
              onChange={(e) => setCallDate(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Call Time</label>
            <input
              type="time"
              disabled={isLocked}
              value={callTime}
              onChange={(e) => setCallTime(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Representative Name</label>
            <input
              type="text"
              disabled={isLocked}
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none disabled:opacity-60"
              placeholder="Dana"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Borrower Spoken With</label>
            <input
              type="text"
              disabled={isLocked}
              value={borrowerSpokenWith}
              onChange={(e) => setBorrowerSpokenWith(e.target.value)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none disabled:opacity-60"
              placeholder="e.g. John Doe (Owner)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Call Outcome *</label>
            <select
              disabled={isLocked}
              value={callOutcome}
              onChange={(e) => setCallOutcome(e.target.value as any)}
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none font-bold disabled:opacity-60"
            >
              <option value="Verified — Ready for Underwriting">Verified — Ready for Underwriting</option>
              <option value="Needs Follow-up">Needs Follow-up</option>
              <option value="Discrepancy Detected">Discrepancy Detected</option>
              <option value="Borrower Unreachable">Borrower Unreachable</option>
              <option value="Declined by Borrower">Declined by Borrower</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Overall Call Recording & Notes</label>
            <input
              type="text"
              disabled={isLocked}
              value={callNotes}
              onChange={(e) => setCallNotes(e.target.value)}
              placeholder="Summary notes from verbal interview..."
              className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl p-2.5 text-xs text-slate-100 focus:border-amber-400 focus:outline-none disabled:opacity-60"
            />
          </div>
        </div>
      </div>

      {/* 3. Field-by-Field Verification Table & Script */}
      <div className="bg-[#091326] border border-blue-900/70 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-gradient-to-r from-[#0e1b38] to-[#0a152d] border-b border-blue-900/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              Field-by-Field Verification Checklist & Live Questions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ask each question verbatim. Toggle Verified, mark Changed to input corrections, or Unable to Verify.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-amber-400">
              {Object.values(fields).filter((f) => f.status === 'VERIFIED' || f.status === 'CHANGED').length} of{' '}
              {Object.keys(fields).length} Fields Verified
            </span>
          </div>
        </div>

        <div className="divide-y divide-blue-900/40">
          {Object.entries(FIELD_QUESTIONS).map(([fieldKey, { label, script }]) => {
            const fieldState = fields[fieldKey] || {
              status: 'PENDING',
              currentValue: '',
              source: 'Application',
            };

            return (
              <div
                key={fieldKey}
                className="p-4 sm:p-5 hover:bg-slate-900/40 transition-colors space-y-3"
              >
                {/* Top Row: Field Label & Script */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{label}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                        Source: {fieldState.source}
                      </span>
                    </div>
                    {/* Live Script Question */}
                    <div className="text-xs text-blue-200/90 italic bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-900/50">
                      💬 "{script}"
                    </div>
                  </div>

                  {/* Verification Status Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleFieldStatusChange(fieldKey, 'VERIFIED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        fieldState.status === 'VERIFIED'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleFieldStatusChange(fieldKey, 'CHANGED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        fieldState.status === 'CHANGED'
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Changed</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleFieldStatusChange(fieldKey, 'UNABLE_TO_VERIFY')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        fieldState.status === 'UNABLE_TO_VERIFY'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Unable</span>
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Current Value, Corrected Value (if changed), Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Current Value On File
                    </span>
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 font-medium truncate">
                      {String(fieldState.currentValue || 'N/A')}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Corrected / Verified Value
                    </span>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={fieldState.correctedValue || ''}
                      onChange={(e) => handleFieldCorrection(fieldKey, e.target.value)}
                      placeholder={fieldState.status === 'CHANGED' ? 'Enter corrected value...' : 'Matches record'}
                      className={`w-full p-2 rounded-lg bg-slate-950 border text-xs focus:outline-none ${
                        fieldState.status === 'CHANGED'
                          ? 'border-amber-400 text-amber-200'
                          : 'border-slate-800 text-slate-400'
                      }`}
                    />
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-0.5">
                      Field Notes
                    </span>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={fieldState.notes || ''}
                      onChange={(e) => handleFieldNotesChange(fieldKey, e.target.value)}
                      placeholder="Notes on client answer..."
                      className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Final Verification Sign-Off Card */}
      <div className="bg-[#091326] border-2 border-emerald-500/50 rounded-2xl p-6 shadow-2xl shadow-emerald-500/10 space-y-5" id="final-verification-signoff">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Final Verification Sign-Off & KYC Underwriting Clearance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Formally certify borrower authenticity and advance file to Underwriting.
              </p>
            </div>
          </div>

          <div className="text-right">
            {canSignOff ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                All Prerequisites Cleared
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/40 text-xs font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                {missingItems.length} Blocker(s) Remaining
              </span>
            )}
          </div>
        </div>

        {/* Missing Prerequisites List (Requirement 5 explicitly requires exact item list) */}
        {!canSignOff && (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Specific Missing Items Blocking KYC Sign-Off:</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 pl-5 list-disc">
              {missingItems.map((item, idx) => (
                <li key={idx} className="font-semibold text-rose-200">
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-slate-400 pt-1">
              Please complete phone questions or upload required documents to clear these blockers.
            </p>
          </div>
        )}

        {/* Sign-off Details Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sign-off Staff</span>
            <strong className="text-slate-200">{repName || currentUser?.name || 'Dana'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sign-off Timestamp</span>
            <strong className="text-slate-200">
              {client.verifiedAt ? new Date(client.verifiedAt).toLocaleString() : 'Pending Sign-off'}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Target Stage</span>
            <strong className="text-emerald-400">KYC Verified & Ready for Underwriting</strong>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Sign-off will record timestamp, staff attribution, lock the verification record, and unlock Underwriting & Stacking modules.
          </p>

          <button
            type="button"
            onClick={handleFinalSignOff}
            disabled={!canSignOff || isSaving}
            className={`w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
              canSignOff
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
            }`}
            id="verify-client-ready-for-underwriting-btn"
          >
            <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            <span>VERIFY CLIENT & MARK READY FOR UNDERWRITING</span>
          </button>
        </div>
      </div>
    </div>
  );
};
