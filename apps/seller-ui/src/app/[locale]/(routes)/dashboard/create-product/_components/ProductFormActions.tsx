'use client';

import React from 'react';

interface ProductFormActionsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onReset: () => void;
  onCancel: () => void;
}

export function ProductFormActions({
  form,
  onReset,
  onCancel,
}: ProductFormActionsProps) {
  return (
    <form.Subscribe
      selector={(state: { canSubmit: boolean; isSubmitting: boolean }) => [
        state.canSubmit,
        state.isSubmitting,
      ]}
    >
      {([canSubmit, isSubmitting]: [boolean, boolean]) => (
        <div className="flex gap-4 pt-6 border-t border-surface-container-highest">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="px-8 py-3 bg-brand-primary-600 text-white rounded-lg font-medium hover:bg-brand-primary-700 focus:outline-none focus:ring-2 focus:ring-brand-primary-600/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Product...
              </>
            ) : (
              'Create Product'
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-8 py-3 bg-surface-container text-gray-900 rounded-lg font-medium hover:bg-surface-container-highest transition-colors"
          >
            Reset Form
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-8 py-3 border border-surface-container-highest text-gray-500 rounded-lg font-medium hover:bg-surface-container-low transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </form.Subscribe>
  );
}
