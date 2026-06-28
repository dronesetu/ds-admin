"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../utils/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { 
  Search, 
  Filter, 
  UserCheck, 
  UserMinus, 
  RotateCcw, 
  Eye, 
  ShieldAlert, 
  Calendar,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface UserItem {
  _id?: string;
  id: string;
  fullName?: string;
  name?: string; // fallback for admin mock
  email: string;
  role: 'super_admin' | 'admin' | 'provider' | 'consumer';
  phone?: string;
  isSuspended?: boolean;
  isBlocked?: boolean;
  suspensionReason?: string;
  registeredAt?: string;
  createdAt?: string;
}

export default function UsersPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const router = useRouter();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Action/Modal states
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [providerDetails, setProviderDetails] = useState<any>(null);
  
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isSuperAdmin) {
        // Super Admin query with pagination, search and filters
        const params: any = {
          page: page.toString(),
          limit: limit.toString(),
        };
        if (roleFilter) params.role = roleFilter;
        if (search) params.search = search;

        const response = await api.get<any>('/super-admin/users', { params });
        if (response.success && response.data) {
          setUsers(response.data.users || []);
          setTotal(response.data.total || 0);
        } else {
          setError(response.message);
        }
      } else {
        // Standard Admin mock roster
        const response = await api.get<UserItem[]>('/admin/users');
        if (response.success && response.data) {
          setUsers(response.data);
          setTotal(response.data.length);
        } else {
          setError(response.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, isSuperAdmin]); // Refetch on query changes (debounce search manually via keydown or button click)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleViewDetails = async (targetUser: UserItem) => {
    setSelectedUser(targetUser);
    setDetailModalOpen(true);
    setProviderDetails(null);

    const targetId = targetUser._id || targetUser.id;
    if (isSuperAdmin && targetUser.role === 'provider') {
      try {
        const response = await api.get<any>(`/super-admin/users/${targetId}`);
        if (response.success && response.data?.providerProfile) {
          setProviderDetails(response.data.providerProfile);
        }
      } catch (err) {
        console.error('Failed to load detailed provider profile details:', err);
      }
    }
  };

  const handleSuspendToggle = async () => {
    if (!selectedUser) return;
    const targetId = selectedUser._id || selectedUser.id;
    const shouldSuspend = !selectedUser.isSuspended;

    if (shouldSuspend && !suspensionReason.trim()) {
      setError('Please provide a reason for suspension.');
      return;
    }

    setIsSuspending(true);
    try {
      const response = await api.put<any>(`/super-admin/users/${targetId}/suspend`, {
        isSuspended: shouldSuspend,
        reason: suspensionReason,
      });

      if (response.success) {
        setSuspendModalOpen(false);
        setSuspensionReason('');
        
        // Update user state locally
        setUsers(users.map(u => (u._id === targetId || u.id === targetId) ? { 
          ...u, 
          isSuspended: shouldSuspend, 
          suspensionReason: shouldSuspend ? suspensionReason : '' 
        } : u));

        if (selectedUser) {
          setSelectedUser({
            ...selectedUser,
            isSuspended: shouldSuspend,
            suspensionReason: shouldSuspend ? suspensionReason : '',
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update user suspension status');
    } finally {
      setIsSuspending(false);
    }
  };

  const handleForceResetPassword = async () => {
    if (!selectedUser) return;
    const targetId = selectedUser._id || selectedUser.id;

    setIsResetting(true);
    setTempPassword(null);
    try {
      const response = await api.post<any>(`/super-admin/users/${targetId}/reset-password`);
      if (response.success && response.data?.tempPassword) {
        setTempPassword(response.data.tempPassword);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  const getUserDisplayName = (u: UserItem) => {
    return u.fullName || u.name || 'Unnamed User';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-400">Super Admin</span>;
      case 'admin':
        return <span className="rounded bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 text-[10px] font-medium text-teal-400">Staff Admin</span>;
      case 'provider':
        return <span className="rounded bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-400">Drone Provider</span>;
      default:
        return <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-medium text-zinc-400">Customer</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">User Account Management</h1>
        <p className="text-sm text-zinc-400 mt-1">Review profiles, manage authorizations, and control credentials.</p>
      </div>

      {/* Filters and Search Bar */}
      <Card className="flex flex-col md:flex-row gap-4 justify-between items-center bg-zinc-950/20">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts by name or email..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-emerald-500/50"
          />
        </form>

        <div className="flex gap-3 w-full md:w-auto shrink-0 justify-end">
          {/* Role Filter */}
          <div className="relative flex items-center gap-2 rounded-xl border border-zinc-850 bg-zinc-900/30 px-3 py-2 text-xs text-zinc-400">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-zinc-300 outline-none pr-4 cursor-pointer text-xs font-semibold"
            >
              <option value="">All Roles</option>
              <option value="consumer">Customers</option>
              <option value="provider">Drone Providers</option>
              <option value="admin">Staff Admins</option>
              {isSuperAdmin && <option value="super_admin">Super Admins</option>}
            </select>
          </div>
          <button
            onClick={() => { setSearch(''); setRoleFilter(''); setPage(1); fetchUsers(); }}
            className="rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900 p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Reset Filters"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Roster Listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-400">Loading user roster...</p>
          </div>
        </div>
      ) : error && !users.length ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-400">Error Loading Accounts</p>
          <p className="text-xs text-red-300/80 mt-1">{error}</p>
        </div>
      ) : users.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-zinc-300">No User Accounts Found</p>
          <p className="text-xs text-zinc-500 mt-1">Try relaxing search constraints or role filters.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Profile</TableHead>
                <TableHead>System Authority</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Safety Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSuspended = u.isSuspended || u.isBlocked;
                const userId = u._id || u.id;
                return (
                  <TableRow 
                    key={userId}
                    className="cursor-pointer hover:bg-zinc-900/40"
                    onClick={() => router.push(`/users/${userId}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 shrink-0 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center font-bold text-xs text-zinc-400">
                          {getUserDisplayName(u).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-200">{getUserDisplayName(u)}</p>
                          <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(u.role)}</TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0 text-zinc-500" /> {u.email}
                        </p>
                        {u.phone && (
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0 text-zinc-500" /> {u.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-zinc-550" />
                        {new Date(u.createdAt || u.registeredAt || '').toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-400">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                          Active
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/users/${userId}`)}
                        className="inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-colors"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination (Super Admin Only) */}
          {isSuperAdmin && total > limit && (
            <div className="flex items-center justify-between border-t border-zinc-900 pt-4 text-xs font-semibold text-zinc-400">
              <p>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} accounts</p>
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

      {/* Account Details Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Account Profile Inspection"
        maxWidth="max-w-xl"
      >
        {selectedUser && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-4 border-b border-zinc-800 pb-4">
              <div className="h-12 w-12 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center font-bold text-lg text-emerald-400 shadow-inner">
                {getUserDisplayName(selectedUser).charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-md font-bold text-zinc-200">{getUserDisplayName(selectedUser)}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {getRoleBadge(selectedUser.role)}
                  {selectedUser.isSuspended && (
                    <span className="rounded bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-red-400">
                      Suspended Profile
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-zinc-500">Email Address</p>
                <p className="font-semibold text-zinc-300 mt-1">{selectedUser.email}</p>
              </div>
              <div>
                <p className="text-zinc-500">Phone</p>
                <p className="font-semibold text-zinc-300 mt-1">{selectedUser.phone || 'Not Provided'}</p>
              </div>
              <div>
                <p className="text-zinc-500">Account ID</p>
                <p className="font-mono text-zinc-400 mt-1 text-[11px] select-all">{selectedUser._id || selectedUser.id}</p>
              </div>
              <div>
                <p className="text-zinc-500">Creation Date</p>
                <p className="font-semibold text-zinc-300 mt-1">
                  {new Date(selectedUser.createdAt || selectedUser.registeredAt || '').toLocaleString()}
                </p>
              </div>
            </div>

            {/* Suspension Reason Display */}
            {selectedUser.isSuspended && selectedUser.suspensionReason && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs">
                <p className="font-semibold text-red-400 flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  Active Suspension Order
                </p>
                <p className="text-zinc-300 leading-normal">{selectedUser.suspensionReason}</p>
              </div>
            )}

            {/* Provider Details View */}
            {selectedUser.role === 'provider' && providerDetails && (
              <div className="border-t border-zinc-800 pt-4 space-y-4">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Provider Service Settings</h5>
                <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950/30 rounded-xl border border-zinc-900 p-4">
                  <div>
                    <p className="text-zinc-500">Business Name</p>
                    <p className="font-semibold text-zinc-300 mt-1">{providerDetails.businessName || 'Not Set'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">KYC Status</p>
                    <p className="font-semibold text-zinc-300 mt-1 capitalize">{providerDetails.kyc?.verificationStatus || 'Pending'}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Platform Wallet Balance</p>
                    <p className="font-semibold text-zinc-300 mt-1 text-emerald-400">
                      ₹{providerDetails.wallet?.availableBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Service Coverage</p>
                    <p className="font-semibold text-zinc-300 mt-1">{providerDetails.serviceRadiusKm ? `${providerDetails.serviceRadiusKm} km` : 'Not Set'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Governance Actions (Super Admin Only) */}
            {isSuperAdmin && (
              <div className="border-t border-zinc-800 pt-4 flex justify-between gap-3">
                <button
                  onClick={() => { setSuspendModalOpen(true); setDetailModalOpen(false); }}
                  className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold border transition-all ${
                    selectedUser.isSuspended
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
                >
                  {selectedUser.isSuspended ? (
                    <>
                      <UserCheck className="h-4 w-4" /> Lift Suspension
                    </>
                  ) : (
                    <>
                      <UserMinus className="h-4 w-4" /> Impose Suspension
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setResetModalOpen(true); setTempPassword(null); setDetailModalOpen(false); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-300 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" /> Reset Password
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Suspension Trigger Modal */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title={selectedUser?.isSuspended ? "Confirm Un-suspension" : "Confirm Suspension Order"}
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              {selectedUser.isSuspended 
                ? `You are about to lift the suspension for ${getUserDisplayName(selectedUser)}. Their account access will be immediately restored.`
                : `You are placing a suspension on ${getUserDisplayName(selectedUser)}. They will be locked out of the mobile app instantly and their ongoing orders will require resolution.`
              }
            </p>

            {!selectedUser.isSuspended && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Reason for Suspension
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g., Regulatory document failure, reported user misbehavior, payment fraud..."
                  rows={4}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuspendModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSuspending}
                onClick={handleSuspendToggle}
                className={`flex-1 inline-flex items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-zinc-950 transition-all ${
                  selectedUser.isSuspended
                    ? 'bg-emerald-500 hover:bg-emerald-400'
                    : 'bg-red-500 hover:bg-red-400 shadow-lg shadow-red-500/10'
                }`}
              >
                {isSuspending ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  selectedUser.isSuspended ? 'Confirm Restore' : 'Confirm Block'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Force Reset Password Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Credential Overwrite Confirmation"
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to force-reset the password for **{getUserDisplayName(selectedUser)}**? 
              This will overwrite their existing password and generate a temporary one.
            </p>

            {tempPassword ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                <p className="text-xs font-semibold text-emerald-400 flex items-center justify-center gap-1.5 mb-2">
                  <CheckCircle className="h-4 w-4" /> Password Generated Successfully
                </p>
                <div className="rounded-lg bg-zinc-950/80 border border-zinc-800 p-3 font-mono text-md font-bold text-zinc-100 select-all tracking-wider">
                  {tempPassword}
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  Please securely communicate this temporary password to the user. They will be required to change it on their next login.
                </p>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isResetting}
                  onClick={handleForceResetPassword}
                  className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 py-2.5 text-xs font-semibold text-zinc-950 transition-all shadow-lg shadow-indigo-500/10"
                >
                  {isResetting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                  ) : (
                    'Confirm Reset'
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
