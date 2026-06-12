'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { HeroSlide, CreateHeroSlideData, UpdateHeroSlideData } from '../../../../../../../lib/api/layout';
import ModalShell from '../ModalShell';

const TRANSLATION_LOCALES: { code: string; label: string }[] = [
  { code: 'pt-BR', label: 'Portuguese (pt-BR)' },
];

const HeroSlideFormModal = (props: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateHeroSlideData | UpdateHeroSlideData) => void;
  isPending: boolean;
  initialData?: HeroSlide | null;
}) => {
  const t = useTranslations('Customization');
  const [formData, setFormData] = useState({
    title: props.initialData?.title || '',
    subtitle: props.initialData?.subtitle || '',
    imageUrl: props.initialData?.imageUrl || '',
    actionUrl: props.initialData?.actionUrl || '',
    actionLabel: props.initialData?.actionLabel || '',
    order: props.initialData?.order ?? 0,
    isActive: props.initialData?.isActive ?? true,
  });
  const [translations, setTranslations] = useState<Record<string, { title: string; subtitle: string; actionLabel: string }>>(
    () => {
      const initial: Record<string, { title: string; subtitle: string; actionLabel: string }> = {};
      for (const { code } of TRANSLATION_LOCALES) {
        const existing = props.initialData?.translations?.[code];
        initial[code] = {
          title: existing?.title || '',
          subtitle: existing?.subtitle || '',
          actionLabel: existing?.actionLabel || '',
        };
      }
      return initial;
    }
  );
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
      const initial: Record<string, { title: string; subtitle: string; actionLabel: string }> = {};
      for (const { code } of TRANSLATION_LOCALES) {
        const existing = props.initialData?.translations?.[code];
        initial[code] = {
          title: existing?.title || '',
          subtitle: existing?.subtitle || '',
          actionLabel: existing?.actionLabel || '',
        };
      }
      setTranslations(initial);
      setErrors({});
    }
  }, [props.isOpen, props.initialData]);

  if (!props.isOpen) return null;

  const isEditing = !!props.initialData;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = t('titleRequired');
    if (!formData.imageUrl.trim()) newErrors.imageUrl = t('imageUrlRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTranslationChange = (locale: string, field: 'title' | 'subtitle' | 'actionLabel', value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { ...prev[locale], [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Only include a locale's translations if at least one field is filled
    const translationsPayload: Record<string, { title?: string; subtitle?: string; actionLabel?: string }> = {};
    for (const { code } of TRANSLATION_LOCALES) {
      const trans = translations[code];
      if (trans.title.trim() || trans.subtitle.trim() || trans.actionLabel.trim()) {
        translationsPayload[code] = {
          ...(trans.title.trim() && { title: trans.title.trim() }),
          ...(trans.subtitle.trim() && { subtitle: trans.subtitle.trim() }),
          ...(trans.actionLabel.trim() && { actionLabel: trans.actionLabel.trim() }),
        };
      }
    }

    props.onSubmit({
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || undefined,
      imageUrl: formData.imageUrl.trim(),
      actionUrl: formData.actionUrl.trim() || undefined,
      actionLabel: formData.actionLabel.trim() || undefined,
      order: formData.order,
      isActive: formData.isActive,
      translations: Object.keys(translationsPayload).length > 0 ? translationsPayload : undefined,
    });
  };

  return (
    <ModalShell isOpen={props.isOpen} onClose={props.onClose} title={isEditing ? t('editHeroSlide') : t('addNewHeroSlide')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldTitle')}</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('slideTitlePlaceholder')}
          />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldSubtitle')}</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('slideSubtitlePlaceholder')}
          />
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldImageUrl')}</label>
          <input
            type="text"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
            placeholder={t('imageUrlPlaceholder')}
          />
          {errors.imageUrl && <p className="text-red-400 text-xs mt-1">{errors.imageUrl}</p>}
          {formData.imageUrl && (
            <div className="mt-3 p-3 bg-slate-800 rounded border border-slate-600">
              <p className="text-slate-400 text-xs mb-2">{t('preview')}</p>
              <img
                src={formData.imageUrl}
                alt={t('slidePreviewAlt')}
                className="max-h-32 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 text-sm block mb-2">{t('fieldActionUrl')}</label>
            <input
              type="text"
              value={formData.actionUrl}
              onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder={t('actionUrlPlaceholder')}
            />
          </div>
          <div>
            <label className="text-slate-300 text-sm block mb-2">{t('fieldActionLabel')}</label>
            <input
              type="text"
              value={formData.actionLabel}
              onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
              className="w-full bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
              placeholder={t('actionLabelPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">{t('fieldOrder')}</label>
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
          <span className="text-slate-300 text-sm">{t('fieldActive')}</span>
        </div>

        {/* Translations section */}
        <div className="border-t border-slate-600 pt-4 mt-2">
          <p className="text-slate-400 text-xs uppercase tracking-widest mb-3">{t('translationsSection')}</p>
          {TRANSLATION_LOCALES.map(({ code, label }) => (
            <details key={code} className="mb-3 group">
              <summary className="cursor-pointer text-sm text-slate-300 hover:text-white list-none flex items-center gap-2 select-none">
                <span className="text-slate-500 group-open:rotate-90 transition-transform inline-block">▶</span>
                {label}
              </summary>
              <div className="mt-3 space-y-3 pl-4">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">{t('transFieldTitle', { code })}</label>
                  <input
                    type="text"
                    value={translations[code]?.title || ''}
                    onChange={(e) => handleTranslationChange(code, 'title', e.target.value)}
                    className="w-full bg-slate-700 text-white rounded p-2.5 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                    placeholder={`e.g. ${formData.title}`}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">{t('transFieldSubtitle', { code })}</label>
                  <input
                    type="text"
                    value={translations[code]?.subtitle || ''}
                    onChange={(e) => handleTranslationChange(code, 'subtitle', e.target.value)}
                    className="w-full bg-slate-700 text-white rounded p-2.5 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                    placeholder={`e.g. ${formData.subtitle}`}
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">{t('transFieldActionLabel', { code })}</label>
                  <input
                    type="text"
                    value={translations[code]?.actionLabel || ''}
                    onChange={(e) => handleTranslationChange(code, 'actionLabel', e.target.value)}
                    className="w-full bg-slate-700 text-white rounded p-2.5 border border-slate-600 focus:border-blue-500 focus:outline-none text-sm"
                    placeholder={`e.g. ${formData.actionLabel || t('actionLabelPlaceholder')}`}
                  />
                </div>
              </div>
            </details>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={props.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded p-3 font-medium disabled:opacity-50"
          >
            {props.isPending ? t('saving') : isEditing ? t('updateSlide') : t('createSlide')}
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

export default HeroSlideFormModal;
