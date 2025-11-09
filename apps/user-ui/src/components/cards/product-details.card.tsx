'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import StarRating from '../ui/star-rating';
import type { Product } from '../../lib/api/products';
import {
  Minus,
  Plus,
  ShoppingCart,
  X,
  MapPin,
  MessageCircle,
  Store,
} from 'lucide-react';
import { useShop } from '../../hooks/use-shops';

interface ProductDetailsCardProps {
  product: Product;
  setOpen: (open: boolean) => void;
}

const ProductDetailsCard = ({ product, setOpen }: ProductDetailsCardProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;

  // Fetch shop details
  const { data: shop, isLoading: isShopLoading } = useShop(product.shopId);

  const handleQuantityChange = (type: 'increment' | 'decrement') => {
    if (type === 'increment' && quantity < product.stock) {
      setQuantity(quantity + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    // TODO: Implement add to cart functionality
    console.log(`Adding ${quantity} of ${product.name} to cart`);
  };

  const handleChatWithSeller = () => {
    // TODO: Implement chat with seller functionality
    if (shop) {
      console.log(`Opening chat with shop: ${shop.businessName}`);
      // router.push(`/inbox?shopId=${shop.id}`);
    }
  };

  return (
    <div
      className="fixed flex items-center justify-center top-0 left-0 h-screen w-full bg-black/40 z-[100] p-4 animate-fade-in"
      onClick={() => setOpen(false)}
    >
      <div
        className="relative w-full max-w-4xl max-h-[85vh] overflow-y-auto bg-white shadow-xl rounded-md animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          className="sticky left-full ml-auto bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition z-20 mb-2"
          onClick={() => setOpen(false)}
          aria-label="Close modal"
        >
          <X size={20} className="text-gray-700 hover:text-gray-900" />
        </button>

        <div className="flex flex-col md:flex-row px-4 md:px-6 pb-4 md:pb-6 gap-6">
          {/* Left Side - Images */}
          <div className="w-full md:w-1/2">
            {/* Main Image */}
            <div className="relative w-full h-[300px] bg-gray-100 rounded-lg overflow-hidden mb-3">
              {product.images && product.images.length > 0 ? (
                <Image
                  src={product.images[activeImage]}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}

              {/* Badges */}
              {hasDiscount && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded">
                  SALE
                </div>
              )}
              {product.isFeatured && (
                <div className="absolute top-3 right-3 bg-yellow-500 text-white text-xs font-semibold px-3 py-1 rounded">
                  FEATURED
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-1.5 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden transition ${
                      activeImage === index
                        ? 'border-brand-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setActiveImage(index)}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={64}
                      height={64}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Side - Product Details */}
          <div className="w-full md:w-1/2 flex flex-col">
            {/* Brand */}
            {product.brand && (
              <p className="text-xs text-gray-500 mb-1">{product.brand.name}</p>
            )}

            {/* Product Name */}
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="mb-2">
              <StarRating
                value={product.averageRating}
                readonly
                size="sm"
                showCount
                count={product.ratingCount}
              />
            </div>

            {/* Category */}
            {product.category && (
              <p className="text-xs text-gray-500 mb-2">
                Category:{' '}
                <span className="text-gray-700">{product.category.name}</span>
              </p>
            )}

            {/* Price */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl font-bold text-brand-primary">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
              {hasDiscount && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded">
                  Save ${(product.price - displayPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-1">
                Description
              </h3>
              <div
                className={`prose prose-sm prose-slate max-w-none ${
                  !showFullDescription ? 'line-clamp-3' : ''
                }`}
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
              {product.description.length > 150 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-brand-primary text-xs font-medium mt-1 hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-3">
                <h3 className="text-xs font-semibold text-gray-700 mb-1">
                  Tags:
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-2">
              {product.stock > 0 ? (
                <p className="text-green-600 text-sm font-medium">
                  In Stock ({product.stock} available)
                </p>
              ) : (
                <p className="text-red-600 text-sm font-medium">Out of Stock</p>
              )}
            </div>

            {/* Quantity Selector & Add to Cart */}
            {product.stock > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                {/* Quantity Selector */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange('decrement')}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="px-4 py-1.5 font-semibold text-gray-800 text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange('increment')}
                    disabled={quantity >= product.stock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold px-4 py-2.5 rounded-lg transition text-sm"
                >
                  <ShoppingCart size={18} />
                  Add to Cart
                </button>
              </div>
            )}

            {/* Product Stats */}
            <div className="flex items-center gap-3 text-xs text-gray-500 pt-2 border-t border-gray-200">
              <span>{product.views} views</span>
              <span>{product.sales} sold</span>
            </div>

            {/* Shop/Seller Information */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                <Store size={16} className="text-brand-primary" />
                Seller Information
              </h3>

              {isShopLoading ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary" />
                </div>
              ) : shop ? (
                <div className="space-y-2">
                  {/* Shop Name */}
                  <div>
                    <p className="text-xs text-gray-500">Shop Name</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {shop.businessName}
                    </p>
                  </div>

                  {/* Shop Rating */}
                  <div>
                    <p className="text-xs text-gray-500">Shop Rating</p>
                    <div className="flex items-center gap-1.5">
                      <StarRating value={shop.rating} readonly size="sm" />
                      <span className="text-xs text-gray-600">
                        ({shop.totalOrders} orders)
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-1.5">
                    <MapPin
                      size={14}
                      className="text-gray-500 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-xs text-gray-700">{shop.address}</p>
                    </div>
                  </div>

                  {/* Bio */}
                  {shop.bio && (
                    <div>
                      <p className="text-xs text-gray-500">About Shop</p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {shop.bio}
                      </p>
                    </div>
                  )}

                  {/* Chat Button */}
                  <button
                    onClick={handleChatWithSeller}
                    className="w-full flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white font-medium px-3 py-2 rounded-lg transition mt-2 text-sm"
                  >
                    <MessageCircle size={16} />
                    Chat with Seller
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Shop information not available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsCard;
