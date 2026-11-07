import React, { useState, useEffect } from 'react';
import { JobCard, ShopSettings } from '../types';
import { logActivity } from '../services/db';
import {
  MessageSquare,
  Send,
  X,
  Copy,
  Check,
  Smartphone,
  PhoneCall,
  User,
  Wrench,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SmsStatusModalProps {
  job: JobCard | null;
  settings?: ShopSettings;
  onClose: () => void;
}

interface SmsTemplate {
  id: string;
  titleUrdu: string;
  titleEn: string;
  category: string;
  badgeColor: string;
  generateText: (job: JobCard, shopName: string, shopPhone: string, shopAddress: string) => string;
}

const SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'ready',
    titleUrdu: 'مرمت مکمل - وصولی کے لیے تیار',
    titleEn: 'Repair Complete / Ready for Delivery',
    category: 'Ready',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    generateText: (job, shopName, shopPhone, shopAddress) =>
      `محترم ${job.customerName} صاحب،\n` +
      `${shopName} (موسی موبائل ریپیئرنگ سینٹر) سے آپ کا فون ${job.company} ${job.model} (ٹوکن #${job.jobId}) کامیابی کے ساتھ مکمل ٹھیک ہو چکا ہے اور وصولی کے لیے تیار ہے۔\n` +
      `بقایا واجب الادا رقم: PKR ${job.balance.toLocaleString()}۔\n` +
      `برائے مہربانی شاپ پر تشریف لا کر اپنا فون وصول فرما لیں۔\n` +
      `پتہ: ${shopAddress || 'واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ'}\n` +
      `رابطہ: ${shopPhone || '03006861765'}`,
  },
  {
    id: 'under_repair',
    titleUrdu: 'مرمت و معائنہ کا کام جاری ہے',
    titleEn: 'Under Repair & Diagnosis',
    category: 'In Progress',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    generateText: (job, shopName, shopPhone) =>
      `محترم ${job.customerName} صاحب،\n` +
      `${shopName}: آپ کے موبائل فون ${job.company} ${job.model} (ٹوکن #${job.jobId}) پر لیب انجینئر کی زیرِ نگرانی کام جاری ہے۔\n` +
      `خرابی: ${job.fault}۔\n` +
      `مرمت مکمل ہوتے ہی آپ کو فوری مطلع کر دیا جائے گا۔ تعاون کا شکریہ!\n` +
      `ہیلپ لائن: ${shopPhone || '03006861765'}`,
  },
  {
    id: 'estimate_approval',
    titleUrdu: 'تخمینہ لاگت و منظوری درکار ہے',
    titleEn: 'Cost Estimate & Approval Needed',
    category: 'Approval',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    generateText: (job, shopName, shopPhone) =>
      `محترم ${job.customerName} صاحب،\n` +
      `${shopName}: آپ کے موبائل فون ${job.company} ${job.model} (ٹوکن #${job.jobId}) کے تفصیلی معائنے کے بعد کل متوقع مرمتی خرچ PKR ${job.estimatedCost.toLocaleString()} ہے۔\n` +
      `برائے مہربانی مرمت شروع کرنے کی باقاعدہ منظوری کے لیے شاپ پر رابطہ فرمائیں۔\n` +
      `رابطہ نمبر: ${shopPhone || '03006861765'}`,
  },
  {
    id: 'waiting_parts',
    titleUrdu: 'اسپیئر پارٹس کا انتظار ہے',
    titleEn: 'Waiting for Genuine Parts',
    category: 'Parts',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    generateText: (job, shopName, shopPhone) =>
      `محترم ${job.customerName} صاحب،\n` +
      `${shopName}: آپ کے موبائل ${job.company} ${job.model} (ٹوکن #${job.jobId}) کے لیے معیاری اوریجنل اسپیئر پارٹس کا آرڈر کیا گیا ہے۔\n` +
      `پارٹس موصول ہوتے ہی مرمت مکمل کر دی جائے گی۔ معمولی تاخیر کے لیے معذرت خواہ ہیں۔\n` +
      `رابطہ: ${shopPhone || '03006861765'}`,
  },
  {
    id: 'delivered',
    titleUrdu: 'موبائل حوالے کر دیا گیا - شکریہ',
    titleEn: 'Delivered / Thank You Message',
    category: 'Delivered',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/40',
    generateText: (job, shopName, shopPhone) =>
      `محترم ${job.customerName} صاحب،\n` +
      `${shopName} پر اعتماد کرنے اور خدمات حاصل کرنے کا تہہ دل سے شکریہ!\n` +
      `آپ کا موبائل ${job.company} ${job.model} (ٹوکن #${job.jobId}) کامیابی سے حوالے کر دیا گیا ہے۔\n` +
      `کسی بھی تکنیکی رہنمائی یا مستقبل کی خدمات کے لیے ہم ہمہ وقت حاضر ہیں۔\n` +
      `رابطہ نمبر: ${shopPhone || '03006861765'}`,
  },
  {
    id: 'unrepairable',
    titleUrdu: 'موبائل ناقابلِ مرمت - واپسی کی اطلاع',
    titleEn: 'Unrepairable / Device Return',
    category: 'Return',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    generateText: (job, shopName, shopPhone, shopAddress) =>
      `محترم ${job.customerName} صاحب،\n` +
      `${shopName}: آپ کے موبائل ${job.company} ${job.model} (ٹوکن #${job.jobId}) کے تفصیلی لیب معائنے کے بعد معذرت کے ساتھ فون قابلِ مرمت نہیں پایا گیا۔\n` +
      `برائے مہربانی اپنا فون واپس وصول کرنے کے لیے شاپ پر تشریف لائیں۔\n` +
      `پتہ: ${shopAddress || 'واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ'}\n` +
      `رابطہ: ${shopPhone || '03006861765'}`,
  },
  {
    id: 'english_ready',
    titleUrdu: 'انگریزی - ریڈی فار ڈیلیوری',
    titleEn: 'English - Ready for Pickup',
    category: 'English',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    generateText: (job, shopName, shopPhone, shopAddress) =>
      `Dear ${job.customerName},\n` +
      `Your mobile ${job.company} ${job.model} (Job Token #${job.jobId}) has been repaired and is ready for pickup at ${shopName} (Musa Mobile Repairing Center).\n` +
      `Remaining Balance: PKR ${job.balance.toLocaleString()}.\n` +
      `Address: ${shopAddress || 'Water Plant, Near Quba Optical, Muzaffargarh'}.\n` +
      `Contact: ${shopPhone || '03006861765'}. Thank you!`,
  },
];

export const SmsStatusModal: React.FC<SmsStatusModalProps> = ({
  job,
  settings,
  onClose,
}) => {
  if (!job) return null;

  const defaultShopName = settings?.shopName || 'Musa Mobile Repairing Center';
  const defaultShopPhone = settings?.phone || '03006861765';
  const defaultShopAddress = settings?.address || 'واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی، پاکستان';

  // Determine initial template based on job status
  const getInitialTemplateId = () => {
    if (job.status === 'Ready for Delivery') return 'ready';
    if (job.status === 'Under Repair' || job.status === 'Under Inspection') return 'under_repair';
    if (job.status === 'Waiting for Parts') return 'waiting_parts';
    if (job.status === 'Delivered') return 'delivered';
    if (job.status === 'Unrepairable' || job.status === 'Cancelled') return 'unrepairable';
    return 'ready';
  };

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(getInitialTemplateId());
  const [recipientPhone, setRecipientPhone] = useState<string>(job.customerPhone || '');
  const [messageText, setMessageText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  // Update message when template changes
  useEffect(() => {
    const template = SMS_TEMPLATES.find((t) => t.id === selectedTemplateId) || SMS_TEMPLATES[0];
    const generated = template.generateText(
      job,
      defaultShopName,
      defaultShopPhone,
      defaultShopAddress
    );
    setMessageText(generated);
  }, [selectedTemplateId, job]);

  // Handle native SMS intent
  const handleSendNativeSMS = async () => {
    if (!recipientPhone.trim()) {
      alert('براہ کرم کسٹمر کا موبائل نمبر درج کریں۔ Please provide a recipient phone number.');
      return;
    }

    // Clean phone number (keep digits and optional plus)
    const cleanPhone = recipientPhone.replace(/[^0-9+]/g, '');

    // Detect iOS to use standard separator '&' vs Android/Standard '?'
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const separator = isIOS ? '&' : '?';

    const encodedBody = encodeURIComponent(messageText);
    const smsUri = `sms:${cleanPhone}${separator}body=${encodedBody}`;

    try {
      await logActivity(
        'SEND_SMS_STATUS',
        `Initiated native SMS intent to ${cleanPhone} for Job ${job.jobId} (${selectedTemplateId})`
      );
    } catch {
      // ignore logging errors
    }

    setSentNotice('Opening native messaging app...');
    setTimeout(() => {
      setSentNotice(null);
    }, 4000);

    // Trigger native messaging intent
    window.location.href = smsUri;
  };

  // Handle WhatsApp intent fallback
  const handleSendWhatsApp = async () => {
    let cleanPhone = recipientPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    
    try {
      await logActivity(
        'SEND_WHATSAPP_STATUS',
        `Shared WhatsApp status to ${cleanPhone} for Job ${job.jobId}`
      );
    } catch {
      // ignore
    }

    window.open(waUrl, '_blank');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const charCount = messageText.length;
  // Estimate segments (roughly 70 chars for unicode, 160 for ascii)
  const isUnicode = /[^\u0000-\u00ff]/.test(messageText);
  const segmentLimit = isUnicode ? 70 : 160;
  const estimatedSegments = Math.max(1, Math.ceil(charCount / segmentLimit));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="glass-panel max-w-2xl w-full rounded-2xl border border-slate-700/80 bg-[#0a192f] p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/40 text-indigo-400">
              <MessageSquare className="w-5 h-5 text-[#d4af37]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Send SMS Status Update</span>
                <span className="text-xs font-serif text-[#d4af37]">کسٹمر کو اسٹیٹس میسج بھیجیں</span>
              </h3>
              <p className="text-xs text-slate-400">
                Directly triggers your device native messaging application via standard SMS intent
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

        {/* Job & Customer Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[#030b1e] border border-slate-800 text-xs">
          <div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3 text-[#d4af37]" /> Customer
            </p>
            <p className="font-bold text-white truncate">{job.customerName}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-cyan-400" /> Device / Job#
            </p>
            <p className="font-semibold text-slate-200 truncate">
              {job.company} {job.model} ({job.jobId})
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Wrench className="w-3 h-3 text-emerald-400" /> Current Status
            </p>
            <span className="inline-block font-bold text-emerald-300">
              {job.status}
            </span>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Balance Due</p>
            <p className={`font-mono font-bold ${job.balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              PKR {job.balance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recipient Phone input */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-[#d4af37]" />
              Recipient Mobile Number (موبائل نمبر)
            </span>
            <span className="text-[11px] font-normal text-slate-400">
              Native SMS will send to this number
            </span>
          </label>
          <input
            type="tel"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            placeholder="03001234567"
            className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono text-sm focus:border-[#d4af37] focus:outline-none"
          />
        </div>

        {/* Pre-defined SMS Template Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Select Pre-defined Status Template (پیغام کا انتخاب کریں):</span>
            </label>
            <span className="text-[11px] text-[#d4af37] font-semibold">
              {SMS_TEMPLATES.length} Templates Available
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {SMS_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`text-left p-2 rounded-xl border text-xs transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#0353a4]/40 border-[#d4af37] ring-1 ring-[#d4af37]/60 text-white'
                      : 'bg-[#030b1e] border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 w-full mb-1">
                    <span className="font-bold text-white text-[11px]">{tpl.titleEn}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border ${tpl.badgeColor}`}>
                      {tpl.category}
                    </span>
                  </div>
                  <p className="font-serif text-[11px] text-[#d4af37] dir-rtl text-right">
                    {tpl.titleUrdu}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Message Editor & Live Preview */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-slate-300">
              Message Content (Editable / ترمیم کے لیے دستیاب ہے):
            </label>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>{charCount} chars</span>
              <span>•</span>
              <span className="font-mono text-cyan-300">
                ~{estimatedSegments} SMS segment{estimatedSegments > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <textarea
            rows={5}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#030b1e] border border-slate-700 text-white text-xs leading-relaxed focus:border-[#d4af37] focus:outline-none font-sans"
            placeholder="Type your message..."
          />
        </div>

        {/* Feedback / Notice */}
        {sentNotice && (
          <div className="p-2 rounded-xl bg-blue-900/60 border border-blue-500 text-blue-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-300 animate-pulse" />
            <span>{sentNotice}</span>
          </div>
        )}

        {/* Actions Bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          
          {/* Secondary Actions (Copy & WhatsApp) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700"
              title="Copy text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SMS</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-600/50 text-emerald-300 rounded-xl text-xs flex items-center gap-1.5 transition"
              title="Share via WhatsApp"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Primary Action: Native SMS Intent */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSendNativeSMS}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition active:scale-95"
            >
              <Send className="w-4 h-4 text-[#d4af37]" />
              <span>Send via Native SMS App</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
