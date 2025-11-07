'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../../lib/api/products';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        {/* Product Image */}
        <div className="relative w-full h-[200px] bg-gray-100">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
          {hasDiscount && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              SALE
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
              FEATURED
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Brand */}
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 flex-1">
            {product.name}
          </h3>

          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-400 mb-2">
              {product.category.name}
            </p>
          )}

          {/* Price */}
          <div className="flex items-center gap-2 mt-auto">
            <span className="text-lg font-bold text-brand-primary">
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          {product.stock > 0 ? (
            <p className="text-xs text-green-600 mt-1">
              In Stock ({product.stock})
            </p>
          ) : (
            <p className="text-xs text-red-600 mt-1">Out of Stock</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{product.views} views</span>
            <span>{product.sales} sold</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
