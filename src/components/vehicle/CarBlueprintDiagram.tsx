import React, { useState } from 'react';
import {
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  X,
  Eye,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { DamagePin, DamageSeverity, DamageType, VehicleView } from '../../types';

interface CarBlueprintDiagramProps {
  pins: DamagePin[];
  onAddPin?: (pin: Omit<DamagePin, 'id' | 'createdAt' | 'addedBy'>) => void;
  onDeletePin?: (pinId: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const CarBlueprintDiagram: React.FC<CarBlueprintDiagramProps> = ({
  pins,
  onAddPin,
  onDeletePin,
  readOnly = false,
  className = '',
}) => {
  const [activeView, setActiveView] = useState<VehicleView>('top');
  const [selectedPin, setSelectedPin] = useState<DamagePin | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ x: number; y: number } | null>(null);

  // New Pin form state
  const [damageType, setDamageType] = useState<DamageType>('scratch');
  const [severity, setSeverity] = useState<DamageSeverity>('minor');
  const [note, setNote] = useState('');

  const viewLabels: Record<VehicleView, { en: string; ar: string }> = {
    top: { en: 'Top Roof & Hood', ar: 'السقف والكبوت' },
    front: { en: 'Front Bumper & Grille', ar: 'الواجهة الأمامية' },
    rear: { en: 'Rear Trunk & Bumper', ar: 'الخلفية والشنطة' },
    left: { en: 'Left Driver Side', ar: 'الجانب الأيسر' },
    right: { en: 'Right Passenger Side', ar: 'الجانب الأيمن' },
  };

  const handleDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly || !onAddPin) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    setPendingCoords({ x, y });
    setNote('');
    setSelectedPin(null);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCoords || !onAddPin) return;

    onAddPin({
      x: pendingCoords.x,
      y: pendingCoords.y,
      view: activeView,
      damageType,
      severity,
      note: note.trim() || `${damageType.replace('_', ' ')} detected on ${activeView} view`,
    });

    setPendingCoords(null);
    setNote('');
  };

  const currentViewPins = pins.filter((p) => p.view === activeView);

  const damageTypeColors: Record<DamageType, string> = {
    scratch: 'bg-amber-500 text-white',
    dent: 'bg-rose-500 text-white',
    paint_chip: 'bg-purple-500 text-white',
    crack: 'bg-red-600 text-white',
    wheel_rash: 'bg-blue-600 text-white',
    broken_glass: 'bg-cyan-600 text-white',
    corrosion: 'bg-yellow-700 text-white',
    other: 'bg-slate-700 text-white',
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 shadow-xs ${className}`}>
      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['top', 'front', 'rear', 'left', 'right'] as VehicleView[]).map((view) => {
            const count = pins.filter((p) => p.view === view).length;
            const isActive = activeView === view;
            return (
              <button
                key={view}
                type="button"
                onClick={() => {
                  setActiveView(view);
                  setPendingCoords(null);
                  setSelectedPin(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0B3A6E] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{viewLabels[view].en}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-400 text-slate-900' : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Total Marks: {pins.length}</span>
          {!readOnly && (
            <span className="hidden sm:inline text-teal-600 font-medium">
              • Tap on car diagram to add damage pin
            </span>
          )}
        </div>
      </div>

      {/* Main Diagram Canvas Area */}
      <div className="relative w-full aspect-21/9 min-h-[220px] max-h-[340px] bg-slate-50/80 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center p-4 select-none">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#0B3A6E 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Vector Vehicle Diagrams for each view */}
        <div
          onClick={handleDiagramClick}
          className={`relative w-full h-full flex items-center justify-center ${
            !readOnly ? 'cursor-crosshair' : 'cursor-default'
          }`}
        >
          {activeView === 'top' && (
            <svg
              viewBox="0 0 500 220"
              className="w-full h-full max-h-[260px] text-slate-700 filter drop-shadow-sm pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {/* Car Body Outer Shell (Top View) */}
              <path
                d="M 60,110 C 60,65 95,50 160,48 L 340,48 C 410,50 440,65 440,110 C 440,155 410,170 340,172 L 160,172 C 95,170 60,155 60,110 Z"
                className="fill-white stroke-slate-400"
                strokeWidth="3"
              />
              {/* Hood line */}
              <path d="M 125,52 C 145,80 145,140 125,168" className="stroke-slate-300" strokeWidth="2" />
              {/* Front Windshield */}
              <path
                d="M 160,56 C 185,58 185,162 160,164 L 210,158 C 215,110 215,110 210,62 Z"
                className="fill-teal-50/60 stroke-slate-400"
                strokeWidth="2"
              />
              {/* Sunroof / Panoramic Roof */}
              <rect x="230" y="70" width="80" height="80" rx="10" className="fill-slate-100 stroke-slate-300" strokeDasharray="3 3" />
              {/* Rear Windshield */}
              <path
                d="M 335,62 C 325,110 325,110 335,158 L 365,164 C 350,110 350,110 365,56 Z"
                className="fill-teal-50/60 stroke-slate-400"
                strokeWidth="2"
              />
              {/* Side Mirrors */}
              <path d="M 180,48 L 195,32 L 205,36 L 195,49" className="fill-slate-200 stroke-slate-400" />
              <path d="M 180,172 L 195,188 L 205,184 L 195,171" className="fill-slate-200 stroke-slate-400" />
              {/* Front & Rear indicators */}
              <text x="85" y="115" className="text-[11px] fill-slate-400 font-bold" textAnchor="middle">FRONT</text>
              <text x="410" y="115" className="text-[11px] fill-slate-400 font-bold" textAnchor="middle">REAR</text>
            </svg>
          )}

          {activeView === 'front' && (
            <svg
              viewBox="0 0 400 200"
              className="w-full h-full max-h-[260px] text-slate-700 filter drop-shadow-sm pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {/* Front Cabin & Roof */}
              <path d="M 110,60 L 140,25 L 260,25 L 290,60 Z" className="fill-slate-50 stroke-slate-400" strokeWidth="2.5" />
              {/* Windshield */}
              <path d="M 120,58 L 146,30 L 254,30 L 280,58 Z" className="fill-teal-50/70 stroke-slate-400" />
              {/* Front Hood & Main Grille */}
              <path d="M 70,140 C 70,68 100,62 200,62 C 300,62 330,68 330,140 L 320,165 L 80,165 Z" className="fill-white stroke-slate-400" strokeWidth="3" />
              {/* Headlights */}
              <polygon points="90,75 140,80 135,100 85,92" className="fill-amber-100/60 stroke-slate-400" />
              <polygon points="310,75 260,80 265,100 315,92" className="fill-amber-100/60 stroke-slate-400" />
              {/* Radiator Grille */}
              <rect x="155" y="80" width="90" height="45" rx="6" className="fill-slate-100 stroke-slate-400" />
              {/* Qatar Plate Box */}
              <rect x="170" y="132" width="60" height="22" rx="3" className="fill-white stroke-slate-600" />
              <text x="200" y="147" className="text-[9px] fill-slate-800 font-bold" textAnchor="middle">QATAR</text>
              {/* Wheels */}
              <rect x="65" y="145" width="20" height="30" rx="4" className="fill-slate-800" />
              <rect x="315" y="145" width="20" height="30" rx="4" className="fill-slate-800" />
            </svg>
          )}

          {activeView === 'rear' && (
            <svg
              viewBox="0 0 400 200"
              className="w-full h-full max-h-[260px] text-slate-700 filter drop-shadow-sm pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {/* Rear Cabin & Roof */}
              <path d="M 110,60 L 140,25 L 260,25 L 290,60 Z" className="fill-slate-50 stroke-slate-400" strokeWidth="2.5" />
              {/* Rear Windshield */}
              <path d="M 120,58 L 146,30 L 254,30 L 280,58 Z" className="fill-teal-50/70 stroke-slate-400" />
              {/* Rear Trunk & Tailgate */}
              <path d="M 70,140 C 70,68 100,62 200,62 C 300,62 330,68 330,140 L 320,165 L 80,165 Z" className="fill-white stroke-slate-400" strokeWidth="3" />
              {/* Tail Lights */}
              <polygon points="85,75 135,80 130,98 80,90" className="fill-rose-200 stroke-rose-600" />
              <polygon points="315,75 265,80 270,98 320,90" className="fill-rose-200 stroke-rose-600" />
              {/* Rear Plate */}
              <rect x="170" y="105" width="60" height="24" rx="3" className="fill-white stroke-slate-600" />
              <text x="200" y="121" className="text-[9px] fill-slate-800 font-bold" textAnchor="middle">QATAR</text>
              {/* Exhaust Pipes */}
              <circle cx="105" cy="155" r="7" className="fill-slate-700" />
              <circle cx="295" cy="155" r="7" className="fill-slate-700" />
            </svg>
          )}

          {(activeView === 'left' || activeView === 'right') && (
            <svg
              viewBox="0 0 500 180"
              className={`w-full h-full max-h-[260px] text-slate-700 filter drop-shadow-sm pointer-events-none ${
                activeView === 'right' ? 'scale-x-[-1]' : ''
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {/* Side Silhouette */}
              <path
                d="M 40,120 L 70,120 C 75,95 105,95 110,120 L 340,120 C 345,95 375,95 380,120 L 440,120 C 445,100 435,75 390,70 L 320,55 L 210,35 L 140,35 L 80,75 L 45,85 Z"
                className="fill-white stroke-slate-400"
                strokeWidth="3"
              />
              {/* Side Windows */}
              <path
                d="M 148,42 L 205,42 L 205,72 L 102,72 Z"
                className="fill-teal-50/70 stroke-slate-400"
              />
              <path
                d="M 215,42 L 310,58 L 310,72 L 215,72 Z"
                className="fill-teal-50/70 stroke-slate-400"
              />
              {/* Front Wheel */}
              <circle cx="92" cy="120" r="22" className="fill-slate-800 stroke-slate-600" />
              <circle cx="92" cy="120" r="12" className="fill-slate-300 stroke-slate-400" />
              {/* Rear Wheel */}
              <circle cx="362" cy="120" r="22" className="fill-slate-800 stroke-slate-600" />
              <circle cx="362" cy="120" r="12" className="fill-slate-300 stroke-slate-400" />
              {/* Door Cut lines */}
              <line x1="210" y1="42" x2="210" y2="118" className="stroke-slate-300" strokeWidth="2" />
              <line x1="312" y1="58" x2="312" y2="118" className="stroke-slate-300" strokeWidth="2" />
            </svg>
          )}

          {/* Dropped Damage Pins on Current View */}
          {currentViewPins.map((pin, idx) => {
            const isSelected = selectedPin?.id === pin.id;
            return (
              <button
                key={pin.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(pin);
                  setPendingCoords(null);
                }}
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-transform hover:scale-125 z-20 cursor-pointer ${
                  damageTypeColors[pin.damageType] || 'bg-rose-500 text-white'
                } ${isSelected ? 'ring-3 ring-cyan-400 scale-125' : ''}`}
                title={`#${idx + 1}: ${pin.damageType} (${pin.severity})`}
              >
                {idx + 1}
              </button>
            );
          })}

          {/* Pending Pin Placement Marker */}
          {pendingCoords && (
            <div
              style={{ left: `${pendingCoords.x}%`, top: `${pendingCoords.y}%` }}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-teal-500/80 animate-ping z-10 pointer-events-none"
            />
          )}
        </div>
      </div>

      {/* Pin Input Modal (When Admin or Tech taps diagram) */}
      {pendingCoords && !readOnly && (
        <div className="mt-3 p-3 bg-teal-50/70 border border-teal-200 rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-teal-600" />
              Add Damage Record at ({pendingCoords.x}%, {pendingCoords.y}%) on {viewLabels[activeView].en}
            </h4>
            <button
              type="button"
              onClick={() => setPendingCoords(null)}
              className="text-slate-400 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSavePin} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Damage Type
              </label>
              <select
                value={damageType}
                onChange={(e) => setDamageType(e.target.value as DamageType)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
              >
                <option value="scratch">Scratch (خدش)</option>
                <option value="dent">Dent / Depression (صدمة / طعجة)</option>
                <option value="paint_chip">Paint Chip (تقشير صبغ)</option>
                <option value="crack">Crack (كسر أو شق)</option>
                <option value="wheel_rash">Rim / Wheel Rash (حكة جنط)</option>
                <option value="broken_glass">Glass / Windshield (كسر زجاج)</option>
                <option value="corrosion">Corrosion / Rust (صدأ)</option>
                <option value="other">Other Damage (أخرى)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Severity
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as DamageSeverity)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
              >
                <option value="minor">Minor (بسيط)</option>
                <option value="moderate">Moderate (متوسط)</option>
                <option value="severe">Severe (شديد)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Specific Location Note
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. 5cm surface scratch..."
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingCoords(null)}
                className="px-3 py-1 text-xs text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs cursor-pointer"
              >
                Save Pin #{pins.length + 1}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Pin Details Inspector */}
      {selectedPin && (
        <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                damageTypeColors[selectedPin.damageType]
              }`}
            >
              {pins.findIndex((p) => p.id === selectedPin.id) + 1}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-800 capitalize">
                  {selectedPin.damageType.replace('_', ' ')}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    selectedPin.severity === 'severe'
                      ? 'bg-rose-100 text-rose-700'
                      : selectedPin.severity === 'moderate'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {selectedPin.severity}
                </span>
                <span className="text-[11px] text-slate-400 capitalize">
                  ({selectedPin.view} View)
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">{selectedPin.note}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!readOnly && onDeletePin && (
              <button
                type="button"
                onClick={() => {
                  onDeletePin(selectedPin.id);
                  setSelectedPin(null);
                }}
                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Delete pin"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedPin(null)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pins Table / Legend */}
      {pins.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Inspection Damage Records ({pins.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pins.map((pin, i) => (
              <div
                key={pin.id}
                onClick={() => {
                  setActiveView(pin.view);
                  setSelectedPin(pin);
                }}
                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  selectedPin?.id === pin.id
                    ? 'bg-teal-50 border-teal-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    damageTypeColors[pin.damageType]
                  }`}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-semibold text-slate-800 capitalize truncate">
                      {pin.damageType.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize shrink-0">
                      {pin.view}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{pin.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
