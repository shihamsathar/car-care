import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Shield,
  Wrench,
  UserCheck,
  Lock,
  Unlock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User, UserRole } from '../types';
import { formatQatarDate } from '../utils/i18n';

export const AdminUsersView: React.FC = () => {
  const {
    users,
    branches,
    addToast,
    createTechnicianUser,
    updateUserCredentials,
    toggleUserStatus,
    unlockUserAccount,
    deleteUser
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New user form state
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('TECHNICIAN');
  const [username, setUsername] = useState('');
  const [qid, setQid] = useState('');
  const [phone, setPhone] = useState('+974 ');
  const [email, setEmail] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [password, setPassword] = useState('Tech#2026QA');
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Password generator
  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCopyPassword = (pwd: string, id: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    addToast({
      type: 'info',
      message: 'Password copied to clipboard',
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalUsername = role === 'CUSTOMER' ? qid.trim() : username.trim();
    if (!finalUsername) return;

    const res = createTechnicianUser({
      name,
      username: finalUsername,
      password,
      phone,
      email,
      branchId,
      qid: role === 'CUSTOMER' ? qid.trim() : undefined,
      mustChangePassword,
      isActive,
    });

    if (!res.success) {
      addToast({
        type: 'error',
        message: res.error || 'Failed to create user',
      });
      return;
    }

    setIsCreateModalOpen(false);

    // Reset
    setName('');
    setUsername('');
    setQid('');
  };

  const handleUnlockAccount = (userId: string) => {
    unlockUserAccount(userId);
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        (u.qid && u.qid.includes(term)) ||
        (u.phone && u.phone.includes(term))
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
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              User Accounts & Credentials Management
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Create, disable, or reset passwords for Technicians and Customers. Self-registration is strictly disabled.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            generateStrongPassword();
            setIsCreateModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>Create New Login</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, username or 11-digit QID..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#0E9AA7]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 shadow-xs cursor-pointer"
        >
          <option value="all">All Roles</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="BRANCH_ADMIN">Branch Admin</option>
          <option value="TECHNICIAN">Technician</option>
          <option value="CUSTOMER">Customer (QID)</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B3A6E] text-white">
              <tr>
                <th className="p-3">User Name & Role</th>
                <th className="p-3">Login Username / QID</th>
                <th className="p-3">Branch & Contact</th>
                <th className="p-3">Temporary Password</th>
                <th className="p-3">Last Login</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isLocked = u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <strong className="text-slate-900 block">{u.name}</strong>
                      <span className="inline-block px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 mt-0.5">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-semibold text-[#0E9AA7]">
                      {u.username}
                      {u.qid && <span className="block text-[10px] text-slate-400">QID: {u.qid}</span>}
                    </td>
                    <td className="p-3">
                      <span className="text-slate-700 font-medium">
                        {branches.find((b) => b.id === u.branchId)?.nameEn || 'All Branches'}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono">{u.phone || '-'}</span>
                    </td>
                    <td className="p-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] text-slate-800 font-bold">
                          {u.password || '••••••••'}
                        </span>
                        {u.password && (
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(u.password!, u.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedId === u.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {u.lastLoginAt ? formatQatarDate(u.lastLoginAt) : 'Never logged in'}
                    </td>
                    <td className="p-3 text-center">
                      {isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      ) : u.isActive ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {isLocked && (
                          <button
                            type="button"
                            onClick={() => handleUnlockAccount(u.id)}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                            title="Unlock account immediately"
                          >
                            Unlock
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                            u.isActive
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
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

      {/* CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0B3A6E] text-white">
              <h3 className="font-bold text-sm">Create New Account Login</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Mansoor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="TECHNICIAN">Technician</option>
                    <option value="CUSTOMER">Customer (QID)</option>
                    <option value="BRANCH_ADMIN">Branch Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Workshop Branch</label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {role === 'CUSTOMER' ? (
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Qatar ID (QID - exactly 11 digits) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      required
                      value={qid}
                      onChange={(e) => setQid(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="29012345678"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                    />
                  </div>
                ) : (
                  <div className="col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Login Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. tariq.tech or admin@carcare.qa"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone (+974)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+974 5512 3456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.qa"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Initial Password</label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-[11px] font-bold text-[#0E9AA7] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Generate Random
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div className="col-span-2 space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mustChangePassword}
                      onChange={(e) => setMustChangePassword(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Must change password on first login</span>
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-white font-bold bg-[#0B3A6E] rounded-lg shadow-sm"
                >
                  Save & Create Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
