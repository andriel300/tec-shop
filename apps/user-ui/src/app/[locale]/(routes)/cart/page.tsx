'use client';

import { Input } from '../../../../components/ui/core/Input';
import { useAuth } from '../../../../hooks/use-auth';
import useDeviceTracking from '../../../../hooks/use-device-tracking';
import useLocationTracking from '../../../../hooks/use-location-tracking';
import useStore from '../../../../store';
import { Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../../../i18n/navigation';
import React from 'react';
import { useShippingAddresses } from '../../../../hooks/use-shipping-addresses';
import { apiClient } from '../../../../lib/api/client';
import { toast } from 'sonner';

const CartPage = () => {
  const { isAuthenticated } = useAuth();
  useLocationTracking(); // Track for analytics
  useDeviceTracking(); // Track for analytics
  const cart = useStore((state) => state.cart);

  // Fetch shipping addresses
  const { data: addresses = [], isLoading: addressesLoading } =
    useShippingAddresses();

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
        // discountAmount comes in cents, convert to dollars
        setDiscountAmount(res.data.discountAmount / 100);
        setDiscountPercentage(
          res.data.discountType === 'PERCENTAGE' ? res.data.discountValue : 0
        );
        setDiscountedProductId(res.data.applicableProductIds?.[0] || '');
        setCouponCode('');
        toast.success(res.data.message || 'Coupon applied successfully!');
      } else {
        setDiscountAmount(0);
        setDiscountPercentage(0);
        setDiscountedProductId('');
        setError(res.data.message || 'Coupon not valid for any items in cart.');
      }
    } catch (error: unknown) {
      setDiscountAmount(0);
      setDiscountPercentage(0);
      setDiscountedProductId('');
      const err = error as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message || 'Failed to verify coupon code');
    }
  };

  const createPaymentSession = async () => {
    // Validate cart is not empty
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Validate shipping address is selected
    if (!selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }

    setLoading(true);
    try {
      // Map cart items to the format expected by the backend
      const items = cart.map((item) => ({
        productId: item.id,
        sellerId: item.sellerId,
        shopId: item.shopId,
        productName: item.title,
        productSlug: item.slug,
        productImage: Array.isArray(item.images) ? item.images[0] : item.image,
        variantId: item.variantId,
        sku: item.sku,
        unitPrice: Math.round(item.price * 100), // Convert dollars to cents
        quantity: item.quantity,
      }));

      const res = await apiClient.post('/orders/checkout', {
        items,
        shippingAddressId: selectedAddressId,
        paymentMethod: 'card',
        couponCode: storedCouponCode || undefined,
        discountAmount: discountAmount
          ? Math.round(discountAmount * 100)
          : undefined, // Convert to cents
      });

      // Redirect to Stripe Checkout page
      const { sessionUrl } = res.data;
      if (sessionUrl) {
        window.location.href = sessionUrl;
      } else {
        throw new Error('No checkout session URL returned');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
      console.error('Error creating checkout session:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set default address as selected when addresses load
  React.useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      } else {
        setSelectedAddressId(addresses[0].id);
      }
    }
  }, [addresses, selectedAddressId]);

  const decreaseQuantity = (id: string, variantId?: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) => {
        const isMatch =
          variantId && item.variantId
            ? item.id === id && item.variantId === variantId
            : item.id === id && !item.variantId;

        return isMatch && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item;
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

  const removeItem = (id: string, variantId?: string) => {
    useStore.setState((state) => ({
      cart: state.cart.filter((item) => {
        const isMatch =
          variantId && item.variantId
            ? item.id === id && item.variantId === variantId
            : item.id === id && !item.variantId;

        return !isMatch;
      }),
    }));
  };

  const subtotal = cart.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  return (
    <div className="w-full bg-white">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-Jost">
            Shopping Cart
          </h1>
          <Link href={'/'} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Cart</span>
        </div>

        {cart.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            Your Cart is Empty! Start adding products
          </div>
        ) : (
          <div className="lg:flex items-start gap-10">
            <table className="w-full lg:w-[70%] border-collapse">
              <thead className="bg-[#f1f3f4] rounded">
                <tr>
                  <th className="py-3 text-left pl-6 align-middle">Product</th>
                  <th className="py-3 text-center align-middle">Price</th>
                  <th className="py-3 text-center align-middle">Quantity</th>
                  <th className="py-3 text-center align-middle"></th>
                </tr>
              </thead>
              <tbody>
                {cart?.map((item) => (
                  <tr
                    key={
                      item.variantId ? `${item.id}-${item.variantId}` : item.id
                    }
                    className="border-b border-b-[#0000000e]"
                  >
                    <td className="flex items-center gap-4 p-4">
                      {(() => {
                        // Handle both string and array formats for images
                        let imageUrl = '';
                        if (typeof item.images === 'string' && item.images) {
                          try {
                            // Try parsing as JSON array first
                            const parsed = JSON.parse(item.images);
                            imageUrl = Array.isArray(parsed)
                              ? parsed[0]
                              : item.images;
                          } catch {
                            // If parsing fails, use as direct string
                            imageUrl = item.images;
                          }
                        } else if (
                          Array.isArray(item.images) &&
                          item.images.length > 0
                        ) {
                          imageUrl = item.images[0];
                        } else if (item.image) {
                          // Fallback to single image field
                          imageUrl =
                            typeof item.image === 'string' ? item.image : '';
                        }

                        return imageUrl ? (
                          <Image
                            src={imageUrl}
                            width={100}
                            height={100}
                            alt={item.title || 'Product image'}
                            className="rounded object-cover"
                            style={{ width: 'auto', height: '100px' }}
                          />
                        ) : (
                          <div className="w-[100px] h-[100px] bg-gray-200 rounded flex items-center justify-center text-gray-500">
                            No Image
                          </div>
                        );
                      })()}
                      <div className="flex flex-col">
                        <Link
                          href={`/product/${item.slug || item.id}`}
                          className="font-medium hover:text-brand-primary hover:underline transition-colors"
                        >
                          {item.title}
                        </Link>
                        {item.variantAttributes &&
                          Object.keys(item.variantAttributes).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Object.entries(item.variantAttributes).map(
                                ([key, value]) => (
                                  <span
                                    key={key}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md capitalize"
                                  >
                                    {key}:{' '}
                                    <span className="font-medium">{value}</span>
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        {item.sku && (
                          <span className="text-xs text-gray-500 mt-1">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 text-lg text-center">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px] mx-auto">
                        <button
                          className="text-black cursor-pointer text-xl"
                          onClick={() =>
                            decreaseQuantity(item.id, item.variantId)
                          }
                        >
                          -
                        </button>
                        <span className="px-4 text-[#55585b]">
                          {item.quantity}
                        </span>
                        <button
                          className="text-black cursor-pointer text-xl"
                          onClick={() =>
                            increaseQuantity(item.id, item.variantId)
                          }
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        className="text-[#818487] cursor-pointer hover:text-red-600 transition duration-200"
                        onClick={() => removeItem(item.id, item.variantId)}
                      >
                        X Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-6 shadow-md w-full lg:w-[30%] bg-[#f9f9f9] rounded-lg">
              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-Jost">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <hr className="my-4 text-slate-200" />
              <div className="mb-4">
                <h4 className="mb-[7px] font-medium text-[15px]">
                  Have a Coupon?
                </h4>
                <div className="flex focus-within:ring-1 rounded-md focus-within:ring-brand-primary">
                  <Input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        couponCodeChangeHandler();
                      }
                    }}
                    placeholder="Enter Coupon Code (e.g., SUMMER2025)"
                    className="flex-1 rounded-l-md"
                  />
                  <button
                    className="bg-brand-primary top-0 right-0 text-white px-4 py-2 rounded-r-md hover:bg-brand-primary-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={couponCodeChangeHandler}
                    disabled={!couponCode.trim()}
                  >
                    Apply
                  </button>
                </div>
                {error && <p className="text-sm pt-2 text-red-500">{error}</p>}
                {storedCouponCode && discountAmount > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 flex items-center justify-between">
                    <span>
                      Coupon &quot;{storedCouponCode}&quot; applied! You save $
                      {discountAmount.toFixed(2)} ({discountPercentage}% off)
                    </span>
                    <button
                      onClick={() => {
                        setStoredCouponCode('');
                        setDiscountAmount(0);
                        setDiscountPercentage(0);
                        setDiscountedProductId('');
                      }}
                      className="text-red-600 hover:text-red-800 text-xs underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
              <hr className="my-4 text-slate-200" />
              <div className="mb-4">
                <div className="flex justify-between items-center mb-[7px]">
                  <h4 className="font-medium text-[15px]">
                    Select Shipping Address
                  </h4>
                  {isAuthenticated && (
                    <Link
                      href="/profile?tab=shipping-address"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Manage
                    </Link>
                  )}
                </div>

                {!isAuthenticated ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                    Please{' '}
                    <Link href="/login" className="font-medium underline">
                      log in
                    </Link>{' '}
                    to select a shipping address
                  </div>
                ) : addressesLoading ? (
                  <div className="flex items-center justify-center p-3 border border-gray-200 rounded-md">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">
                      Loading addresses...
                    </span>
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                    No shipping address found.{' '}
                    <Link
                      href="/profile?tab=shipping-address"
                      className="font-medium underline"
                    >
                      Add one now
                    </Link>
                  </div>
                ) : (
                  <select
                    className="w-full p-2 border border-gray-200 rounded-md focus-outline-none focus:border-brand-primary-500"
                    value={selectedAddressId}
                    onChange={(e) => setSelectedAddressId(e.target.value)}
                  >
                    {addresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label} - {address.city}
                        {address.state && `, ${address.state}`} -{' '}
                        {address.country}
                        {address.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                )}

                {/* Show selected address details */}
                {selectedAddressId && addresses.length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700">
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <div>
                        {(() => {
                          const selected = addresses.find(
                            (a) => a.id === selectedAddressId
                          );
                          if (!selected) return null;
                          return (
                            <>
                              <p className="font-medium">{selected.name}</p>
                              <p>{selected.street}</p>
                              <p>
                                {selected.city}
                                {selected.state && `, ${selected.state}`}{' '}
                                {selected.zipCode}
                              </p>
                              <p>{selected.country}</p>
                              {selected.phoneNumber && (
                                <p className="mt-1">
                                  Phone: {selected.phoneNumber}
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <hr className="my-4 text-slate-200" />

              <div className="mb-4">
                <h4 className="font-medium mb-[7px] text-[15px]">
                  Select Payment Method
                </h4>
                <select className="w-full p-2 border border-gray-200 rounded-md focus-outline-none focus:border-brand-primary-500">
                  <option value="credit_card">Online Payment</option>
                  <option value="cash_on_delivery">Cash on Delivery</option>
                </select>
              </div>
              <hr className="my-4 text-slate-200" />

              {/* Discount Display */}
              {storedCouponCode && discountAmount > 0 && (
                <div className="flex justify-between items-center text-green-600 text-[16px] font-medium pb-3">
                  <span>Discount ({storedCouponCode})</span>
                  <span>-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                <span className="font-Jost">Total</span>
                <span>${(subtotal - (discountAmount || 0)).toFixed(2)}</span>
              </div>
              {/* Checkout */}

              <button
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-brand-primary-500 text-white font-semibold py-3 rounded-lg transition mt-4 flex items-center justify-center gap-2"
                onClick={createPaymentSession}
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Redirecting ...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
