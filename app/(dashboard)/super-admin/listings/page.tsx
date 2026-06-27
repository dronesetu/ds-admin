'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { useAuth } from '../../../../context/AuthContext';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Card } from '../../../../components/ui/Card';
import { Modal } from '../../../../components/ui/Modal';
import { 
  Camera, 
  Video, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Search,
  Clapperboard,
  Wheat,
  Map,
  FileCheck
} from 'lucide-react';

interface CertificationItem {
  title: string;
  documentUrl: string;
  verified: boolean;
}

interface KycItem {
  verificationStatus: string;
  aadhaarNumber?: string;
  panNumber?: string;
}

interface ProviderDetails {
  _id: string;
  businessName: string;
  certifications?: CertificationItem[];
  kyc?: KycItem;
}

interface ListingItem {
  _id: string;
  title: string;
  description: string;
  category: string;
  isVerified: boolean;
  pricing: {
    basePrice: number;
    durationMinutes: number;
  };
  providerId?: ProviderDetails;
  createdAt: string;
}

export default function ListingVerifierPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [listings, setListings] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal actions
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<ListingItem[]>('/super-admin/listings');
      if (response.success && response.data) {
        setListings(response.data);
      } else {
        setError(response.message || 'Failed to retrieve listings');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync with listings catalog database');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleOpenInspect = (item: ListingItem) => {
    setSelectedListing(item);
    setActionError(null);
    setInspectModalOpen(true);
  };

  const handleToggleVerification = async (item: ListingItem, nextStatus: boolean) => {
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await api.put<any>(`/super-admin/listings/${item._id}/verify`, {
        isVerified: nextStatus,
      });

      if (response.success) {
        setListings(listings.map(l => l._id === item._id ? { ...l, isVerified: nextStatus } : l));
        if (selectedListing?._id === item._id) {
          setSelectedListing({ ...selectedListing, isVerified: nextStatus });
        }
      } else {
        setActionError(response.message || 'Listing verification adjustment failed');
      }
    } catch (err: any) {
      setActionError(err.message || 'Something went wrong while adjusting verification status');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'aerial_photo':
        return <Camera className="h-4 w-4 text-zinc-400" />;
      case 'videography':
        return <Video className="h-4 w-4 text-zinc-400" />;
      case 'agriculture':
        return <Wheat className="h-4 w-4 text-emerald-500" />;
      case 'mapping':
        return <Map className="h-4 w-4 text-sky-400" />;
      case 'inspection':
        return <Eye className="h-4 w-4 text-zinc-400" />;
      default:
        return <Clapperboard className="h-4 w-4 text-zinc-400" />;
    }
  };

  const filteredListings = listings.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.providerId?.businessName || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesVerified = 
      verifiedFilter === '' ||
      (verifiedFilter === 'verified' && item.isVerified) ||
      (verifiedFilter === 'unverified' && !item.isVerified);

    return matchesSearch && matchesVerified;
  });

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Service Listings Verifier</h2>
          <p className="mt-1.5 text-sm text-zinc-400">Inspect certifications, license compliance, and manage isVerified status tags</p>
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

      {/* Filter Options */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-zinc-900/20 border border-zinc-800/80 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Listing Title or Provider Name..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 py-2 pl-9 pr-4 text-xs text-zinc-200 outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Verification:</span>
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 py-2 px-3 text-xs text-zinc-300 outline-none"
          >
            <option value="">All Listings</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>
        </div>
      </div>

      {/* Grid Cards layout */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-sm text-zinc-500">Syncing listing documents catalog...</p>
          </div>
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="text-center py-16">
          <ShieldCheck className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
          <p className="text-sm font-semibold text-zinc-300">No Listings Found</p>
          <p className="text-xs text-zinc-500 mt-1">There are no operational records matching this filter state.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => (
            <div key={item._id} className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-5 flex flex-col justify-between hover:border-zinc-800 transition-all">
              <div className="space-y-4">
                {/* Header status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-zinc-950/60 px-3 py-1 rounded-full text-[10px] font-semibold text-zinc-300">
                    {getCategoryIcon(item.category)}
                    <span className="capitalize">{item.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <div>
                    {item.isVerified ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-zinc-950 text-zinc-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-850">
                        Pending Verify
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-zinc-200 line-clamp-1">{item.title}</h4>
                  <p className="text-zinc-500 text-[11px] mt-1">Owned by <span className="font-semibold text-zinc-400">{item.providerId?.businessName || 'Pilot Partner'}</span></p>
                  <p className="text-zinc-400 text-xs mt-3 line-clamp-3 leading-relaxed">{item.description}</p>
                </div>
              </div>

              {/* Price detail & Actions footer */}
              <div className="mt-6 pt-4 border-t border-zinc-850/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">Base Price</span>
                  <span className="text-zinc-100 font-bold text-sm">₹{item.pricing?.basePrice?.toLocaleString('en-IN')} <span className="text-[10px] font-medium text-zinc-500">/ {item.pricing?.durationMinutes || 60} mins</span></span>
                </div>
                <div>
                  <button
                    onClick={() => handleOpenInspect(item)}
                    className="rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition-colors"
                  >
                    Inspect Certs
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect and verification Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title="Listing Verification Inspect"
        maxWidth="max-w-lg"
      >
        {selectedListing && (
          <div className="space-y-6 text-xs text-zinc-300">
            {/* Header info */}
            <div className="flex justify-between items-start gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h4 className="text-sm font-bold text-zinc-200">{selectedListing.title}</h4>
                <p className="text-[10px] text-zinc-500 mt-1">Provider: <span className="font-semibold text-zinc-400">{selectedListing.providerId?.businessName}</span></p>
              </div>
              <div>
                {selectedListing.isVerified ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" /> Verified Listing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-zinc-950 text-zinc-500 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-zinc-850">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            {/* Provider document verification checklist */}
            <div className="space-y-3">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <FileCheck className="h-4 w-4" /> Provider Aviation Certifications
              </h5>
              {selectedListing.providerId?.certifications && selectedListing.providerId.certifications.length > 0 ? (
                <div className="space-y-2">
                  {selectedListing.providerId.certifications.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between border border-zinc-850 bg-zinc-950/40 rounded-xl p-3">
                      <div>
                        <p className="font-bold text-zinc-300">{c.title}</p>
                        <span className="text-[9px] text-zinc-500">Status: {c.verified ? 'Verified' : 'Review Required'}</span>
                      </div>
                      <a
                        href={c.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-zinc-400 hover:bg-zinc-900 transition-colors font-medium text-[10px]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> View Doc
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 italic my-2">No pilot certifications registered on this provider profile yet.</p>
              )}
            </div>

            {/* KYC compliance registry checks */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">KYC Status</h5>
              <div className="border border-zinc-850 bg-zinc-950/40 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 font-semibold">Government KYC Compliance Status</p>
                  <p className="text-[10px] text-zinc-500 mt-1 capitalize">Verification: {selectedListing.providerId?.kyc?.verificationStatus || 'unverified'}</p>
                </div>
                <div>
                  {selectedListing.providerId?.kyc?.verificationStatus === 'approved' ? (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </span>
                  ) : (
                    <span className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Pending KYC
                    </span>
                  )}
                </div>
              </div>
            </div>

            {actionError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400">
                {actionError}
              </div>
            )}

            {/* verification toggle switches (For Super Admin) */}
            <div className="flex gap-2 justify-end border-t border-zinc-900 pt-4 mt-6">
              <button
                onClick={() => setInspectModalOpen(false)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-450 hover:bg-zinc-900 transition-colors"
                disabled={isSubmitting}
              >
                Close
              </button>
              {isSuperAdmin && (
                <>
                  {selectedListing.isVerified ? (
                    <button
                      onClick={() => handleToggleVerification(selectedListing, false)}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 font-bold transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Revoke Verification'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleVerification(selectedListing, true)}
                      className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 font-bold transition-all"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : 'Approve & Verify'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
