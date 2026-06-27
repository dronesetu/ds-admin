'use client';

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ShieldAlert, CheckCircle, Orbit } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, error: authError, clearError } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      // Error is handled by context, but we reset submission state
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (role: 'super' | 'staff') => {
    setFormError(null);
    clearError();
    if (role === 'super') {
      setEmail('superadmin@dronesetuseed.com');
      setPassword('Password123');
    } else {
      setEmail('adminstaff@dronesetuseed.com');
      setPassword('Password123');
    }
  };

  const errorMsg = formError || authError;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 font-sans relative overflow-hidden">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-2 text-emerald-400 mb-4 shadow-xl shadow-emerald-950/10">
            <Orbit className="h-8 w-8 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Drone Setu</h1>
          <p className="mt-1.5 text-sm text-zinc-400">Administrative Operations Console</p>
        </div>

        {/* Card Panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-md">
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Authentication Failed</p>
                <p className="mt-0.5 text-xs text-red-400/90">{errorMsg}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@dronesetu.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Security Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600/50 py-3 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              ) : (
                'Access Console'
              )}
            </button>
          </form>

          {/* Quick Fills for Dev Seeding */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 border-t border-zinc-800/80 pt-6">
              <p className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-4">
                Local Development Seed Accounts
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickFill('super')}
                  className="flex flex-col items-center justify-center rounded-xl border border-zinc-850 bg-zinc-950/30 p-3 hover:bg-zinc-900/60 transition-colors group text-center"
                >
                  <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">Super Admin</span>
                  <span className="mt-1 text-[10px] text-zinc-500">Full Access Configs</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('staff')}
                  className="flex flex-col items-center justify-center rounded-xl border border-zinc-850 bg-zinc-950/30 p-3 hover:bg-zinc-900/60 transition-colors group text-center"
                >
                  <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">Admin Staff</span>
                  <span className="mt-1 text-[10px] text-zinc-500">General Operations</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
