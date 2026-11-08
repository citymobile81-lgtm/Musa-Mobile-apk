import React, { useState, useEffect, useRef } from 'react';
import { ShopSettings, LocalBackupRecord } from '../types';
import {
  executeLocalBackup,
  selectBackupDirectory,
  getActiveDirectoryName,
  isFileSystemAccessSupported,
  isMobileDevice,
  parseBackupFile,
  validateBackupData,
  executeRestoreFromParsedData,
  getBackupHistory,
  clearBackupHistory,
  hasSafetySnapshot,
  restoreSafetySnapshot,
  BACKUP_FOLDER_DEFAULT,
} from '../services/localBackup';
import { saveSettings } from '../services/db';
import {
  HardDrive,
  FolderOpen,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  FileJson,
  Smartphone,
  Laptop,
  Clock,
  ShieldCheck,
  Undo2,
  Trash2,
  HelpCircle,
  ArrowRight,
  Database,
  Layers,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

interface LocalBackupViewProps {
  settings: ShopSettings;
  onRefreshAllData: () => void;
  onSettingsUpdated: (newSettings: ShopSettings) => void;
}

export const LocalBackupView: React.FC<LocalBackupViewProps> = ({
  settings,
  onRefreshAllData,
  onSettingsUpdated,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'zip' | 'json'>('zip');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [currentFolderName, setCurrentFolderName] = useState(getActiveDirectoryName());
  const [history, setHistory] = useState<LocalBackupRecord[]>(getBackupHistory());
  const [safetyAvailable, setSafetyAvailable] = useState(hasSafetySnapshot());
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(
    settings.autoLocalBackupEnabled ?? true
  );
  const [retentionCount, setRetentionCount] = useState(
    settings.maxLocalBackupsToKeep ?? 10
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status Toast
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Pre-Restore Confirmation Modal
  const [restoreModalData, setRestoreModalData] = useState<{
    isOpen: boolean;
    fileName: string;
    parsedData: any;
    stats: any;
  }>({
    isOpen: false,
    fileName: '',
    parsedData: null,
    stats: null,
  });

  const lastBackupStr = localStorage.getItem('musa_last_local_backup_date');
  const lastBackupDateFormatted = lastBackupStr
    ? new Date(lastBackupStr).toLocaleString('ur-PK', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'ابھی تک کوئی بیک اپ نہیں لیا گیا';

  const isMobile = isMobileDevice();
  const hasFSA = isFileSystemAccessSupported();

  useEffect(() => {
    setHistory(getBackupHistory());
    setSafetyAvailable(hasSafetySnapshot());
  }, []);

  // 1. Backup Now Handler
  const handleBackupNow = async (format: 'zip' | 'json' = selectedFormat) => {
    setIsBackingUp(true);
    setStatusMessage({
      type: 'info',
      text: `مکمل ڈیٹا، تصاویر اور کسٹمر ہسٹری کا ${format.toUpperCase()} بیک اپ تیار کیا جا رہا ہے...`,
    });

    const res = await executeLocalBackup(format, false);
    setIsBackingUp(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setHistory(getBackupHistory());
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // 2. Select Backup Folder Handler
  const handleSelectFolder = async () => {
    const res = await selectBackupDirectory();
    if (res.success) {
      setCurrentFolderName(res.folderName);
      setStatusMessage({ type: 'success', text: res.message });

      const updated = { ...settings, selectedLocalFolderName: res.folderName };
      await saveSettings(updated);
      onSettingsUpdated(updated);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // 3. File Selected for Restore
  const handleFileChosenForRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage({ type: 'info', text: 'بیک اپ فائل کا معائنہ کیا جا رہا ہے...' });

    try {
      const parsed = await parseBackupFile(file);
      const validation = validateBackupData(parsed);

      if (!validation.valid) {
        setStatusMessage({
          type: 'error',
          text: validation.error || 'فائل درست نہیں ہے۔ بحالی روک دی گئی ہے۔',
        });
        e.target.value = '';
        return;
      }

      // Open pre-restore review modal
      setRestoreModalData({
        isOpen: true,
        fileName: file.name,
        parsedData: parsed,
        stats: validation.stats,
      });
      setStatusMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `فائل پڑھنے میں ناکامی: ${msg}` });
    } finally {
      e.target.value = '';
    }
  };

  // 4. Confirm and Execute Restore
  const handleConfirmRestore = async () => {
    if (!restoreModalData.parsedData) return;

    setIsRestoring(true);
    setRestoreModalData((prev) => ({ ...prev, isOpen: false }));
    setStatusMessage({
      type: 'info',
      text: 'حفاظتی اسنیپ شاٹ محفوظ کر کے ڈیٹا بحال کیا جا رہا ہے...',
    });

    const res = await executeRestoreFromParsedData(restoreModalData.parsedData, restoreMode);
    setIsRestoring(false);

    if (res.success) {
      setStatusMessage({ type: 'success', text: res.message });
      setSafetyAvailable(true);
      onRefreshAllData();
      alert(`موسی موبائل ریپیئرنگ سینٹر کا تمام ڈیٹا کامیابی کے ساتھ بحال ہو چکا ہے! [طریقہ: ${restoreMode === 'replace' ? 'مکمل تبدیل موڈ' : 'نیا ڈیٹا شامل کریں'}]`);
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // 5. Revert to Safety Snapshot
  const handleRevertSafety = async () => {
    if (
      !confirm(
        'کیا آپ آخری ری اسٹور سے پہلے والے حفاظتی بیک اپ پر واپس جانا چاہتے ہیں؟ موجودہ ریکارڈز تبدیل ہو جائیں گے۔'
      )
    ) {
      return;
    }

    setStatusMessage({ type: 'info', text: 'حفاظتی بیک اپ سے ڈیٹا بحال ہو رہا ہے...' });
    const res = await restoreSafetySnapshot();

    if (res.success) {
      setStatusMessage({ type: 'success', text: 'حفاظتی اسنیپ شاٹ بحال ہو گیا ہے۔' });
      onRefreshAllData();
      alert('سسٹم بحفاظت پرانی حالت میں واپس آ چکا ہے۔');
    } else {
      setStatusMessage({ type: 'error', text: res.message });
    }
  };

  // 6. Toggle Auto Backup Setting
  const handleToggleAutoBackup = async () => {
    const nextVal = !autoBackupEnabled;
    setAutoBackupEnabled(nextVal);
    const updated = { ...settings, autoLocalBackupEnabled: nextVal };
    await saveSettings(updated);
    onSettingsUpdated(updated);
    setStatusMessage({
      type: 'info',
      text: nextVal
        ? 'روزانہ کا خودکار لوکل بیک اپ فعال کر دیا گیا ہے۔'
        : 'خودکار لوکل بیک اپ بند کر دیا گیا ہے۔',
    });
  };

  // 7. Clear History
  const handleClearHistory = () => {
    if (confirm('کیا آپ واقعی بیک اپ ہسٹری صاف کرنا چاہتے ہیں؟ (اصل فائلیں محفوظ رہیں گی)')) {
      clearBackupHistory();
      setHistory([]);
      setStatusMessage({ type: 'info', text: 'بیک اپ ہسٹری لاگ صاف کر دیا گیا ہے۔' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Restore / Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip,.json"
        onChange={handleFileChosenForRestore}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-[#d4af37]" />
              <span>موسی موبائل لوکل بیک اپ و ریسٹور سسٹم</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40 text-[10px] font-extrabold">
              100% OFFLINE SAFE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            موبائل فون (Android) اور کمپیوٹر (Chrome) میں خودکار و دستی لوکل بیک اپ اور بحالی کا محفوظ نظام
          </p>
        </div>

        {/* Device Mode Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-[#0a192f] border border-slate-700 flex items-center gap-2 text-xs">
            {isMobile ? (
              <>
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-semibold">موبائل موڈ (Android)</span>
              </>
            ) : (
              <>
                <Laptop className="w-4 h-4 text-cyan-400" />
                <span className="text-white font-semibold">کمپیوٹر موڈ (Desktop)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-600/60 text-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/70 border-rose-600/60 text-rose-200'
              : 'bg-blue-950/70 border-blue-600/60 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white font-bold ml-2 p-1"
          >
            &times;
          </button>
        </div>
      )}

      {/* Dedicated Continuous Single-Folder & Offline Safe Banner (Requirements #3 & #4) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/60 via-[#0a192f] to-[#0353a4]/40 border-2 border-[#d4af37]/50 shadow-2xl space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">ایک ہی محفوظ فولڈر:</span>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-[#d4af37] border border-amber-500/40 font-bold">
                  📁 MUSA MOBILE COMPLETE BACKUP
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  ONE FOLDER MASTER
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1" dir="rtl">
                تمام بیک اپ اسی ایک واحد فولڈر (<strong>MUSA MOBILE COMPLETE BACKUP</strong>) میں رہتے ہیں۔ ماسٹر فائل <strong>MUSA_FULL_BACKUP.zip</strong> مسلسل اپڈیٹ ہوتی ہے، جسے آپ دوسرے موبائل میں ڈیٹا منتقل کرنے کے لیے آسانی سے استعمال کر سکتے ہیں۔
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSelectFolder}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-yellow-300 font-bold text-xs border border-yellow-500/40 flex items-center gap-1.5 transition cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>فولڈر لنک / تبدیل کریں</span>
            </button>
          </div>
        </div>

        {/* 100% Offline Database Safe Guarantee Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          <div className="p-2.5 rounded-xl bg-[#030b1e]/80 border border-slate-800 flex items-center gap-2 text-slate-200">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>مکمل آف لائن ڈیٹابیس:</strong> انٹرنیٹ کے بغیر تمام کسٹمرز، رسیدیں، تصاویر اور پیٹرن لاک محفوظ رہتے ہیں۔</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#030b1e]/80 border border-slate-800 flex items-center gap-2 text-slate-200">
            <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span><strong>ڈیٹا کا تحفظ:</strong> پرانے بیک اپ کو اوور رائٹ کرنے سے پہلے خودکار حفاظتی اسنیپ شاٹ بنایا جاتا ہے۔</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#030b1e]/80 border border-slate-800 flex items-center gap-2 text-slate-200">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>Zero Duplicate:</strong> نیا کسٹمر یا انٹری بغیر ڈپلیکیٹ کے اسی ماسٹر ڈیٹابیس میں شامل ہوتی ہے۔</span>
          </div>
        </div>
      </div>

      {/* 8 Primary Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Continuous Master Backup */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-t-2 border-t-[#d4af37] space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#d4af37]">
                Action 1 • Portable Master Backup
              </span>
              <div className="p-2 rounded-xl bg-[#0353a4]/40 text-[#d4af37]">
                <Download className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white">مکمل ماسٹر بیک اپ بنائیں (MUSA_FULL_BACKUP.zip)</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              تمام کسٹمرز، رسیدیں، تصاویر اور نوٹس کو فولڈر <strong className="text-yellow-300">"MUSA MOBILE COMPLETE BACKUP"</strong> میں سنگل ماسٹر فائل کے طور پر تیار کریں تاکہ دوسرے موبائل میں بھی ٹرانسفر ہو سکے۔
            </p>

            {/* Format Selector: ZIP vs JSON */}
            <div className="mt-3 p-2 bg-[#030b1e] rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">ماسٹر فارمیٹ:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedFormat('zip')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    selectedFormat === 'zip'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileArchive className="w-3.5 h-3.5" />
                  <span>ZIP ماسٹر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFormat('json')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    selectedFormat === 'json'
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON ماسٹر</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleBackupNow(selectedFormat)}
            disabled={isBackingUp}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0353a4] via-[#0466c8] to-blue-500 hover:from-blue-600 hover:to-blue-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-[#d4af37]" />
            <span>{isBackingUp ? 'ماسٹر بیک اپ اپڈیٹ ہو رہا ہے...' : `MUSA MOBILE BACKUP اپڈیٹ کریں (${selectedFormat.toUpperCase()})`}</span>
          </button>
        </div>

        {/* Card 2: Restore Backup */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-t-2 border-t-emerald-500 space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                Action 2 • Instant Restore
              </span>
              <div className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400">
                <Upload className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white">ڈیٹا واپس بحال کریں (Restore Backup)</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              فولڈر "MUSA MOBILE COMPLETE BACKUP" میں سے ماسٹر فائل منتخب کر کے تمام کسٹمرز اور مرمت کا ریکارڈ فوراً واپس لائیں۔
            </p>

            <div className="mt-3 p-2 bg-[#030b1e] rounded-xl border border-slate-800 text-[11px] text-emerald-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>بحالی سے پہلے خودکار حفاظتی اسنیپ شاٹ بنایا جاتا ہے۔</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isRestoring}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>بیک اپ فائل منتخب کریں (ZIP / JSON)</span>
          </button>
        </div>

        {/* Card 3: Select Backup Folder */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-t-2 border-t-cyan-500 space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                Action 3 • Single Dedicated Folder
              </span>
              <div className="p-2 rounded-xl bg-cyan-950/60 text-cyan-400">
                <FolderOpen className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white">بیک اپ فولڈر (MUSA MOBILE BACKUP)</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              کمپیوٹر یا موبائل پر فولڈر "MUSA MOBILE BACKUP" کو منتخب رکھیں تاکہ تمام بیک اپ مسلسل اسی جگہ محفوظ ہوں۔
            </p>

            <div className="mt-3 p-2.5 bg-[#030b1e] rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">مخصوص کردہ فولڈر:</span>
              <span className="font-mono text-[#d4af37] font-bold text-xs truncate block">
                📁 {currentFolderName || 'MUSA MOBILE BACKUP'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSelectFolder}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-cyan-400" />
            <span>فولڈر لنک منتخب کریں (Folder Picker)</span>
          </button>
        </div>

        {/* Card 4: Automatic Backup */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-t-2 border-t-purple-500 space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">
                Action 4
              </span>
              <div className="p-2 rounded-xl bg-purple-950/60 text-purple-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white">خودکار روزانہ بیک اپ (Automatic Backup)</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              ایپلیکیشن ہر صبح کھلتے ہی خودکار طور پر آخری ریکارڈ کا محفوظ بیک اپ تیار کرتی ہے۔
            </p>

            <div className="mt-3 flex items-center justify-between p-2.5 bg-[#030b1e] rounded-xl border border-slate-800">
              <span className="text-xs text-white font-semibold">روزانہ بیک اپ اسٹیٹس:</span>
              <button
                type="button"
                onClick={handleToggleAutoBackup}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  autoBackupEnabled ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    autoBackupEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center">
            {autoBackupEnabled ? 'فعال ہے (Active) - ہر روز ایک اسنیپ شاٹ' : 'غیر فعال ہے (Inactive)'}
          </div>
        </div>

        {/* Card 5 & 6: Quick Export / Import */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-t-2 border-t-amber-500 space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                Action 5 & 6
              </span>
              <div className="p-2 rounded-xl bg-amber-950/60 text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white">فوری ایکسپورٹ و امپورٹ (Export / Import)</h3>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              فائل کو ایک کلک سے کمپیوٹر یا موبائل میں ڈاؤن لوڈ کریں یا کسی دوسری ڈیوائس پر منتقل کریں۔
            </p>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => handleBackupNow('zip')}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                <span>ZIP ایکسپورٹ</span>
              </button>
              <button
                type="button"
                onClick={() => handleBackupNow('json')}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <FileJson className="w-3.5 h-3.5 text-cyan-400" />
                <span>JSON ایکسپورٹ</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-[#d4af37] text-[#d4af37] font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>بیک اپ امپورٹ کریں (Import)</span>
          </button>
        </div>

        {/* Card 7 & Safety: Last Backup & Safety Snapshot */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between border-t-2 border-t-rose-500 space-y-4 shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                Action 7 & Safety
              </span>
              <div className="p-2 rounded-xl bg-rose-950/60 text-rose-400">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-white">آخری بیک اپ اور حفاظتی اسنیپ شاٹ</h3>
            
            <div className="mt-2 p-2.5 bg-[#030b1e] rounded-xl border border-slate-800 space-y-1 text-xs">
              <p className="text-slate-400 text-[10px]">آخری لوکل بیک اپ کی تاریخ:</p>
              <p className="text-[#d4af37] font-mono font-bold truncate">
                {lastBackupDateFormatted}
              </p>
            </div>

            {safetyAvailable && (
              <div className="mt-2 p-2 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-[11px] text-emerald-300 flex items-center justify-between">
                <span>حفاظتی اسنیپ شاٹ محفوظ ہے</span>
                <button
                  type="button"
                  onClick={handleRevertSafety}
                  className="px-2 py-0.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1"
                  title="Undo last restore"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>واپس لائیں (Undo)</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 text-center">
            بیک اپ ہسٹری میں آخری 10 بیک اپ فائلیں خودکار منظم ہوتی ہیں۔
          </div>
        </div>

      </div>

      {/* Cross-Device Transfer Guide Card */}
      <div className="glass-panel p-5 rounded-2xl border border-cyan-800/40 bg-gradient-to-r from-[#030b1e] via-[#0a192f] to-[#0353a4]/20 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          <span>موبائل اور کمپیوٹر کے درمیان ڈیٹا منتقلی (Cross-Device Backup Transfer)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 bg-[#030b1e]/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0353a4] text-white flex items-center justify-center text-[10px]">1</span>
              <span>موبائل میں بیک اپ</span>
            </p>
            <p className="text-[11px] text-slate-400">
              موبائل پر "ابھی بیک اپ بنائیں" دبائیں۔ فائل آپ کے فون کے ڈاؤن لوڈز یا 'MUSA MOBILE BACKUP' فولڈر میں چلی جائے گی۔
            </p>
          </div>
          <div className="p-3 bg-[#030b1e]/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0353a4] text-white flex items-center justify-center text-[10px]">2</span>
              <span>فائل شیئرنگ</span>
            </p>
            <p className="text-[11px] text-slate-400">
              واٹس ایپ، بلوٹوتھ یا یو ایس بی کیبل سے اس ZIP یا JSON فائل کو موبائل سے کمپیوٹر پر یا کمپیوٹر سے موبائل پر بھیجیں۔
            </p>
          </div>
          <div className="p-3 bg-[#030b1e]/80 rounded-xl border border-slate-800 space-y-1">
            <p className="font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#0353a4] text-white flex items-center justify-center text-[10px]">3</span>
              <span>فوری ری اسٹور</span>
            </p>
            <p className="text-[11px] text-slate-400">
              دوسری ڈیوائس پر ایپ کھول کر "ڈیٹا واپس بحال کریں" دبائیں اور فائل منتخب کریں۔ تمام ریکارڈز منٹوں میں ظاہر ہو جائیں گے۔
            </p>
          </div>
        </div>
      </div>

      {/* 8. Backup History Table (Last 10 Backups) */}
      <div className="glass-panel p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4af37]" />
              <span>بیک اپ ہسٹری (Backup History - آخری 10 ریکارڈز)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              حالیہ بنائے گئے لوکل بیک اپس کی تفصیلات اور فائل سائز
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ہسٹری صاف کریں</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            ابھی تک کوئی لوکل بیک اپ ہسٹری موجود نہیں ہے۔ نیا بیک اپ بنانے کے لیے اوپر "ابھی نیا بیک اپ بنائیں" پر کلک کریں۔
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">فائل کا نام</th>
                  <th className="py-2.5 px-3">تاریخ و وقت</th>
                  <th className="py-2.5 px-3">ڈیوائس</th>
                  <th className="py-2.5 px-3">سائز</th>
                  <th className="py-2.5 px-3">ریکارڈز شمار</th>
                  <th className="py-2.5 px-3">قسم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#030b1e]/60 transition">
                    <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-2">
                      {rec.format === 'zip' ? (
                        <FileArchive className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <FileJson className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate max-w-xs">{rec.fileName}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                      {new Date(rec.timestamp).toLocaleString('ur-PK', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                        {rec.deviceType === 'mobile' ? (
                          <>
                            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                            <span>موبائل</span>
                          </>
                        ) : (
                          <>
                            <Laptop className="w-3.5 h-3.5 text-blue-400" />
                            <span>کمپیوٹر</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {(rec.fileSizeBytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400">
                      <span className="text-white font-semibold">{rec.totalJobs} جابز</span> •{' '}
                      <span>{rec.totalCustomers} کسٹمرز</span> •{' '}
                      <span className="text-cyan-400">{rec.totalPhotos} تصاویر</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rec.isAutoBackup
                            ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                            : 'bg-blue-950 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {rec.isAutoBackup ? 'خودکار' : 'دستی'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRE-RESTORE REVIEW & CONFIRMATION MODAL */}
      {restoreModalData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4 border border-[#d4af37]/40">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">ڈیٹا بحال کرنے کی تصدیق (Confirm Restore)</h4>
                <p className="text-[11px] text-slate-400">فائل: {restoreModalData.fileName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                اس بیک اپ فائل کی تصدیق ہو چکی ہے۔ براہ کرم بحالی کا طریقہ (Restore Mode) منتخب کریں:
              </p>

              {/* Restore Mode Selector: Merge vs Replace */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                    restoreMode === 'merge'
                      ? 'bg-blue-950/70 border-blue-500 text-white shadow-lg ring-1 ring-blue-500'
                      : 'bg-[#030b1e] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-blue-300">نیا ڈیٹا شامل کریں (Merge)</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      restoreMode === 'merge' ? 'border-blue-400 bg-blue-500' : 'border-slate-600'
                    }`}>
                      {restoreMode === 'merge' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed mt-0.5" dir="rtl">
                    موجودہ کسٹمرز اور ریکارڈز برقرار رہیں گے، بیک اپ فائل کا نیا ڈیٹا ان میں ضم ہو جائے گا۔
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`p-3 rounded-xl border text-right transition flex flex-col gap-1 cursor-pointer ${
                    restoreMode === 'replace'
                      ? 'bg-amber-950/70 border-amber-500 text-white shadow-lg ring-1 ring-amber-500'
                      : 'bg-[#030b1e] border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs text-amber-300">مکمل تبدیل کریں (Replace)</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      restoreMode === 'replace' ? 'border-amber-400 bg-amber-500' : 'border-slate-600'
                    }`}>
                      {restoreMode === 'replace' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300 leading-relaxed mt-0.5" dir="rtl">
                    نئے موبائل میں ڈیٹا منتقل کرنے کے لیے۔ پرانا ڈیٹا صاف کر کے صرف بیک اپ کا ڈیٹا بحال کرے گا۔
                  </p>
                </button>
              </div>

              {restoreModalData.stats && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-[#030b1e] rounded-xl border border-slate-800 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">کسٹمرز:</span>
                    <span className="text-white font-bold">{restoreModalData.stats.customers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">جاب کارڈز:</span>
                    <span className="text-[#d4af37] font-bold">{restoreModalData.stats.jobCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">اسپیئر پارٹس:</span>
                    <span className="text-emerald-400 font-bold">{restoreModalData.stats.inventory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">معائنہ تصاویر:</span>
                    <span className="text-cyan-400 font-bold">{restoreModalData.stats.photos}</span>
                  </div>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-[11px] text-amber-300 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>خودکار حفاظتی ضمانت:</span>
                </p>
                <p className="text-[10px] text-slate-300">
                  بحالی شروع کرنے سے قبل سسٹم آپ کے موجودہ تمام ڈیٹا کا ایک خودکار حفاظتی اسنیپ شاٹ بنائے گا۔ اگر آپ کو ضرورت ہو تو آپ کسی بھی وقت "واپس لائیں (Undo)" دبا کر پرانی حالت پر واپس آ سکتے ہیں۔
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRestoreModalData((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                منسوخ کریں (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تصدیق کریں اور ڈیٹا بحال کریں</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
