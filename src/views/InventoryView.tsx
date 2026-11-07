import React, { useState } from 'react';
import { SparePart } from '../types';
import { putRecord, deleteRecord, logActivity } from '../services/db';
import {
  Boxes,
  Plus,
  Search,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Edit2,
  Trash2,
  X,
  Tag,
} from 'lucide-react';

interface InventoryViewProps {
  inventory: SparePart[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  inventory,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  // Form State
  const [partName, setPartName] = useState('');
  const [models, setModels] = useState('');
  const [purchasePrice, setPurchasePrice] = useState<number>(1000);
  const [wholesalePrice, setWholesalePrice] = useState<number>(1300);
  const [retailPrice, setRetailPrice] = useState<number>(1800);
  const [quantity, setQuantity] = useState<number>(5);
  const [minAlert, setMinAlert] = useState<number>(2);
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');

  // Computations
  const totalItemsCount = inventory.length;
  const totalStockQuantity = inventory.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
  const totalStockCostValue = inventory.reduce(
    (sum, p) => sum + Number(p.purchasePrice || 0) * Number(p.quantity || 0),
    0
  );
  const totalStockRetailValue = inventory.reduce(
    (sum, p) => sum + Number(p.retailPrice || 0) * Number(p.quantity || 0),
    0
  );
  const potentialGrossProfit = totalStockRetailValue - totalStockCostValue;
  const lowStockCount = inventory.filter((p) => p.quantity <= (p.minAlert || 2)).length;

  const filteredInventory = inventory.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.partName.toLowerCase().includes(q) ||
      p.models.toLowerCase().includes(q) ||
      (p.supplierName && p.supplierName.toLowerCase().includes(q));

    const matchesLowStock = filterLowStock ? p.quantity <= (p.minAlert || 2) : true;
    return matchesSearch && matchesLowStock;
  });

  const handleOpenAddModal = () => {
    setPartName('');
    setModels('');
    setPurchasePrice(1000);
    setWholesalePrice(1300);
    setRetailPrice(1800);
    setQuantity(5);
    setMinAlert(2);
    setSupplierName('');
    setSupplierContact('');
    setEditingPart(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (p: SparePart) => {
    setPartName(p.partName);
    setModels(p.models);
    setPurchasePrice(p.purchasePrice);
    setWholesalePrice(p.wholesalePrice || p.purchasePrice);
    setRetailPrice(p.retailPrice);
    setQuantity(p.quantity);
    setMinAlert(p.minAlert || 2);
    setSupplierName(p.supplierName || '');
    setSupplierContact(p.supplierContact || '');
    setEditingPart(p);
    setShowModal(true);
  };

  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!partName.trim() || !models.trim()) {
      alert('Please fill Part Name and Compatible Models.');
      return;
    }

    const newPart: SparePart = {
      id: editingPart ? editingPart.id : Date.now(),
      partName: partName.trim(),
      models: models.trim(),
      purchasePrice: Number(purchasePrice) || 0,
      wholesalePrice: Number(wholesalePrice) || Number(purchasePrice) || 0,
      retailPrice: Number(retailPrice) || 0,
      quantity: Number(quantity) || 0,
      minAlert: Number(minAlert) || 2,
      supplierName: supplierName.trim(),
      supplierContact: supplierContact.trim(),
    };

    await putRecord('inventory', newPart);
    await logActivity('SAVE_SPARE_PART', `Saved part ${newPart.partName} (Qty: ${newPart.quantity})`);

    setShowModal(false);
    onRefresh();
  };

  const handleDeletePart = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name} from stock?`)) {
      await deleteRecord('inventory', id);
      await logActivity('DELETE_SPARE_PART', `Deleted part ${name}`);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#d4af37]" />
            <span>Spare Parts Inventory & Stock Valuation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Managed by Mian Jamshed Qureshi (Accessories & Parts Manager)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-60">
            <input
              type="text"
              placeholder="Search part name, model, supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#0a192f] border border-slate-700 text-xs text-white focus:border-[#d4af37] focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
              filterLowStock
                ? 'bg-rose-900/60 text-rose-300 border border-rose-500'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Stock ({lowStockCount})</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-amber-500 hover:opacity-90 text-slate-950 font-bold text-xs flex items-center gap-2 shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Spare Part</span>
          </button>
        </div>
      </div>

      {/* 4 Financial Valuation Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-blue-500">
          <p className="text-xs text-slate-400">Total Unique Items</p>
          <p className="text-2xl font-black text-white mt-1">{totalItemsCount}</p>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{totalStockQuantity} total units</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500">
          <p className="text-xs text-slate-400">Stock Cost Value</p>
          <p className="text-2xl font-black text-amber-400 font-mono mt-1">
            PKR {totalStockCostValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Purchased capital invested</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500">
          <p className="text-xs text-slate-400">Stock Retail Value</p>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            PKR {totalStockRetailValue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Expected selling value</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-[#d4af37]">
          <p className="text-xs text-slate-400">Potential Gross Profit</p>
          <p className="text-2xl font-black text-[#d4af37] font-mono mt-1">
            PKR {potentialGrossProfit.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Projected stock margins</p>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#030b1e] text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Part Code</th>
                <th className="py-3 px-4">Part Name</th>
                <th className="py-3 px-4">Compatible Models</th>
                <th className="py-3 px-4">Cost (PKR)</th>
                <th className="py-3 px-4">Retail (PKR)</th>
                <th className="py-3 px-4">Margin</th>
                <th className="py-3 px-4">Qty in Hand</th>
                <th className="py-3 px-4">Stock Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No spare parts found. Click 'Add Spare Part' to register items.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((part) => {
                  const isLow = part.quantity <= (part.minAlert || 2);
                  const margin = part.retailPrice - part.purchasePrice;
                  return (
                    <tr key={part.id} className="hover:bg-[#030b1e]/70 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        PRT-{part.id}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-white">{part.partName}</p>
                        {part.supplierName && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            Supplier: {part.supplierName}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-200">{part.models}</td>
                      <td className="py-3 px-4 font-mono">
                        PKR {part.purchasePrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        PKR {part.retailPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400">
                        +PKR {margin.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-extrabold text-sm">
                        <span className={isLow ? 'text-rose-400' : 'text-emerald-400'}>
                          {part.quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLow
                              ? 'bg-rose-900/40 text-rose-300 border-rose-500'
                              : 'bg-emerald-900/40 text-emerald-300 border-emerald-500'
                          }`}
                        >
                          {isLow ? `Low Stock (<= ${part.minAlert})` : 'In Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(part)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-[#0353a4] text-slate-300 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePart(part.id, part.partName)}
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

      {/* ADD / EDIT SPARE PART MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#d4af37]" />
                <span>{editingPart ? 'Edit Spare Part' : 'Add New Spare Part'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OLED Display Assembly"
                    value={partName}
                    onChange={(e) => setPartName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Compatible Phone Models *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Redmi Note 11 / 12"
                    value={models}
                    onChange={(e) => setModels(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Cost Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Wholesale (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Retail Price (PKR) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-emerald-400 font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Quantity In Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono font-bold focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Min Alert Threshold
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={minAlert}
                    onChange={(e) => setMinAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-amber-400 font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Supplier Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lahore Parts Plaza"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">
                    Supplier Phone
                  </label>
                  <input
                    type="text"
                    placeholder="03XXXXXXXXX"
                    value={supplierContact}
                    onChange={(e) => setSupplierContact(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#030b1e] border border-slate-700 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d4af37] hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
