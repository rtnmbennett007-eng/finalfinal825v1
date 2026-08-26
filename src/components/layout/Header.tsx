import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  UserCheck,
  Building2,
  Phone,
  FileText,
  DollarSign,
  Plus,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Sparkles,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { api } from '../../services/api';
import { Client, Lead, FundingDeal, AppNotification } from '../../types';
import { UserProfileModal } from '../auth/UserProfileModal';

interface HeaderProps {
  activeTab?: string;
  onOpenNewLeadModal: () => void;
  onOpenNewClientModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onOpenNewLeadModal,
  onOpenNewClientModal,
  setActiveTab,
}) => {
  const { currentUser, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    ghlConfig,
    syncGhlNow,
    setSelectedClientId,
  } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    clients: Client[];
    leads: Lead[];
    deals: FundingDeal[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [isSyncingGhl, setIsSyncingGhl] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.search(searchQuery);
        setSearchResults(res);
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGhlSync = async () => {
    setIsSyncingGhl(true);
    try {
      await syncGhlNow();
    } finally {
      setIsSyncingGhl(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('clients');
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleSelectLead = () => {
    setActiveTab('leads');
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleSelectDeal = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab('funding');
    setShowSearchDropdown(false);
    setSearchQuery('');
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    await markNotificationRead(notif.id);
    if (notif.targetType === 'client' && notif.targetId) {
      setSelectedClientId(notif.targetId);
      setActiveTab('clients');
    } else if (notif.targetType === 'deal' && notif.targetId) {
      setActiveTab('funding');
    } else if (notif.targetType === 'task') {
      setActiveTab('dashboard');
    }
    setShowNotificationDropdown(false);
  };

  const filteredNotifs = notifications.filter((n) => (notifFilter === 'UNREAD' ? !n.isRead : true));

  return (
    <header className="h-16 bg-[#0b1528] border-b border-blue-900/40 px-6 flex items-center justify-between sticky top-0 z-40 shadow-md">
      {/* Search Bar */}
      <div ref={searchRef} className="relative w-96 max-w-md">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-blue-300/70 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            placeholder="Search clients, businesses, SSN, phones, GHL IDs..."
            className="w-full bg-[#070d18] border border-blue-900/70 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 transition-all"
          />
          {isSearching && (
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin absolute right-3" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchResults && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0e1c38] border border-blue-800/80 rounded-xl shadow-2xl p-2 z-50 max-h-96 overflow-y-auto divide-y divide-blue-900/60">
            {/* Clients */}
            {searchResults.clients.length > 0 && (
              <div className="py-2">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Clients ({searchResults.clients.length})
                </div>
                {searchResults.clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-900/60 text-xs flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 group-hover:text-amber-300">
                        {client.firstName} {client.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{client.businessName}</span>
                        <span>•</span>
                        <span>{client.phone}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-amber-400 border border-amber-500/30">
                      ${client.annualRevenue?.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Leads */}
            {searchResults.leads.length > 0 && (
              <div className="py-2">
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Leads ({searchResults.leads.length})
                </div>
                {searchResults.leads.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={handleSelectLead}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-900/60 text-xs flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 group-hover:text-blue-300">
                        {lead.firstName} {lead.lastName}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{lead.businessName}</span>
                        <span>•</span>
                        <span>Source: {lead.leadSource}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      {lead.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Deals */}
            {searchResults.deals.length > 0 && (
              <div className="py-2">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  Deals ({searchResults.deals.length})
                </div>
                {searchResults.deals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => handleSelectDeal(deal.clientId)}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-900/60 text-xs flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-100 group-hover:text-emerald-300">
                        {deal.clientName} — {deal.product}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>${deal.fundingAmount.toLocaleString()} @ {deal.percentage}%</span>
                        <span>•</span>
                        <span>{deal.lenderName}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                      {deal.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {searchResults.clients.length === 0 &&
              searchResults.leads.length === 0 &&
              searchResults.deals.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No records match &quot;{searchQuery}&quot; in Maple X database.
                </div>
              )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* GHL Sync Button */}
        <button
          onClick={handleGhlSync}
          disabled={isSyncingGhl}
          title="Manual GHL 2-Way Sync"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 text-blue-200 border border-blue-800/80 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingGhl ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync GHL</span>
          {ghlConfig?.isConnected && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5"></span>
          )}
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-2 rounded-xl bg-blue-950/80 hover:bg-blue-900/80 text-slate-300 border border-blue-800/80 relative transition-colors"
            title="Operational Notifications & Task Alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotificationDropdown && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0e1c38] border border-blue-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3.5 bg-[#091222] border-b border-blue-900/80 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-100">Notifications & Alerts</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setNotifFilter(notifFilter === 'ALL' ? 'UNREAD' : 'ALL')}
                    className="text-[11px] text-blue-300 hover:text-amber-400 transition-colors"
                  >
                    {notifFilter === 'ALL' ? 'Show Unread' : 'Show All'}
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    onClick={() => markAllNotificationsRead(currentUser?.name || 'all')}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold transition-colors"
                  >
                    Mark all read
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-blue-900/50 p-1">
                {filteredNotifs.length > 0 ? (
                  filteredNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-3 rounded-xl hover:bg-blue-900/50 cursor-pointer transition-colors ${
                        !notif.isRead ? 'bg-blue-950/70 border-l-2 border-amber-400' : 'opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-1.5">
                          {notif.priority === 'High' && (
                            <span className="text-[9px] px-1 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold uppercase">
                              High Priority
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-slate-200 mt-1">
                        {notif.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                        {notif.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No notifications in this filter.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <button
          onClick={onOpenNewLeadModal}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 text-xs font-semibold transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lead</span>
        </button>

        <button
          onClick={onOpenNewClientModal}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
          <span>Client File</span>
        </button>

        {/* Current Active Staff User Pill with Menu */}
        <div ref={userMenuRef} className="relative pl-2 border-l border-blue-900/60">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-blue-900/40 transition-all group"
            title="Account & Staff Profile Settings"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-600/30 text-amber-300 border border-amber-400/40 flex items-center justify-center font-bold text-xs shadow-xs group-hover:border-amber-400">
              {currentUser?.name
                ? currentUser.name
                    .trim()
                    .split(/\s+/)
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'MX'}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-100 leading-tight flex items-center gap-1.5">
                <span>{currentUser?.name || 'Staff User'}</span>
                {currentUser?.title && (
                  <span className="text-[10px] text-amber-400 font-semibold italic">
                    "{currentUser.title}"
                  </span>
                )}
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                  FULL ACCESS
                </span>
              </div>
              <div className="text-[10px] text-blue-300/80 truncate max-w-[140px] leading-tight">
                {currentUser?.jobTitle || 'Executive Leadership'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-400 transition-colors" />
          </button>

          {/* User Popover Menu */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-[#0e1c38] border border-blue-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
              <div className="p-3.5 bg-[#091222] border-b border-blue-900/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-100">{currentUser?.name}</div>
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold">
                    FULL ACCESS
                  </span>
                </div>
                {currentUser?.title && (
                  <div className="text-[11px] font-bold text-amber-400">
                    Portal Title: {currentUser.title}
                  </div>
                )}
                <div className="text-[11px] text-blue-200/90 font-medium">
                  {currentUser?.jobTitle}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">{currentUser?.email}</div>
              </div>

              <div className="p-1.5 space-y-0.5 text-xs">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-900/60 text-slate-200 hover:text-amber-300 transition-colors flex items-center gap-2 font-medium"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Edit My Profile & Password</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setActiveTab('settings');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-900/60 text-slate-200 hover:text-amber-300 transition-colors flex items-center gap-2 font-medium"
                >
                  <Settings className="w-4 h-4 text-blue-400" />
                  <span>Portal Settings & Integrations</span>
                </button>

                <div className="my-1 border-t border-blue-900/60" />

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-950/60 text-red-300 hover:text-red-200 transition-colors flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Profile Modal */}
      {isProfileModalOpen && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </header>
  );
};
