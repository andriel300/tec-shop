/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import { createLogger } from '@tec-shop/next-logger';
import React, { useState } from 'react';

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
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must not exceed 200 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must not exceed 2000 characters';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
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
            : 'Failed to create event. Please try again.',
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
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-brand-primary/10 rounded-lg">
            <Zap size={20} className="text-brand-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Create Event</h1>
        </div>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Events', href: '/dashboard/events' },
            { label: 'Create Event' },
          ]}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Submit Error */}
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
              Event Details
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Provide the core information for your promotional event
            </p>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Event Title <span className="text-feedback-error">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Summer Sale 2025"
              className={errors.title ? inputError : inputNormal}
            />
            {errors.title && (
              <p className="text-sm text-feedback-error mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.title.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Description <span className="text-feedback-error">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your event and what customers can expect..."
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

          {/* Banner Image URL */}
          <div>
            <label
              htmlFor="bannerImage"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Banner Image URL{' '}
              <span className="text-gray-500 font-normal">(Optional)</span>
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
              Provide a URL to an image for your event banner
            </p>
          </div>
        </div>

        {/* Card 2 — Date & Schedule */}
        <div className="bg-surface-container-lowest rounded-xl p-6 space-y-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Calendar size={16} className="text-brand-primary" />
              Date &amp; Schedule
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Set when your event starts and ends
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Start Date */}
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                Start Date <span className="text-feedback-error">*</span>
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

            {/* End Date */}
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-900 mb-2"
              >
                End Date <span className="text-feedback-error">*</span>
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
              Event Settings
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure the status and visibility of your event
            </p>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              Event Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`${inputNormal} appearance-none cursor-pointer`}
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Set the initial status of your event
            </p>
          </div>

          {/* Is Active Toggle */}
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium text-gray-900">Event is active</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Active events are visible to customers on your store
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

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="px-6 py-2.5 bg-brand-primary text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity text-sm font-semibold cursor-pointer"
          >
            {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/events')}
            className="px-6 py-2.5 bg-surface-container text-gray-900 rounded-lg hover:bg-surface-container-high transition-colors text-sm font-medium cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
