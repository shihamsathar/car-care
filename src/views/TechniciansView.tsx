import React, { useState } from 'react';
import {
  Wrench,
  KeyRound,
  Lock,
  Unlock,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Search,
  Building,
  Phone,
  Shield,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  X,
  MessageSquare,
  Smartphone,
  Trash2,
  Grid,
  List,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import { formatQatarDate } from '../utils/i18n';

export const TechniciansView: React.FC = () => {
  const {
    technicians,
    users,
    jobs,
    branches,
    viewAsUser,
    createTechnicianUser,
    updateUserCredentials,
    toggleUserStatus,
    unlockUserAccount,
    deleteUser,
    addToast,
    language
  } = useApp();

  // All technician accounts (active or inactive)
  const allTechnicians = users.filter((u) => u.role === 'TECHNICIAN');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'locked'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<User | null>(null);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    name: string;
    username: string;
    password: string;
    branchName: string;
    phone: string;
  } | null>(null);

  // Create Form State
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('Tech#2026QA');
  const [phone, setPhone] = useState('+974 ');
  const [email, setEmail] = useState('');
  const [qid, setQid] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'branch-doha');
  const [specialization, setSpecialization] = useState('Mechanical & Diagnostics');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit / Reset Password Form State
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBranchId, setEditBranchId] = useState('');
  const [editMustChangePassword, setEditMustChangePassword] = useState(false);
  const [editIsActive, setEditIsActive] = useState(true);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Copy indicator state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Auto-generate suggested username based on full name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!username || username === autoUsername(name)) {
      setUsername(autoUsername(val));
    }
  };

  const autoUsername = (fullName: string) => {
    const parts = fullName.trim().toLowerCase().split(/\s+/);
    if (parts.length === 1 && parts[0]) {
      return `${parts[0]}.tech`;
    }
    if (parts.length >= 2) {
      return `${parts[0]}.${parts[1][0]}`;
    }
    return '';
  };

  // Generate strong memorable technician password
  const generateStrongPassword = (target: 'create' | 'edit') => {
    const prefixes = ['Tech', 'Mech', 'Speed', 'Bay', 'Pro'];
    const years = ['2026', '974', 'QA'];
    const symbols = ['#', '@', '!'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const y = years[Math.floor(Math.random() * years.length)];
    const s = symbols[Math.floor(Math.random() * symbols.length)];
    const randDigits = Math.floor(100 + Math.random() * 900);
    const newPwd = `${p}${s}${randDigits}${y}`;
    if (target === 'create') {
      setPassword(newPwd);
    } else {
      setEditPassword(newPwd);
    }
  };

  // Copy formatted technician credentials
  const copyFormattedCredentials = (techName: string, techUsername: string, techPwd: string, techBranch: string, techPhone: string, id: string) => {
    const origin = window.location.origin;
    const text = `🚗 CarCare Pro Qatar - Technician Login Credentials\n` +
      `Workshop: CarCare Pro (${techBranch})\n` +
      `Name: ${techName}\n` +
      `Username: ${techUsername}\n` +
      `Password: ${techPwd}\n` +
      `Login URL: ${origin}/login\n` +
      `Role Tab: Select "Technician" tab\n\n` +
      `Note: Only administrators can provide or reset technician passwords. Keep these credentials confidential.`;

    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
    addToast({
      type: 'info',
      title: 'Credentials Copied',
      message: `Login details for ${techName} copied to clipboard.`,
    });
  };

  // Direct WhatsApp Link to send credentials to technician
  const getWhatsAppDispatchUrl = (techName: string, techUsername: string, techPwd: string, techBranch: string, techPhone: string) => {
    const origin = window.location.origin;
    const cleanPhone = techPhone.replace(/[^0-9]/g, '');
    const message = `Hello ${techName},\n\nHere are your CarCare Pro workshop login credentials:\n\n🔑 Username: ${techUsername}\n🔒 Password: ${techPwd}\n🏢 Branch: ${techBranch}\n🔗 Portal: ${origin}/login\n\nPlease select the "Technician" tab upon sign in.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Submit Create Technician
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Technician full name is required.');
      return;
    }
    if (!username.trim()) {
      setFormError('Login username is required.');
      return;
    }
    if (!password.trim()) {
      setFormError('Initial password is required.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    const branch = branches.find((b) => b.id === branchId);
    const branchName = branch ? branch.nameEn : 'Salwa Road Main Workshop';

    const res = createTechnicianUser({
      name: `${name.trim()} (${specialization})`,
      username: username.trim().toLowerCase(),
      password: password.trim(),
      phone: phone.trim(),
      branchId,
      email: email.trim(),
      qid: qid.trim(),
      specialization,
      mustChangePassword,
      isActive,
    });

    if (!res.success) {
      setFormError(res.error || 'Failed to create technician account.');
      return;
    }

    // Show success summary modal
    setCreatedCredentialsModal({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      branchName,
      phone: phone.trim(),
    });

    setIsCreateModalOpen(false);

    // Reset Form
    setName('');
    setUsername('');
    setPassword('Tech#2026QA');
    setPhone('+974 ');
    setEmail('');
    setQid('');
  };

  // Open Edit Modal
  const openEditModal = (tech: User) => {
    setEditingTech(tech);
    setEditName(tech.name);
    setEditUsername(tech.username);
    setEditPassword(tech.password || '');
    setEditPhone(tech.phone || '+974 ');
    setEditBranchId(tech.branchId || branches[0]?.id || '');
    setEditMustChangePassword(tech.mustChangePassword ?? false);
    setEditIsActive(tech.isActive);
    setEditError(null);
  };

  // Submit Edit Credentials
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech) return;
    setEditError(null);

    if (!editUsername.trim()) {
      setEditError('Username cannot be empty.');
      return;
    }

    const res = updateUserCredentials(editingTech.id, {
      username: editUsername.trim().toLowerCase(),
      password: editPassword.trim() || undefined,
      name: editName.trim(),
      phone: editPhone.trim(),
      branchId: editBranchId,
      mustChangePassword: editMustChangePassword,
      isActive: editIsActive,
    });

    if (!res.success) {
      setEditError(res.error || 'Failed to update credentials.');
      return;
    }

    setEditingTech(null);
  };

  // Filter technicians
  const filteredTechs = allTechnicians.filter((tech) => {
    if (selectedBranch !== 'all' && tech.branchId !== selectedBranch) return false;
    if (statusFilter === 'active' && !tech.isActive) return false;
    if (statusFilter === 'disabled' && tech.isActive) return false;
    if (statusFilter === 'locked' && !tech.lockedUntil) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = tech.name.toLowerCase().includes(term);
      const matchUsername = tech.username.toLowerCase().includes(term);
      const matchPhone = tech.phone ? tech.phone.includes(term) : false;
      const matchQid = tech.qid ? tech.qid.includes(term) : false;
      return matchName || matchUsername || matchPhone || matchQid;
    }
    return true;
  });

  // Calculate statistics
  const totalCount = allTechnicians.length;
  const activeCount = allTechnicians.filter((t) => t.isActive).length;
  const lockedCount = allTechnicians.filter((t) => t.lockedUntil).length;
  const activeOnBayCount = technicians.filter((t) => {
    return jobs.some(
      (j) => j.assignedTechnicianId === t.id && j.status !== 'Delivered/Closed' && j.status !== 'Completed'
    );
  }).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Workshop Technicians & Credentials
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B3A6E] text-white">
              Admin Provisioned Only
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Only administrators can create and provide usernames and passwords for technicians. Self-registration is strictly disabled to protect workshop integrity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
          >
            <Plus className="w-4 h-4 text-teal-300" />
            <span>Add Technician Login</span>
          </button>
        </div>
      </div>

      {/* Admin Exclusivity Security Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50/50 border border-blue-200/70 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#0B3A6E] text-teal-300 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#0B3A6E]">Restricted Access Protocol (Qatar Auto Workshop Standard)</h4>
            <p className="text-[11px] text-slate-600">
              Technicians only access the mobile bay flow for their assigned workshop branch. They cannot view billing, customer QID numbers, or invoice totals.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-100/80 px-2.5 py-1 rounded-md">
            🔒 Self-Signup: Blocked
          </span>
          <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-md">
            🛡️ 15-Min Lockout: Active
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Technicians</span>
            <Wrench className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <span className="text-[10px] text-slate-400">Created by admin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active Logins</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Ready for bay tasks</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Active on Bay</span>
            <Building className="w-4 h-4 text-[#0E9AA7]" />
          </div>
          <div className="text-2xl font-black text-[#0B3A6E]">{activeOnBayCount}</div>
          <span className="text-[10px] text-[#0E9AA7] font-medium">Currently working</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Locked Accounts</span>
            <Lock className="w-4 h-4 text-amber-600" />
          </div>
          <div className={`text-2xl font-black ${lockedCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {lockedCount}
          </div>
          <span className="text-[10px] text-slate-400">Exceeded 5 attempts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search technician name, @username, phone, or QID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-slate-500 hover:text-slate-800 p-1"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nameEn}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 px-2.5 py-1.5 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="disabled">Disabled Only</option>
            <option value="locked">Locked Out Only</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Credentials Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Technicians List / Cards */}
      {filteredTechs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No technicians found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || selectedBranch !== 'all' || statusFilter !== 'all'
              ? 'Try changing your search keywords or active filters.'
              : 'Get started by creating your first workshop technician login.'}
          </p>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#0B3A6E] rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Technician Account</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTechs.map((tech) => {
            const techJobs = jobs.filter((j) => j.assignedTechnicianId === tech.id);
            const activeJobs = techJobs.filter(
              (j) => j.status !== 'Delivered/Closed' && j.status !== 'Completed' && j.status !== 'Report Sent'
            );
            const completedJobs = techJobs.filter(
              (j) => j.status === 'Completed' || j.status === 'Report Sent' || j.status === 'Delivered/Closed'
            );
            const branch = branches.find((b) => b.id === tech.branchId);
            const branchName = branch ? branch.nameEn : 'All Branches';
            const isLocked = !!tech.lockedUntil;
            const plainPassword = tech.password || 'Tech#974Qatar';

            return (
              <div
                key={tech.id}
                className={`bg-white rounded-2xl border transition-all p-5 flex flex-col justify-between shadow-xs hover:shadow-md ${
                  !tech.isActive
                    ? 'border-slate-300 bg-slate-50/50 opacity-80'
                    : isLocked
                    ? 'border-amber-400 ring-1 ring-amber-400'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Row: Avatar & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#0B3A6E] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        {tech.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-tight">{tech.name}</h3>
                        <p className="text-[11px] text-teal-700 font-semibold">{branchName}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {isLocked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 flex items-center gap-1 border border-amber-300">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Locked</span>
                        </span>
                      ) : tech.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Credentials Box */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Username:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-[#0B3A6E] bg-white px-2 py-0.5 rounded border border-slate-200">
                        <span>@{tech.username}</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(tech.username);
                            addToast({ type: 'info', message: `Copied @${tech.username}` });
                          }}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy username"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Password:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700">••••••••</span>
                        <button
                          type="button"
                          onClick={() => openEditModal(tech)}
                          className="text-[11px] font-bold text-[#0E9AA7] hover:underline cursor-pointer"
                        >
                          Reset / View
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Phone:</span>
                      <span className="font-mono text-slate-800">{tech.phone || 'N/A'}</span>
                    </div>

                    {tech.mustChangePassword && (
                      <div className="pt-1 border-t border-slate-200/60 flex items-center gap-1 text-[10px] text-amber-700 font-semibold">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>Must change password on next sign in</span>
                      </div>
                    )}
                  </div>

                  {/* Workshop Bay Workload */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-100 flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium">Active On Bay</span>
                      <span className="text-sm font-bold text-teal-800">{activeJobs.length} Jobs</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col">
                      <span className="text-[10px] text-slate-500 font-medium">Completed Jobs</span>
                      <span className="text-sm font-bold text-slate-800">{completedJobs.length} Done</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  {/* Primary Credentials Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(tech)}
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-[#0E9AA7]" />
                      <span>Credentials</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        copyFormattedCredentials(
                          tech.name,
                          tech.username,
                          plainPassword,
                          branchName,
                          tech.phone || '',
                          tech.id
                        )
                      }
                      className="flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                      title="Copy formatted login message"
                    >
                      {copiedId === tech.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span>{copiedId === tech.id ? 'Copied!' : 'Copy Info'}</span>
                    </button>
                  </div>

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Send WhatsApp */}
                    {tech.phone && (
                      <a
                        href={getWhatsAppDispatchUrl(
                          tech.name,
                          tech.username,
                          plainPassword,
                          branchName,
                          tech.phone
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        title="Send login credentials via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Unlock if locked */}
                    {isLocked && (
                      <button
                        type="button"
                        onClick={() => unlockUserAccount(tech.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Unlock</span>
                      </button>
                    )}

                    {/* View As Technician */}
                    <button
                      type="button"
                      onClick={() => viewAsUser(tech)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-[#0B3A6E] bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors cursor-pointer"
                      title="Simulate technician screen"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0E9AA7]" />
                      <span>View Bay</span>
                    </button>

                    {/* Toggle Active / Disabled */}
                    <button
                      type="button"
                      onClick={() => toggleUserStatus(tech.id)}
                      className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
                        tech.isActive
                          ? 'text-slate-400 hover:text-slate-700 border-slate-200 hover:bg-slate-100'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                      }`}
                      title={tech.isActive ? 'Disable login' : 'Enable login'}
                    >
                      {tech.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                    </button>

                    {/* Delete Technician */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete technician account "${tech.name}"?`)) {
                          const res = deleteUser(tech.id);
                          if (!res.success) {
                            alert(res.error);
                          }
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 border border-slate-200 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Technician</th>
                  <th className="py-3 px-4">Login Username</th>
                  <th className="py-3 px-4">Branch</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Bay Workload</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTechs.map((tech) => {
                  const techJobs = jobs.filter((j) => j.assignedTechnicianId === tech.id);
                  const activeJobs = techJobs.filter(
                    (j) => j.status !== 'Delivered/Closed' && j.status !== 'Completed' && j.status !== 'Report Sent'
                  );
                  const branch = branches.find((b) => b.id === tech.branchId);
                  const branchName = branch ? branch.nameEn : 'All Branches';
                  const isLocked = !!tech.lockedUntil;
                  const plainPassword = tech.password || 'Tech#974Qatar';

                  return (
                    <tr key={tech.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#0B3A6E] text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {tech.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{tech.name}</span>
                            <span className="text-[10px] text-slate-400">ID: {tech.id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-[#0B3A6E] bg-slate-100 px-2 py-0.5 rounded">
                          @{tech.username}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {branchName}
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {tech.phone || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {isLocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            Locked
                          </span>
                        ) : tech.isActive ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-teal-700">{activeJobs.length} Active</span>
                        <span className="text-slate-400 text-[10px] ml-1">({techJobs.length} total)</span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(tech)}
                            className="p-1.5 text-slate-600 hover:text-[#0B3A6E] hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Edit credentials & reset password"
                          >
                            <KeyRound className="w-4 h-4 text-[#0E9AA7]" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              copyFormattedCredentials(
                                tech.name,
                                tech.username,
                                plainPassword,
                                branchName,
                                tech.phone || '',
                                tech.id
                              )
                            }
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
                            title="Copy credentials"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {tech.phone && (
                            <a
                              href={getWhatsAppDispatchUrl(
                                tech.name,
                                tech.username,
                                plainPassword,
                                branchName,
                                tech.phone
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                              title="Send to technician via WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => viewAsUser(tech)}
                            className="p-1.5 text-[#0B3A6E] hover:bg-teal-50 rounded-lg cursor-pointer"
                            title="View technician bay"
                          >
                            <Eye className="w-4 h-4 text-[#0E9AA7]" />
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
      )}

      {/* MODAL 1: CREATE TECHNICIAN LOGIN (ADMIN ONLY) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-[#0B3A6E] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Create Technician Login Account</h3>
                  <p className="text-[11px] text-teal-200">Only administrators can provide credentials</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Technician Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Technician Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Suresh Kumar"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Specialization & Branch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization / Role
                  </label>
                  <select
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="Mechanical & Diagnostics">Mechanical & Diagnostics</option>
                    <option value="Master Technician & Inspector">Master Technician & Inspector</option>
                    <option value="Detailing, Polishing & PPF">Detailing, Polishing & PPF</option>
                    <option value="Electrical & AC Specialist">Electrical & AC Specialist</option>
                    <option value="Bodywork & Paint Repair">Bodywork & Paint Repair</option>
                    <option value="Tires & Alignment Tech">Tires & Alignment Tech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Branch <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Login Username & Password (The Core Prompt Requirements) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B3A6E]">
                  <Shield className="w-4 h-4 text-[#0E9AA7]" />
                  <span>Login Credentials (Provided by Admin)</span>
                </div>

                {/* Username */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Login Username <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Used on Technician login tab</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      @
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. suresh.k"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Password & Generator */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Initial Password <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => generateStrongPassword('create')}
                      className="text-[11px] font-bold text-[#0E9AA7] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Generate Strong</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Store or deliver this password to the technician. The technician will type this on the workshop login page.
                  </p>
                </div>
              </div>

              {/* Mobile Phone & Optional QID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qatar Mobile / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+974 5512 3456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qatar ID (QID) <span className="text-slate-400 font-normal">(Optional HR Record)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    placeholder="11 digits"
                    value={qid}
                    onChange={(e) => setQid(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Security Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mustChangePassword}
                    onChange={(e) => setMustChangePassword(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-700">
                    Require technician to change password upon first login
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-teal-600 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-700 font-semibold">
                    Activate technician login immediately
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102 flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5 text-teal-300" />
                  <span>Create Technician Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SUCCESS / CREATED CREDENTIALS SUMMARY (READY TO SHARE) */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 text-white p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center mx-auto mb-2 shadow-inner">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base">Technician Login Ready</h3>
              <p className="text-xs text-emerald-100">
                Credentials successfully created by administrator
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs space-y-2.5">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Technician:</span>
                  <strong className="text-slate-900 font-sans">{createdCredentialsModal.name}</strong>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-sans">Username:</span>
                  <strong className="text-[#0B3A6E]">@{createdCredentialsModal.username}</strong>
                </div>

                <div className="flex justify-between border-b border-slate-200 pb-2 items-center">
                  <span className="text-slate-500 font-sans">Password:</span>
                  <div className="flex items-center gap-2">
                    <strong className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {createdCredentialsModal.password}
                    </strong>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(createdCredentialsModal.password);
                        addToast({ type: 'info', message: 'Password copied' });
                      }}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Branch:</span>
                  <span className="text-slate-700 font-sans">{createdCredentialsModal.branchName}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 text-center">
                Deliver these credentials to the technician. They will select the <strong>Technician</strong> tab on the sign in page.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() =>
                    copyFormattedCredentials(
                      createdCredentialsModal.name,
                      createdCredentialsModal.username,
                      createdCredentialsModal.password,
                      createdCredentialsModal.branchName,
                      createdCredentialsModal.phone,
                      'modal-copy'
                    )
                  }
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-slate-500" />
                  <span>Copy Login Info</span>
                </button>

                <a
                  href={getWhatsAppDispatchUrl(
                    createdCredentialsModal.name,
                    createdCredentialsModal.username,
                    createdCredentialsModal.password,
                    createdCredentialsModal.branchName,
                    createdCredentialsModal.phone
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send via WhatsApp</span>
                </a>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setCreatedCredentialsModal(null)}
                  className="w-full py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT CREDENTIALS / RESET TECHNICIAN PASSWORD */}
      {editingTech && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="bg-[#0B3A6E] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">Manage Technician Credentials</h3>
                  <p className="text-[11px] text-teal-200">{editingTech.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTech(null)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Technician Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                />
              </div>

              {/* Username (Admin can update) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Login Username (Admin Editable)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    className="w-full pl-7 pr-3 py-2 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* New Password / Reset */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800">
                    Set New Password (or leave unchanged)
                  </label>
                  <button
                    type="button"
                    onClick={() => generateStrongPassword('edit')}
                    className="text-[11px] font-bold text-[#0E9AA7] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate New</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    placeholder="Enter new password to reset..."
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {editingTech.password && (
                  <p className="text-[10px] text-slate-500">
                    Current password on record: <span className="font-mono font-bold">{editingTech.password}</span>
                  </p>
                )}
              </div>

              {/* Branch & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none cursor-pointer"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editMustChangePassword}
                    onChange={(e) => setEditMustChangePassword(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span className="text-xs text-slate-700">Require password change on next login</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span className="text-xs text-slate-700 font-semibold">Account is active</span>
                </label>
              </div>

              {/* Unlock button if locked */}
              {editingTech.lockedUntil && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Account is currently locked out</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      unlockUserAccount(editingTech.id);
                      setEditingTech({ ...editingTech, lockedUntil: null, failedLoginAttempts: 0 });
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs cursor-pointer"
                  >
                    Unlock Now
                  </button>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingTech(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
