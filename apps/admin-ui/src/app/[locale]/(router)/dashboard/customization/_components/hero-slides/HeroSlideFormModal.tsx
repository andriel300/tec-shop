'use client';

import React, { useState } from 'react';
import type { HeroSlide, CreateHeroSlideData, UpdateHeroSlideData } from '../../../../../../../lib/api/layout';
import ModalShell from '../ModalShell';

const HeroSlideFormModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHeroSlideData | UpdateHeroSlideData) => void;
  isPending: boolean;
  initialData?: HeroSlide | null;
}) => {
  const [formData, setFormData] = useState({
    title: props.initialData?.title || '',
    subtitle: props.initialData?.subtitle || '',
    imageUrl: props.initialData?.imageUrl || '',
    actionUrl: props.initialData?.actionUrl || '',
    actionLabel: props.initialData?.actionLabel || '',
    order: props.initialData?.order ?? 0,
    isActive: props.initialData?.isActive ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    if (props.isOpen) {
      setFormData({
        title: props.initialData?.title || '',
        subtitle: props.initialData?.subtitle || '',
        imageUrl: props.initialData?.imageUrl || '',
        actionUrl: props.initialData?.actionUrl || '',
        actionLabel: props.initialData?.actionLabel || '',
        order: props.initialData?.order ?? 0,
        isActive: props.initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [props.isOpen, props.initialData]);

  if (!props.isOpen) return null;

  const isEditing = !!props.initialData;

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
    props.onSubmit({
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || undefined,
      imageUrl: formData.imageUrl.trim(),
      actionUrl: formData.actionUrl.trim() || undefined,
      actionLabel: formData.actionLabel.trim() || undefined,
      order: formData.order,
      isActive: formData.isActive,
    });
  };

  return (
    <ModalShell isOpen={props.isOpen} onClose={props.onClose} title={isEditing ? 'Edit Hero Slide' : 'Add New Hero Slide'}>
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
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
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
          {errors.imageUrl && <p className="text-red-400 text-xs mt-1">{errors.imageUrl}</p>}
          {formData.imageUrl && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
              <p className="text-slate-400 text-xs mb-2">Preview:</p>
              <img
                src={formData.imageUrl}
                alt="Slide preview"
                className="max-h-32 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            min={0}
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
            {props.isPending ? 'Saving...' : isEditing ? 'Update Slide' : 'Create Slide'}
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

export default HeroSlideFormModal;
