import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { sendKafkaEvent } from '../actions/track-user';
import StaticImport from 'next/image';

type Product = {
  image?: string | typeof StaticImport;
  id: string;
  slug?: string;
  title: string;
  price: number;
  images?: string | string[];
  salePrice?: number;
  quantity: number;
  shopId: string;
};

type User = {
  id: string;
  username?: string;
  email?: string;
};

type Location = {
  country?: string;
  city?: string;
};

type Store = {
  cart: Product[];
  wishlist: Product[];

  addToCart: (
    product: Product,
    user?: User,
    location?: Location,
    deviceInfo?: string
  ) => void;

  removeFromCart: (
    id: string,
    user?: User,
    location?: Location,
    deviceInfo?: string
  ) => void;

  addToWishList: (
    product: Product,
    user?: User,
    location?: Location,
    deviceInfo?: string
  ) => void;

  removeFromWishList: (
    id: string,
    user?: User,
    location?: Location,
    deviceInfo?: string
  ) => void;
};

// Create SSR-safe storage
const createSafeStorage = () => {
  if (typeof window === 'undefined') {
    return {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    };
  }
  return localStorage;
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
            cart: [...state.cart, { ...product, quantity: product.quantity }],
          });
        }

        // send kafka event
        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user.id,
            productId: product.id,
            shopId: product.shopId,
            action: 'add_to_cart',
            country: location.country || 'Unknown',
            city: location.city || 'Unknown',
            device: deviceInfo || 'Unknown device',
          });
        }
      },

      // Remove From Cart
      removeFromCart: (id, user, location, deviceInfo) => {
        const removeProduct = get().cart.find((item) => item.id === id);
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
        if (user?.id && location && deviceInfo && removeProduct) {
          sendKafkaEvent({
            userId: user.id,
            productId: removeProduct?.id,
            shopId: removeProduct?.shopId,
            action: 'remove_from_cart',
            country: location.country || 'Unknown',
            city: location.city || 'Unknown',
            device: deviceInfo || 'Unknown device',
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
        if (user?.id && location && deviceInfo) {
          sendKafkaEvent({
            userId: user.id,
            productId: product.id,
            shopId: product.shopId,
            action: 'add_to_wishlist',
            country: location.country || 'Unknown',
            city: location.city || 'Unknown',
            device: deviceInfo || 'Unknown device',
          });
        }
      },

      // Remove From Wishlist
      removeFromWishList: (id, user, location, deviceInfo) => {
        const removeProduct = get().wishlist.find((item) => item.id === id);
        set((state) => ({
          wishlist: state.wishlist.filter((item) => item.id !== id),
        }));
        if (user?.id && location && deviceInfo && removeProduct) {
          sendKafkaEvent({
            userId: user.id,
            productId: removeProduct.id,
            shopId: removeProduct.shopId,
            action: 'remove_from_wishlist',
            country: location.country || 'Unknown',
            city: location.city || 'Unknown',
            device: deviceInfo || 'Unknown device',
          });
        }
      },
    }),

    // persist config
    {
      name: 'store-data',
      storage: {
        getItem: (name: string) => {
          const storage = createSafeStorage();
          const value = storage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name: string, value: unknown) => {
          const storage = createSafeStorage();
          storage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name: string) => {
          const storage = createSafeStorage();
          storage.removeItem(name);
        },
      },
    }
  )
);

export default useStore;
