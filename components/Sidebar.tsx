'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  AlertOctagon,
  ShieldCheck,
  UserCheck,
  Coins,
  Settings,
  History,
  LogOut,
  Orbit,
  CalendarRange,
  Eye,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';

  const commonLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/users', icon: Users },
    { name: 'Bookings Log', href: '/bookings', icon: CalendarRange },
    { name: 'Disputes Roster', href: '/disputes', icon: AlertOctagon },
  ];

  const superAdminLinks = [
    { name: 'KYC Verification', href: '/super-admin/kyc', icon: ShieldCheck },
    { name: 'Listings Verifier', href: '/super-admin/listings', icon: Eye },
    { name: 'Staff Management', href: '/super-admin/staff', icon: UserCheck },
    { name: 'Payouts & Ledger', href: '/super-admin/payouts', icon: Coins },
    { name: 'System Settings', href: '/super-admin/settings', icon: Settings },
    { name: 'Audit History Logs', href: '/super-admin/logs', icon: History },
  ];

  const checkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col shrink-0 font-sans h-screen sticky top-0">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-2 border-b border-zinc-800 px-6">
        <Orbit className="h-6 w-6 text-emerald-400 animate-spin-slow" />
        <span className="text-md font-bold tracking-tight text-zinc-100">DRONE SETU</span>
        <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] font-semibold text-emerald-400">
          Ops
        </span>
      </div>

      {/* Nav List */}
      <div className="flex flex-1 flex-col justify-between p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* General Section */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Operations
            </p>
            <nav className="mt-2 space-y-1">
              {commonLinks.map((link) => {
                const Icon = link.icon;
                const active = checkActive(link.href);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                      active
                        ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-zinc-500'}`} />
                    {link.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Super Admin Section */}
          {isSuperAdmin && (
            <div>
              <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Governance Control
              </p>
              <nav className="mt-2 space-y-1">
                {superAdminLinks.map((link) => {
                  const Icon = link.icon;
                  const active = checkActive(link.href);
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                        active
                          ? 'bg-indigo-500/10 text-indigo-400 border-l-2 border-indigo-500'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-indigo-400' : 'text-zinc-500'}`} />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer Profile Summary */}
        <div className="border-t border-zinc-900 pt-4 mt-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <img
              src={user?.profileImage || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'}
              alt="Profile"
              className="h-8 w-8 rounded-full border border-zinc-800 object-cover bg-zinc-900"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-zinc-200">{user?.fullName}</p>
              <p className="truncate text-[10px] text-zinc-500 capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Exit Console
          </button>
        </div>
      </div>
    </aside>
  );
}
