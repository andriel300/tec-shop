/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { createLogger } from '@tec-shop/next-logger';
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';

const logger = createLogger('seller-ui:create-event');
import { useCreateEvent } from '../../../../../hooks/useEvents';
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';
import {
  Zap,
  FileText,
  Calendar,
  Settings2,
  AlertCircle,
  Link2,
} from 'lucide-react';
import { Breadcrumb } from '../../../../../components/navigation/Breadcrumb';

const inputBase =
  'w-full px-4 py-2.5 bg-surface-container-lowest border rounded-lg text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 transition-colors text-sm';
const inputNormal = `${inputBase} border-surface-container-highest focus:ring-brand-primary/30 focus:border-brand-primary/50`;
const inputError = `${inputBase} border-feedback-error/50 focus:ring-feedback-error/20`;

const CreateEventPage = () => {
  const t = useTranslations('CreateEvent');
  const router = useRouter();
  const createEventMutation = useCreateEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerImage: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT' as
      | 'DRAFT'
      | 'SCHEDULED'
      | 'ACTIVE'
      | 'COMPLETED'
      | 'CANCELLED',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validationTitleRequired');
    } else if (formData.title.length < 3) {
      newErrors.title = t('validationTitleMin');
    } else if (formData.title.length > 200) {
      newErrors.title = t('validationTitleMax');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('validationDescRequired');
    } else if (formData.description.length < 10) {
      newErrors.description = t('validationDescMin');
    } else if (formData.description.length > 2000) {
      newErrors.description = t('validationDescMax');
    }

    if (!formData.startDate) {
      newErrors.startDate = t('validationStartRequired');
    }

    if (!formData.endDate) {
      newErrors.endDate = t('validationEndRequired');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = t('validationEndAfterStart');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await createEventMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        bannerImage: formData.bannerImage || undefined,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        status: formData.status,
        isActive: formData.isActive,
      });

      router.push('/dashboard/events');
    } catch (error) {
      logger.error('Failed to create event:', { error });
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : t('defaultError'),
      });
    }
  };

  const descCount = formData.description.length;
  const descPct = Math.min((descCount / 2000) * 100, 100);
  const descBarColor =
    descCount > 2000
      ? 'bg-feedback-error'
      : descCount > 1600
      ? 'bg-feedback-warning'
      : 'bg-feedback-success';

  return (
    <div className="w-full p-8 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <Zap size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{t('pageTitle')}</h1>
        </div>
        <Breadcrumb
          items={[
            { label: t('breadcrumbDashboard'), href: '/dashboard' },
            { label: t('breadcrumbEvents'), href: '/dashboard/events' },
            { label: t('breadcrumbCreate') },
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.submit && (
          <div className="flex items-start gap-3 p-4 bg-feedback-error/10 border border-feedback-error/30 rounded-xl">
            <AlertCircle
              size={16}
              className="text-feedback-error flex-shrink-0 mt-0.5"
            />
            <p className="text-sm text-feedback-error">{errors.submit}</p>
          </div>
        )}

        {/* Card 1 — Event Details */}
        <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText size={16} className="text-brand-primary" />
              {t('detailsCardTitle')}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('detailsCardSubtitle')}
            </p>
          </div>

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              {t('titleLabel')} <span className="text-feedback-error">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder={t('titlePlaceholder')}
              className={errors.title ? inputError : inputNormal}
            />
            {errors.title && (
              <p className="text-sm text-feedback-error mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.title.length}/200
            </p>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              {t('descLabel')} <span className="text-feedback-error">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('descPlaceholder')}
              rows={5}
              className={`${errors.description ? inputError : inputNormal} resize-none`}
            />
            {errors.description && (
              <p className="text-sm text-feedback-error mt-1">
                {errors.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1 bg-surface-container rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${descBarColor}`}
                  style={{ width: `${descPct}%` }}
                />
              </div>
              <span
                className={`text-xs font-medium tabular-nums ${
                  descCount > 2000
                    ? 'text-feedback-error'
                    : descCount > 1600
                    ? 'text-feedback-warning'
                    : 'text-gray-500'
                }`}
              >
                {descCount}/2000
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="bannerImage"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              {t('bannerLabel')}{' '}
              <span className="text-gray-500 font-normal">{t('bannerOptional')}</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                <Link2 size={14} />
              </span>
              <input
                type="url"
                id="bannerImage"
                name="bannerImage"
                value={formData.bannerImage}
                onChange={handleChange}
                placeholder="https://example.com/event-banner.jpg"
                className={`${inputNormal} pl-9`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t('bannerHint')}
            </p>
          </div>
        </div>

        {/* Card 2 — Date & Schedule */}
        <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-brand-primary" />
              {t('scheduleCardTitle')}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('scheduleCardSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                {t('startDateLabel')} <span className="text-feedback-error">*</span>
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? inputError : inputNormal}
              />
              {errors.startDate && (
                <p className="text-sm text-feedback-error mt-1">
                  {errors.startDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                {t('endDateLabel')} <span className="text-feedback-error">*</span>
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={errors.endDate ? inputError : inputNormal}
              />
              {errors.endDate && (
                <p className="text-sm text-feedback-error mt-1">
                  {errors.endDate}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3 — Event Settings */}
        <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Settings2 size={16} className="text-brand-primary" />
              {t('settingsCardTitle')}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {t('settingsCardSubtitle')}
            </p>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              {t('statusLabel')}
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`${inputNormal} appearance-none cursor-pointer`}
            >
              <option value="DRAFT">{t('statusDraft')}</option>
              <option value="SCHEDULED">{t('statusScheduled')}</option>
              <option value="ACTIVE">{t('statusActive')}</option>
              <option value="COMPLETED">{t('statusCompleted')}</option>
              <option value="CANCELLED">{t('statusCancelled')}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {t('statusHint')}
            </p>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('isActiveLabel')}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {t('isActiveDesc')}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={formData.isActive}
              onClick={handleToggleActive}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:ring-offset-2 ${
                formData.isActive
                  ? 'bg-brand-primary'
                  : 'bg-surface-container-highest'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform duration-200 mt-0.5 ${
                  formData.isActive ? 'translate-x-5' : 'translate-x-0.5'
                }`}
                style={{ backgroundColor: '#ffffff' }}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity text-sm font-semibold cursor-pointer"
          >
            {createEventMutation.isPending ? t('submitCreating') : t('submitCreate')}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/events')}
            className="px-6 py-2.5 bg-surface-container text-gray-900 rounded-lg hover:bg-surface-container-high transition-colors text-sm font-medium cursor-pointer"
          >
            {t('cancelBtn')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
