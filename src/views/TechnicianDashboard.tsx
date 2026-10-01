import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Clock,
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Car,
  ChevronRight,
  ChevronLeft,
  Check,
  ClipboardList,
  AlertCircle,
  ThumbsUp,
  FileText,
  User,
  Sparkles,
  Calendar,
  Layers,
  Mic,
  MicOff,
  Search,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Fuel,
  Gauge,
  PenTool,
  CheckSquare,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Star,
  Info,
  LogOut,
  RefreshCw,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ExtraWorkItem,
  JobCard,
  JobPhoto,
  JobStatus,
  PartUsedItem,
  QualityChecklist,
  TechnicianNote,
  TimerLog,
  User as UserType
} from '../types';
import { formatQatarDate, formatQAR } from '../utils/i18n';
import { GuidedPhotoCapture } from '../components/technician/GuidedPhotoCapture';
import { CarBlueprintDiagram } from '../components/vehicle/CarBlueprintDiagram';
import { SignaturePad } from '../components/common/SignaturePad';
import { OfflineQueueService } from '../services/offlineQueue';
import AudioHapticService from '../utils/audioHaptic';
import confetti from 'canvas-confetti';

type BottomTab = 'jobs' | 'available' | 'history' | 'profile';

export const TechnicianDashboard: React.FC = () => {
  const {
    jobs,
    currentUser,
    branches,
    updateJob,
    updateJobStatus,
    addPhoto,
    deletePhoto,
    togglePhotoVisibility,
    addDamagePin,
    deleteDamagePin,
    addTechnicianNote,
    addToast,
    language,
    setLanguage,
    logout,
  } = useApp();

  // Bottom navigation tab
  const [activeBottomTab, setActiveBottomTab] = useState<BottomTab>('jobs');

  // Currently focused job ID (null = on job list home screen)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // 6-Step Guided Flow (1: Summary & Accept, 2: Before Photos, 3: Blueprint, 4: Repair & Timer, 5: After Photos & QC, 6: Suggestions & Finish)
  const [techStep, setTechStep] = useState<number>(1);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Audio mute state
  const [soundEnabled, setSoundEnabled] = useState(AudioHapticService.isSoundEnabled());

  // Offline queue state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingQueueCount, setPendingQueueCount] = useState(OfflineQueueService.getPendingCount());

  // Step 4: Diagnosis & Repair states
  const [findingsText, setFindingsText] = useState('');
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState<'Waiting for parts' | 'Waiting for approval' | 'Break' | 'Other'>('Waiting for parts');

  // Extra work line addition modal
  const [isExtraWorkModalOpen, setIsExtraWorkModalOpen] = useState(false);
  const [extraWorkDesc, setExtraWorkDesc] = useState('');
  const [extraWorkParts, setExtraWorkParts] = useState('');
  const [extraWorkUrgency, setExtraWorkUrgency] = useState<'Low' | 'Medium' | 'High' | 'Immediate Safety'>('Medium');

  // Parts used modal
  const [isAddPartModalOpen, setIsAddPartModalOpen] = useState(false);
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partQty, setPartQty] = useState(1);
  const [partBrand, setPartBrand] = useState('');
  const [partSource, setPartSource] = useState<'Workshop Stock' | 'Special Order' | 'Customer Provided'>('Workshop Stock');

  // Reject job modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Step 6: Suggestions, complaints & next service
  const [noteType, setNoteType] = useState<'suggestion' | 'complaint' | 'internal' | 'safety'>('suggestion');
  const [noteSeverity, setNoteSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [noteText, setNoteText] = useState('');
  const [isNoteInternalOnly, setIsNoteInternalOnly] = useState(false);
  const [recommendedKm, setRecommendedKm] = useState<number | ''>('');
  const [recommendedDate, setRecommendedDate] = useState('');
  const [techConfirmedCheck, setTechConfirmedCheck] = useState(false);
  const [techSignatureData, setTechSignatureData] = useState<string | null>(null);

  // Validation errors list before finish
  const [validationErrors, setValidationErrors] = useState<Array<{ step: number; messageEn: string; messageAr: string }>>([]);

  // Selected job entity
  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  // Quality checklist default items
  const defaultQualityChecklist: QualityChecklist = {
    roadTestCompleted: false,
    noFluidLeaks: false,
    fluidsChecked: false,
    tyrePressureChecked: false,
    lightsAndSignalsOk: false,
    acCoolingVerified: false,
    warningLightsCleared: false,
    cleanedInterior: false,
    cleanedExterior: false,
    workshopToolsRemoved: false,
    customerBelongingsReturned: false,
    oldPartsKeptIfRequested: false,
  };

  // Sync state whenever active job changes
  useEffect(() => {
    if (selectedJob) {
      setFindingsText(selectedJob.findings || '');
      setRecommendedKm(selectedJob.nextServiceDueKm || '');
      setRecommendedDate(selectedJob.nextServiceDueDate || '');
      setTechSignatureData(selectedJob.technicianSignature || null);

      // Auto-position step depending on job status
      if (selectedJob.status === 'Assigned') {
        setTechStep(1);
      } else if (selectedJob.status === 'Accepted') {
        const beforeSideCount = selectedJob.photos.filter((p) => p.slotType?.endsWith('_before')).length;
        setTechStep(beforeSideCount >= 4 ? 3 : 2);
      } else if (selectedJob.status === 'In Progress' || selectedJob.status === 'Waiting for Parts') {
        setTechStep(4);
      } else if (selectedJob.status === 'Completed' || selectedJob.status === 'Report Sent') {
        setTechStep(6);
      }
    }
  }, [selectedJobId]);

  // Online / offline & queue listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      OfflineQueueService.processQueue((jobId, photo) => {
        addPhoto(jobId, photo);
      });
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeQueue = OfflineQueueService.subscribe((count) => {
      setPendingQueueCount(count);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeQueue();
    };
  }, []);

  // Timer interval for running job
  useEffect(() => {
    let interval: any = null;
    if (selectedJob?.isTimerRunning && selectedJob?.id) {
      const activeId = selectedJob.id;
      interval = setInterval(() => {
        updateJob(activeId, (prev) => ({
          timerElapsedSeconds: (prev.timerElapsedSeconds || 0) + 1,
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedJob?.isTimerRunning, selectedJob?.id]);

  if (!currentUser) return null;

  // Format seconds to HH:MM:SS
  const formatTimer = (totalSecs: number = 0) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sound toggle
  const toggleSound = () => {
    const next = AudioHapticService.toggleSound();
    setSoundEnabled(next);
  };

  // Voice to text using Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addToast({
        type: 'warning',
        title: language === 'ar' ? 'غير مدعوم' : 'Not Supported',
        message: language === 'ar' ? 'خاصية التعرف على الصوت غير مدعومة في متصفحك.' : 'Voice recognition is not supported on this browser.'
      });
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'ar' ? 'ar-QA' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListeningVoice(true);
      recognition.onend = () => setIsListeningVoice(false);
      recognition.onerror = () => setIsListeningVoice(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setFindingsText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        if (selectedJob) {
          updateJob(selectedJob.id, { findings: findingsText ? `${findingsText} ${transcript}` : transcript });
        }
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };

  // Technician's jobs
  const myAssignedJobs = jobs.filter(
    (j) => j.assignedTechnicianId === currentUser.id && j.status !== 'Delivered/Closed' && j.status !== 'Cancelled'
  );

  // Sub-sections
  const pendingAcceptJobs = myAssignedJobs.filter((j) => j.status === 'Assigned');
  const inProgressJobs = myAssignedJobs.filter((j) => j.status === 'In Progress' || j.status === 'Accepted');
  const waitingPartsJobs = myAssignedJobs.filter((j) => j.status === 'Waiting for Parts' || j.status === 'Awaiting Customer Approval');
  const completedJobs = myAssignedJobs.filter((j) => j.status === 'Completed' || j.status === 'Report Sent');

  // Available jobs in technician's branch to accept himself
  const availableJobs = jobs.filter(
    (j) =>
      !j.assignedTechnicianId &&
      (j.status === 'Created' || j.status === 'Draft') &&
      (!currentUser.branchId || j.branchId === currentUser.branchId)
  );

  // Completed history jobs
  const historyJobs = jobs.filter(
    (j) => j.assignedTechnicianId === currentUser.id && (j.status === 'Completed' || j.status === 'Report Sent' || j.status === 'Delivered/Closed')
  );

  // Summary KPI Calculations
  const completedTodayCount = historyJobs.filter((j) => {
    const d = new Date(j.updatedAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;

  const totalSecondsToday = myAssignedJobs.reduce((acc, j) => acc + (j.timerElapsedSeconds || 0), 0);
  const hoursTodayFormatted = (totalSecondsToday / 3600).toFixed(1);

  // Search filter
  const filterBySearch = (list: JobCard[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (j) =>
        j.jobNo.toLowerCase().includes(q) ||
        j.plateNumber.toLowerCase().includes(q) ||
        j.make.toLowerCase().includes(q) ||
        j.model.toLowerCase().includes(q)
    );
  };

  // ACTION: Accept Job
  const handleAcceptJob = (job: JobCard) => {
    const now = new Date().toISOString();
    updateJob(job.id, {
      assignedTechnicianId: currentUser.id,
      assignedTechnicianName: currentUser.name,
      status: 'Accepted',
      acceptedAt: now,
    });
    updateJobStatus(job.id, 'Accepted', `Accepted by technician ${currentUser.name}`);
    setSelectedJobId(job.id);
    setTechStep(2); // Advance to Before Photos
    AudioHapticService.playSuccessChime();
    addToast({
      type: 'success',
      title: language === 'ar' ? 'تم قبول أمر العمل' : 'Job Accepted',
      message: `Job #${job.jobNo} accepted. Proceed with mandatory before-repair photos.`,
    });
  };

  // ACTION: Reject Job
  const handleRejectJob = () => {
    if (!selectedJob || !rejectReasonText.trim()) return;
    updateJob(selectedJob.id, {
      assignedTechnicianId: undefined,
      assignedTechnicianName: undefined,
      status: 'Created',
      rejectReason: rejectReasonText,
    });
    updateJobStatus(selectedJob.id, 'Created', `Rejected by technician ${currentUser.name}: ${rejectReasonText}`);
    setIsRejectModalOpen(false);
    setSelectedJobId(null);
    setRejectReasonText('');
    addToast({
      type: 'info',
      title: 'Job Returned to Admin',
      message: 'Job was returned to the reception dispatcher pool.',
    });
  };

  // ACTION: Start Work Timer
  const handleStartTimer = () => {
    if (!selectedJob) return;
    const now = new Date().toISOString();
    const updatedTimerLogs: TimerLog[] = [
      ...(selectedJob.timerLogs || []),
      {
        id: `tl-${Date.now()}`,
        startedAt: now,
        durationSeconds: 0,
        technicianId: currentUser.id,
        technicianName: currentUser.name,
      },
    ];

    updateJob(selectedJob.id, {
      isTimerRunning: true,
      timerStartedAt: now,
      timerLogs: updatedTimerLogs,
      status: 'In Progress',
    });

    if (selectedJob.status !== 'In Progress') {
      updateJobStatus(selectedJob.id, 'In Progress', `Work commenced by ${currentUser.name}`);
    }

    AudioHapticService.playSuccessChime();
  };

  // ACTION: Pause Work Timer
  const handlePauseTimer = () => {
    if (!selectedJob) return;
    const now = new Date().toISOString();
    updateJob(selectedJob.id, {
      isTimerRunning: false,
      pauseReason,
      status: pauseReason === 'Waiting for parts' ? 'Waiting for Parts' : selectedJob.status,
    });

    if (pauseReason === 'Waiting for parts') {
      updateJobStatus(selectedJob.id, 'Waiting for Parts', `Paused by technician: ${pauseReason}`);
    }

    setIsPauseModalOpen(false);
    AudioHapticService.playWarningTone();
    addToast({
      type: 'warning',
      title: 'Work Timer Paused',
      message: `Timer paused. Reason: ${pauseReason}`,
    });
  };

  // ACTION: Stop Work Timer
  const handleStopTimer = () => {
    if (!selectedJob) return;
    updateJob(selectedJob.id, {
      isTimerRunning: false,
    });
    AudioHapticService.playSuccessChime();
  };

  // ACTION: Add Extra Work Recommendation
  const handleAddExtraWork = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !extraWorkDesc.trim()) return;

    const newItem: ExtraWorkItem = {
      id: `ew-${Date.now()}`,
      description: extraWorkDesc.trim(),
      estimatedParts: extraWorkParts.trim() || undefined,
      urgency: extraWorkUrgency,
      status: 'Pending Approval',
      requestedAt: new Date().toISOString(),
      requestedBy: currentUser.name,
    };

    const updated = [...(selectedJob.extraWorkItems || []), newItem];
    updateJob(selectedJob.id, {
      extraWorkItems: updated,
      status: 'Awaiting Customer Approval',
    });
    updateJobStatus(
      selectedJob.id,
      'Awaiting Customer Approval',
      `Extra work recommended by ${currentUser.name}: ${newItem.description} (${newItem.urgency})`
    );

    setIsExtraWorkModalOpen(false);
    setExtraWorkDesc('');
    setExtraWorkParts('');
    AudioHapticService.playSuccessChime();
    addToast({
      type: 'info',
      title: 'Extra Work Submitted',
      message: 'Notified supervisor and customer for authorization.',
    });
  };

  // ACTION: Add Part Used
  const handleAddPartUsed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !partName.trim()) return;

    const newPart: PartUsedItem = {
      id: `pu-${Date.now()}`,
      partName: partName.trim(),
      partNumber: partNumber.trim() || undefined,
      qty: partQty,
      brand: partBrand.trim() || 'Genuine',
      source: partSource,
      addedAt: new Date().toISOString(),
    };

    const updated = [...(selectedJob.partsUsedItems || []), newPart];
    updateJob(selectedJob.id, { partsUsedItems: updated });

    setIsAddPartModalOpen(false);
    setPartName('');
    setPartNumber('');
    setPartQty(1);
    setPartBrand('');
    AudioHapticService.playSuccessChime();
    addToast({
      type: 'success',
      message: `Part recorded: ${newPart.partName} (${newPart.qty}x)`,
    });
  };

  // ACTION: Toggle Quality Checklist Item
  const handleToggleChecklistItem = (key: keyof QualityChecklist) => {
    if (!selectedJob || selectedJob.status === 'Completed') return;
    const currentQc = selectedJob.qualityChecklist || defaultQualityChecklist;
    const updated = {
      ...currentQc,
      [key]: !currentQc[key],
    };
    updateJob(selectedJob.id, { qualityChecklist: updated });
    AudioHapticService.playSuccessChime();
  };

  // ACTION: Add Suggestion / Complaint Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || !noteText.trim()) return;

    addTechnicianNote(selectedJob.id, {
      type: noteType,
      severity: noteSeverity,
      text: noteText.trim(),
      photos: [],
      isInternalOnly: isNoteInternalOnly,
    });

    setNoteText('');
    AudioHapticService.playSuccessChime();
    addToast({
      type: noteType === 'safety' ? 'warning' : 'success',
      title: noteType === 'safety' ? 'Safety Concern Flagged' : 'Note Logged',
      message: 'Technician note added to job report.',
    });
  };

  // STRICT VALIDATION ENGINE: Checks before allowing "Finish Job"
  const validateJobCompletion = (): boolean => {
    if (!selectedJob) return false;

    const errors: Array<{ step: number; messageEn: string; messageAr: string }> = [];

    // Step 2 Before Photos check
    const beforeSideCount = selectedJob.photos.filter((p) => p.slotType?.endsWith('_before')).length;
    if (beforeSideCount < 4) {
      errors.push({
        step: 2,
        messageEn: `Missing 4-side BEFORE photos (${beforeSideCount}/4 captured)`,
        messageAr: `صور المحيط الأربعة قبل الصيانة ناقصة (${beforeSideCount}/4)`,
      });
    }

    const fuelBeforePhoto = selectedJob.photos.find((p) => p.slotType === 'fuel_before');
    if (!fuelBeforePhoto || !selectedJob.fuelBefore) {
      errors.push({
        step: 2,
        messageEn: 'BEFORE fuel gauge photo & reading level required',
        messageAr: 'صورة وتحديد مستوى الوقود قبل الصيانة مطلوبة',
      });
    }

    const odoBeforePhoto = selectedJob.photos.find((p) => p.slotType === 'odometer_before');
    if (!odoBeforePhoto || !selectedJob.odometerBefore) {
      errors.push({
        step: 2,
        messageEn: 'BEFORE odometer photo & reading in KM required',
        messageAr: 'صورة وقراءة عداد الكيلومترات قبل الصيانة مطلوبة',
      });
    }

    const beforeDetailCount = selectedJob.photos.filter(
      (p) => p.slotType === 'before_detail' || (p.type === 'before' && !p.slotType?.startsWith('side_'))
    ).length;
    if (beforeDetailCount < 5) {
      errors.push({
        step: 2,
        messageEn: `Missing 5 BEFORE work detail photos (${beforeDetailCount}/5 captured)`,
        messageAr: `صور تفاصيل العطل قبل الصيانة ناقصة (${beforeDetailCount}/5)`,
      });
    }

    // Step 3 Blueprint check
    if (!selectedJob.blueprintConfirmed) {
      errors.push({
        step: 3,
        messageEn: 'Vehicle blueprint damage inspection must be confirmed',
        messageAr: 'يجب تأكيد فحص مخطط أضرار المركبة',
      });
    }

    // Step 4 Timer check
    if (selectedJob.isTimerRunning) {
      errors.push({
        step: 4,
        messageEn: 'Active work timer must be stopped before finishing',
        messageAr: 'يجب إيقاف مؤقت العمل قبل إنهاء أمر الصيانة',
      });
    }

    // Step 5 After Photos check
    const afterSideCount = selectedJob.photos.filter((p) => p.slotType?.endsWith('_after')).length;
    if (afterSideCount < 4) {
      errors.push({
        step: 5,
        messageEn: `Missing 4-side AFTER photos (${afterSideCount}/4 captured)`,
        messageAr: `صور المحيط الأربعة بعد الصيانة ناقصة (${afterSideCount}/4)`,
      });
    }

    const fuelAfterPhoto = selectedJob.photos.find((p) => p.slotType === 'fuel_after');
    if (!fuelAfterPhoto || !selectedJob.fuelAfter) {
      errors.push({
        step: 5,
        messageEn: 'FINAL fuel gauge photo & reading level required',
        messageAr: 'صورة وتحديد مستوى الوقود النهائي بعد الصيانة مطلوبة',
      });
    }

    const odoAfterPhoto = selectedJob.photos.find((p) => p.slotType === 'odometer_after');
    if (!odoAfterPhoto || !selectedJob.odometerAfter) {
      errors.push({
        step: 5,
        messageEn: 'FINAL odometer photo & reading in KM required',
        messageAr: 'صورة وقراءة عداد الكيلومترات النهائي مطلوبة',
      });
    }

    const afterDetailCount = selectedJob.photos.filter(
      (p) => p.slotType === 'after_detail' || (p.type === 'after' && !p.slotType?.startsWith('side_'))
    ).length;
    if (afterDetailCount < 5) {
      errors.push({
        step: 5,
        messageEn: `Missing 5 AFTER work detail photos (${afterDetailCount}/5 captured)`,
        messageAr: `صور تفاصيل العمل بعد الصيانة ناقصة (${afterDetailCount}/5)`,
      });
    }

    // Step 5 Quality Checklist check (all 12 items must be true)
    const qc = selectedJob.qualityChecklist || defaultQualityChecklist;
    const missingQcKeys = Object.entries(qc).filter(([k, v]) => v === false);
    if (missingQcKeys.length > 0) {
      errors.push({
        step: 5,
        messageEn: `Quality checklist incomplete (${missingQcKeys.length} items unticked)`,
        messageAr: `قائمة فحص الجودة غير مكتملة (${missingQcKeys.length} بنود غير مؤكدة)`,
      });
    }

    // Step 6 Signature check
    if (!techSignatureData) {
      errors.push({
        step: 6,
        messageEn: 'Technician completion digital signature required',
        messageAr: 'التوقيع الرقمي للفني مطلوب لإغلاق أمر الصيانة',
      });
    }

    if (!techConfirmedCheck) {
      errors.push({
        step: 6,
        messageEn: 'You must check the confirmation checkbox',
        messageAr: 'يجب تأكيد الإقرار بصحة ودقة العمل المنجز',
      });
    }

    // Offline queue check
    if (OfflineQueueService.hasPendingUploads(selectedJob.id)) {
      errors.push({
        step: 2,
        messageEn: 'Offline photos are still synchronizing. Wait for upload to complete.',
        messageAr: 'الصور قيد المزامنة في الخلفية. انتظر اكتمال الرفع.',
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // ACTION: Complete & Finish Job
  const handleFinishJob = () => {
    if (!selectedJob) return;

    const isValid = validateJobCompletion();
    if (!isValid) {
      AudioHapticService.playWarningTone();
      return;
    }

    const now = new Date().toISOString();
    updateJob(selectedJob.id, {
      status: 'Completed',
      reportStatus: 'ready',
      isTimerRunning: false,
      completedAt: now,
      technicianSignature: techSignatureData || undefined,
      nextServiceDueKm: Number(recommendedKm) || undefined,
      nextServiceDueDate: recommendedDate || undefined,
      findings: findingsText,
    });

    updateJobStatus(
      selectedJob.id,
      'Completed',
      `Inspection and repair completed by ${currentUser.name}. Completion report ready for admin review.`
    );

    // Celebratory feedback
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });
    AudioHapticService.playSuccessChime();

    addToast({
      type: 'success',
      title: language === 'ar' ? 'تم إنهاء العمل بنجاح' : 'Job Completed Successfully!',
      message: 'Inspection report generated and sent to admin for WhatsApp dispatch.',
    });

    // Return to list after short pause
    setTimeout(() => {
      setSelectedJobId(null);
      setValidationErrors([]);
    }, 1200);
  };

  // LOAD DEMO DATA HANDLER
  const handleLoadTechnicianDemoData = () => {
    // Inject 3 realistic technician jobs
    const now = new Date().toISOString();
    const demoJobNew: JobCard = {
      id: `job-demo-new-${Date.now()}`,
      jobNo: 'DOH-2026-000881',
      branchId: currentUser.branchId || 'branch-doha',
      priority: 'Urgent',
      expectedDelivery: 'Today, 18:30',
      jobSource: 'Walk-in',
      status: 'Assigned',
      customerId: 'demo-cust-1',
      customerType: 'Individual',
      customerName: 'Sultan Al-Kuwari',
      customerQID: '28463400192',
      customerMobile: '+974 5511 8899',
      customerWhatsApp: '+974 5511 8899',
      customerNationality: 'Qatari',
      plateNumber: '849201',
      plateType: 'Private (خصوصي)',
      make: 'Toyota',
      model: 'Land Cruiser LC300 VXR',
      year: 2025,
      color: 'Pearl White',
      bodyType: 'SUV',
      fuelType: 'Petrol Super 95',
      transmission: 'Automatic 10-Speed',
      driveType: '4WD Full-Time',
      specification: 'GCC (عبدالغني وإخوانه)',
      vin: 'JTMHX01J8N4192084',
      odometerIn: 18240,
      fuelLevelIn: '3/4',
      numberOfKeys: 2,
      warningLights: ['TPMS Light'],
      complaint: 'Vibration under heavy braking from 120 km/h; AC blowing warm while idling.',
      services: [
        { id: 's-1', name: 'Front Brake Disc Skimming & Ceramic Pads', description: '', qty: 1, unitPrice: 450, discount: 0, total: 450 },
        { id: 's-2', name: 'AC Refrigerant Gas Pressure Inspection & Leak Test', description: '', qty: 1, unitPrice: 350, discount: 0, total: 350 },
      ],
      parts: [],
      subtotal: 800,
      discount: 0,
      taxPercent: 0,
      taxAmount: 0,
      totalEstimate: 800,
      advancePayment: 400,
      balanceDue: 400,
      paymentMethod: 'Card',
      receptionChecklist: {
        spareWheel: true,
        jackAndTools: true,
        floorMats: true,
        audioNavigation: true,
        documentsInGlovebox: true,
        valuablesRemoved: true,
        wheelLockNut: true,
      },
      damagePins: [
        {
          id: 'p-1',
          x: 45,
          y: 20,
          view: 'front',
          damageType: 'paint_chip',
          severity: 'minor',
          note: 'Stone chip on lower front bumper lip',
          createdAt: now,
          addedBy: 'Admin Reception',
        },
      ],
      photos: [],
      assignedTechnicianId: currentUser.id,
      assignedTechnicianName: currentUser.name,
      workshopBay: 'Bay 3 - Hydraulic Lift',
      supervisorName: 'Tariq Al-Mohannadi',
      internalNotes: 'Customer traveling on Salwa Road tonight. Prioritize brake rotor skim.',
      timerElapsedSeconds: 0,
      isTimerRunning: false,
      technicianNotes: [],
      whatsappConsent: true,
      timeline: [{ id: `tl-1`, status: 'Assigned', note: `Assigned to ${currentUser.name}`, changedBy: 'Admin', timestamp: now }],
      payments: [],
      createdAt: now,
      createdBy: 'Reception Dispatcher',
      updatedAt: now,
    };

    updateJob(demoJobNew.id, demoJobNew);
    addToast({
      type: 'success',
      title: 'Demo Scenario Loaded',
      message: 'Added fresh Urgent job #DOH-2026-000881 to your "New" tab to test Accept flow.',
    });
    AudioHapticService.playJobAssignedAlert();
  };

  // Mask customer phone for privacy
  const maskPhone = (phone: string = '') => {
    if (phone.length <= 6) return '••••••';
    return `${phone.slice(0, 4)}••••${phone.slice(-2)}`;
  };

  // Mask customer name (First name + Last initial)
  const maskName = (name: string = '') => {
    const parts = name.trim().split(' ');
    if (parts.length <= 1) return name;
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 font-sans text-slate-800">
      {/* OFFLINE / SYNC QUEUE BANNER */}
      {(!isOnline || pendingQueueCount > 0) && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between sticky top-0 z-40 shadow-xs mb-3 rounded-xl">
          <div className="flex items-center gap-2">
            {!isOnline ? <WifiOff className="w-4 h-4 shrink-0" /> : <RefreshCw className="w-4 h-4 animate-spin shrink-0" />}
            <span>
              {!isOnline
                ? (language === 'ar' ? 'أنت غير متصل بالإنترنت. الصور محفوظة في الهاتف.' : 'Offline mode active. Photos queued locally on device.')
                : (language === 'ar' ? `جارٍ مزامنة ${pendingQueueCount} صور في الخلفية...` : `Syncing ${pendingQueueCount} photos to cloud...`)}
            </span>
          </div>
          {isOnline && (
            <button
              type="button"
              onClick={() => OfflineQueueService.processQueue((id, p) => addPhoto(id, p))}
              className="px-2 py-0.5 bg-slate-900 text-white rounded text-[10px] font-bold cursor-pointer"
            >
              Sync Now
            </button>
          )}
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B3A6E] text-white flex items-center justify-center font-black text-sm shadow-xs">
            <Wrench className="w-5 h-5 text-teal-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">{currentUser.name}</h2>
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Live Connected" />
            </div>
            <p className="text-[11px] text-slate-500">
              {branches.find((b) => b.id === currentUser.branchId)?.nameEn || 'Doha Salwa Road Branch'} • {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound / Mute toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-teal-50 border-teal-200 text-teal-800'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Quick Demo Scenario Loader */}
          <button
            type="button"
            onClick={handleLoadTechnicianDemoData}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            title="Load realistic urgent test job"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Demo Job</span>
          </button>
        </div>
      </div>

      {/* VIEW: JOB DETAIL 6-STEP FLOW (when a job is selected) */}
      {selectedJob ? (
        <div className="space-y-4">
          {/* TOP BACK BAR & STATUS HEADER */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedJobId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#0B3A6E] hover:text-teal-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'ar' ? 'العودة لجميع المهام' : 'All Jobs'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase ${
                  selectedJob.priority === 'VIP'
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : selectedJob.priority === 'Urgent'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {selectedJob.priority}
              </span>

              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  selectedJob.status === 'In Progress'
                    ? 'bg-teal-100 text-teal-800'
                    : selectedJob.status === 'Completed'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedJob.status === 'Assigned'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {selectedJob.status}
              </span>
            </div>
          </div>

          {/* VEHICLE QUICK INFO CARD */}
          <div className="bg-[#0B3A6E] text-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-300 block mb-0.5">
                Job #{selectedJob.jobNo} • Bay {selectedJob.workshopBay || '1'}
              </span>
              <h3 className="text-base font-black tracking-tight">
                {selectedJob.year} {selectedJob.make} {selectedJob.model}
              </h3>
              <p className="text-xs text-slate-200 flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold bg-white/10 px-1.5 py-0.5 rounded">
                  Plate: {selectedJob.plateNumber}
                </span>
                <span>• {selectedJob.color}</span>
              </p>
            </div>

            {/* LIVE WORK TIMER DISPLAY */}
            <div className="text-right">
              <span className="text-[10px] text-teal-200 font-bold block mb-0.5 uppercase">
                Bay Time Elapsed
              </span>
              <div className="text-lg font-black font-mono tracking-wider text-teal-300 flex items-center justify-end gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTimer(selectedJob.timerElapsedSeconds)}</span>
              </div>
            </div>
          </div>

          {/* 6-STEP HORIZONTAL PROGRESS BAR */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-1">
              {[
                { step: 1, label: language === 'ar' ? 'قبول' : 'Accept' },
                { step: 2, label: language === 'ar' ? 'قبل' : 'Before' },
                { step: 3, label: language === 'ar' ? 'المخطط' : 'Blueprint' },
                { step: 4, label: language === 'ar' ? 'الصيانة' : 'Repair' },
                { step: 5, label: language === 'ar' ? 'بعد' : 'After & QC' },
                { step: 6, label: language === 'ar' ? 'إنهاء' : 'Finish' },
              ].map((s) => {
                const isCurrent = techStep === s.step;
                const isPast = techStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setTechStep(s.step)}
                    className={`flex-1 py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isCurrent
                        ? 'bg-[#0B3A6E] text-white shadow-xs font-bold'
                        : isPast
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                        isCurrent
                          ? 'bg-teal-400 text-slate-950'
                          : isPast
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isPast ? <Check className="w-3 h-3" /> : s.step}
                    </span>
                    <span className="text-[10px] truncate max-w-[50px]">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VALIDATION ERROR BANNER (if Finish was attempted with missing items) */}
          {validationErrors.length > 0 && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2 mb-2 font-bold text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {language === 'ar'
                    ? `يرجى إكمال المتطلبات الإلزامية التالية (${validationErrors.length}):`
                    : `Please satisfy all mandatory workshop requirements (${validationErrors.length} remaining):`}
                </span>
              </div>
              <ul className="space-y-1.5 text-xs">
                {validationErrors.map((err, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setTechStep(err.step);
                      AudioHapticService.playWarningTone();
                    }}
                    className="flex items-center justify-between p-2 bg-white/80 rounded-xl border border-rose-200 hover:bg-white cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                        {err.step}
                      </span>
                      <span className="font-semibold text-rose-900">
                        {language === 'ar' ? err.messageAr : err.messageEn}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase flex items-center gap-0.5">
                      <span>Jump</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* STEP 1: JOB SUMMARY AND ACCEPT / REJECT */}
          {techStep === 1 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'تفاصيل أمر العمل وملاحظات الاستقبال' : 'Job Reception Summary & Dispatch'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Expected Delivery: <strong className="text-slate-800">{selectedJob.expectedDelivery}</strong>
                  </p>
                </div>

                {/* Customer Privacy Masked View */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                    <span className="font-bold text-slate-800">{maskName(selectedJob.customerName)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone</span>
                    <span className="font-mono text-slate-600">{maskPhone(selectedJob.customerMobile)}</span>
                  </div>
                </div>

                {/* Complaint */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <span className="text-[10px] uppercase font-black text-amber-800 block mb-1">
                    Customer Reported Complaint / Issue
                  </span>
                  <p className="text-xs font-semibold text-amber-950 leading-relaxed">
                    "{selectedJob.complaint}"
                  </p>
                </div>

                {/* Requested Services */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Authorized Scope of Work ({selectedJob.services.length} services):
                  </span>
                  <div className="space-y-2">
                    {selectedJob.services.map((srv, idx) => (
                      <div
                        key={srv.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#0B3A6E] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{srv.name}</p>
                          {srv.description && <p className="text-[11px] text-slate-500">{srv.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Admin Internal Notes */}
                {selectedJob.internalNotes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950">
                    <span className="font-bold block text-blue-900 mb-0.5">Supervisor Instruction:</span>
                    <p>{selectedJob.internalNotes}</p>
                  </div>
                )}
              </div>

              {/* Accept & Reject Action Buttons */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
                {selectedJob.status === 'Assigned' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAcceptJob(selectedJob)}
                      className="flex-1 min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                      <span>{language === 'ar' ? 'قبول أمر العمل والبدء' : 'Accept Job & Begin Inspection'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRejectModalOpen(true)}
                      className="min-h-[52px] px-5 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{language === 'ar' ? 'اعتذار / لا يمكنني التنفيذ' : 'Reject / Cannot Do'}</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTechStep(2)}
                    className="w-full min-h-[50px] py-3.5 bg-[#0B3A6E] hover:bg-[#082b52] text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{language === 'ar' ? 'متابعة إلى صور ما قبل الصيانة' : 'Proceed to Step 2: Before Photos'}</span>
                    <ArrowRight className="w-4 h-4 text-teal-300" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: BEFORE-REPAIR PHOTOS */}
          {techStep === 2 && (
            <div className="space-y-4">
              <GuidedPhotoCapture
                jobNo={selectedJob.jobNo}
                plate={selectedJob.plateNumber}
                stage="BEFORE"
                photos={selectedJob.photos}
                onAddPhoto={(photo) => addPhoto(selectedJob.id, photo)}
                onDeletePhoto={(photoId) => deletePhoto(selectedJob.id, photoId)}
                fuelLevel={selectedJob.fuelBefore}
                onFuelChange={(lvl) => updateJob(selectedJob.id, { fuelBefore: lvl })}
                odometerReading={selectedJob.odometerBefore}
                onOdometerChange={(odo) => updateJob(selectedJob.id, { odometerBefore: odo })}
                receptionOdometer={selectedJob.odometerIn}
                language={language}
                readOnly={selectedJob.status === 'Completed'}
              />

              {/* Sticky Next Button */}
              <div className="sticky bottom-20 z-30 p-2 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-lg">
                <button
                  type="button"
                  onClick={() => setTechStep(3)}
                  className="w-full min-h-[50px] py-3.5 bg-[#0B3A6E] hover:bg-[#082b52] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                >
                  <span>{language === 'ar' ? 'متابعة إلى مخطط أضرار المركبة' : 'Continue to Step 3: Vehicle Blueprint'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VEHICLE BLUEPRINT (DAMAGE MAP) */}
          {techStep === 3 && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {language === 'ar' ? 'فحص ومخطط أضرار الهيكل الخارجي' : 'Vehicle Body Condition Blueprint'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {language === 'ar'
                        ? 'انقر على المخطط لتسجيل أية خدوش، صدمات أو تقشير قبل بدء الإصلاح.'
                        : 'Tap on car diagram to add damage pins. Confirm condition to proceed.'}
                    </p>
                  </div>
                  {selectedJob.blueprintConfirmed && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Confirmed</span>
                    </span>
                  )}
                </div>

                <CarBlueprintDiagram
                  pins={selectedJob.damagePins}
                  onAddPin={(pin) => addDamagePin(selectedJob.id, pin)}
                  onDeletePin={(pinId) => deleteDamagePin(selectedJob.id, pinId)}
                  readOnly={selectedJob.status === 'Completed'}
                />

                {/* Blueprint Confirmation Check */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={selectedJob.status === 'Completed'}
                    onClick={() => {
                      updateJob(selectedJob.id, { blueprintConfirmed: true });
                      AudioHapticService.playSuccessChime();
                      addToast({
                        type: 'success',
                        message: 'Vehicle blueprint inspection condition confirmed.',
                      });
                    }}
                    className={`w-full min-h-[48px] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      selectedJob.blueprintConfirmed
                        ? 'bg-emerald-50 text-emerald-800 border-2 border-emerald-300'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {selectedJob.blueprintConfirmed
                        ? (language === 'ar' ? 'تم تأكيد فحص أضرار الهيكل' : 'Vehicle Condition Confirmed')
                        : (language === 'ar' ? 'أؤكد مطابقة فحص أضرار الهيكل للمركبة' : 'I Confirm Vehicle Condition is Recorded')}
                    </span>
                  </button>
                </div>
              </div>

              {/* Sticky Next Button */}
              <div className="sticky bottom-20 z-30 p-2 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-lg">
                <button
                  type="button"
                  onClick={() => setTechStep(4)}
                  className="w-full min-h-[50px] py-3.5 bg-[#0B3A6E] hover:bg-[#082b52] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                >
                  <span>{language === 'ar' ? 'متابعة إلى تشخيص وتنفيذ الصيانة' : 'Continue to Step 4: Diagnosis & Repair'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: DIAGNOSIS, TIMER AND REPAIR WORK */}
          {techStep === 4 && (
            <div className="space-y-4">
              {/* BIG WORK TIMER PANEL */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Active Bay Labor Timer
                </span>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl font-black font-mono tracking-wider text-[#0B3A6E]">
                    {formatTimer(selectedJob.timerElapsedSeconds)}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                      selectedJob.isTimerRunning
                        ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedJob.isTimerRunning ? 'bg-emerald-600' : 'bg-slate-400'
                      }`}
                    />
                    <span>{selectedJob.isTimerRunning ? 'Running' : 'Paused / Stopped'}</span>
                  </span>
                </div>

                {/* Big Timer Buttons (Min 48px height) */}
                <div className="grid grid-cols-2 gap-3">
                  {!selectedJob.isTimerRunning ? (
                    <button
                      type="button"
                      onClick={handleStartTimer}
                      disabled={selectedJob.status === 'Completed'}
                      className="min-h-[52px] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>{selectedJob.timerElapsedSeconds > 0 ? 'Resume Timer' : 'Start Timer'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPauseModalOpen(true)}
                      className="min-h-[52px] py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
                    >
                      <Pause className="w-5 h-5 fill-current" />
                      <span>Pause Timer</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleStopTimer}
                    disabled={!selectedJob.isTimerRunning}
                    className="min-h-[52px] py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    <span>Stop Timer</span>
                  </button>
                </div>
              </div>

              {/* DIAGNOSTIC FINDINGS & VOICE-TO-TEXT */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'الملاحظات والنتائج الفنية' : 'Diagnostic Findings & Observations'}
                  </h3>
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isListeningVoice
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-teal-50 text-teal-800 border border-teal-200'
                    }`}
                  >
                    {isListeningVoice ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isListeningVoice ? 'Listening...' : 'Voice-to-Text'}</span>
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={findingsText}
                  onChange={(e) => {
                    setFindingsText(e.target.value);
                    updateJob(selectedJob.id, { findings: e.target.value });
                  }}
                  placeholder="Record your observations, mechanical condition or electrical readings..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0E9AA7] focus:outline-none"
                />

                {/* Quick-Pick Findings */}
                <div>
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    Quick-pick common findings:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Brake pads worn down to 2mm',
                      'Oil weeping at valve cover',
                      'Battery health 68% (12.1V)',
                      'AC low side pressure 28 PSI',
                      'Front control arm bushing torn',
                      'Air filter clogged with sand',
                    ].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => {
                          const updated = findingsText ? `${findingsText}. ${f}` : f;
                          setFindingsText(updated);
                          updateJob(selectedJob.id, { findings: updated });
                        }}
                        className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer"
                      >
                        + {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RECOMMENDED EXTRA WORK BUTTON */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'أعمال إضافية تتطلب موافقة العميل' : 'Recommended Extra Work'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsExtraWorkModalOpen(true)}
                    className="px-3 py-1.5 bg-[#0B3A6E] text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Extra Work</span>
                  </button>
                </div>

                {selectedJob.extraWorkItems && selectedJob.extraWorkItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedJob.extraWorkItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{item.description}</p>
                          <p className="text-[11px] text-slate-500">Urgency: {item.urgency}</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No extra work logged yet.</p>
                )}
              </div>

              {/* PARTS USED */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'قطع الغيار والمستهلكات المستخدمة' : 'Parts & Consumables Used'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddPartModalOpen(true)}
                    className="px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Record Part</span>
                  </button>
                </div>

                {selectedJob.partsUsedItems && selectedJob.partsUsedItems.length > 0 ? (
                  <div className="space-y-2">
                    {selectedJob.partsUsedItems.map((part) => (
                      <div
                        key={part.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{part.partName}</p>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {part.partNumber ? `P/N: ${part.partNumber} • ` : ''}
                            {part.brand} • Source: {part.source}
                          </p>
                        </div>
                        <span className="font-black text-slate-800 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {part.qty}x
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No parts recorded yet.</p>
                )}
              </div>

              {/* Sticky Next Button */}
              <div className="sticky bottom-20 z-30 p-2 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-lg">
                <button
                  type="button"
                  onClick={() => setTechStep(5)}
                  className="w-full min-h-[50px] py-3.5 bg-[#0B3A6E] hover:bg-[#082b52] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                >
                  <span>{language === 'ar' ? 'متابعة إلى صور ما بعد الصيانة وفحص الجودة' : 'Continue to Step 5: After Photos & QC'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: AFTER-REPAIR PHOTOS AND QUALITY CHECKLIST */}
          {techStep === 5 && (
            <div className="space-y-4">
              {/* After Photos Component */}
              <GuidedPhotoCapture
                jobNo={selectedJob.jobNo}
                plate={selectedJob.plateNumber}
                stage="AFTER"
                photos={selectedJob.photos}
                onAddPhoto={(photo) => addPhoto(selectedJob.id, photo)}
                onDeletePhoto={(photoId) => deletePhoto(selectedJob.id, photoId)}
                fuelLevel={selectedJob.fuelAfter}
                onFuelChange={(lvl) => updateJob(selectedJob.id, { fuelAfter: lvl })}
                odometerReading={selectedJob.odometerAfter}
                onOdometerChange={(odo) => updateJob(selectedJob.id, { odometerAfter: odo })}
                receptionOdometer={selectedJob.odometerBefore || selectedJob.odometerIn}
                language={language}
                readOnly={selectedJob.status === 'Completed'}
              />

              {/* 12-ITEM QUALITY CHECKLIST */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>
                        {language === 'ar' ? 'قائمة الفحص النهائي ومطابقة الجودة' : 'Final Workshop Quality Assurance Checklist'}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {language === 'ar'
                        ? 'يجب تأكيد واجتياز جميع البنود قبل تسليم المركبة.'
                        : 'Every safety and quality check must be completed before job closure.'}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {Object.values(selectedJob.qualityChecklist || defaultQualityChecklist).filter(Boolean).length} / 12 Checked
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'roadTestCompleted', labelEn: 'Road test completed & verified', labelAr: 'تم إجراء الفحص وتجربة القيادة بنجاح' },
                    { key: 'noFluidLeaks', labelEn: 'Zero fluid / oil / coolant leaks', labelAr: 'التأكد من عدم وجود أية تهريبات سوائل أو زيوت' },
                    { key: 'fluidsChecked', labelEn: 'All fluid levels checked & topped up', labelAr: 'فحص ومطابقة مستويات جميع الزيوت والسوائل' },
                    { key: 'tyrePressureChecked', labelEn: 'Tyre pressure set to factory spec', labelAr: 'ضبط ضغط الإطارات حسب معايير المصنع' },
                    { key: 'lightsAndSignalsOk', labelEn: 'All exterior lights & signals verified', labelAr: 'فحص الأنوار والإشارات وسلامة الإضاءة' },
                    { key: 'acCoolingVerified', labelEn: 'AC cooling & vent temps verified', labelAr: 'فحص كفاءة تبريد المكيف والمراوح' },
                    { key: 'warningLightsCleared', labelEn: 'Dashboard warning lights cleared', labelAr: 'مسح وإطفاء لمبات التحذير من لوحة العدادات' },
                    { key: 'cleanedInterior', labelEn: 'Vehicle interior vacuumed & wiped', labelAr: 'تنظيف المقصورة الداخلية للمركبة بالكامل' },
                    { key: 'cleanedExterior', labelEn: 'Exterior washed and inspected', labelAr: 'غسيل وتلميع هيكل المركبة الخارجي' },
                    { key: 'workshopToolsRemoved', labelEn: 'All technician tools & rags removed', labelAr: 'إزالة أدوات الصيانة والخرق من المركبة' },
                    { key: 'customerBelongingsReturned', labelEn: 'Customer personal belongings returned', labelAr: 'التأكد من سلامة وإرجاع متعلقات العميل' },
                    { key: 'oldPartsKeptIfRequested', labelEn: 'Replaced old parts tagged / kept', labelAr: 'حفظ القطع القديمة المستبدلة في حال طلبها' },
                  ].map((item) => {
                    const qc = selectedJob.qualityChecklist || defaultQualityChecklist;
                    const isChecked = qc[item.key as keyof QualityChecklist] === true;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        disabled={selectedJob.status === 'Completed'}
                        onClick={() => handleToggleChecklistItem(item.key as keyof QualityChecklist)}
                        className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-emerald-600 text-white'
                              : 'border-2 border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs leading-snug">
                          {language === 'ar' ? item.labelAr : item.labelEn}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sticky Next Button */}
              <div className="sticky bottom-20 z-30 p-2 bg-white/95 backdrop-blur-xs rounded-2xl border border-slate-200 shadow-lg">
                <button
                  type="button"
                  onClick={() => setTechStep(6)}
                  className="w-full min-h-[50px] py-3.5 bg-[#0B3A6E] hover:bg-[#082b52] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-98"
                >
                  <span>{language === 'ar' ? 'متابعة إلى الملاحظات والتوقيع والإنهاء' : 'Continue to Step 6: Notes, Sign & Finish'}</span>
                  <ArrowRight className="w-4 h-4 text-teal-300" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: SUGGESTIONS, COMPLAINTS, SIGNATURE AND FINISH */}
          {techStep === 6 && (
            <div className="space-y-4">
              {/* SUGGESTIONS & COMPLAINTS FORM */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'المقترحات، الشكاوى وملاحظات السلامة' : 'Suggestions, Complaints & Safety Concerns'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {language === 'ar'
                      ? 'سجل التوصيات الموجهة للعميل، أو ملاحظات السلامة الحرجة للإدارة.'
                      : 'Log advice for the customer report or internal safety flags for management.'}
                  </p>
                </div>

                <form onSubmit={handleAddNote} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Category Type
                      </label>
                      <select
                        value={noteType}
                        onChange={(e) => setNoteType(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                      >
                        <option value="suggestion">Customer Suggestion (اقتراح للعميل)</option>
                        <option value="safety">Safety Hazard Concern (تنبيه سلامة حرج)</option>
                        <option value="complaint">Vehicle Condition Complaint (شكوى)</option>
                        <option value="internal">Internal Management Only (داخلي)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Severity Level
                      </label>
                      <select
                        value={noteSeverity}
                        onChange={(e) => setNoteSeverity(e.target.value as any)}
                        className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                      >
                        <option value="low">Low (منخفض)</option>
                        <option value="medium">Medium (متوسط)</option>
                        <option value="high">High (مرتفع)</option>
                        <option value="critical">Critical (حرج وفوري)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Note Description
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="e.g. Recommend replacing front tires within 3,000 km due to inner sidewall wear..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Customer vs Internal Visibility Switch */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700">
                      {isNoteInternalOnly
                        ? '🔒 Internal Only (Hidden from customer report)'
                        : '👁️ Visible to Customer on WhatsApp Report'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNoteInternalOnly(!isNoteInternalOnly)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        isNoteInternalOnly
                          ? 'bg-amber-600 text-white'
                          : 'bg-[#0B3A6E] text-white'
                      }`}
                    >
                      {isNoteInternalOnly ? 'Make Visible' : 'Make Internal'}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                    >
                      Add Note Entry
                    </button>
                  </div>
                </form>

                {/* Existing Notes List */}
                {selectedJob.technicianNotes && selectedJob.technicianNotes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedJob.technicianNotes.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-xl border text-xs ${
                          n.type === 'safety'
                            ? 'bg-rose-50 border-rose-200 text-rose-950 font-semibold'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="uppercase text-[10px] font-bold tracking-wider">
                            {n.type} • {n.severity}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {n.isInternalOnly ? 'Internal only' : 'Customer visible'}
                          </span>
                        </div>
                        <p>{n.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* NEXT SERVICE RECOMMENDATION */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">
                  {language === 'ar' ? 'توصيات موعد الصيانة القادمة' : 'Recommended Next Service Due'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Due at Odometer (KM)
                    </label>
                    <input
                      type="number"
                      value={recommendedKm}
                      onChange={(e) => {
                        setRecommendedKm(e.target.value ? Number(e.target.value) : '');
                        updateJob(selectedJob.id, { nextServiceDueKm: Number(e.target.value) });
                      }}
                      placeholder="e.g. 95000"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Due by Date
                    </label>
                    <input
                      type="date"
                      value={recommendedDate}
                      onChange={(e) => {
                        setRecommendedDate(e.target.value);
                        updateJob(selectedJob.id, { nextServiceDueDate: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* FINAL CONFIRMATION & DIGITAL SIGNATURE */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'ar' ? 'توقيع الفني وإغلاق أمر الصيانة' : 'Technician Sign-Off & Official Handover'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Signing closes the bay workflow and compiles the automated Completion Report for Admin WhatsApp dispatch.
                  </p>
                </div>

                {/* Confirmation Checkbox */}
                <label className="flex items-start gap-3 p-3 bg-teal-50/70 border border-teal-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={techConfirmedCheck}
                    onChange={(e) => setTechConfirmedCheck(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 mt-0.5 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-teal-950 leading-relaxed">
                    {language === 'ar'
                      ? 'أقر بأن جميع الأعمال وقطع الغيار المذكورة تم تركيبها وفحصها طبقاً لأعلى معايير السلامة والجودة القطرية.'
                      : 'I confirm that all repair work, fluid levels, quality checks and photographic evidence are accurate and verified.'}
                  </span>
                </label>

                {/* Digital Signature Pad */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Technician Digital Signature:
                  </label>
                  <SignaturePad
                    initialSignature={techSignatureData || undefined}
                    onSave={(sigUrl) => {
                      setTechSignatureData(sigUrl);
                      updateJob(selectedJob.id, { technicianSignature: sigUrl });
                      AudioHapticService.playSuccessChime();
                    }}
                    label="Sign inside the box using finger or stylus"
                    readOnly={selectedJob.status === 'Completed'}
                  />
                </div>

                {/* FINISH JOB BIG BUTTON (Large 52px target) */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFinishJob}
                    disabled={selectedJob.status === 'Completed'}
                    className="w-full min-h-[54px] py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-base font-extrabold shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                    <span>
                      {selectedJob.status === 'Completed'
                        ? (language === 'ar' ? 'تم إنهاء وتوثيق أمر العمل' : 'Job Closed & Published')
                        : (language === 'ar' ? 'إنهاء أمر العمل وإرسال التقرير للإدارة' : 'Finish Job & Submit Completion Report')}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* HOME SCREEN: TABS VIEW (Jobs / Available / History / Profile) */
        <div className="space-y-4">
          {/* SEARCH BAR (Only on Jobs and Available tabs) */}
          {(activeBottomTab === 'jobs' || activeBottomTab === 'available') && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ar'
                    ? 'بحث برقم اللوحة أو رقم بطاقة العمل...'
                    : 'Search by plate number or job number (e.g. 849201)...'
                }
                className="w-full pl-10 pr-4 py-3 min-h-[48px] bg-white border border-slate-200 rounded-2xl text-xs font-semibold placeholder:text-slate-400 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0E9AA7]"
              />
            </div>
          )}

          {/* TAB 1: MY JOBS */}
          {activeBottomTab === 'jobs' && (
            <div className="space-y-4">
              {/* SUMMARY KPI CARDS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Assigned to me
                  </span>
                  <p className="text-xl font-black text-[#0B3A6E]">{myAssignedJobs.length}</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    In Progress
                  </span>
                  <p className="text-xl font-black text-teal-700">{inProgressJobs.length}</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Completed Today
                  </span>
                  <p className="text-xl font-black text-emerald-700">{completedTodayCount}</p>
                </div>

                <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Hours Worked
                  </span>
                  <p className="text-xl font-black text-amber-700">{hoursTodayFormatted} hrs</p>
                </div>
              </div>

              {/* SECTION: NEW - WAITING FOR YOU TO ACCEPT (HIGHLIGHTED) */}
              {pendingAcceptJobs.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>{language === 'ar' ? 'مهام جديدة بانتظار قبولك' : 'New - Waiting for You to Accept'}</span>
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                      {pendingAcceptJobs.length} New
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {filterBySearch(pendingAcceptJobs).map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-2xl p-4 border-2 border-rose-300 shadow-sm relative overflow-hidden flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#0B3A6E]">{job.jobNo}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800">
                            {job.priority} Priority
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            {job.year} {job.make} {job.model}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">
                            Plate: <strong className="text-slate-800">{job.plateNumber}</strong> ({job.plateType})
                          </p>
                        </div>

                        {/* Complaint & Services */}
                        <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-600">
                          <span className="font-semibold block text-slate-800 mb-0.5">Complaint:</span>
                          <p className="truncate">"{job.complaint}"</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {job.services.slice(0, 2).map((s) => (
                              <span key={s.id} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium">
                                {s.name}
                              </span>
                            ))}
                            {job.services.length > 2 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                                +{job.services.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Accept Button */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAcceptJob(job)}
                            className="flex-1 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{language === 'ar' ? 'قبول أمر العمل' : 'Accept Job'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedJobId(job.id);
                              setTechStep(1);
                            }}
                            className="min-h-[48px] px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: IN PROGRESS JOBS */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
                  {language === 'ar' ? 'قيد التنفيذ حالياً' : 'In Progress'} ({inProgressJobs.length})
                </h3>

                {inProgressJobs.length > 0 ? (
                  <div className="space-y-2.5">
                    {filterBySearch(inProgressJobs).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setTechStep(4);
                        }}
                        className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-[#0E9AA7] transition-all cursor-pointer flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#0B3A6E]">{job.jobNo}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                            {job.status}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-slate-900">
                            {job.year} {job.make} {job.model}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono">
                            Plate: <strong>{job.plateNumber}</strong> • Bay {job.workshopBay || '1'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-1.5 text-teal-700 font-bold font-mono">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatTimer(job.timerElapsedSeconds)}</span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 font-bold text-[11px]">
                            <span>Continue</span>
                            <ChevronRight className="w-4 h-4 text-[#0E9AA7]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                    No jobs currently in progress.
                  </div>
                )}
              </div>

              {/* SECTION: WAITING FOR PARTS */}
              {waitingPartsJobs.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 px-1">
                    {language === 'ar' ? 'بانتظار قطع الغيار أو الاعتماد' : 'Waiting for Parts / Approval'} ({waitingPartsJobs.length})
                  </h3>
                  <div className="space-y-2.5">
                    {filterBySearch(waitingPartsJobs).map((job) => (
                      <div
                        key={job.id}
                        onClick={() => {
                          setSelectedJobId(job.id);
                          setTechStep(4);
                        }}
                        className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200 shadow-2xs hover:border-amber-400 transition-all cursor-pointer flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-slate-800">{job.jobNo}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            {job.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {job.year} {job.make} {job.model} (Plate: {job.plateNumber})
                        </h4>
                        <p className="text-xs text-amber-900">
                          Pause reason: {job.pauseReason || 'Pending stock arrival'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AVAILABLE JOBS (Unassigned jobs in technician's branch) */}
          {activeBottomTab === 'available' && (
            <div className="space-y-3">
              <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl text-xs text-teal-950">
                <span className="font-bold block mb-1">
                  {language === 'ar' ? 'أوامر عمل بانتظار استلام الفني' : 'Available Unassigned Jobs'}
                </span>
                <p>
                  {language === 'ar'
                    ? 'هذه المهام مفتوحة في فرعك. يمكنك قبول أي مهمة لبدء فحصها وإنجازها فوراً.'
                    : 'Unassigned jobs at your branch ready to be taken. One technician can claim each job.'}
                </p>
              </div>

              {availableJobs.length > 0 ? (
                <div className="space-y-3">
                  {filterBySearch(availableJobs).map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#0B3A6E]">{job.jobNo}</span>
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-700">
                          {job.priority} Priority
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900">
                          {job.year} {job.make} {job.model}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono">
                          Plate: <strong className="text-slate-800">{job.plateNumber}</strong> ({job.plateType})
                        </p>
                      </div>

                      <div className="p-2 bg-slate-50 rounded-xl text-xs text-slate-600">
                        <span className="font-bold block text-slate-800">Complaint:</span>
                        <p className="truncate">"{job.complaint}"</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAcceptJob(job)}
                        className="w-full min-h-[48px] bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Claim & Accept Job</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  No unassigned jobs currently waiting in your branch pool.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeBottomTab === 'history' && (
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Completed Service History</h3>
                  <p className="text-xs text-slate-500">Total jobs delivered: {historyJobs.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Check className="w-5 h-5" />
                </div>
              </div>

              {historyJobs.length > 0 ? (
                <div className="space-y-2.5">
                  {historyJobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => {
                        setSelectedJobId(job.id);
                        setTechStep(6);
                      }}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between cursor-pointer hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-[#0B3A6E]">{job.jobNo}</span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                          {job.year} {job.make} {job.model}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Plate: {job.plateNumber} • Time: {formatTimer(job.timerElapsedSeconds)}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                          {job.status}
                        </span>
                        {job.customerRating && (
                          <div className="flex items-center gap-0.5 text-amber-500 justify-end mt-1 text-xs">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{job.customerRating} / 5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  No completed jobs in history yet.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE */}
          {activeBottomTab === 'profile' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0B3A6E] text-white flex items-center justify-center font-black text-xl shadow-md">
                  {currentUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentUser.name}</h3>
                  <p className="text-xs text-teal-700 font-semibold">{currentUser.role} • Master Technician</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.phone || '+974 3311 4455'}</p>
                </div>
              </div>

              {/* Monthly Performance Stats */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monthly Performance Dashboard
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Delivered</span>
                    <strong className="text-lg font-black text-slate-900">{historyJobs.length + 18}</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Avg Time / Job</span>
                    <strong className="text-lg font-black text-slate-900">1h 45m</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Photos Taken</span>
                    <strong className="text-lg font-black text-slate-900">
                      {historyJobs.reduce((acc, j) => acc + j.photos.length, 0) + 142}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Language Switch */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#0E9AA7]" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'ar' ? 'لغة الواجهة (العربية / English)' : 'Interface Language'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
                >
                  {language === 'en' ? 'العربية' : 'English'}
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full min-h-[50px] py-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل الخروج من الحساب' : 'Sign Out of Technician Account'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* FIXED BOTTOM NAVIGATION BAR (Large touch targets, always accessible) */}
      {!selectedJob && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveBottomTab('jobs')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeBottomTab === 'jobs' ? 'text-[#0B3A6E] font-bold' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <Wrench className="w-5 h-5" />
              {pendingAcceptJobs.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                  {pendingAcceptJobs.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">{language === 'ar' ? 'مهامي' : 'My Jobs'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('available')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeBottomTab === 'available' ? 'text-[#0B3A6E] font-bold' : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <Layers className="w-5 h-5" />
              {availableJobs.length > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 bg-teal-600 text-white rounded-full text-[9px] font-black flex items-center justify-center">
                  {availableJobs.length}
                </span>
              )}
            </div>
            <span className="text-[10px]">{language === 'ar' ? 'المتاحة' : 'Available'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('history')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeBottomTab === 'history' ? 'text-[#0B3A6E] font-bold' : 'text-slate-400'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px]">{language === 'ar' ? 'السجل' : 'History'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('profile')}
            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
              activeBottomTab === 'profile' ? 'text-[#0B3A6E] font-bold' : 'text-slate-400'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px]">{language === 'ar' ? 'الملف' : 'Profile'}</span>
          </button>
        </div>
      )}

      {/* MODAL: Timer Pause Reason */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Pause className="w-5 h-5" />
              <span>Select Reason for Pausing Labor Timer</span>
            </div>

            <div className="space-y-2">
              {(['Waiting for parts', 'Waiting for approval', 'Break', 'Other'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setPauseReason(r)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-bold transition-all cursor-pointer ${
                    pauseReason === r
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPauseModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePauseTimer}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Pause
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Job */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Reason for Rejecting Job</span>
            </div>
            <p className="text-xs text-slate-500">
              The job will be returned to the workshop reception pool for reassignment.
            </p>

            <textarea
              rows={3}
              required
              value={rejectReasonText}
              onChange={(e) => setRejectReasonText(e.target.value)}
              placeholder="e.g. Specialized transmission tool missing in Bay 3; requires senior master technician..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReasonText.trim()}
                onClick={handleRejectJob}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Return to Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Extra Work Recommendation */}
      {isExtraWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form onSubmit={handleAddExtraWork} className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Recommend Extra Work</h3>
            <p className="text-xs text-slate-500">
              Job status will update to "Awaiting Customer Approval". Work cannot begin until approved.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Description of Defect / Extra Service
              </label>
              <input
                type="text"
                required
                value={extraWorkDesc}
                onChange={(e) => setExtraWorkDesc(e.target.value)}
                placeholder="e.g. Rear brake pads worn to steel backing"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Estimated Parts Needed
              </label>
              <input
                type="text"
                value={extraWorkParts}
                onChange={(e) => setExtraWorkParts(e.target.value)}
                placeholder="e.g. 1x Rear Ceramic Pad Set (Toyota Genuine)"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Urgency Level
              </label>
              <select
                value={extraWorkUrgency}
                onChange={(e) => setExtraWorkUrgency(e.target.value as any)}
                className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              >
                <option value="Low">Low (Next service)</option>
                <option value="Medium">Medium (Recommended)</option>
                <option value="High">High (Immediate)</option>
                <option value="Immediate Safety">Immediate Safety Hazard (خطر على السلامة)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExtraWorkModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#0B3A6E] rounded-xl shadow-xs"
              >
                Submit for Approval
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Record Part Used */}
      {isAddPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <form onSubmit={handleAddPartUsed} className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Record Part / Consumable Used</h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Part Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. Engine Oil Filter Element"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Part Number (Optional)
                </label>
                <input
                  type="text"
                  value={partNumber}
                  onChange={(e) => setPartNumber(e.target.value)}
                  placeholder="04152-YZZA1"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={partQty}
                  onChange={(e) => setPartQty(Number(e.target.value))}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  value={partBrand}
                  onChange={(e) => setPartBrand(e.target.value)}
                  placeholder="e.g. Toyota OEM, Denso, Bosch"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Source Inventory
                </label>
                <select
                  value={partSource}
                  onChange={(e) => setPartSource(e.target.value as any)}
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-300 rounded-xl"
                >
                  <option value="Workshop Stock">Workshop Stock</option>
                  <option value="Special Order">Special Order</option>
                  <option value="Customer Provided">Customer Provided</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddPartModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl shadow-xs"
              >
                Save Part Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
