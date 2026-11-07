import React, { useState } from 'react';
import { PartPurchase, PartSale, SparePart } from '../types';
import { putRecord, logActivity } from '../services/db';
import {
  ShoppingCart,
  ShoppingBag,
  Plus,
  Boxes,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

interface PurchasesAndSalesViewProps {
  mode: 'purchase' | 'sale';
  inventory: SparePart[];
  purchases: PartPurchase[];
  sales: PartSale[];
  onRefresh: () => void;
}

export const PurchasesAndSalesView: React.FC<PurchasesAndSalesViewProps> = ({
  mode,
  inventory,
  purchases,
  sales,
  onRefresh,
}) => {
  // Purchase Form State
  const [selectedPartId, setSelectedPartId] = useState<string>('');
  const [customPartName, setCustomPartName] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [purchaseQty, setPurchaseQty] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number>(1000);
  const [invoiceNo, setInvoiceNo] = useState('');

  // Sale Form State
  const [salePartId, setSalePartId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(1500);

  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-populate prices when part is selected
  const handlePartSelectForPurchase = (idStr: string) => {
    setSelectedPartId(idStr);
    const part = inventory.find((p) => p.id === Number(idStr));
    if (part) {
      setCustomPartName(part.partName);
      setUnitCost(part.purchasePrice);
      if (part.supplierName) setSupplierName(part.supplierName);
    }
  };

  const handlePartSelectForSale = (idStr: string) => {
    setSalePartId(idStr);
    const part = inventory.find((p) => p.id === Number(idStr));
    if (part) {
      setUnitPrice(part.retailPrice);
    }
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();

    const pName = customPartName.trim();
    if (!pName) {
      alert('Please enter or select a part name.');
      return;
    }

    const qty = Number(purchaseQty) || 1;
    const cost = Number(unitCost) || 0;
    const total = qty * cost;

    const purchaseItem: PartPurchase = {
      id: Date.now(),
      partId: selectedPartId ? Number(selectedPartId) : undefined,
      partName: pName,
      supplierName: supplierName.trim() || 'Local Market',
      quantity: qty,
      unitCost: cost,
      totalCost: total,
      date: todayStr,
      invoiceNo: invoiceNo.trim(),
    };

    // Auto-update or insert into inventory
    let targetPart = selectedPartId
      ? inventory.find((p) => p.id === Number(selectedPartId))
      : inventory.find((p) => p.partName.toLowerCase() === pName.toLowerCase());

    if (targetPart) {
      targetPart.quantity += qty;
      targetPart.purchasePrice = cost;
      await putRecord('inventory', targetPart);
    } else {
      const newPart: SparePart = {
        id: Date.now() + 1,
        partName: pName,
        models: 'Universal / Various',
        purchasePrice: cost,
        retailPrice: Math.round(cost * 1.4),
        quantity: qty,
        minAlert: 2,
        supplierName: supplierName.trim(),
      };
      await putRecord('inventory', newPart);
    }

    await putRecord('purchases', purchaseItem);
    await logActivity('PART_PURCHASE', `Purchased ${qty}x ${pName} from ${supplierName || 'Market'}`);

    // Reset Form
    setSelectedPartId('');
    setCustomPartName('');
    setSupplierName('');
    setInvoiceNo('');
    onRefresh();
    alert('Purchase recorded and inventory stock increased successfully!');
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!salePartId) {
      alert('Please select a spare part to sell.');
      return;
    }

    const part = inventory.find((p) => p.id === Number(salePartId));
    if (!part) return;

    const qty = Number(saleQty) || 1;
    if (part.quantity < qty) {
      alert(`Insufficient stock! Only ${part.quantity} units available.`);
      return;
    }

    const price = Number(unitPrice) || 0;
    const total = qty * price;

    const saleItem: PartSale = {
      id: Date.now(),
      partId: part.id,
      partName: part.partName,
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim(),
      quantity: qty,
      unitPrice: price,
      totalAmount: total,
      date: todayStr,
    };

    // Auto-deduct inventory
    part.quantity -= qty;
    await putRecord('inventory', part);
    await putRecord('sales', saleItem);
    await logActivity('PART_SALE', `Sold ${qty}x ${part.partName} to ${customerName || 'Walk-in'}`);

    // Reset
    setSalePartId('');
    setCustomerName('');
    setCustomerPhone('');
    onRefresh();
    alert('Sale recorded and inventory stock deducted successfully!');
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          {mode === 'purchase' ? (
            <>
              <ArrowDownLeft className="w-5 h-5 text-orange-400" />
              <span>Parts Purchase Records & Stock Inward</span>
            </>
          ) : (
            <>
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
              <span>Parts & Accessories Walk-In Sales (POS)</span>
            </>
          )}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {mode === 'purchase'
            ? 'Record parts purchased from vendors. Automatically increments inventory stock levels.'
            : 'Sell accessories, batteries, displays directly. Automatically deducts inventory stock.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Entry Form */}
        <div className="glass-panel p-5 rounded-2xl">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#d4af37]" />
            <span>{mode === 'purchase' ? 'Record New Parts Purchase' : 'New Accessory / Part Sale'}</span>
          </h3>

          {mode === 'purchase' ? (
            <form onSubmit={handleSavePurchase} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Select Existing Part (Or type new below)
                </label>
                <select
                  value={selectedPartId}
                  onChange={(e) => handlePartSelectForPurchase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="">-- Choose Existing Part --</option>
                  {inventory.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.partName} ({p.models}) - Hand: {p.quantity}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Part Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Type-C Charging Flex"
                  value={customPartName}
                  onChange={(e) => setCustomPartName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Supplier / Vendor Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Plaza Traders, Multan / Lahore"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Quantity Purchased *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Cost Per Unit (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={unitCost}
                    onChange={(e) => setUnitCost(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#030b1e] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Purchase Expense:</span>
                <span className="font-mono font-bold text-orange-400">
                  PKR {((purchaseQty || 0) * (unitCost || 0)).toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition shadow"
              >
                Save Purchase & Increase Stock
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveSale} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">
                  Select Spare Part / Accessory *
                </label>
                <select
                  required
                  value={salePartId}
                  onChange={(e) => handlePartSelectForSale(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="">-- Choose Stock Item --</option>
                  {inventory
                    .filter((p) => p.quantity > 0)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.partName} ({p.models}) - Avail: {p.quantity} - PKR {p.retailPrice}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    placeholder="Walk-in Customer"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="03XXXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Quantity Sold *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={saleQty}
                    onChange={(e) => setSaleQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Selling Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-emerald-400 font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-[#030b1e] rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Sale Amount:</span>
                <span className="font-mono font-bold text-emerald-400">
                  PKR {((saleQty || 0) * (unitPrice || 0)).toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow"
              >
                Complete Sale & Deduct Stock
              </button>
            </form>
          )}
        </div>

        {/* History Table */}
        <div className="glass-panel p-5 rounded-2xl lg:col-span-2 overflow-hidden flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
            {mode === 'purchase' ? 'Recent Parts Purchase Records' : 'Recent Parts & Accessories Sales'}
          </h3>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                {mode === 'purchase' ? (
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Part Name</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total Cost</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Part / Item</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-800">
                {mode === 'purchase' ? (
                  purchases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        No purchase records yet.
                      </td>
                    </tr>
                  ) : (
                    purchases
                      .slice()
                      .reverse()
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-[#030b1e]/50">
                          <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                            {p.date}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">{p.partName}</td>
                          <td className="py-2.5 px-3 text-slate-300">{p.supplierName}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-orange-400">
                            +{p.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                            PKR {p.totalCost.toLocaleString()}
                          </td>
                        </tr>
                      ))
                  )
                ) : sales.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      No sales records yet.
                    </td>
                  </tr>
                ) : (
                  sales
                    .slice()
                    .reverse()
                    .map((s) => (
                      <tr key={s.id} className="hover:bg-[#030b1e]/50">
                        <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                          {s.date}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">{s.partName}</td>
                        <td className="py-2.5 px-3 text-slate-300">{s.customerName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                          {s.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                          PKR {s.totalAmount.toLocaleString()}
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
