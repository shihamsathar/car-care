import React, { useState } from 'react';
import { Columns, SplitSquareVertical } from 'lucide-react';
import { JobPhoto } from '../../types';

interface BeforeAfterSliderProps {
  beforePhotos: JobPhoto[];
  afterPhotos: JobPhoto[];
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforePhotos,
  afterPhotos,
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const beforePhoto = beforePhotos[selectedIndex] || beforePhotos[0];
  const afterPhoto = afterPhotos[selectedIndex] || afterPhotos[0];

  if (!beforePhoto && !afterPhoto) {
    return (
      <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        No before/after photos available for comparison.
      </div>
    );
  }

  // If only one is available, show simple grid
  if (!beforePhoto || !afterPhoto) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {beforePhoto && (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
            <span className="block px-3 py-1 bg-amber-500 text-white font-bold text-xs">
              BEFORE SERVICE
            </span>
            <img src={beforePhoto.url} alt="Before" className="w-full h-56 object-cover" />
            <p className="p-2 text-xs text-slate-600">{beforePhoto.caption}</p>
          </div>
        )}
        {afterPhoto && (
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">
            <span className="block px-3 py-1 bg-emerald-600 text-white font-bold text-xs">
              AFTER SERVICE
            </span>
            <img src={afterPhoto.url} alt="After" className="w-full h-56 object-cover" />
            <p className="p-2 text-xs text-slate-600">{afterPhoto.caption}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <SplitSquareVertical className="w-4 h-4 text-[#0E9AA7]" />
          Before & After Interactive Inspection Comparison
        </h4>

        {/* Pair selector if multiple angles exist */}
        {beforePhotos.length > 1 && afterPhotos.length > 1 && (
          <div className="flex items-center gap-1">
            {beforePhotos.slice(0, Math.min(beforePhotos.length, afterPhotos.length)).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                  selectedIndex === i
                    ? 'bg-[#0B3A6E] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Angle #{i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Drag Split View */}
      <div className="relative w-full aspect-16/9 max-h-[380px] rounded-xl overflow-hidden select-none bg-slate-900 border border-slate-300">
        {/* After Image (Full background) */}
        <img
          src={afterPhoto.url}
          alt="After service"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Before Image (Clipped by slider position) */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={beforePhoto.url}
            alt="Before service"
            className="absolute inset-y-0 left-0 max-w-none h-full object-cover"
            style={{ width: '100%' }}
          />
        </div>

        {/* Divider Line & Handle */}
        <div
          className="absolute inset-y-0 w-1 bg-white shadow-2xl cursor-ew-resize z-20 flex items-center justify-center"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-white text-[#0B3A6E] shadow-xl flex items-center justify-center font-bold text-xs border-2 border-[#0B3A6E]">
            ↔
          </div>
        </div>

        {/* Hidden Range Input for Accessibility & Touch Dragging */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
          aria-label="Before and after slider"
        />

        {/* Floating Labels */}
        <span className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/90 text-white backdrop-blur-xs pointer-events-none">
          BEFORE
        </span>
        <span className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-xs pointer-events-none">
          AFTER
        </span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
        <span>{beforePhoto.caption || 'Before service intake'}</span>
        <span>{afterPhoto.caption || 'Completed finish'}</span>
      </div>
    </div>
  );
};
