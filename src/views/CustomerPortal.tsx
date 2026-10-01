import React, { useState } from 'react';
import {
  Car,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  FileText,
  MessageSquare,
  Printer,
  ShieldCheck,
  SplitSquareVertical,
  Wrench,
  AlertCircle,
  Eye,
  LogOut,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JobCard } from '../types';
import { formatQatarDate, formatQAR, generateWhatsAppLink } from '../utils/i18n';
import { BeforeAfterSlider } from '../components/common/BeforeAfterSlider';
import { CarBlueprintDiagram } from '../components/vehicle/CarBlueprintDiagram';
import { JobCardPrintView } from '../components/jobs/JobCardPrintView';

export const CustomerPortal: React.FC = () => {
  const { jobs, currentUser, branches, settings } = useApp();

  if (!currentUser) {
    return null;
  }

  // Find customer's jobs matching their QID
  const customerQID = currentUser.qid || currentUser.username;
  const customerJobs = jobs.filter(
    (j) => j.customerQID === customerQID || j.customerId === currentUser.id
  );

  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    customerJobs[0]?.id || null
  );
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const activeJob = customerJobs.find((j) => j.id === selectedJobId) || customerJobs[0];
  const branch = branches.find((b) => b.id === activeJob?.branchId) || branches[0];

  const beforePhotos = activeJob?.photos.filter((p) => p.type === 'before' && p.isCustomerVisible) || [];
  const afterPhotos = activeJob?.photos.filter((p) => p.type === 'after' && p.isCustomerVisible) || [];

  // WhatsApp button to chat with the workshop branch
  const handleContactBranchWhatsApp = () => {
    if (!branch) return;
    const phone = branch.phone.replace(/[^0-9]/g, '');
    const msg = `Hello ${branch.nameEn}, I am inquiring regarding my vehicle ${activeJob?.make} ${activeJob?.model} (Plate: ${activeJob?.plateNumber}, Job: ${activeJob?.jobNo}).`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Status step progression helper
  const getProgressPercentage = (status: string) => {
    switch (status) {
      case 'Draft':
      case 'Created':
        return 15;
      case 'Assigned':
      case 'Accepted':
        return 30;
      case 'Inspection':
      case 'In Progress':
        return 55;
      case 'Quality Check':
        return 80;
      case 'Completed':
      case 'Report Sent':
      case 'Delivered/Closed':
        return 100;
      default:
        return 40;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Customer Welcome Card */}
      <div className="bg-[#0B3A6E] text-white p-6 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-teal-300">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-teal-300 uppercase tracking-wider block">
              Qatar Customer Service Portal
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Welcome, {currentUser.name}
            </h2>
            <p className="text-xs text-slate-300">
              QID: <strong className="text-white font-mono">{customerQID}</strong> • Verified Qatar Workshop Record
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleContactBranchWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-xl shadow-md transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-emerald-800" />
            <span>Chat via WhatsApp</span>
          </button>
        </div>
      </div>

      {customerJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Vehicles / Jobs Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              My Vehicle Service History ({customerJobs.length})
            </h3>

            <div className="space-y-2">
              {customerJobs.map((job) => {
                const isSelected = activeJob?.id === job.id;
                const isCompleted = job.status === 'Completed' || job.status === 'Report Sent' || job.status === 'Delivered/Closed';
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#0B3A6E] ring-2 ring-[#0B3A6E]/20 shadow-md'
                        : 'bg-white/80 border-slate-200 hover:bg-white shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold font-mono text-[#0E9AA7]">
                        {job.jobNo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">
                      {job.year} {job.make} {job.model}
                    </h4>
                    <p className="text-xs text-slate-500">Plate: {job.plateNumber}</p>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{formatQatarDate(job.createdAt)}</span>
                      <span className="font-semibold text-slate-700">{formatQAR(job.totalEstimate)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Report or Live Progress Bar */}
          <div className="md:col-span-2 space-y-5">
            {activeJob && (
              <>
                {/* Live Service Progress Bar (If in service) */}
                {activeJob.status !== 'Report Sent' && activeJob.status !== 'Delivered/Closed' && activeJob.status !== 'Completed' ? (
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 block">
                          Service in Progress
                        </span>
                        <h3 className="font-bold text-base text-slate-900">
                          {activeJob.year} {activeJob.make} {activeJob.model}
                        </h3>
                      </div>
                      <span className="px-3 py-1 bg-teal-50 text-teal-700 font-bold text-xs rounded-full border border-teal-200">
                        {activeJob.status}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
                        <span>Work Completed</span>
                        <span>{getProgressPercentage(activeJob.status)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0E9AA7] h-full transition-all duration-500 rounded-full"
                          style={{ width: `${getProgressPercentage(activeJob.status)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0E9AA7] shrink-0" />
                      <span>
                        Expected completion: <strong className="text-slate-800">{formatQatarDate(activeJob.expectedDelivery)}</strong>
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* COMPLETE REPORT (Shown when completed / sent) */}
                {activeJob.reportStatus === 'sent' || activeJob.status === 'Completed' || activeJob.status === 'Report Sent' || activeJob.status === 'Delivered/Closed' ? (
                  <div className="space-y-5">
                    {/* Top Report Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-start justify-between flex-wrap gap-3 border-b border-slate-100 pb-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> OFFICIAL INSPECTION REPORT
                            </span>
                            <span className="text-xs font-mono font-bold text-[#0B3A6E]">
                              {activeJob.jobNo}
                            </span>
                          </div>
                          <h2 className="text-lg font-bold text-slate-900 mt-1">
                            {activeJob.year} {activeJob.make} {activeJob.model}
                          </h2>
                          <p className="text-xs text-slate-500">
                            Plate: <strong className="text-slate-800">{activeJob.plateNumber}</strong> ({activeJob.plateType}) • Color: {activeJob.color}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowPrintModal(true)}
                          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#0B3A6E] bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <Printer className="w-4 h-4 text-[#0E9AA7]" />
                          <span>Download / Print PDF</span>
                        </button>
                      </div>

                      {/* In/Out Odometer & Fuel */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Intake Odometer</span>
                          <span className="font-bold text-slate-800 font-mono">{activeJob.odometerIn} KM</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Delivery Odometer</span>
                          <span className="font-bold text-slate-800 font-mono">{activeJob.odometerOut || activeJob.odometerIn} KM</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Fuel at Reception</span>
                          <span className="font-bold text-slate-800">{activeJob.fuelLevelIn}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Fuel at Handover</span>
                          <span className="font-bold text-slate-800">{activeJob.fuelLevelOut || activeJob.fuelLevelIn}</span>
                        </div>
                      </div>
                    </div>

                    {/* BEFORE VS AFTER PHOTO SLIDER */}
                    {beforePhotos.length > 0 && afterPhotos.length > 0 && (
                      <BeforeAfterSlider beforePhotos={beforePhotos} afterPhotos={afterPhotos} />
                    )}

                    {/* INTAKE DAMAGE BLUEPRINT */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-800 mb-2">
                        Intake Vehicle Inspection & Damage Marks
                      </h4>
                      <CarBlueprintDiagram pins={activeJob.damagePins} readOnly />
                    </div>

                    {/* SERVICES PERFORMED & ITEMIZED INVOICE */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                      <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B3A6E]">
                          Itemized Services & Official Tax Invoice (QAR)
                        </h4>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            activeJob.balanceDue === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {activeJob.balanceDue === 0 ? 'PAID IN FULL' : `BALANCE DUE: ${formatQAR(activeJob.balanceDue)}`}
                        </span>
                      </div>

                      <div className="divide-y divide-slate-100 text-xs">
                        {activeJob.services.map((s) => (
                          <div key={s.id} className="py-2.5 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-slate-800">{s.name}</p>
                              <p className="text-[11px] text-slate-500">{s.description}</p>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{formatQAR(s.total)}</span>
                          </div>
                        ))}
                        {activeJob.parts.map((p) => (
                          <div key={p.id} className="py-2.5 flex justify-between items-center bg-slate-50/50 px-2 rounded">
                            <div>
                              <p className="font-bold text-slate-800">{p.name}</p>
                              <p className="text-[10px] text-slate-400">Genuine OEM Replacement Part</p>
                            </div>
                            <span className="font-mono font-bold text-slate-900">{formatQAR(p.total)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Invoice Totals */}
                      <div className="border-t border-slate-200 mt-4 pt-4 space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Subtotal:</span>
                          <span className="font-mono">{formatQAR(activeJob.subtotal)}</span>
                        </div>
                        {activeJob.discount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-semibold">
                            <span>Special Workshop Discount:</span>
                            <span className="font-mono">-{formatQAR(activeJob.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-sm text-slate-900 border-t pt-2">
                          <span>Total Amount:</span>
                          <span className="font-mono text-[#0B3A6E]">{formatQAR(activeJob.totalEstimate)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Advance Deposit Paid:</span>
                          <span className="font-mono">{formatQAR(activeJob.advancePayment)}</span>
                        </div>
                        <div className="flex justify-between font-black text-base text-[#0B3A6E] border-t pt-2">
                          <span>Remaining Balance:</span>
                          <span className="font-mono text-emerald-600">{formatQAR(activeJob.balanceDue)}</span>
                        </div>
                      </div>
                    </div>

                    {/* ADVISORIES & NEXT SERVICE */}
                    {activeJob.recommendations && (
                      <div className="bg-teal-50/80 p-5 rounded-2xl border border-teal-200 text-xs space-y-2">
                        <span className="font-bold text-teal-950 uppercase tracking-wider block">
                          Technician Advisories & Recommendations
                        </span>
                        <p className="text-teal-900 leading-relaxed font-medium">
                          {activeJob.recommendations}
                        </p>
                        {activeJob.nextServiceDueKm && (
                          <div className="pt-2 flex items-center gap-2 text-teal-800 font-semibold">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            <span>
                              Recommended next service due at: <strong>{activeJob.nextServiceDueKm} KM</strong> or {activeJob.nextServiceDueDate || '6 months'}.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          No vehicle records found for Qatar ID {customerQID}. Contact the workshop front desk.
        </div>
      )}

      {/* Printable Report Modal */}
      {showPrintModal && activeJob && (
        <JobCardPrintView job={activeJob} onClose={() => setShowPrintModal(false)} />
      )}
    </div>
  );
};
