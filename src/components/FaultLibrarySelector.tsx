import React, { useState, useMemo } from 'react';
import { JobFaultItem } from '../types';
import {
  FAULT_CATEGORIES,
  getCustomFaults,
  saveCustomFault,
  CustomFaultItem,
} from '../data/faultsLibrary';
import {
  Search,
  Check,
  Plus,
  Trash2,
  DollarSign,
  FileText,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface FaultLibrarySelectorProps {
  selectedFaults: JobFaultItem[];
  onChange: (faults: JobFaultItem[]) => void;
  onCostCalculated?: (totalCost: number) => void;
}

export const FaultLibrarySelector: React.FC<FaultLibrarySelectorProps> = ({
  selectedFaults,
  onChange,
  onCostCalculated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryCode, setActiveCategoryCode] = useState<string>('ALL');
  const [customFaults, setCustomFaults] = useState<CustomFaultItem[]>(() => getCustomFaults());
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [newCustomUrdu, setNewCustomUrdu] = useState('');
  const [newCustomEn, setNewCustomEn] = useState('');
  const [newCustomCat, setNewCustomCat] = useState('display');
  const [newCustomCost, setNewCustomCost] = useState<number>(1000);

  // Quick inline "Other" input state
  const [inlineOtherText, setInlineOtherText] = useState('');
  const [showInlineOther, setShowInlineOther] = useState(false);

  // Combine predefined faults and custom faults
  const allCategoryFaults = useMemo(() => {
    return FAULT_CATEGORIES.map((cat) => {
      const extraCustom = customFaults.filter((cf) => cf.category === cat.id);
      return {
        ...cat,
        faults: [
          ...cat.faults,
          ...extraCustom.map((ec) => ({
            id: ec.id,
            urdu: ec.urdu,
            en: ec.en,
            defaultCost: ec.defaultCost,
          })),
        ],
      };
    });
  }, [customFaults]);

  // Filtered faults based on active category and search query
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allCategoryFaults
      .filter((cat) => activeCategoryCode === 'ALL' || cat.code === activeCategoryCode)
      .map((cat) => {
        if (!q) return cat;
        const matchingFaults = cat.faults.filter(
          (f) =>
            f.urdu.toLowerCase().includes(q) ||
            f.en.toLowerCase().includes(q) ||
            cat.titleUrdu.toLowerCase().includes(q) ||
            cat.titleEn.toLowerCase().includes(q)
        );
        return {
          ...cat,
          faults: matchingFaults,
        };
      })
      .filter((cat) => cat.faults.length > 0);
  }, [allCategoryFaults, activeCategoryCode, searchQuery]);

  // Check if a fault is currently selected
  const isSelected = (faultId: string) => {
    return selectedFaults.some((sf) => sf.id === faultId);
  };

  // Toggle selection
  const handleToggleFault = (
    fault: { id: string; urdu: string; en: string; defaultCost?: number },
    categoryTitle: string
  ) => {
    const exists = selectedFaults.find((sf) => sf.id === fault.id);
    let updated: JobFaultItem[];

    if (exists) {
      updated = selectedFaults.filter((sf) => sf.id !== fault.id);
    } else {
      const newItem: JobFaultItem = {
        id: fault.id,
        category: categoryTitle,
        nameUrdu: fault.urdu,
        nameEn: fault.en,
        cost: fault.defaultCost || 0,
        status: 'Pending',
        notes: '',
      };
      updated = [...selectedFaults, newItem];
    }

    onChange(updated);
    recalcTotalCost(updated);
  };

  // Update specific fault item
  const handleUpdateFaultItem = (id: string, updates: Partial<JobFaultItem>) => {
    const updated = selectedFaults.map((f) => (f.id === id ? { ...f, ...updates } : f));
    onChange(updated);
    if (updates.cost !== undefined) {
      recalcTotalCost(updated);
    }
  };

  // Remove specific fault
  const handleRemoveFault = (id: string) => {
    const updated = selectedFaults.filter((f) => f.id !== id);
    onChange(updated);
    recalcTotalCost(updated);
  };

  const recalcTotalCost = (items: JobFaultItem[]) => {
    if (onCostCalculated) {
      const sum = items.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0);
      if (sum > 0) {
        onCostCalculated(sum);
      }
    }
  };

  // Add Inline "Other" fault
  const handleAddInlineOther = () => {
    if (!inlineOtherText.trim()) return;
    const customId = `other_${Date.now()}`;
    const newItem: JobFaultItem = {
      id: customId,
      category: 'Other / Custom Fault (متفرق خرابی)',
      nameUrdu: inlineOtherText.trim(),
      nameEn: 'Custom / Other Issue',
      cost: 1000,
      status: 'Pending',
      notes: 'Customer specific fault description',
    };
    const updated = [...selectedFaults, newItem];
    onChange(updated);
    recalcTotalCost(updated);
    setInlineOtherText('');
    setShowInlineOther(false);
  };

  // Save permanent custom fault
  const handleSavePermanentCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomUrdu.trim()) return;

    const saved = saveCustomFault({
      urdu: newCustomUrdu.trim(),
      en: newCustomEn.trim() || newCustomUrdu.trim(),
      category: newCustomCat,
      defaultCost: Number(newCustomCost) || 1000,
    });

    setCustomFaults(getCustomFaults());

    // Also auto-select it
    const catObj = FAULT_CATEGORIES.find((c) => c.id === newCustomCat);
    const newItem: JobFaultItem = {
      id: saved.id,
      category: catObj ? catObj.titleUrdu : 'Custom',
      nameUrdu: saved.urdu,
      nameEn: saved.en,
      cost: saved.defaultCost,
      status: 'Pending',
      notes: '',
    };
    const updated = [...selectedFaults, newItem];
    onChange(updated);
    recalcTotalCost(updated);

    // Reset & close
    setNewCustomUrdu('');
    setNewCustomEn('');
    setShowAddCustomModal(false);
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span>3. Complete Mobile Fault Library & Diagnosis System</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] font-bold">
              100+ Faults Available
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            موبائل فون کے تمام فالٹس کی مکمل پروفیشنل لائبریری - ملٹی سلیکشن اور چارجز کا انتظام
          </p>
        </div>

        {/* Action Buttons: Add Custom Fault */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAddCustomModal(true)}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-[#0353a4]/50 hover:bg-[#0353a4] border border-blue-400/40 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>نیا مستقل فالٹ شامل کریں</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-2.5">
        <div className="relative">
          <input
            type="text"
            placeholder="Search faults in Urdu or English (مثلاً: LCD خراب، چارجنگ، مائیک، نیٹ ورک، بوٹ لوپ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-[#d4af37] focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2 text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategoryCode('ALL')}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition ${
              activeCategoryCode === 'ALL'
                ? 'bg-[#d4af37] text-slate-950 shadow'
                : 'bg-[#030b1e] text-slate-300 border border-slate-800 hover:border-slate-700'
            }`}
          >
            All Categories (سب دیکھیں)
          </button>

          {FAULT_CATEGORIES.map((cat) => {
            const isCatActive = activeCategoryCode === cat.code;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategoryCode(cat.code)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1 border ${
                  isCatActive
                    ? 'bg-[#0466c8] text-white border-blue-400 shadow'
                    : 'bg-[#030b1e] text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="font-mono font-bold text-[#d4af37]">{cat.code}.</span>
                <span>{cat.titleUrdu}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fault Chips Grid by Categories */}
      <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs">
            کوئی مماثل فالٹ نہیں ملا۔ نیچے سے نیا فالٹ یا Other درج کریں۔
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="p-3 rounded-xl bg-[#030b1e]/80 border border-slate-800/90 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[#d4af37] font-mono font-bold text-[10px] flex items-center justify-center border border-slate-700">
                    {cat.code}
                  </span>
                  <span>{cat.titleUrdu}</span>
                  <span className="text-[11px] text-slate-400 font-normal">({cat.titleEn})</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {cat.faults.length} issues
                </span>
              </div>

              {/* Fault Chips */}
              <div className="flex flex-wrap gap-1.5">
                {cat.faults.map((f) => {
                  const active = isSelected(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleToggleFault(f, cat.titleUrdu)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border text-right dir-rtl ${
                        active
                          ? 'bg-gradient-to-r from-amber-600/40 to-blue-600/40 border-[#d4af37] text-white shadow-md ring-1 ring-[#d4af37]/60'
                          : 'bg-[#0a192f] border-slate-700/80 text-slate-300 hover:border-slate-500 hover:text-white'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        active ? 'bg-[#d4af37] text-slate-950 font-bold' : 'border border-slate-600'
                      }`}>
                        {active && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </span>
                      <span>{f.urdu}</span>
                    </button>
                  );
                })}

                {/* Inline Other Button for each category */}
                <button
                  type="button"
                  onClick={() => setShowInlineOther(true)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-dashed border-slate-600 text-slate-400 hover:text-[#d4af37] hover:border-[#d4af37] transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Other (دیگر خرابی)</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inline Other Input */}
      {showInlineOther && (
        <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2">
          <label className="text-xs font-bold text-blue-200 block">
            اپنی مرضی کا فالٹ لکھیں (Custom / Other Issue):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="مثلاً: کیمرہ گلاس پر اسکریچ، سم سلاٹ پن ٹوٹا ہوا، لاؤڈ اسپیکر پر مٹی..."
              value={inlineOtherText}
              onChange={(e) => setInlineOtherText(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-[#030b1e] border border-slate-700 text-xs text-white focus:border-[#d4af37] focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddInlineOther}
              className="px-4 py-1.5 rounded-xl bg-[#0466c8] hover:bg-blue-600 text-white text-xs font-bold"
            >
              شامل کریں
            </button>
            <button
              type="button"
              onClick={() => {
                setShowInlineOther(false);
                setInlineOtherText('');
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs hover:text-white"
            >
              منسوخ
            </button>
          </div>
        </div>
      )}

      {/* SELECTED FAULTS LIST & CONFIGURATION */}
      {selectedFaults.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>منتخب کردہ فالٹس ({selectedFaults.length})</span>
            </span>
            <span className="text-xs text-slate-400">
              ہر فالٹ کے چارجز اور اسٹیٹس کی تفصیل
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {selectedFaults.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#030b1e] border border-slate-700/80 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs"
              >
                {/* Fault Name */}
                <div className="md:col-span-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-[#d4af37] font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-white text-sm">{item.nameUrdu}</p>
                    <p className="text-[10px] text-slate-400">{item.category}</p>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="md:col-span-3">
                  <label className="block text-[9px] text-slate-400 mb-0.5 font-bold uppercase">
                    اسٹیٹس (Status)
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleUpdateFaultItem(item.id, {
                        status: e.target.value as 'Pending' | 'In Progress' | 'Completed',
                      })
                    }
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 font-semibold focus:border-[#d4af37] focus:outline-none"
                  >
                    <option value="Pending">Pending (زیر التواء)</option>
                    <option value="In Progress">In Progress (جاری ہے)</option>
                    <option value="Completed">Completed (مکمل ہو گیا)</option>
                  </select>
                </div>

                {/* Cost Input */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] text-slate-400 mb-0.5 font-bold uppercase">
                    چارجز (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={item.cost || 0}
                    onChange={(e) =>
                      handleUpdateFaultItem(item.id, {
                        cost: Number(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-[#d4af37] font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                {/* Notes Input */}
                <div className="md:col-span-2">
                  <label className="block text-[9px] text-slate-400 mb-0.5 font-bold uppercase">
                    نوٹس (Notes)
                  </label>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) =>
                      handleUpdateFaultItem(item.id, { notes: e.target.value })
                    }
                    placeholder="e.g. OLED A+"
                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:border-[#d4af37] focus:outline-none"
                  />
                </div>

                {/* Remove button */}
                <div className="md:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveFault(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                    title="Remove Fault"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Sum Summary */}
          <div className="p-2.5 bg-gradient-to-r from-blue-950/40 to-slate-900 rounded-xl border border-blue-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">
              کل منتخب فالٹس: <strong className="text-white">{selectedFaults.length}</strong>
            </span>
            <span className="text-[#d4af37] font-bold font-mono">
              کل متوقع لاگت: PKR{' '}
              {selectedFaults
                .reduce((acc, c) => acc + (Number(c.cost) || 0), 0)
                .toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW PERMANENT CUSTOM FAULT */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-5 shadow-2xl space-y-4 bg-[#0a192f] border border-[#d4af37]/40">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>نیا فالٹ مستقل لسٹ میں شامل کریں</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSavePermanentCustom} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  کیٹیگری (Category) *
                </label>
                <select
                  value={newCustomCat}
                  onChange={(e) => setNewCustomCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-medium focus:border-[#d4af37] focus:outline-none"
                >
                  {FAULT_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code}. {c.titleUrdu} ({c.titleEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  اردو نام (Urdu Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: فولڈ ایبل ڈسپلے ہینج مسئلہ"
                  value={newCustomUrdu}
                  onChange={(e) => setNewCustomUrdu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  انگریزی نام (English Name - Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Foldable Screen Hinge Issue"
                  value={newCustomEn}
                  onChange={(e) => setNewCustomEn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  معمول کے چارجز (Default Cost in PKR)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newCustomCost}
                  onChange={(e) => setNewCustomCost(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-[#d4af37] font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  منسوخ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#0466c8] hover:bg-blue-600 text-white font-bold flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>محفوظ کریں</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
