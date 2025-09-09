'use client';
import { AlignLeft, ChevronDown, HeartIcon } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { navItems } from '../../configs/constants';
import ProfileIcon from '../../assets/svgs/profile-icon';
import CartIcon from '../../assets/svgs/cart-icon';

const HeaderBottom = () => {
  const [show, setShow] = React.useState(false);
  const [isSticky, setIsSticky] = useState(false);

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
              } w-[260px] h-[400px] bg-ui-surface shadow-elev-lg z-50`}
            ></div>
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
                  href={'/login'}
                  className="p-2 border-2 w-[45px] h-[45px] lg:w-[50px] lg:h-[50px] flex items-center justify-center rounded-full border-ui-divider hover:bg-ui-muted transition-colors"
                  title="Account"
                >
                  <ProfileIcon className="w-5 h-5 lg:w-6 lg:h-6 text-text-primary" />
                </Link>

                {/* Sign In Text */}
                <Link href={'/login'} className="hidden md:block">
                  <div className="flex flex-col">
                    <span className="block font-medium text-sm">Hello,</span>
                    <span className="block font-semibold text-brand-primary text-sm">
                      Sign In
                    </span>
                  </div>
                </Link>

                {/* Wishlist Icon */}
                <Link
                  href={'/wishlist'}
                  className="relative p-2 hover:bg-ui-muted rounded-full transition-colors"
                  title="Wishlist"
                >
                  <HeartIcon className="w-7 h-7 text-text-primary" />
                  <div className="w-6 h-6 border-2 border-white bg-red-500 rounded-full flex items-center justify-center absolute top-[-5px] right-[-5px]">
                    <span className="text-white font-medium text-sm">0</span>
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
                    <span className="text-white font-medium text-sm">0</span>
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
