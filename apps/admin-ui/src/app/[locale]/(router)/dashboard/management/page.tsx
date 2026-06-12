'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import {
  useAdmins,
  useCreateAdmin,
  useDeleteAdmin,
} from '../../../../../hooks/useAdminData';
import type { AdminResponse } from '../../../../../lib/api/admin';

const DeleteAdminModal = ({
  isOpen,
  adminName,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  adminName: string;
  onClose: () => void;
  onConfirm: (confirmPassword: string) => void;
  isLoading: boolean;
}) => {
  const t = useTranslations('Management');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError(t('deleteModalPasswordRequired'));
      return;
    }
    onConfirm(password);
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-semibold mb-2">
          {t('deleteModalTitle')}
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          {t.rich('deleteModalDesc', {
            name: adminName,
            bold: (chunks) => <strong className="text-white">{chunks}</strong>,
          })}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-2">
              {t('deleteModalPasswordLabel')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder={t('deleteModalPasswordPlaceholder')}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded p-3 font-medium disabled:opacity-50"
            >
              {isLoading ? t('deleteModalBtnDeleting') : t('deleteModalBtnDelete')}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
            >
              {t('deleteModalBtnCancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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
  const t = useTranslations('Management');
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
      newErrors.email = t('validationEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('validationEmailInvalid');
    }

    if (!formData.name.trim()) {
      newErrors.name = t('validationNameRequired');
    }

    if (!formData.password) {
      newErrors.password = t('validationPasswordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('validationPasswordTooShort');
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)
    ) {
      newErrors.password = t('validationPasswordWeak');
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validationPasswordMismatch');
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
        <h3 className="text-white text-xl font-semibold mb-4">
          {t('addModalTitle')}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-300 text-sm block mb-2">
              {t('addModalEmailLabel')}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder={t('addModalEmailPlaceholder')}
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">
              {t('addModalNameLabel')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder={t('addModalNamePlaceholder')}
            />
            {errors.name && (
              <p className="text-red-400 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">
              {t('addModalPasswordLabel')}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder={t('addModalPasswordPlaceholder')}
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <div>
            <label className="text-slate-300 text-sm block mb-2">
              {t('addModalConfirmPasswordLabel')}
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600"
              placeholder={t('addModalConfirmPasswordPlaceholder')}
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded p-3 font-medium disabled:opacity-50"
            >
              {isLoading ? t('addModalBtnCreating') : t('addModalBtnCreate')}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
            >
              {t('addModalBtnCancel')}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-slate-700 rounded">
          <p className="text-slate-300 text-xs">
            <strong>{t('passwordReqTitle')}</strong>
          </p>
          <ul className="text-slate-400 text-xs mt-1 ml-4 list-disc">
            <li>{t('passwordReq1')}</li>
            <li>{t('passwordReq2')}</li>
            <li>{t('passwordReq3')}</li>
            <li>{t('passwordReq4')}</li>
            <li>{t('passwordReq5')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const TeamManagementPage = () => {
  const t = useTranslations('Management');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    adminId: string;
    adminName: string;
  }>({ open: false, adminId: '', adminName: '' });

  const { data: admins, isLoading, error } = useAdmins();
  const createAdminMutation = useCreateAdmin();
  const deleteAdminMutation = useDeleteAdmin();

  const handleCreateAdmin = (data: {
    email: string;
    name: string;
    password: string;
  }) => {
    createAdminMutation.mutate(data, {
      onSuccess: () => setAddModalOpen(false),
    });
  };

  const handleDeleteAdmin = (adminId: string, adminName: string) => {
    setDeleteModal({ open: true, adminId, adminName });
  };

  const handleConfirmDelete = (confirmPassword: string) => {
    deleteAdminMutation.mutate(
      { adminId: deleteModal.adminId, confirmPassword },
      {
        onSuccess: () =>
          setDeleteModal({ open: false, adminId: '', adminName: '' }),
      }
    );
  };

  const columns: ColumnDef<AdminResponse>[] = [
    {
      header: t('colName'),
      accessorKey: 'name',
      cell: ({ row }) => (
        <div>
          <div className="text-white font-medium">{row.original.name}</div>
          <div className="text-slate-400 text-xs">{row.original.email}</div>
        </div>
      ),
    },
    {
      header: t('colEmailVerified'),
      accessorKey: 'isEmailVerified',
      cell: ({ getValue }) => (
        <span className={getValue() ? 'text-green-400' : 'text-yellow-400'}>
          {getValue() ? t('emailVerifiedYes') : t('emailVerifiedNo')}
        </span>
      ),
    },
    {
      header: t('colCreated'),
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
      header: t('colLastUpdated'),
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
      header: t('colActions'),
      cell: ({ row }) => {
        const admin = row.original;
        const isLastAdmin = admins?.length === 1;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
              disabled={deleteAdminMutation.isPending || isLastAdmin}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title={isLastAdmin ? t('tooltipCannotDelete') : t('tooltipDelete')}
            >
              {t('actionDelete')}
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
          <h1 className="text-white text-3xl font-semibold">{t('pageTitle')}</h1>
          <p className="text-slate-400 mt-1">{t('pageSubtitle')}</p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded font-medium"
        >
          {t('addAdmin')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-2">{t('statTotalAdmins')}</div>
          <div className="text-white text-3xl font-semibold">
            {admins?.length || 0}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-2">{t('statVerifiedAdmins')}</div>
          <div className="text-white text-3xl font-semibold">
            {admins?.filter((a) => a.isEmailVerified).length || 0}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-6">
          <div className="text-slate-400 text-sm mb-2">{t('statActiveSessions')}</div>
          <div className="text-white text-3xl font-semibold">
            {admins?.length || 0}
          </div>
        </div>
      </div>

      {/* Admin Table */}
      {isLoading ? (
        <div className="text-white text-center py-8">{t('loading')}</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">
          {t('errorLoading', { message: error.message })}
        </div>
      ) : (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-white text-xl font-semibold mb-4">
            {t('sectionTitle')}
          </h2>

          {admins && admins.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              {t('emptyState')}
            </div>
          ) : (
            <div className="rounded-lg shadow-xl overflow-hidden border border-slate-700">
              <table className="min-w-full text-sm text-white">
                <thead className="bg-slate-900 text-slate-300">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} className="p-3 text-left">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {admins && admins.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded">
              <p className="text-yellow-400 text-sm">
                {t.rich('warningText', {
                  bold: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
            </div>
          )}
        </div>
      )}

      <AddAdminModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateAdmin}
        isLoading={createAdminMutation.isPending}
      />

      <DeleteAdminModal
        isOpen={deleteModal.open}
        adminName={deleteModal.adminName}
        onClose={() => setDeleteModal({ open: false, adminId: '', adminName: '' })}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAdminMutation.isPending}
      />
    </div>
  );
};

export default TeamManagementPage;
