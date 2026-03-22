'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { Select } from '../../../../../../components/ui/core/Select';
import { FormField } from '../../../../../../components/ui/form/FormField';

const PRODUCT_STATUS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
];

interface ProductStatusCardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}

export function ProductStatusCard({ form }: ProductStatusCardProps) {
  return (
    <div className="bg-surface-container-lowest rounded-lg p-4 space-y-4 shadow-ambient">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Tag size={20} className="text-feedback-success" />
        Product Status
      </h3>

      <form.Field name="status">
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <FormField field={field} label="Status">
            <Select
              value={field.state.value}
              onChange={(value: string) =>
                field.handleChange(value as 'draft' | 'published' | 'scheduled')
              }
              options={PRODUCT_STATUS}
              variant="dark"
            />
          </FormField>
        )}
      </form.Field>

      <form.Field name="isFeatured">
        {(field: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFeatured"
              checked={field.state.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.checked)
              }
              className="w-4 h-4 rounded bg-surface-container border-surface-container-highest text-brand-primary-600"
            />
            <label htmlFor="isFeatured" className="text-sm text-gray-500">
              Mark as featured product
            </label>
          </div>
        )}
      </form.Field>
    </div>
  );
}
