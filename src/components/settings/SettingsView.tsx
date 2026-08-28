import React, { useState, useEffect } from 'react';
import {
  Settings,
  ArrowRightLeft,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  RefreshCw,
  Database,
  ShieldCheck,
  Send,
  Sparkles,
  Flame,
  Cloud,
  Users,
  KeyRound,
  UserCheck,
  Edit,
  Lock,
  MessageSquare,
  Bot,
  AtSign,
  Hash,
  Cpu,
  Check,
  AlertCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { UserProfileModal } from '../auth/UserProfileModal';
import { DiscordConfig } from '../../types';
import { GhlIntegrationSettings } from './GhlIntegrationSettings';
import { FirebaseIntegrationSettings } from './FirebaseIntegrationSettings';
import { GoogleDriveIntegrationSettings } from './GoogleDriveIntegrationSettings';
import { ProductionErrorCenter } from '../diagnostics/ProductionErrorCenter';

export const SettingsView: React.FC = () => {
  const { currentUser, staffList } = useAuth();
  const {
    productionErrors,
    leadSources,
    createLeadSource,
    deleteLeadSource,
    referralPartners,
    createReferralPartner,
    deleteReferralPartner,
    addToast,
    refreshAll,
  } = useData();

  const [activeTab, setActiveTab] = useState<'google-drive' | 'production-errors' | 'integrations' | 'firebase' | 'discord' | 'team' | 'leads-partners' | 'all'>('google-drive');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    defaultCommissionPoints: 1.0,
  });

  // Discord State
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>({
    enabled: true,
    webhookUrl: '',
    channelName: '#maple-x-operations',
    botUsername: 'Maple X Operations Bot',
    mentionRole: '',
    events: {
      taskAssigned: true,
      taskReminder: true,
      highPriorityTaskCreated: true,
      highPriorityTaskDue: true,
      taskOverdue: true,
      newLead: true,
      leadCreated: true,
      newClient: true,
      applicationSubmitted: true,
      verificationComplete: true,
      verificationFailed: true,
      clientVerified: true,
      documentUploaded: true,
      underwritingReady: true,
      preApprovalReceived: true,
      approvalReceived: true,
      clientFunded: true,
      dealFunded: true,
      commissionReceived: true,
      commissionCollected: true,
    },
  });
  const [isSavingDiscord, setIsSavingDiscord] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordTestResult, setDiscordTestResult] = useState<{
    status: 'SUCCESS' | 'FAILED';
    httpStatus?: number;
    message: string;
    timestamp?: string;
  } | null>(null);
  const [discordLogs, setDiscordLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const loadDiscordLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await api.getDiscordLogs();
      setDiscordLogs(logs || []);
    } catch (err) {
      console.debug('Logs load notice:', err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    // Load Discord Config
    api.getDiscordConfig()
      .then((cfg) => {
        if (cfg) setDiscordConfig(cfg);
      })
      .catch(() => {});

    loadDiscordLogs();
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'MX';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDiscord(true);
    try {
      const updated = await api.updateDiscordConfig(discordConfig);
      setDiscordConfig(updated);
      addToast('success', 'Discord Settings Saved', 'Discord webhook configuration synchronized.');
    } catch (err: any) {
      addToast('error', 'Discord Save Failed', err.message || 'Could not save Discord settings.');
    } finally {
      setIsSavingDiscord(false);
    }
  };

  const handleTestDiscord = async () => {
    setIsTestingDiscord(true);
    setDiscordTestResult(null);
    try {
      const res = await api.testDiscordWebhook(discordConfig.webhookUrl, {
        channelName: discordConfig.channelName,
        botUsername: discordConfig.botUsername,
        mentionRole: discordConfig.mentionRole,
      });
      if (res.success) {
        setDiscordTestResult({
          status: 'SUCCESS',
          httpStatus: res.httpStatus || 204,
          message: res.message,
          timestamp: res.timestamp || new Date().toISOString(),
        });
        addToast('success', 'Discord Ping Sent', res.message);
      } else {
        setDiscordTestResult({
          status: 'FAILED',
          httpStatus: res.httpStatus || 400,
          message: res.message,
          timestamp: res.timestamp || new Date().toISOString(),
        });
        addToast('error', 'Discord Ping Failed', res.message);
      }
    } catch (err: any) {
      setDiscordTestResult({
        status: 'FAILED',
        httpStatus: 500,
        message: err.message || 'Failed to dispatch test notification.',
        timestamp: new Date().toISOString(),
      });
      addToast('error', 'Discord Ping Failed', err.message);
    } finally {
      setIsTestingDiscord(false);
      loadDiscordLogs();
    }
  };

  const handleClearLogs = async () => {
    await api.clearDiscordLogs();
    setDiscordLogs([]);
    addToast('info', 'Logs Cleared', 'Discord delivery audit logs cleared.');
  };

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;
    await createLeadSource(newSourceName.trim());
    setNewSourceName('');
  };

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerForm.name.trim()) return;
    await createReferralPartner({
      ...newPartnerForm,
      defaultCommissionPoints: Number(newPartnerForm.defaultCommissionPoints || 1.0),
    });
    setNewPartnerForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      defaultCommissionPoints: 1.0,
    });
  };

  return (
    <div className="space-y-6 pb-16" id="settings-view-root">
      {/* Header */}
      <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-mono">
            System & Integrations Hub
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          Settings, Integrations & Operations Hub
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure GoHighLevel (GHL) manual API credentials, pipeline mappings, Discord notification triggers, team handles, and cloud database persistence.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-blue-900/40 text-xs font-semibold">
        <button
          id="settings-tab-google-drive"
          type="button"
          onClick={() => setActiveTab('google-drive')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'google-drive'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60 bg-[#081226] border border-blue-900/50'
          }`}
        >
          <Cloud className="w-4 h-4 text-blue-400" />
          <span>Google Drive Cloud Storage</span>
        </button>

        <button
          id="settings-tab-production-errors"
          type="button"
          onClick={() => setActiveTab('production-errors')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'production-errors'
              ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-600/30'
              : 'text-rose-300 hover:text-white hover:bg-rose-950/40 bg-[#12080e] border border-rose-900/60'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>PRODUCTION ERROR CENTER</span>
          {productionErrors.filter((e) => !e.resolved).length > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-slate-950 text-[10px] font-black rounded-full">
              {productionErrors.filter((e) => !e.resolved).length}
            </span>
          )}
        </button>

        <button
          id="settings-tab-firebase"
          type="button"
          onClick={() => setActiveTab('firebase')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'firebase'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60 bg-[#081226] border border-blue-900/50'
          }`}
        >
          <Flame className="w-4 h-4 text-orange-400" />
          <span>Firebase & API Key</span>
        </button>

        <button
          id="settings-tab-integrations"
          type="button"
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'integrations'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60 bg-[#081226] border border-blue-900/50'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>GoHighLevel (GHL)</span>
        </button>

        <button
          id="settings-tab-discord"
          type="button"
          onClick={() => setActiveTab('discord')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'discord'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60 bg-[#081226] border border-blue-900/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discord Notifications</span>
        </button>

        <button
          id="settings-tab-team"
          type="button"
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'team'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60 bg-[#081226] border border-blue-900/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Team & Handles</span>
        </button>

        <button
          id="settings-tab-leads-partners"
          type="button"
          onClick={() => setActiveTab('leads-partners')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'leads-partners'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-300 hover:text-white hover:bg-blue-950/60 bg-[#081226] border border-blue-900/50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Lead Sources & Partners</span>
        </button>

        <button
          id="settings-tab-all"
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all shrink-0 ${
            activeTab === 'all'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-blue-950/40'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>All Settings View</span>
        </button>
      </div>

      {/* 0. GOOGLE DRIVE CLOUD STORAGE SECTION */}
      {(activeTab === 'google-drive' || activeTab === 'all') && (
        <div className="space-y-6" id="settings-section-google-drive">
          <GoogleDriveIntegrationSettings />
        </div>
      )}

      {/* 0.5 PRODUCTION ERROR CENTER SECTION */}
      {(activeTab === 'production-errors' || activeTab === 'all') && (
        <div className="space-y-6" id="settings-section-production-errors">
          <ProductionErrorCenter />
        </div>
      )}

      {/* 1. FIREBASE & CLOUD DATABASE SECTION */}
      {(activeTab === 'firebase' || activeTab === 'all') && (
        <div className="space-y-6" id="settings-section-firebase">
          <FirebaseIntegrationSettings />
        </div>
      )}

      {/* 2. GOHIGHLEVEL & INTEGRATIONS SECTION */}
      {(activeTab === 'integrations' || activeTab === 'all') && (
        <div className="space-y-6" id="settings-section-integrations">
          {/* Main GHL Integration Setup Card */}
          <GhlIntegrationSettings />

          {/* Google Drive in Integrations tab if not in dedicated tab */}
          {activeTab === 'integrations' && (
            <GoogleDriveIntegrationSettings />
          )}

          {/* Firebase Settings in Integrations tab if not in dedicated tab */}
          {activeTab === 'integrations' && (
            <FirebaseIntegrationSettings />
          )}
        </div>
      )}


      {/* 2. DISCORD NOTIFICATIONS SECTION */}
      {(activeTab === 'discord' || activeTab === 'all') && (
        <div className="space-y-6" id="settings-section-discord">
          {/* Main Discord Configuration Card */}
          <div className="bg-[#0b162c] border border-indigo-900/70 rounded-2xl p-5 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-indigo-900/60 gap-2">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    Discord Notification Engine
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time operational alerts, lender milestones, funded deal signals, and user task mentions.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {discordConfig.maskedWebhookUrl && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Webhook: {discordConfig.maskedWebhookUrl}
                  </span>
                )}
                <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono font-bold ${
                  discordConfig.enabled
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {discordConfig.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveDiscord} className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#060c18] border border-indigo-950">
                <div className="text-xs">
                  <span className="font-bold text-slate-200 block">Enable Discord Notifier</span>
                  <span className="text-[11px] text-slate-400">Dispatch live embedded operational updates directly to your Discord server channel</span>
                </div>
                <input
                  type="checkbox"
                  checked={discordConfig.enabled}
                  onChange={(e) => setDiscordConfig({ ...discordConfig, enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-0 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase">
                    Discord Webhook URL
                  </label>
                  {discordConfig.hasEnvWebhook && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      (Configured via DISCORD_WEBHOOK_URL environment variable)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={discordConfig.webhookUrl || ''}
                  onChange={(e) => setDiscordConfig({ ...discordConfig, webhookUrl: e.target.value })}
                  placeholder={discordConfig.maskedWebhookUrl ? `Current: ${discordConfig.maskedWebhookUrl} (Paste to change)` : "https://discord.com/api/webhooks/{id}/{token}"}
                  className="w-full bg-[#060c18] border border-indigo-900/80 rounded-xl p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-400 placeholder-slate-600"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Discord Server &rarr; Channel Settings &rarr; Integrations &rarr; Webhooks &rarr; Copy Webhook URL. Stored securely on the backend server.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                    Channel Display Tag
                  </label>
                  <input
                    type="text"
                    value={discordConfig.channelName || ''}
                    onChange={(e) => setDiscordConfig({ ...discordConfig, channelName: e.target.value })}
                    placeholder="#maple-x-operations"
                    className="w-full bg-[#060c18] border border-indigo-900/80 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                    Bot Display Username
                  </label>
                  <input
                    type="text"
                    value={discordConfig.botUsername || ''}
                    onChange={(e) => setDiscordConfig({ ...discordConfig, botUsername: e.target.value })}
                    placeholder="Maple X Operations Bot"
                    className="w-full bg-[#060c18] border border-indigo-900/80 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">
                    Fallback Mention Role / Tag
                  </label>
                  <input
                    type="text"
                    value={discordConfig.mentionRole || ''}
                    onChange={(e) => setDiscordConfig({ ...discordConfig, mentionRole: e.target.value })}
                    placeholder="@here or <@&role_id>"
                    className="w-full bg-[#060c18] border border-indigo-900/80 rounded-xl p-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-indigo-400 placeholder-slate-600"
                  />
                </div>
              </div>

              {/* Categorized Notification Triggers */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Automated Event Triggers & Routing Matrix:
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Toggle events to activate or silence specific notification types
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Category 1: Tasks & Reminders */}
                  <div className="p-3 rounded-xl bg-[#060c18] border border-indigo-950/80 space-y-2">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      Tasks & Assignments
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.taskAssigned ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, taskAssigned: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Task Assigned (Tags User)</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.taskReminder ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, taskReminder: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Task Due Reminders</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.highPriorityTaskCreated ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, highPriorityTaskCreated: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">High Priority Tasks</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.taskOverdue ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, taskOverdue: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Overdue Task Alert</span>
                      </label>
                    </div>
                  </div>

                  {/* Category 2: Pipeline & Onboarding */}
                  <div className="p-3 rounded-xl bg-[#060c18] border border-indigo-950/80 space-y-2">
                    <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Pipeline & Onboarding
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.newLead ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, newLead: e.target.checked, leadCreated: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">New Inbound Leads</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.newClient ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, newClient: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Client File Onboarded</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.verificationComplete ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, verificationComplete: e.target.checked, clientVerified: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">KYC Verification Completed</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.documentUploaded ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, documentUploaded: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Vault Document Uploaded</span>
                      </label>
                    </div>
                  </div>

                  {/* Category 3: Funding Milestones & Settlements */}
                  <div className="p-3 rounded-xl bg-[#060c18] border border-indigo-950/80 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Approvals & Funding
                    </span>
                    <div className="space-y-1.5 text-xs">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.preApprovalReceived ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, preApprovalReceived: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Pre-Approval Received</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.approvalReceived ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, approvalReceived: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Formal Lender Approval</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.dealFunded ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, dealFunded: e.target.checked, clientFunded: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Deal Funded 🎉</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={discordConfig.events?.commissionCollected ?? true}
                          onChange={(e) =>
                            setDiscordConfig({
                              ...discordConfig,
                              events: { ...discordConfig.events, commissionCollected: e.target.checked, commissionReceived: e.target.checked },
                            })
                          }
                          className="rounded text-indigo-600 focus:ring-0"
                        />
                        <span className="text-slate-300">Commission Settled</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-indigo-950">
                <button
                  type="button"
                  onClick={handleTestDiscord}
                  disabled={isTestingDiscord}
                  className="px-4 py-2 bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                >
                  {isTestingDiscord ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  ) : (
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span>{isTestingDiscord ? 'Executing Live Ping to Discord...' : 'Test Discord Ping (Live Webhook)'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingDiscord}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingDiscord ? 'Synchronizing...' : 'Save Discord Settings'}</span>
                </button>
              </div>
            </form>

            {/* Test Ping Diagnostic Response Panel */}
            {discordTestResult && (
              <div className={`p-4 rounded-xl border text-xs font-mono transition-all ${
                discordTestResult.status === 'SUCCESS'
                  ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/80 text-rose-300'
              }`}>
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    {discordTestResult.status === 'SUCCESS' ? '🟢 TEST NOTIFICATION DELIVERED' : '🔴 TEST NOTIFICATION FAILED'}
                  </span>
                  <span className="text-[10px] opacity-75">
                    HTTP {discordTestResult.httpStatus || 200} • {discordTestResult.timestamp}
                  </span>
                </div>
                <p className="font-sans text-xs">{discordTestResult.message}</p>
                {discordTestResult.status === 'FAILED' && (
                  <div className="mt-2 pt-2 border-t border-rose-900/40 text-[11px] text-rose-200">
                    💡 <strong>Troubleshooting Tip:</strong> Ensure your Discord Webhook URL is valid and begins with <code>https://discord.com/api/webhooks/</code>. Check that the channel exists and the webhook has not been deleted in Discord.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Discord Notification Delivery Logs Card */}
          <div className="bg-[#0b162c] border border-indigo-900/70 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-900/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    Live Discord Delivery Audit History
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time verification log of all webhook dispatches, HTTP status responses, and delivery health.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadDiscordLogs}
                  disabled={isLoadingLogs}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                {discordLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Logs</span>
                  </button>
                )}
              </div>
            </div>

            {discordLogs.length === 0 ? (
              <div className="py-8 text-center bg-[#060c18] rounded-xl border border-indigo-950/60">
                <MessageSquare className="w-8 h-8 text-indigo-400/40 mx-auto mb-2" />
                <p className="text-xs text-slate-300 font-semibold">No recent Discord notifications logged yet.</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Click "Test Discord Ping" above to verify the pipeline and create an audit entry.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-indigo-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#060c18] text-slate-400 font-semibold border-b border-indigo-950">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Event</th>
                      <th className="p-2.5">Title</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">HTTP Code</th>
                      <th className="p-2.5">Diagnostics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-950/60 bg-[#081226]/60">
                    {discordLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-indigo-950/20">
                        <td className="p-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-indigo-300 whitespace-nowrap">
                          {log.eventKey}
                        </td>
                        <td className="p-2.5 text-slate-200 font-medium">
                          {log.eventTitle}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            log.status === 'SUCCESS'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : log.status === 'FAILED'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-300">
                          {log.httpStatus || 200}
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-400 truncate max-w-xs">
                          {log.errorMessage || log.payloadPreview || 'Delivered successfully'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. STAFF TEAM & PROFILE MANAGEMENT */}
      {(activeTab === 'team' || activeTab === 'all') && (
        <div className="bg-[#0e1c38] border border-blue-900/80 rounded-2xl p-6 space-y-4 shadow-xl" id="settings-section-team">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-blue-900/60">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Authorized Staff Team & Discord Handles
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Internal operators, initials avatars, and configured Discord tagging handles.
              </p>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Edit My Profile & Discord Tag</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(staffList && staffList.length > 0 ? staffList : [
              {
                id: 'staff-robert',
                name: 'Robert',
                email: 'robert@maplexfinancial.com',
                jobTitle: 'Managing Director & Principal',
                role: 'INTERNAL_STAFF_ADMIN',
                phone: '(555) 567-8901',
                discordUsername: 'robert_maplex',
              },
              {
                id: 'staff-steve',
                name: 'Steve',
                email: 'steve@maplexfinancial.com',
                jobTitle: 'Senior Financial Strategist',
                role: 'INTERNAL_STAFF_ADMIN',
                phone: '(555) 456-7890',
                discordUsername: 'steve_strategist',
              },
              {
                id: 'staff-luke',
                name: 'Luke Cowan',
                email: 'luke.cowan@maplexfinancial.com',
                jobTitle: 'Managing Partner & Senior Underwriter',
                role: 'INTERNAL_STAFF_ADMIN',
                phone: '(555) 345-6789',
                discordUsername: 'lukecowan',
              },
              {
                id: 'staff-dana',
                name: 'Dana Javier',
                email: 'dana.javier@maplexfinancial.com',
                jobTitle: 'Director of Operations & Funding',
                role: 'INTERNAL_STAFF_ADMIN',
                phone: '(555) 234-5678',
                discordUsername: 'dana_javier',
              },
            ]).map((staff: any) => {
              const isSelf = currentUser?.id === staff.id || currentUser?.email?.toLowerCase() === staff.email?.toLowerCase();
              return (
                <div
                  key={staff.id}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                    isSelf
                      ? 'bg-blue-950/80 border-amber-400/50 shadow-md shadow-amber-500/5'
                      : 'bg-[#081124] border-blue-900/60 hover:border-blue-700/60'
                  }`}
                >
                  {/* Initials Avatar Box */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-600/30 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {getInitials(staff.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{staff.name}</span>
                        {isSelf && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-extrabold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/80 text-amber-300 border border-blue-700">
                        {staff.role || 'ADMIN'}
                      </span>
                    </div>
                    <div className="text-xs text-blue-300 font-medium truncate mt-0.5">
                      {staff.jobTitle || 'Operations'}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
                      {staff.email}
                    </div>

                    {/* Discord Tag Display */}
                    <div className="mt-2 pt-2 border-t border-blue-900/40 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-indigo-300 font-mono">
                        <AtSign className="w-3 h-3 text-indigo-400" />
                        <span>{staff.discordUsername ? `@${staff.discordUsername}` : 'No Discord Set'}</span>
                      </div>
                      {staff.discordUserId && (
                        <span className="text-[10px] text-slate-500 font-mono">ID: {staff.discordUserId}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. LEAD SOURCES & REFERRAL PARTNERS */}
      {(activeTab === 'leads-partners' || activeTab === 'all') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="settings-section-leads-partners">
          {/* Custom Lead Sources */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
              Lead Sources ({leadSources.length})
            </h3>

            <form onSubmit={handleAddSource} className="flex items-center space-x-2">
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="Add custom lead source..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
              >
                + Add
              </button>
            </form>

            <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
              {leadSources.map((s) => (
                <div key={s.id} className="py-2 flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium">{s.name}</span>
                  <button
                    onClick={() => deleteLeadSource(s.id)}
                    className="p-1 text-slate-600 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Independent Referral Partners */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 pb-2 border-b border-slate-800">
              Independent Referral Partners ({referralPartners.length})
            </h3>

            <form onSubmit={handleAddPartner} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={newPartnerForm.name}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                  placeholder="Partner Name *"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  value={newPartnerForm.company}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, company: e.target.value })}
                  placeholder="Company"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={newPartnerForm.defaultCommissionPoints}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, defaultCommissionPoints: Number(e.target.value) })}
                  placeholder="Default Points %"
                  className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="w-1/2 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  + Add Partner
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-800/60 max-h-56 overflow-y-auto">
              {referralPartners.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-200">{p.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.company || 'Partner'} • Default: {p.defaultCommissionPoints}% points
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReferralPartner(p.id)}
                    className="p-1 text-slate-600 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </div>
  );
};
