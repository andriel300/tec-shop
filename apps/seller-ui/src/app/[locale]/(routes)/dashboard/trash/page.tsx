'use client';

import React, { useState } from 'react';
import {
  useDeletedProducts,
  useRestoreProduct,
} from '../../../../../hooks/useProducts';
import { Search, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import type { ProductResponse } from '../../../../../lib/api/products';

const TrashPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const {
    data: deletedProducts,
    isLoading,
    isError,
  } = useDeletedProducts({
    search: searchQuery || undefined,
  });
  const { mutate: restoreProductMutation, isPending: isRestoring } =
    useRestoreProduct();

  const handleRestore = (productId: string) => {
    restoreProductMutation(productId);
  };

  const getTimeRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const expiryDate = new Date(deletedDate.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const now = new Date();
    const remainingMs = expiryDate.getTime() - now.getTime();

    if (remainingMs <= 0) return 'Expiring soon';

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
              <Clock className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Trash</h1>
              <p className="text-gray-400 mt-1">
                Deleted products are permanently removed after 24 hours
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-200 font-medium">
                Recovery Window Active
              </p>
              <p className="text-yellow-300/80 text-sm mt-1">
                Products in trash can be restored within 24 hours of deletion.
                After that, they will be permanently removed and cannot be
                recovered.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search deleted products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-gray-600 border-t-red-500 rounded-full animate-spin" />
            <p className="text-gray-400 mt-4">Loading deleted products...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-xl font-semibold text-red-300 mb-2">
              Error Loading Trash
            </h3>
            <p className="text-red-200/80">
              Failed to load deleted products. Please try again.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading &&
          !isError &&
          (!deletedProducts || deletedProducts.length === 0) && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-12 text-center">
              <div className="w-20 h-20 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                Trash is Empty
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? 'No deleted products match your search.'
                  : 'No deleted products. Deleted items will appear here.'}
              </p>
            </div>
          )}

        {/* Products Table */}
        {!isLoading &&
          !isError &&
          deletedProducts &&
          deletedProducts.length > 0 && (
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Deleted
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Time Remaining
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {deletedProducts.map((product: ProductResponse) => (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-700/20 transition"
                      >
                        {/* Product Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 bg-gray-700/30 rounded-lg overflow-hidden flex-shrink-0">
                              {product.images && product.images[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  fill
                                  className="object-cover opacity-50"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-medium text-gray-300 truncate">
                                {product.name}
                              </h3>
                              <p className="text-sm text-gray-500 truncate">
                                {product.description?.substring(0, 50)}...
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-700/50 text-gray-400">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="px-6 py-4">
                          <div className="text-gray-300 font-medium">
                            ${product.price.toFixed(2)}
                          </div>
                          {product.salePrice && (
                            <div className="text-xs text-gray-500 line-through">
                              ${product.salePrice.toFixed(2)}
                            </div>
                          )}
                        </td>

                        {/* Deleted At */}
                        <td className="px-6 py-4">
                          <div className="text-gray-400 text-sm">
                            {new Date(product.deletedAt!).toLocaleDateString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {new Date(product.deletedAt!).toLocaleTimeString()}
                          </div>
                        </td>

                        {/* Time Remaining */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-yellow-400 font-medium">
                              {getTimeRemaining(product.deletedAt!)}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleRestore(product.id)}
                            disabled={isRestoring}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed border border-green-500/30"
                          >
                            <RotateCcw
                              size={16}
                              className={isRestoring ? 'animate-spin' : ''}
                            />
                            <span className="font-medium">Restore</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Footer Info */}
        {deletedProducts && deletedProducts.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Showing {deletedProducts.length} deleted{' '}
              {deletedProducts.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrashPage;
