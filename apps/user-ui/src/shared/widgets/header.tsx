'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import ProfileIcon from '../../assets/svgs/profile-icon';
import HeartIcon from '../../assets/svgs/heart-icon';
import CartIcon from '../../assets/svgs/cart-icon';
import { NotificationBell } from '../components/notification-bell';
import HeaderBottom from './header-bottom';
import useStore from '../../store';
import { apiClient } from '../../lib/api/client';
import useLayout from '../../hooks/use-layout';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

interface Shop {
  id: string;
  businessName: string;
  category: string;
}

const Header = () => {
  const router = useRouter();
  const { isAuthenticated, user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { layout } = useLayout();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    products: Product[];
    shops: Shop[];
  }>({ products: [], shops: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // zustand hooks
  const wishlist = useStore((state) => state.wishlist);
  const cart = useStore((state) => state.cart);

  // Prevent hydration mismatch by only showing auth state after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset image error when userProfile changes
  useEffect(() => {
    setImageError(false);
  }, [userProfile?.picture]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search products and shops
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ products: [], shops: [] });
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const [productsRes, shopsRes] = await Promise.all([
          apiClient.get(
            `/public/products?search=${encodeURIComponent(searchQuery)}&limit=5`
          ),
          apiClient.get(
            `/public/shops?search=${encodeURIComponent(searchQuery)}&limit=3`
          ),
        ]);

        setSearchResults({
          products: productsRes.data.products || [],
          shops: shopsRes.data.shops || [],
        });
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults({ products: [], shops: [] });
      } finally {
        setIsSearching(false);
      }
    }, 300); // Debounce search

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
      setSearchQuery('');
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({ products: [], shops: [] });
    setShowResults(false);
  };

  return (
    <div className="w-full bg-ui-background border-b border-ui-divider">
      <div className="w-[90%] lg:w-[80%] mx-auto py-5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href={'/'}>
            <Image
              src={
                layout?.logo ||
                'https://ik.imagekit.io/andrieltecshop/products/tecshop-logo.png'
              }
              width={300}
              height={100}
              alt=""
              className="h-[100px] w-auto object-contain"
            />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 mx-4 lg:mx-8 max-w-2xl" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search for products and shops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="w-full px-4 pr-[120px] font-sans border-2 border-brand-primary rounded-md outline-none h-[55px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute top-1/2 -translate-y-1/2 right-[70px] p-2 hover:bg-ui-muted rounded-full transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            )}
            <button
              type="submit"
              className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-brand-primary rounded-r-md absolute top-0 right-0 hover:bg-brand-primary-800 transition-colors"
            >
              <Search color="#fff" size={24} />
            </button>

            {/* Search Results Dropdown */}
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-[60px] left-0 w-full bg-ui-surface border-2 border-brand-primary rounded-md shadow-elev-lg z-50 max-h-[500px] overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-text-secondary">
                    Searching...
                  </div>
                ) : (
                  <>
                    {/* Products Section */}
                    {searchResults.products.length > 0 && (
                      <div className="border-b border-ui-divider">
                        <div className="px-4 py-2 bg-ui-muted">
                          <h3 className="font-heading font-semibold text-sm text-text-primary">
                            Products ({searchResults.products.length})
                          </h3>
                        </div>
                        <div className="py-2">
                          {searchResults.products.map((product) => (
                            <Link
                              key={product.id}
                              href={`/product/${product.slug}`}
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-ui-muted transition-colors"
                            >
                              {product.images?.[0] && (
                                <div className="w-12 h-12 flex-shrink-0 bg-ui-muted rounded overflow-hidden">
                                  <img
                                    src={product.images[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-text-primary truncate">
                                  {product.name}
                                </p>
                                <p className="text-brand-primary font-semibold text-sm">
                                  ${(product.price / 100).toFixed(2)}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shops Section */}
                    {searchResults.shops.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-ui-muted">
                          <h3 className="font-heading font-semibold text-sm text-text-primary">
                            Shops ({searchResults.shops.length})
                          </h3>
                        </div>
                        <div className="py-2">
                          {searchResults.shops.map((shop) => (
                            <Link
                              key={shop.id}
                              href={`/shop/${shop.id}`}
                              onClick={() => {
                                setShowResults(false);
                                setSearchQuery('');
                              }}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-ui-muted transition-colors"
                            >
                              <div className="w-12 h-12 flex-shrink-0 bg-brand-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-brand-primary font-bold text-lg">
                                  {shop.businessName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-text-primary truncate">
                                  {shop.businessName}
                                </p>
                                <p className="text-text-secondary text-xs truncate">
                                  {shop.category}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No Results */}
                    {searchResults.products.length === 0 &&
                      searchResults.shops.length === 0 &&
                      !isSearching && (
                        <div className="p-8 text-center">
                          <p className="text-text-secondary mb-2">
                            No results found for &quot;{searchQuery}&quot;
                          </p>
                          <p className="text-text-tertiary text-sm">
                            Try different keywords or browse our categories
                          </p>
                        </div>
                      )}

                    {/* View All Results Link */}
                    {(searchResults.products.length > 0 ||
                      searchResults.shops.length > 0) && (
                      <div className="border-t border-ui-divider p-3">
                        <Link
                          href={`/products?search=${encodeURIComponent(
                            searchQuery
                          )}`}
                          onClick={() => {
                            setShowResults(false);
                            setSearchQuery('');
                          }}
                          className="block text-center text-brand-primary font-medium hover:underline"
                        >
                          View all results for &quot;{searchQuery}&quot;
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </form>
        </div>

        {/* User Section - Now includes both profile and wishlist */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Profile Icon */}
            <Link
              href={mounted && isAuthenticated ? '/profile' : '/login'}
              className="p-2 border-2 w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors overflow-hidden"
            >
              {mounted &&
              isAuthenticated &&
              userProfile?.picture &&
              !imageError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.picture}
                  alt={userProfile.name || 'Profile'}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => {
                    console.warn(
                      'Failed to load profile image, falling back to icon'
                    );
                    setImageError(true);
                  }}
                />
              ) : (
                <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
              )}
            </Link>

            {/* User Info / Sign In */}
            {mounted && isAuthenticated ? (
              <div className="hidden md:flex flex-col">
                <span className="block font-medium text-sm">Hello,</span>
                <Link
                  href={'/profile'}
                  className="block font-semibold text-brand-primary text-sm hover:underline text-left"
                >
                  {userProfile?.name?.split(' ')[0] ||
                    user?.name?.split(' ')[0] ||
                    'User'}
                </Link>
              </div>
            ) : (
              <Link href={'/login'} className="hidden md:block">
                <div className="flex flex-col">
                  <span className="block font-medium text-sm">Welcome</span>
                  <span className="block font-semibold text-brand-primary text-sm">
                    Sign In / Register
                  </span>
                </div>
              </Link>
            )}

            {/* Notification Bell */}
            {mounted && isAuthenticated && <NotificationBell />}

            {/* Wishlist Icon */}
            <Link
              href={'/wishlist'}
              className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
            >
              <HeartIcon className="w-7 h-7 text-text-primary" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex item-center justify-center absolute top-[-5px] right-[-5px] text-text-primary">
                <span className="text-white font-medium text-sm">
                  {wishlist.length}
                </span>
              </div>
            </Link>

            {/* Cart Icon */}
            <Link
              href={'/cart'}
              className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
            >
              <CartIcon className="w-7 h-7 text-text-primary" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex item-center justify-center absolute top-[-5px] right-[-5px] text-text-primary">
                <span className="text-white font-medium text-sm">
                  {cart.length}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <HeaderBottom />
    </div>
  );
};

export default Header;
