import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PHONE_BRANDS, getModelsForBrand, saveCustomModel, PhoneBrand } from '../services/modelsDatabase';
import { Smartphone, Search, Plus, Check, ChevronDown, Sparkles, Edit3, X } from 'lucide-react';

interface MobileModelSelectorProps {
  company: string;
  onCompanyChange: (newCompany: string) => void;
  model: string;
  onModelChange: (newModel: string) => void;
  extraCompanies?: string[];
  disabled?: boolean;
}

export const MobileModelSelector: React.FC<MobileModelSelectorProps> = ({
  company,
  onCompanyChange,
  model,
  onModelChange,
  extraCompanies = [],
  disabled = false,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOtherModelMode, setIsOtherModelMode] = useState(false);
  const [otherModelInput, setOtherModelInput] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine current brand ID
  const currentBrandId = useMemo(() => {
    const cLower = company.toLowerCase().trim();
    if (cLower.includes('iphone') || cLower.includes('apple')) return 'apple';
    if (cLower.includes('samsung')) return 'samsung';
    if (cLower.includes('vivo')) return 'vivo';
    if (cLower.includes('oppo')) return 'oppo';
    if (cLower.includes('xiaomi') || cLower.includes('redmi') || cLower.includes('poco')) return 'xiaomi';
    if (cLower.includes('realme')) return 'realme';
    if (cLower.includes('tecno')) return 'tecno';
    if (cLower.includes('infinix')) return 'infinix';
    if (cLower.includes('nokia')) return 'nokia';
    if (cLower.includes('moto')) return 'motorola';
    if (cLower.includes('huawei') || cLower.includes('honor')) return 'huawei';
    if (cLower.includes('oneplus')) return 'oneplus';
    if (cLower.includes('pixel') || cLower.includes('google')) return 'google';
    if (cLower.includes('itel')) return 'itel';
    
    const matched = PHONE_BRANDS.find(b => b.name.toLowerCase() === cLower || b.id === cLower);
    return matched ? matched.id : 'other';
  }, [company]);

  // Load models for this company
  const availableModels = useMemo(() => {
    return getModelsForBrand(currentBrandId);
  }, [currentBrandId]);

  // Filter models based on search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return availableModels;
    const q = searchQuery.toLowerCase().trim();
    return availableModels.filter(m => m.toLowerCase().includes(q));
  }, [availableModels, searchQuery]);

  // Check if current model is in available list
  const isCustomModel = model && !availableModels.includes(model);

  const handleSelectCompany = (newCompany: string) => {
    onCompanyChange(newCompany);
    onModelChange(''); // Reset model when company changes
    setSearchQuery('');
    setIsOtherModelMode(false);
  };

  const handleSelectModel = (selectedModelName: string) => {
    onModelChange(selectedModelName);
    setIsModelDropdownOpen(false);
    setIsOtherModelMode(false);
    setSearchQuery('');
  };

  const handleSaveOtherModel = () => {
    const trimmed = otherModelInput.trim();
    if (!trimmed) return;
    saveCustomModel(currentBrandId, trimmed);
    onModelChange(trimmed);
    setOtherModelInput('');
    setIsOtherModelMode(false);
    setIsModelDropdownOpen(false);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {/* 1. Mobile Company Selection */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>موبائل کمپنی / Mobile Brand *</span>
          </span>
          <span className="text-[10px] text-amber-400 font-serif">پہلے کمپنی منتخب کریں</span>
        </label>
        
        <div className="relative">
          <select
            value={company}
            disabled={disabled}
            onChange={(e) => handleSelectCompany(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs font-semibold focus:border-[#d4af37] focus:outline-none appearance-none cursor-pointer pr-8 shadow-inner"
          >
            {PHONE_BRANDS.map((b) => (
              <option key={b.id} value={b.name} className="bg-slate-900 text-white py-1">
                {b.name} — {b.urduName} ({b.popularModels.length} ماڈلز)
              </option>
            ))}
            {extraCompanies
              .filter(c => !PHONE_BRANDS.some(b => b.name === c))
              .map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white py-1">
                  {c} (دیگر برانڈ)
                </option>
              ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronDown className="w-4 h-4 text-[#d4af37]" />
          </div>
        </div>
      </div>

      {/* 2. Mobile Model Selection (Dynamic for Company with Search & Other Model) */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <span>موبائل ماڈل / Model Name *</span>
            <span className="text-[10px] text-slate-400 font-mono">({availableModels.length} ماڈلز)</span>
          </label>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOtherModelMode(true);
              setIsModelDropdownOpen(true);
            }}
            className="text-[11px] text-yellow-400 hover:text-yellow-300 flex items-center gap-1 font-semibold cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            <span>دیگر ماڈل / Other Model</span>
          </button>
        </div>

        {/* Selected Model Input Trigger Box */}
        <div
          onClick={() => {
            if (!disabled) {
              setIsModelDropdownOpen(!isModelDropdownOpen);
            }
          }}
          className={`w-full px-3 py-2 rounded-xl bg-[#030b1e] border transition flex items-center justify-between cursor-pointer select-none ${
            isModelDropdownOpen ? 'border-yellow-400 shadow-md shadow-yellow-500/10' : 'border-slate-700 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {model ? (
              <span className="text-white text-xs font-bold tracking-wide truncate">
                {model}
                {isCustomModel && (
                  <span className="ml-1.5 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-yellow-300 font-mono">
                    Custom
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-500 text-xs italic">
                {company} کے ماڈلز میں سے منتخب کریں یا سرچ کریں...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-slate-400 shrink-0">
            <span className="text-[10px] text-yellow-400/80 hidden sm:inline">ماڈل لسٹ</span>
            <ChevronDown className={`w-4 h-4 text-[#d4af37] transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu Modal */}
        {isModelDropdownOpen && (
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0a192f] border border-[#d4af37]/50 rounded-2xl shadow-2xl p-3 space-y-2.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
            
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span className="text-[#d4af37] font-black">{company}</span>
                <span className="text-slate-400">کے تمام ماڈلز</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Other Model / Custom Model Input Mode */}
            {isOtherModelMode ? (
              <div className="p-2.5 bg-[#030b1e] rounded-xl border border-amber-500/50 space-y-2">
                <div className="flex items-center justify-between text-xs text-amber-300 font-bold" dir="rtl">
                  <span>نیا یا دیگر ماڈل لکھیں (Other Model):</span>
                  <button
                    type="button"
                    onClick={() => setIsOtherModelMode(false)}
                    className="text-[10px] text-slate-400 hover:text-white font-sans"
                  >
                    واپس لسٹ
                  </button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder={`e.g. ${company} New Model...`}
                    value={otherModelInput}
                    onChange={(e) => setOtherModelInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveOtherModel();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveOtherModel}
                    className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs shrink-0 cursor-pointer"
                  >
                    شامل کریں
                  </button>
                </div>
              </div>
            ) : (
              /* Search Input */
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  placeholder={`🔍 ماڈل سرچ کریں (${company})...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            )}

            {/* Models Scrollable Grid / List */}
            <div className="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {filteredModels.length > 0 ? (
                filteredModels.map((m) => {
                  const isSelected = model === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectModel(m)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 font-bold'
                          : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{m}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-yellow-400 shrink-0 ml-2" />}
                    </button>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-slate-400 space-y-1">
                  <p>اس نام سے کوئی ماڈل نہیں ملا۔</p>
                  <button
                    type="button"
                    onClick={() => {
                      setOtherModelInput(searchQuery);
                      setIsOtherModelMode(true);
                    }}
                    className="text-yellow-400 hover:underline font-bold text-xs"
                  >
                    "{searchQuery}" بطور نیا ماڈل محفوظ کریں؟
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Bar with "Other Model" shortcut */}
            {!isOtherModelMode && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">
                  {filteredModels.length} دستیاب ماڈلز
                </span>
                <button
                  type="button"
                  onClick={() => setIsOtherModelMode(true)}
                  className="text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Other Model (خود ٹائپ کریں)</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
