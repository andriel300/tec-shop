'use client';

import React from 'react';
import { Tag, Calendar, Clock } from 'lucide-react';

interface ShopOffersTabProps {
  shopId: string;
}

// Placeholder for future offers/events implementation
const ShopOffersTab: React.FC<ShopOffersTabProps> = ({ shopId: _shopId }) => {
  // TODO: Implement offers API and fetch actual offers
  const offers: {
    id: string;
    title: string;
    description: string;
    discount: string;
    validUntil: string;
    isActive: boolean;
  }[] = [];

  if (offers.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Tag className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No active offers</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          This shop doesn&apos;t have any active promotions or offers at the moment.
          Check back later for exciting deals!
        </p>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                {offer.discount}
              </span>
              {offer.isActive && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <Clock className="w-3 h-3" />
                  Active
                </span>
              )}
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {offer.title}
            </h3>

            <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Valid until {offer.validUntil}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopOffersTab;
