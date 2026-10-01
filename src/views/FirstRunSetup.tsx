import React, { useState } from 'react';
import {
  Car,
  ShieldCheck,
  Building,
  Database,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Lock,
  User,
  Phone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface FirstRunSetupProps {
  onComplete: () => void;
}

export const FirstRunSetup: React.FC<FirstRunSetupProps> = ({ onComplete }) => {
  const { loadDemoData, setCurrentUser, addToast } = useApp();
  const [step, setStep] = useState<number>(1);

  // Step 1: Admin
  const [adminName, setAdminName] = useState('Tariq Al-Mohannadi');
  const [adminEmail, setAdminEmail] = useState('admin@carcarepro.qa');
  const [adminPassword, setAdminPassword] = useState('Admin#974Qatar');
  const [adminPhone, setAdminPhone] = useState('+974 5511 2233');

  // Step 2: Branch
  const [branchNameEn, setBranchNameEn] = useState('Doha Main Branch - Salwa Road');
  const [branchNameAr, setBranchNameAr] = useState('فرع الدوحة الرئيسي - طريق سلوى');
  const [branchCode, setBranchCode] = useState('DOH');
  const [branchPhone, setBranchPhone] = useState('+974 4455 6677');
  const [crNumber, setCrNumber] = useState('148920/1');

  const handleFinishSetup = () => {
    // Initialize with standard seed data
    loadDemoData();

    // Set the user to Super Admin
    setCurrentUser({
      id: 'user-superadmin',
      username: adminEmail,
      name: `${adminName} (Super Admin)`,
      role: 'SUPER_ADMIN' as UserRole,
      email: adminEmail,
      phone: adminPhone,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    addToast({
      type: 'success',
      title: 'Setup Completed Successfully',
      message: `CarCare Pro initialized with ${branchNameEn} and Super Admin ${adminName}.`,
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-[#0B3A6E] text-white p-6 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-white/10 mx-auto flex items-center justify-center text-teal-300 font-black text-xl mb-3 shadow-inner">
            CC
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-400 text-slate-900 mb-2 inline-block">
            First-Run Workshop Setup
          </span>
          <h1 className="text-xl font-bold tracking-tight">Welcome to CarCare Pro Qatar</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Configure your Super Admin owner credentials, setup your first workshop branch on Salwa Road, and seed master lookup data.
          </p>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-center gap-3 py-4 bg-slate-50 border-b border-slate-100">
          {[
            { num: 1, label: 'Super Admin' },
            { num: 2, label: 'Main Branch' },
            { num: 3, label: 'Seed Master Data' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s.num
                    ? 'bg-[#0B3A6E] text-white'
                    : step > s.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {step > s.num ? <CheckCircle className="w-3.5 h-3.5" /> : s.num}
              </span>
              <span className={`text-xs font-semibold ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
                {s.label}
              </span>
              {s.num < 3 && <span className="text-slate-300 ml-1">→</span>}
            </div>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#0E9AA7]" />
                Step 1: Super Admin Account (Workshop Owner)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Owner Email / Login Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile (+974)
                  </label>
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleFinishSetup}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Quick Start with Demo Defaults
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl cursor-pointer shadow-md"
                >
                  <span>Next: Main Branch</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-[#0E9AA7]" />
                Step 2: Main Workshop Branch Details (Doha)
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Branch Name (English)
                </label>
                <input
                  type="text"
                  value={branchNameEn}
                  onChange={(e) => setBranchNameEn(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  اسم الفرع (العربية)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={branchNameAr}
                  onChange={(e) => setBranchNameAr(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch Code
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Commercial Registration (CR)
                  </label>
                  <input
                    type="text"
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl cursor-pointer shadow-md"
                >
                  <span>Next: Seed Data</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#0E9AA7]" />
                Step 3: Seed Qatar Catalogs & Complete Setup
              </h3>

              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs space-y-2 text-teal-950">
                <p className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Automatic Qatar Workshop Catalogs Ready to Load:
                </p>
                <ul className="list-disc list-inside space-y-1 text-teal-900 text-[11px]">
                  <li>40+ World Vehicle Makes (Toyota, Lexus, Nissan, Land Rover, Porsche...)</li>
                  <li>Top GCC market models (LC300, Patrol Super Safari, Defender, Cayenne...)</li>
                  <li>Qatar Traffic Dept Plate Types (Private White, Commercial, Classic...)</li>
                  <li>Qatar Insurance Companies (QIC, Doha Insurance, Beema, Al Koot...)</li>
                  <li>Complete Qatar Service Catalog with standard QAR prices</li>
                  <li>Demo Technicians & Customers with authentic 11-digit QIDs</li>
                </ul>
              </div>

              <div className="pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinishSetup}
                  className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-102"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Launch CarCare Pro Qatar</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
