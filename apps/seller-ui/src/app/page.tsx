'use client';

import React from 'react';
import Link from 'next/link';
import { Store, TrendingUp, Package, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';
import ShopProfileEditor from '../components/shop-profile/shop-profile-editor';

const features = [
  {
    icon: Store,
    title: 'Create Your Shop',
    description: 'Set up your online store in minutes with our easy-to-use platform.',
  },
  {
    icon: Package,
    title: 'Manage Products',
    description: 'Easily add, edit, and organize your product catalog with powerful tools.',
  },
  {
    icon: TrendingUp,
    title: 'Track Performance',
    description: 'Monitor your sales, orders, and revenue with detailed analytics.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Payments',
    description: 'Accept payments securely with Stripe integration and instant payouts.',
  },
];

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">TecShop Seller</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Start Selling on TecShop Today
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Join thousands of sellers and reach millions of customers worldwide.
          Set up your shop in minutes and start earning.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center gap-2"
          >
            Create Your Shop
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="bg-white text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg border border-gray-300"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Everything You Need to Succeed
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-8">
            Join TecShop today and take your business to the next level.
            No monthly fees - only pay when you make a sale.
          </p>
          <Link
            href="/signup"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors font-medium text-lg inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>2026 TecShop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const AuthenticatedHomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">TecShop Seller</span>
          </div>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Go to Dashboard
          </Link>
        </div>
      </header>

      {/* Shop Profile Editor */}
      <div className="py-8 px-4">
        <ShopProfileEditor />
      </div>
    </div>
  );
};

const Page: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHomePage />;
  }

  return <LandingPage />;
};

export default Page;
