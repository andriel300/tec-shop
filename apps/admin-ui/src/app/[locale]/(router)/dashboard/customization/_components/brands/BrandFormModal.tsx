'use client';

import React, { useState } from 'react';
import type { Brand, CreateBrandData, UpdateBrandData } from '../../../../../../../hooks/useBrands';
import ModalShell from '../ModalShell';

const generateSlug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const BrandFormModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrandData | UpdateBrandData) => void;
  isPending: boolean;
  initialData?: Brand | null;
}) => {
  const [formData, setFormData] = useState({
    name: props.initialData?.name || '',
    slug: props.initialData?.slug || '',
    description: props.initialData?.description || '',
    logo: props.initialData?.logo || '',
    website: props.initialData?.website || '',
    isActive: props.initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (props.isOpen) {
      setFormData({
        name: props.initialData?.name || '',
        slug: props.initialData?.slug || '',
        description: props.initialData?.description || '',
        logo: props.initialData?.logo || '',
        website: props.initialData?.website || '',
        isActive: props.initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [props.isOpen, props.initialData]);

  if (!props.isOpen) return null;

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
      logo: formData.logo.trim() || undefined,
      website: formData.website.trim() || undefined,
      isActive: formData.isActive,
    });
  };

  return (
    <ModalShell isOpen={props.isOpen} onClose={props.onClose} title={isEditing ? 'Edit Brand' : 'Add New Brand'}>
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
            placeholder="e.g. Apple"
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
            placeholder="Brief description of this brand..."
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Logo URL</label>
          <input
            type="text"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Website</label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder="https://example.com"
          />
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
            {props.isPending ? 'Saving...' : isEditing ? 'Update Brand' : 'Create Brand'}
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

export default BrandFormModal;
