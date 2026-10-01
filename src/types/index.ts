export type UserRole = 'SUPER_ADMIN' | 'BRANCH_ADMIN' | 'TECHNICIAN' | 'CUSTOMER';

export type JobStatus = 
  | 'Draft'
  | 'Created'
  | 'Assigned'
  | 'Accepted'
  | 'Inspection'
  | 'Awaiting Customer Approval'
  | 'In Progress'
  | 'Waiting for Parts'
  | 'Quality Check'
  | 'Completed'
  | 'Report Sent'
  | 'Delivered/Closed'
  | 'On Hold'
  | 'Cancelled';

export type Priority = 'Normal' | 'Urgent' | 'VIP';

export type DamageType = 'scratch' | 'dent' | 'crack' | 'paint_chip' | 'corrosion' | 'wheel_rash' | 'broken_glass' | 'other';
export type DamageSeverity = 'minor' | 'moderate' | 'severe';
export type VehicleView = 'top' | 'front' | 'rear' | 'left' | 'right';

export interface DamagePin {
  id: string;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  view: VehicleView;
  damageType: DamageType;
  severity: DamageSeverity;
  note: string;
  photoUrl?: string;
  createdAt: string;
  addedBy: string;
}

export type PhotoType = 'before' | 'after' | 'fuel' | 'odometer' | 'scratch' | 'progress';

export type PhotoSlotType = 
  | 'side_front_before'
  | 'side_rear_before'
  | 'side_left_before'
  | 'side_right_before'
  | 'side_front_after'
  | 'side_rear_after'
  | 'side_left_after'
  | 'side_right_after'
  | 'fuel_before'
  | 'fuel_after'
  | 'odometer_before'
  | 'odometer_after'
  | 'before_detail'
  | 'after_detail'
  | 'scratch'
  | 'progress'
  | 'before'
  | 'after';

export interface JobPhoto {
  id: string;
  type: PhotoType;
  slotType?: PhotoSlotType;
  url: string;
  thumbnailUrl?: string;
  caption: string;
  pinId?: string;
  uploadedAt: string;
  uploadedBy: string;
  isCustomerVisible: boolean;
  hiddenFromCustomer?: boolean;
  sortOrder?: number;
  stamped?: boolean;
}

export interface ExtraWorkItem {
  id: string;
  description: string;
  estimatedParts?: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Immediate Safety';
  photoUrl?: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  requestedAt: string;
  requestedBy: string;
  approvedAt?: string;
  price?: number;
}

export interface PartUsedItem {
  id: string;
  partName: string;
  partNumber?: string;
  qty: number;
  brand: string;
  source: 'Workshop Stock' | 'Special Order' | 'Customer Provided';
  addedAt: string;
}

export interface TimerLog {
  id: string;
  startedAt: string;
  stoppedAt?: string;
  durationSeconds: number;
  pauseReason?: 'Waiting for parts' | 'Waiting for approval' | 'Break' | 'Other';
  technicianId: string;
  technicianName: string;
}

export interface ServiceLineItem {
  id: string;
  serviceId?: string;
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface PartLineItem {
  id: string;
  name: string;
  partNumber: string;
  brand: string;
  qty: number;
  unitPrice: number;
  supplier: string;
  warranty: string;
  total: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: 'Cash' | 'Card' | 'Bank Transfer' | 'Cheque' | 'Online Link';
  reference: string;
  date: string;
  receivedBy: string;
  notes?: string;
}

export interface TechnicianNote {
  id: string;
  type: 'suggestion' | 'complaint' | 'internal' | 'safety';
  severity: 'low' | 'medium' | 'high' | 'critical';
  text: string;
  photos: string[];
  createdAt: string;
  createdByName: string;
  isInternalOnly: boolean;
}

export interface TimelineEvent {
  id: string;
  status: JobStatus;
  note: string;
  changedBy: string;
  timestamp: string;
}

export interface ReceptionChecklist {
  spareWheel: boolean;
  jackAndTools: boolean;
  floorMats: boolean;
  audioNavigation: boolean;
  documentsInGlovebox: boolean;
  valuablesRemoved: boolean;
  wheelLockNut: boolean;
  belongingsNotes?: string;
}

export interface QualityChecklist {
  roadTestCompleted: boolean;
  noFluidLeaks: boolean;
  fluidsChecked: boolean;
  tyrePressureChecked: boolean;
  lightsAndSignalsOk: boolean;
  acCoolingVerified: boolean;
  warningLightsCleared: boolean;
  cleanedInterior: boolean;
  cleanedExterior: boolean;
  workshopToolsRemoved: boolean;
  customerBelongingsReturned: boolean;
  oldPartsKeptIfRequested: boolean;
  wheelNutsTorqued?: boolean;
  cleanedInsideAndOut?: boolean;
}

export interface JobCard {
  id: string;
  jobNo: string; // e.g. DOH-2026-000001
  branchId: string;
  priority: Priority;
  expectedDelivery: string;
  jobSource: string;
  status: JobStatus;
  
  // Customer details
  customerId: string;
  customerType: 'Individual' | 'Company';
  customerName: string;
  customerQID: string; // 11 digits
  customerQIDExpiry?: string;
  customerMobile: string; // +974XXXXXXXX
  customerWhatsApp: string;
  customerEmail?: string;
  customerNationality: string;
  companyName?: string;
  companyCR?: string;
  addressZone?: string;
  customerPasswordPreview?: string; // Generated password preview for admin

  // Vehicle details
  plateNumber: string;
  plateType: string; // Private, Commercial, etc.
  make: string;
  model: string;
  year: number;
  color: string;
  bodyType: string;
  fuelType: string;
  transmission: string;
  driveType: string;
  engineSize?: string;
  cylinders?: string;
  specification: string; // GCC, US, etc.
  vin: string; // 17 characters
  engineNumber?: string;
  istimaraNumber?: string;
  istimaraExpiry?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  policyExpiry?: string;
  odometerIn: number;
  odometerOut?: number;
  fuelLevelIn: 'E' | '1/4' | '1/2' | '3/4' | 'F';
  fuelLevelOut?: 'E' | '1/4' | '1/2' | '3/4' | 'F';
  numberOfKeys: number;
  warningLights: string[];

  // Work & Pricing
  complaint: string;
  services: ServiceLineItem[];
  parts: PartLineItem[];
  subtotal: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  totalEstimate: number;
  advancePayment: number;
  balanceDue: number;
  paymentMethod: string;
  estimateApprovedByName?: string;
  estimateApprovedDate?: string;
  customerEstimateSignature?: string;

  // Reception
  receptionChecklist: ReceptionChecklist;
  damagePins: DamagePin[];
  photos: JobPhoto[];

  // Assignment & Bay
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  workshopBay?: string;
  supervisorName?: string;
  internalNotes?: string;

  // Technician Execution
  qualityChecklist?: QualityChecklist;
  technicianNotes: TechnicianNote[];
  timerElapsedSeconds: number;
  isTimerRunning: boolean;
  timerStartedAt?: string;
  recommendations?: string;
  nextServiceDueKm?: number;
  nextServiceDueDate?: string;

  // Granular Technician Bay State
  fuelBefore?: 'E' | '1/4' | '1/2' | '3/4' | 'F';
  fuelAfter?: 'E' | '1/4' | '1/2' | '3/4' | 'F';
  odometerBefore?: number;
  odometerAfter?: number;
  findings?: string;
  extraWorkItems?: ExtraWorkItem[];
  partsUsedItems?: PartUsedItem[];
  timerLogs?: TimerLog[];
  technicianSignature?: string;
  blueprintConfirmed?: boolean;
  rejectReason?: string;
  pauseReason?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  customerRating?: number;
  customerFeedback?: string;

  // Completion & Report
  reportStatus?: 'draft' | 'ready' | 'sent';
  reportSentAt?: string;
  reportSentBy?: string;
  reportWhatsAppUrl?: string;
  customerAuthorizationSignature?: string;
  customerDeliveredSignature?: string;
  whatsappConsent: boolean;
  
  // Timeline & Payments
  timeline: TimelineEvent[];
  payments: PaymentRecord[];

  createdAt: string;
  createdBy: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string; // email or QID or username
  name: string;
  role: UserRole;
  branchId?: string; // empty for super admin
  email?: string;
  phone?: string;
  qid?: string;
  password?: string; // hashed or stored for auth check
  mustChangePassword?: boolean;
  failedLoginAttempts?: number;
  lockedUntil?: string | null;
  lastLoginAt?: string;
  lastLoginIp?: string;
  lastLoginDevice?: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  backupCodes?: string[];
  isActive: boolean;
  createdAt: string;
}

export interface LoginHistoryItem {
  id: string;
  username: string;
  userId?: string;
  name?: string;
  role?: UserRole;
  result: 'SUCCESS' | 'FAILED_PASSWORD' | 'ACCOUNT_LOCKED' | 'ACCOUNT_DISABLED';
  ip: string;
  device: string;
  timestamp: string;
}

export interface SecuritySettings {
  requireTwoFactorForAdmins: boolean;
  adminSessionTimeoutMinutes: number; // default 30
  technicianSessionTimeoutMinutes: number; // default 480 (8 hours)
  customerSessionTimeoutMinutes: number; // default 60
  maxFailedAttemptsBeforeLockout: number; // default 5
  lockoutDurationMinutes: number; // default 15
  maintenanceMode: boolean;
  captchaEnabled: boolean;
}

export interface Branch {
  id: string;
  code: string; // DOH, WKR
  nameEn: string;
  nameAr: string;
  addressEn: string;
  addressAr: string;
  phone: string;
  email: string;
  commercialRegistration: string;
  taxRegistration?: string;
  managerName: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  qid: string; // exactly 11 digits
  name: string;
  customerType: 'Individual' | 'Company';
  mobile: string;
  whatsapp: string;
  email?: string;
  nationality: string;
  companyName?: string;
  crNumber?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  totalVisits: number;
  totalSpent: number;
}

export interface LookupItem {
  id: string;
  type: string;
  code: string;
  labelEn: string;
  labelAr: string;
  parentId?: string; // e.g. makeId for models
  isActive: boolean;
  defaultPrice?: number;
  sortOrder?: number;
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  role: string;
  branchId?: string;
  details: string;
  timestamp: string;
}

export interface WhatsAppLog {
  id: string;
  jobId: string;
  jobNo: string;
  recipientPhone: string;
  recipientName: string;
  templateName: string;
  messageBody: string;
  status: 'Sent' | 'Delivered' | 'Read' | 'Failed';
  sentBy: string;
  sentAt: string;
  url?: string;
}

export interface Settings {
  companyNameEn: string;
  companyNameAr: string;
  companyPhone: string;
  salwaRoadAddressEn: string;
  salwaRoadAddressAr: string;
  crNumber: string;
  taxNumber: string;
  whatsappMode: 'link' | 'cloud_api';
  invoicePrefix: string;
  jobCardTermsEn: string;
  jobCardTermsAr: string;
  whatsappTemplateEn: string;
  whatsappTemplateAr: string;
}
