import React from 'react';
import { LayoutDashboard, Users, Package, FileSpreadsheet, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const roleColors: Record<UserRole, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    SALES: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    WAREHOUSE: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    ACCOUNTS: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as UserRole[] },
    { id: 'customers', label: 'Customer CRM', icon: Users, roles: ['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE'] as UserRole[] },
    { id: 'products', label: 'Product Inventory', icon: Package, roles: ['ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS'] as UserRole[] },
    { id: 'challans', label: 'Sales Challans', icon: FileSpreadsheet, roles: ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'] as UserRole[] },
  ];

  const currentRoleStyle = user ? roleColors[user.role] : roleColors.ADMIN;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Logo Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/25">
            N
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-white tracking-tight">Nexus ERP</h1>
            <p className="text-xs text-slate-400 font-medium">& CRM Operations</p>
          </div>
        </div>

        {/* User Role Card */}
        {user && (
          <div className="mx-4 my-4 p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400 font-medium">Logged in as</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}>
                {user.role}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
