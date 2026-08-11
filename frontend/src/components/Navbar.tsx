import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { api } from '../api/client';
import { Sparkles } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, login } = useAuth();

  const switchRole = async (targetRole: UserRole) => {
    const roleCredentials: Record<UserRole, string> = {
      ADMIN: 'admin@company.com',
      SALES: 'sales@company.com',
      WAREHOUSE: 'warehouse@company.com',
      ACCOUNTS: 'accounts@company.com',
    };

    try {
      const email = roleCredentials[targetRole];
      const password = `${targetRole.charAt(0) + targetRole.slice(1).toLowerCase()}123!`;
      
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
      }
    } catch (err) {
      console.error('Role switch failed', err);
    }
  };

  const roles: UserRole[] = ['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS'];

  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-slate-300">Operations Control Center</span>
      </div>

      {/* Role Switcher Toolbar for Evaluation */}
      <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800">
        <div className="flex items-center gap-1.5 mr-2 text-xs font-semibold text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Switch Role Demo:</span>
        </div>
        {roles.map((r) => {
          const isActive = user?.role === r;
          return (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </header>
  );
};
