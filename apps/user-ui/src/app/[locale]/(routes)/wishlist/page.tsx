'use client';

import { useAuth } from '../../../../hooks/use-auth';
import useDeviceTracking from '../../../../hooks/use-device-tracking';
import useLocationTracking from '../../../../hooks/use-location-tracking';
import useStore from '../../../../store';
import Image from 'next/image';
import { Link } from '../../../../i18n/navigation';

import React from 'react';

const WishListPage = () => {
  const { user } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();

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

  const removeItem = (id: string) => {
    removeFromWishList(
      id,
      user ?? undefined,
      location ?? undefined,
      deviceInfo ?? undefined
    );
  };
  const addToCart = useStore((state) => state.addToCart);
  const removeFromWishList = useStore((state) => state.removeFromWishList);
  const wishlist = useStore((state) => state.wishlist);

  return (
    <div className="w-full bg-white ">
      <div className="md:w-[80%] w-[95%] mx-auto min-h-screen">
        {/* breadcrumb */}
        <div className="pb-[50px]">
          <h1 className="md:pt-[50px] font-medium text-[44px] leading-[1] mb-[16px] font-Jost">
            Wishlist
          </h1>
          <Link href={'/'} className="text-[#55585b] hover:underline">
            Home
          </Link>
          <span className="inline-block p-[1.5px] mx-1 bg-[#a8acb0] rounded-full"></span>
          <span className="text-[#55585b]">Wishlist</span>
        </div>

        {/* if wishlist is empty */}
        {wishlist.length === 0 ? (
          <div className="text-center text-gray-600 text-lg">
            Your wishlist is empty! Start adding products.
          </div>
        ) : (
          <div className="flex flex-col gap-10">
            {/* Wishlist Item Table */}
            <table className="w-full border-collapse">
              <thead className="bg-[#f1f3f4]">
                <tr>
                  <th className="py-3 text-left pl-4">Product</th>
                  <th className="py-3 text-left">Price</th>
                  <th className="py-3 text-left">Quantity</th>
                  <th className="py-3 text-left">Action</th>
                  <th className="py-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {wishlist?.map((item) => (
                  <tr key={item.id} className="border-b border-b-[#0000000e]">
                    <td className="flex items-center gap-3 p-4">
                      <Image
                        src={
                          typeof item.image === 'string'
                            ? item.image
                            : '/placeholder.png'
                        }
                        width={80}
                        height={80}
                        alt={item.title}
                        className="rounded"
                      />
                      <Link
                        href={`/product/${item.slug || item.id}`}
                        className="hover:text-brand-primary hover:underline transition-colors"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-6 text-lg">
                      ${(item.price * item.quantity).toFixed(2)}
                    </td>
                    <td>
                      <div className="flex justify-center items-center border border-gray-200 rounded-[20px] w-[90px] p-[2px]">
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
                    <td>
                      <button
                        className="bg-brand-primary-500 text-white hover:bg-brand-primary-900 px-5 py-2 rounded-md transition-all"
                        onClick={() =>
                          addToCart(
                            item,
                            user ?? undefined,
                            location ?? undefined,
                            deviceInfo ?? undefined
                          )
                        }
                      >
                        Add to Cart
                      </button>
                    </td>
                    <td>
                      <button
                        className="text-[#81848] cursor-pointer hover:text-[#ff1826] transition duration-200"
                        onClick={() => removeItem(item.id)}
                      >
                        X Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishListPage;
