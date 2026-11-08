import React, { useState } from 'react';
import { Customer, JobCard, SparePart, Expense, ShopSettings } from '../types';
import { RotatingLogo } from '../components/RotatingLogo';
import { SHOP_PERSONNEL } from '../data/shopContacts';
import {
  Users,
  Wrench,
  Inbox,
  Cpu,
  CheckCircle2,
  Handshake,
  DollarSign,
  CalendarCheck,
  Clock,
  Boxes,
  PlusCircle,
  FileDown,
  AlertTriangle,
  ArrowRight,
  Printer,
  PhoneCall,
  HardDrive,
  Download,
  Share2,
  Copy,
  Check,
  Smartphone,
  ExternalLink,
  Bell,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  customers: Customer[];
  jobs: JobCard[];
  inventory: SparePart[];
  expenses: Expense[];
  settings: ShopSettings;
  onNavigate: (view: string) => void;
  onOpenReceipt: (job: JobCard) => void;
  onQuickBackup: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  jobs,
  inventory,
  expenses,
  settings,
  onNavigate,
  onOpenReceipt,
  onQuickBackup,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Computations
  const todayReceived = jobs.filter((j) => j.receivingDate === todayStr).length;
  const underRepair = jobs.filter(
    (j) => j.status === 'Under Repair' || j.status === 'Waiting for Parts' || j.status === 'Under Inspection'
  ).length;
  const pendingRepairs = jobs.filter(
    (j) =>
      j.status === 'Received' ||
      j.status === 'Under Inspection' ||
      j.status === 'Waiting for Parts' ||
      j.status === 'Under Repair'
  ).length;
  const readyForDelivery = jobs.filter((j) => j.status === 'Ready for Delivery').length;
  const deliveredMobiles = jobs.filter((j) => j.status === 'Delivered').length;

  let todayIncome = 0;
  let monthlyIncome = 0;
  let outstandingBalance = 0;

  jobs.forEach((j) => {
    const adv = Number(j.advancePaid || 0);
    const bal = Number(j.balance || 0);

    if (j.receivingDate === todayStr) {
      todayIncome += adv;
    }
    if (j.status === 'Delivered' && j.completionDate === todayStr) {
      todayIncome += bal;
    }

    if (j.receivingDate?.startsWith(currentMonthStr)) {
      monthlyIncome += adv;
    }
    if (j.status === 'Delivered' && j.completionDate?.startsWith(currentMonthStr)) {
      monthlyIncome += bal;
    }

    if (j.status !== 'Delivered' && j.status !== 'Cancelled') {
      outstandingBalance += bal;
    }
  });

  const totalPartsQty = inventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const lowStockItems = inventory.filter((item) => Number(item.quantity || 0) <= Number(item.minAlert || 2));

  // 7-day revenue/expense chart data for SVG Bar visualization
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const label = d.toLocaleDateString([], { weekday: 'short', day: 'numeric' });

    let income = 0;
    jobs.forEach((j) => {
      if (j.receivingDate === dStr) income += Number(j.advancePaid || 0);
      if (j.status === 'Delivered' && j.completionDate === dStr) income += Number(j.balance || 0);
    });

    let expenseTotal = 0;
    expenses.forEach((e) => {
      if (e.date === dStr) expenseTotal += Number(e.amount || 0);
    });

    return { label, income, expenseTotal };
  });

  const maxVal = Math.max(
    1,
    ...last7Days.map((d) => Math.max(d.income, d.expenseTotal))
  );

  return (
    <div className="space-y-6">
      {/* Premium Hero Banner with Rotating 3D Logo */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#030b1e] via-[#0a192f] to-[#0353a4]/50 p-6 border border-[#d4af37]/30 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <RotatingLogo size="lg" showGlow={true} customLogoUrl={settings.customLogoUrl} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl md:text-2xl font-black text-white tracking-wide">
                  {settings.shopName}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#d4af37] text-slate-950 font-extrabold text-[10px]">
                  PWA OFFLINE
                </span>
              </div>
              <p className="text-[#d4af37] font-serif text-lg font-bold mt-0.5">
                {settings.shopUrdu}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 mt-1">
                <span>{settings.address}</span>
                <span className="text-slate-500">•</span>
                <div className="flex flex-wrap items-center gap-1.5 font-mono">
                  <a
                    href={SHOP_PERSONNEL.mohsin.callUrl}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#030b1e]/80 border border-amber-500/40 hover:border-amber-400 text-amber-300 transition"
                  >
                    <PhoneCall className="w-3 h-3 text-amber-400" />
                    <span dir="ltr">پروپرائیٹر: {SHOP_PERSONNEL.mohsin.phone}</span>
                  </a>
                  <a
                    href={SHOP_PERSONNEL.azhar.callUrl}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#030b1e]/80 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 transition"
                  >
                    <PhoneCall className="w-3 h-3 text-cyan-400" />
                    <span dir="ltr">لیب انجینئر: {SHOP_PERSONNEL.azhar.phone}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('newRepair')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0353a4] to-[#0466c8] hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 border border-blue-400/30 flex items-center gap-2 transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-[#d4af37]" />
              <span>New Mobile Receiving</span>
            </button>
            <button
              onClick={() => onNavigate('reminders')}
              className="px-3.5 py-2.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-200 font-bold text-xs border border-amber-500/50 flex items-center gap-2 shadow transition cursor-pointer"
              title="Smart Repair Reminder & Alarm System"
            >
              <Bell className="w-4 h-4 text-[#d4af37]" />
              <span>ریمائنڈرز و الارم</span>
            </button>
            <button
              onClick={() => onNavigate('repairReports')}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 font-bold text-xs border border-indigo-500/50 flex items-center gap-2 shadow transition cursor-pointer"
              title="REPAIR REPORT & PDF PRINT"
            >
              <FileText className="w-4 h-4 text-[#d4af37]" />
              <span>رپورٹ و PDF پرنٹ</span>
            </button>
            <button
              onClick={() => onNavigate('localBackup')}
              className="px-3.5 py-2.5 rounded-xl bg-[#0a192f] hover:bg-slate-800 text-white font-bold text-xs border border-slate-700 flex items-center gap-2 shadow transition cursor-pointer"
              title="Open Local Backup & Restore System"
            >
              <HardDrive className="w-4 h-4 text-[#d4af37]" />
              <span>بیک اپ و ریسٹور</span>
            </button>
            <a
              href="/musa-mobile.apk"
              download="Musa-Mobile-Repairing-v2.0.apk"
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs border border-emerald-300/50 flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition hover:scale-105 active:scale-95 cursor-pointer"
              title="Download Android APK (براہِ راست اینڈرائیڈ APK ڈاؤن لوڈ کریں)"
            >
              <Smartphone className="w-4 h-4 text-yellow-300 animate-pulse" />
              <span>اینڈرائیڈ APK ڈاؤن لوڈ</span>
            </a>
            <button
              onClick={onQuickBackup}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-[#d4af37] font-semibold text-xs border border-[#d4af37]/40 flex items-center gap-1.5 shadow transition cursor-pointer"
              title="Instant ZIP Database Snapshot"
            >
              <FileDown className="w-4 h-4" />
              <span>ZIP بیک اپ</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10 Dashboard Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* 1. Total Customers */}
        <div
          onClick={() => onNavigate('customers')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-blue-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Customers</span>
            <Users className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white">{customers.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">Registered clients</p>
        </div>

        {/* 2. Total Repairs */}
        <div
          onClick={() => onNavigate('jobCards')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-cyan-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Repairs</span>
            <Wrench className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white">{jobs.length}</p>
          <p className="text-[10px] text-slate-400 mt-1">All time job cards</p>
        </div>

        {/* 3. Today's Received */}
        <div
          onClick={() => onNavigate('jobCards')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Today Received</span>
            <Inbox className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-amber-400">{todayReceived}</p>
          <p className="text-[10px] text-slate-400 mt-1">Check-ins today</p>
        </div>

        {/* 4. Pending Repairs (User Requirement #11) */}
        <div
          onClick={() => onNavigate('repairReports')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
          title="Click to view full Pending Mobile Repairs Report"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-rose-300">Pending Repairs</span>
            <Wrench className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-rose-400">{pendingRepairs}</p>
          <p className="text-[10px] text-slate-400 mt-1">مرمت کے منتظر ({underRepair} on bench)</p>
        </div>

        {/* 5. Ready for Delivery */}
        <div
          onClick={() => onNavigate('jobCards')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Ready for Delivery</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-emerald-400">{readyForDelivery}</p>
          <p className="text-[10px] text-slate-400 mt-1">Ready for handover</p>
        </div>

        {/* 6. Delivered Mobiles */}
        <div
          onClick={() => onNavigate('jobCards')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-teal-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Delivered Mobiles</span>
            <Handshake className="w-4 h-4 text-teal-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white">{deliveredMobiles}</p>
          <p className="text-[10px] text-slate-400 mt-1">Successfully repaired</p>
        </div>

        {/* 7. Today's Income */}
        <div
          onClick={() => onNavigate('reports')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-green-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Today's Income</span>
            <DollarSign className="w-4 h-4 text-green-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-green-400 font-mono">
            PKR {todayIncome.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Advances + Balances</p>
        </div>

        {/* 8. Monthly Income */}
        <div
          onClick={() => onNavigate('reports')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-[#d4af37] cursor-pointer hover:border-white transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Monthly Income</span>
            <CalendarCheck className="w-4 h-4 text-[#d4af37] group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-[#d4af37] font-mono">
            PKR {monthlyIncome.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Current month gross</p>
        </div>

        {/* 9. Outstanding Balance */}
        <div
          onClick={() => onNavigate('customerPayments')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Outstanding Balance</span>
            <Clock className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono">
            PKR {outstandingBalance.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Receivables from clients</p>
        </div>

        {/* 10. Available Spare Parts */}
        <div
          onClick={() => onNavigate('inventory')}
          className="glass-panel p-4 rounded-2xl border-l-4 border-l-purple-500 cursor-pointer hover:border-[#d4af37] transition group shadow"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Available Spare Parts</span>
            <Boxes className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <p className="text-2xl font-black text-white">{totalPartsQty}</p>
          <p className="text-[10px] text-slate-400 mt-1">{inventory.length} distinct items</p>
        </div>

      </div>

      {/* Analytics Chart & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Cashflow Bar Chart (Income vs Expense) */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Shop Income vs Expenses (Last 7 Days)</span>
              </h3>
              <p className="text-[11px] text-slate-400">Daily financial health and cashflow monitor</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-3 h-3 rounded-sm bg-[#0466c8]" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-3 h-3 rounded-sm bg-rose-500" /> Expense
              </span>
            </div>
          </div>

          {/* Pure Responsive SVG Bar Visualization */}
          <div className="h-56 flex items-end justify-between gap-2 pt-4 px-2">
            {last7Days.map((item, idx) => {
              const incomeHeight = Math.max(8, (item.income / maxVal) * 160);
              const expHeight = Math.max(8, (item.expenseTotal / maxVal) * 160);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                  <div className="w-full flex items-end justify-center gap-1 h-44">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incomeHeight}px` }}
                      className="w-1/2 max-w-[20px] rounded-t-lg bg-gradient-to-t from-[#0353a4] to-[#0466c8] group-hover:brightness-125 transition-all relative"
                      title={`Income: PKR ${item.income.toLocaleString()}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-1/2 max-w-[20px] rounded-t-lg bg-gradient-to-t from-rose-700 to-rose-500 group-hover:brightness-125 transition-all relative"
                      title={`Expense: PKR ${item.expenseTotal.toLocaleString()}`}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-white">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Parts Alerts */}
        <div className="glass-panel p-5 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Low Stock Spare Parts Alert</span>
              </h3>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs text-[#d4af37] hover:underline flex items-center gap-1"
              >
                <span>Stock</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Boxes className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                <p className="text-emerald-300 font-semibold">Stock Levels Healthy</p>
                <p className="text-[10px] mt-1 text-slate-500">No parts currently below minimum warning threshold.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {lowStockItems.map((part) => (
                  <div
                    key={part.id}
                    className="p-2.5 rounded-xl bg-[#030b1e] border border-rose-900/40 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-white">{part.partName}</p>
                      <p className="text-[10px] text-slate-400">{part.models}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold text-[11px] border border-rose-500/30">
                        Qty: {part.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Team Banner */}
          <div className="mt-4 p-3 rounded-xl bg-[#030b1e] border border-slate-800 text-xs">
            <p className="text-[#d4af37] font-bold text-[11px]">Lab Technical In-Charge:</p>
            <p className="text-slate-300 font-medium">Mian Azhar Qureshi (Chip Level Repair)</p>
          </div>
        </div>

      </div>

      {/* =========================================================================
          DATABASE BACKUP & SHOP QUICK TOOLS (بیک اپ و فوری ٹولز)
          ========================================================================= */}
      <div className="glass-panel p-5 rounded-2xl border border-[#d4af37]/40 shadow-2xl bg-gradient-to-br from-[#0a192f] via-[#030b1e] to-[#0a192f] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#d4af37]" />
              <span>Database Backup & Shop Management Quick Tools</span>
              <span className="text-xs font-serif text-[#d4af37]">بیک اپ و ڈیٹا سسٹم</span>
            </h3>
            <p className="text-xs text-slate-400">
              شاپ کے کسٹمرز، رسیدیں، ادھار کھاتہ اور اسپیئر پارٹس کا مکمل ڈیٹا محفوظ رکھیں
            </p>
          </div>

          <button
            type="button"
            onClick={onQuickBackup}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-black" />
            <span>فوری بیک اپ (.zip ڈاؤن لوڈ)</span>
          </button>
        </div>

        {/* 4 Shop Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* 1. New Repair */}
          <button
            type="button"
            onClick={() => onNavigate('newRepair')}
            className="p-3.5 rounded-xl bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-500/40 hover:border-blue-400 text-left transition flex flex-col justify-between gap-2 shadow-md group hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 rounded-lg bg-blue-500/20 text-[#d4af37]">
                <PlusCircle className="w-4 h-4" />
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 font-bold">
                Repair
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-xs">1. New Job Card</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-serif text-[#d4af37]">
                نیا کسٹمر جاب کارڈ بنائیں
              </p>
            </div>
          </button>

          {/* 2. Udhar Khata */}
          <button
            type="button"
            onClick={() => onNavigate('udharKhata')}
            className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-500/40 hover:border-indigo-400 text-left transition flex flex-col justify-between gap-2 shadow-md group hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                <Handshake className="w-4 h-4 text-[#d4af37]" />
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                Khata
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-xs">2. Customer Udhar Khata</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-serif text-[#d4af37]">
                کسٹمر ادھار و بقایا جات
              </p>
            </div>
          </button>

          {/* 3. Inventory Stock */}
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 text-left transition flex flex-col justify-between gap-2 shadow-md group hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                <Boxes className="w-4 h-4 text-[#d4af37]" />
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-300 font-bold">
                Stock
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-xs">3. Spare Parts Stock</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-serif text-[#d4af37]">
                اسپیئر پارٹس انوینٹری
              </p>
            </div>
          </button>

          {/* 4. Local Backup & Restore */}
          <button
            type="button"
            onClick={() => onNavigate('localBackup')}
            className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950 to-slate-900 border border-amber-500/40 hover:border-amber-400 text-left transition flex flex-col justify-between gap-2 shadow-md group hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-[#d4af37]">
                <HardDrive className="w-4 h-4" />
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold">
                Backup
              </span>
            </div>
            <div>
              <p className="font-bold text-white text-xs">4. Local Backup & Restore</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-serif text-[#d4af37]">
                بیک اپ محفوظ و بحال کریں
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* Recent Active Repair Job Cards Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-[#d4af37]" />
              <span>Recent Mobile Repair Job Cards</span>
            </h3>
            <p className="text-[11px] text-slate-400">Real-time status tracking and customer tokens</p>
          </div>
          <button
            onClick={() => onNavigate('jobCards')}
            className="px-3.5 py-1.5 bg-[#0353a4]/40 hover:bg-[#0353a4]/70 text-[#d4af37] border border-[#d4af37]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <span>View All ({jobs.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Fault Description</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Charges</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-500">
                    No active repair job cards found. Click 'New Mobile Receiving' above to create one.
                  </td>
                </tr>
              ) : (
                jobs
                  .slice()
                  .reverse()
                  .slice(0, 6)
                  .map((job) => (
                    <tr key={job.jobId} className="hover:bg-[#030b1e]/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">
                        {job.jobId}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{job.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{job.customerPhone}</p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {job.company} {job.model}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                        {job.fault}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{job.technician}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-white font-bold">
                          PKR {job.estimatedCost.toLocaleString()}
                        </span>
                        {job.balance > 0 && (
                          <span className="block text-[10px] text-rose-400">
                            Bal: PKR {job.balance.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            job.status === 'Ready for Delivery'
                              ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500'
                              : job.status === 'Delivered'
                              ? 'bg-teal-900/50 text-teal-300 border-teal-500'
                              : job.status === 'Under Repair'
                              ? 'bg-orange-900/50 text-orange-300 border-orange-500'
                              : 'bg-blue-900/50 text-blue-300 border-blue-500'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onOpenReceipt(job)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#0353a4] text-[#d4af37] transition"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
