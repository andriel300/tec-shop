/* eslint-disable @nx/enforce-module-boundaries */
'use client';

import React, { useState } from 'react';
import { useEvents, useDeleteEvent } from '../../../../../hooks/useEvents';
import type { EventResponse } from '../../../../../lib/api/events';
import { useRouter } from 'apps/seller-ui/src/i18n/navigation';

const EventsPage = () => {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string | undefined>(
    undefined
  );
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined
  );

  const { data, isLoading, error } = useEvents({
    status: filterStatus,
    isActive: filterActive,
    limit: 50,
  });

  const deleteEventMutation = useDeleteEvent();

  const handleDelete = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEventMutation.mutateAsync(eventId);
      } catch (err) {
        console.error('Failed to delete event:', err);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500/20 text-green-400';
      case 'SCHEDULED':
        return 'bg-blue-500/20 text-blue-400';
      case 'DRAFT':
        return 'bg-gray-500/20 text-gray-400';
      case 'COMPLETED':
        return 'bg-purple-500/20 text-purple-400';
      case 'CANCELLED':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const isEventActive = (event: EventResponse) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    return now >= start && now <= end;
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-white text-center py-8">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-400 text-center py-8">
          Error loading events: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Events</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your shop promotional events
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/create-event')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          Create New Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || undefined)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={
            filterActive === undefined
              ? ''
              : filterActive
              ? 'active'
              : 'inactive'
          }
          onChange={(e) => {
            const value = e.target.value;
            setFilterActive(value === '' ? undefined : value === 'active');
          }}
          className="px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg"
        >
          <option value="">All Events</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data?.length === 0 ? (
          <div className="col-span-full bg-slate-800/50 rounded-lg p-8 border border-slate-700 text-center">
            <p className="text-slate-400 mb-4">No events found</p>
            <button
              onClick={() => router.push('/dashboard/create-event')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          data?.data?.map((event: EventResponse) => (
            <div
              key={event.id}
              className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-slate-600 transition"
            >
              {event.bannerImage && (
                <div className="h-40 overflow-hidden bg-slate-700">
                  <img
                    src={event.bannerImage}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white font-semibold text-lg line-clamp-1">
                    {event.title}
                  </h3>
                  {isEventActive(event) && (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full animate-pulse">
                      Live
                    </span>
                  )}
                </div>

                <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Start:</span>
                    <span className="text-slate-300">
                      {new Date(event.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">End:</span>
                    <span className="text-slate-300">
                      {new Date(event.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                  {event.isActive && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      router.push(`/dashboard/events/edit/${event.id}`)
                    }
                    className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    disabled={deleteEventMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventsPage;
