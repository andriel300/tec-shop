'use client';

import { Link } from '../../i18n/navigation';
import React, { useState } from 'react';
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  CreditCard,
  Shield,
  Truck,
  RotateCcw,
} from 'lucide-react';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white text-gray-600">
      {/* Features Bar */}
      <div className="border-b border-gray-200">
        <div className="w-[90%] lg:w-[80%] mx-auto py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-full">
                <Truck className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Free Shipping
                </h4>
                <p className="text-xs text-gray-500">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-full">
                <RotateCcw className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Easy Returns
                </h4>
                <p className="text-xs text-gray-500">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-full">
                <Shield className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  Secure Payment
                </h4>
                <p className="text-xs text-gray-500">100% secure checkout</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-brand-primary/10 rounded-full">
                <Phone className="w-6 h-6 text-brand-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 text-sm">
                  24/7 Support
                </h4>
                <p className="text-xs text-gray-500">Dedicated support</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="w-[90%] lg:w-[80%] mx-auto py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/">
              <span className="text-2xl font-bold text-brand-primary">
                TecShop
              </span>
            </Link>
            <p className="mt-4 text-sm text-gray-500 leading-relaxed">
              Your premier destination for quality products at competitive
              prices. We connect buyers with trusted sellers to create a
              seamless shopping experience.
            </p>

            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>123 Commerce Street, Tech City, TC 12345</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-brand-primary flex-shrink-0" />
                <span>support@tecshop.com</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-primary hover:text-white transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/products"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Products
                </Link>
              </li>
              <li>
                <Link
                  href="/shops"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Shops
                </Link>
              </li>
              <li>
                <Link
                  href="/offers"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Offers
                </Link>
              </li>
              <li>
                <Link
                  href="/become-a-seller"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Become a Seller
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/profile"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  My Account
                </Link>
              </li>
              <li>
                <Link
                  href="/orders"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Order Tracking
                </Link>
              </li>
              <li>
                <Link
                  href="/wishlist"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Wishlist
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-sm hover:text-brand-primary transition-colors"
                >
                  Returns & Refunds
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-gray-500 mb-4">
              Subscribe to get special offers, free giveaways, and new arrivals.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full px-4 py-3 pr-12 bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-brand-primary transition-colors"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-brand-primary hover:text-brand-primary/70 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              {subscribed && (
                <p className="text-green-600 text-xs">
                  Thanks for subscribing!
                </p>
              )}
            </form>

            {/* Legal Links */}
            <div className="mt-6">
              <h4 className="text-gray-900 font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-xs hover:text-brand-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-xs hover:text-brand-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-xs hover:text-brand-primary transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200">
        <div className="w-[90%] lg:w-[80%] mx-auto py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <p className="text-sm text-gray-500">
              {currentYear} TecShop. All rights reserved.
            </p>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 mr-2">We accept:</span>
              <div className="flex items-center gap-2">
                <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  VISA
                </div>
                <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  MasterCard
                </div>
                <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                  PayPal
                </div>
                <div className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  <span>Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
