import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_BRANCHES,
  INITIAL_CUSTOMERS,
  INITIAL_JOBS,
  INITIAL_LOOKUPS,
  INITIAL_SETTINGS,
  INITIAL_USERS,
} from '../data/seedData';
import {
  AuditLog,
  Branch,
  Customer,
  DamagePin,
  JobCard,
  JobPhoto,
  JobStatus,
  LookupItem,
  PaymentRecord,
  Settings,
  TechnicianNote,
  User,
  UserRole,
} from '../types';
import { generateWhatsAppLink, Language } from '../utils/i18n';
import { AuthService } from '../services/authService';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppContextType {
  // Auth & Roles
  currentUser: User | null;
  originalAdminUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  viewAsUser: (targetUser: User) => void;
  exitViewAs: () => void;
  isViewingAs: boolean;
  
  // Active Branch
  selectedBranchId: string; // 'all' or branch-doha, etc.
  setSelectedBranchId: (id: string) => void;
  branches: Branch[];
  activeBranch: Branch | undefined;
  addBranch: (branchData: Omit<Branch, 'id'>) => Branch;
  
  // Language & RTL
  language: Language;
  setLanguage: (lang: Language) => void;
  dir: 'ltr' | 'rtl';
  
  // Data State
  jobs: JobCard[];
  customers: Customer[];
  technicians: User[];
  lookups: LookupItem[];
  settings: Settings;
  auditLogs: AuditLog[];
  
  // Job actions
  createJob: (job: Omit<JobCard, 'id' | 'jobNo' | 'createdAt' | 'createdBy' | 'updatedAt' | 'timeline' | 'payments'>) => JobCard;
  updateJob: (id: string, updates: Partial<JobCard> | ((prev: JobCard) => Partial<JobCard>)) => void;
  updateJobStatus: (id: string, newStatus: JobStatus, note?: string) => void;
  addDamagePin: (jobId: string, pin: Omit<DamagePin, 'id' | 'createdAt' | 'addedBy'>) => void;
  deleteDamagePin: (jobId: string, pinId: string) => void;
  addPhoto: (jobId: string, photo: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  deletePhoto: (jobId: string, photoId: string) => void;
  togglePhotoVisibility: (jobId: string, photoId: string) => void;
  addTechnicianNote: (jobId: string, note: Omit<TechnicianNote, 'id' | 'createdAt' | 'createdByName'>) => void;
  addPayment: (jobId: string, payment: Omit<PaymentRecord, 'id' | 'date' | 'receivedBy'>) => void;
  sendCompletionReport: (jobId: string) => string; // returns WhatsApp link
  
  // Lookup actions (for the "+" buttons)
  addLookupOption: (type: string, labelEn: string, labelAr: string, parentId?: string, defaultPrice?: number) => LookupItem;
  getLookupsByType: (type: string, parentId?: string) => LookupItem[];
  
  // Customer helpers
  findCustomerByQID: (qid: string) => Customer | undefined;
  createOrUpdateCustomer: (customerData: Partial<Customer> & { qid: string; name: string }) => Customer;
  
  // UI & Feedback
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Quick Switcher / Reset
  loadDemoData: () => void;
  resetAllData: () => void;
  clearAllErrorsAndData?: () => void;
  availableUsers: User[];
  users: User[];

  // User & Technician Credentials Management (Admin Only)
  createTechnicianUser: (techData: {
    name: string;
    username: string;
    password?: string;
    phone: string;
    branchId?: string;
    email?: string;
    qid?: string;
    specialization?: string;
    mustChangePassword?: boolean;
    isActive?: boolean;
  }) => { success: boolean; user?: User; error?: string };
  updateUserCredentials: (
    userId: string,
    updates: {
      username?: string;
      password?: string;
      name?: string;
      phone?: string;
      email?: string;
      branchId?: string;
      mustChangePassword?: boolean;
      isActive?: boolean;
    }
  ) => { success: boolean; error?: string };
  toggleUserStatus: (userId: string) => void;
  unlockUserAccount: (userId: string) => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  
  // Global Lookup Modal Trigger
  activeQuickLookupType: string | null;
  openQuickLookup: (type: string, parentId?: string) => void;
  closeQuickLookup: () => void;
  quickLookupParentId?: string;
  onQuickLookupCreated?: (newItem: LookupItem) => void;
  setQuickLookupCallback: (cb: (item: LookupItem) => void) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'carcare_pro_data_v2';
const USERS_STORAGE_KEY = 'carcare_pro_users_v2';

const JOBS_STORAGE_KEY = 'carcare_pro_jobs_v2';
const CUSTOMERS_STORAGE_KEY = 'carcare_pro_customers_v2';

// Defensive sanitizer to guarantee clean, error-free models even if storage has legacy or corrupted entries
const sanitizeJob = (j: any): JobCard => ({
  ...j,
  timeline: Array.isArray(j.timeline) ? j.timeline : [],
  damagePins: Array.isArray(j.damagePins) ? j.damagePins : [],
  photos: Array.isArray(j.photos) ? j.photos : [],
  technicianNotes: Array.isArray(j.technicianNotes) ? j.technicianNotes : [],
  payments: Array.isArray(j.payments) ? j.payments : [],
  services: Array.isArray(j.services) ? j.services : [],
  subtotal: typeof j.subtotal === 'number' ? j.subtotal : 0,
  taxAmount: typeof j.taxAmount === 'number' ? j.taxAmount : 0,
  discount: typeof j.discount === 'number' ? j.discount : 0,
  totalAmount: typeof j.totalAmount === 'number' ? j.totalAmount : 0,
  paidAmount: typeof j.paidAmount === 'number' ? j.paidAmount : 0,
  balanceDue: typeof j.balanceDue === 'number' ? j.balanceDue : 0,
  status: j.status || 'Received',
  reportStatus: j.reportStatus || 'none',
  isTimerRunning: !!j.isTimerRunning,
  timerElapsedSeconds: typeof j.timerElapsedSeconds === 'number' ? j.timerElapsedSeconds : 0,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load saved data or seed defaults
  const [branches, setBranches] = useState<Branch[]>(INITIAL_BRANCHES);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse saved users', e);
    }
    return INITIAL_USERS;
  });

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = AuthService.getCurrentSession();
    return session ? session.user : INITIAL_USERS[0];
  });
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [language, setLanguageState] = useState<Language>('en');

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved customers', e);
    }
    return INITIAL_CUSTOMERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
    } catch (e) {
      console.warn('Failed to save customers to localStorage', e);
    }
  }, [customers]);

  const [lookups, setLookups] = useState<LookupItem[]>(INITIAL_LOOKUPS);

  const [jobs, setJobs] = useState<JobCard[]>(() => {
    try {
      const saved = localStorage.getItem(JOBS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(sanitizeJob);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved jobs', e);
    }
    return INITIAL_JOBS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch (e) {
      console.warn('Failed to save jobs to localStorage', e);
    }
  }, [jobs]);
  const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Quick lookup state
  const [activeQuickLookupType, setActiveQuickLookupType] = useState<string | null>(null);
  const [quickLookupParentId, setQuickLookupParentId] = useState<string | undefined>(undefined);
  const [onQuickLookupSuccess, setOnQuickLookupSuccess] = useState<((item: LookupItem) => void) | null>(null);

  // Sync direction to document body/html
  useEffect(() => {
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = () => {
    AuthService.clearSession();
    setCurrentUser(null);
    setOriginalAdminUser(null);
    addToast({
      type: 'info',
      title: language === 'ar' ? 'تم تسجيل الخروج' : 'Signed out',
      message: language === 'ar' ? 'تم إنهاء الجلسة بنجاح' : 'You have been signed out of CarCare Pro.',
    });
  };

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // View As functionality
  const viewAsUser = (targetUser: User) => {
    if (!currentUser) return;
    if (!originalAdminUser) {
      setOriginalAdminUser(currentUser);
    }
    setCurrentUser(targetUser);
    
    // Log audit
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'VIEW_AS_USER',
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentUser.role,
      details: `Super Admin started viewing dashboard as ${targetUser.name} (${targetUser.role})`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    addToast({
      type: 'info',
      title: 'View As Mode Active',
      message: `Now viewing as ${targetUser.name} (${targetUser.role}). Read-only simulation.`,
    });
  };

  const exitViewAs = () => {
    if (originalAdminUser) {
      const returningUser = originalAdminUser;
      setCurrentUser(returningUser);
      setOriginalAdminUser(null);
      addToast({
        type: 'success',
        title: 'Returned to Admin',
        message: 'Exited View As mode. Returned to administrator dashboard.',
      });
    }
  };

  const activeBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];

  const addBranch = (branchData: Omit<Branch, 'id'>): Branch => {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}`,
    };
    setBranches((prev) => [...prev, newBranch]);
    addToast({
      type: 'success',
      title: 'Branch Workspace Created',
      message: `Branch ${newBranch.nameEn} (${newBranch.code}) successfully added.`,
    });
    return newBranch;
  };

  // Helper to generate sequential Job No: BRANCHCODE-YYYY-000001
  const generateJobNo = (branchId: string): string => {
    const branch = branches.find((b) => b.id === branchId) || branches[0];
    const code = branch ? branch.code : 'DOH';
    const year = new Date().getFullYear();
    const branchJobs = jobs.filter((j) => j.branchId === branchId);
    const nextSeq = String(branchJobs.length + 1).padStart(6, '0');
    return `${code}-${year}-${nextSeq}`;
  };

  // Create Job
  const createJob = (jobData: Omit<JobCard, 'id' | 'jobNo' | 'createdAt' | 'createdBy' | 'updatedAt' | 'timeline' | 'payments'>): JobCard => {
    const id = `job-${Date.now()}`;
    const jobNo = generateJobNo(jobData.branchId);
    const now = new Date().toISOString();

    const newJob: JobCard = {
      ...jobData,
      id,
      jobNo,
      status: jobData.status || (jobData.assignedTechnicianId ? 'Assigned' : 'Created'),
      createdAt: now,
      createdBy: currentUser?.name || 'Staff',
      updatedAt: now,
      timeline: [
        {
          id: `tl-${Date.now()}`,
          status: 'Created',
          note: `Job Card created by ${currentUser?.name || 'Staff'}`,
          changedBy: currentUser?.name || 'Staff',
          timestamp: now,
        },
      ],
      payments: jobData.advancePayment > 0 ? [
        {
          id: `pmt-${Date.now()}`,
          amount: jobData.advancePayment,
          method: (jobData.paymentMethod as any) || 'Card',
          reference: `ADV-${Math.floor(100000 + Math.random() * 900000)}`,
          date: now,
          receivedBy: currentUser?.name || 'Reception',
          notes: 'Advance deposit at reception',
        }
      ] : [],
    };

    setJobs((prev) => [newJob, ...prev]);

    // Check or auto-create customer if needed
    createOrUpdateCustomer({
      qid: newJob.customerQID,
      name: newJob.customerName,
      customerType: newJob.customerType,
      mobile: newJob.customerMobile,
      whatsapp: newJob.customerWhatsApp,
      email: newJob.customerEmail,
      nationality: newJob.customerNationality,
      address: newJob.addressZone,
      companyName: newJob.companyName,
      crNumber: newJob.companyCR,
    });

    addToast({
      type: 'success',
      title: 'Job Card Created',
      message: `Job #${jobNo} successfully registered!`,
    });

    return newJob;
  };

  const updateJob = (
    id: string,
    updates: Partial<JobCard> | ((prevJob: JobCard) => Partial<JobCard>)
  ) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const resolvedUpdates = typeof updates === 'function' ? updates(j) : updates;
          return {
            ...j,
            ...resolvedUpdates,
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );
  };

  const updateJobStatus = (id: string, newStatus: JobStatus, note?: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === id) {
          const now = new Date().toISOString();
          const timelineEntry = {
            id: `tl-${Date.now()}`,
            status: newStatus,
            note: note || `Status transitioned to ${newStatus}`,
            changedBy: currentUser?.name || 'Staff',
            timestamp: now,
          };

          return {
            ...j,
            status: newStatus,
            updatedAt: now,
            timeline: [...(j.timeline || []), timelineEntry],
          };
        }
        return j;
      })
    );

    addToast({
      type: 'info',
      title: 'Status Updated',
      message: `Job status changed to ${newStatus}`,
    });
  };

  const addDamagePin = (jobId: string, pinData: Omit<DamagePin, 'id' | 'createdAt' | 'addedBy'>) => {
    const pin: DamagePin = {
      ...pinData,
      id: `pin-${Date.now()}`,
      createdAt: new Date().toISOString(),
      addedBy: currentUser?.name || 'Staff',
    };

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, damagePins: [...(j.damagePins || []), pin] } : j))
    );

    addToast({
      type: 'success',
      message: 'Damage mark added to vehicle diagram',
    });
  };

  const deleteDamagePin = (jobId: string, pinId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? { ...j, damagePins: (j.damagePins || []).filter((p) => p.id !== pinId) }
          : j
      )
    );
  };

  const addPhoto = (jobId: string, photoData: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>) => {
    const photo: JobPhoto = {
      ...photoData,
      id: `photo-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser?.name || 'Staff',
    };

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, photos: [...(j.photos || []), photo] } : j))
    );
  };

  const deletePhoto = (jobId: string, photoId: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, photos: (j.photos || []).filter((p) => p.id !== photoId) } : j
      )
    );
  };

  const togglePhotoVisibility = (jobId: string, photoId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        return {
          ...j,
          photos: (j.photos || []).map((p) =>
            p.id === photoId ? { ...p, isCustomerVisible: !p.isCustomerVisible } : p
          ),
        };
      })
    );
  };

  const addTechnicianNote = (
    jobId: string,
    noteData: Omit<TechnicianNote, 'id' | 'createdAt' | 'createdByName'>
  ) => {
    const note: TechnicianNote = {
      ...noteData,
      id: `note-${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdByName: currentUser?.name || 'Technician',
    };

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, technicianNotes: [...(j.technicianNotes || []), note] } : j))
    );

    if (note.type === 'safety') {
      addToast({
        type: 'warning',
        title: 'Safety Concern Flagged!',
        message: 'A critical vehicle safety issue was logged by the technician.',
      });
    }
  };

  const addPayment = (
    jobId: string,
    paymentData: Omit<PaymentRecord, 'id' | 'date' | 'receivedBy'>
  ) => {
    const payment: PaymentRecord = {
      ...paymentData,
      id: `pmt-${Date.now()}`,
      date: new Date().toISOString(),
      receivedBy: currentUser?.name || 'Receptionist',
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const currentBalance = j.balanceDue ?? 0;
        const newBalance = Math.max(0, currentBalance - payment.amount);
        return {
          ...j,
          payments: [...(j.payments || []), payment],
          balanceDue: newBalance,
        };
      })
    );

    addToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `Payment of ${payment.amount} QAR recorded successfully.`,
    });
  };

  // Send Completion Report & Generate WhatsApp Link
  const sendCompletionReport = (jobId: string): string => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return '';

    const branch = branches.find((b) => b.id === job.branchId) || branches[0];
    const portalUrl = `${window.location.origin}/?portal=customer&qid=${job.customerQID}&job=${job.jobNo}`;
    
    const whatsappLink = generateWhatsAppLink(
      job.customerWhatsApp || job.customerMobile,
      job.customerName,
      job.make,
      job.model,
      job.plateNumber,
      job.jobNo,
      language === 'ar' ? branch.nameAr : branch.nameEn,
      portalUrl,
      settings.whatsappTemplateEn,
      settings.whatsappTemplateAr
    );

    const now = new Date().toISOString();

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const timelineEntry = {
            id: `tl-${Date.now()}`,
            status: 'Report Sent' as JobStatus,
            note: `Completion Report published to customer portal & WhatsApp link generated by ${currentUser?.name || 'Admin'}`,
            changedBy: currentUser?.name || 'Admin',
            timestamp: now,
          };

          return {
            ...j,
            status: 'Report Sent',
            reportStatus: 'sent',
            reportSentAt: now,
            reportSentBy: currentUser?.name || 'Admin',
            reportWhatsAppUrl: whatsappLink,
            timeline: [...(j.timeline || []), timelineEntry],
          };
        }
        return j;
      })
    );

    addToast({
      type: 'success',
      title: 'Report Published & Sent',
      message: `Inspection report published to portal for QID ${job.customerQID}. WhatsApp ready!`,
    });

    return whatsappLink;
  };

  // Lookup helpers
  const addLookupOption = (
    type: string,
    labelEn: string,
    labelAr: string,
    parentId?: string,
    defaultPrice?: number
  ): LookupItem => {
    const newItem: LookupItem = {
      id: `${type}-${Date.now()}`,
      type,
      code: labelEn.toUpperCase().replace(/\s+/g, '_').substring(0, 30),
      labelEn,
      labelAr: labelAr || labelEn,
      parentId,
      isActive: true,
      defaultPrice,
      sortOrder: lookups.length + 1,
    };

    setLookups((prev) => [...prev, newItem]);
    addToast({
      type: 'success',
      message: `Added new option: "${labelEn}"`,
    });

    return newItem;
  };

  const getLookupsByType = (type: string, parentId?: string): LookupItem[] => {
    return lookups.filter((item) => {
      if (item.type !== type || !item.isActive) return false;
      if (parentId !== undefined) {
        return item.parentId === parentId;
      }
      return true;
    });
  };

  const findCustomerByQID = (qid: string): Customer | undefined => {
    const clean = qid.replace(/[^0-9]/g, '');
    return customers.find((c) => c.qid === clean);
  };

  const createOrUpdateCustomer = (
    customerData: Partial<Customer> & { qid: string; name: string }
  ): Customer => {
    const cleanQID = customerData.qid.replace(/[^0-9]/g, '');
    const existing = customers.find((c) => c.qid === cleanQID);

    if (existing) {
      const updated: Customer = {
        ...existing,
        ...customerData,
        qid: cleanQID,
        totalVisits: existing.totalVisits + 1,
      };
      setCustomers((prev) => prev.map((c) => (c.qid === cleanQID ? updated : c)));
      return updated;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      qid: cleanQID,
      name: customerData.name,
      customerType: customerData.customerType || 'Individual',
      mobile: customerData.mobile || '+974',
      whatsapp: customerData.whatsapp || customerData.mobile || '+974',
      email: customerData.email,
      nationality: customerData.nationality || 'Qatari',
      companyName: customerData.companyName,
      crNumber: customerData.crNumber,
      address: customerData.address,
      notes: customerData.notes,
      createdAt: new Date().toISOString(),
      totalVisits: 1,
      totalSpent: 0,
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    // Also register user account for customer portal
    setUsers((prev) => {
      if (prev.some((u) => u.qid === cleanQID)) return prev;
      return [
        ...prev,
        {
          id: `user-cust-${Date.now()}`,
          username: cleanQID,
          name: customerData.name,
          role: 'CUSTOMER' as UserRole,
          qid: cleanQID,
          phone: customerData.mobile,
          email: customerData.email,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
    });

    return newCustomer;
  };

  const loadDemoData = () => {
    setBranches(INITIAL_BRANCHES);
    setUsers(INITIAL_USERS);
    setCustomers(INITIAL_CUSTOMERS);
    setLookups(INITIAL_LOOKUPS);
    setJobs(INITIAL_JOBS);
    setSettings(INITIAL_SETTINGS);
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_USERS));
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(INITIAL_JOBS));
      localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(INITIAL_CUSTOMERS));
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(INITIAL_USERS[0]);
    setOriginalAdminUser(null);
    setSelectedBranchId('all');

    addToast({
      type: 'success',
      title: 'Demo Data Loaded',
      message: 'Restored 2 branches, 3 technicians, 5 customers, and sample jobs with damage pins & reports.',
    });
  };

  const resetAllData = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage', e);
    }
    setBranches(INITIAL_BRANCHES);
    setUsers(INITIAL_USERS);
    setCustomers(INITIAL_CUSTOMERS);
    setLookups(INITIAL_LOOKUPS);
    setJobs(INITIAL_JOBS);
    setSettings(INITIAL_SETTINGS);
    setCurrentUser(INITIAL_USERS[0]);
    setOriginalAdminUser(null);
    setSelectedBranchId('all');
    setToasts([]);
    addToast({
      type: 'success',
      title: 'Workshop Data Reset',
      message: 'Storage cleared and application reset to pristine Qatar workshop demo state.',
    });
  };

  const clearAllErrorsAndData = resetAllData;

  const openQuickLookup = (type: string, parentId?: string) => {
    setActiveQuickLookupType(type);
    setQuickLookupParentId(parentId);
  };

  const closeQuickLookup = () => {
    setActiveQuickLookupType(null);
    setQuickLookupParentId(undefined);
    setOnQuickLookupSuccess(null);
  };

  const setQuickLookupCallback = (cb: (item: LookupItem) => void) => {
    setOnQuickLookupSuccess(() => cb);
  };

  // Technician & User Credential Management (Admin Only)
  const createTechnicianUser = (techData: {
    name: string;
    username: string;
    password?: string;
    phone: string;
    branchId?: string;
    email?: string;
    qid?: string;
    specialization?: string;
    mustChangePassword?: boolean;
    isActive?: boolean;
  }): { success: boolean; user?: User; error?: string } => {
    const cleanUsername = techData.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, error: 'Username is required.' };
    }
    if (cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }
    // Check uniqueness
    const exists = users.some(
      (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)
    );
    if (exists) {
      return { success: false, error: `Username "${cleanUsername}" is already taken. Please choose another.` };
    }

    const assignedBranchId = techData.branchId || branches[0]?.id || 'branch-doha';
    const initialPassword = techData.password?.trim() || 'Tech#2026QA';

    const newUser: User = {
      id: `user-tech-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: techData.name.trim(),
      username: cleanUsername,
      role: 'TECHNICIAN' as UserRole,
      password: initialPassword,
      phone: techData.phone.trim(),
      email: techData.email?.trim() || `${cleanUsername}@carcarepro.qa`,
      branchId: assignedBranchId,
      qid: techData.qid?.trim() || undefined,
      mustChangePassword: techData.mustChangePassword ?? true,
      isActive: techData.isActive ?? true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);

    // Audit Log
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'CREATE_USER',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'SUPER_ADMIN',
      details: `Created technician login for "${newUser.name}" (@${newUser.username}) at branch ${assignedBranchId}.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    addToast({
      type: 'success',
      title: 'Technician Login Created',
      message: `Account created for ${newUser.name}. Username: @${newUser.username}`,
    });

    return { success: true, user: newUser };
  };

  const updateUserCredentials = (
    userId: string,
    updates: {
      username?: string;
      password?: string;
      name?: string;
      phone?: string;
      email?: string;
      branchId?: string;
      mustChangePassword?: boolean;
      isActive?: boolean;
    }
  ): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };

    if (updates.username) {
      const cleanUsername = updates.username.trim().toLowerCase();
      const duplicate = users.some(
        (u) => u.id !== userId && (u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername))
      );
      if (duplicate) {
        return { success: false, error: `Username "${cleanUsername}" is already taken by another account.` };
      }
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            ...(updates.name && { name: updates.name.trim() }),
            ...(updates.username && { username: updates.username.trim().toLowerCase() }),
            ...(updates.password && { password: updates.password.trim(), failedLoginAttempts: 0, lockedUntil: null }),
            ...(updates.phone && { phone: updates.phone.trim() }),
            ...(updates.email !== undefined && { email: updates.email.trim() }),
            ...(updates.branchId && { branchId: updates.branchId }),
            ...(updates.mustChangePassword !== undefined && { mustChangePassword: updates.mustChangePassword }),
            ...(updates.isActive !== undefined && { isActive: updates.isActive }),
          };
        }
        return u;
      })
    );

    const logDetails = updates.password
      ? `Admin updated credentials and password for ${target.name} (@${target.username})`
      : `Admin updated profile for ${target.name} (@${target.username})`;

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      action: 'UPDATE_USER',
      userId: currentUser?.id || 'admin',
      userName: currentUser?.name || 'Admin',
      role: currentUser?.role || 'SUPER_ADMIN',
      details: logDetails,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);

    addToast({
      type: 'success',
      title: 'Credentials Updated',
      message: `Account settings updated for ${target.name}.`,
    });

    return { success: true };
  };

  const toggleUserStatus = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    if (target.role === 'SUPER_ADMIN') {
      addToast({ type: 'warning', message: 'Super Admin account cannot be disabled.' });
      return;
    }
    const nextStatus = !target.isActive;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: nextStatus, failedLoginAttempts: 0, lockedUntil: null } : u))
    );
    addToast({
      type: nextStatus ? 'success' : 'warning',
      message: `Account for ${target.name} is now ${nextStatus ? 'Active' : 'Disabled'}.`,
    });
  };

  const unlockUserAccount = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, failedLoginAttempts: 0, lockedUntil: null } : u))
    );
    addToast({
      type: 'success',
      title: 'Account Unlocked',
      message: `Reset failed login attempts for ${target.name}. Account is unlocked.`,
    });
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    const target = users.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    if (target.role === 'SUPER_ADMIN') {
      return { success: false, error: 'Super Admin account cannot be deleted.' };
    }
    // Check if active jobs assigned
    const assignedJobs = jobs.filter(
      (j) => j.assignedTechnicianId === userId && j.status !== 'Delivered/Closed' && j.status !== 'Completed'
    );
    if (assignedJobs.length > 0) {
      return {
        success: false,
        error: `Cannot delete technician "${target.name}" because they have ${assignedJobs.length} active job(s) assigned. Please reassign the jobs first.`,
      };
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    addToast({
      type: 'info',
      title: 'User Removed',
      message: `Account for ${target.name} has been removed.`,
    });
    return { success: true };
  };

  const technicians = users.filter((u) => u.role === 'TECHNICIAN' && u.isActive);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        originalAdminUser,
        setCurrentUser,
        login,
        logout,
        isAuthenticated: !!currentUser,
        viewAsUser,
        exitViewAs,
        isViewingAs: !!originalAdminUser,
        selectedBranchId,
        setSelectedBranchId,
        branches,
        activeBranch,
        addBranch,
        language,
        setLanguage,
        dir: language === 'ar' ? 'rtl' : 'ltr',
        jobs,
        customers,
        technicians,
        users,
        createTechnicianUser,
        updateUserCredentials,
        toggleUserStatus,
        unlockUserAccount,
        deleteUser,
        lookups,
        settings,
        auditLogs,
        createJob,
        updateJob,
        updateJobStatus,
        addDamagePin,
        deleteDamagePin,
        addPhoto,
        deletePhoto,
        togglePhotoVisibility,
        addTechnicianNote,
        addPayment,
        sendCompletionReport,
        addLookupOption,
        getLookupsByType,
        findCustomerByQID,
        createOrUpdateCustomer,
        toasts,
        addToast,
        removeToast,
        loadDemoData,
        resetAllData,
        clearAllErrorsAndData,
        availableUsers: users,
        activeQuickLookupType,
        openQuickLookup,
        closeQuickLookup,
        quickLookupParentId,
        onQuickLookupCreated: onQuickLookupSuccess || undefined,
        setQuickLookupCallback,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
