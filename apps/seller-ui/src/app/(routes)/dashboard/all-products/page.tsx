'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useProducts, useDeleteProduct } from '../../../../hooks/useProducts';
import { Alert } from '../../../../components/ui/core/Alert';
import { Breadcrumb } from '../../../../components/navigation/Breadcrumb';

const ProductsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // React Query hooks - no more useEffect for data fetching!
  const { data: products = [], isLoading: loading, error: fetchError } = useProducts({
    search: searchTerm || undefined
  });
  const { mutate: deleteProductMutation } = useDeleteProduct();

  const error = fetchError ? 'Failed to load products. Please try again.' : null;

  const handleDelete = (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return;
    }

    deleteProductMutation(productId);
  };

  const filteredProducts = products.filter((product) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="w-full mx-auto p-8 text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold font-heading text-white">
          Products
        </h2>
        <Link
          href="/dashboard/create-product"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Product
        </Link>
      </div>

      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Products' },
        ]}
      />

      {error && (
        <Alert variant="error" title="Error" description={error} />
      )}

      {/* Delete errors are now handled by toast notifications via React Query */}

      {/* Search and Filters */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Loading products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <Package size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            No Products Found
          </h3>
          <p className="text-gray-400 mb-6">
            {searchTerm
              ? 'No products match your search criteria'
              : 'Start by creating your first product'}
          </p>
          <Link
            href="/dashboard/create-product"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Your First Product
          </Link>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                          <Package size={24} className="text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-sm text-gray-400">{product.productType}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">
                    ${product.salePrice || product.price}
                    {product.salePrice && (
                      <span className="ml-2 text-gray-400 line-through text-sm">
                        ${product.price}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 10
                          ? 'bg-green-900 text-green-300'
                          : product.stock > 0
                          ? 'bg-yellow-900 text-yellow-300'
                          : 'bg-red-900 text-red-300'
                      }`}
                    >
                      {product.stock} units
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.status === 'PUBLISHED'
                          ? 'bg-green-900 text-green-300'
                          : product.status === 'DRAFT'
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-blue-900 text-blue-300'
                      }`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/dashboard/products/edit/${product.id}`)}
                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
                        title="Edit product"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded transition-colors"
                        title="Delete product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {filteredProducts.length > 0 && (
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
