import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  RefreshCw,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Sliders,
  Layers,
  Globe,
  Database,
  Save,
  Send,
  Building,
  Radio,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { GhlConfig, PipelineStage } from '../../types';
import { api } from '../../services/api';

const ALL_PIPELINE_STAGES: { stage: PipelineStage; label: string; defaultGhl: string; category: string }[] = [
  { stage: 'NEW_LEAD', label: 'New Lead', defaultGhl: 'Stage 1 - New Inbound Lead', category: 'Inbound' },
  { stage: 'SALES_CONTACT', label: 'Sales Contact', defaultGhl: 'Stage 2 - Sales Contact Made', category: 'Inbound' },
  { stage: 'APPLICATION_SENT', label: 'Application Sent', defaultGhl: 'Stage 3 - Application Link Sent', category: 'Application' },
  { stage: 'APPLICATION_RECEIVED', label: 'Application Received', defaultGhl: 'Stage 4 - Application Submitted', category: 'Application' },
  { stage: 'DOCUMENT_REQUEST', label: 'Document Request', defaultGhl: 'Stage 5 - Requesting Documents', category: 'Documents' },
  { stage: 'DOCUMENTS_PENDING', label: 'Docs Pending', defaultGhl: 'Stage 5B - Documents Pending Client', category: 'Documents' },
  { stage: 'DOCUMENTS_RECEIVED', label: 'Documents Received', defaultGhl: 'Stage 6 - Documents In Review', category: 'Documents' },
  { stage: 'VERIFICATION_PENDING', label: 'Verification Pending', defaultGhl: 'Stage 7A - Verification Queue', category: 'Verification' },
  { stage: 'VERIFICATION_IN_PROGRESS', label: 'Verification In Progress', defaultGhl: 'Stage 7B - Verification Call Active', category: 'Verification' },
  { stage: 'VERIFICATION_COMPLETE', label: 'Verification Complete', defaultGhl: 'Stage 8 - Verification Approved', category: 'Verification' },
  { stage: 'UNDERWRITING', label: 'Underwriting', defaultGhl: 'Stage 9 - File in Underwriting', category: 'Underwriting' },
  { stage: 'READY_FOR_LENDER', label: 'Ready for Lender', defaultGhl: 'Stage 9B - Ready for Submission', category: 'Underwriting' },
  { stage: 'SUBMITTED_TO_LENDER', label: 'Submitted to Lender', defaultGhl: 'Stage 10 - Submitted to Funding Source', category: 'Lender' },
  { stage: 'PRE_APPROVED', label: 'Pre-Approved', defaultGhl: 'Stage 11 - Pre-Approval Terms Received', category: 'Funding' },
  { stage: 'APPROVED', label: 'Approved', defaultGhl: 'Stage 12 - Final Approved', category: 'Funding' },
  { stage: 'CONDITIONS_DOCUMENTS', label: 'Conditions / Final Docs', defaultGhl: 'Stage 12B - Final Stipulations', category: 'Funding' },
  { stage: 'FUNDED', label: 'Funded', defaultGhl: 'Stage 13 - Deal Funded', category: 'Funding' },
  { stage: 'COMMISSION_PENDING', label: 'Commission Pending', defaultGhl: 'Stage 13B - Commission In Invoicing', category: 'Settlement' },
  { stage: 'COMMISSION_RECEIVED', label: 'Commission Received', defaultGhl: 'Stage 14 - Commission Settled', category: 'Settlement' },
  { stage: 'NOT_QUALIFIED', label: 'Not Qualified (DQ)', defaultGhl: 'Stage - Disqualified', category: 'Closed' },
  { stage: 'DECLINED', label: 'Declined', defaultGhl: 'Stage - Lender Declined', category: 'Closed' },
  { stage: 'LOST', label: 'Lost', defaultGhl: 'Stage - Opportunity Lost', category: 'Closed' },
  { stage: 'WITHDRAWN', label: 'Withdrawn', defaultGhl: 'Stage - Client Withdrawn', category: 'Closed' },
];

export const GhlIntegrationSettings: React.FC = () => {
  const { ghlConfig, updateGhlConfig, testGhlConnection, syncGhlNow, addToast, refreshAll, leads, clients } = useData();

  // Local form state
  const [formData, setFormData] = useState<GhlConfig>({
    apiKey: '',
    locationId: '',
    locationName: 'Maple X Financial HQ',
    baseUrl: 'https://services.leadconnectorhq.com',
    isConnected: false,
    lastSyncAt: '',
    syncErrors: [],
    autoSyncEnabled: true,
    fieldMappings: {
      leadSourceField: 'contact.source',
      referralPartnerField: 'custom_field.referral_partner',
      annualRevenueField: 'custom_field.annual_revenue',
      creditScoreField: 'custom_field.credit_score',
      requestedAmountField: 'custom_field.funding_amount_requested',
      productField: 'custom_field.funding_product_interest',
    },
    pipelineMappings: {
      NEW_LEAD: 'Stage 1 - New Inbound Lead',
      SALES_CONTACT: 'Stage 2 - Sales Contact Made',
      APPLICATION_SENT: 'Stage 3 - Application Link Sent',
      APPLICATION_RECEIVED: 'Stage 4 - Application Submitted',
      DOCUMENT_REQUEST: 'Stage 5 - Requesting Documents',
      DOCUMENTS_PENDING: 'Stage 5B - Documents Pending Client',
      DOCUMENTS_RECEIVED: 'Stage 6 - Documents In Review',
      VERIFICATION_PENDING: 'Stage 7A - Verification Queue',
      VERIFICATION_IN_PROGRESS: 'Stage 7B - Verification Call Active',
      VERIFICATION_COMPLETE: 'Stage 8 - Verification Approved',
      UNDERWRITING: 'Stage 9 - File in Underwriting',
      READY_FOR_LENDER: 'Stage 9B - Ready for Submission',
      SUBMITTED_TO_LENDER: 'Stage 10 - Submitted to Funding Source',
      PRE_APPROVED: 'Stage 11 - Pre-Approval Terms Received',
      APPROVED: 'Stage 12 - Final Approved',
      CONDITIONS_DOCUMENTS: 'Stage 12B - Final Stipulations',
      FUNDED: 'Stage 13 - Deal Funded',
      COMMISSION_PENDING: 'Stage 13B - Commission In Invoicing',
      COMMISSION_RECEIVED: 'Stage 14 - Commission Settled',
      NOT_QUALIFIED: 'Stage - Disqualified',
      DECLINED: 'Stage - Lender Declined',
      LOST: 'Stage - Opportunity Lost',
      WITHDRAWN: 'Stage - Client Withdrawn',
    },
  });

  // UI state
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync external context into local form state
  useEffect(() => {
    if (ghlConfig) {
      setFormData((prev) => ({
        ...prev,
        ...ghlConfig,
        locationName: ghlConfig.locationName || prev.locationName || 'Maple X Financial HQ',
        baseUrl: ghlConfig.baseUrl || 'https://services.leadconnectorhq.com',
        fieldMappings: {
          ...prev.fieldMappings,
          ...(ghlConfig.fieldMappings || {}),
        },
        pipelineMappings: {
          ...prev.pipelineMappings,
          ...(ghlConfig.pipelineMappings || {}),
        },
      }));
    }
  }, [ghlConfig]);

  // Derived connection status: NOT CONFIGURED, CONNECTED, or ERROR
  const getConnectionStatus = (): 'NOT CONFIGURED' | 'CONNECTED' | 'ERROR' => {
    if (!formData.apiKey?.trim() || !formData.locationId?.trim()) {
      return 'NOT CONFIGURED';
    }
    if (testResult) {
      return testResult.success ? 'CONNECTED' : 'ERROR';
    }
    if (formData.syncErrors && formData.syncErrors.length > 0) {
      return 'ERROR';
    }
    if (formData.isConnected) {
      return 'CONNECTED';
    }
    return 'NOT CONFIGURED';
  };

  const status = getConnectionStatus();

  const handleFieldChange = (key: keyof GhlConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNestedFieldMappingChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      fieldMappings: {
        ...prev.fieldMappings,
        [fieldKey]: value,
      },
    }));
  };

  const handlePipelineMappingChange = (stage: PipelineStage, value: string) => {
    setFormData((prev) => ({
      ...prev,
      pipelineMappings: {
        ...prev.pipelineMappings,
        [stage]: value,
      },
    }));
  };

  // 1. Save GHL Settings
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateGhlConfig(formData);
    } catch {
      // Toast handled by context
    } finally {
      setIsSaving(false);
    }
  };

  // 2. Test GHL Connection
  const handleTestConnection = async () => {
    if (!formData.locationId?.trim() || !formData.apiKey?.trim()) {
      addToast('error', 'Validation Error', 'Please enter both GHL Location ID and API Key / Access Token before testing.');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGhlConnection(formData);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  // 3. Sync GHL Now
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await syncGhlNow();
    } catch {
      // Toast handled in context
    } finally {
      setIsSyncing(false);
    }
  };

  // Webhook URL
  const webhookUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/api/ghl/webhook`
    : '/api/ghl/webhook';

  const handleCopyWebhook = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(webhookUrl);
      setCopiedWebhook(true);
      addToast('info', 'Webhook Copied', 'GHL webhook endpoint copied to clipboard.');
      setTimeout(() => setCopiedWebhook(false), 3000);
    }
  };

  // Test inbound webhook payload
  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const mockWebhookPayload = {
        event: 'opportunity.stage_change',
        contact_id: `ghl_c_${Math.floor(100000 + Math.random() * 900000)}`,
        opportunity_id: `ghl_opp_${Math.floor(100000 + Math.random() * 900000)}`,
        first_name: 'Vanguard',
        last_name: 'Logistics Group',
        email: `contact_${Date.now()}@vanguardlogistics.com`,
        phone: '(415) 555-0188',
        business_name: 'Vanguard Freight & Fleet LLC',
        pipeline_stage: 'APPLICATION_RECEIVED',
        monetary_value: 150000,
        source: 'Google Search Ads',
        referral_partner: 'Apex Commercial Capital',
      };

      const res = await api.sendGhlWebhook(mockWebhookPayload);
      addToast('success', 'Webhook Ingestion Tested', `Sample lead received and processed with Lead ID: ${res.leadId}`);
      await refreshAll();
    } catch (err: any) {
      addToast('error', 'Webhook Test Failed', err.message || 'Failed to simulate webhook ingestion.');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Format last sync timestamp
  const formatLastSync = (isoString?: string) => {
    if (!isoString) return 'Never synced';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6" id="ghl-integration-root">
      {/* Top Header Card */}
      <div className="bg-[#0b162c] border border-blue-900/80 rounded-2xl p-6 shadow-xl" id="ghl-header-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-blue-900/60">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100" id="ghl-card-title">
                  GoHighLevel Integration
                </h2>
                {/* Dynamic Status Badge */}
                <span
                  id="ghl-status-badge"
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-extrabold flex items-center gap-1.5 uppercase tracking-wider border ${
                    status === 'CONNECTED'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs shadow-emerald-500/20'
                      : status === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-xs shadow-rose-500/20'
                      : 'bg-slate-800/80 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {status === 'CONNECTED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {status === 'ERROR' && <AlertCircle className="w-3 h-3 text-rose-400" />}
                  {status === 'NOT CONFIGURED' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  <span>{status}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Connect Maple X Financial to your GoHighLevel location and synchronize leads, contacts, opportunities, and pipeline stages.
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              id="ghl-top-test-btn"
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
              className="px-3.5 py-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 text-blue-400 ${isTesting ? 'animate-pulse' : ''}`} />
              <span>{isTesting ? 'Testing Connection...' : 'Test GHL Connection'}</span>
            </button>

            <button
              id="ghl-top-sync-btn"
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing || isSaving}
              className="px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync GHL Now'}</span>
            </button>

            <button
              id="ghl-top-save-btn"
              type="button"
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save GHL Settings'}</span>
            </button>
          </div>
        </div>

        {/* Sync Telemetry Bar */}
        <div className="mt-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Last Sync:</span>
            <span className="text-slate-200 font-semibold text-[11px] truncate max-w-[140px]" title={formData.lastSyncAt}>
              {formatLastSync(formData.lastSyncAt)}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Auto Sync:</span>
            <span className={`text-[11px] font-semibold ${formData.autoSyncEnabled ? 'text-emerald-400' : 'text-slate-400'}`}>
              {formData.autoSyncEnabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Leads in Maple X:</span>
            <span className="text-amber-300 font-semibold text-[11px]">{leads.length} Records</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex items-center justify-between">
            <span className="text-slate-400 text-[11px]">Clients / Deals:</span>
            <span className="text-blue-300 font-semibold text-[11px]">{clients.length} Master Files</span>
          </div>
        </div>

        {/* Test Result Message Box */}
        {testResult && (
          <div
            id="ghl-test-result-box"
            className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-700/60 text-rose-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <div className="font-bold">{testResult.success ? 'GHL Connection Successful' : 'GHL Connection Notice'}</div>
              <div className="text-[11px] opacity-90">{testResult.message}</div>
            </div>
          </div>
        )}

        {/* Errors list if any */}
        {formData.syncErrors && formData.syncErrors.length > 0 && !testResult && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 font-mono space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>GHL Synchronization Issues:</span>
            </div>
            {formData.syncErrors.map((err, i) => (
              <div key={i} className="text-[11px] pl-5">• {err}</div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 1: Connection Settings Form */}
      <div className="bg-[#0e1c38] border border-blue-900/80 rounded-2xl p-6 shadow-xl space-y-5" id="ghl-connection-settings-card">
        <div className="pb-3 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                GoHighLevel Connection Settings & Credentials
              </h3>
              <p className="text-[11px] text-slate-400">
                Enter your sub-account Location ID and API Key or private integration access token.
              </p>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            API v2 / LeadConnector Standard
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location / Account Name */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-amber-400" />
                <span>GHL Location / Account Name</span>
              </label>
              <input
                id="ghl-input-location-name"
                type="text"
                value={formData.locationName || ''}
                onChange={(e) => handleFieldChange('locationName', e.target.value)}
                placeholder="e.g. Maple X Financial HQ"
                className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Descriptive name for this GoHighLevel sub-account or location.
              </span>
            </div>

            {/* Location ID */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-400" />
                  <span>GHL Location ID <span className="text-rose-400">*</span></span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Settings &rarr; Business Info</span>
              </label>
              <input
                id="ghl-input-location-id"
                type="text"
                required
                value={formData.locationId || ''}
                onChange={(e) => handleFieldChange('locationId', e.target.value)}
                placeholder="e.g. loc_maplex_hq_001 or standard GHL ID"
                className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                The unique identifier of your GHL location / sub-account.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Key / Access Token with Password Toggle */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span>GHL API Key / Access Token <span className="text-rose-400">*</span></span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-[10px] text-amber-300 hover:text-amber-200 flex items-center gap-1 transition-colors"
                  id="ghl-toggle-api-key-visibility"
                >
                  {showApiKey ? (
                    <>
                      <EyeOff className="w-3 h-3" />
                      <span>Hide Key</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3" />
                      <span>Show Key</span>
                    </>
                  )}
                </button>
              </label>
              <div className="relative">
                <input
                  id="ghl-input-api-key"
                  type={showApiKey ? 'text' : 'password'}
                  required
                  value={formData.apiKey || ''}
                  onChange={(e) => handleFieldChange('apiKey', e.target.value)}
                  placeholder="ghl_live_key_... or v2 bearer token"
                  className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Stored securely on the server. Never exposed in public page text or logs.
              </span>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>GoHighLevel Base URL</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">Default / Custom Domain</span>
              </label>
              <input
                id="ghl-input-base-url"
                type="text"
                value={formData.baseUrl || 'https://services.leadconnectorhq.com'}
                onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
                placeholder="https://services.leadconnectorhq.com"
                className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono transition-colors"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                API Base URL (LeadConnector API v2 standard endpoint).
              </span>
            </div>
          </div>

          {/* Toggles & Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Enable Integration Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-blue-950 cursor-pointer hover:border-blue-900 transition-colors">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-bold text-slate-200 block">Enable GoHighLevel Integration</span>
                <span className="text-[11px] text-slate-400">Activate live bidirectional communication</span>
              </div>
              <input
                id="ghl-toggle-is-connected"
                type="checkbox"
                checked={formData.isConnected}
                onChange={(e) => handleFieldChange('isConnected', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
              />
            </label>

            {/* Enable Automatic Sync Toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-blue-950 cursor-pointer hover:border-blue-900 transition-colors">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-bold text-slate-200 block">Enable Automatic Periodic Sync</span>
                <span className="text-[11px] text-slate-400">Background synchronization of opportunities & leads</span>
              </div>
              <input
                id="ghl-toggle-auto-sync"
                type="checkbox"
                checked={formData.autoSyncEnabled}
                onChange={(e) => handleFieldChange('autoSyncEnabled', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0 cursor-pointer accent-amber-500"
              />
            </label>
          </div>

          {/* Connection Actions Footer */}
          <div className="pt-3 border-t border-blue-900/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                id="ghl-action-test-connection"
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || isSaving}
                className="px-4 py-2 bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 text-blue-400 ${isTesting ? 'animate-pulse' : ''}`} />
                <span>{isTesting ? 'Testing Connection...' : 'Test GHL Connection'}</span>
              </button>

              <button
                id="ghl-action-sync-now"
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || isSaving}
                className="px-4 py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Synchronizing...' : 'Sync GHL Now'}</span>
              </button>
            </div>

            <button
              id="ghl-action-save-settings"
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Configuration...' : 'Save GHL Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: Pipeline Mapping */}
      <div className="bg-[#0e1c38] border border-blue-900/80 rounded-2xl p-6 shadow-xl space-y-4" id="ghl-pipeline-mapping-card">
        <div className="pb-3 border-b border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                Pipeline Stage Mapping
              </h3>
              <p className="text-[11px] text-slate-400">
                Map Maple X operational pipeline stages to corresponding GoHighLevel stages. Changes are applied upon clicking Save GHL Settings.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded bg-[#060c18] border border-blue-950 text-slate-300 font-mono">
            {ALL_PIPELINE_STAGES.length} Defined Stages
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {ALL_PIPELINE_STAGES.map(({ stage, label, defaultGhl, category }) => {
            const currentValue = formData.pipelineMappings?.[stage] ?? defaultGhl;
            return (
              <div
                key={stage}
                className="p-3 rounded-xl bg-[#060c18] border border-blue-950 hover:border-blue-900/70 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-200">{label}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-900/60">
                      {stage}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80 border border-amber-500/20">
                    {category}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-500 font-mono shrink-0">&rarr; GHL:</span>
                  <input
                    id={`ghl-stage-map-${stage.toLowerCase()}`}
                    type="text"
                    value={currentValue}
                    onChange={(e) => handlePipelineMappingChange(stage, e.target.value)}
                    placeholder={defaultGhl}
                    className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-blue-900/40 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save GHL Settings'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 3: Field Mapping */}
      <div className="bg-[#0e1c38] border border-blue-900/80 rounded-2xl p-6 shadow-xl space-y-4" id="ghl-field-mapping-card">
        <div className="pb-3 border-b border-blue-900/60 flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              Custom Field Mapping
            </h3>
            <p className="text-[11px] text-slate-400">
              Map Maple X financial data attributes to your custom fields inside GoHighLevel contacts and opportunities.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Lead Source */}
          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Lead Source Mapping</label>
              <span className="text-[10px] text-slate-500 font-mono">Maple X: leadSource</span>
            </div>
            <input
              id="ghl-field-lead-source"
              type="text"
              value={formData.fieldMappings?.leadSourceField || 'contact.source'}
              onChange={(e) => handleNestedFieldMappingChange('leadSourceField', e.target.value)}
              placeholder="contact.source"
              className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
            <span className="text-[10px] text-slate-500 block">GoHighLevel contact or opportunity field key.</span>
          </div>

          {/* Referral Partner */}
          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Referral Partner Mapping</label>
              <span className="text-[10px] text-slate-500 font-mono">Maple X: referralPartner</span>
            </div>
            <input
              id="ghl-field-referral-partner"
              type="text"
              value={formData.fieldMappings?.referralPartnerField || 'custom_field.referral_partner'}
              onChange={(e) => handleNestedFieldMappingChange('referralPartnerField', e.target.value)}
              placeholder="custom_field.referral_partner"
              className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
            <span className="text-[10px] text-slate-500 block">GoHighLevel custom field for referring partner.</span>
          </div>

          {/* Annual Revenue */}
          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Annual Revenue Mapping</label>
              <span className="text-[10px] text-slate-500 font-mono">Maple X: annualRevenue</span>
            </div>
            <input
              id="ghl-field-annual-revenue"
              type="text"
              value={formData.fieldMappings?.annualRevenueField || 'custom_field.annual_revenue'}
              onChange={(e) => handleNestedFieldMappingChange('annualRevenueField', e.target.value)}
              placeholder="custom_field.annual_revenue"
              className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
            <span className="text-[10px] text-slate-500 block">Numeric gross annual revenue custom field.</span>
          </div>

          {/* Credit Score */}
          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Credit Score Mapping</label>
              <span className="text-[10px] text-slate-500 font-mono">Maple X: creditScore</span>
            </div>
            <input
              id="ghl-field-credit-score"
              type="text"
              value={formData.fieldMappings?.creditScoreField || 'custom_field.credit_score'}
              onChange={(e) => handleNestedFieldMappingChange('creditScoreField', e.target.value)}
              placeholder="custom_field.credit_score"
              className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
            <span className="text-[10px] text-slate-500 block">Principal / guarantor credit score field.</span>
          </div>

          {/* Requested Amount */}
          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Requested Funding Amount</label>
              <span className="text-[10px] text-slate-500 font-mono">Maple X: requestedAmount</span>
            </div>
            <input
              id="ghl-field-requested-amount"
              type="text"
              value={formData.fieldMappings?.requestedAmountField || 'custom_field.funding_amount_requested'}
              onChange={(e) => handleNestedFieldMappingChange('requestedAmountField', e.target.value)}
              placeholder="custom_field.funding_amount_requested"
              className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
            <span className="text-[10px] text-slate-500 block">Requested funding dollar value custom field.</span>
          </div>

          {/* Product Interest */}
          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">Funding Product Interest</label>
              <span className="text-[10px] text-slate-500 font-mono">Maple X: fundingProduct</span>
            </div>
            <input
              id="ghl-field-product"
              type="text"
              value={formData.fieldMappings?.productField || 'custom_field.funding_product_interest'}
              onChange={(e) => handleNestedFieldMappingChange('productField', e.target.value)}
              placeholder="custom_field.funding_product_interest"
              className="w-full bg-[#081226] border border-blue-900/60 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
            <span className="text-[10px] text-slate-500 block">Target product (e.g. 0% Business Cards, Term Loan, Line of Credit).</span>
          </div>
        </div>

        <div className="pt-3 border-t border-blue-900/40 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveSettings()}
            disabled={isSaving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save GHL Settings'}</span>
          </button>
        </div>
      </div>

      {/* SECTION 4: Inbound Webhook Information */}
      <div className="bg-[#0b162c] border border-blue-900/80 rounded-2xl p-6 shadow-xl space-y-4" id="ghl-webhook-info-card">
        <div className="pb-3 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                GoHighLevel Inbound Webhook Listener
              </h3>
              <p className="text-[11px] text-slate-400">
                Receive real-time lead captures, form submissions, and opportunity stage updates from GHL automation workflows.
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            READY • LISTENING
          </span>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
              Your Webhook Listener URL
            </label>
            <div className="flex items-center space-x-2">
              <input
                id="ghl-webhook-url-display"
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none select-all"
              />
              <button
                id="ghl-copy-webhook-btn"
                type="button"
                onClick={handleCopyWebhook}
                className="px-4 py-2.5 bg-blue-900/60 hover:bg-blue-800 text-slate-100 border border-blue-700/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
              >
                {copiedWebhook ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedWebhook ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060c18] border border-blue-950 text-xs text-slate-400 space-y-1.5">
            <span className="font-bold text-slate-200 block">How to configure in GoHighLevel:</span>
            <p className="text-[11px] leading-relaxed">
              1. In GoHighLevel, navigate to <strong>Automation &rarr; Workflows &rarr; Create Workflow</strong>.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. Add a Trigger (e.g. <em>Opportunity Stage Changed</em> or <em>Form Submitted</em>).
            </p>
            <p className="text-[11px] leading-relaxed">
              3. Add an Action &rarr; select <strong>Webhook (POST)</strong> and paste the Webhook URL above.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Accepts JSON payload: contact_id, business_name, pipeline_stage, phone, email, monetary_value
            </span>

            <button
              id="ghl-test-webhook-payload-btn"
              type="button"
              onClick={handleTestWebhook}
              disabled={isTestingWebhook}
              className="px-3.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className="w-3 h-3 text-indigo-400" />
              <span>{isTestingWebhook ? 'Simulating...' : 'Test Inbound Webhook Ingestion'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
