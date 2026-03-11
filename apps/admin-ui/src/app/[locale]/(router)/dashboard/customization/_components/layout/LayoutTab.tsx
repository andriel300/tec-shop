'use client';

import React, { useState } from 'react';
import { useLayout, useUpdateLayout } from '../../../../../../../hooks/useLayout';
import type { UpdateLayoutData } from '../../../../../../../lib/api/layout';

const LayoutTab = () => {
  const { data: layout, isLoading, error } = useLayout();
  const updateMutation = useUpdateLayout();
  const [formData, setFormData] = useState({ logo: '', banner: '' });
  const [initialized, setInitialized] = useState(false);

  React.useEffect(() => {
    if (layout && !initialized) {
      setFormData({ logo: layout.logo || '', banner: layout.banner || '' });
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
        setFormData({ logo: res.layout.logo || '', banner: res.layout.banner || '' });
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
        <div>
          <label className="text-slate-300 text-sm block mb-2">Logo URL</label>
          <input
            type="text"
            value={formData.logo}
            onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>

        <div>
          <label className="text-slate-300 text-sm block mb-2">Banner Image URL</label>
          <input
            type="text"
            value={formData.banner}
            onChange={(e) => setFormData({ ...formData, banner: e.target.value })}
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
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
          )}
        </div>

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

export default LayoutTab;
