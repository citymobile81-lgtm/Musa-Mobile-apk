import React from 'react';
import { JobCard } from '../types';
import {
  Clock,
  Wrench,
  CheckCircle2,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface RepairStatusSummaryWidgetProps {
  jobs: JobCard[];
  onNavigate?: (view: string) => void;
  className?: string;
}

export const RepairStatusSummaryWidget: React.FC<RepairStatusSummaryWidgetProps> = ({
  jobs,
  onNavigate,
  className = '',
}) => {
  // 1. Calculate count for Pending state
  const pendingCount = jobs.filter((j) => {
    const s = (j.status || '').toLowerCase().trim();
    return (
      s === 'pending' ||
      s === 'received' ||
      s === 'under inspection' ||
      s === 'waiting for parts' ||
      s === 'پینڈنگ' ||
      s === 'نئی انٹری'
    );
  }).length;

  // 2. Calculate count for In Progress state
  const inProgressCount = jobs.filter((j) => {
    const s = (j.status || '').toLowerCase().trim();
    return (
      s === 'in progress' ||
      s === 'in-progress' ||
      s === 'under repair' ||
      s === 'جاری' ||
      s === 'زیرِ مرمت'
    );
  }).length;

  // 3. Calculate count for Completed state
  const completedCount = jobs.filter((j) => {
    const s = (j.status || '').toLowerCase().trim();
    return (
      s === 'completed' ||
      s === 'ready for delivery' ||
      s === 'delivered' ||
      s === 'مکمل' ||
      s === 'تیار'
    );
  }).length;

  const totalTracked = pendingCount + inProgressCount + completedCount;

  // Calculate percentage ratios for the distribution bar
  const pendingPct = totalTracked > 0 ? Math.round((pendingCount / totalTracked) * 100) : 0;
  const inProgressPct = totalTracked > 0 ? Math.round((inProgressCount / totalTracked) * 100) : 0;
  const completedPct = totalTracked > 0 ? Math.round((completedCount / totalTracked) * 100) : 0;

  return (
    <div
      className={`glass-panel p-4 sm:p-5 rounded-2xl border border-[#d4af37]/35 shadow-xl space-y-4 bg-gradient-to-br from-[#030b1e]/90 via-[#0a192f]/80 to-[#030b1e]/90 ${className}`}
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Repair Status Summary
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                Operational Overview
              </span>
            </div>
            <p className="text-xs text-[#d4af37] font-serif mt-0.5" dir="rtl">
              مرمت اسٹیٹس خلاصہ • فوری آپریشنل جائزہ
            </p>
          </div>
        </div>

        {/* Total Jobs Badge & Navigation */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Total Active Tracked</span>
            <span className="font-mono text-xs font-black text-white">
              {totalTracked} Jobs
            </span>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('jobCards')}
              className="px-3 py-1.5 rounded-xl bg-[#0353a4]/40 hover:bg-[#0353a4]/70 text-[#d4af37] border border-[#d4af37]/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              title="View all job cards in detail"
            >
              <span>تفصیلات</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3 Status Summary Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* State 1: PENDING */}
        <div
          onClick={() => onNavigate && onNavigate('jobCards')}
          className="p-3.5 sm:p-4 rounded-xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/40 hover:border-amber-400 transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Pending
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400 tracking-tight">
                {pendingCount}
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-400/80">
                {pendingPct}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-serif text-[#d4af37]" dir="rtl">
                زیرِ انتظار / پینڈنگ
              </span>
              <span className="text-[10px] text-slate-400">
                Awaiting Work
              </span>
            </div>
          </div>
        </div>

        {/* State 2: IN PROGRESS */}
        <div
          onClick={() => onNavigate && onNavigate('jobCards')}
          className="p-3.5 sm:p-4 rounded-xl bg-blue-950/30 hover:bg-blue-950/50 border border-blue-500/40 hover:border-blue-400 transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                In Progress
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-black font-mono text-blue-400 tracking-tight">
                {inProgressCount}
              </span>
              <span className="text-[11px] font-mono font-semibold text-blue-400/80">
                {inProgressPct}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-serif text-blue-300" dir="rtl">
                زیرِ مرمت / جاری
              </span>
              <span className="text-[10px] text-slate-400">
                Bench Active
              </span>
            </div>
          </div>
        </div>

        {/* State 3: COMPLETED */}
        <div
          onClick={() => onNavigate && onNavigate('jobCards')}
          className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 hover:bg-emerald-950/50 border border-emerald-500/40 hover:border-emerald-400 transition-all duration-200 cursor-pointer group shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Completed
              </span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-tight">
                {completedCount}
              </span>
              <span className="text-[11px] font-mono font-semibold text-emerald-400/80">
                {completedPct}%
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-serif text-emerald-300" dir="rtl">
                مکمل شدہ / تیار
              </span>
              <span className="text-[10px] text-slate-400">
                Ready & Delivered
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Operational Distribution Progress Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Workflow Distribution:</span>
          </span>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-amber-400">{pendingCount} Pending ({pendingPct}%)</span>
            <span>•</span>
            <span className="text-blue-400">{inProgressCount} In Progress ({inProgressPct}%)</span>
            <span>•</span>
            <span className="text-emerald-400">{completedCount} Completed ({completedPct}%)</span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="h-2.5 w-full bg-slate-900/90 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
          {totalTracked === 0 ? (
            <div className="h-full w-full bg-slate-800 rounded-full" />
          ) : (
            <>
              {pendingCount > 0 && (
                <div
                  style={{ width: `${(pendingCount / totalTracked) * 100}%` }}
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-l-full transition-all duration-500"
                  title={`Pending: ${pendingCount} (${pendingPct}%)`}
                />
              )}
              {inProgressCount > 0 && (
                <div
                  style={{ width: `${(inProgressCount / totalTracked) * 100}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                  title={`In Progress: ${inProgressCount} (${inProgressPct}%)`}
                />
              )}
              {completedCount > 0 && (
                <div
                  style={{ width: `${(completedCount / totalTracked) * 100}%` }}
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-r-full transition-all duration-500"
                  title={`Completed: ${completedCount} (${completedPct}%)`}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
