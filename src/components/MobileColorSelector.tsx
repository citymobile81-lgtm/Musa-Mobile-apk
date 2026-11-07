import React, { useState, useRef, useEffect } from 'react';
import { Palette, Search, Check, ChevronDown, Sparkles } from 'lucide-react';

export interface ColorOption {
  name: string;
  urduName: string;
  hex: string;
  border?: boolean;
}

export const PRESET_MOBILE_COLORS: ColorOption[] = [
  { name: 'Black', urduName: 'سیاہ (بلیک)', hex: '#111827' },
  { name: 'White', urduName: 'سفید (وائٹ)', hex: '#f9fafb', border: true },
  { name: 'Blue', urduName: 'نیلا (بلیو)', hex: '#2563eb' },
  { name: 'Sky Blue', urduName: 'آسمانی نیلا (اسکائی بلیو)', hex: '#38bdf8' },
  { name: 'Dark Blue', urduName: 'گہرا نیلا (ڈارک بلیو)', hex: '#1e3a8a' },
  { name: 'Red', urduName: 'سرخ (ریڈ)', hex: '#dc2626' },
  { name: 'Green', urduName: 'سبز (گرین)', hex: '#16a34a' },
  { name: 'Dark Green', urduName: 'گہرا سبز (ڈارک گرین)', hex: '#14532d' },
  { name: 'Light Green', urduName: 'ہلکا سبز (لائٹ گرین)', hex: '#86efac' },
  { name: 'Yellow', urduName: 'پیلا (ییلو)', hex: '#eab308' },
  { name: 'Gold', urduName: 'سنہری (گولڈ)', hex: '#d4af37' },
  { name: 'Rose Gold', urduName: 'گلابی سنہری (روز گولڈ)', hex: '#b76e79' },
  { name: 'Silver', urduName: 'چاندی (سلور)', hex: '#cbd5e1' },
  { name: 'Gray', urduName: 'سرمئی (گرے)', hex: '#64748b' },
  { name: 'Space Gray', urduName: 'اسپیس گرے', hex: '#4b5563' },
  { name: 'Purple', urduName: 'جامنی (پرپل)', hex: '#9333ea' },
  { name: 'Lavender', urduName: 'لیونڈر', hex: '#c084fc' },
  { name: 'Pink', urduName: 'گلابی (پنک)', hex: '#ec4899' },
  { name: 'Orange', urduName: 'نارنجی (اورنج)', hex: '#f97316' },
  { name: 'Brown', urduName: 'کتھئی (براؤن)', hex: '#78350f' },
  { name: 'Bronze', urduName: 'کانسی (برونز)', hex: '#cd7f32' },
  { name: 'Titanium', urduName: 'ٹائٹینیم', hex: '#878681' },
  { name: 'Natural Titanium', urduName: 'نیچرل ٹائٹینیم', hex: '#9f9c96' },
  { name: 'Desert Titanium', urduName: 'ڈیزرٹ ٹائٹینیم', hex: '#c5b59e' },
  { name: 'Midnight', urduName: 'مڈ نائٹ (گہرا نیلا سیاہ)', hex: '#191f28' },
  { name: 'Starlight', urduName: 'اسٹار لائٹ (ہلکا سنہری کریم)', hex: '#faf7f2', border: true },
  { name: 'Graphite', urduName: 'گریفائٹ', hex: '#383838' },
  { name: 'Cream', urduName: 'کریم', hex: '#fffdd0', border: true },
  { name: 'Beige', urduName: 'بیج', hex: '#f5f5dc', border: true },
  { name: 'Navy Blue', urduName: 'نیوی بلیو', hex: '#0f172a' },
  { name: 'Mint Green', urduName: 'منٹ گرین', hex: '#6ee7b7' },
  { name: 'Teal', urduName: 'ٹیل (سبزی مائل نیلا)', hex: '#0d9488' },
  { name: 'Coral', urduName: 'کورل', hex: '#ff7f50' },
  { name: 'Burgundy', urduName: 'برگنڈی (گہرا سرخ)', hex: '#800020' },
  { name: 'Other', urduName: 'دیگر رنگ (کسٹم)', hex: 'transparent' },
];

interface MobileColorSelectorProps {
  value: string;
  onChange: (color: string) => void;
  required?: boolean;
}

export const MobileColorSelector: React.FC<MobileColorSelectorProps> = ({
  value,
  onChange,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customColorInput, setCustomColorInput] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current match
  const matchedPreset = PRESET_MOBILE_COLORS.find(
    (c) => c.name.toLowerCase() === (value || '').trim().toLowerCase()
  );

  useEffect(() => {
    // If value doesn't match preset and is not empty, it's custom
    if (value && !matchedPreset) {
      setIsCustomMode(true);
      setCustomColorInput(value);
    }
  }, [value, matchedPreset]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredColors = PRESET_MOBILE_COLORS.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.urduName.toLowerCase().includes(q);
  });

  const handleSelectColor = (c: ColorOption) => {
    if (c.name === 'Other') {
      setIsCustomMode(true);
      setCustomColorInput(value && value !== 'Other' ? value : '');
      onChange(customColorInput || 'Custom Color');
      setIsOpen(false);
    } else {
      setIsCustomMode(false);
      onChange(c.name);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleCustomChange = (text: string) => {
    setCustomColorInput(text);
    onChange(text);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Device Color / موبائل کا رنگ {required && '*'}</span>
        </span>
        {isCustomMode && (
          <button
            type="button"
            onClick={() => {
              setIsCustomMode(false);
              onChange('Black');
            }}
            className="text-[10px] text-amber-400 hover:underline"
          >
            ← رنگ لسٹ پر واپس
          </button>
        )}
      </label>

      {/* Selector Trigger Button */}
      {!isCustomMode ? (
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 hover:border-slate-600 focus:border-[#d4af37] text-white text-xs cursor-pointer flex items-center justify-between transition shadow-inner"
        >
          <div className="flex items-center gap-2 truncate">
            {matchedPreset ? (
              <>
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                  style={{
                    backgroundColor: matchedPreset.hex,
                    border: matchedPreset.border ? '1px solid #94a3b8' : 'none',
                  }}
                />
                <span className="font-semibold">{matchedPreset.name}</span>
                <span className="text-[10px] text-slate-400">({matchedPreset.urduName})</span>
              </>
            ) : value ? (
              <>
                <Palette className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-semibold">{value}</span>
              </>
            ) : (
              <span className="text-slate-400">موبائل کا رنگ منتخب کریں...</span>
            )}
          </div>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      ) : (
        /* Custom Color Input Field */
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            required={required}
            placeholder="اپنی مرضی کا رنگ لکھیں (مثلاً Dark Matt Black)..."
            value={customColorInput}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-[#030b1e] border-2 border-amber-500/60 focus:border-[#d4af37] text-white text-xs focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Open Color List"
          >
            <Palette className="w-3.5 h-3.5 text-[#d4af37]" />
          </button>
        </div>
      )}

      {/* Dropdown Menu with Search */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-[#0a192f] border-2 border-[#d4af37]/80 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
          {/* Search Box */}
          <div className="p-2 bg-[#030b1e] border-b border-slate-800">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="رنگ تلاش کریں (Search color e.g. Titanium, Blue, Gold)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-[#d4af37]"
                autoFocus
              />
            </div>
          </div>

          {/* Color Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 text-xs">
            {filteredColors.map((c) => {
              const isSelected = value?.toLowerCase() === c.name.toLowerCase();
              return (
                <div
                  key={c.name}
                  onClick={() => handleSelectColor(c)}
                  className={`p-2.5 hover:bg-[#0353a4]/40 cursor-pointer flex items-center justify-between transition ${
                    isSelected ? 'bg-amber-500/20 text-[#d4af37] font-bold' : 'text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {c.name === 'Other' ? (
                      <span className="w-4 h-4 rounded-full border border-dashed border-amber-400 flex items-center justify-center text-[10px] text-amber-400">
                        +
                      </span>
                    ) : (
                      <span
                        className="w-4 h-4 rounded-full shrink-0 shadow"
                        style={{
                          backgroundColor: c.hex,
                          border: c.border ? '1px solid #94a3b8' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      />
                    )}
                    <div>
                      <span className="font-semibold block">{c.name}</span>
                      <span className="text-[10px] text-slate-400 block">{c.urduName}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#d4af37]" />}
                </div>
              );
            })}

            {filteredColors.length === 0 && (
              <div className="p-3 text-center text-slate-400 text-xs">
                <p>کوئی رنگ نہیں ملا۔</p>
                <button
                  type="button"
                  onClick={() => {
                    handleCustomChange(searchQuery);
                    setIsCustomMode(true);
                    setIsOpen(false);
                  }}
                  className="mt-1.5 text-xs text-amber-400 underline font-bold"
                >
                  "{searchQuery}" کو کسٹم رنگ کے طور پر منتخب کریں
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
