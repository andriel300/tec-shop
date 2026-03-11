'use client';

import React, { useState } from 'react';
import type { Category, CreateCategoryData, UpdateCategoryData } from '../../../../../../../hooks/useCategories';
import ModalShell from '../ModalShell';

const flattenForSelect = (
  cats: Category[],
  level = 0,
  excludeId?: string
): { id: string; name: string; level: number }[] => {
  const result: { id: string; name: string; level: number }[] = [];
  for (const cat of cats) {
    if (cat.id === excludeId) continue;
    result.push({ id: cat.id, name: cat.name, level });
    if (cat.children) {
      result.push(...flattenForSelect(cat.children, level + 1, excludeId));
    }
  }
  return result;
};

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const CategoryFormModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCategoryData | UpdateCategoryData) => void;
  isPending: boolean;
  initialData?: Category | null;
  allCategories: Category[];
}) => {
  const [formData, setFormData] = useState({
    name: props.initialData?.name || '',
    slug: props.initialData?.slug || '',
    description: props.initialData?.description || '',
    parentId: props.initialData?.parentId || '',
    isActive: props.initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (props.isOpen) {
      setFormData({
        name: props.initialData?.name || '',
        slug: props.initialData?.slug || '',
        description: props.initialData?.description || '',
        parentId: props.initialData?.parentId || '',
        isActive: props.initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [props.isOpen, props.initialData]);

  if (!props.isOpen) return null;

  const parentOptions = flattenForSelect(props.allCategories, 0, props.initialData?.id);
  const isEditing = !!props.initialData;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    props.onSubmit({
      name: formData.name.trim(),
      slug: formData.slug.trim() || generateSlug(formData.name),
      description: formData.description.trim() || undefined,
      parentId: formData.parentId || undefined,
      isActive: formData.isActive,
    });
  };

  return (
    <ModalShell isOpen={props.isOpen} onClose={props.onClose} title={isEditing ? 'Edit Category' : 'Add New Category'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm block mb-2">Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({ ...formData, name, slug: formData.slug || generateSlug(name) });
            }}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="e.g. Electronics"
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="Auto-generated from name"
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Brief description of this category..."
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Parent Category</label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">None (Top Level)</option>
            {parentOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {'  '.repeat(opt.level)}{opt.level > 0 ? '-- ' : ''}{opt.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
          </label>
          <span className="text-slate-300 text-sm">Active</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={props.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {props.isPending ? 'Saving...' : isEditing ? 'Update Category' : 'Create Category'}
          </button>
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default CategoryFormModal;
