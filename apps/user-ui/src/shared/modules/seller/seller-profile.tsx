'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../hooks/use-auth';
import useLocationTracking from '../../../hooks/use-location-tracking';
import useDeviceTracking from '../../../hooks/use-device-tracking';
import { sendKafkaEvent } from '../../../actions/track-user';
import ShopHeader from './shop-header';
import ShopTabs, { type ShopTab } from './shop-tabs';
import ShopProductsTab from './shop-products-tab';
import ShopOffersTab from './shop-offers-tab';
import ShopReviewsTab from './shop-reviews-tab';
import type { Shop } from '../../../lib/api/shops';

interface SellerProfileProps {
  shop: Shop;
  followersCount?: number;
}

const SellerProfile: React.FC<SellerProfileProps> = ({
  shop,
  followersCount = 0,
}) => {
  const { user } = useAuth();
  const location = useLocationTracking();
  const deviceInfo = useDeviceTracking();
  const hasTracked = useRef(false);

  const [activeTab, setActiveTab] = useState<ShopTab>('products');
  const [productCount, setProductCount] = useState<number | undefined>(undefined);

  // Track shop_visit once on mount
  useEffect(() => {
    if (hasTracked.current || !shop?.id) return;
    hasTracked.current = true;

    // User ID can be 'anonymous' for non-logged-in visitors
    const userId = user?.id || 'anonymous';

    sendKafkaEvent({
      userId,
      shopId: shop.id,
      action: 'shop_visit',
      country: location?.country,
      city: location?.city,
      device: deviceInfo,
    });
  }, [shop?.id, user?.id, location, deviceInfo]);

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Shop Not Found</h1>
          <p className="text-gray-600 mt-2">
            The shop you are looking for does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Shop Header */}
        <ShopHeader shop={shop} initialFollowersCount={followersCount} />

        {/* Tabs Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <ShopTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            productCount={productCount}
          />

          {/* Tab Content */}
          <div className="px-4 md:px-6">
            {activeTab === 'products' && (
              <ShopProductsTab
                shopId={shop.id}
                onProductCountChange={setProductCount}
              />
            )}
            {activeTab === 'offers' && <ShopOffersTab shopId={shop.id} />}
            {activeTab === 'reviews' && <ShopReviewsTab shopId={shop.id} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerProfile;
