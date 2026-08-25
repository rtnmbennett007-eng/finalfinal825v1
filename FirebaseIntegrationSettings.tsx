import React, { useState, useEffect } from 'react';
import {
  Flame,
  KeyRound,
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Eye,
  EyeOff,
  Copy,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Server,
  Cloud,
  HelpCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { FirebaseClientConfig } from '../../types';
import {
  getActiveFirebaseConfig,
  getDefaultFirebaseConfig,
  saveCustomFirebaseConfig,
  resetFirebaseConfigToDefaults,
  testFirestoreConnection,
} from '../../firebase';

export const FirebaseIntegrationSettings: React.FC = () => {
  const { addToast, updateFirebaseConfig: updateServerFirebaseConfig } = useData();

  const [config, setConfig] = useState<FirebaseClientConfig>(getActiveFirebaseConfig());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [diagnosticResult, setDiagnosticResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
    timestamp?: string;
  } | null>(null);

  useEffect(() => {
    const active = getActiveFirebaseConfig();
    setConfig(active);
  }, []);

  const handleInputChange = (field: keyof FirebaseClientConfig, value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Save locally and reinitialize in-memory SDK
      const saved = saveCustomFirebaseConfig(config);
      setConfig(saved);

      // 2. Sync to backend persistence
      await updateServerFirebaseConfig(saved);

      addToast('success', 'Firebase Credentials Saved', 'API Key and project settings saved successfully.');
      
      // Auto-test on save
      await runTest(saved);
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message || 'Failed to save Firebase configuration.');
    } finally {
      setIsSaving(false);
    }
  };

  const runTest = async (targetConfig?: FirebaseClientConfig) => {
    setIsTesting(true);
    setDiagnosticResult(null);
    const cfg = targetConfig || config;

    try {
      const result = await testFirestoreConnection(cfg);
      const timestamp = new Date().toLocaleTimeString();

      if (result.success) {
        setConnectionStatus('CONNECTED');
        setDiagnosticResult({
          success: true,
          message: result.message,
          latencyMs: result.latencyMs,
          timestamp,
        });
        addToast('success', 'Firestore Connected', result.message);
      } else {
        setConnectionStatus('ERROR');
        setDiagnosticResult({
          success: false,
          message: result.message,
          timestamp,
        });
        addToast('error', 'Firebase Check Failed', result.message);
      }
    } catch (err: any) {
      setConnectionStatus('ERROR');
      setDiagnosticResult({
        success: false,
        message: err.message || 'Unknown network or security error occurred.',
        timestamp: new Date().toLocaleTimeString(),
      });
      addToast('error', 'Connection Error', err.message || 'Could not reach Firebase.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetToDefaults = () => {
    const defaults = resetFirebaseConfigToDefaults();
    setConfig(defaults);
    setConnectionStatus('IDLE');
    setDiagnosticResult({
      success: true,
      message: 'Reset credentials to default applet provisioned settings.',
      timestamp: new Date().toLocaleTimeString(),
    });
    addToast('info', 'Defaults Restored', 'Loaded project-level Firebase applet credentials.');
  };

  const handleCopyApiKey = () => {
    if (!config.apiKey) return;
    navigator.clipboard.writeText(config.apiKey);
    addToast('info', 'Copied', 'API Key copied to clipboard.');
  };

  return (
    <div className="bg-[#0b162c] border border-blue-900/80 rounded-2xl p-5 shadow-xl space-y-5" id="firebase-integration-settings-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-blue-900/60">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Firebase Firestore & Cloud Database Connection
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                SDK v12.18
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Input and configure your Web API Key, Project ID, and custom Firestore Database ID to establish real-time cloud connectivity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-2.5 py-1 rounded font-mono font-bold flex items-center gap-1.5 ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : connectionStatus === 'ERROR'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
            }`}
          >
            {connectionStatus === 'CONNECTED' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {connectionStatus === 'ERROR' && <AlertCircle className="w-3 h-3 text-rose-400" />}
            {connectionStatus === 'IDLE' && <Database className="w-3 h-3 text-blue-400" />}
            <span>
              {connectionStatus === 'CONNECTED'
                ? 'CONNECTED'
                : connectionStatus === 'ERROR'
                ? 'CONNECTION ERROR'
                : 'READY TO CONNECT'}
            </span>
          </span>
        </div>
      </div>

      {/* Quick Summary Pill Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase font-semibold">Active Project ID</span>
          <span className="text-slate-200 font-bold text-[11px] truncate mt-0.5">
            {config.projectId || 'maple-x-financial-portal'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase font-semibold">Firestore Database ID</span>
          <span className="text-amber-300 font-bold text-[11px] truncate mt-0.5">
            {config.firestoreDatabaseId || '(default)'}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-[#060c18] border border-blue-950 flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] uppercase font-semibold">Security Rules</span>
          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 mt-0.5">
            <ShieldCheck className="w-3 h-3" /> RBAC Enforced
          </span>
        </div>
      </div>

      {/* Diagnostic Result Banner */}
      {diagnosticResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
            diagnosticResult.success
              ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
              : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
          }`}
        >
          {diagnosticResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center justify-between">
              <span>{diagnosticResult.success ? 'Connectivity Verified' : 'Connection Diagnostic'}</span>
              {diagnosticResult.latencyMs !== undefined && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                  {diagnosticResult.latencyMs}ms
                </span>
              )}
            </div>
            <p className="text-[11px] mt-0.5 opacity-90 leading-relaxed font-mono">
              {diagnosticResult.message}
            </p>
            {diagnosticResult.timestamp && (
              <span className="text-[10px] text-slate-400 mt-1 block">
                Last checked at {diagnosticResult.timestamp}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form */}
      <form onSubmit={handleSaveConfig} className="space-y-4">
        {/* 1. API Key Input (Primary Field) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Firebase Web API Key</span>
              <span className="text-amber-400 text-xs">*</span>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
                title={showApiKey ? 'Hide Key' : 'Show Key'}
              >
                {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showApiKey ? 'Hide' : 'Reveal'}</span>
              </button>
              {config.apiKey && (
                <button
                  type="button"
                  onClick={handleCopyApiKey}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
                  title="Copy API Key"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <input
              id="firebase-api-key-input"
              type={showApiKey ? 'text' : 'password'}
              value={config.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono tracking-wider focus:outline-none focus:border-amber-400 placeholder-slate-600 transition-colors shadow-inner"
              required
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Found in Firebase Console &rarr; Project Settings &rarr; General &rarr; Web API Key</span>
          </p>
        </div>

        {/* 2. Project ID & Database ID Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
              <span>Firebase Project ID</span>
              <span className="text-amber-400 text-xs">*</span>
            </label>
            <input
              id="firebase-project-id-input"
              type="text"
              value={config.projectId}
              onChange={(e) => handleInputChange('projectId', e.target.value)}
              placeholder="e.g. maple-x-financial-portal"
              className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
              <span>Firestore Database ID</span>
              <span className="text-[10px] text-slate-400 font-normal">Default: (default)</span>
            </label>
            <input
              id="firebase-database-id-input"
              type="text"
              value={config.firestoreDatabaseId || ''}
              onChange={(e) => handleInputChange('firestoreDatabaseId', e.target.value)}
              placeholder="ai-studio-admin1-3dfda4ee-6f97-42f1-b921-f2d8c6f2fa3d"
              className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
          </div>
        </div>

        {/* 3. Auth Domain & App ID Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Auth Domain
            </label>
            <input
              id="firebase-auth-domain-input"
              type="text"
              value={config.authDomain}
              onChange={(e) => handleInputChange('authDomain', e.target.value)}
              placeholder="e.g. maple-x-financial-portal.firebaseapp.com"
              className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
              Firebase App ID
            </label>
            <input
              id="firebase-app-id-input"
              type="text"
              value={config.appId}
              onChange={(e) => handleInputChange('appId', e.target.value)}
              placeholder="1:847930790172:web:948e22fea7a8a55ced6ad9"
              className="w-full bg-[#060c18] border border-blue-900/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />
          </div>
        </div>

        {/* 4. Storage Bucket & Messaging Sender ID (Collapsible / Advanced) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
              Storage Bucket (Optional)
            </label>
            <input
              id="firebase-storage-bucket-input"
              type="text"
              value={config.storageBucket || ''}
              onChange={(e) => handleInputChange('storageBucket', e.target.value)}
              placeholder="maple-x-financial-portal.firebasestorage.app"
              className="w-full bg-[#060c18] border border-blue-950 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-700 placeholder-slate-700"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">
              Messaging Sender ID (Optional)
            </label>
            <input
              id="firebase-messaging-sender-id-input"
              type="text"
              value={config.messagingSenderId || ''}
              onChange={(e) => handleInputChange('messagingSenderId', e.target.value)}
              placeholder="847930790172"
              className="w-full bg-[#060c18] border border-blue-950 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-700 placeholder-slate-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-blue-900/60">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Restore default pre-configured credentials"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Load Applet Defaults</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              id="test-firebase-btn"
              type="button"
              onClick={() => runTest()}
              disabled={isTesting || !config.apiKey || !config.projectId}
              className="px-4 py-2 bg-blue-900/70 hover:bg-blue-800 text-blue-100 border border-blue-700/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Firestore...' : 'Test Connection'}</span>
            </button>

            <button
              id="save-firebase-btn"
              type="submit"
              disabled={isSaving || !config.apiKey || !config.projectId}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save & Connect'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Migration / Bootstrap Section */}
      <div className="bg-[#060c18] border border-blue-900/60 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-amber-400" />
              One-Click Firestore Data Migration & Seed
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Migrate initial sample clients (e.g. Dr. Elena Rostova), deals, commissions, underwriting rules, and team directory directly to your Cloud Firestore database.
            </p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const { runDbMigration } = (await import('../../context/DataContext')).useData ? { runDbMigration: (window as any).__runMigration } : { runDbMigration: null };
                const firestoreService = (await import('../../services/firestoreService')).firestoreService;
                const res = await firestoreService.seedFirestoreFromDbJson(true);
                addToast('success', 'Migration Completed', res.details);
              } catch (err: any) {
                addToast('error', 'Migration Failed', err.message || 'Error executing migration');
              }
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-blue-600/20 hover:from-amber-500/30 hover:to-blue-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Migrate / Seed Firestore Now</span>
          </button>
        </div>
      </div>

      {/* Instructional Guide Footnote */}
      <div className="bg-[#060c18] border border-blue-950 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>How to obtain your Firebase Web API Key</span>
        </div>
        <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-400 pl-1 leading-relaxed">
          <li>Open the <strong className="text-slate-300">Firebase Console</strong> (console.firebase.google.com) and select your project.</li>
          <li>Click the gear icon &rarr; <strong className="text-slate-300">Project Settings</strong> &rarr; <strong className="text-slate-300">General</strong> tab.</li>
          <li>Copy the <strong className="text-slate-300">Web API Key</strong> and paste it into the field above.</li>
          <li>Click <strong className="text-amber-400">Save & Connect</strong> to initialize your live Firestore database connection.</li>
        </ol>
      </div>
    </div>
  );
};
