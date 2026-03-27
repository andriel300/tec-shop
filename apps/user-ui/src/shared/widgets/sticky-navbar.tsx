'use client';
import { createLogger } from '@tec-shop/next-logger';
import { AlignLeft, ChevronDown, ChevronRight, User, MessageCircle, LogOut } from 'lucide-react';

const logger = createLogger('user-ui:sticky-navbar');
import { Link, usePathname, useRouter } from '../../i18n/navigation';
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';
import { navItems } from '../../configs/constants';
import ProfileIcon from '../../assets/svgs/profile-icon';
import { useAuth } from '../../hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

import { useCategoryTree } from '../../hooks/use-categories';
import { NotificationBell } from '../components/notification-bell';
import { WishlistDropdown } from '../components/wishlist-dropdown';
import { CartDropdown } from '../components/cart-dropdown';
import LanguageSwitcher from '../components/language-switcher';

const StickyNavbar = () => {
  const t = useTranslations('Navbar');
  const { isAuthenticated, user, userProfile, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = React.useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleCategoryMouseEnter = (categoryId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredCategory(categoryId);
  };

  const handleDropdownMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 80);
  };

  const handleSubcategoryMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShow(false);
        setHoveredCategory(null);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    queryClient.clear();
    router.push('/login');
  };

  return (
    <div
      className={`w-full transition-all duration-300 ${isSticky
        ? 'fixed top-0 left-0 z-[100] bg-ui-background shadow-lg'
        : 'relative'
        }`}
    >
      <div
        className={`w-[80%] relative m-auto flex items-center justify-between ${isSticky ? 'py-3' : 'py-0'
          }`}
      >
        {/* Dropdowns */}
        <div
          ref={dropdownRef}
          className={`w-[260px] ${isSticky && '-mb-2'} cursor-pointer relative`}
        >
          <div
            className="flex items-center justify-between px-5 h-[50px] border border-ui-divider bg-ui-background hover:bg-ui-muted transition-colors"
            onClick={() => setShow(!show)}
          >
            <div className="flex items-center gap-2">
              <AlignLeft className="w-5 h-5 text-text-primary" />
              <span className="text-text-primary font-medium font-heading">
                {t('allDepartments')}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-text-primary" />
            {/* Dropdown Menu */}
            {show && (
              <div
                className={`absolute left-0 ${isSticky ? 'top-[70px]' : 'top-[50px]'
                  } flex z-50`}
                onMouseLeave={handleDropdownMouseLeave}
              >
                {/* Main categories column */}
                <div className="w-[260px] max-h-[500px] bg-ui-surface shadow-elev-lg border border-ui-divider flex flex-col">
                  <div className="overflow-y-auto flex-1">
                    {categoriesLoading ? (
                      <div className="p-4 text-center text-text-secondary">
                        {t('loadingCategories')}
                      </div>
                    ) : categories && categories.length > 0 ? (
                      <div className="py-2">
                        {categories.map((category) => (
                          <div
                            key={category.id}
                            onMouseEnter={() => handleCategoryMouseEnter(category.id)}
                          >
                            <Link
                              href={`/all-products?categoryId=${category.id}`}
                              className={`flex items-center justify-between px-4 py-3 transition-colors ${hoveredCategory === category.id
                                ? 'bg-ui-muted'
                                : 'hover:bg-ui-muted'
                                }`}
                              onClick={() => setShow(false)}
                            >
                              <span className="font-heading font-medium text-sm text-text-primary">
                                {category.name}
                              </span>
                              {category.children &&
                                category.children.length > 0 && (
                                  <ChevronRight
                                    size={16}
                                    className="text-text-secondary"
                                  />
                                )}
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-text-secondary">
                        {t('noCategories')}
                      </div>
                    )}
                  </div>

                  {/* View All Categories Link */}
                  {categories && categories.length > 0 && (
                    <div className="border-t border-ui-divider p-3 flex-shrink-0">
                      <Link
                        href="/categories"
                        onClick={() => setShow(false)}
                        className="block text-center text-brand-primary font-medium hover:underline text-sm"
                      >
                        {t('viewAllCategories')}
                      </Link>
                    </div>
                  )}
                </div>

                {/* Subcategories panel - outside the scroll container to avoid clipping */}
                {hoveredCategory &&
                  categories?.find((c) => c.id === hoveredCategory)?.children
                    ?.length && (
                    <div
                      className="w-[260px] max-h-[500px] bg-ui-surface shadow-elev-lg border border-ui-divider overflow-y-auto ml-px"
                      onMouseEnter={handleSubcategoryMouseEnter}
                    >
                      <div className="py-2">
                        {categories
                          ?.find((c) => c.id === hoveredCategory)
                          ?.children?.map((subcategory) => (
                            <Link
                              key={subcategory.id}
                              href={`/all-products?categoryId=${subcategory.id}`}
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
            )}
          </div>
        </div>
        {/* Navigation Links */}

        <div className="flex items-center">
          {navItems.map((i: NavItemsTypes, index: number) => {
            if (i.translationKey === 'becomeASeller' && user?.userType === 'seller') {
              return (
                <Link
                  key={index}
                  className="px-3 py-1.5 font-Jost capitalize text-md text-text-inverted bg-brand-secondary rounded-md hover:opacity-90 transition-colors"
                  href={`${process.env.NEXT_PUBLIC_SELLER_SERVER_URI ?? 'http://localhost:3001'}/dashboard`}
                >
                  {t('sellerDashboard')}
                </Link>
              );
            }

            // Check if this is the "Become a Seller" button
            const isBecomeSeller = i.translationKey === 'becomeASeller';

            const isActive = !isBecomeSeller && (
              pathname === i.href || (i.href !== '/' && pathname.startsWith(i.href))
            );

            return (
              <Link
                className={`px-3 font-Jost capitalize text-sm font-medium transition-colors ${isBecomeSeller
                  ? 'bg-brand-primary text-white hover:opacity-90 py-2 px-4 rounded-md ml-2'
                  : isActive
                    ? 'text-brand-primary border-b-2 border-brand-primary pb-0.5'
                    : 'text-text-primary hover:text-brand-primary'
                  }`}
                href={i.href}
                key={index}
              >
                {t(i.translationKey as Parameters<typeof t>[0])}
              </Link>
            );
          })}
        </div>

        <div>
          {isSticky && (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3 lg:gap-4">
                {/* Profile avatar — dropdown when authenticated, link when not */}
                {mounted && isAuthenticated ? (
                  <div ref={profileDropdownRef} className="relative">
                    <button
                      onClick={() => setProfileDropdownOpen((prev) => !prev)}
                      className="p-1 border-2 w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors overflow-hidden"
                      aria-label="Account menu"
                      aria-expanded={profileDropdownOpen}
                    >
                      {userProfile?.picture && !imageError ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={userProfile.picture}
                          alt={userProfile.name || 'Profile'}
                          className="w-full h-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={() => {
                            logger.warn('Failed to load profile image in sticky header, falling back to icon');
                            setImageError(true);
                          }}
                        />
                      ) : (
                        <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
                      )}
                    </button>

                    {profileDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-ui-surface border border-ui-divider rounded-xl shadow-elev-lg z-[200] overflow-hidden">
                        <div className="px-4 py-3 border-b border-ui-divider">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {userProfile?.name || user?.name || 'User'}
                          </p>
                          {user?.email && (
                            <p className="text-xs text-text-secondary truncate mt-0.5">
                              {user.email}
                            </p>
                          )}
                        </div>
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-ui-muted transition-colors text-sm text-text-primary"
                          >
                            <User size={15} className="text-text-secondary flex-shrink-0" />
                            My Profile
                          </Link>
                          <Link
                            href="/inbox"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-ui-muted transition-colors text-sm text-text-primary"
                          >
                            <MessageCircle size={15} className="text-text-secondary flex-shrink-0" />
                            Inbox
                          </Link>
                        </div>
                        <div className="border-t border-ui-divider py-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-sm text-red-600"
                          >
                            <LogOut size={15} className="flex-shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="p-1 border-2 w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors overflow-hidden"
                    title="Account"
                  >
                    <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
                  </Link>
                )}

                {/* Notification Bell */}
                {mounted && isAuthenticated && <NotificationBell />}

                {/* Language Switcher */}
                <LanguageSwitcher />

                {/* Wishlist Dropdown */}
                <WishlistDropdown />

                {/* Cart Dropdown */}
                <CartDropdown />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StickyNavbar;
