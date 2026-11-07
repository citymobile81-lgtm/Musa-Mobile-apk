import React, { useState, useMemo } from 'react';
import { Customer, JobCard } from '../types';
import { putRecord, deleteRecord, logActivity } from '../services/db';
import { cleanDigits } from '../services/smartSearch';
import { CustomerFullRecordModal } from '../components/CustomerFullRecordModal';
import {
  Users,
  Search,
  UserPlus,
  History,
  Phone,
  MapPin,
  Calendar,
  X,
  Edit2,
  Trash2,
  Smartphone,
  Sparkles,
  PhoneCall,
  Eye,
} from 'lucide-react';

interface CustomerViewProps {
  customers: Customer[];
  jobs: JobCard[];
  onRefresh: () => void;
  onOpenReceipt: (job: JobCard) => void;
  onNewRepairForCustomer: (customer: Customer) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  customers,
  jobs,
  onRefresh,
  onOpenReceipt,
  onNewRepairForCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  // Full Record Modal State
  const [fullRecordCust, setFullRecordCust] = useState<Customer | null>(null);
  const [fullRecordJob, setFullRecordJob] = useState<JobCard | null>(null);
  const [showFullModal, setShowFullModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');

  // Smart Search: Matches by 2-3 letters of Name, 2-4 digits of Phone, 2-4 digits of IMEI, or Model
  const filteredCustomers = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return customers;

    const qLower = trimmed.toLowerCase();
    const qDigits = cleanDigits(trimmed);

    return customers.filter((c) => {
      // 1. Customer Name match
      if (c.name.toLowerCase().includes(qLower)) return true;

      // 2. Customer Phone match (digits prefix or substring)
      if (qDigits.length >= 2) {
        if (cleanDigits(c.phone).includes(qDigits) || cleanDigits(c.altPhone).includes(qDigits)) {
          return true;
        }
      }

      // 3. Customer ID match
      if (c.id.toLowerCase().includes(qLower)) return true;

      // 4. Address match
      if (c.address && c.address.toLowerCase().includes(qLower)) return true;

      // 5. Customer Devices: search by IMEI (start, middle, last 4 digits) or Model/Company
      const custJobs = jobs.filter((j) => j.customerPhone === c.phone || j.customerId === c.id);
      for (const j of custJobs) {
        if (qDigits.length >= 2) {
          const imei1Clean = cleanDigits(j.imei1);
          const imei2Clean = cleanDigits(j.imei2);
          if (imei1Clean.includes(qDigits) || imei2Clean.includes(qDigits)) {
            return true;
          }
        }
        const modelStr = `${j.company} ${j.model}`.toLowerCase();
        if (modelStr.includes(qLower)) return true;
        if (j.jobId.toLowerCase().includes(qLower)) return true;
        if (j.fault && j.fault.toLowerCase().includes(qLower)) return true;
      }

      return false;
    });
  }, [customers, jobs, search]);

  const handleOpenAddModal = () => {
    setName('');
    setPhone('');
    setAltPhone('');
    setAddress('واٹر پلانٹ، نزد قبا آپٹیکل، مظفرگڑھ سٹی');
    setEditingCustomer(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setName(c.name);
    setPhone(c.phone);
    setAltPhone(c.altPhone || '');
    setAddress(c.address || '');
    setEditingCustomer(c);
    setShowAddModal(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim()) {
      alert('Customer Name and Mobile Phone are required.');
      return;
    }

    // Check duplicate phone if new
    if (!editingCustomer) {
      const exists = customers.some((c) => c.phone.trim() === phone.trim());
      if (exists) {
        alert('A customer with this phone number already exists!');
        return;
      }
    }

    const id = editingCustomer ? editingCustomer.id : `CUST-${1000 + customers.length + 1}`;
    const cust: Customer = {
      id,
      name: name.trim(),
      phone: phone.trim(),
      altPhone: altPhone.trim(),
      address: address.trim(),
      createdAt: editingCustomer ? editingCustomer.createdAt : new Date().toISOString(),
    };

    await putRecord('customers', cust);
    await logActivity('SAVE_CUSTOMER', `Saved customer ${cust.name} (${cust.phone})`);

    setShowAddModal(false);
    onRefresh();
  };

  const handleDeleteCustomer = async (id: string, custName: string) => {
    if (confirm(`Are you sure you want to delete customer record for "${custName}"?`)) {
      await deleteRecord('customers', id);
      await logActivity('DELETE_CUSTOMER', `Deleted customer ${custName} (${id})`);
      onRefresh();
    }
  };

  // Get customer repair history
  const customerHistoryJobs = historyCustomer
    ? jobs.filter((j) => j.customerPhone === historyCustomer.phone)
    : [];

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#d4af37]" />
            <span>Customer Management & History (کسٹمر ڈائرکٹری)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            نام، فون نمبر (2-4 ہندسے)، ماڈل، یا IMEI کے ذریعے تیز رفتار تلاش
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input
              type="text"
              placeholder="⚡ تلاش: نام، فون (0300..)، ماڈل، یا IMEI..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-xl bg-[#0a192f] border border-[#d4af37]/40 text-xs text-white placeholder-slate-400 focus:border-[#d4af37] focus:outline-none shadow-inner"
            />
            <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-2.5 top-2.5" />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-2 shadow shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Cust ID</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Mobile Number</th>
                <th className="py-3 px-4">Registered Devices & IMEIs (موبائل فونز)</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No customers found matching search query "{search}".
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const custJobs = jobs.filter((j) => j.customerPhone === c.phone || j.customerId === c.id);
                  return (
                    <tr key={c.id} className="hover:bg-[#030b1e]/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-[#d4af37]">
                        {c.id}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => {
                            setFullRecordCust(c);
                            setFullRecordJob(custJobs[0] || null);
                            setShowFullModal(true);
                          }}
                          className="font-bold text-white hover:text-[#d4af37] text-left transition flex items-center gap-1.5"
                          title="Click to view complete record"
                        >
                          <span>{c.name}</span>
                          <Eye className="w-3 h-3 text-[#d4af37] opacity-60" />
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Reg: {c.createdAt.split('T')[0]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-mono text-slate-200 flex items-center gap-1">
                          <PhoneCall className="w-3 h-3 text-emerald-400" />
                          <span>{c.phone}</span>
                        </p>
                        {c.altPhone && (
                          <p className="font-mono text-[10px] text-slate-400">Alt: {c.altPhone}</p>
                        )}
                      </td>
                      {/* Customer's Devices & Statuses (Requirement #6 & #7) */}
                      <td className="py-3 px-4">
                        {custJobs.length === 0 ? (
                          <span className="text-[11px] text-slate-500 italic">کوئی فون ریکارڈ نہیں</span>
                        ) : (
                          <div className="flex flex-col gap-1.5 max-w-sm">
                            {custJobs.map((j) => (
                              <button
                                key={j.jobId}
                                type="button"
                                onClick={() => {
                                  setFullRecordCust(c);
                                  setFullRecordJob(j);
                                  setShowFullModal(true);
                                }}
                                className="text-left px-2 py-1 rounded-lg bg-slate-900 hover:bg-[#0353a4]/40 border border-slate-800 hover:border-[#d4af37] transition flex items-center justify-between gap-2"
                              >
                                <div className="truncate">
                                  <span className="font-semibold text-white text-[11px]">
                                    {j.company} {j.model}
                                  </span>
                                  {j.imei1 && (
                                    <span className="font-mono text-[10px] text-slate-400 ml-1.5">
                                      IMEI: ...<span className="text-[#d4af37] font-bold">{j.imei1.slice(-4)}</span>
                                    </span>
                                  )}
                                </div>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                  j.status === 'Ready for Delivery'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : j.status === 'Delivered'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}>
                                  {j.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                        {c.address || 'Muzaffargarh'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setFullRecordCust(c);
                              setFullRecordJob(custJobs[0] || null);
                              setShowFullModal(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-[#d4af37] border border-[#d4af37]/40 font-semibold text-[11px] transition"
                            title="Open Full Record"
                          >
                            Full Record
                          </button>
                          <button
                            onClick={() => onNewRepairForCustomer(c)}
                            className="px-2.5 py-1 rounded-lg bg-[#0466c8] hover:bg-blue-600 text-white font-semibold text-[11px]"
                            title="Create New Job for this customer"
                          >
                            + Repair
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c.id, c.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#d4af37]" />
                <span>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mian Tariq Qureshi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Primary Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="03001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Alternate Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="03XXXXXXXXX"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Address / City
                </label>
                <input
                  type="text"
                  placeholder="Muzaffargarh City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d4af37] hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPAIR HISTORY MODAL */}
      {historyCustomer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-[#d4af37]" />
                  <span>Repair History: {historyCustomer.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {historyCustomer.phone} • {historyCustomer.address}
                </p>
              </div>
              <button
                onClick={() => setHistoryCustomer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {customerHistoryJobs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  No previous mobile repair visits on record for this customer.
                </p>
              ) : (
                customerHistoryJobs.map((j) => (
                  <div
                    key={j.jobId}
                    className="p-3.5 rounded-xl bg-[#030b1e] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#d4af37]">{j.jobId}</span>
                        <span className="text-white font-semibold">
                          {j.company} {j.model}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">({j.receivingDate})</span>
                      </div>
                      <p className="text-slate-300 mt-1">
                        <span className="text-slate-400">Fault:</span> {j.fault}
                      </p>
                      {j.technicianNotes && (
                        <p className="text-emerald-400 text-[11px] mt-0.5">
                          Fix Notes: {j.technicianNotes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-white">
                        PKR {j.estimatedCost.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          setHistoryCustomer(null);
                          onOpenReceipt(j);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-[#0353a4] text-[#d4af37] text-xs font-semibold"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setHistoryCustomer(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer & Device Full Record Modal */}
      <CustomerFullRecordModal
        isOpen={showFullModal}
        onClose={() => setShowFullModal(false)}
        customer={fullRecordCust}
        activeJob={fullRecordJob}
        allJobsOfCustomer={
          fullRecordCust
            ? jobs.filter((j) => j.customerPhone === fullRecordCust.phone || j.customerId === fullRecordCust.id)
            : []
        }
        onOpenReceipt={(job) => {
          setShowFullModal(false);
          onOpenReceipt(job);
        }}
        onNavigateToNewRepair={(cust) => {
          setShowFullModal(false);
          onNewRepairForCustomer(cust);
        }}
      />
    </div>
  );
};
