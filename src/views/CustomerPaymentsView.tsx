import React, { useState } from 'react';
import { Customer, JobCard, PaymentRecord } from '../types';
import { putRecord, logActivity } from '../services/db';
import {
  CreditCard,
  Search,
  Plus,
  CheckCircle,
  Receipt,
  DollarSign,
} from 'lucide-react';

interface CustomerPaymentsViewProps {
  jobs: JobCard[];
  payments: PaymentRecord[];
  onRefresh: () => void;
  onOpenReceipt: (job: JobCard) => void;
}

export const CustomerPaymentsView: React.FC<CustomerPaymentsViewProps> = ({
  jobs,
  payments,
  onRefresh,
  onOpenReceipt,
}) => {
  const [search, setSearch] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(1000);
  const [method, setMethod] = useState<PaymentRecord['paymentMethod']>('Cash');
  const [notes, setNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Jobs that have an outstanding balance
  const unpaidJobs = jobs.filter((j) => j.balance > 0 && j.status !== 'Cancelled');
  const totalOutstanding = unpaidJobs.reduce((sum, j) => sum + j.balance, 0);

  const handleJobSelect = (jId: string) => {
    setSelectedJobId(jId);
    const target = jobs.find((j) => j.jobId === jId);
    if (target) {
      setPaymentAmount(target.balance);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJobId) {
      alert('Please select a job card to receive payment for.');
      return;
    }

    const job = jobs.find((j) => j.jobId === selectedJobId);
    if (!job) return;

    const amt = Number(paymentAmount) || 0;
    if (amt <= 0) {
      alert('Payment amount must be greater than 0.');
      return;
    }

    // 1. Record Payment
    const paymentItem: PaymentRecord = {
      id: Date.now(),
      jobId: job.jobId,
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      amount: amt,
      date: todayStr,
      paymentMethod: method,
      notes: notes.trim(),
    };
    await putRecord('payments', paymentItem);

    // 2. Update Job Card Balance and Advance
    job.advancePaid = (job.advancePaid || 0) + amt;
    job.balance = Math.max(0, job.estimatedCost - job.advancePaid);

    if (job.balance === 0 && job.status === 'Ready for Delivery') {
      job.status = 'Delivered';
      job.completionDate = todayStr;
    }

    await putRecord('job_cards', job);
    await logActivity('CUSTOMER_PAYMENT', `Received PKR ${amt} for ${job.jobId} via ${method}`);

    // Reset
    setSelectedJobId('');
    setPaymentAmount(0);
    setNotes('');
    onRefresh();
    alert(`Payment of PKR ${amt.toLocaleString()} recorded successfully!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <span>Customer Payments & Ledger Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Collect pending balances, clear job cards, and track digital/cash payments
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-right">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total Outstanding Balance</span>
          <p className="text-xl font-black text-rose-400 font-mono">
            PKR {totalOutstanding.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Payment Collection Form */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Receive Customer Payment</span>
          </h3>

          <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Select Pending Job Card *
              </label>
              <select
                required
                value={selectedJobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              >
                <option value="">-- Choose Job Card with Due Balance --</option>
                {unpaidJobs.map((j) => (
                  <option key={j.jobId} value={j.jobId}>
                    {j.jobId} - {j.customerName} ({j.company} {j.model}) - Due: PKR {j.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Payment Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-emerald-400 font-mono font-bold text-sm focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentRecord['paymentMethod'])}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              >
                <option value="Cash">Cash (کیش)</option>
                <option value="EasyPaisa">EasyPaisa (ایزی پیسہ)</option>
                <option value="JazzCash">JazzCash (جاز کیش)</option>
                <option value="Bank Transfer">Bank Transfer (بینک ٹرانسفر)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Notes / Transaction ID
              </label>
              <input
                type="text"
                placeholder="e.g. Paid in cash at handover"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
            >
              Confirm Payment & Update Job
            </button>
          </form>
        </div>

        {/* Ledger Transactions */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 overflow-hidden flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
            Recent Payment Ledger Records
          </h3>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3 text-right">Amount Paid</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No customer payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments
                    .slice()
                    .reverse()
                    .map((p) => {
                      const matchedJob = jobs.find((j) => j.jobId === p.jobId);
                      return (
                        <tr key={p.id} className="hover:bg-[#030b1e]/50">
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {p.date}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#d4af37]">
                            {p.jobId}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">{p.customerName}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono text-[10px] border border-slate-700">
                              {p.paymentMethod}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                            PKR {p.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {matchedJob && (
                              <button
                                onClick={() => onOpenReceipt(matchedJob)}
                                className="p-1 rounded bg-slate-800 hover:bg-[#0353a4] text-[#d4af37]"
                                title="Print Receipt"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
