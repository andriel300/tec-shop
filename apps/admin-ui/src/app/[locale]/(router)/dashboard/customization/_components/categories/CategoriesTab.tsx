'use client';

import { useState, useMemo } from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
  type CreateCategoryData,
  type UpdateCategoryData,
} from '../../../../../../../hooks/useCategories';
import { exportToCSV, categoryColumns } from '../../../../../../../lib/utils/csv-export';
import CategoryTreeItem from './CategoryTreeItem';
import CategoryFormModal from './CategoryFormModal';
import DeleteConfirmModal from '../DeleteConfirmModal';

const flattenAll = (cats: Category[], result: Category[] = []): Category[] => {
  for (const cat of cats) {
    result.push(cat);
    if (cat.children) flattenAll(cat.children, result);
  }
  return result;
};

const CategoriesTab = () => {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const totalCount = useMemo(
    () => (categories ? flattenAll(categories).length : 0),
    [categories]
  );

  const handleCreate = (data: CreateCategoryData | UpdateCategoryData) => {
    createMutation.mutate(data as CreateCategoryData, {
      onSuccess: () => setFormModalOpen(false),
    });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormModalOpen(true);
  };

  const handleUpdate = (data: CreateCategoryData | UpdateCategoryData) => {
    if (!editingCategory) return;
    updateMutation.mutate(
      { id: editingCategory.id, data: data as UpdateCategoryData },
      {
        onSuccess: () => {
          setFormModalOpen(false);
          setEditingCategory(null);
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
    if (!categories?.length) return;
    exportToCSV(
      flattenAll(categories) as unknown as Record<string, unknown>[],
      categoryColumns,
      `categories-export-${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-slate-400 text-sm">
          {totalCount} {totalCount === 1 ? 'category' : 'categories'} total
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            disabled={!categories?.length}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => { setEditingCategory(null); setFormModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Add Category
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-slate-400">Loading categories...</p>
        </div>
      ) : error ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-red-700">
          <p className="text-red-400">Error: {error.message}</p>
        </div>
      ) : !categories?.length ? (
        <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-slate-400 mb-3">No categories yet</p>
          <button
            onClick={() => { setEditingCategory(null); setFormModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3">
          {categories.map((category) => (
            <CategoryTreeItem
              key={category.id}
              category={category}
              level={0}
              onEdit={handleEdit}
              onDelete={(cat) => setDeleteTarget(cat)}
            />
          ))}
        </div>
      )}

      <CategoryFormModal
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingCategory(null); }}
        onSubmit={editingCategory ? handleUpdate : handleCreate}
        isPending={createMutation.isPending || updateMutation.isPending}
        initialData={editingCategory}
        allCategories={categories || []}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || ''}
        itemType="Category"
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};

export default CategoriesTab;
