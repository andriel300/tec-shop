'use client';

import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  type Brand,
  type CreateBrandData,
  type UpdateBrandData,
} from '../../../../../../../hooks/useBrands';
import { exportToCSV, brandColumns } from '../../../../../../../lib/utils/csv-export';
import BrandFormModal from './BrandFormModal';
import DeleteConfirmModal from '../DeleteConfirmModal';

const BrandsTab = () => {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);

  const { data: brands, isLoading, error } = useBrands();
  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand();
  const deleteMutation = useDeleteBrand();

  const handleCreate = (data: CreateBrandData | UpdateBrandData) => {
    createMutation.mutate(data as CreateBrandData, {
      onSuccess: () => setFormModalOpen(false),
    });
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormModalOpen(true);
  };

  const handleUpdate = (data: CreateBrandData | UpdateBrandData) => {
    if (!editingBrand) return;
    updateMutation.mutate(
      { id: editingBrand.id, data: data as UpdateBrandData },
      {
        onSuccess: () => {
          setFormModalOpen(false);
          setEditingBrand(null);
        },
      }
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleExport = () => {
    if (!brands?.length) return;
    exportToCSV(
      brands as unknown as Record<string, unknown>[],
      brandColumns,
      `brands-export-${new Date().toISOString().split('T')[0]}`
    );
  };

  const columns: ColumnDef<Brand>[] = [
    {
      header: 'Brand',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.logo ? (
            <img
              src={row.original.logo}
              alt={row.original.name}
              className="w-8 h-8 rounded object-contain bg-white p-0.5"
            />
          ) : (
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
              {row.original.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-white font-medium">{row.original.name}</div>
            <div className="text-slate-500 text-xs">/{row.original.slug}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Description',
      accessorKey: 'description',
      cell: ({ getValue }) => (
        <span className="text-slate-300 text-sm line-clamp-1">
          {(getValue() as string) || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.original.isActive
              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
              : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const brand = row.original;
        return (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(brand)} className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-sm">
              Edit
            </button>
            <button onClick={() => setDeleteTarget(brand)} className="text-red-400 hover:text-red-300 px-2 py-1 rounded text-sm">
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({ data: brands || [], columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-slate-400 text-sm">
          {brands?.length || 0} {(brands?.length || 0) === 1 ? 'brand' : 'brands'} total
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={!brands?.length}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => { setEditingBrand(null); setFormModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Add Brand
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-slate-400">Loading brands...</p>
        </div>
      ) : error ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-red-700">
          <p className="text-red-400">Error: {error.message}</p>
        </div>
      ) : !brands?.length ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <p className="text-slate-400 mb-3">No brands yet</p>
          <button
            onClick={() => { setEditingBrand(null); setFormModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Create Your First Brand
          </button>
        </div>
      ) : (
        <div className="rounded-lg shadow-xl overflow-hidden border border-slate-700">
          <table className="min-w-full text-sm text-white">
            <thead className="bg-slate-900 text-slate-300">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="p-3 text-left font-medium">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-transparent">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-700 hover:bg-slate-800/50 transition">
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

      <BrandFormModal
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingBrand(null); }}
        onSubmit={editingBrand ? handleUpdate : handleCreate}
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingBrand}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || ''}
        itemType="Brand"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default BrandsTab;
