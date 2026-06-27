'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  DollarSign, 
  ChevronRight, 
  Info,
  CalendarRange,
  Users
} from 'lucide-react';

interface BookingTimeline {
  status: string;
  timestamp: string;
  note?: string;
}

interface BookingItem {
  _id: string;
  bookingId: string;
  customerId: string | { _id: string; fullName: string; email: string; phone?: string };
  providerId: string | { _id: string; businessName: string };
  serviceSnapshot: {
    title: string;
    category: string;
  };
  bookingDate: string;
  bookingTime: string;
  bookingStatus: 'pending' | 'accepted' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'disputed' | 'payment_pending';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  pricing: {
    basePrice: number;
    addonsPrice: number;
    platformFee: number;
    gstAmount: number;
    totalAmount: number;
    providerPayout: number;
  };
  timeline: BookingTimeline[];
  cancellation?: {
    cancelledBy: string;
    reason: string;
    refundAmount: number;
  };
  createdAt: string;
}

export default function BookingsManagerPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal and details
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<string>('confirmed');
  const [timelineNote, setTimelineNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Endpoint handled by SuperAdminController.getBookings (GET /api/v1/super-admin/bookings)
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const response = await api.get<BookingItem[]>('/super-admin/bookings', { params });
      if (response.success && response.data) {
        setBookings(response.data);
      } else {
        setError(response.message || 'Failed to retrieve bookings history log');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync with bookings database server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const handleOpenDetails = (bk: BookingItem) => {
    setSelectedBooking(bk);
    setDetailsModalOpen(true);
  };

  const handleOpenOverride = (bk: BookingItem) => {
    setSelectedBooking(bk);
    setTargetStatus(bk.bookingStatus);
    setTimelineNote('');
    setActionError(null);
    setOverrideModalOpen(true);
  };

  const handleOverrideStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setActionError(null);

    if (!timelineNote.trim()) {
      setActionError('Please specify a reason or timeline log note for this override.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put<any>(`/super-admin/bookings/${selectedBooking._id}/force-status`, {
        status: targetStatus,
        timelineNote: timelineNote.trim(),
      });

      if (response.success) {
        setOverrideModalOpen(false);
        setDetailsModalOpen(false);
        fetchBookings();
      } else {
        setActionError(response.message || 'Override status registration failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Something went wrong while applying override');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-400">Pending</span>;
      case 'accepted':
        return <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-400">Accepted</span>;
      case 'confirmed':
        return <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-400">Confirmed</span>;
      case 'in_progress':
        return <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-400">In Flight</span>;
      case 'completed':
        return <span className="rounded-full bg-emerald-500/25 border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300">Completed</span>;
      case 'cancelled':
        return <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-400">Cancelled</span>;
      case 'disputed':
        return <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-300">Disputed</span>;
      default:
        return <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-500">Draft</span>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-emerald-400 font-semibold">Paid</span>;
      case 'refunded':
        return <span className="text-amber-400 font-semibold">Refunded</span>;
      case 'failed':
        return <span className="text-red-400 font-semibold">Failed</span>;
      default:
        return <span className="text-zinc-500">Unpaid</span>;
    }
  };

  const getCustomerName = (cust: any) => {
    if (typeof cust === 'object') return cust.fullName || cust.email || 'Customer';
    return cust || 'Customer ID';
  };

  const getCustomerContact = (cust: any) => {
    if (typeof cust === 'object') return `${cust.email} ${cust.phone ? `(${cust.phone})` : ''}`;
    return '';
  };

  const getProviderName = (prov: any) => {
    if (typeof prov === 'object') return prov.businessName || 'Pilot Business';
    return prov || 'Provider ID';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Bookings Log Ledger</h2>
          <p className="mt-1.5 text-sm text-zinc-400">Monitor and override scheduling timeline states globally</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and search panel */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-zinc-900/20 border border-zinc-800/80 p-4 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Booking ID or Service..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-4 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 py-2 px-3 text-xs text-zinc-300 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Flight</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="disputed">Disputed</option>
          </select>
        </div>
      </div>

      {/* Table view */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-zinc-500">Retrieving operational telemetry logs...</p>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <Card className="text-center py-16">
          <CalendarRange className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-sm font-semibold text-zinc-300">No Bookings Found</p>
          <p className="text-xs text-zinc-500 mt-1">There are no operational records matching this filter state.</p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer Details</TableHead>
              <TableHead>Provider Business</TableHead>
              <TableHead>Service Title</TableHead>
              <TableHead>Scheduled Date</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((bk) => (
              <TableRow key={bk._id}>
                <TableCell className="font-mono text-xs text-zinc-400 select-all">{bk.bookingId}</TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-zinc-200">{getCustomerName(bk.customerId)}</p>
                  <p className="text-[10px] text-zinc-500 max-w-[150px] truncate">{getCustomerContact(bk.customerId)}</p>
                </TableCell>
                <TableCell className="text-xs font-semibold text-zinc-300">{getProviderName(bk.providerId)}</TableCell>
                <TableCell className="text-xs font-medium text-zinc-300">{bk.serviceSnapshot?.title || 'Drone Service'}</TableCell>
                <TableCell>
                  <p className="text-xs font-medium text-zinc-200">
                    {new Date(bk.bookingDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" /> {bk.bookingTime}
                  </p>
                </TableCell>
                <TableCell className="text-xs font-bold text-zinc-100">₹{bk.pricing.totalAmount?.toLocaleString('en-IN')}</TableCell>
                <TableCell>{getStatusBadge(bk.bookingStatus)}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleOpenDetails(bk)}
                    className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  >
                    Details <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Booking Details Log"
        maxWidth="max-w-2xl"
      >
        {selectedBooking && (
          <div className="space-y-6 text-xs text-zinc-300 leading-relaxed">
            <div className="grid grid-cols-2 gap-4 border-b border-zinc-800 pb-4">
              <div>
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Booking ID Reference</p>
                <p className="font-mono text-sm font-bold text-zinc-200 select-all mt-1">{selectedBooking.bookingId}</p>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Schedule Status</p>
                <div className="mt-1">{getStatusBadge(selectedBooking.bookingStatus)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 bg-zinc-950/30 rounded-xl border border-zinc-900 p-4">
              <div>
                <h5 className="font-semibold text-zinc-400 flex items-center gap-1.5 mb-2">
                  <Users className="h-4 w-4 text-zinc-500" />
                  Customer
                </h5>
                <p className="font-bold text-zinc-200">{getCustomerName(selectedBooking.customerId)}</p>
                <p className="text-zinc-400 mt-0.5">{getCustomerContact(selectedBooking.customerId)}</p>
              </div>
              <div>
                <h5 className="font-semibold text-zinc-400 flex items-center gap-1.5 mb-2">
                  <Users className="h-4 w-4 text-zinc-500" />
                  Pilot Provider
                </h5>
                <p className="font-bold text-zinc-200">{getProviderName(selectedBooking.providerId)}</p>
              </div>
            </div>

            {/* Service & Schedule details */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-zinc-500">Service Offering</p>
                <p className="font-bold text-zinc-200 mt-1">{selectedBooking.serviceSnapshot?.title || 'Drone Flight Operation'}</p>
                <p className="text-[10px] text-zinc-500 capitalize mt-0.5">{selectedBooking.serviceSnapshot?.category?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-zinc-500">Booked Appointment</p>
                <p className="font-bold text-zinc-200 mt-1">
                  {new Date(selectedBooking.bookingDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-zinc-400 font-semibold mt-0.5">🕒 {selectedBooking.bookingTime}</p>
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-3">
              <h5 className="font-bold uppercase tracking-wider text-[9px] text-zinc-500">Financial Breakdowns</h5>
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/40 rounded-xl border border-zinc-900 p-4 font-mono">
                <div>
                  <p className="text-[10px] text-zinc-500">Base Price</p>
                  <p className="text-zinc-200 font-semibold mt-1">₹{selectedBooking.pricing.basePrice?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">Add-ons Total</p>
                  <p className="text-zinc-200 font-semibold mt-1">₹{selectedBooking.pricing.addonsPrice?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">Platform Fee</p>
                  <p className="text-zinc-200 font-semibold mt-1">₹{selectedBooking.pricing.platformFee?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">GST Amount</p>
                  <p className="text-zinc-200 font-semibold mt-1">₹{selectedBooking.pricing.gstAmount?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">Pilot Payout</p>
                  <p className="text-emerald-400 font-bold mt-1">₹{selectedBooking.pricing.providerPayout?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">Grand Total (Paid)</p>
                  <p className="text-zinc-100 font-bold mt-1">₹{selectedBooking.pricing.totalAmount?.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>

            {/* Cancellation details if cancelled */}
            {selectedBooking.cancellation && (
              <div className="border border-red-500/20 bg-red-500/5 p-4 rounded-xl">
                <h5 className="font-semibold text-red-400 flex items-center gap-1.5 mb-1">
                  <Info className="h-4 w-4" /> Cancellation Details
                </h5>
                <p><span className="text-zinc-500 font-medium">Cancelled By:</span> <span className="capitalize font-semibold text-zinc-300">{selectedBooking.cancellation.cancelledBy}</span></p>
                <p className="mt-1"><span className="text-zinc-500 font-medium">Reason:</span> <span className="text-zinc-300 italic">"{selectedBooking.cancellation.reason}"</span></p>
                {selectedBooking.cancellation.refundAmount > 0 && (
                  <p className="mt-1"><span className="text-zinc-500 font-medium">Refund Amount:</span> <span className="text-amber-400 font-bold">₹{selectedBooking.cancellation.refundAmount}</span></p>
                )}
              </div>
            )}

            {/* Booking state timeline logs */}
            <div className="space-y-3">
              <h5 className="font-bold uppercase tracking-wider text-[9px] text-zinc-500">Operational Timeline Logs</h5>
              <div className="space-y-2 border-l border-zinc-800 pl-4 ml-2">
                {selectedBooking.timeline?.map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-zinc-700 border border-zinc-950" />
                    <p className="text-zinc-400 text-[10px]">
                      {new Date(step.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="font-semibold text-zinc-200 text-xs mt-0.5 capitalize">{step.status.replace(/_/g, ' ')}</p>
                    {step.note && <p className="text-zinc-500 text-[11px] mt-0.5">"{step.note}"</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Super Admin status overrides */}
            {isSuperAdmin && (
              <div className="flex gap-2 justify-end border-t border-zinc-850 pt-4 mt-6">
                <button
                  onClick={() => handleOpenOverride(selectedBooking)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all"
                >
                  <AlertTriangle className="h-4 w-4" /> Admin Status Override
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Override Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title="Admin Override Panel"
        maxWidth="max-w-md"
      >
        {selectedBooking && (
          <form onSubmit={handleOverrideStatusSubmit} className="space-y-4 text-xs">
            <p className="text-zinc-400 leading-relaxed">
              Force status transition for booking <span className="font-mono text-zinc-200 font-bold">{selectedBooking.bookingId}</span>. This bypasses standard business state machine validation.
            </p>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Target Status</label>
              <select
                value={targetStatus}
                onChange={(e) => setTargetStatus(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-2.5 text-zinc-300 outline-none"
              >
                <option value="pending">Pending Request</option>
                <option value="accepted">Accepted (Awaiting Payment)</option>
                <option value="confirmed">Confirmed (Paid / Scheduled)</option>
                <option value="in_progress">In Flight (Active)</option>
                <option value="completed">Completed (Awaiting Payout)</option>
                <option value="cancelled">Cancelled</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Timeline Note / Reason</label>
              <textarea
                value={timelineNote}
                onChange={(e) => setTimelineNote(e.target.value)}
                placeholder="Reason for administratively forcing status transition..."
                rows={4}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 outline-none placeholder-zinc-650"
              />
            </div>

            {actionError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400">
                {actionError}
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-400 hover:bg-zinc-900 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-red-500 hover:bg-red-400 text-zinc-950 px-4 py-2 font-bold transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Applying Override...' : 'Apply Force Status'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
