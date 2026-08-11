import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Product, StockMovement, MovementType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Package,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Boxes,
  Warehouse,
} from 'lucide-react';

export const Products: React.FC = () => {
  const { hasRole } = useAuth();
  const canManage = hasRole(['ADMIN', 'WAREHOUSE']);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Stock Movement Log Drawer State
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isMovementsOpen, setIsMovementsOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form State for Add / Edit Product
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Fasteners',
    unitPrice: 100,
    currentStock: 0,
    minStockAlertInt: 5,
    locationWarehouse: 'Warehouse A - Rack 01',
  });

  // Form State for Stock Adjustment (IN / OUT)
  const [stockForm, setStockForm] = useState({
    quantityChanged: 1,
    movementType: 'IN' as MovementType,
    reason: 'New Stock Arrival',
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (lowStockOnly) params.append('lowStock', 'true');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockMovements = async () => {
    try {
      const res = await api.get('/products/movements/log');
      if (res.data.success) {
        setMovements(res.data.data);
        setIsMovementsOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockOnly]);

  const handleOpenAdd = () => {
    setProductForm({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Fasteners',
      unitPrice: 250,
      currentStock: 50,
      minStockAlertInt: 10,
      locationWarehouse: 'Warehouse A - Shelf 01',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice,
      currentStock: product.currentStock,
      minStockAlertInt: product.minStockAlertInt,
      locationWarehouse: product.locationWarehouse,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenStockModal = (product: Product) => {
    setSelectedProduct(product);
    setStockForm({
      quantityChanged: 5,
      movementType: 'IN',
      reason: 'Purchase Delivery Arrival',
    });
    setIsStockModalOpen(true);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/products', productForm);
      if (res.data.success) {
        setIsAddModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await api.put(`/products/${selectedProduct.id}`, productForm);
      if (res.data.success) {
        setIsEditModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update product');
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await api.post(`/products/${selectedProduct.id}/stock-movement`, stockForm);
      if (res.data.success) {
        setIsStockModalOpen(false);
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to record stock movement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            Product Catalog & Inventory Control
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage stock levels, minimum alerts, and movement logs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStockMovements}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all"
          >
            <History className="w-4 h-4 text-amber-400" />
            <span>Stock Movement Logs</span>
          </button>

          {canManage && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, warehouse location..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              lowStockOnly
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Stock Alert Only</span>
          </button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">All Categories</option>
            <option value="Fasteners">Fasteners</option>
            <option value="Power Tools">Power Tools</option>
            <option value="Safety Equipment">Safety Equipment</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">SKU & Product Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Warehouse Location</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading inventory products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.currentStock <= p.minStockAlertInt;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-medium">
                        <div className="font-bold text-slate-100 text-sm flex items-center gap-2">
                          {p.name}
                          {isLowStock && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock ({p.currentStock})
                            </span>
                          )}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">SKU: {p.sku}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-100 text-sm">
                        ₹{p.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono text-base font-extrabold ${
                              isLowStock ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            {p.currentStock}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            (Alert at &le; {p.minStockAlertInt})
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-slate-500" />
                        <span>{p.locationWarehouse}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canManage && (
                            <>
                              <button
                                onClick={() => handleOpenStockModal(p)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="Record Stock IN / OUT"
                              >
                                <Boxes className="w-3.5 h-3.5" />
                                <span>Adjust Stock</span>
                              </button>
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                                title="Edit Product Specs"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
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

      {/* ADD / EDIT PRODUCT MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Add New Product to Inventory' : 'Edit Product Details'}
      >
        <form onSubmit={isAddModalOpen ? handleCreateProduct : handleUpdateProduct} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="e.g. M12 Stainless Steel Bolts"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                placeholder="e.g. SKU-BOLT-M12"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Category *</label>
              <input
                type="text"
                required
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                placeholder="e.g. Fasteners, Tools"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={productForm.unitPrice}
                onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 font-bold"
              />
            </div>

            {isAddModalOpen && (
              <div>
                <label className="block font-semibold text-slate-300 uppercase mb-1">Initial Opening Stock *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={productForm.currentStock}
                  onChange={(e) => setProductForm({ ...productForm, currentStock: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 font-bold"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Minimum Stock Alert Qty *</label>
              <input
                type="number"
                min="0"
                required
                value={productForm.minStockAlertInt}
                onChange={(e) => setProductForm({ ...productForm, minStockAlertInt: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold text-slate-300 uppercase mb-1">Location / Warehouse Bin *</label>
              <input
                type="text"
                required
                value={productForm.locationWarehouse}
                onChange={(e) => setProductForm({ ...productForm, locationWarehouse: e.target.value })}
                placeholder="e.g. Warehouse A - Rack 04, Shelf B"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setIsEditModalOpen(false);
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
            >
              {isAddModalOpen ? 'Save Product' : 'Update Specs'}
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK ADJUSTMENT (IN/OUT) MODAL */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Record Stock Movement: ${selectedProduct?.name || ''}`}
      >
        <form onSubmit={handleStockAdjustment} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">SKU: {selectedProduct?.sku}</span>
              <span className="font-bold text-slate-200">{selectedProduct?.name}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block uppercase font-semibold text-[10px]">Current Available</span>
              <span className="font-mono text-lg font-bold text-emerald-400">{selectedProduct?.currentStock}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Movement Type *</label>
              <select
                value={stockForm.movementType}
                onChange={(e) => setStockForm({ ...stockForm, movementType: e.target.value as MovementType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 font-bold"
              >
                <option value="IN">IN (+ Add Stock Received)</option>
                <option value="OUT">OUT (- Remove / Dispatched Stock)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Quantity Changed *</label>
              <input
                type="number"
                min="1"
                required
                value={stockForm.quantityChanged}
                onChange={(e) => setStockForm({ ...stockForm, quantityChanged: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500 font-mono text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">Reason / Reference *</label>
            <input
              type="text"
              required
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
              placeholder="e.g. PO Arrival #9004, Damaged stock write-off, Manual count sync"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
            >
              Submit Movement Log
            </button>
          </div>
        </form>
      </Modal>

      {/* STOCK MOVEMENTS LOG DRAWER MODAL */}
      <Modal
        isOpen={isMovementsOpen}
        onClose={() => setIsMovementsOpen(false)}
        title="Comprehensive Stock Movement Audit Log"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto">
          {movements.map((m) => (
            <div
              key={m.id}
              className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    m.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {m.movementType === 'IN' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-bold text-slate-100 text-sm">{m.product?.name || 'Product'}</div>
                  <div className="text-slate-400 text-[11px] font-mono">
                    SKU: {m.product?.sku} &bull; Reason: {m.reason}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`font-mono text-base font-bold ${
                    m.movementType === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`}
                </span>
                <div className="text-slate-500 text-[10px]">{m.createdByName} &bull; {new Date(m.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};
