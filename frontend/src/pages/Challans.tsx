import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { SalesChallan, Customer, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Eye,
  CheckCircle,
  Printer,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const Challans: React.FC = () => {
  const { hasRole } = useAuth();
  const canCreate = hasRole(['ADMIN', 'SALES']);
  const canConfirm = hasRole(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']);

  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Auxiliary lookup data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);

  // Form State for Create Challan
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanStatus, setChallanStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');
  const [lineItems, setLineItems] = useState<{ productId: string; quantity: number }[]>([
    { productId: '', quantity: 1 },
  ]);

  const [createError, setCreateError] = useState<string | null>(null);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/challans?${params.toString()}`);
      if (res.data.success) {
        setChallans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch challans', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        api.get('/customers?limit=100'),
        api.get('/products?limit=100'),
      ]);
      if (cRes.data.success) setCustomers(cRes.data.data);
      if (pRes.data.success) setProducts(pRes.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    fetchLookupData();
    setSelectedCustomerId('');
    setChallanStatus('DRAFT');
    setLineItems([{ productId: '', quantity: 1 }]);
    setCreateError(null);
    setIsCreateModalOpen(true);
  };

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!selectedCustomerId) {
      setCreateError('Please select a customer.');
      return;
    }

    const validItems = lineItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setCreateError('Please add at least one valid product line item.');
      return;
    }

    try {
      const res = await api.post('/challans', {
        customerId: selectedCustomerId,
        status: challanStatus,
        items: validItems,
      });

      if (res.data.success) {
        setIsCreateModalOpen(false);
        fetchChallans();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create sales challan';
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        setCreateError(`${msg}: ${errors.join(' | ')}`);
      } else {
        setCreateError(msg);
      }
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'CONFIRMED' | 'CANCELLED') => {
    try {
      const res = await api.patch(`/challans/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchChallans();
        if (selectedChallan?.id === id) {
          setSelectedChallan(res.data.data);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate live preview totals for create modal
  const productMap = new Map(products.map((p) => [p.id, p]));
  let previewTotalQty = 0;
  let previewTotalAmount = 0;

  lineItems.forEach((item) => {
    if (item.productId) {
      const p = productMap.get(item.productId);
      if (p) {
        previewTotalQty += item.quantity;
        previewTotalAmount += p.unitPrice * item.quantity;
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            Sales Challan & Dispatch Operations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Generate sales challans, verify stock levels, and issue invoices</p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Challan</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by challan #, customer name, business..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft Only</option>
            <option value="CONFIRMED">Confirmed Only</option>
            <option value="CANCELLED">Cancelled Only</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Challan #</th>
                <th className="p-4">Customer & Business</th>
                <th className="p-4">Total Qty</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading sales challans...
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No sales challans found.
                  </td>
                </tr>
              ) : (
                challans.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-400 text-sm">{ch.challanNumber}</td>
                    <td className="p-4 font-medium">
                      <div className="font-bold text-slate-100 text-sm">{ch.customerName}</div>
                      <div className="text-slate-400 text-xs">{ch.customerBusinessName || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-300">{ch.totalQuantity} Units</td>
                    <td className="p-4 font-bold text-slate-100 text-sm">₹{ch.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <span
                        className={`font-bold text-[10px] uppercase px-2.5 py-1 rounded-full border ${
                          ch.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : ch.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {ch.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {new Date(ch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedChallan(ch);
                            setIsDetailModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Challan Details & Print Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {ch.status === 'DRAFT' && canConfirm && (
                          <button
                            onClick={() => handleUpdateStatus(ch.id, 'CONFIRMED')}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-colors flex items-center gap-1"
                            title="Confirm Challan and Deduct Stock"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Confirm & Deduct Stock</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE SALES CHALLAN MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Sales Challan"
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Select Customer *</label>
              <select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500 font-semibold"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.customerName} ({c.businessName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Initial Status *</label>
              <select
                value={challanStatus}
                onChange={(e) => setChallanStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500 font-bold"
              >
                <option value="DRAFT">Save as Draft (No stock deduction yet)</option>
                <option value="CONFIRMED">Confirm Immediately (Validate & deduct stock now)</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-200 text-sm">Challan Line Items</h4>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold text-[11px] rounded-lg flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const selectedProd = productMap.get(item.productId);
                const isStockInsufficient =
                  challanStatus === 'CONFIRMED' &&
                  selectedProd &&
                  selectedProd.currentStock < item.quantity;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl grid grid-cols-12 gap-3 items-center"
                  >
                    <div className="col-span-6">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">Product</label>
                      <select
                        required
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-medium"
                      >
                        <option value="">-- Choose Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (SKU: {p.sku} | Stock: {p.currentStock} | ₹{p.unitPrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono font-bold"
                      />
                    </div>

                    <div className="col-span-3 text-right">
                      <label className="block text-[10px] text-slate-500 font-semibold mb-1">Subtotal</label>
                      <span className="font-bold text-white text-sm">
                        ₹
                        {selectedProd
                          ? (selectedProd.unitPrice * item.quantity).toLocaleString('en-IN')
                          : '0'}
                      </span>
                      {isStockInsufficient && (
                        <p className="text-[10px] text-rose-400 font-semibold mt-0.5">
                          Out of stock! ({selectedProd.currentStock} left)
                        </p>
                      )}
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        disabled={lineItems.length === 1}
                        className="p-1.5 text-slate-500 hover:text-rose-400 disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Calculation Bar */}
            <div className="mt-4 p-3 bg-blue-950/40 border border-blue-500/20 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Total Quantity: <strong className="text-white">{previewTotalQty} Units</strong>
              </span>
              <span className="text-sm font-extrabold text-blue-400">
                Grand Total Amount: ₹{previewTotalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25"
            >
              Generate Challan ({challanStatus})
            </button>
          </div>
        </form>
      </Modal>

      {/* CHALLAN DETAIL & PRINTABLE INVOICE MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Sales Challan / Invoice: ${selectedChallan?.challanNumber || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedChallan && (
          <div>
            <div className="flex justify-end mb-4 gap-3">
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              {selectedChallan.status === 'DRAFT' && canConfirm && (
                <button
                  onClick={() => handleUpdateStatus(selectedChallan.id, 'CONFIRMED')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm & Deduct Stock</span>
                </button>
              )}
            </div>

            {/* Printable Document Area */}
            <div id="printable-challan" className="p-6 bg-slate-950 border border-slate-800 rounded-2xl space-y-6 text-slate-200">
              {/* Invoice Header */}
              <div className="flex justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-extrabold text-white">NEXUS WHOLESALE DISTRIBUTORS</h2>
                  <p className="text-xs text-slate-400">Industrial Goods & Supply Portal</p>
                  <p className="text-xs text-slate-400 mt-1">GSTIN: 27AABCU9603R1ZM | Phone: +91 22 8899 0011</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-blue-400">{selectedChallan.challanNumber}</span>
                  <p className="text-xs text-slate-400 mt-1">Date: {new Date(selectedChallan.createdAt).toLocaleDateString()}</p>
                  <span
                    className={`inline-block mt-2 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full border ${
                      selectedChallan.status === 'CONFIRMED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    Status: {selectedChallan.status}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">Billed To Customer:</h4>
                  <p className="font-bold text-slate-100">{selectedChallan.customerName}</p>
                  <p className="text-slate-300">{selectedChallan.customerBusinessName}</p>
                  <p className="text-slate-400 mt-1">{selectedChallan.customer?.address}</p>
                  <p className="text-slate-400">{selectedChallan.customer?.mobileNumber} | {selectedChallan.customer?.email}</p>
                </div>
                <div className="text-right">
                  <h4 className="text-[10px] uppercase font-bold text-slate-500 mb-1">Issued By:</h4>
                  <p className="font-semibold text-slate-200">{selectedChallan.createdByName}</p>
                  <p className="text-slate-400">Authorized Logistics Representative</p>
                </div>
              </div>

              {/* Items Table Snapshot */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase font-semibold">
                    <th className="p-3">#</th>
                    <th className="p-3">Product Snapshot</th>
                    <th className="p-3">SKU</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedChallan.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-3 text-slate-500">{idx + 1}</td>
                      <td className="p-3 font-semibold text-slate-100">{item.productNameSnapshot}</td>
                      <td className="p-3 font-mono text-slate-400">{item.productSkuSnapshot}</td>
                      <td className="p-3 text-right">₹{item.unitPriceSnapshot.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right font-mono font-bold">{item.quantity}</td>
                      <td className="p-3 text-right font-bold text-slate-100">₹{item.subtotal.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Summary */}
              <div className="flex justify-end pt-4 border-t border-slate-800 text-xs">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Quantity:</span>
                    <span className="font-mono font-bold text-slate-200">{selectedChallan.totalQuantity} Units</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Grand Total:</span>
                    <span className="text-blue-400">₹{selectedChallan.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
