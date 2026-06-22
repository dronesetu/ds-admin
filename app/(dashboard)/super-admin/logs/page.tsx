'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Card } from '../../../../components/ui/Card';
import { 
  History, 
  User, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  FileSpreadsheet
} from 'lucide-react';

interface AuditLogItem {
  _id: string;
  adminId: {
    _id: string;
    fullName: string;
    email: string;
  } | null;
  actionType: string;
  targetEntity: string;
  targetId: string;
  notes: string;
  createdAt: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (actionFilter) params.actionType = actionFilter;

      const response = await api.get<any>('/super-admin/logs', { params });
      if (response.success && response.data) {
        setLogs(response.data.logs || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const getActionBadge = (action: string) => {
    const isDanger = ['DELETE_SUB_ADMIN', 'USER_SUSPEND', 'MAINTENANCE_TOGGLE'].includes(action);
    const isSuccess = ['CREATE_SUB_ADMIN', 'KYC_APPROVAL', 'WALLET_ADJUST'].includes(action);
    
    if (isDanger) {
      return (
        <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
          {action.replace(/_/g, ' ')}
        </span>
      );
    }
    if (isSuccess) {
      return (
        <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
          {action.replace(/_/g, ' ')}
        </span>
      );
    }
    return (
      <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
        {action.replace(/_/g, ' ')}
      </span>
    );
  };

  const getAdminName = (log: AuditLogItem) => {
    return log.adminId?.fullName || log.adminId?.email || 'System Operation';
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Governance Audit Trail</h1>
        <p className="text-sm text-zinc-400 mt-1">Chronological history of all administrative actions, credentials changes, and configurations updates.</p>
      </div>

      {/* Filters and Controls */}
      <Card className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-950/20">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-850 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400 w-full sm:max-w-xs">
          <Filter className="h-3.5 w-3.5" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="bg-transparent text-zinc-350 outline-none pr-4 cursor-pointer w-full text-xs font-semibold"
          >
            <option value="">All Action Types</option>
            <option value="CONFIG_UPDATE">Config Updates</option>
            <option value="MAINTENANCE_TOGGLE">Maintenance Mode Shifts</option>
            <option value="CREATE_SUB_ADMIN">Enroll Sub-Admins</option>
            <option value="DELETE_SUB_ADMIN">Revoke Sub-Admins</option>
            <option value="KYC_APPROVAL">KYC Approvals</option>
            <option value="USER_SUSPEND">User Suspensions</option>
            <option value="WALLET_ADJUST">Wallet Adjustments</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActionFilter(''); setPage(1); }}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <div className="text-xs text-zinc-500 font-medium">
            Total records: {total}
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-400">Loading audit history...</p>
          </div>
        </div>
      ) : error && !logs.length ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-400">Sync Fail</p>
          <p className="text-xs text-red-300/80 mt-1">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-zinc-300">No Logs Cataloged</p>
          <p className="text-xs text-zinc-500 mt-1">There are no administrative actions registered in this category.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action Type</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Target Entity</TableHead>
                <TableHead>Target ID Ref</TableHead>
                <TableHead>Audit Notes</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>{getActionBadge(log.actionType)}</TableCell>
                  <TableCell>
                    <p className="text-xs font-semibold text-zinc-300">{getAdminName(log)}</p>
                    <p className="text-[9px] text-zinc-550 truncate max-w-[130px]">{log.adminId?.email || 'SYSTEM'}</p>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-400">{log.targetEntity}</TableCell>
                  <TableCell className="font-mono text-[10px] text-zinc-500 select-all">{log.targetId}</TableCell>
                  <TableCell className="text-xs text-zinc-350 max-w-[200px] truncate" title={log.notes}>
                    {log.notes}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-zinc-450 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-550 shrink-0" />
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-450">
              <p>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} events</p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page * limit >= total}
                  onClick={() => setPage(page + 1)}
                  className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] hover:bg-zinc-850 disabled:opacity-30 disabled:hover:bg-zinc-900 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
