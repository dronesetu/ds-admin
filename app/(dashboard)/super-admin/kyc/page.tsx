'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Card } from '../../../../components/ui/Card';
import { Modal } from '../../../../components/ui/Modal';
import { 
  ShieldCheck, 
  User, 
  FileText, 
  ExternalLink, 
  Check, 
  X, 
  AlertTriangle,
  FileCheck,
  Search
} from 'lucide-react';

interface KycProviderItem {
  _id: string;
  businessName: string;
  businessDescription?: string;
  userId?: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
  };
  kyc: {
    aadhaarNumber: string;
    panNumber: string;
    businessLicense: string;
    verificationStatus: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string | null;
  };
  certifications?: Array<{
    title: string;
    documentUrl: string;
    verified: boolean;
  }>;
}

export default function KycPage() {
  const [providers, setProviders] = useState<KycProviderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search filter
  const [search, setSearch] = useState('');

  // Modal & action states
  const [selectedProvider, setSelectedProvider] = useState<KycProviderItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPendingProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<KycProviderItem[]>('/super-admin/providers/pending-kyc');
      if (response.success && response.data) {
        setProviders(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync pending KYC credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const handleOpenReview = (prov: KycProviderItem) => {
    setSelectedProvider(prov);
    setRejectMode(false);
    setRejectionReason('');
    setActionError(null);
    setReviewModalOpen(true);
  };

  const handleVerifyStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedProvider) return;
    setActionError(null);

    if (status === 'rejected' && !rejectionReason.trim()) {
      setActionError('Please enter a rejection reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put<any>(`/super-admin/providers/${selectedProvider._id}/kyc`, {
        status,
        reason: status === 'rejected' ? rejectionReason : undefined
      });

      if (response.success) {
        // Remove from list
        setProviders(providers.filter(p => p._id !== selectedProvider._id));
        setReviewModalOpen(false);
      } else {
        setActionError(response.message);
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to submit validation status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOwnerName = (p: KycProviderItem) => {
    return p.userId?.fullName || 'Not Synced';
  };

  const getOwnerEmail = (p: KycProviderItem) => {
    return p.userId?.email || 'N/A';
  };

  const filteredProviders = providers.filter(p => {
    const text = (p.businessName || '' + getOwnerName(p) + getOwnerEmail(p)).toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">KYC Compliance & Verification</h1>
        <p className="text-sm text-zinc-400 mt-1">Review legal certifications, national IDs, and business licenses for pending provider enrollments.</p>
      </div>

      {/* Filter and stats */}
      <Card className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-950/20">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider business..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-550 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="text-xs text-zinc-400 font-semibold bg-zinc-900/60 border border-zinc-800 px-4 py-2 rounded-xl">
          Pending Verification Cases: <span className="text-emerald-400 font-bold ml-1">{providers.length}</span>
        </div>
      </Card>

      {/* Table grid */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-400">Loading KYC files...</p>
          </div>
        </div>
      ) : error && !providers.length ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-400">Data Synchronization Failed</p>
          <p className="text-xs text-red-300/80 mt-1">{error}</p>
        </div>
      ) : filteredProviders.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-zinc-300">All Clear</p>
          <p className="text-xs text-zinc-500 mt-1">There are no pending provider verification requests at this moment.</p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business details</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Aadhaar / National ID</TableHead>
              <TableHead>PAN Card</TableHead>
              <TableHead>Business License</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.map((p) => (
              <TableRow key={p._id}>
                <TableCell>
                  <p className="text-xs font-semibold text-zinc-200">{p.businessName}</p>
                  <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{p.businessDescription || 'No description'}</p>
                </TableCell>
                <TableCell>
                  <p className="text-xs font-semibold text-zinc-300">{getOwnerName(p)}</p>
                  <p className="text-[10px] text-zinc-500">{getOwnerEmail(p)}</p>
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">{p.kyc.aadhaarNumber}</TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">{p.kyc.panNumber}</TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">{p.kyc.businessLicense}</TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => handleOpenReview(p)}
                    className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  >
                    Review Files
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title="KYC Document Review Panel"
        maxWidth="max-w-xl"
      >
        {selectedProvider && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
              <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-emerald-400 font-bold">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-md font-bold text-zinc-200">{selectedProvider.businessName}</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5">Owned by {getOwnerName(selectedProvider)} ({getOwnerEmail(selectedProvider)})</p>
              </div>
            </div>

            {/* General Description */}
            {selectedProvider.businessDescription && (
              <div className="text-xs">
                <p className="text-zinc-500 mb-1">Company Bio / Description</p>
                <p className="text-zinc-300 leading-relaxed font-medium">{selectedProvider.businessDescription}</p>
              </div>
            )}

            {/* Credentials Fields */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Government Registry IDs</h5>
              <div className="grid grid-cols-3 gap-3 bg-zinc-950/40 rounded-xl border border-zinc-900 p-4">
                <div>
                  <p className="text-[10px] text-zinc-500">Aadhaar (UIDAI)</p>
                  <p className="font-mono text-xs font-bold text-zinc-300 mt-1">{selectedProvider.kyc.aadhaarNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">PAN Card (Income Tax)</p>
                  <p className="font-mono text-xs font-bold text-zinc-300 mt-1">{selectedProvider.kyc.panNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500">Business License No</p>
                  <p className="font-mono text-xs font-bold text-zinc-300 mt-1">{selectedProvider.kyc.businessLicense}</p>
                </div>
              </div>
            </div>

            {/* Certifications documents checklist */}
            {selectedProvider.certifications && selectedProvider.certifications.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Aviation Certifications</h5>
                <div className="space-y-2">
                  {selectedProvider.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 text-xs">
                      <div>
                        <p className="font-semibold text-zinc-300">{cert.title}</p>
                        <span className="text-[9px] text-zinc-500">Status: Unverified</span>
                      </div>
                      <a
                        href={cert.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors font-medium text-[11px]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Doc
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error notifications */}
            {actionError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {actionError}
              </div>
            )}

            {/* Actions Form */}
            {rejectMode ? (
              <div className="space-y-4 border-t border-zinc-800 pt-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-500 text-red-400">KYC Rejection Details</h5>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Describe Rejection Reason (sent to provider)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g., PAN card image is blurry, Aadhaar card number is invalid, business license expired..."
                    rows={4}
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-100 placeholder-zinc-650 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setRejectMode(false)}
                    className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleVerifyStatus('rejected')}
                    className="flex-1 inline-flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-400 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-red-500/10 transition-colors animate-fade-in"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                    ) : (
                      'Confirm Rejection'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-zinc-800 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <X className="h-4 w-4" /> Reject Credentials
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleVerifyStatus('approved')}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-emerald-500/10 transition-colors"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Approve & Enlist
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
