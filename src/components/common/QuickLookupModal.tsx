import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const QuickLookupModal: React.FC = () => {
  const {
    activeQuickLookupType,
    quickLookupParentId,
    closeQuickLookup,
    addLookupOption,
    onQuickLookupCreated,
    language,
  } = useApp();

  const [labelEn, setLabelEn] = useState('');
  const [labelAr, setLabelAr] = useState('');
  const [defaultPrice, setDefaultPrice] = useState<number | ''>('');

  if (!activeQuickLookupType) return null;

  const typeDisplayNames: Record<string, { en: string; ar: string }> = {
    make: { en: 'Vehicle Make', ar: 'الشركة الصانعة' },
    model: { en: 'Vehicle Model', ar: 'موديل المركبة' },
    year: { en: 'Model Year', ar: 'سنة الصنع' },
    color: { en: 'Exterior Color', ar: 'لون المركبة' },
    bodyType: { en: 'Body Type', ar: 'نوع الهيكل' },
    fuelType: { en: 'Fuel Type', ar: 'نوع الوقود' },
    transmission: { en: 'Transmission', ar: 'ناقل الحركة' },
    specification: { en: 'Specification (GCC/US)', ar: 'المواصفات' },
    plateType: { en: 'Plate Type', ar: 'نوع اللوحة' },
    service: { en: 'Service Catalog Item', ar: 'خدمة في الدليل' },
    insuranceCompany: { en: 'Insurance Company', ar: 'شركة التأمين' },
    jobSource: { en: 'Job Source / Referral', ar: 'مصدر العمل' },
    priority: { en: 'Priority', ar: 'درجة الأولوية' },
    paymentMethod: { en: 'Payment Method', ar: 'طريقة الدفع' },
    damageType: { en: 'Damage Type', ar: 'نوع الضرر' },
    nationality: { en: 'Nationality', ar: 'الجنسية' },
  };

  const displayName = typeDisplayNames[activeQuickLookupType] || {
    en: activeQuickLookupType,
    ar: activeQuickLookupType,
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!labelEn.trim()) return;

    const newItem = addLookupOption(
      activeQuickLookupType,
      labelEn.trim(),
      labelAr.trim() || labelEn.trim(),
      quickLookupParentId,
      typeof defaultPrice === 'number' ? defaultPrice : undefined
    );

    if (onQuickLookupCreated) {
      onQuickLookupCreated(newItem);
    }

    setLabelEn('');
    setLabelAr('');
    setDefaultPrice('');
    closeQuickLookup();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0B3A6E] text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-teal-300">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {language === 'ar' ? `إضافة: ${displayName.ar}` : `Add New: ${displayName.en}`}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'ar' ? 'سيتم الحفظ والاختيار فوراً' : 'Will be saved & auto-selected'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeQuickLookup}
            className="p-1.5 rounded-lg hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              English Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={labelEn}
              onChange={(e) => setLabelEn(e.target.value)}
              placeholder="e.g. Lucid Air, Diamond Tint..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E9AA7] focus:bg-white transition-all"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              الاسم بالعربية (Arabic Name)
            </label>
            <input
              type="text"
              dir="rtl"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
              placeholder="مثال: لوسيد إير، تظليل ألماسي..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E9AA7] focus:bg-white transition-all"
            />
          </div>

          {activeQuickLookupType === 'service' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Price in QAR (ريال قطري)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={defaultPrice}
                onChange={(e) => setDefaultPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="e.g. 450"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E9AA7] focus:bg-white transition-all"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeQuickLookup}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              Save & Select
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
