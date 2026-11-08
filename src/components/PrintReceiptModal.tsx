import React, { useState, useEffect } from 'react';
import { JobCard, ShopSettings } from '../types';
import { RotatingLogo } from './RotatingLogo';
import { SHOP_PERSONNEL } from '../data/shopContacts';
import {
  Printer,
  Share2,
  X,
  Download,
  Image as ImageIcon,
  Loader2,
  Check,
  MessageSquare,
  FileText,
} from 'lucide-react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { generateReceiptImageCard } from '../services/receiptImageGenerator';

interface PrintReceiptModalProps {
  job: JobCard | null;
  settings: ShopSettings;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  job,
  settings,
  onClose,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [printFormat, setPrintFormat] = useState<'80mm' | '58mm' | 'a4'>('80mm');
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;

    // Reset state on job change
    setImagePreviewUrl(null);
    setShareFeedback(null);

    // Build structured verification text for the QR Code
    const qrData = JSON.stringify({
      shop: 'MUSA MOBILE REPAIRING CENTER',
      jobId: job.jobId || job.jobCardNumber,
      customer: job.customerName,
      phone: job.customerPhone,
      device: `${job.company} ${job.model}`,
      imei: job.imei1 || 'N/A',
      fault: job.fault || job.issue,
      total: job.estimatedCost || job.cost || 0,
      advance: job.advancePaid || 0,
      balance: job.balance ?? ((job.estimatedCost || job.cost || 0) - (job.advancePaid || 0)),
      date: job.receivingDate || job.createdAt,
      proprietor: `${SHOP_PERSONNEL.mohsin.nameEn} (${SHOP_PERSONNEL.mohsin.phone})`,
      labEngineer: `${SHOP_PERSONNEL.azhar.nameEn} (${SHOP_PERSONNEL.azhar.phone})`,
      location: 'Near Water Plant, Opposite Quba Optical, Muzaffargarh'
    });

    QRCode.toDataURL(qrData, {
      width: 130,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR Code', err));
  }, [job]);

  if (!job) return null;

  /**
   * Triggers clean system print with active format (58mm, 80mm, or A4)
   * Compatible with Bluetooth, Wi-Fi, USB OTG thermal and office printers.
   */
  const handlePrintReceipt = (overrideFormat?: '80mm' | '58mm' | 'a4') => {
    const fmt = overrideFormat || printFormat;
    const elem = document.getElementById('printable-receipt');
    if (elem) {
      elem.setAttribute('data-print-format', fmt);
    }
    window.print();
  };

  /**
   * Generates a genuine PDF receipt document using jsPDF and the high-res canvas.
   * Text and Urdu Nastaliq are rendered with 100% vector-crisp fidelity with zero broken characters.
   */
  const handleGeneratePDF = async () => {
    if (!job) return;
    setIsGeneratingPDF(true);
    setShareFeedback(null);

    try {
      const { dataUrl } = await generateReceiptImageCard({ job, settings });
      setImagePreviewUrl(dataUrl);

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgWidth = img.naturalWidth || 1200;
      const imgHeight = img.naturalHeight || 2000;

      // Create PDF document (Standard A4 portrait: 210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      let renderWidth = availableWidth;
      let renderHeight = (imgHeight * renderWidth) / imgWidth;

      if (renderHeight > availableHeight) {
        renderHeight = availableHeight;
        renderWidth = (imgWidth * renderHeight) / imgHeight;
      }

      const x = (pageWidth - renderWidth) / 2;
      const y = margin;

      pdf.addImage(dataUrl, 'PNG', x, y, renderWidth, renderHeight);

      const cleanCust = (job.customerName || 'customer').replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_');
      const pdfFileName = `Musa_Receipt_${job.jobId || job.jobCardNumber}_${cleanCust}.pdf`;

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], pdfFileName, { type: 'application/pdf' });

      // Check if browser Web Share supports PDF file transfer directly on Android
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        try {
          await navigator.share({
            files: [pdfFile],
            title: `Musa Mobile Receipt #${job.jobId || job.jobCardNumber}`,
            text: `موسیٰ موبائل ریپیئرنگ سنٹر - رسید کارڈ #${job.jobId || job.jobCardNumber}`,
          });
          setShareFeedback('پی ڈی ایف رسید کامیابی سے شیئر ہو گئی!');
          setIsGeneratingPDF(false);
          return;
        } catch (shareErr: unknown) {
          if ((shareErr as { name?: string })?.name !== 'AbortError') {
            console.warn('PDF share cancelled or failed, falling back to download', shareErr);
          }
        }
      }

      // Fallback: Direct download of standalone .pdf file
      pdf.save(pdfFileName);
      setShareFeedback('پی ڈی ایف رسید کامیابی سے ڈاؤن لوڈ ہو گئی!');
    } catch (err) {
      console.error('Error generating PDF receipt', err);
      setShareFeedback('PDF بنانے میں خرابی پیش آگئی۔ براہ کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  /**
   * Auto-formats and opens mobile SMS messenger with complete Urdu receipt details.
   * Completely offline, no internet or external SMS credits required.
   */
  const handleSendSMS = () => {
    if (!job) return;
    let phone = job.customerPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('92') && phone.length === 12) {
      phone = '0' + phone.substring(2);
    }

    const totalBill = job.estimatedCost || job.cost || 0;
    const advance = job.advancePaid || 0;
    const balance = job.balance ?? (totalBill - advance);

    const smsMessage =
`موسیٰ موبائل ریپیئرنگ سنٹر
رسید نمبر: #${job.jobId || job.jobCardNumber}
کسٹمر: ${job.customerName}
موبائل: ${job.company} ${job.model}
خرابی: ${job.fault || job.issue}
کل رقم: PKR ${totalBill.toLocaleString()}
ایڈوانس: PKR ${advance.toLocaleString()}
بقایا رقم: PKR ${balance.toLocaleString()}
پتہ: واٹر پلانٹ نزد قبا آپٹیکل، مظفرگڑھ
رابطہ: 03006861765 - 03216861765
آپ کے اعتماد کا شکریہ!`;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const separator = isIOS ? '&' : '?';
    const smsUrl = `sms:${phone}${separator}body=${encodeURIComponent(smsMessage)}`;

    setShareFeedback('موبائل ایس ایم ایس ایپ کھولی جا رہی ہے...');
    window.location.href = smsUrl;
  };

  /**
   * Generates genuine PNG receipt card and shares it directly as an image file on WhatsApp
   * using Web Share API (native on Android/iOS/Windows).
   * If direct image file sharing is not supported by the browser or user cancels,
   * it automatically downloads the image card to device and opens customer's WhatsApp chat.
   */
  const handleWhatsAppImageShare = async () => {
    if (!job) return;
    setIsGeneratingImage(true);
    setShareFeedback(null);

    try {
      const { blob, fileName, dataUrl } = await generateReceiptImageCard({ job, settings });
      setImagePreviewUrl(dataUrl);

      let cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('03')) {
        cleanPhone = '92' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = '92' + cleanPhone.substring(1);
      }

      const totalBill = job.cost ?? job.estimatedCost ?? 0;
      const advance = job.advancePaid || 0;
      const balance = job.balance ?? (totalBill - advance);

      const captionText =
        `*موسیٰ موبائل ریپیئرنگ سنٹر - رسید کارڈ*\n` +
        `*Job No:* #${job.jobId || job.jobCardNumber}\n` +
        `*Customer:* ${job.customerName}\n` +
        `*Device:* ${job.company} ${job.model}\n` +
        `*Remaining Balance:* PKR ${balance.toLocaleString()}\n` +
        `شکریہ! موسیٰ موبائل ریپیئرنگ سنٹر، واٹر پلانٹ نزد قبا آپٹیکل، مظفرگڑھ سٹی\n` +
        `📞 پروپرائیٹر (03006861765) | 📞 لیب انجینئر (03216861765)`;

      const imageFile = new File([blob], fileName, { type: 'image/png' });

      // Check if Web Share API can share image files (supported on modern Android Chrome/WebView)
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        try {
          await navigator.share({
            files: [imageFile],
            title: `Musa Mobile Receipt #${job.jobId || job.jobCardNumber}`,
            text: captionText,
          });
          setShareFeedback('تصویری رسید کامیابی سے شیئر ہو گئی!');
          setIsGeneratingImage(false);
          return;
        } catch (shareErr: unknown) {
          // If user aborted or share failed, fallback to save image + open WhatsApp
          if ((shareErr as { name?: string })?.name !== 'AbortError') {
            console.warn('Native image share did not complete, falling back', shareErr);
          }
        }
      }

      // Fallback: Trigger instant download of the PNG receipt card and open WhatsApp chat
      triggerDownload(dataUrl, fileName);

      setShareFeedback('رسید تصویر محفوظ ہو گئی! WhatsApp کھولا جا رہا ہے...');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(captionText)}`;
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 700);

    } catch (err) {
      console.error('Error generating WhatsApp receipt image', err);
      setShareFeedback('تصویر بنانے میں مسئلہ آیا۔ دوبارہ کوشش کریں۔');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  /**
   * Helper to download the PNG receipt card directly
   */
  const handleDownloadImageCard = async () => {
    if (!job) return;
    setIsGeneratingImage(true);
    try {
      const { dataUrl, fileName } = await generateReceiptImageCard({ job, settings });
      setImagePreviewUrl(dataUrl);
      triggerDownload(dataUrl, fileName);
      setShareFeedback('رسید کی تصویری فائل (PNG) ڈاؤن لوڈ ہو گئی!');
    } catch (err) {
      console.error('Download image card error', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalBill = job.estimatedCost || job.cost || 0;
  const balanceDue = job.balance ?? (totalBill - (job.advancePaid || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl my-auto space-y-4">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <ImageIcon className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Official Job Card Receipt & WhatsApp Image Card
              </h3>
              <p className="text-[10px] text-slate-500 font-serif">
                موسیٰ موبائل ریپیئرنگ سنٹر - تصویری رسید و انوائس
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification banner if any */}
        {shareFeedback && (
          <div className="no-print p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{shareFeedback}</span>
          </div>
        )}

        {/* PRINTABLE RECEIPT TEMPLATE (Used for Paper/Thermal Printer & PDF) */}
        <div
          id="printable-receipt"
          data-print-format={printFormat}
          className="p-4 border-2 border-slate-900 rounded-xl bg-white text-black font-sans text-xs space-y-3"
        >
          {/* Header */}
          <div className="text-center border-b-2 border-slate-900 pb-2.5">
            <div className="flex items-center justify-center gap-2 mb-1">
              <RotatingLogo
                size="sm"
                showGlow={false}
                disableRotation={true}
                customLogoUrl={settings.customLogoUrl}
              />
              <div className="text-left">
                <h2 className="text-sm sm:text-base font-black tracking-wider uppercase leading-none">
                  {settings.shopName || 'MUSA MOBILE REPAIRING CENTER'}
                </h2>
                <h3 className="text-sm font-bold font-serif text-slate-800 leading-tight">
                  {settings.shopUrdu || 'موسی موبائل ریپیئرنگ سنٹر'}
                </h3>
              </div>
            </div>
            <p className="text-[10px] text-slate-700 font-medium">
              Near Water Plant, Opposite Quba Optical, Muzaffargarh City, Pakistan
            </p>
            {/* Strictly Authorized Contact Numbers */}
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3 font-mono text-[10px] font-bold text-slate-900">
              <span className="inline-flex items-center gap-1">📞 پروپرائیٹر: <span dir="ltr">03006861765</span></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">📞 لیب انجینئر: <span dir="ltr">03216861765</span></span>
            </div>
            <p className="text-[9px] text-slate-600 font-serif font-bold mt-0.5">
              پروپرائیٹر: میاں محمد محسن قریشی | چیف لیب انجینئر: میاں اظہر قریشی
            </p>
          </div>

          {/* Job & Customer Grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px] border-b border-dashed border-slate-400 pb-2">
            <div>
              <p>
                <span className="font-bold">Job Card No:</span>{' '}
                <span className="font-black font-mono text-sm">{job.jobId || job.jobCardNumber}</span>
              </p>
              <p>
                <span className="font-bold">Customer:</span> {job.customerName}
              </p>
              <p>
                <span className="font-bold">Mobile:</span> {job.customerPhone}
              </p>
              {job.altPhone && <p><span className="font-bold">Alt:</span> {job.altPhone}</p>}
            </div>
            <div className="text-right">
              <p>
                <span className="font-bold">Received:</span> {job.receivingDate || job.createdAt}
              </p>
              <p>
                <span className="font-bold">Delivery:</span>{' '}
                {job.deliveryDate || 'Within 24 Hours'}
              </p>
              <p>
                <span className="font-bold">Engineer:</span> {job.technician || 'میاں اظہر قریشی'}
              </p>
              <p>
                <span className="font-bold">Status:</span>{' '}
                <span className="font-black uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                  {job.status}
                </span>
              </p>
            </div>
          </div>

          {/* Phone Device Specs */}
          <div className="border-b border-dashed border-slate-400 pb-2 text-[11px] space-y-1">
            <div className="grid grid-cols-2">
              <p>
                <span className="font-bold">Device:</span> {job.company} {job.model}
              </p>
              <p className="text-right">
                <span className="font-bold">Color:</span> {job.color || 'Standard'}
              </p>
            </div>
            <div className="grid grid-cols-2 text-[10px] font-mono">
              <p>
                <span className="font-bold font-sans">IMEI 1:</span> {job.imei1 || 'Not Recorded'}
              </p>
              {job.imei2 && (
                <p className="text-right">
                  <span className="font-bold font-sans">IMEI 2:</span> {job.imei2}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2">
              <p>
                <span className="font-bold">Screen Condition:</span> {job.screenCond || 'Normal'}
              </p>
              <p className="text-right">
                <span className="font-bold">Security Lock:</span>{' '}
                <span className="font-semibold text-slate-800">
                  {job.securityType || (job.hasPatternLock ? (job.patternLockVerified ? 'Pattern Lock (Verified)' : 'Pattern Lock') : 'No Lock')}
                </span>
              </p>
            </div>
            <p>
              <span className="font-bold">Accessories:</span> {job.accessories || 'None'}
            </p>

            {/* Diagnosed Faults List Table or Standard Complaint */}
            {job.selectedFaults && job.selectedFaults.length > 0 ? (
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-300 space-y-1">
                <p className="font-bold text-[10px] text-slate-800 uppercase tracking-wide">
                  Diagnosed Faults & Services (تفصیل خرابی و سروسز):
                </p>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600 font-bold">
                      <th className="text-left pb-0.5">Fault Item</th>
                      <th className="text-center pb-0.5">Status</th>
                      <th className="text-right pb-0.5">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {job.selectedFaults.map((sf, idx) => (
                      <tr key={idx}>
                        <td className="py-0.5 font-bold text-slate-900">
                          {sf.nameUrdu}{' '}
                          <span className="font-sans font-normal text-[9px] text-slate-500">
                            ({sf.category})
                          </span>
                        </td>
                        <td className="py-0.5 text-center text-[9px] font-semibold text-slate-700">
                          {sf.status}
                        </td>
                        <td className="py-0.5 text-right font-mono font-bold text-slate-900">
                          PKR {(sf.cost || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="bg-slate-50 p-1.5 rounded border border-slate-200">
                <span className="font-bold">Customer Complaint:</span> {job.fault || job.issue}
              </p>
            )}
          </div>

          {/* Billing Breakdown & QR Code Row */}
          <div className="border-b-2 border-slate-900 pb-2 flex items-center justify-between gap-4">
            <div className="flex-1">
              <table className="w-full text-[11px]">
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-1">Estimated / Total Charges:</td>
                    <td className="py-1 text-right font-mono font-bold">
                      PKR {totalBill.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-100">
                    <td className="py-1 text-emerald-700">Advance Paid:</td>
                    <td className="py-1 text-right font-mono font-bold text-emerald-700">
                      - PKR {(job.advancePaid || 0).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-slate-100 font-bold text-xs">
                    <td className="py-1.5 px-1.5">Remaining Balance Due:</td>
                    <td className="py-1.5 px-1.5 text-right font-mono font-black text-slate-900">
                      PKR {balanceDue.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scannable Official QR Code */}
            {qrCodeUrl && (
              <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded-lg text-center shrink-0">
                <img src={qrCodeUrl} alt="Musa Mobile QR Code" className="w-20 h-20 object-contain" />
                <span className="text-[8px] font-bold text-slate-700 mt-0.5 tracking-tighter uppercase">
                  Scan for Verification
                </span>
              </div>
            )}
          </div>

          {/* CUSTOMER RECEIPT NOTES / رسید کی خصوصی ہدایات */}
          <div className="text-[9px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-300 space-y-1 leading-normal">
            <p className="font-bold text-[10px] text-slate-900 border-b border-slate-200 pb-0.5">
              CUSTOMER RECEIPT NOTES / رسید کی خصوصی ہدایات:
            </p>
            <div className="font-serif text-[9.5px] text-slate-800 whitespace-pre-line leading-relaxed" dir="rtl">
              {settings.customerReceiptNotes || `اہم ہدایات برائے کسٹمر:
1۔ محترم کسٹمر! براہِ کرم اپنا موبائل فون رسید کی تاریخ سے 10 دن کے اندر وصول کر لیں۔ مقررہ مدت کے بعد موبائل فون نہ اٹھانے کی صورت میں دکاندار ذمہ دار نہ ہوگا۔
2۔ موبائل فون کی مرمت کے دوران اگر سیٹ میں پہلے سے موجود کسی خرابی کے علاوہ مزید خرابی پیدا ہو یا کسی اضافی مسئلے کا سامنا ہو تو دکاندار اس کا ذمہ دار نہ ہوگا۔
3۔ موبائل فون وصول کرتے وقت اس کی مکمل چیکنگ کر لیں اور اپنی موجودگی میں موبائل کی حالت، ڈسپلے، ٹچ، آواز اور دیگر متعلقہ فنکشنز چیک کر لیں۔
4۔ براہِ کرم اپنی رسید محفوظ رکھیں اور موبائل وصول کرتے وقت رسید دکھائیں۔`}
            </div>
          </div>

          {/* Bottom Card Gratitude & Dedication */}
          <div className="pt-2 text-center border-t border-slate-200 space-y-0.5">
            <p className="text-[11px] font-serif font-bold text-slate-900" dir="rtl">
              آپ کے اعتماد اور تعاون کا بے حد شکریہ!
            </p>
            <p className="text-[9.5px] font-serif text-slate-600" dir="rtl">
              موسی موبائل ریپیئرنگ سنٹر میں تشریف لانے کا شکریہ۔ ہم ہمیشہ آپ کی بہترین خدمت، معیاری کام اور اطمینان کے لیے کوشاں ہیں۔
            </p>
            <p className="text-[10px] font-serif font-bold text-blue-700" dir="rtl">
              آپ کا اعتماد، ہماری پہچان!
            </p>
          </div>
        </div>

        {/* Small Image Preview if generated */}
        {imagePreviewUrl && (
          <div className="no-print p-2 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <img src={imagePreviewUrl} alt="Preview" className="w-10 h-14 object-cover rounded border border-amber-400" />
              <div>
                <p className="font-bold text-amber-300">WhatsApp تصویری رسید تیار ہے</p>
                <p className="text-[10px] text-slate-400">High-Resolution PNG Card</p>
              </div>
            </div>
            <button
              onClick={handleDownloadImageCard}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>محفوظ کریں</span>
            </button>
          </div>
        )}

        {/* Print & Output Format Toolbar (Hidden in Print) */}
        <div className="no-print pt-2 space-y-2.5 border-t border-slate-200">
          {/* Printer Format Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>پرنٹر سائز (Printer Size):</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPrintFormat('80mm')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  printFormat === '80mm'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                80mm تھرمل
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('58mm')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  printFormat === '58mm'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                58mm منی
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  printFormat === 'a4'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                A4 صفحہ
              </button>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* WhatsApp & SMS Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleWhatsAppImageShare}
                disabled={isGeneratingImage || isGeneratingPDF}
                className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-green-600/20 transition cursor-pointer disabled:opacity-60"
              >
                {isGeneratingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Share2 className="w-4 h-4 text-amber-300" />
                )}
                <span>WhatsApp تصویری رسید</span>
              </button>

              <button
                type="button"
                onClick={handleSendSMS}
                className="px-3.5 py-2.5 bg-gradient-to-r from-teal-700 to-cyan-700 hover:from-teal-800 hover:to-cyan-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
                title="Send SMS directly via Android Messages app"
              >
                <MessageSquare className="w-4 h-4 text-cyan-200" />
                <span>SEND SMS / میسج بھیجیں</span>
              </button>
            </div>

            {/* PDF, Print & PNG Download Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || isGeneratingImage}
                className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer disabled:opacity-60"
                title="Generate standalone PDF document with intact Urdu"
              >
                {isGeneratingPDF ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                ) : (
                  <FileText className="w-4 h-4 text-rose-400" />
                )}
                <span>PDF رسید</span>
              </button>

              <button
                type="button"
                onClick={() => handlePrintReceipt(printFormat)}
                className="px-4 py-2.5 bg-[#0466c8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition cursor-pointer"
                title="Print on connected Bluetooth/Wi-Fi/USB Thermal or A4 printer"
              >
                <Printer className="w-4 h-4" />
                <span>پرنٹ رسید ({printFormat.toUpperCase()})</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadImageCard}
                disabled={isGeneratingImage || isGeneratingPDF}
                className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                title="Save Image Card (PNG)"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
