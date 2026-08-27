import React, { useState, useEffect } from 'react';
import {
  Cloud,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
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
  Terminal,
  Server,
  Activity,
  Play,
  Key,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileText,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { api } from '../../services/api';
import { GoogleDriveConfig, GoogleDriveDiagnostic, GoogleDriveTestResult } from '../../types';
import { useData } from '../../context/DataContext';

export const GoogleDriveIntegrationSettings: React.FC = () => {
  const { addToast } = useData();

  const [config, setConfig] = useState<GoogleDriveConfig | null>(null);
  const [diagnostic, setDiagnostic] = useState<GoogleDriveDiagnostic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [lastDiagnosticRun, setLastDiagnosticRun] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [showFolderExplorer, setShowFolderExplorer] = useState(false);
  const [folderFiles, setFolderFiles] = useState<any[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Test State
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<GoogleDriveTestResult | null>(null);

  // Direct Credentials State
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [isSavingCredentials, setIsSavingCredentials] = useState(false);
  const [serviceAccountJsonInput, setServiceAccountJsonInput] = useState('');
  const [targetFolderIdInput, setTargetFolderIdInput] = useState('1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm');

  const TARGET_FOLDER_ID = '1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm';
  const TARGET_SERVICE_ACCOUNT = 'maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com';
  const GCP_PROJECT_NAME = 'Maple X Financial Portal';
  const GCP_PROJECT_ID = 'abiding-orb-506721-j6';

  const runDiagnostic = async () => {
    setIsDiagnosticLoading(true);
    setDiagnosticError(null);
    try {
      const diagData = await api.getGoogleDriveDiagnostic();
      setDiagnostic(diagData);
      setLastDiagnosticRun(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn('Failed to load Google Drive diagnostic:', err);
      setDiagnosticError(err?.message || 'Failed to fetch diagnostic from production backend.');
    } finally {
      setIsDiagnosticLoading(false);
    }
  };

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const [configData] = await Promise.allSettled([
        api.getGoogleDriveConfig(),
        runDiagnostic(),
      ]);

      if (configData.status === 'fulfilled' && configData.value) {
        setConfig(configData.value);
        if (configData.value.targetFolderId) {
          setTargetFolderIdInput(configData.value.targetFolderId);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load Google Drive status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runLiveTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await api.testGoogleDriveConnection();
      setTestResult(res);
      if (res.success) {
        addToast('success', 'Google Drive Verification Passed', res.summary || 'Service account access verified.');
      } else {
        addToast('warning', 'Google Drive Verification Notice', res.summary || 'Check test output steps.');
      }
    } catch (err: any) {
      addToast('error', 'Test Execution Failed', err?.message || 'Could not execute live test against Google API.');
    } finally {
      setIsTesting(false);
    }
  };

  const loadFolderFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await api.listGoogleDriveFiles(config?.targetFolderId || TARGET_FOLDER_ID, 25);
      setFolderFiles(res.files || []);
      addToast('info', 'Folder Indexed', `Found ${res.files?.length || 0} file(s) inside target vault folder.`);
    } catch (err: any) {
      addToast('error', 'Could Not List Files', err?.message || 'Failed to query folder contents.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceAccountJsonInput.trim()) {
      addToast('warning', 'Input Required', 'Please paste the complete Service Account JSON key.');
      return;
    }

    setIsSavingCredentials(true);
    try {
      await api.saveGoogleDriveServiceAccount({
        serviceAccountJson: serviceAccountJsonInput.trim(),
        folderId: targetFolderIdInput.trim() || TARGET_FOLDER_ID,
      });
      addToast('success', 'Credentials Saved', 'Service account credentials verified and stored securely in backend cache.');
      setServiceAccountJsonInput('');
      setShowCredentialsForm(false);
      await loadStatus();
      await runLiveTest();
    } catch (err: any) {
      addToast('error', 'Failed to Save Credentials', err?.message || 'Invalid Service Account JSON format.');
    } finally {
      setIsSavingCredentials(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Are you sure you want to clear stored Google Drive service account credentials?')) {
      return;
    }
    try {
      await api.disconnectGoogleDrive();
      addToast('info', 'Credentials Cleared', 'Google Drive service account cache cleared.');
      await loadStatus();
      setTestResult(null);
    } catch (err: any) {
      addToast('error', 'Action Failed', err?.message || 'Could not clear credentials.');
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    addToast('info', 'Copied to Clipboard', `Copied ${keyName}`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const isConnected = Boolean(config?.isConnected);
  const targetFolder = config?.targetFolderId || TARGET_FOLDER_ID;
  const saEmail = config?.serviceAccountEmail || TARGET_SERVICE_ACCOUNT;
  const isServiceAccountConfigured = Boolean(config?.serviceAccountConfigured || config?.isConfigured);

  return (
    <div className="space-y-8 pb-16" id="google-drive-integration-settings-root">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Google Drive Document Vault
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Service Account Auth
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Automated server-to-server cloud storage isolation inside dedicated folder <span className="font-mono text-slate-300">{TARGET_FOLDER_ID}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runLiveTest}
              disabled={isTesting || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isTesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-white" />
              )}
              <span>{isTesting ? 'Verifying Permissions...' : 'Run Live Diagnostic'}</span>
            </button>

            <button
              onClick={() => {
                loadStatus();
                runDiagnostic();
              }}
              disabled={isLoading || isDiagnosticLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading || isDiagnosticLoading ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Architecture Status Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Service Account Status</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${isServiceAccountConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-sm font-semibold text-white">
                  {isServiceAccountConfigured ? 'Active & Authenticated' : 'Key Required'}
                </span>
              </div>
            </div>
            <KeyRound className="w-5 h-5 text-slate-500" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Target Folder Access</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-blue-400'}`} />
                <span className="text-sm font-semibold text-white font-mono truncate max-w-[150px]" title={targetFolder}>
                  {targetFolder}
                </span>
              </div>
            </div>
            <FolderOpen className="w-5 h-5 text-blue-400" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">GCP Cloud Project</div>
              <div className="text-sm font-semibold text-white mt-1 truncate max-w-[160px]" title={`${GCP_PROJECT_NAME} (${GCP_PROJECT_ID})`}>
                {GCP_PROJECT_NAME}
              </div>
            </div>
            <Server className="w-5 h-5 text-indigo-400" />
          </div>
        </div>
      </div>

      {/* Live Test Results Card (if run) */}
      {testResult && (
        <div className={`border rounded-3xl p-6 sm:p-7 transition-all ${
          testResult.success
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                testResult.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {testResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Live Connection & Permission Audit</h3>
                <p className="text-xs text-slate-300 mt-0.5">{testResult.summary}</p>
              </div>
            </div>
            <button
              onClick={() => setTestResult(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60"
            >
              Dismiss
            </button>
          </div>

          <div className="mt-5 space-y-2.5">
            {testResult.results.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-sm"
              >
                <div className="flex items-start gap-3">
                  {step.status === 'PASSED' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
                  {step.status === 'WARNING' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                  {step.status === 'FAILED' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                  <div>
                    <div className="font-medium text-slate-200">{step.step}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{step.message}</div>
                  </div>
                </div>
                <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                  step.status === 'PASSED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : step.status === 'WARNING'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Target Folder Details & Actions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Target Google Drive Folder</h3>
              <p className="text-xs text-slate-400">
                All client document folders and files are isolated strictly inside this shared folder
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowFolderExplorer(!showFolderExplorer);
                if (!showFolderExplorer && folderFiles.length === 0) {
                  loadFolderFiles();
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{showFolderExplorer ? 'Hide Folder Files' : 'Inspect Folder Files'}</span>
            </button>

            <a
              href={`https://drive.google.com/drive/folders/${targetFolder}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 text-xs font-medium transition-all"
            >
              <span>Open in Drive</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Folder Specifications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Target Folder ID</span>
              <button
                onClick={() => copyToClipboard(targetFolder, 'Folder ID')}
                className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-[11px]"
              >
                {copiedKey === 'Folder ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'Folder ID' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-sm font-semibold text-white break-all">
              {targetFolder}
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Environment Variable: <code className="text-blue-300">GOOGLE_DRIVE_FOLDER_ID</code>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
              <span>Dedicated Service Account</span>
              <button
                onClick={() => copyToClipboard(saEmail, 'Service Account Email')}
                className="text-slate-400 hover:text-white inline-flex items-center gap-1 text-[11px]"
              >
                {copiedKey === 'Service Account Email' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedKey === 'Service Account Email' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-sm font-semibold text-emerald-400 break-all">
              {saEmail}
            </div>
            <div className="text-[11px] text-slate-400 pt-1">
              Role: <span className="text-slate-300 font-medium">Editor</span> on target folder
            </div>
          </div>
        </div>

        {/* Folder Contents Explorer */}
        {showFolderExplorer && (
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-bold text-white">Files in Target Folder</span>
                <span className="text-xs text-slate-400">({folderFiles.length} found)</span>
              </div>
              <button
                onClick={loadFolderFiles}
                disabled={isLoadingFiles}
                className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                <span>Refresh List</span>
              </button>
            </div>

            {isLoadingFiles ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-400 mb-2" />
                Querying Google Drive API...
              </div>
            ) : folderFiles.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                No files found in folder or folder is ready for initial document uploads.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {folderFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                      <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-medium text-white truncate">{file.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-[11px]">
                        {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Folder'}
                      </span>
                      {file.webViewLink && (
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Environment Variables Requirement Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Required Environment Variables</h3>
              <p className="text-xs text-slate-400">
                These variables configure the server-side Google Drive API connection in all deployment environments
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCredentialsForm(!showCredentialsForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>{showCredentialsForm ? 'Hide Input Box' : 'Enter / Update Key'}</span>
          </button>
        </div>

        {/* Copyable Environment Variables Table */}
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">GOOGLE_DRIVE_FOLDER_ID</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Required</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                The Google Drive folder ID where all client document folders are created.
              </p>
              <div className="font-mono text-xs text-slate-300 mt-1.5 bg-slate-900/90 px-2.5 py-1 rounded border border-slate-800 inline-block">
                1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm
              </div>
            </div>
            <button
              onClick={() => copyToClipboard('GOOGLE_DRIVE_FOLDER_ID=1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm', 'GOOGLE_DRIVE_FOLDER_ID')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 cursor-pointer self-start sm:self-center"
            >
              {copiedKey === 'GOOGLE_DRIVE_FOLDER_ID' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'GOOGLE_DRIVE_FOLDER_ID' ? 'Copied' : 'Copy Variable'}</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400">GOOGLE_SERVICE_ACCOUNT_JSON</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">Server-Side Secret</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                The complete JSON key file generated for <code className="text-slate-300">maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com</code>.
              </p>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Strictly isolated in backend runtime. Never exposed to browser or API responses.</span>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard('GOOGLE_SERVICE_ACCOUNT_JSON=', 'GOOGLE_SERVICE_ACCOUNT_JSON')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium shrink-0 cursor-pointer self-start sm:self-center"
            >
              {copiedKey === 'GOOGLE_SERVICE_ACCOUNT_JSON' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'GOOGLE_SERVICE_ACCOUNT_JSON' ? 'Copied' : 'Copy Variable'}</span>
            </button>
          </div>
        </div>

        {/* Optional In-Portal Service Account Key Importer Form */}
        {showCredentialsForm && (
          <form onSubmit={handleSaveCredentials} className="p-5 rounded-2xl bg-slate-950/90 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>Direct Service Account Key Import</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Saved to Secure Server Cache</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Target Folder ID
              </label>
              <input
                type="text"
                value={targetFolderIdInput}
                onChange={(e) => setTargetFolderIdInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                placeholder="1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Service Account JSON Key
              </label>
              <textarea
                value={serviceAccountJsonInput}
                onChange={(e) => setServiceAccountJsonInput(e.target.value)}
                rows={5}
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-blue-500 leading-relaxed"
                placeholder='{ "type": "service_account", "project_id": "abiding-orb-506721-j6", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\n...", "client_email": "maple-x-portal-drive@abiding-orb-506721-j6.iam.gserviceaccount.com" }'
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Paste the raw JSON from Google Cloud Console. The server will validate structure and store it in encrypted runtime memory.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setServiceAccountJsonInput('');
                  setShowCredentialsForm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingCredentials}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
              >
                {isSavingCredentials ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{isSavingCredentials ? 'Verifying & Saving...' : 'Save & Verify Key'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Zero-Exposure Architecture Safeguards */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <h4 className="text-sm font-bold text-white">Zero-Exposure Security Architecture</h4>
            <p className="text-xs text-slate-400">Strict guarantees applied across frontend and backend services</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Strict Server Isolation</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              The service account private key is never shipped to the client browser, bundle, or returned in API endpoints.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Dedicated Folder Scope</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All operations are scoped to <code className="text-slate-300">1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm</code>. The portal does not touch external folders.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1">
            <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>Auto-Streaming Vault</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Files stream directly to Google Drive and pass through Gemini AI Document Intelligence with zero disk footprint.
            </p>
          </div>
        </div>
      </div>

      {/* Production Runtime Diagnostics */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-400" />
            <h4 className="text-sm font-bold text-white">Runtime Diagnostic Telemetry</h4>
          </div>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
          >
            {showRawJson ? 'Hide JSON Telemetry' : 'View JSON Telemetry'}
          </button>
        </div>

        {showRawJson && (
          <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {JSON.stringify({ diagnostic, config }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};
