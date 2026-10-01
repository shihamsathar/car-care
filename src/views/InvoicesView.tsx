import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  Printer,
  CheckCircle,
  AlertCircle,
  Download,
  Calendar,
  X,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { JobCard, PaymentRecord } from '../types';
import { formatQAR, formatQatarDate } from '../utils/i18n';
import { downloadElementAsPdf } from '../utils/pdfGenerator';
import { JobCardPrintView } from '../components/jobs/JobCardPrintView';

export const InvoicesView: React.FC = () => {
  const { jobs, selectedBranchId, addPayment, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<JobCard | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank Transfer' | 'Cheque' | 'Online Link'>('Card');
  const [paymentRef, setPaymentRef] = useState('');
  const [printInvoiceJob, setPrintInvoiceJob] = useState<JobCard | null>(null);

  const filteredJobs = jobs.filter((j) => {
    if (selectedBranchId !== 'all' && j.branchId !== selectedBranchId) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        j.plateNumber.toLowerCase().includes(term) ||
        j.customerName.toLowerCase().includes(term) ||
        j.customerQID.includes(term) ||
        j.jobNo.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobForPayment || !paymentAmount || Number(paymentAmount) <= 0) return;

    addPayment(selectedJobForPayment.id, {
      amount: Number(paymentAmount),
      method: paymentMethod,
      reference: paymentRef || `POS-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Recorded via Invoices & Payments module',
    });

    setSelectedJobForPayment(null);
    setPaymentAmount('');
    setPaymentRef('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Invoices & Workshop Payment Records (QAR)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Track invoice balances, advance customer deposits, and settle payments with instant receipts.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter invoices by plate number, customer QID or job #..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#0E9AA7]"
        />
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B3A6E] text-white">
              <tr>
                <th className="p-3">Job Card #</th>
                <th className="p-3">Customer & QID</th>
                <th className="p-3">Vehicle</th>
                <th className="p-3 text-right">Invoice Total (QAR)</th>
                <th className="p-3 text-right">Paid to Date</th>
                <th className="p-3 text-right">Balance Due</th>
                <th className="p-3 text-center">Payment Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => {
                const isPaid = job.balanceDue === 0;
                return (
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0E9AA7]">
                      {job.jobNo}
                      <span className="block text-[10px] text-slate-400 font-sans font-normal">
                        {formatQatarDate(job.createdAt)}
                      </span>
                    </td>
                    <td className="p-3">
                      <strong className="text-slate-900 block">{job.customerName}</strong>
                      <span className="text-[11px] text-slate-400 font-mono">QID: {job.customerQID}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-800">{job.plateNumber}</span>
                      <p className="text-[11px] text-slate-500">
                        {job.year} {job.make} {job.model}
                      </p>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatQAR(job.totalEstimate)}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-700 font-semibold">
                      {formatQAR(job.advancePayment)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold">
                      {job.balanceDue > 0 ? (
                        <span className="text-rose-600">{formatQAR(job.balanceDue)}</span>
                      ) : (
                        <span className="text-slate-400">0.00</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPaid ? 'Settled' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobForPayment(job);
                              setPaymentAmount(job.balanceDue);
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                          >
                            + Record Payment
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setPrintInvoiceJob(job)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                          title="Print Official Invoice / Receipt"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      {selectedJobForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B3A6E] text-white">
              <div>
                <h3 className="font-bold text-sm">Record Payment / Settle Invoice</h3>
                <p className="text-[11px] text-teal-300">
                  {selectedJobForPayment.jobNo} • {selectedJobForPayment.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJobForPayment(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <span className="text-slate-600 font-semibold">Remaining Balance Due:</span>
                <span className="font-mono text-base font-bold text-rose-600">
                  {formatQAR(selectedJobForPayment.balanceDue)}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Payment Amount Received (QAR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedJobForPayment.balanceDue}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-bold text-emerald-700 text-right font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Card">Debit / Credit Card (POS Terminal)</option>
                  <option value="Cash">Cash (QAR)</option>
                  <option value="Bank Transfer">Bank Transfer (QNB / CBQ / QIIB)</option>
                  <option value="Cheque">Company Cheque</option>
                  <option value="Online Link">Online Invoice Link (QPay)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Transaction Reference / Approval Code
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. POS-TXN-940182"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobForPayment(null)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                >
                  Confirm & Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      {printInvoiceJob && (
        <JobCardPrintView job={printInvoiceJob} onClose={() => setPrintInvoiceJob(null)} />
      )}
    </div>
  );
};
