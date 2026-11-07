import React, { useState, useMemo } from 'react';
import { JobCard, JobStatus, SparePart, PhonePhoto, ShopSettings, JobFaultItem, SecurityType } from '../types';
import { putRecord, deleteRecord, logActivity } from '../services/db';
import { PhonePhotoCapture } from '../components/PhonePhotoCapture';
import { SmsStatusModal } from '../components/SmsStatusModal';
import { MobileColorSelector } from '../components/MobileColorSelector';
import { MobileAccessoriesSelector } from '../components/MobileAccessoriesSelector';
import {
  IdCard,
  Search,
  Filter,
  Edit3,
  Printer,
  Trash2,
  X,
  Check,
  Wrench,
  Boxes,
  Camera,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  Activity,
  MessageSquare,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Hash,
  KeyRound,
  FileText,
  User,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

interface JobCardsViewProps {
  jobs: JobCard[];
  inventory: SparePart[];
  settings?: ShopSettings;
  onRefresh: () => void;
  onOpenReceipt: (job: JobCard) => void;
}

/**
 * Calculates completion percentage based on the number of resolved faults (status 'Completed') versus total faults.
 */
export function calculateFaultProgress(
  selectedFaults?: JobFaultItem[],
  status?: JobStatus,
  fallbackFault?: string
) {
  const faults = selectedFaults || [];
  const total = faults.length;

  if (total > 0) {
    const resolved = faults.filter(
      (f) => f.status === 'Completed' || (f.status as string)?.toLowerCase() === 'completed'
    ).length;
    const inProgress = faults.filter(
      (f) => f.status === 'In Progress' || (f.status as string)?.toLowerCase() === 'in progress'
    ).length;
    const pending = Math.max(0, total - resolved - inProgress);
    const percent = Math.round((resolved / total) * 100);

    return {
      total,
      resolved,
      inProgress,
      pending,
      percent,
      isComplete: percent === 100,
      faultsList: faults,
      hasMultiFaults: true,
    };
  }

  // Fallback for single or free-text fault
  const isFinished = status === 'Ready for Delivery' || status === 'Delivered';
  if (isFinished) {
    return {
      total: 1,
      resolved: 1,
      inProgress: 0,
      pending: 0,
      percent: 100,
      isComplete: true,
      faultsList: [],
      hasMultiFaults: false,
    };
  }

  const isUnderRepair = status === 'Under Repair';
  const isWaiting = status === 'Waiting for Parts';
  const percent = isUnderRepair ? 50 : isWaiting ? 25 : 0;

  return {
    total: 1,
    resolved: 0,
    inProgress: isUnderRepair ? 1 : 0,
    pending: 1,
    percent,
    isComplete: false,
    faultsList: [],
    hasMultiFaults: false,
  };
}

/**
 * Visual Progress Bar showing resolved faults vs total faults and completion percentage.
 */
export const RepairProgressBar: React.FC<{
  progress: ReturnType<typeof calculateFaultProgress>;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showFaultBadges?: boolean;
  isActiveJob?: boolean;
  className?: string;
}> = ({
  progress,
  size = 'sm',
  showLabel = true,
  showFaultBadges = false,
  isActiveJob = true,
  className = '',
}) => {
  const { total, resolved, percent, isComplete, inProgress, faultsList } = progress;

  const getBarGradient = () => {
    if (isComplete) return 'from-emerald-500 via-teal-400 to-emerald-400 shadow-emerald-500/40';
    if (percent >= 60) return 'from-amber-500 via-yellow-400 to-amber-400 shadow-amber-500/30';
    if (percent >= 25) return 'from-sky-500 via-blue-500 to-cyan-400 shadow-sky-500/30';
    return inProgress > 0 ? 'from-amber-600 to-orange-500 shadow-orange-500/20' : 'from-slate-600 to-slate-500';
  };

  const heightClass = size === 'lg' ? 'h-3.5' : size === 'md' ? 'h-2.5' : 'h-2';

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-[11px] font-mono leading-none">
          <div className="flex items-center gap-1.5">
            {isComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[10px]">
                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{resolved}/{total} Resolved</span>
                <span className="text-emerald-500/80 font-normal text-[9px]">(مکمل)</span>
              </span>
            ) : (
              <span className="text-slate-300 font-medium text-[10px] flex items-center gap-1">
                {isActiveJob && percent > 0 ? (
                  <Activity className="w-2.5 h-2.5 text-amber-400 animate-pulse shrink-0" />
                ) : (
                  <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                )}
                <span>
                  <strong className="text-white font-bold">{resolved}</strong>/{total} Resolved
                </span>
                {inProgress > 0 && (
                  <span className="text-amber-400 text-[9px] font-normal">({inProgress} in lab)</span>
                )}
              </span>
            )}
          </div>

          <span
            className={`font-black px-1.5 py-0.5 rounded text-[10px] tracking-tight transition shadow-sm ${
              isComplete
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                : percent >= 50
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                : percent > 0
                ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {percent}%
          </span>
        </div>
      )}

      {/* Progress Bar Track with Segment Dividers */}
      <div className={`w-full bg-[#030b1e] rounded-full overflow-hidden border border-slate-700/80 p-0.5 relative ${heightClass} shadow-inner`}>
        {/* Subtle segment divider tick marks for multiple faults */}
        {total > 1 && total <= 8 && (
          <div className="absolute inset-0 flex pointer-events-none z-10 px-0.5">
            {Array.from({ length: total - 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-[1px] bg-slate-900/90"
                style={{ left: `${((i + 1) / total) * 100}%` }}
              />
            ))}
          </div>
        )}

        {/* Fill Indicator */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getBarGradient()} transition-all duration-500 shadow-sm relative`}
          style={{ width: `${Math.max(percent, percent > 0 ? 6 : 0)}%` }}
        >
          {percent > 0 && percent < 100 && (
            <div className="absolute inset-0 bg-white/25 animate-pulse rounded-full" />
          )}
        </div>
      </div>

      {/* Optional Fault Chips / Dots Indicator */}
      {showFaultBadges && faultsList && faultsList.length > 0 && (
        <div className="flex items-center gap-1 pt-0.5 flex-wrap">
          {faultsList.map((f, i) => (
            <span
              key={f.id || i}
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium flex items-center gap-1 transition ${
                f.status === 'Completed'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                  : f.status === 'In Progress'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800'
              }`}
              title={`${f.category}: ${f.nameUrdu} - ${f.status || 'Pending'}`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  f.status === 'Completed'
                    ? 'bg-emerald-400 ring-2 ring-emerald-500/30'
                    : f.status === 'In Progress'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-500'
                }`}
              />
              <span className="truncate max-w-[85px]">{f.nameUrdu}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const JobCardsView: React.FC<JobCardsViewProps> = ({
  jobs,
  inventory,
  settings,
  onRefresh,
  onOpenReceipt,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState<'ALL' | 'NAME' | 'PHONE' | 'IMEI'>('ALL');
  const [editingJob, setEditingJob] = useState<JobCard | null>(null);
  const [smsJob, setSmsJob] = useState<JobCard | null>(null);

  // Edit Modal State
  const [newStatus, setNewStatus] = useState<JobStatus>('Received');
  const [newTotal, setNewTotal] = useState<number>(0);
  const [newAdvance, setNewAdvance] = useState<number>(0);
  const [techNotes, setTechNotes] = useState('');
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [jobPhotos, setJobPhotos] = useState<PhonePhoto[]>([]);
  const [editFaults, setEditFaults] = useState<JobFaultItem[]>([]);
  const [securityRevealed, setSecurityRevealed] = useState(false);
  const [securityWiped, setSecurityWiped] = useState(false);
  const [editColor, setEditColor] = useState('');
  const [editAccessories, setEditAccessories] = useState('');

  const statuses: JobStatus[] = [
    'Received',
    'Under Inspection',
    'Waiting for Parts',
    'Under Repair',
    'Ready for Delivery',
    'Delivered',
    'Cancelled',
    'Unrepairable',
  ];

  // Global search filtering by Customer Name, Phone Number, and last 4 digits of IMEI
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // 1. Status Filter
      if (filterStatus !== 'ALL' && job.status !== filterStatus) {
        return false;
      }

      // If search query is empty, return all matching status
      if (!searchQuery.trim()) {
        return true;
      }

      const rawQ = searchQuery.trim();
      const qLower = rawQ.toLowerCase();
      const qDigits = rawQ.replace(/\D/g, '');

      // Check Customer Name
      const matchesName = job.customerName.toLowerCase().includes(qLower);

      // Check Phone Number (normalized digits and raw string)
      const matchesPhone = () => {
        const phone1Clean = (job.customerPhone || '').replace(/\D/g, '');
        const phone2Clean = (job.altPhone || '').replace(/\D/g, '');
        if (qDigits && qDigits.length >= 2) {
          if (phone1Clean.includes(qDigits) || phone2Clean.includes(qDigits)) {
            return true;
          }
        }
        return (
          job.customerPhone.toLowerCase().includes(qLower) ||
          (job.altPhone ? job.altPhone.toLowerCase().includes(qLower) : false)
        );
      };

      // Check IMEI (prioritizing last 4 digits)
      const matchesImei = () => {
        const imei1Clean = (job.imei1 || '').replace(/\D/g, '');
        const imei2Clean = (job.imei2 || '').replace(/\D/g, '');

        if (qDigits) {
          // If user types exactly 4 digits (e.g. 1234), check if IMEI ends with those 4 digits!
          if (qDigits.length === 4) {
            if (imei1Clean.endsWith(qDigits) || imei2Clean.endsWith(qDigits)) {
              return true;
            }
          }
          // Also check if IMEI contains those digits
          if (imei1Clean.includes(qDigits) || imei2Clean.includes(qDigits)) {
            return true;
          }
        }

        return (
          (job.imei1 && job.imei1.toLowerCase().includes(qLower)) ||
          (job.imei2 && job.imei2.toLowerCase().includes(qLower))
        );
      };

      // Check other general fields (Job ID, Model, Fault)
      const matchesOther =
        job.jobId.toLowerCase().includes(qLower) ||
        `${job.company} ${job.model}`.toLowerCase().includes(qLower) ||
        (job.fault && job.fault.toLowerCase().includes(qLower));

      // Handle explicit target modes
      if (searchTarget === 'NAME') {
        return matchesName;
      }
      if (searchTarget === 'PHONE') {
        return matchesPhone();
      }
      if (searchTarget === 'IMEI') {
        return matchesImei();
      }

      // Default: ALL (Global Search: Customer Name OR Phone Number OR last 4 digits of IMEI OR Job#)
      return matchesName || matchesPhone() || matchesImei() || matchesOther;
    });
  }, [jobs, filterStatus, searchQuery, searchTarget]);

  const handleOpenEditModal = (job: JobCard) => {
    setEditingJob(job);
    setNewStatus(job.status);
    setNewTotal(job.estimatedCost);
    setNewAdvance(job.advancePaid);
    setTechNotes(job.technicianNotes || job.diagnosis || '');
    setSelectedPartId('');
    setJobPhotos(job.photos || []);
    setEditFaults(job.selectedFaults || []);
    setSecurityRevealed(false);
    setSecurityWiped(job.securityWiped || false);
    setEditColor(job.color || '');
    setEditAccessories(job.accessories || '');
  };

  const handleSaveJobUpdate = async () => {
    if (!editingJob) return;

    const total = Number(newTotal) || 0;
    const advance = Number(newAdvance) || 0;
    const balance = Math.max(0, total - advance);

    const updatedJob: JobCard = {
      ...editingJob,
      status: newStatus,
      estimatedCost: total,
      advancePaid: advance,
      balance,
      technicianNotes: techNotes,
      photos: jobPhotos,
      selectedFaults: editFaults,
      securityWiped,
      securityValue: securityWiped ? '' : editingJob.securityValue,
      color: editColor,
      accessories: editAccessories,
    };

    if (newStatus === 'Delivered' && !updatedJob.completionDate) {
      updatedJob.completionDate = new Date().toISOString().split('T')[0];
    }

    // Auto-deduct inventory part if selected
    if (selectedPartId) {
      const partToDeduct = inventory.find((p) => p.id === Number(selectedPartId));
      if (partToDeduct && partToDeduct.quantity > 0) {
        partToDeduct.quantity -= 1;
        await putRecord('inventory', partToDeduct);

        if (!updatedJob.partsUsed) updatedJob.partsUsed = [];
        updatedJob.partsUsed.push(`${partToDeduct.partName} (${partToDeduct.models})`);
      }
    }

    await putRecord('job_cards', updatedJob);
    await logActivity('UPDATE_JOB_STATUS', `Updated ${updatedJob.jobId} status to ${newStatus}`);

    setEditingJob(null);
    onRefresh();
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm(`Are you sure you want to permanently delete Job Card ${jobId}?`)) {
      await deleteRecord('job_cards', jobId);
      await logActivity('DELETE_JOB_CARD', `Deleted Job Card ${jobId}`);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Status Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <IdCard className="w-5 h-5 text-[#d4af37]" />
            <span>Repair Job Cards Registry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage bench jobs, parts deduction, delivery statuses, and token receipts
          </p>
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-8 pr-3 py-2 rounded-xl bg-[#0a192f] border border-slate-700 text-xs text-white focus:border-[#d4af37] focus:outline-none"
          >
            <option value="ALL">All Statuses ({jobs.length})</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s} ({jobs.filter((j) => j.status === s).length})
              </option>
            ))}
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* =========================================================================
          DEDICATED GLOBAL SEARCH BAR COMPONENT
          Allows searching by Customer Name, Phone Number, or Last 4 digits of IMEI
          ========================================================================= */}
      <div className="glass-panel p-4 rounded-2xl border border-[#d4af37]/40 bg-gradient-to-r from-[#0a192f] via-[#030b1e] to-[#0a192f] shadow-xl space-y-3">
        
        {/* Main Search Input */}
        <div className="relative flex items-center">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#d4af37]">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchQuery('');
            }}
            placeholder="Search by Customer Name, Phone Number, or last 4 digits of IMEI (e.g. 5678, Ahmed, 0300...)"
            className="w-full pl-11 pr-24 py-3 rounded-2xl bg-[#030b1e] border-2 border-slate-700 hover:border-slate-600 focus:border-[#d4af37] text-sm text-white placeholder-slate-400 focus:outline-none shadow-inner transition"
          />

          {/* Quick Clear Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition"
              title="Clear search [Esc]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Search Target Pills & Smart Detection Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
          
          {/* Target Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Search in:</span>
            
            <button
              type="button"
              onClick={() => setSearchTarget('ALL')}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                searchTarget === 'ALL'
                  ? 'bg-gradient-to-r from-[#0353a4] to-[#0466c8] text-white shadow'
                  : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>All Fields (تمام)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchTarget('NAME')}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                searchTarget === 'NAME'
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <User className="w-3 h-3 text-blue-400" />
              <span>Customer Name (کسٹمر نام)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchTarget('PHONE')}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                searchTarget === 'PHONE'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <PhoneCall className="w-3 h-3 text-emerald-400" />
              <span>Phone Number (فون نمبر)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchTarget('IMEI')}
              className={`px-2.5 py-1 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
                searchTarget === 'IMEI'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-[#030b1e] text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              <Hash className="w-3 h-3 text-[#d4af37]" />
              <span>Last 4 Digits of IMEI (آخری 4 ہندسے)</span>
            </button>
          </div>

          {/* Results Match Count & Smart Detection */}
          <div className="flex items-center gap-2 text-[11px] font-mono">
            {searchQuery.trim().replace(/\D/g, '').length === 4 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                ✨ Matching IMEI ending with "{searchQuery.trim().replace(/\D/g, '')}"
              </span>
            )}
            <span className="text-slate-300">
              Matches: <strong className="text-[#d4af37] font-bold">{filteredJobs.length}</strong> of {jobs.length} jobs
            </span>
          </div>

        </div>

      </div>

      {/* Job Cards Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4 min-w-[190px]">Diagnosed Faults (نقص)</th>
                <th className="py-3 px-4 min-w-[210px]">Repair Progress (پیشرفت)</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Charges</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400 space-y-2">
                    <p className="text-sm font-bold text-slate-300">
                      No repair job cards found matching your search.
                    </p>
                    <p className="text-xs text-slate-500">
                      {searchQuery
                        ? `No match found for query "${searchQuery}". Try searching by customer name, phone, or IMEI.`
                        : 'No jobs found in this status category.'}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="mt-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-[#d4af37] border border-[#d4af37]/40 text-xs font-bold transition"
                      >
                        Reset Search (فلٹر ختم کریں)
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredJobs
                  .slice()
                  .reverse()
                  .map((job) => (
                    <tr key={job.jobId} className="hover:bg-[#030b1e]/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">
                        {job.jobId}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {job.receivingDate}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{job.customerName}</p>
                        <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <PhoneCall className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{job.customerPhone}</span>
                        </p>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <p className="font-semibold text-white">{job.company} {job.model}</p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {job.color && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 border border-slate-700 font-medium">
                              رنگ: {job.color}
                            </span>
                          )}
                          {job.accessories && (
                            <span
                              className="text-[9px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800 truncate max-w-[130px]"
                              title={`موصولہ سامان: ${job.accessories}`}
                            >
                              سامان: {job.accessories}
                            </span>
                          )}
                        </div>
                        {job.imei1 && (
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>IMEI:</span>
                            {job.imei1.length >= 4 ? (
                              <span>
                                {job.imei1.slice(0, -4)}
                                <span
                                  className="font-black text-[#d4af37] bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/50 shadow-sm"
                                  title="Last 4 digits of IMEI"
                                >
                                  {job.imei1.slice(-4)}
                                </span>
                              </span>
                            ) : (
                              <span>{job.imei1}</span>
                            )}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {job.securityWiped ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              <ShieldAlert className="w-2.5 h-2.5 text-emerald-400" />
                              <span>Lock Wiped</span>
                            </span>
                          ) : job.securityType && job.securityType !== 'No Lock' ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-500/40">
                              <Lock className="w-2.5 h-2.5" />
                              <span>{job.securityType}</span>
                            </span>
                          ) : job.hasPatternLock ? (
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                job.patternLockVerified
                                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <Lock className="w-2.5 h-2.5" />
                              <span>{job.patternLockVerified ? 'Lock Verified' : 'Pattern Lock'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-400">
                              <Unlock className="w-2.5 h-2.5 text-slate-500" />
                              <span>No Lock</span>
                            </span>
                          )}

                          {job.photos && job.photos.length > 0 && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-950/70 text-cyan-300 border border-cyan-500/40"
                              title={`${job.photos.length} inspection photo(s) attached`}
                            >
                              <Camera className="w-2.5 h-2.5" />
                              <span>{job.photos.length} Photo{job.photos.length > 1 ? 's' : ''}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Diagnosed Faults */}
                      <td className="py-3 px-4 max-w-xs text-slate-300">
                        <p className="font-semibold text-slate-200 line-clamp-2">{job.fault}</p>

                        {job.selectedFaults && job.selectedFaults.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {job.selectedFaults.slice(0, 3).map((sf, idx) => (
                              <span
                                key={idx}
                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1 ${
                                  sf.status === 'Completed'
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                    : sf.status === 'In Progress'
                                    ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                                title={`${sf.category}: ${sf.status || 'Pending'}`}
                              >
                                {sf.status === 'Completed' && '✓ '}
                                {sf.status === 'In Progress' && '⏳ '}
                                <span>{sf.nameUrdu}</span>
                              </span>
                            ))}
                            {job.selectedFaults.length > 3 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{job.selectedFaults.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Visual Progress Bar for Active Repair Job */}
                      <td className="py-3 px-4 min-w-[210px]">
                        <div
                          onClick={() => handleOpenEditModal(job)}
                          className="cursor-pointer group hover:bg-slate-800/40 p-2 -m-2 rounded-xl transition"
                          title="Click to update repair faults & progress (مرمت کی پیشرفت اپڈیٹ کریں)"
                        >
                          <RepairProgressBar
                            progress={calculateFaultProgress(job.selectedFaults, job.status, job.fault)}
                            size="md"
                            showLabel={true}
                            showFaultBadges={true}
                            isActiveJob={job.status !== 'Delivered' && job.status !== 'Cancelled'}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{job.technician}</td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-white font-bold">
                          PKR {job.estimatedCost.toLocaleString()}
                        </span>
                        {job.advancePaid > 0 && (
                          <span className="block text-[10px] text-emerald-400">
                            Adv: PKR {job.advancePaid.toLocaleString()}
                          </span>
                        )}
                        {job.balance > 0 ? (
                          <span className="block text-[10px] text-rose-400 font-bold">
                            Due: PKR {job.balance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="block text-[10px] text-emerald-400 font-bold">
                            Fully Paid
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
                              : job.status === 'Waiting for Parts'
                              ? 'bg-amber-900/50 text-amber-300 border-amber-500'
                              : job.status === 'Cancelled' || job.status === 'Unrepairable'
                              ? 'bg-rose-900/50 text-rose-300 border-rose-500'
                              : 'bg-blue-900/50 text-blue-300 border-blue-500'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSmsJob(job)}
                            className="p-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 hover:text-white transition"
                            title="Send SMS Status Update / کسٹمر کو میسج بھیجیں"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(job)}
                            className="p-1.5 rounded-lg bg-[#0353a4]/50 hover:bg-[#0353a4] text-white transition"
                            title="Update Status & Notes"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenReceipt(job)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[#d4af37] transition"
                            title="Print Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteJob(job.jobId)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/80 text-slate-400 hover:text-rose-300 transition"
                            title="Delete Job"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT JOB MODAL */}
      {editingJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="glass-panel max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#d4af37]" />
                  <span>Update Job Card: {editingJob.jobId}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingJob.customerName} ({editingJob.customerPhone}) • {editingJob.company} {editingJob.model}
                </p>
              </div>
              <button
                onClick={() => setEditingJob(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Mobile Security Details & Privacy Controls */}
              <div className="p-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 rounded-xl border border-amber-600/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
                    <span>Customer Mobile Security (موبائل سیکیورٹی تفصیلات)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold border border-amber-500/50 bg-amber-950 text-amber-300">
                      {securityWiped
                        ? 'Lock Data Wiped (حذف شدہ)'
                        : editingJob.securityType || (editingJob.hasPatternLock ? 'Pattern Lock' : 'No Lock')}
                    </span>
                    {!securityWiped && (editingJob.securityValue || editingJob.hasPatternLock) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('کیا آپ کسٹمر کو فون واپس کرنے پر سیکیورٹی کوڈ حذف کرنا چاہتے ہیں؟')) {
                            setSecurityWiped(true);
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-[10px] font-semibold flex items-center gap-1"
                        title="Wipe lock data"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                        <span>Wipe (حذف)</span>
                      </button>
                    )}
                  </div>
                </div>

                {!securityWiped && editingJob.securityValue && (
                  <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Lock Code:</span>
                      <span className="font-mono font-bold text-white tracking-widest text-sm">
                        {securityRevealed ? editingJob.securityValue : '••••••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecurityRevealed(!securityRevealed)}
                      className="text-[11px] text-[#d4af37] hover:underline flex items-center gap-1"
                    >
                      {securityRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{securityRevealed ? 'Hide Code' : 'Reveal for Lab Test'}</span>
                    </button>
                  </div>
                )}

                {editingJob.securityNotes && (
                  <p className="text-[11px] text-slate-300">
                    <strong className="text-slate-400">Notes:</strong> {editingJob.securityNotes}
                  </p>
                )}

                {editingJob.hasPatternLock && (
                  <p className="text-[10px] text-amber-200/80 italic">
                    پیٹرن تصدیق: {editingJob.patternLockStatus || 'کسٹمر کی موجودگی میں تصدیق مکمل'} ({editingJob.patternDotsCount || 0} nodes).
                  </p>
                )}
              </div>

              {/* Diagnosed Faults List & Statuses with Live Visual Progress Bar */}
              {editFaults.length > 0 && (() => {
                const modalProgress = calculateFaultProgress(editFaults, newStatus, editingJob.fault);
                return (
                  <div className="p-3.5 bg-[#030b1e] rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                        <Wrench className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Faults Resolution Tracker ({editFaults.length} items)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-serif">ہر فالٹ کا اسٹیٹس حل شدہ کریں</span>
                    </div>

                    {/* Live Progress Bar Card in Modal */}
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-300">Repair Progress (مرمت کی پیشرفت):</span>
                        <span className={`font-mono font-bold ${modalProgress.isComplete ? 'text-emerald-400' : 'text-[#d4af37]'}`}>
                          {modalProgress.percent}% ({modalProgress.resolved}/{modalProgress.total} Resolved)
                        </span>
                      </div>
                      <RepairProgressBar progress={modalProgress} size="md" showLabel={false} />

                      {modalProgress.isComplete && newStatus !== 'Ready for Delivery' && newStatus !== 'Delivered' && (
                        <button
                          type="button"
                          onClick={() => setNewStatus('Ready for Delivery')}
                          className="mt-2 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/40 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>All faults resolved! Mark Job as "Ready for Delivery" (ڈلیوری کے لیے تیار کریں)</span>
                        </button>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {editFaults.map((f, idx) => (
                      <div
                        key={f.id || idx}
                        className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white truncate text-xs">{f.nameUrdu}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {f.category} • PKR {(f.cost || 0).toLocaleString()}
                          </p>
                        </div>

                        {/* Status Toggle Buttons */}
                        <div className="flex items-center gap-1">
                          {(['Pending', 'In Progress', 'Completed'] as const).map((st) => {
                            const isSt = f.status === st;
                            return (
                              <button
                                key={st}
                                type="button"
                                onClick={() => {
                                  const updated = editFaults.map((item, i) =>
                                    i === idx ? { ...item, status: st } : item
                                  );
                                  setEditFaults(updated);
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                                  isSt
                                    ? st === 'Completed'
                                      ? 'bg-emerald-600 text-white'
                                      : st === 'In Progress'
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

              {/* Device Color & Accessories Edit Section */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <MobileColorSelector
                  value={editColor}
                  onChange={(c) => setEditColor(c)}
                />
                <MobileAccessoriesSelector
                  value={editAccessories}
                  onChange={(acc) => setEditAccessories(acc)}
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Job Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as JobStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-bold focus:border-[#d4af37] focus:outline-none"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Total Charges (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newTotal}
                    onChange={(e) => setNewTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Advance Paid (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newAdvance}
                    onChange={(e) => setNewAdvance(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-emerald-400 font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Technician Work Notes / Fix Details
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Replaced display with original OLED, restored touch line, battery health 98%..."
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              {/* Automatic Spare Part Deduction */}
              <div className="p-3 bg-[#030b1e] rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Attach Spare Part (Auto-deducts 1 from inventory):</span>
                </label>
                <select
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                >
                  <option value="">-- No Inventory Spare Part Used --</option>
                  {inventory
                    .filter((p) => p.quantity > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partName} ({p.models}) - Qty: {p.quantity} - Retail: PKR {p.retailPrice}
                      </option>
                    ))}
                </select>
                {editingJob.partsUsed && editingJob.partsUsed.length > 0 && (
                  <p className="text-[10px] text-emerald-400">
                    Previously used parts: {editingJob.partsUsed.join(', ')}
                  </p>
                )}
              </div>

              {/* Mobile Inspection & Repair Photos */}
              <div className="pt-2 border-t border-slate-800">
                <PhonePhotoCapture
                  photos={jobPhotos}
                  onChange={(updated) => setJobPhotos(updated)}
                  title={`Mobile Condition & Inspection Photos (${jobPhotos.length})`}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = editingJob;
                      setEditingJob(null);
                      onOpenReceipt(current);
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-[#d4af37] rounded-xl flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmsJob(editingJob)}
                    className="px-3 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 hover:text-white rounded-xl flex items-center gap-1.5 transition"
                    title="Send SMS Status to Customer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>SMS Status</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingJob(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveJobUpdate}
                    className="px-5 py-2 bg-[#0466c8] hover:bg-blue-600 text-white font-bold rounded-xl flex items-center gap-1.5 shadow"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Update</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Status Update Modal with Native Messaging Intent */}
      {smsJob && (
        <SmsStatusModal
          job={smsJob}
          settings={settings}
          onClose={() => setSmsJob(null)}
        />
      )}
    </div>
  );
};
