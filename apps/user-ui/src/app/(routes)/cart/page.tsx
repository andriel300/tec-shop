'use client';

import { Input } from 'apps/user-ui/src/components/ui/core/Input';
import { useAuth } from 'apps/user-ui/src/hooks/use-auth';
import useDeviceTracking from 'apps/user-ui/src/hooks/use-device-tracking';
import useLocationTracking from 'apps/user-ui/src/hooks/use-location-tracking';
import useStore from 'apps/user-ui/src/store';
import { Loader2, MapPin } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useShippingAddresses } from 'apps/user-ui/src/hooks/use-shipping-addresses';

const CartPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const cart = useStore((state) => state.cart);
  const removeFromCart = useStore((state) => state.removeFromCart);

  // Fetch shipping addresses
  const { data: addresses = [], isLoading: addressesLoading } = useShippingAddresses();

  const [couponCode, setCouponCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [discountedProductId, setDiscountedProductId] = React.useState('');
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [discountPercentage, setDiscountPercentage] = React.useState(0);
  const [selectedAddressId, setSelectedAddressId] = React.useState('');

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

  const decreaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      cart: state.cart.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }));
  };

  const removeItem = (id: string) => {
    removeFromCart(id, user, location, deviceInfo);
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
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
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
                      </div>
                    </td>
                    <td className="px-6 text-lg text-center">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px] mx-auto">
                        <button
                          className="text-black cursor-pointer text-xl"
                          onClick={() => decreaseQuantity(item.id)}
                        >
                          -
                        </button>
                        <span className="px-4 text-[#55585b]">
                          {item.quantity}
                        </span>
                        <button
                          className="text-black cursor-pointer text-xl"
                          onClick={() => increaseQuantity(item.id)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="text-center">
                      <button
                        className="text-[#818487] cursor-pointer hover:text-red-600 transition duration-200"
                        onClick={() => removeItem(item.id)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCouponCode(e.target.value)
                    }
                    placeholder="Enter Coupon Code"
                    className="flex-1 rounded-l-md"
                  />
                  <button
                    className="bg-brand-primary top-0 right-0 text-white px-4 py-2 rounded-r-md hover:bg-brand-primary-900 transition"
                    onClick={() => {
                      console.log('Apply coupon:', couponCode);
                    }}
                  >
                    Apply
                  </button>
                  {/* {error && ( */}
                  {/*   <p className="text-sm pt-2 text-red-500">{error}</p> */}
                  {/* )} */}
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
                <div className="flex justify-between items-center text-[#010f1c] text-[20px] font-[550] pb-3">
                  <span className="font-Jost">Total</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>
              <button
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-brand-primary-500 text-white font-semibold py-3 rounded-lg transition mt-4"
                onClick={() => router.push('/checkout')}
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
