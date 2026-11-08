import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, 
  Search, 
  X, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Sparkles,
  Smartphone,
  Layers,
  CheckCircle2,
  Filter
} from 'lucide-react';

export interface AccessoryItem {
  id: string;
  number: number;
  nameEn: string;
  nameUrdu: string;
  category: 'Chargers & Power' | 'Cables' | 'Audio' | 'Covers & Glass' | 'Storage & SIM' | 'Holders & Stands' | 'Wearables & Other';
}

export const ALL_41_ACCESSORIES: AccessoryItem[] = [
  { id: 'mobile_charger', number: 1, nameEn: 'Mobile Charger', nameUrdu: 'موبائل چارجر', category: 'Chargers & Power' },
  { id: 'original_charger', number: 2, nameEn: 'Original Charger', nameUrdu: 'اوریجنل چارجر', category: 'Chargers & Power' },
  { id: 'fast_charger', number: 3, nameEn: 'Fast Charger', nameUrdu: 'فاسٹ چارجر', category: 'Chargers & Power' },
  { id: 'charging_cable', number: 4, nameEn: 'Charging Cable', nameUrdu: 'چارجنگ کیبل', category: 'Cables' },
  { id: 'data_cable', number: 5, nameEn: 'Data Cable', nameUrdu: 'ڈیٹا کیبل', category: 'Cables' },
  { id: 'usb_cable', number: 6, nameEn: 'USB Cable', nameUrdu: 'یو ایس بی کیبل', category: 'Cables' },
  { id: 'type_c_cable', number: 7, nameEn: 'Type-C Cable', nameUrdu: 'ٹائپ سی کیبل', category: 'Cables' },
  { id: 'micro_usb_cable', number: 8, nameEn: 'Micro USB Cable', nameUrdu: 'مائیکرو یو ایس بی کیبل', category: 'Cables' },
  { id: 'lightning_cable', number: 9, nameEn: 'Lightning Cable', nameUrdu: 'لائٹننگ (آئی فون) کیبل', category: 'Cables' },
  { id: 'handsfree', number: 10, nameEn: 'Handsfree', nameUrdu: 'ہینڈز فری', category: 'Audio' },
  { id: 'earphones', number: 11, nameEn: 'Earphones', nameUrdu: 'ایئر فونز', category: 'Audio' },
  { id: 'bluetooth_handsfree', number: 12, nameEn: 'Bluetooth Handsfree', nameUrdu: 'بلوٹوتھ ہینڈز فری', category: 'Audio' },
  { id: 'airpods', number: 13, nameEn: 'AirPods', nameUrdu: 'ایئر پوڈز', category: 'Audio' },
  { id: 'mobile_cover', number: 14, nameEn: 'Mobile Cover', nameUrdu: 'موبائل کور', category: 'Covers & Glass' },
  { id: 'back_cover', number: 15, nameEn: 'Back Cover', nameUrdu: 'بیک کور', category: 'Covers & Glass' },
  { id: 'flip_cover', number: 16, nameEn: 'Flip Cover', nameUrdu: 'فلپ کور', category: 'Covers & Glass' },
  { id: 'mobile_glass', number: 17, nameEn: 'Mobile Glass', nameUrdu: 'موبائل گلاس', category: 'Covers & Glass' },
  { id: 'tempered_glass', number: 18, nameEn: 'Tempered Glass', nameUrdu: 'ٹیمپرد گلاس', category: 'Covers & Glass' },
  { id: 'privacy_glass', number: 19, nameEn: 'Privacy Glass', nameUrdu: 'پرائیویسی گلاس', category: 'Covers & Glass' },
  { id: 'camera_protector', number: 20, nameEn: 'Camera Protector', nameUrdu: 'کیمرہ پروٹیکٹر', category: 'Covers & Glass' },
  { id: 'mobile_protector', number: 21, nameEn: 'Mobile Protector', nameUrdu: 'موبائل پروٹیکٹر', category: 'Covers & Glass' },
  { id: 'battery', number: 22, nameEn: 'Battery', nameUrdu: 'بیٹری', category: 'Chargers & Power' },
  { id: 'power_bank', number: 23, nameEn: 'Power Bank', nameUrdu: 'پاور بینک', category: 'Chargers & Power' },
  { id: 'memory_card', number: 24, nameEn: 'Memory Card', nameUrdu: 'میموری کارڈ', category: 'Storage & SIM' },
  { id: 'usb_flash_drive', number: 25, nameEn: 'USB Flash Drive', nameUrdu: 'یو ایس بی فلیش ڈرائیو', category: 'Storage & SIM' },
  { id: 'otg', number: 26, nameEn: 'OTG', nameUrdu: 'او ٹی جی', category: 'Storage & SIM' },
  { id: 'sim_card', number: 27, nameEn: 'SIM Card', nameUrdu: 'سم کارڈ', category: 'Storage & SIM' },
  { id: 'sim_tray', number: 28, nameEn: 'SIM Tray', nameUrdu: 'سم ٹرے', category: 'Storage & SIM' },
  { id: 'mobile_stand', number: 29, nameEn: 'Mobile Stand', nameUrdu: 'موبائل اسٹینڈ', category: 'Holders & Stands' },
  { id: 'mobile_holder', number: 30, nameEn: 'Mobile Holder', nameUrdu: 'موبائل ہولڈر', category: 'Holders & Stands' },
  { id: 'ring_holder', number: 31, nameEn: 'Ring Holder', nameUrdu: 'رنگ ہولڈر', category: 'Holders & Stands' },
  { id: 'mobile_pouch', number: 32, nameEn: 'Mobile Pouch', nameUrdu: 'موبائل پاؤچ', category: 'Covers & Glass' },
  { id: 'speaker', number: 33, nameEn: 'Speaker', nameUrdu: 'اسپیکر', category: 'Audio' },
  { id: 'bluetooth_speaker', number: 34, nameEn: 'Bluetooth Speaker', nameUrdu: 'بلوٹوتھ اسپیکر', category: 'Audio' },
  { id: 'microphone', number: 35, nameEn: 'Microphone', nameUrdu: 'مائیکروفون / مائیک', category: 'Audio' },
  { id: 'wireless_charger', number: 36, nameEn: 'Wireless Charger', nameUrdu: 'وائرلیس چارجر', category: 'Chargers & Power' },
  { id: 'car_charger', number: 37, nameEn: 'Car Charger', nameUrdu: 'کار چارجر', category: 'Chargers & Power' },
  { id: 'car_mobile_holder', number: 38, nameEn: 'Car Mobile Holder', nameUrdu: 'کار موبائل ہولڈر', category: 'Holders & Stands' },
  { id: 'smart_watch', number: 39, nameEn: 'Smart Watch', nameUrdu: 'اسمارٹ واچ', category: 'Wearables & Other' },
  { id: 'watch_charger', number: 40, nameEn: 'Watch Charger', nameUrdu: 'واچ چارجر', category: 'Chargers & Power' },
  { id: 'other_accessories', number: 41, nameEn: 'Other Accessories', nameUrdu: 'دیگر سامان', category: 'Wearables & Other' },
];

export const PRESET_ACCESSORIES = ALL_41_ACCESSORIES;

interface MobileAccessoriesSelectorProps {
  value: string;
  onChange: (accessoriesStr: string) => void;
}

export const MobileAccessoriesSelector: React.FC<MobileAccessoriesSelectorProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [otherCustomText, setOtherCustomText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse incoming value string into selected array
  useEffect(() => {
    if (!value) {
      setSelectedItems([]);
      setOtherCustomText('');
      return;
    }

    const rawParts = value.split(',').map((p) => p.trim()).filter(Boolean);
    const parsedPresets: string[] = [];
    const customParts: string[] = [];

    rawParts.forEach((part) => {
      const match = ALL_41_ACCESSORIES.find(
        (a) => a.nameEn.toLowerCase() === part.toLowerCase() || a.id === part.toLowerCase()
      );
      if (match) {
        parsedPresets.push(match.nameEn);
      } else if (part.toLowerCase().startsWith('other:') || part.toLowerCase().startsWith('other -')) {
        parsedPresets.push('Other Accessories');
        customParts.push(part.replace(/^other[:\s-]+/i, '').trim());
      } else if (part.toLowerCase() === 'other' || part.toLowerCase() === 'other accessories') {
        parsedPresets.push('Other Accessories');
      } else if (part.toLowerCase() === 'none / صرف موبائل فون' || part.toLowerCase() === 'none') {
        parsedPresets.push('None');
      } else {
        // Custom item entered previously
        parsedPresets.push('Other Accessories');
        customParts.push(part);
      }
    });

    setSelectedItems(Array.from(new Set(parsedPresets)));
    if (customParts.length > 0) {
      setOtherCustomText(customParts.join(', '));
    }
  }, [value]);

  // Sync back to parent
  const emitChange = (newSelected: string[], customText: string) => {
    if (newSelected.length === 0) {
      onChange('');
      return;
    }

    if (newSelected.includes('None')) {
      onChange('None / صرف موبائل فون');
      return;
    }

    const itemsToJoin: string[] = [];
    newSelected.forEach((item) => {
      if (item === 'Other Accessories') {
        if (customText.trim()) {
          itemsToJoin.push(`Other: ${customText.trim()}`);
        } else {
          itemsToJoin.push('Other Accessories');
        }
      } else if (item !== 'None') {
        itemsToJoin.push(item);
      }
    });

    onChange(itemsToJoin.join(', '));
  };

  const handleToggleItem = (nameEn: string) => {
    let updated: string[];
    // If selecting an item while 'None' is active, remove 'None'
    const cleanList = selectedItems.filter((i) => i !== 'None');

    if (cleanList.includes(nameEn)) {
      updated = cleanList.filter((item) => item !== nameEn);
      if (nameEn === 'Other Accessories') {
        setOtherCustomText('');
      }
    } else {
      updated = [...cleanList, nameEn];
    }

    setSelectedItems(updated);
    emitChange(updated, otherCustomText);
  };

  const handleRemoveSingleBadge = (nameEn: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = selectedItems.filter((i) => i !== nameEn);
    setSelectedItems(updated);
    if (nameEn === 'Other Accessories') {
      setOtherCustomText('');
      emitChange(updated, '');
    } else {
      emitChange(updated, otherCustomText);
    }
  };

  const handleCustomTextChange = (text: string) => {
    setOtherCustomText(text);
    if (!selectedItems.includes('Other Accessories')) {
      const updated = [...selectedItems.filter((i) => i !== 'None'), 'Other Accessories'];
      setSelectedItems(updated);
      emitChange(updated, text);
    } else {
      emitChange(selectedItems, text);
    }
  };

  const handleQuickPreset = (type: 'none' | 'common' | 'clear') => {
    if (type === 'none') {
      setSelectedItems(['None']);
      setOtherCustomText('');
      emitChange(['None'], '');
    } else if (type === 'common') {
      const common = ['Mobile Cover', 'SIM Tray'];
      setSelectedItems(common);
      emitChange(common, otherCustomText);
    } else if (type === 'clear') {
      setSelectedItems([]);
      setOtherCustomText('');
      emitChange([], '');
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Categories list
  const categories = useMemo(() => {
    return [
      'All',
      'Chargers & Power',
      'Cables',
      'Audio',
      'Covers & Glass',
      'Storage & SIM',
      'Holders & Stands',
      'Wearables & Other',
      'Selected Only'
    ];
  }, []);

  // Filtered accessories based on search and category
  const filteredAccessories = useMemo(() => {
    return ALL_41_ACCESSORIES.filter((item) => {
      // Category filter
      if (activeCategory === 'Selected Only') {
        if (!selectedItems.includes(item.nameEn)) return false;
      } else if (activeCategory !== 'All' && item.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.nameEn.toLowerCase().includes(q) ||
        item.nameUrdu.includes(q) ||
        String(item.number) === q
      );
    });
  }, [activeCategory, searchQuery, selectedItems]);

  const isNoneSelected = selectedItems.includes('None');
  const actualSelectedCount = isNoneSelected ? 0 : selectedItems.length;

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Label and Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <Package className="w-4 h-4 text-[#d4af37]" />
          <span>Accessories Received / موصولہ سامان</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#d4af37] border border-amber-500/40 text-[10px] font-mono font-bold">
            {isNoneSelected ? 'صرف موبائل فون' : `${actualSelectedCount} منتخب شدہ`}
          </span>
        </label>

        {/* Quick Helper Buttons */}
        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            type="button"
            onClick={() => handleQuickPreset('none')}
            className={`px-2 py-0.5 rounded-lg border font-medium transition ${
              isNoneSelected
                ? 'bg-amber-500/30 border-[#d4af37] text-white font-bold'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            صرف موبائل (None)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('common')}
            className="px-2 py-0.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-medium transition"
          >
            کور + سم ٹرے
          </button>
          {(selectedItems.length > 0 || isNoneSelected) && (
            <button
              type="button"
              onClick={() => handleQuickPreset('clear')}
              className="px-2 py-0.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-medium transition"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Main Trigger Box (Click to Open Dropdown) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full min-h-[46px] p-2.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between gap-2 shadow-sm ${
          isOpen
            ? 'bg-slate-900 border-[#d4af37] ring-2 ring-[#d4af37]/20'
            : 'bg-[#030b1e] border-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="flex-1 flex flex-wrap items-center gap-1.5 min-w-0">
          {selectedItems.length === 0 ? (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Plus className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>کلک کریں اور موصولہ سامان (Accessories) منتخب کریں (کل 41 آئٹمز)...</span>
            </div>
          ) : isNoneSelected ? (
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>صرف موبائل فون (No Accessories)</span>
            </span>
          ) : (
            selectedItems.map((itemName) => {
              const accObj = ALL_41_ACCESSORIES.find((a) => a.nameEn === itemName);
              return (
                <span
                  key={itemName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-[#d4af37] border border-amber-500/50 text-xs font-semibold shadow-sm animate-fadeIn"
                >
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>{itemName}</span>
                  {accObj && (
                    <span className="text-[10px] text-amber-200/80 font-serif" dir="rtl">
                      ({accObj.nameUrdu})
                    </span>
                  )}
                  {itemName === 'Other Accessories' && otherCustomText && (
                    <span className="text-[10px] text-white bg-black/40 px-1 rounded font-mono">
                      : {otherCustomText}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSingleBadge(itemName, e)}
                    className="p-0.5 hover:bg-amber-500/40 rounded-full text-amber-200 hover:text-white transition"
                    title="Remove item"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[#d4af37] font-bold hidden sm:inline">
            {isOpen ? 'لسٹ بند کریں' : 'پوری لسٹ کھولیں'}
          </span>
          <div className="p-1.5 rounded-lg bg-slate-800 text-[#d4af37]">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* DROPDOWN MULTI-SELECT PANEL */}
      {isOpen && (
        <div className="w-full mt-1.5 rounded-2xl bg-gradient-to-b from-[#0a192f] via-[#030b1e] to-[#0a192f] border-2 border-[#d4af37]/70 shadow-2xl p-3 sm:p-4 space-y-3 z-30 animate-fadeIn">
          
          {/* Top Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="41 سامان میں سے تلاش کریں (Search English or اردو)..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-[#d4af37] focus:outline-none placeholder-slate-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
              <span className="text-slate-400 text-[11px] font-mono">
                {filteredAccessories.length} میں سے {actualSelectedCount} منتخب
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Done / مکمل</span>
              </button>
            </div>
          </div>

          {/* Quick Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {cat === 'Selected Only' ? `Selected (${actualSelectedCount})` : cat}
                </button>
              );
            })}
          </div>

          {/* 41 ACCESSORIES MULTI-SELECT LIST (Interactive clickable rows) */}
          <div className="max-h-[320px] overflow-y-auto pr-1 space-y-1.5 divide-y divide-slate-800/40">
            {filteredAccessories.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <Package className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs">کوئی مماثل سامان نہیں ملا (No matching accessory found)</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-amber-300 text-xs font-semibold"
                >
                  تمام 41 لسٹ دکھائیں
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {filteredAccessories.map((item) => {
                  const isSelected = selectedItems.includes(item.nameEn);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.nameEn)}
                      className={`p-2.5 rounded-xl border-2 cursor-pointer transition select-none flex items-center justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-amber-500/20 border-[#d4af37] text-white shadow-md shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-mono font-bold shrink-0 transition ${
                            isSelected
                              ? 'bg-[#d4af37] text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : item.number}
                        </span>

                        <div className="min-w-0 truncate">
                          <span
                            className={`block text-xs font-bold leading-tight truncate ${
                              isSelected ? 'text-[#d4af37]' : 'text-slate-100'
                            }`}
                          >
                            {item.nameEn}
                          </span>
                          <span className="block text-[11px] text-slate-400 font-serif leading-tight mt-0.5" dir="rtl">
                            {item.nameUrdu}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                            isSelected
                              ? 'bg-amber-500/30 text-amber-200 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isSelected ? 'منتخب' : item.category.split(' ')[0]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ITEM #41 OTHER ACCESSORIES CUSTOM INPUT BOX */}
          {selectedItems.includes('Other Accessories') && (
            <div className="p-3 rounded-xl bg-amber-500/10 border-2 border-amber-500/60 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>41. Other Accessories / دیگر موصولہ سامان کی تفصیل درج کریں:</span>
                </span>
                <span className="text-[10px] text-slate-400">مثلاً: اصل بل، ڈبل سم، او ٹی جی وغیرہ</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={otherCustomText}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  placeholder="دیگر سامان کا نام یہاں لکھیں (Enter custom accessory details)..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/60 focus:border-[#d4af37] text-white text-xs sm:text-sm focus:outline-none font-medium"
                />
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">منتخب شدہ سامان:</span>
              <span className="font-bold text-[#d4af37] font-mono">
                {actualSelectedCount} Accessories
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0353a4] to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Check className="w-4 h-4 text-[#d4af37]" />
              <span>محفوظ کریں اور فارم پر واپس جائیں (Done)</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
