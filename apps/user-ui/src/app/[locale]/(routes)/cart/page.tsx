'use client';

export const dynamic = 'force-dynamic';

import { createLogger } from '@tec-shop/next-logger';
import { Input } from '../../../../components/ui/core/Input';

const logger = createLogger('user-ui:cart');
import { useAuth } from '../../../../hooks/use-auth';
import useDeviceTracking from '../../../../hooks/use-device-tracking';
import useLocationTracking from '../../../../hooks/use-location-tracking';
import useStore from '../../../../store';
import {
  Loader2,
  MapPin,
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Tag,
  X,
  ArrowRight,
  Home,
  ChevronRight,
  Store,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../../../i18n/navigation';
import React from 'react';
import { useShippingAddresses } from '../../../../hooks/use-shipping-addresses';
import { apiClient } from '../../../../lib/api/client';
import { toast } from 'sonner';

function getImageUrl(item: { images?: string | string[]; image?: string | unknown }): string {
  if (typeof item.images === 'string' && item.images) {
    try {
      const parsed = JSON.parse(item.images);
      return Array.isArray(parsed) ? parsed[0] : item.images;
    } catch {
      return item.images;
    }
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }
  if (typeof item.image === 'string' && item.image) {
    return item.image;
  }
  return '';
}

const CartPage = () => {
  const { isAuthenticated } = useAuth();
  useLocationTracking();
  useDeviceTracking();
  const cart = useStore((state) => state.cart);

  const { data: addresses = [], isLoading: addressesLoading } = useShippingAddresses();

  const [couponCode, setCouponCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [, setDiscountedProductId] = React.useState('');
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [discountPercentage, setDiscountPercentage] = React.useState(0);
  const [selectedAddressId, setSelectedAddressId] = React.useState('');
  const [error, setError] = React.useState('');
  const [storedCouponCode, setStoredCouponCode] = React.useState('');

  const couponCodeChangeHandler = async () => {
    setError('');
    if (!couponCode.trim()) {
      setError('Coupon code is required');
      return;
    }
    try {
      const res = await apiClient.put('/orders/verify-coupon-code', {
        couponCode: couponCode.trim().toUpperCase(),
        cart,
      });
      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim().toUpperCase());
        setDiscountAmount(res.data.discountAmount / 100);
        setDiscountPercentage(
          res.data.discountType === 'PERCENTAGE' ? res.data.discountValue : 0
        );
        setDiscountedProductId(res.data.applicableProductIds?.[0] || '');
        setCouponCode('');
        toast.success(res.data.message || 'Coupon applied!');
      } else {
        setDiscountAmount(0);
        setDiscountPercentage(0);
        setDiscountedProductId('');
        setError(res.data.message || 'Coupon not valid for any items in cart.');
      }
    } catch (err: unknown) {
      setDiscountAmount(0);
      setDiscountPercentage(0);
      setDiscountedProductId('');
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || 'Failed to verify coupon code');
    }
  };

  const createPaymentSession = async () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }
    setLoading(true);
    try {
      const items = cart.map((item) => ({
        productId: item.id,
        sellerId: item.sellerId,
        shopId: item.shopId,
        productName: item.title,
        productSlug: item.slug,
        productImage: Array.isArray(item.images) ? item.images[0] : item.image,
        variantId: item.variantId,
        sku: item.sku,
        unitPrice: Math.round(item.price * 100),
        quantity: item.quantity,
      }));
      const res = await apiClient.post('/orders/checkout', {
        items,
        shippingAddressId: selectedAddressId,
        paymentMethod: 'card',
        couponCode: storedCouponCode || undefined,
        discountAmount: discountAmount ? Math.round(discountAmount * 100) : undefined,
      });
      const { sessionUrl } = res.data;
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error('No checkout session URL returned');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
      logger.error('Error creating checkout session:', { err });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      setSelectedAddressId(defaultAddress ? defaultAddress.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  const decreaseQuantity = (id: string, variantId?: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) => {
        const isMatch =
          variantId && item.variantId
            ? item.id === id && item.variantId === variantId
            : item.id === id && !item.variantId;
        return isMatch && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item;
      }),
    }));
  };

  const increaseQuantity = (id: string, variantId?: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) => {
        const isMatch =
          variantId && item.variantId
            ? item.id === id && item.variantId === variantId
            : item.id === id && !item.variantId;
        return isMatch ? { ...item, quantity: item.quantity + 1 } : item;
      }),
    }));
  };

  const removeItem = (id: string, name: string, variantId?: string) => {
    useStore.setState((state) => ({
      cart: state.cart.filter((item) => {
        const isMatch =
          variantId && item.variantId
            ? item.id === id && item.variantId === variantId
            : item.id === id && !item.variantId;
        return !isMatch;
      }),
    }));
    toast.success('Removed from cart', { description: name });
  };

  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal - (discountAmount || 0);

  // Group cart items by shopId for multi-vendor display
  const groupedCart = cart.reduce<Record<string, typeof cart>>((groups, item) => {
    const key = item.shopId || item.sellerId || 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5]">
      <div className="w-[90%] lg:w-[80%] mx-auto py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="flex items-center hover:text-brand-primary transition-colors">
            <Home size={14} />
          </Link>
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-800 font-medium">Shopping Cart</span>
        </nav>

        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart size={24} className="text-brand-primary" />
          <h1 className="text-2xl font-bold text-gray-900 font-heading">
            Shopping Cart
            {cart.length > 0 && (
              <span className="ml-2 text-base font-normal text-gray-400">
                ({cart.length} {cart.length === 1 ? 'item' : 'items'})
              </span>
            )}
          </h1>
        </div>

        {cart.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-brand-primary/10 flex items-center justify-center mb-5">
              <ShoppingCart size={36} className="text-brand-primary/50" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              Looks like you haven&apos;t added anything yet. Start browsing and find something you love!
            </p>
            <Link
              href="/all-products"
              className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-brand-primary-800 transition-colors"
            >
              Browse Products
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          /* Main layout */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">

            {/* Cart items — grouped by vendor */}
            <div className="flex flex-col gap-4">
              {Object.entries(groupedCart).map(([shopId, items]) => {
                const shopName = items[0]?.shopName;
                return (
                <div key={shopId} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  {/* Vendor header */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/70">
                    <Store size={15} className="text-brand-primary flex-shrink-0" />
                    <span className="text-xs font-semibold text-gray-700">
                      {shopName ?? 'Vendor'}
                    </span>
                    <span className="text-xs text-gray-400">
                      · {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Items in this vendor group */}
                  <div className="divide-y divide-gray-50">
                    {items.map((item) => {
                      const imageUrl = getImageUrl(item);
                      const lineTotal = item.price * item.quantity;
                      return (
                        <div
                          key={item.variantId ? `${item.id}-${item.variantId}` : item.id}
                          className="p-4 flex gap-4 items-start hover:bg-gray-50/50 transition-colors duration-150"
                        >
                          {/* Image */}
                          <Link
                            href={`/productview/${item.slug || item.id}`}
                            className="flex-shrink-0"
                          >
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  width={96}
                                  height={96}
                                  alt={item.title || 'Product image'}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                  No image
                                </div>
                              )}
                            </div>
                          </Link>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/productview/${item.slug || item.id}`}
                              className="text-sm font-semibold text-gray-900 hover:text-brand-primary transition-colors line-clamp-2 leading-snug"
                            >
                              {item.title}
                            </Link>

                            {/* Variant badges */}
                            {item.variantAttributes && Object.keys(item.variantAttributes).length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {Object.entries(item.variantAttributes).map(([key, value]) => (
                                  <span
                                    key={key}
                                    className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md capitalize"
                                  >
                                    {key}: <span className="font-semibold">{value}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.sku && (
                              <p className="text-[11px] text-gray-400 mt-1">SKU: {item.sku}</p>
                            )}

                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-base font-bold text-brand-primary">
                                ${item.price.toFixed(2)}
                              </span>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-400">
                                  × {item.quantity} ={' '}
                                  <span className="font-semibold text-gray-600">
                                    ${lineTotal.toFixed(2)}
                                  </span>
                                </span>
                              )}
                            </div>

                            {/* Actions row */}
                            <div className="flex items-center gap-3 mt-3 flex-wrap">
                              {/* Quantity stepper */}
                              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                                <button
                                  onClick={() => decreaseQuantity(item.id, item.variantId)}
                                  disabled={item.quantity <= 1}
                                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-gray-900 border-x border-gray-200 h-8 flex items-center justify-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => increaseQuantity(item.id, item.variantId)}
                                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                                  aria-label="Increase quantity"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              {/* Remove */}
                              <button
                                onClick={() => removeItem(item.id, item.title, item.variantId)}
                                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                                aria-label={`Remove ${item.title} from cart`}
                              >
                                <Trash2 size={14} />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
              })}

              {/* Continue shopping */}
              <Link
                href="/all-products"
                className="flex items-center justify-center gap-2 text-sm text-brand-primary font-medium hover:underline mt-1 py-2"
              >
                <ArrowRight size={15} />
                Continue Shopping
              </Link>
            </div>

            {/* Order summary panel */}
            <div className="flex flex-col gap-4 sticky top-24">

              {/* Coupon */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Tag size={15} className="text-brand-primary" />
                  Promo Code
                </h3>

                {storedCouponCode && discountAmount > 0 ? (
                  <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle2 size={15} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-800">
                        &ldquo;{storedCouponCode}&rdquo; applied
                      </p>
                      <p className="text-xs text-green-700 mt-0.5">
                        You save ${discountAmount.toFixed(2)}{discountPercentage > 0 && ` (${discountPercentage}% off)`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setStoredCouponCode('');
                        setDiscountAmount(0);
                        setDiscountPercentage(0);
                        setDiscountedProductId('');
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Remove coupon"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') couponCodeChangeHandler();
                      }}
                      placeholder="Enter promo code"
                      className="flex-1 rounded-lg text-sm"
                    />
                    <button
                      className="bg-brand-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      onClick={couponCodeChangeHandler}
                      disabled={!couponCode.trim()}
                    >
                      Apply
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-xs text-red-500 mt-2">{error}</p>
                )}
              </div>

              {/* Shipping address */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <MapPin size={15} className="text-brand-primary" />
                    Shipping Address
                  </h3>
                  {isAuthenticated && (
                    <Link
                      href="/profile?tab=shipping-address"
                      className="text-xs text-brand-primary hover:underline font-medium"
                    >
                      Manage
                    </Link>
                  )}
                </div>

                {!isAuthenticated ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    Please{' '}
                    <Link href="/login" className="font-semibold underline">
                      log in
                    </Link>{' '}
                    to select a shipping address.
                  </div>
                ) : addressesLoading ? (
                  <div className="flex items-center justify-center p-3 border border-gray-100 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin mr-2 text-brand-primary" />
                    <span className="text-xs text-gray-500">Loading addresses...</span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                    No address found.{' '}
                    <Link
                      href="/profile?tab=shipping-address"
                      className="font-semibold underline"
                    >
                      Add one now
                    </Link>
                  </div>
                ) : (
                  <>
                    <select
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-brand-primary transition-colors cursor-pointer"
                      value={selectedAddressId}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                    >
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.label} — {address.city}
                          {address.state && `, ${address.state}`} — {address.country}
                          {address.isDefault ? ' (Default)' : ''}
                        </option>
                      ))}
                    </select>

                    {selectedAddress && (
                      <div className="mt-2.5 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                        <div className="flex items-start gap-2">
                          <MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-gray-600 leading-relaxed">
                            <p className="font-semibold text-gray-800">{selectedAddress.name}</p>
                            <p>{selectedAddress.street}</p>
                            <p>
                              {selectedAddress.city}
                              {selectedAddress.state && `, ${selectedAddress.state}`}{' '}
                              {selectedAddress.zipCode}
                            </p>
                            <p>{selectedAddress.country}</p>
                            {selectedAddress.phoneNumber && (
                              <p className="mt-1 text-gray-500">
                                {selectedAddress.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Payment method */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CreditCard size={15} className="text-brand-primary" />
                  Payment Method
                </h3>
                <select className="w-full p-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-gray-50 focus:outline-none focus:border-brand-primary transition-colors cursor-pointer">
                  <option value="credit_card">Online Payment (Card)</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
                </select>
              </div>

              {/* Summary + CTA */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <h2 className="text-base font-bold text-gray-900 mb-4">Order Summary</h2>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Items ({cart.length})</span>
                    <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Calculated at checkout</span>
                  </div>
                  {storedCouponCode && discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({storedCouponCode})</span>
                      <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 my-4" />

                <div className="flex justify-between text-base font-bold text-gray-900 mb-5">
                  <span>Estimated Total</span>
                  <span className="text-brand-primary">${total.toFixed(2)}</span>
                </div>

                <button
                  disabled={loading}
                  onClick={createPaymentSession}
                  className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold text-sm py-3 rounded-xl hover:bg-brand-primary-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      Proceed to Checkout
                    </>
                  )}
                </button>

                <Link
                  href="/all-products"
                  className="block text-center text-sm text-gray-500 hover:text-brand-primary mt-3 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
