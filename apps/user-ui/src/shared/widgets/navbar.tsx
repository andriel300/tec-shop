'use client';

import { createLogger } from '@tec-shop/next-logger';
import { Link, useRouter } from '../../i18n/navigation';

const logger = createLogger('user-ui:navbar');
import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import ProfileIcon from '../../assets/svgs/profile-icon';
import { NotificationBell } from '../components/notification-bell';
import { WishlistDropdown } from '../components/wishlist-dropdown';
import { CartDropdown } from '../components/cart-dropdown';
import LanguageSwitcher from '../components/language-switcher';
import StickyNavbar from './sticky-navbar';
import useLayout from '../../hooks/use-layout';
import Image from 'next/image';
import SearchBar from '../components/SearchBar';

const Navbar = () => {
  const { isAuthenticated, user, userProfile, logout } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { layout } = useLayout();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setImageError(false);
  }, [userProfile?.picture]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    queryClient.clear();
    router.push('/login');
  };

  const avatarContent = (
    <>
      {mounted && isAuthenticated && userProfile?.picture && !imageError ? (
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
              logger.warn('Failed to load profile image, falling back to icon');
              setImageError(true);
            }}
          />
        </div>
      ) : (
        <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
      )}
    </>
  );

  const avatarClass =
    'p-1 border-2 w-[50px] h-[50px] lg:w-[60px] lg:h-[60px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors overflow-hidden';

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

        {/* User Section */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Profile avatar — dropdown when authenticated, link when not */}
            {mounted && isAuthenticated ? (
              <div ref={dropdownRef} className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={avatarClass}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  {avatarContent}
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-ui-surface border border-ui-divider rounded-xl shadow-elev-lg z-[200] overflow-hidden">
                    {/* User info header */}
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

                    {/* Menu items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-ui-muted transition-colors text-sm text-text-primary"
                      >
                        <User size={15} className="text-text-secondary flex-shrink-0" />
                        My Profile
                      </Link>
                      <Link
                        href="/inbox"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-ui-muted transition-colors text-sm text-text-primary"
                      >
                        <MessageCircle size={15} className="text-text-secondary flex-shrink-0" />
                        Inbox
                      </Link>
                    </div>

                    {/* Sign out */}
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
              <Link href="/login" className={avatarClass}>
                {avatarContent}
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
      </div>
      <StickyNavbar />
    </div>
  );
};

export default Navbar;
