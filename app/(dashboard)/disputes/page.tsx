'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../utils/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  MessageSquare,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Ban
} from 'lucide-react';

interface DisputeItem {
  _id: string;
  bookingId: string;
  raisedBy: string | { _id: string; fullName: string; role: string };
  againstUserId?: string | { _id: string; fullName: string; role: string };
  disputeType: string;
  reason: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  resolutionNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DisputesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [disputes, setDisputes] = useState<DisputeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // Modal states
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<'under_review' | 'resolved' | 'rejected'>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (statusFilter) params.status = statusFilter;

      const response = await api.get<any>('/admin/disputes', { params });
      if (response.success && response.data) {
        setDisputes(response.data.disputes || []);
        setTotal(response.data.total || 0);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync disputes ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter, page]);

  const handleOpenResolve = (dispute: DisputeItem) => {
    setSelectedDispute(dispute);
    setResolutionStatus(dispute.status === 'open' ? 'resolved' : (dispute.status as any));
    setResolutionNotes(dispute.resolutionNotes || '');
    setRefundAmount('');
    setActionError(null);
    setResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setActionError(null);

    if (!resolutionNotes.trim()) {
      setActionError('Resolution notes are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      // If super_admin and refundAmount is specified
      const refundVal = Number(refundAmount);
      if (isSuperAdmin && resolutionStatus === 'resolved' && refundVal > 0) {
        const refundRes = await api.post<any>(`/super-admin/bookings/${selectedDispute.bookingId}/refund`, {
          refundAmount: refundVal,
          reason: resolutionNotes.trim(),
        });

        if (!refundRes.success) {
          throw new Error(refundRes.message || 'Administrative refund failed.');
        }
      }

      const response = await api.put<any>(`/admin/disputes/${selectedDispute._id}`, {
        status: resolutionStatus,
        resolutionNotes,
      });

      if (response.success) {
        // Update local state
        setDisputes(disputes.map(d => d._id === selectedDispute._id ? {
          ...d,
          status: resolutionStatus,
          resolutionNotes,
          updatedAt: new Date().toISOString()
        } : d));
        setResolveModalOpen(false);
      } else {
        setActionError(response.message || 'Verdict registration failed.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Something went wrong while recording settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
            <CheckCircle className="h-3 w-3" /> Resolved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
            <Ban className="h-3 w-3" /> Rejected
          </span>
        );
      case 'under_review':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
            <Clock className="h-3 w-3" /> Under Review
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
            <HelpCircle className="h-3 w-3 animate-pulse" /> Open
          </span>
        );
    }
  };

  const getUserName = (party: any) => {
    if (!party) return 'System';
    if (typeof party === 'string') return party;
    return party.fullName || party.name || party._id;
  };

  const filteredDisputes = disputes;

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Booking Dispute Resolution</h1>
        <p className="text-sm text-zinc-400 mt-1">Review disputes raised by customers or service providers and determine settlements.</p>
      </div>

      {/* Filters */}
      <Card className="flex gap-4 justify-between items-center bg-zinc-950/20">
        <div className="flex gap-2">
          {['', 'open', 'under_review', 'resolved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold border transition-all ${
                statusFilter === status
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-zinc-950/50 text-zinc-400 border-zinc-850 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              {status === '' ? 'All Disputes' : status.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          Total disputes cataloged: {disputes.length}
        </div>
      </Card>

      {/* Dispute Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-400">Syncing dispute reports...</p>
          </div>
        </div>
      ) : error && !disputes.length ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-400">Connection Failed</p>
          <p className="text-xs text-red-300/80 mt-1">{error}</p>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-zinc-300">No disputes reported</p>
          <p className="text-xs text-zinc-500 mt-1">There are no reports matching this filter state.</p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking Ref</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Dispute Category</TableHead>
              <TableHead>Report Date</TableHead>
              <TableHead>Resolution Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDisputes.map((d) => (
              <TableRow key={d._id}>
                <TableCell className="font-mono text-xs select-all">
                  <Link href={`/bookings?search=${d.bookingId}`} className="text-emerald-400 hover:underline">
                    {d.bookingId}
                  </Link>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-zinc-300">{getUserName(d.raisedBy)}</p>
                  <p className="text-[10px] text-zinc-500 capitalize">
                    {typeof d.raisedBy === 'object' ? d.raisedBy.role : 'User'}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-zinc-200 capitalize">{d.disputeType.replace(/_/g, ' ')}</p>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-zinc-400">
                    {new Date(d.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(d.status)}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleOpenResolve(d)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
                  >
                    Resolve <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-400">
          <p>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} disputes</p>
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

      {/* Resolution Details Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Dispute Case Review"
        maxWidth="max-w-xl"
      >
        {selectedDispute && (
          <div className="space-y-6">
            {/* Header meta */}
            <div className="flex justify-between items-start gap-4 border-b border-zinc-800 pb-4">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Booking Link</span>
                <p className="font-mono text-xs font-semibold select-all mt-0.5">
                  <Link href={`/bookings?search=${selectedDispute.bookingId}`} className="text-emerald-400 hover:underline inline-flex items-center gap-1">
                    {selectedDispute.bookingId} <ExternalLink className="h-3 w-3" />
                  </Link>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Case status</span>
                <div className="mt-0.5">{getStatusBadge(selectedDispute.status)}</div>
              </div>
            </div>

            {/* Reporter details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-zinc-500">Dispute Raised By</p>
                <p className="font-semibold text-zinc-300 mt-1">{getUserName(selectedDispute.raisedBy)}</p>
              </div>
              <div>
                <p className="text-zinc-500">Category</p>
                <p className="font-semibold text-zinc-300 mt-1 capitalize">{selectedDispute.disputeType.replace(/_/g, ' ')}</p>
              </div>
            </div>

            {/* Reason report */}
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/40 p-4 text-xs">
              <p className="font-semibold text-zinc-400 flex items-center gap-1.5 mb-1.5">
                <FileText className="h-4 w-4 text-zinc-500" />
                Case Report & Argument
              </p>
              <p className="text-zinc-300 leading-relaxed">{selectedDispute.reason}</p>
            </div>

            {/* Evidence items */}
            {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Evidence Documentation</p>
                <div className="grid grid-cols-2 gap-3">
                  {selectedDispute.evidence.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 hover:bg-zinc-900/60 transition-colors text-xs text-indigo-400 font-semibold"
                    >
                      <ExternalLink className="h-4 w-4 shrink-0" /> Attachment {idx + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Current Resolution Notes display */}
            {(selectedDispute.status === 'resolved' || selectedDispute.status === 'rejected') && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs">
                <p className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Recorded Resolution Action
                </p>
                <p className="text-zinc-300 leading-normal mb-2">{selectedDispute.resolutionNotes}</p>
                <p className="text-[10px] text-zinc-500">Resolved Date: {new Date(selectedDispute.updatedAt).toLocaleString()}</p>
              </div>
            )}

            {/* Resolution Form (Always available if not closed or to override) */}
            <form onSubmit={handleResolveSubmit} className="space-y-4 border-t border-zinc-800 pt-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Submit Settlement Verdict</h5>
              
              {actionError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                  {actionError}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {(['under_review', 'resolved', 'rejected'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setResolutionStatus(status)}
                    className={`rounded-xl py-2 px-3 text-xs font-semibold border transition-all ${
                      resolutionStatus === status
                        ? status === 'resolved'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : status === 'rejected'
                          ? 'bg-red-500/10 border-red-500/30 text-red-400'
                          : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                        : 'bg-zinc-950/30 border-zinc-850 text-zinc-400 hover:bg-zinc-900'
                    }`}
                  >
                    {status.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>

              {resolutionStatus === 'resolved' && isSuperAdmin && (
                <div className="bg-zinc-950/40 rounded-xl border border-zinc-900 p-4 space-y-3">
                  <p className="font-semibold text-zinc-350 text-xs">Administrative Payout Overrides</p>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Force Refund Amount (INR)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="e.g. 1500 (leave blank or 0 for no refund)"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 p-2.5 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Saves details to ledger and cancels booking status if refund is processed.</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Resolution & Findings Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="State the reasons for this decision and details on payment reversals, provider warning penalties, or refunds processed..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-100 placeholder-zinc-650 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setResolveModalOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-semibold text-zinc-950 transition-all shadow-lg shadow-emerald-500/10"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  ) : (
                    'Record Verdict'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
