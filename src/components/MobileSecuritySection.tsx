import React, { useState } from 'react';
import { SecurityType } from '../types';
import { PatternLock } from './PatternLock';
import {
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Eye,
  EyeOff,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export interface MobileSecurityData {
  securityType: SecurityType;
  securityValue: string;
  securityNotes: string;
  securityConsent: boolean;
  securityWiped: boolean;
  patternVerified: boolean;
  patternDotsCount: number;
  patternNodes: number[];
}

interface MobileSecuritySectionProps {
  value: MobileSecurityData;
  onChange: (updated: MobileSecurityData) => void;
  isExistingJob?: boolean;
}

export const MobileSecuritySection: React.FC<MobileSecuritySectionProps> = ({
  value,
  onChange,
  isExistingJob = false,
}) => {
  const [showSensitiveCode, setShowSensitiveCode] = useState(false);
  const [technicianAuthorized, setTechnicianAuthorized] = useState(false);

  const lockOptions: { type: SecurityType; labelUrdu: string; labelEn: string; icon: React.ReactNode }[] = [
    {
      type: 'Pattern Lock',
      labelUrdu: 'پیٹرن لاک (3×3 ڈاٹس)',
      labelEn: 'Pattern Lock',
      icon: <Lock className="w-4 h-4 text-[#d4af37]" />,
    },
    {
      type: 'PIN Code',
      labelUrdu: 'پن کوڈ (نمبرز)',
      labelEn: 'PIN Code',
      icon: <Hash className="w-4 h-4 text-emerald-400" />,
    },
    {
      type: 'Password Lock',
      labelUrdu: 'پاس ورڈ (الفاظ و حروف)',
      labelEn: 'Password Lock',
      icon: <KeyRound className="w-4 h-4 text-blue-400" />,
    },
    {
      type: 'No Lock',
      labelUrdu: 'کوئی لاک نہیں',
      labelEn: 'No Lock',
      icon: <Unlock className="w-4 h-4 text-slate-400" />,
    },
    {
      type: 'Other',
      labelUrdu: 'دیگر / تفصیل',
      labelEn: 'Other Security',
      icon: <FileText className="w-4 h-4 text-purple-400" />,
    },
  ];

  const handleTypeSelect = (type: SecurityType) => {
    onChange({
      ...value,
      securityType: type,
      securityWiped: false,
    });
  };

  // Safe wipe security data upon mobile return or inspection completion
  const handleWipeSecurityData = () => {
    if (confirm('کیا آپ کسٹمر کی پرائیویسی کے تحفظ کے لیے لاک کی تمام معلومات مستقل طور پر حذف کرنا چاہتے ہیں؟')) {
      onChange({
        ...value,
        securityType: 'No Lock',
        securityValue: '',
        securityNotes: 'Security lock info wiped upon repair delivery',
        securityWiped: true,
        patternVerified: false,
        patternDotsCount: 0,
        patternNodes: [],
      });
    }
  };

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-2xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#d4af37]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>Customer Mobile Security & Authorization</span>
              <span className="text-xs font-serif text-[#d4af37]">سیکیورٹی اور لاک کوڈز</span>
            </h3>
            <p className="text-xs text-slate-400">
              کسٹمر کی اجازت سے پیٹرن، پن کوڈ، پاس ورڈ اور ٹیسٹنگ سیکیورٹی کا محفوظ انتظام
            </p>
          </div>
        </div>

        {/* Wipe button if security data exists */}
        {(value.securityValue || value.patternDotsCount > 0 || value.securityType !== 'No Lock') && (
          <button
            type="button"
            onClick={handleWipeSecurityData}
            className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-600/50 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Wipe lock information for customer privacy upon return"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>لاک ڈیٹا حذف کریں (Wipe)</span>
          </button>
        )}
      </div>

      {/* Lock Type Selector Tabs / Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {lockOptions.map((opt) => {
          const isSelected = value.securityType === opt.type;
          return (
            <button
              key={opt.type}
              type="button"
              onClick={() => handleTypeSelect(opt.type)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                isSelected
                  ? 'bg-gradient-to-br from-[#0353a4]/50 to-[#0a192f] border-[#d4af37] ring-1 ring-[#d4af37]/60 text-white shadow-lg'
                  : 'bg-[#030b1e] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                {opt.icon}
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />}
              </div>
              <div>
                <p className="font-bold text-xs text-white">{opt.labelEn}</p>
                <p className="font-serif text-[11px] text-[#d4af37] dir-rtl text-right">
                  {opt.labelUrdu}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Explicit Customer Consent Requirement */}
      {value.securityType !== 'No Lock' && (
        <div className="p-3 rounded-xl bg-[#030b1e] border border-amber-600/40 flex items-start gap-3">
          <input
            type="checkbox"
            id="securityConsentCheckbox"
            checked={value.securityConsent}
            onChange={(e) =>
              onChange({
                ...value,
                securityConsent: e.target.checked,
              })
            }
            className="mt-0.5 w-4 h-4 rounded text-[#d4af37] focus:ring-0 focus:outline-none accent-[#d4af37]"
          />
          <label htmlFor="securityConsentCheckbox" className="text-xs text-slate-300 cursor-pointer select-none">
            <strong className="text-amber-300 font-bold block mb-0.5">
              کسٹمر کی باقاعدہ واضح اجازت سے سیکیورٹی معلومات درج کی جا رہی ہیں (Customer Consent) *
            </strong>
            <span className="text-[11px] text-slate-400">
              پرائیویسی پالیسی کے مطابق کسٹمر کی واضح اجازت کے بغیر کوئی کوڈ محفوظ نہیں کیا جائے گا۔ ٹیسٹنگ مکمل ہونے کے بعد اسے حذف کیا جا سکتا ہے۔
            </span>
          </label>
        </div>
      )}

      {/* SECTION CONTENT BASED ON SELECTED LOCK TYPE */}

      {/* 1. PATTERN LOCK */}
      {value.securityType === 'Pattern Lock' && (
        <div className="p-3 sm:p-4 rounded-xl bg-[#030b1e]/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#d4af37]" />
              <span>3×3 پیٹرن ڈرائنگ سسٹم (Pattern Lock Drawing Grid)</span>
            </span>
            <span className="text-[11px] text-[#d4af37] font-semibold">
              {value.patternVerified ? 'لاک تصدیق شدہ' : 'ڈاٹس کو ملا کر پیٹرن بنائیں'}
            </span>
          </div>

          <PatternLock
            onPatternStatusChange={(status) => {
              onChange({
                ...value,
                patternVerified: status.isVerified,
                patternDotsCount: status.dotsCount,
                securityValue: `PATTERN_${status.dotsCount}_NODES`,
              });
            }}
            initialVerified={value.patternVerified}
            initialHasPattern={value.patternDotsCount > 0}
          />
        </div>
      )}

      {/* 2. PIN CODE */}
      {value.securityType === 'PIN Code' && (
        <div className="p-3 sm:p-4 rounded-xl bg-[#030b1e]/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-emerald-400" />
              <span>کسٹمر کا پن کوڈ (Numeric PIN Code) *</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSensitiveCode(!showSensitiveCode)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              {showSensitiveCode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>چھپائیں (Mask PIN)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>دیکھیں (Show PIN)</span>
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <input
              type={showSensitiveCode ? 'text' : 'password'}
              maxLength={12}
              placeholder="e.g. 1234 or 0000"
              value={value.securityValue}
              onChange={(e) =>
                onChange({
                  ...value,
                  securityValue: e.target.value.replace(/[^0-9]/g, ''),
                })
              }
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-base tracking-widest focus:border-[#d4af37] focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-400">
            صرف عددی ہندسے (4 سے 8 ہندسے عام طور پر استعمال ہوتے ہیں)۔
          </p>
        </div>
      )}

      {/* 3. PASSWORD LOCK */}
      {value.securityType === 'Password Lock' && (
        <div className="p-3 sm:p-4 rounded-xl bg-[#030b1e]/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>کسٹمر کا پاس ورڈ (Alphanumeric Password) *</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSensitiveCode(!showSensitiveCode)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              {showSensitiveCode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>چھپائیں (Mask Password)</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>دیکھیں (Show Password)</span>
                </>
              )}
            </button>
          </div>

          <input
            type={showSensitiveCode ? 'text' : 'password'}
            placeholder="e.g. Musa@2024"
            value={value.securityValue}
            onChange={(e) =>
              onChange({
                ...value,
                securityValue: e.target.value,
              })
            }
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm tracking-wider focus:border-[#d4af37] focus:outline-none"
          />
        </div>
      )}

      {/* 4. NO LOCK */}
      {value.securityType === 'No Lock' && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2.5">
          <Unlock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>اس موبائل پر کوئی لاک یا پاس ورڈ لاگو نہیں ہے۔ فون براہِ راست اسکرین اوپن ہوتا ہے۔</span>
        </div>
      )}

      {/* 5. OTHER / CUSTOM NOTES */}
      {(value.securityType === 'Other' || value.securityType !== 'No Lock') && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            اضافی سیکیورٹی نوٹس (Security Notes & Special Instructions)
          </label>
          <textarea
            rows={2}
            placeholder="مثلاً: فنگر پرنٹ ان ایبل ہے، سم لاک ایکٹیو ہے، فیس ان لاک یا ڈبل ٹیپ آن..."
            value={value.securityNotes}
            onChange={(e) =>
              onChange({
                ...value,
                securityNotes: e.target.value,
              })
            }
            className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs focus:border-[#d4af37] focus:outline-none"
          />
        </div>
      )}

      {/* Notice if wiped */}
      {value.securityWiped && (
        <div className="p-2 rounded-xl bg-slate-800 text-slate-300 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>کسٹمر کو فون واپسی کے بعد لاک کا ڈیٹا سیکیورٹی پالیسی کے تحت صاف کر دیا گیا ہے۔</span>
        </div>
      )}
    </div>
  );
};
