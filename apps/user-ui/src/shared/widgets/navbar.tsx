'use client';

import { Link } from '../../i18n/navigation';
import { useTranslations } from 'next-intl';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/use-auth';
import ProfileIcon from '../../assets/svgs/profile-icon';
import HeartIcon from '../../assets/svgs/heart-icon';
import CartIcon from '../../assets/svgs/cart-icon';
import { NotificationBell } from '../components/notification-bell';
import LanguageSwitcher from '../components/language-switcher';
import StickyNavbar from './sticky-navbar';
import useStore from '../../store';
import useLayout from '../../hooks/use-layout';
import Image from 'next/image';
import SearchBar from '../components/SearchBar';

const Navbar = () => {
  const t = useTranslations('Navbar');
  const tCommon = useTranslations('Common');
  const { isAuthenticated, user, userProfile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { layout } = useLayout();

  // zustand hooks

  const wishlistCount = useStore((state) => state.wishlist.length);
  const cartCount = useStore((state) => state.cart.length);

  // Prevent hydration mismatch by only showing auth state after client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset image error when userProfile changes
  useEffect(() => {
    setImageError(false);
  }, [userProfile?.picture]);

  return (
    <div className="w-full bg-ui-background border-b border-ui-divider">
      <div className="w-[90%] lg:w-[80%] mx-auto py-5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href={'/'}>
            <Image
              src={
                layout?.logo ??
                'https://ik.imagekit.io/andrieltecshop/products/tecshop-logo.png'
              }
              width={200}
              height={80}
              alt="TecShop Logo"
              className="h-[40px] w-auto object-contain"
              style={{ height: 'auto' }}
              sizes="150px"
              priority
            />
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 mx-4 lg:mx-8 max-w-2xl">
          <SearchBar />
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
                <div className="relative w-full h-full">
                  <Image
                    src={userProfile.picture}
                    alt={userProfile.name || 'Profile'}
                    fill
                    className="object-cover rounded-full"
                    sizes="50px"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => {
                      console.warn(
                        'Failed to load profile image, falling back to icon'
                      );
                      setImageError(true);
                    }}
                  />
                </div>
              ) : (
                <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
              )}
            </Link>

            {/* User Info / Sign In */}
            {mounted && isAuthenticated ? (
              <div className="hidden md:flex flex-col">
                <span className="block font-medium text-sm">{tCommon('hello')}</span>
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
                  <span className="block font-medium text-sm">{tCommon('welcome')}</span>
                  <span className="block font-semibold text-brand-primary text-sm">
                    {t('signInRegister')}
                  </span>
                </div>
              </Link>
            )}

            {/* Notification Bell */}
            {mounted && isAuthenticated && <NotificationBell />}

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Wishlist Icon */}
            <Link
              href={'/wishlist'}
              className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
            >
              <HeartIcon className="w-7 h-7 text-text-primary" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex item-center justify-center absolute top-[-5px] right-[-5px] text-text-primary">
                <span className="text-white font-medium text-sm">
                  {wishlistCount}
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
                  {cartCount}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
      <StickyNavbar />
    </div>
  );
};

export default Navbar;
