'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../../../lib/api/client';
import type { ProductResponse } from '../../../../lib/api/products';

interface PublicProductsResponse {
  products: ProductResponse[];
  total: number;
  limit: number;
  offset: number;
}

// Query keys
const adminProductKeys = {
  all: ['admin', 'products'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...adminProductKeys.all, 'list', filters] as const,
};

// Hook: Fetch public products for admin overview
function useAdminProducts(filters?: {
  search?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: adminProductKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.search) params.append('search', filters.search);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);
      params.append('limit', String(filters?.limit || 50));
      params.append('offset', String(filters?.offset || 0));

      const response = await apiClient.get(
        `/public/products?${params.toString()}`
      );
      return response.data as PublicProductsResponse;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

const ProductsPage = () => {
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch products from public endpoint (admin has read-only access)
  const { data, isLoading, error } = useAdminProducts({
    search: search || undefined,
    limit,
    offset,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  // Table columns
  const columns: ColumnDef<ProductResponse>[] = [
    {
      header: 'Product',
      accessorKey: 'name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.images?.[0] ? (
            <img
              src={row.original.images[0]}
              alt={row.original.name}
              className="w-10 h-10 rounded object-cover bg-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
              No img
            </div>
          )}
          <div className="min-w-0">
            <div className="text-white font-medium truncate max-w-[200px]">
              {row.original.name}
            </div>
            <div className="text-slate-400 text-xs">
              {row.original.productType}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Price',
      accessorKey: 'price',
      cell: ({ row }) => (
        <div>
          <div className="text-white font-medium">
            {formatPrice(row.original.price)}
          </div>
          {row.original.salePrice && (
            <div className="text-green-400 text-xs">
              Sale: {formatPrice(row.original.salePrice)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Stock',
      accessorKey: 'stock',
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <span
            className={`font-medium ${
              stock === 0
                ? 'text-red-400'
                : stock < 10
                ? 'text-yellow-400'
                : 'text-white'
            }`}
          >
            {stock}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ row }) => {
        const status = row.original.status;
        const colors: Record<string, string> = {
          PUBLISHED: 'bg-green-600/20 text-green-400 border-green-600/30',
          DRAFT: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
          SCHEDULED: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
        };
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium border ${
              colors[status] ||
              'bg-slate-600/20 text-slate-400 border-slate-600/30'
            }`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-slate-300 text-sm">
          {row.original.category?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Brand',
      cell: ({ row }) => (
        <span className="text-slate-300 text-sm">
          {row.original.brand?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Views / Sales',
      cell: ({ row }) => (
        <div className="text-sm">
          <span className="text-slate-300">{row.original.views}</span>
          <span className="text-slate-500 mx-1">/</span>
          <span className="text-green-400">{row.original.sales}</span>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-white text-3xl font-semibold">Products</h1>
        <p className="text-slate-400 mt-1">
          View all published products across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Total Products</div>
          <div className="text-white text-2xl font-semibold mt-1">{total}</div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">On Sale</div>
          <div className="text-green-400 text-2xl font-semibold mt-1">
            {products.filter((p) => p.salePrice).length}
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
          <div className="text-slate-400 text-sm">Out of Stock</div>
          <div className="text-red-400 text-2xl font-semibold mt-1">
            {products.filter((p) => p.stock === 0).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="flex-1 bg-slate-700 text-white rounded p-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => {
              setSearch('');
              setOffset(0);
            }}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded px-4 py-3 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4" />
          <p className="text-slate-400">Loading products...</p>
        </div>
      ) : error ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-red-700">
          <p className="text-red-400">
            Error loading products: {error.message}
          </p>
        </div>
      ) : !products.length ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center border border-slate-700">
          <p className="text-slate-400">No products found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg shadow-xl overflow-hidden border border-slate-700">
            <table className="min-w-full text-sm text-white">
              <thead className="bg-slate-900 text-slate-300">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-3 text-left font-medium"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-transparent">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-slate-700 hover:bg-slate-800/50 transition"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-slate-400">
                Showing {products.length} of {total} products
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Previous
                </button>
                <span className="text-white px-4 py-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={currentPage >= totalPages}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductsPage;
