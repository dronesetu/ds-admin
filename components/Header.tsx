'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Activity, ShieldCheck, Heart } from 'lucide-react';
import { api } from '../utils/api';

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  // Map path to friendly title
  const getPageTitle = () => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'System Overview';
    
    const lastSegment = segments[segments.length - 1];
    
    // Capitalize and format
    return lastSegment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Fetch alerts from backend dashboard endpoint
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const response = await api.get<any>('/admin/dashboard');
        if (response.success && response.data?.alertQueue) {
          setAlerts(response.data.alertQueue);
        }
      } catch (err) {
        console.error('Failed to fetch notifications/alerts in header:', err);
      }
    }

    if (user) {
      fetchAlerts();
    }
  }, [user]);

  return (
    <header className="h-16 border-b border-zinc-800 bg-zinc-950/70 backdrop-blur-md px-6 flex items-center justify-between font-sans sticky top-0 z-40">
      {/* Title */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
          {getPageTitle()}
        </h2>
      </div>

      {/* Utilities */}
      <div className="flex items-center gap-6">
        {/* System Status Tracker */}
        <div className="flex items-center gap-2 rounded-full bg-zinc-900/60 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400">
          <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          <span className="font-semibold text-zinc-300">Live Gateway Connected</span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button 
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative rounded-xl border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-zinc-50">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Dropdown */}
          {showAlerts && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowAlerts(false)} 
              />
              <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl backdrop-blur-md z-50 animate-scale-up">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">
                  Critical Alerts ({alerts.length})
                </h4>
                {alerts.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-2">No active warnings in console</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`rounded-xl p-3 border text-xs ${
                          alert.level === 'danger'
                            ? 'bg-red-500/10 border-red-500/20 text-red-400'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                        }`}
                      >
                        <p className="font-semibold capitalize mb-0.5">{alert.level} Warning</p>
                        <p className="text-zinc-300 leading-normal">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 border-l border-zinc-800 pl-6">
          <img
            src={user?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'}
            alt="User avatar"
            className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
          />
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-zinc-200">{user?.fullName}</p>
            <span className="inline-flex items-center gap-1 rounded bg-zinc-900 border border-zinc-850 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              {user?.role === 'super_admin' ? 'Super Admin' : 'Staff Admin'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
