'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import ProfileIcon from '../../../../assets/svgs/profile-icon';
import ShippingAddressSection from '../../../../components/shippingAddress';
import OrdersSection from '../../../../components/orders';
import ChangePassword from '../../../../components/changePassword';
import { useAuth } from '../../../../hooks/use-auth';
import { useCurrency } from '../../../../hooks/use-currency';
import { useOrders } from '../../../../hooks/use-orders';
import useStore from '../../../../store';
import { updateUserProfile, uploadUserAvatar } from '../../../../lib/api/user';
import type { User, UserProfile } from '../../../../lib/api/user';
import type { Order } from '../../../../lib/api/orders';
import { toast } from 'sonner';
import {
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Heart,
  Inbox,
  Loader2,
  Lock,
  LogOut,
  MapPin,
  Package,
  ShoppingBag,
  Store,
  Tag,
  Truck,
  User as UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useRouter } from '../../../../i18n/navigation';
import { Link } from '../../../../i18n/navigation';
import React, { useEffect, useRef, useState } from 'react';

// Lazy-loaded with ssr:false — react-easy-crop → normalize-wheel (CJS) causes
// Turbopack SSR compilation loops when included in the server module graph
const CropModal = dynamic(() => import('./crop-modal'), { ssr: false });
import { useTranslations, useLocale } from 'next-intl';

// helpers

type TabKey = 'Profile' | 'My Orders' | 'Shipping Address' | 'Change Password';

function getStatusStep(status: Order['status']): number {
  if (status === 'PAID') return 0;
  if (status === 'SHIPPED') return 1;
  if (status === 'DELIVERED') return 2;
  return -1;
}

function getStatusPill(status: Order['status']): string {
  if (status === 'PENDING') return 'bg-gray-100 text-gray-600';
  if (status === 'PAID') return 'bg-blue-100 text-blue-700';
  if (status === 'SHIPPED') return 'bg-amber-100 text-amber-700';
  if (status === 'DELIVERED') return 'bg-green-100 text-green-700';
  if (status === 'CANCELLED') return 'bg-red-100 text-red-600';
  return 'bg-gray-100 text-gray-600';
}

// page

const Page = () => {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    userProfile,
    user,
    isLoading,
    logout,
    setUserProfile,
    updateAuthState,
  } = useAuth();
  const { data: orders = [] } = useOrders();
  const { formatPrice } = useCurrency();
  const wishlist = useStore((state) => state.wishlist);

  const [activeTab, setActiveTab] = useState<TabKey>('Profile');
  const [imageError, setImageError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Read initial tab from URL on mount (avoids useSearchParams and its compile loop)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get('active') || params.get('tab') || 'Profile') as TabKey;
    if (tab !== 'Profile') setActiveTab(tab);
  }, []);

  // Crop modal state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageError(false);
  }, [userProfile?.picture, userProfile?.avatar]);

  // Sync active tab to URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentTab = params.get('active') || params.get('tab') || 'Profile';
    if (activeTab !== currentTab) {
      params.set('active', activeTab);
      window.history.replaceState(null, '', `?${params.toString()}`);
    }
  }, [activeTab]);

  const logOutHandler = async () => {
    await logout();
    queryClient.clear();
    router.push('/login');
  };

  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updated) => {
      setUserProfile(updated);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setIsEditing(false);
      toast.success(t('profileUpdated'));
    },
    onError: () => {
      toast.error(t('failedToUpdateProfile'));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
      const { url } = await uploadUserAvatar(file);
      return updateUserProfile({ picture: url });
    },
    onSuccess: (updated) => {
      setUserProfile(updated);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setCropSrc(null);
      toast.success(t('photoUpdated'));
    },
    onError: () => {
      toast.error(t('failedToUploadPhoto'));
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleEditProfile = () => {
    setActiveTab('Profile');
    setIsEditing(true);
  };

  // Derived stats
  const totalOrders = orders.length;
  const processingOrders = orders.filter(
    (o) => o.status === 'PAID' || o.status === 'SHIPPED'
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;
  const wishlistCount = wishlist.length;

  const recentActiveOrder =
    orders.find((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED') ??
    orders[0] ??
    null;

  // Profile completeness
  const completenessFlags = [
    !!(userProfile?.picture || userProfile?.avatar?.url),
    !!user?.name,
    !!userProfile?.bio,
  ];
  const completeness = Math.round(
    (completenessFlags.filter(Boolean).length / completenessFlags.length) * 100
  );

  const displayName = user?.name || userProfile?.name || 'User';
  const firstName = displayName.split(' ')[0];
  const avatarSrc = userProfile?.avatar?.url || userProfile?.picture || '';
  const hasAvatar = !isLoading && !!avatarSrc && !imageError;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(locale, {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const isUploading = uploadMutation.isPending;

  // Spending overview
  const totalSpent = orders
    .filter((o) => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.finalAmount, 0);
  const totalSaved = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const uniqueVendors = new Set(
    orders.flatMap((o) => o.items.map((item) => item.shopId))
  ).size;

  // Status steps with translations
  const STATUS_STEPS: Array<{ key: Order['status']; label: string }> = [
    { key: 'PAID', label: t('statusPaid') },
    { key: 'SHIPPED', label: t('statusShipped') },
    { key: 'DELIVERED', label: t('statusDelivered') },
  ];

  // Tab label map — keeps internal keys as English, only translates display
  const tabLabels: Record<TabKey, string> = {
    'Profile': t('tabProfile'),
    'My Orders': t('tabMyOrders'),
    'Shipping Address': t('tabShippingAddress'),
    'Change Password': t('tabChangePassword'),
  };

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-16">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Crop modal */}
      {cropSrc && (
        <CropModal
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onConfirm={(blob) => uploadMutation.mutate(blob)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Hero card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Cover strip */}
          <div className="h-28 bg-gradient-to-r from-brand-primary to-blue-400 relative">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, white 0%, transparent 60%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)',
              }}
            />
          </div>

          <div className="px-6 pb-5">
            {/* Avatar */}
            <div className="-mt-10 mb-3">
              <div className="relative inline-block">
                <button
                  className="group w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100 flex items-center justify-center focus:outline-none"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  title={t('changePhoto')}
                >
                  {isUploading ? (
                    <Loader2 className="animate-spin w-6 h-6 text-brand-primary" />
                  ) : hasAvatar ? (
                    <>
                      <Image
                        src={avatarSrc}
                        alt={displayName}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover group-hover:brightness-75 transition-all"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        onError={() => setImageError(true)}
                      />
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                        <Camera
                          size={18}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Camera
                          size={18}
                          className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </>
                  )}
                </button>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center border-2 border-white pointer-events-none">
                  <Camera size={11} className="text-white" />
                </div>
              </div>
            </div>

            {/* Name / email + Edit button */}
            <div className="flex items-start justify-between gap-4">
              <div>
                {isLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 text-gray-400" />
                ) : (
                  <>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">
                      {displayName}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {user?.email}
                    </p>
                    {memberSince && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t('memberSince', { date: memberSince })}
                      </p>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={handleEditProfile}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-brand-primary border border-brand-primary rounded-full hover:bg-blue-50 transition-colors"
              >
                <Camera size={13} />
                {t('editProfile')}
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px mt-5 bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
              {(
                [
                  {
                    labelKey: 'totalOrders' as const,
                    value: totalOrders,
                    Icon: Clock,
                    color: 'text-blue-500',
                    action: () => setActiveTab('My Orders'),
                  },
                  {
                    labelKey: 'processing' as const,
                    value: processingOrders,
                    Icon: Truck,
                    color: 'text-amber-500',
                    action: () => setActiveTab('My Orders'),
                  },
                  {
                    labelKey: 'completed' as const,
                    value: completedOrders,
                    Icon: CheckCircle,
                    color: 'text-green-500',
                    action: () => setActiveTab('My Orders'),
                  },
                  {
                    labelKey: 'wishlist' as const,
                    value: wishlistCount,
                    Icon: Heart,
                    color: 'text-red-400',
                    action: () => router.push('/wishlist'),
                  },
                ] as const
              ).map((stat) => (
                <button
                  key={stat.labelKey}
                  onClick={stat.action}
                  className="bg-white px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div>
                    <p className="text-xs text-gray-400">{t(stat.labelKey)}</p>
                    <p className="text-xl font-bold text-gray-900 mt-0.5">
                      {stat.value}
                    </p>
                  </div>
                  <stat.Icon size={20} className={stat.color} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3-column body */}
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Left sidebar */}
          <aside className="w-full lg:w-52 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-4">
              {/* Mini profile */}
              <div className="px-4 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {hasAvatar ? (
                      <Image
                        src={avatarSrc}
                        alt={displayName}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <ProfileIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {firstName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-brand-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${completeness}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">
                        {completeness}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <nav className="p-2 space-y-0.5">
                <NavItem
                  label={t('tabProfile')}
                  Icon={UserIcon}
                  active={activeTab === 'Profile'}
                  onClick={() => setActiveTab('Profile')}
                />
                <NavItem
                  label={t('tabMyOrders')}
                  Icon={ShoppingBag}
                  active={activeTab === 'My Orders'}
                  onClick={() => setActiveTab('My Orders')}
                />
                <NavItem
                  label={t('tabInbox')}
                  Icon={Inbox}
                  onClick={() => router.push('/inbox')}
                />
                <NavItem
                  label={t('tabShippingAddress')}
                  Icon={MapPin}
                  active={activeTab === 'Shipping Address'}
                  onClick={() => setActiveTab('Shipping Address')}
                />
                <NavItem
                  label={t('tabChangePassword')}
                  Icon={Lock}
                  active={activeTab === 'Change Password'}
                  onClick={() => setActiveTab('Change Password')}
                />
                <div className="pt-1 mt-1 border-t border-gray-100">
                  <NavItem
                    label={t('logout')}
                    Icon={LogOut}
                    danger
                    onClick={logOutHandler}
                  />
                </div>
              </nav>
            </div>
          </aside>

          {/* Center content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  {tabLabels[activeTab] ?? activeTab}
                </h2>
                {activeTab === 'Profile' && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-medium text-brand-primary hover:underline"
                  >
                    {t('edit')}
                  </button>
                )}
              </div>
              <div className="p-6">
                {activeTab === 'Profile' ? (
                  isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="animate-spin w-6 h-6 text-brand-primary" />
                    </div>
                  ) : user ? (
                    <ProfileTabContent
                      user={user}
                      userProfile={userProfile}
                      completeness={completeness}
                      avatarSrc={avatarSrc}
                      imageError={imageError}
                      isEditing={isEditing}
                      isSaving={updateMutation.isPending}
                      setImageError={setImageError}
                      onSave={(data) => updateMutation.mutate(data)}
                      onCancelEdit={() => setIsEditing(false)}
                      onChangePhoto={() => fileInputRef.current?.click()}
                      updateAuthState={updateAuthState}
                    />
                  ) : null
                ) : activeTab === 'Shipping Address' ? (
                  <ShippingAddressSection />
                ) : activeTab === 'My Orders' ? (
                  <OrdersSection />
                ) : activeTab === 'Change Password' ? (
                  <ChangePassword />
                ) : (
                  <p className="text-gray-500 text-sm">
                    {tabLabels[activeTab as TabKey] ?? activeTab}
                  </p>
                )}
              </div>
            </div>
          </main>

          {/* Right panel */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-4">
            {recentActiveOrder && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {t('recentOrder')}
                  </h3>
                  <Link
                    href="/profile?active=My Orders"
                    className="text-xs text-brand-primary hover:underline flex items-center gap-0.5"
                    onClick={() => setActiveTab('My Orders')}
                  >
                    {t('viewAll')} <ChevronRight size={12} />
                  </Link>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Package size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="text-xs text-gray-600 font-medium truncate">
                    #{recentActiveOrder.orderNumber}
                  </span>
                  <span
                    className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${getStatusPill(
                      recentActiveOrder.status
                    )}`}
                  >
                    {recentActiveOrder.status}
                  </span>
                </div>

                {recentActiveOrder.status !== 'PENDING' &&
                  recentActiveOrder.status !== 'CANCELLED' && (
                    <div className="flex items-center gap-1">
                      {STATUS_STEPS.map((step, i) => {
                        const current = getStatusStep(recentActiveOrder.status);
                        const done = i <= current;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center gap-1">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  done ? 'bg-brand-primary' : 'bg-gray-100'
                                }`}
                              >
                                <CheckCircle
                                  size={11}
                                  className={
                                    done ? 'text-white' : 'text-gray-300'
                                  }
                                />
                              </div>
                              <span
                                className={`text-[9px] ${
                                  done
                                    ? 'text-brand-primary font-medium'
                                    : 'text-gray-300'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                              <div
                                className={`flex-1 h-px mb-4 ${
                                  i < current
                                    ? 'bg-brand-primary'
                                    : 'bg-gray-200'
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                <p className="text-xs text-gray-400 mt-3">
                  {new Date(recentActiveOrder.createdAt).toLocaleDateString(
                    locale,
                    {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }
                  )}
                  {' · '}{formatPrice(recentActiveOrder.finalAmount)}
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">
                {t('spendingOverview')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-brand-primary/5 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag size={15} className="text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500">{t('lifetimeSpent')}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(totalSpent)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Tag size={15} className="text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500">{t('totalSaved')}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {formatPrice(totalSaved)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Store size={15} className="text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-gray-500">{t('vendorsShopped')}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {uniqueVendors}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// Profile tab content

interface ProfileTabContentProps {
  user: User;
  userProfile: UserProfile | null;
  completeness: number;
  avatarSrc: string;
  imageError: boolean;
  isEditing: boolean;
  isSaving: boolean;
  setImageError: (v: boolean) => void;
  onSave: (data: { name?: string; bio?: string }) => void;
  onCancelEdit: () => void;
  onChangePhoto: () => void;
  updateAuthState: (updates: Partial<{ isAuthenticated: boolean; isLoading: boolean; user: User | null; userProfile: UserProfile | null }>) => void;
}

const ProfileTabContent = ({
  user,
  userProfile,
  completeness,
  avatarSrc,
  imageError,
  isEditing,
  isSaving,
  setImageError,
  onSave,
  onCancelEdit,
  onChangePhoto,
}: ProfileTabContentProps) => {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const hasAvatar = !!avatarSrc && !imageError;
  const [nameValue, setNameValue] = useState(user.name || '');
  const [bioValue, setBioValue] = useState(userProfile?.bio || '');

  useEffect(() => {
    setNameValue(user.name || '');
  }, [user.name]);
  useEffect(() => {
    setBioValue(userProfile?.bio || '');
  }, [userProfile?.bio]);

  const handleSave = () => {
    onSave({
      name: nameValue.trim() || undefined,
      bio: bioValue.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Completeness banner */}
      {completeness < 100 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-800">
              {t('completeYourProfile')}
            </p>
            <span className="text-sm font-bold text-brand-primary">
              {completeness}%
            </span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-brand-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {completeness < 50
              ? t('profileTipStart')
              : t('profileTipAlmost')}
          </p>
        </div>
      )}

      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
            {hasAvatar ? (
              <Image
                src={avatarSrc}
                alt={user.name || 'Profile'}
                width={64}
                height={64}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                onError={() => setImageError(true)}
              />
            ) : (
              <ProfileIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {user.name || userProfile?.name || t('noNameSet')}
          </p>
          <button
            onClick={onChangePhoto}
            className="flex items-center gap-1 text-xs text-brand-primary mt-0.5 hover:underline"
          >
            <Camera size={10} /> {t('changePhoto')}
          </button>
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            {t('fullName')}
          </label>
          {isEditing ? (
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-brand-primary rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              placeholder={t('fullName')}
            />
          ) : (
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
              {user.name || <span className="text-gray-400">{t('notSet')}</span>}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            {t('emailAddress')}
          </label>
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
            {user.email}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            {t('bio')}
          </label>
          {isEditing ? (
            <textarea
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-brand-primary rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none"
              placeholder={t('bio')}
            />
          ) : (
            <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm min-h-[40px]">
              {userProfile?.bio || (
                <span className="text-gray-400">{t('notSet')}</span>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            {t('memberSinceLabel')}
          </label>
          <div className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800">
            {user.createdAt ? (
              new Date(user.createdAt).toLocaleDateString(locale, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })
            ) : (
              <span className="text-gray-400">{t('notAvailable')}</span>
            )}
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      {isEditing && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white text-sm font-semibold rounded-full hover:bg-brand-primary-800 disabled:opacity-50 transition-colors"
          >
            {isSaving && <Loader2 size={14} className="animate-spin" />}
            {t('saveChanges')}
          </button>
          <button
            onClick={onCancelEdit}
            disabled={isSaving}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-full hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      )}
    </div>
  );
};

// Nav item

interface NavItemProps {
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
}

const NavItem = ({ label, Icon, active, danger, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 text-brand-primary'
        : danger
        ? 'text-red-500 hover:bg-red-50'
        : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <Icon
      size={15}
      className={
        active
          ? 'text-brand-primary'
          : danger
          ? 'text-red-400'
          : 'text-gray-400'
      }
    />
    {label}
  </button>
);

export default Page;
