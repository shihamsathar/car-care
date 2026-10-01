import React, { useState } from 'react';
import {
  Car,
  User as UserIcon,
  Wrench,
  Package,
  DollarSign,
  ClipboardCheck,
  UserCheck,
  FileText,
  Save,
  Check,
  ChevronRight,
  ChevronLeft,
  Search,
  Plus,
  Trash2,
  Printer,
  Copy,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  JobCard,
  Priority,
  ServiceLineItem,
  PartLineItem,
  DamagePin,
  ReceptionChecklist
} from '../../types';
import { LookupSelect } from '../common/LookupSelect';
import { CarBlueprintDiagram } from '../vehicle/CarBlueprintDiagram';
import { SignaturePad } from '../common/SignaturePad';
import { formatQAR, isValidQID, normalizeQatarPhone } from '../../utils/i18n';

interface JobCardFormProps {
  initialJob?: JobCard;
  onSuccess: (job: JobCard) => void;
  onCancel: () => void;
  onPrintPreview?: (job: JobCard) => void;
}

export const JobCardForm: React.FC<JobCardFormProps> = ({
  initialJob,
  onSuccess,
  onCancel,
  onPrintPreview,
}) => {
  const {
    branches,
    technicians,
    lookups,
    createJob,
    updateJob,
    findCustomerByQID,
    settings,
    addToast,
    currentUser,
  } = useApp();

  const [activeStep, setActiveStep] = useState<number>(1);

  // STEP 1: HEADER
  const [branchId, setBranchId] = useState<string>(initialJob?.branchId || branches[0]?.id || '');
  const [priority, setPriority] = useState<Priority>(initialJob?.priority || 'Normal');
  const [expectedDelivery, setExpectedDelivery] = useState<string>(
    initialJob?.expectedDelivery || new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [jobSource, setJobSource] = useState<string>(initialJob?.jobSource || 'Walk-in');

  // STEP 2: CUSTOMER
  const [customerType, setCustomerType] = useState<'Individual' | 'Company'>(
    initialJob?.customerType || 'Individual'
  );
  const [customerName, setCustomerName] = useState<string>(initialJob?.customerName || '');
  const [customerQID, setCustomerQID] = useState<string>(initialJob?.customerQID || '');
  const [customerMobile, setCustomerMobile] = useState<string>(initialJob?.customerMobile || '+974 ');
  const [customerWhatsApp, setCustomerWhatsApp] = useState<string>(initialJob?.customerWhatsApp || '+974 ');
  const [sameAsMobile, setSameAsMobile] = useState<boolean>(true);
  const [customerEmail, setCustomerEmail] = useState<string>(initialJob?.customerEmail || '');
  const [customerNationality, setCustomerNationality] = useState<string>(
    initialJob?.customerNationality || 'Qatari'
  );
  const [companyName, setCompanyName] = useState<string>(initialJob?.companyName || '');
  const [companyCR, setCompanyCR] = useState<string>(initialJob?.companyCR || '');
  const [addressZone, setAddressZone] = useState<string>(initialJob?.addressZone || '');
  const [customerPassword, setCustomerPassword] = useState<string>(
    initialJob?.customerPasswordPreview || 'Qatar#2026'
  );

  // STEP 3: VEHICLE
  const [plateNumber, setPlateNumber] = useState<string>(initialJob?.plateNumber || '');
  const [plateType, setPlateType] = useState<string>(initialJob?.plateType || 'Private (White)');
  const [make, setMake] = useState<string>(initialJob?.make || 'Toyota');
  const [model, setModel] = useState<string>(initialJob?.model || 'Land Cruiser 300 (VXR / GR-S)');
  const [year, setYear] = useState<number>(initialJob?.year || 2024);
  const [color, setColor] = useState<string>(initialJob?.color || 'Pearl White');
  const [bodyType, setBodyType] = useState<string>(initialJob?.bodyType || 'SUV / 4x4 (Full Size)');
  const [fuelType, setFuelType] = useState<string>(initialJob?.fuelType || 'Petrol Super 95 (سوبر)');
  const [transmission, setTransmission] = useState<string>(initialJob?.transmission || 'Automatic');
  const [driveType, setDriveType] = useState<string>(initialJob?.driveType || '4WD / AWD');
  const [specification, setSpecification] = useState<string>(initialJob?.specification || 'GCC Specs (خليجي)');
  const [vin, setVin] = useState<string>(initialJob?.vin || '');
  const [engineNumber, setEngineNumber] = useState<string>(initialJob?.engineNumber || '');
  const [istimaraNumber, setIstimaraNumber] = useState<string>(initialJob?.istimaraNumber || '');
  const [insuranceCompany, setInsuranceCompany] = useState<string>(
    initialJob?.insuranceCompany || 'Qatar Insurance Company (QIC)'
  );
  const [odometerIn, setOdometerIn] = useState<number>(initialJob?.odometerIn || 0);
  const [fuelLevelIn, setFuelLevelIn] = useState<'E' | '1/4' | '1/2' | '3/4' | 'F'>(
    initialJob?.fuelLevelIn || '1/2'
  );
  const [numberOfKeys, setNumberOfKeys] = useState<number>(initialJob?.numberOfKeys || 1);
  const [warningLights, setWarningLights] = useState<string[]>(initialJob?.warningLights || []);

  // STEP 4: SERVICES & COMPLAINT
  const [complaint, setComplaint] = useState<string>(initialJob?.complaint || '');
  const [services, setServices] = useState<ServiceLineItem[]>(
    initialJob?.services || [
      {
        id: 'li-default-1',
        name: 'Synthetic Engine Oil & Filter Change (5W-30 / 0W-20)',
        description: 'Periodic oil change with OEM filter and inspection.',
        qty: 1,
        unitPrice: 280,
        discount: 0,
        total: 280,
      },
    ]
  );

  // STEP 5: PARTS
  const [parts, setParts] = useState<PartLineItem[]>(initialJob?.parts || []);

  // STEP 6: PRICING & ESTIMATES
  const [discountAmount, setDiscountAmount] = useState<number>(initialJob?.discount || 0);
  const [taxPercent, setTaxPercent] = useState<number>(initialJob?.taxPercent || 0);
  const [advancePayment, setAdvancePayment] = useState<number>(initialJob?.advancePayment || 0);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    initialJob?.paymentMethod || 'Debit / Credit Card (POS)'
  );
  const [customerEstimateSignature, setCustomerEstimateSignature] = useState<string>(
    initialJob?.customerEstimateSignature || ''
  );

  // STEP 7: RECEPTION & BLUEPRINT
  const [receptionChecklist, setReceptionChecklist] = useState<ReceptionChecklist>(
    initialJob?.receptionChecklist || {
      spareWheel: true,
      jackAndTools: true,
      floorMats: true,
      audioNavigation: true,
      documentsInGlovebox: true,
      valuablesRemoved: true,
      wheelLockNut: true,
      belongingsNotes: '',
    }
  );
  const [damagePins, setDamagePins] = useState<DamagePin[]>(initialJob?.damagePins || []);

  // STEP 8: ASSIGNMENT
  const [assignedTechnicianId, setAssignedTechnicianId] = useState<string>(
    initialJob?.assignedTechnicianId || ''
  );
  const [workshopBay, setWorkshopBay] = useState<string>(initialJob?.workshopBay || 'Bay 1');
  const [supervisorName, setSupervisorName] = useState<string>(
    initialJob?.supervisorName || currentUser?.name || 'Workshop Supervisor'
  );
  const [internalNotes, setInternalNotes] = useState<string>(initialJob?.internalNotes || '');

  // STEP 9: TERMS & AUTHORIZATION
  const [whatsappConsent, setWhatsappConsent] = useState<boolean>(
    initialJob?.whatsappConsent !== undefined ? initialJob.whatsappConsent : true
  );
  const [customerAuthSignature, setCustomerAuthSignature] = useState<string>(
    initialJob?.customerAuthorizationSignature || ''
  );

  // Dependent Make ID lookup for Model
  const selectedMakeItem = lookups.find(
    (l) => l.type === 'make' && (l.labelEn === make || l.labelAr === make || l.id === make)
  );

  // Calculations
  const servicesTotal = services.reduce((acc, s) => acc + (s.total || 0), 0);
  const partsTotal = parts.reduce((acc, p) => acc + (p.total || 0), 0);
  const subtotal = servicesTotal + partsTotal;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (taxableAmount * taxPercent) / 100;
  const totalEstimate = taxableAmount + taxAmount;
  const balanceDue = Math.max(0, totalEstimate - advancePayment);

  // Live QID Search handler
  const handleQIDSearch = (val: string) => {
    setCustomerQID(val);
    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length === 11) {
      const existing = findCustomerByQID(clean);
      if (existing) {
        setCustomerName(existing.name);
        setCustomerMobile(existing.mobile);
        setCustomerWhatsApp(existing.whatsapp);
        setCustomerEmail(existing.email || '');
        setCustomerNationality(existing.nationality || 'Qatari');
        setCustomerType(existing.customerType || 'Individual');
        if (existing.companyName) setCompanyName(existing.companyName);
        if (existing.crNumber) setCompanyCR(existing.crNumber);
        if (existing.address) setAddressZone(existing.address);

        addToast({
          type: 'info',
          title: 'Existing Customer Found',
          message: `Auto-populated profile for ${existing.name} (${existing.totalVisits} previous visits).`,
        });
      }
    }
  };

  // Add Service Item
  const handleAddService = () => {
    setServices((prev) => [
      ...prev,
      {
        id: `srv-${Date.now()}`,
        name: 'General Mechanical / Electrical Service',
        description: 'Inspection and service as requested.',
        qty: 1,
        unitPrice: 200,
        discount: 0,
        total: 200,
      },
    ]);
  };

  const handleUpdateService = (index: number, updates: Partial<ServiceLineItem>) => {
    setServices((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, ...updates };
        updated.total = Math.max(0, updated.qty * updated.unitPrice - (updated.discount || 0));
        return updated;
      })
    );
  };

  const handleRemoveService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  // Add Part Item
  const handleAddPart = () => {
    setParts((prev) => [
      ...prev,
      {
        id: `part-${Date.now()}`,
        name: 'OEM Filter / Replacement Part',
        partNumber: '',
        brand: 'Genuine Parts',
        qty: 1,
        unitPrice: 150,
        supplier: 'Local Agency Qatar',
        warranty: '30 Days',
        total: 150,
      },
    ]);
  };

  const handleUpdatePart = (index: number, updates: Partial<PartLineItem>) => {
    setParts((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, ...updates };
        updated.total = updated.qty * updated.unitPrice;
        return updated;
      })
    );
  };

  const handleRemovePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit & Save Form
  const handleSubmit = (targetStatus?: 'Draft' | 'Created' | 'Assigned') => {
    if (!plateNumber.trim()) {
      addToast({ type: 'error', message: 'Vehicle Plate Number is required.' });
      setActiveStep(3);
      return;
    }
    if (!customerName.trim()) {
      addToast({ type: 'error', message: 'Customer Name is required.' });
      setActiveStep(2);
      return;
    }
    if (customerQID && !isValidQID(customerQID)) {
      addToast({
        type: 'warning',
        message: 'Qatar ID should be exactly 11 digits (e.g. 29012345678).',
      });
    }

    const assignedTech = technicians.find((t) => t.id === assignedTechnicianId);

    const jobData: any = {
      branchId,
      priority,
      expectedDelivery,
      jobSource,
      status: targetStatus || (assignedTechnicianId ? 'Assigned' : 'Created'),

      // Customer
      customerId: `cust-${customerQID || Date.now()}`,
      customerType,
      customerName,
      customerQID: customerQID.replace(/[^0-9]/g, ''),
      customerMobile: normalizeQatarPhone(customerMobile),
      customerWhatsApp: sameAsMobile
        ? normalizeQatarPhone(customerMobile)
        : normalizeQatarPhone(customerWhatsApp),
      customerEmail,
      customerNationality,
      companyName: customerType === 'Company' ? companyName : undefined,
      companyCR: customerType === 'Company' ? companyCR : undefined,
      addressZone,
      customerPasswordPreview: customerPassword,

      // Vehicle
      plateNumber: plateNumber.toUpperCase(),
      plateType,
      make,
      model,
      year: Number(year),
      color,
      bodyType,
      fuelType,
      transmission,
      driveType,
      specification,
      vin: vin.toUpperCase(),
      engineNumber,
      istimaraNumber,
      insuranceCompany,
      odometerIn: Number(odometerIn),
      fuelLevelIn,
      numberOfKeys: Number(numberOfKeys),
      warningLights,

      // Work & Financials
      complaint,
      services,
      parts,
      subtotal,
      discount: discountAmount,
      taxPercent,
      taxAmount,
      totalEstimate,
      advancePayment,
      balanceDue,
      paymentMethod,
      customerEstimateSignature,

      // Reception
      receptionChecklist,
      damagePins,
      photos: initialJob?.photos || [],

      // Assignment
      assignedTechnicianId: assignedTech?.id,
      assignedTechnicianName: assignedTech?.name,
      workshopBay,
      supervisorName,
      internalNotes,

      // Technician execution
      technicianNotes: initialJob?.technicianNotes || [],
      timerElapsedSeconds: initialJob?.timerElapsedSeconds || 0,
      isTimerRunning: initialJob?.isTimerRunning || false,
      whatsappConsent,
      customerAuthorizationSignature: customerAuthSignature,
    };

    if (initialJob) {
      updateJob(initialJob.id, jobData);
      addToast({
        type: 'success',
        title: 'Job Card Updated',
        message: `Job #${initialJob.jobNo} saved successfully.`,
      });
      onSuccess({ ...initialJob, ...jobData });
    } else {
      const created = createJob(jobData);
      onSuccess(created);
    }
  };

  const steps = [
    { num: 1, title: 'Header', icon: <Car className="w-4 h-4" /> },
    { num: 2, title: 'Customer', icon: <UserIcon className="w-4 h-4" /> },
    { num: 3, title: 'Vehicle', icon: <Car className="w-4 h-4" /> },
    { num: 4, title: 'Services', icon: <Wrench className="w-4 h-4" /> },
    { num: 5, title: 'Parts', icon: <Package className="w-4 h-4" /> },
    { num: 6, title: 'Pricing', icon: <DollarSign className="w-4 h-4" /> },
    { num: 7, title: 'Blueprint', icon: <ClipboardCheck className="w-4 h-4" /> },
    { num: 8, title: 'Bay/Tech', icon: <UserCheck className="w-4 h-4" /> },
    { num: 9, title: 'Terms & Sign', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-w-5xl mx-auto">
      {/* Top Header Banner */}
      <div className="bg-[#0B3A6E] text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-teal-300 font-bold">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight">
              {initialJob ? `Edit Job Card #${initialJob.jobNo}` : 'New Qatar Workshop Job Card'}
            </h2>
            <p className="text-xs text-slate-300">
              Complete reception, vehicle inspection diagram, customer QID record & authorization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPrintPreview && initialJob && (
            <button
              type="button"
              onClick={() => onPrintPreview(initialJob)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Preview</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Stepper Navigation Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {steps.map((s) => {
            const isCurrent = activeStep === s.num;
            const isCompleted = activeStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0B3A6E] text-white shadow-xs'
                    : isCompleted
                    ? 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                    : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-teal-400 text-slate-900'
                      : isCompleted
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                </span>
                <span>{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Area */}
      <div className="p-6">
        {/* STEP 1: HEADER & BRANCH */}
        {activeStep === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              1. Workshop Branch & Delivery Schedule
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workshop Branch <span className="text-red-500">*</span>
                </label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nameEn} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <LookupSelect
                label="Priority Status"
                lookupType="priority"
                value={priority}
                onChange={(val) => setPriority(val as Priority)}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Delivery Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                />
              </div>

              <LookupSelect
                label="Job Source / Channel"
                lookupType="jobSource"
                value={jobSource}
                onChange={setJobSource}
              />
            </div>
          </div>
        )}

        {/* STEP 2: CUSTOMER (QID) */}
        {activeStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                2. Customer Information (11-Digit Qatar ID & WhatsApp)
              </h3>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-600">Type:</label>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCustomerType('Individual')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      customerType === 'Individual' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerType('Company')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      customerType === 'Company' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
                    }`}
                  >
                    Corporate / Fleet
                  </button>
                </div>
              </div>
            </div>

            {/* QID Search Callout */}
            <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#0E9AA7]" />
                <span className="text-xs font-medium text-teal-900">
                  Enter 11-digit Qatar ID to auto-fill existing customer profile or create a new one.
                </span>
              </div>
              <span className="text-[11px] font-bold text-[#0E9AA7] bg-white px-2 py-0.5 rounded-full border border-teal-200">
                Auto-Login Account Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qatar ID (QID - 11 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={customerQID}
                  onChange={(e) => handleQIDSearch(e.target.value)}
                  placeholder="e.g. 29012345678"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7] font-mono tracking-wider font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mohammed Al-Kuwari"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (+974) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={customerMobile}
                  onChange={(e) => setCustomerMobile(e.target.value)}
                  placeholder="+974 5512 3456"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">WhatsApp Number</label>
                  <label className="flex items-center gap-1 text-[11px] text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsMobile}
                      onChange={(e) => setSameAsMobile(e.target.checked)}
                      className="rounded text-teal-600"
                    />
                    <span>Same as mobile</span>
                  </label>
                </div>
                <input
                  type="tel"
                  disabled={sameAsMobile}
                  value={sameAsMobile ? customerMobile : customerWhatsApp}
                  onChange={(e) => setCustomerWhatsApp(e.target.value)}
                  placeholder="+974 5512 3456"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7] disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <LookupSelect
                label="Nationality"
                lookupType="nationality"
                value={customerNationality}
                onChange={setCustomerNationality}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@domain.qa"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                />
              </div>

              {customerType === 'Company' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Al-Fardan Trading W.L.L."
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Commercial Registration (CR)
                    </label>
                    <input
                      type="text"
                      value={companyCR}
                      onChange={(e) => setCompanyCR(e.target.value)}
                      placeholder="e.g. 109283"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Address / Zone / Street
                </label>
                <input
                  type="text"
                  value={addressZone}
                  onChange={(e) => setAddressZone(e.target.value)}
                  placeholder="e.g. Al Dafna, Zone 66, Street 840, Villa 12"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Portal Auto-Password
                </label>
                <input
                  type="text"
                  value={customerPassword}
                  onChange={(e) => setCustomerPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-amber-50/80 border border-amber-300 rounded-lg font-mono text-slate-800 font-semibold"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: VEHICLE SPECS */}
        {activeStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              3. Vehicle Identification & Specifications
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Plate Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  placeholder="e.g. 100222"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7] font-bold text-slate-900 uppercase"
                />
              </div>

              <LookupSelect
                label="Plate Type (Qatar)"
                lookupType="plateType"
                value={plateType}
                onChange={setPlateType}
                required
              />

              <LookupSelect
                label="Vehicle Make"
                lookupType="make"
                value={make}
                onChange={(val, item) => {
                  setMake(val);
                  // Reset model if make changes
                  const firstModel = lookups.find((l) => l.type === 'model' && l.parentId === item?.id);
                  if (firstModel) setModel(firstModel.labelEn);
                }}
                required
              />

              <LookupSelect
                label="Vehicle Model (GCC)"
                lookupType="model"
                parentId={selectedMakeItem?.id}
                value={model}
                onChange={setModel}
                required
                helpText={!selectedMakeItem ? 'Select make first' : undefined}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Year (سنة الصنع)
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                >
                  {Array.from({ length: 47 }, (_, i) => 2026 - i).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <LookupSelect
                label="Color"
                lookupType="color"
                value={color}
                onChange={setColor}
              />

              <LookupSelect
                label="Body Type"
                lookupType="bodyType"
                value={bodyType}
                onChange={setBodyType}
              />

              <LookupSelect
                label="Fuel Type"
                lookupType="fuelType"
                value={fuelType}
                onChange={setFuelType}
              />

              <LookupSelect
                label="Transmission"
                lookupType="transmission"
                value={transmission}
                onChange={setTransmission}
              />

              <LookupSelect
                label="Specification"
                lookupType="specification"
                value={specification}
                onChange={setSpecification}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chassis / VIN (17 Characters)
                </label>
                <input
                  type="text"
                  maxLength={17}
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="e.g. JTJHY7AX8P4019284"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono tracking-wider uppercase"
                />
              </div>

              <LookupSelect
                label="Insurance Company"
                lookupType="insuranceCompany"
                value={insuranceCompany}
                onChange={setInsuranceCompany}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Odometer at Reception (KM)
                </label>
                <input
                  type="number"
                  min="0"
                  value={odometerIn || ''}
                  onChange={(e) => setOdometerIn(Number(e.target.value))}
                  placeholder="e.g. 18450"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fuel Level in Tank
                </label>
                <select
                  value={fuelLevelIn}
                  onChange={(e) => setFuelLevelIn(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-semibold text-slate-800"
                >
                  <option value="E">E (Empty)</option>
                  <option value="1/4">1/4 Quarter Tank</option>
                  <option value="1/2">1/2 Half Tank</option>
                  <option value="3/4">3/4 Three Quarters</option>
                  <option value="F">F (Full Tank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Number of Keys Received
                </label>
                <select
                  value={numberOfKeys}
                  onChange={(e) => setNumberOfKeys(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value={1}>1 Key / Smart Fob</option>
                  <option value={2}>2 Keys</option>
                  <option value={3}>3 Keys</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Istimara (Fahes) Number
                </label>
                <input
                  type="text"
                  value={istimaraNumber}
                  onChange={(e) => setIstimaraNumber(e.target.value)}
                  placeholder="e.g. 9840192"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SERVICES & COMPLAINT */}
        {activeStep === 4 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              4. Customer Complaint & Requested Services
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Customer Complaint / Request
              </label>
              <textarea
                rows={3}
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                placeholder="Describe exact customer symptoms, squeaks, noises, warning lamps, or requested detailing..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
              />
            </div>

            {/* Services Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-50 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800">
                  Service Line Items ({services.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-lg cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-300" />
                  <span>Add Service Item</span>
                </button>
              </div>

              <div className="divide-y divide-slate-200 p-2 space-y-2">
                {services.map((item, idx) => (
                  <div key={item.id} className="p-3 bg-white rounded-lg border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-5">
                      <LookupSelect
                        label={`Service #${idx + 1}`}
                        lookupType="service"
                        value={item.name}
                        onChange={(val, lookup) => {
                          handleUpdateService(idx, {
                            name: val,
                            unitPrice: lookup?.defaultPrice ?? item.unitPrice,
                          });
                        }}
                      />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Description / Work details
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleUpdateService(idx, { description: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleUpdateService(idx, { qty: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-center"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Price (QAR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateService(idx, { unitPrice: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-semibold text-right"
                      />
                    </div>
                    <div className="md:col-span-1 flex items-center justify-between pt-4">
                      <span className="text-xs font-bold text-[#0E9AA7]">
                        {formatQAR(item.total)}
                      </span>
                      {services.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-50 px-4 py-2 flex justify-end font-bold text-xs text-slate-800 border-t border-slate-200">
                Total Services: {formatQAR(servicesTotal)}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: PARTS & MATERIALS */}
        {activeStep === 5 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-bold text-slate-800">
                5. Parts & Consumables Estimate (Optional)
              </h3>
              <button
                type="button"
                onClick={handleAddPart}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-teal-300" />
                <span>Add Part</span>
              </button>
            </div>

            {parts.length > 0 ? (
              <div className="space-y-3">
                {parts.map((part, idx) => (
                  <div key={part.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Part Name
                      </label>
                      <input
                        type="text"
                        value={part.name}
                        onChange={(e) => handleUpdatePart(idx, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Part Number / OEM
                      </label>
                      <input
                        type="text"
                        value={part.partNumber}
                        onChange={(e) => handleUpdatePart(idx, { partNumber: e.target.value })}
                        placeholder="e.g. 04465-60340"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Unit Price (QAR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={part.unitPrice}
                        onChange={(e) => handleUpdatePart(idx, { unitPrice: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold text-right"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Warranty
                      </label>
                      <input
                        type="text"
                        value={part.warranty}
                        onChange={(e) => handleUpdatePart(idx, { warranty: e.target.value })}
                        placeholder="3 Months"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="font-bold text-xs text-slate-800">
                        {formatQAR(part.total)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No spare parts currently estimated for this job. Click &quot;Add Part&quot; if replacement filters, brake pads, or oils are required.
              </div>
            )}
          </div>
        )}

        {/* STEP 6: ESTIMATE & PRICING */}
        {activeStep === 6 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              6. Pricing Breakdown & Advance Deposit
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Services Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatQAR(servicesTotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Parts Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatQAR(partsTotal)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-800 border-t pt-2">
                  <span>Gross Subtotal:</span>
                  <span>{formatQAR(subtotal)}</span>
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Special Discount (QAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-right font-bold text-emerald-600"
                  />
                </div>

                <div className="pt-1">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advance Deposit Received (QAR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={advancePayment || ''}
                    onChange={(e) => setAdvancePayment(Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-right font-bold text-[#0B3A6E]"
                  />
                </div>

                <LookupSelect
                  label="Payment Method"
                  lookupType="paymentMethod"
                  value={paymentMethod}
                  onChange={setPaymentMethod}
                />

                <div className="p-3 bg-[#0B3A6E] text-white rounded-xl flex items-center justify-between font-bold text-sm mt-3">
                  <span>Estimated Balance Due:</span>
                  <span className="text-teal-300 text-base">{formatQAR(balanceDue)}</span>
                </div>
              </div>

              {/* Estimate Approval Signature Pad */}
              <div>
                <SignaturePad
                  initialSignature={customerEstimateSignature}
                  onSave={setCustomerEstimateSignature}
                  label="Customer Estimate Initial Approval Signature"
                />
                <p className="text-[11px] text-slate-500 mt-2">
                  Customer confirms authorization of this estimate. Additional faults discovered during repair will require subsequent notification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: RECEPTION & BLUEPRINT */}
        {activeStep === 7 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              7. Reception Checklist & Interactive 4-View Damage Diagram
            </h3>

            {/* Checklist */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-2">
                Inventory & Belongings Checklist
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries({
                  spareWheel: 'Spare Wheel Present',
                  jackAndTools: 'Jack & Lug Wrench',
                  floorMats: 'Floor Mats Fitted',
                  audioNavigation: 'Screen / Audio Intact',
                  documentsInGlovebox: 'Registration Card',
                  valuablesRemoved: 'Valuables Removed',
                  wheelLockNut: 'Wheel Lock Key Nut',
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={(receptionChecklist as any)[key]}
                      onChange={(e) =>
                        setReceptionChecklist((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-slate-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Interactive Vehicle Diagram */}
            <div>
              <div className="mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Interactive Vehicle Damage Blueprint
                </span>
                <p className="text-[11px] text-slate-500">
                  Select a view (Top, Front, Rear, Left, Right) and tap anywhere on the diagram to document pre-existing dents, scratches, or stone chips.
                </p>
              </div>

              <CarBlueprintDiagram
                pins={damagePins}
                onAddPin={(newPin) => {
                  const pinWithId: DamagePin = {
                    ...newPin,
                    id: `pin-${Date.now()}`,
                    createdAt: new Date().toISOString(),
                    addedBy: currentUser?.name || 'Staff',
                  };
                  setDamagePins((prev) => [...prev, pinWithId]);
                }}
                onDeletePin={(pinId) => {
                  setDamagePins((prev) => prev.filter((p) => p.id !== pinId));
                }}
              />
            </div>
          </div>
        )}

        {/* STEP 8: ASSIGNMENT & BAY */}
        {activeStep === 8 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              8. Workshop Bay & Technician Assignment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Technician
                </label>
                <select
                  value={assignedTechnicianId}
                  onChange={(e) => setAssignedTechnicianId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0E9AA7]"
                >
                  <option value="">Leave Unassigned (Open for Pool)</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workshop Bay
                </label>
                <select
                  value={workshopBay}
                  onChange={(e) => setWorkshopBay(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                >
                  <option value="Bay 1 - VIP Detailing & Mechanical">Bay 1 - VIP Detailing</option>
                  <option value="Bay 2 - Fast Oil & Lube">Bay 2 - Fast Lube</option>
                  <option value="Bay 3 - Mechanical Lift">Bay 3 - Mechanical Lift</option>
                  <option value="Bay 4 - Brakes & Suspension">Bay 4 - Brakes & Suspension</option>
                  <option value="Bay 5 - Dust-Free PPF Cleanroom">Bay 5 - Dust-Free PPF Cleanroom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisor Name
                </label>
                <input
                  type="text"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Workshop Notes (Never shared with customer)
                </label>
                <textarea
                  rows={3}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. VIP client requested special handling. Inspect front brake caliper sensor wire..."
                  className="w-full px-3 py-2 text-sm bg-amber-50/50 border border-amber-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 9: TERMS & SIGNATURE */}
        {activeStep === 9 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-sm font-bold text-slate-800 border-b pb-2">
              9. Terms, Repair Authorization & Sign-Off
            </h3>

            {/* Bilingual Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <h5 className="font-bold text-slate-800 mb-1">Workshop Conditions (English)</h5>
                <pre className="font-sans text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {settings.jobCardTermsEn}
                </pre>
              </div>
              <div dir="rtl">
                <h5 className="font-bold text-slate-800 mb-1">شروط وأحكام الورشة (العربية)</h5>
                <pre className="font-sans text-[11px] text-slate-600 whitespace-pre-wrap leading-relaxed">
                  {settings.jobCardTermsAr}
                </pre>
              </div>
            </div>

            {/* WhatsApp Consent Checkbox */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
              <label className="flex items-center gap-2 text-xs font-semibold text-teal-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={whatsappConsent}
                  onChange={(e) => setWhatsappConsent(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>
                  Customer gives explicit consent to receive service updates, inspection photos, and the completion report via WhatsApp (+974).
                </span>
              </label>
            </div>

            {/* Authorization Digital Signature */}
            <div>
              <SignaturePad
                initialSignature={customerAuthSignature}
                onSave={setCustomerAuthSignature}
                label="Customer Repair Authorization Signature"
              />
            </div>
          </div>
        )}
      </div>

      {/* Form Bottom Navigation Bar */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back: {steps[activeStep - 2]?.title}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSubmit('Draft')}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

          {activeStep < 9 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => prev + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <span>Next: {steps[activeStep]?.title}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSubmit('Created')}
              className="flex items-center gap-1.5 px-6 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer transition-colors shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>{initialJob ? 'Save Changes' : 'Create & Assign Job Card'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
