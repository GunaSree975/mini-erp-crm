import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardStats, Product, SalesChallan, StockMovement } from '../types';
import { StatCard } from '../components/StatCard';
import {
  Users,
  Package,
  FileSpreadsheet,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [recentChallans, setRecentChallans] = useState<SalesChallan[]>([]);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setLowStockAlerts(res.data.lowStockAlerts);
        setRecentChallans(res.data.recentChallans);
        setRecentMovements(res.data.recentMovements);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Low Stock Items */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-amber-300 text-sm">
                Attention Required: {lowStockAlerts.length} Product(s) Below Minimum Stock Alert Threshold!
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Items such as{' '}
                <span className="font-semibold text-white">
                  {lowStockAlerts.map((p) => p.name).join(', ')}
                </span>{' '}
                need inventory replenishment.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('products')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow-md"
          >
            Manage Inventory
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Confirmed Sales"
          value={`₹${stats?.totalConfirmedRevenue.toLocaleString('en-IN') || 0}`}
          subtitle={`${stats?.confirmedChallans || 0} Confirmed Challans`}
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Active Customers"
          value={stats?.activeCustomers || 0}
          subtitle={`${stats?.leadsCount || 0} Open Leads`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Inventory Valuation"
          value={`₹${stats?.totalInventoryValuation.toLocaleString('en-IN') || 0}`}
          subtitle={`${stats?.totalProducts || 0} Total Product SKUs`}
          icon={Package}
          color="purple"
        />
        <StatCard
          title="Total Sales Challans"
          value={stats?.totalChallans || 0}
          subtitle={`${stats?.draftChallans || 0} Drafts Pending`}
          icon={FileSpreadsheet}
          color="amber"
        />
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Challans */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              Recent Sales Challans
            </h3>
            <button
              onClick={() => setActiveTab('challans')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {recentChallans.length === 0 ? (
              <p className="text-xs text-slate-500">No recent sales challans recorded.</p>
            ) : (
              recentChallans.map((challan) => (
                <div
                  key={challan.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-200">
                        {challan.challanNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          challan.status === 'CONFIRMED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : challan.status === 'DRAFT'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {challan.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {challan.customerName} ({challan.customerBusinessName || 'N/A'})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-100">
                      ₹{challan.totalAmount.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {challan.totalQuantity} Items
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              Recent Stock Movements
            </h3>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300"
            >
              Inventory Log →
            </button>
          </div>

          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-xs text-slate-500">No recent stock movements.</p>
            ) : (
              recentMovements.map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        m.movementType === 'IN'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {m.movementType === 'IN' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        {m.product?.name || 'Product'}
                      </p>
                      <p className="text-xs text-slate-400">{m.reason}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono text-sm font-bold ${
                        m.movementType === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {m.movementType === 'IN' ? `+${m.quantityChanged}` : `-${m.quantityChanged}`}
                    </span>
                    <p className="text-[11px] text-slate-500">{m.createdByName}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
