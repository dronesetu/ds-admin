'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '../../../../utils/api';
import { Card } from '../../../../components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Modal } from '../../../../components/ui/Modal';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  Percent,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wallet,
  Landmark,
  Briefcase,
  Layers,
  Clock,
  ExternalLink
} from 'lucide-react';

interface UserDetailData {
  user: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    role: 'super_admin' | 'admin' | 'provider' | 'consumer';
    isSuspended: boolean;
    suspensionReason?: string;
    createdAt: string;
  };
  providerProfile?: {
    _id: string;
    businessName: string;
    businessDescription?: string;
    serviceCategories: string[];
    kyc: {
      aadhaarNumber?: string;
      panNumber?: string;
      businessLicense?: string;
      verificationStatus: 'pending' | 'approved' | 'rejected';
      rejectionReason?: string;
    };
    ratings: {
      averageRating: number;
      totalReviews: number;
    };
    wallet: {
      totalEarnings: number;
      availableBalance: number;
      pendingPayouts: number;
    };
    bankDetails?: {
      accountNumber: string;
      ifsc: string;
      accountHolderName: string;
      upiId?: string;
      verified: boolean;
    };
    customPlatformFeeRate?: number;
    serviceRadiusKm: number;
  };
  listings: any[];
  bookings: any[];
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [data, setData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions states
  const [suspending, setSuspending] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState(false);

  const [commissionRate, setCommissionRate] = useState('');
  const [updatingCommission, setUpdatingCommission] = useState(false);

  const [showKycRejectModal, setShowKycRejectModal] = useState(false);
  const [kycRejectionReason, setKycRejectionReason] = useState('');
  const [updatingKyc, setUpdatingKyc] = useState(false);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<UserDetailData>(`/super-admin/users/${userId}`);
      if (response.success && response.data) {
        setData(response.data);
        if (response.data.providerProfile?.customPlatformFeeRate !== undefined && response.data.providerProfile?.customPlatformFeeRate !== null) {
          setCommissionRate(response.data.providerProfile.customPlatformFeeRate.toString());
        } else {
          setCommissionRate('');
        }
      } else {
        setError(response.message || 'Failed to load user details');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to administration server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const handleSuspendToggle = async () => {
    if (!data) return;
    const shouldSuspend = !data.user.isSuspended;

    if (shouldSuspend && !suspensionReason.trim()) {
      alert('Please specify a reason for suspension.');
      return;
    }

    setSuspending(true);
    try {
      const response = await api.put<any>(`/super-admin/users/${userId}/suspend`, {
        isSuspended: shouldSuspend,
        reason: shouldSuspend ? suspensionReason : '',
      });

      if (response.success) {
        setData({
          ...data,
          user: {
            ...data.user,
            isSuspended: shouldSuspend,
            suspensionReason: shouldSuspend ? suspensionReason : undefined,
          },
        });
        setShowSuspendModal(false);
        setSuspensionReason('');
      } else {
        alert(response.message || 'Suspension toggle failed');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating suspension');
    } finally {
      setSuspending(false);
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.providerProfile) return;
    const rate = parseFloat(commissionRate);

    if (isNaN(rate) || rate < 0 || rate > 100) {
      alert('Commission rate must be a number between 0 and 100');
      return;
    }

    setUpdatingCommission(true);
    try {
      const response = await api.put<any>(`/super-admin/providers/${data.providerProfile._id}/commission`, {
        platformFeeRate: rate,
      });

      if (response.success) {
        alert('Platform fee commission rate updated successfully');
        fetchUserDetails();
      } else {
        alert(response.message || 'Commission update failed');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating commission');
    } finally {
      setUpdatingCommission(false);
    }
  };

  const handleKycStatusUpdate = async (status: 'approved' | 'rejected', reason?: string) => {
    if (!data?.providerProfile) return;

    setUpdatingKyc(true);
    try {
      const response = await api.put<any>(`/super-admin/providers/${data.providerProfile._id}/kyc`, {
        status,
        reason,
      });

      if (response.success) {
        alert(`KYC status updated to ${status} successfully`);
        setShowKycRejectModal(false);
        setKycRejectionReason('');
        fetchUserDetails();
      } else {
        alert(response.message || 'KYC update failed');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred while updating KYC status');
    } finally {
      setUpdatingKyc(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="rounded-full bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-400">Pending</span>;
      case 'accepted':
        return <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-400">Accepted</span>;
      case 'payment_pending':
        return <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 text-xs font-semibold text-purple-400">Payment Pending</span>;
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

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-zinc-400">Retrieving account records...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center max-w-lg mx-auto mt-12">
        <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-400">Failed to Load User Profile</h3>
        <p className="mt-2 text-sm text-red-300/80">{error || 'User details could not be retrieved.'}</p>
        <button
          onClick={fetchUserDetails}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 px-4 py-2 text-xs font-semibold text-red-300 transition-all border border-red-500/30"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isProvider = data.user.role === 'provider';

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/users')}
          className="rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">{data.user.fullName}</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
              data.user.role === 'provider' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
              data.user.role === 'admin' ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' :
              'bg-zinc-800 border-zinc-750 text-zinc-400'
            }`}>
              {data.user.role}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-mono">Account UID: {data.user._id}</p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Profile & Quick Actions */}
        <div className="lg:col-span-1 space-y-8">
          {/* Profile Card */}
          <Card className="bg-zinc-950/20 border border-zinc-850/80 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <User className="h-4 w-4" /> Account Information
            </h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Email Address</span>
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-zinc-650" /> {data.user.email}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Contact Number</span>
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-zinc-650" /> {data.user.phone || 'Not Provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Registered Since</span>
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-650" />
                  {new Date(data.user.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-zinc-900 pt-3">
                <span className="text-zinc-500">Security Clearance</span>
                {data.user.isSuspended ? (
                  <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                    <ShieldAlert className="h-3 w-3" /> Suspended
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    <ShieldCheck className="h-3 w-3" /> Active / Safe
                  </span>
                )}
              </div>
              {data.user.isSuspended && data.user.suspensionReason && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-red-400/90 leading-relaxed mt-2 text-[11px]">
                  <strong>Reason:</strong> "{data.user.suspensionReason}"
                </div>
              )}
            </div>

            {/* Suspend/Unsuspend Button */}
            <div className="pt-3 border-t border-zinc-900">
              <button
                onClick={() => {
                  if (data.user.isSuspended) {
                    handleSuspendToggle();
                  } else {
                    setShowSuspendModal(true);
                  }
                }}
                className={`w-full py-2 px-4 text-xs font-bold rounded-xl border transition-all ${
                  data.user.isSuspended
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                    : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                {data.user.isSuspended ? 'Reactivate Account' : 'Suspend Account Access'}
              </button>
            </div>
          </Card>

          {/* Provider Commission Controls */}
          {isProvider && data.providerProfile && (
            <Card className="bg-zinc-950/20 border border-zinc-850/80 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Percent className="h-4 w-4" /> Platform Fee Override
              </h3>
              <form onSubmit={handleUpdateCommission} className="space-y-3.5">
                <p className="text-[11px] text-zinc-500 leading-normal">
                  Override the default system-wide platform fee commission rate for this provider. Values are in percentages.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    placeholder="e.g. 10"
                    min="0"
                    max="100"
                    step="0.5"
                    className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950/50 py-2 px-3.5 text-xs text-zinc-100 placeholder-zinc-750 outline-none focus:border-indigo-500/50"
                  />
                  <button
                    type="submit"
                    disabled={updatingCommission}
                    className="rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-zinc-950 px-4 py-2 text-xs font-bold transition-all"
                  >
                    {updatingCommission ? 'Saving...' : 'Override'}
                  </button>
                </div>
                {data.providerProfile.customPlatformFeeRate !== null && data.providerProfile.customPlatformFeeRate !== undefined && (
                  <p className="text-[10px] text-indigo-400 font-semibold">
                    * Currently using custom rate: {data.providerProfile.customPlatformFeeRate}%
                  </p>
                )}
              </form>
            </Card>
          )}

          {/* Provider Wallet Summary */}
          {isProvider && data.providerProfile && (
            <Card className="bg-zinc-950/20 border border-zinc-850/80 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Wallet Balances
              </h3>
              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-zinc-950/40 rounded-xl border border-zinc-900 p-3">
                  <p className="text-[10px] text-zinc-505 font-sans">Available Balance</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">₹{data.providerProfile.wallet.availableBalance.toLocaleString()}</p>
                </div>
                <div className="bg-zinc-950/40 rounded-xl border border-zinc-900 p-3">
                  <p className="text-[10px] text-zinc-505 font-sans">Pending Payouts</p>
                  <p className="text-lg font-bold text-zinc-300 mt-1">₹{data.providerProfile.wallet.pendingPayouts.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-zinc-900 pt-3">
                <span className="text-zinc-555 font-semibold">Total Career Earnings</span>
                <span className="font-bold text-zinc-200">₹{data.providerProfile.wallet.totalEarnings.toLocaleString()}</span>
              </div>
            </Card>
          )}
        </div>

        {/* Right Columns: Provider Details, KYC Document Review, Listings, Bookings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Provider Business & KYC Details */}
          {isProvider && data.providerProfile && (
            <Card className="bg-zinc-950/20 border border-zinc-850/80 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4" /> Business Profile & KYC Verification
                </h3>
                <div className="space-y-2">
                  <p className="text-md font-bold text-zinc-200">{data.providerProfile.businessName}</p>
                  {data.providerProfile.businessDescription && (
                    <p className="text-xs text-zinc-450 leading-relaxed">{data.providerProfile.businessDescription}</p>
                  )}
                </div>
              </div>

              {/* KYC Review Details */}
              <div className="border-t border-zinc-900 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">KYC Verification Files</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-555">Status:</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      data.providerProfile.kyc.verificationStatus === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      data.providerProfile.kyc.verificationStatus === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                      'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 animate-pulse'
                    }`}>
                      {data.providerProfile.kyc.verificationStatus}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-zinc-950/30 rounded-xl border border-zinc-900 p-3">
                    <p className="text-zinc-500 mb-1 font-semibold">Aadhaar Number</p>
                    <p className="font-mono text-zinc-300 font-bold">{data.providerProfile.kyc.aadhaarNumber || 'Not Uploaded'}</p>
                  </div>
                  <div className="bg-zinc-950/30 rounded-xl border border-zinc-900 p-3">
                    <p className="text-zinc-500 mb-1 font-semibold">PAN Number</p>
                    <p className="font-mono text-zinc-300 font-bold">{data.providerProfile.kyc.panNumber || 'Not Uploaded'}</p>
                  </div>
                  <div className="bg-zinc-950/30 rounded-xl border border-zinc-900 p-3 flex flex-col justify-between h-16">
                    <p className="text-zinc-500 font-semibold">Business License</p>
                    {data.providerProfile.kyc.businessLicense ? (
                      <a
                        href={data.providerProfile.kyc.businessLicense}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:text-indigo-350 font-bold flex items-center gap-1 mt-1"
                      >
                        View Document <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-zinc-600">No Document</p>
                    )}
                  </div>
                </div>

                {data.providerProfile.kyc.verificationStatus === 'rejected' && data.providerProfile.kyc.rejectionReason && (
                  <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-red-400/90 text-xs">
                    <strong>KYC Rejection Reason:</strong> "{data.providerProfile.kyc.rejectionReason}"
                  </div>
                )}

                {/* KYC Action Buttons */}
                {data.providerProfile.kyc.verificationStatus === 'pending' && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleKycStatusUpdate('approved')}
                      disabled={updatingKyc}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2 px-4 text-xs font-bold transition-all shadow-lg shadow-emerald-500/10"
                    >
                      <CheckCircle className="h-4 w-4" /> Approve KYC Documents
                    </button>
                    <button
                      onClick={() => setShowKycRejectModal(true)}
                      disabled={updatingKyc}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 py-2 px-4 text-xs font-bold transition-all"
                    >
                      <XCircle className="h-4 w-4" /> Reject KYC
                    </button>
                  </div>
                )}
              </div>

              {/* Provider Bank Details */}
              {data.providerProfile.bankDetails && (
                <div className="border-t border-zinc-900 pt-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-zinc-500" /> Linked Bank Account Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs bg-zinc-950/40 rounded-xl border border-zinc-900 p-4 font-mono">
                    <div>
                      <p className="text-zinc-555 font-sans">Account Holder Name</p>
                      <p className="font-bold text-zinc-200 mt-1">{data.providerProfile.bankDetails.accountHolderName}</p>
                    </div>
                    <div>
                      <p className="text-zinc-555 font-sans">Bank Account Number</p>
                      <p className="font-bold text-zinc-200 mt-1">{data.providerProfile.bankDetails.accountNumber}</p>
                    </div>
                    <div>
                      <p className="text-zinc-555 font-sans">IFSC Code Reference</p>
                      <p className="font-bold text-zinc-200 mt-1">{data.providerProfile.bankDetails.ifsc}</p>
                    </div>
                    <div>
                      <p className="text-zinc-555 font-sans">Linked UPI ID</p>
                      <p className="font-bold text-zinc-300 mt-1">{data.providerProfile.bankDetails.upiId || 'Not Setup'}</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Listings offering */}
          {isProvider && (
            <Card className="bg-zinc-950/20 border border-zinc-850/80 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Active Service Listings
              </h3>
              {data.listings.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center font-medium">No service offerings listed in catalog.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Base Price</TableHead>
                      <TableHead>Verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.listings.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="text-xs font-semibold text-zinc-200">{item.title}</TableCell>
                        <TableCell className="text-xs text-zinc-400 capitalize">{item.category?.replace(/_/g, ' ')}</TableCell>
                        <TableCell className="text-xs font-bold text-zinc-300">₹{item.pricing?.basePrice?.toLocaleString()}</TableCell>
                        <TableCell>
                          {item.isVerified ? (
                            <span className="text-xs text-emerald-400 font-semibold">Yes</span>
                          ) : (
                            <span className="text-xs text-zinc-555">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          )}

          {/* Bookings History ledger */}
          <Card className="bg-zinc-950/20 border border-zinc-850/80 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Booking Activity Ledger
            </h3>
            {data.bookings.length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center font-medium">No booking transactions recorded.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>{isProvider ? 'Customer' : 'Provider Business'}</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Total Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bookings.map((bk) => (
                    <TableRow key={bk._id} className="cursor-pointer hover:bg-zinc-900/30" onClick={() => router.push('/bookings?search=' + bk.bookingId)}>
                      <TableCell className="font-mono text-xs text-zinc-400">{bk.bookingId}</TableCell>
                      <TableCell className="text-xs font-semibold text-zinc-300">
                        {isProvider ? bk.customerId?.fullName || 'Consumer Partner' : bk.providerId?.businessName || 'Pilot Business'}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">
                        {new Date(bk.bookingDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-zinc-200">₹{bk.pricing?.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(bk.bookingStatus)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>

      {/* Suspend Modal */}
      <Modal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        title="Confirm Suspension Order"
      >
        <div className="space-y-4 text-xs text-zinc-450 leading-relaxed">
          <p>
            You are placing a suspension on **{data.user.fullName}**. This will lock them out of the platform immediately. 
            Specify an auditable reason for the suspension below.
          </p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Suspension Reason Notes
            </label>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="e.g. Failure to comply with drone licensing verification audit, suspicious transaction activity..."
              rows={4}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 outline-none focus:border-red-500/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSuspendModal(false)}
              className="flex-1 rounded-xl border border-zinc-855 bg-transparent py-2 px-4 text-zinc-400 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={suspending}
              onClick={handleSuspendToggle}
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-400 text-zinc-950 py-2 px-4 font-bold transition-colors"
            >
              {suspending ? 'Applying Block...' : 'Confirm Suspension'}
            </button>
          </div>
        </div>
      </Modal>

      {/* KYC Rejection Modal */}
      <Modal
        isOpen={showKycRejectModal}
        onClose={() => setShowKycRejectModal(false)}
        title="Confirm KYC Rejection"
      >
        <div className="space-y-4 text-xs text-zinc-450 leading-relaxed">
          <p>
            Specify the compliance criteria or document failures leading to the rejection of **{data.user.fullName}**'s KYC application.
          </p>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Compliance Rejection Reason
            </label>
            <textarea
              value={kycRejectionReason}
              onChange={(e) => setKycRejectionReason(e.target.value)}
              placeholder="e.g. Aadhaar image is blurry, PAN card name mismatch, invalid business license document..."
              rows={4}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-955 p-3 text-zinc-200 outline-none focus:border-red-500/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowKycRejectModal(false)}
              className="flex-1 rounded-xl border border-zinc-855 bg-transparent py-2 px-4 text-zinc-400 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={updatingKyc}
              onClick={() => handleKycStatusUpdate('rejected', kycRejectionReason)}
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-400 text-zinc-955 py-2 px-4 font-bold transition-colors"
            >
              {updatingKyc ? 'Updating...' : 'Reject KYC'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
