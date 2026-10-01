import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Eye,
  Loader2,
  Sparkles,
  Gauge,
  Fuel,
  Info,
  Maximize2,
  X
} from 'lucide-react';
import { JobPhoto, PhotoSlotType, PhotoType } from '../../types';
import { ImageService } from '../../services/imageService';
import { OfflineQueueService } from '../../services/offlineQueue';
import AudioHapticService from '../../utils/audioHaptic';

interface SlotDefinition {
  id: PhotoSlotType;
  labelEn: string;
  labelAr: string;
  descriptionEn: string;
  descriptionAr: string;
  silhouetteSvg: string; // SVG path
}

export const SIDE_SLOTS: SlotDefinition[] = [
  {
    id: 'side_front_before',
    labelEn: 'Front View',
    labelAr: 'المقدمة',
    descriptionEn: 'Straight front bumper, headlights and hood',
    descriptionAr: 'واجهة المركبة الأمامية والصدام والأنوار',
    silhouetteSvg: 'M 20,40 C 20,20 80,10 100,10 C 120,10 180,20 180,40 L 170,75 L 30,75 Z',
  },
  {
    id: 'side_rear_before',
    labelEn: 'Rear View',
    labelAr: 'الخلفية',
    descriptionEn: 'Rear bumper, tail lights, exhaust and trunk',
    descriptionAr: 'خلفية المركبة واللوحة والصدام الخلفي',
    silhouetteSvg: 'M 30,75 L 40,40 C 40,20 100,15 100,15 C 100,15 160,20 160,40 L 170,75 Z',
  },
  {
    id: 'side_left_before',
    labelEn: 'Left Side',
    labelAr: 'الجانب الأيسر',
    descriptionEn: 'Driver side doors, fenders, and quarter panels',
    descriptionAr: 'الجانب الأيسر كامل (الأبواب والرفارف)',
    silhouetteSvg: 'M 10,60 L 30,45 L 70,30 L 130,30 L 170,45 L 190,60 L 190,70 L 10,70 Z',
  },
  {
    id: 'side_right_before',
    labelEn: 'Right Side',
    labelAr: 'الجانب الأيمن',
    descriptionEn: 'Passenger side doors, fenders, and quarter panels',
    descriptionAr: 'الجانب الأيمن كامل (الأبواب والرفارف)',
    silhouetteSvg: 'M 190,60 L 170,45 L 130,30 L 70,30 L 30,45 L 10,60 L 10,70 L 190,70 Z',
  },
];

interface GuidedPhotoCaptureProps {
  jobNo: string;
  plate: string;
  stage: 'BEFORE' | 'AFTER';
  photos: JobPhoto[];
  onAddPhoto: (photo: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  onDeletePhoto?: (photoId: string) => void;
  // Meter readings
  fuelLevel?: 'E' | '1/4' | '1/2' | '3/4' | 'F';
  onFuelChange?: (level: 'E' | '1/4' | '1/2' | '3/4' | 'F') => void;
  odometerReading?: number;
  onOdometerChange?: (reading: number) => void;
  receptionOdometer?: number;
  language?: 'en' | 'ar';
  readOnly?: boolean;
}

export const GuidedPhotoCapture: React.FC<GuidedPhotoCaptureProps> = ({
  jobNo,
  plate,
  stage,
  photos,
  onAddPhoto,
  onDeletePhoto,
  fuelLevel,
  onFuelChange,
  odometerReading,
  onOdometerChange,
  receptionOdometer = 0,
  language = 'en',
  readOnly = false,
}) => {
  const [activeSlot, setActiveSlot] = useState<PhotoSlotType | null>(null);
  const [activeCaption, setActiveCaption] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomedPhotoUrl, setZoomedPhotoUrl] = useState<string | null>(null);
  const [customDetailCaption, setCustomDetailCaption] = useState('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Common detail captions quick-pick
  const commonDetailCaptions = [
    { en: 'Brake Disc & Pads', ar: 'أقراص وفحمات الفرامل' },
    { en: 'Engine Oil Filter Bay', ar: 'حجرة فلتر وزيت المحرك' },
    { en: 'Suspension & Bushings', ar: 'المساعدات ومقصات التعليق' },
    { en: 'AC Compressor & Belts', ar: 'كمبروسر وسير المكيف' },
    { en: 'Battery Terminal Voltage', ar: 'أصابع وفحص البطارية' },
    { en: 'Body Paint Scratch / Chip', ar: 'خدش أو تقشير في الطلاء' },
  ];

  // Side slots mapped to current stage
  const currentSideSlots = SIDE_SLOTS.map((s) => ({
    ...s,
    id: (stage === 'BEFORE'
      ? s.id
      : s.id.replace('_before', '_after')) as PhotoSlotType,
    beforeSlotId: s.id, // For side-by-side comparison in AFTER stage
  }));

  // Filter photos by slot
  const getPhotoForSlot = (slotId: PhotoSlotType): JobPhoto | undefined => {
    return photos.find((p) => p.slotType === slotId);
  };

  // Detail photos (mandatory 5)
  const detailPhotos = photos.filter((p) =>
    stage === 'BEFORE'
      ? p.slotType === 'before_detail' || (p.type === 'before' && !p.slotType?.startsWith('side_'))
      : p.slotType === 'after_detail' || (p.type === 'after' && !p.slotType?.startsWith('side_'))
  );

  // Before photos for side-by-side matching
  const beforeSidePhotos = photos.filter((p) => p.slotType?.endsWith('_before'));

  // Trigger camera capture for a specific slot
  const handleCaptureClick = (slotId: PhotoSlotType, captionText: string = '') => {
    if (readOnly) return;
    setActiveSlot(slotId);
    setActiveCaption(captionText);
    cameraInputRef.current?.click();
  };

  // Handle image capture file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeSlot) return;

    try {
      setIsProcessing(true);
      const slotDef = currentSideSlots.find((s) => s.id === activeSlot);
      const slotLabel = slotDef
        ? language === 'ar'
          ? slotDef.labelAr
          : slotDef.labelEn
        : activeCaption || activeSlot;

      // Process and burn Qatar Evidence Watermark
      const processed = await ImageService.processAndStampPhoto(
        file,
        jobNo,
        plate,
        stage,
        slotLabel
      );

      const newPhotoData: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'> = {
        type: stage === 'BEFORE' ? 'before' : 'after',
        slotType: activeSlot,
        url: processed.url,
        thumbnailUrl: processed.thumbnailUrl,
        caption: activeCaption || (slotDef ? slotDef.labelEn : 'Work area detail'),
        isCustomerVisible: true,
        stamped: true,
      };

      // Check if online, else queue
      if (!navigator.onLine) {
        OfflineQueueService.enqueue(jobNo, newPhotoData);
      }

      onAddPhoto(newPhotoData);
      AudioHapticService.playSuccessChime();
    } catch (err: any) {
      alert(err.message || 'Failed to process photo');
      AudioHapticService.playWarningTone();
    } finally {
      setIsProcessing(false);
      setActiveSlot(null);
      setActiveCaption('');
      if (e.target) e.target.value = '';
    }
  };

  // Fuel options
  const fuelLevels: Array<'E' | '1/4' | '1/2' | '3/4' | 'F'> = ['E', '1/4', '1/2', '3/4', 'F'];

  const fuelSlotId: PhotoSlotType = stage === 'BEFORE' ? 'fuel_before' : 'fuel_after';
  const fuelPhoto = getPhotoForSlot(fuelSlotId);

  const odoSlotId: PhotoSlotType = stage === 'BEFORE' ? 'odometer_before' : 'odometer_after';
  const odoPhoto = getPhotoForSlot(odoSlotId);

  return (
    <div className="space-y-6">
      {/* Hidden file & camera inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* SECTION 1: 4-SIDE EXTERIOR PHOTOS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#0B3A6E]" />
              <span>
                {language === 'ar'
                  ? `الصور الأربعة لمحيط المركبة (${stage === 'BEFORE' ? 'قبل الصيانة' : 'بعد الصيانة'})`
                  : `Four Side Photos (${stage === 'BEFORE' ? 'Before Repair' : 'After Repair'})`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {language === 'ar'
                ? 'يجب التقاط جميع الزوايا الأربع لتوثيق سلامة هيكل المركبة.'
                : 'All four exterior angles are strictly mandatory for evidence.'}
            </p>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              currentSideSlots.every((s) => !!getPhotoForSlot(s.id))
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            {currentSideSlots.filter((s) => !!getPhotoForSlot(s.id)).length} / 4
          </span>
        </div>

        {/* 4 Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currentSideSlots.map((slot) => {
            const photo = getPhotoForSlot(slot.id);
            const matchingBeforePhoto =
              stage === 'AFTER'
                ? photos.find((p) => p.slotType === slot.beforeSlotId)
                : null;

            return (
              <div
                key={slot.id}
                className={`relative rounded-xl border-2 p-2 flex flex-col items-center justify-between transition-all min-h-[170px] ${
                  photo
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-dashed border-slate-300 hover:border-[#0E9AA7] bg-slate-50'
                }`}
              >
                {/* Header label */}
                <span className="text-xs font-bold text-slate-800 text-center block mb-1">
                  {language === 'ar' ? slot.labelAr : slot.labelEn}
                </span>

                {/* Photo or Silhouette Placeholder */}
                {photo ? (
                  <div className="relative w-full h-24 rounded-lg overflow-hidden group">
                    <img
                      src={photo.thumbnailUrl || photo.url}
                      alt={slot.labelEn}
                      className="w-full h-full object-cover"
                    />
                    {/* Stamped badge indicator */}
                    <span className="absolute top-1 left-1 bg-slate-900/80 text-teal-300 text-[8px] font-black px-1 rounded">
                      QATAR STAMPED
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomedPhotoUrl(photo.url)}
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-2 text-slate-400">
                    <svg
                      viewBox="0 0 200 80"
                      className="w-20 h-10 stroke-slate-300 fill-slate-100"
                      strokeWidth="2"
                    >
                      <path d={slot.silhouetteSvg} />
                    </svg>
                    <span className="text-[10px] text-slate-400 text-center mt-1 px-1">
                      {language === 'ar' ? slot.descriptionAr : slot.descriptionEn}
                    </span>
                  </div>
                )}

                {/* In AFTER mode: Show mini BEFORE thumbnail for angle matching */}
                {stage === 'AFTER' && matchingBeforePhoto && (
                  <div className="w-full mt-1.5 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-600">
                      {language === 'ar' ? 'صورة قبل:' : 'Before angle:'}
                    </span>
                    <img
                      src={matchingBeforePhoto.thumbnailUrl || matchingBeforePhoto.url}
                      alt="Before angle"
                      className="w-8 h-6 object-cover rounded border border-slate-300 cursor-pointer"
                      onClick={() => setZoomedPhotoUrl(matchingBeforePhoto.url)}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="w-full mt-2 pt-1 flex items-center justify-center gap-1.5">
                  {photo ? (
                    <>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() => handleCaptureClick(slot.id)}
                          className="flex-1 py-1.5 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Retake</span>
                        </button>
                      )}
                      {!readOnly && onDeletePhoto && (
                        <button
                          type="button"
                          onClick={() => onDeletePhoto(photo.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={readOnly || isProcessing}
                      onClick={() => handleCaptureClick(slot.id)}
                      className="w-full min-h-[44px] py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                    >
                      <Camera className="w-3.5 h-3.5 text-teal-300" />
                      <span>{language === 'ar' ? 'التقاط' : 'Capture'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: METERS & GAUGES (FUEL + ODOMETER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PETROL / FUEL GAUGE */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Fuel className="w-4 h-4 text-amber-600" />
              <span>
                {language === 'ar'
                  ? `مستوى الوقود (${stage === 'BEFORE' ? 'الاستلام' : 'النهائي'})`
                  : `Fuel Gauge (${stage === 'BEFORE' ? 'Reception' : 'Final'})`}
              </span>
            </h3>
            {fuelPhoto && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {language === 'ar' ? 'تم التوثيق' : 'Documented'}
              </span>
            )}
          </div>

          {/* Photo Preview / Capture */}
          <div className="flex items-center gap-3 mb-3">
            {fuelPhoto ? (
              <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={fuelPhoto.thumbnailUrl || fuelPhoto.url}
                  alt="Fuel Gauge"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setZoomedPhotoUrl(fuelPhoto.url)}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center text-white"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                <Fuel className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1">
              <p className="text-[11px] text-slate-500 mb-1.5">
                {language === 'ar'
                  ? 'التقاط صورة واضحة لعداد الوقود في لوحة القيادة:'
                  : 'Capture clear dashboard fuel indicator photo:'}
              </p>
              {!readOnly && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCaptureClick(fuelSlotId, 'Fuel Gauge Meter')}
                  className="px-3 py-2 text-xs font-bold text-[#0B3A6E] bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#0E9AA7]" />
                  <span>{fuelPhoto ? 'Retake Fuel Photo' : 'Capture Fuel Photo'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Fuel Level Selector Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {language === 'ar' ? 'تحديد مستوى الوقود الحالي:' : 'Select Fuel Level Level:'}
            </label>
            <div className="grid grid-cols-5 gap-1">
              {fuelLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  disabled={readOnly}
                  onClick={() => onFuelChange && onFuelChange(lvl)}
                  className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    fuelLevel === lvl
                      ? 'bg-[#0B3A6E] text-white border-[#0B3A6E] shadow-sm scale-102'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ODOMETER / DASHBOARD READING */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-600" />
              <span>
                {language === 'ar'
                  ? `عداد الكيلومترات (${stage === 'BEFORE' ? 'الدخول' : 'الخروج'})`
                  : `Odometer Reading (${stage === 'BEFORE' ? 'In' : 'Out'})`}
              </span>
            </h3>
            {odoPhoto && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {language === 'ar' ? 'تم التوثيق' : 'Documented'}
              </span>
            )}
          </div>

          {/* Photo Preview / Capture */}
          <div className="flex items-center gap-3 mb-3">
            {odoPhoto ? (
              <div className="relative w-20 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                <img
                  src={odoPhoto.thumbnailUrl || odoPhoto.url}
                  alt="Odometer Gauge"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setZoomedPhotoUrl(odoPhoto.url)}
                  className="absolute inset-0 bg-black/30 flex items-center justify-center text-white"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center text-slate-400 shrink-0">
                <Gauge className="w-6 h-6" />
              </div>
            )}

            <div className="flex-1">
              <p className="text-[11px] text-slate-500 mb-1.5">
                {language === 'ar'
                  ? 'التقاط صورة للوحة العدادات موضحاً أضواء التحذير:'
                  : 'Capture cluster showing warning lights & mileage:'}
              </p>
              {!readOnly && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCaptureClick(odoSlotId, 'Odometer & Dashboard Lights')}
                  className="px-3 py-2 text-xs font-bold text-[#0B3A6E] bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#0E9AA7]" />
                  <span>{odoPhoto ? 'Retake Cluster Photo' : 'Capture Cluster Photo'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Odometer Number Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {language === 'ar' ? 'القراءة الفعلية (كم):' : 'Verified Odometer Reading (km):'}
              </label>
              {receptionOdometer > 0 && (
                <span className="text-[10px] text-slate-400 font-mono">
                  Reception: {receptionOdometer.toLocaleString()} km
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                disabled={readOnly}
                value={odometerReading || ''}
                onChange={(e) => onOdometerChange && onOdometerChange(Number(e.target.value))}
                placeholder={receptionOdometer ? String(receptionOdometer) : 'e.g. 84250'}
                className="w-full px-3 py-2.5 text-base font-black font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0E9AA7] focus:outline-none"
              />
              <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 pointer-events-none">
                KM
              </span>
            </div>

            {/* Validation warning if less than reception */}
            {odometerReading !== undefined &&
              odometerReading > 0 &&
              receptionOdometer > 0 &&
              odometerReading < receptionOdometer && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    Warning: Reading is lower than reception record ({receptionOdometer} km). Please verify cluster.
                  </span>
                </p>
              )}
          </div>
        </div>
      </div>

      {/* SECTION 3: FIVE MANDATORY WORK AREA / DAMAGE DETAIL PHOTOS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                {language === 'ar'
                  ? `صور تفاصيل العمل والعطل (الحد الأدنى 5 صور ${stage === 'BEFORE' ? 'قبل' : 'بعد'})`
                  : `Work Area & Damage Detail Photos (Min 5 ${stage === 'BEFORE' ? 'Before' : 'After'})`}
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              {language === 'ar'
                ? 'وثّق كل منطقة صيانة أو قطعة مستبدلة بدقة واضحة مع وصف مختصر.'
                : 'Document every repair area, fault or replacement component with caption.'}
            </p>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              detailPhotos.length >= 5
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-rose-100 text-rose-800 animate-pulse'
            }`}
          >
            {detailPhotos.length} / 5 Required
          </span>
        </div>

        {/* Existing Detail Photos Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          {detailPhotos.map((photo, idx) => (
            <div
              key={photo.id}
              className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 flex flex-col group shadow-2xs"
            >
              <div className="relative h-28 w-full bg-slate-900">
                <img
                  src={photo.thumbnailUrl || photo.url}
                  alt={photo.caption || 'Detail'}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => setZoomedPhotoUrl(photo.url)}
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 flex-1 flex flex-col justify-between">
                <p className="text-[10px] font-medium text-slate-700 truncate" title={photo.caption}>
                  {photo.caption || 'Detail photo'}
                </p>

                {!readOnly && onDeletePhoto && (
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => onDeletePhoto(photo.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add New Detail Photo Slot */}
          {!readOnly && detailPhotos.length < 10 && (
            <div className="rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0E9AA7] bg-slate-50/60 p-3 flex flex-col items-center justify-center min-h-[140px] text-center">
              <Camera className="w-6 h-6 text-[#0E9AA7] mb-1.5" />
              <span className="text-xs font-bold text-slate-800">
                {language === 'ar' ? 'إضافة صورة عطل' : 'Add Detail Photo'}
              </span>
              <p className="text-[10px] text-slate-400 mb-2">
                {5 - detailPhotos.length > 0
                  ? `${5 - detailPhotos.length} more required`
                  : 'Up to 10 allowed'}
              </p>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  handleCaptureClick(
                    stage === 'BEFORE' ? 'before_detail' : 'after_detail',
                    customDetailCaption || `Detail #${detailPhotos.length + 1}`
                  )
                }
                className="w-full py-2 bg-[#0B3A6E] hover:bg-[#082b52] text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer active:scale-98"
              >
                Capture Photo
              </button>
            </div>
          )}
        </div>

        {/* Quick Pick Captions for Next Detail Photo */}
        {!readOnly && detailPhotos.length < 10 && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
              {language === 'ar' ? 'اختر وصفاً سريعاً للصورة القادمة:' : 'Quick caption for next detail photo:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {commonDetailCaptions.map((c) => (
                <button
                  key={c.en}
                  type="button"
                  onClick={() => setCustomDetailCaption(language === 'ar' ? c.ar : c.en)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                    customDetailCaption === (language === 'ar' ? c.ar : c.en)
                      ? 'bg-teal-600 text-white border-teal-600 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {language === 'ar' ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Full Screen Photo Zoom with Watermark View */}
      {zoomedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="px-4 py-3 bg-slate-800 text-white flex items-center justify-between">
              <span className="text-xs font-bold tracking-wide text-teal-300">
                Qatar Workshop Verified Photographic Evidence
              </span>
              <button
                type="button"
                onClick={() => setZoomedPhotoUrl(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 overflow-auto flex items-center justify-center">
              <img
                src={zoomedPhotoUrl}
                alt="Zoomed Evidence"
                className="max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
