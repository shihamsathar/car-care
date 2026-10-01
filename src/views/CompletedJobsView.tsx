import React, { useState } from 'react';
import {
  FileCheck,
  Send,
  Printer,
  CheckCircle,
  Clock,
  Search,
  MessageSquare,
  Eye,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JobCard } from '../types';
import { formatQatarDate, formatQAR } from '../utils/i18n';
import { CompletionReportModal } from '../components/jobs/CompletionReportModal';
import { JobCardPrintView } from '../components/jobs/JobCardPrintView';

export const CompletedJobsView: React.FC = () => {
  const { jobs, selectedBranchId } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'ready' | 'sent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReportJob, setActiveReportJob] = useState<JobCard | null>(null);
  const [printJob, setPrintJob] = useState<JobCard | null>(null);

  // Filter completed and sent jobs
  const completedJobs = jobs.filter((j) => {
    const isCompleted = j.status === 'Completed' || j.status === 'Report Sent' || j.status === 'Delivered/Closed';
    if (!isCompleted) return false;

    if (selectedBranchId !== 'all' && j.branchId !== selectedBranchId) {
      return false;
    }

    if (filterType === 'ready' && j.reportStatus !== 'ready') return false;
    if (filterType === 'sent' && j.reportStatus !== 'sent') return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        (j.plateNumber && j.plateNumber.toLowerCase().includes(term)) ||
        (j.customerName && j.customerName.toLowerCase().includes(term)) ||
        (j.customerQID && j.customerQID.includes(term)) ||
        (j.jobNo && j.jobNo.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const readyCount = jobs.filter(
    (j) => (selectedBranchId === 'all' || j.branchId === selectedBranchId) && j.reportStatus === 'ready'
  ).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Completed Vehicles & Inspection Reports
            </h2>
            {readyCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white animate-pulse">
                {readyCount} Ready to Dispatch
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Review technician photo evidence, approve invoice balance, and dispatch interactive bilingual report via WhatsApp.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({completedJobs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('ready')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === 'ready' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              <span>Ready to Send</span>
              {readyCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {readyCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('sent')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'sent' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Sent & Published
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter completed vehicles by plate, customer QID or job #..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#0E9AA7]"
        />
      </div>

      {/* Completed Jobs Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedJobs.map((job) => {
          const isSent = job.reportStatus === 'sent';
          const beforeCount = job.photos.filter((p) => p.type === 'before').length;
          const afterCount = job.photos.filter((p) => p.type === 'after').length;

          return (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#0E9AA7] block">
                      {job.jobNo}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900">
                      {job.year} {job.make} {job.model}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Plate: <strong className="font-mono text-slate-800">{job.plateNumber}</strong>
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                      isSent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isSent ? 'Sent to Customer' : 'Ready to Send'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 mb-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Customer:</span>
                    <strong className="text-slate-900 truncate max-w-[150px]">{job.customerName}</strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>WhatsApp Mobile:</span>
                    <span className="font-mono">{job.customerMobile}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Inspection Photos:</span>
                    <span className="font-semibold text-teal-700">
                      {beforeCount} Before • {afterCount} After
                    </span>
                  </div>
                </div>

                {isSent && job.reportSentAt && (
                  <p className="text-[11px] text-emerald-700 mb-3 flex items-center gap-1 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Sent via WhatsApp on {formatQatarDate(job.reportSentAt)}</span>
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-slate-900">
                  {formatQAR(job.totalEstimate)}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPrintJob(job)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                    title="Print A4"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveReportJob(job)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      isSent
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSent ? 'View / Resend' : 'Send via WhatsApp'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {completedJobs.length === 0 && (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
            No completed vehicle reports matching the selected filter.
          </div>
        )}
      </div>

      {/* Completion Report Modal */}
      {activeReportJob && (
        <CompletionReportModal
          job={activeReportJob}
          onClose={() => setActiveReportJob(null)}
          onPrintPreview={(j) => {
            setActiveReportJob(null);
            setPrintJob(j);
          }}
        />
      )}

      {/* Print View */}
      {printJob && (
        <JobCardPrintView job={printJob} onClose={() => setPrintJob(null)} />
      )}
    </div>
  );
};
