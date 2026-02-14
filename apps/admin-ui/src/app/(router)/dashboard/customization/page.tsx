'use client';

import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
  type CreateCategoryData,
  type UpdateCategoryData,
} from '../../../../hooks/useCategories';
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  type Brand,
  type CreateBrandData,
  type UpdateBrandData,
} from '../../../../hooks/useBrands';
import {
  exportToCSV,
  categoryColumns,
  brandColumns,
} from '../../../../lib/utils/csv-export';
import {
  useLayout,
  useUpdateLayout,
  useHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
} from '../../../../hooks/useLayout';
import type {
  UpdateLayoutData,
  HeroSlide,
  CreateHeroSlideData,
  UpdateHeroSlideData,
} from '../../../../lib/api/layout';

// ============ Shared Modal Shell ============

const ModalShell = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-white text-xl font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
};

// ============ Delete Confirmation Modal ============

const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
  isPending: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-semibold mb-4">
          Delete {itemType}
        </h3>
        <p className="text-slate-300 mb-6">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{itemName}</span>? This
          action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Category Form Modal ============

const CategoryFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  initialData,
  allCategories,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => void;
  isPending: boolean;
  initialData?: Category | null;
  allCategories: Category[];
}) => {
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    parentId: string;
    isActive: boolean;
  }>({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    parentId: initialData?.parentId || '',
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        parentId: initialData?.parentId || '',
        isActive: initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // Flatten categories for parent select (excluding self and children when editing)
  const flattenCategories = (
    cats: Category[],
    level = 0,
    excludeId?: string
  ): { id: string; name: string; level: number }[] => {
    const result: { id: string; name: string; level: number }[] = [];
    for (const cat of cats) {
      if (cat.id === excludeId) continue;
      result.push({ id: cat.id, name: cat.name, level });
      if (cat.children) {
        result.push(
          ...flattenCategories(cat.children, level + 1, excludeId)
        );
      }
    }
    return result;
  };

  const parentOptions = flattenCategories(
    allCategories,
    0,
    initialData?.id
  );

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateCategoryData | UpdateCategoryData = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      description: formData.description.trim() || undefined,
      parentId: formData.parentId || undefined,
      isActive: formData.isActive,
    };

    onSubmit(data);
  };

  const isEditing = !!initialData;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Category' : 'Add New Category'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm block mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: formData.slug || generateSlug(name),
              });
            }}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Electronics"
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Auto-generated from name"
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Brief description of this category..."
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">
            Parent Category
          </label>
          <select
            value={formData.parentId}
            onChange={(e) =>
              setFormData({ ...formData, parentId: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">None (Top Level)</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {'  '.repeat(opt.level)}
                {opt.level > 0 ? '-- ' : ''}
                {opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
          </label>
          <span className="text-slate-300 text-sm">Active</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Category'
              : 'Create Category'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ============ Brand Form Modal ============

const BrandFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrandData | UpdateBrandData) => void;
  isPending: boolean;
  initialData?: Brand | null;
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    slug: initialData?.slug || '',
    description: initialData?.description || '',
    logo: initialData?.logo || '',
    website: initialData?.website || '',
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        slug: initialData?.slug || '',
        description: initialData?.description || '',
        logo: initialData?.logo || '',
        website: initialData?.website || '',
        isActive: initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateBrandData | UpdateBrandData = {
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      description: formData.description.trim() || undefined,
      logo: formData.logo.trim() || undefined,
      website: formData.website.trim() || undefined,
      isActive: formData.isActive,
    };

    onSubmit(data);
  };

  const isEditing = !!initialData;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Brand' : 'Add New Brand'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm block mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({
                ...formData,
                name,
                slug: formData.slug || generateSlug(name),
              });
            }}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Apple"
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) =>
              setFormData({ ...formData, slug: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Auto-generated from name"
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Brief description of this brand..."
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Logo URL</label>
          <input
            type="text"
            value={formData.logo}
            onChange={(e) =>
              setFormData({ ...formData, logo: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Website</label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
          </label>
          <span className="text-slate-300 text-sm">Active</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Brand'
              : 'Create Brand'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ============ Category Tree Item ============

const CategoryTreeItem = ({
  category,
  level,
  onEdit,
  onDelete,
}: {
  category: Category;
  level: number;
  onEdit: (cat: Category) => void;
  onDelete: (cat: Category) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center gap-2 py-2 px-3 rounded hover:bg-slate-700/50 transition group ${
          level > 0 ? 'ml-6' : ''
        }`}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => hasChildren && setExpanded(!expanded)}
          className={`w-5 h-5 flex items-center justify-center text-slate-400 ${
            hasChildren ? 'cursor-pointer hover:text-white' : 'invisible'
          }`}
        >
          <svg
            className={`w-3 h-3 transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Category Icon */}
        <div
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            category.isActive ? 'bg-green-500' : 'bg-slate-500'
          }`}
        />

        {/* Name & Info */}
        <div className="flex-1 min-w-0">
          <span className="text-white text-sm font-medium">
            {category.name}
          </span>
          <span className="text-slate-500 text-xs ml-2">/{category.slug}</span>
        </div>

        {/* Status Badge */}
        <span
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            category.isActive
              ? 'bg-green-600/20 text-green-400'
              : 'bg-slate-600/20 text-slate-400'
          }`}
        >
          {category.isActive ? 'Active' : 'Inactive'}
        </span>

        {/* Actions - visible on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(category)}
            className="text-blue-400 hover:text-blue-300 p-1"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(category)}
            className="text-red-400 hover:text-red-300 p-1"
            title="Delete"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div className="border-l border-slate-700 ml-5">
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============ Helper: Flatten category tree ============

const flattenCategories_export = (
  cats: Category[],
  result: Category[] = []
): Category[] => {
  for (const cat of cats) {
    result.push(cat);
    if (cat.children) {
      flattenCategories_export(cat.children, result);
    }
  }
  return result;
};

// ============ Categories Tab ============

const CategoriesTab = () => {
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

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

  const handleDelete = (category: Category) => {
    setDeleteTarget(category);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleExport = () => {
    if (!categories?.length) return;
    const flat = flattenCategories_export(categories);
    exportToCSV(
      flat as unknown as Record<string, unknown>[],
      categoryColumns,
      `categories-export-${new Date().toISOString().split('T')[0]}`
    );
  };

  // Count total categories including nested
  const totalCount = useMemo(() => {
    if (!categories) return 0;
    return flattenCategories_export(categories).length;
  }, [categories]);

  return (
    <div>
      {/* Header */}
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
            onClick={() => {
              setEditingCategory(null);
              setFormModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Content */}
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
            onClick={() => {
              setEditingCategory(null);
              setFormModalOpen(true);
            }}
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
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CategoryFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingCategory(null);
        }}
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

// ============ Brands Tab ============

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

  // Table columns
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
            <button
              onClick={() => handleEdit(brand)}
              className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-sm"
              title="Edit"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteTarget(brand)}
              className="text-red-400 hover:text-red-300 px-2 py-1 rounded text-sm"
              title="Delete"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: brands || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {/* Header */}
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
            onClick={() => {
              setEditingBrand(null);
              setFormModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
          >
            + Add Brand
          </button>
        </div>
      </div>

      {/* Content */}
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
            onClick={() => {
              setEditingBrand(null);
              setFormModalOpen(true);
            }}
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
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition"
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

      {/* Modals */}
      <BrandFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingBrand(null);
        }}
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

// ============ Hero Slide Form Modal ============

const HeroSlideFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHeroSlideData | UpdateHeroSlideData) => void;
  isPending: boolean;
  initialData?: HeroSlide | null;
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    subtitle: initialData?.subtitle || '',
    imageUrl: initialData?.imageUrl || '',
    actionUrl: initialData?.actionUrl || '',
    actionLabel: initialData?.actionLabel || '',
    order: initialData?.order ?? 0,
    isActive: initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || '',
        subtitle: initialData?.subtitle || '',
        imageUrl: initialData?.imageUrl || '',
        actionUrl: initialData?.actionUrl || '',
        actionLabel: initialData?.actionLabel || '',
        order: initialData?.order ?? 0,
        isActive: initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.imageUrl.trim()) newErrors.imageUrl = 'Image URL is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateHeroSlideData | UpdateHeroSlideData = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || undefined,
      imageUrl: formData.imageUrl.trim(),
      actionUrl: formData.actionUrl.trim() || undefined,
      actionLabel: formData.actionLabel.trim() || undefined,
      order: formData.order,
      isActive: formData.isActive,
    };

    onSubmit(data);
  };

  const isEditing = !!initialData;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Hero Slide' : 'Add New Hero Slide'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm block mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Discover Premium Products"
          />
          {errors.title && (
            <p className="text-red-400 text-xs mt-1">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Subtitle</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Shop the latest from top vendors"
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Image URL *</label>
          <input
            type="text"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://ik.imagekit.io/..."
          />
          {errors.imageUrl && (
            <p className="text-red-400 text-xs mt-1">{errors.imageUrl}</p>
          )}
          {formData.imageUrl && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
              <p className="text-slate-400 text-xs mb-2">Preview:</p>
              <img
                src={formData.imageUrl}
                alt="Slide preview"
                className="max-h-32 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 text-sm block mb-2">Action URL</label>
            <input
              type="text"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="/products or /categories/..."
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-2">Action Label</label>
            <input
              type="text"
              value={formData.actionLabel}
              onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder="e.g. Shop Now"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            min={0}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
          </label>
          <span className="text-slate-300 text-sm">Active</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {isPending
              ? 'Saving...'
              : isEditing
              ? 'Update Slide'
              : 'Create Slide'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ============ Hero Slides Tab ============

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
        <span className="text-slate-400 text-sm font-mono">
          #{row.original.order}
        </span>
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
              (e.target as HTMLImageElement).className =
                'w-16 h-12 rounded bg-slate-600';
            }}
          />
          <div>
            <div className="text-white font-medium">{row.original.title}</div>
            {row.original.subtitle && (
              <div className="text-slate-500 text-xs line-clamp-1">
                {row.original.subtitle}
              </div>
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
          ) : (
            '-'
          )}
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
            <button
              onClick={() => handleEdit(slide)}
              className="text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => setDeleteTarget(slide)}
              className="text-red-400 hover:text-red-300 px-2 py-1 rounded text-sm"
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: sortedSlides,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-slate-400 text-sm">
          {slides.length} {slides.length === 1 ? 'slide' : 'slides'} total
        </div>
        <button
          onClick={() => {
            setEditingSlide(null);
            setFormModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
        >
          + Add Slide
        </button>
      </div>

      {/* Content */}
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
          <p className="text-slate-500 text-sm mb-4">
            Add slides to create an engaging carousel on the homepage
          </p>
          <button
            onClick={() => {
              setEditingSlide(null);
              setFormModalOpen(true);
            }}
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
                  className="border-t border-slate-700 hover:bg-slate-800/50 transition"
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

      {/* Modals */}
      <HeroSlideFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingSlide(null);
        }}
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

// ============ Layout Tab ============

const LayoutTab = () => {
  const { data: layout, isLoading, error } = useLayout();
  const updateMutation = useUpdateLayout();
  const [formData, setFormData] = useState({
    logo: '',
    banner: '',
  });
  const [initialized, setInitialized] = useState(false);

  // Populate form when layout data loads
  React.useEffect(() => {
    if (layout && !initialized) {
      setFormData({
        logo: layout.logo || '',
        banner: layout.banner || '',
      });
      setInitialized(true);
    }
  }, [layout, initialized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: UpdateLayoutData = {
      logo: formData.logo.trim() || undefined,
      banner: formData.banner.trim() || undefined,
    };
    updateMutation.mutate(data, {
      onSuccess: (res) => {
        setFormData({
          logo: res.layout.logo || '',
          banner: res.layout.banner || '',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
        <p className="text-slate-400">Loading layout...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-8 text-center border border-red-700">
        <p className="text-red-400">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo URL */}
        <div>
          <label className="text-slate-300 text-sm block mb-2">Logo URL</label>
          <input
            type="text"
            value={formData.logo}
            onChange={(e) =>
              setFormData({ ...formData, logo: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com/logo.png"
          />
          {formData.logo && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
              <p className="text-slate-400 text-xs mb-2">Preview:</p>
              <img
                src={formData.logo}
                alt="Logo preview"
                className="max-h-20 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Banner URL */}
        <div>
          <label className="text-slate-300 text-sm block mb-2">
            Banner Image URL
          </label>
          <input
            type="text"
            value={formData.banner}
            onChange={(e) =>
              setFormData({ ...formData, banner: e.target.value })
            }
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com/banner.png"
          />
          {formData.banner && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
              <p className="text-slate-400 text-xs mb-2">Preview:</p>
              <img
                src={formData.banner}
                alt="Banner preview"
                className="max-h-40 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-medium disabled:opacity-50"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Layout'}
        </button>
      </form>
    </div>
  );
};

// ============ Main Customization Page ============

type TabType = 'categories' | 'brands' | 'heroSlides' | 'layout';

const CustomizationPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'categories',
      label: 'Categories',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      id: 'brands',
      label: 'Brands',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      id: 'heroSlides',
      label: 'Hero Slides',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'layout',
      label: 'Layout',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-3xl font-semibold">Customization</h1>
        <p className="text-slate-400 mt-1">
          Manage categories, brands, and site layout across the platform
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1 w-fit border border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'brands' && <BrandsTab />}
      {activeTab === 'heroSlides' && <HeroSlidesTab />}
      {activeTab === 'layout' && <LayoutTab />}
    </div>
  );
};

export default CustomizationPage;
