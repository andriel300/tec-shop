'use client';
import { ArrowUpRight, MapPin, Star, BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { Link } from '../../i18n/navigation';
import { useTranslations, useMessages } from 'next-intl';
import React from 'react';
import { getShopSlug } from '../../lib/api/shops';

interface ShopCardProps {
  shop: {
    id: string;
    businessName: string;
    bio?: string;
    category?: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    logo?: string;
    rating?: number;
    totalRatings?: number;
    isActive?: boolean;
    seller?: {
      id: string;
      name?: string;
      country?: string;
      isVerified?: boolean;
    };
  };
}

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  const t = useTranslations('Shops');
  const tCat = useTranslations('ShopCategories');
  const messages = useMessages();
  const shopCatMessages = (messages.ShopCategories ?? {}) as Record<string, string>;

  const translateCategory = (category: string): string => {
    // Try exact key, then title-cased key — no lookup if key is absent (avoids console error)
    const titleCased = category.replace(/\b\w/g, (c) => c.toUpperCase());
    const key = shopCatMessages[category]
      ? category
      : shopCatMessages[titleCased]
        ? titleCased
        : null;
    return key ? tCat(key as Parameters<typeof tCat>[0]) : category;
  };

  const displayLocation =
    shop.city && shop.country
      ? `${shop.city}, ${shop.country}`
      : shop.country || shop.city || shop.address;

  return (
    <div className="w-full rounded-md cursor-pointer bg-white border border-gray-200 shadow-sm hover:shadow-md overflow-hidden transition-shadow">
      {/* Cover Banner */}
      <div className="w-full relative h-[120px] bg-gradient-to-br from-blue-500 to-purple-600">
        <Image
          src="https://ik.imagekit.io/andrieltecshop/products/coverBanner_1.jpg"
          alt={`${shop.businessName} cover banner`}
          fill
          sizes="(max-width: 768px) 100vw, 300px"
          className="object-cover w-full h-full"
        />
      </div>

      {/* Logo */}
      <div className="relative flex justify-center -mt-8">
        <div className="w-16 h-16 rounded-full border-4 border-white overflow-hidden shadow bg-white">
          <Image
            src={
              shop.logo ||
              'https://ik.imagekit.io/andrieltecshop/products/avatar.jpg?updatedAt=1763005913773'
            }
            alt={`${shop.businessName} logo`}
            width={64}
            height={64}
            className="object-cover"
          />
        </div>
      </div>

      {/* Shop Info */}
      <div className="px-4 pb-4 pt-2 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <h3 className="text-base font-semibold text-gray-800">
            {shop.businessName}
          </h3>
          {shop.seller?.isVerified && (
            <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-100" />
          )}
        </div>

        {/* Bio */}
        {shop.bio && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{shop.bio}</p>
        )}

        {/* Location & Rating */}
        <div className="flex items-center justify-center text-xs text-gray-500 mt-3 gap-4 flex-wrap">
          {displayLocation && (
            <span className="flex items-center gap-1 max-w-[140px]">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{displayLocation}</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
            <span className="font-medium text-gray-700">
              {shop.rating?.toFixed(1) ?? t('noRating')}
            </span>
            {shop.totalRatings !== undefined && (
              <span className="text-gray-400">({shop.totalRatings})</span>
            )}
          </span>
        </div>

        {/* Category */}
        {shop.category && (
          <div className="mt-3 flex justify-center">
            <span className="bg-blue-50 capitalize text-blue-600 px-2.5 py-1 rounded-full font-medium text-xs">
              {translateCategory(shop.category)}
            </span>
          </div>
        )}

        {/* Visit Shop Button */}
        <div className="mt-4">
          <Link
            href={`/shops/${getShopSlug(shop)}`}
            className="inline-flex items-center text-sm text-blue-600 font-medium hover:underline hover:text-blue-700 transition"
          >
            {t('visitShop')}
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopCard;
