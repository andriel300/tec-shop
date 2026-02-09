'use client';
import { AlignLeft, ChevronDown, ChevronRight, HeartIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { navItems } from '../../configs/constants';
import ProfileIcon from '../../assets/svgs/profile-icon';
import CartIcon from '../../assets/svgs/cart-icon';
import { useAuth } from '../../hooks/use-auth';
import useStore from '../../store';
import { useCategoryTree } from '../../hooks/use-categories';

const HeaderBottom = () => {
  const { isAuthenticated, user, userProfile, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [show, setShow] = React.useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // zustand hooks
  const wishlist = useStore((state) => state.wishlist);
  const cart = useStore((state) => state.cart);

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useCategoryTree({
    onlyActive: true,
  });

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      // Make it sticky when scrolled past 100px
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset image error when userProfile changes
  useEffect(() => {
    setImageError(false);
  }, [userProfile?.picture]);

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    router.push('/login');
  };

  return (
    <div
      className={`w-full transition-all duration-300 ${
        isSticky
          ? 'fixed top-0 left-0 z-[100] bg-ui-background shadow-lg'
          : 'relative'
      }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${
          isSticky ? 'py-3' : 'py-0'
        }`}
      >
        {/* Dropdowns */}
        <div
          className={`w-[260px] ${
            isSticky && '-mb-2'
          } cursor-pointer flex items-center justify-between px-5 h-[50px] bg-brand-primary`}
          onClick={() => setShow(!show)}
        >
          <div className="flex items-center gap-2">
            <AlignLeft color="white" />
            <span className="text-white font-medium font-heading">
              All Departments
            </span>
          </div>
          <ChevronDown color="white" />
          {/* Dropdown Menu */}
          {show && (
            <div
              className={`absolute left-0 ${
                isSticky ? 'top-[70px]' : 'top-[50px]'
              } w-[260px] max-h-[500px] bg-ui-surface shadow-elev-lg z-50 overflow-y-auto border border-ui-divider`}
            >
              {categoriesLoading ? (
                <div className="p-4 text-center text-text-secondary">
                  Loading categories...
                </div>
              ) : categories && categories.length > 0 ? (
                <div className="py-2">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="relative group"
                      onMouseEnter={() => setHoveredCategory(category.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <Link
                        href={`/products?categoryId=${category.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-ui-muted transition-colors"
                        onClick={() => setShow(false)}
                      >
                        <span className="font-heading font-medium text-sm text-text-primary">
                          {category.name}
                        </span>
                        {category.children && category.children.length > 0 && (
                          <ChevronRight
                            size={16}
                            className="text-text-secondary"
                          />
                        )}
                      </Link>

                      {/* Subcategories Dropdown */}
                      {category.children &&
                        category.children.length > 0 &&
                        hoveredCategory === category.id && (
                          <div className="absolute left-full top-0 w-[260px] max-h-[500px] bg-ui-surface shadow-elev-lg border border-ui-divider overflow-y-auto ml-1">
                            <div className="py-2">
                              {category.children.map((subcategory) => (
                                <Link
                                  key={subcategory.id}
                                  href={`/products?categoryId=${subcategory.id}`}
                                  className="block px-4 py-3 hover:bg-ui-muted transition-colors"
                                  onClick={() => setShow(false)}
                                >
                                  <span className="font-heading text-sm text-text-primary">
                                    {subcategory.name}
                                  </span>
                                  {subcategory.description && (
                                    <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                                      {subcategory.description}
                                    </p>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-text-secondary">
                  No categories available
                </div>
              )}

              {/* View All Categories Link */}
              {categories && categories.length > 0 && (
                <div className="border-t border-ui-divider p-3">
                  <Link
                    href="/categories"
                    onClick={() => setShow(false)}
                    className="block text-center text-brand-primary font-medium hover:underline text-sm"
                  >
                    View All Categories
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Navigation Links */}

        <div className="flex items-center">
          {navItems.map((i: NavItemsTypes, index: number) => (
            <Link
              className="px-3 font-heading font-medium text-md hover:text-brand-primary transition-colors"
              href={i.href}
              key={index}
            >
              {i.title}
            </Link>
          ))}
        </div>

        <div>
          {isSticky && (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3 lg:gap-4">
                {/* Profile Icon */}
                <Link
                  href={mounted && isAuthenticated ? '/profile' : '/login'}
                  className="p-2 border-2 w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors overflow-hidden"
                  title="Account"
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
                          'Failed to load profile image in sticky header, falling back to icon'
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
                    <button
                      onClick={handleLogout}
                      className="block font-semibold text-brand-primary text-sm hover:underline text-left"
                    >
                      {userProfile?.name?.split(' ')[0] ||
                        user?.name?.split(' ')[0] ||
                        'User'}
                    </button>
                  </div>
                ) : (
                  <Link href={'/login'} className="hidden md:block">
                    <div className="flex flex-col">
                      <span className="block font-medium text-sm">Hello,</span>
                      <span className="block font-semibold text-brand-primary text-sm">
                        Sign In
                      </span>
                    </div>
                  </Link>
                )}

                {/* Wishlist Icon */}
                <Link
                  href={'/wishlist'}
                  className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
                  title="Wishlist"
                >
                  <HeartIcon className="w-7 h-7 text-text-primary" />
                  <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-5px] right-[-5px]">
                    <span className="text-white font-medium text-sm">
                      {wishlist.length}
                    </span>
                  </div>
                </Link>

                {/* Cart Icon */}
                <Link
                  href={'/cart'}
                  className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
                  title="Cart"
                >
                  <CartIcon className="w-7 h-7 text-text-primary" />
                  <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-5px] right-[-5px]">
                    <span className="text-white font-medium text-sm">
                      {cart.length}
                    </span>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
