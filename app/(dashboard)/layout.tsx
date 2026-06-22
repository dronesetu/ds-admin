'use client';

import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { ShieldAlert } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Handle route guarding for super-admin directories
  const isSuperAdminRoute = pathname.startsWith('/super-admin');
  const isSuperAdmin = user?.role === 'super_admin';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-400">Verifying security clearances...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Deny access if regular admin tries to load super-admin route
  if (isSuperAdminRoute && !isSuperAdmin) {
    return (
      <div className="flex h-screen bg-zinc-950 font-sans">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-zinc-900/10 p-8 flex items-center justify-center">
            <div className="max-w-md text-center rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-md">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 mb-6">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-zinc-100">Access Denied</h2>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                This section is reserved for the platform **Super Administrator**. Your current staff credentials do not have permission to view this page.
              </p>
              <button
                onClick={() => router.replace('/dashboard')}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-zinc-800 px-5 py-2.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 font-sans text-zinc-200 overflow-hidden">
      {/* Sidebar Nav */}
      <Sidebar />

      {/* Main Layout Pane */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
