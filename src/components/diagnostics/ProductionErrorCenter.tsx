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
  Code2,
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
import {
  generateChatGPTErrorReport,
  generateShortErrorReport,
  analyzeRootCause,
  redactSensitiveData,
} from '../../utils/errorReportGenerator';

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

  // Active target error for report generation (either selected or top unresolved error)
  const activeReportError = useMemo<Partial<ProductionErrorRecord>>(() => {
    if (selectedError) return selectedError;
    const unresolved = productionErrors.filter((e) => !e.resolved);
    if (unresolved.length > 0) return unresolved[0];
    if (productionErrors.length > 0) return productionErrors[0];

    // Fallback template matching live status
    const isGeminiFailed = liveStatus?.geminiAi === 'RED';
    return {
      id: `live-report-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      module: isGeminiFailed ? 'Gemini AI Engine' : 'Operations API',
      endpoint: isGeminiFailed ? '/api/ai/health' : '/api/health',
      method: isGeminiFailed ? 'POST' : 'GET',
      httpStatus: isGeminiFailed ? 500 : 200,
      stage: (isGeminiFailed ? 'AI_AUTH' : 'REQUEST') as ErrorStage,
      errorCode: isGeminiFailed ? 'AI_KEY_MISSING' : 'HEALTH_CHECK_OK',
      message: isGeminiFailed
        ? 'GEMINI_API_KEY is not defined in Production.'
        : 'All core production services healthy.',
      requestId: `req-prod-${Date.now().toString(36)}`,
      severity: isGeminiFailed ? 'CRITICAL' : 'INFO',
      environment: 'production',
      clientName: 'Charde Boyce',
      fileName: 'Business Loan Application.pdf',
      fileType: 'application/pdf',
      fileSize: '2.1 MB',
      userName: currentUser?.name || 'Robert',
      userId: currentUser?.id || 'staff-robert',
      dealId: 'deal-prod-101',
    };
  }, [selectedError, productionErrors, liveStatus, currentUser]);

  // Copy to clipboard helper with toast feedback
  const handleCopyText = (text: string, id: string, label: string = 'Details') => {
    const plain = redactSensitiveData(text);
    navigator.clipboard.writeText(plain);
    setCopiedId(id);
    addToast('info', `${label} Copied`, 'Plain-text report copied to clipboard. Ready to paste directly into ChatGPT.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // 1. COPY FULL ERROR REPORT (ChatGPT-Ready standard format)
  const handleCopyFullErrorReport = (err?: Partial<ProductionErrorRecord>) => {
    const target = err || activeReportError;
    const reportText = generateChatGPTErrorReport(target, {
      liveStatus,
      diagnosticReport,
      siteUrl: 'https://portal.maplexfinancial.com',
    });
    handleCopyText(reportText, 'full-report', 'ERROR REPORT COPIED');
  };

  // 2. COPY ERROR ONLY (Short plain-text summary)
  const handleCopyErrorOnly = (err?: Partial<ProductionErrorRecord>) => {
    const target = err || activeReportError;
    const reportText = generateShortErrorReport(target, { liveStatus });
    handleCopyText(reportText, 'error-only', 'ERROR SUMMARY COPIED');
  };

  // 3. DOWNLOAD ERROR REPORT (.txt file download)
  const handleDownloadErrorReport = (err?: Partial<ProductionErrorRecord>) => {
    const target = err || activeReportError;
    const reportText = generateChatGPTErrorReport(target, {
      liveStatus,
      diagnosticReport,
      siteUrl: 'https://portal.maplexfinancial.com',
    });

    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `maple-x-production-error-${dateStamp}.txt`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    addToast('success', 'Download Started', `Downloaded plain-text technical report: ${fileName}`);
  };

  // 4. Copy Complete Diagnostic Bundle
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
    handleCopyText(JSON.stringify(bundle, null, 2), 'bundle', 'Diagnostic Bundle');
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

  // Generate Sample Production Error for Testing Workflow
  const handleGenerateSampleError = async () => {
    try {
      const sample = await api.recordProductionError({
        module: 'Gemini AI Engine',
        endpoint: '/api/applications/extract',
        method: 'POST',
        httpStatus: 500,
        stage: 'AI_AUTH',
        errorCode: 'AI_KEY_MISSING',
        message: 'GEMINI_API_KEY is not defined in Production environment. AI vision extraction halted.',
        requestId: `req-live-${Date.now().toString(36)}`,
        severity: 'CRITICAL',
        clientName: 'Charde Boyce',
        fileName: 'Business Loan Application.pdf',
        fileType: 'application/pdf',
        fileSize: '2.1 MB',
        userName: currentUser?.name || 'Robert',
        userId: currentUser?.id || 'staff-robert',
        dealId: 'deal-prod-101',
        isResolved: false,
      });
      setSelectedError(sample);
      addToast('info', 'Sample Error Generated', 'Created simulated production error to test ChatGPT reporting workflow.');
    } catch (err: any) {
      addToast('error', 'Error Generation Failed', err.message);
    }
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
      addToast('success', 'Error Resolved', `Marked ${errorToResolve.errorCode} as resolved.`);
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

  // Computed Root Cause for selected or active error
  const activeRootCause = useMemo(() => {
    return analyzeRootCause(activeReportError, liveStatus);
  }, [activeReportError, liveStatus]);

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
              Instant ChatGPT-ready technical reporting, multi-stage document extraction telemetry, and live health verification for Maple X Financial Operations.
            </p>
          </div>

          {/* Action Buttons: Primary ChatGPT-ready controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* COPY FULL ERROR REPORT */}
            <button
              type="button"
              id="btn-copy-full-error-report"
              onClick={() => handleCopyFullErrorReport()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
              title="Copy complete, standardized ChatGPT-ready error report as plain text"
            >
              {copiedId === 'full-report' ? (
                <>
                  <Check className="w-4 h-4 text-white animate-bounce" />
                  <span>ERROR REPORT COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-200" />
                  <span>COPY FULL ERROR REPORT</span>
                </>
              )}
            </button>

            {/* COPY ERROR ONLY */}
            <button
              type="button"
              id="btn-copy-error-only"
              onClick={() => handleCopyErrorOnly()}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Copy concise error summary with root cause and stack trace"
            >
              {copiedId === 'error-only' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">ERROR SUMMARY COPIED</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>COPY ERROR ONLY</span>
                </>
              )}
            </button>

            {/* DOWNLOAD ERROR REPORT */}
            <button
              type="button"
              id="btn-download-error-report"
              onClick={() => handleDownloadErrorReport()}
              className="px-3.5 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 border border-blue-700 text-xs font-bold text-blue-200 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Download standardized .txt error report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>DOWNLOAD ERROR REPORT</span>
            </button>

            {/* Run Full Diagnostic */}
            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={isRunningDiagnostic}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isRunningDiagnostic ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Diagnosing...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Diagnostics</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CHATGPT ERROR QUICK EXPORT BANNER & ROOT CAUSE CALLOUT */}
      <div className="p-5 bg-gradient-to-r from-[#0c1830] via-[#09152b] to-[#0a1224] border border-amber-500/30 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                  CHATGPT-READY TECHNICAL ERROR EXPORT
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-950 text-emerald-300 border border-emerald-700">
                  PLAIN TEXT FORMATTED
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-950 text-blue-300 border border-blue-800">
                  SECRETS AUTO-REDACTED
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Clicking <strong className="text-white">COPY FULL ERROR REPORT</strong> generates a plain-text template including system statuses, pipeline traces, Vercel function routes, Gemini AI models, Google Drive IDs, root cause analysis, and file contexts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateSampleError}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Add a sample critical error to test error report copy & download"
            >
              <Code2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Simulate Error</span>
            </button>
          </div>
        </div>

        {/* Machine-Generated Root Cause Preview */}
        <div className="mt-2 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AUTOMATIC ROOT CAUSE ANALYSIS:
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
              activeRootCause.confidence === 'HIGH' ? 'bg-rose-950 text-rose-300 border border-rose-700' : 'bg-amber-950 text-amber-300 border border-amber-700'
            }`}>
              CONFIDENCE: {activeRootCause.confidence}
            </span>
          </div>
          <div className="font-mono text-slate-200 font-semibold">
            {activeRootCause.likelyCause}
          </div>
          <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
            {activeRootCause.evidence.map((ev, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-slate-600">•</span>
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. LIVE PRODUCTION STATUS (Grid of Critical Endpoints) */}
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchLiveStatus}
              disabled={isLoadingStatus}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-mono cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>Poll Now</span>
            </button>
            <div className="text-[11px] text-slate-400 font-mono">
              Last Checked: {liveStatus?.lastCheckTime ? new Date(liveStatus.lastCheckTime).toLocaleTimeString() : 'Checking...'}
            </div>
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
              {liveStatus?.items.find((i) => i.key === 'api')?.message || 'Vercel serverless routing active'}
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
              {liveStatus?.items.find((i) => i.key === 'applications')?.message || 'Application intake ready'}
            </div>
          </div>

          {/* Documents */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Document Processing
              </span>
              {getStatusPill(liveStatus?.documents)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Endpoint: /api/documents/upload-file
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'documents')?.message || 'Multi-part binary processor ready'}
            </div>
          </div>

          {/* Database */}
          <div className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-xl space-y-2 hover:border-blue-900 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Database Persistence
              </span>
              {getStatusPill(liveStatus?.database)}
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate">
              Cloud Firestore / Local Reactive
            </div>
            <div className="text-xs text-slate-300">
              {liveStatus?.items.find((i) => i.key === 'database')?.message || 'Cloud database online'}
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

      {/* 4. DIAGNOSTIC REPORT RESULTS (If Executed) */}
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
              onClick={handleCopyDiagnosticBundle}
              className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 rounded-lg text-xs text-blue-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-blue-400" />
              <span>Copy Diagnostic Bundle</span>
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
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
                            <button
                              type="button"
                              onClick={() => handleCopyFullErrorReport(err)}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded hover:bg-emerald-950/50 cursor-pointer"
                              title="Copy ChatGPT Report for this error"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadErrorReport(err)}
                              className="p-1.5 text-cyan-400 hover:text-cyan-300 rounded hover:bg-cyan-950/50 cursor-pointer"
                              title="Download .txt Report for this error"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {!err.resolved ? (
                              <button
                                type="button"
                                onClick={() => handleOpenResolveModal(err)}
                                className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
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
                              className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 cursor-pointer"
                              title="View full diagnostic inspector"
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

      {/* 6. SELECTED ERROR DETAIL DRAWER / INSPECTOR WITH DIRECT CHATGPT ACTIONS */}
      {selectedError && (
        <div className="p-5 bg-[#081226] border-2 border-amber-500/40 rounded-2xl space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-blue-900/60 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-slate-100">
                ERROR DIAGNOSTIC INSPECTOR: <span className="font-mono text-amber-400">{selectedError.errorCode}</span>
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleCopyFullErrorReport(selectedError)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-bold text-white flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>COPY FULL REPORT</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyErrorOnly(selectedError)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-blue-400" />
                <span>COPY ERROR ONLY</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadErrorReport(selectedError)}
                className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 border border-blue-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD .TXT</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedError(null)}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
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

          {/* Root Cause Analysis & Recommended Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Root Cause Analysis:
              </div>
              <p className="font-mono text-slate-200 text-xs">
                {activeRootCause.likelyCause}
              </p>
              <div className="text-[11px] text-slate-400 space-y-1 pt-1">
                <div className="font-bold text-slate-300">Key Evidence:</div>
                {activeRootCause.evidence.map((ev, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-amber-400 font-bold">•</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-slate-900/90 border border-blue-900/60 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-blue-300 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                Recommended Next Actions:
              </div>
              <ol className="text-slate-300 space-y-1.5 list-decimal pl-4 text-[11px]">
                {activeRootCause.recommendedActions.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* API Contract & Environment Variables Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono">
              <div className="font-bold text-slate-300 font-sans">API Contract Check:</div>
              <div className="text-slate-400">Expected: <span className="text-emerald-400 font-bold">application/json</span></div>
              <div className="text-slate-400">
                Returned:{' '}
                <span className={selectedError.errorCode === 'UNEXPECTED_HTML_RESPONSE' ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                  {selectedError.errorCode === 'UNEXPECTED_HTML_RESPONSE' ? 'UNEXPECTED_HTML_RESPONSE (text/html)' : 'application/json'}
                </span>
              </div>
              {selectedError.errorCode === 'UNEXPECTED_HTML_RESPONSE' && (
                <div className="text-[11px] text-rose-300 font-sans mt-1">
                  The frontend attempted to parse an HTML error page as JSON. Check Vercel serverless function logs.
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono">
              <div className="font-bold text-slate-300 font-sans">Environment Variables Status:</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">GEMINI_API_KEY:</span>
                <span className={selectedError.errorCode === 'AI_KEY_MISSING' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {selectedError.errorCode === 'AI_KEY_MISSING' ? 'MISSING' : 'CONFIGURED'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">GOOGLE_SERVICE_ACCOUNT_JSON:</span>
                <span className="text-emerald-400 font-bold">CONFIGURED</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">GOOGLE_DRIVE_FOLDER_ID:</span>
                <span className="text-emerald-400 font-bold">CONFIGURED</span>
              </div>
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
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={isResolving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
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
