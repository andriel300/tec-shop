import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Product = {
  image: string | StaticImport;
  id: string;
  title: string;
  price: number;
  images: string;
  salePrice: number;
  quantity: number;
  shopId: string;
};

type Store = {
  cart: Product[];
  wishlist: Product[];

  addToCart: (
    product: Product,
    user?: any,
    location?: string,
    deviceInfo?: string
  ) => void;

  removeFromCart: (
    id: string,
    user?: any,
    location?: string,
    deviceInfo?: string
  ) => void;

  addToWishList: (
    product: Product,
    user?: any,
    location?: string,
    deviceInfo?: string
  ) => void;

  removeFromWishList: (
    id: string,
    user?: any,
    location?: string,
    deviceInfo?: string
  ) => void;
};

const useStore = create<Store>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],

      // Add To Cart
      addToCart: (product, user, location, deviceInfo) => {
        const state = get();
        const existing = state.cart.find((item) => item.id === product.id);

        if (existing) {
          set({
            cart: state.cart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: (item.quantity ?? 1) + 1 }
                : item
            ),
          });
        } else {
          set({
            cart: [...state.cart, { ...product, quantity: 1 }],
          });
        }
      },

      // Remove From Cart
      removeFromCart: (id, user, location, deviceInfo) => {
        const state = get();
        const existing = state.cart.find((item) => item.id === id);

        if (!existing) return;

        if (existing.quantity > 1) {
          set({
            cart: state.cart.map((item) =>
              item.id === id ? { ...item, quantity: item.quantity - 1 } : item
            ),
          });
        } else {
          set({
            cart: state.cart.filter((item) => item.id !== id),
          });
        }
      },

      // Add To Wishlist
      addToWishList: (product, user, location, deviceInfo) => {
        const state = get();
        const exists = state.wishlist.some((item) => item.id === product.id);

        if (!exists) {
          set({
            wishlist: [...state.wishlist, product],
          });
        }
      },

      // Remove From Wishlist
      removeFromWishList: (id, user, location, deviceInfo) => {
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id),
        }));
      },
    }),

    // persist config
    {
      name: 'store-data',
    }
  )
);

export default useStore;
