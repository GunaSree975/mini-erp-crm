import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Eye,
  MessageSquarePlus,
  Phone,
  Mail,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { hasRole } = useAuth();
  const canEdit = hasRole(['ADMIN', 'SALES']);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'WHOLESALE' as CustomerType,
    address: '',
    status: 'LEAD' as CustomerStatus,
    followUpDate: '',
    notes: '',
  });

  // Follow-up Note Form State
  const [newNote, setNewNote] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('customerType', typeFilter);

      const res = await api.get(`/customers?${params.toString()}`);
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const handleOpenAdd = () => {
    setFormData({
      customerName: '',
      mobileNumber: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'WHOLESALE',
      address: '',
      status: 'LEAD',
      followUpDate: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      mobileNumber: customer.mobileNumber,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber || '',
      customerType: customer.customerType,
      address: customer.address,
      status: customer.status,
      followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '',
      notes: customer.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDetail = async (customer: Customer) => {
    try {
      const res = await api.get(`/customers/${customer.id}`);
      if (res.data.success) {
        setSelectedCustomer(res.data.data);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', formData);
      if (res.data.success) {
        setIsAddModalOpen(false);
        fetchCustomers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create customer');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const res = await api.put(`/customers/${selectedCustomer.id}`, formData);
      if (res.data.success) {
        setIsEditModalOpen(false);
        fetchCustomers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update customer');
    }
  };

  const handleAddFollowUpNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !newNote.trim()) return;
    try {
      const res = await api.post(`/customers/${selectedCustomer.id}/follow-ups`, { note: newNote });
      if (res.data.success) {
        setNewNote('');
        handleOpenDetail(selectedCustomer); // refresh drawer
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add note');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Customer CRM Directory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage customer accounts, leads, and follow-up history</p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Customer</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, business, email, GST..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="LEAD">Leads</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="RETAIL">Retail</option>
            <option value="WHOLESALE">Wholesale</option>
            <option value="DISTRIBUTOR">Distributor</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Customer & Business</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Follow-up Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-medium">
                      <div className="font-bold text-slate-100 text-sm">{c.customerName}</div>
                      <div className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        {c.businessName} {c.gstNumber && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">GST: {c.gstNumber}</span>}
                      </div>
                    </td>
                    <td className="p-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Phone className="w-3 h-3 text-blue-400" />
                        <span>{c.mobileNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{c.email}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md text-[11px]">
                        {c.customerType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`font-bold text-[10px] uppercase px-2.5 py-1 rounded-full border ${
                          c.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : c.status === 'LEAD'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-400">
                      {c.followUpDate ? (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(c.followUpDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-slate-600">None set</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Customer Details & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
                            title="Edit Customer"
                          >
                            <Edit2 className="w-4 h-4" />
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

      {/* ADD / EDIT CUSTOMER MODAL */}
      <Modal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
        }}
        title={isAddModalOpen ? 'Create New Customer Account' : 'Edit Customer Account'}
      >
        <form onSubmit={isAddModalOpen ? handleCreateSubmit : handleUpdateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="e.g. Rajesh Sharma"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Business Name *</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Apex Hardware Pvt Ltd"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@company.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">GST Number (Optional)</label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Customer Type *</label>
              <select
                value={formData.customerType}
                onChange={(e) => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              >
                <option value="RETAIL">Retail</option>
                <option value="WHOLESALE">Wholesale</option>
                <option value="DISTRIBUTOR">Distributor</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              >
                <option value="LEAD">Lead</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 uppercase mb-1">Follow-up Date</label>
              <input
                type="date"
                value={formData.followUpDate}
                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">Full Billing & Delivery Address *</label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full street address, city, state, pincode..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 uppercase mb-1">Internal Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Background notes, credit limits, preferences..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500"
            />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25"
            >
              {isAddModalOpen ? 'Save Customer' : 'Update Customer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CUSTOMER DETAIL & FOLLOW-UP DRAWER MODAL */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Customer CRM Profile: ${selectedCustomer?.customerName || ''}`}
        maxWidth="max-w-3xl"
      >
        {selectedCustomer && (
          <div className="space-y-6 text-xs">
            {/* Info Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Business Name</span>
                <span className="font-bold text-white text-sm">{selectedCustomer.businessName}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">GST Number</span>
                <span className="font-mono text-slate-200">{selectedCustomer.gstNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Customer Type</span>
                <span className="font-bold text-blue-400">{selectedCustomer.customerType}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Mobile</span>
                <span className="text-slate-200">{selectedCustomer.mobileNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Email</span>
                <span className="text-slate-200">{selectedCustomer.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Status</span>
                <span className="font-bold text-emerald-400">{selectedCustomer.status}</span>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="text-slate-500 block uppercase font-semibold text-[10px]">Address</span>
                <span className="text-slate-300">{selectedCustomer.address}</span>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div>
              <h4 className="font-bold text-slate-200 text-sm mb-3 flex items-center gap-2">
                <MessageSquarePlus className="w-4 h-4 text-blue-400" />
                CRM Follow-up Timeline & Notes
              </h4>

              {canEdit && (
                <form onSubmit={handleAddFollowUpNote} className="mb-4 flex gap-2">
                  <input
                    type="text"
                    required
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Log a new phone call note, meeting summary, or follow-up update..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-blue-500 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shrink-0"
                  >
                    Add Note
                  </button>
                </form>
              )}

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {selectedCustomer.followUps && selectedCustomer.followUps.length > 0 ? (
                  selectedCustomer.followUps.map((n) => (
                    <div key={n.id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-semibold text-blue-400">{n.createdByName}</span>
                        <span>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200 text-xs">{n.note}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-xs italic">No follow-up notes logged yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
