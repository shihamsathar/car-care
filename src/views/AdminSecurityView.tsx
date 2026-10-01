import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  KeyRound,
  CheckCircle,
  AlertTriangle,
  XCircle,
  LogOut,
  Save,
  Filter,
  Search,
  Smartphone,
  Laptop
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AuthService } from '../services/authService';
import { LoginHistoryItem, SecuritySettings } from '../types';
import { formatQatarDate } from '../utils/i18n';

export const AdminSecurityView: React.FC = () => {
  const { addToast } = useApp();
  const [history, setHistory] = useState<LoginHistoryItem[]>(() => AuthService.getLoginHistory());
  const [settings, setSettings] = useState<SecuritySettings>(() => AuthService.getSecuritySettings());

  const [resultFilter, setResultFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    AuthService.saveSecuritySettings(settings);
    addToast({
      type: 'success',
      title: 'Security Configuration Saved',
      message: 'Updated session timeout, 2-step verification, and brute-force lockout rules.',
    });
  };

  const handleClearHistory = () => {
    localStorage.removeItem('carcare_login_history_v1');
    setHistory([]);
    addToast({
      type: 'info',
      message: 'Login history audit log cleared.',
    });
  };

  const filteredHistory = history.filter((item) => {
    if (resultFilter !== 'all' && item.result !== resultFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.username.toLowerCase().includes(term) ||
        (item.name && item.name.toLowerCase().includes(term)) ||
        item.ip.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Security Governance, Audit Logs & 2-Step Verification
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Audit login attempts, configure session timeouts, manage brute-force lockout thresholds, and require 2FA for Administrators.
          </p>
        </div>
      </div>

      {/* Security Policies Form */}
      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B3A6E] border-b pb-2 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-[#0E9AA7]" />
          Authentication & Session Policies
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Admin Session Timeout (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="1440"
              value={settings.adminSessionTimeoutMinutes}
              onChange={(e) =>
                setSettings({ ...settings, adminSessionTimeoutMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Technician Shift Timeout (Minutes)
            </label>
            <input
              type="number"
              min="30"
              max="1440"
              value={settings.technicianSessionTimeoutMinutes}
              onChange={(e) =>
                setSettings({ ...settings, technicianSessionTimeoutMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Max Failed Logins Before Lockout
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings.maxFailedAttemptsBeforeLockout}
              onChange={(e) =>
                setSettings({ ...settings, maxFailedAttemptsBeforeLockout: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-rose-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Account Lockout Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.lockoutDurationMinutes}
              onChange={(e) =>
                setSettings({ ...settings, lockoutDurationMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.requireTwoFactorForAdmins}
              onChange={(e) =>
                setSettings({ ...settings, requireTwoFactorForAdmins: e.target.checked })
              }
              className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
            />
            <div>
              <strong className="text-slate-900 block">Require 2-Step Verification for Admins</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enforces a 6-digit TOTP code verification after entering password for Super Admins and Branch Admins.
              </p>
            </div>
          </label>

          <label className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) =>
                setSettings({ ...settings, maintenanceMode: e.target.checked })
              }
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <div>
              <strong className="text-slate-900 block">System Maintenance Mode</strong>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Blocks customer and technician logins with a maintenance notice. Super Admins retain full access.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4 text-teal-300" />
            <span>Save Security Rules</span>
          </button>
        </div>
      </form>

      {/* Login History Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-[#0B3A6E] text-white flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-300" />
            <h3 className="font-bold text-xs">Login History Audit Log ({history.length} records)</h3>
          </div>
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-[11px] text-slate-300 hover:text-white underline cursor-pointer"
          >
            Clear History
          </button>
        </div>

        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, name, or IP..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700"
            >
              <option value="all">All Outcomes</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED_PASSWORD">Failed Password</option>
              <option value="ACCOUNT_LOCKED">Account Locked</option>
              <option value="ACCOUNT_DISABLED">Account Disabled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Username / QID</th>
                <th className="p-3">Account Name & Role</th>
                <th className="p-3">IP Address</th>
                <th className="p-3">Device / Agent</th>
                <th className="p-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 font-mono text-[11px]">
                  <td className="p-3 text-slate-500 font-sans">{formatQatarDate(entry.timestamp)}</td>
                  <td className="p-3 font-bold text-slate-900">{entry.username}</td>
                  <td className="p-3 font-sans">
                    <span className="font-semibold text-slate-800">{entry.name || 'Unknown User'}</span>
                    {entry.role && (
                      <span className="block text-[10px] text-slate-400 uppercase font-mono">{entry.role}</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600">{entry.ip}</td>
                  <td className="p-3 font-sans text-slate-500">{entry.device}</td>
                  <td className="p-3 text-center font-sans">
                    {entry.result === 'SUCCESS' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle className="w-3 h-3" /> Success
                      </span>
                    ) : entry.result === 'ACCOUNT_LOCKED' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        <AlertTriangle className="w-3 h-3" /> Locked (5 fails)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        <XCircle className="w-3 h-3" /> Failed Password
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-400 font-sans">
                    No login events matching the current filter.
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
