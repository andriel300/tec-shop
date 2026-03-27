'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '../../../../hooks/use-auth';
import useDeviceTracking from '../../../../hooks/use-device-tracking';
import useLocationTracking from '../../../../hooks/use-location-tracking';
import useStore from '../../../../store';
import Image from 'next/image';
import { Link } from '../../../../i18n/navigation';
import { toast } from 'sonner';
import { Heart, Minus, Plus, ShoppingCart, Trash2, ArrowRight, Home, ChevronRight } from 'lucide-react';
import React from 'react';

const WishListPage = () => {
  const { user } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

  const addToCart = useStore((state) => state.addToCart);
  const removeFromWishList = useStore((state) => state.removeFromWishList);
  const wishlist = useStore((state) => state.wishlist);

  const decreaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      wishlist: state.wishlist.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ),
    }));
  };

  const increaseQuantity = (id: string) => {
    useStore.setState((state) => ({
      wishlist: state.wishlist.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      ),
    }));
  };

  const removeItem = (id: string, name: string) => {
    removeFromWishList(id, user ?? undefined, location ?? undefined, deviceInfo ?? undefined);
    toast.success('Removed from wishlist', { description: name });
  };

  const handleAddToCart = (item: (typeof wishlist)[number]) => {
    addToCart(item, user ?? undefined, location ?? undefined, deviceInfo ?? undefined);
    toast.success('Added to cart', { description: item.title });
  };

  const handleAddAllToCart = () => {
    wishlist.forEach((item) => {
      addToCart(item, user ?? undefined, location ?? undefined, deviceInfo ?? undefined);
    });
    toast.success(`${wishlist.length} items added to cart`);
  };

  const subtotal = wishlist.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="w-full min-h-screen bg-[#f5f5f5]">
      <div className="w-[90%] lg:w-[80%] mx-auto py-6">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="flex items-center hover:text-brand-primary transition-colors">
            <Home size={14} />
          </Link>
          <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-gray-800 font-medium">Wishlist</span>
        </nav>

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Heart size={24} className="text-red-500 fill-red-500" />
            <h1 className="text-2xl font-bold text-gray-900 font-heading">
              My Wishlist
              {wishlist.length > 0 && (
                <span className="ml-2 text-base font-normal text-gray-400">
                  ({wishlist.length} {wishlist.length === 1 ? 'item' : 'items'})
                </span>
              )}
            </h1>
          </div>
          {wishlist.length > 1 && (
            <button
              onClick={handleAddAllToCart}
              className="flex items-center gap-2 bg-brand-primary text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-brand-primary-800 transition-colors"
            >
              <ShoppingCart size={16} />
              Add All to Cart
            </button>
          )}
        </div>

        {wishlist.length === 0 ? (
          /* ── Empty State ── */
          <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <Heart size={36} className="text-red-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm max-w-xs mb-6">
              Save products you love and come back to them anytime. Start exploring our catalog!
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
          /* ── Main layout: items + summary ── */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

            {/* Items list */}
            <div className="flex flex-col gap-3">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-shadow duration-200"
                >
                  {/* Product image */}
                  <Link href={`/productview/${item.slug || item.id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
                      <Image
                        src={typeof item.image === 'string' ? item.image : '/placeholder.png'}
                        width={96}
                        height={96}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
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

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-base font-bold text-brand-primary">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-xs text-gray-400">
                          × {item.quantity} = <span className="font-semibold text-gray-600">${(item.price * item.quantity).toFixed(2)}</span>
                        </span>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      {/* Quantity stepper */}
                      <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
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
                          onClick={() => increaseQuantity(item.id)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Add to Cart */}
                      <button
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center gap-1.5 bg-brand-primary text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-brand-primary-800 transition-colors"
                      >
                        <ShoppingCart size={13} />
                        Add to Cart
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id, item.title)}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors ml-auto"
                        aria-label={`Remove ${item.title} from wishlist`}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Continue shopping */}
              <Link
                href="/all-products"
                className="flex items-center justify-center gap-2 text-sm text-brand-primary font-medium hover:underline mt-1 py-2"
              >
                <ArrowRight size={15} />
                Continue Shopping
              </Link>
            </div>

            {/* Summary panel */}
            <div className="bg-white rounded-2xl shadow-sm p-5 sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-4">Summary</h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Items</span>
                  <span className="font-medium text-gray-900">{wishlist.length}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 my-4" />

              <div className="flex justify-between text-base font-bold text-gray-900 mb-5">
                <span>Estimated Total</span>
                <span className="text-brand-primary">${subtotal.toFixed(2)}</span>
              </div>

              <button
                onClick={handleAddAllToCart}
                className="w-full flex items-center justify-center gap-2 bg-brand-primary text-white font-semibold text-sm py-3 rounded-xl hover:bg-brand-primary-800 transition-colors"
              >
                <ShoppingCart size={16} />
                Add All to Cart
              </button>

              <Link
                href="/all-products"
                className="block text-center text-sm text-gray-500 hover:text-brand-primary mt-3 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishListPage;
