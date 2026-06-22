'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../../utils/api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../../components/ui/Table';
import { Card } from '../../../../components/ui/Card';
import { Modal } from '../../../../components/ui/Modal';
import { 
  UserPlus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Mail, 
  Phone, 
  ShieldAlert, 
  CheckCircle,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';

interface StaffItem {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Delete states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<StaffItem[]>('/super-admin/staff');
      if (response.success && response.data) {
        setStaff(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sync administrative roster');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!fullName || !email || !password) {
      setActionError('Full name, email, and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post<StaffItem>('/super-admin/staff', {
        fullName,
        email,
        password,
        phone
      });

      if (response.success && response.data) {
        setStaff([...staff, response.data]);
        setRegisterModalOpen(false);
        // Clear fields
        setFullName('');
        setEmail('');
        setPassword('');
        setPhone('');
      } else {
        setActionError(response.message);
      }
    } catch (err: any) {
      setActionError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: StaffItem) => {
    const nextActiveState = !item.isActive;
    try {
      const response = await api.put<StaffItem>(`/super-admin/staff/${item._id}/status`, {
        isActive: nextActiveState
      });

      if (response.success && response.data) {
        setStaff(staff.map(s => s._id === item._id ? { ...s, isActive: nextActiveState } : s));
      }
    } catch (err: any) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      const response = await api.delete<any>(`/super-admin/staff/${selectedStaff._id}`);
      if (response.success) {
        setStaff(staff.filter(s => s._id !== selectedStaff._id));
        setDeleteModalOpen(false);
      } else {
        setActionError(response.message);
      }
    } catch (err: any) {
      setActionError(err.message || 'Deletion failed');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Staff & Sub-Admin Operations</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage administrative staff clearance, register new operations staff, and toggle permissions.</p>
        </div>
        <div>
          <button
            onClick={() => { setRegisterModalOpen(true); setActionError(null); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-zinc-950 px-4 py-2.5 text-xs font-bold transition-all shadow-lg shadow-indigo-500/10"
          >
            <UserPlus className="h-4 w-4" /> Enroll New Staff
          </button>
        </div>
      </div>

      {/* Staff Roster Listing */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            <p className="text-xs text-zinc-400">Loading operations staff...</p>
          </div>
        </div>
      ) : error && !staff.length ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-400">Data Fetching Failed</p>
          <p className="text-xs text-red-300/80 mt-1">{error}</p>
        </div>
      ) : staff.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm font-semibold text-zinc-300">No Operations Staff Registered</p>
          <p className="text-xs text-zinc-500 mt-1">Click the "Enroll New Staff" button above to enroll your first sub-admin.</p>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Work Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Enrolled On</TableHead>
              <TableHead>Clearance Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((s) => (
              <TableRow key={s._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 font-bold text-xs">
                      {s.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">{s.fullName}</p>
                      <span className="inline-flex rounded bg-teal-500/10 border border-teal-500/20 px-1 py-0.2 text-[8px] font-bold text-teal-400 mt-0.5 uppercase tracking-wider">
                        Staff Admin
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-zinc-450 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> {s.email}
                  </span>
                </TableCell>
                <TableCell>
                  {s.phone ? (
                    <span className="text-xs text-zinc-450 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-zinc-500 shrink-0" /> {s.phone}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-600">Not Set</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-zinc-400">
                    {new Date(s.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleToggleStatus(s)}
                    className="flex items-center gap-1.5 focus:outline-none transition-colors"
                  >
                    {s.isActive ? (
                      <>
                        <ToggleRight className="h-6 w-6 text-emerald-400 shrink-0" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-6 w-6 text-zinc-650 shrink-0" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Inactive</span>
                      </>
                    )}
                  </button>
                </TableCell>
                <TableCell className="text-right">
                  <button
                    onClick={() => { setSelectedStaff(s); setDeleteModalOpen(true); setActionError(null); }}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete Staff Account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Enroll Staff Modal */}
      <Modal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        title="Enroll New Operations Staff"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {actionError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Alice Smith"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 px-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alice@dronesetu.com"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+919876543210"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
              Default Security Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950/50 py-2.5 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/50"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-400 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-indigo-500/10 transition-colors"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              ) : (
                'Confirm Enrollment'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Staff Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Revoke clearance authority?"
      >
        {selectedStaff && (
          <div className="space-y-4">
            {actionError && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                {actionError}
              </div>
            )}

            <p className="text-xs text-zinc-400 leading-relaxed">
              Are you sure you want to permanently revoke administrative permissions for **{selectedStaff.fullName}** ({selectedStaff.email})? 
              This will completely delete their access account. This action is **irreversible**.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 rounded-xl border border-zinc-850 bg-transparent py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteStaff}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-red-500 hover:bg-red-400 py-2.5 text-xs font-semibold text-zinc-950 shadow-lg shadow-red-500/10 transition-colors"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                ) : (
                  'Revoke Clearances'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
