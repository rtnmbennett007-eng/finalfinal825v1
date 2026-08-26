import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Lock,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  KeyRound,
  FileCheck,
  Cpu,
  Layers,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { GoogleDriveConfig } from '../../types';
import { useData } from '../../context/DataContext';

export const GoogleDriveIntegrationSettings: React.FC = () => {
  const { addToast } = useData();

  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    rootFolderId: '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
  });

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGoogleDriveConfig();
      setConfig(data);
      if (data) {
        setFormState((prev) => ({
          ...prev,
          clientId: data.clientId || '',
          redirectUri: data.redirectUri || '',
          rootFolderId: data.rootFolderId || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm',
        }));
      }
    } catch (err: any) {
      console.warn('Failed to load Google Drive status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();

    // Check for query params indicating OAuth return
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('drive_connected') === 'true') {
      addToast('success', 'Google Drive Connected', 'Successfully authorized Google Drive storage for Maple X Financial Vault.');
      // Clean query params
      const url = new URL(window.location.href);
      url.searchParams.delete('drive_connected');
      url.searchParams.delete('account');
      window.history.replaceState({}, '', url.toString());
    } else if (searchParams.get('drive_error')) {
      const err = searchParams.get('drive_error');
      addToast('error', 'OAuth Connection Error', `Google Drive authorization encountered an issue: ${err}`);
      const url = new URL(window.location.href);
      url.searchParams.delete('drive_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    addToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleConnectDrive = async () => {
    setIsConnecting(true);
    try {
      const returnUrl = `${window.location.pathname}?tab=settings`;
      const res = await api.getGoogleDriveUrl(returnUrl);
      if (res.url) {
        // Redirect user to Google OAuth consent screen
        window.location.href = res.url;
      } else {
        throw new Error('No authorization URL returned from server.');
      }
    } catch (err: any) {
      addToast('error', 'Connection Initiation Failed', err.message || 'Please check that Google OAuth Client ID is configured.');
      setIsConnecting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.updateGoogleDriveConfig({
        clientId: formState.clientId.trim() || undefined,
        clientSecret: formState.clientSecret.trim() || undefined,
        redirectUri: formState.redirectUri.trim() || undefined,
        rootFolderId: formState.rootFolderId.trim() || undefined,
      });
      if (res.config) {
        setConfig(res.config);
      }
      addToast('success', 'Google Drive Settings Saved', 'Server configuration updated.');
      setShowConfigForm(false);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Could not save Google Drive configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to disconnect Google Drive? Active document uploads will fallback to local server vault storage until reconnected.')) {
      return;
    }
    setIsDisconnecting(true);
    try {
      const res = await api.disconnectGoogleDrive();
      if (res.config) {
        setConfig(res.config);
      }
      addToast('info', 'Google Drive Disconnected', 'OAuth tokens removed from server.');
    } catch (err: any) {
      addToast('error', 'Disconnect Failed', err.message || 'Could not disconnect Google Drive.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const isConnected = config?.isConnected ?? false;
  const targetAccount = config?.authorizedAccount || config?.dedicatedAccountEmail || 'maplexfinancialadmin@gmail.com';
  const rootFolderId = config?.rootFolderId || '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm';

  return (
    <div className="space-y-6" id="google-drive-integration-settings">
      {/* Primary Integration Card */}
      <div className="bg-[#0b1730] border border-blue-900/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
              <Cloud className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Google Drive Cloud Document Vault
                </h3>
                <span
                  id="drive-status-badge"
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase font-mono ${
                    isConnected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : config?.isConfigured
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {isConnected ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Google Drive Connected
                    </>
                  ) : config?.isConfigured ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                      Ready to Authorize / Connect
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Credentials Required
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Direct server-side Google Drive API integration. Uploaded client tax returns, bank statements, identification, and credit reports are streamed directly into encrypted Google Drive client folders.
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] text-slate-400">
                <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-400" />
                  OAuth Scope: <code className="text-amber-300 font-mono">drive.file</code>
                </span>
                <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Tokens Encrypted Server-Side
                </span>
                <span className="bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800 flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-cyan-400" />
                  Gemini AI Streaming Analysis
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {isConnected ? (
              <>
                <a
                  href={`https://drive.google.com/drive/folders/${rootFolderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  id="btn-open-google-drive"
                  className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 border border-blue-500/30 font-semibold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Open Drive Root Folder</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <button
                  type="button"
                  id="btn-disconnect-google-drive"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="px-4 py-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/50 font-semibold text-xs transition-all flex items-center justify-center gap-2"
                >
                  {isDisconnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Disconnect</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                id="btn-connect-google-drive"
                onClick={handleConnectDrive}
                disabled={isConnecting || isLoading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4 text-slate-950" />
                    <span>Connect Google Drive</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              id="btn-refresh-drive-status"
              onClick={loadStatus}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-all flex items-center justify-center"
              title="Refresh Connection Status"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-blue-900/40 text-xs">
          <div className="bg-[#081226] border border-blue-900/30 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Authorized Account</span>
            <div className="text-slate-200 font-mono font-medium truncate mt-1 flex items-center gap-1.5" title={targetAccount}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="truncate">{targetAccount}</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Dedicated Maple X Admin Storage</div>
          </div>

          <div className="bg-[#081226] border border-blue-900/30 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Root Folder ID</span>
            <div className="flex items-center justify-between gap-1 mt-1">
              <span className="text-amber-300 font-mono font-medium truncate text-[11px]" title={rootFolderId}>
                {rootFolderId}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(rootFolderId, 'folderId')}
                className="p-1 text-slate-400 hover:text-white"
                title="Copy Folder ID"
              >
                {copiedKey === 'folderId' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Maple X Financial Google Drive Root</div>
          </div>

          <div className="bg-[#081226] border border-blue-900/30 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Client ID</span>
            <div className="text-slate-200 font-mono truncate mt-1 flex items-center gap-1.5">
              {config?.clientIdConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CLIENT ID CONFIGURED
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> NOT CONFIGURED
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">OAuth Client ID (Server-Side)</div>
          </div>

          <div className="bg-[#081226] border border-blue-900/30 p-3.5 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Client Secret</span>
            <div className="text-slate-200 font-mono truncate mt-1 flex items-center gap-1.5">
              {config?.clientSecretConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CLIENT SECRET CONFIGURED
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" /> NOT CONFIGURED
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Encrypted on Server</div>
          </div>
        </div>
      </div>

      {/* OAuth Setup & Configuration Details Accordion */}
      <div className="bg-[#0b1730] border border-blue-900/40 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-5 flex items-center justify-between border-b border-blue-900/40 bg-blue-950/20">
          <div className="flex items-center gap-3">
            <KeyRound className="w-5 h-5 text-amber-400" />
            <div>
              <h4 className="text-sm font-bold text-slate-100">Google Cloud Console OAuth Configuration</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact parameters registered for project <span className="text-slate-200 font-semibold">Maple X Financial Portal</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            id="toggle-drive-config-form"
            onClick={() => setShowConfigForm(!showConfigForm)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-900/40 hover:bg-blue-900/60 text-slate-200 text-xs font-semibold border border-blue-800/60 transition-all flex items-center gap-1.5"
          >
            {showConfigForm ? 'Hide Credentials Form' : 'Edit Credentials'}
          </button>
        </div>

        {/* Static Reference Parameters */}
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#081226] border border-blue-900/30 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">Authorized JavaScript Origin</span>
              <button
                type="button"
                onClick={() => copyToClipboard('https://portal.maplexfinancial.com', 'jsOrigin')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'jsOrigin' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <code className="block mt-1.5 text-amber-300 font-mono text-[11px] bg-slate-950/60 p-2 rounded border border-blue-900/30 select-all">
              https://portal.maplexfinancial.com
            </code>
          </div>

          <div className="bg-[#081226] border border-blue-900/30 p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300">Authorized Redirect URI</span>
              <button
                type="button"
                onClick={() => copyToClipboard(config?.redirectUri || 'https://portal.maplexfinancial.com/api/auth/google/callback', 'redirectUri')}
                className="text-slate-400 hover:text-white"
              >
                {copiedKey === 'redirectUri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <code className="block mt-1.5 text-amber-300 font-mono text-[11px] bg-slate-950/60 p-2 rounded border border-blue-900/30 select-all">
              {config?.redirectUri || 'https://portal.maplexfinancial.com/api/auth/google/callback'}
            </code>
          </div>
        </div>

        {/* Collapsible Form to Update Server Credentials */}
        {showConfigForm && (
          <form onSubmit={handleSaveConfig} className="p-5 border-t border-blue-900/40 bg-[#081226]/80 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google OAuth Client ID
                </label>
                <input
                  type="text"
                  id="input-drive-client-id"
                  value={formState.clientId}
                  onChange={(e) => setFormState({ ...formState, clientId: e.target.value })}
                  placeholder={config?.clientIdConfigured ? '•••••••••••••••• (Configured via Environment Variable)' : 'e.g. 1234567890-abc.apps.googleusercontent.com'}
                  className="w-full bg-[#0b1730] border border-blue-900/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google OAuth Client Secret
                </label>
                <input
                  type="password"
                  id="input-drive-client-secret"
                  value={formState.clientSecret}
                  onChange={(e) => setFormState({ ...formState, clientSecret: e.target.value })}
                  placeholder={config?.clientSecretConfigured ? '•••••••••••••••• (Configured via Environment Variable)' : 'GOCSPX-xxxxxxxxxxxxxx'}
                  className="w-full bg-[#0b1730] border border-blue-900/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Google Drive Root Folder ID
                </label>
                <input
                  type="text"
                  id="input-drive-root-folder-id"
                  value={formState.rootFolderId}
                  onChange={(e) => setFormState({ ...formState, rootFolderId: e.target.value })}
                  placeholder="1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm"
                  className="w-full bg-[#0b1730] border border-blue-900/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Redirect URI Override (Optional)
                </label>
                <input
                  type="text"
                  id="input-drive-redirect-uri"
                  value={formState.redirectUri}
                  onChange={(e) => setFormState({ ...formState, redirectUri: e.target.value })}
                  placeholder="https://portal.maplexfinancial.com/api/auth/google/callback"
                  className="w-full bg-[#0b1730] border border-blue-900/50 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfigForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-drive-credentials"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Credentials to Server</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Storage Architecture & Gemini AI Flow Explainer */}
      <div className="bg-[#0b1730] border border-blue-900/40 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <h4 className="text-sm font-bold text-slate-100">Document Upload & Gemini AI Intelligence Architecture</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#081226] border border-blue-900/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Cloud className="w-4 h-4" />
              <span>1. Direct Cloud Streaming</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              When files are dropped into the Document Vault or Upload Modal, they are streamed directly into Google Drive subfolders (structured by Client ID & Business Name). Binary data is never stored in browser localStorage or client Firestore.
            </p>
          </div>

          <div className="bg-[#081226] border border-blue-900/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold">
              <Cpu className="w-4 h-4" />
              <span>2. Gemini Document Intelligence</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The server immediately streams the memory buffer through Google Gemini 2.5 AI. It extracts financial line items, bank balances, tax years, SSNs, EINs, and business entities in real time.
            </p>
          </div>

          <div className="bg-[#081226] border border-blue-900/30 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <FileCheck className="w-4 h-4" />
              <span>3. Unverified Verification Pre-fill</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Extracted fields enter the Master Verification checklist with an <span className="text-amber-400 font-semibold font-mono">UNVERIFIED</span> status for staff review, preserving existing manually verified fields.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
