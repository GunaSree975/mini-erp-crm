import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Lock, Mail, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    const roleCredentials: Record<UserRole, { email: string; pass: string }> = {
      ADMIN: { email: 'admin@company.com', pass: 'Admin123!' },
      SALES: { email: 'sales@company.com', pass: 'Sales123!' },
      WAREHOUSE: { email: 'warehouse@company.com', pass: 'Warehouse123!' },
      ACCOUNTS: { email: 'accounts@company.com', pass: 'Accounts123!' },
    };

    const creds = roleCredentials[role];
    setEmail(creds.email);
    setPassword(creds.pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center font-extrabold text-white text-2xl mx-auto shadow-xl shadow-blue-500/25 mb-4">
            N
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Nexus ERP + CRM Portal</h2>
          <p className="text-sm text-slate-400 mt-1">Wholesale & Operations Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400 text-sm font-medium">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all text-sm disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>
        </form>

        {/* Preset Role Quick-Fill Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Evaluation Quick Logins (1-Click Fill):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('ADMIN')}
              className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors"
            >
              <span>Admin Role</span>
              <UserCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('SALES')}
              className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors"
            >
              <span>Sales Role</span>
              <UserCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('WAREHOUSE')}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors"
            >
              <span>Warehouse Role</span>
              <UserCheck className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('ACCOUNTS')}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center justify-between transition-colors"
            >
              <span>Accounts Role</span>
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
