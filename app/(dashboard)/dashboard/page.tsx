'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../../utils/api';
import { StatsCard } from '../../../components/ui/Card';
import { 
  Users, 
  Video, 
  User, 
  Cpu, 
  HardDrive, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardStats {
  systemStatus: string;
  stats: {
    totalUsers: number;
    activeProviders: number;
    activeConsumers: number;
    systemLoad: string;
    memoryUsage: {
      used: string;
      free: string;
    };
  };
  alertQueue: Array<{
    id: string;
    level: 'warning' | 'danger';
    message: string;
  }>;
}

const mockChartData = [
  { day: 'Mon', Bookings: 42, Revenue: 21000 },
  { day: 'Tue', Bookings: 58, Revenue: 29000 },
  { day: 'Wed', Bookings: 69, Revenue: 34500 },
  { day: 'Thu', Bookings: 50, Revenue: 25000 },
  { day: 'Fri', Bookings: 85, Revenue: 42500 },
  { day: 'Sat', Bookings: 110, Revenue: 55000 },
  { day: 'Sun', Bookings: 95, Revenue: 47500 },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setError(null);
    try {
      const response = await api.get<DashboardStats>('/admin/dashboard');
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync with administration server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Syncing telemetry data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-400">Connection Interrupted</h3>
        <p className="mt-2 text-sm text-red-300/80">{error || 'Unable to retrieve dashboard stats.'}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 px-4 py-2 text-xs font-semibold text-red-300 transition-all border border-red-500/30"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try Reconnecting
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Telemetry Console</h1>
          <p className="text-sm text-zinc-400 mt-1">Real-time gateway status, platform metrics, and system indicators.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 disabled:opacity-50 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-zinc-400">System Gateway:</span>
            <span className="font-semibold text-emerald-400 capitalize">{data.systemStatus}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Registered Accounts"
          value={data.stats.totalUsers.toLocaleString()}
          icon={<Users className="h-5 w-5" />}
          change={{ value: '+12.4%', type: 'increase', label: 'vs last month' }}
        />
        <StatsCard
          title="Active Drone Providers"
          value={data.stats.activeProviders.toLocaleString()}
          icon={<Cpu className="h-5 w-5" />}
          change={{ value: '+8.1%', type: 'increase', label: 'vs last month' }}
        />
        <StatsCard
          title="Active Service Consumers"
          value={data.stats.activeConsumers.toLocaleString()}
          icon={<User className="h-5 w-5" />}
          change={{ value: '+14.2%', type: 'increase', label: 'vs last month' }}
        />
        <StatsCard
          title="Gateway CPU Load"
          value={data.stats.systemLoad}
          icon={<Cpu className="h-5 w-5" />}
          change={{ value: '-2.4%', type: 'decrease', label: 'idle drop' }}
        />
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-md font-semibold text-zinc-100">Booking & Revenue Trends</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Aggregated weekly transaction load</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-500/10 rounded-full px-2.5 py-1">
              <TrendingUp className="h-3.5 w-3.5" />
              +18.3% Gross Margin
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#18181b', 
                    borderColor: '#27272a', 
                    borderRadius: '12px',
                    color: '#f4f4f5',
                    fontSize: '12px'
                  }} 
                />
                <Area type="monotone" dataKey="Bookings" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Server Memory Stats */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-md font-semibold text-zinc-100">Active Memory Heap</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Express server resource partition</p>
          </div>

          <div className="my-6 flex flex-col items-center justify-center relative">
            <HardDrive className="h-16 w-16 text-emerald-500/20 mb-2" />
            <span className="text-3xl font-bold tracking-tight text-zinc-100">{data.stats.memoryUsage.used}</span>
            <span className="text-xs text-zinc-500 mt-1">Allocated out of {parseInt(data.stats.memoryUsage.used) + parseInt(data.stats.memoryUsage.free)}MB</span>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-400 mb-1">
                <span>Memory Saturation</span>
                <span className="text-zinc-200">
                  {Math.round((parseInt(data.stats.memoryUsage.used) / (parseInt(data.stats.memoryUsage.used) + parseInt(data.stats.memoryUsage.free))) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(parseInt(data.stats.memoryUsage.used) / (parseInt(data.stats.memoryUsage.used) + parseInt(data.stats.memoryUsage.free))) * 100}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs border-t border-zinc-900 pt-3">
              <div>
                <p className="text-zinc-500">Heap Used</p>
                <p className="font-semibold text-zinc-300 mt-0.5">{data.stats.memoryUsage.used}</p>
              </div>
              <div>
                <p className="text-zinc-500">Heap Free</p>
                <p className="font-semibold text-zinc-300 mt-0.5">{data.stats.memoryUsage.free}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Warnings / Logs Section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-indigo-400" />
          <h3 className="text-md font-semibold text-zinc-100">Live Warning & Alerts Queue</h3>
        </div>
        {data.alertQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mb-2" />
            <p className="text-sm font-semibold text-zinc-300">All Systems Nominal</p>
            <p className="text-xs text-zinc-500 mt-1">No pending anomalies detected on clusters.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-850">
            {data.alertQueue.map((alert) => (
              <div key={alert.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                <div className={`rounded-xl p-2 shrink-0 border ${
                  alert.level === 'danger'
                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                }`}>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                      alert.level === 'danger' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="h-3 w-3" /> Just now
                    </span>
                  </div>
                  <p className="text-sm text-zinc-200 font-medium mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
