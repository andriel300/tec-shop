'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateEvent } from '../../../../hooks/useEvents';

const CreateEventPage = () => {
  const router = useRouter();
  const createEventMutation = useCreateEvent();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bannerImage: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT' as 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED',
    isActive: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
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

    if (!validateForm()) {
      return;
    }

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
      console.error('Failed to create event:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to create event. Please try again.',
      });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Event</h1>
        <p className="text-slate-400 text-sm">
          Create a promotional event for your shop to attract customers
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-white font-medium mb-2">
            Event Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Summer Sale 2025"
            className={`w-full px-4 py-3 bg-slate-800 border ${
              errors.title ? 'border-red-500' : 'border-slate-700'
            } text-white rounded-lg focus:outline-none focus:border-blue-500 transition`}
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-white font-medium mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe your event and what customers can expect..."
            rows={5}
            className={`w-full px-4 py-3 bg-slate-800 border ${
              errors.description ? 'border-red-500' : 'border-slate-700'
            } text-white rounded-lg focus:outline-none focus:border-blue-500 transition resize-none`}
          />
          {errors.description && (
            <p className="text-red-400 text-sm mt-1">{errors.description}</p>
          )}
          <p className="text-slate-400 text-xs mt-1">
            {formData.description.length}/2000 characters
          </p>
        </div>

        {/* Banner Image URL */}
        <div>
          <label htmlFor="bannerImage" className="block text-white font-medium mb-2">
            Banner Image URL (Optional)
          </label>
          <input
            type="url"
            id="bannerImage"
            name="bannerImage"
            value={formData.bannerImage}
            onChange={handleChange}
            placeholder="https://example.com/event-banner.jpg"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 transition"
          />
          <p className="text-slate-400 text-xs mt-1">
            Provide a URL to an image for your event banner
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-white font-medium mb-2">
              Start Date *
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-800 border ${
                errors.startDate ? 'border-red-500' : 'border-slate-700'
              } text-white rounded-lg focus:outline-none focus:border-blue-500 transition`}
            />
            {errors.startDate && (
              <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label htmlFor="endDate" className="block text-white font-medium mb-2">
              End Date *
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={`w-full px-4 py-3 bg-slate-800 border ${
                errors.endDate ? 'border-red-500' : 'border-slate-700'
              } text-white rounded-lg focus:outline-none focus:border-blue-500 transition`}
            />
            {errors.endDate && (
              <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-white font-medium mb-2">
            Event Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-blue-500 transition"
          >
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <p className="text-slate-400 text-xs mt-1">
            Set the initial status of your event
          </p>
        </div>

        {/* Is Active Checkbox */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="w-5 h-5 bg-slate-800 border border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-white font-medium">
            Event is active
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={createEventMutation.isPending}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/dashboard/events')}
            className="px-8 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
