import React, { useState } from 'react';
import { JobCard, Expense, PartSale, ShopSettings } from '../types';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';

interface ReportsViewProps {
  jobs: JobCard[];
  expenses: Expense[];
  sales: PartSale[];
  settings: ShopSettings;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  jobs,
  expenses,
  sales,
  settings,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = todayStr.substring(0, 7) + '-01';

  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  // Filter records within date range
  const filteredJobs = jobs.filter((j) => {
    const d = j.receivingDate;
    return d >= startDate && d <= endDate;
  });

  const filteredExpenses = expenses.filter((e) => {
    return e.date >= startDate && e.date <= endDate;
  });

  const filteredSales = sales.filter((s) => {
    return s.date >= startDate && s.date <= endDate;
  });

  // Financial calculations
  let repairIncomeAdvance = 0;
  let repairIncomeDelivered = 0;
  let pendingReceivables = 0;

  filteredJobs.forEach((j) => {
    repairIncomeAdvance += Number(j.advancePaid || 0);
    if (j.status === 'Delivered') {
      repairIncomeDelivered += Number(j.balance || 0);
    } else if (j.status !== 'Cancelled') {
      pendingReceivables += Number(j.balance || 0);
    }
  });

  const totalRepairRevenue = repairIncomeAdvance + repairIncomeDelivered;

  const totalPartsSalesRevenue = filteredSales.reduce(
    (sum, s) => sum + Number(s.totalAmount || 0),
    0
  );

  const totalGrossIncome = totalRepairRevenue + totalPartsSalesRevenue;

  const totalExpenses = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount || 0),
    0
  );

  const netProfit = totalGrossIncome - totalExpenses;

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Daily & Monthly Financial Reports / Profit & Loss</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit repair revenue, accessory sales, operational overheads, and net shop profitability
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintReport}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#d4af37] font-semibold text-xs flex items-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Range */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-[#d4af37]" />
          <span className="text-xs font-bold text-white uppercase">Filter Date Range:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono"
            />
          </div>

          <button
            onClick={() => {
              setStartDate(todayStr);
              setEndDate(todayStr);
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-900/40 text-blue-300 border border-blue-700/50 hover:bg-blue-800/60"
          >
            Today
          </button>

          <button
            onClick={() => {
              setStartDate(firstDayOfMonth);
              setEndDate(todayStr);
            }}
            className="px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-800/60"
          >
            This Month
          </button>
        </div>
      </div>

      {/* 4 Financial Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400">Gross Collected Income</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            PKR {totalGrossIncome.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Repairs + Accessories</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500">
          <p className="text-xs text-slate-400">Total Shop Expenses</p>
          <p className="text-2xl font-black text-rose-400 font-mono mt-1">
            PKR {totalExpenses.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Rent, bills, staff, utilities</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-[#d4af37]">
          <p className="text-xs text-slate-400">Estimated Net Profit</p>
          <p className={`text-2xl font-black font-mono mt-1 ${netProfit >= 0 ? 'text-[#d4af37]' : 'text-rose-400'}`}>
            PKR {netProfit.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Gross Revenue - Expenses</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-400">Pending Receivables</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            PKR {pendingReceivables.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Customer balances due</p>
        </div>
      </div>

      {/* Detailed Financial Statement Breakdown */}
      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Musa Mobile Repairing Center — Statement of Profit & Loss
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Period: {startDate} to {endDate}
            </p>
          </div>
          <span className="text-xs text-[#d4af37] font-serif font-bold">
            {settings.shopUrdu}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Revenue Breakdown */}
          <div className="p-4 rounded-xl bg-[#030b1e] border border-slate-800 space-y-3">
            <h4 className="font-bold text-emerald-400 uppercase text-[11px] border-b border-slate-800 pb-2">
              Income Sources
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-300">Mobile Repair Advance Payments:</span>
              <span className="font-mono font-bold text-white">PKR {repairIncomeAdvance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-300">Mobile Repair Delivery Balances:</span>
              <span className="font-mono font-bold text-white">PKR {repairIncomeDelivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-300">Spare Parts & Accessories Retail Sales:</span>
              <span className="font-mono font-bold text-white">PKR {totalPartsSalesRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-emerald-400 text-sm">
              <span>Total Revenue:</span>
              <span className="font-mono">PKR {totalGrossIncome.toLocaleString()}</span>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="p-4 rounded-xl bg-[#030b1e] border border-slate-800 space-y-3">
            <h4 className="font-bold text-rose-400 uppercase text-[11px] border-b border-slate-800 pb-2">
              Operational Expenditures
            </h4>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-300">Total Recorded Expenses ({filteredExpenses.length} entries):</span>
              <span className="font-mono font-bold text-rose-400">PKR {totalExpenses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-300">Customer Due Balances (Receivables):</span>
              <span className="font-mono font-bold text-amber-400">PKR {pendingReceivables.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-sm">
              <span className="text-white">Net Bottom Line Profit:</span>
              <span className={`font-mono ${netProfit >= 0 ? 'text-[#d4af37]' : 'text-rose-400'}`}>
                PKR {netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Audit Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Prepared by: {settings.proprietor}</span>
          <span>Contact: {settings.phone}</span>
        </div>
      </div>
    </div>
  );
};
