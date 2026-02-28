'use client';

import React, { useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  MapPin,
  Star,
  BadgeCheck,
  Users,
  ShoppingBag,
  Settings,
  ExternalLink,
  Pencil,
  Loader2,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useSeller from '../../hooks/useSeller';
import { useSellerStatistics } from '../../hooks/useSellerData';
import { updateShop, type UpdateShopData } from '../../lib/api/seller';
import EditableBanner from './editable-banner';
import EditableLogo from './editable-logo';
import EditProfileModal from './edit-profile-modal';

const ShopProfileEditor: React.FC = () => {
  const { seller, isLoading: isSellerLoading } = useSeller();
  const { data: statistics, isLoading: isStatsLoading } = useSellerStatistics();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const updateShopMutation = useMutation({
    mutationFn: updateShop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
    },
  });

  const handleBannerChange = async (url: string) => {
    // For now, we'll store this locally or in the shop update
    // The backend would need to support banner field
    console.log('Banner changed:', url);
    // TODO: Add banner field to shop schema if not exists
  };

  const handleLogoChange = async (url: string) => {
    // For now, we'll store this locally or in the shop update
    // The backend would need to support logo field
    console.log('Logo changed:', url);
    // TODO: Add logo field to shop schema if not exists
  };

  const handleProfileSave = async (data: UpdateShopData) => {
    await updateShopMutation.mutateAsync(data);
  };

  if (isSellerLoading || isStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const shop = seller?.shop;

  if (!shop) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Set Up Your Shop
          </h2>
          <p className="text-gray-600 mb-6">
            You haven&apos;t created a shop yet. Set up your shop to start selling.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Set Up Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Editable Banner */}
        <EditableBanner
          bannerUrl={undefined} // TODO: Add shop.banner when available
          onBannerChange={handleBannerChange}
        />

        {/* Shop Info Section */}
        <div className="relative px-4 md:px-8 pb-6">
          {/* Editable Logo */}
          <div className="relative flex justify-center md:justify-start -mt-16 mb-4">
            <EditableLogo
              logoUrl={undefined} // TODO: Add shop.logo when available
              businessName={shop.businessName}
              onLogoChange={handleLogoChange}
            />
          </div>

          {/* Shop Details */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            {/* Left side - Shop info */}
            <div className="flex-1 text-center md:text-left">
              {/* Name and Verified Badge */}
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {shop.businessName}
                </h1>
                {seller?.isVerified && (
                  <BadgeCheck className="w-6 h-6 text-blue-600 fill-blue-100" />
                )}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  title="Edit profile"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Bio */}
              {shop.bio && (
                <p className="text-gray-600 mt-2 text-sm md:text-base max-w-2xl">
                  {shop.bio}
                </p>
              )}

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-4 text-sm text-gray-600">
                {/* Address */}
                {shop.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{shop.address}</span>
                  </span>
                )}

                {/* Category */}
                {shop.category && (
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium text-xs capitalize">
                    {shop.category}
                  </span>
                )}

                {/* Rating */}
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-gray-700">
                    {statistics?.shop?.rating?.toFixed(1) ?? shop.rating?.toFixed(1) ?? 'N/A'}
                  </span>
                </span>
              </div>

              {/* Followers and Orders */}
              <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">0</span>
                  <span className="text-gray-500">followers</span>
                </div>

                <div className="flex items-center gap-1.5 text-gray-700">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">
                    {statistics?.orders?.total?.toLocaleString() ?? shop.totalOrders?.toLocaleString() ?? 0}
                  </span>
                  <span className="text-gray-500">orders</span>
                </div>
              </div>
            </div>

            {/* Right side - Action buttons */}
            <div className="flex flex-col gap-3 mt-4 md:mt-0">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
              >
                <Settings className="w-4 h-4" />
                Go to Dashboard
              </Link>

              <Link
                href={`${process.env.NEXT_PUBLIC_USER_UI_URL || 'http://localhost:3000'}/shops/${shop.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              ${statistics.revenue?.total?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.orders?.total?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active Products</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.products?.active?.toLocaleString() ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Pending Orders</p>
            <p className="text-2xl font-bold text-gray-900">
              {statistics.orders?.pending?.toLocaleString() ?? 0}
            </p>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleProfileSave}
        initialData={{
          businessName: shop.businessName,
          bio: shop.bio,
          category: shop.category,
          address: shop.address,
          openingHours: shop.openingHours,
          website: shop.website,
        }}
      />
    </div>
  );
};

export default ShopProfileEditor;
