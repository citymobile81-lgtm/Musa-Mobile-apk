import React, { useState } from 'react';
import { Customer, JobCard, ShopSettings } from '../types';
import {
  X,
  User,
  Phone,
  Smartphone,
  Calendar,
  DollarSign,
  Printer,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ExternalLink,
  PhoneCall,
  MessageSquare,
  Wrench,
  FileText,
  Hash,
} from 'lucide-react';

interface CustomerFullRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  activeJob: JobCard | null;
  allJobsOfCustomer: JobCard[];
  onOpenReceipt: (job: JobCard) => void;
  onNavigateToJobCards?: (jobId?: string) => void;
  onNavigateToNewRepair?: (customer: Customer) => void;
  onNavigateToReminders?: (job: JobCard) => void;
}

export const CustomerFullRecordModal: React.FC<CustomerFullRecordModalProps> = ({
  isOpen,
  onClose,
  customer,
  activeJob,
  allJobsOfCustomer,
  onOpenReceipt,
  onNavigateToJobCards,
  onNavigateToNewRepair,
  onNavigateToReminders,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    activeJob ? activeJob.jobId : allJobsOfCustomer[0]?.jobId || null
  );

  if (!isOpen) return null;

  // Selected job being displayed
  const currentJob =
    allJobsOfCustomer.find((j) => j.jobId === selectedJobId) || activeJob || allJobsOfCustomer[0];

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Ready for Delivery':
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          urdu: 'مرمت مکمل / ڈلیوری کے لیے تیار',
        };
      case 'Delivered':
        return {
          bg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          urdu: 'گاہک کو ڈلیور ہو چکا',
        };
      case 'Under Repair':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          urdu: 'زیرِ مرمت (کام جاری)',
        };
      case 'Waiting for Parts':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          urdu: 'سامان / اسپیئر پارٹس کا انتظار',
        };
      default:
        return {
          bg: 'bg-slate-700/50 text-slate-300 border-slate-600',
          urdu: status || 'موبائل موصول شدہ',
        };
    }
  };

  const statusInfo = getStatusBadge(currentJob?.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-gradient-to-b from-[#0a192f] via-[#030b1e] to-[#0a192f] border-2 border-[#d4af37]/60 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#030b1e] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] shadow-lg">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  {customer?.name || currentJob?.customerName || 'کسٹمر ریکارڈ'}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] font-mono text-[10px] font-bold">
                  {customer?.id || currentJob?.customerId || 'CUST'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span className="text-[#d4af37] font-bold">موسیٰ موبائل ریپیئرنگ سینٹر</span>
                <span>•</span>
                <span>کسٹمر و موبائل فون کی مکمل تفصیلات</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY SCROLL AREA */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Top Quick Info: Customer Phone & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#030b1e]/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">رابطہ نمبر (Primary)</p>
                <a
                  href={`tel:${customer?.phone || currentJob?.customerPhone}`}
                  className="font-mono font-bold text-white hover:text-[#d4af37] text-sm transition"
                >
                  {customer?.phone || currentJob?.customerPhone || 'N/A'}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">دوسرا فون نمبر (Alt)</p>
                <span className="font-mono font-bold text-slate-300">
                  {customer?.altPhone || currentJob?.altPhone || 'موجود نہیں'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#d4af37]/20 text-[#d4af37] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">رجسٹریشن / تاریخ</p>
                <span className="font-mono text-slate-300">
                  {customer?.createdAt?.split('T')[0] || currentJob?.receivingDate || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Customer's Devices Selector (Requirement #7: If customer has multiple phones, show each phone clearly) */}
          {allJobsOfCustomer.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>اس کسٹمر کے تمام موبائل فونز ({allJobsOfCustomer.length} کل فونز):</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  موبائل منتخب کر کے مکمل تفصیلات دیکھیں
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {allJobsOfCustomer.map((job) => {
                  const isSelected = currentJob?.jobId === job.jobId;
                  const b = getStatusBadge(job.status);
                  return (
                    <button
                      key={job.jobId}
                      type="button"
                      onClick={() => setSelectedJobId(job.jobId)}
                      className={`text-left p-3 rounded-2xl border transition relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#0353a4]/40 border-[#d4af37] shadow-lg ring-1 ring-[#d4af37]'
                          : 'bg-[#030b1e] border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div>
                          <p className="font-bold text-white text-xs">{job.company} {job.model}</p>
                          <p className="font-mono text-[10px] text-[#d4af37] font-semibold">{job.jobId}</p>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-bold ${b.bg}`}>
                          {job.status}
                        </span>
                      </div>

                      {job.imei1 && (
                        <p className="font-mono text-[10px] text-slate-400">
                          IMEI: ...<span className="text-[#d4af37] font-bold">{job.imei1.slice(-4)}</span>
                        </p>
                      )}

                      <p className="text-[10px] text-slate-400 truncate mt-1">
                        {job.fault || 'کوئی نقص درج نہیں'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ACTIVE DEVICE DETAILS */}
          {currentJob ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#030b1e] border border-slate-800 space-y-4">
              
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-[#d4af37] border border-amber-500/40">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {currentJob.company} {currentJob.model}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      Job Card ID: <strong className="text-[#d4af37]">{currentJob.jobId}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`px-2.5 py-1 rounded-xl border text-xs font-bold ${statusInfo.bg}`}>
                    {statusInfo.urdu}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                    وصولی تاریخ: {currentJob.receivingDate}
                  </span>
                </div>
              </div>

              {/* IMEI & Physical Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">IMEI 1</p>
                  <p className="font-mono font-bold text-slate-200">
                    {currentJob.imei1 ? (
                      <span>
                        {currentJob.imei1.slice(0, -4)}
                        <span className="text-[#d4af37] bg-amber-500/20 px-1 py-0.5 rounded font-black border border-amber-500/40">
                          {currentJob.imei1.slice(-4)}
                        </span>
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">IMEI 2</p>
                  <p className="font-mono font-bold text-slate-200">
                    {currentJob.imei2 || 'N/A'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">موبائل رنگ (Color)</p>
                  <p className="font-bold text-white">{currentJob.color || 'عام'}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">موصولہ سامان (Accessories)</p>
                  <p className="font-bold text-amber-300 truncate" title={currentJob.accessories || 'صرف موبائل'}>
                    {currentJob.accessories || 'صرف موبائل'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">لیب انجینئر</p>
                  <p className="font-bold text-[#d4af37]">{currentJob.technician || 'استاد اظہر قریشی'}</p>
                </div>

              </div>

              {/* Fault & Problem Description */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-amber-400" />
                  <span>مرمت کا مسئلہ و شکایات (Reported Fault):</span>
                </p>
                <p className="text-white text-xs sm:text-sm font-medium">
                  {currentJob.fault || 'کوئی نقص درج نہیں'}
                </p>
                {currentJob.diagnosis && (
                  <p className="text-slate-400 text-xs mt-1.5 border-t border-slate-800 pt-1.5">
                    <strong>تشخیص:</strong> {currentJob.diagnosis}
                  </p>
                )}
              </div>

              {/* Charges and Balance */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-900 via-[#0a192f] to-slate-900 border border-[#d4af37]/30 text-center font-mono">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">کل تخمینہ (Total)</p>
                  <p className="text-sm sm:text-base font-extrabold text-white">
                    ₨ {Number(currentJob.estimatedCost || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">ایڈوانس وصول (Advance)</p>
                  <p className="text-sm sm:text-base font-extrabold text-emerald-400">
                    ₨ {Number(currentJob.advancePaid || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">بقایا رقم (Balance)</p>
                  <p className={`text-sm sm:text-base font-extrabold ${Number(currentJob.balance || 0) > 0 ? 'text-red-400' : 'text-slate-300'}`}>
                    ₨ {Number(currentJob.balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-8 text-center bg-[#030b1e] rounded-2xl border border-slate-800">
              <Smartphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-300 font-bold">اس کسٹمر کے نام پر کوئی جاب کارڈ ابھی موجود نہیں ہے۔</p>
              <p className="text-slate-500 text-xs mt-1">آپ نیا مرمتی جاب کارڈ بنا سکتے ہیں۔</p>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-[#030b1e] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {customer && onNavigateToNewRepair && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToNewRepair(customer);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>New Mobile for this Customer</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentJob && (
              <>
                {onNavigateToReminders && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToReminders(currentJob);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 transition"
                    title="الارم و ریمائنڈر لگائیں"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Set Alarm</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onOpenReceipt(currentJob);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 text-slate-950 hover:opacity-95 font-black text-xs flex items-center gap-2 shadow-lg transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt (انوائس پرنٹ)</span>
                </button>
              </>
            )}

            {currentJob && onNavigateToJobCards && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToJobCards(currentJob.jobId);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#0353a4] hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Job Cards View</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
