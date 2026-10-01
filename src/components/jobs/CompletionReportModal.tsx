import React, { useState } from 'react';
import {
  CheckCircle,
  X,
  Send,
  Printer,
  Eye,
  EyeOff,
  Edit3,
  ExternalLink,
  MessageSquare,
  FileCheck,
  ShieldCheck,
  SplitSquareVertical,
  Calendar,
  Gauge,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { JobCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatQAR, formatQatarDate } from '../../utils/i18n';
import { BeforeAfterSlider } from '../common/BeforeAfterSlider';
import { CarBlueprintDiagram } from '../vehicle/CarBlueprintDiagram';

interface CompletionReportModalProps {
  job: JobCard;
  onClose: () => void;
  onPrintPreview: (job: JobCard) => void;
}

export const CompletionReportModal: React.FC<CompletionReportModalProps> = ({
  job,
  onClose,
  onPrintPreview,
}) => {
  const {
    updateJob,
    sendCompletionReport,
    togglePhotoVisibility,
    branches,
    settings,
    currentUser,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'review' | 'preview'>('review');
  const [customerNotes, setCustomerNotes] = useState(job.recommendations || '');
  const [discount, setDiscount] = useState(job.discount);
  const [nextServiceKm, setNextServiceKm] = useState<number | ''>(job.nextServiceDueKm || '');
  const [nextServiceDate, setNextServiceDate] = useState(job.nextServiceDueDate || '');

  const branch = branches.find((b) => b.id === job.branchId) || branches[0];

  const beforePhotos = job.photos.filter((p) => p.type === 'before');
  const afterPhotos = job.photos.filter((p) => p.type === 'after');

  const handleSaveChanges = () => {
    updateJob(job.id, {
      discount,
      totalEstimate: Math.max(0, job.subtotal - discount),
      balanceDue: Math.max(0, job.subtotal - discount - job.advancePayment),
      recommendations: customerNotes,
      nextServiceDueKm: typeof nextServiceKm === 'number' ? nextServiceKm : undefined,
      nextServiceDueDate: nextServiceDate,
    });
    addToast({
      type: 'success',
      message: 'Completion Report adjustments saved.',
    });
  };

  const handleSendWhatsApp = () => {
    handleSaveChanges();
    const waLink = sendCompletionReport(job.id);
    if (waLink) {
      // In web browser: open wa.me link
      window.open(waLink, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto border border-slate-200">
        {/* Modal Top Header */}
        <div className="bg-[#0B3A6E] text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-tight">
                  Completion Inspection Report - {job.jobNo}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    job.reportStatus === 'sent'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-amber-400 text-slate-900'
                  }`}
                >
                  {job.reportStatus === 'sent' ? 'Sent to Customer' : 'Ready to Send'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {job.year} {job.make} {job.model} • Plate: {job.plateNumber} • Customer: {job.customerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-white/10 p-0.5 rounded-lg border border-white/15">
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'review' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200'
                }`}
              >
                Admin Edit & Review
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                  activeTab === 'preview' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-200'
                }`}
              >
                Customer Portal Preview
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Admin Edit & Review Mode */}
        {activeTab === 'review' && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* WhatsApp Ready Callout */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-teal-950">
                    Direct WhatsApp Delivery to {job.customerMobile}
                  </h4>
                  <p className="text-[11px] text-teal-800">
                    Sending publishes the report to customer portal and opens a prefilled WhatsApp link with photos and invoice access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer hover:scale-102"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{job.reportStatus === 'sent' ? 'Resend WhatsApp' : 'Send via WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Before vs After Comparison */}
            <div>
              <BeforeAfterSlider beforePhotos={beforePhotos} afterPhotos={afterPhotos} />
            </div>

            {/* Photo Visibility Toggles */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Customer Photo Visibility Controls ({job.photos.length} photos)
                </span>
                <span className="text-[11px] text-slate-500">
                  Click icon to hide internal/scratch photos from customer
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {job.photos.map((p) => (
                  <div
                    key={p.id}
                    className="relative border rounded-lg overflow-hidden bg-white shadow-2xs group"
                  >
                    <img src={p.url} alt={p.caption} className="w-full h-18 object-cover" />
                    <button
                      type="button"
                      onClick={() => togglePhotoVisibility(job.id, p.id)}
                      className={`w-full py-1 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                        p.isCustomerVisible
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {p.isCustomerVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      <span>{p.isCustomerVisible ? 'Visible' : 'Hidden'}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* In/Out Odometer & Fuel */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Intake Odometer:</span>
                <span className="font-bold text-slate-800">{job.odometerIn} KM</span>
              </div>
              <div>
                <span className="text-slate-500 block">Final Odometer:</span>
                <span className="font-bold text-slate-800">{job.odometerOut || job.odometerIn} KM</span>
              </div>
              <div>
                <span className="text-slate-500 block">Intake Fuel:</span>
                <span className="font-bold text-slate-800">{job.fuelLevelIn}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Final Fuel:</span>
                <span className="font-bold text-slate-800">{job.fuelLevelOut || job.fuelLevelIn}</span>
              </div>
            </div>

            {/* Quality Checklist Summary */}
            {job.qualityChecklist && (
              <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified Workshop Quality Checklist (10/10 Passed)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Road Test Executed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> No Fluid Leaks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Tyre Pressures Set
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> AC Cooling Verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Deep Cleaned In/Out
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Belongings Returned
                  </span>
                </div>
              </div>
            )}

            {/* Admin Financial Adjustments */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-3">
                Invoice & Recommendations Adjustment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Discount (QAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-emerald-600 text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Next Recommended Service (KM)
                  </label>
                  <input
                    type="number"
                    value={nextServiceKm}
                    onChange={(e) => setNextServiceKm(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 28500"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Next Service Due Date
                  </label>
                  <input
                    type="date"
                    value={nextServiceDate}
                    onChange={(e) => setNextServiceDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recommendations & Advisories for Customer
                  </label>
                  <textarea
                    rows={2}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Hand wash only for ceramic coating. Front brake pads due in 5,000 km..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Exactly What Customer Sees in Portal */}
        {activeTab === 'preview' && (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto bg-slate-50">
            {/* Live Customer Preview Header */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full mb-2">
                VERIFIED INSPECTION COMPLETION REPORT
              </span>
              <h2 className="text-xl font-black text-[#0B3A6E]">{job.year} {job.make} {job.model}</h2>
              <div className="flex items-center justify-center gap-3 mt-1 text-xs text-slate-600">
                <span className="font-bold text-slate-800">Plate: {job.plateNumber}</span>
                <span>•</span>
                <span>Job Card: {job.jobNo}</span>
                <span>•</span>
                <span>Branch: {branch.nameEn}</span>
              </div>
            </div>

            {/* Before vs After */}
            <BeforeAfterSlider beforePhotos={beforePhotos} afterPhotos={afterPhotos} />

            {/* Damage Diagram */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Vehicle Damage & Intake Inspection Record
              </h4>
              <CarBlueprintDiagram pins={job.damagePins} readOnly />
            </div>

            {/* Itemized Invoice View */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <h4 className="text-xs font-bold text-slate-800">
                  Official Invoice Summary (QAR)
                </h4>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    job.balanceDue === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {job.balanceDue === 0 ? 'PAID IN FULL' : `BALANCE DUE: ${formatQAR(job.balanceDue)}`}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {job.services.map((s) => (
                  <div key={s.id} className="flex justify-between py-1 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{s.name}</span>
                      <p className="text-[11px] text-slate-500">{s.description}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{formatQAR(s.total)}</span>
                  </div>
                ))}
                {job.parts.map((p) => (
                  <div key={p.id} className="flex justify-between py-1 border-b border-slate-100">
                    <div>
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      <span className="text-[10px] text-slate-500 ml-1">({p.brand})</span>
                    </div>
                    <span className="font-mono font-bold text-slate-800">{formatQAR(p.total)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-200 mt-4 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatQAR(job.subtotal)}</span>
                </div>
                {job.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatQAR(job.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 border-t pt-1.5">
                  <span>Total Amount:</span>
                  <span className="font-mono text-[#0B3A6E]">{formatQAR(job.totalEstimate)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Advance:</span>
                  <span className="font-mono">{formatQAR(job.advancePayment)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-[#0B3A6E] border-t pt-1.5">
                  <span>Balance Payable:</span>
                  <span className="font-mono text-emerald-600">{formatQAR(job.balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPrintPreview(job)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-[#0E9AA7]" />
              <span>Print A4 Invoice / Report</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              Save Draft Adjustments
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md cursor-pointer transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send & Publish to WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
