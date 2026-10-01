import React, { useState } from 'react';
import {
  Database,
  Plus,
  Search,
  Filter,
  Car,
  Wrench,
  Shield,
  Tag,
  CheckCircle,
  EyeOff,
  Eye,
  Trash2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { LookupItem } from '../types';
import { formatQAR } from '../utils/i18n';

export const MasterDataView: React.FC = () => {
  const { lookups, openQuickLookup, language } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('make');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    { type: 'make', label: 'Vehicle Makes', icon: <Car className="w-4 h-4" /> },
    { type: 'model', label: 'Vehicle Models (GCC)', icon: <Car className="w-4 h-4" /> },
    { type: 'service', label: 'Services Catalog & Pricing', icon: <Wrench className="w-4 h-4" /> },
    { type: 'plateType', label: 'Qatar Plate Types', icon: <Tag className="w-4 h-4" /> },
    { type: 'color', label: 'Colors', icon: <Tag className="w-4 h-4" /> },
    { type: 'bodyType', label: 'Body Types', icon: <Tag className="w-4 h-4" /> },
    { type: 'fuelType', label: 'Fuel Types', icon: <Tag className="w-4 h-4" /> },
    { type: 'transmission', label: 'Transmissions', icon: <Tag className="w-4 h-4" /> },
    { type: 'specification', label: 'Specifications (GCC/US)', icon: <Tag className="w-4 h-4" /> },
    { type: 'insuranceCompany', label: 'Qatar Insurance Co.', icon: <Shield className="w-4 h-4" /> },
    { type: 'damageType', label: 'Damage Types', icon: <Tag className="w-4 h-4" /> },
    { type: 'nationality', label: 'Nationalities', icon: <Tag className="w-4 h-4" /> },
  ];

  const categoryItems = lookups.filter((item) => {
    if (item.type !== activeCategory) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.labelEn.toLowerCase().includes(term) ||
        (item.labelAr && item.labelAr.toLowerCase().includes(term)) ||
        item.code.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0E9AA7] flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Master Data & Lookup Catalogs
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Comprehensive vehicle makes, models, Qatar insurance companies, and services with QAR pricing.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openQuickLookup(activeCategory)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-xl shadow-sm transition-all cursor-pointer hover:scale-102"
        >
          <Plus className="w-4 h-4 text-teal-300" />
          <span>Add New Option</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => {
          const count = lookups.filter((l) => l.type === c.type).length;
          const isActive = activeCategory === c.type;
          return (
            <button
              key={c.type}
              type="button"
              onClick={() => {
                setActiveCategory(c.type);
                setSearchTerm('');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0B3A6E] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-teal-400 text-slate-900' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={`Search ${categories.find((c) => c.type === activeCategory)?.label}...`}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl shadow-xs focus:ring-2 focus:ring-[#0E9AA7]"
        />
      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B3A6E] text-white">
              <tr>
                <th className="p-3 w-12">#</th>
                <th className="p-3">English Name</th>
                <th className="p-3">Arabic Name (الاسم بالعربية)</th>
                <th className="p-3">Internal Code</th>
                {activeCategory === 'service' && <th className="p-3 text-right">Default Price (QAR)</th>}
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categoryItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-slate-400">{idx + 1}</td>
                  <td className="p-3 font-semibold text-slate-900">{item.labelEn}</td>
                  <td className="p-3 text-slate-700" dir="rtl">{item.labelAr || '-'}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-500">{item.code}</td>
                  {activeCategory === 'service' && (
                    <td className="p-3 text-right font-mono font-bold text-[#0E9AA7]">
                      {item.defaultPrice !== undefined ? formatQAR(item.defaultPrice) : '-'}
                    </td>
                  )}
                  <td className="p-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}

              {categoryItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No matching records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
