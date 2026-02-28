'use client';

import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import {
  MapPin,
  Star,
  BadgeCheck,
  Users,
  ShoppingBag,
  MessageCircle,
  Heart,
  HeartOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../../../hooks/use-auth';
import {
  useShopFollowersCount,
  useCheckShopFollow,
  useFollowShop,
  useUnfollowShop,
} from '../../../hooks/use-shops';
import type { Shop } from '../../../lib/api/shops';

interface ShopHeaderProps {
  shop: Shop;
  initialFollowersCount?: number;
}

const DEFAULT_BANNER =
  'https://ik.imagekit.io/andrieltecshop/products/coverBanner_1.jpg';
const DEFAULT_AVATAR =
  'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773';

const ShopHeader: React.FC<ShopHeaderProps> = ({
  shop,
  initialFollowersCount = 0,
}) => {
  const { user, isAuthenticated } = useAuth();

  // Fetch followers count
  const { data: followersData } = useShopFollowersCount(shop.id, true);
  const followersCount = followersData?.count ?? initialFollowersCount;

  // Check if current user follows this shop
  const { data: followCheckData, isLoading: isCheckingFollow } =
    useCheckShopFollow(shop.id, isAuthenticated);
  const isFollowing = followCheckData?.isFollowing ?? false;

  // Follow/Unfollow mutations
  const followMutation = useFollowShop();
  const unfollowMutation = useUnfollowShop();
  const isFollowLoading = followMutation.isPending || unfollowMutation.isPending;

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate(shop.id);
    } else {
      followMutation.mutate(shop.id);
    }
  };

  const displayLocation =
    shop.city && shop.country
      ? `${shop.city}, ${shop.country}`
      : shop.country || shop.city || shop.address;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Cover Banner */}
      <div className="relative w-full h-[180px] md:h-[240px] bg-gradient-to-br from-blue-500 to-purple-600">
        <Image
          src={DEFAULT_BANNER}
          alt={`${shop.businessName} cover banner`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Shop Info Section */}
      <div className="relative px-4 md:px-8 pb-6">
        {/* Logo - overlapping the banner */}
        <div className="relative flex justify-center md:justify-start -mt-16 mb-4">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
            <Image
              src={shop.logo || DEFAULT_AVATAR}
              alt={`${shop.businessName} logo`}
              width={128}
              height={128}
              className="object-cover w-full h-full"
            />
          </div>
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
              {shop.seller?.isVerified && (
                <BadgeCheck className="w-6 h-6 text-blue-600 fill-blue-100" />
              )}
            </div>

            {/* Bio */}
            {shop.bio && (
              <p className="text-gray-600 mt-2 text-sm md:text-base max-w-2xl">
                {shop.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 mt-4 text-sm text-gray-600">
              {/* Location */}
              {displayLocation && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{displayLocation}</span>
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
                  {shop.rating?.toFixed(1) ?? 'N/A'}
                </span>
                {shop.totalRatings !== undefined && (
                  <span className="text-gray-400">({shop.totalRatings} reviews)</span>
                )}
              </span>
            </div>

            {/* Followers and Orders */}
            <div className="flex items-center justify-center md:justify-start gap-6 mt-4">
              <div className="flex items-center gap-1.5 text-gray-700">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="font-semibold">{followersCount.toLocaleString()}</span>
                <span className="text-gray-500">followers</span>
              </div>

              {shop.totalOrders !== undefined && (
                <div className="flex items-center gap-1.5 text-gray-700">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{shop.totalOrders.toLocaleString()}</span>
                  <span className="text-gray-500">orders</span>
                </div>
              )}
            </div>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center justify-center md:justify-end gap-3 mt-4 md:mt-0">
            {/* Follow Button */}
            <button
              onClick={handleFollowToggle}
              disabled={isFollowLoading || isCheckingFollow}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                isFollowing
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isFollowLoading || isCheckingFollow ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isFollowing ? (
                <HeartOff className="w-4 h-4" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>

            {/* Contact Button */}
            {user && shop.seller && (
              <Link
                href={`/inbox?shopId=${shop.id}&sellerId=${shop.seller.authId}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                Contact
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopHeader;
