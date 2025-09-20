'use client';

import Link from 'next/link';
import React from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../../hooks/use-auth';
import ProfileIcon from '../../assets/svgs/profile-icon';
import HeartIcon from '../../assets/svgs/heart-icon';
import CartIcon from '../../assets/svgs/cart-icon';
import HeaderBottom from './header-bottom';

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-full bg-ui-background border-b border-ui-divider">
      <div className="w-[90%] lg:w-[80%] mx-auto py-5 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href={'/'}>
            <span className="text-2xl lg:text-3xl font-heading font-bold text-brand-primary">
              TecShop
            </span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 mx-4 lg:mx-8 max-w-2xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for anything..."
              className="w-full px-4 font-sans border-2 border-brand-primary rounded-md outline-none h-[55px]"
            />
            <button className="w-[60px] cursor-pointer flex items-center justify-center h-[55px] bg-brand-primary rounded-r-md absolute top-0 right-0 hover:bg-brand-primary-800 transition-colors">
              <Search color="#fff" size={24} />
            </button>
          </div>
        </div>

        {/* User Section - Now includes both profile and wishlist */}
        <div className="flex-shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Profile Icon */}
            <Link
              href={isAuthenticated ? '/profile' : '/login'}
              className="p-2 border-2 w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors"
            >
              <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
            </Link>

            {/* User Info / Sign In */}
            {isAuthenticated ? (
              <div className="hidden md:flex flex-col">
                <span className="block font-medium text-sm">Hello,</span>
                <button
                  onClick={handleLogout}
                  className="block font-semibold text-brand-primary text-sm hover:underline text-left"
                >
                  {user?.email?.split('@')[0] || 'User'}
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
            >
              <HeartIcon className="w-7 h-7 text-text-primary" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex item-center justify-center absolute top-[-5px] right-[-5px] text-text-primary">
                <span className="text-white font-medium text-sm">0</span>
              </div>
            </Link>

            {/* Cart Icon */}
            <Link
              href={'/cart'}
              className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
            >
              <CartIcon className="w-7 h-7 text-text-primary" />
              <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex item-center justify-center absolute top-[-5px] right-[-5px] text-text-primary">
                <span className="text-white font-medium text-sm">0</span>
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
