'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Customization');
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
    if (!formData.name.trim()) newErrors.name = t('nameRequired');
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
    <ModalShell isOpen={props.isOpen} onClose={props.onClose} title={isEditing ? t('editBrand') : t('addNewBrand')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldName')}</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value;
              setFormData({ ...formData, name, slug: formData.slug || generateSlug(name) });
            }}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('brandNamePlaceholder')}
          />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldSlug')}</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('slugPlaceholder')}
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldDescription')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder={t('brandDescriptionPlaceholder')}
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldLogoUrl')}</label>
          <input
            type="text"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('logoUrlPlaceholder')}
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldWebsite')}</label>
          <input
            type="text"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('websitePlaceholder')}
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
          <span className="text-slate-300 text-sm">{t('fieldActive')}</span>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={props.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {props.isPending ? t('saving') : isEditing ? t('updateBrand') : t('createBrand')}
          </button>
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.isPending}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

export default BrandFormModal;
