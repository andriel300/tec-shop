'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useUsers, useBanUser, useUnbanUser } from '../../../hooks/useAdminData';
import type { UserResponse } from '../../../lib/api/admin';

// Modal Component for Ban Confirmation
const BanModal = ({
  isOpen,
  onClose,
  onConfirm,
  userName,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, duration: number) => void;
  userName: string;
}) => {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert('Please provide a reason for banning');
      return;
    }
    onConfirm(reason, duration);
    setReason('');
    setDuration(0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-semibold mb-4">Ban User: {userName}</h3>

        <div className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-2">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              rows={3}
              placeholder="Enter reason for banning this user..."
            />
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">Duration (days)</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder="0 = permanent ban"
              min="0"
            />
            <p className="text-slate-400 text-xs mt-1">Leave as 0 for permanent ban</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded p-3 font-medium"
          >
            Ban User
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'CUSTOMER' | 'SELLER' | 'ADMIN' | ''>('');
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'BANNED' | ''>('');
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  // API hooks
  const { data, isLoading, error } = useUsers({
    page,
    limit,
    search: search || undefined,
    userType: userTypeFilter || undefined,
    status: statusFilter || undefined,
  });

  const banUserMutation = useBanUser();
  const unbanUserMutation = useUnbanUser();

  // Handle ban user
  const handleBan = (user: UserResponse) => {
    setSelectedUser(user);
    setBanModalOpen(true);
  };

  const confirmBan = (reason: string, duration: number) => {
    if (!selectedUser) return;

    banUserMutation.mutate(
      { userId: selectedUser.id, data: { reason, duration } },
      {
        onSuccess: () => {
          setBanModalOpen(false);
          setSelectedUser(null);
        },
      }
    );
  };

  // Handle unban user
  const handleUnban = (userId: string) => {
    if (confirm('Are you sure you want to unban this user?')) {
      unbanUserMutation.mutate(userId);
    }
  };

  // Table columns
  const columns: ColumnDef<UserResponse>[] = [
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
      header: 'Type',
      accessorKey: 'userType',
      cell: ({ getValue }) => {
        const value = getValue() as string;
        const colors = {
          CUSTOMER: 'bg-blue-600',
          SELLER: 'bg-purple-600',
          ADMIN: 'bg-orange-600',
        };
        return (
          <span className={`${colors[value as keyof typeof colors]} text-white px-2 py-1 rounded text-xs font-medium`}>
            {value}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'isBanned',
      cell: ({ row }) => {
        const isBanned = row.original.isBanned;
        return (
          <div>
            <span className={`${isBanned ? 'text-red-400' : 'text-green-400'} font-medium text-sm`}>
              {isBanned ? 'Banned' : 'Active'}
            </span>
            {isBanned && row.original.bannedUntil && (
              <div className="text-slate-400 text-xs mt-1">
                Until: {new Date(row.original.bannedUntil).toLocaleDateString()}
              </div>
            )}
          </div>
        );
      },
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
      header: 'Joined',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString(),
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const user = row.original;
        const canBan = user.userType !== 'ADMIN' && !user.isBanned;
        const canUnban = user.isBanned;

        return (
          <div className="flex gap-2">
            {canBan && (
              <button
                onClick={() => handleBan(user)}
                disabled={banUserMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Ban
              </button>
            )}
            {canUnban && (
              <button
                onClick={() => handleUnban(user.id)}
                disabled={unbanUserMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Unban
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-3xl font-semibold">User Management</h1>
        <p className="text-slate-400 mt-1">Manage all users, customers, sellers, and admins</p>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-700 text-white rounded p-3 border border-slate-600"
          />

          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value as typeof userTypeFilter)}
            className="bg-slate-700 text-white rounded p-3 border border-slate-600"
          >
            <option value="">All User Types</option>
            <option value="CUSTOMER">Customers</option>
            <option value="SELLER">Sellers</option>
            <option value="ADMIN">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="bg-slate-700 text-white rounded p-3 border border-slate-600"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="BANNED">Banned</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setUserTypeFilter('');
              setStatusFilter('');
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded p-3"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-white text-center py-8">Loading users...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">Error loading users: {error.message}</div>
      ) : (
        <>
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
                    className="border-t border-slate-600 hover:bg-slate-800 transition"
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

          {/* Pagination */}
          {data?.pagination && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-slate-400">
                Showing {data.data.length} of {data.pagination.total} users
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-white px-4 py-2">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                  disabled={page === data.pagination.totalPages}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Ban Modal */}
      <BanModal
        isOpen={banModalOpen}
        onClose={() => {
          setBanModalOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={confirmBan}
        userName={selectedUser?.name || ''}
      />
    </div>
  );
};

export default UsersPage;
