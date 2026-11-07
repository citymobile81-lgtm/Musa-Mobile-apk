import React, { useState, useMemo } from 'react';
import { JobCard, ShopSettings } from '../types';
import { cleanDigits } from '../services/smartSearch';
import { RotatingLogo } from '../components/RotatingLogo';
import { SHOP_PERSONNEL } from '../data/shopContacts';
import {
  FileText,
  Printer,
  Download,
  Share2,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Phone,
  Smartphone,
  Wrench,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface RepairReportsViewProps {
  jobs: JobCard[];
  settings: ShopSettings;
  onOpenReceipt?: (job: JobCard) => void;
}

export const RepairReportsView: React.FC<RepairReportsViewProps> = ({
  jobs,
  settings,
  onOpenReceipt,
}) => {
  // Tabs: 'pending' | 'completed' | 'delivered' | 'all'
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'delivered' | 'all'>('pending');
  
  // Date Filters
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Filter Jobs based on Tab and Date Range
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Tab Filter
      if (activeTab === 'pending') {
        const isPending =
          job.status === 'Received' ||
          job.status === 'Under Inspection' ||
          job.status === 'Waiting for Parts' ||
          job.status === 'Under Repair';
        if (!isPending) return false;
      } else if (activeTab === 'completed') {
        if (job.status !== 'Ready for Delivery') return false;
      } else if (activeTab === 'delivered') {
        if (job.status !== 'Delivered') return false;
      }

      // 2. Date Filter
      const jobDateStr = job.receivingDate || '';
      const jobTime = jobDateStr ? new Date(jobDateStr).getTime() : 0;
      const now = new Date();

      if (dateFilterMode === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        if (!jobDateStr.startsWith(todayStr)) return false;
      } else if (dateFilterMode === 'week') {
        const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (jobTime < weekAgo) return false;
      } else if (dateFilterMode === 'month') {
        const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
        if (jobTime < monthAgo) return false;
      } else if (dateFilterMode === 'custom') {
        if (startDate && jobDateStr < startDate) return false;
        if (endDate && jobDateStr > endDate + 'T23:59:59') return false;
      }

      // 3. Smart Search Query (Name, Phone, IMEI initial/middle/last, Model, Fault, Job#)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const qDigits = cleanDigits(searchQuery);

        const matchName = job.customerName.toLowerCase().includes(q);
        const matchPhone =
          qDigits.length >= 2 &&
          (cleanDigits(job.customerPhone).includes(qDigits) ||
            cleanDigits(job.altPhone).includes(qDigits));
        const matchModel = `${job.company} ${job.model}`.toLowerCase().includes(q);
        const matchImei =
          qDigits.length >= 2 &&
          (cleanDigits(job.imei1).includes(qDigits) || cleanDigits(job.imei2).includes(qDigits));
        const matchFault = (job.fault || '').toLowerCase().includes(q);
        const matchJobId = job.jobId.toLowerCase().includes(q);

        return matchName || matchPhone || matchModel || matchImei || matchFault || matchJobId;
      }

      return true;
    });
  }, [jobs, activeTab, dateFilterMode, startDate, endDate, searchQuery]);

  // Overall Counts
  const pendingCount = jobs.filter(
    (j) =>
      j.status === 'Received' ||
      j.status === 'Under Inspection' ||
      j.status === 'Waiting for Parts' ||
      j.status === 'Under Repair'
  ).length;

  const completedCount = jobs.filter((j) => j.status === 'Ready for Delivery').length;
  const deliveredCount = jobs.filter((j) => j.status === 'Delivered').length;

  // Financial aggregates of current list
  const totalEstimatedCost = filteredJobs.reduce((sum, j) => sum + (j.estimatedCost || 0), 0);
  const totalAdvance = filteredJobs.reduce((sum, j) => sum + (j.advancePaid || 0), 0);
  const totalBalance = filteredJobs.reduce((sum, j) => sum + (j.balance || 0), 0);

  // Trigger A4 Print Dialog
  const handlePrintReport = () => {
    window.print();
  };

  // Download printable HTML report file
  const handleDownloadReportHtml = () => {
    const reportTitle =
      activeTab === 'pending'
        ? 'Pending_Mobile_Repairs_Report'
        : activeTab === 'completed'
        ? 'Completed_Mobile_Repairs_Report'
        : activeTab === 'delivered'
        ? 'Delivered_Mobile_Phones_Report'
        : 'All_Mobile_Repairs_Master_Report';

    const printableEl = document.getElementById('printable-repair-report');
    if (!printableEl) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ur" dir="rtl">
      <head>
        <meta charset="utf-8" />
        <title>${reportTitle} - Musa Mobile</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 20px; color: #111; background: #fff; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #444; padding: 6px 8px; text-align: right; }
          th { background-color: #f0f4f8; font-weight: bold; }
          .header-box { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 15px; }
          .totals-box { margin-top: 15px; border: 1px solid #000; padding: 10px; background: #fdfdfd; display: flex; justify-content: space-around; }
          @page { size: A4 landscape; margin: 10mm; }
        </style>
      </head>
      <body>
        ${printableEl.innerHTML}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportTitle}_${new Date().toISOString().split('T')[0]}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Share summary via WhatsApp
  const handleShareWhatsApp = () => {
    const tabName =
      activeTab === 'pending'
        ? 'Pending Mobile Repairs (مرمت باقی ہے)'
        : activeTab === 'completed'
        ? 'Completed Mobile Repairs (مرمت مکمل شدہ)'
        : activeTab === 'delivered'
        ? 'Delivered Mobile Phones (کسٹمرز کو واپس شدہ)'
        : 'Complete Mobile Repairs Report (مکمل رپورٹ)';

    let message =
      `*MUSA MOBILE REPAIRING CENTER*\n` +
      `*موسی موبائل ریپیئرنگ سنٹر*\n` +
      `--------------------------------\n` +
      `📋 *رپورٹ:* ${tabName}\n` +
      `📅 *تاریخ:* ${new Date().toLocaleDateString()}\n` +
      `📱 *کل موبائلز:* ${filteredJobs.length}\n` +
      `💰 *کل رقم:* PKR ${totalEstimatedCost.toLocaleString()}\n` +
      `💵 *وصول شدہ:* PKR ${totalAdvance.toLocaleString()}\n` +
      `💳 *بقایا رقم:* PKR ${totalBalance.toLocaleString()}\n` +
      `--------------------------------\n` +
      `پتہ: بالمقابل قبا آپٹیکل، واٹر پلانٹ والی گلی، مظفرگڑھ سٹی\n` +
      `📞 ${SHOP_PERSONNEL.mohsin.nameUrdu} (پروپرائیٹر): ${SHOP_PERSONNEL.mohsin.phone}\n` +
      `📞 ${SHOP_PERSONNEL.azhar.nameUrdu} (لیب انجینئر): ${SHOP_PERSONNEL.azhar.phone}`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* =========================================================================
          SCREEN ONLY: TOP HEADER & ACTIONS
          ========================================================================= */}
      <div className="no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#0353a4]/30 border border-[#d4af37]/40 text-[#d4af37] shadow-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white">
                  REPAIR REPORT & PDF PRINT
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37] text-slate-950 font-black text-[10px] uppercase tracking-wider">
                  رپورٹ و پی ڈی ایف
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-serif">
                موسی موبائل ریپیئرنگ سنٹر — موبائل مرمت کے مکمل ریکارڈ کی پیشہ ورانہ پی ڈی ایف رپورٹ اور پرنٹ سسٹم
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Print Direct, Download PDF/HTML, Share WhatsApp */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrintReport}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/20 transition cursor-pointer"
            title="Print A4 Report or Save as PDF"
          >
            <Printer className="w-4 h-4 text-[#d4af37]" />
            <span>پرنٹ / Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReportHtml}
            className="px-3.5 py-2.5 rounded-xl bg-[#0a192f] hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer"
            title="Download Report File"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Download HTML/PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 font-bold text-xs flex items-center gap-2 shadow transition cursor-pointer"
            title="Share on WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          SCREEN ONLY: 3 SUMMARY TILES (Pending, Completed, Delivered)
          ========================================================================= */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* 1. Pending Mobile Repairs */}
        <div
          onClick={() => setActiveTab('pending')}
          className={`glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500 cursor-pointer transition shadow-md ${
            activeTab === 'pending' ? 'ring-2 ring-[#d4af37] bg-rose-950/20' : 'hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">1. Pending Mobile Repairs</span>
            <Clock className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">
            وہ موبائل فون جو ابھی مرمت ہونے باقی ہیں
          </p>
        </div>

        {/* 2. Completed Mobile Repairs */}
        <div
          onClick={() => setActiveTab('completed')}
          className={`glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500 cursor-pointer transition shadow-md ${
            activeTab === 'completed' ? 'ring-2 ring-[#d4af37] bg-amber-950/20' : 'hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">2. Completed Mobile Repairs</span>
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-300">{completedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">
            وہ موبائل فون جو مرمت ہو چکے ہیں (Ready)
          </p>
        </div>

        {/* 3. Delivered Mobile Phones */}
        <div
          onClick={() => setActiveTab('delivered')}
          className={`glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500 cursor-pointer transition shadow-md ${
            activeTab === 'delivered' ? 'ring-2 ring-[#d4af37] bg-emerald-950/20' : 'hover:bg-slate-800/40'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold">3. Delivered Mobile Phones</span>
            <Send className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{deliveredCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5 font-serif">
            وہ موبائل فون جو کسٹمر کو واپس کر دیے گئے ہیں
          </p>
        </div>

      </div>

      {/* =========================================================================
          SCREEN ONLY: TABS & DATE RANGE CONTROLS
          ========================================================================= */}
      <div className="no-print glass-panel p-4 rounded-2xl space-y-3.5 shadow">
        
        {/* Four Main List Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {(
              [
                { id: 'pending', label: '1. Pending Repairs (مرمت باقی ہے)', count: pendingCount },
                { id: 'completed', label: '2. Completed Repairs (مرمت مکمل)', count: completedCount },
                { id: 'delivered', label: '3. Delivered Phones (واپس شدہ)', count: deliveredCount },
                { id: 'all', label: 'All Records (تمام لسٹوں کی جامع رپورٹ)', count: jobs.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#0353a4] to-[#0466c8] text-white shadow'
                    : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/30 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#d4af37] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="⚡ تلاش: نام، فون (0300..)، ماڈل، یا IMEI..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 bg-[#030b1e] border border-slate-700 hover:border-slate-600 focus:border-[#d4af37] rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none transition shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Date Filter (تاریخ فلٹر):</span>
            </span>
            {(
              [
                { id: 'all', label: 'All Time (تمام)' },
                { id: 'today', label: 'Today (آج)' },
                { id: 'week', label: 'This Week (7 دن)' },
                { id: 'month', label: 'This Month (30 دن)' },
                { id: 'custom', label: 'Custom Date' },
              ] as const
            ).map((df) => (
              <button
                key={df.id}
                type="button"
                onClick={() => setDateFilterMode(df.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  dateFilterMode === df.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>

          {dateFilterMode === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1 bg-[#030b1e] border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
              <span className="text-slate-500">تا</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1 bg-[#030b1e] border border-slate-700 rounded-lg text-white font-mono text-xs"
              />
            </div>
          )}
        </div>

      </div>

      {/* =========================================================================
          PRINTABLE & ON-SCREEN A4 REPORT SECTION
          ========================================================================= */}
      <div
        id="printable-repair-report"
        className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800 bg-[#0a192f] text-slate-100 shadow-2xl space-y-4 print:bg-white print:text-black print:border-none print:p-0 print:shadow-none"
      >
        
        {/* REPORT OFFICIAL SHOP HEADER (Included in PDF & Print) */}
        <div className="border-b-2 border-slate-700 print:border-black pb-4 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-3">
            <RotatingLogo
              size="md"
              showGlow={false}
              disableRotation={true}
              customLogoUrl={settings.customLogoUrl}
            />
            <div className="text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white print:text-black">
                {settings.shopName}
              </h1>
              <h2 className="text-lg font-bold font-serif text-[#d4af37] print:text-slate-800">
                {settings.shopUrdu}
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 print:text-slate-700 font-medium">
            {settings.address}
          </p>

          {/* 2 Authorized Shop Contact Phone Numbers */}
          <div className="flex flex-wrap items-center justify-center gap-3 font-mono text-xs font-bold text-slate-200 print:text-black">
            <span>📞 0321-6861765</span>
            <span>•</span>
            <span>📞 0300-6861765</span>
          </div>

          {/* Dedicated Personnel Block */}
          <div className="pt-1 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 print:text-slate-700 font-serif">
            <span><strong>پروپرائیٹر:</strong> میاں محمد محسن قریشی (0321-6861765)</span>
            <span>•</span>
            <span><strong>لیب انجینئر:</strong> میاں اظہر قریشی (0300-6861765)</span>
          </div>

          {/* Report Subtitle & Filter Info */}
          <div className="pt-2 border-t border-slate-800 print:border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-400 print:text-slate-600 px-2 font-mono">
            <span>
              <strong>Report Type:</strong>{' '}
              {activeTab === 'pending'
                ? 'Pending Mobile Repairs List (مرمت کے منتظر فونز)'
                : activeTab === 'completed'
                ? 'Completed Mobile Repairs List (مرمت مکمل شدہ)'
                : activeTab === 'delivered'
                ? 'Delivered Mobile Phones List (کسٹمرز کو واپس شدہ)'
                : 'Complete Mobile Repairs Master Report (جامع ریکارڈ)'}
            </span>
            <span>
              <strong>Generated:</strong> {new Date().toLocaleString()}
            </span>
          </div>
        </div>

        {/* FINANCIAL & COUNTER SUMMARY BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-[#030b1e] print:bg-slate-100 print:border print:border-black text-xs">
          <div className="text-center">
            <span className="text-slate-400 print:text-slate-600 text-[10px] uppercase font-bold">Total Mobiles</span>
            <p className="text-base font-black text-white print:text-black font-mono">
              {filteredJobs.length}
            </p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 print:text-slate-600 text-[10px] uppercase font-bold">Total Charges</span>
            <p className="text-base font-black text-emerald-400 print:text-black font-mono">
              PKR {totalEstimatedCost.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 print:text-slate-600 text-[10px] uppercase font-bold">Total Advance</span>
            <p className="text-base font-black text-blue-400 print:text-black font-mono">
              PKR {totalAdvance.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 print:text-slate-600 text-[10px] uppercase font-bold">Pending Balance</span>
            <p className="text-base font-black text-rose-400 print:text-black font-mono">
              PKR {totalBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {/* MAIN DATA TABLE WITH ALL REQUIRED INFORMATION */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse print:text-[10px]">
            <thead className="bg-[#030b1e] print:bg-slate-200 text-slate-300 print:text-black uppercase text-[10px] font-bold border-b border-slate-700 print:border-black">
              <tr>
                <th className="py-2.5 px-2 border border-slate-800 print:border-black">#</th>
                <th className="py-2.5 px-2 border border-slate-800 print:border-black">Job ID</th>
                <th className="py-2.5 px-3 border border-slate-800 print:border-black">Customer Details</th>
                <th className="py-2.5 px-3 border border-slate-800 print:border-black">Device & IMEI</th>
                <th className="py-2.5 px-3 border border-slate-800 print:border-black">Reported Fault (نقص)</th>
                <th className="py-2.5 px-2 text-right border border-slate-800 print:border-black">Total (PKR)</th>
                <th className="py-2.5 px-2 text-right border border-slate-800 print:border-black">Advance</th>
                <th className="py-2.5 px-2 text-right border border-slate-800 print:border-black">Balance</th>
                <th className="py-2.5 px-2 border border-slate-800 print:border-black">Receiving Date</th>
                <th className="py-2.5 px-2 border border-slate-800 print:border-black">Delivery Date</th>
                <th className="py-2.5 px-2 text-center border border-slate-800 print:border-black">Status (حالت)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-black">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 print:text-slate-600">
                    کوئی ریکارڈ نہیں ملا۔ برائے مہربانی فلٹر تبدیل کریں۔ (No records found)
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job, idx) => (
                  <tr
                    key={job.jobId}
                    className="hover:bg-[#030b1e]/60 print:hover:bg-transparent transition"
                  >
                    <td className="py-2 px-2 border border-slate-800 print:border-black font-mono text-slate-400 print:text-black">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black font-mono font-bold text-[#d4af37] print:text-black">
                      {job.jobId}
                    </td>
                    <td className="py-2 px-3 border border-slate-800 print:border-black">
                      <p className="font-bold text-white print:text-black">{job.customerName}</p>
                      <p className="text-[10px] text-slate-400 print:text-slate-700 font-mono">
                        {job.customerPhone}
                      </p>
                    </td>
                    <td className="py-2 px-3 border border-slate-800 print:border-black">
                      <p className="font-semibold text-slate-200 print:text-black">
                        {job.company} {job.model}
                      </p>
                      <p className="text-[10px] text-slate-400 print:text-slate-600 font-mono">
                        IMEI: {job.imei1 || 'N/A'}
                      </p>
                    </td>
                    <td className="py-2 px-3 border border-slate-800 print:border-black max-w-xs text-slate-300 print:text-black truncate">
                      {job.fault}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black text-right font-mono font-bold text-slate-100 print:text-black">
                      {job.estimatedCost.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black text-right font-mono text-emerald-400 print:text-black">
                      {job.advancePaid.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black text-right font-mono font-bold text-rose-400 print:text-black">
                      {job.balance.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black font-mono text-[10px] text-slate-300 print:text-black">
                      {job.receivingDate}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black font-mono text-[10px] text-slate-300 print:text-black">
                      {job.deliveryDate || 'Within 24h'}
                    </td>
                    <td className="py-2 px-2 border border-slate-800 print:border-black text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold border print:border-black print:text-black print:bg-transparent ${
                          job.status === 'Ready for Delivery'
                            ? 'bg-amber-900/60 text-amber-300 border-amber-500'
                            : job.status === 'Delivered'
                            ? 'bg-emerald-900/60 text-emerald-300 border-emerald-500'
                            : 'bg-rose-900/60 text-rose-300 border-rose-500'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Footer Totals */}
            <tfoot className="bg-[#030b1e] print:bg-slate-200 font-bold border-t-2 border-slate-700 print:border-black">
              <tr>
                <td colSpan={5} className="py-2.5 px-3 border border-slate-800 print:border-black text-right uppercase">
                  Grand Total (کل رقم):
                </td>
                <td className="py-2.5 px-2 border border-slate-800 print:border-black text-right font-mono text-emerald-400 print:text-black">
                  PKR {totalEstimatedCost.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 border border-slate-800 print:border-black text-right font-mono text-blue-400 print:text-black">
                  PKR {totalAdvance.toLocaleString()}
                </td>
                <td className="py-2.5 px-2 border border-slate-800 print:border-black text-right font-mono text-rose-400 print:text-black">
                  PKR {totalBalance.toLocaleString()}
                </td>
                <td colSpan={3} className="py-2.5 px-2 border border-slate-800 print:border-black text-center text-[10px] text-slate-400 print:text-black">
                  Total Items: {filteredJobs.length}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* SIGNATURE AND AUTHORIZATION BLOCK (FOR PRINT & PDF) */}
        <div className="pt-6 border-t border-slate-800 print:border-black grid grid-cols-2 gap-8 text-center text-xs font-serif print:text-[10px] text-slate-300 print:text-black max-w-lg mx-auto">
          <div className="border-t border-dashed border-slate-600 print:border-black pt-2">
            <p className="font-bold text-yellow-400 print:text-black">{SHOP_PERSONNEL.mohsin.nameUrdu}</p>
            <p className="text-[10px] text-slate-400 print:text-slate-600 font-sans">{SHOP_PERSONNEL.mohsin.roleEn} (<span dir="ltr">{SHOP_PERSONNEL.mohsin.phone}</span>)</p>
          </div>
          <div className="border-t border-dashed border-slate-600 print:border-black pt-2">
            <p className="font-bold text-yellow-400 print:text-black">{SHOP_PERSONNEL.azhar.nameUrdu}</p>
            <p className="text-[10px] text-slate-400 print:text-slate-600 font-sans">{SHOP_PERSONNEL.azhar.roleEn} (<span dir="ltr">{SHOP_PERSONNEL.azhar.phone}</span>)</p>
          </div>
        </div>

      </div>

    </div>
  );
};
