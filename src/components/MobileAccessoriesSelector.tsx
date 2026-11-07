import React, { useState, useEffect } from 'react';
import { Package, CheckSquare, Square, Plus, Trash2, Smartphone, Check, Sparkles } from 'lucide-react';

export interface AccessoryItem {
  id: string;
  nameEn: string;
  nameUrdu: string;
}

export const PRESET_ACCESSORIES: AccessoryItem[] = [
  { id: 'mobile_charger', nameEn: 'Mobile Charger', nameUrdu: 'موبائل چارجر' },
  { id: 'charging_cable', nameEn: 'Charging Cable', nameUrdu: 'چارجنگ کیبل' },
  { id: 'usb_cable', nameEn: 'USB Cable', nameUrdu: 'یو ایس بی کیبل' },
  { id: 'original_charger', nameEn: 'Original Charger', nameUrdu: 'اوریجنل چارجر' },
  { id: 'handsfree', nameEn: 'Handsfree', nameUrdu: 'ہینڈز فری' },
  { id: 'earphones', nameEn: 'Earphones', nameUrdu: 'ایئر فونز' },
  { id: 'bluetooth_earbuds', nameEn: 'Bluetooth Earbuds', nameUrdu: 'بلوٹوتھ ایئربڈز' },
  { id: 'airpods', nameEn: 'AirPods', nameUrdu: 'ایئر پوڈز' },
  { id: 'mobile_cover', nameEn: 'Mobile Cover', nameUrdu: 'موبائل کور' },
  { id: 'back_cover', nameEn: 'Back Cover', nameUrdu: 'بیک کور' },
  { id: 'mobile_pouch', nameEn: 'Mobile Pouch', nameUrdu: 'موبائل پاؤچ' },
  { id: 'screen_protector', nameEn: 'Screen Protector', nameUrdu: 'اسکرین پروٹیکٹر' },
  { id: 'tempered_glass', nameEn: 'Tempered Glass', nameUrdu: 'ٹیمپرد گلاس' },
  { id: 'camera_protector', nameEn: 'Camera Protector', nameUrdu: 'کیمرہ پروٹیکٹر' },
  { id: 'sim_card', nameEn: 'SIM Card', nameUrdu: 'سم کارڈ' },
  { id: 'sim_tray', nameEn: 'SIM Tray', nameUrdu: 'سم ٹرے' },
  { id: 'memory_card', nameEn: 'Memory Card', nameUrdu: 'میموری کارڈ' },
  { id: 'otg', nameEn: 'OTG', nameUrdu: 'او ٹی جی' },
  { id: 'usb_flash_drive', nameEn: 'USB Flash Drive', nameUrdu: 'یو ایس بی فلیش ڈرائیو' },
  { id: 'power_bank', nameEn: 'Power Bank', nameUrdu: 'پاور بینک' },
  { id: 'battery', nameEn: 'Battery', nameUrdu: 'بیٹری' },
  { id: 'original_box', nameEn: 'Original Box', nameUrdu: 'اوریجنل ڈبہ / باکس' },
  { id: 'warranty_card', nameEn: 'Warranty Card', nameUrdu: 'وارنٹی کارڈ' },
  { id: 'mobile_stand', nameEn: 'Mobile Stand', nameUrdu: 'موبائل اسٹینڈ' },
  { id: 'stylus_pen', nameEn: 'Stylus Pen', nameUrdu: 'اسٹائلس پین' },
  { id: 'smart_watch', nameEn: 'Smart Watch', nameUrdu: 'اسمارٹ واچ' },
  { id: 'data_cable', nameEn: 'Data Cable', nameUrdu: 'ڈیٹا کیبل' },
  { id: 'other', nameEn: 'Other', nameUrdu: 'دیگر سامان' },
];

interface MobileAccessoriesSelectorProps {
  value: string;
  onChange: (accessoriesStr: string) => void;
}

export const MobileAccessoriesSelector: React.FC<MobileAccessoriesSelectorProps> = ({
  value,
  onChange,
}) => {
  const [selectedList, setSelectedList] = useState<string[]>([]);
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Parse initial value
  useEffect(() => {
    if (!value) {
      setSelectedList([]);
      setOtherText('');
      setShowOtherInput(false);
      return;
    }

    const items = value.split(',').map((s) => s.trim()).filter(Boolean);
    const knownPresets: string[] = [];
    const customItems: string[] = [];

    items.forEach((item) => {
      const match = PRESET_ACCESSORIES.find(
        (p) => p.nameEn.toLowerCase() === item.toLowerCase() || p.id === item.toLowerCase()
      );
      if (match) {
        if (match.id === 'other') {
          // If literally 'Other'
          knownPresets.push('Other');
          setShowOtherInput(true);
        } else {
          knownPresets.push(match.nameEn);
        }
      } else {
        customItems.push(item);
      }
    });

    if (customItems.length > 0) {
      knownPresets.push('Other');
      setShowOtherInput(true);
      setOtherText(customItems.join(', '));
    }

    setSelectedList(Array.from(new Set(knownPresets)));
  }, []);

  const updateParent = (currentSelected: string[], currentOther: string) => {
    const listToSave = currentSelected.filter((item) => item !== 'Other');
    if (currentSelected.includes('Other') && currentOther.trim()) {
      listToSave.push(currentOther.trim());
    } else if (currentSelected.includes('Other')) {
      listToSave.push('Other');
    }
    onChange(listToSave.join(', '));
  };

  const handleToggleAccessory = (nameEn: string) => {
    let updated: string[];
    if (selectedList.includes(nameEn)) {
      updated = selectedList.filter((item) => item !== nameEn);
      if (nameEn === 'Other') {
        setShowOtherInput(false);
        setOtherText('');
      }
    } else {
      updated = [...selectedList, nameEn];
      if (nameEn === 'Other') {
        setShowOtherInput(true);
      }
    }
    setSelectedList(updated);
    updateParent(updated, otherText);
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    updateParent(selectedList, text);
  };

  const handleQuickSelect = (type: 'none' | 'common' | 'clear') => {
    if (type === 'none') {
      setSelectedList([]);
      setOtherText('');
      setShowOtherInput(false);
      onChange('None / صرف موبائل فون');
    } else if (type === 'clear') {
      setSelectedList([]);
      setOtherText('');
      setShowOtherInput(false);
      onChange('');
    } else if (type === 'common') {
      const common = ['Mobile Cover', 'SIM Tray'];
      setSelectedList(common);
      setShowOtherInput(false);
      updateParent(common, '');
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-[#030b1e]/90 border border-slate-700/80 space-y-3">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Accessories Received (موبائل کے ساتھ موصولہ سامان)
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[#d4af37] border border-amber-500/40 text-[10px] font-mono font-bold">
            {selectedList.length} منتخب شدہ
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          <button
            type="button"
            onClick={() => handleQuickSelect('none')}
            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
          >
            صرف موبائل (No Accessories)
          </button>
          <button
            type="button"
            onClick={() => handleQuickSelect('common')}
            className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-medium transition"
          >
            کور + سم ٹرے
          </button>
          {selectedList.length > 0 && (
            <button
              type="button"
              onClick={() => handleQuickSelect('clear')}
              className="px-2 py-0.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-medium transition"
            >
              صاف کریں
            </button>
          )}
        </div>
      </div>

      {/* Grid of Checkboxes for 28 Accessories */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
        {PRESET_ACCESSORIES.map((acc) => {
          const isChecked = selectedList.includes(acc.nameEn);
          return (
            <label
              key={acc.id}
              onClick={() => handleToggleAccessory(acc.nameEn)}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                isChecked
                  ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-[#d4af37] shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <div className="truncate">
                  <span className={`block text-xs font-semibold ${isChecked ? 'text-[#d4af37]' : 'text-slate-200'}`}>
                    {acc.nameEn}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-serif leading-tight">
                    {acc.nameUrdu}
                  </span>
                </div>
              </div>
              {isChecked && <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
            </label>
          );
        })}
      </div>

      {/* Other Accessory Custom Input */}
      {showOtherInput && (
        <div className="pt-2 border-t border-slate-800 animate-fadeIn">
          <label className="block text-xs font-semibold text-amber-300 mb-1">
            دیگر سامان کی تفصیل درج کریں (Custom Accessory Name):
          </label>
          <input
            type="text"
            placeholder="مثلاً: اصل بل، ڈبل سم، او ٹی جی اڈاپٹر..."
            value={otherText}
            onChange={(e) => handleOtherTextChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-950 border-2 border-amber-500/60 focus:border-[#d4af37] text-white text-xs focus:outline-none"
            autoFocus
          />
        </div>
      )}

      {/* Summary of Selected Accessories */}
      {value && (
        <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
          <span className="font-bold text-[#d4af37]">موصولہ سامان:</span>
          <span className="text-white font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 truncate">
            {value}
          </span>
        </div>
      )}
    </div>
  );
};
