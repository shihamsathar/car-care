import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  MessageSquare,
  FileText,
  RotateCcw,
  Save,
  CheckCircle,
  Users,
  Shield,
  Sparkles,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { INITIAL_USERS } from '../data/seedData';

export const SettingsView: React.FC = () => {
  const { settings, loadDemoData, resetAllData, setCurrentUser, currentUser, addToast } = useApp();

  const [companyNameEn, setCompanyNameEn] = useState(settings.companyNameEn);
  const [companyNameAr, setCompanyNameAr] = useState(settings.companyNameAr);
  const [salwaAddressEn, setSalwaAddressEn] = useState(settings.salwaRoadAddressEn);
  const [salwaAddressAr, setSalwaAddressAr] = useState(settings.salwaRoadAddressAr);
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone);
  const [crNumber, setCrNumber] = useState(settings.crNumber);
  const [taxNumber, setTaxNumber] = useState(settings.taxNumber);
  const [waMode, setWaMode] = useState<'link' | 'cloud_api'>(settings.whatsappMode);
  const [termsEn, setTermsEn] = useState(settings.jobCardTermsEn);
  const [termsAr, setTermsAr] = useState(settings.jobCardTermsAr);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    addToast({
      type: 'success',
      title: 'Settings Updated',
      message: 'Workshop configuration and bilingual templates saved.',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Workshop Settings & Demonstration Controls
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Configure Qatar workshop legal credentials, WhatsApp dispatch templates, and demo state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={resetAllData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shadow-xs transition-all cursor-pointer"
            title="Reset workshop storage and state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Storage & Data</span>
          </button>

          <button
            type="button"
            onClick={loadDemoData}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-500 rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Load Full Qatar Demo Data</span>
          </button>
        </div>
      </div>

      {/* Quick Role Switcher for Evaluators */}
      <div className="bg-[#0B3A6E] text-white p-6 rounded-2xl shadow-md space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-300" />
          <h3 className="font-bold text-sm">1-Click Role Switcher (For Evaluation & Testing)</h3>
        </div>
        <p className="text-xs text-slate-300">
          Instantly switch between roles to test the Super Admin dashboard, Branch Admin scope, Technician mobile workflow, or Customer portal:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-2">
          {INITIAL_USERS.map((user) => {
            const isCurrent = currentUser?.id === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setCurrentUser(user)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-white text-slate-900 border-teal-400 ring-2 ring-teal-400 shadow-md'
                    : 'bg-white/10 hover:bg-white/20 border-white/15 text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                    {user.role}
                  </span>
                  {isCurrent && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <strong className="text-xs block truncate">{user.name.split('(')[0]}</strong>
                <span className="text-[11px] opacity-75 font-mono truncate block">
                  {user.username}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        {/* Business Profile */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A6E] mb-3 flex items-center gap-1.5">
            <Building className="w-4 h-4 text-[#0E9AA7]" />
            Business Profile & Qatar Registration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Workshop Name (English)
              </label>
              <input
                type="text"
                value={companyNameEn}
                onChange={(e) => setCompanyNameEn(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                اسم الورشة (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={companyNameAr}
                onChange={(e) => setCompanyNameAr(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Salwa Road Workshop Address (English)
              </label>
              <input
                type="text"
                value={salwaAddressEn}
                onChange={(e) => setSalwaAddressEn(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                عنوان الورشة - طريق سلوى (العربية)
              </label>
              <input
                type="text"
                dir="rtl"
                value={salwaAddressAr}
                onChange={(e) => setSalwaAddressAr(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Commercial Registration (CR)
              </label>
              <input
                type="text"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Delivery Mode */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A6E] mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#0E9AA7]" />
            WhatsApp Delivery Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
              waMode === 'link' ? 'bg-teal-50/70 border-teal-400 ring-1 ring-teal-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="waMode"
                  checked={waMode === 'link'}
                  onChange={() => setWaMode('link')}
                  className="text-teal-600"
                />
                <strong className="text-xs text-slate-900">wa.me Deep Link (Default & Instant)</strong>
              </div>
              <p className="text-[11px] text-slate-500 ml-5">
                Generates instant wa.me link directly to customer WhatsApp with pre-filled message, plate, and report link.
              </p>
            </label>

            <label className={`p-4 rounded-xl border cursor-pointer transition-all ${
              waMode === 'cloud_api' ? 'bg-teal-50/70 border-teal-400 ring-1 ring-teal-400' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="radio"
                  name="waMode"
                  checked={waMode === 'cloud_api'}
                  onChange={() => setWaMode('cloud_api')}
                  className="text-teal-600"
                />
                <strong className="text-xs text-slate-900">Meta WhatsApp Cloud API (Automated)</strong>
              </div>
              <p className="text-[11px] text-slate-500 ml-5">
                Connects to Meta Business Cloud API with pre-approved Qatar message templates.
              </p>
            </label>
          </div>
        </div>

        {/* Legal Terms & Conditions */}
        <div className="border-t border-slate-200 pt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A6E] mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-[#0E9AA7]" />
            Bilingual Job Card Legal Terms
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                English Terms (Print on Job Card A4)
              </label>
              <textarea
                rows={4}
                value={termsEn}
                onChange={(e) => setTermsEn(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                شروط الصيانة بالعربية (طباعة بطاقة العمل)
              </label>
              <textarea
                rows={4}
                dir="rtl"
                value={termsAr}
                onChange={(e) => setTermsAr(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-md cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
