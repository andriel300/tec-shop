'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../../lib/api/products';
import StarRating from '../ui/star-rating';
import { Eye, Heart, ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsFavorited(!isFavorited);
    // TODO: Add API call to save favorite
    // TODO: Show toast notification
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Open quick view modal
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // TODO: Add to cart logic
    // TODO: Show toast notification
  };

  return (
    <Link href={`/products/${product.slug || product.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        <div className="relative w-full h-[200px] bg-gray-100">
          {/* Image */}
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

          {/* Action Icons */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            <button
              onClick={handleFavoriteClick}
              className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow
                           hover:scale-110 transition-transform duration-200"
              aria-label={
                isFavorited ? 'Remove from favorites' : 'Add to favorites'
              }
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-700'
                }`}
              />
            </button>

            <button
              onClick={handleQuickView}
              className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow
                           hover:scale-110 transition-transform duration-200"
              aria-label="Quick view"
            >
              <Eye className="w-5 h-5 text-gray-700" />
            </button>

            <button
              onClick={handleAddToCart}
              className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow
                           hover:scale-110 transition-transform duration-200"
              aria-label="Add to cart"
            >
              <ShoppingBag className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Badges */}
          {hasDiscount && (
            <div className="absolute top-2 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              SALE
            </div>
          )}
          {product.isFeatured && (
            <div className="absolute top-12 left-3 bg-yellow-500 text-white text-xs font-semibold px-2 py-1 rounded">
              FEATURED
            </div>
          )}
        </div>

        {/* Rest of the card... */}
        <div className="p-4 flex-1 flex flex-col">
          {product.brand && (
            <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
          )}

          <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2 flex-1">
            {product.name}
          </h3>

          <div className="mb-2">
            <StarRating
              value={product.averageRating}
              readonly
              size="sm"
              showCount
              count={product.ratingCount}
            />
          </div>

          {product.category && (
            <p className="text-xs text-gray-400 mb-2">
              {product.category.name}
            </p>
          )}

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

          {product.stock > 0 ? (
            <p className="text-xs text-green-600 mt-1">
              In Stock ({product.stock})
            </p>
          ) : (
            <p className="text-xs text-red-600 mt-1">Out of Stock</p>
          )}

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
