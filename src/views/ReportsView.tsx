import React, { useState } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Building,
  Wrench,
  TrendingUp,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatQAR, formatQatarDate } from '../utils/i18n';

export const ReportsView: React.FC = () => {
  const { jobs, branches, technicians, selectedBranchId } = useApp();

  const filteredJobs = jobs.filter((j) => {
    if (selectedBranchId !== 'all' && j.branchId !== selectedBranchId) return false;
    return true;
  });

  // Calculate metrics
  const totalRevenue = filteredJobs.reduce((acc, j) => acc + (j.totalEstimate || 0), 0);
  const totalCollected = filteredJobs.reduce(
    (acc, j) => acc + j.payments.reduce((pAcc, p) => pAcc + p.amount, 0),
    0
  );
  const totalOutstanding = filteredJobs.reduce((acc, j) => acc + (j.balanceDue || 0), 0);

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Job Number',
      'Branch',
      'Created Date',
      'Customer Name',
      'Qatar ID',
      'Plate Number',
      'Make',
      'Model',
      'Status',
      'Total Estimate (QAR)',
      'Paid Advance (QAR)',
      'Balance Due (QAR)',
    ];

    const rows = filteredJobs.map((j) => [
      j.jobNo,
      branches.find((b) => b.id === j.branchId)?.nameEn || 'Doha',
      j.createdAt,
      `"${j.customerName}"`,
      j.customerQID,
      j.plateNumber,
      j.make,
      `"${j.model}"`,
      j.status,
      j.totalEstimate,
      j.advancePayment,
      j.balanceDue,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CarCarePro-Report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Workshop Analytics & Financial Reports
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Daily/monthly revenue, technician efficiency, service demand distribution, and data export.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-300" />
          <span>Export Data to CSV / Excel</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total Invoiced (QAR)
          </span>
          <span className="text-2xl font-black text-[#0B3A6E] mt-1 block font-mono">
            {formatQAR(totalRevenue)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {filteredJobs.length} recorded job cards
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Collected Cash Revenue
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block font-mono">
            {formatQAR(totalCollected)}
          </span>
          <span className="text-[11px] text-emerald-600 mt-1 block">Deposits settled</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
            Outstanding Receivable
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block font-mono">
            {formatQAR(totalOutstanding)}
          </span>
          <span className="text-[11px] text-rose-600 mt-1 block">Pending client handover</span>
        </div>
      </div>

      {/* Technician Productivity Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-[#0B3A6E] text-white px-5 py-3 font-bold text-xs">
          Technician Performance & Workload Breakdown
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b">
              <tr>
                <th className="p-3">Technician</th>
                <th className="p-3">Branch</th>
                <th className="p-3 text-center">Active Jobs</th>
                <th className="p-3 text-center">Completed Jobs</th>
                <th className="p-3 text-right">Revenue Generated (QAR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {technicians.map((t) => {
                const techJobs = filteredJobs.filter((j) => j.assignedTechnicianId === t.id);
                const activeCount = techJobs.filter(
                  (j) => j.status !== 'Delivered/Closed' && j.status !== 'Completed' && j.status !== 'Report Sent'
                ).length;
                const completedCount = techJobs.filter(
                  (j) => j.status === 'Completed' || j.status === 'Report Sent' || j.status === 'Delivered/Closed'
                ).length;
                const revenue = techJobs.reduce((acc, j) => acc + (j.totalEstimate || 0), 0);
                const branch = branches.find((b) => b.id === t.branchId);

                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{t.name}</td>
                    <td className="p-3 text-slate-600">{branch?.nameEn || 'All Branches'}</td>
                    <td className="p-3 text-center font-bold text-teal-700 font-mono">
                      {activeCount}
                    </td>
                    <td className="p-3 text-center font-bold text-emerald-700 font-mono">
                      {completedCount}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatQAR(revenue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
