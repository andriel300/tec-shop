'use client';

import Image from 'next/image';
import React, { useState, useMemo, useEffect } from 'react';
import StarRating from '../ui/star-rating';
import type { Product, ProductVariant } from '../../lib/api/products';
import {
  Minus,
  Plus,
  ShoppingCart,
  X,
  MapPin,
  MessageCircle,
  Store,
  Heart,
  Truck,
} from 'lucide-react';
import { useShop } from '../../hooks/use-shops';
import { useAuth } from '../../hooks/use-auth';
import useLocationTracking from '../../hooks/use-location-tracking';
import useDeviceTracking from '../../hooks/use-device-tracking';
import useStore from '../../store';

interface ProductDetailsCardProps {
  product: Product;
  setOpen: (open: boolean) => void;
}

const ProductDetailsCard = ({ product, setOpen }: ProductDetailsCardProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  const { user } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  // Zustand store hooks
  const addToCart = useStore((state) => state.addToCart);
  // const removeFromCart = useStore((state) => state.removeFromCart);
  const addToWishList = useStore((state) => state.addToWishList);
  // const removeFromWishList = useStore((state) => state.removeFromWishList);
  const wishlist = useStore((state) => state.wishlist);
  const cart = useStore((state) => state.cart);

  const isWishListed = wishlist.some((item) => {
    if (selectedVariant && item.variantId) {
      return item.id === product.id && item.variantId === selectedVariant.id;
    }
    return item.id === product.id && !item.variantId;
  });

  const isInCart = cart.some((item) => {
    if (selectedVariant && item.variantId) {
      return item.id === product.id && item.variantId === selectedVariant.id;
    }
    return item.id === product.id && !item.variantId;
  });

  // Fetch shop details
  const { data: shop, isLoading: isShopLoading } = useShop(product.shopId);

  // Extract unique attribute names and values from variants
  const variantAttributes = useMemo(() => {
    if (
      !product.hasVariants ||
      !product.variants ||
      product.variants.length === 0
    ) {
      return null;
    }

    const attributesMap = new Map<string, Set<string>>();

    product.variants.forEach((variant) => {
      if (variant.isActive) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!attributesMap.has(key)) {
            attributesMap.set(key, new Set());
          }
          attributesMap.get(key)?.add(value);
        });
      }
    });

    return Array.from(attributesMap.entries()).map(([name, values]) => ({
      name,
      values: Array.from(values),
    }));
  }, [product.hasVariants, product.variants]);

  // Find matching variant based on selected attributes
  useEffect(() => {
    if (!product.hasVariants || !product.variants || !variantAttributes) {
      setSelectedVariant(null);
      return;
    }

    const attributeNames = variantAttributes.map((attr) => attr.name);
    const allAttributesSelected = attributeNames.every(
      (name) => selectedAttributes[name]
    );

    if (!allAttributesSelected) {
      setSelectedVariant(null);
      return;
    }

    const matchingVariant = product.variants.find((variant) => {
      if (!variant.isActive) return false;
      return attributeNames.every(
        (name) => variant.attributes[name] === selectedAttributes[name]
      );
    });

    setSelectedVariant(matchingVariant || null);

    // Update active image if variant has a specific image
    if (matchingVariant && matchingVariant.image && product.images) {
      const variantImageIndex = product.images.indexOf(matchingVariant.image);
      if (variantImageIndex !== -1) {
        setActiveImage(variantImageIndex);
      }
    }
  }, [
    selectedAttributes,
    product.hasVariants,
    product.variants,
    variantAttributes,
    product.images,
  ]);

  // Calculate display price based on selected variant or product
  const displayPrice = selectedVariant
    ? selectedVariant.salePrice ?? selectedVariant.price
    : product.salePrice ?? product.price;

  const originalPrice = selectedVariant?.price ?? product.price ?? 0;
  const hasDiscount = displayPrice < originalPrice;

  // Calculate available stock
  const availableStock = selectedVariant
    ? selectedVariant.stock
    : product.stock;

  // Calculate estimated delivery (7-10 business days from now)
  const estimatedDelivery = useMemo(() => {
    const today = new Date();
    const minDays = 7;
    const maxDays = 10;

    const minDate = new Date(today);
    minDate.setDate(today.getDate() + minDays);

    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + maxDays);

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    };

    return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
  }, []);

  const handleQuantityChange = (type: 'increment' | 'decrement') => {
    if (type === 'increment' && quantity < availableStock) {
      setQuantity(quantity + 1);
    } else if (type === 'decrement' && quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    if (isInCart) {
      // Remove the specific variant or simple product
      useStore.setState((state) => ({
        cart: state.cart.filter((item) => {
          if (selectedVariant && item.variantId) {
            return !(
              item.id === product.id && item.variantId === selectedVariant.id
            );
          }
          return !(item.id === product.id && !item.variantId);
        }),
      }));
    } else {
      // Get sellerId from shop data (required for order processing)
      // Use authId instead of MongoDB _id for cross-service consistency
      const sellerId = shop?.seller?.authId || '';

      if (!sellerId) {
        console.error(
          'Cannot add to cart: sellerId not available from shop data'
        );
        return;
      }

      const productData = {
        id: product.id,
        slug: product.slug || product.id,
        title: product.name,
        price: displayPrice,
        image: selectedVariant?.image || product.images?.[0] || '',
        images: product.images || [],
        quantity,
        shopId: product.shopId,
        sellerId,
        variantId: selectedVariant?.id,
        sku: selectedVariant?.sku,
        variantAttributes: selectedVariant?.attributes as
          | Record<string, string>
          | undefined,
      };
      addToCart(
        productData,
        user ?? undefined,
        location ?? undefined,
        deviceInfo ?? undefined
      );
    }
  };

  const handleChatWithSeller = () => {
    if (shop) {
      console.log(`Opening chat with shop: ${shop.businessName}`);
      // TODO: router.push(`/inbox?shopId=${shop.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWishListed) {
      // Remove the specific variant or simple product
      useStore.setState((state) => ({
        wishlist: state.wishlist.filter((item) => {
          if (selectedVariant && item.variantId) {
            return !(
              item.id === product.id && item.variantId === selectedVariant.id
            );
          }
          return !(item.id === product.id && !item.variantId);
        }),
      }));
    } else {
      // Get sellerId from shop data (required for order processing)
      // Use authId instead of MongoDB _id for cross-service consistency
      const sellerId = shop?.seller?.authId || '';

      if (!sellerId) {
        console.error(
          'Cannot add to wishlist: sellerId not available from shop data'
        );
        return;
      }

      addToWishList(
        {
          id: product.id,
          slug: product.slug || product.id,
          title: product.name,
          price: displayPrice,
          image: selectedVariant?.image || product.images?.[0] || '',
          images: product.images || [],
          quantity: 1,
          shopId: product.shopId,
          sellerId,
          variantId: selectedVariant?.id,
          sku: selectedVariant?.sku,
          variantAttributes: selectedVariant?.attributes as
            | Record<string, string>
            | undefined,
        },
        user ?? undefined,
        location ?? undefined,
        deviceInfo ?? undefined
      );
    }
  };

  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: value,
    }));
    setQuantity(1); // Reset quantity when variant changes
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
        <div className="sticky top-0 left-0 right-0 flex justify-end gap-2 z-20 mb-2">
          <button
            className="bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-100 transition"
            onClick={() => setOpen(false)}
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-700 hover:text-gray-900" />
          </button>
        </div>

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
                  ${originalPrice.toFixed(2)}
                </span>
              )}
              {hasDiscount && (
                <span className="bg-red-100 text-red-600 text-xs font-semibold px-2 py-0.5 rounded">
                  Save ${(originalPrice - displayPrice).toFixed(2)}
                </span>
              )}
            </div>

            {/* Variant Selector */}
            {variantAttributes && variantAttributes.length > 0 && (
              <div className="mb-3 space-y-2">
                {variantAttributes.map((attribute) => (
                  <div key={attribute.name}>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1.5 capitalize">
                      {attribute.name}:
                      {selectedAttributes[attribute.name] && (
                        <span className="ml-1.5 text-brand-primary font-normal">
                          {selectedAttributes[attribute.name]}
                        </span>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {attribute.values.map((value) => {
                        const isSelected =
                          selectedAttributes[attribute.name] === value;

                        return (
                          <button
                            key={value}
                            onClick={() =>
                              handleAttributeChange(attribute.name, value)
                            }
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg border-2 transition ${
                              isSelected
                                ? 'border-brand-primary bg-brand-primary text-white'
                                : 'border-gray-300 bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {selectedVariant && selectedVariant.sku && (
                  <p className="text-xs text-gray-500">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            )}

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
              {availableStock > 0 ? (
                <p className="text-green-600 text-sm font-medium">
                  In Stock ({availableStock} available)
                </p>
              ) : (
                <p className="text-red-600 text-sm font-medium">Out of Stock</p>
              )}
            </div>

            {/* Estimated Delivery */}
            {availableStock > 0 && (
              <div className="mb-3 flex items-start gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
                <Truck
                  size={18}
                  className="text-blue-600 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Estimated Delivery
                  </p>
                  <p className="text-sm text-gray-600">{estimatedDelivery}</p>
                </div>
              </div>
            )}

            {/* Quantity Selector & Add to Cart */}
            {availableStock > 0 && (
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
                    disabled={quantity >= availableStock}
                    className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={Boolean(
                    variantAttributes &&
                      variantAttributes.length > 0 &&
                      !selectedVariant
                  )}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-2.5 rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    isInCart
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-brand-primary hover:bg-brand-primary-dark text-white'
                  }`}
                >
                  <ShoppingCart size={18} />
                  {variantAttributes &&
                  variantAttributes.length > 0 &&
                  !selectedVariant
                    ? 'Select Options'
                    : isInCart
                    ? 'Remove from Cart'
                    : 'Add to Cart'}
                </button>
                <button
                  className="bg-white rounded-lg p-2.5 shadow-lg hover:bg-gray-100 transition"
                  onClick={handleFavoriteClick}
                  aria-label={
                    isWishListed ? 'Remove from favorites' : 'Add to favorites'
                  }
                >
                  <Heart
                    size={20}
                    className={`${
                      isWishListed
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-700'
                    } hover:text-red-500 transition`}
                  />
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
                      <StarRating value={shop.rating ?? 0} readonly size="sm" />
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
