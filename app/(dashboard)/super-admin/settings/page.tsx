'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { Card } from '../../../../components/ui/Card';
import { 
  Settings, 
  Settings2,
  AlertOctagon, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  Percent, 
  Map, 
  Clock, 
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Activity
} from 'lucide-react';

interface ConfigItem {
  _id?: string;
  key: string;
  value: any;
  updatedAt?: string;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Maintenance state
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('Scheduled system updates.');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);

  // General settings state
  const [commissionRate, setCommissionRate] = useState('15');
  const [serviceRadius, setServiceRadius] = useState('25');
  const [otpExpiry, setOtpExpiry] = useState('5');
  const [isSavingConfigs, setIsSavingConfigs] = useState<Record<string, boolean>>({});
  const [configSuccess, setConfigSuccess] = useState<Record<string, boolean>>({});

  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ConfigItem[]>('/super-admin/system/configs');
      if (response.success && response.data) {
        setConfigs(response.data);
        
        // Populate states from database configs
        const items = response.data;
        const maintMode = items.find(c => c.key === 'MAINTENANCE_MODE');
        const maintReason = items.find(c => c.key === 'MAINTENANCE_REASON');
        const commRate = items.find(c => c.key === 'DEFAULT_PLATFORM_COMMISSION_RATE');
        const radius = items.find(c => c.key === 'DEFAULT_PROVIDER_SERVICE_RADIUS_KM');
        const otpExp = items.find(c => c.key === 'OTP_EXPIRY_MINUTES');

        if (maintMode) setIsMaintenance(Boolean(maintMode.value));
        if (maintReason) setMaintenanceReason(String(maintReason.value));
        if (commRate) setCommissionRate(String(commRate.value));
        if (radius) setServiceRadius(String(radius.value));
        if (otpExp) setOtpExpiry(String(otpExp.value));
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync platform configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleMaintenanceToggle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingMaintenance(true);
    setMaintenanceSuccess(false);
    setError(null);

    try {
      const response = await api.post<any>('/super-admin/system/maintenance', {
        enable: !isMaintenance,
        reason: maintenanceReason,
      });

      if (response.success) {
        setIsMaintenance(!isMaintenance);
        setMaintenanceSuccess(true);
        setTimeout(() => setMaintenanceSuccess(false), 3000);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to toggle maintenance mode');
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };

  const handleSaveConfig = async (key: string, valueStr: string) => {
    setIsSavingConfigs(prev => ({ ...prev, [key]: true }));
    setConfigSuccess(prev => ({ ...prev, [key]: false }));
    setError(null);

    // Convert value format
    let value: any = valueStr;
    if (key === 'DEFAULT_PLATFORM_COMMISSION_RATE' || key === 'DEFAULT_PROVIDER_SERVICE_RADIUS_KM' || key === 'OTP_EXPIRY_MINUTES') {
      value = parseFloat(valueStr);
      if (isNaN(value)) {
        setError('Value must be a valid number.');
        setIsSavingConfigs(prev => ({ ...prev, [key]: false }));
        return;
      }
    }

    try {
      const response = await api.put<any>('/super-admin/system/configs', {
        key,
        value,
      });

      if (response.success) {
        setConfigSuccess(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setConfigSuccess(prev => ({ ...prev, [key]: false }));
        }, 3000);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || `Failed to update config key: ${key}`);
    } finally {
      setIsSavingConfigs(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-xs text-zinc-400">Loading system configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-4xl animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Global System Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Configure business coefficients, default operational ranges, and schedule maintenance locks.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-400">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 inline mr-2 align-middle" />
          <span className="align-middle font-medium">Failed update action: {error}</span>
        </div>
      )}

      {/* Grid section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Maintenance Toggle panel */}
        <div className="md:col-span-2">
          <Card className="h-full flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-4">
                <AlertOctagon className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-sm font-bold text-zinc-200">System Maintenance Mode</h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Locks out API access for customers/providers during updates.</p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-950/40 border border-zinc-900 p-4 mb-4">
                <div>
                  <p className="text-xs font-semibold text-zinc-300">Lockout Gateways</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Toggle admin overrides to block incoming client connections.</p>
                </div>
                <button
                  type="button"
                  onClick={handleMaintenanceToggle}
                  disabled={isUpdatingMaintenance}
                  className="focus:outline-none transition-opacity"
                >
                  {isMaintenance ? (
                    <ToggleRight className="h-9 w-9 text-indigo-400 shrink-0" />
                  ) : (
                    <ToggleLeft className="h-9 w-9 text-zinc-700 shrink-0" />
                  )}
                </button>
              </div>

              {isMaintenance && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs mb-4">
                  <p className="font-semibold text-indigo-400 flex items-center gap-1.5 mb-1">
                    <Activity className="h-4 w-4 shrink-0 animate-pulse" /> Maintenance Mode Active
                  </p>
                  <p className="text-zinc-300">Platform endpoints are now locked. Only Super Admins and Staff Admins bypass this block.</p>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  System Banner Message (shown to users)
                </label>
                <textarea
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="Scheduled database migrations. Console services will resume in 30 minutes..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-100 placeholder-zinc-650 outline-none focus:border-indigo-500/50"
                  disabled={isUpdatingMaintenance}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-900">
              <div className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5">
                {maintenanceSuccess && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> Maintenance state updated
                  </span>
                )}
              </div>
              <button
                onClick={handleMaintenanceToggle}
                disabled={isUpdatingMaintenance}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-zinc-950 px-4 py-2.5 text-xs font-bold transition-all"
              >
                {isUpdatingMaintenance ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Save Gate Status
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Configurations panel */}
        <div>
          <Card className="h-full space-y-6">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-4 mb-2">
              <Settings2 className="h-5 w-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-bold text-zinc-200">Business Parameters</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">Platform commissions and operational defaults.</p>
              </div>
            </div>

            {/* Config 1: Commission */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <label className="flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-zinc-500" /> Platform Fee (%)
                </label>
                {configSuccess['DEFAULT_PLATFORM_COMMISSION_RATE'] && (
                  <span className="text-emerald-400 text-[10px]">Saved</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig('DEFAULT_PLATFORM_COMMISSION_RATE', commissionRate)}
                  disabled={isSavingConfigs['DEFAULT_PLATFORM_COMMISSION_RATE']}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 p-2 text-zinc-300"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Config 2: Radius */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <label className="flex items-center gap-1.5">
                  <Map className="h-4 w-4 text-zinc-500" /> Service Radius (KM)
                </label>
                {configSuccess['DEFAULT_PROVIDER_SERVICE_RADIUS_KM'] && (
                  <span className="text-emerald-400 text-[10px]">Saved</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={serviceRadius}
                  onChange={(e) => setServiceRadius(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig('DEFAULT_PROVIDER_SERVICE_RADIUS_KM', serviceRadius)}
                  disabled={isSavingConfigs['DEFAULT_PROVIDER_SERVICE_RADIUS_KM']}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 p-2 text-zinc-300"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Config 3: OTP Expiry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
                <label className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-zinc-500" /> OTP Expiry (Min)
                </label>
                {configSuccess['OTP_EXPIRY_MINUTES'] && (
                  <span className="text-emerald-400 text-[10px]">Saved</span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={otpExpiry}
                  onChange={(e) => setOtpExpiry(e.target.value)}
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 py-2 px-3 text-xs text-zinc-100 outline-none focus:border-indigo-500/50"
                />
                <button
                  type="button"
                  onClick={() => handleSaveConfig('OTP_EXPIRY_MINUTES', otpExpiry)}
                  disabled={isSavingConfigs['OTP_EXPIRY_MINUTES']}
                  className="rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 p-2 text-zinc-300"
                >
                  <Save className="h-4 w-4" />
                </button>
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
}
