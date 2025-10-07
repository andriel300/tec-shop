'use client';

import { Breadcrumb } from '../../../../components/navigation/Breadcrumb';
import { Button } from '../../../../components/ui/core/Button';
import { Modal } from '../../../../components/ui/core/Modal';
import { DiscountForm } from '../../../../components/forms/DiscountForm';
import { Plus, Pencil, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { useDiscounts, useDeleteDiscount, useCreateDiscount } from '../../../../hooks/useDiscounts';
import type { DiscountResponse, CreateDiscountData } from '../../../../lib/api/discounts';
import { toast } from 'sonner';

const Page = () => {
  const [showModal, setShowModal] = useState(false);

  // Fetch discount codes using TanStack Query
  const { data: discounts, isLoading, error } = useDiscounts();
  const deleteMutation = useDeleteDiscount();
  const createMutation = useCreateDiscount();

  // Handle form submission
  const handleCreateDiscount = (data: CreateDiscountData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setShowModal(false);
      },
    });
  };

  // Copy discount code to clipboard
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!', {
      description: code,
    });
  };

  // Format date for display
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format discount value based on type
  const formatDiscountValue = (discount: DiscountResponse) => {
    switch (discount.discountType) {
      case 'PERCENTAGE':
        return `${discount.discountValue}%`;
      case 'FIXED_AMOUNT':
        return `$${discount.discountValue}`;
      case 'FREE_SHIPPING':
        return 'Free Shipping';
      default:
        return discount.discountValue;
    }
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-2xl text-white font-semibold">Discount Codes</h2>
        <Button
          className="px-4 py-2 gap-2 items-center"
          onClick={() => setShowModal(true)}
        >
          <Plus size={18} /> Create Discount
        </Button>
      </div>
      <div className="flex items-center text-white">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Discount Codes' },
          ]}
        />
      </div>

      <div className="mt-8 bg-gray-900 p-6 rounded-lg shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Your Discount Codes
        </h3>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <p className="mt-4 text-gray-400">Loading discount codes...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-400">Failed to load discount codes</p>
            <p className="text-sm text-gray-400 mt-1">{error.message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && discounts?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              No discount codes yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first discount code to start offering deals to customers
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus size={18} className="mr-2" /> Create Your First Discount
            </Button>
          </div>
        )}

        {/* Discount Codes Table */}
        {!isLoading && !error && discounts && discounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Code</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Value</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Usage</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Valid Until</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr
                    key={discount.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="text-blue-400 font-mono bg-blue-900/20 px-2 py-1 rounded">
                          {discount.code}
                        </code>
                        <button
                          onClick={() => copyToClipboard(discount.code)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title="Copy code"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-white">{discount.publicName}</td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300 text-sm">
                        {discount.discountType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white font-medium">
                      {formatDiscountValue(discount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300">
                        {discount.usageCount}
                        {discount.usageLimit ? ` / ${discount.usageLimit}` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {formatDate(discount.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {discount.isActive ? (
                          <Eye size={16} className="text-green-400" />
                        ) : (
                          <EyeOff size={16} className="text-gray-500" />
                        )}
                        <span
                          className={
                            discount.isActive ? 'text-green-400' : 'text-gray-500'
                          }
                        >
                          {discount.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this discount code?')) {
                              deleteMutation.mutate(discount.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Discount Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Discount Code"
        size="lg"
      >
        <DiscountForm
          onSubmit={handleCreateDiscount}
          onCancel={() => setShowModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
};

export default Page;
