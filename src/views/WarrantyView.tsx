import React, { useState } from 'react';
import { JobCard } from '../types';
import {
  ShieldCheck,
  Search,
  AlertCircle,
  CheckCircle,
  Clock,
  Printer,
} from 'lucide-react';

interface WarrantyViewProps {
  jobs: JobCard[];
  onOpenReceipt: (job: JobCard) => void;
}

export const WarrantyView: React.FC<WarrantyViewProps> = ({
  jobs,
  onOpenReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');

  const now = new Date();

  // Filter delivered jobs
  const deliveredJobs = jobs.filter((j) => j.status === 'Delivered');

  const jobsWithWarranty = deliveredJobs.map((j) => {
    const compDate = j.completionDate ? new Date(j.completionDate) : new Date(j.receivingDate);
    const daysAllowed = j.warrantyDays || 7;
    const expiryDate = new Date(compDate.getTime() + daysAllowed * 86400000);
    const diffTime = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isActive = daysRemaining >= 0;

    return {
      ...j,
      warrantyDaysAllowed: daysAllowed,
      expiryDateStr: expiryDate.toISOString().split('T')[0],
      daysRemaining,
      isActive,
    };
  });

  const filtered = jobsWithWarranty.filter((item) => {
    const q = search.toLowerCase();
    const matchesSearch =
      item.jobId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q) ||
      item.customerPhone.includes(q) ||
      `${item.company} ${item.model}`.toLowerCase().includes(q);

    if (filterType === 'ACTIVE') return matchesSearch && item.isActive;
    if (filterType === 'EXPIRED') return matchesSearch && !item.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <span>Repair Warranty & Customer Protection Tracker</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor 7-day screen testing warranties, battery replacements, and IC repair guarantees
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search Job#, Client, Phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0a192f] border border-slate-700 text-xs text-white focus:border-[#d4af37] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex rounded-xl bg-[#0a192f] border border-slate-700 p-1 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'ALL' ? 'bg-[#0353a4] text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({deliveredJobs.length})
            </button>
            <button
              onClick={() => setFilterType('ACTIVE')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterType('EXPIRED')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterType === 'EXPIRED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expired
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Repaired Fault</th>
                <th className="py-3 px-4">Warranty Period</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Days Left</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No delivered repair jobs found under this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.jobId} className="hover:bg-[#030b1e]/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">
                      {item.jobId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{item.customerName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {item.customerPhone}
                      </p>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {item.company} {item.model}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {item.fault}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {item.warrantyDaysAllowed} Days
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {item.expiryDateStr}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {item.isActive ? (
                        <span className="text-emerald-400">{item.daysRemaining} days left</span>
                      ) : (
                        <span className="text-slate-500">Expired</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          item.isActive
                            ? 'bg-emerald-900/50 text-emerald-300 border-emerald-500'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {item.isActive ? 'Active Warranty' : 'Expired'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onOpenReceipt(item)}
                        className="p-1 rounded bg-slate-800 hover:bg-[#0353a4] text-[#d4af37]"
                        title="Receipt"
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
