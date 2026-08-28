import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Cpu,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileCode,
  FileSearch,
  FileText,
  Filter,
  Flame,
  HelpCircle,
  Key,
  Layers,
  Play,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  ProductionErrorRecord,
  LiveSystemStatus,
  FullDiagnosticReport,
  ErrorStage,
  ErrorSeverity,
  ProcessingTraceStep,
} from '../../types';

export const ProductionErrorCenter: React.FC = () => {
  const { productionErrors, resolveProductionError, addToast } = useData();
  const { currentUser } = useAuth();

  // State
  const [liveStatus, setLiveStatus] = useState<LiveSystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isRunningDiagnostic, setIsRunningDiagnostic] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<FullDiagnosticReport | null>(null);
  const [selectedError, setSelectedError] = useState<ProductionErrorRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('UNRESOLVED');
  const [resolutionModalOpen, setResolutionModalOpen] = useState<boolean>(false);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [errorToResolve, setErrorToResolve] = useState<ProductionErrorRecord | null>(null);
  const [isResolving, setIsResolving] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load Live Status on mount
  const fetchLiveStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await api.getLiveSystemStatus();
      setLiveStatus(status);
    } catch (err: any) {
      console.warn('Failed to load live status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchLiveStatus();
    // Periodic refresh every 60s
    const interval = setInterval(fetchLiveStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Run Full Production Diagnostic
  const handleRunDiagnostic = async () => {
    setIsRunningDiagnostic(true);
    try {
      const report = await api.runFullProductionDiagnostic();
      setDiagnosticReport(report);
      await fetchLiveStatus();
      if (report.overall === 'PASS') {
        addToast('success', 'Production Diagnostic Passed', 'All core systems operating normally.');
      } else if (report.overall === 'WARN') {
        addToast('warning', 'Diagnostic Warning', 'Some services returned warnings. Review the report below.');
      } else {
        addToast('error', 'Diagnostic Failed', 'One or more production endpoints failed.');
      }
    } catch (err: any) {
      addToast('error', 'Diagnostic Run Failed', err.message || 'Failed to complete diagnostic suite.');
    } finally {
      setIsRunningDiagnostic(false);
    }
  };

  // Filtered Errors
  const filteredErrors = useMemo(() => {
    return productionErrors.filter((err) => {
      // Resolution status
      if (filterStatus === 'UNRESOLVED' && err.resolved) return false;
      if (filterStatus === 'RESOLVED' && !err.resolved) return false;

      // Severity
      if (filterSeverity !== 'ALL' && err.severity !== filterSeverity) return false;

      // Stage
      if (filterStage !== 'ALL' && err.stage !== filterStage) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const msg = (err.message || '').toLowerCase();
        const code = (err.errorCode || '').toLowerCase();
        const mod = (err.module || '').toLowerCase();
        const endpoint = (err.endpoint || '').toLowerCase();
        const client = (err.clientName || '').toLowerCase();
        const file = (err.fileName || '').toLowerCase();
        const reqId = (err.requestId || '').toLowerCase();

        return (
          msg.includes(q) ||
          code.includes(q) ||
          mod.includes(q) ||
          endpoint.includes(q) ||
          client.includes(q) ||
          file.includes(q) ||
          reqId.includes(q)
        );
      }

      return true;
    });
  }, [productionErrors, filterStatus, filterSeverity, filterStage, searchQuery]);

  // Statistics
  const unresolvedCount = useMemo(() => {
    return productionErrors.filter((e) => !e.resolved).length;
  }, [productionErrors]);

  const criticalCount = useMemo(() => {
    return productionErrors.filter((e) => !e.resolved && e.severity === 'CRITICAL').length;
  }, [productionErrors]);

  const aiErrorCount = useMemo(() => {
    return productionErrors.filter((e) => !e.resolved && (e.stage === 'AI_EXTRACTION' || e.module.toLowerCase().includes('ai'))).length;
  }, [productionErrors]);

  // Copy to clipboard helper
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('info', 'Copied', 'Details copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Copy Complete Diagnostic Bundle
  const handleCopyDiagnosticBundle = () => {
    const bundle = {
      environment: 'production',
      generatedAt: new Date().toISOString(),
      user: currentUser?.email || 'authenticated-staff',
      liveStatus,
      diagnosticReport,
      unresolvedErrors: productionErrors.filter((e) => !e.resolved).slice(0, 15),
      systemInfo: {
        userAgent: navigator.userAgent,
        windowLocation: window.location.href,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      },
    };
    handleCopyText(JSON.stringify(bundle, null, 2), 'bundle');
  };

  // Export errors as JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(productionErrors, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `maple_x_production_errors_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Resolve Error Handler
  const handleOpenResolveModal = (err: ProductionErrorRecord) => {
    setErrorToResolve(err);
    setResolutionNote('');
    setResolutionModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!errorToResolve) return;
    setIsResolving(true);
    try {
      await resolveProductionError(
        errorToResolve.id,
        resolutionNote || 'Marked as investigated and resolved by operations.',
        currentUser?.name || 'Staff'
      );
      setResolutionModalOpen(false);
      setErrorToResolve(null);
      if (selectedError?.id === errorToResolve.id) {
        setSelectedError((prev) => (prev ? { ...prev, resolved: true, resolutionNote } : null));
      }
    } catch (err: any) {
      addToast('error', 'Resolve Failed', err.message || 'Failed to mark error as resolved.');
    } finally {
      setIsResolving(false);
    }
  };

  // Format Helper
  const getStatusPill = (status?: 'GREEN' | 'YELLOW' | 'RED') => {
    switch (status) {
      case 'GREEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            OPERATIONAL
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/40">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            DEGRADED
          </span>
        );
      case 'RED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/40">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
            FAILED
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: ErrorSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
            <AlertOctagon className="w-3 h-3 text-rose-400" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="production-error-center-root">
      {/* 1. Header & Live Environment Stamp */}
      <div className="p-6 bg-gradient-to-r from-[#070e1c] via-[#09152b] to-[#0d1c3a] border border-blue-900/60 rounded-2xl shadow-xl shadow-blue-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-400 border border-rose-500/30 tracking-wider">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                ENVIRONMENT: PRODUCTION
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                <Server className="w-3 h-3 text-blue-400" />
                portal.maplexfinancial.com
              </span>
              {criticalCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950 text-rose-200 border border-rose-700">
                  <AlertOctagon className="w-3 h-3 text-rose-400" />
                  {criticalCount} Critical Active
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-100 mt-2 flex items-center gap-2 tracking-tight">
              <Activity className="w-6 h-6 text-amber-400" />
              Production Error & Live Diagnostics Center
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Real-time failure capture, serverless Vercel telemetry, Gemini AI document pipeline tracing, and persistent diagnostics log for the live Maple X Financial Portal.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={fetchLiveStatus}
              disabled={isLoadingStatus}
              className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>

            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isRunningDiagnostic ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Running Diagnostic Suite...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Full Production Diagnostic</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyDiagnosticBundle}
              className="px-3.5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-700 text-xs font-semibold text-blue-200 flex items-center gap-2 transition-all"
              title="Copy sanitized diagnostic bundle to clipboard"
            >
              {copiedId === 'bundle' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Bundle Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>Copy Diagnostic Bundle</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. LIVE PRODUCTION STATUS (Grid of Critical Endpoints) */}
      <div className="p-5 bg-[#060c18] border border-blue-950/80 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              LIVE PRODUCTION STATUS
            </h2>
            <span className="text-[10px] text-slate-500">
              (Auto-polled every 60s)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Last Checked: {liveStatus?.lastCheckTime ? new Date(liveStatus.lastCheckTime).toLocaleTimeString() : 'Checking...'}
          </div>
        </div>

        {/* 9 Core Production Systems Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* API Health */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                API Health & Ingress
              </span>
              {getStatusPill(liveStatus?.api)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Endpoint: /api/health
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'api')?.message || 'Checking Vercel serverless routing...'}
            </div>
          </div>

          {/* Google Drive */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-cyan-400" />
                Google Drive Vault
              </span>
              {getStatusPill(liveStatus?.googleDrive)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Folder: 1qTQe0N8Wb_5MTDrp_BmOrdSjI5QWGqVm
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'googleDrive')?.message || 'Google service account stream active'}
            </div>
          </div>

          {/* Gemini AI */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Gemini AI Engine
              </span>
              {getStatusPill(liveStatus?.geminiAi)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Endpoint: /api/ai/health
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'geminiAi')?.message || 'Primary: gemini-3.6-flash'}
            </div>
          </div>

          {/* Applications Pipeline */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileSearch className="w-3.5 h-3.5 text-emerald-400" />
                Applications Intake
              </span>
              {getStatusPill(liveStatus?.applications)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Endpoint: /api/applications/extract
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'applications')?.message || 'Multi-pass JSON extraction engine'}
            </div>
          </div>

          {/* Documents */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Document Vault
              </span>
              {getStatusPill(liveStatus?.documents)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Endpoint: /api/documents/upload-file
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'documents')?.message || 'Binary stream parser online'}
            </div>
          </div>

          {/* Database */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Cloud Database
              </span>
              {getStatusPill(liveStatus?.database)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Engine: Cloud Firestore / Dual-tier Reactive Store
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'database')?.message || 'Schema structures verified'}
            </div>
          </div>

          {/* Authentication */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Authentication & RBAC
              </span>
              {getStatusPill(liveStatus?.authentication)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Authority: Firebase Auth & Core Leadership RBAC
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'authentication')?.message || 'RBAC tokens verified'}
            </div>
          </div>

          {/* GoHighLevel GHL */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                GoHighLevel (GHL)
              </span>
              {getStatusPill(liveStatus?.ghl)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Location: qUSput20R0ujNP4DRARJ
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'ghl')?.message || 'CRM webhook dispatch ready'}
            </div>
          </div>

          {/* Reports Engine */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Reports & Calculations
              </span>
              {getStatusPill(liveStatus?.reports)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Engine: Client Master 360 Aggregator
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'reports')?.message || 'Volume & commission engines operational'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. DIAGNOSTIC REPORT RESULTS (If Executed) */}
      {diagnosticReport && (
        <div className="p-5 bg-[#081226] border border-blue-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">
                LATEST FULL DIAGNOSTIC REPORT RESULTS
              </h3>
              <span className="text-xs font-mono text-slate-400">
                ({diagnosticReport.totalDurationMs}ms total)
              </span>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
              diagnosticReport.overall === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              RESULT: {diagnosticReport.overall}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {diagnosticReport.steps.map((step, idx) => (
              <div key={idx} className="p-3 bg-slate-900/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  {step.status === 'PASS' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {step.status === 'WARN' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  {step.status === 'FAIL' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                  <span className="font-semibold text-slate-200">{step.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono truncate">({step.endpoint || step.module})</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-[10px] font-mono text-slate-400">{step.latencyMs}ms</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    step.status === 'PASS' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                  }`}>
                    {step.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. APPLICATION INTAKE PIPELINE TRACE VISUALIZER */}
      <div className="p-5 bg-[#060c18] border border-blue-950/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              BUSINESS LOAN APPLICATION PIPELINE TRACE ARCHITECTURE
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Multi-stage failure isolation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-2">
          {[
            { step: '1', name: 'File Intake', sub: 'PDF/DOCX/JPG', icon: UploadCloud, color: 'text-cyan-400' },
            { step: '2', name: 'Payload Prep', sub: 'Base64 Stream', icon: FileCode, color: 'text-blue-400' },
            { step: '3', name: 'Vercel Route', sub: '/api/applications', icon: Server, color: 'text-indigo-400' },
            { step: '4', name: 'Gemini AI', sub: 'Flash 3.6 Vision', icon: Sparkles, color: 'text-purple-400' },
            { step: '5', name: 'JSON Parser', sub: 'Sanitized Output', icon: Terminal, color: 'text-amber-400' },
            { step: '6', name: 'Duplicate Check', sub: 'Client Master 360', icon: FileSearch, color: 'text-emerald-400' },
            { step: '7', name: 'Cloud DB', sub: 'Firestore Record', icon: Database, color: 'text-emerald-300' },
            { step: '8', name: 'Drive Vault', sub: 'Encrypted Stream', icon: ShieldCheck, color: 'text-cyan-300' },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl text-center relative group hover:border-amber-400/50 transition-all">
                <span className="absolute top-1.5 left-2 text-[9px] font-mono text-slate-500 font-bold">
                  #{item.step}
                </span>
                <Icon className={`w-5 h-5 ${item.color} mx-auto mt-1 mb-1 group-hover:scale-110 transition-transform`} />
                <div className="text-xs font-bold text-slate-200 truncate">{item.name}</div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">{item.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. PRODUCTION ERROR LOG & TABLE */}
      <div className="p-5 bg-[#060c18] border border-blue-950/80 rounded-2xl space-y-4">
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                PRODUCTION ERROR LOG ({filteredErrors.length})
              </h2>
              <p className="text-[11px] text-slate-400">
                Persistent telemetry log of all live application and AI failures
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search error message, code, file..."
              className="w-full bg-[#081226] border border-blue-900/60 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full bg-[#081226] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="UNRESOLVED">Unresolved Errors ({unresolvedCount})</option>
              <option value="RESOLVED">Resolved Errors</option>
              <option value="ALL">All Records ({productionErrors.length})</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full bg-[#081226] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Severity ({criticalCount})</option>
              <option value="WARNING">Warning Severity</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          {/* Stage Filter */}
          <div>
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full bg-[#081226] border border-blue-900/60 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Pipeline Stages</option>
              <option value="AI_EXTRACTION">AI Extraction ({aiErrorCount})</option>
              <option value="FILE_SELECTION">File Selection</option>
              <option value="UPLOAD">Document Upload</option>
              <option value="MERGE">Client Merge</option>
              <option value="SAVE_CLIENT">Save Client Profile</option>
              <option value="CREATE_DEAL">Create Deal</option>
              <option value="GOOGLE_DRIVE_SYNC">Google Drive Sync</option>
              <option value="GHL_SYNC">GHL CRM Sync</option>
            </select>
          </div>
        </div>

        {/* Errors Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          {filteredErrors.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <div className="text-sm font-bold text-slate-200">No Production Errors Matching Criteria</div>
              <p className="text-xs text-slate-400 mt-1">
                {filterStatus === 'UNRESOLVED' ? 'All live system failures are resolved or none have occurred.' : 'No diagnostic records match your filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#081226] border-b border-slate-800 text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Stage</th>
                    <th className="py-3 px-4">Module / Endpoint</th>
                    <th className="py-3 px-4">Error Code & Message</th>
                    <th className="py-3 px-4">Entity / File</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950/40 font-mono">
                  {filteredErrors.map((err) => {
                    const isSelected = selectedError?.id === err.id;
                    return (
                      <tr
                        key={err.id}
                        onClick={() => setSelectedError(isSelected ? null : err)}
                        className={`hover:bg-blue-950/40 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-950/60 border-l-2 border-amber-400' : ''
                        }`}
                      >
                        {/* Time */}
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                          <div>{new Date(err.timestamp).toLocaleTimeString()}</div>
                          <div className="text-[10px] text-slate-500">{new Date(err.timestamp).toLocaleDateString()}</div>
                        </td>

                        {/* Severity */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getSeverityBadge(err.severity)}
                        </td>

                        {/* Stage */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                            {err.stage}
                          </span>
                        </td>

                        {/* Module */}
                        <td className="py-3 px-4 whitespace-nowrap font-sans">
                          <div className="font-bold text-slate-200 text-xs">{err.module}</div>
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">{err.endpoint}</div>
                        </td>

                        {/* Message & Code */}
                        <td className="py-3 px-4 font-sans max-w-md">
                          <div className="font-mono text-[11px] font-bold text-amber-400 truncate">
                            {err.errorCode}
                          </div>
                          <div className="text-xs text-slate-300 line-clamp-2 mt-0.5">
                            {err.message}
                          </div>
                        </td>

                        {/* Entity */}
                        <td className="py-3 px-4 whitespace-nowrap font-sans text-slate-300 text-xs">
                          {err.clientName ? (
                            <div className="font-semibold text-slate-200">{err.clientName}</div>
                          ) : err.fileName ? (
                            <div className="text-cyan-300 font-mono text-[11px]">{err.fileName}</div>
                          ) : (
                            <span className="text-slate-500">System</span>
                          )}
                          {err.httpStatus && (
                            <div className="text-[10px] text-slate-400 font-mono">HTTP {err.httpStatus}</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap font-sans">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {!err.resolved ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResolveModal(err)}
                                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-all"
                              >
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Resolve</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Resolved
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedError(isSelected ? null : err)}
                              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                              title="View full payload details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 6. SELECTED ERROR DETAIL DRAWER / INSPECTOR */}
      {selectedError && (
        <div className="p-5 bg-[#081226] border-2 border-amber-500/40 rounded-2xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-blue-900/60 pb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">
                ERROR DIAGNOSTIC INSPECTOR: <span className="font-mono text-amber-400">{selectedError.errorCode}</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleCopyText(JSON.stringify(selectedError, null, 2), selectedError.id)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-slate-200 flex items-center gap-1"
              >
                {copiedId === selectedError.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-blue-400" />}
                <span>Copy JSON</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedError(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Timestamp</div>
              <div className="font-mono text-slate-200 mt-0.5">{selectedError.timestamp}</div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Vercel Request ID</div>
              <div className="font-mono text-amber-400 mt-0.5 truncate">{selectedError.requestId || 'req-prod-unknown'}</div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Module & Endpoint</div>
              <div className="font-mono text-slate-200 mt-0.5 truncate">{selectedError.module} ({selectedError.endpoint})</div>
            </div>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">HTTP Status & Stage</div>
              <div className="font-mono text-slate-200 mt-0.5">{selectedError.httpStatus || 500} • {selectedError.stage}</div>
            </div>
          </div>

          {/* Full Message */}
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-300">Sanitized Error Message:</div>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-rose-300 break-words whitespace-pre-wrap">
              {selectedError.message}
            </div>
          </div>

          {/* Context & Payload metadata */}
          {selectedError.context && (
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-300">Sanitized Context & Payload:</div>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-60">
                {JSON.stringify(selectedError.context, null, 2)}
              </pre>
            </div>
          )}

          {/* Quick Action Suggestion for Error Code */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-300">Production Diagnostic Guidance:</div>
              <p className="text-slate-300 mt-0.5">
                {selectedError.errorCode === 'UNEXPECTED_HTML_RESPONSE'
                  ? 'Vercel returned an HTML page (like a 500 or 504 error page). Verify GEMINI_API_KEY environment variable in Vercel project settings and redeploy.'
                  : selectedError.errorCode === 'GATEWAY_TIMEOUT_504'
                  ? 'The document extraction took longer than Vercel free-tier 10s or 15s execution timeout. Ensure uploaded documents are under 10MB or use single-pass streaming.'
                  : selectedError.errorCode === 'AI_EXTRACTION_FAILED'
                  ? 'Gemini vision failed to parse specific PDF pages. Fallback document engine activated automatically to construct borrower records.'
                  : 'Check Vercel deployment runtime logs matching Request ID for function invocation stacks.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 7. RESOLUTION MODAL */}
      {resolutionModalOpen && errorToResolve && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1428] border border-blue-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Resolve Diagnostic Error
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setResolutionModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-900 rounded-xl text-xs space-y-1 font-mono">
              <div className="text-slate-400">Error Code: <span className="text-amber-400 font-bold">{errorToResolve.errorCode}</span></div>
              <div className="text-slate-400">Stage: <span className="text-slate-200">{errorToResolve.stage}</span></div>
              <div className="text-slate-300 text-xs font-sans line-clamp-2 mt-1">{errorToResolve.message}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Resolution Notes / Root Cause Fix Summary:
              </label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="e.g. Configured GEMINI_API_KEY in Vercel settings and verified pipeline extraction."
                rows={3}
                className="w-full bg-[#060c18] border border-blue-900 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolutionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={isResolving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
              >
                {isResolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Mark Resolved</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
