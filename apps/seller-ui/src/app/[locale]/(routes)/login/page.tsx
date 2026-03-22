'use client';

import React from 'react';
import { LoginForm } from '../../../../components/forms/login-form';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Link } from 'apps/seller-ui/src/i18n/navigation';
import { Accessibility, Shield, Headphones } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#0F1724] flex flex-col">
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Card */}
        <div
          className="w-full max-w-md rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#141B2D' }}
        >
          {/* Blue top accent */}
          <div className="h-px bg-gradient-to-r from-brand-primary-600 via-blue-400 to-transparent" />

          <div className="p-8 space-y-7">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-brand-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Accessibility size={18} className="text-white" />
              </div>
              <span className="text-slate-300 text-lg font-semibold tracking-wide">
                TecShop
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-200">Seller Login</h1>
              <p className="text-gray-400 text-sm">Access your shop dashboard</p>
            </div>

            {/* Form */}
            <LoginForm />

            {/* Sign up link */}
            <p className="text-center text-gray-500 text-sm pt-2 border-t border-white/5">
              New to TecShop?{' '}
              <Link
                href="/signup"
                className="text-brand-primary-600 hover:text-blue-400 font-medium transition-colors"
              >
                Create Your Seller Account
              </Link>
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex items-center gap-10 mt-7">
          <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-medium">
            <Shield size={13} />
            Secure Encryption
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-medium">
            <Headphones size={13} />
            24/7 Seller Support
          </div>
        </div>
      </div>

      {/* Page footer */}
      <footer className="py-5 px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-gray-700 uppercase tracking-widest border-t border-white/5">
        <span>© 2026 Precision TechShop Editorial. Architectural Precision.</span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-gray-500 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-gray-500 transition-colors">
            Terms of Service
          </Link>
          <Link href="/contact" className="hover:text-gray-500 transition-colors">
            Contact Support
          </Link>
        </div>
      </footer>
    </div>
  );
}
