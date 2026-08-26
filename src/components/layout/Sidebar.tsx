import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck2,
  Scale,
  DollarSign,
  PieChart,
  FolderLock,
  BarChart3,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { leads, clients, deals, ghlConfig } = useData();

  // Metrics for badges
  const newLeadsCount = leads.filter((l) => l.status === 'NEW_LEAD' || l.status === 'SALES_CONTACT').length;
  const pendingVerificationCount = clients.filter((c) => !c.isVerified && c.currentStatus.includes('VERIFICATION')).length;
  const pendingUnderwritingCount = clients.filter((c) => c.currentStatus === 'UNDERWRITING' || c.currentStatus === 'READY_FOR_LENDER').length;
  const pendingFundingCount = deals.filter((d) => d.status === 'PRE_APPROVED' || d.status === 'APPROVED' || d.status === 'PROPOSED').length;
  const uncollectedCommissionsCount = deals.filter((d) => d.status === 'FUNDED' && d.commissionStatus !== 'COLLECTED').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads Workspace', icon: Users, badge: newLeadsCount, badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    { id: 'clients', label: 'Client Master 360', icon: Building2, count: clients.length },
    { id: 'verification', label: 'Verification Hub', icon: FileCheck2, badge: pendingVerificationCount, badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    { id: 'underwriting', label: 'Underwriting Hub', icon: Scale, badge: pendingUnderwritingCount, badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'funding', label: 'Funding & Stacking', icon: DollarSign, badge: pendingFundingCount, badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
    { id: 'documents', label: 'Document Vault', icon: FolderLock },
    { id: 'reports', label: 'Operations Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Integrations', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0b1528] border-r border-blue-900/40 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-lg">
      {/* Brand Header - Text Only MAPLE X FINANCIAL (No Logo Graphic) */}
      <div>
        <div className="h-16 px-6 flex items-center border-b border-blue-900/40">
          <div>
            <div className="font-extrabold text-sm text-white tracking-widest flex items-center gap-2">
              <span className="text-amber-400">MAPLE X</span>
              <span className="text-slate-100">FINANCIAL</span>
            </div>
            <div className="text-[10px] text-blue-300/70 font-mono tracking-wider uppercase mt-0.5">
              Operations Portal
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-blue-900/60 text-amber-400 border border-amber-400/30 shadow-md shadow-amber-500/5'
                    : 'text-slate-300 hover:text-white hover:bg-blue-950/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-amber-400' : 'text-blue-300/70 group-hover:text-amber-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md border font-mono font-bold ${
                      item.badgeColor || 'bg-blue-950 text-slate-300 border-blue-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {item.count !== undefined && item.badge === undefined && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status & Security */}
      <div className="p-4 border-t border-blue-900/40 space-y-3">
        {/* Real-time sync status */}
        <div className="p-2.5 rounded-xl bg-[#070d18] border border-blue-900/60 text-[11px] text-slate-300">
          <div className="flex items-center justify-between">
            <span className="flex items-center space-x-1.5 text-blue-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>GHL 2-Way Sync</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {ghlConfig?.isConnected ? 'Active' : 'Offline'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {leads.length} Leads • {clients.length} Clients • {deals.length} Deals
          </div>
        </div>

        {/* Legal & Security Badge */}
        <div className="text-[10px] text-slate-400 text-center font-mono">
          MAPLE X FINANCIAL • OPS OS
        </div>
      </div>
    </aside>
  );
};
