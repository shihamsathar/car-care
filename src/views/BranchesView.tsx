import React, { useState } from 'react';
import {
  Building,
  Plus,
  MapPin,
  Phone,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  X,
  Briefcase
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Branch } from '../types';

export const BranchesView: React.FC = () => {
  const { branches, jobs, technicians, addToast } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New branch form state
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [code, setCode] = useState('');
  const [addressEn, setAddressEn] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [phone, setPhone] = useState('+974 ');
  const [email, setEmail] = useState('');
  const [cr, setCr] = useState('');
  const [manager, setManager] = useState('');

  const handleAddBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !code.trim()) return;

    addToast({
      type: 'success',
      title: 'Branch Workspace Created',
      message: `Branch ${nameEn} (${code.toUpperCase()}) created with full independent job cards & technician pool.`,
    });

    setIsAddModalOpen(false);
    setNameEn('');
    setNameAr('');
    setCode('');
    setAddressEn('');
    setAddressAr('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Workshop Branches & Locations (Qatar)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Each branch operates an independent workspace with its own sequential job numbers, bays, technicians, and local customers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {branches.map((branch) => {
          const branchJobs = jobs.filter((j) => j.branchId === branch.id);
          const branchTechs = technicians.filter((t) => t.branchId === branch.id);
          const activeCount = branchJobs.filter(
            (j) => j.status !== 'Delivered/Closed' && j.status !== 'Cancelled'
          ).length;

          return (
            <div
              key={branch.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-teal-50 text-[#0E9AA7] border border-teal-200 uppercase font-mono">
                      Code: {branch.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{branch.nameEn}</h3>
                    <p className="text-xs text-slate-500" dir="rtl">{branch.nameAr}</p>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#0E9AA7] shrink-0 mt-0.5" />
                    <span>{branch.addressEn}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#0E9AA7] shrink-0" />
                    <span className="font-mono">{branch.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#0E9AA7] shrink-0" />
                    <span>Manager: {branch.managerName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200">
                    CR: {branch.commercialRegistration} • TIN: {branch.taxRegistration}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Active Jobs
                    </span>
                    <span className="text-lg font-black text-[#0B3A6E] font-mono">
                      {activeCount}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Assigned Techs
                    </span>
                    <span className="text-lg font-black text-teal-600 font-mono">
                      {branchTechs.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B3A6E] text-white">
              <h3 className="font-bold text-sm">Add New Workshop Branch</h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBranch} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch Name (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Al Khor Express Workshop"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    اسم الفرع (العربية)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={nameAr}
                    onChange={(e) => setNameAr(e.target.value)}
                    placeholder="مثال: فرع الخور للصيانة السريعة"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    3-Letter Code (for Job Card Seq) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. KHR"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone (+974)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+974 4477 8899"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Qatar Address
                  </label>
                  <input
                    type="text"
                    value={addressEn}
                    onChange={(e) => setAddressEn(e.target.value)}
                    placeholder="e.g. Al Khor Coastal Road, Gate 3"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-[#0B3A6E] rounded-lg shadow-sm"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
