import React, { useState, useEffect } from 'react';
import { JobCard, ShopSettings } from '../types';
import { RotatingLogo } from './RotatingLogo';
import { SHOP_PERSONNEL, SHOP_LOCATION } from '../data/shopContacts';
import { Printer, Share2, X, Download, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

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

  useEffect(() => {
    if (!job) return;

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

  const handleWhatsAppShare = () => {
    let cleanPhone = job.customerPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('03')) {
      cleanPhone = '92' + cleanPhone.substring(1);
    }

    const totalBill = job.estimatedCost || job.cost || 0;
    const balanceDue = job.balance ?? (totalBill - (job.advancePaid || 0));

    const message =
      `*${settings.shopName || 'MUSA MOBILE REPAIRING CENTER'}*\n` +
      `*${settings.shopUrdu || 'موسیٰ موبائل ریپیئرنگ سنٹر'}*\n` +
      `--------------------------------\n` +
      `*Job Card No:* ${job.jobId || job.jobCardNumber}\n` +
      `*Customer Name:* ${job.customerName}\n` +
      `*Device:* ${job.company} ${job.model} (${job.color || 'Standard'})\n` +
      `*IMEI:* ${job.imei1 || 'N/A'}\n` +
      `*Reported Fault:* ${job.fault || job.issue}\n` +
      `*Total Estimate:* PKR ${totalBill.toLocaleString()}\n` +
      `*Advance Paid:* PKR ${(job.advancePaid || 0).toLocaleString()}\n` +
      `*Remaining Balance:* PKR ${balanceDue.toLocaleString()}\n` +
      `*Expected Delivery:* ${job.deliveryDate || 'Within 24 Hours'}\n` +
      `*Status:* ${job.status}\n` +
      `--------------------------------\n` +
      `پتہ: بالمقابل قبا آپٹیکل، واٹر پلانٹ والی گلی، مظفرگڑھ\n` +
      `رابطہ نمبرز:\n` +
      `📞 ${SHOP_PERSONNEL.mohsin.nameUrdu} (پروپرائیٹر): ${SHOP_PERSONNEL.mohsin.phone}\n` +
      `📞 ${SHOP_PERSONNEL.azhar.nameUrdu} (لیب انجینئر): ${SHOP_PERSONNEL.azhar.phone}\n` +
      `شکریہ! موسیٰ موبائل ریپیئرنگ سنٹر`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const totalBill = job.estimatedCost || job.cost || 0;
  const balanceDue = job.balance ?? (totalBill - (job.advancePaid || 0));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl my-auto space-y-4">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Printer className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              Official Customer Job Card Receipt & Scannable QR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE RECEIPT TEMPLATE */}
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
              <span className="inline-flex items-center gap-1">📞 پروپرائیٹر: <span dir="ltr">{SHOP_PERSONNEL.mohsin.phone}</span></span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">📞 لیب انجینئر: <span dir="ltr">{SHOP_PERSONNEL.azhar.phone}</span></span>
            </div>
            <p className="text-[9px] text-slate-600 font-serif font-bold mt-0.5">
              پروپرائیٹر: {SHOP_PERSONNEL.mohsin.nameUrdu} | چیف لیب انجینئر: {SHOP_PERSONNEL.azhar.nameUrdu}
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

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-6 pt-3 text-[10px] text-center">
            <div>
              <div className="h-5" />
              <p className="border-t border-dashed border-slate-800 font-semibold pt-1">
                Customer Signature
              </p>
            </div>
            <div>
              <div className="h-5" />
              <p className="border-t border-dashed border-slate-800 font-semibold pt-1">
                Musa Mobile Authorized
              </p>
            </div>
          </div>
        </div>

        {/* Modal Buttons (Hidden in Print) */}
        <div className="no-print pt-2 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={handleWhatsAppShare}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
          >
            <Share2 className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>PDF / Print</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 bg-[#0466c8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
