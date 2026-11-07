import React, { useState } from 'react';
import { Expense } from '../types';
import { putRecord, deleteRecord, logActivity } from '../services/db';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onRefresh: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onRefresh,
}) => {
  const [category, setCategory] = useState<Expense['category']>('Shop Rent');
  const [amount, setAmount] = useState<number>(1000);
  const [notes, setNotes] = useState('');
  const [payee, setPayee] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];
  const [expenseDate, setExpenseDate] = useState(todayStr);

  const categories: Expense['category'][] = [
    'Shop Rent',
    'Electricity Bill',
    'Technician Salary',
    'Spare Parts Purchase',
    'Tools / Equipment',
    'Tea & Refreshments',
    'Other Utility',
  ];

  const totalExpenseSum = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  const filteredExpenses = expenses.filter((e) =>
    filterCategory === 'ALL' ? true : e.category === filterCategory
  );

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      category,
      amount: Number(amount),
      notes: notes.trim(),
      date: expenseDate,
      payee: payee.trim(),
    };

    await putRecord('expenses', newExpense);
    await logActivity('SAVE_EXPENSE', `Saved expense ${category}: PKR ${amount}`);

    setAmount(1000);
    setNotes('');
    setPayee('');
    onRefresh();
  };

  const handleDeleteExpense = async (id: number) => {
    if (confirm('Delete this expense record?')) {
      await deleteRecord('expenses', id);
      await logActivity('DELETE_EXPENSE', `Deleted expense ID ${id}`);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-400" />
            <span>Shop Operating Expenses & Outflow</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log shop rent, electricity, refreshments, technician allowances, and equipment purchases
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Recorded Outflow</span>
            <p className="text-xl font-black text-rose-400 font-mono">
              PKR {totalExpenseSum.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Form */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-400" />
            <span>Record New Expense</span>
          </h3>

          <form onSubmit={handleSaveExpense} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Expense['category'])}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Expense Amount (PKR) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-rose-400 font-mono font-bold text-sm focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Date of Expense *
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Paid To / Payee (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Shop Landlord / MEPCO Electricity"
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">
                Description / Memo
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Monthly shop rent for Muzaffargarh lab"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition shadow"
            >
              Save Shop Expense
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              Expenses History
            </h3>
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#030b1e] border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Payee / Details</th>
                  <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No expense records found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses
                    .slice()
                    .reverse()
                    .map((exp) => (
                      <tr key={exp.id} className="hover:bg-[#030b1e]/50">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {exp.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">{exp.category}</td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {exp.payee ? <span className="text-[#d4af37] font-semibold">{exp.payee}: </span> : null}
                          {exp.notes || '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-400">
                          PKR {exp.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
};
