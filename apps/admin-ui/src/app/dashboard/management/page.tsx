'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useAdmins, useCreateAdmin, useDeleteAdmin } from '../../../hooks/useAdminData';
import type { AdminResponse } from '../../../lib/api/admin';

// Modal Component for Adding New Admin
const AddAdminModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; name: string; password: string }) => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        email: formData.email,
        name: formData.name,
        password: formData.password,
      });
      setFormData({ email: '', name: '', password: '', confirmPassword: '' });
      setErrors({});
    }
  };

  const handleClose = () => {
    setFormData({ email: '', name: '', password: '', confirmPassword: '' });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-semibold mb-4">Add New Admin</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder="admin@tec-shop.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder="John Doe"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">Password *</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder="Min 8 chars, uppercase, lowercase, number, special char"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">Confirm Password *</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder="Re-enter password"
            />
            {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded p-3 font-medium disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Admin'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-slate-700 rounded">
          <p className="text-slate-300 text-xs">
            <strong>Password Requirements:</strong>
          </p>
          <ul className="text-slate-400 text-xs mt-1 ml-4 list-disc">
            <li>At least 8 characters long</li>
            <li>Contains uppercase letter (A-Z)</li>
            <li>Contains lowercase letter (a-z)</li>
            <li>Contains number (0-9)</li>
            <li>Contains special character (@$!%*?&)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const TeamManagementPage = () => {
  const [addModalOpen, setAddModalOpen] = useState(false);

  // API hooks
  const { data: admins, isLoading, error } = useAdmins();
  const createAdminMutation = useCreateAdmin();
  const deleteAdminMutation = useDeleteAdmin();

  // Handle create admin
  const handleCreateAdmin = (data: { email: string; name: string; password: string }) => {
    createAdminMutation.mutate(data, {
      onSuccess: () => {
        setAddModalOpen(false);
      },
    });
  };

  // Handle delete admin
  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    if (confirm(`Are you sure you want to delete admin "${adminName}"? This action cannot be undone.`)) {
      deleteAdminMutation.mutate(adminId);
    }
  };

  // Table columns
  const columns: ColumnDef<AdminResponse>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="text-white font-medium">{row.original.name}</div>
          <div className="text-slate-400 text-xs">{row.original.email}</div>
        </div>
      ),
    },
    {
      header: 'Email Verified',
      accessorKey: 'isEmailVerified',
      cell: ({ getValue }) => (
        <span className={getValue() ? 'text-green-400' : 'text-yellow-400'}>
          {getValue() ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string);
        return (
          <div>
            <div className="text-white">{date.toLocaleDateString()}</div>
            <div className="text-slate-400 text-xs">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      header: 'Last Updated',
      accessorKey: 'updatedAt',
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string);
        return (
          <div>
            <div className="text-white">{date.toLocaleDateString()}</div>
            <div className="text-slate-400 text-xs">{date.toLocaleTimeString()}</div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const admin = row.original;
        const isLastAdmin = admins?.length === 1;

        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
              disabled={deleteAdminMutation.isPending || isLastAdmin}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={isLastAdmin ? 'Cannot delete the last admin' : 'Delete admin'}
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: admins || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-white text-3xl font-semibold">Team Management</h1>
          <p className="text-slate-400 mt-1">Manage admin team members and access control</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium"
        >
          + Add New Admin
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-2">Total Admins</div>
          <div className="text-white text-3xl font-semibold">{admins?.length || 0}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-2">Verified Admins</div>
          <div className="text-white text-3xl font-semibold">
            {admins?.filter((a) => a.isEmailVerified).length || 0}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-2">Active Sessions</div>
          <div className="text-white text-3xl font-semibold">{admins?.length || 0}</div>
        </div>
      </div>

      {/* Admin Table */}
      {isLoading ? (
        <div className="text-white text-center py-8">Loading admins...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">Error loading admins: {error.message}</div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-white text-xl font-semibold mb-4">Admin Team Members</h2>

          {admins && admins.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              No admin users found. Add your first admin to get started.
            </div>
          ) : (
            <div className="rounded-lg shadow-xl overflow-hidden border border-slate-700">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-slate-900 text-slate-300">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-3 text-left">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-transparent">
                  {table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-t border-slate-600 hover:bg-slate-700 transition"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="p-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Warning Message */}
          {admins && admins.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded">
              <p className="text-yellow-400 text-sm">
                <strong>Important:</strong> You cannot delete the last admin user. At least one admin must exist at all times for security reasons.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Admin Modal */}
      <AddAdminModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateAdmin}
        isLoading={createAdminMutation.isPending}
      />
    </div>
  );
};

export default TeamManagementPage;
