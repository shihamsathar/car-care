import React, { useState } from 'react';
import { Plus, Search, ChevronDown, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LookupItem } from '../../types';

interface LookupSelectProps {
  label: string;
  lookupType: string;
  parentId?: string;
  value: string;
  onChange: (value: string, item?: LookupItem) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowAdd?: boolean;
  helpText?: string;
}

export const LookupSelect: React.FC<LookupSelectProps> = ({
  label,
  lookupType,
  parentId,
  value,
  onChange,
  placeholder = 'Select option...',
  required = false,
  disabled = false,
  className = '',
  allowAdd = true,
  helpText,
}) => {
  const { getLookupsByType, language, openQuickLookup, setQuickLookupCallback } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const options = getLookupsByType(lookupType, parentId);

  // Selected item
  const selectedItem = options.find((opt) => opt.labelEn === value || opt.labelAr === value || opt.id === value);
  const displayLabel = selectedItem 
    ? (language === 'ar' ? (selectedItem.labelAr || selectedItem.labelEn) : selectedItem.labelEn)
    : (value || '');

  const filteredOptions = options.filter((opt) => {
    const term = searchTerm.toLowerCase();
    return (
      opt.labelEn.toLowerCase().includes(term) ||
      (opt.labelAr && opt.labelAr.toLowerCase().includes(term))
    );
  });

  const handleOpenAddModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickLookupCallback((newItem: LookupItem) => {
      onChange(newItem.labelEn, newItem);
    });
    openQuickLookup(lookupType, parentId);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex items-center gap-1.5">
        {/* Main Select Button */}
        <div className="relative flex-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm bg-white border rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-[#0E9AA7] focus:border-transparent ${
              disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-300 hover:border-slate-400 cursor-pointer shadow-xs'
            }`}
          >
            <span className={`truncate ${!displayLabel ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
              {displayLabel || placeholder}
            </span>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1.5" />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl p-1 text-sm">
                {/* Search Bar */}
                <div className="sticky top-0 bg-white pb-1 border-b border-slate-100 mb-1 px-1 pt-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#0E9AA7]"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Options List */}
                <div className="max-h-44 overflow-y-auto space-y-0.5">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => {
                      const isSelected = opt.labelEn === value || opt.labelAr === value || opt.id === value;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onChange(opt.labelEn, opt);
                            setIsOpen(false);
                            setSearchTerm('');
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left ${
                            isSelected
                              ? 'bg-[#0B3A6E] text-white font-medium'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{opt.labelEn}</span>
                            {opt.labelAr && (
                              <span className={`text-[11px] ${isSelected ? 'text-slate-200' : 'text-slate-400'}`}>
                                {opt.labelAr}
                              </span>
                            )}
                          </div>
                          {opt.defaultPrice !== undefined && (
                            <span className={`text-[11px] font-semibold ${isSelected ? 'text-teal-200' : 'text-[#0E9AA7]'}`}>
                              {opt.defaultPrice} QAR
                            </span>
                          )}
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-center text-xs text-slate-400">
                      <p className="mb-2">No matching options found</p>
                      {searchTerm.trim() && allowAdd && (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickLookupCallback((newItem: LookupItem) => {
                              onChange(newItem.labelEn, newItem);
                            });
                            openQuickLookup(lookupType, parentId);
                            setIsOpen(false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-lg transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add &quot;{searchTerm}&quot; as new option</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Small "+" Add Button beside dropdown */}
        {allowAdd && !disabled && (
          <button
            type="button"
            title={`Add new ${label}`}
            onClick={handleOpenAddModal}
            className="shrink-0 w-9 h-9 flex items-center justify-center bg-slate-100 hover:bg-[#0E9AA7] text-slate-600 hover:text-white border border-slate-300 hover:border-[#0E9AA7] rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {helpText && <p className="text-[11px] text-slate-500 mt-1">{helpText}</p>}
    </div>
  );
};
