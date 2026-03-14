'use client';

import { createLogger } from '@tec-shop/next-logger';
import DOMPurify from 'isomorphic-dompurify';
import { toast } from 'sonner';
import CartIcon from '../../../assets/svgs/cart-icon';

const logger = createLogger('user-ui:product-details');
import ProductCard from '../../../components/cards/product-card';
import ReviewForm from '../../../components/reviews/review-form';
import ReviewList from '../../../components/reviews/review-list';
import ProductMagnifier from '../../../components/ui/ProductMagnifier';
import StarRating from '../../../components/ui/star-rating';
import { useAuth } from '../../../contexts/auth-context';
import useDeviceTracking from '../../../hooks/use-device-tracking';
import useLocationTracking from '../../../hooks/use-location-tracking';
import useStore from '../../../store';
import { useShop } from '../../../hooks/use-shops';
import { useRouter } from '../../../i18n/navigation';
import { useCreateConversation } from '../../../hooks/use-chat';
import { useSimilarProducts } from '../../../hooks/use-recommendations';
import type { Product, ProductVariant } from '../../../lib/api/products';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  MapPin,
  MessageSquareText,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../../i18n/navigation';
import React, { useState, useEffect, useMemo } from 'react';

/**
 * ============================================
 * PRODUCT DETAILS PAGE - VARIANT SYSTEM OVERVIEW
 * ============================================
 *
 * This component handles products with multiple variants (Size, Color, etc.)
 *
 * DATA FLOW:
 * ----------
 * 1. Backend provides product with 42 variants:
 *    [
 *      { attributes: { Size: "XL", Color: "Blue" }, price: 19.99, stock: 100 },
 *      { attributes: { Size: "XL", Color: "Red" }, price: 19.99, stock: 50 },
 *      { attributes: { Size: "L", Color: "Blue" }, price: 18.99, stock: 75 },
 *      ... (39 more variants)
 *    ]
 *
 * 2. variantAttributes extracts unique options:
 *    [
 *      { name: "Size", values: ["XL", "L", "M", "S"] },
 *      { name: "Color", values: ["Blue", "Red", "Green"] }
 *    ]
 *
 * 3. UI renders button groups for each attribute
 *
 * 4. User makes selections:
 *    - Clicks "XL" → selectedAttributes = { Size: "XL" }
 *    - Clicks "Blue" → selectedAttributes = { Size: "XL", Color: "Blue" }
 *
 * 5. System finds matching variant:
 *    - Searches for variant with BOTH Size="XL" AND Color="Blue"
 *    - Updates: price ($19.99), stock (100), image (blue shirt)
 *
 * 6. Add to Cart button enabled when all attributes selected
 */
const ProductDetails = ({ product }: { product: Product }) => {
  const { user } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const createConversation = useCreateConversation();
  const router = useRouter();

  // ========== IMAGE GALLERY STATE ==========
  const [currentImage, setCurrentImage] = useState(product.images?.[0] || '');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomEnabled, setIsZoomEnabled] = useState(false);

  // Fetch shop details
  const { data: shop } = useShop(product.shopId);

  // ========== VARIANT SELECTION STATE ==========
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // ========== CART/PURCHASE STATE ==========
  const [quantity, setQuantity] = useState(1);

  // ========== SIMILAR PRODUCTS ==========
  const { data: similarProducts } = useSimilarProducts(product.id, 5);

  const addToCart = useStore((state) => state.addToCart);
  const cart = useStore((state) => state.cart);
  const isInCart = cart.some((item) => item.id === product.id);
  const addToWishList = useStore((state) => state.addToWishList);
  const removeFromWishList = useStore((state) => state.removeFromWishList);
  const wishlist = useStore((state) => state.wishlist);
  const isWishListed = wishlist.some((item) => item.id === product.id);

  /**
   * Extract unique attribute names and their possible values from all variants
   */
  const variantAttributes = useMemo(() => {
    if (!product.hasVariants || !product.variants || product.variants.length === 0) {
      return null;
    }
    const attributesMap = new Map<string, Set<string>>();
    product.variants.forEach((variant: ProductVariant) => {
      Object.entries(variant.attributes).forEach(([attributeName, attributeValue]) => {
        if (!attributesMap.has(attributeName)) {
          attributesMap.set(attributeName, new Set());
        }
        attributesMap.get(attributeName)?.add(attributeValue as string);
      });
    });
    return Array.from(attributesMap.entries()).map(([attributeName, uniqueValues]) => ({
      name: attributeName,
      values: Array.from(uniqueValues),
    }));
  }, [product.hasVariants, product.variants]);

  /**
   * Find the matching variant based on user's selected attributes
   */
  useEffect(() => {
    if (!product.hasVariants || !product.variants || !variantAttributes) {
      setSelectedVariant(null);
      return;
    }
    const requiredAttributeNames = variantAttributes.map((attr) => attr.name);
    const allAttributesSelected = requiredAttributeNames.every(
      (attributeName) => selectedAttributes[attributeName]
    );
    if (!allAttributesSelected) {
      setSelectedVariant(null);
      return;
    }
    const matchingVariant = product.variants.find((variant: ProductVariant) => {
      return requiredAttributeNames.every(
        (attributeName) =>
          variant.attributes[attributeName] === selectedAttributes[attributeName]
      );
    });
    setSelectedVariant(matchingVariant || null);
    if (matchingVariant && matchingVariant.image && product.images) {
      const variantImageIndex = product.images.indexOf(matchingVariant.image);
      if (variantImageIndex !== -1) {
        setCurrentIndex(variantImageIndex);
        setCurrentImage(matchingVariant.image);
      }
    }
  }, [selectedAttributes, product.hasVariants, product.variants, variantAttributes, product.images]);

  const displayPrice = selectedVariant
    ? selectedVariant.salePrice || selectedVariant.price
    : product.salePrice || product.price;

  const originalPrice = selectedVariant ? selectedVariant.price : product.price;
  const availableStock = selectedVariant ? selectedVariant.stock : product.stock;

  const discountPercentage = Math.round(
    ((originalPrice - displayPrice) / originalPrice) * 100
  );

  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(product.images[currentIndex - 1]);
    }
  };

  const nextImage = () => {
    if (currentIndex < product.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(product.images[currentIndex + 1]);
    }
  };

  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedAttributes((prev) => ({ ...prev, [attributeName]: value }));
    setQuantity(1);
  };

  const handleChatWithSeller = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!shop?.seller?.authId) {
      logger.error('Cannot start chat: seller information not available');
      return;
    }
    if (createConversation.isPending) return;
    try {
      const conversation = await createConversation.mutateAsync({
        targetId: shop.seller.authId,
        targetType: 'seller',
      });
      router.push(`/inbox?conversationId=${conversation.id}`);
    } catch (error) {
      logger.error('Failed to create conversation:', { error });
    }
  };

  const handleWishlistToggle = () => {
    if (isWishListed) {
      removeFromWishList(product.id, user ?? undefined, location ?? undefined, deviceInfo);
      toast.success('Removed from wishlist', { description: product.name });
    } else {
      const sellerId = shop?.seller?.authId || '';
      if (!sellerId) {
        logger.error('Cannot add to wishlist: sellerId not available from shop data');
        toast.error('Could not add to wishlist', { description: 'Shop information is not yet loaded.' });
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
          salePrice: displayPrice,
          quantity: 1,
          shopId: product.shopId,
          sellerId,
        },
        user ?? undefined,
        location ?? undefined,
        deviceInfo
      );
      toast.success('Added to wishlist', { description: product.name });
    }
  };

  const handleAddToCart = () => {
    const sellerId = shop?.seller?.authId || '';
    if (!sellerId) {
      logger.error('Cannot add to cart: sellerId not available from shop data');
      toast.error('Could not add to cart', { description: 'Shop information is not yet loaded.' });
      return;
    }
    addToCart(
      {
        id: product.id,
        slug: product.slug || product.id,
        title: product.name,
        price: displayPrice,
        image: selectedVariant?.image || product.images?.[0] || '',
        images: product.images || [],
        salePrice: displayPrice,
        quantity,
        shopId: product.shopId,
        sellerId,
        variantId: selectedVariant?.id,
        sku: selectedVariant?.sku,
      },
      user ?? undefined,
      location ?? undefined,
      deviceInfo
    );
    toast.success('Added to cart', { description: product.name });
  };

  const isCartDisabled =
    availableStock === 0 ||
    (!!variantAttributes && variantAttributes.length > 0 && !selectedVariant);

  const cartButtonLabel =
    variantAttributes && variantAttributes.length > 0 && !selectedVariant
      ? 'Select options'
      : isInCart
      ? 'Added to cart'
      : 'Add to cart';

  return (
    <div className="w-full bg-[#f5f5f5] py-6">
      {/* Breadcrumb */}
      <nav className="w-[90%] lg:w-[80%] mx-auto mb-5 flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
        <Link href="/" className="flex items-center hover:text-brand-primary transition-colors">
          <Home size={14} />
        </Link>
        <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        <Link href="/all-products" className="hover:text-brand-primary transition-colors">
          All Products
        </Link>
        {product.category && (
          <>
            <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
            <Link
              href={`/all-products?categoryId=${product.categoryId}`}
              className="hover:text-brand-primary transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
        <span className="text-gray-800 font-medium truncate max-w-[200px]" title={product.name}>
          {product.name}
        </span>
      </nav>

      {/* Main Product Card */}
      <div className="bg-white w-[90%] lg:w-[80%] mx-auto rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* ── LEFT: Image Gallery ── */}
          <div className="p-6 lg:p-8 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100">
            {/* Main image — padding-bottom trick guarantees a true square regardless of image ratio.
                overflow-hidden is intentionally omitted here so the zoom pane can escape the boundary. */}
            <div className="relative w-full pb-[100%]">
              <div className="absolute inset-0 bg-white flex items-center justify-center">
                <ProductMagnifier
                  smallImage={{ alt: product.name, isFluidWidth: true, src: currentImage }}
                  largeImage={{ src: currentImage, width: 1200, height: 1200 }}
                  enlargedImageContainerDimensions={{ width: 420, height: 420 }}
                  enlargedImageStyle={{ border: 'none', boxShadow: 'none' }}
                  enlargedImagePosition="right"
                  imageStyle={{ borderRadius: '16px' }}
                  className="w-full"
                  enabled={isZoomEnabled}
                />
              </div>
              {/* Zoom toggle button */}
              <button
                onClick={() => setIsZoomEnabled((v) => !v)}
                title={isZoomEnabled ? 'Disable zoom' : 'Enable zoom'}
                className={`absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-colors ${
                  isZoomEnabled
                    ? 'bg-brand-primary text-white'
                    : 'bg-white text-gray-500 hover:text-brand-primary'
                }`}
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {/* Thumbnails */}
            <div className="relative flex items-center gap-3 mt-4">
              {product.images?.length > 1 && currentIndex > 0 && (
                <button
                  onClick={prevImage}
                  className="absolute -left-3 z-10 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <ChevronLeft size={14} className="text-gray-600" />
                </button>
              )}

              <div className="flex gap-3 overflow-x-auto pb-1 scroll-smooth">
                {product.images?.map((img: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => { setCurrentIndex(index); setCurrentImage(img); }}
                    className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                      currentImage === img
                        ? 'border-brand-primary ring-2 ring-brand-primary/20'
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover bg-white"
                    />
                  </button>
                ))}
              </div>

              {product.images?.length > 1 && currentIndex < product.images.length - 1 && (
                <button
                  onClick={nextImage}
                  className="absolute -right-3 z-10 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <ChevronRight size={14} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="p-6 lg:p-8 flex flex-col">

            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">
              {product.name}
            </h1>

            {/* Rating + Reviews */}
            <div className="flex items-center gap-2 mt-2">
              <StarRating value={product.averageRating} size="md" />
              <Link
                href="#reviews"
                className="text-sm text-gray-500 hover:text-brand-primary transition-colors"
              >
                {product.ratingCount} {product.ratingCount === 1 ? 'review' : 'reviews'}
              </Link>
            </div>

            {/* Price */}
            <div className="mt-4 flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-gray-900">
                ${displayPrice.toFixed(2)}
              </span>
              {displayPrice < originalPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold bg-red-50 text-red-500 px-2.5 py-1 rounded-full">
                    {discountPercentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Brand */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Brand:</span>
              <span className="text-sm font-medium text-brand-primary">
                {product.brand?.name || 'No Brand'}
              </span>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100 my-5" />

            {/* Variant Selectors */}
            {variantAttributes && variantAttributes.length > 0 && (
              <div className="space-y-5 mb-5">
                {variantAttributes.map((attribute) => {
                  const isColorAttribute = attribute.name.toLowerCase() === 'color';
                  return (
                    <div key={attribute.name}>
                      <p className="text-sm font-semibold text-gray-700 mb-2.5">
                        {attribute.name}
                        {selectedAttributes[attribute.name] && (
                          <span className="ml-2 font-normal text-brand-primary">
                            {selectedAttributes[attribute.name]}
                          </span>
                        )}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {attribute.values.map((value) => {
                          const isSelected = selectedAttributes[attribute.name] === value;

                          if (isColorAttribute) {
                            return (
                              <button
                                key={value}
                                onClick={() => handleAttributeChange(attribute.name, value)}
                                className={`relative w-9 h-9 rounded-full border-2 transition-all ${
                                  isSelected
                                    ? 'border-brand-primary ring-2 ring-brand-primary/30 ring-offset-2 scale-110'
                                    : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                                }`}
                                style={{ backgroundColor: value.toLowerCase() }}
                                title={value}
                                aria-label={`Select ${value}`}
                              >
                                {isSelected && (
                                  <svg
                                    className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={value}
                              onClick={() => handleAttributeChange(attribute.name, value)}
                              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                                isSelected
                                  ? 'border-brand-primary bg-brand-primary text-white'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary'
                              }`}
                            >
                              {value}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {selectedVariant?.sku && (
                  <p className="text-xs text-gray-400">SKU: {selectedVariant.sku}</p>
                )}
              </div>
            )}

            {/* Quantity + Stock */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                >
                  −
                </button>
                <span className="w-12 text-center text-gray-900 font-semibold border-x border-gray-200 h-10 flex items-center justify-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((prev) => Math.min(availableStock, prev + 1))}
                  disabled={quantity >= availableStock}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-lg"
                >
                  +
                </button>
              </div>

              {availableStock > 0 ? (
                <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
                  In Stock &middot; {availableStock} left
                </span>
              ) : (
                <span className="text-sm font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                  Out of Stock
                </span>
              )}
            </div>

            {/* Add to Cart + Wishlist */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={isCartDisabled}
                className="flex-1 flex items-center justify-center gap-2.5 py-3.5 rounded-full bg-brand-primary text-white font-semibold text-sm hover:bg-brand-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CartIcon className="w-5 h-5" />
                {cartButtonLabel}
              </button>

              <button
                onClick={handleWishlistToggle}
                className={`w-14 h-14 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  isWishListed
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50'
                }`}
                title={isWishListed ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart
                  size={20}
                  fill={isWishListed ? '#ef4444' : 'transparent'}
                  className={isWishListed ? 'text-red-500' : 'text-gray-400'}
                />
              </button>
            </div>

            {/* Delivery strip */}
            <div className="mt-4 flex items-center gap-2.5 bg-gray-50 rounded-xl px-4 py-3 text-sm text-gray-600">
              <MapPin size={15} className="text-brand-primary flex-shrink-0" />
              <span>
                {location?.city && location?.country
                  ? `Deliver to ${location.city}, ${location.country}`
                  : 'Location unavailable'}
              </span>
              <span className="ml-auto text-gray-400 text-xs">7 days returns</span>
            </div>

            {/* Seller card */}
            <div className="mt-4 border border-gray-100 rounded-2xl p-4">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Sold by
              </p>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {shop?.businessName || '—'}
                </span>
                <button
                  onClick={handleChatWithSeller}
                  disabled={createConversation.isPending}
                  className="flex items-center gap-1.5 text-sm text-brand-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createConversation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <MessageSquareText size={14} />
                  )}
                  {createConversation.isPending ? 'Opening...' : 'Chat now'}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100 text-center">
                <div>
                  <p className="text-xs text-gray-400">Ratings</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">88%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ships on time</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">100%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Response</p>
                  <p className="text-sm font-bold text-gray-900 mt-0.5">100%</p>
                </div>
              </div>

              <Link
                href={`/shops/${product.shopId}`}
                className="block text-center text-xs font-semibold text-brand-primary hover:underline mt-3 pt-3 border-t border-gray-100 uppercase tracking-wide"
              >
                Go to Store
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="w-[90%] lg:w-[80%] mx-auto mt-5">
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Product details
          </h2>
          <div
            className="prose prose-sm text-gray-500 max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description) }}
          />
        </div>
      </div>

      {/* Ratings & Reviews */}
      <div className="w-[90%] lg:w-[80%] mx-auto mt-5" id="reviews">
        <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Ratings &amp; Reviews
          </h2>
          <ReviewForm productId={product.id} />
          <div className="mt-6">
            <ReviewList productId={product.id} />
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts && similarProducts.length > 0 && (
        <div className="w-[90%] lg:w-[80%] mx-auto mt-5">
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              You may also like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {similarProducts.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
