import React, { useState, useEffect } from 'react';
import { generateAndDownloadApk } from '../services/apkGenerator';
import { executeLocalBackup } from '../services/localBackup';
import { RotatingLogo } from './RotatingLogo';
import {
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  HardDrive,
  Terminal,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface DownloadShareAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopPhone?: string;
  shopAddress?: string;
  customLogoUrl?: string;
}

export const DownloadShareAppModal: React.FC<DownloadShareAppModalProps> = ({
  isOpen,
  onClose,
  shopPhone = '03006861765',
  shopAddress = 'واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی',
  customLogoUrl,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [apkDownloading, setApkDownloading] = useState(false);
  const [backupDownloading, setBackupDownloading] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showCliGuide, setShowCliGuide] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Capture PWA beforeinstallprompt event for Android WebAPK direct installation
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (!isOpen) return null;

  // 1. Download Android APK Package
  const handleDownloadApk = async () => {
    setApkDownloading(true);
    setStatusNotice('Generating genuine Android APK package for Musa Mobile Repairing Center...');
    const result = await generateAndDownloadApk();
    setApkDownloading(false);
    if (result.success) {
      setStatusNotice(result.message);
    } else {
      setStatusNotice(`Error: ${result.message}`);
    }
  };

  // 1b. Direct Native PWA / WebAPK Installation
  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setStatusNotice('Musa Mobile App installed directly onto your device!');
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      // If not triggered yet, inform user how Chrome installs WebAPKs
      alert(
        'Chrome / Browser Menu میں جا کر "Add to Home Screen" یا "Install App" پر کلک کریں۔ اینڈرائیڈ خود بخود اس کی اصل WebAPK انسٹال کر دے گا۔'
      );
    }
  };

  // 2. Share Application (Native Web Share API)
  const handleShareApp = async () => {
    const currentUrl = window.location.href;
    const shareData = {
      title: 'MUSA MOBILE REPAIRING CENTER',
      text: `موسی موبائل ریپیئرنگ سینٹر - موبائل مرمت، پارٹس اور مینجمنٹ ویب ایپلیکیشن۔ رابطہ: ${shopPhone}`,
      url: currentUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setStatusNotice('Application link shared successfully!');
      } catch (err) {
        // user cancelled or failed
      }
    } else {
      // Fallback: Copy link
      await handleCopyLink();
      setStatusNotice('Web Share API not supported on this browser. App link copied to clipboard!');
    }
  };

  // 3. Copy App Link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setStatusNotice('App URL copied to clipboard: ' + window.location.href);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setStatusNotice('Failed to copy link automatically. Please copy from browser address bar.');
    }
  };

  // 4. Share on WhatsApp
  const handleShareWhatsApp = () => {
    const currentUrl = window.location.href;
    const msg =
      `*MUSA MOBILE REPAIRING CENTER*\n` +
      `*موسی موبائل ریپیئرنگ سنٹر*\n` +
      `--------------------------------\n` +
      `موبائل ریپیئرنگ، اوریجنل اسپیئر پارٹس، اور کسٹمر جاب کارڈ سروس۔\n` +
      `پروپرائیٹر: میاں محمد محسن قریشی (03216861765)\n` +
      `لیب انجینئر: میاں اظہر قریشی (03006861765)\n` +
      `پتہ: بالمقابل قبا آپٹیکل، واٹر پلانٹ والی گلی، مظفرگڑھ سٹی\n` +
      `--------------------------------\n` +
      `📲 ایپ استعمال یا ڈاؤن لوڈ کرنے کے لیے لنک کھولیں:\n` +
      `${currentUrl}`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  // 5. Download App Backup
  const handleDownloadBackup = async () => {
    setBackupDownloading(true);
    setStatusNotice('Compressing local database into a secure ZIP backup archive...');
    const res = await executeLocalBackup('zip');
    setBackupDownloading(false);
    if (res.success) {
      setStatusNotice(res.message);
    } else {
      setStatusNotice(`Backup error: ${res.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-[#d4af37]/60 bg-[#0a192f] p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <RotatingLogo size="sm" showGlow={true} customLogoUrl={customLogoUrl} />
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Download & Share Mobile App</span>
                <span className="text-xs font-serif text-[#d4af37]">ایپ ڈاؤن لوڈ و شیئرنگ</span>
              </h3>
              <p className="text-xs text-slate-400">
                Musa Mobile Repairing Center Android APK, PWA WebAPK and Instant Sharing System
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Notice Feedback */}
        {statusNotice && (
          <div className="p-2.5 rounded-xl bg-blue-950/80 border border-blue-500/50 text-blue-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#d4af37] shrink-0" />
              <span>{statusNotice}</span>
            </div>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* 5 MAIN REQUIRED ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Button 1: Download Android APK */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 via-[#030b1e] to-slate-900 border border-indigo-500/50 flex flex-col justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-[#d4af37]" />
                  <span>1. Download Android APK</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                  3.83 MB • Signed
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                اینڈرائیڈ موبائل میں براہِ راست انسٹال کرنے کے لیے اصل <strong className="text-amber-300">Musa_Mobile_Repairing_Center.apk</strong> حاصل کریں۔
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span>فائل: Musa_Mobile_Repairing_Center.apk</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">3.83 MB</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <a
                href="/Musa_Mobile_Repairing_Center.apk"
                download="Musa_Mobile_Repairing_Center.apk"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
              >
                <Download className="w-4 h-4 text-[#d4af37]" />
                <span>Direct Download APK (3.83 MB ڈاؤن لوڈ)</span>
              </a>

              <a
                href="https://github.com/citymobile81-lgtm/Musa-Mobile-apk/releases/download/v2.0.0/Musa_Mobile_Repairing_Center.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-1.5 bg-[#030b1e] hover:bg-slate-800 border border-indigo-500/40 text-indigo-300 font-semibold rounded-lg text-[10.5px] flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                <span>Online Cloud Mirror (GitHub Releases CDN)</span>
              </a>

              {/* Secondary PWA Install option */}
              <button
                type="button"
                onClick={handleNativeInstall}
                className="w-full py-1.5 bg-[#030b1e] hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isInstallable ? 'Install Native WebAPK Now' : 'Direct Browser App Install'}</span>
              </button>
            </div>
          </div>

          {/* Button 2: Share Application */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/60 via-[#030b1e] to-slate-900 border border-blue-500/50 flex flex-col justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-[#d4af37]" />
                  <span>2. Share Application</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                  All Devices
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                موبائل یا کمپیوٹر پر کسی بھی میسنجر یا سوشل ایپ کے ذریعے ایپ شیئر کریں۔
              </p>
            </div>

            <button
              type="button"
              onClick={handleShareApp}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Application Link</span>
            </button>
          </div>

          {/* Button 3: Copy App Link */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-[#030b1e] to-slate-900 border border-slate-700 flex flex-col justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-[#d4af37]" />
                  <span>3. Copy App Link</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  HTTPS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ایپ کا لائیو آن لائن ویب ایڈریس کلپ بورڈ پر کاپی کریں۔
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#d4af37]" />
                  <span>Copy App Link</span>
                </>
              )}
            </button>
          </div>

          {/* Button 4: Share on WhatsApp */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 via-[#030b1e] to-slate-900 border border-emerald-500/50 flex flex-col justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>4. Share on WhatsApp</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  WhatsApp Direct
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                شاپ کی مکمل تفصیلات اور ڈاؤن لوڈ لنک کے ساتھ واٹس ایپ پر بھیجیں۔
              </p>
            </div>

            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
            >
              <Smartphone className="w-4 h-4 text-white" />
              <span>Share on WhatsApp</span>
            </button>
          </div>
        </div>

        {/* Button 5: Download App Backup */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#030b1e] to-slate-900 border border-amber-600/50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#d4af37]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <span>5. Download Full App Database Backup</span>
                <span className="text-[11px] font-serif text-[#d4af37]">ڈیٹا بیک اپ ڈاؤن لوڈ کریں</span>
              </h4>
              <p className="text-[11px] text-slate-300">
                کسٹمرز، جاب کارڈز، پارٹس، تصاویر اور اکاؤنٹس کا فوری محفوظ ZIP بیک اپ ڈاؤن لوڈ کریں
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={backupDownloading}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition shrink-0 active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{backupDownloading ? 'Creating ZIP...' : 'Download App Backup (.zip)'}</span>
          </button>
        </div>

        {/* GitHub Official Repository & Releases Link */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-black border border-slate-700 text-slate-200">
              <ExternalLink className="w-4 h-4 text-[#d4af37]" />
            </span>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>GitHub Repository:</span>
                <span className="text-[#d4af37] font-mono">citymobile81-lgtm/Musa-Mobile-apk</span>
              </p>
              <p className="text-[11px] text-slate-400">
                اوپن سورس کوڈ، خودکار ریلیز اور اپڈیٹس کے لیے گٹ ہب ریپازٹری دیکھیں
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/citymobile81-lgtm/Musa-Mobile-apk"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 flex items-center gap-1.5 transition"
            >
              <span>GitHub Repo</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
            <a
              href="https://github.com/citymobile81-lgtm/Musa-Mobile-apk/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow flex items-center gap-1.5 transition"
            >
              <span>Releases</span>
              <Download className="w-3 h-3 text-[#d4af37]" />
            </a>
          </div>
        </div>

        {/* Build APK and Release System Instructions */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowCliGuide(!showCliGuide)}
            className="w-full p-2.5 rounded-xl bg-[#030b1e] hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-300 font-semibold flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#d4af37]" />
              <span>Git Push & APK Build Instructions (گٹ ہب پر پش اور APK طریقہ کار)</span>
            </span>
            <span className="text-[11px] text-[#d4af37]">
              {showCliGuide ? 'Hide Instructions ▲' : 'View Instructions ▼'}
            </span>
          </button>

          {showCliGuide && (
            <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono space-y-3">
              <div>
                <p className="text-slate-400 font-sans text-xs mb-1.5">
                  گٹ ہب ریپازٹری <span className="text-[#d4af37]">citymobile81-lgtm/Musa-Mobile-apk</span> پر کوڈ پش کرنے کے کمانڈز:
                </p>
                <div className="bg-[#030b1e] p-2.5 rounded-lg border border-slate-800 text-[11px] text-yellow-300 space-y-1">
                  <p>git init</p>
                  <p>git add .</p>
                  <p>git commit -m "Release v2.0 - Musa Mobile Repairing Center"</p>
                  <p>git branch -M main</p>
                  <p>git remote add origin https://github.com/citymobile81-lgtm/Musa-Mobile-apk.git</p>
                  <p>git push -u origin main</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-sans text-xs mb-1.5">
                  گوگل ببل ریپ کے ذریعے براہ راست سائن شدہ اینڈرائیڈ APK تیار کرنے کا طریقہ:
                </p>
                <div className="bg-[#030b1e] p-2.5 rounded-lg border border-slate-800 text-[11px] text-emerald-300 space-y-1">
                  <p>npx @bubblewrap/cli init --manifest="{window.location.origin}/manifest.webmanifest"</p>
                  <p>npx @bubblewrap/cli build</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
