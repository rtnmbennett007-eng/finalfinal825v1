import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ToastContainer } from './components/common/Toast';
import { DashboardOverview } from './components/dashboard/DashboardOverview';
import { LeadsWorkspace } from './components/leads/LeadsWorkspace';
import { LeadModal } from './components/leads/LeadModal';
import { ClientsWorkspace } from './components/clients/ClientsWorkspace';
import { NewClientModal } from './components/clients/NewClientModal';
import { VerificationHub } from './components/verification/VerificationHub';
import { UnderwritingHub } from './components/underwriting/UnderwritingHub';
import { FundingWorkspace } from './components/funding/FundingWorkspace';
import { DocumentVault } from './components/vault/DocumentVault';
import { OperationsReports } from './components/reports/OperationsReports';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';
import { CommandCenterModal } from './components/layout/CommandCenterModal';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [reportFilters, setReportFilters] = useState<{
    view?: any;
    stage?: string;
    commissionStatus?: string;
    quickPreset?: string;
  } | null>(null);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const { setSelectedClientId } = useData();

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandCenterOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070e22] text-slate-100">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-xs text-blue-200 uppercase tracking-widest font-mono">
            Loading Maple X Secure Session...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const handleOpenNewLeadModal = () => setIsNewLeadModalOpen(true);
  const handleOpenNewClientModal = () => setIsNewClientModalOpen(true);

  const handleNavigateToReports = (filters?: {
    view?: any;
    stage?: string;
    commissionStatus?: string;
    quickPreset?: string;
  }) => {
    setReportFilters(filters || null);
    setActiveTab('reports');
  };

  return (
    <div className="flex h-screen bg-[#070e22] text-slate-100 font-sans overflow-hidden">
      {/* Toast Notification Container */}
      <ToastContainer />

      {/* Main Persistent Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab !== 'clients') {
            setSelectedClientId(null);
          }
          setActiveTab(tab);
        }}
      />

      {/* Primary Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#070e22]">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewLeadModal={handleOpenNewLeadModal}
          onOpenNewClientModal={handleOpenNewClientModal}
          onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-5 lg:p-7 bg-[#070e22]">
          {activeTab === 'dashboard' && (
            <DashboardOverview
              setActiveTab={setActiveTab}
              onOpenNewLeadModal={handleOpenNewLeadModal}
              onOpenNewClientModal={handleOpenNewClientModal}
              onNavigateToReports={handleNavigateToReports}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsWorkspace
              onOpenNewLeadModal={handleOpenNewLeadModal}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'clients' && (
            <ClientsWorkspace
              onOpenNewClientModal={handleOpenNewClientModal}
              isNewClientModalOpen={isNewClientModalOpen}
              setIsNewClientModalOpen={setIsNewClientModalOpen}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'verification' && (
            <VerificationHub setActiveTab={setActiveTab} />
          )}

          {activeTab === 'underwriting' && (
            <UnderwritingHub setActiveTab={setActiveTab} />
          )}

          {activeTab === 'funding' && (
            <FundingWorkspace setActiveTab={setActiveTab} />
          )}

          {activeTab === 'documents' && (
            <DocumentVault setActiveTab={setActiveTab} />
          )}

          {activeTab === 'reports' && (
            <OperationsReports
              initialFilters={reportFilters}
              onSelectClient={(clientId) => {
                setSelectedClientId(clientId);
                setActiveTab('clients');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {isNewLeadModalOpen && (
        <LeadModal
          isOpen={isNewLeadModalOpen}
          onClose={() => setIsNewLeadModalOpen(false)}
        />
      )}

      {isNewClientModalOpen && (
        <NewClientModal
          isOpen={isNewClientModalOpen}
          onClose={() => setIsNewClientModalOpen(false)}
          onClientCreated={(client) => {
            setSelectedClientId(client.id);
            setActiveTab('clients');
          }}
        />
      )}

      {/* Global Command Center Workspace */}
      <CommandCenterModal
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        setActiveTab={setActiveTab}
        onOpenNewClientModal={handleOpenNewClientModal}
        onOpenNewLeadModal={handleOpenNewLeadModal}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <MainLayout />
      </DataProvider>
    </AuthProvider>
  );
}
