'use client';

import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  useHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
} from '../../../../../../../hooks/useLayout';
import type { HeroSlide, CreateHeroSlideData, UpdateHeroSlideData } from '../../../../../../../lib/api/layout';
import HeroSlideFormModal from './HeroSlideFormModal';
import DeleteConfirmModal from '../DeleteConfirmModal';

const HeroSlidesTab = () => {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HeroSlide | null>(null);

  const { data: slides, isLoading, error } = useHeroSlides();
  const createMutation = useCreateHeroSlide();
  const updateMutation = useUpdateHeroSlide();
  const deleteMutation = useDeleteHeroSlide();

  const sortedSlides = useMemo(
    () => [...slides].sort((a, b) => a.order - b.order),
    [slides]
  );

  const handleCreate = (data: CreateHeroSlideData | UpdateHeroSlideData) => {
    createMutation.mutate(data as CreateHeroSlideData, {
      onSuccess: () => setFormModalOpen(false),
    });
  };

  const handleEdit = (slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormModalOpen(true);
  };

  const handleUpdate = (data: CreateHeroSlideData | UpdateHeroSlideData) => {
    if (!editingSlide) return;
    updateMutation.mutate(
      { id: editingSlide.id, data: data as UpdateHeroSlideData },
      {
        onSuccess: () => {
          setFormModalOpen(false);
          setEditingSlide(null);
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

  const columns: ColumnDef<HeroSlide>[] = [
    {
      header: 'Order',
      accessorKey: 'order',
      cell: ({ row }) => (
        <span className="text-slate-400 text-sm font-mono">#{row.original.order}</span>
      ),
    },
    {
      header: 'Slide',
      accessorKey: 'title',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img
            src={row.original.imageUrl}
            alt={row.original.title}
            className="w-16 h-12 rounded object-cover bg-slate-700"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
              (e.target as HTMLImageElement).className = 'w-16 h-12 rounded bg-slate-600';
            }}
          />
          <div>
            <div className="text-white font-medium">{row.original.title}</div>
            {row.original.subtitle && (
              <div className="text-slate-500 text-xs line-clamp-1">{row.original.subtitle}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      header: 'Action',
      cell: ({ row }) => (
        <span className="text-slate-400 text-sm">
          {row.original.actionUrl ? (
            <span>
              {row.original.actionLabel || 'Link'} &rarr;{' '}
              <span className="text-slate-500">{row.original.actionUrl}</span>
            </span>
          ) : '-'}
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
        const slide = row.original;
        return (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(slide)} className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-sm">
              Edit
            </button>
            <button onClick={() => setDeleteTarget(slide)} className="text-red-400 hover:text-red-300 px-2 py-1 rounded text-sm">
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({ data: sortedSlides, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-slate-400 text-sm">
          {slides.length} {slides.length === 1 ? 'slide' : 'slides'} total
        </div>
        <button
          onClick={() => { setEditingSlide(null); setFormModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          + Add Slide
        </button>
      </div>

      {isLoading ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-slate-400">Loading hero slides...</p>
        </div>
      ) : error ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-red-700">
          <p className="text-red-400">Error: {error.message}</p>
        </div>
      ) : !slides.length ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 mb-3">No hero slides yet</p>
          <p className="text-slate-500 text-sm mb-4">Add slides to create an engaging carousel on the homepage</p>
          <button
            onClick={() => { setEditingSlide(null); setFormModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Create Your First Slide
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

      <HeroSlideFormModal
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingSlide(null); }}
        onSubmit={editingSlide ? handleUpdate : handleCreate}
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingSlide}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.title || ''}
        itemType="Hero Slide"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default HeroSlidesTab;
