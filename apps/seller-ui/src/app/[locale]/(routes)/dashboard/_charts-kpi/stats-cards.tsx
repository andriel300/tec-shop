'use client';

import type { SellerStatistics } from '../../../../../lib/api/seller';

interface StatsCardsProps {
  stats: SellerStatistics;
}

const StatsCards = ({ stats }: StatsCardsProps) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
    {/* Revenue */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-brand-primary-600 shadow-ambient">
      <div className="text-brand-primary-600 text-sm font-medium mb-1">Total Revenue</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        $
        {(stats.revenue.total / 100).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      <div className="text-gray-500 text-xs">
        {stats.revenue.growth > 0 ? '+' : ''}
        {stats.revenue.growth.toFixed(1)}% from last month
      </div>
    </div>

    {/* Orders */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-feedback-success shadow-ambient">
      <div className="text-feedback-success text-sm font-medium mb-1">Total Orders</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        {stats.orders.total.toLocaleString()}
      </div>
      <div className="text-gray-500 text-xs">{stats.orders.thisMonth} this month</div>
    </div>

    {/* Products */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-purple-500 shadow-ambient">
      <div className="text-purple-600 text-sm font-medium mb-1">Total Products</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        {stats.products.total.toLocaleString()}
      </div>
      <div className="text-gray-500 text-xs">
        {stats.products.active} active, {stats.products.outOfStock} out of stock
      </div>
    </div>

    {/* Rating */}
    <div className="bg-surface-container-lowest rounded-lg p-5 border-l-4 border-l-feedback-warning shadow-ambient">
      <div className="text-feedback-warning text-sm font-medium mb-1">Shop Rating</div>
      <div className="text-gray-900 font-display text-xl font-bold mb-1">
        {stats.shop.rating.toFixed(1)} &#9733;
      </div>
      <div className="text-gray-500 text-xs">
        {stats.shop.isActive ? 'Shop Active' : 'Shop Inactive'}
      </div>
    </div>
  </div>
);

export default StatsCards;
