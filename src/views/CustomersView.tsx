import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Car,
  Eye,
  Phone,
  MessageSquare,
  ExternalLink,
  Shield,
  FileText
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Customer } from '../types';
import { formatQAR, formatQatarDate } from '../utils/i18n';

export const CustomersView: React.FC = () => {
  const { customers, jobs, viewAsUser, availableUsers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(term)) ||
      (c.qid && c.qid.includes(term)) ||
      (c.mobile && c.mobile.includes(term)) ||
      (c.companyName && c.companyName.toLowerCase().includes(term))
    );
  });

  const handleViewAsCustomer = (customer: Customer) => {
    // Find matching user or construct customer user profile
    const existingUser = availableUsers.find(
      (u) => u.qid === customer.qid || u.username === customer.qid
    );
    if (existingUser) {
      viewAsUser(existingUser);
    } else {
      viewAsUser({
        id: `user-${customer.id}`,
        username: customer.qid,
        name: customer.name,
        role: 'CUSTOMER',
        qid: customer.qid,
        phone: customer.mobile,
        isActive: true,
        createdAt: customer.createdAt,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Qatar Customer Directory (11-Digit QID Verified)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Auto-created upon job card registration. Customers can access their completed inspection reports with QID login.
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
          placeholder="Search by customer name, Qatar ID (11 digits), or mobile..."
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#0E9AA7]"
        />
      </div>

      {/* Customers Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B3A6E] text-white">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Qatar ID (QID)</th>
                <th className="p-3">Mobile & WhatsApp</th>
                <th className="p-3">Type & Nationality</th>
                <th className="p-3 text-center">Total Visits</th>
                <th className="p-3 text-right">Total Spent (QAR)</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map((cust) => {
                const customerJobs = jobs.filter((j) => j.customerQID === cust.qid);
                const spent = customerJobs.reduce((acc, j) => acc + (j.totalEstimate || 0), 0);

                return (
                  <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <strong className="text-slate-900 text-sm block">{cust.name}</strong>
                      {cust.companyName && (
                        <span className="text-[11px] text-slate-500 block">
                          Company: {cust.companyName} (CR: {cust.crNumber})
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{cust.address || 'Qatar'}</span>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800 tracking-wider">
                      {cust.qid}
                    </td>
                    <td className="p-3 font-mono">
                      <div className="text-slate-900 font-semibold">{cust.mobile}</div>
                      {cust.email && <div className="text-[11px] text-slate-400 font-sans">{cust.email}</div>}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mb-0.5">
                        {cust.customerType}
                      </span>
                      <span className="block text-[11px] text-slate-500">{cust.nationality}</span>
                    </td>
                    <td className="p-3 text-center font-bold font-mono text-slate-800">
                      {Math.max(cust.totalVisits, customerJobs.length)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-[#0E9AA7]">
                      {formatQAR(spent || cust.totalSpent)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleViewAsCustomer(cust)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#0B3A6E] bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                        title="Simulate viewing portal as this customer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0E9AA7]" />
                        <span>View as Customer</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No customers found. New customers are created automatically when entering an 11-digit QID on a job card.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
