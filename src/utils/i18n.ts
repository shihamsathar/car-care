export type Language = 'en' | 'ar';

export interface Translations {
  [key: string]: {
    en: string;
    ar: string;
  };
}

export const translations = {
  // App branding & header
  appName: { en: 'CarCare Pro', ar: 'كار كير برو' },
  appTagline: { en: 'Qatar Workshop Job Card & Inspection System', ar: 'نظام إدارة بطاقات العمل والفحص لورش قطر' },
  allBranches: { en: 'All Branches (Qatar)', ar: 'جميع الفروع (قطر)' },
  branch: { en: 'Branch', ar: 'الفرع' },
  switchBranch: { en: 'Switch Branch', ar: 'تغيير الفرع' },
  viewAsActive: { en: 'VIEW-AS MODE ACTIVE', ar: 'وضع العرض التجريبي مفعّل' },
  returnToAdmin: { en: 'Return to Admin View', ar: 'العودة لحساب الإدارة' },
  viewingAs: { en: 'Viewing dashboard as', ar: 'أنت تتصفح الحساب بصفة' },
  logout: { en: 'Logout', ar: 'تسجيل الخروج' },

  // Navigation
  navOverview: { en: 'Overview & KPIs', ar: 'لوحة التحكم والمؤشرات' },
  navJobCards: { en: 'Job Cards & Kanban', ar: 'بطاقات العمل وكانبان' },
  navNewJobCard: { en: 'New Job Card', ar: 'إنشاء بطاقة عمل' },
  navCompletedJobs: { en: 'Completed Jobs', ar: 'المركبات المنجزة' },
  navTechnicians: { en: 'Technicians', ar: 'الفنيين' },
  navCustomers: { en: 'Customers (QID)', ar: 'العملاء (البطاقة الشخصية)' },
  navBranches: { en: 'Branches', ar: 'الفروع' },
  navMasterData: { en: 'Master Data & Lookups', ar: 'البيانات الأساسية والقوائم' },
  navSettings: { en: 'Settings & Setup', ar: 'الإعدادات والتهيئة' },
  navCustomerPortal: { en: 'Customer Portal', ar: 'بوابة العميل' },
  navTechnicianPortal: { en: 'Technician View', ar: 'شاشة الفني' },

  // Job Card Stepper
  stepHeader: { en: '1. Header & Priority', ar: '1. الفرع والأولوية' },
  stepCustomer: { en: '2. Customer Info (QID)', ar: '2. بيانات العميل (QID)' },
  stepVehicle: { en: '3. Vehicle Specs', ar: '3. مواصفات المركبة' },
  stepServices: { en: '4. Services & Complaints', ar: '4. الشكوى والخدمات' },
  stepParts: { en: '5. Parts & Materials', ar: '5. قطع الغيار والتقدير' },
  stepPricing: { en: '6. Pricing & Approval', ar: '6. التكلفة والاعتماد' },
  stepReception: { en: '7. Damage Blueprint', ar: '7. فحص ومخطط الأضرار' },
  stepAssignment: { en: '8. Bay & Technician', ar: '8. تعيين الفني والورشة' },
  stepTerms: { en: '9. Terms & Signature', ar: '9. الشروط والتوقيع' },

  // Statuses
  Draft: { en: 'Draft', ar: 'مسودة' },
  Created: { en: 'Created', ar: 'تم الإنشاء' },
  Assigned: { en: 'Assigned', ar: 'تم التعيين' },
  Accepted: { en: 'Accepted', ar: 'مقبول من الفني' },
  Inspection: { en: 'Inspection', ar: 'قيد الفحص' },
  'Awaiting Customer Approval': { en: 'Awaiting Customer Approval', ar: 'بانتظار موافقة العميل' },
  'In Progress': { en: 'In Progress', ar: 'قيد التنفيذ' },
  'Waiting for Parts': { en: 'Waiting for Parts', ar: 'بانتظار قطع الغيار' },
  'Quality Check': { en: 'Quality Check', ar: 'فحص الجودة' },
  Completed: { en: 'Completed', ar: 'مكتمل' },
  'Report Sent': { en: 'Report Sent', ar: 'تم إرسال التقرير' },
  'Delivered/Closed': { en: 'Delivered / Closed', ar: 'تم التسليم / مغلق' },
  'On Hold': { en: 'On Hold', ar: 'معلق' },
  Cancelled: { en: 'Cancelled', ar: 'ملغي' },

  // Priorities
  Normal: { en: 'Normal', ar: 'عادي' },
  Urgent: { en: 'Urgent', ar: 'عاجل' },
  VIP: { en: 'VIP Royal', ar: 'أولوية قصوى (VIP)' },

  // Actions
  saveDraft: { en: 'Save Draft', ar: 'حفظ كمسودة' },
  createAndAssign: { en: 'Create & Assign Job', ar: 'إنشاء وتعيين البطاقة' },
  nextStep: { en: 'Next Step', ar: 'الخطوة التالية' },
  prevStep: { en: 'Previous Step', ar: 'الخطوة السابقة' },
  printJobCard: { en: 'Print Job Card (A4)', ar: 'طباعة بطاقة العمل (A4)' },
  printReport: { en: 'Print Inspection Report', ar: 'طباعة تقرير الفحص' },
  sendWhatsApp: { en: 'Send via WhatsApp', ar: 'إرسال عبر الواتساب' },
  resendWhatsApp: { en: 'Resend WhatsApp', ar: 'إعادة إرسال الواتساب' },
  viewReport: { en: 'View Full Report', ar: 'عرض التقرير الكامل' },
  editJob: { en: 'Edit Job Card', ar: 'تعديل بطاقة العمل' },
  startWork: { en: 'Start Work', ar: 'بدء العمل' },
  pauseWork: { en: 'Pause Timer', ar: 'إيقاف مؤقت' },
  resumeWork: { en: 'Resume Timer', ar: 'استئناف العمل' },
  completeJob: { en: 'Complete & Submit', ar: 'إنهاء واعتماد التقرير' },
  addOption: { en: 'Add New Option', ar: 'إضافة خيار جديد' },
  clearSignature: { en: 'Clear Signature', ar: 'مسح التوقيع' },

  // Financial
  subtotal: { en: 'Subtotal', ar: 'المجموع الفرعي' },
  discount: { en: 'Discount', ar: 'الخصم' },
  advancePayment: { en: 'Advance Deposit', ar: 'الدفعة المقدمة' },
  balanceDue: { en: 'Balance Due', ar: 'المبلغ المتبقي' },
  netTotal: { en: 'Net Total', ar: 'الإجمالي الصافي' },
  tax: { en: 'Tax / VAT (0%)', ar: 'الضريبة (0%)' },
  paid: { en: 'Paid in Full', ar: 'مدفوع بالكامل' },
  unpaid: { en: 'Pending Payment', ar: 'بانتظار السداد' },

  // Customer & Vehicle labels
  customerQID: { en: 'Qatar ID (11 Digits)', ar: 'البطاقة الشخصية القطرية (11 رقم)' },
  customerMobile: { en: 'Mobile (+974)', ar: 'رقم الجوال (+974)' },
  customerWhatsApp: { en: 'WhatsApp Number', ar: 'رقم الواتساب' },
  sameAsMobile: { en: 'Same as mobile', ar: 'مطابق لرقم الجوال' },
  customerName: { en: 'Customer Full Name', ar: 'اسم العميل بالكامل' },
  plateNumber: { en: 'Plate Number', ar: 'رقم اللوحة' },
  plateType: { en: 'Plate Type', ar: 'نوع اللوحة' },
  make: { en: 'Vehicle Make', ar: 'الشركة الصانعة' },
  model: { en: 'Model', ar: 'الموديل' },
  year: { en: 'Model Year', ar: 'سنة الصنع' },
  vin: { en: 'Chassis / VIN (17 Chars)', ar: 'رقم الشاسيه / الهيكل (17 حرف)' },
  odometer: { en: 'Odometer (KM)', ar: 'قراءة العداد (كم)' },
  fuelLevel: { en: 'Fuel Level', ar: 'مستوى الوقود' },
  complaintDescription: { en: 'Customer Complaint / Request', ar: 'شكوى العميل / المطلوب تنفيذه' },

  // Blueprint Damage
  damageBlueprint: { en: 'Interactive Vehicle Damage Diagram', ar: 'مخطط أضرار وفحص هيكل المركبة التفاعلي' },
  tapToDropPin: { en: 'Click or tap on any vehicle view to drop a damage pin', ar: 'اضغط على أي جزء من المركبة لتحديد موقع الضرر' },
  topView: { en: 'Top Roof & Hood', ar: 'أعلى / السقف والكبوت' },
  frontView: { en: 'Front Bumper & Grille', ar: 'الواجهة الأمامية والصدام' },
  rearView: { en: 'Rear Trunk & Bumper', ar: 'الخلفية والشنطة' },
  leftView: { en: 'Left Driver Side', ar: 'الجانب الأيسر (السائق)' },
  rightView: { en: 'Right Passenger Side', ar: 'الجانب الأيمن (الراكب)' },

  // Quality Checklist
  qualityVerification: { en: 'Final Quality Inspection Checklist', ar: 'قائمة التحقق والفحص النهائي للجودة' },
  roadTest: { en: 'Road test executed & driveability confirmed', ar: 'تم إجراء الفحص على الطريق والتأكد من القيادة' },
  noLeaks: { en: 'Zero fluid leaks under vehicle', ar: 'التأكد من عدم وجود أي تسريب للزيوت أو السوائل' },
  tyrePressure: { en: 'Tyre pressures set to factory spec', ar: 'ضبط ضغط هواء الإطارات حسب المواصفات' },
  lightsChecked: { en: 'Exterior lights, signals & horn operating', ar: 'فحص جميع الإنارات والإشارات والبوق' },
  cleanedClean: { en: 'Vehicle washed & vacuumed inside and out', ar: 'غسيل وتلميع المركبة من الداخل والخارج' },
  toolsRemoved: { en: 'All technician workshop tools removed', ar: 'إزالة جميع معدات وأدوات الورشة من السيارة' },
  belongingsReturned: { en: 'All customer items accounted for and returned', ar: 'التأكد من إعادة كافة متعلقات العميل' },
};

export function t(key: keyof typeof translations, lang: Language = 'en'): string {
  if (translations[key]) {
    return translations[key][lang] || translations[key].en;
  }
  return key;
}

export function formatQAR(amount: number, lang: Language = 'en'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);

  if (lang === 'ar') {
    return `${formatted} ر.ق`;
  }
  return `QAR ${formatted}`;
}

export function formatQatarDate(dateString?: string, lang: Language = 'en'): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateString;
  }
}

export function formatQatarDateOnly(dateString?: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
}

// Normalizes Qatar mobile numbers to international 974XXXXXXXX without +
export function normalizeQatarPhone(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('974') && clean.length === 11) {
    return clean;
  }
  if (clean.length === 8) {
    return `974${clean}`;
  }
  return clean;
}

// Validates 11-digit QID (Qatar ID)
export function isValidQID(qid: string): boolean {
  const clean = qid.replace(/[^0-9]/g, '');
  return clean.length === 11;
}

// Generates the wa.me link with pre-filled bilingual message
export function generateWhatsAppLink(
  phone: string,
  customerName: string,
  make: string,
  model: string,
  plate: string,
  jobNo: string,
  branchName: string,
  portalUrl: string,
  templateEn?: string,
  templateAr?: string
): string {
  const normalizedNumber = normalizeQatarPhone(phone);
  
  let msg = `*CARCARE PRO QATAR - WORKSHOP COMPLETION REPORT*\n` +
    `بطاقة العمل: ${jobNo}\n\n` +
    `Dear ${customerName},\n` +
    `Your vehicle *${make} ${model}* (Plate: *${plate}*) at *${branchName}* is completed and ready for collection! 🚗✨\n\n` +
    `📱 View your full inspection report, before/after photos, and official invoice here:\n` +
    `${portalUrl}\n\n` +
    `عزيزنا ${customerName}،\n` +
    `تم الانتهاء من فحص وصيانة مركبتكم *${make} ${model}* (لوحة: *${plate}*) في *${branchName}* وهي جاهزة للاستلام.\n` +
    `يمكنكم استعراض التقرير المعتمد وصور الفحص والفاتورة عبر الرابط أعلاه.\n\n` +
    `Thank you for trusting CarCare Pro Qatar.`;

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(msg)}`;
}
