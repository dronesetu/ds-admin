'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Card, StatsCard } from '../../../../components/ui/Card';
import { Modal } from '../../../../components/ui/Modal';
import { 
  Landmark, 
  DollarSign, 
  Percent, 
  Receipt, 
  Briefcase,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Wallet
} from 'lucide-react';

interface RevenueStats {
  totalGMV: number;
  platformCommission: number;
  taxesCollected: number;
  paymentCount: number;
}

interface PayoutItem {
  _id: string;
  providerId: {
    _id: string;
    businessName: string;
    userId?: {
      fullName: string;
    };
  } | null;
  grossAmount: number;
  commissionAmount: number;
  netPayout: number;
  payoutMethod: string;
  bankDetails: {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
  };
  payoutStatus: 'pending' | 'processing' | 'completed' | 'failed';
  payoutDate?: string;
  createdAt: string;
}

export default function PayoutsPage() {
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  // Modal states
  const [selectedPayout, setSelectedPayout] = useState<PayoutItem | null>(null);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillStatus, setFulfillStatus] = useState<'completed' | 'failed'>('completed');
  const [txRef, setTxRef] = useState('');
  const [isFulfilling, setIsFulfilling] = useState(false);
  const [fulfillError, setFulfillError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Manual Wallet Adjust form
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustProviderId, setAdjustProviderId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get<RevenueStats>('/super-admin/financials/revenue-analytics');
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to load financials analytics stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPayouts = async () => {
    setLoadingPayouts(true);
    setError(null);
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<any>('/super-admin/financials/payouts', { params });
      if (response.success && response.data) {
        setPayouts(response.data.payouts || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payouts ledger');
    } finally {
      setLoadingPayouts(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [statusFilter, page]);

  const handleOpenFulfill = (payout: PayoutItem) => {
    setSelectedPayout(payout);
    setFulfillStatus('completed');
    setTxRef('');
    setFulfillError(null);
    setFulfillModalOpen(true);
  };

  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;
    setFulfillError(null);
    setIsFulfilling(true);

    try {
      const response = await api.put<any>(`/super-admin/financials/payouts/${selectedPayout._id}/status`, {
        status: fulfillStatus,
        txRef: txRef.trim() || undefined
      });

      if (response.success) {
        setPayouts(payouts.map(p => p._id === selectedPayout._id ? { ...p, payoutStatus: fulfillStatus } : p));
        setFulfillModalOpen(false);
        // Refresh analytics stats too since payout completed
        fetchAnalytics();
      } else {
        setFulfillError(response.message);
      }
    } catch (err: any) {
      setFulfillError(err.message || 'Failed to update payout settlement');
    } finally {
      setIsFulfilling(false);
    }
  };

  const handleWalletAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);

    const amt = parseFloat(adjustAmount);
    if (!adjustProviderId || isNaN(amt) || amt <= 0 || !adjustReason.trim()) {
      setAdjustError('All fields are required. Amount must be a positive number.');
      return;
    }

    setIsAdjusting(true);
    try {
      const response = await api.post<any>('/super-admin/financials/wallet-adjust', {
        providerId: adjustProviderId,
        amount: amt,
        type: adjustType,
        reason: adjustReason
      });

      if (response.success) {
        setAdjustModalOpen(false);
        // Clear adjustment form
        setAdjustProviderId('');
        setAdjustAmount('');
        setAdjustReason('');
        // Refresh stats
        fetchAnalytics();
        fetchPayouts();
      } else {
        setAdjustError(response.message);
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Wallet adjustment failed.');
    } finally {
      setIsAdjusting(false);
    }
  };

  const getProviderBusiness = (payout: PayoutItem) => {
    return payout.providerId?.businessName || payout.providerId?.userId?.fullName || 'Platform Provider';
  };

  const getPayoutStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Settled</span>;
      case 'failed':
        return <span className="rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">Failed</span>;
      case 'processing':
        return <span className="rounded bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[9px] font-bold text-yellow-400 uppercase tracking-wider animate-pulse">Processing</span>;
      default:
        return <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Requested</span>;
    }
  };

  return (
    <div className="space-y-8 font-sans animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Financial Settlements</h1>
          <p className="text-sm text-zinc-400 mt-1">Monitor commissions, view provider payout accounts, and reconcile bank transfers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setAdjustModalOpen(true); setAdjustError(null); }}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-850 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
          >
            <Wallet className="h-3.5 w-3.5 text-indigo-400" />
            Wallet Adjustment
          </button>
        </div>
      </div>

      {/* Analytics stats */}
      {loadingStats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <Card key={n} className="h-28 animate-pulse bg-zinc-950/20 border border-zinc-900" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Gross Merchandise Value (GMV)"
            value={`₹${stats.totalGMV.toLocaleString()}`}
            icon={<DollarSign className="h-5 w-5" />}
            change={{ value: '+15.2%', type: 'increase', label: 'vs last week' }}
          />
          <StatsCard
            title="Platform Commissions (Revenue)"
            value={`₹${stats.platformCommission.toLocaleString()}`}
            icon={<Percent className="h-5 w-5 text-indigo-400" />}
            change={{ value: '+18.1%', type: 'increase', label: 'vs last week' }}
          />
          <StatsCard
            title="Total GST/Taxes Collected"
            value={`₹${stats.taxesCollected.toLocaleString()}`}
            icon={<Receipt className="h-5 w-5" />}
          />
          <StatsCard
            title="Volume (Settled Bookings)"
            value={stats.paymentCount.toLocaleString()}
            icon={<Briefcase className="h-5 w-5 text-emerald-400" />}
            change={{ value: '+22', type: 'increase', label: 'completed transactions' }}
          />
        </div>
      ) : null}

      {/* Ledger lists */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-950/20 rounded-2xl border border-zinc-800 p-4">
          <div className="flex gap-2">
            {['', 'pending', 'processing', 'completed', 'failed'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold border transition-all ${
                  statusFilter === status
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    : 'bg-zinc-950/50 text-zinc-400 border-zinc-850 hover:bg-zinc-900'
                }`}
              >
                {status === '' ? 'All Settlements' : status.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="text-xs text-zinc-500 font-medium">
            Payout Requests: {payouts.length}
          </div>
        </div>

        {loadingPayouts ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-zinc-400">Loading payout records...</p>
            </div>
          </div>
        ) : error && !payouts.length ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-red-400">Ledger Load Failed</p>
            <p className="text-xs text-red-300/80 mt-1">{error}</p>
          </div>
        ) : payouts.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-sm font-semibold text-zinc-300">No Payout Requests Registered</p>
            <p className="text-xs text-zinc-500 mt-1">There are no payout transfers registered in this category.</p>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider Business</TableHead>
                <TableHead>Transfer Bank Details</TableHead>
                <TableHead>Gross Order Val</TableHead>
                <TableHead>System Commission</TableHead>
                <TableHead>Net Payout</TableHead>
                <TableHead>Settlement Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p._id}>
                  <TableCell>
                    <p className="text-xs font-semibold text-zinc-200">{getProviderBusiness(p)}</p>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5 select-all">ID: {p.providerId?._id || 'N/A'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-xs text-zinc-450">
                      <p className="flex items-center gap-1 font-mono">
                        <Landmark className="h-3.5 w-3.5 text-zinc-550 shrink-0" />
                        {p.bankDetails.accountNumber ? 'X'.repeat(Math.max(0, p.bankDetails.accountNumber.length - 4)) + p.bankDetails.accountNumber.slice(-4) : 'N/A'}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">IFSC: {p.bankDetails.ifsc}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-zinc-350">₹{p.grossAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-red-400 font-semibold">- ₹{p.commissionAmount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs text-emerald-400 font-bold">₹{p.netPayout.toLocaleString()}</TableCell>
                  <TableCell>{getPayoutStatusBadge(p.payoutStatus)}</TableCell>
                  <TableCell className="text-right">
                    {p.payoutStatus !== 'completed' && p.payoutStatus !== 'failed' ? (
                      <button
                        onClick={() => handleOpenFulfill(p)}
                        className="inline-flex items-center gap-1 bg-indigo-500 hover:bg-indigo-400 text-zinc-950 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        Settle Transfer <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-zinc-500 mr-4">Concluded</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {total > limit && (
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-400">
            <p>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} payouts</p>
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

      {/* Payout Fulfillment Modal */}
      <Modal
        isOpen={fulfillModalOpen}
        onClose={() => setFulfillModalOpen(false)}
        title="Bank Transfer Settlement"
      >
        {selectedPayout && (
          <form onSubmit={handleFulfillSubmit} className="space-y-5">
            {fulfillError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {fulfillError}
              </div>
            )}

            <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3 text-xs">
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Provider Business</span>
                <span className="font-semibold text-zinc-300">{getProviderBusiness(selectedPayout)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Bank Holder Name</span>
                <span className="font-semibold text-zinc-300 font-mono">{selectedPayout.bankDetails.accountHolderName}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">Account Number</span>
                <span className="font-bold text-zinc-200 font-mono">{selectedPayout.bankDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-900 pb-2">
                <span className="text-zinc-500">IFSC Code</span>
                <span className="font-semibold text-zinc-350 font-mono">{selectedPayout.bankDetails.ifsc}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-zinc-400 font-semibold">Net Settlement Amount</span>
                <span className="font-bold text-emerald-400 text-sm">₹{selectedPayout.netPayout.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal">
              Execute a manual IMPS/NEFT transfer from the Drone Setu commercial account to the destination credentials above. 
              Once the bank confirms authorization, select the outcome status below to update the system ledger.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillStatus('completed')}
                className={`rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                  fulfillStatus === 'completed'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-zinc-950/30 border-zinc-850 text-zinc-450 hover:bg-zinc-900'
                }`}
              >
                Mark Transfer Settled
              </button>
              <button
                type="button"
                onClick={() => setFulfillStatus('failed')}
                className={`rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                  fulfillStatus === 'failed'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-zinc-950/30 border-zinc-850 text-zinc-450 hover:bg-zinc-900'
                }`}
              >
                Mark Transfer Failed
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Transaction Reference / UTR Code
              </label>
              <input
                type="text"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. UTR123456789"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 px-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFulfillModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isFulfilling}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-indigo-500/10 transition-colors"
              >
                {isFulfilling ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  'Submit Outcome'
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Manual Wallet Adjust Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Ledger Wallet Adjustment"
      >
        <form onSubmit={handleWalletAdjustSubmit} className="space-y-4">
          {adjustError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {adjustError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Provider ID (Mongoose ObjectId)
            </label>
            <input
              type="text"
              value={adjustProviderId}
              onChange={(e) => setAdjustProviderId(e.target.value)}
              placeholder="e.g. 648fb6a30c5e7b25a3d7bc1c"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 px-4 text-xs text-zinc-100 placeholder-zinc-650 outline-none focus:border-indigo-500/50 font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('credit')}
                  className={`rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                    adjustType === 'credit'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-zinc-950/30 border-zinc-850 text-zinc-400'
                  }`}
                >
                  Credit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('debit')}
                  className={`rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                    adjustType === 'debit'
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-zinc-950/30 border-zinc-850 text-zinc-400'
                  }`}
                >
                  Debit (-)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Transaction Amount (INR)
              </label>
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="₹ 1500"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 px-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Auditable adjustment reason
            </label>
            <textarea
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Compensating for booking ref cancel fees, refunding extra commission penalty, correcting ledger balances..."
              rows={4}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-100 placeholder-zinc-650 outline-none focus:border-indigo-500/50"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAdjustModalOpen(false)}
              className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdjusting}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-indigo-500/10 transition-colors"
            >
              {isAdjusting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              ) : (
                'Commit Adjustment'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
