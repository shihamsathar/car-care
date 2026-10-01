import React, { useState } from 'react';
import {
  Car,
  LayoutDashboard,
  Kanban,
  FileCheck,
  Wrench,
  Users,
  Database,
  Settings,
  Plus,
  Globe,
  Building,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Eye,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Clock,
  Sparkles,
  Printer
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { AdminOverview } from './views/AdminOverview';
import { CompletedJobsView } from './views/CompletedJobsView';
import { MasterDataView } from './views/MasterDataView';
import { CustomersView } from './views/CustomersView';
import { TechniciansView } from './views/TechniciansView';
import { SettingsView } from './views/SettingsView';
import { InvoicesView } from './views/InvoicesView';
import { BranchesView } from './views/BranchesView';
import { ReportsView } from './views/ReportsView';
import { TechnicianDashboard } from './views/TechnicianDashboard';
import { CustomerPortal } from './views/CustomerPortal';
import { LoginPage } from './views/LoginPage';
import { JobCardForm } from './components/jobs/JobCardForm';
import { JobCardPrintView } from './components/jobs/JobCardPrintView';
import { CompletionReportModal } from './components/jobs/CompletionReportModal';
import { QuickLookupModal } from './components/common/QuickLookupModal';
import { ToastContainer } from './components/common/ToastContainer';
import { JobCard } from './types';
import { t } from './utils/i18n';
import { CreditCard, BarChart3 } from 'lucide-react';

type ActivePage =
  | 'overview'
  | 'jobs'
  | 'completed'
  | 'invoices'
  | 'branches'
  | 'technicians'
  | 'customers'
  | 'master-data'
  | 'reports'
  | 'settings';

const AppLayout: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    logout,
    isViewingAs,
    exitViewAs,
    language,
    setLanguage,
    dir,
    selectedBranchId,
    setSelectedBranchId,
    branches,
    jobs,
  } = useApp();

  const [activePage, setActivePage] = useState<ActivePage>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [printingJob, setPrintingJob] = useState<JobCard | null>(null);
  const [reportJob, setReportJob] = useState<JobCard | null>(null);

  // Unread/ready counts
  const readyReportCount = jobs.filter((j) => j.reportStatus === 'ready').length;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  // If not authenticated, render Login Page!
  if (!currentUser) {
    return <LoginPage onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // If user role is TECHNICIAN, show the technician experience
  if (currentUser.role === 'TECHNICIAN') {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans" dir={dir}>
        {/* View As Banner */}
        {isViewingAs && (
          <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>
                {t('viewAsActive', language)}: {currentUser.name} ({currentUser.role})
              </span>
            </div>
            <button
              type="button"
              onClick={exitViewAs}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            >
              {t('returnToAdmin', language)}
            </button>
          </div>
        )}

        {/* Top Navbar */}
        <header className="bg-[#0B3A6E] text-white px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/30 border border-teal-400/40 text-teal-300 font-black flex items-center justify-center text-sm">
              CC
            </span>
            <div>
              <h1 className="font-bold text-sm tracking-tight">{t('appName', language)}</h1>
              <p className="text-[10px] text-teal-300">Qatar Technician Bay Workflow</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-300" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-200 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-400/30 rounded-lg cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'خروج' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <TechnicianDashboard />
        </main>

        <ToastContainer />
        <QuickLookupModal />
      </div>
    );
  }

  // If user role is CUSTOMER, show the customer experience
  if (currentUser.role === 'CUSTOMER') {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans" dir={dir}>
        {/* View As Banner */}
        {isViewingAs && (
          <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>
                {t('viewAsActive', language)}: {currentUser.name} (QID: {currentUser.qid || currentUser.username})
              </span>
            </div>
            <button
              type="button"
              onClick={exitViewAs}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors"
            >
              {t('returnToAdmin', language)}
            </button>
          </div>
        )}

        <header className="bg-[#0B3A6E] text-white px-6 py-3.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-500/30 border border-teal-400/40 text-teal-300 font-black flex items-center justify-center text-sm">
              CC
            </span>
            <div>
              <h1 className="font-bold text-sm tracking-tight">{t('appName', language)}</h1>
              <p className="text-[10px] text-teal-300">Customer Inspection Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-300" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-200 bg-rose-900/40 hover:bg-rose-900/70 border border-rose-400/30 rounded-lg cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'خروج' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <CustomerPortal />
        </main>

        <ToastContainer />
        <QuickLookupModal />
      </div>
    );
  }

  // SUPER ADMIN & BRANCH ADMIN VIEW
  const navigationItems = [
    { id: 'overview', label: t('navOverview', language), icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'jobs', label: t('navJobCards', language), icon: <Kanban className="w-4 h-4" /> },
    {
      id: 'completed',
      label: t('navCompletedJobs', language),
      icon: <FileCheck className="w-4 h-4" />,
      badge: readyReportCount > 0 ? readyReportCount : undefined,
    },
    { id: 'invoices', label: language === 'ar' ? 'الفواتير والمدفوعات' : 'Invoices & Payments', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'branches', label: language === 'ar' ? 'الفروع' : 'Branches', icon: <Building className="w-4 h-4" /> },
    { id: 'technicians', label: t('navTechnicians', language), icon: <Wrench className="w-4 h-4" /> },
    { id: 'customers', label: t('navCustomers', language), icon: <Users className="w-4 h-4" /> },
    { id: 'master-data', label: t('navMasterData', language), icon: <Database className="w-4 h-4" /> },
    { id: 'reports', label: language === 'ar' ? 'التقارير والإحصائيات' : 'Reports & Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'settings', label: t('navSettings', language), icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col font-sans" dir={dir}>
      {/* View As Banner */}
      {isViewingAs && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-xs sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>
              {t('viewAsActive', language)}: {currentUser.name} ({currentUser.role})
            </span>
          </div>
          <button
            type="button"
            onClick={exitViewAs}
            className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors"
          >
            {t('returnToAdmin', language)}
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-[#0B3A6E] text-white font-black text-sm flex items-center justify-center shadow-xs">
              CC
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base text-[#0B3A6E] tracking-tight">
                  {t('appName', language)}
                </h1>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-teal-50 text-[#0E9AA7] border border-teal-200">
                  QATAR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Multi-Branch Workshop Management System
              </p>
            </div>
          </div>
        </div>

        {/* Top Right: Branch Switcher & Language */}
        <div className="flex items-center gap-2.5">
          {/* Branch Switcher */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl">
            <Building className="w-3.5 h-3.5 text-[#0E9AA7] shrink-0" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">{t('allBranches', language)}</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {language === 'ar' ? b.nameAr : b.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Language Toggle (EN / AR) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#0E9AA7]" />
            <span>{language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          {/* Quick Create Job Button */}
          <button
            type="button"
            onClick={() => setIsCreatingJob(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-xs transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-3.5 h-3.5 text-teal-300" />
            <span>{t('navNewJobCard', language)}</span>
          </button>

          {/* Sign Out / Switch User Button */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl cursor-pointer transition-colors shadow-2xs"
            title="Sign out / Switch account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{language === 'ar' ? 'خروج' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <div className="flex-1 flex">
        {/* Left Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>

          {navigationItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActivePage(item.id as ActivePage)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B3A6E] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-teal-300' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 mt-auto border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Active User
                </span>
                <p className="text-xs font-bold text-slate-900 truncate max-w-[130px]">{currentUser.name}</p>
                <span className="text-[10px] text-teal-700 font-semibold">{currentUser.role}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-64 bg-white p-4 flex flex-col space-y-1 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                <span className="font-bold text-sm text-[#0B3A6E]">CarCare Pro Qatar</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActivePage(item.id as ActivePage);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                    activePage === item.id
                      ? 'bg-[#0B3A6E] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-4 mt-auto border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activePage === 'overview' && (
            <AdminOverview
              onNewJobClick={() => setIsCreatingJob(true)}
              onEditJobClick={(job) => setEditingJob(job)}
              onViewReportClick={(job) => setReportJob(job)}
              onPrintJobClick={(job) => setPrintingJob(job)}
            />
          )}

          {activePage === 'jobs' && (
            <AdminOverview
              onNewJobClick={() => setIsCreatingJob(true)}
              onEditJobClick={(job) => setEditingJob(job)}
              onViewReportClick={(job) => setReportJob(job)}
              onPrintJobClick={(job) => setPrintingJob(job)}
            />
          )}

          {activePage === 'completed' && <CompletedJobsView />}

          {activePage === 'invoices' && <InvoicesView />}

          {activePage === 'branches' && <BranchesView />}

          {activePage === 'technicians' && <TechniciansView />}

          {activePage === 'customers' && <CustomersView />}

          {activePage === 'master-data' && <MasterDataView />}

          {activePage === 'reports' && <ReportsView />}

          {activePage === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* MODALS */}
      {/* Create / Edit Job Card Modal */}
      {(isCreatingJob || editingJob) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-3 sm:p-6">
          <div className="my-auto w-full max-w-5xl">
            <JobCardForm
              initialJob={editingJob || undefined}
              onSuccess={(saved) => {
                setIsCreatingJob(false);
                setEditingJob(null);
              }}
              onCancel={() => {
                setIsCreatingJob(false);
                setEditingJob(null);
              }}
              onPrintPreview={(j) => {
                setIsCreatingJob(false);
                setEditingJob(null);
                setPrintingJob(j);
              }}
            />
          </div>
        </div>
      )}

      {/* Completion Report Modal */}
      {reportJob && (
        <CompletionReportModal
          job={reportJob}
          onClose={() => setReportJob(null)}
          onPrintPreview={(j) => {
            setReportJob(null);
            setPrintingJob(j);
          }}
        />
      )}

      {/* Print Job Card Modal */}
      {printingJob && (
        <JobCardPrintView job={printingJob} onClose={() => setPrintingJob(null)} />
      )}

      {/* Global Quick Lookup Modal (Triggered by "+" buttons) */}
      <QuickLookupModal />

      {/* Toast Notification Container */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}
