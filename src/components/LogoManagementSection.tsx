import React, { useState, useRef, useEffect } from 'react';
import { ShopSettings } from '../types';
import { saveSettings, logActivity } from '../services/db';
import { RotatingLogo } from './RotatingLogo';
import {
  Upload,
  Image as ImageIcon,
  Save,
  RotateCcw,
  CheckCircle2,
  Trash2,
  Eye,
  Smartphone,
  Monitor,
  Sparkles,
  Info,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface LogoManagementSectionProps {
  settings: ShopSettings;
  onLogoUpdated: (newSettings: ShopSettings) => void;
}

export const LogoManagementSection: React.FC<LogoManagementSectionProps> = ({
  settings,
  onLogoUpdated,
}) => {
  const [currentLogo, setCurrentLogo] = useState<string>(
    settings.customLogoUrl || localStorage.getItem('musa_custom_official_logo') || ''
  );
  const [pendingLogo, setPendingLogo] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    type: string;
    sizeKb: number;
    format: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const active = settings.customLogoUrl || localStorage.getItem('musa_custom_official_logo') || '';
    setCurrentLogo(active);
  }, [settings.customLogoUrl]);

  // Read file and optionally optimize high-res PNG/JPG for web storage
  const processImageFile = (file: File) => {
    setErrorMessage(null);
    setSaveSuccessMsg(null);

    // Validate MIME / extension
    const validExtensions = ['png', 'jpg', 'jpeg', 'svg'];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isSvg = file.type.includes('svg') || fileExt === 'svg';
    const isImage = file.type.startsWith('image/') || validExtensions.includes(fileExt);

    if (!isImage && !isSvg) {
      setErrorMessage('صرف PNG، JPG اور SVG فارمیٹ کی تصاویر منتخب کی جا سکتی ہیں۔');
      return;
    }

    const reader = new FileReader();

    if (isSvg) {
      // SVGs are clean vector graphics
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPendingLogo(result);
        setFileDetails({
          name: file.name,
          type: 'SVG Vector Image',
          sizeKb: Math.round(file.size / 1024),
          format: 'SVG',
        });
      };
      reader.readAsDataURL(file);
    } else {
      // For PNG / JPG, ensure crisp rendering without blowing up browser storage
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          // If image is reasonable size, keep as-is; otherwise scale smoothly on canvas
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              ctx.drawImage(img, 0, 0, width, height);
              const optimized = canvas.toDataURL(file.type || 'image/png', 0.92);
              setPendingLogo(optimized);
              setFileDetails({
                name: file.name,
                type: file.type || 'image/png',
                sizeKb: Math.round(optimized.length * 0.75 / 1024),
                format: fileExt.toUpperCase(),
              });
              return;
            }
          }

          setPendingLogo(rawDataUrl);
          setFileDetails({
            name: file.name,
            type: file.type || 'image/png',
            sizeKb: Math.round(file.size / 1024),
            format: fileExt.toUpperCase(),
          });
        };
        img.onerror = () => {
          setErrorMessage('تصویر پڑھنے میں خرابی پیش آئی۔ برائے مہربانی درست تصویر منتخب کریں۔');
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input value so re-selecting same file triggers change
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Save the pending or current logo permanently to IndexedDB & localStorage
  const handleSaveLogo = async () => {
    const logoToSave = pendingLogo || currentLogo;
    if (!logoToSave) {
      setErrorMessage('کوئی نیا لوگو منتخب نہیں کیا گیا۔ برائے مہربانی پہلے تصویر اپلوڈ کریں۔');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      // 1. Store in localStorage for immediate synchronous reads
      localStorage.setItem('musa_custom_official_logo', logoToSave);

      // 2. Persist in IndexedDB settings store
      const updatedSettings: ShopSettings = {
        ...settings,
        customLogoUrl: logoToSave,
      };
      await saveSettings(updatedSettings);
      await logActivity('UPDATE_SETTINGS', 'Updated official shop emblem logo');

      // 3. Dispatch real-time global event so all components on screen refresh logo instantly
      window.dispatchEvent(new Event('musa-logo-updated'));

      setCurrentLogo(logoToSave);
      setPendingLogo(null);
      onLogoUpdated(updatedSettings);

      setSaveSuccessMsg('آفیشل گول لوگو کامیابی سے مستقل محفوظ ہو گیا ہے اور تمام اسکرینز پر فعال ہے!');
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to save logo:', err);
      setErrorMessage('لوگو محفوظ کرتے ہوئے خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove custom logo and restore official gold vector logo
  const handleRemoveLogo = async () => {
    if (!window.confirm('کیا آپ واقعی کسٹم لوگو ختم کر کے اصل آفیشل گولڈن ویکٹر لوگو بحال کرنا چاہتے ہیں؟')) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    try {
      localStorage.removeItem('musa_custom_official_logo');
      const updatedSettings: ShopSettings = {
        ...settings,
        customLogoUrl: '',
      };
      await saveSettings(updatedSettings);
      await logActivity('UPDATE_SETTINGS', 'Reset official logo to default vector badge');

      window.dispatchEvent(new Event('musa-logo-updated'));

      setCurrentLogo('');
      setPendingLogo(null);
      setFileDetails(null);
      onLogoUpdated(updatedSettings);

      setSaveSuccessMsg('اصل آفیشل گولڈن ویکٹر لوگو کامیابی سے بحال کر دیا گیا ہے!');
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Failed to reset logo:', err);
      setErrorMessage('لوگو ختم کرتے ہوئے خرابی پیش آئی۔');
    } finally {
      setIsSaving(false);
    }
  };

  const previewDisplayUrl = pendingLogo || currentLogo || undefined;

  return (
    <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#d4af37]/40 shadow-2xl bg-gradient-to-br from-[#0a192f] via-[#030b1e] to-[#0a192f] space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-2xl bg-[#0353a4]/30 border border-[#d4af37]/40 text-[#d4af37]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white">
                Official Logo Management
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#d4af37] text-slate-950 text-[10px] font-black uppercase tracking-wider">
                آفیشل لوگو
              </span>
            </div>
            <p className="text-xs text-slate-300 font-serif mt-0.5">
              موسیٰ موبائل ریپیئرنگ سینٹر کا آفیشل گول لوگو مینیج کریں
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {currentLogo ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold shadow">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>کسٹم لوگو فعال ہے (Custom Active)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/60 text-blue-300 text-xs font-bold shadow">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>اصل ویکٹر ایمبلم فعال (Vector Active)</span>
            </span>
          )}
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{saveSuccessMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-950/90 border border-rose-500 text-rose-200 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE: PREVIEWS & UPLOADER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE MULTI-VIEW PREVIEWS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#030b1e]/90 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-4 text-center">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
              <span className="font-bold text-[#d4af37] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>360° Live Rotation Preview</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {pendingLogo ? 'New Selection' : 'Current Active'}
              </span>
            </div>

            {/* Main 360° Rotating Emblem Preview */}
            <div className="py-3 flex flex-col items-center justify-center">
              <RotatingLogo
                size="2xl"
                showGlow={true}
                customLogoUrl={previewDisplayUrl}
              />
              <p className="text-[11px] font-mono text-slate-400 mt-3 font-semibold">
                360° Continuous Smooth Rotation
              </p>
              <p className="text-[10px] text-[#d4af37] font-serif">
                موسی موبائل ریپیئرنگ سنٹر — گولڈن سرکلر ایمبلم
              </p>
            </div>

            {/* Static Badge + Mini Header Preview Simulation */}
            <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-left">
              
              {/* Static view */}
              <div className="p-2.5 rounded-xl bg-[#0a192f] border border-slate-800 flex items-center gap-2">
                <RotatingLogo
                  size="sm"
                  showGlow={false}
                  disableRotation={true}
                  customLogoUrl={previewDisplayUrl}
                />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-white truncate">Static Print</p>
                  <p className="text-[9px] text-slate-400 truncate">رسید اور انوائس پر</p>
                </div>
              </div>

              {/* Navbar Mini Preview */}
              <div className="p-2.5 rounded-xl bg-[#0a192f] border border-slate-800 flex items-center gap-2">
                <RotatingLogo
                  size="xs"
                  showGlow={true}
                  customLogoUrl={previewDisplayUrl}
                />
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold text-[#d4af37] truncate">Header View</p>
                  <p className="text-[9px] text-slate-400 truncate">ایپ کے ٹاپ ہیڈر پر</p>
                </div>
              </div>

            </div>

          </div>

          {/* Pending Changes Alert */}
          {pendingLogo && (
            <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                نئی تصویر منتخب ہو چکی ہے۔ مستقل لاگو کرنے کے لیے نیچے <strong>"Save Logo"</strong> پر کلک کریں۔
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: UPLOAD CONTROLS & DETAILS (7 Cols) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          
          {/* DRAG & DROP / FILE SELECTION ZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${
              isDragging
                ? 'border-[#d4af37] bg-[#d4af37]/10 scale-[1.01]'
                : 'border-slate-700 hover:border-[#d4af37]/70 bg-[#030b1e]/60 hover:bg-[#030b1e]'
            }`}
          >
            {/* Ambient hover glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-[#d4af37]/10 to-blue-600/5 opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none" />

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0353a4] to-[#0466c8] text-white shadow-xl group-hover:scale-110 transition duration-200">
              <Upload className="w-7 h-7 text-[#d4af37]" />
            </div>

            <div className="space-y-1 relative z-10 max-w-md">
              <p className="text-sm sm:text-base font-extrabold text-white group-hover:text-[#d4af37] transition">
                موبائل گیلری یا کمپیوٹر سے لوگو اپلوڈ کریں
              </p>
              <p className="text-xs text-slate-300">
                Click to browse photo gallery or drag & drop image file here
              </p>
              <p className="text-[11px] font-mono text-[#d4af37] font-semibold pt-1">
                سپورٹڈ فارمیٹس: PNG, JPG, JPEG, SVG
              </p>
            </div>

            {/* Hidden native input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png, .jpg, .jpeg, .svg, image/png, image/jpeg, image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Mobile / Desktop Icon Indicator */}
            <div className="flex items-center gap-4 text-slate-400 text-[11px] mt-1 relative z-10">
              <span className="flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobile Gallery</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5 text-blue-400" />
                <span>Computer / PC Files</span>
              </span>
            </div>
          </div>

          {/* FILE DETAILS CARD (When image is picked) */}
          {fileDetails && (
            <div className="p-3.5 rounded-2xl bg-[#030b1e] border border-slate-800 text-xs space-y-1">
              <div className="flex items-center justify-between text-slate-300 font-medium">
                <span className="text-white font-bold truncate max-w-xs">{fileDetails.name}</span>
                <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono text-[10px]">
                  {fileDetails.format}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono">
                <span>Size: ~{fileDetails.sizeKb} KB</span>
                <span>•</span>
                <span>Optimized for web & storage</span>
              </div>
            </div>
          )}

          {/* EXPLANATORY SPECIFICATION NOTICE */}
          <div className="p-3.5 rounded-2xl bg-[#0a192f]/60 border border-slate-800/80 text-[11px] text-slate-300 space-y-1 leading-relaxed">
            <p className="font-bold text-[#d4af37] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>لوگو کے اہم قواعد اور خودکار مطابقت:</span>
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[11px]">
              <li>گول (Circular) یا چوکور (Square) تصویر سب سے خوبصورت انداز میں گھومتی ہے۔</li>
              <li>سیو کرنے کے بعد یہ لوگو ایپ کی اوپننگ اسکرین، ڈیش بورڈ، ہیڈر اور پرنٹ رسید پر مستقل نظر آئے گا۔</li>
              <li>براؤزر بند کرنے یا ایپ دوبارہ کھولنے پر بھی آپ کا لوگو محفوظ رہے گا۔</li>
            </ul>
          </div>

          {/* ACTION BUTTONS ROW (Upload, Save, Change, Remove) */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            
            {/* 1. Upload Logo Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 min-w-[150px] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#0353a4] to-[#0466c8] hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 border border-blue-400/30 transition cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4 text-[#d4af37]" />
              <span>{currentLogo || pendingLogo ? 'لوگو تبدیل کریں (Change Logo)' : 'Upload Logo (لوگو اپلوڈ کریں)'}</span>
            </button>

            {/* 2. Save Logo Button */}
            <button
              type="button"
              onClick={handleSaveLogo}
              disabled={isSaving || (!pendingLogo && !!currentLogo)}
              className="flex-1 min-w-[150px] px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 border border-emerald-400/40 disabled:border-slate-700 transition cursor-pointer disabled:cursor-not-allowed active:scale-95"
            >
              <Save className="w-4 h-4 text-emerald-200" />
              <span>{isSaving ? 'محفوظ ہو رہا ہے...' : 'Save Logo (لوگو محفوظ کریں)'}</span>
            </button>

            {/* 3. Remove / Reset Logo Button */}
            {(currentLogo || pendingLogo) && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                disabled={isSaving}
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-rose-950/80 text-rose-300 hover:text-white border border-rose-500/40 hover:border-rose-400 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                title="Remove Custom Logo & Restore Official Vector Badge"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">Remove Logo</span>
                <span>(لوگو ختم کریں)</span>
              </button>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
