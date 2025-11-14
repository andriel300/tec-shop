'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '../../lib/api/products';
import StarRating from '../ui/star-rating';
import { Eye, Heart, ShoppingBag } from 'lucide-react';
import ProductDetailsCard from './product-details.card';
import { useAuth } from '../../hooks/use-auth';
import useLocationTracking from '../../hooks/use-location-tracking';
import useDeviceTracking from '../../hooks/use-device-tracking';
import useStore from '../../store';
import { useShop } from '../../hooks/use-shops';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const displayPrice = product.salePrice || product.price;
  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const [open, setOpen] = useState(false);

  const { user } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  // Fetch shop details to get sellerId
  const { data: shop } = useShop(product.shopId);

  // Zustand store hooks
  const addToCart = useStore((state) => state.addToCart);
  const removeFromCart = useStore((state) => state.removeFromCart);
  const addToWishList = useStore((state) => state.addToWishList);
  const removeFromWishList = useStore((state) => state.removeFromWishList);
  const wishlist = useStore((state) => state.wishlist);
  const cart = useStore((state) => state.cart);

  const isWishListed = wishlist.some((item) => item.id === product.id);
  const isInCart = cart.some((item) => item.id === product.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishListed) {
      removeFromWishList(product.id, user, location, deviceInfo);
    } else {
      // Get sellerId from shop data (required for order processing)
      const sellerId = shop?.seller?.id || '';

      if (!sellerId) {
        console.error('Cannot add to wishlist: sellerId not available from shop data');
        return;
      }

      addToWishList(
        {
          id: product.id,
          slug: product.slug || product.id,
          title: product.name,
          price: displayPrice,
          image: product.images?.[0] || '',
          images: product.images || [],
          quantity: 1,
          shopId: product.shopId,
          sellerId,
        },
        user,
        location,
        deviceInfo
      );
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(!open);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isInCart) {
      removeFromCart(product.id, user, location, deviceInfo);
    } else {
      // Get sellerId from shop data (required for order processing)
      const sellerId = shop?.seller?.id || '';

      if (!sellerId) {
        console.error('Cannot add to cart: sellerId not available from shop data');
        return;
      }

      addToCart(
        {
          id: product.id,
          slug: product.slug || product.id,
          title: product.name,
          price: displayPrice,
          image: product.images?.[0] || '',
          images: product.images || [],
          quantity: 1,
          shopId: product.shopId,
          sellerId,
        },
        user,
        location,
        deviceInfo
      );
    }
  };

  return (
    <>
      <Link href={`/product/${product.slug || product.id}`}>
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden h-full flex flex-col">
          <div className="relative w-full h-[200px] bg-gray-100">
            {/* Image */}
            {product.images && product.images.length > 0 ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover hover:scale-110 transition-transform duration-300"
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
                  isWishListed ? 'Remove from favorites' : 'Add to favorites'
                }
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWishListed ? 'fill-red-500 text-red-500' : 'text-gray-700'
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
                className=" bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow
                           hover:scale-110 transition-transform duration-200"
                aria-label={isInCart ? 'Remove from cart' : 'Add to cart'}
              >
                <ShoppingBag
                  className={`w-5 h-5 transition ${
                    isInCart
                      ? 'bg-green-100 text-green-600'
                      : 'bg-white/90 text-gray-700'
                  }`}
                />
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

      {/* QuickView Modal - Outside Link wrapper */}
      {open && <ProductDetailsCard product={product} setOpen={setOpen} />}
    </>
  );
};

export default ProductCard;
