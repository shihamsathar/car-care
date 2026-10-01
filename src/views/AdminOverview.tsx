import React, { useState } from 'react';
import {
  Car,
  Clock,
  CheckCircle,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Printer,
  Send,
  Kanban,
  List,
  TrendingUp,
  DollarSign,
  Users,
  Wrench,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JobCard, JobStatus } from '../types';
import { formatQAR, formatQatarDate } from '../utils/i18n';

interface AdminOverviewProps {
  onNewJobClick: () => void;
  onEditJobClick: (job: JobCard) => void;
  onViewReportClick: (job: JobCard) => void;
  onPrintJobClick: (job: JobCard) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNewJobClick,
  onEditJobClick,
  onViewReportClick,
  onPrintJobClick,
}) => {
  const { jobs, branches, selectedBranchId, updateJobStatus } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter jobs by selected branch and search query
  const filteredJobs = jobs.filter((job) => {
    if (selectedBranchId !== 'all' && job.branchId !== selectedBranchId) {
      return false;
    }
    if (statusFilter !== 'all' && job.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchPlate = job.plateNumber?.toLowerCase().includes(term) || false;
      const matchCustomer = job.customerName?.toLowerCase().includes(term) || false;
      const matchQID = job.customerQID?.includes(term) || false;
      const matchJobNo = job.jobNo?.toLowerCase().includes(term) || false;
      const matchMake = job.make?.toLowerCase().includes(term) || false;
      return matchPlate || matchCustomer || matchQID || matchJobNo || matchMake;
    }
    return true;
  });

  // KPI Calculations
  const activeCount = filteredJobs.filter(
    (j) => j.status !== 'Delivered/Closed' && j.status !== 'Cancelled'
  ).length;
  const inProgressCount = filteredJobs.filter((j) => j.status === 'In Progress').length;
  const readyToSendCount = filteredJobs.filter((j) => j.status === 'Completed').length;
  const sentCount = filteredJobs.filter((j) => j.status === 'Report Sent').length;
  const totalRevenue = filteredJobs.reduce((acc, j) => acc + (j.totalEstimate || 0), 0);
  const totalCollected = filteredJobs.reduce(
    (acc, j) => acc + (j.payments || []).reduce((pAcc, p) => pAcc + (p.amount || 0), 0),
    0
  );

  const kanbanColumns: { status: JobStatus; title: string; color: string }[] = [
    { status: 'Created', title: 'New Intake', color: 'border-slate-400 bg-slate-50' },
    { status: 'Assigned', title: 'Assigned / Bay', color: 'border-blue-400 bg-blue-50/40' },
    { status: 'In Progress', title: 'Work In Progress', color: 'border-teal-400 bg-teal-50/40' },
    { status: 'Quality Check', title: 'Quality Check', color: 'border-purple-400 bg-purple-50/40' },
    { status: 'Completed', title: 'Ready to Send Report', color: 'border-amber-400 bg-amber-50/40' },
    { status: 'Report Sent', title: 'WhatsApp Sent & In Portal', color: 'border-emerald-400 bg-emerald-50/40' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Jobs
          </span>
          <span className="text-2xl font-black text-[#0B3A6E] mt-1 block">{activeCount}</span>
          <span className="text-[10px] text-slate-400">In workshop bays</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            In Progress
          </span>
          <span className="text-2xl font-black text-teal-600 mt-1 block">{inProgressCount}</span>
          <span className="text-[10px] text-teal-600 font-medium">Technicians on tools</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Ready to Send
          </span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{readyToSendCount}</span>
          <span className="text-[10px] text-amber-600 font-bold">Needs WhatsApp send</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Reports Sent
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{sentCount}</span>
          <span className="text-[10px] text-emerald-600 font-medium">Customer notified</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Revenue
          </span>
          <span className="text-lg font-black text-slate-900 mt-1 block truncate">
            {formatQAR(totalRevenue)}
          </span>
          <span className="text-[10px] text-slate-400">Total job estimates</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Collected Cash
          </span>
          <span className="text-lg font-black text-emerald-700 mt-1 block truncate">
            {formatQAR(totalCollected)}
          </span>
          <span className="text-[10px] text-emerald-600 font-medium">Deposits settled</span>
        </div>
      </div>

      {/* Control Bar: Search, Filters, View Mode & New Job Button */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by plate number, customer name, 11-digit QID, or job #..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E9AA7]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Created">Created</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed (Ready to Send)</option>
            <option value="Report Sent">Report Sent</option>
            <option value="Delivered/Closed">Delivered</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Kanban Board View"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'
              }`}
              title="Table List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={onNewJobClick}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4 text-teal-300" />
            <span>Create Job Card</span>
          </button>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colJobs = filteredJobs.filter((j) => {
              if (col.status === 'Created') return j.status === 'Created' || j.status === 'Draft';
              if (col.status === 'Assigned') return j.status === 'Assigned' || j.status === 'Accepted';
              return j.status === col.status;
            });

            return (
              <div
                key={col.status}
                className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[260px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0B3A6E]" />
                    <h3 className="font-bold text-xs text-slate-800">{col.title}</h3>
                  </div>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-700 shadow-2xs">
                    {colJobs.length}
                  </span>
                </div>

                {/* Job Cards Stack */}
                <div className="space-y-2.5 flex-1">
                  {colJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono font-bold text-[#0E9AA7]">
                          {job.jobNo}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            job.priority === 'VIP'
                              ? 'bg-rose-100 text-rose-700'
                              : job.priority === 'Urgent'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {job.priority}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 leading-tight">
                        {job.year} {job.make} {job.model}
                      </h4>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span className="font-semibold text-slate-700 font-mono">
                          {job.plateNumber}
                        </span>
                        <span>•</span>
                        <span className="truncate">{job.customerName}</span>
                      </div>

                      {/* Tech assignment & QAR */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 truncate max-w-[120px]">
                          {job.assignedTechnicianName ? job.assignedTechnicianName.split(' ')[0] : 'Unassigned'}
                        </span>
                        <span className="font-bold font-mono text-slate-900">
                          {formatQAR(job.totalEstimate)}
                        </span>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-1 opacity-90 group-hover:opacity-100">
                        {job.status === 'Completed' || job.status === 'Report Sent' ? (
                          <button
                            type="button"
                            onClick={() => onViewReportClick(job)}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            <Send className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp Report</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditJobClick(job)}
                            className="text-[11px] font-semibold text-slate-600 hover:text-[#0B3A6E] flex items-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onPrintJobClick(job)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
                          title="Print A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {colJobs.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B3A6E] text-white">
                <tr>
                  <th className="p-3">Job Card #</th>
                  <th className="p-3">Plate & Vehicle</th>
                  <th className="p-3">Customer (QID)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Technician & Bay</th>
                  <th className="p-3 text-right">Estimate (QAR)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0E9AA7]">
                      {job.jobNo}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        {formatQatarDate(job.createdAt)}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-slate-900 font-mono">{job.plateNumber}</span>
                      <p className="text-slate-600">
                        {job.year} {job.make} {job.model}
                      </p>
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-800">{job.customerName}</strong>
                      <span className="block text-[11px] text-slate-400 font-mono">
                        QID: {job.customerQID || 'N/A'} • {job.customerMobile}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          job.status === 'Completed'
                            ? 'bg-amber-100 text-amber-800'
                            : job.status === 'Report Sent'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'In Progress'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800">
                        {job.assignedTechnicianName || 'Unassigned'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {job.workshopBay || 'Open Bay'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatQAR(job.totalEstimate)}
                      {job.balanceDue > 0 ? (
                        <span className="block text-[10px] text-amber-600 font-semibold">
                          Due: {formatQAR(job.balanceDue)}
                        </span>
                      ) : (
                        <span className="block text-[10px] text-emerald-600 font-semibold">
                          Settled
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {job.status === 'Completed' || job.status === 'Report Sent' ? (
                          <button
                            type="button"
                            onClick={() => onViewReportClick(job)}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                          >
                            WhatsApp
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onEditJobClick(job)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3A6E] rounded-md cursor-pointer"
                            title="Edit Job Card"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onPrintJobClick(job)}
                          className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md cursor-pointer"
                          title="Print Job Card"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
