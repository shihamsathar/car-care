import React, { useState } from 'react';
import { Printer, X, Download, ShieldCheck, QrCode, Loader2 } from 'lucide-react';
import { JobCard } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatQAR, formatQatarDate } from '../../utils/i18n';
import { CarBlueprintDiagram } from '../vehicle/CarBlueprintDiagram';
import { downloadElementAsPdf } from '../../utils/pdfGenerator';

interface JobCardPrintViewProps {
  job: JobCard;
  onClose: () => void;
}

export const JobCardPrintView: React.FC<JobCardPrintViewProps> = ({ job, onClose }) => {
  const { branches, settings } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const branch = branches.find((b) => b.id === job.branchId) || branches[0];

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    await downloadElementAsPdf('job-card-printable-area', `JobCard-${job.jobNo}.pdf`);
    setIsGeneratingPdf(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-4">
      {/* Container */}
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto print:m-0 print:w-full print:shadow-none print:rounded-none">
        {/* Action Header Bar (Hidden on print) */}
        <div className="no-print bg-[#0B3A6E] text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-teal-300" />
            <h3 className="font-bold text-sm">Job Card Print Preview (A4 Formal) - #{job.jobNo}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isGeneratingPdf}
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-teal-300" />}
              <span>{isGeneratingPdf ? 'Saving...' : 'Download PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-900 bg-teal-400 hover:bg-teal-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print A4</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="job-card-printable-area" className="p-8 print:p-4 text-slate-900 bg-white font-sans text-xs leading-normal">
          {/* Header & Logo */}
          <div className="flex items-start justify-between border-b-2 border-[#0B3A6E] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 rounded-lg bg-[#0B3A6E] text-white font-black text-sm flex items-center justify-center">
                  CC
                </span>
                <span className="text-xl font-black text-[#0B3A6E] tracking-tight">
                  CARCARE PRO QATAR
                </span>
              </div>
              <p className="font-bold text-slate-800">{branch.nameEn}</p>
              <p className="text-[11px] text-slate-500">{branch.addressEn} • Tel: {branch.phone}</p>
              <p className="text-[10px] text-slate-400">CR: {branch.commercialRegistration} • Tax ID: {branch.taxRegistration}</p>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-[#0B3A6E] text-white font-bold rounded text-xs mb-1">
                OFFICIAL WORKSHOP JOB CARD
              </span>
              <p className="text-base font-black text-[#0B3A6E] tracking-wider font-mono">
                {job.jobNo}
              </p>
              <p className="text-[11px] text-slate-500">Date: {formatQatarDate(job.createdAt)}</p>
              <p className="text-[11px] text-slate-500">
                Priority: <span className="font-bold uppercase text-amber-600">{job.priority}</span>
              </p>
            </div>
          </div>

          {/* Customer & Vehicle Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-lg p-3 bg-slate-50/50 mb-4">
            {/* Customer Box */}
            <div className="space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-[#0B3A6E] border-b pb-0.5 mb-1.5">
                Customer Details
              </p>
              <p className="font-semibold text-slate-900">{job.customerName}</p>
              <p className="text-slate-700">
                <span className="text-slate-500">QID (Qatar ID):</span>{' '}
                <span className="font-mono font-bold">{job.customerQID || 'N/A'}</span>
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Mobile / WhatsApp:</span>{' '}
                <span className="font-mono font-semibold">{job.customerMobile}</span>
              </p>
              {job.companyName && (
                <p className="text-slate-700">
                  <span className="text-slate-500">Company:</span> {job.companyName} (CR: {job.companyCR})
                </p>
              )}
              {job.addressZone && (
                <p className="text-slate-700">
                  <span className="text-slate-500">Address:</span> {job.addressZone}
                </p>
              )}
            </div>

            {/* Vehicle Box */}
            <div className="space-y-1">
              <p className="font-bold text-[11px] uppercase tracking-wider text-[#0B3A6E] border-b pb-0.5 mb-1.5">
                Vehicle Details
              </p>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-white border-2 border-slate-700 rounded font-black font-mono text-sm tracking-wider">
                  {job.plateNumber}
                </span>
                <span className="text-slate-500 font-medium">({job.plateType})</span>
              </div>
              <p className="font-bold text-slate-900">
                {job.year} {job.make} {job.model} - {job.color}
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Chassis / VIN:</span>{' '}
                <span className="font-mono">{job.vin || 'N/A'}</span>
              </p>
              <div className="flex gap-4 text-slate-700">
                <span>Odometer: <strong className="font-mono">{job.odometerIn} KM</strong></span>
                <span>Fuel: <strong className="font-mono">{job.fuelLevelIn}</strong></span>
                <span>Keys: <strong className="font-mono">{job.numberOfKeys}</strong></span>
              </div>
            </div>
          </div>

          {/* Customer Complaint */}
          <div className="mb-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-[#0B3A6E] text-[11px] uppercase tracking-wider">
              Customer Complaint / Requested Services:
            </span>
            <p className="mt-1 text-slate-800 leading-relaxed font-medium">
              {job.complaint || 'Standard periodic maintenance and multi-point vehicle inspection.'}
            </p>
          </div>

          {/* Vehicle Damage Inspection Diagram */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[#0B3A6E] text-[11px] uppercase tracking-wider">
                Reception Inspection Damage Records ({job.damagePins.length})
              </span>
              <span className="text-[10px] text-slate-500">
                Verified at intake by {job.createdBy}
              </span>
            </div>

            <CarBlueprintDiagram pins={job.damagePins} readOnly />
          </div>

          {/* Estimated Work & Pricing Breakdown */}
          <div className="mb-4">
            <span className="font-bold text-[#0B3A6E] text-[11px] uppercase tracking-wider block mb-1.5">
              Authorized Service Items & Estimate
            </span>
            <table className="w-full text-left border border-slate-300 rounded-lg overflow-hidden">
              <thead className="bg-[#0B3A6E] text-white text-[11px]">
                <tr>
                  <th className="p-2 w-8">#</th>
                  <th className="p-2">Service / Part Description</th>
                  <th className="p-2 w-16 text-center">Qty</th>
                  <th className="p-2 w-24 text-right">Unit (QAR)</th>
                  <th className="p-2 w-24 text-right">Total (QAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {job.services.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-2 text-slate-500">{i + 1}</td>
                    <td className="p-2">
                      <strong className="text-slate-800">{s.name}</strong>
                      <div className="text-[11px] text-slate-500">{s.description}</div>
                    </td>
                    <td className="p-2 text-center font-mono">{s.qty}</td>
                    <td className="p-2 text-right font-mono">{formatQAR(s.unitPrice)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatQAR(s.total)}</td>
                  </tr>
                ))}
                {job.parts.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-2 text-slate-500">{job.services.length + i + 1}</td>
                    <td className="p-2">
                      <strong className="text-slate-800">{p.name}</strong>
                      <span className="text-[10px] text-slate-500 ml-1">
                        (OEM: {p.partNumber || 'Genuine'})
                      </span>
                    </td>
                    <td className="p-2 text-center font-mono">{p.qty}</td>
                    <td className="p-2 text-right font-mono">{formatQAR(p.unitPrice)}</td>
                    <td className="p-2 text-right font-mono font-semibold">{formatQAR(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals Summary */}
            <div className="flex justify-end mt-2">
              <div className="w-64 space-y-1 text-xs border border-slate-300 rounded-lg p-2.5 bg-slate-50">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Estimate:</span>
                  <span className="font-mono">{formatQAR(job.subtotal)}</span>
                </div>
                {job.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">-{formatQAR(job.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 border-t pt-1">
                  <span>Net Estimated Total:</span>
                  <span className="font-mono">{formatQAR(job.totalEstimate)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Advance Received:</span>
                  <span className="font-mono">{formatQAR(job.advancePayment)}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0B3A6E] border-t pt-1">
                  <span>Balance Due:</span>
                  <span className="font-mono text-sm">{formatQAR(job.balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bilingual Terms & Signature Blocks */}
          <div className="border-t border-slate-300 pt-3 mt-4">
            <div className="grid grid-cols-2 gap-4 text-[10px] text-slate-500 mb-4 leading-snug">
              <div>
                <p className="font-bold text-slate-700 mb-0.5">Workshop Authorization Terms:</p>
                <p>{settings.jobCardTermsEn}</p>
              </div>
              <div dir="rtl">
                <p className="font-bold text-slate-700 mb-0.5">إقرار وشروط الصيانة المعتمدة:</p>
                <p>{settings.jobCardTermsAr}</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-slate-300">
              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">
                  Workshop Advisor / Reception:
                </p>
                <div className="h-16 border-b border-slate-400 flex items-end pb-1 text-[11px] text-slate-600">
                  <span>Authorized Signature & Stamp</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Staff: {job.createdBy}</p>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-700 mb-1">
                  Customer Authorization Signature:
                </p>
                <div className="h-16 border-b border-slate-400 flex items-center justify-center">
                  {job.customerAuthorizationSignature || job.customerEstimateSignature ? (
                    <img
                      src={job.customerAuthorizationSignature || job.customerEstimateSignature}
                      alt="Customer Signature"
                      className="max-h-14 max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">Signature on file</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Name: {job.customerName}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
