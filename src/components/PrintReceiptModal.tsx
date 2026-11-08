import React, { useState, useEffect } from 'react';
import { JobCard, ShopSettings } from '../types';
import { RotatingLogo } from './RotatingLogo';
import { SHOP_PERSONNEL } from '../data/shopContacts';
import { Printer, Share2, X, Download, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import QRCode from 'qrcode';
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

  const handlePrint = () => {
    window.print();
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

          {/* Terms & Conditions */}
          <div className="text-[9px] text-slate-600 space-y-0.5 leading-tight">
            <p>1. Receipt required for pickup. 2. Repaired items not claimed within 30 days will be disposed. 3. Warranty valid only for specific repaired parts.</p>
            <p className="font-serif text-[10px] text-slate-800" dir="rtl">
              1۔ موبائل کی واپسی کے لیے رسید لازمی ہے۔ 2۔ 30 دن تک وصول نہ کرنے کی صورت میں شاپ ذمہ دار نہ ہوگی۔ 3۔ وارنٹی صرف تبدیل شدہ پارٹ پر لاگو ہے۔
            </p>
          </div>

          {/* Bottom Card Signature */}
          <div className="pt-2 text-center border-t border-slate-200">
            <p className="text-[11px] font-serif font-bold text-slate-900">
              "آپ کے اعتماد کا شکریہ، موسی موبائل ریپیئرنگ سنٹر"
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

        {/* Modal Buttons (Hidden in Print) */}
        <div className="no-print pt-2 flex flex-wrap items-center justify-between gap-2">
          {/* Main Action: Send Genuine WhatsApp Image Card */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsAppImageShare}
              disabled={isGeneratingImage}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-green-600/25 transition cursor-pointer disabled:opacity-60"
            >
              {isGeneratingImage ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Share2 className="w-4 h-4 text-amber-300" />
              )}
              <span>WhatsApp پر تصویری رسید بھیجیں</span>
            </button>

            <button
              onClick={handleDownloadImageCard}
              disabled={isGeneratingImage}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Save Image Card directly (PNG)"
            >
              <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Save Image</span>
            </button>
          </div>

          {/* Existing Print & PDF Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#0466c8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>پرنٹ رسید</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
