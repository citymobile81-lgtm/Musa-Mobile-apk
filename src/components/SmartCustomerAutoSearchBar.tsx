import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Customer, JobCard } from '../types';
import {
  searchSmartCustomerRecords,
  SmartSearchResult,
  cleanDigits,
} from '../services/smartSearch';
import {
  Search,
  X,
  User,
  Smartphone,
  PhoneCall,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Hash,
} from 'lucide-react';

interface SmartCustomerAutoSearchBarProps {
  customers: Customer[];
  jobs: JobCard[];
  onSelectResult: (result: SmartSearchResult) => void;
  placeholder?: string;
  className?: string;
}

export const SmartCustomerAutoSearchBar: React.FC<SmartCustomerAutoSearchBarProps> = ({
  customers,
  jobs,
  onSelectResult,
  placeholder = 'Smart Auto Search: نام کے 2-3 حروف، فون، یا IMEI کے 2-4 ہندسے لکھیں...',
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'DELIVERED'>('ALL');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Global keyboard shortcut: Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute search results instantly as user types (from 2 chars)
  const results = useMemo(() => {
    return searchSmartCustomerRecords(query, customers, jobs, statusFilter);
  }, [query, customers, jobs, statusFilter]);

  const handleSelect = (item: SmartSearchResult) => {
    onSelectResult(item);
    setIsOpen(false);
  };

  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'Ready for Delivery':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Delivered':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Under Repair':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Waiting for Parts':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const qDigits = cleanDigits(query);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#d4af37]">
          <Search className="w-4 h-4 animate-pulse" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-2 sm:py-2.5 rounded-2xl bg-[#030b1e] border border-[#d4af37]/40 hover:border-[#d4af37] focus:border-[#d4af37] text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none shadow-inner transition ring-0 focus:ring-2 focus:ring-[#d4af37]/30"
        />

        {/* Clear and Shortcut badge */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Clear [Esc]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-[10px] text-slate-400 font-mono">
              Ctrl+K
            </span>
          )}
        </div>
      </div>

      {/* FLOATING INSTANT SEARCH DROPDOWN */}
      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 bg-gradient-to-b from-[#0a192f] via-[#030b1e] to-[#0a192f] border-2 border-[#d4af37]/70 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col backdrop-blur-md">
          
          {/* Status Tabs Header */}
          <div className="p-2 sm:p-2.5 bg-[#030b1e] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'ALL'
                    ? 'bg-[#0353a4] text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All Records (تمام)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Pending (زیرِ مرمت)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Ready (تیار شدہ)
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DELIVERED')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition ${
                  statusFilter === 'DELIVERED'
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Delivered (ڈلیور)
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-mono">
              <Sparkles className="w-3 h-3 text-[#d4af37]" />
              <span>نتائج: <strong className="text-[#d4af37]">{results.length}</strong></span>
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-800/80 p-1 flex-1">
            {results.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <Search className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                <p className="font-bold text-white text-xs sm:text-sm">کوئی ریکارڈ نہیں ملا</p>
                <p className="text-[11px] text-slate-400">
                  "{query}" کے مطابق کسٹمر کا نام، موبائل نمبر یا IMEI موجود نہیں۔
                </p>
              </div>
            ) : (
              results.map((item) => {
                const statusBadge = getStatusStyle(item.status);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="p-3 hover:bg-[#0353a4]/20 cursor-pointer rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
                  >
                    {/* Customer & Device Primary Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 group-hover:border-[#d4af37] flex items-center justify-center text-[#d4af37] shrink-0 mt-0.5">
                        {item.type === 'job' ? (
                          <Smartphone className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm group-hover:text-[#d4af37] transition">
                            {item.customerName}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                            <PhoneCall className="w-2.5 h-2.5" />
                            <span>{item.customerPhone}</span>
                          </span>
                          {item.matchDetail && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                              {item.matchDetail}
                            </span>
                          )}
                        </div>

                        {/* Device Info (Requirement #6 & #7) */}
                        {item.type === 'job' && (
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-300">
                            <span className="font-bold text-white bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                              {item.company} {item.model}
                            </span>

                            {item.imei1 && (
                              <span className="font-mono text-slate-400">
                                IMEI:{' '}
                                {item.imei1.length >= 4 ? (
                                  <>
                                    {item.imei1.slice(0, -4)}
                                    <span className="font-bold text-[#d4af37] bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/40">
                                      {item.imei1.slice(-4)}
                                    </span>
                                  </>
                                ) : (
                                  item.imei1
                                )}
                              </span>
                            )}

                            {item.jobId && (
                              <span className="font-mono text-[10px] text-cyan-400">
                                #{item.jobId}
                              </span>
                            )}

                            {item.fault && (
                              <span className="text-slate-400 truncate max-w-xs">
                                • {item.fault}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status & Action */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      {item.type === 'job' && item.status && (
                        <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${statusBadge}`}>
                          {item.status}
                        </span>
                      )}

                      {item.type === 'job' && item.balance !== undefined && item.balance > 0 && (
                        <span className="font-mono text-[11px] font-bold text-amber-400">
                          بقیہ: ₨ {item.balance}
                        </span>
                      )}

                      <div className="p-1 rounded-lg bg-slate-800 text-slate-400 group-hover:text-white group-hover:bg-[#0353a4] transition">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Quick Tip Footer */}
          <div className="p-2 bg-[#030b1e] border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
            <span>💡 نام کے 2 حروف، فون کے 2-4 ہندسے، یا IMEI لکھ کر کسی بھی ریکارڈ پر کلک کریں۔</span>
            <span className="font-mono text-[#d4af37]">Musa Smart Search</span>
          </div>

        </div>
      )}
    </div>
  );
};
