'use client';

import React, { useEffect } from 'react';
import {
  Store,
  TrendingUp,
  Package,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Zap,
  Users,
  DollarSign,
  Star,
  CheckCircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '../../hooks/use-auth';
import ShopProfileEditor from '../../components/shop-profile/shop-profile-editor';
import LanguageSwitcher from '../../components/language-switcher';
import { useUIStore } from '../../store/ui.store';
import { Link } from '../../i18n/navigation';

const MARKETPLACE_URL =
  process.env.NEXT_PUBLIC_MARKETPLACE_URL ?? 'http://localhost:3000';

const stats = [
  { icon: Users, value: '12,400+', label: 'Active Sellers' },
  { icon: DollarSign, value: '$2.4M+', label: 'Monthly Revenue' },
  { icon: Star, value: '4.9/5', label: 'Seller Rating' },
  { icon: Zap, value: '5 min', label: 'Setup Time' },
];

const steps = [
  {
    step: '01',
    title: 'Create Account',
    desc: "Register as a customer on the TecShop marketplace — it's free and takes 30 seconds.",
  },
  {
    step: '02',
    title: 'Upgrade to Seller',
    desc: 'From your profile, apply to become a seller. Fill in your shop details and business info.',
  },
  {
    step: '03',
    title: 'Start Earning',
    desc: 'List your products, accept orders, and get paid directly to your bank account.',
  },
];

// Full class names so Tailwind JIT picks them up at build time
const featureColors = [
  'bg-brand-primary',
  'bg-brand-secondary-500',
  'bg-brand-accent',
  'bg-[#7C3AED]',
];

/**
 * Forces light mode on <html> while the landing page is mounted.
 * Does NOT write to localStorage — the store's persisted theme is untouched.
 * On unmount, the store's actual theme is re-applied to the DOM.
 */
const useLandingPageSetup = () => {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // Force light mode without touching the store or localStorage
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');

    // The root layout sets h-screen overflow-hidden on body for the dashboard
    // layout. Override it so the landing page can scroll freely.
    body.style.height = 'auto';
    body.style.overflow = 'auto';

    return () => {
      // Restore body constraints for dashboard layout
      body.style.height = '';
      body.style.overflow = '';

      // Restore persisted theme
      const { theme } = useUIStore.getState();
      if (theme === 'dark') {
        root.classList.add('dark');
        root.setAttribute('data-theme', 'dark');
      }
    };
  }, []);
};

const LandingPage: React.FC = () => {
  const t = useTranslations('LandingPage');
  useLandingPageSetup();

  const features = [
    {
      icon: Store,
      title: t('feature1Title'),
      description: t('feature1Desc'),
      color: featureColors[0],
    },
    {
      icon: Package,
      title: t('feature2Title'),
      description: t('feature2Desc'),
      color: featureColors[1],
    },
    {
      icon: TrendingUp,
      title: t('feature3Title'),
      description: t('feature3Desc'),
      color: featureColors[2],
    },
    {
      icon: ShieldCheck,
      title: t('feature4Title'),
      description: t('feature4Desc'),
      color: featureColors[3],
    },
  ];

  return (
    <div className="min-h-screen bg-surface overflow-x-hidden">
      {/* Floating Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl px-4 sm:px-5 py-2.5 flex items-center justify-between shadow-elev-low">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm sm:text-base font-bold font-display text-gray-900">
              {t('brandName')}
            </span>
          </div>

          {/* Nav actions — no ThemeToggle: this page is always light */}
          <div className="flex items-center gap-2">
            {/* Hidden on mobile to prevent overflow */}
            <div className="hidden sm:flex items-center gap-2">
              <LanguageSwitcher />
              <div className="w-px h-5 bg-gray-200" />
              <Link
                href="/login"
                className="text-gray-500 hover:text-gray-900 font-medium text-sm transition-colors duration-200 cursor-pointer px-2"
              >
                {t('login')}
              </Link>
            </div>
            <a
              href={`${MARKETPLACE_URL}/profile?active=Become a Seller`}
              className="bg-brand-primary text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-brand-primary-700 transition-colors duration-200 font-medium text-sm cursor-pointer whitespace-nowrap"
            >
              {t('getStarted')}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 sm:pt-32 sm:pb-20 md:pt-36 md:pb-28 px-4 overflow-hidden">
        {/* Brand gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0058BB] via-[#0047A0] to-[#1E3A8A]" />
        {/* Color accent layers */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 55%, #6C9FFF 0%, transparent 45%), radial-gradient(circle at 85% 15%, #5670D5 0%, transparent 40%), radial-gradient(circle at 65% 80%, #F97316 0%, transparent 30%)',
          }}
        />
        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='%23ffffff'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-pill px-3 sm:px-4 py-1.5 sm:py-2 text-white/90 text-xs sm:text-sm font-medium mb-6 sm:mb-8">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-secondary-400 shrink-0" />
            Start selling in minutes — no hidden fees
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display text-white leading-tight mb-5 md:mb-6">
            {t('heroTitle')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed">
            {t('heroDesc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5 sm:mb-6">
            <a
              href={`${MARKETPLACE_URL}/profile?active=Become a Seller`}
              className="w-full sm:w-auto bg-brand-secondary-500 hover:bg-brand-secondary-400 text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 shadow-lg cursor-pointer"
            >
              {t('createShop')}
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/login"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/30 text-white px-6 py-3.5 sm:px-8 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:bg-white/20 transition-all duration-200 text-center cursor-pointer"
            >
              {t('signIn')}
            </Link>
          </div>

          <p className="text-blue-200 text-xs sm:text-sm">
            Don&apos;t have an account?{' '}
            <a
              href={`${MARKETPLACE_URL}/signup`}
              className="text-white font-medium underline underline-offset-2 hover:no-underline cursor-pointer"
            >
              Register on the marketplace first
            </a>
          </p>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="bg-surface-container-lowest border-b border-gray-200 py-8 md:py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-gray-900">
                {stat.value}
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-14 md:py-24">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-gray-900 mb-3 md:mb-4">
            {t('featuresTitle')}
          </h2>
          <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            Everything you need to run a successful online shop, all in one
            place.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-surface-container-lowest border border-gray-200 rounded-lg p-5 sm:p-6 hover:border-brand-primary/30 hover:shadow-elev-md transition-all duration-200 cursor-default"
            >
              <div
                className={`w-11 h-11 sm:w-12 sm:h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}
              >
                <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works — intentionally always dark */}
      <section className="bg-surface-container-lowest py-14 md:py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-ui-surface-dark mb-3 md:mb-4">
              How It Works
            </h2>
            <p className="text-slate-900/60 text-base md:text-lg">
              Three simple steps to launch your shop
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {steps.map((item, i) => (
              <div key={item.step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-full w-full h-px bg-gradient-to-r from-slate-800/90 to-transparent z-0" />
                )}
                {/* Mobile connector line between steps */}
                {i < steps.length - 1 && (
                  <div className="md:hidden absolute left-5 top-full h-8 w-px bg-black" />
                )}
                <div className="relative z-10">
                  <div className="text-5xl sm:text-6xl font-black font-display text-brand-primary/90 mb-3 leading-none">
                    {item.step}
                  </div>
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <CheckCircle className="w-5 h-5 text-brand-primary-400 shrink-0" />
                    <h3 className="text-sm sm:text-base font-semibold text-ui-surface-dark/90">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-ui-surface-dark/50 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-14 md:py-24 px-4 bg-gradient-to-br from-[#0058BB] to-[#0047A0] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 50%, #ffffff 0%, transparent 60%)',
          }}
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display text-white mb-3 md:mb-4">
            {t('ctaTitle')}
          </h2>
          <p className="text-blue-100 text-base sm:text-lg mb-6 md:mb-10 max-w-xl mx-auto leading-relaxed">
            {t('ctaDesc')}
          </p>
          <a
            href={`${MARKETPLACE_URL}/profile?active=Become a Seller`}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 bg-brand-secondary-500 hover:bg-brand-secondary-400 text-white px-8 py-3.5 sm:px-10 sm:py-4 rounded-lg font-semibold text-base sm:text-lg transition-all duration-200 hover:scale-105 shadow-elev-lg cursor-pointer"
          >
            {t('getStartedFree')}
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer — intentionally always dark */}
      <footer className="bg-ui-surface-dark border-t border-white/10 py-6 sm:py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-primary rounded-md flex items-center justify-center">
              <Store className="w-3 h-3 text-white" />
            </div>
            <span className="text-white/70 text-sm font-medium font-display">
              {t('brandName')}
            </span>
          </div>
          <p className="text-white/40 text-xs sm:text-sm">{t('copyright')}</p>
        </div>
      </footer>
    </div>
  );
};

const AuthenticatedHomePage: React.FC = () => {
  const t = useTranslations('LandingPage');
  useLandingPageSetup();

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold font-display text-gray-900">
              {t('brandName')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <div className="w-px h-5 bg-gray-200" />
            <Link
              href="/dashboard"
              className="text-brand-primary hover:text-brand-primary-700 font-medium text-sm transition-colors duration-200 cursor-pointer flex items-center gap-1"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>
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
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-ui-background-dark">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHomePage />;
  }

  return <LandingPage />;
};

export default Page;
