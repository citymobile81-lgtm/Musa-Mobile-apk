import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Search, 
  Send, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Phone, 
  Smartphone, 
  Calendar, 
  PlusCircle, 
  History,
  FileText
} from 'lucide-react';
import { JobCard, UdharPaymentLog } from '../types';
import { SHOP_PERSONNEL } from '../data/shopContacts';

interface CustomerUdharViewProps {
  jobCards: JobCard[];
  onUpdateJobCard: (jobCard: JobCard) => Promise<void> | void;
}

export const CustomerUdharView: React.FC<CustomerUdharViewProps> = ({
  jobCards,
  onUpdateJobCard,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'overdue' | 'high_balance'>('all');
  
  // Payment Modal State
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter jobs that have outstanding balance
  const udharJobs = useMemo(() => {
    return jobCards.filter(job => {
      // Calculate remaining balance
      const totalCost = job.cost ?? job.estimatedCost ?? 0;
      const advancePaid = job.advancePaid || 0;
      const balance = totalCost - advancePaid;
      return balance > 0;
    });
  }, [jobCards]);

  // Statistics
  const stats = useMemo(() => {
    let totalOutstanding = 0;
    let overdueCount = 0;
    const now = new Date().getTime();

    udharJobs.forEach(job => {
      const balance = (job.cost ?? job.estimatedCost ?? 0) - (job.advancePaid || 0);
      totalOutstanding += balance;

      // Check if older than 7 days
      const jobTime = new Date(job.createdAt || job.date || job.receivingDate || now).getTime();
      const diffDays = (now - jobTime) / (1000 * 3600 * 24);
      if (diffDays > 7) {
        overdueCount++;
      }
    });

    return {
      totalCustomers: udharJobs.length,
      totalOutstanding,
      overdueCount,
    };
  }, [udharJobs]);

  // Filtered List
  const filteredList = useMemo(() => {
    return udharJobs.filter(job => {
      const balance = (job.cost ?? job.estimatedCost ?? 0) - (job.advancePaid || 0);
      const phoneModel = job.phoneModel || `${job.company || ''} ${job.model || ''}`.trim();
      const jobIdentifier = job.jobCardNumber || job.jobId || '';
      const imeiStr = job.imei1 || job.imei2 || '';

      const matchesSearch = 
        job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customerPhone.includes(searchTerm) ||
        phoneModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        jobIdentifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imeiStr.includes(searchTerm);

      if (!matchesSearch) return false;

      if (filterType === 'overdue') {
        const jobTime = new Date(job.createdAt || job.date || job.receivingDate || Date.now()).getTime();
        const diffDays = (Date.now() - jobTime) / (1000 * 3600 * 24);
        return diffDays > 7;
      }
      if (filterType === 'high_balance') {
        return balance >= 3000;
      }
      return true;
    });
  }, [udharJobs, searchTerm, filterType]);

  // Generate Urdu Reminder Text
  const generateUrduReminderMessage = (job: JobCard) => {
    const balance = (job.cost ?? job.estimatedCost ?? 0) - (job.advancePaid || 0);
    const phoneModel = job.phoneModel || `${job.company || ''} ${job.model || ''}`.trim();
    return `السلام علیکم محترم ${job.customerName} صاحب!
موسیٰ موبائل ریپیئرنگ سنٹر کی طرف سے مطلع کیا جاتا ہے کہ آپ کے موبائل فون (${phoneModel}) کی مرمت کی مد میں بقایا رقم مبلغ ${balance} روپے واجب الادا ہے۔
برائے مہربانی جلد از جلد تشریف لا کر بقایا جات کلیئر فرمائیں۔ شکریہ!

پروپرائیٹر: ${SHOP_PERSONNEL.mohsin.nameUrdu} (${SHOP_PERSONNEL.mohsin.phone})
لیب انجینئر: ${SHOP_PERSONNEL.azhar.nameUrdu} (${SHOP_PERSONNEL.azhar.phone})
پتہ: بالمقابل قبا آپٹیکل، واٹر پلانٹ والی گلی، مظفرگڑھ`;
  };

  // WhatsApp Action
  const handleSendWhatsApp = (job: JobCard) => {
    let phone = job.customerPhone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '92' + phone.substring(1);
    }
    const message = generateUrduReminderMessage(job);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Native SMS Action
  const handleSendSMS = (job: JobCard) => {
    const message = generateUrduReminderMessage(job);
    const smsUrl = `sms:${job.customerPhone}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  // Submit Payment
  const handleReceivePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob || paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const currentAdvance = selectedJob.advancePaid || 0;
      const newAdvance = currentAdvance + paymentAmount;
      const totalCost = selectedJob.cost ?? selectedJob.estimatedCost ?? 0;
      const newBalance = Math.max(0, totalCost - newAdvance);

      const newLog: UdharPaymentLog = {
        id: `pay_${Date.now()}`,
        jobId: selectedJob.jobId || selectedJob.jobCardNumber || '',
        customerId: selectedJob.customerId || '',
        customerName: selectedJob.customerName,
        customerPhone: selectedJob.customerPhone,
        amountPaid: paymentAmount,
        amount: paymentAmount,
        remainingBalance: newBalance,
        date: new Date().toISOString(),
        receivedBy: 'میاں محمد محسن قریشی',
        notes: paymentNotes || 'بقایا رقم وصولی'
      };

      const existingHistory = selectedJob.paymentHistory || [];
      const updatedHistory = [...existingHistory, newLog];

      const updatedJob: JobCard = {
        ...selectedJob,
        advancePaid: newAdvance,
        balance: newBalance,
        paymentHistory: updatedHistory,
      };

      await onUpdateJobCard(updatedJob);
      setSelectedJob(null);
      setPaymentAmount(0);
      setPaymentNotes('');
    } catch (err) {
      console.error('Failed to record payment', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 p-6 rounded-2xl border border-yellow-500/30 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-xs font-bold mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              <span>کھاتہ بقایا جات / Udhar Ledger</span>
            </div>
            <h2 className="text-2xl font-black text-white">کسٹمر ادھار و بقایا جات مینجمنٹ</h2>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1" dir="rtl">
              کسٹمرز کے ذمہ واجب الادا رقم کا مکمل حساب، خودکار واٹس ایپ اور ایس ایم ایس ریمائنڈرز
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-4 py-2 rounded-xl border border-yellow-500/30">
            <span>موسی موبائل ریکوری سسٹم</span>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900/80 border border-yellow-500/30 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block" dir="rtl">کل ادھار رقم (واجب الادا)</span>
            <div className="text-2xl font-black text-yellow-400 mt-1">
              ₨ {stats.totalOutstanding.toLocaleString()}
            </div>
            <span className="text-[11px] text-zinc-500">Musa Mobile Total Udhar</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-zinc-400 font-semibold block" dir="rtl">بقایا دار کسٹمرز کی تعداد</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.totalCustomers}
            </div>
            <span className="text-[11px] text-zinc-500">Total Pending Clients</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-red-500/40 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <span className="text-xs text-red-300 font-semibold block" dir="rtl">تاخیر کا شکار (7 دن سے زائد)</span>
            <div className="text-2xl font-black text-red-400 mt-1">
              {stats.overdueCount}
            </div>
            <span className="text-[11px] text-red-400/80">Overdue Reminders</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="کسٹمر کا نام، فون نمبر، ماڈل تلاش کریں..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:border-yellow-400 outline-none"
            dir="rtl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-none ${
              filterType === 'all'
                ? 'bg-yellow-500 text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            تمام ادھار ({udharJobs.length})
          </button>
          <button
            onClick={() => setFilterType('overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-none ${
              filterType === 'overdue'
                ? 'bg-red-500 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            تاخیر والے ({stats.overdueCount})
          </button>
          <button
            onClick={() => setFilterType('high_balance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-none ${
              filterType === 'high_balance'
                ? 'bg-amber-500 text-black'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            بڑی رقم (₨ 3,000+)
          </button>
        </div>
      </div>

      {/* Customer Udhar Cards List */}
      <div className="space-y-4">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold text-white">کوئی بقایا ادھار موجود نہیں ہے</h3>
            <p className="text-xs text-zinc-400 mt-1">تمام کسٹمرز کے واجبات ادا ہو چکے ہیں یا سرچ کے نتائج خالی ہیں۔</p>
          </div>
        ) : (
          filteredList.map((job) => {
            const total = job.cost ?? job.estimatedCost ?? 0;
            const advance = job.advancePaid || 0;
            const balance = total - advance;
            const phoneModel = job.phoneModel || `${job.company || ''} ${job.model || ''}`.trim();
            const jobIdentifier = job.jobCardNumber || job.jobId || '';
            const faultDisplay = job.issue || job.fault || 'موبائل مرمت';
            
            // Overdue check
            const jobDate = new Date(job.createdAt || job.date || job.receivingDate || Date.now());
            const diffDays = Math.floor((Date.now() - jobDate.getTime()) / (1000 * 3600 * 24));
            const isOverdue = diffDays > 7;

            return (
              <div 
                key={job.jobId || job.id}
                className={`p-5 rounded-2xl border transition duration-200 bg-zinc-900/90 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isOverdue ? 'border-red-500/50 shadow-lg shadow-red-500/5' : 'border-zinc-800 hover:border-yellow-500/40'
                }`}
              >
                {/* Customer and Phone Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-yellow-400 font-bold">
                      #{jobIdentifier}
                    </span>
                    <h3 className="text-base font-bold text-white">{job.customerName}</h3>
                    {isOverdue && (
                      <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-[11px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{diffDays} دن پرانا</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                    <span className="flex items-center gap-1 text-zinc-300 font-mono">
                      <Phone className="w-3.5 h-3.5 text-yellow-500" />
                      {job.customerPhone}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-300">
                      <Smartphone className="w-3.5 h-3.5 text-yellow-500" />
                      {phoneModel}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {jobDate.toLocaleDateString('ur-PK')}
                    </span>
                  </div>

                  <div className="text-xs text-zinc-400 pt-1">
                    <span className="text-yellow-400 font-semibold">فالٹ: </span>
                    <span>{faultDisplay}</span>
                  </div>
                </div>

                {/* Balance and Amounts */}
                <div className="bg-black/50 px-5 py-3 rounded-xl border border-zinc-800 text-center md:text-right min-w-[180px]">
                  <span className="text-[11px] text-zinc-400 block" dir="rtl">واجب الادا بقایا رقم</span>
                  <div className="text-2xl font-black text-red-400">
                    ₨ {balance.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1 gap-3">
                    <span>کل بل: ₨ {total}</span>
                    <span>وصول شدہ: ₨ {advance}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setPaymentAmount(balance);
                    }}
                    className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>وصولی درج کریں</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(job)}
                    className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    title="واٹس ایپ ریمائنڈر بھیجیں"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleSendSMS(job)}
                    className="flex-1 md:flex-none px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    title="ایس ایم ایس بھیجیں"
                  >
                    <Send className="w-4 h-4" />
                    <span>SMS</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payment Entry Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-yellow-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span>ادھار رقم وصولی فارم</span>
              </h3>
              <button 
                onClick={() => setSelectedJob(null)}
                className="text-zinc-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-black/40 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-400">کسٹمر:</span>
                <span className="text-white font-bold">{selectedJob.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">موبائل ماڈل:</span>
                <span className="text-yellow-300">{selectedJob.phoneModel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">موجودہ بقایا:</span>
                <span className="text-red-400 font-bold font-mono">
                  ₨ {(selectedJob.cost || 0) - (selectedJob.advancePaid || 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handleReceivePayment} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-300 mb-1" dir="rtl">
                  وصول ہونے والی رقم (روپے):
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={(selectedJob.cost || 0) - (selectedJob.advancePaid || 0)}
                  value={paymentAmount || ''}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-white font-mono text-base focus:border-yellow-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1" dir="rtl">
                  تفصیل یا رسید نمبر (اختیاری):
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="مثلاً: کیش وصول بذریعہ میاں محمد محسن قریشی"
                  className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:border-yellow-400 outline-none"
                  dir="rtl"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedJob(null)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  منسوخ کریں
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || paymentAmount <= 0}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 text-black text-xs font-black transition disabled:opacity-50"
                >
                  {isSubmitting ? 'محفوظ ہو رہا ہے...' : 'وصولی تصدیق کریں'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
