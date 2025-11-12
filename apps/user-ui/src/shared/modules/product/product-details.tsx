'use client';

import CartIcon from 'apps/user-ui/src/assets/svgs/cart-icon';
import ProductCard from 'apps/user-ui/src/components/cards/product-card';
import ProductMagnifier from 'apps/user-ui/src/components/ui/ProductMagnifier';
import StarRating from 'apps/user-ui/src/components/ui/star-rating';
import { useAuth } from 'apps/user-ui/src/contexts/auth-context';
import useDeviceTracking from 'apps/user-ui/src/hooks/use-device-tracking';
import useLocationTracking from 'apps/user-ui/src/hooks/use-location-tracking';
import apiClient from 'apps/user-ui/src/lib/api/client';
import useStore from 'apps/user-ui/src/store';
import type { ProductVariant } from 'apps/user-ui/src/lib/api/products';
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  MessageSquareText,
  Package,
  WalletMinimal,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState, useMemo } from 'react';

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
const ProductDetails = ({ product }: { product: any }) => {
  const { user, isLoading } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  // ========== IMAGE GALLERY STATE ==========
  const [currentImage, setCurrentImage] = useState(product.images?.[0] || '');
  const [currentIndex, setCurrentIndex] = useState(0);

  // ========== VARIANT SELECTION STATE ==========
  // selectedVariant: The fully matched variant object (e.g., XL + Blue variant)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );

  // selectedAttributes: User's current selections { Size: "XL", Color: "Blue" }
  const [selectedAttributes, setSelectedAttributes] = useState<
    Record<string, string>
  >({});

  // ========== CART/PURCHASE STATE ==========
  const [quantity, setQuantity] = useState(1);

  // ========== RECOMMENDATIONS STATE ==========
  const [priceRange, setPriceRange] = useState([product.price, 1199]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // ========== SHOP INFO STATE ==========
  const [shopInfo, setShopInfo] = useState<any>(null);

  const addToCart = useStore((state) => state.addToCart);
  const cart = useStore((state) => state.cart);
  const isInCart = cart.some((item) => item.id === product.id);
  const addToWishList = useStore((state) => state.addToWishList);
  const removeFromWishList = useStore((state) => state.removeFromWishList);
  const wishlist = useStore((state) => state.wishlist);
  const isWishListed = wishlist.some((item) => item.id === product.id);

  /**
   * Extract unique attribute names and their possible values from all variants
   *
   * Example: If product has 42 variants with attributes like:
   * - { Size: "XL", Color: "Blue" }
   * - { Size: "XL", Color: "Red" }
   * - { Size: "L", Color: "Blue" }
   * - { Size: "L", Color: "Red" }
   * - etc...
   *
   * This will extract:
   * [
   *   { name: "Size", values: ["XL", "L", "M", "S"] },
   *   { name: "Color", values: ["Blue", "Red", "Green"] }
   * ]
   *
   * These will be rendered as separate button groups for user selection
   */
  const variantAttributes = useMemo(() => {
    // If product doesn't have variants, don't show variant selectors
    if (
      !product.hasVariants ||
      !product.variants ||
      product.variants.length === 0
    ) {
      return null;
    }

    // Use Map to store unique values for each attribute (e.g., "Size" -> Set["XL", "L", "M"])
    const attributesMap = new Map<string, Set<string>>();

    // Loop through all variants to collect all possible attribute values
    // Backend already filters by isActive: true, so all variants here are available
    product.variants.forEach((variant: ProductVariant) => {
      // variant.attributes example: { Size: "XL", Color: "Blue" }
      Object.entries(variant.attributes).forEach(
        ([attributeName, attributeValue]) => {
          // attributeName = "Size" or "Color"
          // attributeValue = "XL" or "Blue"

          // If this attribute hasn't been seen before, create a new Set for it
          if (!attributesMap.has(attributeName)) {
            attributesMap.set(attributeName, new Set());
          }

          // Add this value to the attribute's Set (duplicates are automatically ignored)
          attributesMap.get(attributeName)?.add(attributeValue as string);
        }
      );
    });

    // Convert Map to array format for easier rendering
    // Result: [{ name: "Size", values: ["XL", "L", "M"] }, { name: "Color", values: ["Blue", "Red"] }]
    return Array.from(attributesMap.entries()).map(
      ([attributeName, uniqueValues]) => ({
        name: attributeName, // "Size" or "Color"
        values: Array.from(uniqueValues), // ["XL", "L", "M"] or ["Blue", "Red"]
      })
    );
  }, [product.hasVariants, product.variants]);

  /**
   * Find the matching variant based on user's selected attributes
   *
   * Example flow:
   * 1. User clicks Size: "XL"  → selectedAttributes = { Size: "XL" }
   * 2. User clicks Color: "Blue" → selectedAttributes = { Size: "XL", Color: "Blue" }
   * 3. This effect finds the variant that matches both: { Size: "XL", Color: "Blue" }
   * 4. Updates price, stock, and image based on matched variant
   */
  useEffect(() => {
    // No variants to match
    if (!product.hasVariants || !product.variants || !variantAttributes) {
      setSelectedVariant(null);
      return;
    }

    // Get list of all required attribute names (e.g., ["Size", "Color"])
    const requiredAttributeNames = variantAttributes.map((attr) => attr.name);

    // Check if user has selected a value for ALL required attributes
    // Example: User must select BOTH Size AND Color before we can find a match
    const allAttributesSelected = requiredAttributeNames.every(
      (attributeName) => selectedAttributes[attributeName]
    );

    // If user hasn't selected all attributes yet, don't try to find a match
    if (!allAttributesSelected) {
      setSelectedVariant(null);
      return;
    }

    /**
     * Find the variant that exactly matches the user's selections
     *
     * Example:
     * selectedAttributes = { Size: "XL", Color: "Blue" }
     *
     * Will find variant with:
     * { attributes: { Size: "XL", Color: "Blue" }, price: 19.99, stock: 100, ... }
     */
    const matchingVariant = product.variants.find((variant: ProductVariant) => {
      // Check if ALL attribute names match the selected values
      // attributeName could be "Size" or "Color"
      return requiredAttributeNames.every((attributeName) => {
        // Does this variant's Size match selected Size? AND
        // Does this variant's Color match selected Color?
        return (
          variant.attributes[attributeName] ===
          selectedAttributes[attributeName]
        );
      });
    });

    // Set the matched variant (or null if no exact match found)
    setSelectedVariant(matchingVariant || null);

    /**
     * If this variant has a specific image (e.g., image of blue shirt vs red shirt),
     * automatically switch to that image in the gallery
     */
    if (matchingVariant && matchingVariant.image && product.images) {
      const variantImageIndex = product.images.indexOf(matchingVariant.image);
      if (variantImageIndex !== -1) {
        setCurrentIndex(variantImageIndex);
        setCurrentImage(matchingVariant.image);
      }
    }
  }, [
    selectedAttributes,
    product.hasVariants,
    product.variants,
    variantAttributes,
    product.images,
  ]);

  /**
   * Display price logic:
   * - If user selected a variant (e.g., XL Blue): show that variant's price
   * - If no variant selected yet: show base product price
   * - Always prefer sale price over regular price if available
   */
  const displayPrice = selectedVariant
    ? selectedVariant.salePrice || selectedVariant.price // Variant's sale or regular price
    : product.salePrice || product.price; // Product's sale or regular price

  /**
   * Original price (before discount) for calculating discount percentage
   */
  const originalPrice = selectedVariant ? selectedVariant.price : product.price;

  /**
   * Available stock logic:
   * - If user selected a variant (e.g., XL Blue): show stock for that specific variant
   * - If no variant selected yet: show total product stock
   *
   * Example: Product has 500 total stock, but "XL Blue" variant only has 100 stock
   */
  const availableStock = selectedVariant
    ? selectedVariant.stock
    : product.stock;

  // Navigate to previous image
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentImage(product.images[currentIndex - 1]);
    }
  };

  // Navigate to next Imagea
  const nextImage = () => {
    if (currentIndex < product.images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(product.images[currentIndex + 1]);
    }
  };

  const discoutPercentage = Math.round(
    ((originalPrice - displayPrice) / originalPrice) * 100
  );

  /**
   * Handle user clicking on an attribute button (Size or Color)
   *
   * @param attributeName - "Size" or "Color"
   * @param value - "XL" or "Blue"
   *
   * Example:
   * User clicks "XL" button → handleAttributeChange("Size", "XL")
   * Updates: selectedAttributes = { Size: "XL" }
   *
   * Then user clicks "Blue" → handleAttributeChange("Color", "Blue")
   * Updates: selectedAttributes = { Size: "XL", Color: "Blue" }
   */
  const handleAttributeChange = (attributeName: string, value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [attributeName]: value, // Add or update this attribute
    }));
    setQuantity(1); // Reset quantity to 1 when changing variant
  };

  const fetchFilteredProducts = async () => {
    try {
      const query = new URLSearchParams();

      // Use the existing public products endpoint with proper parameters
      query.set('minPrice', priceRange[0].toString());
      query.set('maxPrice', priceRange[1].toString());
      query.set('limit', '5');
      query.set('offset', '0');
      query.set('sort', 'newest');

      const res = await apiClient.get(`/public/products?${query.toString()}`);
      setRecommendedProducts(res.data.products);
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    }
  };

  const fetchShopInfo = async () => {
    if (!product.shopId) return;
    try {
      const res = await apiClient.get(`/public/shops/${product.shopId}`);
      setShopInfo(res.data);
    } catch (error) {
      console.error('Error fetching shop info:', error);
    }
  };

  useEffect(() => {
    fetchFilteredProducts();
    fetchShopInfo();
  }, [priceRange, product.shopId]);

  return (
    <div className="w-full bg-[#f5f5f5] py-5">
      <div className="bg-white w-[90%] lg:w-[80%] mx-auto pt-6 grid grid-cols-1 lg:grid-cols-[28%_44%_28%] gap-6 overflow-hidden">
        {/* left column - product images */}
        <div className="p-4">
          <div className="relative w-full">
            {/* Main Image with Zoom */}

            <ProductMagnifier
              smallImage={{
                alt: 'Product Image',
                isFluidWidth: true,
                src: currentImage,
              }}
              largeImage={{
                src: currentImage,
                width: 1200,
                height: 1200,
              }}
              enlargedImageContainerDimensions={{
                width: '150%',
                height: '150%',
              }}
              enlargedImageStyle={{
                border: 'none',
                boxShadow: 'none',
              }}
              enlargedImagePosition="right"
            />
          </div>
          {/* Thumbnails */}
          <div className="relative flex items-center gap-2 mt-4 overflow-hidden">
            {product?.images?.length > 4 && (
              <button
                className="absolute left-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={prevImage}
                disabled={currentIndex === 0}
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <div className="flex gap-2 overflow-x-auto">
              {product?.images?.map((img: string, index: number) => (
                <Image
                  key={index}
                  src={img}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  width={60}
                  height={60}
                  className={`cursor-pointer border rounded-lg p-1 object-cover ${
                    currentImage === img
                      ? 'border-brand-primary'
                      : 'border-gray-300'
                  }`}
                  onClick={() => {
                    setCurrentIndex(index);
                    setCurrentImage(img);
                  }}
                />
              ))}
            </div>
            {product?.images.length > 4 && (
              <button
                className="absolute right-0 bg-white p-2 rounded-full shadow-md z-10"
                onClick={nextImage}
                disabled={currentIndex === product?.images.length - 1}
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
        {/* Middle Column - product details */}
        <div className="p-4">
          <h1 className="text-xl mb-2 font-medium">{product?.name}</h1>
          <div className="w-full flex items-center justify-between">
            <div className="flex gap-2 mt-2 text-yellow-500">
              <StarRating
                value={product.averageRating}
                size="md"
                showCount
                count={product.ratingCount}
              />
              <Link href={'#reviews'} className="text-blue-500 hover:underline">
                (0 Reviews)
              </Link>
            </div>
            <div>
              <Heart
                size={25}
                fill={isWishListed ? 'red' : 'transparent'}
                className="cursor-pointer"
                color={isWishListed ? 'transparent' : '#777'}
                onClick={() =>
                  isWishListed
                    ? removeFromWishList(product.id, user, location, deviceInfo)
                    : addToWishList(
                        {
                          id: product.id,
                          title: product.name,
                          price: displayPrice,
                          image:
                            selectedVariant?.image || product.images?.[0] || '',
                          images: product.images?.[0] || '',
                          salePrice: displayPrice,
                          quantity: 1,
                          shopId: product.shopId,
                        },
                        user,
                        location,
                        deviceInfo
                      )
                }
              />
            </div>
          </div>
          <div className="py-2 border-b border-gray-200">
            <span className="text-gray-500">
              Brand:{' '}
              <span className="text-blue-500">
                {product?.brand?.name || 'No Brand'}
              </span>
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-bold text-orange-500">
              ${displayPrice.toFixed(2)}
            </span>
            <div className="flex gap-2 pb-2 text-lg border-b border-b-slate-200">
              {displayPrice < originalPrice && (
                <>
                  <span className="text-gray-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className="text-gray-500">
                    {discoutPercentage}% off
                  </span>
                </>
              )}
            </div>

            {/*
              ========================================
              VARIANT SELECTOR SECTION
              ========================================

              This section renders interactive buttons for Size, Color, etc.
              Only shows if product has variants (hasVariants = true)

              Example rendering for a T-shirt with Size and Color:

              Size: XL
              [S] [M] [L] [XL] ← clickable buttons

              Color: Blue
              [Red] [Blue] [Green] ← clickable buttons

              When user clicks both Size AND Color, it finds matching variant
            */}
            {variantAttributes && variantAttributes.length > 0 && (
              <div className="mt-4 space-y-4">
                {/*
                  Loop through each attribute type (Size, Color, etc.)
                  variantAttributes = [
                    { name: "Size", values: ["S", "M", "L", "XL"] },
                    { name: "Color", values: ["Red", "Blue", "Green"] }
                  ]
                */}
                {variantAttributes.map((attribute) => (
                  <div key={attribute.name}>
                    {/*
                      Attribute header showing:
                      - Attribute name (Size, Color)
                      - Currently selected value if any (e.g., "Size: XL")
                    */}
                    <h3 className="text-base font-semibold text-gray-800 mb-2 capitalize">
                      {attribute.name}:
                      {/* Show selected value in brand color */}
                      {selectedAttributes[attribute.name] && (
                        <span className="ml-2 text-brand-primary font-normal">
                          {selectedAttributes[attribute.name]}
                        </span>
                      )}
                    </h3>

                    {/*
                      Button group for this attribute
                      For Size: renders text buttons [S] [M] [L] [XL]
                      For Color: renders colored circles with actual color fill
                    */}
                    <div className="flex flex-wrap gap-2 items-center">
                      {attribute.values.map((value) => {
                        // Check if this specific value is currently selected
                        // Example: Is "XL" selected for Size?
                        const isSelected =
                          selectedAttributes[attribute.name] === value;

                        // Check if this attribute is Color to render differently
                        const isColorAttribute =
                          attribute.name.toLowerCase() === 'color';

                        // For Color attribute: render circular color swatch
                        if (isColorAttribute) {
                          return (
                            <button
                              key={value}
                              onClick={() =>
                                handleAttributeChange(attribute.name, value)
                              }
                              className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                                isSelected
                                  ? 'border-brand-primary ring-2 ring-brand-primary ring-offset-2 scale-110' // Selected: thick border + ring
                                  : 'border-gray-300 hover:border-gray-400 hover:scale-105' // Not selected: thin border
                              }`}
                              style={{ backgroundColor: value.toLowerCase() }}
                              title={value} // Show color name on hover
                              aria-label={`Select ${value} color`}
                            >
                              {/* Checkmark icon when selected */}
                              {isSelected && (
                                <svg
                                  className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow-md"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </button>
                          );
                        }

                        // For other attributes (Size, Material, etc.): render text button
                        return (
                          <button
                            key={value}
                            onClick={() =>
                              handleAttributeChange(attribute.name, value)
                            }
                            className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition ${
                              isSelected
                                ? 'border-brand-primary bg-brand-primary text-white' // Selected: filled with brand color
                                : 'border-gray-300 bg-white text-gray-700 hover:border-brand-primary hover:text-brand-primary' // Not selected: gray outline
                            }`}
                          >
                            {value}
                            {/* Display: "S", "M", "L", "XL", etc. */}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/*
                  Show SKU when user has selected all attributes and variant is matched
                  Example: SKU: CCT-XL-BL-3515 (for XL Blue variant)
                */}
                {selectedVariant && selectedVariant.sku && (
                  <p className="text-sm text-gray-500">
                    SKU: {selectedVariant.sku}
                  </p>
                )}
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-md">
                  <button
                    className="px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-l-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 bg-gray-100 py-1">{quantity}</span>
                  <button
                    className="px-3 cursor-pointer py-1 bg-gray-300 hover:bg-gray-400 text-black font-semibold rounded-r-md disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() =>
                      setQuantity((prev) => Math.min(availableStock, prev + 1))
                    }
                    disabled={quantity >= availableStock}
                  >
                    +
                  </button>
                </div>
                {availableStock > 0 ? (
                  <span className="text-green-600 font-semibold">
                    In Stock{' '}
                    <span className="text-gray-500 font-medium">
                      ({availableStock} available)
                    </span>
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    Out of Stock
                  </span>
                )}
              </div>

              <button
                className={`flex mt-6 items-center gap-2 px-5 py-[10px] bg-[#ff5722] hover:bg-[#e64a19] text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  isInCart ? 'bg-green-600 hover:bg-green-700' : ''
                }`}
                disabled={
                  availableStock === 0 ||
                  (variantAttributes &&
                    variantAttributes.length > 0 &&
                    !selectedVariant)
                }
                onClick={() =>
                  addToCart(
                    {
                      id: product.id,
                      slug: product.slug,
                      title: product.name,
                      price: displayPrice,
                      image:
                        selectedVariant?.image || product.images?.[0] || '',
                      images: product.images || [],
                      salePrice: displayPrice,
                      quantity,
                      shopId: product.shopId,
                    },
                    user,
                    location,
                    deviceInfo
                  )
                }
              >
                <CartIcon className="w-7 h-7" />
                {variantAttributes &&
                variantAttributes.length > 0 &&
                !selectedVariant
                  ? 'Please Select Options'
                  : isInCart
                  ? 'Added to Cart'
                  : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
        {/*  right column - seller information */}
        <div className="bg-[#fafafa] h-fit p-4 mt-6 rounded-lg">
          <div className="mb-3 pb-3 border-b border-b-gray-200">
            <span className="text-sm text-gray-600 block mb-2">
              Delivery Options
            </span>
            <div className="flex items-center text-gray-700 gap-2">
              <MapPin size={18} />
              <span className="text-base font-normal">
                {location?.city && location?.country
                  ? `${location.city}, ${location.country}`
                  : 'Location unavailable'}
              </span>
            </div>
          </div>
          <div className="mb-3 pb-3 border-b border-b-gray-200">
            <span className="text-sm text-gray-600 block mb-2">
              Return & Warranty
            </span>
            <div className="flex items-center text-gray-700 gap-2 mb-2">
              <Package size={18} />
              <span className="text-base font-normal">7 Days Returns</span>
            </div>
            <div className="flex items-center text-gray-700 gap-2">
              <WalletMinimal size={18} />
              <span className="text-base font-normal">
                Warranty not available
              </span>
            </div>
          </div>
          <div className="pb-3 border-b border-b-gray-200">
            {/* Sold by section */}
            <div className="mb-2">
              <span className="text-sm text-gray-600 block mb-1">Sold by</span>
              <span className="block font-medium text-lg text-gray-800">
                {shopInfo?.businessName || 'Loading...'}
              </span>
            </div>
            <Link
              href={'#'}
              className="text-blue-500 text-sm flex items-center gap-1 hover:underline"
            >
              <MessageSquareText size={16} />
              Chat Now
            </Link>
          </div>

          {/* Seller Performance Status */}
          <div className="py-3 space-y-2">
            <div>
              <p className="text-xs text-gray-500">Positive Seller Ratings</p>
              <p className="text-lg font-semibold text-gray-800">88%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ship on Time</p>
              <p className="text-lg font-semibold text-gray-800">100%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Chat Response Rate</p>
              <p className="text-lg font-semibold text-gray-800">100%</p>
            </div>
          </div>

          {/* Go to the Store */}
          <div className="text-center mt-3 pt-3 border-t border-t-gray-200">
            <Link
              href={`/shop/${product.shopId}`}
              className="text-blue-500 font-medium text-sm hover:underline uppercase"
            >
              GO TO STORE
            </Link>
          </div>
        </div>
      </div>

      <div className="w-[90%] lg:w-[80%] mx-auto mt-5">
        <div className="bg-white min-h-[60vh] h-full p-5">
          <h3 className="text-lg font-semibold">
            Product details of {product.name}
          </h3>
          <div
            className="prose prose-sm text-slate-500 max-w-none"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      </div>
      <div className="w-[90%] lg:w-[80%] mx-auto">
        <div className="bg-white min-h-[50vh] h-full mt-5 p-5">
          <h3 className="text-lg font-semibold">
            Ratings & Reviews of {product.name}
          </h3>
          <p className="text-center pt-14">No Reviews available yet!</p>
        </div>
      </div>

      <div className="mx-auto w-[90%] lg:w-[80%]">
        <div className="w-full h-full my-5 p-5">
          <h3 className="text-xl font-semibold mb-2">You may also like</h3>
          <div className="m-auto grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {recommendedProducts?.map((i: any) => (
              <ProductCard key={i.id} product={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
